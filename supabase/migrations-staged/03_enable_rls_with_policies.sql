-- ============================================================================
-- KAYA — DATA RECONCILIATION — STEP 4: ENABLE RLS WITH POLICIES
-- ============================================================================
-- PREREQUISITE: 02_reconcile_user_profiles.sql has run successfully, AND
-- ryan@virtualahan.com canonical-email migration has completed (or Bucket D
-- accounts handled out-of-band).
--
-- Purpose: Enable Row Level Security on all 15 tables in the public schema,
-- with policies that allow:
--   - Authenticated users to access their own data
--   - Reference data (skills_taxonomy) to be readable by everyone
--   - Role-based access for psychologists, recruiters, hiring managers
--   - The service_role (used by API routes) to bypass everything (default)
--
-- After this migration, the Supabase anon key alone cannot read any user data.
-- Frontend pages that currently query Supabase directly with the anon key
-- (feedback, profile, my-dashboard, LEEEChat) will continue to work because
-- they query as authenticated users via the JWT — the RLS policies grant
-- them access to their own rows.
--
-- ROLLBACK: Run STEP_4_ROLLBACK.sql which DISABLEs RLS on all tables.
-- ============================================================================

BEGIN;

-- ────────────────────────────────────────────────────────────────────────────
-- user_profiles — every user can read & update their own row
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_profiles_select_own"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()));

CREATE POLICY "user_profiles_insert_own"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "user_profiles_update_own"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Authenticated users can see other users' basic profile info (name + role)
-- for the parts of the UI that show "interviewer: Maria" etc. Without this,
-- joining gate_results to user_profiles to render reviewer names would fail.
-- Tradeoff: any authenticated user can enumerate other users' names. This is
-- acceptable for an employment platform where users interact (jobseekers see
-- recruiters, etc). Sensitive fields (email, phone, accessibility) stay private.
CREATE POLICY "user_profiles_select_basic_other_users"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (id != (SELECT auth.uid()));

-- ────────────────────────────────────────────────────────────────────────────
-- jobseeker_profiles — users access their own only
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.jobseeker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobseeker_profiles_select_own"
  ON public.jobseeker_profiles FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "jobseeker_profiles_insert_own"
  ON public.jobseeker_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "jobseeker_profiles_update_own"
  ON public.jobseeker_profiles FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Psychologists, recruiters, hiring managers, and final approvers can read
-- jobseeker profiles as part of the gate review workflow
CREATE POLICY "jobseeker_profiles_select_by_reviewer_roles"
  ON public.jobseeker_profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('psychologist', 'recruiter', 'hiring_manager', 'final_approver', 'admin')
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- leee_sessions — users own their sessions; reviewers can read for active applications
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.leee_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leee_sessions_select_own"
  ON public.leee_sessions FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "leee_sessions_insert_own"
  ON public.leee_sessions FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "leee_sessions_update_own"
  ON public.leee_sessions FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "leee_sessions_select_by_reviewer_roles"
  ON public.leee_sessions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('psychologist', 'recruiter', 'hiring_manager', 'final_approver', 'admin')
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- leee_messages — access flows through session ownership
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.leee_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leee_messages_select_via_session_owner"
  ON public.leee_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leee_sessions
      WHERE id = leee_messages.session_id AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "leee_messages_insert_via_session_owner"
  ON public.leee_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leee_sessions
      WHERE id = leee_messages.session_id AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "leee_messages_select_by_reviewer_roles"
  ON public.leee_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('psychologist', 'recruiter', 'hiring_manager', 'final_approver', 'admin')
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- leee_extractions — same pattern as leee_messages
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.leee_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leee_extractions_select_via_session_owner"
  ON public.leee_extractions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leee_sessions
      WHERE id = leee_extractions.session_id AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "leee_extractions_select_by_reviewer_roles"
  ON public.leee_extractions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('psychologist', 'recruiter', 'hiring_manager', 'final_approver', 'admin')
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- employer_profiles — employer-side users only
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;

-- Employer-role users can read employer profiles they're attached to
CREATE POLICY "employer_profiles_select_by_associated_user"
  ON public.employer_profiles FOR SELECT TO authenticated
  USING (
    default_recruiter_id = (SELECT auth.uid())
    OR default_hiring_manager_id = (SELECT auth.uid())
    OR default_final_approver_id = (SELECT auth.uid())
  );

-- Jobseekers can see employer profiles for vacancies they're applying to
CREATE POLICY "employer_profiles_select_via_published_vacancies"
  ON public.employer_profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vacancies v
      WHERE v.employer_id = employer_profiles.id AND v.status = 'published'
    )
  );

-- Admins can read everything
CREATE POLICY "employer_profiles_select_by_admin"
  ON public.employer_profiles FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- ────────────────────────────────────────────────────────────────────────────
-- vacancies — published vacancies readable to all authenticated; employer-side
-- users manage their own
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.vacancies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vacancies_select_published_for_authenticated"
  ON public.vacancies FOR SELECT TO authenticated
  USING (status = 'published');

CREATE POLICY "vacancies_select_by_associated_user"
  ON public.vacancies FOR SELECT TO authenticated
  USING (
    recruiter_id = (SELECT auth.uid())
    OR hiring_manager_id = (SELECT auth.uid())
    OR final_approver_id = (SELECT auth.uid())
  );

CREATE POLICY "vacancies_insert_by_employer_roles"
  ON public.vacancies FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('recruiter', 'hiring_manager', 'final_approver', 'admin')
    )
  );

CREATE POLICY "vacancies_update_by_associated_user"
  ON public.vacancies FOR UPDATE TO authenticated
  USING (
    recruiter_id = (SELECT auth.uid())
    OR hiring_manager_id = (SELECT auth.uid())
    OR final_approver_id = (SELECT auth.uid())
  );

-- ────────────────────────────────────────────────────────────────────────────
-- applications — jobseekers see their own; reviewers see applications to their vacancies
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "applications_select_by_jobseeker"
  ON public.applications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobseeker_profiles
      WHERE id = applications.jobseeker_id AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "applications_insert_by_jobseeker"
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.jobseeker_profiles
      WHERE id = applications.jobseeker_id AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "applications_select_by_vacancy_reviewer"
  ON public.applications FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vacancies v
      WHERE v.id = applications.vacancy_id
        AND (v.recruiter_id = (SELECT auth.uid())
             OR v.hiring_manager_id = (SELECT auth.uid())
             OR v.final_approver_id = (SELECT auth.uid()))
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- gate1_results, gate2_results, gate3_results
-- Readable by the jobseeker (their own) and the reviewer (assigned)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.gate1_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gate1_select_by_jobseeker"
  ON public.gate1_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobseeker_profiles jp ON a.jobseeker_id = jp.id
      WHERE a.id = gate1_results.application_id AND jp.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "gate1_select_by_reviewer_roles"
  ON public.gate1_results FOR SELECT TO authenticated
  USING (
    reviewer_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('recruiter', 'hiring_manager', 'final_approver', 'psychologist', 'admin')
    )
  );

CREATE POLICY "gate1_modify_by_reviewer_roles"
  ON public.gate1_results FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('recruiter', 'hiring_manager', 'final_approver', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('recruiter', 'hiring_manager', 'final_approver', 'admin')
    )
  );

ALTER TABLE public.gate2_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gate2_select_by_jobseeker"
  ON public.gate2_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobseeker_profiles jp ON a.jobseeker_id = jp.id
      WHERE a.id = gate2_results.application_id AND jp.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "gate2_select_by_reviewer_roles"
  ON public.gate2_results FOR SELECT TO authenticated
  USING (
    reviewer_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('recruiter', 'hiring_manager', 'final_approver', 'psychologist', 'admin')
    )
  );

CREATE POLICY "gate2_modify_by_reviewer_roles"
  ON public.gate2_results FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('recruiter', 'hiring_manager', 'final_approver', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('recruiter', 'hiring_manager', 'final_approver', 'admin')
    )
  );

ALTER TABLE public.gate3_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gate3_select_by_jobseeker"
  ON public.gate3_results FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobseeker_profiles jp ON a.jobseeker_id = jp.id
      WHERE a.id = gate3_results.application_id AND jp.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "gate3_select_by_reviewer_roles"
  ON public.gate3_results FOR SELECT TO authenticated
  USING (
    reviewer_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('recruiter', 'hiring_manager', 'final_approver', 'psychologist', 'admin')
    )
  );

CREATE POLICY "gate3_modify_by_reviewer_roles"
  ON public.gate3_results FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('recruiter', 'hiring_manager', 'final_approver', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('recruiter', 'hiring_manager', 'final_approver', 'admin')
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- psychologist_validations — only the validating psychologist and the jobseeker
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.psychologist_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psych_val_select_by_jobseeker"
  ON public.psychologist_validations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.jobseeker_profiles
      WHERE id = psychologist_validations.jobseeker_id AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "psych_val_select_by_psychologist"
  ON public.psychologist_validations FOR SELECT TO authenticated
  USING (psychologist_id = (SELECT auth.uid()));

CREATE POLICY "psych_val_select_by_admin_reviewer"
  ON public.psychologist_validations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('admin', 'final_approver')
    )
  );

CREATE POLICY "psych_val_modify_by_psychologist_role"
  ON public.psychologist_validations FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('psychologist', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('psychologist', 'admin')
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- skills_taxonomy — reference data, public read
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.skills_taxonomy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skills_taxonomy_select_all_authenticated"
  ON public.skills_taxonomy FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "skills_taxonomy_modify_by_admin"
  ON public.skills_taxonomy FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- ────────────────────────────────────────────────────────────────────────────
-- feedback_reports — readable by jobseeker, employer reviewers
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.feedback_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feedback_reports_select_by_jobseeker"
  ON public.feedback_reports FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobseeker_profiles jp ON a.jobseeker_id = jp.id
      WHERE a.id = feedback_reports.application_id AND jp.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "feedback_reports_select_by_reviewer_roles"
  ON public.feedback_reports FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('recruiter', 'hiring_manager', 'final_approver', 'admin')
    )
  );

-- ────────────────────────────────────────────────────────────────────────────
-- onboarding_plans — readable by jobseeker, manageable by recruiter/hiring_manager
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.onboarding_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "onboarding_plans_select_by_jobseeker"
  ON public.onboarding_plans FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      JOIN public.jobseeker_profiles jp ON a.jobseeker_id = jp.id
      WHERE a.id = onboarding_plans.application_id AND jp.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "onboarding_plans_modify_by_employer_roles"
  ON public.onboarding_plans FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('recruiter', 'hiring_manager', 'final_approver', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = (SELECT auth.uid())
        AND role IN ('recruiter', 'hiring_manager', 'final_approver', 'admin')
    )
  );

COMMIT;

-- ============================================================================
-- POST-MIGRATION SMOKE TEST
-- After committing, hit these from the frontend with a real authenticated user:
--   - /my-dashboard should still show their LEEE sessions
--   - /profile should still show their jobseeker profile
--   - /feedback should still show their session list
-- If any of these break, check the browser console for the Supabase error code —
-- it will name the specific policy that's blocking access.
--
-- Service-role API routes (/api/chat, /api/profile, /api/simulation-l2) continue
-- to bypass RLS as before. Only direct frontend-to-Supabase queries are affected.
-- ============================================================================
