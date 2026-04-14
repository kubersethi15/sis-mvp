// Scenario Registry — all available Layer 2 simulation scenarios
// Add new scenarios here as they are created

export { customerEscalationScenario } from './customer-escalation';
export { teamCoordinationScenario } from './team-coordination';
export { onboardingScenario } from './onboarding';

import { customerEscalationScenario } from './customer-escalation';
import { teamCoordinationScenario } from './team-coordination';
import { onboardingScenario } from './onboarding';
import { ScenarioConfig } from '../simulation/engine';

// All scenarios indexed by ID for lookup
export const SCENARIOS: Record<string, ScenarioConfig> = {
  scenario_customer_escalation: customerEscalationScenario,
  scenario_team_coordination: teamCoordinationScenario,
  scenario_onboarding: onboardingScenario,
};

// Select scenarios based on layer2_seeds from LEEE extraction
// Priority: employer-specific generated scenarios > static scenarios
export function selectScenarios(
  layer2Seeds: Array<{ skill_gap: string; suggested_scenario: string; rationale: string }>,
  maxScenarios: number = 2,
  employerScenarios?: ScenarioConfig[] // Generated from employer intelligence pipeline
): ScenarioConfig[] {
  // If employer has generated scenarios, use those first
  if (employerScenarios?.length) {
    const selected = employerScenarios.slice(0, maxScenarios);
    // Fill remaining with static if needed
    if (selected.length < maxScenarios) {
      const staticList = Object.values(SCENARIOS);
      for (const s of staticList) {
        if (selected.length >= maxScenarios) break;
        selected.push(s);
      }
    }
    return selected;
  }

  // Fallback: match layer2_seeds to static scenarios
  if (!layer2Seeds?.length) {
    return [customerEscalationScenario, teamCoordinationScenario];
  }

  const selected: ScenarioConfig[] = [];
  const scenarioList = Object.values(SCENARIOS);

  for (const seed of layer2Seeds) {
    if (selected.length >= maxScenarios) break;

    const gap = seed.skill_gap?.toLowerCase() || '';
    const match = scenarioList.find(s =>
      !selected.includes(s) &&
      s.target_skills.some(skill => 
        gap.includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(gap.split('_').pop() || '')
      )
    );

    if (match) selected.push(match);
  }

  if (selected.length < maxScenarios) {
    for (const s of scenarioList) {
      if (selected.length >= maxScenarios) break;
      if (!selected.includes(s)) selected.push(s);
    }
  }

  return selected;
}
