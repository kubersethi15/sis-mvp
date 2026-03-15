// SIS Type Definitions
// Mirrors the Supabase database schema

// ============================================================
// ENUMS
// ============================================================

export type UserRole = 'jobseeker' | 'recruiter' | 'hiring_manager' | 'final_approver' | 'psychologist' | 'admin';
export type GateStatus = 'pending' | 'in_progress' | 'passed' | 'held' | 'rerouted' | 'stopped' | 'more_evidence_requested';
export type ApplicationStatus =
  | 'draft' | 'applied' | 'eligibility_pending' | 'eligibility_failed'
  | 'gate1_pending' | 'gate1_passed' | 'gate1_held' | 'gate1_rerouted' | 'gate1_stopped'
  | 'gate2_pending' | 'gate2_passed' | 'gate2_held' | 'gate2_more_evidence' | 'gate2_stopped'
  | 'gate3_pending' | 'gate3_passed' | 'gate3_declined'
  | 'selected' | 'not_selected' | 'onboarding_active';
export type ProficiencyLevel = 'basic' | 'intermediate' | 'advanced';
export type EvidenceStrength = 'weak' | 'moderate' | 'strong';
export type SessionStatus = 'active' | 'completed' | 'abandoned' | 'paused';
export type MothStage = 'opening' | 'story_select' | 'elicitation' | 'core_probe' | 'skill_probe' | 'verification' | 'micro_story' | 'closing';
export type ValidationStatus = 'pending' | 'validated' | 'rejected' | 'revision_needed';

// ============================================================
// LEEE Types (Gate 2 Component B)
// ============================================================

export interface LEEEMessage {
  id: string;
  session_id: string;
  role: 'assistant' | 'user';
  content: string;
  moth_stage: MothStage;
  prompt_id?: string;
  probe_type?: string;
  turn_number: number;
  created_at: string;
}

export interface LEEESession {
  id: string;
  user_id: string;
  jobseeker_id?: string;
  application_id?: string;
  status: SessionStatus;
  current_stage: MothStage;
  stories_completed: number;
  language_used: string;
  accessibility_mode: Record<string, boolean>;
  started_at: string;
  ended_at?: string;
  duration_minutes?: number;
  skills_evidenced: Record<string, boolean>;
  skills_gaps: Record<string, boolean>;
}

export interface STAREResult {
  situation: string;
  task: string;
  action: string;
  result: string;
  emotion: string;
  reflection: string;
}

export interface Episode {
  episode_id: number;
  summary: string;
  star_er: STAREResult;
}

export interface SkillEvidence {
  episode_id: number;
  transcript_quote: string;
  behavioral_indicator: string;
  proficiency_justification: string;
}

export interface SkillScore {
  skill_id: string;
  skill_name: string;
  proficiency: ProficiencyLevel;
  confidence: number; // 0.0 - 1.0
  evidence: SkillEvidence[];
}

export interface GamingFlag {
  flag_type: 'rehearsed' | 'vague' | 'inconsistent' | 'buzzwords';
  severity: 'low' | 'medium' | 'high';
  evidence: string;
}

export interface Layer2Seed {
  scenario: string;
  target_skills: string[];
  source_gap: string;
}

export interface ExtractionResult {
  id: string;
  session_id: string;
  episodes: Episode[];
  skills_profile: SkillScore[];
  evidence_map: SkillEvidence[];
  narrative_summary: string;
  gaming_flags: GamingFlag[];
  layer2_seeds: Layer2Seed[];
  layer3_recommendations: string[];
  session_quality: {
    stories_completed: number;
    evidence_density: 'low' | 'medium' | 'high';
    user_engagement: 'low' | 'medium' | 'high';
    overall_confidence: number;
  };
  extraction_model: string;
  extraction_prompt_version: string;
  created_at: string;
}

export interface GapScanResult {
  EQ: boolean;
  COMM: boolean;
  COLLAB: boolean;
  PS: boolean;
  ADAPT: boolean;
  LEARN: boolean;
  EMPATHY: boolean;
  DIGITAL: boolean;
}

// ============================================================
// Orchestrator State
// ============================================================

export interface OrchestratorState {
  session: LEEESession;
  messages: LEEEMessage[];
  currentStage: MothStage;
  storiesCompleted: number;
  currentStoryTurnCount: number;
  gapScan: GapScanResult | null;
  suggestedPromptIds: string[];
  evidenceThresholdMet: boolean;
  userDistressLevel: 0 | 1 | 2 | 3;
  skills_gaps?: Record<string, boolean>;
}

// ============================================================
// Skills Taxonomy
// ============================================================

export interface Skill {
  id: string;
  name: string;
  psf_code: string;
  psf_cluster: string;
  wef_cluster?: string;
  compass_domain?: string;
  priority: 'primary' | 'secondary' | 'tertiary';
  description: string;
  basic_descriptor: string;
  intermediate_descriptor: string;
  advanced_descriptor: string;
  extractability: 'high' | 'moderate' | 'low';
}

// ============================================================
// Application & Gates
// ============================================================

export interface Application {
  id: string;
  vacancy_id: string;
  jobseeker_id: string;
  status: ApplicationStatus;
  current_gate: number;
  applied_at?: string;
  final_outcome?: string;
}

export interface Gate1Result {
  id: string;
  application_id: string;
  alignment_score: number;
  competency_fit_map: Record<string, any>;
  strengths: string[];
  gaps: string[];
  ai_recommendation: string;
  reviewer_decision?: GateStatus;
  reviewer_notes?: string;
}

export interface Gate2Result {
  id: string;
  application_id: string;
  profile_evidence_summary: Record<string, any>;
  leee_session_id?: string;
  leee_skills_profile: SkillScore[];
  role_specific_skills_profile: Record<string, any>;
  evidence_rating: EvidenceStrength;
  evidence_gaps: string[];
  ai_recommendation: string;
  reviewer_decision?: GateStatus;
  reviewer_notes?: string;
}

export interface Gate3Result {
  id: string;
  application_id: string;
  simulation_results: Record<string, any>;
  interview_results: Record<string, any>;
  readiness_index: number;
  success_conditions: string[];
  support_needs: string[];
  ai_recommendation: string;
  reviewer_decision?: GateStatus;
  reviewer_notes?: string;
}

export interface PsychologistValidation {
  id: string;
  application_id?: string;
  jobseeker_id: string;
  skills_profile_snapshot: SkillScore[];
  evidence_trail_snapshot: Record<string, any>;
  psychologist_id: string;
  validation_status: ValidationStatus;
  validation_notes?: string;
  license_number?: string;
  methodology_references: string[];
}
