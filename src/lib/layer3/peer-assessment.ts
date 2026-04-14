// Layer 3: Peer/360 Assessment Engine
// References independently rate the candidate on the same PSF skills
// Three-layer convergence: L1 (self-report) + L2 (simulation) + L3 (peer)
// This completes the anti-gaming triangle — you can't fake what 5 people say about you

import { callLLM } from '@/lib/llm';

// ============================================================
// TYPES
// ============================================================

export interface ReferenceContact {
  id: string;
  candidate_id: string;
  name: string;
  relationship: string;  // "former colleague", "trainer", "community leader", "family member"
  email?: string;
  phone?: string;
  token: string;          // unique submission token
  status: 'invited' | 'submitted' | 'expired';
  invited_at: string;
  submitted_at?: string;
}

export interface SkillRating {
  skill_name: string;
  rating: 1 | 2 | 3 | 4 | 5;  // 1=rarely, 2=sometimes, 3=often, 4=very often, 5=consistently
  example?: string;             // "I saw them do this when..."
}

export interface PeerAssessment {
  id: string;
  reference_id: string;
  candidate_id: string;
  ratings: SkillRating[];
  overall_impression: string;
  relationship_context: string;   // how long/well they know the candidate
  submitted_at: string;
}

export interface RubricQuestion {
  skill_name: string;
  question: string;
  description: string;           // helps the reference understand what to rate
  examples: string[];            // "For example: staying calm under pressure, adapting when plans change"
  low_anchor: string;            // "Rarely shows this"
  high_anchor: string;           // "Consistently demonstrates this"
}

export interface ThreeLayerConvergence {
  skill_name: string;
  layer1_score: string;          // "Basic" | "Intermediate" | "Advanced"
  layer1_confidence: number;
  layer2_score: string;
  layer2_confidence: number;
  layer3_score: string;          // Derived from peer average
  layer3_confidence: number;
  layer3_peer_count: number;     // How many references rated this skill
  combined_score: string;
  combined_confidence: number;
  convergence_type: 'full_agreement' | 'l1_l2_agree' | 'l2_l3_agree' | 'l1_l3_agree' | 'all_diverge' | 'undersell' | 'overclaim';
  note: string;
}

// ============================================================
// RUBRIC GENERATION — adaptive based on L1+L2 results
// ============================================================

const BASE_RUBRIC: RubricQuestion[] = [
  {
    skill_name: 'Communication',
    question: 'How clearly does this person communicate with others?',
    description: 'Think about how they explain things, listen to others, and adapt their message to different people.',
    examples: ['Explains ideas clearly', 'Listens before responding', 'Adjusts how they talk depending on who they\'re talking to'],
    low_anchor: 'Often unclear or doesn\'t listen well',
    high_anchor: 'Consistently clear, listens well, and adapts to the audience',
  },
  {
    skill_name: 'Collaboration',
    question: 'How well does this person work with others?',
    description: 'Think about teamwork, helping others, sharing credit, and handling disagreements.',
    examples: ['Volunteers to help others', 'Shares credit for group achievements', 'Handles disagreements respectfully'],
    low_anchor: 'Prefers to work alone or struggles in teams',
    high_anchor: 'Natural team player who makes others better',
  },
  {
    skill_name: 'Problem-Solving',
    question: 'How does this person handle problems or unexpected challenges?',
    description: 'Think about when things go wrong — do they freeze, panic, or figure it out?',
    examples: ['Stays calm when things go wrong', 'Comes up with creative solutions', 'Doesn\'t wait to be told what to do'],
    low_anchor: 'Gets stuck or waits for others to solve problems',
    high_anchor: 'Consistently finds solutions and takes initiative',
  },
  {
    skill_name: 'Adaptability',
    question: 'How does this person handle change or uncertainty?',
    description: 'Think about when plans change, when they face setbacks, or when they\'re in unfamiliar situations.',
    examples: ['Adjusts quickly when plans change', 'Bounces back from setbacks', 'Stays positive in uncertain situations'],
    low_anchor: 'Struggles with change or gives up easily',
    high_anchor: 'Thrives in changing situations and helps others adapt',
  },
  {
    skill_name: 'Emotional Intelligence',
    question: 'How aware is this person of their own emotions and others\' feelings?',
    description: 'Think about empathy, self-control, and reading the room.',
    examples: ['Notices when someone is upset', 'Controls their temper', 'Makes people feel heard and understood'],
    low_anchor: 'Often unaware of how others feel or reacts impulsively',
    high_anchor: 'Deeply empathetic and emotionally mature',
  },
  {
    skill_name: 'Self-Management',
    question: 'How responsible and reliable is this person?',
    description: 'Think about keeping commitments, managing time, and being dependable.',
    examples: ['Shows up on time', 'Follows through on commitments', 'Manages their own workload without constant reminding'],
    low_anchor: 'Often needs reminding or misses commitments',
    high_anchor: 'Extremely reliable — you can always count on them',
  },
  {
    skill_name: 'Learning Agility',
    question: 'How quickly does this person learn new things?',
    description: 'Think about picking up new skills, asking questions, and improving over time.',
    examples: ['Learns new things quickly', 'Asks good questions', 'Applies what they learn to new situations'],
    low_anchor: 'Slow to pick up new things or resistant to learning',
    high_anchor: 'Fast learner who actively seeks to improve',
  },
  {
    skill_name: 'Work Ethic',
    question: 'How much effort and care does this person put into what they do?',
    description: 'Think about dedication, going above and beyond, and quality of work.',
    examples: ['Takes pride in their work', 'Goes the extra mile', 'Doesn\'t cut corners'],
    low_anchor: 'Does the minimum or needs a lot of supervision',
    high_anchor: 'Consistently gives their best effort',
  },
];

export function generateRubric(
  l1Skills?: { skill_name: string; proficiency: string; confidence: number }[],
  l2Skills?: { skill_name: string; proficiency: string; confidence: number }[],
): RubricQuestion[] {
  // Start with base rubric
  let rubric = [...BASE_RUBRIC];

  if (l1Skills && l2Skills) {
    // Prioritize skills where L1 and L2 diverge or confidence is low
    const prioritySkills: string[] = [];

    for (const l1 of l1Skills) {
      const l2 = l2Skills.find(s => s.skill_name === l1.skill_name);
      if (l2) {
        const profRank = (p: string) => p === 'Advanced' ? 3 : p === 'Intermediate' ? 2 : p === 'Basic' ? 1 : 0;
        const divergent = Math.abs(profRank(l1.proficiency) - profRank(l2.proficiency)) > 0;
        const lowConfidence = l1.confidence < 0.6 || l2.confidence < 0.6;
        if (divergent || lowConfidence) {
          prioritySkills.push(l1.skill_name);
        }
      }
    }

    // Move priority skills to the top of the rubric
    if (prioritySkills.length > 0) {
      const priority = rubric.filter(q => prioritySkills.some(ps =>
        q.skill_name.toLowerCase().includes(ps.toLowerCase()) || ps.toLowerCase().includes(q.skill_name.toLowerCase())
      ));
      const rest = rubric.filter(q => !priority.includes(q));
      rubric = [...priority, ...rest];
    }
  }

  return rubric;
}

// ============================================================
// THREE-LAYER CONVERGENCE
// ============================================================

const PROFICIENCY_RANK: Record<string, number> = { 'Advanced': 3, 'Intermediate': 2, 'Basic': 1, 'Not assessed': 0 };

function peerRatingToProficiency(avgRating: number): string {
  if (avgRating >= 4.0) return 'Advanced';
  if (avgRating >= 2.5) return 'Intermediate';
  return 'Basic';
}

function peerRatingToConfidence(ratings: number[], count: number): number {
  if (count === 0) return 0;
  // Confidence based on: number of raters + agreement between raters
  const countFactor = Math.min(count / 5, 1) * 0.5; // More raters = more confident (up to 5)
  const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / ratings.length;
  const agreementFactor = Math.max(0, 1 - variance / 4) * 0.5; // Low variance = high agreement
  return Math.round((countFactor + agreementFactor) * 100) / 100;
}

export function calculateThreeLayerConvergence(
  l1Skills: { skill_name: string; proficiency: string; confidence: number }[],
  l2Skills: { skill_name: string; proficiency: string; confidence: number }[],
  peerAssessments: PeerAssessment[],
): ThreeLayerConvergence[] {
  // Aggregate peer ratings per skill
  const peerAggregated: Record<string, { ratings: number[]; examples: string[] }> = {};

  for (const assessment of peerAssessments) {
    for (const rating of assessment.ratings) {
      if (!peerAggregated[rating.skill_name]) {
        peerAggregated[rating.skill_name] = { ratings: [], examples: [] };
      }
      peerAggregated[rating.skill_name].ratings.push(rating.rating);
      if (rating.example) peerAggregated[rating.skill_name].examples.push(rating.example);
    }
  }

  // Build convergence for each skill
  const allSkills = new Set([
    ...l1Skills.map(s => s.skill_name),
    ...l2Skills.map(s => s.skill_name),
    ...Object.keys(peerAggregated),
  ]);

  const results: ThreeLayerConvergence[] = [];

  for (const skillName of Array.from(allSkills)) {
    const l1 = l1Skills.find(s => s.skill_name === skillName);
    const l2 = l2Skills.find(s => s.skill_name === skillName);
    const peer = peerAggregated[skillName];

    const l1Score = l1?.proficiency || 'Not assessed';
    const l1Conf = l1?.confidence || 0;
    const l2Score = l2?.proficiency || 'Not assessed';
    const l2Conf = l2?.confidence || 0;

    const l3Avg = peer ? peer.ratings.reduce((a, b) => a + b, 0) / peer.ratings.length : 0;
    const l3Score = peer ? peerRatingToProficiency(l3Avg) : 'Not assessed';
    const l3Conf = peer ? peerRatingToConfidence(peer.ratings, peer.ratings.length) : 0;
    const l3Count = peer ? peer.ratings.length : 0;

    const l1Rank = PROFICIENCY_RANK[l1Score] || 0;
    const l2Rank = PROFICIENCY_RANK[l2Score] || 0;
    const l3Rank = PROFICIENCY_RANK[l3Score] || 0;

    // Determine convergence type
    let convergenceType: ThreeLayerConvergence['convergence_type'] = 'all_diverge';
    let note = '';

    const l1l2Match = l1Score !== 'Not assessed' && l2Score !== 'Not assessed' && Math.abs(l1Rank - l2Rank) <= 0;
    const l2l3Match = l2Score !== 'Not assessed' && l3Score !== 'Not assessed' && Math.abs(l2Rank - l3Rank) <= 0;
    const l1l3Match = l1Score !== 'Not assessed' && l3Score !== 'Not assessed' && Math.abs(l1Rank - l3Rank) <= 0;

    if (l1l2Match && l2l3Match && l1l3Match) {
      convergenceType = 'full_agreement';
      note = 'All three layers agree — highest confidence.';
    } else if (l2l3Match && l1Rank < l2Rank) {
      convergenceType = 'undersell';
      note = 'Candidate undersells — simulation and peers both rate higher than self-report. Common with modest candidates.';
    } else if (l1l2Match && l3Rank < l2Rank) {
      convergenceType = 'l1_l2_agree';
      note = 'Self-report and simulation agree, but peers rate lower. May indicate contextual performance difference.';
    } else if (l1Rank > l2Rank && l1Rank > l3Rank) {
      convergenceType = 'overclaim';
      note = 'Candidate rates themselves higher than both simulation and peers suggest. Recommend review.';
    } else if (l2l3Match) {
      convergenceType = 'l2_l3_agree';
      note = 'Simulation and peers agree — strong external validation.';
    } else if (l1l3Match) {
      convergenceType = 'l1_l3_agree';
      note = 'Self-report and peers agree, simulation differs. May indicate simulation context was atypical.';
    } else {
      note = 'All three layers show different levels. Recommend psychologist review for this skill.';
    }

    // Combined score — weighted: L2 (0.40) + L3 (0.35) + L1 (0.25)
    // Behavioral observation + peer validation weighted higher than self-report
    const weightedRank = (l2Rank * 0.40) + (l3Rank * 0.35) + (l1Rank * 0.25);
    const combinedScore = weightedRank >= 2.5 ? 'Advanced' : weightedRank >= 1.5 ? 'Intermediate' : weightedRank >= 0.5 ? 'Basic' : 'Not assessed';

    // Combined confidence — boosted by agreement
    let combinedConf = (l1Conf * 0.25) + (l2Conf * 0.40) + (l3Conf * 0.35);
    if (convergenceType === 'full_agreement') combinedConf = Math.min(1.0, combinedConf + 0.15);
    if (convergenceType === 'overclaim') combinedConf = Math.max(0.2, combinedConf - 0.10);
    if (convergenceType === 'undersell') combinedConf = Math.min(1.0, combinedConf + 0.05);

    results.push({
      skill_name: skillName,
      layer1_score: l1Score, layer1_confidence: l1Conf,
      layer2_score: l2Score, layer2_confidence: l2Conf,
      layer3_score: l3Score, layer3_confidence: l3Conf, layer3_peer_count: l3Count,
      combined_score: combinedScore,
      combined_confidence: Math.round(combinedConf * 100) / 100,
      convergence_type: convergenceType,
      note,
    });
  }

  return results;
}

// ============================================================
// ANTI-GAMING: Reference Independence Verification
// ============================================================

export function verifyReferenceIndependence(
  assessments: PeerAssessment[],
): { independent: boolean; flags: string[] } {
  const flags: string[] = [];

  if (assessments.length < 2) {
    return { independent: true, flags: ['Only 1 reference — cannot verify independence'] };
  }

  // Check 1: Submission timing — if all submitted within 5 minutes, suspicious
  const timestamps = assessments.map(a => new Date(a.submitted_at).getTime()).sort();
  const timeSpan = (timestamps[timestamps.length - 1] - timestamps[0]) / 60000; // minutes
  if (timeSpan < 5 && assessments.length >= 3) {
    flags.push(`All ${assessments.length} references submitted within ${Math.round(timeSpan)} minutes — unusually fast`);
  }

  // Check 2: Rating similarity — if all ratings are identical, suspicious
  const ratingStrings = assessments.map(a =>
    a.ratings.map(r => `${r.skill_name}:${r.rating}`).sort().join(',')
  );
  const allIdentical = ratingStrings.every(r => r === ratingStrings[0]);
  if (allIdentical && assessments.length >= 2) {
    flags.push('All references gave identical ratings — highly suspicious');
  }

  // Check 3: Example text similarity — if examples are copy-pasted
  const allExamples = assessments.flatMap(a => a.ratings.filter(r => r.example).map(r => r.example!));
  for (let i = 0; i < allExamples.length; i++) {
    for (let j = i + 1; j < allExamples.length; j++) {
      if (allExamples[i].length > 20 && allExamples[i] === allExamples[j]) {
        flags.push('Identical example text found across different references');
        break;
      }
    }
  }

  // Check 4: All ratings suspiciously high (all 5s)
  const avgRating = assessments.flatMap(a => a.ratings.map(r => r.rating));
  const overallAvg = avgRating.reduce((a, b) => a + b, 0) / avgRating.length;
  if (overallAvg > 4.8 && assessments.length >= 3) {
    flags.push(`Average rating ${overallAvg.toFixed(1)}/5 across all references — unusually high`);
  }

  return {
    independent: flags.length === 0,
    flags,
  };
}

// ============================================================
// GENERATE TOKEN
// ============================================================

export function generateReferenceToken(): string {
  return `ref_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}
