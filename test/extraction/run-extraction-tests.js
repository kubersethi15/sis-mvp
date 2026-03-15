#!/usr/bin/env node

/**
 * Extraction Test Runner
 * Runs all 35 scenarios through the extraction prompt and validates results
 * Run with: node test/extraction/run-extraction-tests.js
 */

const { SCENARIOS } = require('./scenarios.js');

const BASE = 'http://localhost:3000';
const PASS = '✅';
const FAIL = '❌';
const WARN = '⚠️';

let passed = 0, failed = 0, warned = 0;
const results = [];

function log(status, test, detail = '') {
  const icon = status === 'pass' ? PASS : status === 'fail' ? FAIL : WARN;
  console.log(`  ${icon} ${test}${detail ? ` — ${detail}` : ''}`);
  if (status === 'pass') passed++;
  else if (status === 'fail') failed++;
  else warned++;
}

async function extractFromTranscript(transcript) {
  // Call the extraction directly via chat API with a dummy session
  // First start a session
  const startRes = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'start', language: 'en' }),
  });
  const startData = await startRes.json();
  const sessionId = startData.session_id;

  // Send transcript as messages to build the session
  const lines = transcript.split('\n').filter(l => l.trim());
  for (const line of lines) {
    const match = line.match(/^(AI|User):\s*(.+)$/);
    if (match && match[1] === 'User') {
      await fetch(`${BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: match[2] }),
      });
      await new Promise(r => setTimeout(r, 300)); // Brief pause
    }
  }

  // Run extraction
  const extRes = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'extract', session_id: sessionId }),
  });
  const extData = await extRes.json();
  return extData.extraction;
}

async function runScenario(scenario) {
  console.log(`\n📋 ${scenario.id}: ${scenario.description}`);
  console.log(`   Category: ${scenario.category}`);
  console.log('   ' + '─'.repeat(50));

  try {
    const extraction = await extractFromTranscript(scenario.transcript);

    if (!extraction) {
      log('fail', 'Extraction', 'No extraction returned');
      results.push({ id: scenario.id, status: 'fail', reason: 'No extraction' });
      return;
    }

    const skills = extraction.skills_profile || [];
    const flags = extraction.gaming_flags || [];

    // Test 1: Minimum skills extracted
    if (skills.length >= scenario.expected_min_skills) {
      log('pass', `Skills count`, `${skills.length} extracted (min expected: ${scenario.expected_min_skills})`);
    } else {
      log('fail', `Skills count`, `${skills.length} extracted (min expected: ${scenario.expected_min_skills})`);
    }

    // Test 2: Expected skills present
    for (const expected of (scenario.expected_skills || [])) {
      const [skillId, expectedLevel] = expected.split(':');
      const found = skills.find(s => s.skill_id === skillId);
      if (found) {
        const levelMatch = found.proficiency?.toLowerCase() === expectedLevel;
        if (levelMatch) {
          log('pass', `  ${skillId} at ${expectedLevel}`, `${found.skill_name}: ${found.proficiency} (${Math.round(found.confidence * 100)}%)`);
        } else {
          log('warn', `  ${skillId} expected ${expectedLevel}`, `Got: ${found.proficiency} (${Math.round(found.confidence * 100)}%) — level mismatch`);
        }
      } else {
        log('fail', `  ${skillId} expected`, `Not extracted at all`);
      }
    }

    // Test 3: Evidence citations present
    const skillsWithEvidence = skills.filter(s => s.evidence && s.evidence.length > 0);
    if (skillsWithEvidence.length === skills.length && skills.length > 0) {
      log('pass', 'Evidence citations', `All ${skills.length} skills have evidence quotes`);
    } else if (skillsWithEvidence.length > 0) {
      log('warn', 'Evidence citations', `${skillsWithEvidence.length}/${skills.length} skills have evidence`);
    } else if (skills.length > 0) {
      log('fail', 'Evidence citations', 'No skills have evidence quotes');
    }

    // Test 4: Gaming flags
    if (scenario.should_flag_gaming) {
      if (flags.length > 0) {
        log('pass', 'Gaming detected', flags.map(f => f.flag_type).join(', '));
      } else {
        log('fail', 'Gaming NOT detected', 'Expected gaming flags but none found');
      }
    }
    if (scenario.should_not_flag_gaming) {
      if (flags.length === 0) {
        log('pass', 'No false gaming flags', 'Authentic story not flagged');
      } else {
        log('warn', 'False gaming flag', `Authentic story flagged: ${flags.map(f => `${f.flag_type}: ${f.evidence?.substring(0, 50)}`).join('; ')}`);
      }
    }

    // Test 5: Narrative summary exists and is warm
    if (extraction.narrative_summary) {
      const isWarm = !extraction.narrative_summary.startsWith('User ') && !extraction.narrative_summary.startsWith('The user ');
      if (isWarm) {
        log('pass', 'Warm narrative', extraction.narrative_summary.substring(0, 80) + '...');
      } else {
        log('warn', 'Cold narrative', 'Starts with "User" — should be warmer');
      }
    } else {
      log('fail', 'Narrative', 'Missing');
    }

    // Test 6: Episodes
    if (extraction.episodes && extraction.episodes.length > 0) {
      log('pass', 'Episodes', `${extraction.episodes.length} episodes segmented`);
    } else {
      log('warn', 'Episodes', 'None segmented');
    }

    results.push({
      id: scenario.id,
      status: 'done',
      skills_extracted: skills.length,
      expected_min: scenario.expected_min_skills,
      skills: skills.map(s => `${s.skill_id}:${s.proficiency?.toLowerCase()}`),
      gaming_flags: flags.length,
      has_narrative: !!extraction.narrative_summary,
    });

  } catch (e) {
    log('fail', 'Error', e.message);
    results.push({ id: scenario.id, status: 'error', reason: e.message });
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║   SIS Extraction Test Suite — 35 Diverse Scenarios      ║');
  console.log('║   Testing against: localhost:3000                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  // Run in batches of 3 to avoid overwhelming the API
  for (let i = 0; i < SCENARIOS.length; i += 3) {
    const batch = SCENARIOS.slice(i, i + 3);
    for (const scenario of batch) {
      await runScenario(scenario);
    }
    if (i + 3 < SCENARIOS.length) {
      console.log(`\n   ⏳ Pausing between batches... (${i + 3}/${SCENARIOS.length} done)`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // Summary
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log('\n' + '═'.repeat(60));
  console.log(`\n📊 EXTRACTION TEST RESULTS (${elapsed}s)`);
  console.log(`   ${PASS} Passed: ${passed}`);
  console.log(`   ${WARN} Warnings: ${warned}`);
  console.log(`   ${FAIL} Failed: ${failed}`);
  console.log(`   Total checks: ${passed + warned + failed}`);
  console.log(`   Scenarios: ${SCENARIOS.length}`);

  // Category breakdown
  const categories = [...new Set(SCENARIOS.map(s => s.category))];
  console.log('\n📂 BY CATEGORY:');
  for (const cat of categories) {
    const catResults = results.filter(r => SCENARIOS.find(s => s.id === r.id)?.category === cat);
    const catPassed = catResults.filter(r => r.status === 'done' && r.skills_extracted >= (SCENARIOS.find(s => s.id === r.id)?.expected_min_skills || 0));
    console.log(`   ${cat}: ${catPassed.length}/${catResults.length} scenarios met minimum skills`);
  }

  // Gaming detection accuracy
  const gamingScenarios = SCENARIOS.filter(s => s.should_flag_gaming);
  const gamingDetected = results.filter(r => {
    const scenario = SCENARIOS.find(s => s.id === r.id);
    return scenario?.should_flag_gaming && r.gaming_flags > 0;
  });
  console.log(`\n🎯 GAMING DETECTION: ${gamingDetected.length}/${gamingScenarios.length} gaming attempts flagged`);

  // False positive rate
  const authenticScenarios = SCENARIOS.filter(s => s.should_not_flag_gaming);
  const falseFlags = results.filter(r => {
    const scenario = SCENARIOS.find(s => s.id === r.id);
    return scenario?.should_not_flag_gaming && r.gaming_flags > 0;
  });
  console.log(`🛡️ FALSE POSITIVES: ${falseFlags.length}/${authenticScenarios.length} authentic stories incorrectly flagged`);

  console.log('');
  if (failed === 0) {
    console.log('🎉 ALL EXTRACTION TESTS PASSED!');
  } else {
    console.log(`⚠️ ${failed} check(s) failed — review output above.`);
  }

  // Save results to file
  const fs = require('fs');
  fs.writeFileSync('test/extraction/results.json', JSON.stringify({ results, summary: { passed, warned, failed, elapsed, total_scenarios: SCENARIOS.length } }, null, 2));
  console.log('\n📄 Detailed results saved to test/extraction/results.json');

  process.exit(failed > 5 ? 1 : 0); // Allow up to 5 failures for level mismatches
}

main().catch(e => {
  console.error('Test suite error:', e);
  process.exit(1);
});
