'use client';

import { useState, useCallback, useEffect } from 'react';

// ============================================================
// DEMO FLOW PAGE
// Walks through: Seed Data → Profile → Apply → Gate 1 → Gate 2 (LEEE) → Gate 3 → Decision
// ============================================================

interface DemoState {
  employer_id: string | null;
  vacancy_id: string | null;
  jobseeker_profile_id: string | null;
  user_id: string | null;
  application_id: string | null;
  leee_session_id: string | null;
  gate1_status: 'pending' | 'running' | 'done' | 'error';
  gate2_status: 'pending' | 'running' | 'done' | 'error';
  gate3_status: 'pending' | 'running' | 'done' | 'error';
  gate1_data: any;
  gate2_data: any;
  gate3_data: any;
  log: string[];
}

export default function DemoPage() {
  const [state, setState] = useState<DemoState>({
    employer_id: null, vacancy_id: null, jobseeker_profile_id: null, user_id: null,
    application_id: null, leee_session_id: null,
    gate1_status: 'pending', gate2_status: 'pending', gate3_status: 'pending',
    gate1_data: null, gate2_data: null, gate3_data: null,
    log: [],
  });
  const [isRunning, setIsRunning] = useState(false);
  const [localData, setLocalData] = useState({ profileId: '', sessionId: '' });

  useEffect(() => {
    setLocalData({
      profileId: localStorage.getItem('sis_jobseeker_profile_id') || '',
      sessionId: localStorage.getItem('sis_last_session_id') || '',
    });
  }, []);

  const addLog = (msg: string) => setState(prev => ({ ...prev, log: [...prev.log, `[${new Date().toLocaleTimeString()}] ${msg}`] }));

  // Step 1: Seed demo data
  const seedData = useCallback(async () => {
    addLog('Seeding demo data (Cebuana Lhuillier employer + Branch Staff vacancy)...');
    const res = await fetch('/api/demo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seed_demo_data' }),
    });
    const data = await res.json();
    setState(prev => ({ ...prev, employer_id: data.employer_id, vacancy_id: data.vacancy_id }));
    addLog(`✅ Employer: ${data.employer_id?.substring(0, 8)}... | Vacancy: ${data.vacancy_id?.substring(0, 8)}... (${data.status})`);
    return data;
  }, []);

  // Step 2: Check for existing profile
  const checkProfile = useCallback(async () => {
    const profileId = localStorage.getItem('sis_jobseeker_profile_id');
    const userId = localStorage.getItem('sis_user_id');
    if (profileId && userId) {
      setState(prev => ({ ...prev, jobseeker_profile_id: profileId, user_id: userId }));
      addLog(`✅ Found existing profile: ${profileId.substring(0, 8)}...`);
      return { profileId, userId };
    }
    addLog('⚠️ No profile found. Go to /profile to create one first, then come back.');
    return null;
  }, []);

  // Step 3: Apply to vacancy
  const applyToVacancy = useCallback(async (vacancyId: string, jobseekerProfileId: string) => {
    addLog('Submitting application...');
    const res = await fetch('/api/demo', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'apply', vacancy_id: vacancyId, jobseeker_id: jobseekerProfileId }),
    });
    const data = await res.json();
    setState(prev => ({ ...prev, application_id: data.application?.id }));
    addLog(`✅ Application created: ${data.application?.id?.substring(0, 8)}...`);
    return data.application;
  }, []);

  // Step 4: Run Gate 1
  const runGate1 = useCallback(async (applicationId: string) => {
    setState(prev => ({ ...prev, gate1_status: 'running' }));
    addLog('🔵 Running Gate 1: Alignment assessment...');
    try {
      const res = await fetch('/api/demo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance_gate', application_id: applicationId, target_gate: 1 }),
      });
      const data = await res.json();
      setState(prev => ({ ...prev, gate1_status: 'done', gate1_data: data }));
      addLog(`✅ Gate 1 complete. Alignment score: ${data.alignment?.alignment?.alignment_score || 'N/A'}/100. Recruiter auto-approved.`);
      return data;
    } catch (e: any) {
      setState(prev => ({ ...prev, gate1_status: 'error' }));
      addLog(`❌ Gate 1 error: ${e.message}`);
      return null;
    }
  }, []);

  // Step 5: Run Gate 2 (link LEEE session)
  const runGate2 = useCallback(async (applicationId: string) => {
    setState(prev => ({ ...prev, gate2_status: 'running' }));

    // Check for LEEE session
    const sessionId = localStorage.getItem('sis_last_session_id');
    addLog(`🟢 Running Gate 2: Evidence building...${sessionId ? ` (LEEE session: ${sessionId.substring(0, 8)}...)` : ' (No LEEE session — profile data only)'}`);

    try {
      const res = await fetch('/api/demo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance_gate', application_id: applicationId, target_gate: 2, leee_session_id: sessionId }),
      });
      const data = await res.json();
      setState(prev => ({ ...prev, gate2_status: 'done', gate2_data: data, leee_session_id: sessionId }));
      addLog(`✅ Gate 2 complete. Evidence rating: ${data.gate2?.evidence_rating || 'N/A'}. Hiring Manager auto-approved.`);
      return data;
    } catch (e: any) {
      setState(prev => ({ ...prev, gate2_status: 'error' }));
      addLog(`❌ Gate 2 error: ${e.message}`);
      return null;
    }
  }, []);

  // Step 6: Run Gate 3
  const runGate3 = useCallback(async (applicationId: string) => {
    setState(prev => ({ ...prev, gate3_status: 'running' }));
    addLog('🟣 Running Gate 3: Predictability assessment (simulation + readiness index)...');
    try {
      const res = await fetch('/api/demo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'advance_gate', application_id: applicationId, target_gate: 3 }),
      });
      const data = await res.json();
      setState(prev => ({ ...prev, gate3_status: 'done', gate3_data: data }));
      addLog(`✅ Gate 3 complete. Readiness: ${data.readiness?.readiness?.readiness_index || 'N/A'}/100. Recommendation: ${data.readiness?.readiness?.recommendation || 'N/A'}`);
      return data;
    } catch (e: any) {
      setState(prev => ({ ...prev, gate3_status: 'error' }));
      addLog(`❌ Gate 3 error: ${e.message}`);
      return null;
    }
  }, []);

  // RUN FULL PIPELINE
  const runFullPipeline = useCallback(async () => {
    setIsRunning(true);
    setState(prev => ({ ...prev, log: [] }));

    try {
      // Step 1: Seed
      const seed = await seedData();
      if (!seed?.vacancy_id) { addLog('❌ Failed to seed data'); return; }

      // Step 2: Profile
      const profile = await checkProfile();
      if (!profile) { setIsRunning(false); return; }

      // Step 3: Apply
      const app = await applyToVacancy(seed.vacancy_id, profile.profileId);
      if (!app?.id) { addLog('❌ Failed to create application'); return; }

      // Step 4: Gate 1
      await runGate1(app.id);

      // Brief pause for readability
      await new Promise(r => setTimeout(r, 1000));

      // Step 5: Gate 2
      await runGate2(app.id);

      await new Promise(r => setTimeout(r, 1000));

      // Step 6: Gate 3
      await runGate3(app.id);

      addLog('');
      addLog('🎉 FULL PIPELINE COMPLETE — All 3 gates processed!');
      addLog('View the application details below or check the Reviewer Dashboard.');

    } catch (e: any) {
      addLog(`❌ Pipeline error: ${e.message}`);
    } finally {
      setIsRunning(false);
    }
  }, [seedData, checkProfile, applyToVacancy, runGate1, runGate2, runGate3]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">SIS End-to-End Demo</h1>
            <p className="text-sm text-gray-400">Full pipeline: Profile → Apply → Gate 1 → Gate 2 → Gate 3 → Decision</p>
          </div>
          <a href="/" className="text-xs text-gray-500 hover:text-gray-300">← Home</a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Prerequisites */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <h2 className="text-sm font-semibold text-yellow-400 mb-2">⚡ Prerequisites for Demo</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className={`p-3 rounded-lg ${localData.profileId ? 'bg-green-900/30 border border-green-800' : 'bg-red-900/30 border border-red-800'}`}>
              <span className="font-medium">{localData.profileId ? '✅' : '❌'} Jobseeker Profile</span>
              <p className="text-xs text-gray-400 mt-1">{localData.profileId ? `ID: ${localData.profileId.substring(0, 8)}...` : 'Go to /profile first'}</p>
            </div>
            <div className={`p-3 rounded-lg ${localData.sessionId ? 'bg-green-900/30 border border-green-800' : 'bg-yellow-900/30 border border-yellow-800'}`}>
              <span className="font-medium">{localData.sessionId ? '✅' : '⚠️'} LEEE Session</span>
              <p className="text-xs text-gray-400 mt-1">{localData.sessionId ? `Session: ${localData.sessionId.substring(0, 8)}...` : 'Optional — chat with Aya at /chat'}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-900/30 border border-blue-800">
              <span className="font-medium">🏢 Employer</span>
              <p className="text-xs text-gray-400 mt-1">Auto-seeded: Cebuana Lhuillier</p>
            </div>
          </div>
        </div>

        {/* Run Button */}
        <div className="text-center mb-8">
          <button
            onClick={runFullPipeline}
            disabled={isRunning}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
          >
            {isRunning ? '⏳ Running Pipeline...' : '🚀 Run Full End-to-End Pipeline'}
          </button>
        </div>

        {/* Gate Status Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { gate: 'Gate 1: Alignment', status: state.gate1_status, color: 'blue', reviewer: 'Recruiter' },
            { gate: 'Gate 2: Evidence', status: state.gate2_status, color: 'green', reviewer: 'Hiring Manager' },
            { gate: 'Gate 3: Predictability', status: state.gate3_status, color: 'purple', reviewer: 'Final Approver' },
          ].map((g, i) => (
            <div key={i} className={`rounded-lg border p-4 ${
              g.status === 'done' ? `bg-${g.color}-900/20 border-${g.color}-700` :
              g.status === 'running' ? `bg-yellow-900/20 border-yellow-700` :
              g.status === 'error' ? 'bg-red-900/20 border-red-700' :
              'bg-gray-800 border-gray-700'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">
                  {g.status === 'done' ? '✅' : g.status === 'running' ? '⏳' : g.status === 'error' ? '❌' : '⬜'}
                </span>
                <span className="font-semibold text-sm">{g.gate}</span>
              </div>
              <p className="text-xs text-gray-400">Human-in-the-loop: {g.reviewer}</p>
              <p className="text-xs text-gray-500 mt-1 capitalize">{g.status}</p>
            </div>
          ))}
        </div>

        {/* Log Output */}
        <div className="bg-gray-950 rounded-lg border border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-400">Pipeline Log</h3>
            {state.log.length > 0 && (
              <button
                onClick={() => setState(prev => ({ ...prev, log: [] }))}
                className="text-xs text-gray-600 hover:text-gray-400"
              >
                Clear
              </button>
            )}
          </div>
          <div className="font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
            {state.log.length === 0 ? (
              <p className="text-gray-600">Click "Run Full Pipeline" to start...</p>
            ) : (
              state.log.map((line, i) => (
                <div key={i} className={`${
                  line.includes('✅') ? 'text-green-400' :
                  line.includes('❌') ? 'text-red-400' :
                  line.includes('⚠️') ? 'text-yellow-400' :
                  line.includes('🎉') ? 'text-purple-300 font-bold' :
                  line.includes('🔵') ? 'text-blue-400' :
                  line.includes('🟢') ? 'text-green-400' :
                  line.includes('🟣') ? 'text-purple-400' :
                  'text-gray-400'
                }`}>
                  {line}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-4 gap-3">
          <a href="/profile" className="block p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-teal-600 text-center text-sm transition-colors">
            👤 Create Profile
          </a>
          <a href="/chat" className="block p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-teal-600 text-center text-sm transition-colors">
            💬 Chat with Aya
          </a>
          <a href="/employer" className="block p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-600 text-center text-sm transition-colors">
            🏢 Employer Dashboard
          </a>
          <a href="/reviewer" className="block p-3 bg-gray-800 rounded-lg border border-gray-700 hover:border-purple-600 text-center text-sm transition-colors">
            ✅ Reviewer Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
