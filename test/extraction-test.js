#!/usr/bin/env node
const BASE = 'http://localhost:3000';
let passed=0, failed=0, warned=0;
const P='✅', F='❌', W='⚠️';
function log(s,m,d=''){console.log(`  ${s==='pass'?P:s==='fail'?F:W} ${m}${d?' — '+d:''}`);s==='pass'?passed++:s==='fail'?failed++:warned++}

const SCENARIOS = [
  { id:'W01', name:'Customer service — difficult customer (Taglish)', transcript:`AI: Tell me about a time you had to deal with a difficult situation at work.\nUser: May isang customer na sobrang galit kasi nagkamali daw kami sa order niya. Pumasok siya sa store at sumigaw.\nAI: What did you do?\nUser: Kinausap ko siya ng malumanay. Sinabi ko po pasensya na po tignan natin kung paano natin maayos. Tinitignan ko yung records habang kausap ko siya.\nAI: And what happened?\nUser: Nakita ko na tama naman pala ang order pero may miscommunication sa delivery. Inisa-isa ko sa kanya step by step. Nag-sorry siya at naging regular customer pa.\nAI: How did you feel?\nUser: Kinabahan ako nung una kasi sumisigaw siya. Pero sabi ko sa sarili ko kalma lang wag mag-react. Focus sa facts.\nAI: What did you learn?\nUser: Na mas effective kung hindi ka ga-react agad. Listen muna understand then respond with facts hindi with emotion.`, expected:['SK1','SK2','SK4'], min:2, proficiency:'intermediate' },
  { id:'W02', name:'Team project with conflict', transcript:`AI: Tell me about working with others on something challenging.\nUser: We had a group project at work to redesign the filing system. Three of us but nobody wanted to lead. We kept arguing.\nAI: What did you do?\nUser: I volunteered to organize discussions. Made a plan - each propose approach then vote. Also offered to do the biggest section myself.\nAI: How did others react?\nUser: Relieved someone took charge. But one colleague kept missing deadlines. I had private conversation found out he was overwhelmed. Helped redistribute workload.\nAI: Result?\nUser: Finished on time manager praised the system. The struggling colleague became my close work friend.\nAI: What did it teach you?\nUser: Leadership isn't about being bossy. It's about making it easy for everyone to contribute their best.`, expected:['SK2','SK3','SK4'], min:3, proficiency:'intermediate' },
  { id:'W03', name:'Learning social media fast', transcript:`AI: Tell me about learning something new quickly.\nUser: Boss asked me to handle social media because the person resigned. No experience with Facebook Business or Canva.\nAI: What did you do?\nUser: Watched YouTube tutorials for two days. Tried making posts terrible at first. Asked my younger cousin to teach me design.\nAI: How did it go?\nUser: After two weeks posting regularly. Page engagement up 30%. Learned basic analytics too.\nAI: Hardest part?\nUser: Accepting first attempts would be bad. Kept comparing to professional pages. Told myself progress not perfection.`, expected:['SK6','SK5'], min:2, proficiency:'intermediate' },
  { id:'W04', name:'Sari-sari store debt management (Filipino)', transcript:`AI: What's challenging about the store?\nUser: Mga suki na umuutang tapos hindi nagbabayad. Mahirap tumanggi kasi kapitbahay mo pa. Pero nalulugi na.\nAI: How did you handle it?\nUser: Gumawa ako ng listahan ng lahat ng utang. Nag-set ng limit pag lagpas 500 pesos hindi na puwede ulit mag-utang hanggang hindi nababayaran. Sinabi ko nang maayos.\nAI: Did it work?\nUser: Unti-unti. May ilan na nagalit pero karamihan naintindihan. Nabawasan utang by 60% in two months.\nAI: What did you learn?\nUser: Na kailangan maging firm pero hindi bastos. Mas importante ang sistema kaysa personal na diskarte.`, expected:['SK4','SK2','SK1'], min:2, proficiency:'intermediate' },
  { id:'F01', name:'Caring for sick parent', transcript:`AI: Tell me about something challenging.\nUser: My mother got diagnosed with diabetes. I took over managing medication diet and appointments because siblings work far away.\nAI: How did you handle it?\nUser: Created a schedule which medicines when what food she can eat when check-ups are. Learned to check blood sugar myself.\nAI: Difficult moment?\nUser: One night her sugar dropped really low. Shaking and confused. Almost panicked but remembered doctor said give juice or candy immediately. Did that stayed calm monitored for an hour called doctor in morning.\nAI: How did you manage your stress?\nUser: I cry sometimes when she's asleep. But I tell myself she needs me strong. Joined online support group for caregivers.`, expected:['SK1','SK4','SK5'], min:3, proficiency:'intermediate' },
  { id:'F02', name:'Inter-caste marriage negotiation', transcript:`AI: What's going on in your life?\nUser: Trying to get family to accept girlfriend. Want to get married but dad opposes because different caste.\nAI: How have you been handling it?\nUser: Sit-down conversations. Mom warming up sees girlfriend good qualities stable job good family. Dad just says no.\nAI: Your approach with dad?\nUser: Tried showing times changed. Now trying through uncles who have more influence. Girlfriend planned to visit and cook to show respect.\nAI: Is it working?\nUser: Slowly. Dad ate food she made but didn't say thank you. But didn't leave room either. That's progress.\nAI: How are you and girlfriend managing?\nUser: Talk every night about strategy. She supports me when frustrated. Decided if all else fails after 6 months we proceed on our own but keep trying to repair relationship.`, expected:['SK1','SK2','SK3','SK4','SK5','SK7','SK8'], min:4, proficiency:'intermediate' },
  { id:'D01', name:'PWD workplace advocacy (wheelchair)', transcript:`AI: Tell me about work experience.\nUser: Work as data encoder at government office. Use wheelchair building is old.\nAI: How did you handle that?\nUser: Mapped accessible routes. Wrote polite letter to admin explaining which areas needed ramps. Attached photos and suggested modifications.\nAI: What happened?\nUser: Installed two ramps within a month. Supervisor said most organized request. Other PWD employees benefit now.\nAI: Any resistance?\nUser: Some said I was demanding. Framed it as helps everyone even people carrying heavy boxes use ramps. Invited critics to try wheelchair for a day. One did and apologized.\nAI: What did this teach you?\nUser: Advocacy works better with evidence and empathy than anger. Accessibility benefits everyone.`, expected:['SK2','SK4','SK8','SK5'], min:3, proficiency:'intermediate' },
  { id:'D02', name:'Deaf person job interview', transcript:`AI: Challenging experience?\nUser: I'm hard of hearing. Applied for call center. Interviewer kept talking fast not facing me couldn't lip-read.\nAI: What did you do?\nUser: Politely asked to slow down and face me. They adjusted. Asked if I could do the job. Showed previous work adapted by using chat-based support and email. Metrics were top 10%.\nAI: How did it go?\nUser: Offered position in chat support team. Manager later said one of best hires because naturally communicated clearly in writing.\nAI: How did you feel?\nUser: Nervous and angry they doubted me. But turned it into opportunity to show what I could do instead of arguing.`, expected:['SK2','SK5','SK1'], min:3, proficiency:'intermediate' },
  { id:'C01', name:'Barangay cleanup drive (Filipino)', transcript:`AI: Community involvement?\nUser: Sobrang dami basura sa creek. Nag-organize ako ng cleanup drive.\nAI: How?\nUser: Pumunta sa barangay captain para support. Gumawa ng poster sa Canva pinaskil sa FB group. Kinausap mga kabataan sa kanto na-recruit first.\nAI: How many joined?\nUser: 25 sa first cleanup. Naging regular monthly. Gumawa din ng signage no littering. Ngayon mas malinis creek.\nAI: Hardest part?\nUser: Convincing people worth it. Maraming nagsabi walang mangyayari. Pag nakita before after photos nagbago isip nila.`, expected:['SK3','SK2','SK4'], min:2, proficiency:'intermediate' },
  { id:'C02', name:'Teaching seniors digital literacy', transcript:`AI: Community work?\nUser: Volunteer teaching seniors use smartphones. Got phones from children but don't know how.\nAI: What's it like?\nUser: Very challenging rewarding. Super patient they forget quickly get frustrated. Break everything tiny steps today just open WhatsApp tomorrow type message.\nAI: Most rewarding moment?\nUser: Lola Minda 74 sent first message to grandson working abroad. Crying happy tears. Hadn't communicated months.\nAI: How handle frustration?\nUser: Tell them Lola Lolo nung bata kayo kayo nagturo maglakad ngayon kami magtuturo. They always laugh and relax.`, expected:['SK2','SK1','SK3'], min:2, proficiency:'intermediate' },
  { id:'X01', name:'EDGE: Very short answers (minimal)', transcript:`AI: Tell me about a challenge.\nUser: May problema sa work.\nAI: What kind?\nUser: Yung boss ko galit.\nAI: What did you do?\nUser: Kinausap ko.\nAI: What happened?\nUser: Nag-okay naman.\nAI: How did you feel?\nUser: Kinabahan.`, expected:['SK2'], min:0, proficiency:'basic', maxProf:'basic' },
  { id:'X02', name:'EDGE: Gaming attempt (buzzwords)', transcript:`AI: Tell me about a challenge at work.\nUser: I leveraged my cross-functional stakeholder management skills to drive synergistic outcomes across multiple business units with data-driven performance optimization achieving 47% KPI improvement.\nAI: Can you tell me specifically what happened?\nUser: I utilized expertise in strategic planning and organizational development to facilitate change management initiatives for enhanced operational efficiency.\nAI: What exactly did you do?\nUser: The situation required a paradigm shift leveraging digital transformation methodologies to create scalable solutions.`, expected:[], min:0, gaming:true },
  { id:'X03', name:'EDGE: Emotional distress but strong resilience', transcript:`AI: How are you doing?\nUser: Not great. Partner left me last month then lost freelance client. Really tough.\nAI: How have you been managing?\nUser: Started going for walks every morning. Reached out to friend who's a counselor. She helped make a plan first stabilize financially then deal with emotional stuff.\nAI: That sounds thoughtful.\nUser: Also started small online business selling crafts. Doesn't make much but gives focus. Learned basic Shopee selling from YouTube.\nAI: Impressive during difficult time.\nUser: If I just sit feeling sorry nothing changes. Better to do something even small.`, expected:['SK5','SK4','SK6'], min:2, proficiency:'intermediate' },
  { id:'X04', name:'EDGE: PWD systemic advocacy', transcript:`AI: Something you figured out?\nUser: Have cerebral palsy needed PWD ID. Process complicated different offices different requirements.\nAI: How did you handle it?\nUser: Went to barangay first incomplete list. Then DSWD different list. Combined both added online research made complete checklist.\nAI: Then what?\nUser: Shared checklist in PWD Facebook group. 500 shares. Made step-by-step guide with photos. DSWD contacted me to verify and started using it officially.\nAI: How did that feel?\nUser: Really good. My struggle helped others avoid same frustration.`, expected:['SK4','SK2','SK8','SK6'], min:3, proficiency:'intermediate' },
  { id:'M01', name:'Mediating divorced parents (advanced)', transcript:`AI: Dealing with multiple people different perspectives?\nUser: Parents divorced when I was 16. Eldest of three. Both tried to use us to communicate tell your father this tell your mother that.\nAI: How did you handle it?\nUser: Sat them down separately. Told each we love both and putting us in middle hurts us. Organized family meeting about practical stuff school fees holidays pickups.\nAI: How did they respond?\nUser: Mom cried apologized. Dad defensive at first but agreed to meeting. Made an agenda like real meeting so stayed focused on logistics not emotions.\nAI: And now?\nUser: Still don't talk much but communicate through shared WhatsApp group I set up. About kids stuff only. Younger siblings say much better.\nAI: What did this teach you?\nUser: Sometimes people need neutral space and structure to communicate. Emotions make everything messier separate practical from emotional you can make progress.`, expected:['SK1','SK2','SK3','SK4','SK7'], min:4, proficiency:'advanced' },
];

async function runTest(scenario) {
  try {
    const res = await fetch(`${BASE}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'extract_transcript', transcript: scenario.transcript }),
    });
    const data = await res.json();
    if (!data.extraction) { log('fail','Extraction failed', data.error); return; }
    const ext = data.extraction;
    const skills = ext.skills_profile || [];
    const ids = skills.map(s => s.skill_id);

    // Min skills
    log(skills.length >= scenario.min ? 'pass' : 'fail', `Skills: ${skills.length}/${scenario.min} min`, skills.map(s=>`${s.skill_id}:${s.proficiency}`).join(', '));

    // Expected skills
    let expectedHit = 0;
    for (const e of scenario.expected) {
      if (ids.includes(e)) { expectedHit++; }
      else { log('warn', `Missing ${e}`); }
    }
    if (scenario.expected.length > 0) {
      log(expectedHit >= scenario.expected.length * 0.6 ? 'pass' : 'warn', `Expected skills: ${expectedHit}/${scenario.expected.length}`);
    }

    // Proficiency
    if (scenario.proficiency) {
      const pOrder = { basic:1, intermediate:2, advanced:3 };
      const maxP = Math.max(...skills.map(s => pOrder[s.proficiency?.toLowerCase()] || 0), 0);
      log(maxP >= pOrder[scenario.proficiency] ? 'pass' : 'fail', `Proficiency: ${maxP >= pOrder[scenario.proficiency] ? 'met' : 'too low'}`, `expected min ${scenario.proficiency}`);
    }

    // Gaming
    if (scenario.gaming) {
      const flagged = (ext.gaming_flags||[]).length > 0;
      log(flagged ? 'pass' : 'fail', `Gaming detection`, flagged ? 'Flagged correctly' : 'NOT flagged — should have been');
    }

    // Evidence
    const allHaveEvidence = skills.every(s => s.evidence?.length > 0);
    log(allHaveEvidence ? 'pass' : 'warn', 'Evidence citations', allHaveEvidence ? 'All cited' : 'Some missing');

    // Narrative warmth
    if (ext.narrative_summary) {
      const warm = !ext.narrative_summary.toLowerCase().startsWith('user ');
      log(warm ? 'pass' : 'warn', 'Narrative tone', warm ? 'Warm' : 'Cold (starts with "User")');
    }
  } catch (e) {
    log('fail', 'API error', e.message);
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║  SIS Extraction Quality Test Suite               ║');
  console.log('║  ' + SCENARIOS.length + ' scenarios                                  ║');
  console.log('╚══════════════════════════════════════════════════╝\n');
  const start = Date.now();

  for (const s of SCENARIOS) {
    console.log(`\n${s.id}: ${s.name}`);
    console.log('─'.repeat(50));
    await runTest(s);
    await new Promise(r => setTimeout(r, 2000));
  }

  const elapsed = Math.round((Date.now() - start) / 1000);
  console.log('\n' + '═'.repeat(50));
  console.log(`📊 RESULTS (${elapsed}s) — ${SCENARIOS.length} scenarios`);
  console.log(`   ${P} Passed: ${passed}`);
  console.log(`   ${W} Warnings: ${warned}`);
  console.log(`   ${F} Failed: ${failed}`);
  if (failed === 0) console.log('\n🎉 ALL TESTS PASSED!');
  else console.log(`\n⚠️ ${failed} failure(s) — review extraction prompt.`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
