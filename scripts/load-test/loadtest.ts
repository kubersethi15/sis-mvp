/**
 * Kaya Load Test — Main Orchestrator
 * ===================================
 *
 * Spawns N concurrent jobseeker journeys, aggregates results, writes a
 * markdown summary + a full JSON dump to scripts/load-test/results/.
 *
 * USAGE:
 *   # Tiny smoke test against production (1 user)
 *   npx ts-node scripts/load-test/loadtest.ts --concurrent 1 --base-url https://kaya.virtualahan.com
 *
 *   # Real load test
 *   npx ts-node scripts/load-test/loadtest.ts --concurrent 50 --base-url https://kaya.virtualahan.com
 *
 *   # Cleanup-only (delete test users from a prior run)
 *   npx ts-node scripts/load-test/loadtest.ts --cleanup-run-id 20260512.1500-abc123
 *
 * REQUIRES IN ENV:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY   (for admin user creation + cleanup)
 *
 * The script never sends these credentials to the server it's testing — they
 * stay local for user provisioning and cleanup only.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { runJobseekerJourney } from './scenarios/jobseeker.js';
import { buildSummary, UserJourneyResult } from './lib/measure.js';
import { newRunId, cleanupRun } from './lib/auth.js';

// ESM __dirname
const __filename_safe = fileURLToPath(import.meta.url);
const __dirname_safe = path.dirname(__filename_safe);

interface CliArgs {
  concurrent: number;
  baseUrl: string;
  cleanupRunId?: string;
  messageDelayMs: number;
  skipCleanup: boolean;
  minMessages: number;
  maxMessages: number;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const get = (flag: string, defaultVal?: string) => {
    const idx = args.indexOf(flag);
    return idx >= 0 && args[idx + 1] ? args[idx + 1] : defaultVal;
  };
  const has = (flag: string) => args.includes(flag);

  return {
    concurrent: parseInt(get('--concurrent', '1')!, 10),
    baseUrl: get('--base-url', 'https://kaya.virtualahan.com')!,
    cleanupRunId: get('--cleanup-run-id'),
    messageDelayMs: parseInt(get('--message-delay-ms', '500')!, 10),
    skipCleanup: has('--skip-cleanup'),
    minMessages: parseInt(get('--min-messages', '6')!, 10),
    maxMessages: parseInt(get('--max-messages', '10')!, 10),
  };
}

async function main() {
  const args = parseArgs();

  // Cleanup-only path
  if (args.cleanupRunId) {
    console.log(`\n[CLEANUP] Removing test data for run_id: ${args.cleanupRunId}`);
    const result = await cleanupRun(args.cleanupRunId);
    console.log(`  Users deleted: ${result.usersDeleted}`);
    if (result.errors.length > 0) {
      console.log(`  Errors:`);
      result.errors.forEach((e) => console.log(`    ${e}`));
    }
    return;
  }

  // Validate required env
  for (const v of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    if (!process.env[v]) {
      console.error(`ERROR: missing env var ${v}`);
      process.exit(1);
    }
  }

  const runId = newRunId();
  const wallStart = Date.now();

  console.log('\nKaya Load Test');
  console.log('==============');
  console.log(`  Run ID:        ${runId}`);
  console.log(`  Target:        ${args.baseUrl}`);
  console.log(`  Concurrent:    ${args.concurrent}`);
  console.log(`  Messages/user: ${args.minMessages}-${args.maxMessages}`);
  console.log(`  Inter-msg gap: ${args.messageDelayMs}ms`);
  console.log('');

  // Spawn all journeys concurrently. Promise.allSettled so one user's failure
  // doesn't abort the whole run.
  console.log(`[${new Date().toISOString()}] Starting ${args.concurrent} concurrent journeys...`);
  const journeyPromises = Array.from({ length: args.concurrent }, (_, i) =>
    runJobseekerJourney({
      baseUrl: args.baseUrl,
      runId,
      minMessages: args.minMessages,
      maxMessages: args.maxMessages,
      messageDelayMs: args.messageDelayMs,
    }).then((result) => {
      // Print per-user completion as it happens so the operator gets live progress
      const status = result.completed ? 'PASS' : `FAIL@${result.failedStage}`;
      console.log(
        `  [${String(i + 1).padStart(3)}/${args.concurrent}] ${status} ${result.email.slice(0, 50)} (${result.totalLatencyMs}ms)`
      );
      return result;
    })
  );

  const settled = await Promise.allSettled(journeyPromises);
  const results: UserJourneyResult[] = [];
  for (const s of settled) {
    if (s.status === 'fulfilled') {
      results.push(s.value);
    } else {
      console.error('Unexpected rejection (should not happen — runJobseekerJourney catches all):', s.reason);
    }
  }

  const wallEnd = Date.now();
  console.log(`\n[${new Date().toISOString()}] All journeys finished in ${((wallEnd - wallStart) / 1000).toFixed(1)}s wall time`);

  // Write results
  const resultsDir = path.join(__dirname_safe, 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  const jsonPath = path.join(resultsDir, `run-${runId}.json`);
  const mdPath = path.join(resultsDir, `run-${runId}.md`);

  fs.writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        runId,
        targetUrl: args.baseUrl,
        concurrent: args.concurrent,
        wallTimeMs: wallEnd - wallStart,
        config: args,
        results,
      },
      null,
      2
    ),
    'utf-8'
  );
  console.log(`  JSON: ${jsonPath}`);

  const summary = buildSummary(results);
  fs.writeFileSync(mdPath, summary, 'utf-8');
  console.log(`  MD:   ${mdPath}`);

  // Cleanup test data unless --skip-cleanup was passed
  if (!args.skipCleanup) {
    console.log(`\n[${new Date().toISOString()}] Cleaning up test data for run ${runId}...`);
    const cleanup = await cleanupRun(runId);
    console.log(`  Users deleted: ${cleanup.usersDeleted}`);
    if (cleanup.errors.length > 0) {
      console.log(`  Cleanup errors:`);
      cleanup.errors.forEach((e) => console.log(`    ${e}`));
    }
  } else {
    console.log(`\n[SKIPPED CLEANUP] To clean up later, run with --cleanup-run-id ${runId}`);
  }

  // Final summary line for CI / scripted callers
  const completed = results.filter((r) => r.completed).length;
  const total = results.length;
  const completionRate = total > 0 ? (completed / total) * 100 : 0;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULT: ${completed}/${total} completed (${completionRate.toFixed(1)}%)`);
  console.log(`${'='.repeat(50)}\n`);

  // Exit code reflects success rate. 100% = 0, anything less = 1.
  // Useful for CI integration later.
  process.exit(completed === total ? 0 : 1);
}

main().catch((err) => {
  console.error('\nFATAL:', err);
  process.exit(2);
});
