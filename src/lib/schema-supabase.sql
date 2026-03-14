-- SIS MVP Schema for Supabase SQL Editor
-- Run this in: https://supabase.com/dashboard/project/ftdnpsrbnjkvazspmenv/sql
-- Version 1.0 - MVP (no auth dependency)

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
-- USER PROFILES (simplified for MVP - no auth dependency)
-- ============================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL DEFAULT 'jobseeker',
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  language_preference TEXT DEFAULT 'en',
  accessibility_needs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMPLOYER SIDE
-- ============================================================

CREATE TABLE employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  industry TEXT,
  locations JSONB DEFAULT '[]',
  work_arrangements JSONB DEFAULT '{}',
  benefits_policy JSONB DEFAULT '{}',
  accessibility_info JSONB DEFAULT '{}',
  inclusion_statement TEXT,
  default_recruiter_id UUID REFERENCES user_profiles(id),
  default_hiring_manager_id UUID REFERENCES user_profiles(id),
  default_final_approver_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES employer_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  jd_raw TEXT,
  competency_blueprint JSONB DEFAULT '{}',
  essential_requirements JSONB DEFAULT '[]',
  trainable_requirements JSONB DEFAULT '[]',
  compensation_range JSONB DEFAULT '{}',
  benefits JSONB DEFAULT '[]',
  work_arrangement TEXT,
  schedule_requirements JSONB DEFAULT '{}',
  location TEXT,
  recruiter_id UUID REFERENCES user_profiles(id),
  hiring_manager_id UUID REFERENCES user_profiles(id),
  final_approver_id UUID REFERENCES user_profiles(id),
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- JOBSEEKER SIDE
-- ============================================================

CREATE TABLE jobseeker_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  disability_type TEXT,
  education JSONB DEFAULT '[]',
  certifications JSONB DEFAULT '[]',
  training JSONB DEFAULT '[]',
  work_history JSONB DEFAULT '[]',
  skills_inventory JSONB DEFAULT '[]',
  career_goals TEXT,
  preferred_work_arrangement TEXT,
  preferred_schedule JSONB DEFAULT '{}',
  preferred_location TEXT,
  salary_expectations JSONB DEFAULT '{}',
  portfolio_items JSONB DEFAULT '[]',
  references JSONB DEFAULT '[]',
  riasec_scores JSONB DEFAULT '{}',
  high5_strengths JSONB DEFAULT '[]',
  saboteur_scores JSONB DEFAULT '{}',
  completion_percentage INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPLICATION & GATES
-- ============================================================

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id UUID NOT NULL REFERENCES vacancies(id),
  jobseeker_id UUID NOT NULL REFERENCES jobseeker_profiles(id),
  status application_status DEFAULT 'draft',
  current_gate INTEGER DEFAULT 0,
  applied_at TIMESTAMPTZ,
  gate1_started_at TIMESTAMPTZ,
  gate1_completed_at TIMESTAMPTZ,
  gate2_started_at TIMESTAMPTZ,
  gate2_completed_at TIMESTAMPTZ,
  gate3_started_at TIMESTAMPTZ,
  gate3_completed_at TIMESTAMPTZ,
  final_decision_at TIMESTAMPTZ,
  final_outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gate1_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  alignment_score DECIMAL(5,2),
  competency_fit_map JSONB DEFAULT '{}',
  strengths JSONB DEFAULT '[]',
  gaps JSONB DEFAULT '[]',
  ai_recommendation TEXT,
  reviewer_id UUID REFERENCES user_profiles(id),
  reviewer_decision gate_status,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gate2_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  profile_evidence_summary JSONB DEFAULT '{}',
  leee_session_id UUID,
  leee_skills_profile JSONB DEFAULT '{}',
  leee_evidence_map JSONB DEFAULT '[]',
  role_specific_skills_profile JSONB DEFAULT '{}',
  evidence_rating evidence_strength,
  evidence_gaps JSONB DEFAULT '[]',
  ai_recommendation TEXT,
  reviewer_id UUID REFERENCES user_profiles(id),
  reviewer_decision gate_status,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gate3_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  simulation_results JSONB DEFAULT '{}',
  interview_results JSONB DEFAULT '{}',
  readiness_index DECIMAL(5,2),
  success_conditions JSONB DEFAULT '[]',
  support_needs JSONB DEFAULT '[]',
  ai_recommendation TEXT,
  reviewer_id UUID REFERENCES user_profiles(id),
  reviewer_decision gate_status,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEEE (Gate 2 Component B) — THE CORE
-- ============================================================

CREATE TABLE leee_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id),
  jobseeker_id UUID REFERENCES jobseeker_profiles(id),
  application_id UUID REFERENCES applications(id),
  status session_status DEFAULT 'active',
  current_stage moth_stage DEFAULT 'opening',
  stories_completed INTEGER DEFAULT 0,
  language_used TEXT DEFAULT 'en',
  accessibility_mode JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  skills_evidenced JSONB DEFAULT '{}',
  skills_gaps JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leee_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES leee_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  moth_stage moth_stage,
  prompt_id TEXT,
  probe_type TEXT,
  turn_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leee_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES leee_sessions(id),
  episodes JSONB DEFAULT '[]',
  skills_profile JSONB DEFAULT '[]',
  evidence_map JSONB DEFAULT '[]',
  narrative_summary TEXT,
  gaming_flags JSONB DEFAULT '[]',
  layer2_seeds JSONB DEFAULT '[]',
  layer3_recommendations JSONB DEFAULT '[]',
  session_quality JSONB DEFAULT '{}',
  extraction_model TEXT,
  extraction_prompt_version TEXT,
  raw_extraction_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PSYCHOLOGIST VALIDATION
-- ============================================================

CREATE TABLE psychologist_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id),
  jobseeker_id UUID NOT NULL REFERENCES jobseeker_profiles(id),
  skills_profile_snapshot JSONB NOT NULL,
  evidence_trail_snapshot JSONB NOT NULL,
  psychologist_id UUID NOT NULL REFERENCES user_profiles(id),
  validation_status validation_status DEFAULT 'pending',
  validation_notes TEXT,
  license_number TEXT,
  signature_date TIMESTAMPTZ,
  methodology_references JSONB DEFAULT '[]',
  validated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SKILLS TAXONOMY
-- ============================================================

CREATE TABLE skills_taxonomy (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  psf_code TEXT,
  psf_cluster TEXT,
  wef_cluster TEXT,
  compass_domain TEXT,
  priority TEXT DEFAULT 'primary',
  description TEXT,
  basic_descriptor TEXT,
  intermediate_descriptor TEXT,
  advanced_descriptor TEXT,
  extractability TEXT,
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
-- SEED: PSF SKILLS TAXONOMY
-- ============================================================

INSERT INTO skills_taxonomy (id, name, psf_code, psf_cluster, wef_cluster, compass_domain, priority, description, basic_descriptor, intermediate_descriptor, advanced_descriptor, extractability) VALUES
('SK1', 'Emotional Intelligence', 'ESC-SRE-005 / ESC-IWO-006', 'Staying Relevant / Interacting with Others', 'Motivation & self-awareness; Resilience, flexibility & agility', 'Emotional Intelligence', 'primary', 'Self-awareness, emotional regulation, empathy toward others, motivation in the face of difficulty.', 'Describes awareness of own emotions. Mentions feeling something and responding to it. Basic empathy.', 'Actively manages emotions to achieve outcomes. Deliberate emotional regulation. Adjusts behavior based on others'' perspectives.', 'Creates conditions for others'' emotional wellbeing. Strategic use of emotional awareness. Deep self-reflection leading to sustained change.', 'high'),
('SK2', 'Communication', 'ESC-IWO-003', 'Interacting with Others', 'Speaking, writing & languages; Empathy & active listening', 'Communication', 'primary', 'Clarity of expression, active listening, adapting message to audience, persuasion, explaining complex ideas.', 'Describes sharing information with others. Mentions asking or telling someone something. Basic listening.', 'Adapts communication style to audience. Active listening with follow-up. Persuading, explaining complex ideas simply, mediating.', 'Designs communication strategies for groups. Influences through narrative. Creates environments where others communicate effectively.', 'high'),
('SK3', 'Collaboration', 'ESC-IWO-002', 'Interacting with Others', 'Empathy & active listening; Leadership & social influence', 'Collaboration', 'primary', 'Working with others, shared goal orientation, conflict resolution, trust-building, team coordination.', 'Describes working alongside others. Mentions helping or being helped. Follows group decisions.', 'Coordinates with others independently. Resolves disagreements. Builds trust. Adapts own role for team success.', 'Builds and leads teams. Creates collaborative structures. Manages complex stakeholder dynamics. Mentors others in teamwork.', 'high'),
('SK4', 'Problem-Solving', 'ESC-TCR-003 / ESC-TCR-001 / ESC-TCR-002', 'Thinking Critically', 'Creative thinking; Analytical thinking; Systems thinking', 'Problem-Solving', 'primary', 'Identifying problems, generating solutions, resourcefulness under constraints, decision-making under uncertainty.', 'Identifies a problem and applies a known solution. Follows established approaches with guidance.', 'Analyzes problems independently. Generates multiple solutions. Makes decisions under uncertainty. Adapts approach when first attempt fails.', 'Designs systems to prevent problems. Creates novel solutions. Leads others through complex problem-solving. Strategic resource allocation.', 'high'),
('SK5', 'Adaptability / Resilience', 'ESC-SRE-001', 'Staying Relevant', 'Resilience, flexibility & agility', NULL, 'secondary', 'Adjusting to sudden change, bouncing back from setbacks, maintaining effectiveness under shifting conditions.', 'Describes adjusting to a change in a familiar context with support from others.', 'Independently adapts to unfamiliar or changing situations. Recovers from setbacks and applies learning.', 'Leads others through change. Creates adaptive systems. Transforms setbacks into strategic advantages.', 'high'),
('SK6', 'Learning Agility', 'ESC-SRE-004', 'Staying Relevant', 'Curiosity & lifelong learning', NULL, 'secondary', 'Picking up new skills quickly, learning from mistakes, teaching others what you''ve learned.', 'Describes learning something new in a structured setting with guidance.', 'Self-directs learning. Applies lessons from one context to another. Teaches or coaches others.', 'Creates learning systems. Identifies organizational knowledge gaps. Drives continuous improvement culture.', 'moderate'),
('SK7', 'Sense Making', 'ESC-TCR-004', 'Thinking Critically', 'Analytical thinking; Systems thinking', NULL, 'secondary', 'Making sense of complex or ambiguous information, identifying patterns, connecting disparate ideas.', 'Organizes and interprets information to identify basic relationships.', 'Analyzes data to uncover patterns and opportunities across contexts.', 'Evaluates complex patterns and trends to generate strategic insights for groups.', 'moderate'),
('SK8', 'Building Inclusivity', 'ESC-IWO-001', 'Interacting with Others', 'Empathy & active listening', NULL, 'secondary', 'Including marginalized perspectives, accommodating differences, creating environments where everyone can contribute.', 'Acknowledges differences and treats others with respect.', 'Actively includes diverse perspectives. Adapts processes to accommodate different needs.', 'Designs inclusive systems and culture. Advocates for structural change. Mentors others in inclusive practices.', 'moderate');
