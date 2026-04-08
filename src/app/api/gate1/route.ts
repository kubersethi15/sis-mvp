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
      case 'eligibility_check': return eligibilityCheck(body);
      case 'combined_evidence': return combinedEvidence(body);
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
  // Look up employer name for display
  let employerName = '';
  if (body.employer_id) {
    const { data: emp } = await db().from('employer_profiles')
      .select('organization_name').eq('id', body.employer_id).single();
    if (emp) employerName = emp.organization_name;
  }

  const { data, error } = await db().from('vacancies').insert({
    employer_id: body.employer_id,
    employer_name: employerName || body.employer_name || 'Employer',
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
    status: body.status || 'published',
  }).select().single();

  if (error) {
    console.error('Vacancy creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
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

  // Generate JD improvement recommendations (A11)
  const recommendations = generateJDRecommendations(jd_text, blueprint);

  // Update vacancy with parsed blueprint if vacancy_id provided
  if (vacancy_id) {
    await db().from('vacancies').update({
      competency_blueprint: blueprint,
      essential_requirements: blueprint.essential_requirements || [],
      trainable_requirements: blueprint.trainable_requirements || [],
      updated_at: new Date().toISOString(),
    }).eq('id', vacancy_id);
  }

  return NextResponse.json({ blueprint, recommendations });
}

// AI-powered JD improvement recommendations (A11)
function generateJDRecommendations(jdText: string, blueprint: any): Array<{ type: string; priority: 'high' | 'medium' | 'low'; recommendation: string }> {
  const recs: Array<{ type: string; priority: 'high' | 'medium' | 'low'; recommendation: string }> = [];
  const lower = jdText.toLowerCase();

  // Check for compensation info
  if (!lower.includes('salary') && !lower.includes('compensation') && !lower.includes('php') && !lower.includes('₱') && !lower.includes('pay')) {
    recs.push({ type: 'compensation', priority: 'high', recommendation: 'Add compensation or salary range. Transparent pay information increases qualified applications by 30% and builds trust with candidates.' });
  }

  // Check for benefits
  if (!lower.includes('benefit') && !lower.includes('hmo') && !lower.includes('insurance') && !lower.includes('leave') && !lower.includes('13th month')) {
    recs.push({ type: 'benefits', priority: 'medium', recommendation: 'Consider listing benefits (HMO, leave, 13th month pay). Filipino jobseekers strongly value benefits transparency.' });
  }

  // Check for accessibility/inclusion language
  if (!lower.includes('pwd') && !lower.includes('disabil') && !lower.includes('accessible') && !lower.includes('inclusive') && !lower.includes('accommodation')) {
    recs.push({ type: 'accessibility', priority: 'high', recommendation: 'Add accessibility and inclusion information. Mention PWD accommodations, accessible facilities, or inclusive hiring practices. This significantly increases applications from qualified PWD candidates.' });
  }

  // Check for human-centric skills
  const hcSkills = blueprint?.competency_blueprint?.human_centric_skills || blueprint?.human_centric_skills || [];
  if (hcSkills.length === 0) {
    recs.push({ type: 'human_skills', priority: 'high', recommendation: 'This JD focuses on technical/hard skills but doesn\'t mention human-centric skills like communication, teamwork, problem-solving, or adaptability. Adding these helps Kaya match candidates more effectively and signals what you truly value in employees.' });
  }

  // Check for work arrangement clarity
  if (!lower.includes('remote') && !lower.includes('onsite') && !lower.includes('on-site') && !lower.includes('hybrid') && !lower.includes('work from home') && !lower.includes('wfh')) {
    recs.push({ type: 'work_arrangement', priority: 'medium', recommendation: 'Specify the work arrangement (remote, onsite, hybrid). This is one of the top filters jobseekers use when browsing vacancies.' });
  }

  // Check JD length
  if (jdText.length < 200) {
    recs.push({ type: 'detail', priority: 'medium', recommendation: 'This JD is quite brief. Consider adding more detail about daily responsibilities, team structure, growth opportunities, and company culture. Richer JDs attract better-matched candidates.' });
  }

  // Check for growth/training mention
  if (!lower.includes('training') && !lower.includes('growth') && !lower.includes('development') && !lower.includes('career') && !lower.includes('learn')) {
    recs.push({ type: 'growth', priority: 'low', recommendation: 'Consider mentioning training, career growth, or development opportunities. This is especially attractive to entry-level and career-transitioning candidates.' });
  }

  // Check for unnecessarily restrictive requirements
  const essReqs = blueprint?.essential_requirements || [];
  const hasStrictEdu = essReqs.some((r: any) => {
    const text = (r.requirement || r || '').toLowerCase();
    return text.includes('4-year') || text.includes('bachelor') || text.includes('college graduate');
  });
  if (hasStrictEdu) {
    recs.push({ type: 'inclusion', priority: 'medium', recommendation: 'Consider whether a 4-year degree is truly essential, or if equivalent experience/training could be accepted. Flexible education requirements expand your talent pool and are more inclusive of non-traditional learners and PWD candidates.' });
  }

  return recs;
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

const JD_PARSE_PROMPT = `You are a job description parser for Kaya (Skills Intelligence System by Virtualahan). Parse the following job description into a structured competency blueprint.

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

const ALIGNMENT_PROMPT = `You are an alignment assessor for Kaya (Skills Intelligence System by Virtualahan). Compare a vacancy's requirements against a jobseeker's profile to produce an alignment assessment.

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

// ============================================================
// ELIGIBILITY CHECK (A4)
// ============================================================

async function eligibilityCheck(body: any) {
  const { vacancy_id, jobseeker_id } = body;
  const supabase = db();

  const { data: vacancy } = await supabase.from('vacancies').select('*').eq('id', vacancy_id).single();
  const { data: jobseeker } = await supabase.from('jobseeker_profiles').select('*, user_profiles(*)').eq('id', jobseeker_id).single();

  if (!vacancy || !jobseeker) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const checks: Array<{ requirement: string; met: boolean; reason: string }> = [];

  for (const req of (vacancy.essential_requirements || [])) {
    const reqText = req.requirement || req;
    const type = req.type || 'unknown';

    if (type === 'qualification') {
      const hasEdu = (jobseeker.education || []).some((e: any) => e.status === 'completed' && e.degree);
      checks.push({ requirement: reqText, met: hasEdu, reason: hasEdu ? 'Education requirement appears met' : 'No completed degree found' });
    } else if (type === 'location') {
      const prefLoc = (jobseeker.preferred_location || '').toLowerCase();
      const locationMatch = prefLoc && (reqText.toLowerCase().includes(prefLoc) || prefLoc.includes('anywhere'));
      checks.push({ requirement: reqText, met: locationMatch, reason: locationMatch ? 'Location matches' : `Preferred: ${jobseeker.preferred_location || 'not set'}` });
    } else if (type === 'schedule') {
      checks.push({ requirement: reqText, met: true, reason: 'Needs confirmation' });
    } else {
      const skills = (jobseeker.skills_inventory || []).map((s: string) => s.toLowerCase());
      const hasSkill = skills.some((s: string) => reqText.toLowerCase().includes(s));
      checks.push({ requirement: reqText, met: hasSkill, reason: hasSkill ? 'Skill found in profile' : 'Not listed in profile' });
    }
  }

  return NextResponse.json({
    eligible: checks.filter(c => !c.met).length <= 1,
    checks,
    summary: checks.every(c => c.met) ? 'All requirements met' : `${checks.filter(c => !c.met).length} gap(s) found`,
  });
}

// ============================================================
// COMBINED EVIDENCE VIEW (P6)
// ============================================================

async function combinedEvidence(body: any) {
  const { application_id } = body;
  const supabase = db();

  const { data: app } = await supabase.from('applications').select('*').eq('id', application_id).single();
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: jobseeker } = await supabase.from('jobseeker_profiles').select('*, user_profiles(full_name)').eq('id', app.jobseeker_id).single();
  const { data: vacancy } = await supabase.from('vacancies').select('title, competency_blueprint').eq('id', app.vacancy_id).single();
  const { data: g1 } = await supabase.from('gate1_results').select('*').eq('application_id', application_id).limit(1).single();

  let leeeData = null;
  const { data: sessions } = await supabase.from('leee_sessions')
    .select('id').eq('user_id', jobseeker?.user_id).eq('status', 'completed').order('created_at', { ascending: false }).limit(1);
  if (sessions?.length) {
    const { data: ext } = await supabase.from('leee_extractions').select('*').eq('session_id', sessions[0].id).limit(1).single();
    leeeData = ext;
  }

  return NextResponse.json({
    candidate: { name: jobseeker?.user_profiles?.full_name, disability: jobseeker?.disability_type, location: jobseeker?.preferred_location },
    vacancy: { title: vacancy?.title, skills_needed: vacancy?.competency_blueprint?.human_centric_skills },
    profile_evidence: { work_history: jobseeker?.work_history || [], education: jobseeker?.education || [], certifications: jobseeker?.certifications || [], skills: jobseeker?.skills_inventory || [] },
    leee_evidence: leeeData ? { skills_profile: leeeData.skills_profile, narrative: leeeData.narrative_summary, episodes: leeeData.episodes, gaming_flags: leeeData.gaming_flags } : null,
    alignment: g1 ? { score: g1.alignment_score, strengths: g1.strengths, gaps: g1.gaps } : null,
  });
}
