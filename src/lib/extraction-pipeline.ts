// ============================================================
// LEEE 5-STAGE EXTRACTION PIPELINE
// Source: Ryan Gersava — "The Brain Behind the Brain" (March 2026)
// Architecture: Ryan (scoring philosophy, PSF alignment) + Kuber (implementation)
//
// The extraction engine runs as a post-conversation pipeline with 5 stages.
// Each stage is a separate Claude API call with its own prompt and output schema.
// The output of each stage feeds the next.
//
// Transcript → [Stage 1: Segmentation] → Episodes
//          → [Stage 2: STAR+E+R Extraction] → Evidence Items
//          → [Stage 3: Skill Mapping] → Skill-Evidence Links
//          → [Stage 4: Consistency Check] → Validated Evidence
//          → [Stage 5: Proficiency Scoring] → Skills Profile
// ============================================================

// ============================================================
// STAGE 1: NARRATIVE SEGMENTATION
// ============================================================

export const STAGE_1_SEGMENTATION = `You are a narrative analysis engine. Your task is to segment a conversation transcript into discrete EPISODES.

An episode is a self-contained story unit where the speaker describes:
- A specific situation they were in (when, where, who, what was happening)
- Actions they took or decisions they made
- What happened as a result

SEGMENTATION RULES:
1. Only segment the JOBSEEKER's contributions. Ignore the interviewer's questions (they are context, not content).
2. An episode starts when the jobseeker begins describing a new situation and ends when they move to a different situation or return to general commentary.
3. A single story may contain multiple episodes if the jobseeker describes distinct phases or events within it.
4. General statements, opinions, and self-assessments that are NOT grounded in a specific situation are tagged as COMMENTARY, not episodes. Commentary is useful context but does not produce behavioral evidence.
5. If the jobseeker code-switches between English, Filipino, and Taglish within an episode, keep the episode intact — do not split on language changes.
6. Preserve the EXACT original text. Do not paraphrase, translate, or clean up language.

OUTPUT FORMAT — respond with ONLY this JSON array, no other text:
[
  {
    "episode_id": "EP01",
    "start_message_index": 5,
    "end_message_index": 12,
    "transcript_excerpt": "[exact text from transcript]",
    "episode_summary": "[1-2 sentence summary of what happened]",
    "type": "episode",
    "story_number": 1,
    "language_detected": "english",
    "emotional_intensity": "low",
    "specificity_level": "specific"
  }
]

TYPE: "episode" for story units grounded in a specific situation, "commentary" for general statements/opinions.

SPECIFICITY SCORING:
- "vague": No specific time, place, or people. Hypothetical or generic ("I usually..." / "I always...").
- "moderate": Some grounding but missing key details. ("Last year at work, there was a problem and I solved it.")
- "specific": Clear time, place, people, sequence of events. ("In March, when our branch in Tuguegarao lost power during the payday rush, I called the generator company while my supervisor handled the queue...")

Only episodes rated "moderate" or "specific" should proceed to Stage 2. "Vague" episodes produce unreliable evidence.

TRANSCRIPT TO SEGMENT:
{transcript}`;

// ============================================================
// STAGE 2: STAR+E+R BEHAVIORAL EVIDENCE EXTRACTION
// ============================================================

export const STAGE_2_STAR_ER = `You are a behavioral evidence extraction engine. Your task is to analyze narrative episodes and extract structured STAR+E+R evidence items.

INPUT: A JSON array of episodes from Stage 1 (only those with specificity_level "moderate" or "specific").

THE STAR+E+R FRAMEWORK:
- S (Situation): Context, environment, constraints — what was happening
- T (Task): The person's role, responsibility, or challenge
- A (Action): What the person SPECIFICALLY DID — steps taken, decisions made, words said
- R (Result): What happened because of their action — the outcome
- E (Effect): Broader impact beyond immediate result — how it affected others, team, community
- R (Replication): Transfer and learning — did they apply this elsewhere, would they do it differently

EXTRACTION RULES:

1. EXTRACT ONLY WHAT IS EXPLICITLY STATED OR CLEARLY IMPLIED.
   Do NOT infer actions that aren't described. Do NOT fill gaps with assumptions.
   If the Situation is described but the Action is vague, extract what exists and flag the gap.

2. PRIORITIZE ACTION OVER SELF-DESCRIPTION.
   "I'm a good problem solver" is self-description — NOT evidence.
   "I called three suppliers, compared their prices, and chose the one that could deliver by Friday" IS evidence.

3. PRESERVE ORIGINAL LANGUAGE.
   Capture transcript quotes EXACTLY as spoken, including Taglish, grammatical variations, and colloquialisms.

4. ONE EVIDENCE ITEM PER DISTINCT ACTION-OUTCOME CHAIN.
   If a single episode contains two separate actions with two separate outcomes, create two evidence items.

5. TAG EVIDENCE QUALITY:
   - "behavioral": Describes specific observable action the person took. HIGHEST value.
   - "situational": Describes the situation well but action is vague. MODERATE value.
   - "self_descriptive": Person describes a trait or tendency without specific example. LOWEST value.
   - "outcome_focused": Describes what happened but not what the person did to cause it. MODERATE value.

6. FLAG ANTI-GAMING SIGNALS:
   - "too_linear": Story follows a perfect arc with no complications.
   - "no_failure": Person describes only success, no setbacks or difficulties.
   - "external_attribution": Person credits all outcomes to luck, others, or circumstance.
   - "self_deprecation": Person minimizes clearly competent action. Flag — extraction should score the ACTION, not the self-assessment.
   - "rehearsed": Language sounds scripted or uses corporate buzzwords incongruent with their profile.

SITUATIONAL COMPLEXITY:
- "simple": Routine, clear procedures, low stakes, familiar environment.
- "moderate": Non-routine but manageable. Some ambiguity. Moderate stakes.
- "complex": High ambiguity, multiple stakeholders, significant stakes, novel situation, resource constraints, emotional intensity.

ACTION INDEPENDENCE:
- "guided": Person followed instructions or procedures set by others.
- "independent": Person decided and acted on their own judgment.
- "leading": Person directed others, set strategy, or created new approaches.

OUTPUT FORMAT — respond with ONLY this JSON array, no other text:
[
  {
    "evidence_id": "EV01",
    "episode_id": "EP01",
    "transcript_quote": "[exact quote]",
    "star_er": {
      "situation": "[extracted]",
      "task": "[extracted]",
      "action": "[extracted — the CORE behavioral evidence]",
      "result": "[extracted]",
      "effect": "[extracted or null]",
      "replication": "[extracted or null]"
    },
    "evidence_quality": "behavioral",
    "anti_gaming_flags": [],
    "self_deprecation_detected": false,
    "completeness": {
      "situation": true, "task": true, "action": true,
      "result": true, "effect": false, "replication": false
    },
    "situational_complexity": "moderate",
    "action_independence": "independent"
  }
]

EPISODES TO ANALYZE:
{episodes}`;

// ============================================================
// STAGE 3: SKILL MAPPING TO PSF ENABLING SKILLS
// ============================================================

export const STAGE_3_SKILL_MAPPING = `You are a skills mapping engine. Your task is to map behavioral evidence items to the Philippine Skills Framework (PSF) Enabling Skills and Competencies.

INPUT: A JSON array of evidence items from Stage 2.

THE 16 PSF ENABLING SKILLS:

Interacting with Others (IWO):
1. Building Inclusivity — Foster inclusive environments, embrace diversity, ensure equity
2. Collaboration — Manage relationships, work effectively with others toward shared goals
3. Communication — Convey and exchange thoughts, ideas, and information effectively
4. Customer Orientation — Identify customer needs, deliver effective customer experience
5. Developing People — Empower others to learn and develop capabilities
6. Influence — Influence behaviors, beliefs, or attitudes to achieve desired outcomes

Staying Relevant and Evolving (SRE):
7. Adaptability — Exercise flexibility in response to changes and evolving contexts
8. Digital Fluency — Leverage digital technology across work processes
9. Global Perspective — Operate in cross-cultural environments with global awareness
10. Learning Agility — Deploy different learning approaches for continuous development
11. Self-Management — Manage own well-being, learning, and professional development

Generating Results (GR):
12. Creative Thinking — Adopt curious mindset, create different ideas and solutions
13. Decision Making — Choose course of action from options to achieve desired outcomes
14. Problem Solving — Generate effective and efficient solutions to challenges
15. Sense Making — Gather and synthesize information to identify patterns and insights
16. Transdisciplinary Thinking — Apply knowledge across different contexts

MAPPING RULES:

1. EVERY MAPPING MUST CITE A SPECIFIC TRANSCRIPT QUOTE.
   No quote = no mapping. This is the psychologist's audit requirement.

2. MAP TO THE ACTION, NOT THE SITUATION.
   A difficult situation doesn't prove Problem Solving. What the person DID does.

3. ONE EVIDENCE ITEM CAN MAP TO MULTIPLE SKILLS (maximum 3).
   Be conservative — don't map to skills that are only tangentially connected.

4. CONFIDENCE SCORING (0.0 to 1.0):
   - 0.9-1.0: Clear, specific behavioral evidence directly matching the skill definition.
   - 0.7-0.89: Strong evidence but slightly indirect or missing one element.
   - 0.5-0.69: Moderate evidence. Skill is plausible but requires some inference.
   - 0.3-0.49: Weak evidence. Connection is tenuous. Should not be a primary claim.
   - Below 0.3: Do not map.

5. EVIDENCE QUALITY AFFECTS CONFIDENCE CEILING:
   - "behavioral" → no ceiling
   - "situational" → capped at 0.7
   - "self_descriptive" → capped at 0.4
   - "outcome_focused" → capped at 0.6

6. SELF-DEPRECATION OVERRIDE:
   If self_deprecation_detected = true, ignore the person's self-assessment and map based on the DESCRIBED ACTION.

7. DISABILITY-EXPERIENCE UPLIFT:
   If the action involves navigating inaccessible systems, self-advocating, managing health alongside work, supporting other PWDs, or creating workarounds for limitations — apply +0.1 confidence bonus (capped at 1.0).

OUTPUT FORMAT — respond with ONLY this JSON array, no other text:
[
  {
    "mapping_id": "MAP01",
    "evidence_id": "EV01",
    "skill_name": "Problem Solving",
    "skill_category": "primary",
    "transcript_quote": "[exact quote supporting this mapping]",
    "mapping_rationale": "[1-2 sentence explanation]",
    "confidence": 0.82,
    "confidence_factors": {
      "evidence_quality_type": "behavioral",
      "specificity_level": "specific",
      "action_independence": "independent",
      "situational_complexity": "moderate",
      "disability_uplift_applied": false,
      "self_deprecation_override_applied": false
    }
  }
]

VACANCY CONTEXT (weight these skills higher in mapping priority):
{vacancy_skills}

EVIDENCE ITEMS TO MAP:
{evidence}`;

// ============================================================
// STAGE 4: CROSS-REFERENCING AND CONSISTENCY CHECK
// ============================================================

export const STAGE_4_CONSISTENCY = `You are a quality assurance engine for skills evidence. Your task is to validate skill-evidence mappings for consistency, reliability, and audit-readiness.

INPUT: The complete set of mappings from Stage 3, along with the original evidence items from Stage 2.

VALIDATION CHECKS:

1. SINGLE-SOURCE PENALTY:
   If a skill has only ONE evidence item supporting it across the ENTIRE session, apply a -0.15 confidence penalty.
   Rationale: A single data point is insufficient for reliable proficiency assessment.

2. CONTRADICTION CHECK:
   If two evidence items for the SAME skill show contradictory behaviors, flag both as "contradicted" and reduce confidence by -0.2.

3. CROSS-STORY REINFORCEMENT:
   If the SAME skill is evidenced across MULTIPLE stories (different story_numbers), apply a +0.1 confidence bonus. Cross-story consistency is the strongest reliability signal.

4. ANTI-GAMING REVIEW:
   - "too_linear" + "no_failure" together → apply -0.1 to all mappings from that episode
   - "rehearsed" → apply -0.15 to all mappings from that episode
   - "external_attribution" alone → no penalty (may be cultural — pakikisama/utang na loob)
   - "self_deprecation" → no penalty (handled by the override rule)

5. EVIDENCE SUFFICIENCY per skill:
   - "strong": 2+ behavioral evidence items, confidence > 0.7, cross-story reinforcement
   - "adequate": 1 behavioral + 1 other type, confidence > 0.5
   - "weak": 1 evidence item only, or all confidence < 0.5
   - "insufficient": no evidence items, or all items are self_descriptive

OUTPUT FORMAT — respond with ONLY this JSON, no other text:
{
  "validated_mappings": [
    {
      "mapping_id": "MAP01",
      "original_confidence": 0.82,
      "adjustments": [
        {"type": "cross_story_reinforcement", "value": 0.1}
      ],
      "adjusted_confidence": 0.92,
      "validation_status": "validated",
      "validation_notes": ""
    }
  ],
  "skill_sufficiency_summary": {
    "Problem Solving": "strong",
    "Communication": "adequate"
  },
  "anti_gaming_summary": "No flags detected. Stories contain genuine complications."
}

MAPPINGS TO VALIDATE:
{mappings}

EVIDENCE ITEMS (for cross-reference):
{evidence}`;

// ============================================================
// STAGE 5: PROFICIENCY SCORING AND OUTPUT ASSEMBLY
// ============================================================

export const STAGE_5_PROFICIENCY = `You are a proficiency scoring engine. Assign PSF-aligned proficiency levels to skills based on validated behavioral evidence and assemble the final Skills Profile.

PROFICIENCY DEFINITIONS:

BASIC:
- Situations: Simple, routine, familiar with clear procedures
- Actions: Follows guidelines, implements known solutions, reports to others
- Independence: Guided by others or established procedures
- Requires: at least 1 behavioral evidence item, situational_complexity simple OR action_independence guided, adjusted_confidence >= 0.5

INTERMEDIATE:
- Situations: Moderate complexity, some ambiguity, non-routine
- Actions: Analyzes options, adapts approaches, makes independent judgments
- Independence: Acts on own judgment, coordinates with others
- Requires: at least 1 behavioral evidence item, situational_complexity >= moderate AND action_independence >= independent, adjusted_confidence >= 0.65, sufficiency >= adequate

ADVANCED:
- Situations: High complexity, significant ambiguity, novel, multiple stakeholders, high stakes
- Actions: Anticipates problems, designs systems, leads others, creates new approaches
- Independence: Sets direction, establishes strategies
- Requires: at least 2 behavioral evidence items, at least 1 with complexity complex AND independence leading, adjusted_confidence >= 0.8, sufficiency strong

SCORING RULES:

1. PROFICIENCY IS DETERMINED BY THE HIGHEST-QUALITY EVIDENCE, NOT THE AVERAGE.
   If someone shows Intermediate in one episode and Basic in another, score Intermediate.

2. PROFICIENCY CEILING FROM SIMPLE SITUATIONS:
   If ALL evidence for a skill comes from "simple" situations → cap at Basic.

3. VACANCY-WEIGHTED PRESENTATION:
   Highlight vacancy-aligned skills FIRST, then additional skills, then "not assessed."

4. "NOT ASSESSED" IS HONEST:
   If a skill has insufficient evidence, report it as "not_assessed" — NOT "low." The LEEE captures a 12-18 minute window. Many real skills simply didn't come up.

5. SELF-DEPRECATION TRANSPARENCY:
   If the self_deprecation_override was applied, note it in psychologist_review_flags.

6. NARRATIVE SUMMARY:
   Write a hiring_manager_summary in warm professional tone. This reads like a peer recommendation from someone who watched the person work.

OUTPUT FORMAT — respond with ONLY this JSON, no other text:
{
  "vacancy_aligned_skills": [
    {
      "skill_name": "Problem Solving",
      "proficiency": "INTERMEDIATE",
      "evidence_count": 3,
      "sufficiency": "strong",
      "top_evidence": {
        "transcript_quote": "[strongest quote]",
        "mapping_rationale": "[why this demonstrates the proficiency level]",
        "adjusted_confidence": 0.85
      },
      "supporting_evidence": [],
      "proficiency_justification": "[why this level, referencing the behavioral signals]"
    }
  ],
  "additional_skills_evidenced": [],
  "skills_not_assessed": ["Digital Fluency", "Global Perspective"],
  "session_metadata": {
    "stories_completed": 2,
    "total_evidence_items": 8,
    "behavioral_evidence_count": 6,
    "session_duration_minutes": 14.5,
    "languages_used": ["taglish"],
    "anti_gaming_flags_total": 0,
    "self_deprecation_overrides": 0,
    "disability_uplift_applied": 0
  },
  "psychologist_review_flags": [],
  "hiring_manager_summary": "[2-3 sentence summary for the Gate 2 dashboard]",
  "audit_trail": {
    "stage_1_episodes": 4,
    "stage_2_evidence_items": 8,
    "stage_3_mappings": 14,
    "stage_4_adjustments": 5,
    "stage_5_proficiency_scores": 7
  }
}

VACANCY SKILLS (highlight these first):
{vacancy_skills}

VALIDATED MAPPINGS:
{validated_mappings}

SKILL SUFFICIENCY SUMMARY:
{sufficiency}

EVIDENCE ITEMS (for quote access):
{evidence}

EPISODES (for story count):
{episodes}`;


// ============================================================
// PIPELINE ORCHESTRATOR — chains all 5 stages
// ============================================================

interface PipelineResult {
  success: boolean;
  stages: {
    stage1_episodes: any[] | null;
    stage2_evidence: any[] | null;
    stage3_mappings: any[] | null;
    stage4_validated: any | null;
    stage5_profile: any | null;
  };
  final_profile: any | null;
  error?: string;
  timing: { [key: string]: number };
}

// Model selection: Opus for judgment-heavy stages (2,3,5), Sonnet for rule-following stages (1,4)
const STAGE_MODELS: Record<string, string> = {
  'Stage 1: Segmentation': 'claude-sonnet-4-20250514',     // Rule-following — Sonnet is fine
  'Stage 2: STAR+E+R': 'claude-opus-4-5',                  // Nuanced evidence extraction — Opus
  'Stage 3: Skill Mapping': 'claude-opus-4-5',              // Complex judgment — Opus
  'Stage 4: Consistency': 'claude-sonnet-4-20250514',       // Rule-following — Sonnet is fine
  'Stage 5: Proficiency': 'claude-opus-4-5',                // Holistic scoring + summary — Opus
  // Lightweight mode uses Sonnet for speed
  'Lightweight S1': 'claude-sonnet-4-20250514',
  'Lightweight S2': 'claude-sonnet-4-20250514',
  'Lightweight S3': 'claude-sonnet-4-20250514',
};

async function callClaudeForStage(
  prompt: string,
  stageName: string,
  maxTokens: number = 4000
): Promise<any> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const model = STAGE_MODELS[stageName] || 'claude-sonnet-4-20250514';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error in ${stageName}: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';

  // Parse JSON from response — handle markdown fences
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

export async function runExtractionPipeline(
  transcript: string,
  vacancySkills: string[] = [],
  sessionDurationMinutes: number = 15
): Promise<PipelineResult> {
  const timing: { [key: string]: number } = {};
  const stages: PipelineResult['stages'] = {
    stage1_episodes: null,
    stage2_evidence: null,
    stage3_mappings: null,
    stage4_validated: null,
    stage5_profile: null,
  };

  try {
    // ── STAGE 1: Segmentation ──
    let t0 = Date.now();
    const s1Prompt = STAGE_1_SEGMENTATION.replace('{transcript}', transcript);
    const episodes: any[] = await callClaudeForStage(s1Prompt, 'Stage 1: Segmentation', 3000);
    stages.stage1_episodes = episodes;
    timing.stage1_ms = Date.now() - t0;

    // Filter to moderate/specific episodes only
    const qualifiedEpisodes = episodes.filter(
      (ep: any) => ep.type === 'episode' && ep.specificity_level !== 'vague'
    );

    if (qualifiedEpisodes.length === 0) {
      return {
        success: false,
        stages,
        final_profile: null,
        error: 'No episodes with sufficient specificity found in transcript.',
        timing,
      };
    }

    // ── STAGE 2: STAR+E+R Extraction ──
    t0 = Date.now();
    const s2Prompt = STAGE_2_STAR_ER.replace('{episodes}', JSON.stringify(qualifiedEpisodes, null, 2));
    const evidence: any[] = await callClaudeForStage(s2Prompt, 'Stage 2: STAR+E+R', 4000);
    stages.stage2_evidence = evidence;
    timing.stage2_ms = Date.now() - t0;

    // ── STAGE 3: Skill Mapping ──
    t0 = Date.now();
    const vacancyStr = vacancySkills.length
      ? vacancySkills.join(', ')
      : 'No specific vacancy — map all skills evidenced.';
    const s3Prompt = STAGE_3_SKILL_MAPPING
      .replace('{evidence}', JSON.stringify(evidence, null, 2))
      .replace('{vacancy_skills}', vacancyStr);
    const mappings: any[] = await callClaudeForStage(s3Prompt, 'Stage 3: Skill Mapping', 4000);
    stages.stage3_mappings = mappings;
    timing.stage3_ms = Date.now() - t0;

    // ── STAGE 4: Consistency Check ──
    t0 = Date.now();
    const s4Prompt = STAGE_4_CONSISTENCY
      .replace('{mappings}', JSON.stringify(mappings, null, 2))
      .replace('{evidence}', JSON.stringify(evidence, null, 2));
    const validated: any = await callClaudeForStage(s4Prompt, 'Stage 4: Consistency', 3000);
    stages.stage4_validated = validated;
    timing.stage4_ms = Date.now() - t0;

    // ── STAGE 5: Proficiency Scoring ──
    t0 = Date.now();
    const s5Prompt = STAGE_5_PROFICIENCY
      .replace('{validated_mappings}', JSON.stringify(validated.validated_mappings, null, 2))
      .replace('{sufficiency}', JSON.stringify(validated.skill_sufficiency_summary, null, 2))
      .replace('{evidence}', JSON.stringify(evidence, null, 2))
      .replace('{episodes}', JSON.stringify(qualifiedEpisodes, null, 2))
      .replace('{vacancy_skills}', vacancyStr);
    const profile: any = await callClaudeForStage(s5Prompt, 'Stage 5: Proficiency', 4000);

    // Inject session metadata
    profile.session_metadata = {
      ...profile.session_metadata,
      session_duration_minutes: sessionDurationMinutes,
    };

    stages.stage5_profile = profile;
    timing.stage5_ms = Date.now() - t0;
    timing.total_ms = Object.values(timing).reduce((a, b) => a + b, 0);

    return {
      success: true,
      stages,
      final_profile: profile,
      timing,
    };
  } catch (err: any) {
    return {
      success: false,
      stages,
      final_profile: null,
      error: err.message,
      timing,
    };
  }
}

// ── Lightweight mode: Stages 1-3 only (for mid-session bridge updates) ──
export async function runLightweightExtraction(
  transcript: string,
  vacancySkills: string[] = []
): Promise<{ episodes: any[]; evidence: any[]; mappings: any[]; error?: string }> {
  try {
    const s1Prompt = STAGE_1_SEGMENTATION.replace('{transcript}', transcript);
    const episodes = await callClaudeForStage(s1Prompt, 'Lightweight S1', 2000);
    const qualified = episodes.filter((ep: any) => ep.type === 'episode' && ep.specificity_level !== 'vague');

    if (qualified.length === 0) return { episodes, evidence: [], mappings: [] };

    const s2Prompt = STAGE_2_STAR_ER.replace('{episodes}', JSON.stringify(qualified, null, 2));
    const evidence = await callClaudeForStage(s2Prompt, 'Lightweight S2', 3000);

    const vacancyStr = vacancySkills.length ? vacancySkills.join(', ') : 'Map all skills evidenced.';
    const s3Prompt = STAGE_3_SKILL_MAPPING
      .replace('{evidence}', JSON.stringify(evidence, null, 2))
      .replace('{vacancy_skills}', vacancyStr);
    const mappings = await callClaudeForStage(s3Prompt, 'Lightweight S3', 3000);

    return { episodes: qualified, evidence, mappings };
  } catch (err: any) {
    return { episodes: [], evidence: [], mappings: [], error: err.message };
  }
}
