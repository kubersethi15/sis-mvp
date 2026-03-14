// Question Bank V1 - Structured data from Ryan's 98-prompt trilingual bank
// Each prompt has: id, stage, probe_type, english, filipino, taglish, 
//   use_when, avoid_when, follow_up, psf_signals, l2_seed_value, 
//   scoring_readiness, sensitivity, accessibility_codes

export interface QuestionBankEntry {
  id: string;
  stage: 'opening' | 'story_select' | 'elicitation' | 'core_probe' | 'skill_probe' | 'verification' | 'accessibility' | 'micro_story' | 'closing';
  probe_type: string; // F, S, E, C, A, D, O, M, R, X, V, G, Y
  en: string;
  fil: string;
  taglish: string;
  use_when: string;
  avoid_when: string;
  follow_up: string;
  psf_signals: string[];
  l2_seed: 'low' | 'medium' | 'high';
  scoring_readiness: 'W' | 'M' | 'S' | 'DS'; // Weak, Moderate, Strong, Discriminating Strong
  sensitivity: 'low' | 'medium' | 'guarded';
  accessibility: string[]; // LL, ND, DH, IC, TS
}

// Core opening prompts
const OPENING: QuestionBankEntry[] = [
  {
    id: 'F01', stage: 'opening', probe_type: 'F',
    en: "We'll talk about real experiences from your life, work, school, or community. You may skip any question.",
    fil: 'Pag-uusapan natin ang totoong karanasan mula sa buhay, trabaho, pag-aaral, o komunidad mo. Maaari kang lumaktaw sa anumang tanong.',
    taglish: 'Pag-uusapan natin ang totoong experience mo. Puwede kang mag-skip sa kahit anong tanong.',
    use_when: 'Always at start', avoid_when: 'Do not use after rapport is already established',
    follow_up: 'Then offer simple 3-step structure',
    psf_signals: ['Trust', 'Self-management'], l2_seed: 'low', scoring_readiness: 'W', sensitivity: 'low', accessibility: ['LL', 'ND', 'DH', 'TS']
  },
  {
    id: 'F02', stage: 'opening', probe_type: 'F',
    en: "We'll do this in three parts: choose a story, talk through what happened, then reflect on what you learned.",
    fil: 'Gagawin natin ito sa tatlong bahagi: pipili ng kuwento, pag-uusapan ang nangyari, tapos babalikan ang natutuhan mo.',
    taglish: 'Tatlong parts lang ito: pili ng story, usap sa nangyari, tapos lesson learned.',
    use_when: 'Use for predictability', avoid_when: 'Avoid if user prefers minimal instructions',
    follow_up: 'Then ask story menu',
    psf_signals: ['Trust', 'Learning agility'], l2_seed: 'low', scoring_readiness: 'W', sensitivity: 'low', accessibility: ['ND', 'LL']
  },
  {
    id: 'F03', stage: 'opening', probe_type: 'F',
    en: 'Non-work stories count too, including family, disability navigation, school, side jobs, and community work.',
    fil: 'Kasama rin ang mga kuwentong hindi pormal na trabaho, tulad ng pamilya, pagharap sa disability barriers, pag-aaral, sideline, at gawaing pangkomunidad.',
    taglish: 'Count din ang non-work stories—family, disability barriers, school, sideline, o community.',
    use_when: 'Use for RPL normalization', avoid_when: 'None',
    follow_up: 'Then present domain options',
    psf_signals: ['Adaptability', 'Empathy', 'Collaboration'], l2_seed: 'low', scoring_readiness: 'W', sensitivity: 'low', accessibility: ['TS', 'LL']
  },
  {
    id: 'F04', stage: 'opening', probe_type: 'F',
    en: 'There are no right or wrong answers. I am interested in what happened, what you did, and what you learned.',
    fil: 'Walang tama o maling sagot. Interesado ako sa nangyari, ginawa mo, at natutuhan mo.',
    taglish: 'Walang right or wrong. Importante kung ano ang nangyari, ginawa mo, at natutuhan mo.',
    use_when: 'Always at start', avoid_when: 'Avoid if user is impatient—shorten',
    follow_up: 'Then ask selection prompt',
    psf_signals: ['Trust', 'Reflection'], l2_seed: 'low', scoring_readiness: 'W', sensitivity: 'low', accessibility: ['LL', 'DH']
  },
  {
    id: 'F09', stage: 'opening', probe_type: 'F',
    en: 'You can answer in English, Filipino, or a mix of both.',
    fil: 'Maaari kang sumagot sa English, Filipino, o halo ng dalawa.',
    taglish: 'Puwede kang mag-English, Filipino, o Taglish.',
    use_when: 'Always in PH deployment', avoid_when: 'None',
    follow_up: 'Then mirror user language',
    psf_signals: ['Communication'], l2_seed: 'low', scoring_readiness: 'W', sensitivity: 'low', accessibility: ['DH']
  },
];

// Story selection prompts
const STORY_SELECT: QuestionBankEntry[] = [
  {
    id: 'S11', stage: 'story_select', probe_type: 'S',
    en: 'Which would you like to start with: solving a problem, helping someone, facing a barrier, improving something, or a school/community/sideline experience?',
    fil: 'Saan mo gustong magsimula: paglutas ng problema, pagtulong sa iba, pagharap sa hadlang, pagpapabuti ng isang bagay, o karanasan sa school/komunidad/sideline?',
    taglish: 'Saan ka gustong magsimula: problem-solving, helping someone, facing a barrier, improving something, o school/community/sideline?',
    use_when: 'Default first menu', avoid_when: 'Avoid more than 5 choices',
    follow_up: 'Then ask specific-time prompt',
    psf_signals: ['Coverage across all'], l2_seed: 'medium', scoring_readiness: 'W', sensitivity: 'low', accessibility: ['LL', 'ND']
  },
  {
    id: 'S13', stage: 'story_select', probe_type: 'S',
    en: 'Tell me about a time you had to keep going even when something made the situation harder.',
    fil: 'Magkuwento ka tungkol sa panahong kinailangan mong magpatuloy kahit may bagay na nagpapahirap sa sitwasyon.',
    taglish: 'Kuwento ka ng time na kinailangan mong magpatuloy kahit mas naging mahirap ang sitwasyon.',
    use_when: 'Use to surface resilience/adaptability', avoid_when: 'Avoid if user is already in distress',
    follow_up: 'Then ask what happened first',
    psf_signals: ['Adaptability', 'Self-management'], l2_seed: 'high', scoring_readiness: 'M', sensitivity: 'medium', accessibility: ['TS']
  },
  {
    id: 'S14', stage: 'story_select', probe_type: 'S',
    en: 'Tell me about a time you helped people move forward even when they did not agree at first.',
    fil: 'Magkuwento ka tungkol sa panahong tinulungan mong umusad ang mga tao kahit hindi sila agad nagkaisa.',
    taglish: 'Kuwento ka ng time na natulungan mong umusad ang mga tao kahit hindi agad sila magkasundo.',
    use_when: 'Use to surface collaboration/influence', avoid_when: 'Avoid if user has no interpersonal context',
    follow_up: 'Then ask who was involved',
    psf_signals: ['Collaboration', 'Influence'], l2_seed: 'high', scoring_readiness: 'M', sensitivity: 'low', accessibility: []
  },
  {
    id: 'S16', stage: 'story_select', probe_type: 'S',
    en: 'Tell me about a time you had to learn something quickly to finish a task or help someone.',
    fil: 'Magkuwento ka tungkol sa panahong kinailangan mong matuto nang mabilis para matapos ang gawain o makatulong sa iba.',
    taglish: 'Kuwento ka ng time na kailangan mong matuto agad para matapos ang task o makatulong.',
    use_when: 'Use when learning agility or digital fluency is weakly observed', avoid_when: 'Avoid if user is fatigued early',
    follow_up: 'Then ask what was unfamiliar',
    psf_signals: ['Learning agility', 'Digital fluency'], l2_seed: 'high', scoring_readiness: 'M', sensitivity: 'low', accessibility: []
  },
  {
    id: 'S19', stage: 'story_select', probe_type: 'S',
    en: 'Would you like your next story to be more about people, more about solving something, or more about adapting to a barrier?',
    fil: 'Gusto mo bang ang susunod na kuwento ay mas tungkol sa mga tao, paglutas ng isang bagay, o pag-angkop sa hadlang?',
    taglish: 'Gusto mo bang next story ay tungkol sa people, solving something, o adapting to a barrier?',
    use_when: 'Use for Story 2 and Story 3 contrast', avoid_when: 'Avoid for first story',
    follow_up: 'Then choose contrasting track',
    psf_signals: ['Coverage balancing'], l2_seed: 'medium', scoring_readiness: 'W', sensitivity: 'low', accessibility: ['ND']
  },
];

// Core action/decision/outcome probes (subset — most critical ones)
const CORE_PROBES: QuestionBankEntry[] = [
  {
    id: 'E21', stage: 'elicitation', probe_type: 'E',
    en: 'Please tell me about one specific time that happened. Start from the beginning.',
    fil: 'Pakikwento ang isang tiyak na pagkakataon na nangyari iyon. Magsimula ka sa simula.',
    taglish: 'Pakikwento ang isang specific na time na nangyari iyon. Simula ka sa umpisa.',
    use_when: 'Default elicitation', avoid_when: 'Avoid if user is already in a specific episode',
    follow_up: 'Then let user speak uninterrupted',
    psf_signals: ['All story-ready signals'], l2_seed: 'medium', scoring_readiness: 'M', sensitivity: 'low', accessibility: ['LL']
  },
  {
    id: 'E28', stage: 'elicitation', probe_type: 'E',
    en: 'Take me to the exact moment when you realized you had to do something.',
    fil: 'Dalhin mo ako sa eksaktong sandali na naisip mong kailangan mong kumilos.',
    taglish: 'Dalhin mo ako sa exact moment na na-realize mong kailangan mong gumawa ng bagay.',
    use_when: 'Use to find turning point', avoid_when: 'Avoid if story is already tightly scoped',
    follow_up: 'Then ask first action or decision',
    psf_signals: ['Decision making', 'Emotional intelligence'], l2_seed: 'high', scoring_readiness: 'S', sensitivity: 'low', accessibility: []
  },
  {
    id: 'P31', stage: 'core_probe', probe_type: 'A',
    en: 'What did you do first?', fil: 'Ano ang una mong ginawa?', taglish: 'Ano ang una mong ginawa?',
    use_when: 'Ask after context', avoid_when: 'Avoid if action already clear',
    follow_up: 'Then ask next action',
    psf_signals: ['Problem solving', 'Self-management'], l2_seed: 'high', scoring_readiness: 'S', sensitivity: 'low', accessibility: ['LL']
  },
  {
    id: 'P35', stage: 'core_probe', probe_type: 'D',
    en: 'What options were you considering?', fil: 'Anu-ano ang mga pagpipilian mong iniisip noon?', taglish: 'Anong options ang iniisip mo noon?',
    use_when: 'Use to surface decision points', avoid_when: 'Avoid if there was clearly no real choice',
    follow_up: 'Then ask why chosen path',
    psf_signals: ['Decision making'], l2_seed: 'high', scoring_readiness: 'DS', sensitivity: 'low', accessibility: []
  },
  {
    id: 'P41', stage: 'core_probe', probe_type: 'O',
    en: 'What happened because of what you did?', fil: 'Ano ang nangyari dahil sa ginawa mo?', taglish: 'Ano ang nangyari dahil sa ginawa mo?',
    use_when: 'Use to tie action to outcome', avoid_when: 'Avoid if outcome already fully clear',
    follow_up: 'Then ask effect on others',
    psf_signals: ['Outcome clarity'], l2_seed: 'high', scoring_readiness: 'S', sensitivity: 'low', accessibility: ['LL']
  },
  {
    id: 'P43', stage: 'core_probe', probe_type: 'M',
    en: 'How were you feeling at that point?', fil: 'Ano ang nararamdaman mo noon?', taglish: 'Ano ang nararamdaman mo noon?',
    use_when: 'Use after concrete action is established', avoid_when: 'Avoid leading with emotion',
    follow_up: 'Then ask regulation',
    psf_signals: ['Emotional intelligence'], l2_seed: 'medium', scoring_readiness: 'M', sensitivity: 'medium', accessibility: ['TS']
  },
  {
    id: 'P47', stage: 'core_probe', probe_type: 'R',
    en: 'What did you learn from that experience?', fil: 'Ano ang natutuhan mo mula sa karanasang iyon?', taglish: 'Ano ang natutuhan mo mula sa experience na iyon?',
    use_when: 'Use near end of each story', avoid_when: 'Avoid if story still lacks action/outcome',
    follow_up: 'Then ask transfer',
    psf_signals: ['Learning agility'], l2_seed: 'high', scoring_readiness: 'M', sensitivity: 'low', accessibility: ['LL']
  },
];

// Verification probes
const VERIFICATION: QuestionBankEntry[] = [
  {
    id: 'V80', stage: 'verification', probe_type: 'V',
    en: 'What detail would someone else who was there probably remember too?',
    fil: 'Anong detalye ang malamang na matatandaan din ng ibang naroon?',
    taglish: 'Anong detail ang malamang na matatandaan din ng ibang tao roon?',
    use_when: 'Use to test specificity', avoid_when: 'Avoid if user is anxious about being judged',
    follow_up: 'Then ask one sensory or factual detail',
    psf_signals: ['Specificity'], l2_seed: 'medium', scoring_readiness: 'DS', sensitivity: 'medium', accessibility: ['TS']
  },
  {
    id: 'V82', stage: 'verification', probe_type: 'V',
    en: 'What did you not manage to do, even though you wanted to?',
    fil: 'Ano ang hindi mo nagawa kahit gusto mo?', taglish: 'Ano ang hindi mo nagawa kahit gusto mo?',
    use_when: 'Use to reduce polished self-presentation', avoid_when: 'Avoid if user is fragile/self-critical',
    follow_up: 'Then ask adjustment or learning',
    psf_signals: ['Reflection', 'Learning agility'], l2_seed: 'medium', scoring_readiness: 'DS', sensitivity: 'medium', accessibility: ['TS']
  },
  {
    id: 'V83', stage: 'verification', probe_type: 'V',
    en: 'Was there anything messy, imperfect, or unfinished about how this turned out?',
    fil: 'Mayroon bang bahaging magulo, hindi perpekto, o hindi natapos sa kinalabasan nito?',
    taglish: 'May part bang messy, imperfect, o unfinished sa naging resulta?',
    use_when: 'Use for anti-gaming realism', avoid_when: 'Avoid if user is distressed',
    follow_up: 'Then ask what was learned',
    psf_signals: ['Learning agility', 'Problem solving'], l2_seed: 'medium', scoring_readiness: 'DS', sensitivity: 'medium', accessibility: ['TS']
  },
];

// Micro-story prompts
const MICRO_STORY: QuestionBankEntry[] = [
  {
    id: 'Y89', stage: 'micro_story', probe_type: 'Y',
    en: "I'd like one short story now—just 3 to 5 lines—about using something unfamiliar.",
    fil: 'Gusto ko naman ng isang maikling kuwento—3 hanggang 5 linya—tungkol sa paggamit ng hindi pamilyar.',
    taglish: 'Gusto ko ng isang maikling story—3 to 5 lines—tungkol sa paggamit ng hindi pamilyar.',
    use_when: 'Use Story 3 for digital/learning gaps', avoid_when: 'Avoid if evidence already sufficient and fatigue present',
    follow_up: 'Then ask what was unfamiliar',
    psf_signals: ['Learning agility', 'Digital fluency'], l2_seed: 'high', scoring_readiness: 'M', sensitivity: 'low', accessibility: ['LL']
  },
  {
    id: 'Y91', stage: 'micro_story', probe_type: 'Y',
    en: 'Give me one short example of dealing with a customer, client, beneficiary, or person who needed help.',
    fil: 'Magbigay ka ng isang maikling halimbawa ng pakikitungo sa customer, kliyente, benepisyaryo, o taong nangangailangan ng tulong.',
    taglish: 'Magbigay ka ng isang maikling example ng pakikitungo sa customer, client, beneficiary, o taong nangangailangan ng tulong.',
    use_when: 'Use Story 3 for customer orientation', avoid_when: 'Avoid if no service context exists',
    follow_up: 'Then ask how need was understood',
    psf_signals: ['Customer orientation', 'Empathy'], l2_seed: 'medium', scoring_readiness: 'M', sensitivity: 'low', accessibility: ['LL']
  },
];

// Closing prompts
const CLOSING: QuestionBankEntry[] = [
  {
    id: 'C94', stage: 'closing', probe_type: 'R',
    en: 'Is there one detail about how you handled these situations that we have not talked about yet?',
    fil: 'May isang detalye pa ba tungkol sa kung paano mo hinarap ang mga sitwasyong ito na hindi pa natin napag-usapan?',
    taglish: 'May isang detail pa ba tungkol sa paano mo hinarap ang mga sitwasyong ito na hindi pa natin napag-usapan?',
    use_when: 'Use before closing', avoid_when: 'Avoid if user clearly wants to stop',
    follow_up: 'Then capture final evidence',
    psf_signals: ['Any missing skill'], l2_seed: 'low', scoring_readiness: 'M', sensitivity: 'low', accessibility: []
  },
  {
    id: 'C98', stage: 'closing', probe_type: 'F',
    en: 'Thank you for sharing. Your stories help us understand real actions, decisions, and learning from lived experience.',
    fil: 'Salamat sa pagbabahagi. Ang mga kuwento mo ay tumutulong sa amin na maunawaan ang totoong kilos, pasya, at pagkatuto mula sa lived experience.',
    taglish: 'Salamat sa pagbabahagi. Tinutulungan kami ng mga story mo na maintindihan ang totoong actions, decisions, at learning mula sa lived experience.',
    use_when: 'Final close', avoid_when: 'None',
    follow_up: 'End session',
    psf_signals: ['Trust'], l2_seed: 'low', scoring_readiness: 'W', sensitivity: 'low', accessibility: ['DH', 'TS']
  },
];

// ============================================================
// COMBINED BANK & HELPERS
// ============================================================

export const QUESTION_BANK: QuestionBankEntry[] = [
  ...OPENING,
  ...STORY_SELECT,
  ...CORE_PROBES,
  ...VERIFICATION,
  ...MICRO_STORY,
  ...CLOSING,
];

export function getPromptById(id: string): QuestionBankEntry | undefined {
  return QUESTION_BANK.find(q => q.id === id);
}

export function getPromptsByStage(stage: string): QuestionBankEntry[] {
  return QUESTION_BANK.filter(q => q.stage === stage);
}

export function getPromptsForSkillGap(skill: string): QuestionBankEntry[] {
  return QUESTION_BANK.filter(q =>
    q.psf_signals.some(s => s.toLowerCase().includes(skill.toLowerCase()))
  );
}

export function getPromptText(id: string, language: 'en' | 'fil' | 'taglish' = 'en'): string {
  const prompt = getPromptById(id);
  if (!prompt) return '';
  switch (language) {
    case 'fil': return prompt.fil;
    case 'taglish': return prompt.taglish;
    default: return prompt.en;
  }
}

// Skill-to-Prompt index (from Ryan's Question Bank)
export const SKILL_PROMPT_INDEX: Record<string, string[]> = {
  'Communication': ['P33', 'P34', 'X59', 'X66', 'C95'],
  'Collaboration': ['S14', 'P53', 'P54', 'X67', 'X65'],
  'Emotional Intelligence': ['P43', 'P44', 'X60', 'X74', 'P50'],
  'Problem Solving': ['S13', 'P38', 'P40', 'X64', 'X71'],
  'Adaptability': ['S13', 'S15', 'P39', 'P40', 'X60', 'X76', 'Y92'],
  'Empathy / Influence': ['P52', 'P53', 'X61', 'X65', 'X66', 'X68', 'X72'],
  'Creative Thinking': ['P40', 'P58', 'X73'],
  'Decision Making': ['P35', 'P36', 'P45', 'X62', 'X63', 'Y93'],
  'Learning Agility': ['S16', 'P47', 'P49', 'P56', 'X69', 'V84', 'Y89'],
  'Digital Fluency': ['S16', 'P55', 'P56', 'Y89'],
  'Customer Orientation': ['P37', 'P51', 'P52', 'X71', 'X72', 'X75', 'Y91'],
  'Developing People': ['S17', 'P57', 'X70', 'Y90'],
  'Self-management': ['F10', 'P31', 'P44', 'X63', 'X74', 'C95'],
  'Inclusion': ['S15', 'X65', 'X72', 'Y92'],
};
