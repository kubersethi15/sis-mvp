// Layer 2 Multi-Agent Simulation API
// Manages GameMaster sessions and processes candidate interaction rounds
// Architecture: Concordia Game Master + Managed Agents pattern

import { NextRequest, NextResponse } from 'next/server';
import { GameMaster, SimulationReport, CharacterMessage } from '@/lib/simulation/engine';
import { SCENARIOS, selectScenarios } from '@/lib/scenarios';
import { createServerClient } from '@/lib/supabase';

function db() { return createServerClient(); }

// In-memory session store (production: use Redis or Supabase)
const sessions = new Map<string, GameMaster>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'start': return handleStart(body);
      case 'respond': return handleRespond(body);
      case 'get_state': return handleGetState(body);
      case 'complete': return handleComplete(body);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Layer 2 Simulation API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// START — Select scenario, create GameMaster, get opening messages
// ============================================================

async function handleStart(body: any) {
  const { application_id, scenario_id, layer2_seeds } = body;

  // Select scenario — either specified or auto-selected from seeds
  let scenario;
  if (scenario_id && SCENARIOS[scenario_id]) {
    scenario = SCENARIOS[scenario_id];
  } else {
    const selected = selectScenarios(layer2_seeds || [], 1);
    scenario = selected[0];
  }

  if (!scenario) {
    return NextResponse.json({ error: 'No scenario available' }, { status: 400 });
  }

  // Create GameMaster session
  const sessionId = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const gm = new GameMaster(scenario);
  sessions.set(sessionId, gm);

  // Get opening messages from characters
  const openingMessages = await gm.startSimulation();

  return NextResponse.json({
    session_id: sessionId,
    scenario: {
      id: scenario.id,
      title: scenario.title,
      setting: scenario.setting,
      opening_situation: scenario.opening_situation,
      duration_rounds: scenario.duration_rounds,
      characters: scenario.characters.map(c => ({
        id: c.id,
        name: c.name,
        role: c.role,
        relationship: c.relationship_to_candidate,
      })),
      target_skills: scenario.target_skills,
    },
    opening_messages: openingMessages,
    current_round: 1,
    total_rounds: scenario.duration_rounds,
  });
}

// ============================================================
// RESPOND — Process candidate's message, get character reactions
// ============================================================

async function handleRespond(body: any) {
  const { session_id, message } = body;

  const gm = sessions.get(session_id);
  if (!gm) {
    return NextResponse.json({ error: 'Session not found. It may have expired.' }, { status: 404 });
  }

  const result = await gm.processRound(message);
  const state = gm.getState();

  return NextResponse.json({
    character_messages: result.character_messages,
    checkpoint: result.checkpoint ? {
      skills_evaluated: result.checkpoint.skills_evaluated,
      observer_narrative: result.checkpoint.observer_narrative,
    } : null,
    is_complete: result.is_complete,
    current_round: state.current_round,
    total_rounds: state.scenario.duration_rounds,
  });
}

// ============================================================
// GET STATE — Return current simulation state
// ============================================================

async function handleGetState(body: any) {
  const { session_id } = body;

  const gm = sessions.get(session_id);
  if (!gm) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const state = gm.getState();
  return NextResponse.json({
    status: state.status,
    current_round: state.current_round,
    total_rounds: state.scenario.duration_rounds,
    rounds: state.rounds.map(r => ({
      round_number: r.round_number,
      character_messages: r.character_messages,
      candidate_response: r.candidate_response,
      has_checkpoint: !!r.checkpoint_evaluation,
    })),
  });
}

// ============================================================
// COMPLETE — Generate final report with convergence
// ============================================================

async function handleComplete(body: any) {
  const { session_id, application_id, layer1_skills } = body;

  const gm = sessions.get(session_id);
  if (!gm) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Generate final report
  const report = await gm.generateReport(layer1_skills);

  // Store in Supabase if application_id provided
  if (application_id) {
    try {
      const supabase = db();

      // Update or create gate3_results
      const { data: existing } = await supabase.from('gate3_results')
        .select('id').eq('application_id', application_id).limit(1).single();

      const simulationData = {
        scenario_id: report.scenario_id,
        scenario_title: report.scenario_title,
        rounds_completed: report.rounds_completed,
        skill_scores: report.skill_scores,
        sotopia_scores: report.sotopia_scores,
        convergence: report.convergence,
        observer_summary: report.observer_summary,
        gaming_flags: report.gaming_flags,
        transcript: report.evidence_for_psychologist,
      };

      if (existing) {
        await supabase.from('gate3_results').update({
          simulation_results: simulationData,
          readiness_index: calculateReadinessIndex(report),
          ai_recommendation: generateRecommendation(report),
        }).eq('id', existing.id);
      } else {
        await supabase.from('gate3_results').insert({
          application_id,
          simulation_results: simulationData,
          readiness_index: calculateReadinessIndex(report),
          ai_recommendation: generateRecommendation(report),
        });
      }

      // Update application status
      await supabase.from('applications').update({
        status: 'gate3_pending',
        current_gate: 3,
      }).eq('id', application_id);

    } catch (e) {
      console.error('Error saving simulation results:', e);
    }
  }

  // Clean up session
  sessions.delete(session_id);

  return NextResponse.json({ report });
}

// ============================================================
// HELPERS
// ============================================================

function calculateReadinessIndex(report: SimulationReport): number {
  if (!report.skill_scores?.length) return 50;

  const proficiencyScore = (p: string) =>
    p === 'Advanced' ? 90 : p === 'Intermediate' ? 70 : p === 'Basic' ? 45 : 30;

  const avgProficiency = report.skill_scores.reduce(
    (sum, s) => sum + proficiencyScore(s.proficiency), 0
  ) / report.skill_scores.length;

  const avgConfidence = report.skill_scores.reduce(
    (sum, s) => sum + (s.confidence || 0.5), 0
  ) / report.skill_scores.length;

  // Convergence bonus
  const convergentCount = report.convergence?.filter(c => c.convergent).length || 0;
  const convergenceBonus = report.convergence?.length
    ? (convergentCount / report.convergence.length) * 10
    : 0;

  return Math.round(avgProficiency * 0.6 + avgConfidence * 100 * 0.3 + convergenceBonus);
}

function generateRecommendation(report: SimulationReport): string {
  const skills = report.skill_scores || [];
  const advanced = skills.filter(s => s.proficiency === 'Advanced');
  const basic = skills.filter(s => s.proficiency === 'Basic');
  const convergent = report.convergence?.filter(c => c.convergent) || [];
  const divergent = report.convergence?.filter(c => !c.convergent && c.layer1_score !== 'Not assessed' && c.layer2_score !== 'Not assessed') || [];

  let rec = `Simulation completed: ${report.scenario_title}. `;
  rec += `${skills.length} skills assessed across ${report.rounds_completed} rounds. `;

  if (advanced.length > 0) {
    rec += `Strong performance in: ${advanced.map(s => s.skill_name).join(', ')}. `;
  }
  if (basic.length > 0) {
    rec += `Areas for development: ${basic.map(s => s.skill_name).join(', ')}. `;
  }
  if (convergent.length > 0) {
    rec += `${convergent.length} skill(s) confirmed by both conversation and simulation — high confidence. `;
  }
  if (divergent.length > 0) {
    rec += `${divergent.length} skill(s) showed different levels between conversation and simulation — recommend psychologist review. `;
  }

  return rec;
}
