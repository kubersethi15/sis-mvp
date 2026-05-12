/**
 * Measurement helpers for the load test.
 * Wraps operations with timing + structured success/failure tracking.
 */

export interface StageResult {
  stage: string;
  success: boolean;
  latencyMs: number;
  status?: number;
  errorClass?: string;
  errorDetail?: string;
  retryCount: number;
  meta?: Record<string, any>;
}

export interface UserJourneyResult {
  runId: string;
  userId: string;
  email: string;
  startedAt: string;
  finishedAt: string;
  totalLatencyMs: number;
  stages: StageResult[];
  completed: boolean;
  failedStage?: string;
}

/**
 * Classify an HTTP error into a category for aggregation.
 * Categories: timeout, rate_limit, server_error, client_error, network_error,
 *             json_parse_error, application_error, unknown
 */
export function classifyError(status: number, body: any, errorMsg?: string): string {
  if (errorMsg?.startsWith('network_error')) return 'network_error';
  if (errorMsg?.startsWith('json_parse_error')) return 'json_parse_error';
  if (status === 0) return 'network_error';
  if (status === 408 || status === 504) return 'timeout';
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'server_error';
  if (status >= 400) return 'client_error';

  // Application-level errors (200 OK but body says error)
  if (body && typeof body === 'object' && body.error) return 'application_error';

  return 'unknown';
}

/**
 * Run an async operation with timing, retry logic, and structured result.
 * Retries on rate_limit and network_error up to maxRetries times.
 *
 * Returns the StageResult plus the response body (so callers can extract IDs
 * like session_id without re-doing the request).
 */
export async function runStage(
  stage: string,
  fn: () => Promise<{ status: number; body: any; latencyMs: number; error?: string }>,
  options: { maxRetries?: number; retryDelayMs?: number } = {}
): Promise<StageResult & { body?: any }> {
  const { maxRetries = 2, retryDelayMs = 1000 } = options;
  let retryCount = 0;

  while (true) {
    const result = await fn();
    const ok = result.status >= 200 && result.status < 300 && !result.error;

    if (ok) {
      return {
        stage,
        success: true,
        latencyMs: result.latencyMs,
        status: result.status,
        retryCount,
        body: result.body,
      };
    }

    const errorClass = classifyError(result.status, result.body, result.error);
    const retryable = errorClass === 'rate_limit' || errorClass === 'network_error' || errorClass === 'timeout';

    if (!retryable || retryCount >= maxRetries) {
      return {
        stage,
        success: false,
        latencyMs: result.latencyMs,
        status: result.status,
        errorClass,
        errorDetail: result.error || JSON.stringify(result.body)?.slice(0, 200),
        retryCount,
        body: result.body,
      };
    }

    retryCount++;
    await sleep(retryDelayMs * Math.pow(2, retryCount - 1));
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Aggregate p-percentiles across an array of latency samples.
 */
export function percentile(samples: number[], p: number): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

/**
 * Build a markdown summary from an array of user journey results.
 * This is what gets shared with Ryan after a run.
 */
export function buildSummary(results: UserJourneyResult[]): string {
  if (results.length === 0) return '# Load test — no results';

  const lines: string[] = [];
  const runId = results[0].runId;
  const total = results.length;
  const completed = results.filter((r) => r.completed).length;
  const failed = total - completed;
  const completionRate = ((completed / total) * 100).toFixed(1);

  lines.push(`# Kaya Load Test — ${runId}`);
  lines.push('');
  lines.push(`**Concurrent users:** ${total}`);
  lines.push(`**Completed full flow:** ${completed} (${completionRate}%)`);
  lines.push(`**Failed:** ${failed}`);
  lines.push('');

  // Failure breakdown
  if (failed > 0) {
    lines.push('## Failures by stage');
    lines.push('');
    const byStage: Record<string, { count: number; errorClasses: Record<string, number> }> = {};
    for (const r of results.filter((x) => !x.completed)) {
      const fs = r.failedStage || 'unknown';
      if (!byStage[fs]) byStage[fs] = { count: 0, errorClasses: {} };
      byStage[fs].count++;
      const lastStage = r.stages[r.stages.length - 1];
      const errClass = lastStage?.errorClass || 'unknown';
      byStage[fs].errorClasses[errClass] = (byStage[fs].errorClasses[errClass] || 0) + 1;
    }
    for (const [stage, info] of Object.entries(byStage)) {
      const classDetails = Object.entries(info.errorClasses).map(([k, v]) => `${k}=${v}`).join(', ');
      lines.push(`- **${stage}:** ${info.count} failures (${classDetails})`);
    }
    lines.push('');
  }

  // Latency aggregation per stage
  const stageNames = Array.from(new Set(results.flatMap((r) => r.stages.map((s) => s.stage))));
  lines.push('## Latency per stage (ms)');
  lines.push('');
  lines.push('| Stage | Samples | p50 | p95 | p99 | success% |');
  lines.push('|---|---:|---:|---:|---:|---:|');
  for (const stage of stageNames) {
    const allStages = results.flatMap((r) => r.stages.filter((s) => s.stage === stage));
    const successes = allStages.filter((s) => s.success);
    const latencies = successes.map((s) => s.latencyMs);
    const successRate = allStages.length ? ((successes.length / allStages.length) * 100).toFixed(1) : '0';
    lines.push(
      `| ${stage} | ${allStages.length} | ${percentile(latencies, 50)} | ${percentile(latencies, 95)} | ${percentile(latencies, 99)} | ${successRate}% |`
    );
  }
  lines.push('');

  // Per-user view (only shown for small runs)
  if (total <= 10) {
    lines.push('## Per-user detail');
    lines.push('');
    for (const r of results) {
      const status = r.completed ? 'PASS' : `FAIL @ ${r.failedStage}`;
      lines.push(`### ${r.email} — ${status} (${r.totalLatencyMs}ms total)`);
      for (const s of r.stages) {
        const icon = s.success ? '+' : '-';
        const retry = s.retryCount > 0 ? ` (retries: ${s.retryCount})` : '';
        const err = s.success ? '' : ` [${s.errorClass}: ${s.errorDetail?.slice(0, 100)}]`;
        lines.push(`  ${icon} ${s.stage} — ${s.latencyMs}ms${retry}${err}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
