// Employer-Specific Scenario Generator
// Takes discovery simulation output + employer graph
// Produces ScenarioConfig objects that slot into the existing GameMaster
//
// This is the bridge between "what we discovered matters" and
// "what the candidate actually experiences"

import { callLLM } from '@/lib/llm';
import { ScenarioConfig, CharacterProfile } from '@/lib/simulation/engine';
import { EmployerGraph } from './graph-extraction';
import { DiscoveredScenario } from './discovery-simulation';

// ============================================================
// GENERATE FULL SCENARIO FROM DISCOVERY
// ============================================================

const SCENARIO_GENERATION_PROMPT = `You are a workplace assessment scenario designer. You take a discovered high-value workplace situation and design a full interactive assessment scenario.

DISCOVERED SITUATION:
Title: {title}
Setting: {setting}
Situation: {situation}
Skills tested: {skills}
Twists: {twists}
Why this matters: {why}

EMPLOYER CONTEXT:
Industry: {industry}
Culture: {culture}
Key roles: {roles}

REQUIRED OUTPUT FORMAT:
Design a complete scenario with 3 characters, 5-6 rounds, 3 evaluation checkpoints, and 2 twists.

Return JSON:
{
  "id": "scenario_employer_{id}",
  "title": "Scenario title",
  "setting": "Vivid, specific 2-sentence setting. Time, place, what's happening.",
  "duration_rounds": 5 or 6,
  "target_skills": ["PSF skill names this tests"],
  "opening_situation": "What the candidate sees/hears when the scenario starts. 3-4 sentences, present tense, immersive.",
  "characters": [
    {
      "id": "char_001",
      "name": "Filipino first name",
      "role": "their role in the scenario",
      "relationship_to_candidate": "how they relate to the person being assessed",
      "personality": {
        "mbti": "4-letter type",
        "core_traits": ["3-4 traits"],
        "communication_style": "direct|indirect|emotional|formal",
        "emotional_triggers": ["what upsets them"]
      },
      "agenda": "what they want from this interaction",
      "backstory": "2-3 sentences explaining their current emotional state and why they're acting this way",
      "opening_stance": "how they feel at the start",
      "constraints": ["things this character will NOT do — keeps them realistic"]
    }
  ],
  "checkpoints": [
    {
      "after_round": 2,
      "evaluate_skills": ["PSF skill names"],
      "sotopia_dimensions": ["goal_completion|relationship_maintenance|social_norms|adaptability|emotional_handling|knowledge_application"],
      "description": "What the observer evaluates at this point"
    }
  ],
  "twists": [
    {
      "at_round": 3,
      "description": "What changes in the situation",
      "character_reactions": [
        {
          "character_id": "char_001",
          "reaction": "How this character reacts to the twist (written as instruction to the character)"
        }
      ]
    }
  ]
}

DESIGN RULES:
1. Characters should feel like real Filipino workplace people — not cartoons.
2. Each character has a legitimate agenda that may conflict with others.
3. The candidate should face genuine dilemmas — no obviously right answer.
4. Checkpoints at rounds 2, 4, and final round.
5. Twists should escalate complexity, not just add chaos.
6. The scenario should feel specific to THIS employer's context.
7. Constraints prevent characters from being unreasonably difficult.
8. Include Filipino cultural dynamics where natural (honorifics, hierarchy, pakikiramdam).

Return ONLY valid JSON.`;

export async function generateScenarioFromDiscovery(
  discovery: DiscoveredScenario,
  graph: EmployerGraph,
): Promise<ScenarioConfig> {
  const roles = graph.nodes
    .filter(n => n.type === 'role')
    .map(n => `${n.name}: ${n.attributes.description}`)
    .join('; ');

  const prompt = SCENARIO_GENERATION_PROMPT
    .replace('{title}', discovery.title)
    .replace('{setting}', discovery.setting)
    .replace('{situation}', discovery.situation)
    .replace('{skills}', discovery.skills_tested.join(', '))
    .replace('{twists}', discovery.twists.join('; '))
    .replace('{why}', discovery.why_this_matters)
    .replace('{industry}', graph.workplace_culture.industry || 'General')
    .replace('{culture}', JSON.stringify(graph.workplace_culture))
    .replace('{roles}', roles)
    .replace('{id}', discovery.source_friction_point || Date.now().toString());

  const result = await callLLM({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 3000,
  });

  const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const config = JSON.parse(cleaned);

  // Ensure proper typing
  return {
    id: config.id || `scenario_employer_${Date.now()}`,
    title: config.title,
    setting: config.setting,
    duration_rounds: config.duration_rounds || 5,
    characters: config.characters.map((c: any): CharacterProfile => ({
      id: c.id,
      name: c.name,
      role: c.role,
      relationship_to_candidate: c.relationship_to_candidate,
      personality: c.personality,
      agenda: c.agenda,
      backstory: c.backstory,
      opening_stance: c.opening_stance,
      constraints: c.constraints || [],
    })),
    target_skills: config.target_skills || discovery.skills_tested,
    checkpoints: config.checkpoints || [],
    opening_situation: config.opening_situation,
    twists: config.twists || [],
  };
}

// ============================================================
// GENERATE MULTIPLE SCENARIOS FOR AN EMPLOYER
// ============================================================

export async function generateEmployerScenarios(
  discoveries: DiscoveredScenario[],
  graph: EmployerGraph,
  maxScenarios: number = 3,
): Promise<ScenarioConfig[]> {
  const topDiscoveries = discoveries
    .filter(d => d.assessment_value >= 0.6)
    .slice(0, maxScenarios);

  if (topDiscoveries.length === 0) {
    console.warn('No high-value discoveries — cannot generate employer-specific scenarios');
    return [];
  }

  const scenarios: ScenarioConfig[] = [];

  for (const discovery of topDiscoveries) {
    try {
      const scenario = await generateScenarioFromDiscovery(discovery, graph);
      scenarios.push(scenario);
    } catch (e) {
      console.error(`Scenario generation failed for "${discovery.title}":`, e);
    }
  }

  return scenarios;
}

// ============================================================
// VALIDATE SCENARIO AGAINST VACANCY
// ============================================================

export function validateScenarioAgainstVacancy(
  scenario: ScenarioConfig,
  vacancySkills: string[],
): { valid: boolean; coverage: number; missing: string[]; extra: string[] } {
  const scenarioSkills = new Set(scenario.target_skills.map(s => s.toLowerCase()));
  const requiredSkills = new Set(vacancySkills.map(s => s.toLowerCase()));

  const covered = vacancySkills.filter(s => scenarioSkills.has(s.toLowerCase()));
  const missing = vacancySkills.filter(s => !scenarioSkills.has(s.toLowerCase()));
  const extra = scenario.target_skills.filter(s => !requiredSkills.has(s.toLowerCase()));

  const coverage = requiredSkills.size > 0 ? covered.length / requiredSkills.size : 0;

  return {
    valid: coverage >= 0.5, // At least 50% of vacancy skills covered
    coverage,
    missing,
    extra,
  };
}
