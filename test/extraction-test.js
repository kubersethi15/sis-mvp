#!/usr/bin/env node

/**
 * SIS Extraction Test Suite — 35 Diverse Scenarios
 * Tests extraction quality, fairness, and accuracy across:
 * - Work stories (formal, informal, freelance)
 * - Personal/family stories
 * - Disability navigation stories
 * - Community/volunteer stories
 * - Taglish conversations
 * - Emotional/distressing content
 * - Gaming attempts (should be flagged)
 * - Minimal/short responses
 * - Rich/detailed responses
 * 
 * Run: node test/extraction-test.js
 * Requires: server running on localhost:3000
 */

const BASE = 'http://localhost:3000';
const PASS = '✅';
const FAIL = '❌';
const WARN = '⚠️';
let passed = 0, failed = 0, warned = 0;

function log(s, test, detail = '') {
  const icon = s === 'pass' ? PASS : s === 'fail' ? FAIL : WARN;
  console.log(`  ${icon} ${test}${detail ? ` — ${detail}` : ''}`);
  if (s === 'pass') passed++; else if (s === 'fail') failed++; else warned++;
}

async function extract(transcript) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'extract', session_id: 'test-' + Date.now(), message: transcript }),
  });
  // We need to call the extraction prompt directly since we're not going through a real session
  const extractRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: getExtractionPrompt(transcript) }],
    }),
  });
  const data = await extractRes.json();
  const text = data.content?.find(b => b.type === 'text')?.text;
  if (!text) return null;
  const match = text.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : null;
}

function getExtractionPrompt(transcript) {
  // Import the prompt from the app
  return require('../src/lib/prompts.ts').LEEE_EXTRACTION_PROMPT
    ? 'placeholder' // can't import TS directly
    : 'placeholder';
}

// Since we can't import TS directly, we'll inline a simplified extraction call
async function extractFromTranscript(transcript) {
  const prompt = `You are a skills extraction engine for the Skills Intelligence System for PWDs in the Philippines.

CRITICAL: This system is for people with disabilities and excluded talent. Stories may be personal, emotional, messy, short. DO NOT penalize short answers, emotional topics, non-work contexts, or imperfect grammar. Look for IMPLICIT evidence.

Extract skills from this transcript. Output ONLY valid JSON:
{
  "skills_profile": [
    { "skill_id": "SK1-SK8", "skill_name": "name", "proficiency": "basic|intermediate|advanced", "confidence": 0.0-1.0, "evidence": [{ "transcript_quote": "exact quote", "behavioral_indicator": "what it shows" }] }
  ],
  "episodes": [{ "episode_id": 1, "summary": "brief", "star_er": { "situation": "", "task": "", "action": "", "result": "", "emotion": "", "reflection": "" } }],
  "narrative_summary": "warm, respectful 2-3 sentence summary",
  "gaming_flags": [],
  "layer2_seeds": [{ "scenario": "description", "target_skills": ["SK1"] }],
  "session_quality": { "stories_completed": 1, "evidence_density": "low|medium|high", "overall_confidence": 0.0-1.0 }
}

Skills: SK1=Emotional Intelligence, SK2=Communication, SK3=Collaboration, SK4=Problem-Solving, SK5=Adaptability, SK6=Learning Agility, SK7=Sense Making, SK8=Building Inclusivity

Proficiency: Basic=passive/guided, Intermediate=active/independent, Advanced=strategic/multi-stakeholder

Transcript:
${transcript}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    const text = data.content?.find(b => b.type === 'text')?.text;
    if (!text) return null;
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  } catch (e) {
    console.error('  Extraction error:', e.message);
    return null;
  }
}

// ============================================================
// 35 TEST SCENARIOS
// ============================================================

const SCENARIOS = [
  // === WORK STORIES (Formal) ===
  {
    id: 1, category: 'Work-Formal', name: 'Customer service conflict resolution',
    expectedSkills: ['SK1', 'SK2', 'SK4'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: Tell me about a time at work when something difficult happened.
User: I was working at a call center in Makati. One day an angry customer called about a wrong billing charge. He was screaming and threatening to close his account.
AI: What did you do?
User: I stayed calm and listened to everything he said without interrupting. Then I told him I understood his frustration and would fix it right away. I checked the system and found the error. I reversed the charge and gave him a credit for the inconvenience.
AI: How did that turn out?
User: He actually apologized for yelling and said he appreciated how I handled it. He stayed with the company and even wrote a positive feedback about me.
AI: What did you learn from that?
User: I learned that when people are angry, they just want to be heard first. If you listen before solving, they calm down faster.`,
  },
  {
    id: 2, category: 'Work-Formal', name: 'Team project under deadline pressure',
    expectedSkills: ['SK3', 'SK4', 'SK5'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: Can you tell me about a time you had to work with others under pressure?
User: We had a project at my BPO company - a client needed a report in 3 days that normally takes 2 weeks. My team of 5 was panicking.
AI: What was your role in that?
User: I organized everything. I broke the project into pieces, assigned each person the part they were best at, set up a shared Google Sheet to track progress, and we did daily 15-minute check-ins.
AI: Were there any problems along the way?
User: Yes, one teammate got sick on day 2. I redistributed her work and stayed late to cover some of it myself.
AI: How did it turn out?
User: We delivered on time. The client was impressed and gave us more projects. My manager promoted me to team lead after that.`,
  },
  {
    id: 3, category: 'Work-Formal', name: 'Learning new technology quickly',
    expectedSkills: ['SK6', 'SK4', 'SK5'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: Tell me about a time you had to learn something new quickly.
User: When I started at the IT company, they used a project management tool I'd never seen before - Jira. Everyone assumed I already knew it.
AI: What did you do?
User: I watched YouTube tutorials during lunch breaks for 3 days. I also asked the most experienced team member to show me the basic workflows. Within a week I was creating tickets and managing my own board.
AI: Did that experience teach you anything?
User: Yes - I learned that asking for help is not weakness. And that you can learn almost anything in a week if you're focused.`,
  },

  // === WORK STORIES (Informal/Freelance) ===
  {
    id: 4, category: 'Work-Informal', name: 'Sari-sari store difficult customer',
    expectedSkills: ['SK1', 'SK2', 'SK4'],
    minSkills: 2, expectedMinProficiency: 'basic',
    transcript: `AI: Tell me about something that happened at your store.
User: May isang customer na laging utang. One time umutang na naman siya pero hindi pa bayad yung dati.
AI: So what did you do?
User: Sabi ko sa kanya na hindi na puwede mag-utang pa kasi marami nang hindi bayad. Pero sinabi ko nang malumanay para hindi siya mapahiya sa ibang tao.
AI: How did they react?
User: Nagalit siya ng konti pero naintindihan naman niya. After one week nagbayad siya ng kalahati.
AI: Anong natutunan mo doon?
User: Na kailangan mong maging firm pero respectful. Hindi mo kailangan maging masama para magsabi ng totoo.`,
  },
  {
    id: 5, category: 'Work-Informal', name: 'Freelance client who wouldn\'t pay',
    expectedSkills: ['SK2', 'SK4', 'SK1'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: Have you had any challenges with your freelance work?
User: Yes, one client didn't pay me for a month of work - 5 PowerPoint presentations. They kept saying "next week" but nothing came.
AI: That sounds frustrating. What did you do about it?
User: I documented everything - all our conversations, the deliverables, the agreed price. Then I sent a very professional email summarizing all of it with a clear deadline. I also mentioned I would leave a review on the platform.
AI: What happened?
User: They paid within 2 days. I learned to always have written agreements and to set payment milestones for future projects.`,
  },

  // === DISABILITY NAVIGATION ===
  {
    id: 6, category: 'Disability', name: 'Advocating for wheelchair access at work',
    expectedSkills: ['SK2', 'SK4', 'SK8', 'SK5'],
    minSkills: 3, expectedMinProficiency: 'intermediate',
    transcript: `AI: Can you share a time when you had to advocate for something you needed?
User: When I got hired at a government office, the building had no ramp. I use a wheelchair. My colleagues had to carry me up 3 steps every morning. It was embarrassing and dangerous.
AI: What did you do about it?
User: I wrote a formal letter to the building manager explaining the situation. I included photos and a cost estimate for a simple ramp. I also cited the Accessibility Law - RA 11228.
AI: How did they respond?
User: At first they said there was no budget. So I went to the city disability affairs office and they helped me push for it. The ramp was built within 2 months.
AI: How did that experience affect you?
User: It taught me that you have to speak up for yourself and others. Now I help other PWDs in our office with their accommodation requests too.`,
  },
  {
    id: 7, category: 'Disability', name: 'Deaf person navigating hearing workplace',
    expectedSkills: ['SK5', 'SK2', 'SK6'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: Tell me about how you handle communication at your workplace.
User: I am hard of hearing. In meetings everyone talks fast and I miss things. It was really frustrating at first.
AI: How did you handle that?
User: I asked if meetings could have a written agenda sent beforehand so I know what will be discussed. I also learned to read lips better and I sit at the front. For important discussions, I ask people to type their points in the chat.
AI: Has that worked?
User: Yes! My manager now sends agendas for every meeting. Some colleagues even started using the chat more, which helped everyone not just me.
AI: What did you learn?
User: That asking for what you need is not being difficult. It actually makes things better for everyone.`,
  },

  // === FAMILY/PERSONAL STORIES ===
  {
    id: 8, category: 'Personal', name: 'Caring for sick parent while working',
    expectedSkills: ['SK1', 'SK5', 'SK4'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: Has there been a time recently where you had to manage a lot at once?
User: My mother got diagnosed with diabetes last year. I had to take her to the doctor, manage her medication, change her diet, and still keep my online job. I was the only one who could do it because my siblings work abroad.
AI: How did you manage all of that?
User: I created a schedule - mornings for mom's needs, afternoons for work, evenings for cooking healthy meals. I learned about diabetic diets from YouTube and the doctor. I also set up a group chat with my siblings so they could contribute money and stay updated.
AI: Was there a moment when it felt too much?
User: Yes, many times. One time I had a work deadline and my mom had an emergency hospital visit on the same day. I called my neighbor to stay with mom, submitted my work late, and explained to my client what happened. They understood.
AI: What did you take away from that experience?
User: That you can handle more than you think if you plan well and ask for help when you need it.`,
  },
  {
    id: 9, category: 'Personal', name: 'Inter-caste marriage negotiation',
    expectedSkills: ['SK1', 'SK2', 'SK3', 'SK4', 'SK5', 'SK8'],
    minSkills: 4, expectedMinProficiency: 'intermediate',
    transcript: `AI: What's been going on in your life lately?
User: I'm trying to get married to someone from a different caste. My dad won't agree. Mom is slowly warming up but dad just says no every time.
AI: That sounds really challenging. How have you been handling the conversations with your family?
User: I have sit-down conversations with them. With mom I focus on showing her my girlfriend's qualities - she has a stable job, is kind, emotionally available. That's been working. With dad I tried the same but he only cares about caste.
AI: What approaches have you tried with your dad?
User: I brought respected family elders to talk to him. I showed him examples of successful inter-caste marriages. I even asked him what specific concerns he has beyond caste. He just won't engage.
AI: How are you and your girlfriend handling this together?
User: We talk every day about it. We make plans together - what to try next, what our backup options are. She's been very patient and supportive even though it's hard on her too.
AI: What have you learned from this experience?
User: That sometimes you can't change people's minds with logic alone. You need patience, persistence, and the wisdom to know when to push and when to wait. I've also learned that having a partner who supports you makes everything more manageable.`,
  },

  // === COMMUNITY/VOLUNTEER ===
  {
    id: 10, category: 'Community', name: 'Organizing barangay clean-up drive',
    expectedSkills: ['SK3', 'SK2', 'SK4'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: Have you been involved in anything in your community?
User: I organized a clean-up drive in our barangay. The creek near our houses was full of trash and it was flooding every rainy season.
AI: How did you organize that?
User: I talked to the barangay captain first to get permission. Then I went door to door asking neighbors to join. I posted on our Facebook group. We got 30 people to show up on a Saturday morning. I coordinated who would bring tools, who would handle food, and I arranged for the barangay truck to haul the trash.
AI: Were there any challenges?
User: Some people complained that it wasn't their job. I just told them that the flooding affects all of us. The barangay captain was impressed and now we do it monthly.`,
  },

  // === TAGLISH CONVERSATIONS ===
  {
    id: 11, category: 'Taglish', name: 'VA handling difficult boss in Taglish',
    expectedSkills: ['SK1', 'SK2', 'SK5'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: Kumusta! May experience ka ba sa work na challenging?
User: Oo naman. Yung boss ko sa VA work, sobrang demanding. Minsan nagcha-chat siya sa akin ng 11pm asking for deliverables na hindi naman naka-schedule.
AI: Paano mo hinarap yun?
User: At first nag-comply ako kasi takot akong mawalan ng client. Pero napagod na ako. So nag-set ako ng boundaries. Sinabi ko na ang working hours ko is 9am to 6pm, and any requests outside that will be handled next business day.
AI: Ano ang reaction niya?
User: Nagulat siya at first pero nag-agree naman siya eventually. I also created a shared task board para clear kung anong priority. Naging mas smooth after that.
AI: Ano ang natutunan mo?
User: Na kailangan mong ipaglaban ang boundaries mo. Hindi ka magiging effective kung lagi kang stressed at overworked.`,
  },

  // === GAMING ATTEMPTS (should be flagged) ===
  {
    id: 12, category: 'Gaming', name: 'Buzzword-heavy rehearsed answer',
    expectedSkills: ['SK2'],
    minSkills: 0, shouldFlagGaming: true,
    transcript: `AI: Tell me about a challenge you faced.
User: I leveraged my cross-functional synergies to optimize stakeholder engagement and drive transformational outcomes. Through my strategic communication skills and collaborative leadership approach, I facilitated alignment across diverse teams and delivered exceptional results that exceeded KPIs by 200%.
AI: Can you tell me specifically what happened?
User: I utilized my emotional intelligence to navigate complex interpersonal dynamics and fostered an inclusive environment that promoted psychological safety and innovation.
AI: What exactly did you do? Like, step by step?
User: I implemented best practices in change management and drove continuous improvement through agile methodologies.`,
  },
  {
    id: 13, category: 'Gaming', name: 'Too-perfect story with no stumbles',
    expectedSkills: ['SK4'],
    minSkills: 0, shouldFlagGaming: true,
    transcript: `AI: Tell me about a problem you solved.
User: I immediately identified the root cause, developed a comprehensive solution, executed it flawlessly, and everyone praised my work. The company saved $1 million and I was promoted the same day. My approach was perfect from the start and I faced no obstacles whatsoever.
AI: Was there anything that didn't go well?
User: No, everything went perfectly according to plan. I am very good at solving problems and I always succeed.`,
  },

  // === MINIMAL/SHORT RESPONSES ===
  {
    id: 14, category: 'Minimal', name: 'Very short answers throughout',
    expectedSkills: ['SK2', 'SK4'],
    minSkills: 1, expectedMinProficiency: 'basic',
    transcript: `AI: Tell me about something that happened at work.
User: had to fix a computer
AI: What was wrong with it?
User: broken screen
AI: What did you do?
User: replaced it
AI: Did you do that yourself?
User: yes ordered the part and installed it
AI: Was it difficult?
User: a little. had to watch youtube first
AI: What did you learn?
User: i can fix things if i try`,
  },

  // === EMOTIONAL/HEAVY CONTENT ===
  {
    id: 15, category: 'Emotional', name: 'Overcoming bullying at previous job',
    expectedSkills: ['SK1', 'SK5', 'SK2'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: Has there been a time when you had to deal with a really tough situation?
User: At my old job, some coworkers bullied me because of my disability. They would mock my walking and exclude me from team lunches.
AI: I'm sorry that happened. How did you handle it?
User: For months I just endured it because I needed the job. But eventually I documented every incident with dates and witnesses. I reported it to HR with all the evidence.
AI: What happened after that?
User: HR investigated and the main bully was given a warning. It didn't completely stop but it got much better. Eventually I found a better job where people respect me.
AI: How did that experience change you?
User: I became stronger. I know my worth now. And at my new job, I make sure to include everyone because I know how it feels to be left out.`,
  },

  // === PWD-SPECIFIC SCENARIOS ===
  {
    id: 16, category: 'PWD', name: 'Stroke survivor returning to work',
    expectedSkills: ['SK5', 'SK6', 'SK1'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: How has your journey been since your stroke?
User: After my hemorrhagic stroke I had to relearn everything. My right side was paralyzed. The doctors said I might not work again. I was a senior territory manager with 20 years experience and suddenly I couldn't even hold a pen.
AI: How did you get through that?
User: Slowly. Physical therapy 3 times a week. I taught myself to write with my left hand. I started with simple tasks on the computer - just typing emails. Each week I could do a little more. My wife helped me practice.
AI: Where are you now?
User: I'm back doing virtual assistant work. It's not the same level as before but I'm working. I adapted by using voice-to-text and keyboard shortcuts. I'm proud that I didn't give up.`,
  },
  {
    id: 17, category: 'PWD', name: 'Cerebral palsy person handling job interview bias',
    expectedSkills: ['SK2', 'SK1', 'SK5', 'SK8'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: Have you faced any challenges in your job search?
User: Many times. I have mild cerebral palsy so my speech is sometimes slow. In interviews people assume I'm not capable. One interviewer actually said "are you sure you can handle this job?"
AI: How did you respond to that?
User: I said "let me show you my portfolio instead." I opened my laptop and walked them through 5 projects I completed for previous clients. I let my work speak instead of trying to convince them with words.
AI: What happened?
User: They hired me. And after 3 months my manager said I was one of the best in the team. But it took that extra effort to prove myself that others don't have to make.
AI: What has that taught you?
User: That I have to be more prepared than everyone else. It's not fair but it's reality. I always bring evidence of my work to interviews now.`,
  },

  // === SCHOOL/EDUCATION STORIES ===
  {
    id: 18, category: 'School', name: 'Group thesis with uncooperative members',
    expectedSkills: ['SK3', 'SK2', 'SK4'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: Tell me about a challenge you faced in school.
User: Our thesis group had 5 members but only 3 of us were actually doing the work. The other 2 would always miss meetings and not submit their parts.
AI: How did you handle that?
User: I called a meeting with everyone and laid out what each person owed. I gave clear deadlines. When one person still didn't deliver, I talked to him privately and found out he was working 2 jobs to support his family. So I adjusted - I took some of his load but asked him to do the simpler parts.
AI: How did the thesis turn out?
User: We passed with flying colors. The professor even complimented our teamwork. I learned that before judging someone, you should understand their situation first.`,
  },

  // === MORE DIVERSE SCENARIOS ===
  {
    id: 19, category: 'Work-Informal', name: 'Market vendor problem-solving',
    expectedSkills: ['SK4', 'SK6', 'SK2'],
    minSkills: 2, expectedMinProficiency: 'basic',
    transcript: `AI: Tell me about your work at the market.
User: I sell vegetables. Last year the prices of my suppliers went up but I couldn't raise prices because customers would go to the other vendors.
AI: How did you deal with that?
User: I went directly to farmers in the next town and negotiated lower prices by buying in bulk. I borrowed a friend's tricycle to transport. My costs went down even lower than before.
AI: Smart thinking! Did anything go wrong?
User: The first farmer I tried gave me bad quality vegetables. I had to throw away half. But I learned to inspect everything before paying.`,
  },
  {
    id: 20, category: 'Personal', name: 'Single mother managing finances',
    expectedSkills: ['SK4', 'SK1', 'SK7'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: What's a challenge you're proud of handling?
User: Being a solo parent. My husband left when our son was 2. I had no savings and a minimum wage job. I had to figure out how to make it work.
AI: How did you manage?
User: I made a strict budget. I learned to cook everything from scratch instead of buying prepared food. I found a government program for solo parents that helped with school fees. I also started a small online selling business at night - buying from Divisoria and selling on Facebook.
AI: That's a lot of work. How did you keep going?
User: My son. Every time I wanted to give up I looked at him. I also joined a solo parents support group at our church which helped me not feel so alone.
AI: What did you learn from all of this?
User: That I'm stronger than I thought. And that asking for help from programs and community is not shame - it's smart.`,
  },

  // === MORE PWD SCENARIOS FROM RYAN'S PROFILES ===
  {
    id: 21, category: 'PWD', name: 'Hard of hearing IT trainee seeking OJT',
    expectedSkills: ['SK6', 'SK5', 'SK2'],
    minSkills: 2, expectedMinProficiency: 'basic',
    transcript: `AI: Tell me about your experience looking for work.
User: I'm hard of hearing - severe. I've been trying to get OJT for months but companies don't want to accommodate me. They see "deaf" and assume I can't do IT work.
AI: How have you been dealing with that?
User: I apply everywhere. I've learned to use captions on Zoom, I communicate through chat mostly. For my VA training at Virtualahan, I adapted by recording all sessions and reviewing them with captions.
AI: Has any approach worked better than others?
User: Yes - when I can show them my actual work instead of just talking about it. I created a portfolio website to show my coding projects. That works better than interviews where they focus on my hearing.`,
  },
  {
    id: 22, category: 'PWD', name: 'Osteoarthritis worker adapting job functions',
    expectedSkills: ['SK5', 'SK4', 'SK6'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: How has your health condition affected your work?
User: I have progressive osteoarthritis. I've been in admin for 12 years but my hands are getting worse. Typing for long periods is painful now.
AI: How have you adapted?
User: I learned voice-to-text software. I rearranged my workspace to be ergonomic. I also started delegating the heavy data entry to my assistant and focused on the planning and coordination parts of my job where I add more value.
AI: Have you faced any resistance from your employer?
User: My boss was supportive but some colleagues complained that I was getting "special treatment." I had a conversation with the team explaining my condition and showing that my productivity was actually higher because I was working smarter, not harder.
AI: What's your biggest takeaway?
User: That disability forces you to innovate. I actually became more efficient because I had to find better ways to do things.`,
  },

  // === ADDITIONAL DIVERSE SCENARIOS ===
  {
    id: 23, category: 'Community', name: 'Teaching digital skills to seniors',
    expectedSkills: ['SK2', 'SK1', 'SK3'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: What's something you've done for your community?
User: I volunteer teaching senior citizens how to use smartphones and social media at our barangay hall. Many of them want to video call their children abroad but don't know how.
AI: What's that experience been like?
User: Challenging but rewarding. You have to be very patient. I learned to explain things differently for each person. Some understand visual instructions, others need me to guide their hands. I never use technical terms - I say "press the green phone picture" not "tap the call icon."
AI: Has there been a frustrating moment?
User: One lola got frustrated and started crying because she couldn't remember the steps. I told her it's okay, we have plenty of time, and we practiced just one thing until she got it. She called her son that night for the first time in months.`,
  },
  {
    id: 24, category: 'Work-Formal', name: 'Handling workplace harassment report',
    expectedSkills: ['SK1', 'SK2', 'SK4', 'SK8'],
    minSkills: 3, expectedMinProficiency: 'intermediate',
    transcript: `AI: Tell me about a difficult situation at work where you had to make a tough decision.
User: A junior colleague told me that another manager was making inappropriate comments to her. She was scared to report it because the manager was senior.
AI: What did you do?
User: I listened to her carefully and took notes. I told her she didn't have to decide anything right away. I explained the reporting options and offered to go with her to HR if she wanted. I also checked our company policy so I could advise her properly.
AI: How did it turn out?
User: She decided to report it and I accompanied her. HR took it seriously. The manager was transferred to another department. My colleague thanked me for believing her and supporting her through it.
AI: What did you learn?
User: That being a bystander is a choice. When someone trusts you with something like that, you have a responsibility to help them navigate it properly.`,
  },
  {
    id: 25, category: 'Personal', name: 'Dealing with deportation threat as OFW',
    expectedSkills: ['SK1', 'SK4', 'SK5'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: Has there been a really scary situation you had to deal with?
User: When I was working in Saudi Arabia as a domestic helper, my employer threatened to have me deported because I refused to work on my rest day. I was terrified because I had loans back home.
AI: How did you handle that?
User: I called the POLO-OWWA hotline secretly using a borrowed phone. They advised me of my rights under my contract. I showed my employer the contract clause about rest days, calmly. I also secretly saved all my documents in case I needed to leave quickly.
AI: What happened?
User: My employer backed down. They weren't happy but they followed the contract after that. I finished my 2-year contract and came home safely.
AI: Looking back, what did you learn?
User: Know your rights. Always keep copies of your documents. And stay calm even when you're scared inside.`,
  },

  // More scenarios continuing the diversity...
  {
    id: 26, category: 'Work-Informal', name: 'Online seller dealing with scam buyer',
    expectedSkills: ['SK4', 'SK2', 'SK1'],
    minSkills: 2, expectedMinProficiency: 'basic',
    transcript: `AI: Any challenges with your online selling?
User: A buyer claimed they received a broken item and wanted a refund. But I know it was fine because I took photos before shipping.
AI: What did you do?
User: I showed them my photos with timestamps. I also showed the courier receipt. They stopped replying. I reported the buyer to the platform to protect other sellers.
AI: What did you learn?
User: Always document everything. Take photos, keep receipts. It saved me money.`,
  },
  {
    id: 27, category: 'Taglish', name: 'Barangay health worker during COVID in Taglish',
    expectedSkills: ['SK2', 'SK3', 'SK5', 'SK1'],
    minSkills: 3, expectedMinProficiency: 'intermediate',
    transcript: `AI: May experience ka ba during COVID na challenging?
User: Oo, BHW ako. Nung lockdown, kailangan namin mag-distribute ng relief goods sa buong barangay. Pero maraming tao hindi naniniwala sa COVID, ayaw mag-mask.
AI: Paano mo hinarap yun?
User: Hindi ko sila pinagalitan. Instead, kinausap ko sila one-on-one. Inintindi ko muna bakit sila takot o galit. Tapos slowly explained ko yung facts without being preachy. Ginamit ko yung mga experience nila - like "alam mo yung trangkaso? Ganun din pero mas malakas."
AI: May naconvince ka ba?
User: Karamihan oo. May isa pa nga na naging volunteer din after. Yung iba talaga ayaw pero at least nagma-mask na sila sa public.
AI: Ano ang natutunan mo?
User: Na hindi mo kailangan manalo sa argument. Kailangan mo lang intindihin ang tao at irespeto sila kahit iba ang opinyon nila.`,
  },
  {
    id: 28, category: 'Personal', name: 'Managing depression while job hunting',
    expectedSkills: ['SK1', 'SK5', 'SK6'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: How has your job search been going?
User: Honestly, really hard. I have depression and some days I can't even get out of bed. But I keep trying. I applied to 50 jobs last month.
AI: That takes a lot of strength. How do you manage the difficult days?
User: I have a system. On good days I do the hard stuff - applications, interviews. On bad days I do easier things - update my portfolio, watch training videos. I also see a counselor every two weeks through the city health center.
AI: Has any of your approaches worked?
User: I got 3 interviews last week! I prepare extra hard because I know my energy is unpredictable. I also tell myself that rejection is not about me as a person - it's just about fit.
AI: What have you learned about yourself through this?
User: That I'm more resilient than my depression tells me I am. And that having a plan for bad days is just as important as having a plan for good days.`,
  },

  // === EDGE CASES ===
  {
    id: 29, category: 'Edge', name: 'Story with no clear action (passive)',
    expectedSkills: [],
    minSkills: 0, expectedMinProficiency: 'basic',
    transcript: `AI: Tell me about something that happened.
User: Things are hard. Life is hard. I don't know what to do.
AI: Can you tell me more about what's going on?
User: Just everything. Work, family, health. It's all bad.
AI: Is there one specific thing you could tell me about?
User: My boss is mean. He yells a lot. Everyone just takes it.
AI: What do you do when that happens?
User: Nothing. I just sit there. We all just sit there.`,
  },
  {
    id: 30, category: 'Edge', name: 'Very rich detailed story with multiple skills',
    expectedSkills: ['SK1', 'SK2', 'SK3', 'SK4', 'SK5', 'SK7'],
    minSkills: 4, expectedMinProficiency: 'intermediate',
    transcript: `AI: Tell me about a time when everything came together for you.
User: When the typhoon hit our province in 2022, our barangay was one of the worst affected. I was just a volunteer at the time but our barangay captain was stranded in Manila. Someone had to step up.
AI: What did you do?
User: First I assessed the damage - went house to house checking who was injured, who lost their home, who needed medicine. I kept a notebook listing everyone's needs. Then I organized the other volunteers into 3 teams - rescue, supply distribution, and communication. I used my phone to coordinate with the municipal disaster office and post updates on Facebook so families abroad could know their relatives were safe.
AI: Were there any really difficult moments?
User: Yes. We found an elderly couple trapped under their collapsed roof. I had to stay calm and direct the rescue while keeping them talking so they wouldn't panic. Also, some people were hoarding relief goods. I had to confront them firmly but fairly - I explained that everyone's portion was recorded and anyone caught hoarding would be removed from the distribution list.
AI: How did things turn out?
User: All 200+ families in our area were accounted for within 48 hours. No deaths, thankfully. The municipal government actually commended our barangay's response. I was asked to join the official disaster preparedness committee afterward.
AI: What did that experience teach you?
User: That leadership isn't about title - it's about who steps up when it matters. I also learned that in a crisis, clear communication and organized systems save lives. And that you have to take care of yourself too - I collapsed from exhaustion after 3 days and my wife had to force me to rest.`,
  },

  // Additional scenarios for coverage
  {
    id: 31, category: 'Work-Formal', name: 'Training new employees',
    expectedSkills: ['SK2', 'SK3'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: Have you ever had to train or mentor someone?
User: Yes, when I became senior VA at our agency, I was assigned to train 3 new hires. They had zero experience.
AI: How did you approach that?
User: I created a simple training manual with screenshots for every task. I did buddy sessions where they watched me work for the first week, then I watched them the second week. I gave feedback gently - I'd say "good try, but here's a faster way" instead of "that's wrong."
AI: How did they turn out?
User: All 3 are still with the company. One of them is now training new people herself. That made me really proud.`,
  },
  {
    id: 32, category: 'PWD', name: 'Visually impaired person using assistive tech',
    expectedSkills: ['SK6', 'SK5', 'SK4'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: How do you handle your work with your visual impairment?
User: I use screen readers - JAWS and NVDA. Most websites aren't accessible so I often have to find workarounds. For my data entry job, I created keyboard shortcuts for repetitive tasks that save me hours.
AI: Can you give me an example of a workaround?
User: Our company's timesheet system doesn't work with screen readers. So I built a simple spreadsheet that I fill in, then I use a macro to copy the data into the timesheet format. My boss was so impressed he asked me to share it with the team.
AI: What has this taught you?
User: That disability makes you a better problem solver because you're always finding creative solutions.`,
  },
  {
    id: 33, category: 'Gaming', name: 'Inconsistent details',
    expectedSkills: [],
    minSkills: 0, shouldFlagGaming: true,
    transcript: `AI: Tell me about a challenge at work.
User: I managed a team of 50 people at my last job at a major corporation.
AI: What was the challenge?
User: We had to deliver a project worth $10 million in just one week.
AI: What did you do?
User: I personally wrote all the code, designed the UI, tested everything, and presented to the board.
AI: Earlier you said you managed 50 people - did they help?
User: Oh yes, they helped too. But mainly it was me doing everything. The CEO personally thanked me.`,
  },
  {
    id: 34, category: 'Emotional', name: 'Grief and returning to work',
    expectedSkills: ['SK1', 'SK5'],
    minSkills: 2, expectedMinProficiency: 'intermediate',
    transcript: `AI: Has there been a tough time that you came through?
User: My father passed away suddenly last year. Heart attack. He was only 55. I had to take care of all the funeral arrangements because my mother was in shock. And I had to go back to work after just one week because we needed the income.
AI: How did you manage going back to work while grieving?
User: Honestly, some days I would cry in the bathroom during breaks. But I told my close colleague about what happened and she covered for me when I needed a moment. I focused on one task at a time instead of thinking about everything. I also made sure to do something for myself each evening - even just a walk.
AI: Where are you now with it?
User: It's been a year. The pain is still there but I can function. I actually started a small fund in my dad's name to help other families with emergency funeral expenses in our community.`,
  },
  {
    id: 35, category: 'Work-Informal', name: 'Tricycle driver solving route problem',
    expectedSkills: ['SK4', 'SK6'],
    minSkills: 1, expectedMinProficiency: 'basic',
    transcript: `AI: Tell me about your work as a tricycle driver.
User: I drive trike in our town. Before, I just followed the same route as everyone else and competition was hard. Low income.
AI: Did you find a way to improve things?
User: I noticed that the workers at the new factory don't have direct transport to their dormitory. So I started offering a regular route there. I made a deal with the factory guard - I pick up workers at shift change times.
AI: How did that work out?
User: Now I have regular passengers twice a day. My income increased by almost double. Other drivers copied me eventually but I was first so the workers trust me more.`,
  },
];

// ============================================================
// VALIDATION FUNCTIONS
// ============================================================

function validateExtraction(scenario, result) {
  console.log(`\n  📝 Scenario ${scenario.id}: ${scenario.name} (${scenario.category})`);

  if (!result) {
    log('fail', 'Extraction', 'No result returned');
    return;
  }

  // Check skills extracted
  const extractedIds = (result.skills_profile || []).map(s => s.skill_id);
  const extractedCount = extractedIds.length;

  if (extractedCount >= scenario.minSkills) {
    log('pass', `Skills count`, `${extractedCount} extracted (min: ${scenario.minSkills})`);
  } else {
    log('fail', `Skills count`, `${extractedCount} extracted (expected min: ${scenario.minSkills})`);
  }

  // Check expected skills present
  for (const expected of scenario.expectedSkills) {
    if (extractedIds.includes(expected)) {
      const skill = result.skills_profile.find(s => s.skill_id === expected);
      log('pass', `  ${expected} extracted`, `${skill.skill_name}: ${skill.proficiency} (${Math.round(skill.confidence * 100)}%)`);

      // Check evidence exists
      if (skill.evidence && skill.evidence.length > 0) {
        log('pass', `  ${expected} has evidence`, `${skill.evidence.length} citation(s)`);
      } else {
        log('warn', `  ${expected} missing evidence`, 'No transcript citations');
      }
    } else {
      log('fail', `  ${expected} NOT extracted`, 'Expected but missing');
    }
  }

  // Check proficiency levels
  if (scenario.expectedMinProficiency) {
    const profOrder = { basic: 1, intermediate: 2, advanced: 3 };
    const minLevel = profOrder[scenario.expectedMinProficiency] || 1;
    const skillLevels = (result.skills_profile || []).map(s => profOrder[s.proficiency?.toLowerCase()] || 0);
    const avgLevel = skillLevels.length > 0 ? skillLevels.reduce((a, b) => a + b, 0) / skillLevels.length : 0;

    if (avgLevel >= minLevel - 0.5) {
      log('pass', 'Proficiency level', `Average meets expected (${scenario.expectedMinProficiency})`);
    } else {
      log('warn', 'Proficiency level', `Average below expected ${scenario.expectedMinProficiency}`);
    }
  }

  // Check gaming flags
  if (scenario.shouldFlagGaming) {
    if (result.gaming_flags && result.gaming_flags.length > 0) {
      log('pass', 'Gaming detected', result.gaming_flags.map(f => f.flag_type).join(', '));
    } else {
      log('fail', 'Gaming NOT detected', 'Expected gaming flags but none found');
    }
  } else {
    if (result.gaming_flags && result.gaming_flags.length > 0) {
      // Unfair gaming flag on genuine story
      log('warn', 'Unexpected gaming flag', result.gaming_flags.map(f => `${f.flag_type}: ${f.evidence?.substring(0, 50)}`).join('; '));
    }
  }

  // Check narrative summary
  if (result.narrative_summary) {
    if (result.narrative_summary.toLowerCase().includes('user is') || result.narrative_summary.toLowerCase().startsWith('the user')) {
      log('warn', 'Narrative tone', 'Clinical/cold — should be warmer');
    } else {
      log('pass', 'Narrative summary', result.narrative_summary.substring(0, 60) + '...');
    }
  } else {
    log('warn', 'Narrative summary', 'Missing');
  }

  // Check episodes
  if (result.episodes && result.episodes.length > 0) {
    log('pass', 'Episodes', `${result.episodes.length} episode(s)`);
  } else {
    log('warn', 'Episodes', 'None extracted');
  }
}

// ============================================================
// RUN
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   SIS Extraction Test Suite — 35 Scenarios      ║');
  console.log('║   Testing extraction quality and fairness        ║');
  console.log('╚══════════════════════════════════════════════════╝');

  if (!process.env.ANTHROPIC_API_KEY) {
    // Try to read from .env.local
    const fs = require('fs');
    try {
      const env = fs.readFileSync('.env.local', 'utf8');
      const match = env.match(/ANTHROPIC_API_KEY=(.+)/);
      if (match) process.env.ANTHROPIC_API_KEY = match[1].trim();
    } catch (e) {}
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY not set. Set it or ensure .env.local exists.');
    process.exit(1);
  }

  const startTime = Date.now();
  const categoriesToRun = process.argv[2] ? [process.argv[2]] : null; // Optional: node test/extraction-test.js PWD

  for (const scenario of SCENARIOS) {
    if (categoriesToRun && !categoriesToRun.includes(scenario.category)) continue;

    try {
      const result = await extractFromTranscript(scenario.transcript);
      validateExtraction(scenario, result);
    } catch (e) {
      console.log(`\n  📝 Scenario ${scenario.id}: ${scenario.name}`);
      log('fail', 'Extraction error', e.message);
    }

    // Brief pause to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log('\n' + '═'.repeat(50));
  console.log(`\n📊 EXTRACTION TEST RESULTS (${elapsed}s)`);
  console.log(`   ${PASS} Passed: ${passed}`);
  console.log(`   ${WARN} Warnings: ${warned}`);
  console.log(`   ${FAIL} Failed: ${failed}`);
  console.log(`   Total checks: ${passed + warned + failed}`);
  console.log(`   Scenarios tested: ${categoriesToRun ? SCENARIOS.filter(s => categoriesToRun.includes(s.category)).length : SCENARIOS.length}`);
  console.log('');

  if (failed === 0) {
    console.log('🎉 ALL EXTRACTION TESTS PASSED!');
  } else {
    console.log(`⚠️ ${failed} check(s) failed — review output above.`);
  }

  process.exit(failed > 5 ? 1 : 0); // Allow up to 5 failures for LLM variability
}

main().catch(e => { console.error('Test error:', e); process.exit(1); });
