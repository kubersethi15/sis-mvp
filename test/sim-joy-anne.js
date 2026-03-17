// SIM1 + SIM2: Joy Anne Pipeline Validation Test
// Extracts the conversation from Ryan's simulation doc,
// runs it through the 5-stage extraction pipeline,
// and compares output against Ryan's expected skills profile.
//
// Usage: ANTHROPIC_API_KEY=sk-... node test/sim-joy-anne.js

const fs = require('fs');
const path = require('path');

// ============================================================
// SIM1: Extract Joy Anne's conversation transcript
// ============================================================

function extractTranscript() {
  const simDoc = fs.readFileSync(
    path.join(__dirname, '..', 'docs', 'LEEE_Full_Simulation_JoyAnne_Cebuana.md'),
    'utf-8'
  );

  // Extract lines between "# THE CONVERSATION" and "# EXTRACTION PIPELINE OUTPUT"
  const conversationSection = simDoc.split('# THE CONVERSATION')[1]?.split('# EXTRACTION PIPELINE OUTPUT')[0];
  if (!conversationSection) throw new Error('Could not find conversation section in simulation doc');

  // Parse each turn
  const lines = conversationSection.split('\n');
  const turns = [];
  let currentSpeaker = null;
  let currentText = '';

  for (const line of lines) {
    const leeeMatch = line.match(/^\*\*LEEE\s*\[.*?\]:\*\*$/);
    const joyMatch = line.match(/^\*\*Joy Anne\s*\[.*?\]:\*\*$/);

    if (leeeMatch || joyMatch) {
      // Save previous turn
      if (currentSpeaker && currentText.trim()) {
        turns.push({ role: currentSpeaker, content: currentText.trim() });
      }
      currentSpeaker = leeeMatch ? 'assistant' : 'user';
      currentText = '';
    } else if (currentSpeaker && line.trim() && !line.startsWith('---') && !line.startsWith('###') && !line.startsWith('```') && !line.startsWith('**Coverage') && !line.startsWith('**Gap') && !line.startsWith('**Bridge')) {
      currentText += (currentText ? '\n' : '') + line.trim();
    }
  }
  // Last turn
  if (currentSpeaker && currentText.trim()) {
    turns.push({ role: currentSpeaker, content: currentText.trim() });
  }

  // Build transcript string
  const transcript = turns
    .map(t => `${t.role === 'assistant' ? 'AI' : 'User'}: ${t.content}`)
    .join('\n');

  console.log(`\n📋 Extracted ${turns.length} conversation turns`);
  console.log(`   User turns: ${turns.filter(t => t.role === 'user').length}`);
  console.log(`   AI turns: ${turns.filter(t => t.role === 'assistant').length}`);
  console.log(`   Transcript length: ${transcript.length} chars\n`);

  return { turns, transcript };
}

// ============================================================
// Ryan's Expected Output (from the simulation doc)
// ============================================================

const EXPECTED = {
  stage1_episode_count: 5,
  stage2_evidence_count: 7,
  stage3_mapping_count: 12,

  vacancy_aligned_skills: {
    'Communication': { proficiency: 'INTERMEDIATE', min_confidence: 0.85 },
    'Self Management': { proficiency: 'INTERMEDIATE', min_confidence: 0.85 },
    'Problem Solving': { proficiency: 'INTERMEDIATE', min_confidence: 0.75 },
    'Collaboration': { proficiency: 'BASIC', min_confidence: 0.65 },
    'Customer Orientation': { proficiency: 'BASIC', min_confidence: 0.50 },
  },

  additional_skills: {
    'Adaptability': { proficiency: 'INTERMEDIATE', min_confidence: 0.80 },
    'Building Inclusivity': { proficiency: 'INTERMEDIATE', min_confidence: 0.75 },
    'Developing People': { proficiency: 'BASIC', min_confidence: 0.45 },
  },

  skills_not_assessed_should_include: [
    'Digital Fluency', 'Global Perspective', 'Creative Thinking',
    'Decision Making', 'Sense Making', 'Transdisciplinary Thinking',
    'Influence', 'Learning Agility',
  ],

  disability_uplift_count: 3,
  self_deprecation_overrides: 0,
  anti_gaming_flags: 0,
};

// ============================================================
// SIM2: Run the 5-stage pipeline
// ============================================================

async function callClaude(prompt, maxTokens = 4000, model = 'claude-sonnet-4-20250514') {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable required');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || '';
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (firstError) {
    // Repair truncated JSON
    let repaired = cleaned;
    const openQuotes = (repaired.match(/"/g) || []).length;
    if (openQuotes % 2 !== 0) repaired += '"';

    let openBraces = 0, openBrackets = 0, inString = false;
    for (let i = 0; i < repaired.length; i++) {
      const ch = repaired[i];
      if (ch === '"' && (i === 0 || repaired[i-1] !== '\\')) inString = !inString;
      if (!inString) {
        if (ch === '{') openBraces++;
        if (ch === '}') openBraces--;
        if (ch === '[') openBrackets++;
        if (ch === ']') openBrackets--;
      }
    }
    repaired = repaired.replace(/,\s*$/, '');
    for (let i = 0; i < openBrackets; i++) repaired += ']';
    for (let i = 0; i < openBraces; i++) repaired += '}';

    try {
      console.warn(`   ⚠️  JSON repaired — output may have been truncated`);
      return JSON.parse(repaired);
    } catch (secondError) {
      const match = cleaned.match(/[\[{][\s\S]*[\]}]/);
      if (match) {
        try { return JSON.parse(match[0]); } catch {}
      }
      throw new Error(`Failed to parse JSON: ${cleaned.substring(0, 200)}`);
    }
  }
}

async function runPipeline(transcript) {
  // Load prompts
  const pipelineFile = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'lib', 'extraction-pipeline.ts'),
    'utf-8'
  );

  // Extract prompt strings (they're template literals between backticks)
  function extractPrompt(varName) {
    const regex = new RegExp(`export const ${varName} = \`([\\s\\S]*?)\`;`);
    const match = pipelineFile.match(regex);
    if (!match) throw new Error(`Could not find ${varName} in extraction-pipeline.ts`);
    return match[1];
  }

  const STAGE_1 = extractPrompt('STAGE_1_SEGMENTATION');
  const STAGE_2 = extractPrompt('STAGE_2_STAR_ER');
  const STAGE_3 = extractPrompt('STAGE_3_SKILL_MAPPING');
  const STAGE_4 = extractPrompt('STAGE_4_CONSISTENCY');
  const STAGE_5 = extractPrompt('STAGE_5_PROFICIENCY');

  const vacancySkills = 'Customer Orientation, Communication, Self Management, Collaboration, Problem Solving';
  const timing = {};
  const results = {};

  // ── STAGE 1 ──
  console.log('⏳ Stage 1: Narrative Segmentation...');
  let t0 = Date.now();
  const s1Prompt = STAGE_1.replace('{transcript}', transcript);
  results.stage1 = await callClaude(s1Prompt, 3000);
  timing.stage1 = Date.now() - t0;
  const qualified = results.stage1.filter(ep => ep.type === 'episode' && ep.specificity_level !== 'vague');
  console.log(`   ✅ ${results.stage1.length} episodes found, ${qualified.length} qualified (${timing.stage1}ms)`);

  // ── STAGE 2 ──
  console.log('⏳ Stage 2: STAR+E+R Evidence Extraction...');
  t0 = Date.now();
  const s2Prompt = STAGE_2.replace('{episodes}', JSON.stringify(qualified, null, 2));
  results.stage2 = await callClaude(s2Prompt, 4000, 'claude-opus-4-5');
  timing.stage2 = Date.now() - t0;
  console.log(`   ✅ ${results.stage2.length} evidence items extracted (${timing.stage2}ms)`);

  // ── STAGE 3 ──
  console.log('⏳ Stage 3: Skill Mapping to PSF...');
  t0 = Date.now();
  const s3Prompt = STAGE_3
    .replace('{evidence}', JSON.stringify(results.stage2, null, 2))
    .replace('{vacancy_skills}', vacancySkills);
  results.stage3 = await callClaude(s3Prompt, 4000, 'claude-opus-4-5');
  timing.stage3 = Date.now() - t0;
  console.log(`   ✅ ${results.stage3.length} skill mappings (${timing.stage3}ms)`);

  // ── STAGE 4 ──
  console.log('⏳ Stage 4: Consistency Check...');
  t0 = Date.now();
  const s4Prompt = STAGE_4
    .replace('{mappings}', JSON.stringify(results.stage3, null, 2))
    .replace('{evidence}', JSON.stringify(results.stage2, null, 2));
  results.stage4 = await callClaude(s4Prompt, 3000);
  timing.stage4 = Date.now() - t0;
  console.log(`   ✅ Consistency check complete (${timing.stage4}ms)`);

  // ── STAGE 5 ──
  console.log('⏳ Stage 5: Proficiency Scoring...');
  t0 = Date.now();
  const s5Prompt = STAGE_5
    .replace('{validated_mappings}', JSON.stringify(results.stage4.validated_mappings || [], null, 2))
    .replace('{sufficiency}', JSON.stringify(results.stage4.skill_sufficiency_summary || {}, null, 2))
    .replace('{evidence}', JSON.stringify(results.stage2, null, 2))
    .replace('{episodes}', JSON.stringify(qualified, null, 2))
    .replace('{vacancy_skills}', vacancySkills);
  results.stage5 = await callClaude(s5Prompt, 8000, 'claude-opus-4-5');
  timing.stage5 = Date.now() - t0;
  console.log(`   ✅ Final profile generated (${timing.stage5}ms)`);

  timing.total = Object.values(timing).reduce((a, b) => a + b, 0);
  console.log(`\n⏱️  Total pipeline time: ${timing.total}ms (${(timing.total / 1000).toFixed(1)}s)\n`);

  return { results, timing };
}

// ============================================================
// COMPARISON & REPORT
// ============================================================

function compareResults(actual, expected) {
  const report = {
    pass: true,
    checks: [],
    summary: '',
  };

  function check(name, condition, detail) {
    const passed = condition;
    report.checks.push({ name, passed, detail });
    if (!passed) report.pass = false;
    console.log(`   ${passed ? '✅' : '❌'} ${name}: ${detail}`);
  }

  console.log('\n📊 COMPARISON REPORT\n');

  // Stage 1: Episode count
  const episodeCount = actual.results.stage1?.length || 0;
  check('Stage 1: Episode count',
    Math.abs(episodeCount - expected.stage1_episode_count) <= 2,
    `Got ${episodeCount}, expected ~${expected.stage1_episode_count} (±2 tolerance)`);

  // Stage 2: Evidence count
  const evidenceCount = actual.results.stage2?.length || 0;
  check('Stage 2: Evidence count',
    Math.abs(evidenceCount - expected.stage2_evidence_count) <= 3,
    `Got ${evidenceCount}, expected ~${expected.stage2_evidence_count} (±3 tolerance)`);

  // Stage 3: Mapping count
  const mappingCount = actual.results.stage3?.length || 0;
  check('Stage 3: Mapping count',
    Math.abs(mappingCount - expected.stage3_mapping_count) <= 4,
    `Got ${mappingCount}, expected ~${expected.stage3_mapping_count} (±4 tolerance)`);

  // Stage 5: Vacancy-aligned skills
  const profile = actual.results.stage5;
  const vacancySkills = profile?.vacancy_aligned_skills || [];
  const additionalSkills = profile?.additional_skills_evidenced || [];
  const allSkills = [...vacancySkills, ...additionalSkills];

  console.log('\n   --- Vacancy-Aligned Skills ---');
  for (const [skillName, expected_] of Object.entries(expected.vacancy_aligned_skills)) {
    const found = allSkills.find(s => s.skill_name?.toLowerCase().includes(skillName.toLowerCase()));
    if (found) {
      const profMatch = found.proficiency?.toUpperCase() === expected_.proficiency;
      check(`${skillName} proficiency`,
        profMatch,
        `Got ${found.proficiency}, expected ${expected_.proficiency}`);
    } else {
      check(`${skillName} found`, false, 'Skill not found in output');
    }
  }

  console.log('\n   --- Additional Skills ---');
  for (const [skillName, expected_] of Object.entries(expected.additional_skills)) {
    const found = allSkills.find(s => s.skill_name?.toLowerCase().includes(skillName.toLowerCase()));
    if (found) {
      const profMatch = found.proficiency?.toUpperCase() === expected_.proficiency;
      check(`${skillName} proficiency`,
        profMatch,
        `Got ${found.proficiency}, expected ${expected_.proficiency}`);
    } else {
      check(`${skillName} found`, false, 'Skill not found in output');
    }
  }

  // Skills not assessed
  console.log('\n   --- Not Assessed ---');
  const notAssessed = profile?.skills_not_assessed || [];
  for (const skill of expected.skills_not_assessed_should_include) {
    const found = notAssessed.some(s => s.toLowerCase().includes(skill.toLowerCase()));
    check(`${skill} marked not_assessed`, found, found ? 'Correctly not assessed' : `Missing from not_assessed list`);
  }

  // Metadata
  console.log('\n   --- Session Metadata ---');
  const meta = profile?.session_metadata || {};
  check('Stories completed', (meta.stories_completed || 0) >= 2, `Got ${meta.stories_completed || 0}, expected ≥2`);

  // Psychologist flags
  const flags = profile?.psychologist_review_flags || [];
  console.log(`\n   📋 Psychologist review flags: ${flags.length}`);
  flags.forEach(f => console.log(`      • ${typeof f === 'string' ? f.substring(0, 100) : JSON.stringify(f).substring(0, 100)}`));

  // Hiring manager summary
  const summary = profile?.hiring_manager_summary || '';
  check('Hiring manager summary exists', summary.length > 50, `${summary.length} chars`);

  // Overall
  const passCount = report.checks.filter(c => c.passed).length;
  const totalChecks = report.checks.length;
  report.summary = `${passCount}/${totalChecks} checks passed (${Math.round(passCount/totalChecks*100)}%)`;

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`📊 RESULT: ${report.summary}`);
  console.log(`   ${report.pass ? '✅ PIPELINE VALIDATION PASSED' : '⚠️  PIPELINE NEEDS REVIEW — some checks failed'}`);
  console.log(`${'═'.repeat(60)}\n`);

  return report;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('═'.repeat(60));
  console.log('🧪 KAYA — Joy Anne Pipeline Validation (SIM1 + SIM2)');
  console.log('═'.repeat(60));

  // SIM1: Extract transcript
  console.log('\n📖 SIM1: Extracting Joy Anne conversation transcript...');
  const { transcript } = extractTranscript();

  // SIM2: Run pipeline
  console.log('🔬 SIM2: Running 5-stage extraction pipeline...\n');
  const actual = await runPipeline(transcript);

  // Compare
  const report = compareResults(actual, EXPECTED);

  // Save full output for Ryan
  const outputPath = path.join(__dirname, '..', 'test', 'sim-joy-anne-output.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify({
    test_date: new Date().toISOString(),
    transcript_turns: extractTranscript().turns.length,
    pipeline_timing: actual.timing,
    stage_outputs: actual.results,
    comparison: report,
  }, null, 2));

  console.log(`💾 Full output saved to: ${outputPath}`);
  console.log('   → Send this file to Ryan for review\n');

  // Also save a human-readable report
  const reportPath = path.join(__dirname, '..', 'test', 'sim-joy-anne-report.md');
  const profile = actual.results.stage5;
  let md = `# Joy Anne Pipeline Validation Report\n`;
  md += `## Date: ${new Date().toISOString()}\n\n`;
  md += `## Pipeline Timing\n`;
  for (const [stage, ms] of Object.entries(actual.timing)) {
    md += `- ${stage}: ${ms}ms\n`;
  }
  md += `\n## Result: ${report.summary}\n\n`;
  md += `## Hiring Manager Summary\n${profile?.hiring_manager_summary || 'N/A'}\n\n`;
  md += `## Skills Profile\n`;
  md += `### Vacancy-Aligned\n`;
  for (const s of (profile?.vacancy_aligned_skills || [])) {
    md += `- **${s.skill_name}**: ${s.proficiency} (evidence: ${s.evidence_count}, sufficiency: ${s.sufficiency})\n`;
    if (s.proficiency_justification) md += `  _${s.proficiency_justification}_\n`;
  }
  md += `\n### Additional Skills\n`;
  for (const s of (profile?.additional_skills_evidenced || [])) {
    md += `- **${s.skill_name}**: ${s.proficiency}\n`;
  }
  md += `\n### Not Assessed\n`;
  for (const s of (profile?.skills_not_assessed || [])) {
    md += `- ${s}\n`;
  }
  md += `\n## Psychologist Review Flags\n`;
  for (const f of (profile?.psychologist_review_flags || [])) {
    md += `- ${typeof f === 'string' ? f : JSON.stringify(f)}\n`;
  }
  md += `\n## Scoring Reasoning Trace\n`;
  md += `_This section shows HOW the pipeline reasoned about each proficiency assignment. When a psychologist or reviewer disagrees, read the reasoning to understand where the logic should be refined._\n\n`;
  for (const r of (profile?.scoring_reasoning_trace || [])) {
    md += `### ${r.skill_name}: ${r.level_assigned} (confidence: ${r.confidence_in_assignment})\n`;
    md += `**Reasoning:** ${r.reasoning}\n`;
    if (r.alternative_considered) md += `**Alternative considered:** ${r.alternative_considered}\n`;
    md += `\n`;
  }
  md += `\n## Check Results\n`;
  for (const c of report.checks) {
    md += `- ${c.passed ? '✅' : '❌'} ${c.name}: ${c.detail}\n`;
  }

  fs.writeFileSync(reportPath, md);
  console.log(`📄 Human-readable report: ${reportPath}`);
  console.log('   → This is what you share with Ryan\n');
}

main().catch(e => {
  console.error('❌ Test failed:', e.message);
  process.exit(1);
});
