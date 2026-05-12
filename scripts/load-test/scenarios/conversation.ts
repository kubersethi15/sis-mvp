/**
 * Scripted user responses for the load test.
 *
 * Aya's conversation has dynamic phases. We can't predict her exact questions,
 * but we can supply a sequence of substantive responses that work regardless
 * of phrasing — each contains a STAR+E+R-shaped story.
 *
 * Two scripts available:
 *   - BPO_SCRIPT: customer service / BPO domain (matches the built-in sample)
 *   - CARE_SCRIPT: care-worker / family-caregiver domain
 *
 * Pick randomly per test user so the load isn't all-identical traffic.
 */

export interface ConversationScript {
  name: string;
  domain: string;
  responses: string[];
}

export const BPO_SCRIPT: ConversationScript = {
  name: 'bpo-cebu',
  domain: 'customer service',
  responses: [
    // Opening — first story setup
    "Sure. Last year I was team lead at a small BPO in Cebu. We had a big client presentation, and two days before, our main presenter Ate Grace got sick — wala siyang notice, biglang absent.",

    // Action of first story
    "Ako na nag-step up. I called an emergency team meeting — six of us — and explained the situation. I didn't panic in front of them kasi alam ko matatakot sila kung nakita nila na nataranta din ako. I redistributed Ate Grace's sections — each person took a piece.",

    // Detail on a specific person
    "Si Jun, medyo nag-hesitate. He said hindi siya kumpiyansa sa technical parts. So I sat with him for two hours that evening — after shift — and walked him through his section. I made him practice in front of me three times until he felt okay.",

    // Why individual check-in
    "Alam ko yung feeling — sometimes sa group meeting, hindi mo sasabihin na hindi mo gets kasi nakakahiya. So I wanted to give them a safe space. I also noticed earlier that si Maris was very quiet. So I went to her specifically.",

    // Result
    "The client gave positive feedback. They said the team seemed well-prepared and confident. The client extended the contract. Pero for me, the best part was after — si Jun came to me and said salamat, na he never thought he could present technical stuff pero ngayon kaya na niya.",

    // Reflection
    "Siguro I would have started a contingency plan earlier — like a backup presenter protocol. I learned na you can't assume the key person will always be there. Now in my new role, I always make sure at least two people deeply understand every critical deliverable.",

    // Second story — different situation
    "Yes. About six months ago, our payment system started double-charging some customers — we found out only when complaints started coming in. The IT team said it was a database issue but they couldn't fix it for three days. I had 40 angry customers calling.",

    // Action of second story
    "First I made a list of who was affected — pulled the transaction logs. Then I categorized them: who got charged twice but the second charge was small, who got charged twice and the amount was significant. I called the high-impact ones first, apologized, and offered a manual reversal that I would process myself when the system came back.",

    // Difficult customer
    "Most appreciated the call. A few were still angry — one threatened to close his account. With him I just listened — I didn't argue, didn't promise anything I couldn't deliver. I asked what would make this right for him. He said he just wanted his money back faster.",

    // Lesson learned
    "Sometimes the angry customer is angry because no one is listening. The fix isn't always faster — it's slower. Listen first. Then act.",

    // Generic continuation if conversation goes longer
    "I think those two stories show how I approach pressure — I try to break it into pieces I can act on, and I pay attention to the people involved, not just the task.",
    "Yes, I'd say so. I've handled similar situations before. The patterns are similar even when the details differ.",
    "Thanks, that was a meaningful question for me to reflect on.",
    "I appreciate that. Is there anything else?",
    "Okay, I think I've shared what I wanted to. Salamat!",
  ],
};

export const CARE_SCRIPT: ConversationScript = {
  name: 'care-davao',
  domain: 'caregiving',
  responses: [
    "Yes, my Tatay was diagnosed with Alzheimer's about three years ago. Ako yung primary caregiver — my siblings live abroad, so it was me and my mom managing everything.",

    "At first I tried to handle it like a normal sickness — schedule his meds, make sure he eats. But Alzheimer's is different. He'd forget he just ate and get angry that we weren't feeding him. So I had to learn — not just facts about the disease, but how to be with him without correcting him.",

    "There was one time he got very agitated — looking for his wallet, accusing my Nanay of taking it. Instead of trying to convince him, I said, 'Tay, let's look together.' We walked around the house. While walking, I gently shifted the conversation to something he loved — his old job as a teacher. Within ten minutes he forgot about the wallet.",

    "I learned that from a Facebook group of Filipino caregivers. Someone shared the same situation. So I started reading more — Alzheimer Society Philippines materials, dementia care videos. I built a small protocol — what to do when he's agitated, what to do when he's confused, what to do when he won't take meds.",

    "I shared it with my Nanay and our part-time helper. So we all had the same approach — consistency was important kasi inconsistent responses made him more anxious.",

    "Tatay passed last year. The doctor told my mom that the way we cared for him in his last two years probably gave him more time and definitely more peace. That meant a lot to us.",

    "I would have asked for help earlier. The first six months I was burning out trying to do everything alone. When I finally accepted that I needed structure and support, things got better — for him and for me.",

    "Yes. I also helped coordinate with relatives abroad — making weekly video calls, sending photos, making sure he saw their faces. That was important for him and for them.",

    "Sometimes I'd organize the calls so all six siblings were on at once — across three time zones. Pre-pandemic this was a luxury, but I got good at it.",

    "It taught me that complicated coordination is mostly about respecting people's time and being clear about what each person needs to do. The video calls became something everyone looked forward to.",

    "I want to do work where I can apply what I've learned — care coordination, family logistics, navigating health systems for people who don't speak English well. There are so many Filipino families in that situation.",
    "Yes, those are good summaries of what I shared.",
    "I think so. Thank you for this conversation.",
    "Salamat din! I appreciate the questions.",
  ],
};

const ALL_SCRIPTS = [BPO_SCRIPT, CARE_SCRIPT];

export function pickRandomScript(): ConversationScript {
  return ALL_SCRIPTS[Math.floor(Math.random() * ALL_SCRIPTS.length)];
}
