# Kaya Load Test Harness — Phase 3

## What this is

A standalone load testing tool for Kaya. Simulates N concurrent jobseekers running through the full LEEE pipeline end-to-end, measures latency and error rates per stage, surfaces bottlenecks before real users hit them.

## What this is NOT

- Not a UI smoke test (no headless browser). We test the API contracts directly.
- Not a unit test runner.
- Not a production monitoring tool (telemetry layer, Phase 4, is for that).
- Not something that runs on Vercel — it runs locally against a deployed environment, hammering it from outside.

## What success looks like

After Phase 3 is complete, you can run `npm run loadtest -- --concurrent 50` against the production deployment and observe:

- ≥98% of users complete the full flow without errors
- p95 latency per stage stays under a defined threshold
- No Anthropic rate-limit errors (429s) under normal flow
- No Vercel function timeouts
- No Supabase connection pool exhaustion
- All assertions in the test pass

If any of those fail, we have a concrete number to fix.

## What it measures, per simulated user

For each pipeline stage:
- `latency_ms` — wall-clock time
- `success` — boolean
- `error_class` — if failed, what category (timeout, rate_limit, db_error, json_parse, etc)
- `retry_count` — how many retries before success

Per overall run:
- Total time start-to-finish
- Funnel completion (how many users got past each stage)
- p50, p95, p99 latencies aggregated across users
- Error rate aggregated, broken down by stage and error class

## Architecture

```
loadtest.ts                      ← orchestrator, parses CLI args
  ├─ scenarios/jobseeker.ts      ← one full user journey (signup → LEEE → sim → profile)
  ├─ scenarios/conversation.ts   ← scripted Aya responses (8-15 turns)
  ├─ lib/measure.ts              ← timing wrapper, structured result writer
  ├─ lib/auth.ts                 ← admin-API user creation, JWT minting
  ├─ lib/cleanup.ts              ← test user marking + post-run deletion
  └─ results/                    ← JSON + markdown summaries
```

## What it does NOT touch

- Real user accounts. Test users are created with email `loadtest+<uuid>@kaya-test.invalid`.
- Real test data. Test sessions and messages are tagged with a `load_test_run_id` for easy cleanup.
- Anything outside the load_test_run_id scope.

## Cleanup

After each run, the cleanup script:
- Deletes auth.users rows for the test emails
- Deletes user_profiles, jobseeker_profiles, leee_sessions, leee_messages, leee_extractions tied to those users
- Run-id-scoped, so partial runs don't leave permanent debris

## How to run

```bash
# Dry run against built-in sample (no network)
npm run loadtest:dry

# Small test against production
ANTHROPIC_API_KEY=... npm run loadtest -- --concurrent 5 --base-url https://kaya.virtualahan.com

# Real target
npm run loadtest -- --concurrent 50 --base-url https://kaya.virtualahan.com
```

## Build sequence

This README is the spec. The actual harness gets built in stages:

1. **v0 (today)** — auth helpers + a single user running through signup + first 3 LEEE messages. Verifies API contract is what we think.
2. **v1** — full LEEE conversation (8-15 messages until completion).
3. **v2** — concurrency. Spawn N users, run them in parallel, aggregate results.
4. **v3** — simulation layer integration.
5. **v4** — proper cleanup and reporting.

We don't try to build everything at once. Each version is testable and produces a result.
