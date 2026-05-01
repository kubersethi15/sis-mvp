/**
 * KAYA — Stage 5 A/B Comparison Runner
 * =====================================
 *
 * Runs the same transcript through Stages 1–4, then runs BOTH Stage 5
 * versions (old holistic-level vs new Mischel-Shoda signature) and
 * outputs a side-by-side comparison.
 *
 * Purpose: evaluate the methodology change on real transcripts before
 * committing to the redesign. Lets Ryan, the psychologist, and the
 * team see exactly what each version produces from identical input.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=key npx ts-node scripts/mischel-test/ab-runner.ts \
 *     --transcript path/to/transcript.txt
 *
 *   ANTHROPIC_API_KEY=key npx ts-node scripts/mischel-test/ab-runner.ts
 *   (uses built-in sample transcript)
 *
 * Output:
 *   - Console: side-by-side comparison
 *   - File: scripts/mischel-test/results/comparison-<timestamp>.json
 *   - File: scripts/mischel-test/results/comparison-<timestamp>.md
 *     (human-readable, can be shared with Ryan/psychologist)
 */

import * as fs from 'fs';
import * as path from 'path';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY environment variable not set.');
  process.exit(1);
}

// ─── PIPELINE PROMPT LOADER ──────────────────────────────────────────────────
// Reads the production prompts from extraction-pipeline.ts so we always test
// against current state, not stale copies.

function loadProductionPrompts() {
  const pipelinePath = path.join(__dirname, '../../src/lib/extraction-pipeline.ts');
  if (!fs.existsSync(pipelinePath)) {
    throw new Error(`extraction-pipeline.ts not found at ${pipelinePath}`);
  }
  const source = fs.readFileSync(pipelinePath, 'utf-8');

  function extract(varName: string): string {
    const re = new RegExp(`export const ${varName} = \`([\\s\\S]*?)\`;`, 'm');
    const m = source.match(re);
    if (!m) throw new Error(`Could not extract ${varName} from pipeline source`);
    return m[1];
  }

  return {
    stage1: extract('STAGE_1_SEGMENTATION'),
    stage2: extract('STAGE_2_STAR_ER'),
    stage3: extract('STAGE_3_SKILL_MAPPING'),
    stage4: extract('STAGE_4_CONSISTENCY'),
    stage5_old: extract('STAGE_5_PROFICIENCY'),
  };
}

function loadNewPrompts() {
  const newPath = path.join(__dirname, '../../src/lib/mischel/stage5-signature.ts');
  const source = fs.readFileSync(newPath, 'utf-8');

  function extract(varName: string): string {
    const re = new RegExp(`export const ${varName} = \`([\\s\\S]*?)\`;`, 'm');
    const m = source.match(re);
    if (!m) throw new Error(`Could not extract ${varName} from mischel source`);
    return m[1];
  }

  return {
    stage3_situation_features: extract('STAGE_3_SITUATION_FEATURES_ADDITION'),
    stage5_new: extract('STAGE_5_SIGNATURE'),
  };
}

// ─── ANTHROPIC API CALLER ────────────────────────────────────────────────────

async function callClaude(prompt: string, model: string, maxTokens: number): Promise<any> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }
  const data = await response.json();
  const text = data.content[0]?.text || '';
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse JSON: ${text.substring(0, 300)}`);
  }
}

// ─── SHARED PIPELINE STAGES 1–4 ──────────────────────────────────────────────
// Both A and B variants share these stages. Only Stage 5 differs.
// (Stage 3 gets the situation_features addition for the B variant.)

async function runSharedStages(transcript: string, prompts: ReturnType<typeof loadProductionPrompts>, augmentStage3WithFeatures: boolean, newPrompts: ReturnType<typeof loadNewPrompts>) {
  console.log('  Stage 1: segmentation...');
  const episodes = await callClaude(
    prompts.stage1.replace('{transcript}', transcript),
    'claude-sonnet-4-20250514',
    3000
  );
  const qualified = (episodes as any[]).filter(
    (ep: any) => ep.type === 'episode' && ep.specificity_level !== 'vague'
  );
  if (qualified.length === 0) {
    throw new Error('No qualified episodes found in transcript.');
  }
  console.log(`    → ${qualified.length} qualified episodes`);

  console.log('  Stage 2: STAR+E+R extraction...');
  const evidence = await callClaude(
    prompts.stage2.replace('{episodes}', JSON.stringify(qualified, null, 2)),
    'claude-opus-4-5',
    4000
  );
  console.log(`    → ${(evidence as any[]).length} evidence items`);

  console.log('  Stage 3: skill mapping' + (augmentStage3WithFeatures ? ' (with situation_features)' : '') + '...');
  let stage3Prompt = prompts.stage3
    .replace('{evidence}', JSON.stringify(evidence, null, 2))
    .replace('{vacancy_skills}', 'No vacancy — map all skills evidenced.');
  if (augmentStage3WithFeatures) {
    stage3Prompt = stage3Prompt + '\n\n' + newPrompts.stage3_situation_features;
  }
  const mappings = await callClaude(stage3Prompt, 'claude-opus-4-5', 4000);
  console.log(`    → ${(mappings as any[]).length} mappings`);

  console.log('  Stage 4: consistency check...');
  const validated = await callClaude(
    prompts.stage4
      .replace('{mappings}', JSON.stringify(mappings, null, 2))
      .replace('{evidence}', JSON.stringify(evidence, null, 2)),
    'claude-sonnet-4-20250514',
    3000
  );
  console.log(`    → ${(validated as any).validated_mappings?.length || 0} validated mappings`);

  return { episodes: qualified, evidence, mappings, validated };
}

// ─── STAGE 5 VARIANT A (current, holistic levels) ─────────────────────────────

async function runStage5_A(
  shared: any,
  prompts: ReturnType<typeof loadProductionPrompts>
): Promise<any> {
  console.log('  Stage 5A (current — holistic levels)...');
  const t0 = Date.now();
  const profile = await callClaude(
    prompts.stage5_old
      .replace('{validated_mappings}', JSON.stringify(shared.validated.validated_mappings || [], null, 2))
      .replace('{sufficiency}', JSON.stringify(shared.validated.skill_sufficiency_summary || {}, null, 2))
      .replace('{evidence}', JSON.stringify(shared.evidence, null, 2))
      .replace('{episodes}', JSON.stringify(shared.episodes, null, 2))
      .replace('{vacancy_skills}', 'No vacancy — show all skills evidenced.'),
    'claude-opus-4-5',
    8000
  );
  console.log(`    → completed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  return profile;
}

// ─── STAGE 5 VARIANT B (new, signature extraction) ───────────────────────────

async function runStage5_B(
  shared: any,
  newPrompts: ReturnType<typeof loadNewPrompts>
): Promise<any> {
  console.log('  Stage 5B (new — Mischel-Shoda signatures)...');
  const t0 = Date.now();
  const profile = await callClaude(
    newPrompts.stage5_new
      .replace('{validated_mappings}', JSON.stringify(shared.validated.validated_mappings || [], null, 2))
      .replace('{evidence}', JSON.stringify(shared.evidence, null, 2))
      .replace('{episodes}', JSON.stringify(shared.episodes, null, 2))
      .replace('{vacancy_skills}', 'No vacancy — show all skills with signatures.'),
    'claude-opus-4-5',
    8000
  );
  console.log(`    → completed in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  return profile;
}

// ─── COMPARISON RENDERING ────────────────────────────────────────────────────

function renderComparisonMarkdown(
  transcriptSource: string,
  variantA: any,
  variantB: any,
  timestampISO: string
): string {
  const lines: string[] = [];
  lines.push(`# Kaya Stage 5 A/B Comparison`);
  lines.push(``);
  lines.push(`**Transcript:** \`${transcriptSource}\``);
  lines.push(`**Run at:** ${timestampISO}`);
  lines.push(``);
  lines.push(`This document shows the same transcript scored two ways — current Stage 5 (holistic Basic/Intermediate/Advanced levels) and proposed Stage 5 (Mischel-Shoda if-then signatures). Use to evaluate whether the signature output preserves the information levels conveyed, plus more.`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  // ── Variant A summary ──
  lines.push(`## Variant A — Current (holistic proficiency levels)`);
  lines.push(``);
  if (variantA.hiring_manager_summary) {
    lines.push(`**Hiring manager summary:** ${variantA.hiring_manager_summary}`);
    lines.push(``);
  }

  const vA = (variantA.vacancy_aligned_skills || []).concat(variantA.additional_skills_evidenced || []);
  lines.push(`### Skills scored: ${vA.length}`);
  lines.push(``);
  vA.forEach((s: any) => {
    lines.push(`**${s.skill_name}** — ${s.proficiency} (confidence ${s.top_evidence?.adjusted_confidence ?? 'n/a'}, ${s.evidence_count} items, ${s.sufficiency} sufficiency)`);
    if (s.proficiency_justification) {
      lines.push(`  - *Justification:* ${s.proficiency_justification.substring(0, 250)}${s.proficiency_justification.length > 250 ? '...' : ''}`);
    }
    if (s.top_evidence?.transcript_quote) {
      lines.push(`  - *Top quote:* "${s.top_evidence.transcript_quote.substring(0, 200)}${s.top_evidence.transcript_quote.length > 200 ? '...' : ''}"`);
    }
    lines.push(``);
  });

  if (variantA.skills_not_assessed?.length) {
    lines.push(`**Not assessed:** ${variantA.skills_not_assessed.join(', ')}`);
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(``);

  // ── Variant B summary ──
  lines.push(`## Variant B — Proposed (Mischel-Shoda signatures)`);
  lines.push(``);
  if (variantB.candidate_summary_narrative) {
    lines.push(`**Candidate summary:** ${variantB.candidate_summary_narrative}`);
    lines.push(``);
  }

  const sigs = variantB.signatures_by_skill || [];
  lines.push(`### Skills with signatures: ${sigs.length}`);
  lines.push(``);

  sigs.forEach((skill: any) => {
    lines.push(`#### ${skill.skill_name}`);
    lines.push(`*Evidence: ${skill.evidence_count} items, ${skill.patterns?.length || 0} patterns, ${skill.single_observations?.length || 0} single observations*`);
    if (skill.internal_level_metadata?.derived_level) {
      lines.push(`*Internal level (metadata only): ${skill.internal_level_metadata.derived_level}*`);
    }
    lines.push(``);

    (skill.patterns || []).forEach((p: any) => {
      const ifFeatures = Object.entries(p.if_features || {})
        .map(([k, v]) => `${k}=${v}`)
        .join(', ');
      lines.push(`- **Pattern ${p.pattern_id}** (${p.pattern_strength}, ${p.support_count} narratives)`);
      lines.push(`  - *If:* ${ifFeatures}`);
      lines.push(`  - *Then:* ${p.then_action}`);
      if (p.cultural_marker) {
        lines.push(`  - *Cultural marker:* ${p.cultural_marker}`);
      }
      if (p.contradictions?.length) {
        lines.push(`  - *Contradictions:* ${JSON.stringify(p.contradictions)}`);
      }
      lines.push(``);
    });

    (skill.single_observations || []).forEach((o: any) => {
      lines.push(`- **Single observation ${o.observation_id}:** ${o.description}`);
      lines.push(`  - *Note:* ${o.note}`);
      lines.push(``);
    });
  });

  if (variantB.skills_with_insufficient_evidence?.length) {
    lines.push(`### Skills with insufficient evidence`);
    variantB.skills_with_insufficient_evidence.forEach((s: any) => {
      lines.push(`- **${s.skill_name}**: ${s.reason}`);
    });
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(``);

  // ── Side-by-side per-skill comparison ──
  lines.push(`## Side-by-side: same skill, both views`);
  lines.push(``);
  lines.push(`This is the comparison that matters most for the methodology decision: for skills present in both outputs, what does the level convey vs. what does the signature convey? Which is more decision-supportive?`);
  lines.push(``);

  const skillsInBoth = vA
    .map((s: any) => s.skill_name)
    .filter((name: string) => sigs.find((sig: any) => sig.skill_name === name));

  skillsInBoth.forEach((name: string) => {
    const a = vA.find((s: any) => s.skill_name === name);
    const b = sigs.find((s: any) => s.skill_name === name);

    lines.push(`### ${name}`);
    lines.push(``);
    lines.push(`| Variant A (level) | Variant B (signature) |`);
    lines.push(`|---|---|`);
    lines.push(`| ${a.proficiency} | ${b.patterns?.length || 0} patterns identified |`);
    lines.push(``);
    lines.push(`**Variant A says:** ${a.proficiency_justification?.substring(0, 200) || 'No justification'}${a.proficiency_justification?.length > 200 ? '...' : ''}`);
    lines.push(``);
    lines.push(`**Variant B says:**`);
    (b.patterns || []).forEach((p: any) => {
      const ifF = Object.entries(p.if_features || {}).map(([k, v]) => `${k}=${v}`).join(', ');
      lines.push(`- *If* ${ifF} *then* ${p.then_action} (${p.support_count} narratives)`);
    });
    lines.push(``);
  });

  lines.push(`---`);
  lines.push(``);
  lines.push(`## Reviewer questions to consider`);
  lines.push(``);
  lines.push(`1. Does the signature output preserve the information the level conveyed?`);
  lines.push(`2. Does the signature output surface insights the level obscured?`);
  lines.push(`3. Is the signature output more or less decision-supportive for a hiring manager?`);
  lines.push(`4. Are the if-then patterns actually present in the underlying evidence?`);
  lines.push(`5. Are cultural markers handled appropriately — described, not penalised?`);
  lines.push(`6. Does either version create bias the other avoids?`);

  return lines.join('\n');
}

// ─── BUILT-IN SAMPLE ─────────────────────────────────────────────────────────

const SAMPLE_TRANSCRIPT = `
Aya: Hi! I'm Aya. I'm here to listen to your stories. There's no right or wrong — just your real experiences. To start, can you tell me about a time when things at work or home didn't go as planned?

User: Sure. Last year I was team lead at a small BPO in Cebu. We had a big client presentation, and two days before, our main presenter Ate Grace got sick — wala siyang notice, biglang absent.

Aya: Oh, that sounds stressful. What happened next?

User: Ako na nag-step up. I called an emergency team meeting — six of us — and explained the situation. I didn't panic in front of them kasi alam ko matatakot sila kung nakita nila na nataranta din ako. I redistributed Ate Grace's sections — each person took a piece. I took the most technical section since I was most familiar after her.

Aya: How did the team respond when you asked them to take on more?

User: Si Jun, medyo nag-hesitate. He said hindi siya kumpiyansa sa technical parts. So I sat with him for two hours that evening — after shift — and walked him through his section. I made him practice in front of me three times until he felt okay. The next day I checked in with everyone individually, not as a group, para hindi sila mahiya kung may concern sila.

Aya: That individual check-in sounds important. What made you decide to do it that way?

User: Alam ko yung feeling — sometimes sa group meeting, hindi mo sasabihin na hindi mo gets kasi nakakahiya. So I wanted to give them a safe space. I also noticed earlier that si Maris was very quiet. So I went to her specifically. Turns out she was worried about her English pronunciation. So I told her — focus on clarity, not perfection.

Aya: The presentation happened — how did it go?

User: The client gave positive feedback. They said the team seemed well-prepared and confident. The client extended the contract. Pero for me, the best part was after — si Jun came to me and said salamat, na he never thought he could present technical stuff pero ngayon kaya na niya. That meant more to me than the contract.

Aya: Looking back, is there anything you would have done differently?

User: Siguro I would have started a contingency plan earlier — like a backup presenter protocol. I learned na you can't assume the key person will always be there. Now in my new role, I always make sure at least two people deeply understand every critical deliverable.

Aya: Can I ask about a different kind of situation? Tell me about a time you had to figure something out under pressure with limited information.

User: Yes. About six months ago, our payment system started double-charging some customers — we found out only when complaints started coming in. The IT team said it was a database issue but they couldn't fix it for three days. I had 40 angry customers calling.

Aya: What did you do?

User: First I made a list of who was affected — pulled the transaction logs. Then I categorized them: who got charged twice but the second charge was small, who got charged twice and the amount was significant. I called the high-impact ones first, apologized, and offered a manual reversal that I would process myself when the system came back. For the smaller ones, I sent a personal message explaining what happened and a timeline. I also asked my supervisor if I could offer a small credit for the inconvenience — she approved it.

Aya: How did the customers respond?

User: Most appreciated the call. A few were still angry — one threatened to close his account. With him I just listened — I didn't argue, didn't promise anything I couldn't deliver. I asked what would make this right for him. He said he just wanted his money back faster. I told him I would manually process his reversal first, before anyone else's. He stayed.

Aya: That sounds like a tough position. What did you learn from that one?

User: Sometimes the angry customer is angry because no one is listening. The fix isn't always faster — it's slower. Listen first. Then act.
`;

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  let transcriptSource = 'built-in sample';
  let transcript = SAMPLE_TRANSCRIPT;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--transcript' && args[i + 1]) {
      const filePath = args[i + 1];
      if (!fs.existsSync(filePath)) {
        console.error(`ERROR: Transcript file not found: ${filePath}`);
        process.exit(1);
      }
      transcript = fs.readFileSync(filePath, 'utf-8');
      transcriptSource = filePath;
      i++;
    }
  }

  console.log('\n  KAYA — Stage 5 A/B Comparison Runner');
  console.log('  =====================================');
  console.log(`  Transcript: ${transcriptSource}`);
  console.log('');

  const prodPrompts = loadProductionPrompts();
  const newPrompts = loadNewPrompts();
  console.log('  Loaded production + new prompts.\n');

  // Run shared stages 1–4 ONCE with situation_features augmentation in Stage 3.
  // Variant A's old Stage 5 simply ignores the extra field.
  console.log('  Running shared Stages 1–4 (with situation_features augmentation)...');
  const shared = await runSharedStages(transcript, prodPrompts, true, newPrompts);
  console.log('');

  console.log('  Running Stage 5 — both variants...');
  const variantA = await runStage5_A(shared, prodPrompts);
  console.log('  Pausing 3s before variant B...');
  await new Promise(r => setTimeout(r, 3000));
  const variantB = await runStage5_B(shared, newPrompts);
  console.log('');

  // Save results
  const ts = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

  const jsonPath = path.join(resultsDir, `comparison-${ts}.json`);
  const mdPath = path.join(resultsDir, `comparison-${ts}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify({
    metadata: {
      transcript_source: transcriptSource,
      timestamp: new Date().toISOString(),
      shared_stages: {
        episodes: shared.episodes.length,
        evidence: shared.evidence.length,
        mappings: shared.mappings.length,
        validated_mappings: shared.validated.validated_mappings?.length || 0
      }
    },
    variantA_holistic_levels: variantA,
    variantB_signatures: variantB
  }, null, 2), 'utf-8');

  const md = renderComparisonMarkdown(transcriptSource, variantA, variantB, new Date().toISOString());
  fs.writeFileSync(mdPath, md, 'utf-8');

  // Console summary
  console.log('  ' + '═'.repeat(68));
  console.log('  COMPARISON COMPLETE');
  console.log('  ' + '═'.repeat(68));
  console.log('');
  console.log('  Variant A (current — holistic levels):');
  const skillsA = (variantA.vacancy_aligned_skills || []).concat(variantA.additional_skills_evidenced || []);
  console.log(`    ${skillsA.length} skills scored`);
  skillsA.forEach((s: any) => {
    console.log(`      ${s.skill_name.padEnd(28)} ${s.proficiency.padEnd(14)} (conf ${s.top_evidence?.adjusted_confidence ?? 'n/a'})`);
  });
  console.log('');
  console.log('  Variant B (proposed — signatures):');
  const sigs = variantB.signatures_by_skill || [];
  console.log(`    ${sigs.length} skills with signatures`);
  sigs.forEach((s: any) => {
    const numPatterns = s.patterns?.length || 0;
    const numSingles = s.single_observations?.length || 0;
    const internalLvl = s.internal_level_metadata?.derived_level || 'n/a';
    console.log(`      ${s.skill_name.padEnd(28)} ${numPatterns} pattern(s), ${numSingles} single(s)  [internal: ${internalLvl}]`);
  });
  console.log('');
  console.log(`  Detailed comparison saved to:`);
  console.log(`    ${mdPath}`);
  console.log(`    ${jsonPath}`);
  console.log('');
  console.log('  Next: open the .md file to compare side-by-side. Share with Ryan + psychologist.');
  console.log('');
}

main().catch(err => {
  console.error('\nFATAL ERROR:', err);
  process.exit(1);
});
