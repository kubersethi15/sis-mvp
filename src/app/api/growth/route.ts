// Growth Tracking API
// POST /api/growth
// Actions: get_trajectory, compare_sessions, calculate_velocity, cohort_summary, tag_session

import { NextRequest, NextResponse } from 'next/server';
import { buildGrowthTrajectory, buildCohortSummary, calculateDelta, SkillSnapshot } from '@/lib/growth/growth-engine';
import { createServerClient } from '@/lib/supabase';

function db() { return createServerClient(); }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'get_trajectory': return handleTrajectory(body);
      case 'compare_sessions': return handleCompare(body);
      case 'tag_session': return handleTagSession(body);
      case 'cohort_summary': return handleCohortSummary(body);
      case 'create_cohort': return handleCreateCohort(body);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Growth API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// GET TRAJECTORY — full growth picture for one candidate
// ============================================================

async function handleTrajectory(body: any) {
  const { user_id } = body;

  // Fetch all completed sessions with extractions
  const { data: sessions } = await db().from('leee_sessions')
    .select('id, created_at, session_tag, status')
    .eq('user_id', user_id)
    .eq('status', 'completed')
    .order('created_at', { ascending: true });

  if (!sessions?.length) {
    return NextResponse.json({ trajectory: null, message: 'No completed sessions found' });
  }

  // Fetch extraction for each session
  const sessionData = [];
  for (const session of sessions) {
    const { data: ext } = await db().from('leee_extractions')
      .select('skills_profile')
      .eq('session_id', session.id)
      .limit(1).single();

    if (ext?.skills_profile) {
      sessionData.push({
        session_id: session.id,
        date: session.created_at,
        tag: session.session_tag || 'conversation',
        skills: ext.skills_profile.map((s: any): SkillSnapshot => ({
          skill_name: s.skill_name,
          proficiency: s.proficiency,
          confidence: s.confidence || s.adjusted_confidence || 0.5,
          session_id: session.id,
          session_date: session.created_at,
          session_tag: session.session_tag,
        })),
      });
    }
  }

  if (sessionData.length < 1) {
    return NextResponse.json({ trajectory: null, message: 'No extractions found' });
  }

  const trajectory = buildGrowthTrajectory(user_id, sessionData);

  return NextResponse.json({ trajectory });
}

// ============================================================
// COMPARE — delta between two specific sessions
// ============================================================

async function handleCompare(body: any) {
  const { session_id_before, session_id_after } = body;

  const [{ data: before }, { data: after }] = await Promise.all([
    db().from('leee_extractions').select('skills_profile, created_at').eq('session_id', session_id_before).limit(1).single(),
    db().from('leee_extractions').select('skills_profile, created_at').eq('session_id', session_id_after).limit(1).single(),
  ]);

  if (!before?.skills_profile || !after?.skills_profile) {
    return NextResponse.json({ error: 'One or both sessions not found' }, { status: 404 });
  }

  const daysBetween = Math.max(1,
    (new Date(after.created_at).getTime() - new Date(before.created_at).getTime()) / (24 * 60 * 60 * 1000)
  );

  const beforeSkills: SkillSnapshot[] = before.skills_profile.map((s: any) => ({
    skill_name: s.skill_name, proficiency: s.proficiency, confidence: s.confidence || 0.5,
    session_id: session_id_before, session_date: before.created_at,
  }));
  const afterSkills: SkillSnapshot[] = after.skills_profile.map((s: any) => ({
    skill_name: s.skill_name, proficiency: s.proficiency, confidence: s.confidence || 0.5,
    session_id: session_id_after, session_date: after.created_at,
  }));

  const deltas = calculateDelta(beforeSkills, afterSkills, daysBetween);

  return NextResponse.json({
    deltas,
    days_between: Math.round(daysBetween),
    improved: deltas.filter(d => d.direction === 'improved').length,
    stable: deltas.filter(d => d.direction === 'stable').length,
    declined: deltas.filter(d => d.direction === 'declined').length,
  });
}

// ============================================================
// TAG SESSION — mark a session as baseline/post-training/etc
// ============================================================

async function handleTagSession(body: any) {
  const { session_id, tag } = body;
  // Valid tags: "baseline", "mid-program", "post-program", "follow-up"

  const { error } = await db().from('leee_sessions').update({
    session_tag: tag,
  }).eq('id', session_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, session_id, tag });
}

// ============================================================
// CREATE COHORT
// ============================================================

async function handleCreateCohort(body: any) {
  const { cohort_name, program_id, candidate_ids } = body;

  try {
    const { data } = await db().from('training_cohorts').insert({
      name: cohort_name,
      program_id: program_id || null,
      candidate_ids: candidate_ids || [],
      created_at: new Date().toISOString(),
    }).select().single();

    return NextResponse.json({ cohort: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ============================================================
// COHORT SUMMARY — aggregate growth across candidates
// ============================================================

async function handleCohortSummary(body: any) {
  const { cohort_id } = body;

  // Fetch cohort
  const { data: cohort } = await db().from('training_cohorts')
    .select('*').eq('id', cohort_id).single();

  if (!cohort) return NextResponse.json({ error: 'Cohort not found' }, { status: 404 });

  // Build trajectory for each candidate
  const trajectories = [];
  for (const candidateId of (cohort.candidate_ids || [])) {
    const { data: sessions } = await db().from('leee_sessions')
      .select('id, created_at, session_tag, status')
      .eq('user_id', candidateId)
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    if (!sessions?.length) continue;

    const sessionData = [];
    for (const session of sessions) {
      const { data: ext } = await db().from('leee_extractions')
        .select('skills_profile').eq('session_id', session.id).limit(1).single();

      if (ext?.skills_profile) {
        sessionData.push({
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

    if (sessionData.length >= 2) {
      trajectories.push(buildGrowthTrajectory(candidateId, sessionData));
    }
  }

  const summary = buildCohortSummary(cohort.id, cohort.name, trajectories);

  return NextResponse.json({ summary });
}
