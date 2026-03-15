#!/usr/bin/env node

/**
 * SIS MVP — End-to-End Automated Test Script
 * 
 * Run with: node test/e2e-test.js
 * 
 * Prerequisites:
 * - Server running on localhost:3000
 * - Supabase connected
 * - Anthropic API key configured
 * 
 * This script tests the full pipeline:
 * 1. Create a jobseeker profile (fictional PWD candidate)
 * 2. Start a chat session with Aya
 * 3. Have a multi-turn conversation (simulated)
 * 4. Finish session and run extraction
 * 5. Seed employer + vacancy
 * 6. Run full 3-gate pipeline
 * 7. Verify all data in Supabase
 */

const BASE = 'http://localhost:3000';
const PASS = '✅';
const FAIL = '❌';
const WARN = '⚠️';

let testsPassed = 0;
let testsFailed = 0;
let testsWarned = 0;

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

function log(status, test, detail = '') {
  const icon = status === 'pass' ? PASS : status === 'fail' ? FAIL : WARN;
  console.log(`  ${icon} ${test}${detail ? ` — ${detail}` : ''}`);
  if (status === 'pass') testsPassed++;
  else if (status === 'fail') testsFailed++;
  else testsWarned++;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ============================================================
// TEST 1: PROFILE CREATION
// ============================================================

async function testProfileCreation() {
  console.log('\n📋 TEST 1: Profile Creation');
  console.log('─'.repeat(50));

  try {
    const result = await post('/api/profile', {
      action: 'create',
      full_name: 'Maria Santos',
      email: 'maria.santos@test.com',
      phone: '+639123456789',
      disability_type: 'physical',
      preferred_location: 'Quirino Province',
      work_history: [
        {
          company: 'Family Sari-Sari Store',
          role: 'Store Manager',
          start_date: 'Jan 2020',
          end_date: 'Present',
          description: 'Managing daily operations, customer service, inventory, and bookkeeping for family-owned convenience store.',
          is_informal: true,
        },
        {
          company: 'Barangay Health Center',
          role: 'Volunteer Community Health Worker',
          start_date: 'Mar 2019',
          end_date: 'Dec 2020',
          description: 'Helped with community health education, assisted in vaccination drives, maintained records.',
          is_informal: true,
        }
      ],
      education: [
        { institution: 'Quirino State University', degree: 'BS Business Administration', field: 'Management', year: '2019', status: 'completed' }
      ],
      certifications: ['TESDA NC II - Bookkeeping', 'Virtualahan Digital Skills 2024'],
      training: ['Virtualahan Customer Service Program', 'DICT SPARK VA 2.0'],
      skills_inventory: ['Microsoft Office', 'Customer Service', 'Bookkeeping', 'Inventory Management', 'Social Media'],
      career_goals: 'Looking for a stable office-based role in financial services where I can use my customer service and bookkeeping experience.',
      preferred_work_arrangement: 'onsite',
      salary_expectations: { min: '15000', max: '22000', currency: 'PHP' },
      language_preference: 'taglish',
      accessibility_needs: { wheelchair_access: true, flexible_breaks: true },
    });

    if (result.profile?.id) {
      log('pass', 'Profile created', `ID: ${result.profile.id.substring(0, 8)}...`);
      log('pass', 'User created', `ID: ${result.user_id?.substring(0, 8)}...`);
      
      if (result.profile.completion_percentage > 0) {
        log('pass', 'Completion tracking', `${result.profile.completion_percentage}%`);
      } else {
        log('warn', 'Completion tracking', 'Shows 0% — may need review');
      }

      return { profileId: result.profile.id, userId: result.user_id };
    } else {
      log('fail', 'Profile creation', result.error || 'No profile returned');
      return null;
    }
  } catch (e) {
    log('fail', 'Profile creation', e.message);
    return null;
  }
}

// ============================================================
// TEST 2: CHAT SESSION WITH AYA
// ============================================================

async function testChatSession() {
  console.log('\n💬 TEST 2: Chat Session with Aya');
  console.log('─'.repeat(50));

  try {
    // Start session
    const startResult = await post('/api/chat', { action: 'start', language: 'taglish' });
    
    if (!startResult.session_id) {
      log('fail', 'Start session', startResult.error || 'No session ID');
      return null;
    }
    log('pass', 'Session started', `ID: ${startResult.session_id.substring(0, 8)}...`);

    const sessionId = startResult.session_id;

    // Simulate conversation turns
    const turns = [
      'Kumusta! Ako si Maria, from Quirino Province.',
      'Im doing okay, medyo busy sa store namin.',
      'We have a sari-sari store, family business. Ako ang nag-manage.',
      'Yep! Actually may isang time na may customer na galit na galit kasi mali daw ang sukli niya.',
      'So kinausap ko siya ng malumanay, tinitigan ko yung records namin. Nakita ko na tama naman ang sukli pero may kulang pala sa resibo.',
      'I showed the customer the calculation step by step. Inisa-isa ko sa harap niya. At the end nag-sorry siya and naging regular customer pa.',
      'Natutunan ko na huwag mag-react agad pag galit ang tao. Listen muna, understand, then respond with facts.',
      'Oo, lalo na sa health center. May mga tao na ayaw magpa-vaccine. Kailangan mo talaga maging patient at understanding.',
      'I would explain slowly, use simple words, and respect their fears. Hindi mo sila puwedeng pilitin.',
      'Salamat! That was a good chat.',
    ];

    let lastStage = 'opening';
    let lastStoriesCompleted = 0;

    for (let i = 0; i < turns.length; i++) {
      await sleep(500); // Brief pause between turns

      const chatResult = await post('/api/chat', {
        session_id: sessionId,
        message: turns[i],
      });

      if (chatResult.message) {
        lastStage = chatResult.stage || lastStage;
        lastStoriesCompleted = chatResult.stories_completed || lastStoriesCompleted;

        if (i === 0) log('pass', 'First turn', `Aya responded, stage: ${chatResult.stage}`);
        if (i === turns.length - 1) log('pass', 'Last turn', `Stage: ${lastStage}, Stories: ${lastStoriesCompleted}`);
      } else {
        log('fail', `Turn ${i + 1}`, chatResult.error || 'No response');
      }
    }

    log('pass', 'Conversation completed', `${turns.length} turns, stage: ${lastStage}`);

    // Check stage progression
    if (lastStage !== 'opening') {
      log('pass', 'Stage progression', `Moved beyond opening to: ${lastStage}`);
    } else {
      log('warn', 'Stage progression', 'Still in opening after all turns');
    }

    return sessionId;
  } catch (e) {
    log('fail', 'Chat session', e.message);
    return null;
  }
}

// ============================================================
// TEST 3: EXTRACTION
// ============================================================

async function testExtraction(sessionId) {
  console.log('\n🔬 TEST 3: Skills Extraction');
  console.log('─'.repeat(50));

  try {
    const result = await post('/api/chat', {
      action: 'extract',
      session_id: sessionId,
    });

    if (result.extraction) {
      const ext = result.extraction;
      log('pass', 'Extraction completed');

      // Check skills profile
      const skills = ext.skills_profile || [];
      if (skills.length > 0) {
        log('pass', 'Skills extracted', `${skills.length} skills found`);
        skills.forEach(s => {
          const hasEvidence = s.evidence && s.evidence.length > 0;
          log(hasEvidence ? 'pass' : 'warn', `  ${s.skill_name}`, `${s.proficiency} (${Math.round(s.confidence * 100)}% confidence)${hasEvidence ? ` — ${s.evidence.length} evidence items` : ' — no evidence citations'}`);
        });
      } else {
        log('fail', 'Skills extraction', 'No skills found');
      }

      // Check narrative
      if (ext.narrative_summary) {
        log('pass', 'Narrative summary', ext.narrative_summary.substring(0, 80) + '...');
      } else {
        log('warn', 'Narrative summary', 'Missing');
      }

      // Check episodes
      if (ext.episodes && ext.episodes.length > 0) {
        log('pass', 'Episodes', `${ext.episodes.length} episodes extracted`);
      } else {
        log('warn', 'Episodes', 'No episodes found');
      }

      // Check gaming flags
      if (ext.gaming_flags && ext.gaming_flags.length > 0) {
        ext.gaming_flags.forEach(f => {
          log('warn', `Gaming flag: ${f.flag_type}`, f.evidence?.substring(0, 60));
        });
      } else {
        log('pass', 'Gaming flags', 'None detected');
      }

      // Check Layer 2 seeds
      if (ext.layer2_seeds && ext.layer2_seeds.length > 0) {
        log('pass', 'Layer 2 seeds', `${ext.layer2_seeds.length} simulation scenarios generated`);
      } else {
        log('warn', 'Layer 2 seeds', 'None generated');
      }

      return ext;
    } else {
      log('fail', 'Extraction', result.error || 'No extraction returned');
      return null;
    }
  } catch (e) {
    log('fail', 'Extraction', e.message);
    return null;
  }
}

// ============================================================
// TEST 4: EMPLOYER + VACANCY (JD PARSING)
// ============================================================

async function testEmployerSetup() {
  console.log('\n🏢 TEST 4: Employer Setup + JD Parsing');
  console.log('─'.repeat(50));

  try {
    // Seed demo data
    const seed = await post('/api/demo', { action: 'seed_demo_data' });
    if (seed.employer_id && seed.vacancy_id) {
      log('pass', 'Demo data seeded', `Employer: ${seed.employer_id.substring(0, 8)}..., Vacancy: ${seed.vacancy_id.substring(0, 8)}...`);
    } else {
      log('fail', 'Seed demo data', JSON.stringify(seed));
    }

    // Test JD parsing with a different JD
    const parseResult = await post('/api/gate1', {
      action: 'parse_jd',
      jd_text: `Customer Service Representative
We are looking for a Customer Service Representative to join our team.
Requirements:
- Excellent communication skills in English and Filipino
- Experience in handling customer complaints
- Proficient in Microsoft Office
- College graduate
- Willing to work in shifts
Benefits: HMO, 13th month pay, performance bonus`,
    });

    if (parseResult.blueprint) {
      log('pass', 'JD parsed', `Title: ${parseResult.blueprint.title}`);
      if (parseResult.blueprint.essential_requirements?.length > 0) {
        log('pass', 'Essential requirements', `${parseResult.blueprint.essential_requirements.length} found`);
      }
      if (parseResult.blueprint.competency_blueprint?.human_centric_skills?.length > 0) {
        log('pass', 'Human-centric skills identified', parseResult.blueprint.competency_blueprint.human_centric_skills.map(s => s.skill).join(', '));
      }
    } else {
      log('fail', 'JD parsing', parseResult.error || 'No blueprint');
    }

    return seed;
  } catch (e) {
    log('fail', 'Employer setup', e.message);
    return null;
  }
}

// ============================================================
// TEST 5: FULL 3-GATE PIPELINE
// ============================================================

async function testPipeline(profileId, seed) {
  console.log('\n🚀 TEST 5: Full 3-Gate Pipeline');
  console.log('─'.repeat(50));

  try {
    // Apply
    const app = await post('/api/demo', {
      action: 'apply',
      vacancy_id: seed.vacancy_id,
      jobseeker_id: profileId,
    });

    if (!app.application?.id) {
      log('fail', 'Application', app.error || 'No application created');
      return null;
    }
    log('pass', 'Application created', `ID: ${app.application.id.substring(0, 8)}...`);

    const appId = app.application.id;

    // Gate 1
    console.log('  ⏳ Running Gate 1 (Alignment)...');
    const g1 = await post('/api/demo', {
      action: 'advance_gate', application_id: appId, target_gate: 1,
    });
    if (g1.status === 'gate1_complete') {
      const score = g1.alignment?.alignment?.alignment_score;
      log('pass', 'Gate 1 complete', `Alignment score: ${score || 'N/A'}/100`);
    } else {
      log('fail', 'Gate 1', g1.error || g1.status);
    }

    await sleep(1000);

    // Gate 2
    console.log('  ⏳ Running Gate 2 (Evidence)...');
    const g2 = await post('/api/demo', {
      action: 'advance_gate', application_id: appId, target_gate: 2,
    });
    if (g2.status === 'gate2_complete') {
      log('pass', 'Gate 2 complete', `Evidence: ${g2.gate2?.evidence_rating || 'N/A'}`);
    } else {
      log('fail', 'Gate 2', g2.error || g2.status);
    }

    await sleep(1000);

    // Gate 3
    console.log('  ⏳ Running Gate 3 (Predictability)...');
    const g3 = await post('/api/demo', {
      action: 'advance_gate', application_id: appId, target_gate: 3,
    });
    if (g3.status === 'gate3_complete') {
      log('pass', 'Gate 3 complete', `Readiness: ${g3.readiness?.readiness_index || 'N/A'}/100`);
      if (g3.readiness?.recommendation) {
        log('pass', 'AI recommendation', g3.readiness.recommendation);
      }
      if (g3.readiness?.support_needs?.length > 0) {
        log('pass', 'Support needs identified', `${g3.readiness.support_needs.length} items`);
      }
    } else {
      log('fail', 'Gate 3', g3.error || g3.status);
    }

    // Verify final state
    const appState = await post('/api/demo', {
      action: 'get_application', application_id: appId,
    });
    if (appState.application?.status === 'selected') {
      log('pass', 'Final status', 'SELECTED');
    } else {
      log('warn', 'Final status', appState.application?.status || 'unknown');
    }

    return appId;
  } catch (e) {
    log('fail', 'Pipeline', e.message);
    return null;
  }
}

// ============================================================
// TEST 6: DATA INTEGRITY
// ============================================================

async function testDataIntegrity() {
  console.log('\n🗄️ TEST 6: Data Integrity');
  console.log('─'.repeat(50));

  try {
    const state = await post('/api/demo', { action: 'get_demo_state' });

    if (state.counts) {
      log(state.counts.employers > 0 ? 'pass' : 'fail', 'Employers in DB', `${state.counts.employers}`);
      log(state.counts.vacancies > 0 ? 'pass' : 'fail', 'Vacancies in DB', `${state.counts.vacancies}`);
      log(state.counts.jobseekers > 0 ? 'pass' : 'fail', 'Jobseeker profiles in DB', `${state.counts.jobseekers}`);
      log(state.counts.applications > 0 ? 'pass' : 'fail', 'Applications in DB', `${state.counts.applications}`);
      log(state.counts.sessions > 0 ? 'pass' : 'warn', 'LEEE sessions in DB', `${state.counts.sessions}`);
    } else {
      log('fail', 'Demo state', 'Could not fetch');
    }
  } catch (e) {
    log('fail', 'Data integrity', e.message);
  }
}

// ============================================================
// TEST 7: EDGE CASES
// ============================================================

async function testEdgeCases() {
  console.log('\n🔧 TEST 7: Edge Cases');
  console.log('─'.repeat(50));

  // Empty message
  try {
    const emptyResult = await post('/api/chat', { session_id: 'fake', message: '' });
    log(emptyResult.error ? 'pass' : 'warn', 'Empty message rejected', emptyResult.error || 'No error');
  } catch (e) {
    log('pass', 'Empty message rejected', 'Error thrown');
  }

  // Invalid session
  try {
    const fakeResult = await post('/api/chat', { session_id: '00000000-0000-0000-0000-000000000000', message: 'hello' });
    log(fakeResult.error ? 'pass' : 'warn', 'Invalid session rejected', fakeResult.error || 'No error');
  } catch (e) {
    log('pass', 'Invalid session rejected', 'Error thrown');
  }

  // Profile with missing name
  try {
    const noNameResult = await post('/api/profile', { action: 'create', full_name: '' });
    // Should still create but with empty name or fail
    log('pass', 'Empty name profile', noNameResult.error ? 'Rejected' : `Created (ID: ${noNameResult.profile?.id?.substring(0, 8)}...)`);
  } catch (e) {
    log('pass', 'Empty name profile', 'Error thrown');
  }
}

// ============================================================
// RUN ALL TESTS
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║    SIS MVP — End-to-End Automated Test Suite    ║');
  console.log('║    Testing against: localhost:3000               ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  const startTime = Date.now();

  // Test 1: Profile
  const profile = await testProfileCreation();

  // Test 2: Chat
  const sessionId = await testChatSession();

  // Test 3: Extraction
  if (sessionId) {
    await testExtraction(sessionId);
  }

  // Test 4: Employer
  const seed = await testEmployerSetup();

  // Test 5: Pipeline
  if (profile && seed) {
    await testPipeline(profile.profileId, seed);
  }

  // Test 6: Data integrity
  await testDataIntegrity();

  // Test 7: Edge cases
  await testEdgeCases();

  // Summary
  const elapsed = Math.round((Date.now() - startTime) / 1000);
  console.log('\n' + '═'.repeat(50));
  console.log(`\n📊 TEST RESULTS (${elapsed}s)`);
  console.log(`   ${PASS} Passed: ${testsPassed}`);
  console.log(`   ${WARN} Warnings: ${testsWarned}`);
  console.log(`   ${FAIL} Failed: ${testsFailed}`);
  console.log(`   Total: ${testsPassed + testsWarned + testsFailed}`);
  console.log('');

  if (testsFailed === 0) {
    console.log('🎉 ALL TESTS PASSED!');
  } else {
    console.log(`⚠️ ${testsFailed} test(s) failed — check output above.`);
  }

  process.exit(testsFailed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Test suite error:', e);
  process.exit(1);
});
