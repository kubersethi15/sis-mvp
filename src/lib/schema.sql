-- SIS Database Schema v1.0
-- Skills Intelligence System - Virtualahan Inc.
-- Supabase (PostgreSQL)
-- Covers all 3 gates + psychologist validation + Skills Passport output

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('jobseeker', 'recruiter', 'hiring_manager', 'final_approver', 'psychologist', 'admin');
CREATE TYPE gate_status AS ENUM ('pending', 'in_progress', 'passed', 'held', 'rerouted', 'stopped', 'more_evidence_requested');
CREATE TYPE application_status AS ENUM (
  'draft', 'applied', 'eligibility_pending', 'eligibility_failed',
  'gate1_pending', 'gate1_passed', 'gate1_held', 'gate1_rerouted', 'gate1_stopped',
  'gate2_pending', 'gate2_passed', 'gate2_held', 'gate2_more_evidence', 'gate2_stopped',
  'gate3_pending', 'gate3_passed', 'gate3_declined',
  'selected', 'not_selected', 'onboarding_active'
);
CREATE TYPE proficiency_level AS ENUM ('basic', 'intermediate', 'advanced');
CREATE TYPE evidence_strength AS ENUM ('weak', 'moderate', 'strong');
CREATE TYPE session_status AS ENUM ('active', 'completed', 'abandoned', 'paused');
CREATE TYPE moth_stage AS ENUM ('opening', 'story_select', 'elicitation', 'core_probe', 'skill_probe', 'verification', 'micro_story', 'closing');
CREATE TYPE validation_status AS ENUM ('pending', 'validated', 'rejected', 'revision_needed');

-- ============================================================
-- USERS & PROFILES
-- ============================================================

-- Base user table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'jobseeker',
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  language_preference TEXT DEFAULT 'en', -- en, fil, taglish
  accessibility_needs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMPLOYER SIDE
-- ============================================================

-- Employer Profile (one-time setup)
CREATE TABLE employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  industry TEXT,
  locations JSONB DEFAULT '[]',
  work_arrangements JSONB DEFAULT '{}', -- remote, onsite, hybrid options
  benefits_policy JSONB DEFAULT '{}',
  accessibility_info JSONB DEFAULT '{}',
  inclusion_statement TEXT,
  -- Default reviewers
  default_recruiter_id UUID REFERENCES user_profiles(id),
  default_hiring_manager_id UUID REFERENCES user_profiles(id),
  default_final_approver_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vacancy (job posting)
CREATE TABLE vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employer_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  jd_raw TEXT, -- original JD text uploaded by employer
  competency_blueprint JSONB DEFAULT '{}', -- AI-generated structured requirements
  essential_requirements JSONB DEFAULT '[]',
  trainable_requirements JSONB DEFAULT '[]',
  compensation_range JSONB DEFAULT '{}',
  benefits JSONB DEFAULT '[]',
  work_arrangement TEXT, -- remote, onsite, hybrid
  schedule_requirements JSONB DEFAULT '{}',
  location TEXT,
  -- Reviewers for this vacancy (override defaults)
  recruiter_id UUID REFERENCES user_profiles(id),
  hiring_manager_id UUID REFERENCES user_profiles(id),
  final_approver_id UUID REFERENCES user_profiles(id),
  status TEXT DEFAULT 'draft', -- draft, published, closed
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- JOBSEEKER SIDE
-- ============================================================

-- Jobseeker Profile (reusable across applications)
CREATE TABLE jobseeker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  -- Basic info
  disability_type TEXT,
  education JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  training JSONB DEFAULT '[]',
  work_history JSONB DEFAULT '[]',
  -- Skills & preferences
  skills_inventory JSONB DEFAULT '[]',
  career_goals TEXT,
  preferred_work_arrangement TEXT,
  preferred_schedule JSONB DEFAULT '{}',
  preferred_location TEXT,
  salary_expectations JSONB DEFAULT '{}',
  -- Evidence repository
  portfolio_items JSONB DEFAULT '[]',
  references JSONB DEFAULT '[]',
  -- Psychometric data (from Employment Accelerator)
  riasec_scores JSONB DEFAULT '{}',
  high5_strengths JSONB DEFAULT '[]',
  saboteur_scores JSONB DEFAULT '{}',
  -- Profile completeness
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPLICATION & GATES
-- ============================================================

-- Application (main transaction object)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id UUID NOT NULL REFERENCES vacancies(id),
  jobseeker_id UUID NOT NULL REFERENCES jobseeker_profiles(id),
  status application_status DEFAULT 'draft',
  current_gate INTEGER DEFAULT 0, -- 0=pre-gate, 1, 2, 3
  -- Timestamps
  applied_at TIMESTAMPTZ,
  gate1_started_at TIMESTAMPTZ,
  gate1_completed_at TIMESTAMPTZ,
  gate2_started_at TIMESTAMPTZ,
  gate2_completed_at TIMESTAMPTZ,
  gate3_started_at TIMESTAMPTZ,
  gate3_completed_at TIMESTAMPTZ,
  final_decision_at TIMESTAMPTZ,
  -- Final outcome
  final_outcome TEXT, -- selected, not_selected
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gate 1: Alignment Results
CREATE TABLE gate1_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  -- AI-generated
  alignment_score DECIMAL(5,2),
  competency_fit_map JSONB DEFAULT '{}',
  strengths JSONB DEFAULT '[]',
  gaps JSONB DEFAULT '[]',
  ai_recommendation TEXT,
  -- Recruiter decision
  reviewer_id UUID REFERENCES user_profiles(id),
  reviewer_decision gate_status,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gate 2: Evidence Results
CREATE TABLE gate2_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  -- Component A: Profile evidence summary
  profile_evidence_summary JSONB DEFAULT '{}',
  -- Component B: LEEE extraction results
  leee_session_id UUID, -- links to leee_sessions
  leee_skills_profile JSONB DEFAULT '{}',
  leee_evidence_map JSONB DEFAULT '[]',
  -- Combined
  role_specific_skills_profile JSONB DEFAULT '{}',
  evidence_rating evidence_strength,
  evidence_gaps JSONB DEFAULT '[]',
  ai_recommendation TEXT,
  -- Hiring Manager decision
  reviewer_id UUID REFERENCES user_profiles(id),
  reviewer_decision gate_status,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gate 3: Predictability Results
CREATE TABLE gate3_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  -- Simulation results
  simulation_results JSONB DEFAULT '{}',
  -- Interview results
  interview_results JSONB DEFAULT '{}',
  -- Combined
  readiness_index DECIMAL(5,2),
  success_conditions JSONB DEFAULT '[]',
  support_needs JSONB DEFAULT '[]',
  ai_recommendation TEXT,
  -- Final Approver decision
  reviewer_id UUID REFERENCES user_profiles(id),
  reviewer_decision gate_status,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEEE (Gate 2 Component B) — THE DEEP BUILD
-- ============================================================

-- LEEE Conversation Sessions
CREATE TABLE leee_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  jobseeker_id UUID REFERENCES jobseeker_profiles(id),
  application_id UUID REFERENCES applications(id), -- nullable for standalone sessions
  -- Session state
  status session_status DEFAULT 'active',
  current_stage moth_stage DEFAULT 'opening',
  stories_completed INTEGER DEFAULT 0,
  -- Language & accessibility
  language_used TEXT DEFAULT 'en',
  accessibility_mode JSONB DEFAULT '{}',
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  -- Skills tracking (mid-session)
  skills_evidenced JSONB DEFAULT '{}',
  skills_gaps JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEEE Conversation Messages
CREATE TABLE leee_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES leee_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'assistant' or 'user'
  content TEXT NOT NULL,
  -- Metadata
  moth_stage moth_stage,
  prompt_id TEXT, -- references Question Bank ID (e.g., F01, S11, P31)
  probe_type TEXT, -- F, S, E, C, A, D, O, M, R, X, V, G, Y
  turn_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEEE Extraction Results (per session)
CREATE TABLE leee_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES leee_sessions(id),
  -- Episodes
  episodes JSONB DEFAULT '[]',
  -- Skills profile
  skills_profile JSONB DEFAULT '[]',
  -- Evidence items
  evidence_map JSONB DEFAULT '[]',
  -- Narrative
  narrative_summary TEXT,
  -- Gaming
  gaming_flags JSONB DEFAULT '[]',
  -- Layer 2 seeds
  layer2_seeds JSONB DEFAULT '[]',
  -- Layer 3 recommendations
  layer3_recommendations JSONB DEFAULT '[]',
  -- Quality metrics
  session_quality JSONB DEFAULT '{}',
  -- Audit trail
  extraction_model TEXT, -- which LLM model was used
  extraction_prompt_version TEXT,
  raw_extraction_response JSONB, -- full LLM response for audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PSYCHOLOGIST VALIDATION (Post-Gate)
-- ============================================================

CREATE TABLE psychologist_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id),
  jobseeker_id UUID NOT NULL REFERENCES jobseeker_profiles(id),
  -- What they're validating
  skills_profile_snapshot JSONB NOT NULL, -- frozen copy of skills profile at validation time
  evidence_trail_snapshot JSONB NOT NULL, -- frozen copy of full audit trail
  -- Validation
  psychologist_id UUID NOT NULL REFERENCES user_profiles(id),
  validation_status validation_status DEFAULT 'pending',
  validation_notes TEXT,
  -- Professional endorsement
  license_number TEXT,
  signature_date TIMESTAMPTZ,
  methodology_references JSONB DEFAULT '[]', -- research publications cited
  -- Audit
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SKILLS TAXONOMY (PSF Reference Data)
-- ============================================================

CREATE TABLE skills_taxonomy (
  id TEXT PRIMARY KEY, -- e.g., SK1, SK2, etc.
  name TEXT NOT NULL,
  psf_code TEXT,
  psf_cluster TEXT, -- 'Interacting with Others', 'Thinking Critically', 'Staying Relevant'
  wef_cluster TEXT,
  compass_domain TEXT,
  priority TEXT DEFAULT 'primary', -- primary, secondary, tertiary
  description TEXT,
  -- Proficiency descriptors
  basic_descriptor TEXT,
  intermediate_descriptor TEXT,
  advanced_descriptor TEXT,
  -- Extraction metadata
  extractability TEXT, -- high, moderate, low
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FEEDBACK & ONBOARDING
-- ============================================================

CREATE TABLE feedback_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  candidate_summary TEXT,
  recommended_actions JSONB DEFAULT '[]',
  alternative_roles JSONB DEFAULT '[]',
  skills_to_strengthen JSONB DEFAULT '[]',
  learning_recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE onboarding_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  onboarding_checklist JSONB DEFAULT '[]',
  first_30_day_plan JSONB DEFAULT '{}',
  first_90_day_plan JSONB DEFAULT '{}',
  training_recommendations JSONB DEFAULT '[]',
  manager_handoff_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_applications_vacancy ON applications(vacancy_id);
CREATE INDEX idx_applications_jobseeker ON applications(jobseeker_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_leee_sessions_user ON leee_sessions(user_id);
CREATE INDEX idx_leee_sessions_application ON leee_sessions(application_id);
CREATE INDEX idx_leee_messages_session ON leee_messages(session_id);
CREATE INDEX idx_leee_messages_turn ON leee_messages(session_id, turn_number);
CREATE INDEX idx_gate1_application ON gate1_results(application_id);
CREATE INDEX idx_gate2_application ON gate2_results(application_id);
CREATE INDEX idx_gate3_application ON gate3_results(application_id);
CREATE INDEX idx_vacancies_employer ON vacancies(employer_id);
CREATE INDEX idx_validations_jobseeker ON psychologist_validations(jobseeker_id);

-- ============================================================
-- ROW LEVEL SECURITY (basic policies)
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobseeker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leee_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leee_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Jobseekers can only see their own data
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Jobseekers can view own jobseeker profile" ON jobseeker_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Jobseekers can view own sessions" ON leee_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Jobseekers can view own messages" ON leee_messages FOR SELECT USING (
  session_id IN (SELECT id FROM leee_sessions WHERE user_id = auth.uid())
);
