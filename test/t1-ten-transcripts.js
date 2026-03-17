// T1: Ryan's 10 MVP Transcripts — Extraction Validation
// Runs all 10 transcripts through Stages 1-3 of the pipeline
// (Short transcripts don't have enough data for meaningful Stage 4-5)
// Then checks: did the pipeline find the skills Ryan expected?
//
// Usage: ANTHROPIC_API_KEY=sk-... node test/t1-ten-transcripts.js

const fs = require('fs');
const path = require('path');

// ============================================================
// RYAN'S 10 TRANSCRIPTS WITH EXPECTED SKILLS
// ============================================================

const TRANSCRIPTS = [
  {
    id: 1,
    title: 'Disability Navigation and Online Selling',
    transcript: `AI: Tell me about a time you faced a barrier while working.
User: I sell products online and sometimes meet customers at the train station.
User: One time the elevator was broken and I use a wheelchair.
AI: What was the first thing you thought when you saw the elevator was broken?
User: I thought I might miss the customer and lose the sale.
AI: What options did you think about?
User: I could cancel, move the meeting place, or ask the guard for help.
AI: What did you decide to do?
User: I messaged the customer and asked if we could meet at another entrance.
AI: What happened next?
User: I asked the guard if there was another way to exit. He showed me a side entrance.
AI: What was the result?
User: I was late but I still met the customer and finished the sale.
AI: What did you learn from that experience?
User: I learned to always have a backup plan for deliveries.`,
    expected_skills: ['Communication', 'Problem Solving', 'Adaptability', 'Customer Orientation'],
    context: 'PWD wheelchair user, online seller, informal economy'
  },
  {
    id: 2,
    title: 'Food Stall Equipment Failure',
    transcript: `AI: Tell me about a time something went wrong while you were working.
User: I run a small food stall at night.
User: One time the gas tank stopped working while many customers were waiting.
AI: What did you do first?
User: I checked the stove and switched to a smaller backup stove.
AI: What options did you consider?
User: Cancel orders or cook slowly using the backup stove.
AI: What did you decide?
User: I explained the problem to the customers and cooked in smaller batches.
AI: How did people react?
User: Most customers stayed because I told them the situation honestly.
AI: What did you learn?
User: Clear communication helps people stay patient.`,
    expected_skills: ['Problem Solving', 'Communication', 'Customer Orientation'],
    context: 'Informal economy, food stall operator, night work'
  },
  {
    id: 3,
    title: 'Student with Family Responsibility',
    transcript: `AI: Tell me about a time you had many responsibilities at once.
User: I was finishing a school project while helping take care of my younger siblings.
AI: What was difficult about that situation?
User: I had to cook dinner and also finish my project before the deadline.
AI: What did you do first?
User: I planned my time and worked on the project while the food was cooking.
AI: Did anyone help you?
User: I asked my sister to watch the younger kids for a short time.
AI: What was the result?
User: I finished the project and still helped my family.
AI: What did you learn?
User: Planning and asking for help makes things possible.`,
    expected_skills: ['Self Management', 'Collaboration'],
    context: 'Student, caregiver, family responsibility'
  },
  {
    id: 4,
    title: 'Community Volunteer Conflict',
    transcript: `AI: Tell me about a time people disagreed and you had to help solve it.
User: I helped organize a barangay sports event.
User: Two teams argued about the rules.
AI: What did you do?
User: I listened to both sides first.
AI: What happened next?
User: I explained the rules clearly and suggested replaying the round.
AI: Did the teams agree?
User: Yes, both teams accepted the decision.
AI: What did you learn?
User: Listening first helps people accept solutions.`,
    expected_skills: ['Collaboration', 'Communication', 'Emotional Intelligence'],
    context: 'Community volunteer, barangay event, conflict mediation'
  },
  {
    id: 5,
    title: 'Small Online Business Stock Shortage',
    transcript: `AI: Tell me about a time you had to deal with a shortage or limited resources.
User: I sell clothes online and once I ran out of stock for a popular item.
AI: What did you do?
User: I contacted customers who ordered and explained the delay.
AI: What options did you consider?
User: Cancel the order or offer a different item.
AI: What did you decide?
User: I offered a similar item with a discount.
AI: What happened?
User: Many customers accepted the alternative.
AI: What did you learn?
User: Being flexible helps keep customers.`,
    expected_skills: ['Customer Orientation', 'Adaptability', 'Communication'],
    context: 'Online seller, small business, customer management'
  },
  {
    id: 6,
    title: 'Learning a New Digital Tool',
    transcript: `AI: Tell me about a time you had to learn something new quickly.
User: My job asked me to start using a new delivery app.
AI: What was difficult about it?
User: I had never used that app before.
AI: What did you do to learn it?
User: I watched tutorial videos and practiced using it.
AI: What was the result?
User: After a few days I could accept orders and track deliveries easily.
AI: What did you learn?
User: Trying and practicing helps you learn new tools.`,
    expected_skills: ['Learning Agility', 'Digital Fluency', 'Self Management'],
    context: 'Delivery worker, learning new technology'
  },
  {
    id: 7,
    title: 'Difficult Customer Interaction',
    transcript: `AI: Tell me about a time you had to deal with an upset customer.
User: A customer complained about a late delivery.
AI: What did you do?
User: I listened and apologized first.
AI: What happened next?
User: I explained the delivery problem and offered a small discount.
AI: How did the customer react?
User: The customer calmed down and accepted the solution.
AI: What did you learn?
User: Staying calm helps solve customer problems.`,
    expected_skills: ['Communication', 'Emotional Intelligence', 'Customer Orientation'],
    context: 'Customer service, complaint resolution'
  },
  {
    id: 8,
    title: 'Volunteer Event Organization',
    transcript: `AI: Tell me about a time you organized something for a group.
User: I helped organize a small community clean-up event.
AI: What was your role?
User: I coordinated volunteers and supplies.
AI: What challenges did you face?
User: Some volunteers arrived late and supplies were limited.
AI: What did you do?
User: I divided people into smaller groups and shared tools.
AI: What was the result?
User: The clean-up activity was still successful.
AI: What did you learn?
User: Good coordination helps even when resources are limited.`,
    expected_skills: ['Collaboration', 'Problem Solving'],
    context: 'Community organizer, volunteer coordination'
  },
  {
    id: 9,
    title: 'Ethical Decision',
    transcript: `AI: Tell me about a time you had to make a difficult decision.
User: At work I noticed a mistake in the inventory record.
AI: What did you do?
User: I checked the records carefully.
AI: What options did you consider?
User: Ignore it or report it to my supervisor.
AI: What did you decide?
User: I reported it so it could be corrected.
AI: What happened next?
User: My supervisor thanked me for being honest.
AI: What did you learn?
User: Being honest protects the team.`,
    expected_skills: ['Decision Making'],
    context: 'Workplace ethics, integrity, inventory work'
  },
  {
    id: 10,
    title: 'Transportation Delay',
    transcript: `AI: Tell me about a time a delay affected your work.
User: My commute was delayed because of heavy traffic.
AI: What did you do?
User: I informed my supervisor early.
AI: What happened next?
User: I started preparing my tasks on my phone while in transit.
AI: What was the result?
User: I was able to continue work quickly when I arrived.
AI: What did you learn?
User: Preparing early helps reduce delays.`,
    expected_skills: ['Adaptability', 'Communication', 'Self Management'],
    context: 'Commuter, proactive communication'
  },
];

// ============================================================
// CLAUDE API HELPER
// ============================================================

async function callClaude(prompt, maxTokens = 3000, model = 'claude-sonnet-4-20250514') {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY required');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, messages: [{ role: 'user', content: prompt }] }),
  });

  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // Repair truncated JSON
    let repaired = cleaned;
    if ((repaired.match(/"/g) || []).length % 2 !== 0) repaired += '"';
    let ob = 0, oq = 0, inStr = false;
    for (const ch of repaired) {
      if (ch === '"') inStr = !inStr;
      if (!inStr) { if (ch === '{') ob++; if (ch === '}') ob--; if (ch === '[') oq++; if (ch === ']') oq--; }
    }
    repaired = repaired.replace(/,\s*$/, '');
    for (let i = 0; i < oq; i++) repaired += ']';
    for (let i = 0; i < ob; i++) repaired += '}';
    try { return JSON.parse(repaired); } catch {}

    const match = cleaned.match(/[\[{][\s\S]*[\]}]/);
    if (match) try { return JSON.parse(match[0]); } catch {}
    throw new Error(`JSON parse failed: ${cleaned.substring(0, 150)}`);
  }
}

// ============================================================
// LOAD PIPELINE PROMPTS
// ============================================================

function loadPrompts() {
  const file = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'extraction-pipeline.ts'), 'utf-8');
  function extract(name) {
    const match = file.match(new RegExp(`export const ${name} = \`([\\s\\S]*?)\`;`));
    if (!match) throw new Error(`Prompt ${name} not found`);
    return match[1];
  }
  return {
    stage1: extract('STAGE_1_SEGMENTATION'),
    stage2: extract('STAGE_2_STAR_ER'),
    stage3: extract('STAGE_3_SKILL_MAPPING'),
  };
}

// ============================================================
// RUN STAGES 1-3 FOR A SINGLE TRANSCRIPT
// ============================================================

async function runExtraction(transcript, vacancySkills = '') {
  const prompts = loadPrompts();

  // Stage 1
  const s1 = await callClaude(prompts.stage1.replace('{transcript}', transcript), 2000);
  const qualified = (Array.isArray(s1) ? s1 : []).filter(ep => ep.type === 'episode' && ep.specificity_level !== 'vague');

  if (qualified.length === 0) return { episodes: 0, evidence: 0, skills: [], error: 'No qualified episodes' };

  // Stage 2
  const s2 = await callClaude(
    prompts.stage2.replace('{episodes}', JSON.stringify(qualified)),
    3000, 'claude-opus-4-5'
  );

  // Stage 3
  const s3 = await callClaude(
    prompts.stage3.replace('{evidence}', JSON.stringify(s2)).replace('{vacancy_skills}', vacancySkills || 'Map all skills'),
    3000, 'claude-opus-4-5'
  );

  // Extract unique skills found
  const skillsFound = [...new Set((Array.isArray(s3) ? s3 : []).map(m => m.skill_name))];

  return {
    episodes: qualified.length,
    evidence: Array.isArray(s2) ? s2.length : 0,
    mappings: Array.isArray(s3) ? s3.length : 0,
    skills: skillsFound,
    raw: { s1, s2, s3 },
  };
}

// ============================================================
// MAIN — RUN ALL 10 TRANSCRIPTS
// ============================================================

async function main() {
  console.log('═'.repeat(60));
  console.log('🧪 KAYA — T1: Ryan\'s 10 MVP Transcripts Validation');
  console.log('═'.repeat(60));
  console.log(`Running Stages 1-3 on ${TRANSCRIPTS.length} transcripts...\n`);

  const results = [];
  let totalSkillsExpected = 0;
  let totalSkillsFound = 0;
  let totalSkillsMatched = 0;

  for (const t of TRANSCRIPTS) {
    process.stdout.write(`⏳ Transcript ${t.id}: ${t.title}...`);
    const start = Date.now();

    try {
      const result = await runExtraction(t.transcript);
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);

      // Check which expected skills were found
      const matched = [];
      const missed = [];
      const extra = [];

      for (const expected of t.expected_skills) {
        const found = result.skills.some(s =>
          s.toLowerCase().includes(expected.toLowerCase()) ||
          expected.toLowerCase().includes(s.toLowerCase()) ||
          // Handle aliases
          (expected === 'Emotional Intelligence' && (s.includes('Self-Management') || s.includes('Self Management') || s.includes('Influence'))) ||
          (expected === 'Planning' && (s.includes('Self-Management') || s.includes('Decision Making')))
        );
        if (found) { matched.push(expected); totalSkillsMatched++; }
        else missed.push(expected);
        totalSkillsExpected++;
      }

      for (const found of result.skills) {
        const isExpected = t.expected_skills.some(e =>
          found.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(found.toLowerCase())
        );
        if (!isExpected) extra.push(found);
        totalSkillsFound++;
      }

      const pass = missed.length === 0;
      console.log(` ${pass ? '✅' : '⚠️ '} ${elapsed}s | ${result.episodes}ep ${result.evidence}ev ${result.mappings}map | ${matched.length}/${t.expected_skills.length} skills`);
      if (missed.length) console.log(`      MISSED: ${missed.join(', ')}`);
      if (extra.length) console.log(`      EXTRA: ${extra.join(', ')}`);

      results.push({ ...t, result, matched, missed, extra, pass, elapsed });
    } catch (e) {
      console.log(` ❌ ERROR: ${e.message}`);
      results.push({ ...t, error: e.message, pass: false });
    }
  }

  // ── SUMMARY ──
  const passCount = results.filter(r => r.pass).length;
  const allMatched = results.reduce((a, r) => a + (r.matched?.length || 0), 0);
  const allExpected = results.reduce((a, r) => a + (r.expected_skills?.length || 0), 0);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 RESULTS: ${passCount}/${TRANSCRIPTS.length} transcripts fully matched`);
  console.log(`   Skills: ${allMatched}/${allExpected} expected skills found (${Math.round(allMatched/allExpected*100)}%)`);
  console.log(`${'═'.repeat(60)}\n`);

  // ── SAVE REPORT ──
  let md = `# T1: Ryan's 10 MVP Transcripts — Extraction Validation\n`;
  md += `## Date: ${new Date().toISOString()}\n\n`;
  md += `## Overall: ${passCount}/${TRANSCRIPTS.length} transcripts fully matched | ${allMatched}/${allExpected} skills found (${Math.round(allMatched/allExpected*100)}%)\n\n`;

  for (const r of results) {
    md += `### Transcript ${r.id}: ${r.title}\n`;
    md += `- Context: ${r.context}\n`;
    md += `- Expected: ${r.expected_skills.join(', ')}\n`;
    if (r.error) {
      md += `- **ERROR**: ${r.error}\n\n`;
      continue;
    }
    md += `- Found: ${r.result.skills.join(', ')}\n`;
    md += `- Matched: ${r.matched.join(', ') || 'none'}\n`;
    if (r.missed.length) md += `- **Missed**: ${r.missed.join(', ')}\n`;
    if (r.extra.length) md += `- Extra (bonus): ${r.extra.join(', ')}\n`;
    md += `- Pipeline: ${r.result.episodes} episodes, ${r.result.evidence} evidence items, ${r.result.mappings} mappings\n`;
    md += `- Time: ${r.elapsed}s\n`;
    md += `- Result: ${r.pass ? '✅ PASS' : '⚠️ PARTIAL'}\n\n`;
  }

  // Analysis section
  md += `## Analysis\n\n`;

  const allMissed = results.flatMap(r => r.missed || []);
  const missedCounts = {};
  allMissed.forEach(s => { missedCounts[s] = (missedCounts[s] || 0) + 1; });
  if (Object.keys(missedCounts).length) {
    md += `### Most Frequently Missed Skills\n`;
    for (const [skill, count] of Object.entries(missedCounts).sort((a, b) => b[1] - a[1])) {
      md += `- ${skill}: missed ${count} time(s)\n`;
    }
    md += `\n`;
  }

  const allExtra = results.flatMap(r => r.extra || []);
  const extraCounts = {};
  allExtra.forEach(s => { extraCounts[s] = (extraCounts[s] || 0) + 1; });
  if (Object.keys(extraCounts).length) {
    md += `### Skills Found That Weren't Expected (bonus evidence)\n`;
    for (const [skill, count] of Object.entries(extraCounts).sort((a, b) => b[1] - a[1])) {
      md += `- ${skill}: found ${count} time(s)\n`;
    }
    md += `\n`;
  }

  md += `### Observations\n`;
  md += `- These are SHORT transcripts (5-7 turns each) — real LEEE sessions will be 20-40 turns\n`;
  md += `- Stages 1-3 only (no consistency check or proficiency scoring) — appropriate for transcript length\n`;
  md += `- "Extra" skills are not errors — they show the pipeline found evidence Ryan didn't explicitly list\n`;
  md += `- "Missed" skills need investigation — either the evidence is too thin or the pipeline needs calibration\n`;

  const reportPath = path.join(__dirname, 't1-ten-transcripts-report.md');
  fs.writeFileSync(reportPath, md);
  console.log(`📄 Report saved: ${reportPath}`);

  const jsonPath = path.join(__dirname, 't1-ten-transcripts-output.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`💾 Full data: ${jsonPath}\n`);
}

main().catch(e => {
  console.error('❌ Test failed:', e.message);
  process.exit(1);
});
