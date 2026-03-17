-- Kaya Migration: R2 + R11 — Disability Context + Self-Reported Challenges
-- Run this in Supabase SQL editor if schema is already deployed
-- Safe to run multiple times (IF NOT EXISTS)

-- R2: Structured disability context
ALTER TABLE jobseeker_profiles
ADD COLUMN IF NOT EXISTS disability_context JSONB DEFAULT '{}';

COMMENT ON COLUMN jobseeker_profiles.disability_context IS 'R2: {disclosed, type, severity, recently_diagnosed, communication_impact, accommodation_notes, sensitivity_level}';

-- R11: Self-reported challenges
ALTER TABLE jobseeker_profiles
ADD COLUMN IF NOT EXISTS self_reported_challenges JSONB DEFAULT '[]';

COMMENT ON COLUMN jobseeker_profiles.self_reported_challenges IS 'R11: Array of challenge strings. Types: interview communication, screening bias, limited network, limited credentials, career transition, time pressure, confidence, accessibility';

-- Onboarding plans table (O2 + O3) — create if not exists
CREATE TABLE IF NOT EXISTS onboarding_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  onboarding_checklist JSONB DEFAULT '[]',
  first_30_day_plan JSONB DEFAULT '{}',
  first_90_day_plan JSONB DEFAULT '{}',
  training_recommendations JSONB DEFAULT '[]',
  manager_handoff_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'jobseeker_profiles'
AND column_name IN ('disability_context', 'self_reported_challenges');
