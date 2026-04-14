// Scenario 1: Customer Escalation
// Setting: Branch counter, end of day
// Characters: Carlos (angry customer), Ana (new colleague), Maria (supervisor on call)
// Skills tested: Communication, Emotional Intelligence, Problem-Solving, Customer Service
// Duration: 6 rounds, 3 checkpoints
//
// This is a structured scenario config (not Ink format — we define the structure
// programmatically and use Claude for dynamic dialogue within each round)

import { ScenarioConfig, CharacterProfile } from '../simulation/engine';

const carlos: CharacterProfile = {
  id: 'carlos',
  name: 'Carlos',
  role: 'customer',
  relationship_to_candidate: 'a frustrated customer at the counter',
  personality: {
    mbti: 'ESTJ',
    core_traits: ['impatient', 'direct', 'family-oriented', 'feels disrespected when ignored'],
    communication_style: 'direct',
    emotional_triggers: ['feeling dismissed', 'being told to wait', 'no one taking responsibility'],
  },
  agenda: 'Get the double-charged remittance reversed immediately. He sent money to his mother in the province and she needs it today.',
  backstory: 'Carlos works as a delivery rider. He sent ₱3,000 to his mother via remittance this morning but was charged twice — ₱6,000 taken from his account. That\'s two days of earnings. He\'s been waiting 20 minutes already. He\'s tired from a long shift and worried his mother won\'t receive the money.',
  opening_stance: 'Frustrated but not yet hostile. Willing to be patient if someone shows they care. Will escalate if dismissed.',
  constraints: [
    'Will not become physically threatening',
    'Will calm down if shown genuine concern and a concrete plan',
    'Will not leave without resolution — this is real money he cannot afford to lose',
    'Responds well to being called "sir" and having his situation acknowledged'
  ],
};

const ana: CharacterProfile = {
  id: 'ana',
  name: 'Ana',
  role: 'colleague',
  relationship_to_candidate: 'a new colleague who started last week',
  personality: {
    mbti: 'ISFJ',
    core_traits: ['eager to help', 'nervous', 'deferential', 'quick to panic'],
    communication_style: 'indirect',
    emotional_triggers: ['being put on the spot', 'conflict between people', 'making mistakes in front of customers'],
  },
  agenda: 'Wants to help but is terrified of making a mistake. Looking to the candidate for guidance since Maria is unavailable.',
  backstory: 'Ana is on her second week. She\'s still learning the system and doesn\'t fully understand the remittance reversal process. She wants to make a good impression but is overwhelmed by the angry customer.',
  opening_stance: 'Anxious and looking to the candidate for leadership. Will follow the candidate\'s lead.',
  constraints: [
    'Will not confidently handle the situation alone — she genuinely doesn\'t know the process yet',
    'Will accidentally give wrong information if she tries to help without guidance',
    'Will NOT undermine the candidate — she\'s looking for someone to follow',
    'Responds well to clear, calm instructions'
  ],
};

const maria: CharacterProfile = {
  id: 'maria',
  name: 'Maria',
  role: 'manager',
  relationship_to_candidate: 'your branch supervisor',
  personality: {
    mbti: 'ENTJ',
    core_traits: ['competent', 'busy', 'trusts her team', 'expects initiative'],
    communication_style: 'formal',
    emotional_triggers: ['being interrupted for things the team should handle', 'excuses without solutions'],
  },
  agenda: 'Is on an important call with regional office. Expects the team to handle routine customer issues. Will help if truly needed but wants to see initiative first.',
  backstory: 'Maria has been branch supervisor for 3 years. She\'s on a call about the new system rollout. She trusts her team to handle the counter. She\'ll be disappointed if someone interrupts her for something they should be able to resolve.',
  opening_stance: 'Unavailable — on a call in the back office. Can be reached if truly necessary.',
  constraints: [
    'Will NOT come out to the counter in the first 3 rounds — she\'s genuinely busy',
    'Will respond via text/message if the candidate reaches out',
    'Will be supportive if the candidate shows they tried to handle it first',
    'Will be frustrated if the candidate immediately escalates without trying'
  ],
};

export const customerEscalationScenario: ScenarioConfig = {
  id: 'scenario_customer_escalation',
  title: 'Customer Escalation',
  setting: 'Branch counter, 4:30 PM on a Friday. The branch closes at 5:00 PM. Three other customers are waiting in line. The system is running slowly today.',
  duration_rounds: 6,
  characters: [carlos, ana, maria],
  target_skills: ['Communication', 'Emotional Intelligence', 'Problem-Solving', 'Customer Service'],
  
  checkpoints: [
    {
      after_round: 2,
      evaluate_skills: ['Communication', 'Emotional Intelligence'],
      sotopia_dimensions: ['emotional_handling', 'relationship_maintenance'],
      description: 'Initial response to frustrated customer. How does the candidate acknowledge Carlos\'s concern and manage the emotional temperature?',
    },
    {
      after_round: 4,
      evaluate_skills: ['Problem-Solving', 'Adaptability'],
      sotopia_dimensions: ['goal_completion', 'adaptability', 'social_norms'],
      description: 'After the twist (Ana gives wrong info, Carlos escalates). How does the candidate recover, correct the mistake, and keep things moving?',
    },
    {
      after_round: 6,
      evaluate_skills: ['Customer Service', 'Collaboration', 'Self-Management'],
      sotopia_dimensions: ['goal_completion', 'relationship_maintenance', 'knowledge_application'],
      description: 'Resolution. Did the candidate resolve Carlos\'s issue? How did they manage Ana and the other waiting customers?',
    },
  ],

  opening_situation: 'You\'re at the counter finishing up a transaction when Carlos approaches, clearly frustrated. He\'s been waiting 20 minutes. He says he was charged twice for a remittance — ₱6,000 instead of ₱3,000. Ana is next to you, looking nervous. Maria is in the back office on a call.',

  twists: [
    {
      at_round: 3,
      description: 'Ana tries to help Carlos but gives him wrong information — she tells him reversals take 5 business days. This is incorrect; reversals for double-charges can be processed same-day with supervisor approval. Carlos gets more upset.',
      character_reactions: [
        { character_id: 'carlos', reaction: 'You become more agitated. "Five days?! I can\'t wait five days! My mother needs that money TODAY!" You start talking about posting on social media.' },
        { character_id: 'ana', reaction: 'You realize you might have said the wrong thing. You look panicked and whisper to the candidate "Did I say something wrong? I\'m sorry, I thought that was right..."' },
        { character_id: 'maria', reaction: 'You\'re still on your call but you can hear raised voices from the counter. You\'re wondering if you need to step in.' },
      ],
    },
    {
      at_round: 5,
      description: 'Another customer in the queue speaks up: "Excuse me, the branch closes in 15 minutes and I\'ve been waiting too. Can someone help me?" The candidate now has to balance Carlos, Ana, the other customer, and the closing time.',
      character_reactions: [
        { character_id: 'carlos', reaction: 'You feel like your problem is being dismissed again. "I was here first! Don\'t skip my problem!"' },
        { character_id: 'ana', reaction: 'You offer to help the other customer if the candidate tells you what to do. "I can take the next person if you show me what to do?"' },
        { character_id: 'maria', reaction: 'Your call is ending. You\'ll be available in the next round if someone reaches out.' },
      ],
    },
  ],
};
