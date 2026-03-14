import { Skill } from '@/types';

// PSF Enabling Skills - MVP Subset
// 4 Primary (COMPASS) + 4 Secondary
export const SKILLS_TAXONOMY: Skill[] = [
  // ===== PRIMARY (COMPASS DOMAINS) =====
  {
    id: 'SK1',
    name: 'Emotional Intelligence',
    psf_code: 'ESC-SRE-005 / ESC-IWO-006',
    psf_cluster: 'Staying Relevant / Interacting with Others',
    wef_cluster: 'Motivation & self-awareness; Resilience, flexibility & agility',
    compass_domain: 'Emotional Intelligence',
    priority: 'primary',
    description: 'Self-awareness, emotional regulation, empathy toward others, motivation in the face of difficulty.',
    basic_descriptor: 'Describes awareness of own emotions. Mentions feeling something and responding to it. Basic empathy.',
    intermediate_descriptor: 'Actively manages emotions to achieve outcomes. Deliberate emotional regulation. Adjusts behavior based on others\' perspectives.',
    advanced_descriptor: 'Creates conditions for others\' emotional wellbeing. Strategic use of emotional awareness. Deep self-reflection leading to sustained change.',
    extractability: 'high',
  },
  {
    id: 'SK2',
    name: 'Communication',
    psf_code: 'ESC-IWO-003',
    psf_cluster: 'Interacting with Others',
    wef_cluster: 'Speaking, writing & languages; Empathy & active listening',
    compass_domain: 'Communication',
    priority: 'primary',
    description: 'Clarity of expression, active listening, adapting message to audience, persuasion, explaining complex ideas.',
    basic_descriptor: 'Describes sharing information with others. Mentions asking or telling someone something. Basic listening.',
    intermediate_descriptor: 'Adapts communication style to audience. Active listening with follow-up. Persuading, explaining complex ideas simply, mediating.',
    advanced_descriptor: 'Designs communication strategies for groups. Influences through narrative. Creates environments where others communicate effectively.',
    extractability: 'high',
  },
  {
    id: 'SK3',
    name: 'Collaboration',
    psf_code: 'ESC-IWO-002',
    psf_cluster: 'Interacting with Others',
    wef_cluster: 'Empathy & active listening; Leadership & social influence',
    compass_domain: 'Collaboration',
    priority: 'primary',
    description: 'Working with others, shared goal orientation, conflict resolution, trust-building, team coordination.',
    basic_descriptor: 'Describes working alongside others. Mentions helping or being helped. Follows group decisions.',
    intermediate_descriptor: 'Coordinates with others independently. Resolves disagreements. Builds trust. Adapts own role for team success.',
    advanced_descriptor: 'Builds and leads teams. Creates collaborative structures. Manages complex stakeholder dynamics. Mentors others in teamwork.',
    extractability: 'high',
  },
  {
    id: 'SK4',
    name: 'Problem-Solving',
    psf_code: 'ESC-TCR-003 / ESC-TCR-001 / ESC-TCR-002',
    psf_cluster: 'Thinking Critically',
    wef_cluster: 'Creative thinking; Analytical thinking; Systems thinking',
    compass_domain: 'Problem-Solving',
    priority: 'primary',
    description: 'Identifying problems, generating solutions, resourcefulness under constraints, decision-making under uncertainty.',
    basic_descriptor: 'Identifies a problem and attempts a solution. Follows known methods. Asks for help when stuck.',
    intermediate_descriptor: 'Analyzes problems independently. Generates multiple options. Makes decisions under uncertainty. Adapts when first approach fails.',
    advanced_descriptor: 'Solves systemic problems. Creates new approaches. Anticipates problems before they occur. Teaches problem-solving to others.',
    extractability: 'high',
  },
  // ===== SECONDARY (CAPTURED OPPORTUNISTICALLY) =====
  {
    id: 'SK5',
    name: 'Adaptability / Resilience',
    psf_code: 'ESC-SRE-001',
    psf_cluster: 'Staying Relevant',
    wef_cluster: 'Resilience, flexibility & agility',
    compass_domain: undefined,
    priority: 'secondary',
    description: 'Adjusting to sudden change, bouncing back from setbacks, maintaining effectiveness under pressure.',
    basic_descriptor: 'Describes adjusting to a change with support. Recovers from a setback in familiar context.',
    intermediate_descriptor: 'Adapts independently to unfamiliar situations. Bounces back from significant setbacks. Maintains performance under pressure.',
    advanced_descriptor: 'Thrives in ambiguity. Leads others through change. Creates adaptive systems. Transforms setbacks into opportunities.',
    extractability: 'high',
  },
  {
    id: 'SK6',
    name: 'Learning Agility',
    psf_code: 'ESC-SRE-004',
    psf_cluster: 'Staying Relevant',
    wef_cluster: 'Curiosity & lifelong learning',
    compass_domain: undefined,
    priority: 'secondary',
    description: 'Picking up new skills quickly, learning from mistakes, teaching others, curiosity.',
    basic_descriptor: 'Describes learning something new with guidance. Mentions following instructions to acquire a skill.',
    intermediate_descriptor: 'Learns independently and quickly. Applies lessons from one context to another. Teaches others what they learned.',
    advanced_descriptor: 'Creates learning frameworks. Systematically reflects and improves. Builds learning culture for groups.',
    extractability: 'moderate',
  },
  {
    id: 'SK7',
    name: 'Sense Making',
    psf_code: 'ESC-TCR-004',
    psf_cluster: 'Thinking Critically',
    wef_cluster: 'Analytical thinking',
    compass_domain: undefined,
    priority: 'secondary',
    description: 'Making sense of complex or ambiguous information, seeing patterns, understanding systems.',
    basic_descriptor: 'Organizes and interprets information to identify relationships.',
    intermediate_descriptor: 'Analyzes data to uncover patterns and opportunities in unfamiliar contexts.',
    advanced_descriptor: 'Evaluates patterns and trends to generate wider insights. Creates frameworks for others to make sense of complexity.',
    extractability: 'moderate',
  },
  {
    id: 'SK8',
    name: 'Building Inclusivity',
    psf_code: 'ESC-IWO-001',
    psf_cluster: 'Interacting with Others',
    wef_cluster: 'Empathy & active listening',
    compass_domain: undefined,
    priority: 'secondary',
    description: 'Including marginalized perspectives, accommodating differences, creating equitable environments.',
    basic_descriptor: 'Acknowledges differences. Follows inclusive practices when guided.',
    intermediate_descriptor: 'Actively includes diverse perspectives. Adapts approaches to accommodate different needs.',
    advanced_descriptor: 'Designs inclusive systems. Advocates for marginalized groups. Creates equitable environments proactively.',
    extractability: 'moderate',
  },
];

export function getSkillById(id: string): Skill | undefined {
  return SKILLS_TAXONOMY.find(s => s.id === id);
}

export function getPrimarySkills(): Skill[] {
  return SKILLS_TAXONOMY.filter(s => s.priority === 'primary');
}

export function getSecondarySkills(): Skill[] {
  return SKILLS_TAXONOMY.filter(s => s.priority === 'secondary');
}
