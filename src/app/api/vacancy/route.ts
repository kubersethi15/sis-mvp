import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

function db() { return createServerClient(); }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'list': return listVacancies();
      case 'get': return getVacancy(body);
      case 'ask': return askAboutVacancy(body);
      case 'check_alignment': return checkAlignment(body);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function listVacancies() {
  const { data, error } = await db().from('vacancies')
    .select('*, employer_profiles(organization_name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vacancies: data || [] });
}

async function getVacancy(body: any) {
  const { data, error } = await db().from('vacancies')
    .select('*, employer_profiles(organization_name)')
    .eq('id', body.vacancy_id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vacancy: data });
}

async function askAboutVacancy(body: any) {
  const { vacancy_id, question, history } = body;

  const { data: vacancy } = await db().from('vacancies')
    .select('*, employer_profiles(organization_name, accessibility_info, inclusion_statement)')
    .eq('id', vacancy_id).single();

  if (!vacancy) return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });

  const systemPrompt = `You are a helpful AI assistant answering questions about a job vacancy. Answer ONLY based on the information provided below. If the answer isn't in the data, say "I don't have that specific information, but you can ask the employer directly." NEVER make up information.

Vacancy: ${vacancy.title}
Employer: ${vacancy.employer_profiles?.organization_name || 'Not specified'}
Description: ${vacancy.description || 'Not provided'}
Requirements: ${JSON.stringify(vacancy.essential_requirements || [])}
Trainable: ${JSON.stringify(vacancy.trainable_requirements || [])}
Skills valued: ${JSON.stringify(vacancy.competency_blueprint?.human_centric_skills || [])}
Compensation: ${JSON.stringify(vacancy.compensation_range || {})}
Work arrangement: ${vacancy.work_arrangement || 'Not specified'}
Location: ${vacancy.location || 'Not specified'}
Schedule: ${JSON.stringify(vacancy.schedule_requirements || {})}
Accessibility: ${JSON.stringify(vacancy.employer_profiles?.accessibility_info || {})}
Inclusion: ${vacancy.employer_profiles?.inclusion_statement || 'Not specified'}`;

  const messages: any[] = [
    ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user', content: question },
  ];

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, system: systemPrompt, messages }),
    });
    const data = await res.json();
    const answer = data.content?.find((b: any) => b.type === 'text')?.text || 'Sorry, I couldn\'t process that question.';
    return NextResponse.json({ answer });
  } catch (e: any) {
    return NextResponse.json({ answer: 'Sorry, there was an error processing your question.' });
  }
}

async function checkAlignment(body: any) {
  const { vacancy_id, jobseeker_profile_id } = body;

  if (!jobseeker_profile_id) {
    return NextResponse.json({ error: 'Please create your profile first' }, { status: 400 });
  }

  const { data: vacancy } = await db().from('vacancies').select('*').eq('id', vacancy_id).single();
  const { data: jobseeker } = await db().from('jobseeker_profiles').select('*, user_profiles(*)').eq('id', jobseeker_profile_id).single();

  if (!vacancy || !jobseeker) {
    return NextResponse.json({ error: 'Vacancy or profile not found' }, { status: 404 });
  }

  // Check for LEEE extraction
  let leeeSkills = null;
  const { data: sessions } = await db().from('leee_sessions')
    .select('id').eq('user_id', jobseeker.user_id).eq('status', 'completed').limit(1);
  if (sessions?.length) {
    const { data: ext } = await db().from('leee_extractions')
      .select('skills_profile').eq('session_id', sessions[0].id).limit(1).single();
    if (ext) leeeSkills = ext.skills_profile;
  }

  const prompt = `You are an alignment assessor. Compare this vacancy against this jobseeker. Be fair and inclusive.

Vacancy: ${vacancy.title} — ${vacancy.description}
Requirements: ${JSON.stringify(vacancy.essential_requirements)}
Skills valued: ${JSON.stringify(vacancy.competency_blueprint?.human_centric_skills || [])}

Jobseeker: ${jobseeker.user_profiles?.full_name}
Work: ${JSON.stringify(jobseeker.work_history)}
Education: ${JSON.stringify(jobseeker.education)}
Skills: ${JSON.stringify(jobseeker.skills_inventory)}
LEEE Profile: ${leeeSkills ? JSON.stringify(leeeSkills) : 'Not yet assessed'}

Output JSON only:
{
  "alignment_score": 0-100,
  "recommendation": "strong_fit|good_fit|possible_fit|weak_fit",
  "recommendation_rationale": "2-3 sentence explanation written FOR THE JOBSEEKER (encouraging, constructive)",
  "strengths": [{"area": "description"}],
  "gaps": [{"area": "description", "suggestion": "what they could do"}]
}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await res.json();
    const text = data.content?.find((b: any) => b.type === 'text')?.text;
    const match = text?.match(/\{[\s\S]*\}/);
    const alignment = match ? JSON.parse(match[0]) : null;
    return NextResponse.json({ alignment });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
