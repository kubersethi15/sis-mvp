// Peer Assessment API (Layer 3)
// POST /api/peer-assessment
// Actions: invite, submit, get_status, calculate_convergence

import { NextRequest, NextResponse } from 'next/server';
import {
  generateRubric, generateReferenceToken, calculateThreeLayerConvergence,
  verifyReferenceIndependence, PeerAssessment,
} from '@/lib/layer3/peer-assessment';
import { createServerClient } from '@/lib/supabase';

function db() { return createServerClient(); }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'invite_references': return handleInvite(body);
      case 'get_rubric': return handleGetRubric(body);
      case 'submit_assessment': return handleSubmit(body);
      case 'get_status': return handleGetStatus(body);
      case 'calculate_convergence': return handleConvergence(body);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Peer Assessment API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// INVITE — candidate provides reference contacts
// ============================================================

async function handleInvite(body: any) {
  const { candidate_id, application_id, references } = body;
  // references: [{ name, relationship, email?, phone? }]

  if (!candidate_id || !references?.length) {
    return NextResponse.json({ error: 'candidate_id and references required' }, { status: 400 });
  }

  const created = [];
  for (const ref of references) {
    const token = generateReferenceToken();
    try {
      const { data } = await db().from('peer_references').insert({
        candidate_id,
        application_id: application_id || null,
        name: ref.name,
        relationship: ref.relationship,
        email: ref.email || null,
        phone: ref.phone || null,
        token,
        status: 'invited',
        invited_at: new Date().toISOString(),
      }).select().single();

      created.push({
        id: data?.id,
        name: ref.name,
        relationship: ref.relationship,
        token,
        link: `/reference?token=${token}`,
      });
    } catch (e) {
      console.error('Failed to create reference:', e);
    }
  }

  return NextResponse.json({
    references: created,
    count: created.length,
    message: `${created.length} reference(s) invited. Share the links with them.`,
  });
}

// ============================================================
// GET RUBRIC — returns the assessment form for a reference
// ============================================================

async function handleGetRubric(body: any) {
  const { token } = body;

  // Look up reference by token
  const { data: ref } = await db().from('peer_references')
    .select('*, candidate_id').eq('token', token).single();

  if (!ref) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
  }

  if (ref.status === 'submitted') {
    return NextResponse.json({ error: 'You have already submitted your assessment. Thank you!' }, { status: 400 });
  }

  // Get L1+L2 data to generate adaptive rubric
  let l1Skills: any[] = [];
  let l2Skills: any[] = [];
  let candidateName = 'the candidate';

  try {
    // Get candidate name
    const { data: profile } = await db().from('user_profiles')
      .select('full_name').eq('id', ref.candidate_id).single();
    if (profile?.full_name) candidateName = profile.full_name;

    // Get L1 extraction
    const { data: sessions } = await db().from('leee_sessions')
      .select('id').eq('user_id', ref.candidate_id).eq('status', 'completed')
      .order('created_at', { ascending: false }).limit(1);
    if (sessions?.length) {
      const { data: ext } = await db().from('leee_extractions')
        .select('skills_profile').eq('session_id', sessions[0].id).limit(1).single();
      if (ext?.skills_profile) l1Skills = ext.skills_profile;
    }

    // Get L2 simulation
    if (ref.application_id) {
      const { data: g3 } = await db().from('gate3_results')
        .select('simulation_results').eq('application_id', ref.application_id).limit(1).single();
      if (g3?.simulation_results?.skill_scores) l2Skills = g3.simulation_results.skill_scores;
    }
  } catch { /* L1/L2 data is optional — rubric works without it */ }

  const rubric = generateRubric(l1Skills, l2Skills);

  return NextResponse.json({
    reference: { name: ref.name, relationship: ref.relationship },
    candidate_name: candidateName,
    rubric,
    instructions: `Thank you for helping ${candidateName}. This takes about 5-10 minutes. Your responses are confidential and will help build an accurate picture of ${candidateName}'s capabilities. There are no right or wrong answers — we value your honest perspective.`,
  });
}

// ============================================================
// SUBMIT — reference submits their assessment
// ============================================================

async function handleSubmit(body: any) {
  const { token, ratings, overall_impression, relationship_context } = body;

  // Look up reference
  const { data: ref } = await db().from('peer_references')
    .select('*').eq('token', token).single();

  if (!ref) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 404 });
  }
  if (ref.status === 'submitted') {
    return NextResponse.json({ error: 'Already submitted' }, { status: 400 });
  }

  // Store assessment
  try {
    await db().from('peer_assessments').insert({
      reference_id: ref.id,
      candidate_id: ref.candidate_id,
      application_id: ref.application_id,
      ratings: ratings || [],
      overall_impression: overall_impression || '',
      relationship_context: relationship_context || '',
      submitted_at: new Date().toISOString(),
    });

    // Update reference status
    await db().from('peer_references').update({
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    }).eq('id', ref.id);

  } catch (e) {
    console.error('Failed to store assessment:', e);
    return NextResponse.json({ error: 'Failed to save assessment' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Thank you for your assessment. Your input helps build an accurate picture of the candidate\'s capabilities.',
  });
}

// ============================================================
// GET STATUS — check how many references have responded
// ============================================================

async function handleGetStatus(body: any) {
  const { candidate_id, application_id } = body;

  const query = application_id
    ? db().from('peer_references').select('*').eq('application_id', application_id)
    : db().from('peer_references').select('*').eq('candidate_id', candidate_id);

  const { data: refs } = await query;

  if (!refs) return NextResponse.json({ references: [], submitted: 0, total: 0 });

  return NextResponse.json({
    references: refs.map(r => ({
      name: r.name,
      relationship: r.relationship,
      status: r.status,
      invited_at: r.invited_at,
      submitted_at: r.submitted_at,
    })),
    submitted: refs.filter(r => r.status === 'submitted').length,
    total: refs.length,
    ready_for_convergence: refs.filter(r => r.status === 'submitted').length >= 2,
  });
}

// ============================================================
// CALCULATE CONVERGENCE — L1 + L2 + L3
// ============================================================

async function handleConvergence(body: any) {
  const { candidate_id, application_id } = body;

  // Fetch L1 skills
  let l1Skills: any[] = [];
  try {
    const { data: sessions } = await db().from('leee_sessions')
      .select('id').eq('user_id', candidate_id).eq('status', 'completed')
      .order('created_at', { ascending: false }).limit(1);
    if (sessions?.length) {
      const { data: ext } = await db().from('leee_extractions')
        .select('skills_profile').eq('session_id', sessions[0].id).limit(1).single();
      if (ext?.skills_profile) l1Skills = ext.skills_profile;
    }
  } catch { /* L1 optional */ }

  // Fetch L2 skills
  let l2Skills: any[] = [];
  if (application_id) {
    try {
      const { data: g3 } = await db().from('gate3_results')
        .select('simulation_results').eq('application_id', application_id).limit(1).single();
      if (g3?.simulation_results?.skill_scores) l2Skills = g3.simulation_results.skill_scores;
    } catch { /* L2 optional */ }
  }

  // Fetch L3 peer assessments
  const { data: assessments } = await db().from('peer_assessments')
    .select('*').eq('candidate_id', candidate_id);

  if (!assessments?.length) {
    return NextResponse.json({ error: 'No peer assessments submitted yet', convergence: [] }, { status: 400 });
  }

  // Calculate convergence
  const convergence = calculateThreeLayerConvergence(l1Skills, l2Skills, assessments as any[]);

  // Verify independence
  const independence = verifyReferenceIndependence(assessments as any[]);

  // Store convergence results
  if (application_id) {
    try {
      await db().from('gate3_results').update({
        layer3_convergence: convergence,
        layer3_independence: independence,
        layer3_peer_count: assessments.length,
      }).eq('application_id', application_id);
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({
    convergence,
    independence,
    peer_count: assessments.length,
    summary: convergence.map(c => `${c.skill_name}: L1=${c.layer1_score} L2=${c.layer2_score} L3=${c.layer3_score} → ${c.combined_score} (${c.convergence_type})`),
  });
}
