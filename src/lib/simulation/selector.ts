// Kaya Layer 2: Scenario Selector
// Reads layer2_seeds from Layer 1 extraction and selects the optimal scenario.
//
// Key principle: Layer 2 does NOT repeat what Layer 1 already confirmed.
// It targets gaps, untested skills, and convergence verification.

import { callLLM } from '@/lib/llm';
import { ScenarioConfig, CharacterProfile } from './engine';
import { customerEscalationScenario } from '../scenarios/customer-escalation';

// ============================================================
// TYPES
// ============================================================

export interface Layer1Profile {
  skills_profile: {
    skill_name: string;
    proficiency: string; // "Basic" | "Intermediate" | "Advanced"
    confidence: number;
  }[];
  layer2_seeds: {
    scenario: string;
    target_skills: string[];
    source_gap: string;
  }[];
  session_quality: {
    stories_completed: number;
    evidence_density: string;
    overall_confidence: number;
  };
  gaming_flags: {
    type: string;
    severity: string;
  }[];
}

export interface EmployerContext {
  job_title: string;
  job_description: string;
  competency_blueprint: Record<string, any>;
  company_name?: string;
  industry?: string;
}

export interface SimulationPlan {
  selected_scenario: ScenarioConfig;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  focus_skills: string[]; // skills Layer 2 should prioritize assessing
  skip_skills: string[]; // skills already well-evidenced in Layer 1
  rationale: string; // why this scenario was chosen
}

// ============================================================
// SCENARIO REGISTRY
// ============================================================

// Available scenario templates. Each targets different skill combinations.
// As we build more scenarios, they register here.
const SCENARIO_REGISTRY: {
  id: string;
  scenario: ScenarioConfig;
  primary_skills: string[];
  secondary_skills: string[];
  difficulty_adaptable: boolean;
}[] = [
  {
    id: 'customer_escalation',
    scenario: customerEscalationScenario,
    primary_skills: ['Communication', 'Emotional Intelligence', 'Problem-Solving'],
    secondary_skills: ['Customer Service', 'Adaptability', 'Self-Management'],
    difficulty_adaptable: true,
  },
  // Scenario 2 and 3 will register here when built
];

// ============================================================
// SCENARIO SELECTION LOGIC
// ============================================================

export function selectScenario(
  layer1Profile: Layer1Profile,
  employerContext: EmployerContext
): SimulationPlan {
  const seeds = layer1Profile.layer2_seeds || [];
  const skills = layer1Profile.skills_profile || [];

  // 1. Identify skill gaps — what Layer 1 DIDN'T evidence well
  const wellEvidenced = skills
    .filter(s => s.confidence >= 0.7)
    .map(s => s.skill_name);

  const weakOrMissing = skills
    .filter(s => s.confidence < 0.5)
    .map(s => s.skill_name);

  // Skills that Layer 1 found at Intermediate+ but we want to verify
  const toVerify = skills
    .filter(s => s.confidence >= 0.5 && s.confidence < 0.7)
    .map(s => s.skill_name);

  // 2. Combine with explicit seeds from Layer 1
  const seedSkills = seeds.flatMap(s => s.target_skills);
  const focusSkills = Array.from(new Set([...weakOrMissing, ...seedSkills, ...toVerify]));

  // 3. Score each scenario by how well it covers the focus skills
  let bestMatch: typeof SCENARIO_REGISTRY[0] | null = null;
  let bestScore = -1;

  for (const entry of SCENARIO_REGISTRY) {
    const allScenarioSkills = [...entry.primary_skills, ...entry.secondary_skills];
    const overlap = focusSkills.filter(s => allScenarioSkills.includes(s)).length;
    // Bonus for primary skill overlap (more weight)
    const primaryOverlap = focusSkills.filter(s => entry.primary_skills.includes(s)).length;
    const score = overlap + primaryOverlap * 0.5;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  // Fallback to first scenario if no good match
  if (!bestMatch) bestMatch = SCENARIO_REGISTRY[0];

  // 4. Determine adaptive difficulty
  const avgProficiency = skills.reduce((sum, s) => {
    return sum + (s.proficiency === 'Advanced' ? 3 : s.proficiency === 'Intermediate' ? 2 : 1);
  }, 0) / Math.max(skills.length, 1);

  let difficulty: 'basic' | 'intermediate' | 'advanced' = 'intermediate';
  if (avgProficiency < 1.5) difficulty = 'basic';
  else if (avgProficiency > 2.3) difficulty = 'advanced';

  // 5. Check gaming flags — high gaming risk → harder scenario
  const hasGamingFlags = layer1Profile.gaming_flags?.some(f => f.severity === 'medium' || f.severity === 'high');
  if (hasGamingFlags && difficulty !== 'advanced') {
    difficulty = 'advanced'; // Push harder to surface authentic responses
  }

  // 6. Build rationale
  const rationale = buildRationale(focusSkills, wellEvidenced, seeds, difficulty, hasGamingFlags, bestMatch.id);

  return {
    selected_scenario: bestMatch.scenario,
    difficulty,
    focus_skills: focusSkills,
    skip_skills: wellEvidenced,
    rationale,
  };
}

function buildRationale(
  focusSkills: string[],
  skipSkills: string[],
  seeds: Layer1Profile['layer2_seeds'],
  difficulty: string,
  hasGamingFlags: boolean,
  scenarioId: string
): string {
  const parts: string[] = [];

  if (focusSkills.length > 0) {
    parts.push(`Focusing on: ${focusSkills.join(', ')} (weak or unverified in Layer 1).`);
  }
  if (skipSkills.length > 0) {
    parts.push(`Already well-evidenced (won't re-test): ${skipSkills.join(', ')}.`);
  }
  if (seeds.length > 0) {
    parts.push(`Layer 1 specifically recommended: ${seeds.map(s => s.scenario).join('; ')}.`);
  }
  parts.push(`Difficulty: ${difficulty}${hasGamingFlags ? ' (elevated due to gaming flags in Layer 1)' : ''}.`);
  parts.push(`Selected scenario: ${scenarioId}.`);

  return parts.join(' ');
}

// ============================================================
// ADAPTIVE DIFFICULTY MODIFIER
// ============================================================
// Modifies a scenario's complexity based on the candidate's Layer 1 level.

export const DIFFICULTY_MODIFIERS = {
  basic: {
    description: 'Straightforward situation with clear constraints. One main challenge at a time.',
    character_behavior: 'Characters are more patient. Escalation is slower. Hints are available.',
    twist_intensity: 'Mild — one small complication, not overwhelming',
    round_count_modifier: -1, // slightly shorter
    checkpoint_focus: 'Can the candidate handle a simple version of this skill?',
  },
  intermediate: {
    description: 'Ambiguous situation with multiple stakeholders. Trade-offs required.',
    character_behavior: 'Characters have competing agendas. No clear right answer.',
    twist_intensity: 'Moderate — real pressure but recoverable',
    round_count_modifier: 0,
    checkpoint_focus: 'Does the candidate make deliberate choices and adapt?',
  },
  advanced: {
    description: 'Systemic problem requiring leadership across multiple moving parts.',
    character_behavior: 'Characters are stressed, conflicting, time-pressured. Multiple simultaneous demands.',
    twist_intensity: 'High — multiple complications, rapid escalation, no easy resolution',
    round_count_modifier: +1, // slightly longer to allow for complex resolution
    checkpoint_focus: 'Does the candidate lead, prioritize, and maintain relationships under extreme pressure?',
  },
};

// ============================================================
// REFLECTION PHASE
// ============================================================
// After the scenario completes, the candidate reflects.
// This captures metacognition — a strong signal for Learning Agility
// and Self-Management.

export const REFLECTION_QUESTIONS = [
  "How do you feel that went?",
  "What would you do differently if this happened again?",
  "Was there a moment where you weren't sure what to do? What did you decide and why?",
];

const REFLECTION_EVALUATION_PROMPT = `You evaluate a candidate's post-scenario reflection for metacognitive signals.

SCENARIO THAT JUST HAPPENED:
{scenario_summary}

CANDIDATE'S REFLECTION:
{reflection_text}

Evaluate for:
1. SELF-AWARENESS: Does the candidate accurately assess what went well and what didn't? (Not just "it went fine")
2. LEARNING EXTRACTION: Do they identify specific lessons or insights?
3. ALTERNATIVE THINKING: Can they articulate a different approach they'd take?
4. EMOTIONAL PROCESSING: Do they acknowledge the emotional dimension (stress, frustration, empathy)?
5. GROWTH ORIENTATION: Do they frame challenges as learning opportunities?

Return JSON:
{
  "metacognition_score": 1-10,
  "self_awareness": { "present": true/false, "evidence": "quote" },
  "learning_extraction": { "present": true/false, "evidence": "quote" },
  "alternative_thinking": { "present": true/false, "evidence": "quote" },
  "emotional_processing": { "present": true/false, "evidence": "quote" },
  "growth_orientation": { "present": true/false, "evidence": "quote" },
  "skills_evidenced": [
    { "skill_name": "Learning Agility", "signal": "what they said that shows this" },
    { "skill_name": "Self-Management", "signal": "what they said that shows this" }
  ],
  "observer_note": "1-2 sentence assessment of their reflective capacity"
}`;

export async function evaluateReflection(
  scenarioSummary: string,
  reflectionText: string
): Promise<{
  metacognition_score: number;
  skills_evidenced: { skill_name: string; signal: string }[];
  observer_note: string;
}> {
  const prompt = REFLECTION_EVALUATION_PROMPT
    .replace('{scenario_summary}', scenarioSummary)
    .replace('{reflection_text}', reflectionText);

  try {
    const result = await callLLM({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 800,
    });

    const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Reflection evaluation failed:', error);
    return {
      metacognition_score: 5,
      skills_evidenced: [],
      observer_note: 'Reflection evaluation could not be completed.',
    };
  }
}

// ============================================================
// HOLISTIC ARC ASSESSMENT
// ============================================================
// Evaluates the full trajectory of the simulation, not just checkpoints.
// Catches patterns like: poor start → strong adaptation (= high Adaptability)

const HOLISTIC_ASSESSMENT_PROMPT = `You are evaluating the FULL ARC of a workplace simulation, not just individual moments.

SCENARIO: {scenario_title}
SETTING: {scenario_setting}
SKILLS BEING ASSESSED: {focus_skills}

FULL TRANSCRIPT:
{full_transcript}

CHECKPOINT EVALUATIONS (already scored):
{checkpoint_summaries}

CANDIDATE'S REFLECTION:
{reflection_text}

Now evaluate the OVERALL trajectory. Look for:

1. ADAPTATION ARC: Did the candidate start poorly but improve? Start strong but fade? Stay consistent? The trajectory matters as much as the endpoint.

2. MULTI-STAKEHOLDER NAVIGATION: How did they balance competing demands (e.g., angry customer vs. new colleague vs. time pressure)? Did they prioritize appropriately?

3. INITIATIVE vs. REACTIVITY: Did they take proactive steps or only respond when prompted? Did they anticipate problems?

4. CONSISTENCY WITH LAYER 1: Based on what Layer 1 reported, is the behavior here consistent or surprising?

5. AUTHENTIC vs. PERFORMED: Over 6 rounds, did the behavior feel natural and consistent, or did it feel like they were performing a role?

Return JSON:
{
  "overall_assessment": "2-3 sentence summary of the candidate's simulation performance",
  "trajectory": "improving|consistent|declining|mixed",
  "standout_moment": { "round": 3, "description": "what happened and why it matters" },
  "concern_moment": { "round": 2, "description": "what happened and why it's a concern" },
  "holistic_skill_adjustments": [
    {
      "skill_name": "Adaptability",
      "adjustment": "+1 level",
      "reason": "Started poorly in round 1-2 but showed remarkable recovery by round 4. The adaptation arc itself is strong evidence."
    }
  ],
  "authenticity_rating": 1-10,
  "psychologist_flags": ["any concerns that need human review"],
  "employer_summary": "What an employer should know about this candidate based on the simulation. 2-3 sentences, no jargon."
}`;

export async function evaluateHolisticArc(
  scenarioTitle: string,
  scenarioSetting: string,
  focusSkills: string[],
  fullTranscript: string,
  checkpointSummaries: string,
  reflectionText: string
): Promise<{
  overall_assessment: string;
  trajectory: string;
  holistic_skill_adjustments: { skill_name: string; adjustment: string; reason: string }[];
  authenticity_rating: number;
  psychologist_flags: string[];
  employer_summary: string;
}> {
  const prompt = HOLISTIC_ASSESSMENT_PROMPT
    .replace('{scenario_title}', scenarioTitle)
    .replace('{scenario_setting}', scenarioSetting)
    .replace('{focus_skills}', focusSkills.join(', '))
    .replace('{full_transcript}', fullTranscript)
    .replace('{checkpoint_summaries}', checkpointSummaries)
    .replace('{reflection_text}', reflectionText);

  try {
    const result = await callLLM({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 1200,
    });

    const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Holistic assessment failed:', error);
    return {
      overall_assessment: 'Holistic assessment could not be completed.',
      trajectory: 'unknown',
      holistic_skill_adjustments: [],
      authenticity_rating: 5,
      psychologist_flags: ['Holistic assessment failed — manual review recommended'],
      employer_summary: 'Assessment could not be fully completed. Manual review recommended.',
    };
  }
}
