// Training Impact / Growth Tracking Engine
// Compares skills profiles across multiple conversations over time
// Calculates: skills delta, skills velocity, growth trajectory
//
// The key metric: "After the 10-week program, Communication improved 1.8 levels"
// This proves training works — for funders, government, employers.

// ============================================================
// TYPES
// ============================================================

export interface SkillSnapshot {
  skill_name: string;
  proficiency: string;      // "Basic" | "Intermediate" | "Advanced"
  confidence: number;
  session_id: string;
  session_date: string;
  session_tag?: string;     // "baseline" | "mid-program" | "post-program" | "follow-up"
}

export interface SkillDelta {
  skill_name: string;
  from_proficiency: string;
  to_proficiency: string;
  from_confidence: number;
  to_confidence: number;
  direction: 'improved' | 'declined' | 'stable';
  magnitude: number;        // 0-2 (levels of change)
  confidence_change: number;
  time_between_days: number;
}

export interface SkillsVelocity {
  skill_name: string;
  velocity: number;         // proficiency points per week
  classification: 'rapid' | 'standard' | 'slow' | 'stagnant' | 'declining';
  data_points: number;      // how many sessions contributed
}

export interface GrowthTrajectory {
  candidate_id: string;
  sessions: Array<{
    session_id: string;
    date: string;
    tag: string;
    skills: SkillSnapshot[];
  }>;
  deltas: SkillDelta[];
  velocity: SkillsVelocity[];
  overall_improvement: number;  // average magnitude across all skills
  top_improved: string[];       // skills that improved most
  needs_attention: string[];    // skills that declined or stagnated
  summary: string;
}

export interface CohortSummary {
  cohort_id: string;
  cohort_name: string;
  candidate_count: number;
  avg_improvement: number;
  skill_improvements: Record<string, { avg_delta: number; improved_count: number; total_count: number }>;
  top_movers: Array<{ candidate_id: string; name: string; improvement: number }>;
  lagging_skills: string[];
  summary: string;
}

// ============================================================
// SKILLS DELTA — compare two snapshots
// ============================================================

const PROF_RANK: Record<string, number> = { 'Advanced': 3, 'Intermediate': 2, 'Basic': 1, 'Not assessed': 0 };

export function calculateDelta(
  before: SkillSnapshot[],
  after: SkillSnapshot[],
  daysBetween: number,
): SkillDelta[] {
  const deltas: SkillDelta[] = [];

  const allSkills = new Set([
    ...before.map(s => s.skill_name),
    ...after.map(s => s.skill_name),
  ]);

  for (const skill of Array.from(allSkills)) {
    const b = before.find(s => s.skill_name === skill);
    const a = after.find(s => s.skill_name === skill);

    if (!b || !a) continue; // Need both snapshots

    const bRank = PROF_RANK[b.proficiency] || 0;
    const aRank = PROF_RANK[a.proficiency] || 0;
    const magnitude = Math.abs(aRank - bRank);
    const direction = aRank > bRank ? 'improved' : aRank < bRank ? 'declined' : 'stable';

    deltas.push({
      skill_name: skill,
      from_proficiency: b.proficiency,
      to_proficiency: a.proficiency,
      from_confidence: b.confidence,
      to_confidence: a.confidence,
      direction,
      magnitude,
      confidence_change: a.confidence - b.confidence,
      time_between_days: daysBetween,
    });
  }

  return deltas;
}

// ============================================================
// SKILLS VELOCITY — improvement rate over time
// ============================================================

export function calculateVelocity(
  snapshots: Array<{ date: string; skills: SkillSnapshot[] }>,
): SkillsVelocity[] {
  if (snapshots.length < 2) return [];

  // Sort by date
  const sorted = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalWeeks = Math.max(1, (new Date(last.date).getTime() - new Date(first.date).getTime()) / (7 * 24 * 60 * 60 * 1000));

  const allSkills = new Set(sorted.flatMap(s => s.skills.map(sk => sk.skill_name)));
  const velocities: SkillsVelocity[] = [];

  for (const skill of Array.from(allSkills)) {
    const firstSnapshot = first.skills.find(s => s.skill_name === skill);
    const lastSnapshot = last.skills.find(s => s.skill_name === skill);

    if (!firstSnapshot || !lastSnapshot) continue;

    const startRank = PROF_RANK[firstSnapshot.proficiency] || 0;
    const endRank = PROF_RANK[lastSnapshot.proficiency] || 0;
    const pointsGained = endRank - startRank;
    const velocity = pointsGained / totalWeeks;

    // Workera benchmarks: 5-10 standard, 10+ best-in-class (on their 0-100 scale)
    // Our scale is 0-3 (Basic/Intermediate/Advanced), so:
    // >0.3/week = rapid, 0.1-0.3 = standard, 0-0.1 = slow, 0 = stagnant, <0 = declining
    let classification: SkillsVelocity['classification'];
    if (velocity > 0.3) classification = 'rapid';
    else if (velocity > 0.1) classification = 'standard';
    else if (velocity > 0) classification = 'slow';
    else if (velocity === 0) classification = 'stagnant';
    else classification = 'declining';

    const dataPoints = sorted.filter(s => s.skills.some(sk => sk.skill_name === skill)).length;

    velocities.push({ skill_name: skill, velocity: Math.round(velocity * 100) / 100, classification, data_points: dataPoints });
  }

  return velocities;
}

// ============================================================
// GROWTH TRAJECTORY — full picture for one candidate
// ============================================================

export function buildGrowthTrajectory(
  candidateId: string,
  sessions: Array<{ session_id: string; date: string; tag: string; skills: SkillSnapshot[] }>,
): GrowthTrajectory {
  if (sessions.length < 2) {
    return {
      candidate_id: candidateId, sessions, deltas: [], velocity: [],
      overall_improvement: 0, top_improved: [], needs_attention: [],
      summary: 'Need at least 2 sessions to calculate growth.',
    };
  }

  const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const daysBetween = Math.max(1, (new Date(last.date).getTime() - new Date(first.date).getTime()) / (24 * 60 * 60 * 1000));

  const deltas = calculateDelta(first.skills, last.skills, daysBetween);
  const velocity = calculateVelocity(sorted);

  const improved = deltas.filter(d => d.direction === 'improved');
  const declined = deltas.filter(d => d.direction === 'declined');
  const stagnant = deltas.filter(d => d.direction === 'stable');

  const overallImprovement = deltas.length > 0
    ? deltas.reduce((sum, d) => sum + (d.direction === 'improved' ? d.magnitude : d.direction === 'declined' ? -d.magnitude : 0), 0) / deltas.length
    : 0;

  const topImproved = improved.sort((a, b) => b.magnitude - a.magnitude).slice(0, 3).map(d => d.skill_name);
  const needsAttention = [...declined.map(d => d.skill_name), ...stagnant.slice(0, 2).map(d => d.skill_name)];

  const summary = `${sorted.length} sessions over ${Math.round(daysBetween)} days. ${improved.length} skill(s) improved, ${stagnant.length} stable, ${declined.length} declined. ${
    topImproved.length > 0 ? `Strongest growth: ${topImproved.join(', ')}.` : ''
  } ${needsAttention.length > 0 ? `Needs attention: ${needsAttention.join(', ')}.` : 'All skills developing well.'}`;

  return {
    candidate_id: candidateId, sessions: sorted, deltas, velocity,
    overall_improvement: Math.round(overallImprovement * 100) / 100,
    top_improved: topImproved, needs_attention: needsAttention, summary,
  };
}

// ============================================================
// COHORT SUMMARY — aggregate across multiple candidates
// ============================================================

export function buildCohortSummary(
  cohortId: string,
  cohortName: string,
  trajectories: GrowthTrajectory[],
): CohortSummary {
  const candidateCount = trajectories.length;

  if (candidateCount === 0) {
    return {
      cohort_id: cohortId, cohort_name: cohortName, candidate_count: 0,
      avg_improvement: 0, skill_improvements: {}, top_movers: [], lagging_skills: [],
      summary: 'No candidates in this cohort yet.',
    };
  }

  // Aggregate skill improvements
  const skillAgg: Record<string, { deltas: number[]; improved: number; total: number }> = {};

  for (const traj of trajectories) {
    for (const delta of traj.deltas) {
      if (!skillAgg[delta.skill_name]) skillAgg[delta.skill_name] = { deltas: [], improved: 0, total: 0 };
      const signed = delta.direction === 'improved' ? delta.magnitude : delta.direction === 'declined' ? -delta.magnitude : 0;
      skillAgg[delta.skill_name].deltas.push(signed);
      skillAgg[delta.skill_name].total++;
      if (delta.direction === 'improved') skillAgg[delta.skill_name].improved++;
    }
  }

  const skillImprovements: CohortSummary['skill_improvements'] = {};
  for (const [skill, data] of Object.entries(skillAgg)) {
    skillImprovements[skill] = {
      avg_delta: Math.round((data.deltas.reduce((a, b) => a + b, 0) / data.deltas.length) * 100) / 100,
      improved_count: data.improved,
      total_count: data.total,
    };
  }

  const avgImprovement = trajectories.reduce((sum, t) => sum + t.overall_improvement, 0) / candidateCount;

  const topMovers = trajectories
    .sort((a, b) => b.overall_improvement - a.overall_improvement)
    .slice(0, 5)
    .map(t => ({ candidate_id: t.candidate_id, name: t.candidate_id, improvement: t.overall_improvement }));

  const laggingSkills = Object.entries(skillImprovements)
    .filter(([_, data]) => data.avg_delta <= 0)
    .map(([skill]) => skill);

  const summary = `${cohortName}: ${candidateCount} participants. Average improvement: ${avgImprovement.toFixed(2)} levels. ${
    Object.entries(skillImprovements).filter(([_, d]) => d.avg_delta > 0).length
  } skills showed improvement. ${laggingSkills.length > 0 ? `Lagging: ${laggingSkills.join(', ')}.` : 'All skills improving.'}`;

  return {
    cohort_id: cohortId, cohort_name: cohortName, candidate_count: candidateCount,
    avg_improvement: Math.round(avgImprovement * 100) / 100,
    skill_improvements: skillImprovements, top_movers: topMovers, lagging_skills: laggingSkills, summary,
  };
}
