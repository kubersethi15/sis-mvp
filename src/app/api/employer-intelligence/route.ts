// Employer Intelligence API
// POST /api/employer-intelligence
// Actions: generate (full pipeline), get_scenarios, get_graph

import { NextRequest, NextResponse } from 'next/server';
import { generateEmployerScenarios, IntelligenceResult } from '@/lib/intelligence/employer-intelligence';
import { createServerClient } from '@/lib/supabase';

function db() { return createServerClient(); }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'generate': return handleGenerate(body);
      case 'get_scenarios': return handleGetScenarios(body);
      case 'get_graph': return handleGetGraph(body);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('Employer intelligence error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ============================================================
// GENERATE — Full pipeline: seed material → graph → scenarios
// ============================================================

async function handleGenerate(body: any) {
  const { employer_id, seed_material, max_scenarios } = body;

  if (!employer_id || !seed_material) {
    return NextResponse.json({ error: 'employer_id and seed_material required' }, { status: 400 });
  }

  // Run the full pipeline
  const result = await generateEmployerScenarios(
    seed_material,
    employer_id,
    max_scenarios || 3
  );

  // Store results in Supabase
  try {
    const supabase = db();

    // Store the knowledge graph
    await supabase.from('employer_intelligence').upsert({
      employer_id,
      workplace_graph: {
        nodes: result.graph.nodes,
        edges: result.graph.edges,
        critical_skills: result.graph.critical_skills,
        friction_points: result.graph.friction_points,
        industry_context: result.graph.industry_context,
      },
      discovery_results: {
        situations: result.discovery.situations,
        recommended_scenarios: result.discovery.recommended_scenarios,
      },
      generated_scenarios: result.scenarios,
      processing_time_ms: result.processing_time_ms,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'employer_id' });

  } catch (e) {
    console.error('Failed to store intelligence results:', e);
    // Non-fatal — return results even if storage fails
  }

  return NextResponse.json({
    status: 'complete',
    graph_summary: {
      nodes: result.graph.nodes.length,
      edges: result.graph.edges.length,
      critical_skills: result.graph.critical_skills,
      friction_points: result.graph.friction_points.length,
      industry: result.graph.industry_context,
    },
    discovery: {
      situations_found: result.discovery.situations.length,
      top_situations: result.discovery.situations.slice(0, 5).map(s => ({
        title: s.title,
        skills: s.skills_tested,
        differentiation_score: s.differentiation_score,
      })),
    },
    scenarios_generated: result.scenarios.length,
    scenarios: result.scenarios.map(s => ({
      id: s.id,
      title: s.title,
      setting: s.setting,
      target_skills: s.target_skills,
      characters: s.characters.length,
      rounds: s.duration_rounds,
    })),
    processing_time_ms: result.processing_time_ms,
  });
}

// ============================================================
// GET SCENARIOS — Retrieve stored scenarios for an employer
// ============================================================

async function handleGetScenarios(body: any) {
  const { employer_id } = body;
  if (!employer_id) return NextResponse.json({ error: 'employer_id required' }, { status: 400 });

  try {
    const { data } = await db().from('employer_intelligence')
      .select('generated_scenarios, generated_at')
      .eq('employer_id', employer_id)
      .single();

    if (!data?.generated_scenarios) {
      return NextResponse.json({ scenarios: [], generated: false });
    }

    return NextResponse.json({
      scenarios: data.generated_scenarios,
      generated_at: data.generated_at,
      generated: true,
    });
  } catch {
    return NextResponse.json({ scenarios: [], generated: false });
  }
}

// ============================================================
// GET GRAPH — Retrieve workplace knowledge graph
// ============================================================

async function handleGetGraph(body: any) {
  const { employer_id } = body;
  if (!employer_id) return NextResponse.json({ error: 'employer_id required' }, { status: 400 });

  try {
    const { data } = await db().from('employer_intelligence')
      .select('workplace_graph, discovery_results, generated_at')
      .eq('employer_id', employer_id)
      .single();

    if (!data?.workplace_graph) {
      return NextResponse.json({ graph: null, generated: false });
    }

    return NextResponse.json({
      graph: data.workplace_graph,
      discovery: data.discovery_results,
      generated_at: data.generated_at,
      generated: true,
    });
  } catch {
    return NextResponse.json({ graph: null, generated: false });
  }
}
