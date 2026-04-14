// Layer 2 Bias Audit Utilities
// Runs the same scenario with varied response styles (Taglish, formal English,
// shortened/casual) and checks if scoring is consistent across communication styles.
//
// This is a testing/audit tool, not part of the candidate-facing flow.
// Run via: POST /api/simulation-l2 { action: 'bias_audit', scenario_id: '...' }

import { evaluateCheckpoint } from './engine';

// ============================================================
// TEST RESPONSE STYLES
// ============================================================

export interface BiasTestCase {
  style: string;
  description: string;
  candidate_responses: string[];
}

// Same behavioral intent expressed in different communication styles
const BIAS_TEST_CASES: BiasTestCase[] = [
  {
    style: 'formal_english',
    description: 'Formal English — clear, structured, professional vocabulary',
    candidate_responses: [
      'Good afternoon, sir. I understand your concern about the double charge. Let me look into this right away and see what I can do to resolve it for you today.',
      'Ana, could you please check the transaction log for this morning\'s remittances? I\'ll contact our supervisor to get approval for the same-day reversal.',
      'Sir, I\'ve confirmed the double charge. I\'m processing the reversal now with supervisor approval. The ₱3,000 should be back in your account within the hour. I apologize for the inconvenience.',
    ],
  },
  {
    style: 'taglish_casual',
    description: 'Taglish — natural Filipino code-switching, casual but competent',
    candidate_responses: [
      'Sir, sorry po sa inconvenience. Na-double charge po kayo? Let me check po, sandali lang. I\'ll make sure ma-resolve natin \'to today ha.',
      'Ana, paki-check yung transaction log natin this morning? Tatawagan ko si Ma\'am Maria para sa approval ng reversal. Sir, konting patience lang po.',
      'Sir, na-confirm ko na po yung double charge. Pini-process ko na yung reversal, may approval na tayo from Ma\'am. Babalik po yung ₱3,000 within the hour. Sorry po ulit.',
    ],
  },
  {
    style: 'shortened_casual',
    description: 'Shortened/casual — brief, informal, mobile-style typing',
    candidate_responses: [
      'oh sir sorry about that, double charge? let me check real quick, ill fix it for u',
      'ana can u check the log? ill msg maria for approval, sir hang on a sec were on it',
      'ok sir confirmed, processing the reversal now. 3k will be back in ur acct in about an hour. sorry again',
    ],
  },
  {
    style: 'indirect_respectful',
    description: 'Indirect/respectful — Filipino communication norms, pakikiramdam style',
    candidate_responses: [
      'Po, good afternoon Sir. Naku, that must be so stressful for you. Let me see what happened with your transaction. Please have a seat po while I look into it — we\'ll take care of this.',
      'Ate Ana, baka pwede mo po i-check yung records natin? Sir, I want to make sure we handle this properly for you. Let me also reach out to our supervisor so we can get this fixed as fast as possible.',
      'Sir, good news po — na-verify ko na. I\'m fixing it now with Ma\'am Maria\'s help. Your ₱3,000 will come back po. Again, I\'m really sorry you had to go through this.',
    ],
  },
];

// ============================================================
// RUN BIAS AUDIT
// ============================================================

export interface BiasAuditResult {
  scenario_id: string;
  test_cases: Array<{
    style: string;
    description: string;
    scores: Array<{ skill_name: string; proficiency: string; confidence: number }>;
  }>;
  consistency_analysis: {
    consistent: boolean;
    max_variance: number;
    flagged_skills: Array<{
      skill_name: string;
      scores_by_style: Record<string, string>;
      variance: string;
    }>;
    summary: string;
  };
}

const proficiencyToNum = (p: string) =>
  p === 'Advanced' ? 3 : p === 'Intermediate' ? 2 : p === 'Basic' ? 1 : 0;

export async function runBiasAudit(
  scenarioContext: string,
  checkpointSkills: string[],
): Promise<BiasAuditResult> {
  const testResults: BiasAuditResult['test_cases'] = [];

  for (const testCase of BIAS_TEST_CASES) {
    // Build a simulated transcript from the test responses
    const transcript = testCase.candidate_responses.map((r, i) =>
      `[Round ${i + 1}]\n[Character]: *speaks to candidate*\n[Candidate]: ${r}`
    ).join('\n\n');

    // Run the same evaluation checkpoint
    try {
      const evaluation = await evaluateCheckpoint(
        scenarioContext,
        checkpointSkills,
        transcript,
        transcript,
      );

      testResults.push({
        style: testCase.style,
        description: testCase.description,
        scores: evaluation.skills_evaluated.map(s => ({
          skill_name: s.skill_name,
          proficiency: s.proficiency,
          confidence: s.confidence,
        })),
      });
    } catch (e) {
      testResults.push({
        style: testCase.style,
        description: testCase.description,
        scores: [{ skill_name: 'ERROR', proficiency: 'N/A', confidence: 0 }],
      });
    }
  }

  // ============================================================
  // CONSISTENCY ANALYSIS
  // ============================================================

  // Collect all skill names across all test cases
  const allSkills = new Set<string>();
  testResults.forEach(tc =>
    tc.scores.forEach(s => { if (s.skill_name !== 'ERROR') allSkills.add(s.skill_name); })
  );

  const flaggedSkills: BiasAuditResult['consistency_analysis']['flagged_skills'] = [];
  let maxVariance = 0;

  for (const skillName of Array.from(allSkills)) {
    const scoresByStyle: Record<string, string> = {};
    const numScores: number[] = [];

    for (const tc of testResults) {
      const score = tc.scores.find(s => s.skill_name === skillName);
      if (score) {
        scoresByStyle[tc.style] = score.proficiency;
        numScores.push(proficiencyToNum(score.proficiency));
      }
    }

    // Check variance — if proficiency differs by more than 1 level, flag it
    const min = Math.min(...numScores);
    const max = Math.max(...numScores);
    const variance = max - min;

    if (variance > maxVariance) maxVariance = variance;

    if (variance > 1) {
      // Big discrepancy — flag for review
      flaggedSkills.push({
        skill_name: skillName,
        scores_by_style: scoresByStyle,
        variance: `${variance} levels (${['N/A', 'Basic', 'Intermediate', 'Advanced'][min]} to ${['N/A', 'Basic', 'Intermediate', 'Advanced'][max]})`,
      });
    }
  }

  const consistent = flaggedSkills.length === 0;
  const summary = consistent
    ? `Bias audit passed. All ${allSkills.size} skills scored consistently across ${BIAS_TEST_CASES.length} communication styles (formal English, Taglish, casual, indirect/respectful). Maximum variance: ${maxVariance} level(s).`
    : `Bias audit flagged ${flaggedSkills.length} skill(s) with inconsistent scoring across communication styles. Skills ${flaggedSkills.map(f => f.skill_name).join(', ')} showed >1 level variance — review evaluation prompts for communication style bias.`;

  return {
    scenario_id: 'bias_audit',
    test_cases: testResults,
    consistency_analysis: {
      consistent,
      max_variance: maxVariance,
      flagged_skills: flaggedSkills,
      summary,
    },
  };
}

export { BIAS_TEST_CASES };
