// Workplace Discovery Simulation
// Spawns agents from the employer knowledge graph
// Runs interaction rounds to discover which situations create behavioral differentiation
// Outputs ranked situations that become assessment scenarios
//
// This is NOT the candidate-facing simulation — this is the "meta-simulation"
// that discovers WHAT to simulate. The output feeds into ScenarioConfig generation.

import { callLLM } from '@/lib/llm';
import { EmployerGraph, GraphNode, FrictionPoint } from './graph-extraction';

// ============================================================
// TYPES
// ============================================================

interface SwarmAgent {
  id: string;
  source_node: string;      // graph node ID this agent was generated from
  name: string;
  role: string;
  personality: string;       // brief personality description
  agenda: string;            // what this agent wants/needs
  skills_profile: string[];  // what they're good at
  stress_response: string;   // how they react under pressure
}

interface SwarmRound {
  round_number: number;
  situation: string;          // injected situation (from friction point)
  agent_actions: AgentAction[];
  emergent_dynamics: string;  // what happened that wasn't planned
  assessment_signals: string[]; // behavioral signals a real candidate would need to show
}

interface AgentAction {
  agent_id: string;
  action_type: 'request_help' | 'delegate' | 'escalate' | 'resolve' | 'collaborate' | 'disagree' | 'avoid' | 'support' | 'complain';
  target: string;            // another agent or "everyone"
  message: string;           // what they said/did
  skill_demand: string;      // what skill a candidate in this position would need
}

export interface DiscoveredScenario {
  rank: number;
  assessment_value: number;   // 0-1
  title: string;
  setting: string;
  situation: string;
  characters_needed: string[];  // roles from the graph
  skills_tested: string[];
  twists: string[];           // complications that emerge
  why_this_matters: string;   // why this situation differentiates performers
  source_friction_point: string; // which friction point spawned this
}

// ============================================================
// GENERATE SWARM AGENTS FROM GRAPH
// ============================================================

const AGENT_GENERATION_PROMPT = `Generate workplace personas from this knowledge graph for a discovery simulation.

KNOWLEDGE GRAPH:
{graph_summary}

Generate {agent_count} realistic workplace agents. Each agent should be a distinct person who works at this employer. They should have realistic personalities, agendas, and stress responses grounded in Filipino workplace culture.

Return JSON array:
[
  {
    "id": "agent_001",
    "source_node": "node_001",
    "name": "Filipino first name",
    "role": "their actual job role",
    "personality": "2-3 traits that affect how they handle workplace situations",
    "agenda": "what they want or need today — may create tension with others",
    "skills_profile": ["what they're good at"],
    "stress_response": "how they react when things go wrong"
  }
]

RULES:
- Ground each agent in a specific graph node (role, department, etc.)
- Give them realistic Filipino names
- Their agendas should create natural workplace tension — not cartoon villains, real human needs that sometimes conflict
- Include a mix of: helpful colleagues, overwhelmed supervisors, frustrated customers, nervous new hires, experienced old hands
- Stress responses should be diverse: some escalate, some withdraw, some take charge, some freeze

Return ONLY valid JSON.`;

async function generateSwarmAgents(graph: EmployerGraph, agentCount: number = 25): Promise<SwarmAgent[]> {
  const graphSummary = JSON.stringify({
    nodes: graph.nodes.map(n => ({ id: n.id, type: n.type, name: n.name, desc: n.attributes.description })),
    edges: graph.edges.map(e => ({ from: e.from_node, to: e.to_node, rel: e.relationship, context: e.context })),
    culture: graph.workplace_culture,
  });

  const prompt = AGENT_GENERATION_PROMPT
    .replace('{graph_summary}', graphSummary)
    .replace('{agent_count}', String(agentCount));

  const result = await callLLM({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 3000,
  });

  const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  return JSON.parse(cleaned);
}

// ============================================================
// RUN DISCOVERY SIMULATION
// ============================================================

const ROUND_SIMULATION_PROMPT = `You are simulating a workplace situation to discover what happens when real people with conflicting agendas interact.

WORKPLACE CONTEXT:
{workplace_culture}

SITUATION INJECTED:
{situation}

AGENTS PRESENT:
{agents}

PREVIOUS ROUNDS:
{previous_rounds}

Simulate one round of interaction. Each agent acts based on their personality, agenda, and stress response. The situation should feel realistic and messy — not everyone makes the right call.

Return JSON:
{
  "agent_actions": [
    {
      "agent_id": "agent_001",
      "action_type": "request_help|delegate|escalate|resolve|collaborate|disagree|avoid|support|complain",
      "target": "agent_002 or everyone",
      "message": "What they say or do (1-2 sentences, natural dialogue)",
      "skill_demand": "What PSF skill a candidate in this position would need to handle this"
    }
  ],
  "emergent_dynamics": "What happened that wasn't planned — tensions, alliances, surprises (2-3 sentences)",
  "assessment_signals": ["Behavioral signals a candidate would need to show to handle this well"]
}

RULES:
- Agents act in character — they don't know this is a simulation
- Some agents make mistakes, get emotional, or act selfishly — that's realistic
- The situation should escalate or evolve, not stay static
- Assessment signals should map to PSF skills without naming them directly

Return ONLY valid JSON.`;

async function simulateRound(
  culture: string,
  situation: string,
  agents: SwarmAgent[],
  previousRounds: SwarmRound[],
): Promise<SwarmRound> {
  const agentSummary = agents.map(a => `${a.name} (${a.role}): ${a.personality}. Wants: ${a.agenda}. Under stress: ${a.stress_response}`).join('\n');
  const prevSummary = previousRounds.map(r => `Round ${r.round_number}: ${r.emergent_dynamics}`).join('\n') || 'First round.';

  const prompt = ROUND_SIMULATION_PROMPT
    .replace('{workplace_culture}', culture)
    .replace('{situation}', situation)
    .replace('{agents}', agentSummary)
    .replace('{previous_rounds}', prevSummary);

  const result = await callLLM({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 2000,
  });

  const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const data = JSON.parse(cleaned);

  return {
    round_number: previousRounds.length + 1,
    situation,
    agent_actions: data.agent_actions || [],
    emergent_dynamics: data.emergent_dynamics || '',
    assessment_signals: data.assessment_signals || [],
  };
}

// ============================================================
// SCORE AND RANK SITUATIONS
// ============================================================

const SCORING_PROMPT = `You are an assessment design expert. Score these workplace simulation results for their value as hiring assessment scenarios.

FRICTION POINT: {friction_description}
SIMULATION ROUNDS:
{rounds_summary}
EMPLOYER CRITICAL SKILLS: {critical_skills}

Score this situation on:
1. **Behavioral differentiation** (0-1): Would a skilled person and an unskilled person handle this very differently?
2. **Skill coverage** (0-1): How many of the employer's critical skills does this test?
3. **Realism** (0-1): Would this actually happen at this workplace?
4. **Assessment fairness** (0-1): Is the "right" response clear enough to evaluate, but not so obvious that everyone would do it?
5. **Cultural sensitivity** (0-1): Can candidates from different backgrounds succeed, or does it privilege one communication style?

Return JSON:
{
  "assessment_value": 0.85,
  "title": "3-5 word scenario title",
  "skills_tested": ["PSF skills this tests"],
  "twists": ["Complications that make this interesting"],
  "why_this_matters": "Why this situation differentiates performers (1-2 sentences)",
  "setting": "Vivid 1-sentence setting description",
  "characters_needed": ["Roles that should be in the scenario"]
}`;

async function scoreSimulation(
  frictionPoint: FrictionPoint,
  rounds: SwarmRound[],
  criticalSkills: string[],
): Promise<DiscoveredScenario> {
  const roundsSummary = rounds.map(r =>
    `Round ${r.round_number}: ${r.emergent_dynamics}\nSignals: ${r.assessment_signals.join(', ')}`
  ).join('\n\n');

  const prompt = SCORING_PROMPT
    .replace('{friction_description}', frictionPoint.description)
    .replace('{rounds_summary}', roundsSummary)
    .replace('{critical_skills}', criticalSkills.join(', '));

  const result = await callLLM({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 1000,
  });

  const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const data = JSON.parse(cleaned);

  return {
    rank: 0, // set after sorting
    assessment_value: data.assessment_value || 0.5,
    title: data.title || frictionPoint.description.substring(0, 50),
    setting: data.setting || '',
    situation: frictionPoint.scenario_seed || frictionPoint.description,
    characters_needed: data.characters_needed || [],
    skills_tested: data.skills_tested || frictionPoint.skills_tested,
    twists: data.twists || [],
    why_this_matters: data.why_this_matters || '',
    source_friction_point: frictionPoint.id,
  };
}

// ============================================================
// MAIN: RUN FULL DISCOVERY
// ============================================================

export async function runDiscoverySimulation(
  graph: EmployerGraph,
  options: { agentCount?: number; roundsPerSituation?: number; maxSituations?: number } = {}
): Promise<DiscoveredScenario[]> {
  const { agentCount = 25, roundsPerSituation = 4, maxSituations = 5 } = options;

  // 1. Generate swarm agents from graph
  const agents = await generateSwarmAgents(graph, agentCount);

  // 2. Get high-value friction points to simulate
  const frictionPoints = graph.friction_points
    .sort((a, b) => b.assessment_value - a.assessment_value)
    .slice(0, maxSituations);

  if (frictionPoints.length === 0) {
    // No friction points extracted — generate generic ones from the graph
    return [];
  }

  // 3. Run simulation for each friction point
  const criticalSkills = graph.critical_skills
    .filter(s => s.importance === 'critical' || s.importance === 'important')
    .map(s => s.skill_name);

  const cultureContext = JSON.stringify(graph.workplace_culture);

  const discoveries: DiscoveredScenario[] = [];

  for (const fp of frictionPoints) {
    // Select relevant agents (those involved in this friction point + some bystanders)
    const involvedAgents = agents.filter(a => fp.entities_involved.includes(a.source_node));
    const bystanders = agents.filter(a => !fp.entities_involved.includes(a.source_node)).slice(0, 3);
    const roundAgents = [...involvedAgents, ...bystanders].slice(0, 8);

    if (roundAgents.length < 2) continue;

    // Run simulation rounds
    const rounds: SwarmRound[] = [];
    for (let i = 0; i < roundsPerSituation; i++) {
      try {
        const round = await simulateRound(cultureContext, fp.scenario_seed || fp.description, roundAgents, rounds);
        rounds.push(round);
      } catch (e) {
        console.error(`Discovery round ${i + 1} failed for ${fp.id}:`, e);
      }
    }

    if (rounds.length === 0) continue;

    // Score the situation
    try {
      const scored = await scoreSimulation(fp, rounds, criticalSkills);
      discoveries.push(scored);
    } catch (e) {
      console.error(`Scoring failed for ${fp.id}:`, e);
    }
  }

  // 4. Rank by assessment value
  discoveries.sort((a, b) => b.assessment_value - a.assessment_value);
  discoveries.forEach((d, i) => d.rank = i + 1);

  return discoveries;
}
