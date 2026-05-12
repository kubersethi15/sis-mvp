# Execution Log — Production Migrations Applied via MCP

**Date:** May 12, 2026, ~07:50-08:40 UTC
**Database:** sis-mvp / ftdnpsrbnjkvazspmenv
**Method:** Direct application via Supabase MCP server

## Sequence of operations applied to production:

### 1. `add_foreign_key_indexes` (no risk, additive)
Applied 16 indexes on unindexed foreign key columns flagged by the performance advisor. No table locks (idempotent IF NOT EXISTS).

### 2. `snapshot_backup_before_reconciliation`
Created `_backup_*_20260512` tables for all 14 affected tables. Row counts verified to match live.

### 3. `reconcile_user_profiles_to_auth_users` (FIRST ATTEMPT — FAILED)
Hit duplicate key constraint on user_profiles_pkey for Angela's auth.users.id. Two user_profiles rows had the same email mapping to same auth user. Transaction rolled back cleanly. No data changes applied.

### 4. `reconcile_user_profiles_to_auth_users_v2` (SUCCESS)
Rewrote with DISTINCT ON (new_id) to deduplicate the INSERT while still reparenting all FKs. Migrated 20 old user_profiles → 17 unique auth.users targets (3 dedupes from same-email cases).

**Counts:**
- 13 new user_profiles inserted at auth.users.id (Bucket B non-collision)
- 14 jobseeker_profiles reparented (Bucket B + B')
- 12 leee_sessions reparented
- 20 old user_profiles deleted
- Sanity check: 0 orphan FK refs

### 5. `backfill_emails_and_dedupe_jobseeker_profiles` (FIRST ATTEMPT — FAILED)
Hit FK constraint on leee_sessions.jobseeker_id when deleting duplicate jobseeker_profiles. Transaction rolled back cleanly.

### 6. `backfill_emails_and_dedupe_jobseeker_profiles_v2` (SUCCESS)
- Backfilled 6 missing emails in user_profiles from auth.users
- Reparented all FKs from duplicate jobseeker_profiles to canonical (highest completion %)
- Deleted 6 duplicate jobseeker_profiles
- All 3 FK-referencing tables updated (leee_sessions, applications, psychologist_validations)
- Sanity check: 0 users with duplicate jobseeker_profiles

### 7. `enable_rls_with_policies` (SUCCESS)
Enabled RLS on all 15 application tables with ~38 policies covering:
- Owner access (users see their own data)
- Reviewer access (psychologist/recruiter/hiring_manager/final_approver/admin)
- Public reference data (skills_taxonomy, published vacancies)
- Service-role bypass (API routes continue to work as before)

### 8. `lock_down_backup_tables` (SUCCESS)
Enabled RLS on all 14 `_backup_*_20260512` tables with no policies = deny-all to authenticated/anon. Only service_role can access (for restoration if needed).

## Final state verification:

| Check | Before | After |
|---|---|---|
| user_profiles linked to auth | 8 | 21 |
| user_profiles total | 45 | 38 |
| jobseeker_profiles | 41 | 35 (6 duplicates removed) |
| Users with dup jobseeker_profiles | 6 | 0 |
| Orphan FK references | 0 | 0 |
| RLS enabled on application tables | 0/15 | 15/15 |
| Critical security findings | 18 | 0 |

## Remaining work (not handled by these migrations):

1. **Bucket C (9 no-email user_profiles)** — manual archive decision needed
2. **Bucket D (9 email-but-no-auth user_profiles, including Ryan's spectrum account)** — needs auth.users creation via admin API
3. **Bucket E (27 stuck signup auth.users with no profile data)** — needs Resend domain verified to send recovery emails
4. **Leaked password protection** — dashboard toggle, see https://supabase.com/dashboard/project/ftdnpsrbnjkvazspmenv/auth/providers
5. **Drop _backup_*_20260512 tables** — after ~1 week confidence period, run DROP TABLE statements
6. **Vercel deployment 404** — separate from database migration, unrelated. Find correct URL in Virtualahan team Vercel dashboard.

## Rollback (if needed):
- `03_ROLLBACK_disable_rls.sql` in this folder — disables RLS instantly
- Backup tables: `_backup_*_20260512` contain pre-migration data for restoration
