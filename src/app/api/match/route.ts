// Matching Engine API - POST /api/match
// Holistic vacancy ↔ jobseeker matching
// Ryan: "similar to how Upwork does it now but more holistic with emphasis on human-centric skills"
//
// Matching factors:
// 1. Human-centric skill overlap (from LEEE extraction)
// 2. Profile evidence (education, certifications, work history)
// 3. Location + work arrangement fit
// 4. Compensation alignment
// 5. Accessibility compatibility
// 6. Evidence readiness (has the person done an LEEE session?)

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

function db() { return createServerClient(); }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'match_for_jobseeker': return matchForJobseeker(body);
      case 'match_for_vacancy': return matchForVacancy(body);
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ============================================================
// MATCH VACANCIES FOR A JOBSEEKER
// "Here are jobs that fit your skills and profile"
// ============================================================

async function matchForJobseeker(body: any) {
  const { jobseeker_profile_id } = body;
  const supabase = db();

  // Get jobseeker profile
  const { data: profile } = await supabase.from('jobseeker_profiles')
    .select('*, user_profiles(full_name)')
    .eq('id', jobseeker_profile_id).single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  // Get LEEE extraction if available
  let leeeSkills: any[] = [];
  const { data: sessions } = await supabase.from('leee_sessions')
    .select('id').eq('user_id', profile.user_id).eq('status', 'completed')
    .order('created_at', { ascending: false }).limit(1);

  if (sessions?.length) {
    const { data: ext } = await supabase.from('leee_extractions')
      .select('skills_profile').eq('session_id', sessions[0].id).limit(1).single();
    if (ext) leeeSkills = ext.skills_profile || [];
  }

  // Get all published vacancies
  const { data: vacancies } = await supabase.from('vacancies')
    .select('*, employer_profiles(organization_name, accessibility_info)')
    .eq('status', 'published');

  if (!vacancies?.length) return NextResponse.json({ matches: [], message: 'No vacancies available' });

  // Score each vacancy
  const matches = vacancies.map(vacancy => {
    const scores = calculateMatchScore(profile, leeeSkills, vacancy);
    return {
      vacancy_id: vacancy.id,
      title: vacancy.title,
      employer: vacancy.employer_profiles?.organization_name || 'Unknown',
      location: vacancy.location,
      work_arrangement: vacancy.work_arrangement,
      description: vacancy.description,
      match_score: scores.total,
      match_breakdown: scores,
      has_leee_evidence: leeeSkills.length > 0,
      human_centric_skills: vacancy.competency_blueprint?.human_centric_skills || [],
      accessibility_friendly: !!vacancy.employer_profiles?.accessibility_info?.pwd_friendly,
    };
  });

  // Sort by match score descending
  matches.sort((a, b) => b.match_score - a.match_score);

  return NextResponse.json({
    matches,
    jobseeker: {
      name: profile.user_profiles?.full_name,
      skills_count: leeeSkills.length,
      has_leee: leeeSkills.length > 0,
      profile_completion: profile.completion_percentage,
    },
  });
}

// ============================================================
// MATCH JOBSEEKERS FOR A VACANCY
// "Here are candidates that fit this role"
// ============================================================

async function matchForVacancy(body: any) {
  const { vacancy_id } = body;
  const supabase = db();

  const { data: vacancy } = await supabase.from('vacancies')
    .select('*, employer_profiles(organization_name, accessibility_info)')
    .eq('id', vacancy_id).single();

  if (!vacancy) return NextResponse.json({ error: 'Vacancy not found' }, { status: 404 });

  // Get all jobseeker profiles
  const { data: profiles } = await supabase.from('jobseeker_profiles')
    .select('*, user_profiles(full_name)');

  if (!profiles?.length) return NextResponse.json({ matches: [], message: 'No candidates available' });

  const matches = [];

  for (const profile of profiles) {
    // Get LEEE extraction
    let leeeSkills: any[] = [];
    const { data: sessions } = await supabase.from('leee_sessions')
      .select('id').eq('user_id', profile.user_id).eq('status', 'completed')
      .order('created_at', { ascending: false }).limit(1);

    if (sessions?.length) {
      const { data: ext } = await supabase.from('leee_extractions')
        .select('skills_profile, narrative_summary').eq('session_id', sessions[0].id).limit(1).single();
      if (ext) leeeSkills = ext.skills_profile || [];
    }

    const scores = calculateMatchScore(profile, leeeSkills, vacancy);

    matches.push({
      jobseeker_id: profile.id,
      name: profile.user_profiles?.full_name || 'Unknown',
      location: profile.preferred_location,
      disability_type: profile.disability_type,
      match_score: scores.total,
      match_breakdown: scores,
      has_leee_evidence: leeeSkills.length > 0,
      skills_evidenced: leeeSkills.map((s: any) => ({ name: s.skill_name, proficiency: s.proficiency, confidence: s.confidence })),
      profile_completion: profile.completion_percentage,
    });
  }

  matches.sort((a, b) => b.match_score - a.match_score);

  return NextResponse.json({ matches, vacancy: { title: vacancy.title, employer: vacancy.employer_profiles?.organization_name } });
}

// ============================================================
// SCORING ENGINE
// ============================================================

function calculateMatchScore(profile: any, leeeSkills: any[], vacancy: any) {
  const weights = {
    humanCentricSkills: 35,   // Most important — this is what SIS is about
    profileEvidence: 25,       // Education, certs, work history
    locationFit: 15,           // Location + work arrangement
    compensationFit: 10,       // Salary expectations alignment
    accessibilityFit: 10,      // PWD accommodation readiness
    evidenceReadiness: 5,      // Has the person done LEEE?
  };

  const scores: Record<string, { score: number; weight: number; details: string }> = {};

  // 1. HUMAN-CENTRIC SKILLS MATCH (35%)
  const requiredSkills = (vacancy.competency_blueprint?.human_centric_skills || []) as Array<{ skill: string; importance: string; psf_skill_id: string }>;
  if (requiredSkills.length > 0 && leeeSkills.length > 0) {
    let skillScore = 0;
    let maxPossible = 0;

    for (const req of requiredSkills) {
      const importanceWeight = req.importance === 'critical' ? 3 : req.importance === 'important' ? 2 : 1;
      maxPossible += importanceWeight;

      // Find matching LEEE skill
      const match = leeeSkills.find((s: any) =>
        s.skill_name?.toLowerCase().includes(req.skill?.toLowerCase()) ||
        req.skill?.toLowerCase().includes(s.skill_name?.toLowerCase()) ||
        s.skill_id === req.psf_skill_id
      );

      if (match) {
        const profMultiplier = match.proficiency?.toLowerCase() === 'advanced' ? 1.0 :
          match.proficiency?.toLowerCase() === 'intermediate' ? 0.75 : 0.5;
        skillScore += importanceWeight * profMultiplier * (match.confidence || 0.5);
      }
    }

    const pct = maxPossible > 0 ? Math.round((skillScore / maxPossible) * 100) : 0;
    scores.humanCentricSkills = { score: pct, weight: weights.humanCentricSkills, details: `${leeeSkills.length} skills evidenced vs ${requiredSkills.length} needed` };
  } else if (leeeSkills.length > 0) {
    scores.humanCentricSkills = { score: 50, weight: weights.humanCentricSkills, details: 'Skills evidenced but no specific role requirements to match against' };
  } else {
    scores.humanCentricSkills = { score: 20, weight: weights.humanCentricSkills, details: 'No LEEE evidence yet — complete a conversation with Aya' };
  }

  // 2. PROFILE EVIDENCE (25%)
  let profileScore = 0;
  const profileDetails: string[] = [];

  // Education match
  const education = profile.education || [];
  const hasRelevantEdu = education.some((e: any) => e.status === 'completed' && e.degree);
  if (hasRelevantEdu) { profileScore += 30; profileDetails.push('Education ✓'); }

  // Certifications
  const certs = profile.certifications || [];
  if (certs.length > 0) { profileScore += 20; profileDetails.push(`${certs.length} certification(s) ✓`); }

  // Work history
  const workHistory = profile.work_history || [];
  if (workHistory.length > 0) { profileScore += 30; profileDetails.push(`${workHistory.length} work experience(s) ✓`); }

  // Skills inventory match
  const skills = (profile.skills_inventory || []) as string[];
  const hardSkills = (vacancy.competency_blueprint?.hard_skills || []) as string[];
  const skillMatches = hardSkills.filter((hs: string) =>
    skills.some((s: string) => s.toLowerCase().includes(hs.toLowerCase()) || hs.toLowerCase().includes(s.toLowerCase()))
  );
  if (skillMatches.length > 0) { profileScore += 20; profileDetails.push(`${skillMatches.length} skill match(es) ✓`); }

  scores.profileEvidence = { score: Math.min(profileScore, 100), weight: weights.profileEvidence, details: profileDetails.join(', ') || 'Limited profile data' };

  // 3. LOCATION FIT (15%)
  const prefLoc = (profile.preferred_location || '').toLowerCase();
  const vacLoc = (vacancy.location || '').toLowerCase();
  const prefArr = profile.preferred_work_arrangement;
  const vacArr = vacancy.work_arrangement;

  let locScore = 50; // Default: unknown
  if (vacArr === 'remote') { locScore = 90; } // Remote works for everyone
  else if (prefLoc && vacLoc && (prefLoc.includes(vacLoc.split(',')[0]) || vacLoc.includes(prefLoc.split(',')[0]))) { locScore = 90; }
  else if (prefArr === vacArr) { locScore = 70; }
  scores.locationFit = { score: locScore, weight: weights.locationFit, details: `Preferred: ${prefLoc || 'not set'} / ${prefArr || 'any'} | Vacancy: ${vacLoc || 'not set'} / ${vacArr || 'not set'}` };

  // 4. COMPENSATION FIT (10%)
  const salaryExp = profile.salary_expectations || {};
  const compRange = vacancy.compensation_range || {};
  let compScore = 50; // Default if no data
  if (salaryExp.min && compRange.range) {
    compScore = 70; // At least both have data
  }
  scores.compensationFit = { score: compScore, weight: weights.compensationFit, details: salaryExp.min ? `${salaryExp.min}-${salaryExp.max} PHP` : 'Not specified' };

  // 5. ACCESSIBILITY FIT (10%)
  const hasDisability = !!profile.disability_type;
  const employerAccessible = !!vacancy.employer_profiles?.accessibility_info?.pwd_friendly;
  let accScore = 70;
  if (hasDisability && employerAccessible) accScore = 95;
  else if (hasDisability && !employerAccessible) accScore = 40;
  else accScore = 70;
  scores.accessibilityFit = { score: accScore, weight: weights.accessibilityFit, details: hasDisability ? `Disability: ${profile.disability_type} | Employer PWD-friendly: ${employerAccessible ? 'Yes' : 'Unknown'}` : 'No disability disclosed' };

  // 6. EVIDENCE READINESS (5%)
  const readinessScore = leeeSkills.length > 0 ? 100 : 30;
  scores.evidenceReadiness = { score: readinessScore, weight: weights.evidenceReadiness, details: leeeSkills.length > 0 ? 'LEEE completed' : 'LEEE not yet completed' };

  // WEIGHTED TOTAL
  let total = 0;
  let totalWeight = 0;
  for (const [key, val] of Object.entries(scores)) {
    total += val.score * val.weight;
    totalWeight += val.weight;
  }
  const finalScore = totalWeight > 0 ? Math.round(total / totalWeight) : 0;

  return { total: finalScore, ...scores };
}
