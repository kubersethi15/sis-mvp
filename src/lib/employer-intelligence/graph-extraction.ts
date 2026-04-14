// Employer Knowledge Graph Extraction
// Takes employer seed material (JDs, handbook, company description)
// Uses Claude to extract a structured workplace knowledge graph
// Stored in Supabase for discovery simulation + scenario generation

import { callLLM } from '@/lib/llm';

// ============================================================
// TYPES
// ============================================================

export interface GraphNode {
  id: string;
  type: 'role' | 'department' | 'customer_type' | 'process' | 'system' | 'location' | 'stakeholder';
  name: string;
  attributes: {
    description: string;
    skills_required?: string[];
    pressure_points?: string[];
    cultural_notes?: string[];  // Filipino workplace norms relevant to this entity
    hierarchy_level?: 'frontline' | 'supervisor' | 'manager' | 'executive';
  };
}

export interface GraphEdge {
  id: string;
  from_node: string;  // node ID
  to_node: string;    // node ID
  relationship: 'reports_to' | 'collaborates_with' | 'serves' | 'depends_on' | 'conflicts_with' | 'mentors' | 'competes_with' | 'escalates_to';
  weight: number;     // 0-1 strength of relationship
  context: string;    // why this relationship matters
  friction_potential: number; // 0-1 how likely this relationship creates assessment-worthy situations
}

export interface EmployerGraph {
  employer_id: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  critical_skills: CriticalSkill[];
  friction_points: FrictionPoint[];
  workplace_culture: WorkplaceCulture;
  generated_at: string;
}

export interface CriticalSkill {
  skill_name: string;           // PSF skill name
  importance: 'critical' | 'important' | 'nice_to_have';
  reason: string;               // Why this skill matters for this employer
  evidence_from_seed: string;   // What in the seed material indicated this
}

export interface FrictionPoint {
  id: string;
  description: string;          // "Customer complaints about wait times during peak hours"
  entities_involved: string[];  // node IDs
  skills_tested: string[];      // PSF skills this situation would test
  assessment_value: number;     // 0-1 how good this would be as a simulation scenario
  scenario_seed: string;        // Brief scenario concept: "Branch counter, 4:30 PM Friday, queue of 12..."
}

export interface WorkplaceCulture {
  formality: 'formal' | 'semi_formal' | 'casual';
  hierarchy_strength: 'strong' | 'moderate' | 'flat';
  communication_style: 'direct' | 'indirect' | 'mixed';
  filipino_cultural_factors: string[];  // e.g. "strong utang na loob norms", "pakikiramdam expected"
  team_structure: string;               // "Small teams of 3-5 with rotating leads"
  customer_facing: boolean;
  industry: string;
}

// ============================================================
// EXTRACTION PROMPT
// ============================================================

const GRAPH_EXTRACTION_PROMPT = `You are a workplace intelligence analyst. You extract structured knowledge graphs from employer materials to understand how their workplace actually functions — the roles, relationships, pressure points, and skill demands.

EMPLOYER SEED MATERIAL:
{seed_material}

Analyze this material and extract a comprehensive workplace knowledge graph.

Return ONLY valid JSON with this structure:
{
  "nodes": [
    {
      "id": "node_001",
      "type": "role|department|customer_type|process|system|location|stakeholder",
      "name": "Branch Teller",
      "attributes": {
        "description": "Front-line customer service role handling transactions",
        "skills_required": ["Communication", "Customer Service", "Problem-Solving"],
        "pressure_points": ["Long queues during peak hours", "System outages", "Irate customers"],
        "cultural_notes": ["Expected to use po/opo with older customers", "Strong utang na loob to supervisor who hired them"],
        "hierarchy_level": "frontline"
      }
    }
  ],
  "edges": [
    {
      "id": "edge_001",
      "from_node": "node_001",
      "to_node": "node_002",
      "relationship": "reports_to|collaborates_with|serves|depends_on|conflicts_with|mentors|competes_with|escalates_to",
      "weight": 0.8,
      "context": "Teller reports to Branch Supervisor for daily operations",
      "friction_potential": 0.6
    }
  ],
  "critical_skills": [
    {
      "skill_name": "Communication",
      "importance": "critical",
      "reason": "Customer-facing role requires clear, empathetic communication across languages",
      "evidence_from_seed": "JD mentions 'excellent customer service in English and Filipino' as top requirement"
    }
  ],
  "friction_points": [
    {
      "id": "fp_001",
      "description": "Customer complaint about double-charged transaction during system slowdown",
      "entities_involved": ["node_001", "node_003", "node_005"],
      "skills_tested": ["Problem-Solving", "Communication", "Emotional Intelligence"],
      "assessment_value": 0.9,
      "scenario_seed": "Branch counter, Friday afternoon. System is running slow. Customer discovers they were charged twice for a remittance. New colleague is watching. Supervisor is on a call."
    }
  ],
  "workplace_culture": {
    "formality": "semi_formal",
    "hierarchy_strength": "strong",
    "communication_style": "indirect",
    "filipino_cultural_factors": ["Respectful use of po/opo and honorifics", "Strong hiya norms — employees avoid public confrontation", "Bayanihan during emergencies — team pulls together"],
    "team_structure": "Small branch teams of 4-8 people with one supervisor",
    "customer_facing": true,
    "industry": "Financial services / Remittance"
  }
}

EXTRACTION RULES:
1. Extract at least 5 nodes and 5 edges. More is better if the seed material supports it.
2. Every friction_point should be a realistic workplace situation that could become an assessment scenario.
3. Rate friction_points by assessment_value — how well would this situation differentiate a skilled performer from an unskilled one?
4. Include Filipino cultural context where relevant (SP concepts: kapwa, pakikiramdam, bayanihan, hiya, utang na loob).
5. Critical skills should map to PSF Enabling Skills: Communication, Collaboration, Problem-Solving, Adaptability, Emotional Intelligence, Self-Management, Learning Agility, Digital Literacy.
6. The scenario_seed in each friction_point should be vivid and specific — setting, time, who's present, what's happening.
7. If the seed material is sparse, infer reasonable workplace dynamics from the industry and roles described.

Return ONLY valid JSON. No markdown, no explanation.`;

// ============================================================
// EXTRACT KNOWLEDGE GRAPH
// ============================================================

export async function extractEmployerGraph(
  employerId: string,
  seedMaterial: string
): Promise<EmployerGraph> {
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
    workplace_culture: graph.workplace_culture || {},
    generated_at: new Date().toISOString(),
  };
}

// ============================================================
// HELPERS
// ============================================================

export function getHighValueFrictionPoints(graph: EmployerGraph, minValue: number = 0.7): FrictionPoint[] {
  return graph.friction_points
    .filter(fp => fp.assessment_value >= minValue)
    .sort((a, b) => b.assessment_value - a.assessment_value);
}

export function getCriticalSkills(graph: EmployerGraph): string[] {
  return graph.critical_skills
    .filter(s => s.importance === 'critical' || s.importance === 'important')
    .map(s => s.skill_name);
}

export function getEntitiesForFrictionPoint(graph: EmployerGraph, frictionPointId: string): GraphNode[] {
  const fp = graph.friction_points.find(f => f.id === frictionPointId);
  if (!fp) return [];
  return graph.nodes.filter(n => fp.entities_involved.includes(n.id));
}
