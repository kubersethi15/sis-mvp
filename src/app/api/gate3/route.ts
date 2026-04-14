// Gate 3 API Route - POST /api/gate3
// Predictability: AI simulation + structured interview + Final Approver review
// Uses Layer 2 seeds from LEEE extraction to generate relevant scenarios

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
      case 'generate_simulation': return generateSimulation(body);
      case 'start_l2_simulation': return startL2Simulation(body);
      case 'submit_simulation': return submitSimulation(body);
      case 'generate_interview': return generateInterview(body);
      case 'submit_interview': return submitInterview(body);
      case 'calculate_readiness': return calculateReadiness(body);
      case 'reviewer_decision': return reviewerDecision(body);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Gate 3 API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// AI SIMULATION
// ============================================================

async function generateSimulation(body: any) {
  const { application_id } = body;

  // Fetch Gate 1 + Gate 2 data to build context
  const { data: app } = await db().from('applications').select('*').eq('id', application_id).single();
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  const { data: vacancy } = await db().from('vacancies').select('*').eq('id', app.vacancy_id).single();
  const { data: g2 } = await db().from('gate2_results').select('*').eq('application_id', application_id).limit(1).single();

  // Get LEEE extraction for Layer 2 seeds
  let layer2Seeds: any[] = [];
  let skillsProfile: any[] = [];
  if (g2?.leee_session_id) {
    const { data: extraction } = await db().from('leee_extractions')
      .select('layer2_seeds, skills_profile')
      .eq('session_id', g2.leee_session_id)
      .limit(1).single();
    if (extraction) {
      layer2Seeds = extraction.layer2_seeds || [];
      skillsProfile = extraction.skills_profile || [];
    }
  }

  const prompt = SIMULATION_PROMPT
    .replace('{vacancy_title}', vacancy?.title || 'Unknown')
    .replace('{vacancy_description}', vacancy?.description || '')
    .replace('{competency_blueprint}', JSON.stringify(vacancy?.competency_blueprint || {}))
    .replace('{skills_profile}', JSON.stringify(skillsProfile))
    .replace('{layer2_seeds}', JSON.stringify(layer2Seeds))
    .replace('{evidence_gaps}', JSON.stringify(g2?.evidence_gaps || []));

  const res = await callClaude(prompt, 2000);
  if (!res) return NextResponse.json({ error: 'Simulation generation failed' }, { status: 500 });

  return NextResponse.json({ simulation: res, application_id });
}

// ============================================================
// LAYER 2 MULTI-AGENT SIMULATION (NEW)
// Bridges the Gate 3 flow to the new multi-agent simulation engine
// ============================================================

async function startL2Simulation(body: any) {
  const { application_id } = body;

  // Fetch Gate 2 data for Layer 2 seeds
  const { data: app } = await db().from('applications').select('*').eq('id', application_id).single();
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  const { data: g2 } = await db().from('gate2_results').select('*').eq('application_id', application_id).limit(1).single();

  let layer2Seeds: any[] = [];
  let layer1Skills: any[] = [];
  if (g2?.leee_session_id) {
    const { data: extraction } = await db().from('leee_extractions')
      .select('layer2_seeds, skills_profile')
      .eq('session_id', g2.leee_session_id)
      .limit(1).single();
    if (extraction) {
      layer2Seeds = extraction.layer2_seeds || [];
      layer1Skills = extraction.skills_profile || [];
    }
  }

  // Update application status
  await db().from('applications').update({
    status: 'gate3_simulation',
    current_gate: 3,
  }).eq('id', application_id);

  return NextResponse.json({
    status: 'ready',
    simulation_url: `/simulation?app=${application_id}`,
    layer2_seeds: layer2Seeds,
    layer1_skills: layer1Skills,
    application_id,
  });
}

async function submitSimulation(body: any) {
  const { application_id, simulation_responses } = body;

  // Score the simulation responses
  const prompt = SIMULATION_SCORE_PROMPT
    .replace('{simulation_responses}', JSON.stringify(simulation_responses));

  const scores = await callClaude(prompt, 1500);

  // Save to gate3_results (create or update)
  const { data: existing } = await db().from('gate3_results')
    .select('id').eq('application_id', application_id).limit(1).single();

  if (existing) {
    await db().from('gate3_results').update({
      simulation_results: { responses: simulation_responses, scores },
    }).eq('id', existing.id);
  } else {
    await db().from('gate3_results').insert({
      application_id,
      simulation_results: { responses: simulation_responses, scores },
      interview_results: {},
    });
  }

  return NextResponse.json({ scores, status: 'simulation_scored' });
}

// ============================================================
// STRUCTURED INTERVIEW
// ============================================================

async function generateInterview(body: any) {
  const { application_id } = body;

  const { data: app } = await db().from('applications').select('*').eq('id', application_id).single();
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

  const { data: vacancy } = await db().from('vacancies').select('*').eq('id', app.vacancy_id).single();
  const { data: g1 } = await db().from('gate1_results').select('*').eq('application_id', application_id).limit(1).single();
  const { data: g2 } = await db().from('gate2_results').select('*').eq('application_id', application_id).limit(1).single();

  const prompt = INTERVIEW_PROMPT
    .replace('{vacancy_title}', vacancy?.title || 'Unknown')
    .replace('{competency_blueprint}', JSON.stringify(vacancy?.competency_blueprint || {}))
    .replace('{alignment_gaps}', JSON.stringify(g1?.gaps || []))
    .replace('{evidence_gaps}', JSON.stringify(g2?.evidence_gaps || []))
    .replace('{skills_profile}', JSON.stringify(g2?.leee_skills_profile || {}));

  const res = await callClaude(prompt, 1500);
  if (!res) return NextResponse.json({ error: 'Interview generation failed' }, { status: 500 });

  return NextResponse.json({ interview: res, application_id });
}

async function submitInterview(body: any) {
  const { application_id, interview_responses } = body;

  const prompt = INTERVIEW_SCORE_PROMPT
    .replace('{interview_responses}', JSON.stringify(interview_responses));

  const scores = await callClaude(prompt, 1500);

  const { data: existing } = await db().from('gate3_results')
    .select('id').eq('application_id', application_id).limit(1).single();

  if (existing) {
    await db().from('gate3_results').update({
      interview_results: { responses: interview_responses, scores },
    }).eq('id', existing.id);
  } else {
    await db().from('gate3_results').insert({
      application_id,
      simulation_results: {},
      interview_results: { responses: interview_responses, scores },
    });
  }

  return NextResponse.json({ scores, status: 'interview_scored' });
}

// ============================================================
// READINESS INDEX
// ============================================================

async function calculateReadiness(body: any) {
  const { application_id } = body;

  const { data: g3 } = await db().from('gate3_results')
    .select('*').eq('application_id', application_id).limit(1).single();

  if (!g3) return NextResponse.json({ error: 'No Gate 3 results found' }, { status: 404 });

  // Also get Gate 1 + 2 for full context
  const { data: g1 } = await db().from('gate1_results').select('*').eq('application_id', application_id).limit(1).single();
  const { data: g2 } = await db().from('gate2_results').select('*').eq('application_id', application_id).limit(1).single();

  const prompt = READINESS_PROMPT
    .replace('{gate1_score}', String(g1?.alignment_score || 0))
    .replace('{gate1_strengths}', JSON.stringify(g1?.strengths || []))
    .replace('{gate1_gaps}', JSON.stringify(g1?.gaps || []))
    .replace('{gate2_evidence_rating}', g2?.evidence_rating || 'unknown')
    .replace('{gate2_skills_profile}', JSON.stringify(g2?.leee_skills_profile || {}))
    .replace('{simulation_results}', JSON.stringify(g3.simulation_results || {}))
    .replace('{interview_results}', JSON.stringify(g3.interview_results || {}));

  const readiness = await callClaude(prompt, 1500);

  if (readiness) {
    await db().from('gate3_results').update({
      readiness_index: readiness.readiness_index,
      success_conditions: readiness.success_conditions || [],
      support_needs: readiness.support_needs || [],
      ai_recommendation: readiness.recommendation,
    }).eq('id', g3.id);

    // Update application to gate3_pending for Final Approver review
    await db().from('applications').update({
      status: 'gate3_pending',
    }).eq('id', application_id);
  }

  return NextResponse.json({ readiness, application_id });
}

// ============================================================
// FINAL APPROVER DECISION
// ============================================================

async function reviewerDecision(body: any) {
  const { gate3_result_id, decision, notes, reviewer_id } = body;

  await db().from('gate3_results').update({
    reviewer_id,
    reviewer_decision: decision,
    reviewer_notes: notes || null,
    reviewed_at: new Date().toISOString(),
  }).eq('id', gate3_result_id);

  const { data: g3 } = await db().from('gate3_results').select('application_id').eq('id', gate3_result_id).single();

  if (g3) {
    const status = decision === 'passed' ? 'selected' : 'not_selected';
    await db().from('applications').update({
      status,
      current_gate: decision === 'passed' ? 4 : 3,
      gate3_completed_at: new Date().toISOString(),
      final_decision_at: new Date().toISOString(),
      final_outcome: status,
    }).eq('id', g3.application_id);

    // If not selected, generate feedback report
    if (decision !== 'passed') {
      await generateFeedback(g3.application_id);
    }
  }

  return NextResponse.json({ status: 'decision_recorded', decision });
}

// ============================================================
// FEEDBACK GENERATION (for non-selected candidates)
// ============================================================

async function generateFeedback(applicationId: string) {
  const { data: g1 } = await db().from('gate1_results').select('*').eq('application_id', applicationId).limit(1).single();
  const { data: g2 } = await db().from('gate2_results').select('*').eq('application_id', applicationId).limit(1).single();
  const { data: g3 } = await db().from('gate3_results').select('*').eq('application_id', applicationId).limit(1).single();

  const prompt = FEEDBACK_PROMPT
    .replace('{gate1}', JSON.stringify({ strengths: g1?.strengths, gaps: g1?.gaps }))
    .replace('{gate2}', JSON.stringify({ skills_profile: g2?.leee_skills_profile, evidence_gaps: g2?.evidence_gaps }))
    .replace('{gate3}', JSON.stringify({ support_needs: g3?.support_needs, readiness: g3?.readiness_index }));

  const feedback = await callClaude(prompt, 1000);

  if (feedback) {
    await db().from('feedback_reports').insert({
      application_id: applicationId,
      candidate_summary: feedback.summary,
      recommended_actions: feedback.actions || [],
      alternative_roles: feedback.alternative_roles || [],
      skills_to_strengthen: feedback.skills_to_strengthen || [],
      learning_recommendations: feedback.learning_recommendations || [],
    });
  }
}

// ============================================================
// CLAUDE HELPER
// ============================================================

async function callClaude(prompt: string, maxTokens: number): Promise<any | null> {
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
        max_tokens: maxTokens,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.find((b: any) => b.type === 'text')?.text;
    if (text) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    }
    return null;
  } catch (e) {
    console.error('Claude call error:', e);
    return null;
  }
}

// ============================================================
// PROMPTS
// ============================================================

const SIMULATION_PROMPT = `You are a workplace simulation designer for Kaya (Skills Intelligence System by Virtualahan). Generate a realistic workplace simulation scenario for a candidate applying to this role.

Role: {vacancy_title}
Description: {vacancy_description}
Required competencies: {competency_blueprint}
Candidate's skills profile from LEEE: {skills_profile}
Layer 2 seed scenarios from LEEE: {layer2_seeds}
Evidence gaps to test: {evidence_gaps}

Design ONE simulation scenario that:
1. Tests skills that were weakly evidenced or had gaps in the LEEE conversation
2. Is realistic for the role and the Philippine workplace context
3. Presents a dilemma or challenge that requires the candidate to demonstrate decision-making, collaboration, or problem-solving
4. Has no single "right" answer — the quality of reasoning matters more than the specific choice
5. Can be completed in 5-10 minutes via text

Output JSON:
{
  "scenario_title": "short title",
  "scenario_description": "2-3 paragraph scenario that sets up the situation. Written in second person ('You are...'). Include specific details, stakeholders, constraints, and a decision point.",
  "questions": [
    {
      "id": "sim_q1",
      "question": "What would you do first and why?",
      "what_it_tests": "decision-making, prioritization",
      "psf_skills": ["SK4"]
    },
    {
      "id": "sim_q2", 
      "question": "How would you communicate this to [stakeholder]?",
      "what_it_tests": "communication, stakeholder management",
      "psf_skills": ["SK2"]
    },
    {
      "id": "sim_q3",
      "question": "What would you do if [complication]?",
      "what_it_tests": "adaptability, problem-solving under pressure",
      "psf_skills": ["SK4", "SK5"]
    }
  ],
  "evaluation_criteria": ["what good answers look like", "what poor answers look like"]
}
`;

const SIMULATION_SCORE_PROMPT = `Score these workplace simulation responses. Be fair and inclusive — value practical wisdom and creative thinking, not just textbook answers.

Responses: {simulation_responses}

Output JSON:
{
  "overall_score": 0-100,
  "question_scores": [
    {
      "question_id": "sim_q1",
      "score": 0-100,
      "skills_demonstrated": ["SK4"],
      "proficiency": "basic|intermediate|advanced",
      "rationale": "brief explanation"
    }
  ],
  "strengths_observed": ["list"],
  "concerns": ["list"],
  "overall_assessment": "1-2 sentence summary"
}
`;

const INTERVIEW_PROMPT = `Generate 5 structured interview questions for a candidate applying to this role. Questions should target gaps identified in earlier assessment stages.

Role: {vacancy_title}
Competencies required: {competency_blueprint}
Alignment gaps from Gate 1: {alignment_gaps}
Evidence gaps from Gate 2: {evidence_gaps}
Skills profile from LEEE: {skills_profile}

Design questions that:
1. Target skills not yet fully evidenced
2. Are behavioral ("Tell me about a time...") or situational ("What would you do if...")
3. Include at least one question about the specific role context
4. Are fair to candidates with non-traditional backgrounds
5. Never directly name the skill being assessed

Output JSON:
{
  "questions": [
    {
      "id": "int_q1",
      "question": "the question text",
      "what_it_tests": "description",
      "psf_skills": ["SK1", "SK3"],
      "follow_up": "a follow-up probe if answer is vague",
      "good_answer_signals": ["what to listen for"],
      "red_flags": ["what might indicate concern"]
    }
  ]
}
`;

const INTERVIEW_SCORE_PROMPT = `Score these structured interview responses. Be fair — value authenticity, specific examples, and self-awareness over polished corporate answers.

Responses: {interview_responses}

Output JSON:
{
  "overall_score": 0-100,
  "question_scores": [
    {
      "question_id": "int_q1",
      "score": 0-100,
      "skills_demonstrated": ["SK1"],
      "proficiency": "basic|intermediate|advanced",
      "rationale": "brief explanation"
    }
  ],
  "strengths_observed": ["list"],
  "concerns": ["list"],
  "overall_assessment": "1-2 sentence summary"
}
`;

const READINESS_PROMPT = `Calculate a readiness index for this candidate based on all three gate assessments. This is the final AI recommendation before the human Final Approver makes the decision.

Gate 1 (Alignment): Score {gate1_score}/100, Strengths: {gate1_strengths}, Gaps: {gate1_gaps}
Gate 2 (Evidence): Rating {gate2_evidence_rating}, Skills Profile: {gate2_skills_profile}
Gate 3 (Predictability): Simulation: {simulation_results}, Interview: {interview_results}

Output JSON:
{
  "readiness_index": 0-100,
  "recommendation": "strongly_recommend|recommend|recommend_with_conditions|not_recommended",
  "recommendation_rationale": "2-3 sentence explanation for the Final Approver",
  "success_conditions": ["conditions under which this candidate would likely succeed"],
  "support_needs": ["what support/training/accommodations this candidate may need to succeed"],
  "risk_factors": ["potential concerns to monitor"],
  "gate_summary": {
    "gate1": "1-sentence alignment summary",
    "gate2": "1-sentence evidence summary",
    "gate3": "1-sentence predictability summary"
  }
}
`;

const FEEDBACK_PROMPT = `Generate constructive, respectful, actionable feedback for a candidate who was not selected. This feedback should help them grow and find better-fit opportunities. Be encouraging — they may have strong skills that simply didn't match this particular role.

Gate 1 data: {gate1}
Gate 2 data: {gate2}
Gate 3 data: {gate3}

Output JSON:
{
  "summary": "2-3 sentence respectful summary of where they stand",
  "actions": ["specific, actionable next steps they can take"],
  "skills_to_strengthen": ["skills to develop with specific suggestions"],
  "alternative_roles": ["types of roles that might be a better fit based on their strengths"],
  "learning_recommendations": ["specific courses, resources, or experiences that could help"]
}
`;

// O2 + O3: Onboarding plan + Manager handoff notes
const ONBOARDING_PROMPT = `Generate an onboarding plan and manager handoff notes for a selected candidate. This candidate has passed all three gates and been approved by the Final Approver.

Role: {vacancy_title} at {employer_name}
Candidate skills profile: {skills_profile}
Gate 3 support needs: {support_needs}
Gate 3 success conditions: {success_conditions}
Disability context: {disability_context}

Output JSON:
{
  "onboarding_checklist": [
    {"item": "task description", "timeline": "Day 1 / Week 1 / Week 2", "owner": "HR / Manager / Buddy", "priority": "high|medium|low"}
  ],
  "first_30_day_plan": {
    "focus": "What the first 30 days should focus on",
    "goals": ["measurable goals for the first month"],
    "check_in_cadence": "weekly / biweekly",
    "training_needed": ["specific training or onboarding modules"]
  },
  "first_90_day_plan": {
    "focus": "What months 2-3 should focus on",
    "goals": ["measurable goals for the first quarter"],
    "performance_markers": ["what success looks like at 90 days"]
  },
  "training_recommendations": [
    {"topic": "training area", "reason": "why this matters for their success", "priority": "high|medium|low"}
  ],
  "manager_handoff_notes": "3-5 paragraph handoff brief for the direct manager. Cover: candidate's demonstrated strengths (with evidence), areas where they may need support, communication style insights from the LEEE conversation, recommended accommodation or adjustments, and suggested management approach. Write this as if you are a colleague briefing a manager who wasn't part of the hiring process."
}
`;

// O2+O3: Generate onboarding plan for selected candidate
async function generateOnboardingPlan(applicationId: string) {
  const supabase = db();
  const { data: app } = await supabase.from('applications').select('*, vacancies(title, employer_name, competency_blueprint)').eq('id', applicationId).single();
  if (!app) return;

  const { data: g2 } = await supabase.from('gate2_results').select('*').eq('application_id', applicationId).limit(1).single();
  const { data: g3 } = await supabase.from('gate3_results').select('*').eq('application_id', applicationId).limit(1).single();
  const { data: profile } = await supabase.from('jobseeker_profiles').select('disability_context').eq('id', app.jobseeker_id).limit(1).single();

  const prompt = ONBOARDING_PROMPT
    .replace('{vacancy_title}', app.vacancies?.title || 'Role')
    .replace('{employer_name}', app.vacancies?.employer_name || 'Employer')
    .replace('{skills_profile}', JSON.stringify(g2?.leee_skills_profile || {}))
    .replace('{support_needs}', JSON.stringify(g3?.support_needs || []))
    .replace('{success_conditions}', JSON.stringify(g3?.success_conditions || []))
    .replace('{disability_context}', JSON.stringify(profile?.disability_context || 'Not disclosed'));

  const plan = await callClaude(prompt, 2000);

  if (plan) {
    await supabase.from('onboarding_plans').insert({
      application_id: applicationId,
      onboarding_checklist: plan.onboarding_checklist || [],
      first_30_day_plan: plan.first_30_day_plan || {},
      first_90_day_plan: plan.first_90_day_plan || {},
      training_recommendations: plan.training_recommendations || [],
      manager_handoff_notes: plan.manager_handoff_notes || '',
    });
  }
}

// Export for use in demo route

