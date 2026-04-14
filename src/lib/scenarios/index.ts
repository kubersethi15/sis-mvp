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
export function selectScenarios(
  layer2Seeds: Array<{ skill_gap: string; suggested_scenario: string; rationale: string }>,
  maxScenarios: number = 2
): ScenarioConfig[] {
  if (!layer2Seeds?.length) {
    // Default: customer escalation + team coordination
    return [customerEscalationScenario, teamCoordinationScenario];
  }

  const selected: ScenarioConfig[] = [];
  const scenarioList = Object.values(SCENARIOS);

  // Match seeds to scenarios by target skills
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

  // Fill remaining slots with unselected scenarios
  if (selected.length < maxScenarios) {
    for (const s of scenarioList) {
      if (selected.length >= maxScenarios) break;
      if (!selected.includes(s)) selected.push(s);
    }
  }

  return selected;
}
