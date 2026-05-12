# Staged Migrations — Data Reconciliation + RLS

These migrations are **staged** — they are NOT in the regular Supabase migrations folder because they require manual review and orchestrated execution.

## What and why

The Phase 2 audit (May 12, 2026) uncovered two related issues:

1. **Pre-existing data integrity issue:** the application code creates `public.user_profiles` rows with random UUIDs unrelated to `auth.users.id` in many paths. Only 8 of 45 users have correctly linked IDs.
2. **RLS is disabled on all 15 application tables**, meaning anyone with the public anon key can read or modify every row.

We can't safely enable RLS without first fixing the data integrity issue — doing so would lock 37 of 45 existing users out of their own data.

## Order of execution

Run these in strict order. Each depends on the previous having succeeded:

| Order | File | What it does | Reversible? |
|---|---|---|---|
| 0 | `src/app/api/profile/route.ts` code fix | Stops new signups from drifting | Yes (revert commit) |
| 1 | `01_snapshot_backup.sql` | Creates `_backup_*_20260512` tables | N/A (additive only) |
| 2 | `02_reconcile_user_profiles.sql` | Reparents FKs from old user_profiles.id to auth.users.id, deletes orphan rows | Yes (restore from backup tables) |
| 3 | `03_enable_rls_with_policies.sql` | Enables RLS + adds policies on all 15 tables | Yes (`03_ROLLBACK_disable_rls.sql`) |

## How to run

**Option A — Apply directly to production with MCP** (preferred for these migrations because Supabase branch costs money and we already have backups):

1. Code fix first — merge the PR with the `profile/route.ts` change. Wait for Vercel deploy.
2. Run `01_snapshot_backup.sql` via Supabase SQL editor or MCP `apply_migration`. Verify backup row counts match live tables.
3. Run `02_reconcile_user_profiles.sql`. Check the RAISE NOTICE output — it should report the migration map and post-state stats.
4. Smoke test the app: pick a known user from Bucket B (e.g., one of the email-matched accounts) and verify they can still log in and see their data. Use the Supabase dashboard to spot-check `jobseeker_profiles.user_id` now points to `auth.users.id` for migrated rows.
5. Once you've confirmed step 4, run `03_enable_rls_with_policies.sql`.
6. Smoke test direct-from-frontend queries: `/my-dashboard`, `/profile`, `/feedback`. If any return empty when they shouldn't, check the browser console and the Supabase logs for the blocking policy.

**Option B — Test on a Supabase branch first** (if you want extra confidence):

1. Create a branch via MCP `create_branch` (costs ~$0.32/day, small project)
2. Run all migrations on the branch
3. Verify everything works
4. Merge branch to main, applying the same migrations to production

## What's NOT in these migrations

These migrations handle Buckets A, B, B′ from the reconciliation plan. **They do NOT handle:**

- **Bucket C** (9 user_profiles rows with no email) — needs manual archive decision
- **Bucket D** (9 user_profiles rows with email but no auth.users) — requires creating new auth.users entries via the Supabase admin API (cannot be done in SQL alone)
- **Bucket E** (27 stuck signup auth.users with no profile data) — needs Resend domain verification first, then send password recovery emails

These need separate handling once email delivery is restored. See `Kaya_Phase2_5_Reconciliation_Plan.docx` for the full plan.

## If something goes wrong

**During `02_reconcile_user_profiles.sql`:** the migration runs in a transaction, so any error aborts the whole thing. No partial damage. Just fix the issue and retry.

**After `02_reconcile_user_profiles.sql` completes but you see problems:**
```sql
-- Restore from backup
BEGIN;
TRUNCATE jobseeker_profiles CASCADE;
INSERT INTO jobseeker_profiles SELECT * FROM _backup_jobseeker_profiles_20260512;
TRUNCATE leee_sessions CASCADE;
INSERT INTO leee_sessions SELECT * FROM _backup_leee_sessions_20260512;
TRUNCATE user_profiles CASCADE;
INSERT INTO user_profiles SELECT * FROM _backup_user_profiles_20260512;
-- ... repeat for any other affected table ...
COMMIT;
```

**During or after `03_enable_rls_with_policies.sql`:** run `03_ROLLBACK_disable_rls.sql`. Instant. Disables RLS on all tables. Platform back to pre-Step-4 state in seconds.

## Backup table cleanup

The `_backup_*_20260512` tables stay until we're confident the migration succeeded — recommend 1 week minimum. Then:
```sql
DROP TABLE _backup_user_profiles_20260512;
DROP TABLE _backup_jobseeker_profiles_20260512;
-- ... etc
```

Or write a follow-up migration `04_drop_backup_tables.sql` to do this cleanly.
