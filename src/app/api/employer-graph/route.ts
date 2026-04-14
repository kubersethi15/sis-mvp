// Employer Intelligence API
// POST /api/employer-graph
// Actions: extract_graph, run_discovery, generate_scenarios, get_scenarios

import { NextRequest, NextResponse } from 'next/server';
import { extractEmployerGraph } from '@/lib/employer-intelligence/graph-extraction';
import { runDiscoverySimulation } from '@/lib/employer-intelligence/discovery-simulation';
import { generateEmployerScenarios, validateScenarioAgainstVacancy } from '@/lib/employer-intelligence/scenario-generator';
import { createServerClient } from '@/lib/supabase';

function db() { return createServerClient(); }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'extract_graph': return handleExtractGraph(body);
      case 'run_discovery': return handleRunDiscovery(body);
      case 'generate_scenarios': return handleGenerateScenarios(body);
      case 'full_pipeline': return handleFullPipeline(body);
      case 'get_scenarios': return handleGetScenarios(body);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Employer Intelligence API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// EXTRACT GRAPH from seed material
// ============================================================

async function handleExtractGraph(body: any) {
  const { employer_id, seed_material } = body;

  if (!employer_id || !seed_material) {
    return NextResponse.json({ error: 'employer_id and seed_material required' }, { status: 400 });
  }

  const graph = await extractEmployerGraph(employer_id, seed_material);

  // Store in Supabase
  try {
    await db().from('employer_graphs').upsert({
      employer_id,
      graph_data: graph,
      nodes_count: graph.nodes.length,
      edges_count: graph.edges.length,
      friction_points_count: graph.friction_points.length,
      critical_skills: graph.critical_skills.map(s => s.skill_name),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'employer_id' });
  } catch (e) {
    console.error('Failed to store graph:', e);
    // Non-fatal — return graph anyway
  }

  return NextResponse.json({
    graph,
    summary: {
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      friction_points: graph.friction_points.length,
      critical_skills: graph.critical_skills.map(s => `${s.skill_name} (${s.importance})`),
      industry: graph.workplace_culture.industry,
    },
  });
}

// ============================================================
// RUN DISCOVERY simulation on existing graph
// ============================================================

async function handleRunDiscovery(body: any) {
  const { employer_id } = body;

  // Fetch graph from Supabase
  const { data: stored } = await db().from('employer_graphs')
    .select('graph_data').eq('employer_id', employer_id).single();

  if (!stored?.graph_data) {
    return NextResponse.json({ error: 'No graph found for this employer. Extract graph first.' }, { status: 404 });
  }

  const graph = stored.graph_data as any;
  const discoveries = await runDiscoverySimulation(graph, {
    agentCount: 25,
    roundsPerSituation: 4,
    maxSituations: 5,
  });

  // Store discoveries
  try {
    await db().from('employer_graphs').update({
      discoveries: discoveries,
      discovery_run_at: new Date().toISOString(),
    }).eq('employer_id', employer_id);
  } catch (e) {
    console.error('Failed to store discoveries:', e);
  }

  return NextResponse.json({
    discoveries,
    count: discoveries.length,
    top_scenario: discoveries[0] || null,
  });
}

// ============================================================
// GENERATE SCENARIOS from discovery results
// ============================================================

async function handleGenerateScenarios(body: any) {
  const { employer_id, vacancy_skills } = body;

  // Fetch graph + discoveries
  const { data: stored } = await db().from('employer_graphs')
    .select('graph_data, discoveries').eq('employer_id', employer_id).single();

  if (!stored?.graph_data || !stored?.discoveries) {
    return NextResponse.json({ error: 'No graph or discoveries found. Run extraction and discovery first.' }, { status: 404 });
  }

  const scenarios = await generateEmployerScenarios(
    stored.discoveries as any[],
    stored.graph_data as any,
    3, // Generate top 3
  );

  // Validate against vacancy if skills provided
  const validations = vacancy_skills
    ? scenarios.map(s => ({ scenario: s.title, ...validateScenarioAgainstVacancy(s, vacancy_skills) }))
    : [];

  // Store scenarios
  try {
    await db().from('employer_scenarios').upsert({
      employer_id,
      scenarios: scenarios,
      scenario_count: scenarios.length,
      validations: validations,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'employer_id' });
  } catch (e) {
    console.error('Failed to store scenarios:', e);
  }

  return NextResponse.json({
    scenarios: scenarios.map(s => ({
      id: s.id,
      title: s.title,
      setting: s.setting,
      target_skills: s.target_skills,
      characters: s.characters.map(c => ({ name: c.name, role: c.role })),
      duration_rounds: s.duration_rounds,
    })),
    validations,
    count: scenarios.length,
  });
}

// ============================================================
// FULL PIPELINE — extract + discover + generate in one call
// ============================================================

async function handleFullPipeline(body: any) {
  const { employer_id, seed_material, vacancy_skills } = body;

  if (!employer_id || !seed_material) {
    return NextResponse.json({ error: 'employer_id and seed_material required' }, { status: 400 });
  }

  const steps: string[] = [];

  // Step 1: Extract graph
  steps.push('Extracting knowledge graph...');
  const graph = await extractEmployerGraph(employer_id, seed_material);
  steps.push(`Graph extracted: ${graph.nodes.length} entities, ${graph.edges.length} relationships, ${graph.friction_points.length} friction points`);

  // Store graph
  try {
    await db().from('employer_graphs').upsert({
      employer_id,
      graph_data: graph,
      nodes_count: graph.nodes.length,
      edges_count: graph.edges.length,
      friction_points_count: graph.friction_points.length,
      critical_skills: graph.critical_skills.map(s => s.skill_name),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'employer_id' });
  } catch { /* non-fatal */ }

  // Step 2: Run discovery
  steps.push('Running workplace discovery simulation...');
  const discoveries = await runDiscoverySimulation(graph, {
    agentCount: 20,
    roundsPerSituation: 3,
    maxSituations: 4,
  });
  steps.push(`Discovery complete: ${discoveries.length} assessment-worthy situations found`);

  // Store discoveries
  try {
    await db().from('employer_graphs').update({
      discoveries,
      discovery_run_at: new Date().toISOString(),
    }).eq('employer_id', employer_id);
  } catch { /* non-fatal */ }

  // Step 3: Generate scenarios
  steps.push('Generating employer-specific scenarios...');
  const scenarios = await generateEmployerScenarios(discoveries, graph, 3);
  steps.push(`${scenarios.length} scenarios generated`);

  // Validate
  const validations = vacancy_skills
    ? scenarios.map(s => ({ scenario: s.title, ...validateScenarioAgainstVacancy(s, vacancy_skills) }))
    : [];

  // Store scenarios
  try {
    await db().from('employer_scenarios').upsert({
      employer_id,
      scenarios,
      scenario_count: scenarios.length,
      validations,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'employer_id' });
  } catch { /* non-fatal */ }

  return NextResponse.json({
    success: true,
    steps,
    graph_summary: {
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      friction_points: graph.friction_points.length,
      critical_skills: graph.critical_skills.map(s => s.skill_name),
    },
    discoveries: discoveries.map(d => ({
      rank: d.rank,
      title: d.title,
      assessment_value: d.assessment_value,
      skills_tested: d.skills_tested,
    })),
    scenarios: scenarios.map(s => ({
      id: s.id,
      title: s.title,
      setting: s.setting,
      target_skills: s.target_skills,
      characters: s.characters.map(c => ({ name: c.name, role: c.role })),
    })),
    validations,
  });
}

// ============================================================
// GET existing scenarios for an employer
// ============================================================

async function handleGetScenarios(body: any) {
  const { employer_id } = body;

  const { data } = await db().from('employer_scenarios')
    .select('*').eq('employer_id', employer_id).single();

  if (!data) {
    return NextResponse.json({ scenarios: [], message: 'No scenarios generated yet' });
  }

  return NextResponse.json({
    scenarios: data.scenarios,
    count: data.scenario_count,
    generated_at: data.generated_at,
  });
}
