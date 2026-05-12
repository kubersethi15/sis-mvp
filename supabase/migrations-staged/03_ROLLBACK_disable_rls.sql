-- ============================================================================
-- KAYA — DATA RECONCILIATION — STEP 4 ROLLBACK
-- ============================================================================
-- Purpose: Instantly restore the pre-RLS state if 03_enable_rls_with_policies.sql
-- causes problems we can't quickly fix.
--
-- This DISABLES RLS on all 15 tables — making them publicly readable again
-- (the pre-Step-4 state). Use only if production users are getting blocked
-- and we need to unbreak the platform immediately.
--
-- After running this, the database is back to its pre-Step-4 state. Policies
-- remain in the schema but are inactive (disabled by RLS off).
--
-- Re-enabling: re-run 03_enable_rls_with_policies.sql.
-- ============================================================================

BEGIN;

ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobseeker_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leee_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leee_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.leee_extractions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate1_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate2_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.gate3_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.psychologist_validations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_taxonomy DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_plans DISABLE ROW LEVEL SECURITY;

COMMIT;
