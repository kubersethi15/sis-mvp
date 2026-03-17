// Demo Flow API Route - POST /api/demo
// Wires the full end-to-end pipeline for testing and Jakarta demo
// Profile → Apply → Gate 1 → Gate 2 → Gate 3 → Decision

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

function db() {
  return createServerClient();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'apply': return handleApply(body);
      case 'get_application': return getApplication(body);
      case 'get_all_applications': return getAllApplications(body);
      case 'advance_gate': return advanceGate(body);
      case 'get_demo_state': return getDemoState();
      case 'seed_demo_data': return seedDemoData();
      case 'gate_decision': return handleGateDecision(body);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Demo API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// APPLY — Jobseeker applies to a vacancy
// ============================================================

async function handleApply(body: any) {
  const { vacancy_id, jobseeker_id } = body;

  if (!vacancy_id || !jobseeker_id) {
    return NextResponse.json({ error: 'vacancy_id and jobseeker_id required' }, { status: 400 });
  }

  // Create application
  const { data: app, error } = await db().from('applications').insert({
    vacancy_id,
    jobseeker_id,
    status: 'applied',
    current_gate: 0,
    applied_at: new Date().toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ application: app });
}

// ============================================================
// GET APPLICATION with all gate data
// ============================================================

async function getApplication(body: any) {
  const { application_id } = body;

  const { data: app } = await db().from('applications').select('*').eq('id', application_id).single();
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  // Get vacancy
  const { data: vacancy } = await db().from('vacancies').select('*').eq('id', app.vacancy_id).single();

  // Get jobseeker profile
  const { data: jobseeker } = await db().from('jobseeker_profiles').select('*, user_profiles(*)').eq('id', app.jobseeker_id).single();

  // Get gate results
  const { data: g1 } = await db().from('gate1_results').select('*').eq('application_id', application_id).limit(1).single();
  const { data: g2 } = await db().from('gate2_results').select('*').eq('application_id', application_id).limit(1).single();
  const { data: g3 } = await db().from('gate3_results').select('*').eq('application_id', application_id).limit(1).single();

  // Get LEEE session if exists
  let leee_session = null;
  let leee_extraction = null;
  if (g2?.leee_session_id) {
    const { data: sess } = await db().from('leee_sessions').select('*').eq('id', g2.leee_session_id).single();
    leee_session = sess;
    const { data: ext } = await db().from('leee_extractions').select('*').eq('session_id', g2.leee_session_id).limit(1).single();
    leee_extraction = ext;
  }

  // Get feedback if not selected
  let feedback = null;
  if (app.status === 'not_selected') {
    const { data: fb } = await db().from('feedback_reports').select('*').eq('application_id', application_id).limit(1).single();
    feedback = fb;
  }

  return NextResponse.json({
    application: app,
    vacancy,
    jobseeker,
    gates: {
      gate1: g1,
      gate2: g2,
      gate3: g3,
    },
    leee: {
      session: leee_session,
      extraction: leee_extraction,
    },
    feedback,
  });
}

// ============================================================
// GET ALL APPLICATIONS for a vacancy
// ============================================================

async function getAllApplications(body: any) {
  const { vacancy_id } = body;

  let query = db().from('applications').select(`
    *,
    jobseeker_profiles!inner(
      *,
      user_profiles(*)
    )
  `).order('created_at', { ascending: false });

  if (vacancy_id) query = query.eq('vacancy_id', vacancy_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ applications: data || [] });
}

// ============================================================
// ADVANCE through gates (for demo flow)
// ============================================================

async function advanceGate(body: any) {
  const { application_id, target_gate } = body;

  const { data: app } = await db().from('applications').select('*').eq('id', application_id).single();
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  // Run Gate 1 alignment — direct implementation
  if (target_gate === 1) {
    const supabase = db();
    const { data: vacancy } = await supabase.from('vacancies').select('*').eq('id', app.vacancy_id).single();
    const { data: jobseeker } = await supabase.from('jobseeker_profiles').select('*, user_profiles(*)').eq('id', app.jobseeker_id).single();

    const alignPrompt = `You are an alignment assessor. Compare this vacancy against this jobseeker profile. Be fair and inclusive — value non-traditional experience.

Vacancy: ${vacancy?.title || 'Unknown'} — ${vacancy?.description || ''}
Requirements: ${JSON.stringify(vacancy?.essential_requirements || [])}
Competencies: ${JSON.stringify(vacancy?.competency_blueprint || {})}

Jobseeker: ${jobseeker?.user_profiles?.full_name || 'Unknown'}
Work History: ${JSON.stringify(jobseeker?.work_history || [])}
Education: ${JSON.stringify(jobseeker?.education || [])}
Skills: ${JSON.stringify(jobseeker?.skills_inventory || [])}

Output JSON only:
{
  "alignment_score": 0-100,
  "strengths": [{"area": "description", "evidence": "what supports it"}],
  "gaps": [{"area": "description", "severity": "critical|moderate|minor", "trainable": true}],
  "recommendation": "proceed|hold|reroute|not_recommended",
  "recommendation_rationale": "2-3 sentence explanation"
}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: alignPrompt }] }),
      });
      const aiData = await res.json();
      const text = aiData.content?.find((b: any) => b.type === 'text')?.text;
      const match = text?.match(/\{[\s\S]*\}/);
      const alignment = match ? JSON.parse(match[0]) : null;

      // Save Gate 1 result
      const { data: g1Result } = await supabase.from('gate1_results').insert({
        application_id,
        alignment_score: alignment?.alignment_score || 50,
        competency_fit_map: {},
        strengths: alignment?.strengths || [],
        gaps: alignment?.gaps || [],
        ai_recommendation: alignment?.recommendation_rationale || 'Pending',
        reviewer_decision: 'passed',
        reviewer_notes: 'Demo auto-advance',
        reviewed_at: new Date().toISOString(),
      }).select().single();

      // Update application
      await supabase.from('applications').update({
        status: 'gate1_passed',
        current_gate: 1,
        gate1_started_at: new Date().toISOString(),
        gate1_completed_at: new Date().toISOString(),
      }).eq('id', application_id);

      return NextResponse.json({ status: 'gate1_complete', alignment: { alignment: g1Result } });
    } catch (e: any) {
      console.error('Gate 1 error:', e);
      return NextResponse.json({ status: 'gate1_error', error: e.message }, { status: 500 });
    }
  }

  // Link LEEE session to Gate 2
  if (target_gate === 2) {
    const { leee_session_id } = body;

    // Get LEEE extraction
    let leee_skills = {};
    let leee_evidence = [];
    if (leee_session_id) {
      const { data: ext } = await db().from('leee_extractions')
        .select('skills_profile, evidence_map')
        .eq('session_id', leee_session_id)
        .limit(1).single();
      if (ext) {
        leee_skills = ext.skills_profile;
        leee_evidence = ext.evidence_map;
      }
    }

    // Get profile evidence
    const { data: jobseeker } = await db().from('jobseeker_profiles').select('*').eq('id', app.jobseeker_id).single();

    // Create Gate 2 result
    const { data: g2, error } = await db().from('gate2_results').insert({
      application_id,
      profile_evidence_summary: {
        work_history: jobseeker?.work_history || [],
        education: jobseeker?.education || [],
        certifications: jobseeker?.certifications || [],
        skills_inventory: jobseeker?.skills_inventory || [],
      },
      leee_session_id: leee_session_id || null,
      leee_skills_profile: leee_skills,
      leee_evidence_map: leee_evidence,
      evidence_rating: leee_session_id ? 'moderate' : 'weak',
      evidence_gaps: [],
      ai_recommendation: leee_session_id ? 'Candidate has both profile evidence and LEEE behavioral evidence. Recommend proceed to Gate 3.' : 'Only profile evidence available. LEEE conversation not completed.',
      reviewer_decision: 'passed',
      reviewer_notes: 'Demo auto-advance',
      reviewed_at: new Date().toISOString(),
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update application
    await db().from('applications').update({
      status: 'gate2_passed',
      current_gate: 2,
      gate2_started_at: new Date().toISOString(),
      gate2_completed_at: new Date().toISOString(),
    }).eq('id', application_id);

    return NextResponse.json({ status: 'gate2_complete', gate2: g2 });
  }

  // Run Gate 3 — direct implementation (avoids internal fetch SSL issues)
  if (target_gate === 3) {
    const supabase = db();

    // Get vacancy and gate data for context
    const { data: vacancy } = await supabase.from('vacancies').select('*').eq('id', app.vacancy_id).single();
    const { data: g1 } = await supabase.from('gate1_results').select('*').eq('application_id', application_id).limit(1).single();
    const { data: g2 } = await supabase.from('gate2_results').select('*').eq('application_id', application_id).limit(1).single();

    // Build readiness assessment directly
    const readinessPrompt = `You are a readiness assessor for Kaya (Skills Intelligence System by Virtualahan). Based on the data below, calculate a readiness index for this candidate.

Vacancy: ${vacancy?.title || 'Unknown'} — ${vacancy?.description || ''}
Gate 1 Alignment: Score ${g1?.alignment_score || 'N/A'}/100, Strengths: ${JSON.stringify(g1?.strengths || [])}, Gaps: ${JSON.stringify(g1?.gaps || [])}
Gate 2 Evidence: Rating ${g2?.evidence_rating || 'N/A'}, Skills Profile: ${JSON.stringify(g2?.leee_skills_profile || {})}

Output JSON only:
{
  "readiness_index": 0-100,
  "recommendation": "strongly_recommend|recommend|recommend_with_conditions|not_recommended",
  "recommendation_rationale": "2-3 sentence explanation",
  "success_conditions": ["conditions for success"],
  "support_needs": ["what support may be needed"],
  "risk_factors": ["potential concerns"],
  "gate_summary": {
    "gate1": "1-sentence alignment summary",
    "gate2": "1-sentence evidence summary",
    "gate3": "1-sentence predictability summary"
  }
}`;

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          messages: [{ role: 'user', content: readinessPrompt }],
        }),
      });
      const aiData = await res.json();
      const text = aiData.content?.find((b: any) => b.type === 'text')?.text;
      const match = text?.match(/\{[\s\S]*\}/);
      const readiness = match ? JSON.parse(match[0]) : null;

      // Save Gate 3 results
      await supabase.from('gate3_results').insert({
        application_id,
        simulation_results: { note: 'Simplified for MVP demo' },
        interview_results: { note: 'Simplified for MVP demo' },
        readiness_index: readiness?.readiness_index || 65,
        success_conditions: readiness?.success_conditions || [],
        support_needs: readiness?.support_needs || [],
        ai_recommendation: readiness?.recommendation_rationale || 'Pending detailed assessment',
        reviewer_decision: 'passed',
        reviewer_notes: 'Demo auto-advance',
        reviewed_at: new Date().toISOString(),
      });

      // Update application to selected
      await supabase.from('applications').update({
        status: 'selected',
        current_gate: 4,
        gate3_started_at: new Date().toISOString(),
        gate3_completed_at: new Date().toISOString(),
        final_decision_at: new Date().toISOString(),
        final_outcome: 'selected',
      }).eq('id', application_id);

      return NextResponse.json({ status: 'gate3_complete', readiness });
    } catch (e: any) {
      console.error('Gate 3 error:', e);
      return NextResponse.json({ status: 'gate3_error', error: e.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid target_gate' }, { status: 400 });
}

// ============================================================
// DEMO STATE — get overview of all demo data
// ============================================================

async function getDemoState() {
  const supabase = db();

  const { data: employers } = await supabase.from('employer_profiles').select('id, organization_name').limit(10);
  const { data: vacancies } = await supabase.from('vacancies').select('id, title, employer_id, status').limit(20);
  const { data: jobseekers } = await supabase.from('jobseeker_profiles').select('id, user_id, completion_percentage, user_profiles(full_name)').limit(20);
  const { data: applications } = await supabase.from('applications').select('id, vacancy_id, jobseeker_id, status, current_gate').limit(50);
  const { data: sessions } = await supabase.from('leee_sessions').select('id, user_id, status, stories_completed').limit(20);

  return NextResponse.json({
    counts: {
      employers: employers?.length || 0,
      vacancies: vacancies?.length || 0,
      jobseekers: jobseekers?.length || 0,
      applications: applications?.length || 0,
      sessions: sessions?.length || 0,
    },
    employers,
    vacancies,
    jobseekers,
    applications,
    sessions,
  });
}

// ============================================================
// SEED DEMO DATA — create sample employer + vacancy for testing
// ============================================================

async function seedDemoData() {
  const supabase = db();

  // Check if demo data already exists
  const { data: existing } = await supabase.from('employer_profiles')
    .select('id').eq('organization_name', 'Cebuana Lhuillier').limit(1).single();

  if (existing) {
    // Get existing vacancy
    const { data: vac } = await supabase.from('vacancies')
      .select('id').eq('employer_id', existing.id).limit(1).single();
    return NextResponse.json({
      status: 'already_exists',
      employer_id: existing.id,
      vacancy_id: vac?.id,
    });
  }

  // Create employer
  const { data: employer } = await supabase.from('employer_profiles').insert({
    organization_name: 'Cebuana Lhuillier',
    industry: 'Financial Services',
    locations: [{ city: 'Manila', country: 'Philippines' }, { city: 'Quirino Province', country: 'Philippines' }],
    work_arrangements: { onsite: true },
    accessibility_info: { pwd_friendly: true },
    inclusion_statement: 'Fresh graduates and entry level applicants are encouraged to apply.',
  }).select().single();

  // Create vacancy
  const { data: vacancy } = await supabase.from('vacancies').insert({
    employer_id: employer!.id,
    title: 'Branch Staff',
    description: 'Provides clerical and administrative support to Cebuana Lhuillier branches. Handles branch transactions - remittance, pawning, insurance and other non-pawnshop products.',
    jd_raw: 'The position is primarily responsible for providing clerical and administrative support to Cebuana Lhuillier branches. Handles branch transactions - remittance, pawning, insurance and other non-pawnshop products.\n\nQualifications:\nGraduate of any 4-year course\nKnowledgeable with office productivity apps - Word, Excel, Outlook etc.\nCan work on a fast-paced environment\nMust be willing to work anywhere in Quirino Province\nWilling to work on Sundays and Holidays\nFresh graduates/Entry level applicants are encouraged to apply\nCan start ASAP',
    competency_blueprint: {
      hard_skills: ['Microsoft Office', 'Transaction processing', 'Record keeping'],
      human_centric_skills: [
        { skill: 'Communication', importance: 'critical', psf_skill_id: 'SK2' },
        { skill: 'Customer Orientation', importance: 'critical', psf_skill_id: 'SK2' },
        { skill: 'Adaptability', importance: 'important', psf_skill_id: 'SK5' },
        { skill: 'Problem Solving', importance: 'important', psf_skill_id: 'SK4' },
      ],
    },
    essential_requirements: [
      { requirement: 'Graduate of any 4-year course', type: 'qualification' },
      { requirement: 'Knowledgeable with office productivity apps', type: 'skill' },
      { requirement: 'Willing to work in Quirino Province', type: 'location' },
      { requirement: 'Willing to work Sundays and Holidays', type: 'schedule' },
    ],
    trainable_requirements: [
      { requirement: 'Branch transaction handling', type: 'skill' },
      { requirement: 'Fast-paced environment', type: 'skill' },
    ],
    work_arrangement: 'onsite',
    location: 'Quirino Province, Philippines',
    status: 'published',
    published_at: new Date().toISOString(),
  }).select().single();

  return NextResponse.json({
    status: 'seeded',
    employer_id: employer!.id,
    vacancy_id: vacancy!.id,
  });
}

// Helper to get base URL for internal API calls
function getBaseUrl() {
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

// Human-in-the-loop gate decision
async function handleGateDecision(body: any) {
  const { application_id, gate, decision } = body;
  if (!application_id || !gate || !decision) {
    return NextResponse.json({ error: 'application_id, gate, and decision required' }, { status: 400 });
  }

  const supabase = db();
  const gateTable = gate === 1 ? 'gate1_results' : gate === 2 ? 'gate2_results' : 'gate3_results';

  // Update the gate result with the reviewer's decision
  const { error: gateErr } = await supabase.from(gateTable)
    .update({
      reviewer_decision: decision,
      reviewed_at: new Date().toISOString(),
    })
    .eq('application_id', application_id);

  if (gateErr) {
    return NextResponse.json({ error: gateErr.message }, { status: 500 });
  }

  // Update application status based on decision
  let newStatus = '';
  if (decision === 'passed') {
    if (gate === 1) newStatus = 'gate2_pending';
    else if (gate === 2) newStatus = 'gate3_pending';
    else if (gate === 3) newStatus = 'selected';
  } else if (decision === 'held') {
    newStatus = `gate${gate}_held`;
  } else if (decision === 'stopped') {
    newStatus = `gate${gate}_stopped`;
  }

  if (newStatus) {
    await supabase.from('applications')
      .update({ status: newStatus, current_gate: decision === 'passed' && gate < 3 ? gate + 1 : gate })
      .eq('id', application_id);
  }

  return NextResponse.json({ success: true, decision, new_status: newStatus });
}
