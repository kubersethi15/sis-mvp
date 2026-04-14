// Employer Intelligence Engine
// Extracts workplace knowledge graph from seed material
// Runs discovery simulation to find high-signal assessment scenarios
// Generates employer-specific ScenarioConfigs for Layer 2
//
// Zero new infrastructure: Claude + Supabase only

import { callLLM } from '@/lib/llm';
import { ScenarioConfig, CharacterProfile } from '@/lib/simulation/engine';

// ============================================================
// TYPES
// ============================================================

export interface GraphNode {
  id: string;
  type: 'role' | 'department' | 'customer_type' | 'process' | 'system' | 'location';
  name: string;
  description: string;
  skills_required: string[];
  stress_factors: string[];
}

export interface GraphEdge {
  source: string;  // node id
  target: string;  // node id
  relationship: 'reports_to' | 'collaborates_with' | 'serves' | 'depends_on' | 'conflicts_with' | 'supervises';
  friction_level: 'low' | 'medium' | 'high';
  description: string;
}

export interface WorkplaceGraph {
  employer_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  critical_skills: string[];      // Top skills this employer needs, ranked
  friction_points: FrictionPoint[];
  industry_context: string;
}

export interface FrictionPoint {
  id: string;
  description: string;           // "Customer complaints about wait times at branch counter"
  involved_roles: string[];       // ["branch_staff", "customer", "supervisor"]
  skills_tested: string[];        // ["Communication", "Problem-Solving", "Emotional Intelligence"]
  frequency: 'daily' | 'weekly' | 'monthly' | 'rare';
  severity: 'low' | 'medium' | 'high';
  assessment_value: number;       // 0-10: how useful is this for skills assessment?
}

export interface DiscoveryResult {
  situations: DiscoverySituation[];
  recommended_scenarios: number;
}

export interface DiscoverySituation {
  id: string;
  title: string;
  description: string;
  setting: string;
  involved_roles: string[];
  skills_tested: string[];
  differentiation_score: number;  // 0-10: how well does this differentiate candidates?
  source_friction: string;        // which friction point generated this
}

// ============================================================
// PHASE 1A: KNOWLEDGE GRAPH EXTRACTION
// ============================================================

const GRAPH_EXTRACTION_PROMPT = `You are a workplace intelligence analyst. Extract a structured knowledge graph from this employer's seed material.

SEED MATERIAL:
{seed_material}

Extract the following:

1. ENTITIES (nodes): Every role, department, customer type, process, system, and location mentioned or implied.
2. RELATIONSHIPS (edges): How entities relate — who reports to whom, who collaborates with whom, who serves whom, what depends on what, where friction exists.
3. CRITICAL SKILLS: Based on the roles and processes described, which PSF skills are most important for this employer? Rank them.
4. FRICTION POINTS: Where do things go wrong? Customer complaints, team conflicts, system failures, time pressure, miscommunication, cultural clashes. These become assessment scenarios.

For each friction point, rate:
- frequency: how often this happens (daily/weekly/monthly/rare)
- severity: impact when it happens (low/medium/high)
- assessment_value: how useful would this be as a hiring assessment scenario? (1-10)
  High value = tests multiple skills, creates genuine dilemma, no obvious right answer

PSF SKILLS REFERENCE: Communication, Emotional Intelligence, Collaboration, Problem-Solving, Adaptability, Self-Management, Learning Agility, Work Ethic, Digital Literacy, Customer Service, Decision Making, Resilience

CULTURAL CONTEXT: This is a Filipino workplace. Consider:
- Hierarchical respect (po/opo, honorifics)
- Pakikiramdam (shared inner perception — reading the room)
- Hiya (shame/social propriety)
- Bayanihan (communal cooperation)
- Utang na loob (debt of gratitude)

Return ONLY valid JSON:
{
  "nodes": [
    { "id": "role_001", "type": "role", "name": "Branch Staff", "description": "Front-line customer-facing role", "skills_required": ["Communication", "Customer Service"], "stress_factors": ["high volume", "angry customers"] }
  ],
  "edges": [
    { "source": "role_001", "target": "role_002", "relationship": "reports_to", "friction_level": "low", "description": "Branch staff reports to branch supervisor" }
  ],
  "critical_skills": ["Communication", "Customer Service", "Problem-Solving", "Emotional Intelligence", "Collaboration"],
  "friction_points": [
    { "id": "fp_001", "description": "Customer complaints about double-charged transactions", "involved_roles": ["role_001", "cust_001"], "skills_tested": ["Communication", "Problem-Solving", "Emotional Intelligence"], "frequency": "daily", "severity": "high", "assessment_value": 9 }
  ],
  "industry_context": "Financial services / remittance — high-volume branch operations"
}`;

export async function extractWorkplaceGraph(
  seedMaterial: string,
  employerId: string
): Promise<WorkplaceGraph> {
  const prompt = GRAPH_EXTRACTION_PROMPT.replace('{seed_material}', seedMaterial);

  const result = await callLLM({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 4000,
  });

  const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const graph = JSON.parse(cleaned);

  return {
    employer_id: employerId,
    nodes: graph.nodes || [],
    edges: graph.edges || [],
    critical_skills: graph.critical_skills || [],
    friction_points: graph.friction_points || [],
    industry_context: graph.industry_context || '',
  };
}

// ============================================================
// PHASE 1B: DISCOVERY SIMULATION
// ============================================================

const DISCOVERY_SIMULATION_PROMPT = `You are a workplace simulation designer. Given this workplace knowledge graph, design the 5 most valuable assessment situations.

WORKPLACE GRAPH:
Roles: {roles}
Relationships: {relationships}
Friction Points: {friction_points}
Critical Skills: {critical_skills}
Industry: {industry}

For each situation, design a realistic workplace scenario that:
1. Tests multiple skills simultaneously
2. Creates a genuine dilemma (no obvious right answer)
3. Involves 2-4 characters with different agendas
4. Has a natural escalation arc (starts manageable, gets complicated)
5. Is grounded in this specific employer's reality (not generic)

Score each situation's "differentiation power" — how well would it reveal the difference between a strong and weak candidate?

High differentiation = the good candidate and bad candidate would handle this VERY differently.
Low differentiation = most people would handle this the same way.

Return ONLY valid JSON:
{
  "situations": [
    {
      "id": "sit_001",
      "title": "Double-Charge Crisis at Closing Time",
      "description": "A customer discovers they've been charged twice while 3 other customers wait and the branch closes in 15 minutes...",
      "setting": "Branch counter, 4:45 PM on a Friday",
      "involved_roles": ["Branch Staff", "Customer", "New Colleague", "Supervisor"],
      "skills_tested": ["Communication", "Problem-Solving", "Emotional Intelligence", "Customer Service"],
      "differentiation_score": 9,
      "source_friction": "fp_001",
      "escalation_arc": "manageable → colleague gives wrong info → customer threatens social media → other customers get impatient → supervisor becomes available",
      "what_good_candidate_does": "Acknowledges customer immediately, provides timeline, delegates to colleague, manages queue",
      "what_weak_candidate_does": "Panics, passes to supervisor immediately, ignores queue, gives vague promises"
    }
  ],
  "recommended_scenarios": 3
}`;

export async function runDiscoverySimulation(
  graph: WorkplaceGraph
): Promise<DiscoveryResult> {
  const roles = graph.nodes.filter(n => n.type === 'role' || n.type === 'customer_type')
    .map(n => `${n.name}: ${n.description} (skills: ${n.skills_required.join(', ')}; stress: ${n.stress_factors.join(', ')})`).join('\n');

  const relationships = graph.edges
    .map(e => {
      const src = graph.nodes.find(n => n.id === e.source)?.name || e.source;
      const tgt = graph.nodes.find(n => n.id === e.target)?.name || e.target;
      return `${src} → ${e.relationship} → ${tgt} (friction: ${e.friction_level}) — ${e.description}`;
    }).join('\n');

  const frictionPoints = graph.friction_points
    .sort((a, b) => b.assessment_value - a.assessment_value)
    .slice(0, 10) // Top 10 friction points
    .map(f => `[${f.id}] ${f.description} (skills: ${f.skills_tested.join(', ')}, freq: ${f.frequency}, severity: ${f.severity}, assessment value: ${f.assessment_value}/10)`)
    .join('\n');

  const prompt = DISCOVERY_SIMULATION_PROMPT
    .replace('{roles}', roles)
    .replace('{relationships}', relationships)
    .replace('{friction_points}', frictionPoints)
    .replace('{critical_skills}', graph.critical_skills.join(', '))
    .replace('{industry}', graph.industry_context);

  const result = await callLLM({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 4000,
  });

  const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const discovery = JSON.parse(cleaned);

  return {
    situations: (discovery.situations || []).sort((a: any, b: any) => b.differentiation_score - a.differentiation_score),
    recommended_scenarios: discovery.recommended_scenarios || 3,
  };
}

// ============================================================
// PHASE 1C: SCENARIO GENERATION
// ============================================================

const SCENARIO_GENERATION_PROMPT = `You are a workplace simulation scenario author for Kaya, an AI hiring assessment platform.

Generate a complete simulation scenario from this high-signal workplace situation.

SITUATION:
{situation}

EMPLOYER CONTEXT:
Industry: {industry}
Critical Skills: {critical_skills}

Generate a COMPLETE scenario with:
- 3 characters with rich Filipino personas (TinyTroupe pattern: MBTI, traits, agenda, backstory, constraints)
- 5-6 rounds of interaction
- 3 evaluation checkpoints with specific skills assessed
- 2 twists that test adaptability
- Opening situation text
- Character reactions to each twist

CULTURAL GROUNDING: Characters should feel like real Filipino workplace colleagues — use honorifics (Ate, Kuya, Sir/Ma'am), reflect hierarchy awareness, pakikiramdam.

Return ONLY valid JSON matching this exact structure:
{
  "id": "scenario_{employer}_{number}",
  "title": "Scenario title",
  "setting": "Detailed setting description with time, place, context",
  "duration_rounds": 6,
  "target_skills": ["Skill1", "Skill2", "Skill3", "Skill4"],
  "opening_situation": "What the candidate sees/hears when the scenario starts",
  "characters": [
    {
      "id": "char_001",
      "name": "Filipino first name",
      "role": "their workplace role",
      "relationship_to_candidate": "how they relate to the person being assessed",
      "personality": {
        "mbti": "XXXX",
        "core_traits": ["trait1", "trait2", "trait3"],
        "communication_style": "direct|indirect|emotional|formal",
        "emotional_triggers": ["trigger1", "trigger2"]
      },
      "agenda": "what they want from this interaction",
      "backstory": "2-3 sentences of context",
      "opening_stance": "how they feel when scenario starts",
      "constraints": ["thing they will NOT do", "thing that calms them"]
    }
  ],
  "checkpoints": [
    {
      "after_round": 2,
      "evaluate_skills": ["Skill1", "Skill2"],
      "sotopia_dimensions": ["goal_completion", "relationship_maintenance"],
      "description": "What's being evaluated at this point"
    }
  ],
  "twists": [
    {
      "at_round": 3,
      "description": "What changes in the situation",
      "character_reactions": [
        { "character_id": "char_001", "reaction": "How this character reacts to the twist" }
      ]
    }
  ]
}`;

export async function generateScenarioFromSituation(
  situation: DiscoverySituation,
  graph: WorkplaceGraph,
  scenarioIndex: number
): Promise<ScenarioConfig> {
  const prompt = SCENARIO_GENERATION_PROMPT
    .replace('{situation}', JSON.stringify(situation, null, 2))
    .replace('{industry}', graph.industry_context)
    .replace('{critical_skills}', graph.critical_skills.join(', '));

  const result = await callLLM({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 4000,
  });

  const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  const scenario = JSON.parse(cleaned);

  // Ensure valid ID
  scenario.id = scenario.id || `scenario_generated_${Date.now()}_${scenarioIndex}`;

  return scenario as ScenarioConfig;
}

// ============================================================
// FULL PIPELINE: Seed Material → Knowledge Graph → Scenarios
// ============================================================

export interface IntelligenceResult {
  graph: WorkplaceGraph;
  discovery: DiscoveryResult;
  scenarios: ScenarioConfig[];
  processing_time_ms: number;
}

export async function generateEmployerScenarios(
  seedMaterial: string,
  employerId: string,
  maxScenarios: number = 3
): Promise<IntelligenceResult> {
  const startTime = Date.now();

  // Step 1: Extract knowledge graph
  const graph = await extractWorkplaceGraph(seedMaterial, employerId);

  // Step 2: Run discovery simulation
  const discovery = await runDiscoverySimulation(graph);

  // Step 3: Generate scenarios from top situations
  const numToGenerate = Math.min(maxScenarios, discovery.situations.length);
  const scenarios: ScenarioConfig[] = [];

  for (let i = 0; i < numToGenerate; i++) {
    try {
      const scenario = await generateScenarioFromSituation(
        discovery.situations[i],
        graph,
        i + 1
      );
      scenarios.push(scenario);
    } catch (e) {
      console.error(`Failed to generate scenario ${i + 1}:`, e);
    }
  }

  return {
    graph,
    discovery,
    scenarios,
    processing_time_ms: Date.now() - startTime,
  };
}
