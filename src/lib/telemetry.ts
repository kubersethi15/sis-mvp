// ============================================================
// PIPELINE TELEMETRY WRITER
// ============================================================
// Fire-and-forget instrumentation for the LEEE extraction pipeline.
//
// CRITICAL PRINCIPLE: a failed telemetry write must NEVER affect the pipeline
// or the user. If Supabase is down, the network is flaky, or there's a bug in
// the writer itself — the pipeline keeps running, the user gets their result,
// and we lose ONE row of telemetry. That is always the right trade.
//
// Implementation:
//   - All public functions return immediately and run the actual insert
//     in a detached promise. Errors are caught and logged, never thrown.
//   - We use the service_role client so RLS doesn't apply (telemetry table
//     is deny-all for authenticated/anon by design).
//   - The writer is resilient to missing context — user_id, session_id are
//     optional. run_id is required (passed in by the pipeline orchestrator).
//
// What does NOT belong in this module:
//   - Reading telemetry. That's for analysts via SQL or future dashboards.
//   - Synchronous "did the write succeed" checks. That defeats the purpose.
//   - Any logic that could throw. Wrap everything.
// ============================================================

import { createClient } from '@supabase/supabase-js';

export interface TelemetryRecord {
  // Identity
  runId: string;                       // groups all stages of one pipeline run
  userId?: string | null;              // optional — auth.uid() if known
  sessionId?: string | null;           // optional — leee_sessions.id if known

  // Stage
  stage: string;                       // e.g., "Stage 1: Segmentation"
  promptVersion?: string | null;       // e.g., "v1" — for A/B testing prompts

  // Model
  model: string;
  provider: 'anthropic' | 'gemini';

  // Performance
  latencyMs: number;
  inputTokens?: number | null;
  outputTokens?: number | null;

  // Outcome
  success: boolean;
  stopReason?: string | null;
  errorClass?: string | null;
  errorMessage?: string | null;
  retryCount?: number;

  // Output metadata (small JSONB — NOT the full output)
  outputSummary?: Record<string, any> | null;
}

let cachedClient: ReturnType<typeof createClient> | null = null;

function getServiceClient() {
  if (cachedClient) return cachedClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // No credentials — telemetry simply doesn't work, but we don't crash.
    return null;
  }
  cachedClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedClient;
}

/**
 * Classify a thrown error into an error_class string for aggregation.
 * Returns a short, stable label suitable for grouping in queries.
 */
export function classifyTelemetryError(err: any): string {
  const msg = String(err?.message || err || '').toLowerCase();
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('rate_limit')) return 'rate_limit';
  if (msg.includes('abort') || msg.includes('timeout')) return 'timeout';
  if (msg.includes('json') && (msg.includes('parse') || msg.includes('unexpected'))) return 'json_parse';
  if (msg.includes('5')) {
    const status = msg.match(/anthropic (\d{3})/);
    if (status && status[1].startsWith('5')) return 'api_5xx';
  }
  if (msg.includes('4')) {
    const status = msg.match(/anthropic (\d{3})/);
    if (status && status[1].startsWith('4')) return 'api_4xx';
  }
  if (msg.includes('network') || msg.includes('econnrefused') || msg.includes('fetch failed')) return 'network';
  if (msg.includes('both providers failed')) return 'all_providers_failed';
  return 'unknown';
}

/**
 * Truncate a string to at most maxLen characters, with a clear marker if cut.
 * Used to keep error_message under the column-size sweet spot.
 */
function truncate(s: string | null | undefined, maxLen: number = 500): string | null {
  if (s == null) return null;
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 14) + '… [truncated]';
}

/**
 * Write a single telemetry record. Returns immediately — the actual database
 * call runs detached. NEVER throws, NEVER awaits. The pipeline doesn't wait
 * for telemetry to complete.
 *
 * The function is intentionally not async — callers should not await it.
 * If you await this, you've defeated the fire-and-forget design.
 */
export function writeTelemetry(record: TelemetryRecord): void {
  // Use Promise.resolve().then(...) to run the work on the next microtask.
  // This guarantees the caller's code path continues without waiting,
  // even if there's a synchronous error in the setup below.
  Promise.resolve().then(async () => {
    try {
      const client = getServiceClient();
      if (!client) return; // Silently skip — no creds available

      const row = {
        run_id: record.runId,
        user_id: record.userId ?? null,
        session_id: record.sessionId ?? null,
        stage: record.stage,
        prompt_version: record.promptVersion ?? null,
        model: record.model,
        provider: record.provider,
        latency_ms: Math.max(0, Math.round(record.latencyMs)),
        input_tokens: record.inputTokens ?? null,
        output_tokens: record.outputTokens ?? null,
        success: record.success,
        stop_reason: record.stopReason ?? null,
        error_class: record.errorClass ?? null,
        error_message: truncate(record.errorMessage ?? null),
        retry_count: Math.max(0, record.retryCount ?? 0),
        output_summary: record.outputSummary ?? null,
        app_version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null,
      };

      // The Supabase TS schema is generated and doesn't yet know about
      // pipeline_telemetry. Cast through `any` for the insert — the row
      // shape matches the table schema applied via migration.
      const { error } = await (client.from('pipeline_telemetry') as any).insert(row);
      if (error) {
        // Log but don't throw — telemetry failure must not propagate
        console.warn('[telemetry] insert failed:', error.message);
      }
    } catch (e: any) {
      // Catch-all for any unexpected error in the writer itself
      console.warn('[telemetry] unexpected error:', e?.message || e);
    }
  });
}

/**
 * Build an output_summary for a Stage 1 (Segmentation) result.
 * Small, structured metadata about what came out — NOT the full output.
 */
export function summarizeStage1(episodes: any[]): Record<string, any> {
  const arr = Array.isArray(episodes) ? episodes : [];
  return {
    n_total: arr.length,
    n_episode: arr.filter((e) => e?.type === 'episode').length,
    n_commentary: arr.filter((e) => e?.type === 'commentary').length,
    n_scenario: arr.filter((e) => e?.type === 'scenario').length,
    n_simulation: arr.filter((e) => e?.type === 'simulation').length,
    n_qualified: arr.filter((e) => e?.type === 'episode' && e?.specificity_level !== 'vague').length,
    languages: Array.from(new Set(arr.map((e) => e?.language_detected).filter(Boolean))).slice(0, 5),
  };
}

export function summarizeStage2(evidence: any[]): Record<string, any> {
  const arr = Array.isArray(evidence) ? evidence : [];
  return {
    n_evidence: arr.length,
    avg_complexity: avg(arr.map((e) => e?.situational_complexity).filter((n) => typeof n === 'number')),
    avg_independence: avg(arr.map((e) => e?.action_independence).filter((n) => typeof n === 'number')),
  };
}

export function summarizeStage3(mappings: any[]): Record<string, any> {
  const arr = Array.isArray(mappings) ? mappings : [];
  const distinctSkills = new Set(arr.map((m) => m?.skill_name).filter(Boolean));
  return {
    n_mappings: arr.length,
    n_distinct_skills: distinctSkills.size,
  };
}

export function summarizeStage4(validated: any): Record<string, any> {
  if (!validated || typeof validated !== 'object') return { malformed: true };
  return {
    n_validated_mappings: Array.isArray(validated.validated_mappings) ? validated.validated_mappings.length : 0,
    n_skill_sufficiency_entries: Array.isArray(validated.skill_sufficiency_summary)
      ? validated.skill_sufficiency_summary.length
      : 0,
  };
}

export function summarizeStage5(profile: any): Record<string, any> {
  if (!profile || typeof profile !== 'object') return { malformed: true };
  return {
    n_vacancy_aligned: Array.isArray(profile.vacancy_aligned_skills) ? profile.vacancy_aligned_skills.length : 0,
    n_additional: Array.isArray(profile.additional_skills_evidenced) ? profile.additional_skills_evidenced.length : 0,
    overall_confidence: profile.session_metadata?.overall_confidence ?? null,
    has_narrative_summary: typeof profile.narrative_summary === 'string' && profile.narrative_summary.length > 0,
  };
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}
