// Kaya Layer 2: Multi-Agent Workplace Simulation Engine
// Architecture: Concordia Game Master + TinyTroupe Personas + Sotopia-Eval + Managed Agents
//
// This is the core orchestration layer. The Game Master:
// 1. Reads layer2_seeds + JD + employer context
// 2. Selects and configures a scenario (from Ink)
// 3. Generates character profiles (TinyTroupe pattern)
// 4. Manages round-by-round flow
// 5. Dispatches character responses (Managed Agents: execute(name, input) → string)
// 6. Triggers evaluation at checkpoints (Sotopia-Eval)
// 7. Produces convergence report (Layer 1 vs Layer 2)

import { callLLM } from '@/lib/llm';

// ============================================================
// TYPES
// ============================================================

export interface CharacterProfile {
  id: string;
  name: string;
  role: string; // "manager" | "colleague" | "customer" | "trainee"
  relationship_to_candidate: string; // "your team lead" | "frustrated customer" | "fellow new hire"
  personality: {
    mbti: string;
    core_traits: string[];
    communication_style: string; // "direct" | "indirect" | "emotional" | "formal"
    emotional_triggers: string[];
  };
  agenda: string; // what this character wants from the interaction
  backstory: string; // 2-3 sentences of context
  opening_stance: string; // how they feel at the start
  constraints: string[]; // things this character will NOT do
}

export interface ScenarioConfig {
  id: string;
  title: string;
  setting: string;
  duration_rounds: number;
  characters: CharacterProfile[];
  target_skills: string[]; // PSF skill IDs
  checkpoints: CheckpointConfig[];
  opening_situation: string;
  twists: TwistConfig[];
}

export interface CheckpointConfig {
  after_round: number;
  evaluate_skills: string[]; // PSF skill names
  sotopia_dimensions: string[]; // which Sotopia-Eval dimensions to score
  description: string;
}

export interface TwistConfig {
  at_round: number;
  description: string;
  character_reactions: { character_id: string; reaction: string }[];
}

export interface SimulationRound {
  round_number: number;
  character_messages: CharacterMessage[];
  candidate_response: string | null;
  observer_notes: string[];
  checkpoint_evaluation: CheckpointEvaluation | null;
}

export interface CharacterMessage {
  character_id: string;
  character_name: string;
  message: string;
  tone: string; // "frustrated" | "helpful" | "confused" | "urgent"
  addressed_to: string; // "candidate" | "everyone" | another character name
  skill_signals?: string[]; // what this message is designed to elicit
}

export interface CheckpointEvaluation {
  checkpoint_id: number;
  skills_evaluated: SkillEvaluation[];
  sotopia_scores: SotopiaScore[];
  observer_narrative: string;
}

export interface SkillEvaluation {
  skill_name: string;
  proficiency: 'Basic' | 'Intermediate' | 'Advanced';
  confidence: number;
  behavioral_evidence: string;
  transcript_quote: string;
}

export interface SotopiaScore {
  dimension: string; // "goal_completion" | "relationship_maintenance" | etc
  score: number; // 1-10
  rationale: string;
  psf_mapping: string; // which PSF skill this maps to
}

export interface SimulationState {
  scenario: ScenarioConfig;
  rounds: SimulationRound[];
  current_round: number;
  status: 'setup' | 'active' | 'checkpoint' | 'completed';
  character_memories: Map<string, string[]>; // character_id → memory of previous rounds
  evaluations: CheckpointEvaluation[];
  final_report: SimulationReport | null;
}

export interface SimulationReport {
  scenario_id: string;
  scenario_title: string;
  rounds_completed: number;
  skill_scores: SkillEvaluation[];
  sotopia_scores: SotopiaScore[];
  convergence: ConvergenceItem[];
  observer_summary: string;
  gaming_flags: string[];
  evidence_for_psychologist: string;
}

export interface ConvergenceItem {
  skill_name: string;
  layer1_score: string; // "Basic" | "Intermediate" | "Advanced" | "Not assessed"
  layer2_score: string;
  convergent: boolean;
  confidence_adjustment: number; // +0.15 if convergent, -0.10 if L2 < L1
  note: string;
}

// ============================================================
// SOTOPIA-EVAL DIMENSIONS → PSF MAPPING
// ============================================================

export const SOTOPIA_PSF_MAP: Record<string, { dimension: string; psf_skills: string[]; description: string }> = {
  goal_completion: {
    dimension: 'Goal Completion',
    psf_skills: ['Problem-Solving', 'Decision Making'],
    description: 'Did the candidate resolve the situation? How effectively?',
  },
  relationship_maintenance: {
    dimension: 'Relationship Maintenance',
    psf_skills: ['Collaboration', 'Communication'],
    description: 'Did relationships improve, hold, or deteriorate through the interaction?',
  },
  believability: {
    dimension: 'Believability',
    psf_skills: [],
    description: 'Did responses feel genuine and authentic, or rehearsed and scripted?',
  },
  social_norms: {
    dimension: 'Social Norm Adherence',
    psf_skills: ['Work Ethic', 'Self-Management'],
    description: 'Professional conduct, respect, follow-through on commitments.',
  },
  adaptability: {
    dimension: 'Adaptability Shown',
    psf_skills: ['Adaptability', 'Resilience'],
    description: 'How did the candidate respond when conditions changed unexpectedly?',
  },
  emotional_handling: {
    dimension: 'Emotional Handling',
    psf_skills: ['Emotional Intelligence'],
    description: 'De-escalation, empathy, self-regulation under pressure.',
  },
  knowledge_application: {
    dimension: 'Knowledge Application',
    psf_skills: ['Digital Literacy', 'Learning Agility'],
    description: 'Did the candidate apply relevant knowledge or learn on the fly?',
  },
};

// ============================================================
// CHARACTER GENERATION (TinyTroupe Pattern)
// ============================================================

const CHARACTER_GENERATION_PROMPT = `You generate realistic workplace character profiles for a hiring assessment simulation.

CONTEXT:
- Job: {job_title}
- Company context: {company_context}  
- Scenario: {scenario_description}
- Character role needed: {role_needed}
- Skills being tested: {target_skills}

Generate a character profile as JSON with these fields:
{
  "name": "Filipino first name appropriate to the role",
  "role": "their job role",
  "relationship_to_candidate": "how they relate to the person being assessed",
  "personality": {
    "mbti": "4-letter MBTI type",
    "core_traits": ["3-4 personality traits"],
    "communication_style": "direct|indirect|emotional|formal",
    "emotional_triggers": ["what makes them frustrated/upset"]
  },
  "agenda": "what they want from this specific interaction — may conflict with what the candidate wants",
  "backstory": "2-3 sentences of context that explains their current emotional state",
  "opening_stance": "how they feel when the scenario starts",
  "constraints": ["things this character will NEVER do — keeps them realistic"]
}

RULES:
- Make the character feel like a real Filipino workplace colleague/customer
- The agenda should create natural tension that tests the candidate's skills
- The character should NOT be a cartoon villain — they have legitimate concerns
- Communication style should match Filipino workplace norms (may be indirect, respectful of hierarchy)
- Constraints prevent the character from being unreasonably difficult

Return ONLY valid JSON, no markdown.`;

export async function generateCharacter(
  jobTitle: string,
  companyContext: string,
  scenarioDescription: string,
  roleNeeded: string,
  targetSkills: string[]
): Promise<CharacterProfile> {
  const prompt = CHARACTER_GENERATION_PROMPT
    .replace('{job_title}', jobTitle)
    .replace('{company_context}', companyContext)
    .replace('{scenario_description}', scenarioDescription)
    .replace('{role_needed}', roleNeeded)
    .replace('{target_skills}', targetSkills.join(', '));

  const result = await callLLM({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 800,
  });

  const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const profile = JSON.parse(cleaned);
  
  return {
    id: `char_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    ...profile,
  };
}

// ============================================================
// CHARACTER AGENT (Managed Agents: execute pattern)
// ============================================================

const CHARACTER_RESPONSE_PROMPT = `You are {character_name}, {character_role} in a workplace scenario.

YOUR PERSONA:
{character_persona}

YOUR AGENDA: {character_agenda}
YOUR CURRENT EMOTIONAL STATE: {character_mood}

SCENARIO CONTEXT:
{scenario_context}

CONVERSATION SO FAR:
{conversation_history}

YOUR MEMORY OF PREVIOUS ROUNDS:
{character_memory}

{twist_instruction}

RESPOND as {character_name}. Stay in character. Your response should:
- Be 1-3 sentences (natural conversation length, not essays)
- Reflect your personality and communication style
- Advance your agenda (what you want from this interaction)
- React naturally to what the candidate just said or did
- If addressing the candidate, be direct. If addressing another character, the candidate can overhear.

CRITICAL RULES:
- You do NOT know you are in a simulation
- You do NOT know the candidate is being assessed
- You have legitimate concerns and feelings
- You respond in the language the candidate uses (English, Taglish, or Filipino)

Respond with JSON:
{
  "message": "your spoken response",
  "tone": "frustrated|calm|helpful|confused|urgent|supportive|dismissive",
  "addressed_to": "candidate|everyone|[character name]",
  "internal_state": "brief note on how you're feeling now (not shown to candidate)"
}`;

export async function executeCharacter(
  character: CharacterProfile,
  scenarioContext: string,
  conversationHistory: string,
  characterMemory: string[],
  twistInstruction?: string
): Promise<CharacterMessage> {
  const personaText = `Name: ${character.name}
Role: ${character.role}
MBTI: ${character.personality.mbti}
Traits: ${character.personality.core_traits.join(', ')}
Communication style: ${character.personality.communication_style}
Triggers: ${character.personality.emotional_triggers.join(', ')}
Backstory: ${character.backstory}
Constraints: ${character.constraints.join('; ')}`;

  const prompt = CHARACTER_RESPONSE_PROMPT
    .replace('{character_name}', character.name)
    .replace('{character_role}', character.role)
    .replace('{character_persona}', personaText)
    .replace('{character_agenda}', character.agenda)
    .replace('{character_mood}', character.opening_stance)
    .replace('{scenario_context}', scenarioContext)
    .replace('{conversation_history}', conversationHistory)
    .replace('{character_memory}', characterMemory.length > 0 ? characterMemory.join('\n') : 'This is the start of the interaction.')
    .replace('{twist_instruction}', twistInstruction || '');

  try {
    const result = await callLLM({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 300,
    });

    const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const response = JSON.parse(cleaned);

    return {
      character_id: character.id,
      character_name: character.name,
      message: response.message,
      tone: response.tone,
      addressed_to: response.addressed_to || 'candidate',
    };
  } catch (error) {
    // Managed Agents pattern: fault isolation — if one character fails, others continue
    console.error(`Character ${character.name} failed:`, error);
    return {
      character_id: character.id,
      character_name: character.name,
      message: `*${character.name} pauses, looking uncertain*`,
      tone: 'confused',
      addressed_to: 'everyone',
    };
  }
}

// ============================================================
// OBSERVER AGENT (Sotopia-Eval Pattern)
// ============================================================

const OBSERVER_PROMPT = `You are a silent workplace assessment observer. You watch interactions and evaluate behavioral evidence.

SCENARIO CONTEXT:
{scenario_context}

SKILLS BEING ASSESSED AT THIS CHECKPOINT:
{checkpoint_skills}

CONVERSATION THIS ROUND:
{round_transcript}

FULL CONVERSATION SO FAR:
{full_transcript}

Evaluate the candidate's behavior using the Sotopia-Eval framework.

For each dimension, provide a score (1-10) and specific behavioral evidence:

1. GOAL COMPLETION (→ Problem-Solving, Decision Making): Did the candidate work toward resolving the situation?
2. RELATIONSHIP MAINTENANCE (→ Collaboration, Communication): Did relationships improve or deteriorate?
3. SOCIAL NORM ADHERENCE (→ Work Ethic, Self-Management): Professional conduct and follow-through?
4. ADAPTABILITY (→ Adaptability, Resilience): How did they handle changes or pressure?
5. EMOTIONAL HANDLING (→ Emotional Intelligence): De-escalation, empathy, self-regulation?
6. KNOWLEDGE APPLICATION (→ Learning Agility): Did they apply or acquire relevant knowledge?
7. BELIEVABILITY (→ Anti-gaming): Did responses feel genuine?

Also extract STAR+E+R behavioral evidence for each skill demonstrated:
- Situation: what was happening
- Task: what the candidate needed to do
- Action: what they specifically did
- Result: what happened because of their action
- Emotion: how they handled the emotional dimension
- Reflection: any self-awareness shown

Return JSON:
{
  "sotopia_scores": [
    { "dimension": "goal_completion", "score": 7, "rationale": "...", "psf_mapping": "Problem-Solving" }
  ],
  "skill_evaluations": [
    {
      "skill_name": "Communication",
      "proficiency": "Intermediate",
      "confidence": 0.75,
      "behavioral_evidence": "STAR+E+R description",
      "transcript_quote": "exact words the candidate used"
    }
  ],
  "observer_narrative": "2-3 sentence summary of what happened this round",
  "gaming_flags": [],
  "candidate_strengths_this_round": ["what they did well"],
  "candidate_growth_areas_this_round": ["where they could improve"]
}`;

export async function evaluateCheckpoint(
  scenarioContext: string,
  checkpointSkills: string[],
  roundTranscript: string,
  fullTranscript: string
): Promise<CheckpointEvaluation> {
  const prompt = OBSERVER_PROMPT
    .replace('{scenario_context}', scenarioContext)
    .replace('{checkpoint_skills}', checkpointSkills.join(', '))
    .replace('{round_transcript}', roundTranscript)
    .replace('{full_transcript}', fullTranscript);

  const result = await callLLM({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 1500,
  });

  const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const evaluation = JSON.parse(cleaned);

  return {
    checkpoint_id: Date.now(),
    skills_evaluated: evaluation.skill_evaluations || [],
    sotopia_scores: evaluation.sotopia_scores || [],
    observer_narrative: evaluation.observer_narrative || '',
  };
}

// ============================================================
// CONVERGENCE CALCULATOR
// ============================================================

export function calculateConvergence(
  layer1Skills: { skill_name: string; proficiency: string; confidence: number }[],
  layer2Skills: SkillEvaluation[]
): ConvergenceItem[] {
  const allSkills = new Set([
    ...layer1Skills.map(s => s.skill_name),
    ...layer2Skills.map(s => s.skill_name),
  ]);

  return Array.from(allSkills).map(skillName => {
    const l1 = layer1Skills.find(s => s.skill_name === skillName);
    const l2 = layer2Skills.find(s => s.skill_name === skillName);

    const l1Score = l1?.proficiency || 'Not assessed';
    const l2Score = l2?.proficiency || 'Not assessed';

    const proficiencyRank = (p: string) =>
      p === 'Advanced' ? 3 : p === 'Intermediate' ? 2 : p === 'Basic' ? 1 : 0;

    const l1Rank = proficiencyRank(l1Score);
    const l2Rank = proficiencyRank(l2Score);

    let convergent = false;
    let confidenceAdjustment = 0;
    let note = '';

    if (l1Rank === 0 && l2Rank > 0) {
      note = 'New skill surfaced in simulation — not self-reported in Layer 1.';
      confidenceAdjustment = 0;
    } else if (l2Rank === 0 && l1Rank > 0) {
      note = 'Skill not demonstrated in simulation — may not have been tested.';
      confidenceAdjustment = 0;
    } else if (l1Rank === l2Rank) {
      convergent = true;
      confidenceAdjustment = 0.15;
      note = 'Self-report confirmed by observed behavior. High confidence.';
    } else if (l2Rank > l1Rank) {
      convergent = true; // directionally convergent, candidate undersold
      confidenceAdjustment = 0.05;
      note = 'Candidate demonstrated stronger skills than self-reported. Common for PWDs and culturally modest candidates. Use Layer 2 score.';
    } else {
      // l2Rank < l1Rank
      convergent = false;
      confidenceAdjustment = -0.10;
      note = 'Observed behavior weaker than self-report. Flag for psychologist review. May indicate overstatement in Layer 1.';
    }

    return {
      skill_name: skillName,
      layer1_score: l1Score,
      layer2_score: l2Score,
      convergent,
      confidence_adjustment: confidenceAdjustment,
      note,
    };
  });
}

// ============================================================
// GAME MASTER — Main Orchestration Loop
// ============================================================

export class GameMaster {
  private state: SimulationState;

  constructor(scenario: ScenarioConfig) {
    this.state = {
      scenario,
      rounds: [],
      current_round: 0,
      status: 'setup',
      character_memories: new Map(scenario.characters.map(c => [c.id, []])),
      evaluations: [],
      final_report: null,
    };
  }

  getState(): SimulationState {
    return this.state;
  }

  // Start the simulation — characters deliver opening messages
  async startSimulation(): Promise<CharacterMessage[]> {
    this.state.status = 'active';
    this.state.current_round = 1;

    const openingMessages: CharacterMessage[] = [];
    const scenarioContext = `Setting: ${this.state.scenario.setting}\nSituation: ${this.state.scenario.opening_situation}`;

    for (const character of this.state.scenario.characters) {
      const msg = await executeCharacter(
        character,
        scenarioContext,
        'This is the start of the scenario.',
        [],
      );
      openingMessages.push(msg);

      // Update character memory
      const mem = this.state.character_memories.get(character.id) || [];
      mem.push(`Round 1: I said "${msg.message}" (tone: ${msg.tone})`);
      this.state.character_memories.set(character.id, mem);
    }

    this.state.rounds.push({
      round_number: 1,
      character_messages: openingMessages,
      candidate_response: null,
      observer_notes: [],
      checkpoint_evaluation: null,
    });

    return openingMessages;
  }

  // Process candidate's response and generate character reactions
  async processRound(candidateResponse: string): Promise<{
    character_messages: CharacterMessage[];
    checkpoint?: CheckpointEvaluation;
    is_complete: boolean;
  }> {
    const currentRound = this.state.current_round;

    // Record candidate response in current round
    if (this.state.rounds.length > 0) {
      this.state.rounds[this.state.rounds.length - 1].candidate_response = candidateResponse;
    }

    // Check if there's a twist this round
    const twist = this.state.scenario.twists.find(t => t.at_round === currentRound + 1);

    // Build conversation history
    const history = this.buildConversationHistory();

    // Advance to next round
    this.state.current_round++;
    const newRound = this.state.current_round;

    // Generate character responses
    const messages: CharacterMessage[] = [];
    const scenarioContext = `Setting: ${this.state.scenario.setting}\nSituation: ${this.state.scenario.opening_situation}`;

    for (const character of this.state.scenario.characters) {
      const charMemory = this.state.character_memories.get(character.id) || [];
      
      // Get twist instruction for this character if applicable
      let twistInstruction = '';
      if (twist) {
        const charTwist = twist.character_reactions.find(r => r.character_id === character.id);
        if (charTwist) {
          twistInstruction = `IMPORTANT CHANGE: ${twist.description}\nYour reaction: ${charTwist.reaction}`;
        }
      }

      const msg = await executeCharacter(
        character,
        scenarioContext,
        history,
        charMemory,
        twistInstruction
      );
      messages.push(msg);

      // Update memory
      charMemory.push(`Round ${newRound}: Candidate said "${candidateResponse}". I responded "${msg.message}" (tone: ${msg.tone})`);
      this.state.character_memories.set(character.id, charMemory);
    }

    // Check for checkpoint evaluation
    let checkpoint: CheckpointEvaluation | null = null;
    const checkpointConfig = this.state.scenario.checkpoints.find(c => c.after_round === newRound);
    if (checkpointConfig) {
      const roundTranscript = this.buildRoundTranscript(messages, candidateResponse);
      checkpoint = await evaluateCheckpoint(
        scenarioContext,
        checkpointConfig.evaluate_skills,
        roundTranscript,
        history + '\n' + roundTranscript
      );
      this.state.evaluations.push(checkpoint);
    }

    // Record this round
    this.state.rounds.push({
      round_number: newRound,
      character_messages: messages,
      candidate_response: null, // will be filled next round
      observer_notes: checkpoint ? [checkpoint.observer_narrative] : [],
      checkpoint_evaluation: checkpoint,
    });

    // Check if simulation is complete
    const isComplete = newRound >= this.state.scenario.duration_rounds;
    if (isComplete) {
      this.state.status = 'completed';
    }

    return { character_messages: messages, checkpoint: checkpoint || undefined, is_complete: isComplete };
  }

  // Build full conversation history as text
  private buildConversationHistory(): string {
    return this.state.rounds.map(r => {
      const lines: string[] = [];
      r.character_messages.forEach(m => {
        lines.push(`[${m.character_name}]: ${m.message}`);
      });
      if (r.candidate_response) {
        lines.push(`[Candidate]: ${r.candidate_response}`);
      }
      return lines.join('\n');
    }).join('\n\n');
  }

  // Build transcript for a single round
  private buildRoundTranscript(messages: CharacterMessage[], candidateResponse: string): string {
    const lines = messages.map(m => `[${m.character_name}]: ${m.message}`);
    lines.push(`[Candidate]: ${candidateResponse}`);
    return lines.join('\n');
  }

  // Generate final report
  async generateReport(layer1Skills?: { skill_name: string; proficiency: string; confidence: number }[]): Promise<SimulationReport> {
    // Aggregate all checkpoint evaluations
    const allSkillEvals = this.state.evaluations.flatMap(e => e.skills_evaluated);
    const allSotopiaScores = this.state.evaluations.flatMap(e => e.sotopia_scores);
    const allNarratives = this.state.evaluations.map(e => e.observer_narrative);

    // Deduplicate skills — keep highest confidence per skill
    const skillMap = new Map<string, SkillEvaluation>();
    for (const eval_ of allSkillEvals) {
      const existing = skillMap.get(eval_.skill_name);
      if (!existing || eval_.confidence > existing.confidence) {
        skillMap.set(eval_.skill_name, eval_);
      }
    }

    // Calculate convergence if Layer 1 data provided
    const convergence = layer1Skills
      ? calculateConvergence(layer1Skills, Array.from(skillMap.values()))
      : [];

    const report: SimulationReport = {
      scenario_id: this.state.scenario.id,
      scenario_title: this.state.scenario.title,
      rounds_completed: this.state.current_round,
      skill_scores: Array.from(skillMap.values()),
      sotopia_scores: allSotopiaScores,
      convergence,
      observer_summary: allNarratives.join(' '),
      gaming_flags: [],
      evidence_for_psychologist: this.buildConversationHistory(),
    };

    this.state.final_report = report;
    return report;
  }
}
