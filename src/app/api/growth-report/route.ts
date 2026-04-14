// Growth Report API
// POST /api/growth-report
// Generates structured impact reports for cohorts and individual candidates
// Output is JSON that can be rendered to PDF/DOCX on the client or exported

import { NextRequest, NextResponse } from 'next/server';
import { buildGrowthTrajectory, buildCohortSummary, SkillSnapshot } from '@/lib/growth/growth-engine';
import { createServerClient } from '@/lib/supabase';

function db() { return createServerClient(); }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'cohort_report': return handleCohortReport(body);
      case 'individual_report': return handleIndividualReport(body);
      case 'funder_report': return handleFunderReport(body);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Growth Report API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// T10: COHORT IMPACT REPORT
// ============================================================

async function handleCohortReport(body: any) {
  const { cohort_id } = body;

  const { data: cohort } = await db().from('training_cohorts')
    .select('*').eq('id', cohort_id).single();

  if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });

  const trajectories = await loadCohortTrajectories(cohort.candidate_ids || []);
  const summary = buildCohortSummary(cohort.id, cohort.name, trajectories);

  const report = {
    title: `Training Impact Report: ${cohort.name}`,
    generated_at: new Date().toISOString(),
    cohort: {
      name: cohort.name,
      created_at: cohort.created_at,
      candidate_count: summary.candidate_count,
    },
    executive_summary: summary.summary,
    metrics: {
      participants: summary.candidate_count,
      avg_improvement: summary.avg_improvement,
      skills_improved: Object.values(summary.skill_improvements).filter((s: any) => s.avg_delta > 0).length,
      skills_measured: Object.keys(summary.skill_improvements).length,
    },
    skill_details: Object.entries(summary.skill_improvements).map(([skill, data]: [string, any]) => ({
      skill,
      avg_delta: data.avg_delta,
      improved_count: data.improved_count,
      total_count: data.total_count,
      improvement_rate: Math.round((data.improved_count / Math.max(1, data.total_count)) * 100),
    })).sort((a, b) => b.avg_delta - a.avg_delta),
    top_movers: summary.top_movers,
    lagging_skills: summary.lagging_skills,
    individual_trajectories: trajectories.map(t => ({
      candidate_id: t.candidate_id,
      sessions: t.sessions.length,
      overall_improvement: t.overall_improvement,
      top_improved: t.top_improved,
      needs_attention: t.needs_attention,
    })),
  };

  return NextResponse.json({ report });
}

// ============================================================
// INDIVIDUAL GROWTH REPORT
// ============================================================

async function handleIndividualReport(body: any) {
  const { user_id } = body;

  const sessions = await loadUserSessions(user_id);
  if (sessions.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 sessions for a growth report' }, { status: 400 });
  }

  const trajectory = buildGrowthTrajectory(user_id, sessions);

  // Get candidate name
  let candidateName = 'Candidate';
  try {
    const { data: profile } = await db().from('user_profiles')
      .select('full_name').eq('id', user_id).single();
    if (profile?.full_name) candidateName = profile.full_name;
  } catch {}

  const report = {
    title: `Growth Report: ${candidateName}`,
    generated_at: new Date().toISOString(),
    candidate: { id: user_id, name: candidateName },
    sessions_count: trajectory.sessions.length,
    time_span_days: trajectory.deltas.length > 0 ? trajectory.deltas[0].time_between_days : 0,
    overall_improvement: trajectory.overall_improvement,
    summary: trajectory.summary,
    skill_changes: trajectory.deltas.map(d => ({
      skill: d.skill_name,
      from: d.from_proficiency,
      to: d.to_proficiency,
      direction: d.direction,
      magnitude: d.magnitude,
      confidence_change: d.confidence_change,
    })),
    velocity: trajectory.velocity.map(v => ({
      skill: v.skill_name,
      rate: v.velocity,
      classification: v.classification,
    })),
    top_improved: trajectory.top_improved,
    needs_attention: trajectory.needs_attention,
  };

  return NextResponse.json({ report });
}

// ============================================================
// T14: FUNDER REPORT — Ashoka/Cisco format
// ============================================================

async function handleFunderReport(body: any) {
  const { cohort_ids, program_name, funder_name, reporting_period } = body;

  if (!cohort_ids?.length) {
    return NextResponse.json({ error: 'cohort_ids required' }, { status: 400 });
  }

  // Aggregate across multiple cohorts
  const allTrajectories: any[] = [];
  const cohortSummaries: any[] = [];

  for (const cohortId of cohort_ids) {
    const { data: cohort } = await db().from('training_cohorts')
      .select('*').eq('id', cohortId).single();
    if (!cohort) continue;

    const trajectories = await loadCohortTrajectories(cohort.candidate_ids || []);
    const summary = buildCohortSummary(cohort.id, cohort.name, trajectories);
    allTrajectories.push(...trajectories);
    cohortSummaries.push(summary);
  }

  const totalParticipants = allTrajectories.length;
  const totalImproved = allTrajectories.filter(t => t.overall_improvement > 0).length;
  const avgImprovement = totalParticipants > 0
    ? allTrajectories.reduce((sum, t) => sum + t.overall_improvement, 0) / totalParticipants
    : 0;

  // Aggregate skill improvements across all cohorts
  const skillAgg: Record<string, { deltas: number[]; improved: number }> = {};
  for (const traj of allTrajectories) {
    for (const delta of traj.deltas) {
      if (!skillAgg[delta.skill_name]) skillAgg[delta.skill_name] = { deltas: [], improved: 0 };
      skillAgg[delta.skill_name].deltas.push(
        delta.direction === 'improved' ? delta.magnitude : delta.direction === 'declined' ? -delta.magnitude : 0
      );
      if (delta.direction === 'improved') skillAgg[delta.skill_name].improved++;
    }
  }

  const report = {
    title: `Impact Report: ${program_name || 'Virtualahan Training Programs'}`,
    funder: funder_name || 'Stakeholder',
    reporting_period: reporting_period || 'Current period',
    generated_at: new Date().toISOString(),

    executive_summary: `${program_name || 'Virtualahan'} training programs served ${totalParticipants} participants across ${cohort_ids.length} cohort(s). ${Math.round((totalImproved / Math.max(1, totalParticipants)) * 100)}% showed measurable skills improvement, with an average improvement of ${avgImprovement.toFixed(2)} proficiency levels across all skills measured. ${
      Object.entries(skillAgg).filter(([_, d]) => d.deltas.reduce((a, b) => a + b, 0) > 0).length
    } out of ${Object.keys(skillAgg).length} measured skills showed positive movement.`,

    headline_metrics: {
      total_participants: totalParticipants,
      showed_improvement: totalImproved,
      improvement_rate: Math.round((totalImproved / Math.max(1, totalParticipants)) * 100),
      avg_proficiency_gain: Math.round(avgImprovement * 100) / 100,
      cohorts_completed: cohort_ids.length,
      skills_measured: Object.keys(skillAgg).length,
    },

    skill_impact: Object.entries(skillAgg).map(([skill, data]) => ({
      skill,
      avg_change: Math.round((data.deltas.reduce((a, b) => a + b, 0) / Math.max(1, data.deltas.length)) * 100) / 100,
      improved_count: data.improved,
      total_assessed: data.deltas.length,
      improvement_rate: Math.round((data.improved / Math.max(1, data.deltas.length)) * 100),
    })).sort((a, b) => b.avg_change - a.avg_change),

    cohort_breakdown: cohortSummaries.map(s => ({
      name: s.cohort_name,
      participants: s.candidate_count,
      avg_improvement: s.avg_improvement,
      top_skills: Object.entries(s.skill_improvements)
        .filter(([_, d]: [string, any]) => d.avg_delta > 0)
        .sort((a: any, b: any) => b[1].avg_delta - a[1].avg_delta)
        .slice(0, 3)
        .map(([skill]: [string, any]) => skill),
    })),

    methodology_note: 'Skills are measured using the Kaya Skills Intelligence System (SIS), which uses AI-powered behavioral evidence extraction from structured conversations. Each participant completes a baseline assessment before training and a post-program assessment after. Proficiency levels are mapped to the Philippine Skills Framework (PSF) Enabling Skills taxonomy. Improvement is measured as the change in proficiency level per skill between baseline and post-program assessments.',
  };

  return NextResponse.json({ report });
}

// ============================================================
// HELPERS
// ============================================================

async function loadUserSessions(userId: string) {
  const { data: sessions } = await db().from('leee_sessions')
    .select('id, created_at, session_tag, status')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: true });

  if (!sessions?.length) return [];

  const result = [];
  for (const session of sessions) {
    const { data: ext } = await db().from('leee_extractions')
      .select('skills_profile').eq('session_id', session.id).limit(1).single();
    if (ext?.skills_profile) {
      result.push({
        session_id: session.id,
        date: session.created_at,
        tag: session.session_tag || 'conversation',
        skills: ext.skills_profile.map((s: any): SkillSnapshot => ({
          skill_name: s.skill_name, proficiency: s.proficiency,
          confidence: s.confidence || 0.5, session_id: session.id,
          session_date: session.created_at,
        })),
      });
    }
  }
  return result;
}

async function loadCohortTrajectories(candidateIds: string[]) {
  const trajectories = [];
  for (const candidateId of candidateIds) {
    const sessions = await loadUserSessions(candidateId);
    if (sessions.length >= 2) {
      trajectories.push(buildGrowthTrajectory(candidateId, sessions));
    }
  }
  return trajectories;
}
