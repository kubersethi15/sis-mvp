-- ============================================================================
-- KAYA — DATA RECONCILIATION — STEP 3: RECONCILE user_profiles ↔ auth.users
-- ============================================================================
-- PREREQUISITE: 01_snapshot_backup.sql has been run successfully.
-- VERIFY: SELECT count(*) FROM _backup_user_profiles_20260512;  -- expect 45
--
-- Purpose: Bring public.user_profiles.id into alignment with auth.users.id
-- so RLS policies using `id = auth.uid()` work for everyone.
--
-- Strategy: rather than UPDATE user_profiles.id (which would cascade through
-- many FKs and risk corruption), we instead REPARENT all FK references to
-- point directly at auth.users.id, then DELETE the now-orphan user_profiles
-- rows. The next time the user logs in, src/app/api/profile/route.ts (after
-- the code fix) will upsert a fresh user_profiles row with the correct id.
--
-- This is intentionally a single transaction. If anything fails, the whole
-- thing rolls back and the database is exactly as it was.
--
-- ROLLBACK: If anything goes wrong post-commit, restore from backup tables:
--   TRUNCATE user_profiles CASCADE;  INSERT INTO user_profiles SELECT * FROM _backup_user_profiles_20260512;
--   TRUNCATE jobseeker_profiles CASCADE; INSERT INTO jobseeker_profiles SELECT * FROM _backup_jobseeker_profiles_20260512;
--   ... etc for each table ...
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- PART A: Build the reconciliation map.
-- For every (user_profiles.id → auth.users.id) pair that needs migration,
-- record it in a temp table so we can verify the plan before applying.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TEMP TABLE _migration_map (
  old_id UUID PRIMARY KEY,          -- current user_profiles.id (the "wrong" one)
  new_id UUID NOT NULL,             -- the auth.users.id we're reparenting TO
  email TEXT,
  full_name TEXT,
  bucket TEXT NOT NULL,             -- 'B_email_match' or 'B_prime_collision' or 'D_orphan_with_email'
  collision_with_auth BOOLEAN NOT NULL DEFAULT false
);

-- Populate from Bucket B (email matches, no current auth-side data conflict)
INSERT INTO _migration_map (old_id, new_id, email, full_name, bucket, collision_with_auth)
SELECT
  up.id AS old_id,
  au.id AS new_id,
  up.email,
  up.full_name,
  CASE
    WHEN EXISTS (SELECT 1 FROM jobseeker_profiles WHERE user_id = au.id)
      OR EXISTS (SELECT 1 FROM leee_sessions WHERE user_id = au.id)
    THEN 'B_prime_collision'
    ELSE 'B_email_match'
  END AS bucket,
  EXISTS (
    SELECT 1 FROM jobseeker_profiles WHERE user_id = au.id
    UNION ALL
    SELECT 1 FROM leee_sessions WHERE user_id = au.id
  ) AS collision_with_auth
FROM public.user_profiles up
JOIN auth.users au ON LOWER(TRIM(up.email)) = LOWER(TRIM(au.email))
WHERE up.id != au.id
  AND up.email IS NOT NULL;

-- Verify map populated
DO $$
DECLARE
  total_count INTEGER;
  collision_count INTEGER;
BEGIN
  SELECT count(*) INTO total_count FROM _migration_map;
  SELECT count(*) INTO collision_count FROM _migration_map WHERE collision_with_auth;
  RAISE NOTICE 'Migration map: % total entries (% collision cases needing merge)', total_count, collision_count;

  IF total_count = 0 THEN
    RAISE EXCEPTION 'Migration map is empty — nothing to do, or something is wrong. Aborting.';
  END IF;

  IF total_count > 30 THEN
    RAISE EXCEPTION 'Migration map has % entries — unexpectedly large. Review before proceeding.', total_count;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────────────
-- PART B: Reparent FK references for non-collision cases (Bucket B).
-- For each user with no auth-side data conflict, simply update every FK
-- reference from old_id to new_id.
-- ────────────────────────────────────────────────────────────────────────────

-- Update jobseeker_profiles.user_id
UPDATE public.jobseeker_profiles jp
SET user_id = m.new_id
FROM _migration_map m
WHERE jp.user_id = m.old_id
  AND m.bucket = 'B_email_match';

-- Update leee_sessions.user_id
UPDATE public.leee_sessions s
SET user_id = m.new_id
FROM _migration_map m
WHERE s.user_id = m.old_id
  AND m.bucket = 'B_email_match';

-- Update reviewer_id in gate results (in case the user was a reviewer)
UPDATE public.gate1_results r SET reviewer_id = m.new_id
FROM _migration_map m WHERE r.reviewer_id = m.old_id AND m.bucket = 'B_email_match';
UPDATE public.gate2_results r SET reviewer_id = m.new_id
FROM _migration_map m WHERE r.reviewer_id = m.old_id AND m.bucket = 'B_email_match';
UPDATE public.gate3_results r SET reviewer_id = m.new_id
FROM _migration_map m WHERE r.reviewer_id = m.old_id AND m.bucket = 'B_email_match';

-- Update psychologist_id, jobseeker_id in psychologist_validations
UPDATE public.psychologist_validations v SET psychologist_id = m.new_id
FROM _migration_map m WHERE v.psychologist_id = m.old_id AND m.bucket = 'B_email_match';
UPDATE public.psychologist_validations v SET jobseeker_id = m.new_id
FROM _migration_map m WHERE v.jobseeker_id = m.old_id AND m.bucket = 'B_email_match';

-- Update employer_profiles default_* fields
UPDATE public.employer_profiles ep SET default_recruiter_id = m.new_id
FROM _migration_map m WHERE ep.default_recruiter_id = m.old_id AND m.bucket = 'B_email_match';
UPDATE public.employer_profiles ep SET default_hiring_manager_id = m.new_id
FROM _migration_map m WHERE ep.default_hiring_manager_id = m.old_id AND m.bucket = 'B_email_match';
UPDATE public.employer_profiles ep SET default_final_approver_id = m.new_id
FROM _migration_map m WHERE ep.default_final_approver_id = m.old_id AND m.bucket = 'B_email_match';

-- Update vacancies recruiter/hiring_manager/final_approver
UPDATE public.vacancies v SET recruiter_id = m.new_id
FROM _migration_map m WHERE v.recruiter_id = m.old_id AND m.bucket = 'B_email_match';
UPDATE public.vacancies v SET hiring_manager_id = m.new_id
FROM _migration_map m WHERE v.hiring_manager_id = m.old_id AND m.bucket = 'B_email_match';
UPDATE public.vacancies v SET final_approver_id = m.new_id
FROM _migration_map m WHERE v.final_approver_id = m.old_id AND m.bucket = 'B_email_match';

-- Update jobseeker_profiles.user_id where it references old user_profiles.id (already done above)
-- And psychologist_validations.jobseeker_id (also already done above)

-- Now delete the orphan user_profiles rows from Bucket B_email_match.
-- These will be recreated correctly on next login via the fixed createProfile code.
DELETE FROM public.user_profiles up
USING _migration_map m
WHERE up.id = m.old_id
  AND m.bucket = 'B_email_match';

-- ────────────────────────────────────────────────────────────────────────────
-- PART C: Handle collision cases (Bucket B′) — 6 users with duplicate accounts.
-- For each: keep the auth-side as canonical, REPARENT the old-side data onto
-- auth.users.id (effectively merging the two accounts), then delete the old
-- user_profiles row.
--
-- Implementation: identical to Part B for these users. UPDATE statements use
-- "WHERE old_id" — so old jobseeker_profiles get user_id set to auth.users.id.
-- This produces TWO jobseeker_profiles per collision user (the existing
-- auth-side one + the migrated old-side one). The application code uses
-- ".limit(1)" on jobseeker_profile lookups, so it sees one. The duplicate is
-- preserved in case we need to inspect/merge it manually later.
-- ────────────────────────────────────────────────────────────────────────────

UPDATE public.jobseeker_profiles jp
SET user_id = m.new_id
FROM _migration_map m
WHERE jp.user_id = m.old_id
  AND m.bucket = 'B_prime_collision';

UPDATE public.leee_sessions s
SET user_id = m.new_id
FROM _migration_map m
WHERE s.user_id = m.old_id
  AND m.bucket = 'B_prime_collision';

UPDATE public.gate1_results r SET reviewer_id = m.new_id
FROM _migration_map m WHERE r.reviewer_id = m.old_id AND m.bucket = 'B_prime_collision';
UPDATE public.gate2_results r SET reviewer_id = m.new_id
FROM _migration_map m WHERE r.reviewer_id = m.old_id AND m.bucket = 'B_prime_collision';
UPDATE public.gate3_results r SET reviewer_id = m.new_id
FROM _migration_map m WHERE r.reviewer_id = m.old_id AND m.bucket = 'B_prime_collision';

UPDATE public.psychologist_validations v SET psychologist_id = m.new_id
FROM _migration_map m WHERE v.psychologist_id = m.old_id AND m.bucket = 'B_prime_collision';
UPDATE public.psychologist_validations v SET jobseeker_id = m.new_id
FROM _migration_map m WHERE v.jobseeker_id = m.old_id AND m.bucket = 'B_prime_collision';

UPDATE public.employer_profiles ep SET default_recruiter_id = m.new_id
FROM _migration_map m WHERE ep.default_recruiter_id = m.old_id AND m.bucket = 'B_prime_collision';
UPDATE public.employer_profiles ep SET default_hiring_manager_id = m.new_id
FROM _migration_map m WHERE ep.default_hiring_manager_id = m.old_id AND m.bucket = 'B_prime_collision';
UPDATE public.employer_profiles ep SET default_final_approver_id = m.new_id
FROM _migration_map m WHERE ep.default_final_approver_id = m.old_id AND m.bucket = 'B_prime_collision';

UPDATE public.vacancies v SET recruiter_id = m.new_id
FROM _migration_map m WHERE v.recruiter_id = m.old_id AND m.bucket = 'B_prime_collision';
UPDATE public.vacancies v SET hiring_manager_id = m.new_id
FROM _migration_map m WHERE v.hiring_manager_id = m.old_id AND m.bucket = 'B_prime_collision';
UPDATE public.vacancies v SET final_approver_id = m.new_id
FROM _migration_map m WHERE v.final_approver_id = m.old_id AND m.bucket = 'B_prime_collision';

-- Delete the old orphan user_profiles rows for collision cases.
-- (The auth-side user_profiles row stays — that's the canonical one going forward.)
DELETE FROM public.user_profiles up
USING _migration_map m
WHERE up.id = m.old_id
  AND m.bucket = 'B_prime_collision';

-- ────────────────────────────────────────────────────────────────────────────
-- PART D: Bucket D — accounts with email but no matching auth.users.
-- These cannot be reconciled at the SQL level — they require creating new
-- auth.users entries via the Supabase admin API (which is NOT available from
-- raw SQL). Documenting them here for manual handling.
--
-- For now we leave Bucket D rows alone. After Ryan's canonical-email
-- decision and once we have the Supabase admin SDK call sequence in code,
-- a separate script handles these.
-- ────────────────────────────────────────────────────────────────────────────

-- (no SQL action for Bucket D — handled out-of-band)

-- ────────────────────────────────────────────────────────────────────────────
-- PART E: Verification — after migration, every remaining user_profiles row
-- should have id matching an auth.users row. Anything that doesn't is an
-- orphan that's been intentionally left for manual handling (Bucket C+D).
-- ────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  remaining_orphans INTEGER;
  fully_linked INTEGER;
  total_user_profiles INTEGER;
BEGIN
  SELECT count(*) INTO total_user_profiles FROM public.user_profiles;
  SELECT count(*) INTO fully_linked
    FROM public.user_profiles up WHERE EXISTS (SELECT 1 FROM auth.users WHERE id = up.id);
  remaining_orphans := total_user_profiles - fully_linked;

  RAISE NOTICE 'Post-migration state: % user_profiles total, % linked to auth.users, % unlinked (Bucket C/D)',
    total_user_profiles, fully_linked, remaining_orphans;

  -- Sanity check: jobseeker_profiles should now point to auth.users IDs OR to
  -- unlinked user_profiles (the C/D remnants). NEVER to a user_profiles ID
  -- that was supposed to have been migrated.
  IF EXISTS (
    SELECT 1 FROM jobseeker_profiles jp
    JOIN _migration_map m ON jp.user_id = m.old_id
  ) THEN
    RAISE EXCEPTION 'jobseeker_profiles still references migrated old_ids — migration incomplete';
  END IF;

  IF EXISTS (
    SELECT 1 FROM leee_sessions s
    JOIN _migration_map m ON s.user_id = m.old_id
  ) THEN
    RAISE EXCEPTION 'leee_sessions still references migrated old_ids — migration incomplete';
  END IF;
END $$;

COMMIT;

-- After successful commit, run this to spot-check Ryan's situation:
--   SELECT 'auth.users' AS source, id, email FROM auth.users WHERE email LIKE '%ryan%'
--   UNION ALL
--   SELECT 'user_profiles', id, email FROM user_profiles WHERE full_name ILIKE '%ryan%' OR email LIKE '%ryan%'
--   UNION ALL
--   SELECT 'jobseeker_profiles', jp.user_id, up.email
--   FROM jobseeker_profiles jp
--   LEFT JOIN user_profiles up ON jp.user_id = up.id
--   WHERE up.full_name ILIKE '%ryan%' OR up.email LIKE '%ryan%';
