// Gate 1 API Route - POST /api/gate1
// Employer JD upload → AI competency blueprint → Alignment assessment
// Recruiter reviews and decides: proceed, hold, reroute, stop

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
      case 'create_employer': return createEmployer(body);
      case 'create_vacancy': return createVacancy(body);
      case 'parse_jd': return parseJD(body);
      case 'run_alignment': return runAlignment(body);
      case 'reviewer_decision': return reviewerDecision(body);
      case 'get_pipeline': return getPipeline(body);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Gate 1 API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// EMPLOYER PROFILE
// ============================================================

async function createEmployer(body: any) {
  const { data, error } = await db().from('employer_profiles').insert({
    organization_name: body.organization_name,
    industry: body.industry || null,
    locations: body.locations || [],
    work_arrangements: body.work_arrangements || {},
    benefits_policy: body.benefits_policy || {},
    accessibility_info: body.accessibility_info || {},
    inclusion_statement: body.inclusion_statement || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ employer: data });
}

// ============================================================
// VACANCY CREATION + JD PARSING
// ============================================================

async function createVacancy(body: any) {
  const { data, error } = await db().from('vacancies').insert({
    employer_id: body.employer_id,
    title: body.title,
    description: body.description || null,
    jd_raw: body.jd_raw || null,
    competency_blueprint: body.competency_blueprint || {},
    essential_requirements: body.essential_requirements || [],
    trainable_requirements: body.trainable_requirements || [],
    compensation_range: body.compensation_range || {},
    benefits: body.benefits || [],
    work_arrangement: body.work_arrangement || null,
    schedule_requirements: body.schedule_requirements || {},
    location: body.location || null,
    status: 'draft',
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vacancy: data });
}

// Parse a raw JD into structured competency blueprint using AI
async function parseJD(body: any) {
  const { jd_text, vacancy_id } = body;
  if (!jd_text) return NextResponse.json({ error: 'jd_text required' }, { status: 400 });

  const prompt = JD_PARSE_PROMPT.replace('{jd_text}', jd_text);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('JD parse error:', err);
    return NextResponse.json({ error: 'Failed to parse JD' }, { status: 500 });
  }

  const data = await res.json();
  const text = data.content?.find((b: any) => b.type === 'text')?.text;
  if (!text) return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 });

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });

  const blueprint = JSON.parse(match[0]);

  // Update vacancy with parsed blueprint if vacancy_id provided
  if (vacancy_id) {
    await db().from('vacancies').update({
      competency_blueprint: blueprint,
      essential_requirements: blueprint.essential_requirements || [],
      trainable_requirements: blueprint.trainable_requirements || [],
      updated_at: new Date().toISOString(),
    }).eq('id', vacancy_id);
  }

  return NextResponse.json({ blueprint });
}

// ============================================================
// ALIGNMENT ASSESSMENT
// ============================================================

async function runAlignment(body: any) {
  const { application_id, vacancy_id, jobseeker_id } = body;

  // Fetch vacancy and jobseeker data
  const { data: vacancy } = await db().from('vacancies').select('*').eq('id', vacancy_id).single();
  const { data: jobseeker } = await db().from('jobseeker_profiles').select('*').eq('id', jobseeker_id).single();
  const { data: user } = await db().from('user_profiles').select('*').eq('id', jobseeker?.user_id).single();

  if (!vacancy || !jobseeker) {
    return NextResponse.json({ error: 'Vacancy or jobseeker not found' }, { status: 404 });
  }

  // Also fetch any LEEE extraction for this jobseeker
  const { data: extractions } = await db().from('leee_extractions')
    .select('skills_profile, narrative_summary')
    .eq('session_id', body.leee_session_id || '')
    .limit(1);

  const leeeProfile = extractions?.[0]?.skills_profile || null;
  const leeeSummary = extractions?.[0]?.narrative_summary || null;

  const prompt = ALIGNMENT_PROMPT
    .replace('{vacancy_title}', vacancy.title)
    .replace('{vacancy_description}', vacancy.description || '')
    .replace('{competency_blueprint}', JSON.stringify(vacancy.competency_blueprint))
    .replace('{essential_requirements}', JSON.stringify(vacancy.essential_requirements))
    .replace('{trainable_requirements}', JSON.stringify(vacancy.trainable_requirements))
    .replace('{jobseeker_name}', user?.full_name || 'Unknown')
    .replace('{work_history}', JSON.stringify(jobseeker.work_history))
    .replace('{education}', JSON.stringify(jobseeker.education))
    .replace('{certifications}', JSON.stringify(jobseeker.certifications))
    .replace('{skills_inventory}', JSON.stringify(jobseeker.skills_inventory))
    .replace('{leee_skills_profile}', leeeProfile ? JSON.stringify(leeeProfile) : 'Not yet assessed')
    .replace('{leee_summary}', leeeSummary || 'Not yet assessed');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'Alignment assessment failed' }, { status: 500 });
  }

  const aiData = await res.json();
  const text = aiData.content?.find((b: any) => b.type === 'text')?.text;
  const match = text?.match(/\{[\s\S]*\}/);
  if (!match) return NextResponse.json({ error: 'Failed to parse alignment' }, { status: 500 });

  const alignment = JSON.parse(match[0]);

  // Save to gate1_results
  const { data: result, error } = await db().from('gate1_results').insert({
    application_id,
    alignment_score: alignment.alignment_score,
    competency_fit_map: alignment.competency_fit_map || {},
    strengths: alignment.strengths || [],
    gaps: alignment.gaps || [],
    ai_recommendation: alignment.recommendation,
  }).select().single();

  if (error) {
    console.error('Error saving alignment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update application status
  await db().from('applications').update({
    status: 'gate1_pending',
    current_gate: 1,
    gate1_started_at: new Date().toISOString(),
  }).eq('id', application_id);

  return NextResponse.json({ alignment: result });
}

// ============================================================
// RECRUITER DECISION
// ============================================================

async function reviewerDecision(body: any) {
  const { gate1_result_id, decision, notes, reviewer_id } = body;

  const statusMap: Record<string, string> = {
    'passed': 'gate1_passed',
    'held': 'gate1_held',
    'rerouted': 'gate1_rerouted',
    'stopped': 'gate1_stopped',
  };

  // Update gate1 result
  await db().from('gate1_results').update({
    reviewer_id,
    reviewer_decision: decision,
    reviewer_notes: notes || null,
    reviewed_at: new Date().toISOString(),
  }).eq('id', gate1_result_id);

  // Get application_id from gate1 result
  const { data: g1 } = await db().from('gate1_results').select('application_id').eq('id', gate1_result_id).single();

  if (g1) {
    const updates: any = {
      status: statusMap[decision] || 'gate1_pending',
      gate1_completed_at: new Date().toISOString(),
    };
    // If passed, advance to gate 2
    if (decision === 'passed') {
      updates.current_gate = 2;
      updates.gate2_started_at = new Date().toISOString();
      updates.status = 'gate2_pending';
    }
    await db().from('applications').update(updates).eq('id', g1.application_id);
  }

  return NextResponse.json({ status: 'decision_recorded', decision });
}

// ============================================================
// PIPELINE VIEW
// ============================================================

async function getPipeline(body: any) {
  const { employer_id, vacancy_id } = body;

  let query = db().from('applications').select(`
    *,
    gate1_results (*),
    gate2_results (*),
    gate3_results (*)
  `);

  if (vacancy_id) query = query.eq('vacancy_id', vacancy_id);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ applications: data });
}

// ============================================================
// PROMPTS
// ============================================================

const JD_PARSE_PROMPT = `You are a job description parser for the Skills Intelligence System. Parse the following job description into a structured competency blueprint.

Output JSON only:
{
  "title": "extracted job title",
  "summary": "1-2 sentence role summary",
  "essential_requirements": [
    { "requirement": "description", "type": "skill|qualification|experience|certification", "psf_skill_id": "SK1-SK8 if applicable or null" }
  ],
  "trainable_requirements": [
    { "requirement": "description", "type": "skill|qualification|experience", "psf_skill_id": "SK1-SK8 if applicable or null" }
  ],
  "competency_blueprint": {
    "hard_skills": ["list of technical/hard skills required"],
    "human_centric_skills": [
      { "skill": "name", "importance": "critical|important|nice_to_have", "psf_skill_id": "SK1-SK8 if applicable" }
    ],
    "work_arrangement": "remote|onsite|hybrid",
    "schedule": "description of schedule requirements",
    "location": "location if specified"
  },
  "compensation": {
    "range": "if specified",
    "benefits": ["list of benefits if specified"]
  },
  "inclusion_signals": ["any mentions of diversity, disability inclusion, PWD-friendly policies"]
}

Job Description to parse:
{jd_text}
`;

const ALIGNMENT_PROMPT = `You are an alignment assessor for the Skills Intelligence System. Compare a vacancy's requirements against a jobseeker's profile to produce an alignment assessment.

IMPORTANT: Be fair and inclusive. Non-traditional experience (informal work, caregiving, community service, disability navigation) should be valued alongside formal credentials. Focus on capability signals, not just credential matches.

Vacancy: {vacancy_title}
Description: {vacancy_description}
Competency Blueprint: {competency_blueprint}
Essential Requirements: {essential_requirements}
Trainable Requirements: {trainable_requirements}

Jobseeker: {jobseeker_name}
Work History: {work_history}
Education: {education}
Certifications: {certifications}
Skills Inventory: {skills_inventory}
LEEE Skills Profile: {leee_skills_profile}
LEEE Narrative Summary: {leee_summary}

Output JSON only:
{
  "alignment_score": 0-100,
  "competency_fit_map": {
    "requirement_name": {
      "status": "met|partially_met|gap|trainable",
      "evidence": "what in the profile supports this",
      "confidence": 0.0-1.0
    }
  },
  "strengths": [
    { "area": "description", "evidence": "what supports it" }
  ],
  "gaps": [
    { "area": "description", "severity": "critical|moderate|minor", "trainable": true/false, "suggestion": "how to address" }
  ],
  "recommendation": "proceed|hold|reroute|not_recommended",
  "recommendation_rationale": "2-3 sentence explanation",
  "inclusion_notes": "any relevant notes about disability accommodations or non-traditional experience value"
}
`;
