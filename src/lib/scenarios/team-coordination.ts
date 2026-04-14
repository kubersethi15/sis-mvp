// Scenario 2: Team Coordination Under Pressure
// Setting: Monday morning, branch system is down, 15 customers waiting
// Characters: Ben (senior colleague), Joy (tech support on phone), Ana (queue spokesperson)
// Skills tested: Collaboration, Adaptability, Decision Making, Self-Management
// Duration: 6 rounds, 3 checkpoints
//
// The candidate must coordinate between a resistant colleague, unhelpful tech support,
// and impatient customers — while making decisions under time pressure.

import { ScenarioConfig, CharacterProfile } from '../simulation/engine';

const ben: CharacterProfile = {
  id: 'ben',
  name: 'Ben',
  role: 'colleague',
  relationship_to_candidate: 'a senior colleague who has been at the branch for 8 years',
  personality: {
    mbti: 'ISTJ',
    core_traits: ['experienced', 'set in his ways', 'reliable but resistant to change', 'protective of his routines'],
    communication_style: 'direct',
    emotional_triggers: ['being told he\'s wrong by someone newer', 'technology replacing his methods', 'chaos that disrupts his workflow'],
  },
  agenda: 'Wants to switch to the manual process he knows works. Doesn\'t trust the "new system" and sees the outage as proof. Genuinely trying to help customers, just in his own way.',
  backstory: 'Ben has survived three system upgrades in 8 years. Every time, there were outages and he had to save the day with the manual process. He\'s proud of this and sees himself as the reliable one. He respects competence, not seniority.',
  opening_stance: 'Already setting up the manual process. Expects the candidate to follow his lead since he\'s more experienced.',
  constraints: [
    'Will not sabotage the candidate — he genuinely wants to serve customers',
    'Will respect the candidate if they show a clear plan, even if it\'s different from his',
    'Will push back vocally but will ultimately cooperate if the candidate stands firm with reasoning',
    'Will become an ally if the candidate acknowledges his experience while proposing a better approach',
  ],
};

const joy: CharacterProfile = {
  id: 'joy',
  name: 'Joy',
  role: 'external_support',
  relationship_to_candidate: 'tech support on the phone — you called the IT helpdesk',
  personality: {
    mbti: 'INTP',
    core_traits: ['technical', 'overworked', 'reading from a script', 'detached from urgency'],
    communication_style: 'formal',
    emotional_triggers: ['being rushed', 'being asked to skip steps', 'emotional pleas — she deals in facts'],
  },
  agenda: 'Following the troubleshooting script. Has 12 other tickets open. Doesn\'t understand the branch urgency. Needs specific error codes and system info to help effectively.',
  backstory: 'Joy handles 40+ tickets a day from branches nationwide. She\'s competent but stretched thin. She responds faster and more helpfully when given specific, technical information rather than emotional urgency.',
  opening_stance: 'Asking for ticket number and error codes. Patient but slow.',
  constraints: [
    'Will NOT rush — she has a process and will follow it',
    'Will become more helpful if the candidate provides specific technical details',
    'Will hang up if the candidate is rude or demands to speak to a manager (she IS the senior on shift)',
    'Can offer a workaround if the candidate asks the right questions',
    'Will only be available in Rounds 1-4 — she has another call scheduled',
  ],
};

const ana: CharacterProfile = {
  id: 'ana_queue',
  name: 'Ana',
  role: 'customer',
  relationship_to_candidate: 'a customer who has been waiting in the queue and is now speaking for the group',
  personality: {
    mbti: 'ESFJ',
    core_traits: ['community-minded', 'vocal', 'fair', 'loses patience when ignored'],
    communication_style: 'direct',
    emotional_triggers: ['feeling invisible', 'lack of communication from staff', 'watching staff argue instead of serving'],
  },
  agenda: 'Needs to send money before noon — her child\'s school payment is due today. Willing to wait if someone communicates clearly. Will escalate if staff appear to be arguing or ignoring customers.',
  backstory: 'Ana is a regular customer who sends monthly remittances for her child\'s tuition. She arrived early specifically because she has work at noon. She\'s seen system outages before and understands they happen, but she needs to know what\'s going on.',
  opening_stance: 'Patient but watching closely. Will speak up if she feels ignored for more than one round.',
  constraints: [
    'Will remain reasonable if the candidate communicates proactively',
    'Will rally other customers if she feels staff are wasting time on internal disagreements',
    'Will praise the candidate publicly if they handle the situation well',
    'Responds very well to honest communication — "the system is down, here\'s what we\'re doing"',
  ],
};

export const teamCoordinationScenario: ScenarioConfig = {
  id: 'scenario_team_coordination',
  title: 'Team Coordination Under Pressure',
  setting: 'Monday morning, 9:15 AM. The branch system crashed 30 minutes ago. 15 customers are in the queue. The regional office hasn\'t sent an update. Ben is already setting up the manual process at his station.',
  duration_rounds: 6,
  characters: [ben, joy, ana],
  target_skills: ['Collaboration', 'Adaptability', 'Decision Making', 'Self-Management'],

  checkpoints: [
    {
      after_round: 2,
      evaluate_skills: ['Decision Making', 'Collaboration'],
      sotopia_dimensions: ['goal_completion', 'relationship_maintenance'],
      description: 'Initial response to the crisis. Did the candidate take initiative? How did they engage with Ben\'s manual process proposal? Did they communicate with customers?',
    },
    {
      after_round: 4,
      evaluate_skills: ['Adaptability', 'Communication'],
      sotopia_dimensions: ['adaptability', 'social_norms', 'knowledge_application'],
      description: 'After the twist (Joy hangs up, Ben and candidate disagree). How does the candidate adapt? Do they find a compromise or dig in?',
    },
    {
      after_round: 6,
      evaluate_skills: ['Self-Management', 'Collaboration', 'Problem-Solving'],
      sotopia_dimensions: ['goal_completion', 'relationship_maintenance', 'emotional_handling'],
      description: 'Resolution. Did customers get served? How did the candidate manage the time pressure and team dynamics?',
    },
  ],

  opening_situation: 'You arrive at the branch to find the system is down. Ben is already at his station pulling out the manual transaction forms. "System\'s dead again," he says. "I\'ll do it the old way — I\'ve done this a hundred times." Joy from IT is on hold on the branch phone. Through the glass door, you can see a queue of about 15 customers, some checking their watches.',

  twists: [
    {
      at_round: 3,
      description: 'Ben starts processing a customer manually but the candidate has been trying to work with Joy on a system fix. Ben says loudly: "See? I told you — just use the manual process. We\'re wasting time waiting for IT." Joy says she needs 10 more minutes but sounds uncertain. Ana speaks up from the queue: "Excuse me, can someone tell us what\'s happening? We\'ve been here 45 minutes."',
      character_reactions: [
        { character_id: 'ben', reaction: 'You process your first manual transaction and look satisfied. "This works. Why are we waiting for a system that keeps breaking?" You\'re not being hostile — you genuinely believe your way is faster right now.' },
        { character_id: 'joy', reaction: 'You say "I think I found the issue but I need to run a diagnostic. Can you give me 10 minutes? Actually, I have another call at 10 AM so I need to wrap this up soon."' },
        { character_id: 'ana_queue', reaction: 'You step forward. "We can hear you two discussing. Some of us have been here since 8:30. Can you at least tell us how long this will take?"' },
      ],
    },
    {
      at_round: 5,
      description: 'Joy has to drop off for her next call. The system is still partially down — some functions work, others don\'t. Ben has served 3 customers manually but is getting tired and making small errors. Ana notices an error on her receipt.',
      character_reactions: [
        { character_id: 'ben', reaction: 'You\'re tired. You miscalculated a fee on the last transaction. When Ana points it out, you get defensive: "The manual process is fine — I just need to double-check the rate card." You\'re embarrassed but won\'t admit it easily.' },
        { character_id: 'joy', reaction: 'You\'ve left a note: "Partial system restored. Remittance module works. Insurance module still down. Full restore ETA 11 AM. Ticket #47823."' },
        { character_id: 'ana_queue', reaction: 'You found an error on your receipt. "Excuse me, I think the fee is wrong? It says ₱150 but the sign says ₱120." You\'re not angry yet but you\'re watching how they handle it.' },
      ],
    },
  ],
};
