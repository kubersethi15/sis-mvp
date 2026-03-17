// ============================================================
// LEEE SESSION CALIBRATION — Ryan Gersava v2
// Derives session calibration from jobseeker profile data.
// This tells Aya HOW to behave — not what to say.
// ============================================================

export interface CalibrationBlock {
  experience_level: 'early_career' | 'mid_career' | 'senior' | 'non_traditional';
  communication_style: 'formal' | 'informal' | 'mixed';
  probe_depth: 'gentle' | 'standard' | 'deep';
  session_pace: 'unhurried' | 'standard' | 'efficient';
  coaching_notes: string[];
}

// ============================================================
// DERIVATION LOGIC — follows Ryan's §1.2 rules exactly
// ============================================================

function calculateTotalYears(workHistory: any[]): number {
  if (!workHistory?.length) return 0;
  return workHistory.reduce((total: number, w: any) => {
    const years = w.years || w.duration_years || 1;
    return total + years;
  }, 0);
}

function isMostlyInformal(workHistory: any[]): boolean {
  if (!workHistory?.length) return false;
  const informalKeywords = ['freelance', 'casual', 'volunteer', 'family', 'home', 'community', 'sideline', 'self-employed', 'ojt', 'informal'];
  const informalCount = workHistory.filter((w: any) => {
    const roleStr = (w.role || w.title || '').toLowerCase();
    const companyStr = (w.company || w.employer || '').toLowerCase();
    return informalKeywords.some(k => roleStr.includes(k) || companyStr.includes(k));
  }).length;
  return informalCount > workHistory.length / 2;
}

function hasSeniorRoles(workHistory: any[]): boolean {
  if (!workHistory?.length) return false;
  const seniorKeywords = ['manager', 'director', 'head', 'lead', 'senior', 'chief', 'supervisor', 'coordinator', 'officer'];
  return workHistory.some((w: any) => {
    const role = (w.role || w.title || '').toLowerCase();
    return seniorKeywords.some(k => role.includes(k));
  });
}

function analyzeLanguageRegister(profile: any): 'formal' | 'informal' | 'mixed' {
  // Use career_goals or cover_letter if present as a language signal
  const text = (profile.career_goals || '') + ' ' + (profile.cover_letter || '') + ' ' + (profile.bio || '');
  if (!text.trim()) return 'mixed'; // default when no text available

  const taglishMarkers = ['naman', 'kasi', 'talaga', 'nga', 'yung', 'siya', 'pero', 'parang', 'lang', 'dito', 'doon', 'po', 'opo'];
  const hasTaqlish = taglishMarkers.some(m => text.toLowerCase().includes(m));
  const hasSlang = /\b(gotta|gonna|kinda|sorta|yeah|yep|nope)\b/i.test(text);

  if (hasTaqlish) return 'informal';
  if (hasSlang) return 'informal';

  const wordCount = text.split(/\s+/).length;
  const avgWordLength = text.replace(/\s+/g, '').length / Math.max(wordCount, 1);
  if (avgWordLength > 5.5 && wordCount > 20) return 'formal';

  return 'mixed';
}

// ============================================================
// MAIN DERIVATION FUNCTION
// ============================================================

export function deriveCalibration(profile: any, psychometrics?: any): CalibrationBlock {
  const workHistory = profile.work_history || [];
  const disability = profile.disability_context || {};
  const totalYears = calculateTotalYears(workHistory);
  const informalWork = isMostlyInformal(workHistory);
  const seniorRoles = hasSeniorRoles(workHistory);
  const disabilitySensitivity = disability.sensitivity_level === 'high' || disability.recently_diagnosed;
  const avoiderScore = psychometrics?.saboteurs?.avoider || psychometrics?.saboteur_scores?.avoider || 0;
  const victimScore = psychometrics?.saboteurs?.victim || psychometrics?.saboteur_scores?.victim || 0;

  // experience_level
  const experience_level: CalibrationBlock['experience_level'] =
    informalWork ? 'non_traditional' :
    totalYears < 3 ? 'early_career' :
    totalYears > 10 && seniorRoles ? 'senior' :
    'mid_career';

  // communication_style
  const communication_style = analyzeLanguageRegister(profile);

  // probe_depth
  const probe_depth: CalibrationBlock['probe_depth'] =
    (disabilitySensitivity || avoiderScore >= 7) ? 'gentle' :
    (experience_level === 'senior' && !disabilitySensitivity) ? 'deep' :
    'standard';

  // session_pace
  const session_pace: CalibrationBlock['session_pace'] =
    (disability.communication_impact || avoiderScore >= 7) ? 'unhurried' :
    (experience_level === 'senior' && communication_style === 'formal') ? 'efficient' :
    'standard';

  // coaching_notes — built from signals
  const coaching_notes: string[] = [];

  if (experience_level === 'non_traditional') {
    coaching_notes.push('Actively invite non-work stories. Frame "experience" broadly — community, family, sidelines, and everyday problem-solving are all valid evidence territory.');
  }
  if (experience_level === 'early_career') {
    coaching_notes.push('Use simpler story prompts. Accept community, school, and family stories without pushing for formal work scenarios.');
  }
  if (experience_level === 'senior') {
    coaching_notes.push('This person has substantial experience. Deeper follow-ups are appropriate. Watch for identity adjustment if the target role is below their previous level — probe for transferable skills respectfully.');
  }
  if (probe_depth === 'gentle') {
    coaching_notes.push('Maximum 2 follow-up probes per story element. Accept surface-level answers gracefully. Comfort comes before extraction completeness.');
  }
  if (session_pace === 'unhurried') {
    coaching_notes.push('Longer pauses are completely fine. If the user goes quiet, acknowledge warmly: "Take your time, no rush." Do not rush through phases.');
  }
  if (avoiderScore >= 7 || victimScore >= 7) {
    coaching_notes.push('IMPORTANT — SELF-DEPRECATION PATTERN LIKELY: This person may minimise their achievements or attribute success to external factors. When they say "anyone could do that" or "swerte lang" or "hindi naman special" — gently persist with "What did YOU specifically do in that moment?" Do not accept self-dismissal as a final answer.');
  }
  if (disabilitySensitivity) {
    coaching_notes.push('Handle with care. This person has recently disclosed or been diagnosed with a disability that affects communication. Never reference or ask about the disability. Adjust naturally to their communication pace.');
  }
  if (communication_style === 'informal') {
    coaching_notes.push('Mirror casual Taglish register. Keep questions short. Use everyday Filipino naturally.');
  }
  if (communication_style === 'formal') {
    coaching_notes.push('Match professional register. Can use slightly more complex phrasing. Structured probing is appropriate.');
  }

  return { experience_level, communication_style, probe_depth, session_pace, coaching_notes };
}

// ============================================================
// CONTEXT BLOCK BUILDER — produces the string injected into prompt
// ============================================================

// R10: Experience snapshot — "most relevant role + notable achievement"
function synthesizeExperienceSnapshot(profile: any): string {
  const workHistory = profile.work_history || [];
  if (!workHistory.length) return 'No formal work history on file.';

  // Find most recent / longest role
  const sorted = [...workHistory].sort((a: any, b: any) => {
    const aYears = a.years || a.duration_years || 1;
    const bYears = b.years || b.duration_years || 1;
    return bYears - aYears;
  });

  const topRole = sorted[0];
  const roleStr = `${topRole.role || topRole.title || 'Role'} at ${topRole.company || topRole.employer || 'employer'} (${topRole.years || topRole.duration_years || '?'} yrs)`;

  // Look for achievements in descriptions
  const allDescriptions = workHistory
    .map((w: any) => w.description || '')
    .filter(Boolean)
    .join(' ');

  const achievementKeywords = ['award', 'selected', 'promoted', 'led', 'built', 'achieved', 'recognized', 'top', 'best', 'first'];
  const sentences = allDescriptions.split(/[.!?]+/).filter(Boolean);
  const achievementSentence = sentences.find((s: string) =>
    achievementKeywords.some(k => s.toLowerCase().includes(k))
  );

  if (achievementSentence) {
    return `Most relevant: ${roleStr}. Notable: ${achievementSentence.trim()}.`;
  }

  // Fall back to career goals if no achievements in work history
  if (profile.career_goals) {
    return `Most relevant: ${roleStr}. Career direction: ${profile.career_goals.substring(0, 100)}.`;
  }

  return `Most relevant: ${roleStr}.`;
}

export function buildCalibrationContext(
  profile: any,
  vacancy: any,
  psychometrics: any,
  previousSkills: string[],
  previousGaps: string[]
): string {
  const calibration = deriveCalibration(profile, psychometrics);

  const name = profile.user_profiles?.full_name || profile.full_name || 'this person';
  const firstName = name.split(' ')[0];
  const workStr = (profile.work_history || []).map((w: any) => `${w.role || w.title} at ${w.company || w.employer} (${w.years || '?'} yrs)`).join('; ') || 'No formal work history';
  const eduStr = (profile.education || []).map((e: any) => `${e.degree} from ${e.institution}`).join('; ') || 'Not specified';

  // Psychometric highlights
  let psychoSection = '';
  if (psychometrics) {
    const riasec = psychometrics.riasec_dominant || psychometrics.riasec_scores?.dominant || [];
    const high5 = psychometrics.high5_strengths || psychometrics.high5?.strengths || [];
    const avoider = psychometrics.saboteurs?.avoider || psychometrics.saboteur_scores?.avoider || 0;
    const victim = psychometrics.saboteurs?.victim || psychometrics.saboteur_scores?.victim || 0;

    if (riasec.length || high5.length) {
      psychoSection = `
PSYCHOMETRIC HIGHLIGHTS:
- RIASEC dominant: ${riasec.join(', ') || 'Not available'}
- HIGH5 strengths: ${high5.join(', ') || 'Not available'}
- Avoider saboteur: ${avoider}/10 | Victim saboteur: ${victim}/10`;
    }
  }

  // Vacancy section
  let vacancySection = '';
  if (vacancy) {
    const competencies = (vacancy.competency_blueprint?.human_centric_skills || []).map((s: any) => s.skill || s).join(', ');
    vacancySection = `
TARGET ROLE:
- Position: ${vacancy.title} at ${vacancy.employer_name || 'employer'}
- Key competencies needed: ${competencies || 'Not specified'}
- Steer stories toward: experiences that demonstrate these competencies (WITHOUT naming them to the user)`;
  }

  // Previous sessions
  let sessionSection = '';
  if (previousSkills.length) {
    sessionSection = `
PREVIOUS SESSION CONTEXT:
- Skills already evidenced: ${previousSkills.join(', ')}
- Skills not yet evidenced: ${previousGaps.join(', ')}
- Steer this session toward stories that surface the unevidenced skills`;
  }

  return `
═══════════════════════════════════════
SESSION CALIBRATION — INTERNAL ONLY. NEVER REVEAL TO USER.
═══════════════════════════════════════

CANDIDATE: ${firstName} (full name: ${name})
EXPERIENCE SNAPSHOT: ${synthesizeExperienceSnapshot(profile)}
WORK HISTORY: ${workStr}
EDUCATION: ${eduStr}
DISABILITY: ${profile.disability_type || 'Not disclosed'}${profile.disability_context?.severity ? ` (${profile.disability_context.severity})` : ''}${profile.disability_context?.communication_impact ? ` — communication: ${profile.disability_context.communication_impact}` : ''}${profile.disability_context?.recently_diagnosed ? ' — RECENT DIAGNOSIS' : ''}
CAREER GOALS: ${profile.career_goals || 'Not specified'}
CHALLENGES: ${(profile.self_reported_challenges || []).join('; ') || 'Not specified'}${profile.disability_context?.accommodation_notes ? `\nACCOMMODATION NOTES: ${profile.disability_context.accommodation_notes}` : ''}
${psychoSection}${vacancySection}${sessionSection}

CALIBRATION FOR THIS SESSION:
- Experience level: ${calibration.experience_level}
- Communication style: ${calibration.communication_style}  
- Probe depth: ${calibration.probe_depth} (${calibration.probe_depth === 'gentle' ? 'max 2 follow-ups, prioritise comfort' : calibration.probe_depth === 'deep' ? 'can push further, use verification probes freely' : 'standard 3 follow-ups'})
- Session pace: ${calibration.session_pace} (${calibration.session_pace === 'unhurried' ? 'target 15-20 min, long pauses are fine' : calibration.session_pace === 'efficient' ? 'target 10-15 min, direct transitions ok' : 'target 12-18 min'})

COACHING NOTES FOR AYA:
${calibration.coaching_notes.map((n, i) => `${i + 1}. ${n}`).join('\n')}

FIRST MESSAGE INSTRUCTION: Greet ${firstName} warmly by name. Match their communication style (${calibration.communication_style}). DO NOT mention any of the above context — just let it shape how you speak and probe.
═══════════════════════════════════════`;
}
