'use client';

import { useState, useEffect, useCallback } from 'react';

interface AppData {
  id: string;
  status: string;
  current_gate: number;
  applied_at: string;
  final_outcome: string | null;
  vacancy: { title: string; employer_id: string } | null;
  jobseeker: { full_name: string } | null;
  gate1: { alignment_score: number; strengths: any[]; gaps: any[]; ai_recommendation: string; reviewer_decision: string } | null;
  gate2: { evidence_rating: string; leee_skills_profile: any; ai_recommendation: string; reviewer_decision: string } | null;
  gate3: { readiness_index: number; success_conditions: any[]; support_needs: any[]; ai_recommendation: string; reviewer_decision: string } | null;
}

export default function ReviewerDashboard() {
  const [activeView, setActiveView] = useState<'pipeline' | 'gate1' | 'gate2' | 'gate3'>('pipeline');
  const [apps, setApps] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ applied: 0, gate1: 0, gate2: 0, gate3: 0, selected: 0 });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/demo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_demo_state' }),
      });
      const data = await res.json();

      // Count by status
      const allApps = data.applications || [];
      const c = { applied: 0, gate1: 0, gate2: 0, gate3: 0, selected: 0 };
      allApps.forEach((a: any) => {
        if (a.status?.includes('gate1')) c.gate1++;
        else if (a.status?.includes('gate2')) c.gate2++;
        else if (a.status?.includes('gate3')) c.gate3++;
        else if (a.status === 'selected' || a.status === 'not_selected') c.selected++;
        else c.applied++;
      });
      setCounts(c);

      // Fetch full details for each application
      const detailed: AppData[] = [];
      for (const app of allApps) {
        try {
          const detRes = await fetch('/api/demo', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_application', application_id: app.id }),
          });
          const det = await detRes.json();
          
          const jsName = det.jobseeker?.user_profiles?.full_name || det.jobseeker?.full_name || 'Unknown';
          detailed.push({
            id: app.id,
            status: app.status,
            current_gate: app.current_gate,
            applied_at: det.application?.applied_at,
            final_outcome: det.application?.final_outcome,
            vacancy: det.vacancy ? { title: det.vacancy.title, employer_id: det.vacancy.employer_id } : null,
            jobseeker: { full_name: jsName },
            gate1: det.gates?.gate1 || null,
            gate2: det.gates?.gate2 || null,
            gate3: det.gates?.gate3 || null,
          });
        } catch (e) { /* skip failed fetches */ }
      }
      setApps(detailed);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const statusColor = (status: string) => {
    if (status === 'selected') return 'text-green-600 bg-green-50';
    if (status === 'not_selected') return 'text-red-600 bg-red-50';
    if (status.includes('passed')) return 'text-blue-600 bg-blue-50';
    if (status.includes('pending')) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      <nav className="px-6 py-3 flex items-center justify-between" style={{ background: '#102A43' }}>
        <a href="/" className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#486581' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#48BB78' }} />
          </div>
          <span className="text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#F0F4F8' }}>kaya</span>
        </a>
        <div className="flex flex-row items-center gap-4 flex-nowrap">
          <button onClick={fetchData} className="text-xs whitespace-nowrap hover:opacity-80 transition-opacity" style={{ color: '#BCCCDC' }}>Refresh</button>
          <span style={{ color: '#334E68' }}>|</span>
          <a href="/employer-dashboard" className="text-xs whitespace-nowrap hover:opacity-80 transition-opacity" style={{ color: '#BCCCDC' }}>Employer Dashboard</a>
          <span style={{ color: '#334E68' }}>|</span>
          <a href="/" className="text-xs whitespace-nowrap hover:opacity-80 transition-opacity" style={{ color: '#627D98' }}>Home</a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold" style={{ color: '#102A43' }}>Three-Gate Hiring Pipeline</h1>
          <p className="text-sm" style={{ color: '#627D98' }}>Alignment → Evidence → Predictability — Human decision at every gate</p>
        </div>
        <div className="flex gap-1 border-b border-gray-200">
          {[
            { id: 'pipeline' as const, label: 'Pipeline Overview' },
            { id: 'gate1' as const, label: 'Gate 1: Alignment' },
            { id: 'gate2' as const, label: 'Gate 2: Evidence' },
            { id: 'gate3' as const, label: 'Gate 3: Predictability' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeView === tab.id ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px' : 'text-gray-500 hover:text-gray-700'
              }`}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading pipeline data...</div>
        ) : (
          <>
            {/* PIPELINE OVERVIEW */}
            {activeView === 'pipeline' && (
              <div className="space-y-6">
                {/* Funnel */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Hiring Pipeline</h2>
                  <div className="flex items-stretch gap-3 mb-6">
                    {[
                      { label: 'Applied', count: counts.applied, color: 'bg-gray-100 text-gray-700' },
                      { label: 'Gate 1', count: counts.gate1, color: 'bg-blue-100 text-blue-700' },
                      { label: 'Gate 2', count: counts.gate2, color: 'bg-green-100 text-green-700' },
                      { label: 'Gate 3', count: counts.gate3, color: 'bg-purple-100 text-purple-700' },
                      { label: 'Selected', count: counts.selected, color: 'bg-yellow-100 text-yellow-700' },
                    ].map((s, i) => (
                      <div key={i} className="flex items-center gap-3 flex-1">
                        <div className={`${s.color} rounded-lg p-4 flex-1 text-center`}>
                          <div className="text-2xl font-bold">{s.count}</div>
                          <div className="text-xs font-medium mt-1">{s.label}</div>
                        </div>
                        {i < 4 && <span className="text-gray-300 text-lg">→</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Applications Table */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">All Applications ({apps.length})</h2>
                  {apps.length === 0 ? (
                    <p className="text-center py-8 text-gray-400 text-sm">No applications yet. Run the demo pipeline at <a href="/demo" className="text-blue-500 underline">/demo</a></p>
                  ) : (
                    <div className="space-y-3">
                      {apps.map(app => (
                        <div key={app.id} className="border border-gray-100 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-semibold text-gray-900">{app.jobseeker?.full_name}</span>
                              <span className="text-gray-400 mx-2">→</span>
                              <span className="text-gray-600">{app.vacancy?.title || 'Unknown Vacancy'}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(app.status)}`}>
                              {app.status.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {/* Gate Summary Row */}
                          <div className="flex gap-2 mt-2">
                            {app.gate1 && (
                              <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                G1: {app.gate1.alignment_score}/100 — {app.gate1.reviewer_decision || 'pending'}
                              </div>
                            )}
                            {app.gate2 && (
                              <div className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                G2: {app.gate2.evidence_rating} evidence — {app.gate2.reviewer_decision || 'pending'}
                              </div>
                            )}
                            {app.gate3 && (
                              <div className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                G3: Readiness {app.gate3.readiness_index}/100 — {app.gate3.reviewer_decision || 'pending'}
                              </div>
                            )}
                            {app.final_outcome && (
                              <div className={`text-xs px-2 py-1 rounded font-medium ${app.final_outcome === 'selected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                Final: {app.final_outcome}
                              </div>
                            )}
                          </div>

                          {/* Gate 1 Details */}
                          {app.gate1 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500 font-medium mb-1">Gate 1 — AI Recommendation:</p>
                              <p className="text-sm text-gray-700">{app.gate1.ai_recommendation}</p>
                              {app.gate1.strengths?.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {app.gate1.strengths.map((s: any, i: number) => (
                                    <span key={i} className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">✓ {s.area || s}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Gate 3 Details */}
                          {app.gate3 && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs text-gray-500 font-medium mb-1">Gate 3 — Readiness Assessment:</p>
                              <p className="text-sm text-gray-700">{app.gate3.ai_recommendation}</p>
                              {app.gate3.support_needs?.length > 0 && (
                                <div className="mt-1">
                                  <span className="text-xs text-gray-500">Support needs: </span>
                                  {app.gate3.support_needs.map((n: any, i: number) => (
                                    <span key={i} className="text-xs text-orange-600">{typeof n === 'string' ? n : n.need}{i < app.gate3!.support_needs.length - 1 ? ', ' : ''}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* GATE VIEWS */}
            {activeView === 'gate1' && <GateView gate={1} apps={apps} />}
            {activeView === 'gate2' && <GateView gate={2} apps={apps} />}
            {activeView === 'gate3' && <GateView gate={3} apps={apps} />}
          </>
        )}
      </div>
    </div>
  );
}

function GateView({ gate, apps }: { gate: number; apps: AppData[] }) {
  const config = {
    1: { title: 'Gate 1: Alignment Review', role: 'Recruiter', color: 'blue', description: 'Does this candidate align with the role?' },
    2: { title: 'Gate 2: Evidence Review', role: 'Hiring Manager', color: 'green', description: 'Is there sufficient evidence for this role?' },
    3: { title: 'Gate 3: Predictability Review', role: 'Final Approver', color: 'purple', description: 'Will this candidate succeed?' },
  }[gate]!;

  const gateApps = apps.filter(a => {
    if (gate === 1) return a.gate1 !== null;
    if (gate === 2) return a.gate2 !== null;
    return a.gate3 !== null;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ background: gate === 1 ? '#2E86C1' : gate === 2 ? '#27AE60' : '#8E44AD' }}>
          G{gate}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{config.title}</h2>
          <p className="text-sm text-gray-500">{config.role} — {config.description}</p>
        </div>
      </div>

      {gateApps.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-2">{gate === 1 ? '' : gate === 2 ? '' : ''}</p>
          <p className="text-sm">No candidates have reached this gate yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {gateApps.map(app => {
            const gateData = gate === 1 ? app.gate1 : gate === 2 ? app.gate2 : app.gate3;
            const isPending = !gateData?.reviewer_decision || gateData?.reviewer_decision === 'pending';
            const gateTable = gate === 1 ? 'gate1_results' : gate === 2 ? 'gate2_results' : 'gate3_results';

            const handleDecision = async (decision: string) => {
              try {
                const res = await fetch('/api/demo', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'gate_decision',
                    application_id: app.id,
                    gate: gate,
                    decision: decision,
                  }),
                });
                if (res.ok) {
                  // Reload data
                  window.location.reload();
                }
              } catch (e) { console.error('Decision error:', e); }
            };

            return (
              <div key={app.id} className="border rounded-xl p-5 bg-white" style={{ borderColor: '#E2E8F0' }}>
                {/* Candidate header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-semibold text-base" style={{ color: '#102A43' }}>{app.jobseeker?.full_name || 'Candidate'}</span>
                    <span className="text-xs ml-2" style={{ color: '#829AB1' }}>→ {app.vacancy?.title || 'Branch Staff'}</span>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                    gateData?.reviewer_decision === 'passed' ? 'bg-green-50 text-green-700' :
                    gateData?.reviewer_decision === 'held' ? 'bg-amber-50 text-amber-700' :
                    gateData?.reviewer_decision === 'stopped' ? 'bg-red-50 text-red-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {gateData?.reviewer_decision || 'Pending Review'}
                  </span>
                </div>

                {/* AI Recommendation */}
                <div className="p-3 rounded-lg mb-3" style={{ background: '#F0F4F8' }}>
                  <p className="text-xs font-medium mb-1" style={{ color: '#486581' }}>AI Recommendation</p>
                  <p className="text-sm" style={{ color: '#334E68' }}>{gateData?.ai_recommendation || 'No recommendation yet'}</p>
                </div>

                {/* Gate-specific data */}
                {gate === 1 && app.gate1 && (
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <span style={{ color: '#486581' }}>Alignment Score: <strong style={{ color: '#102A43' }}>{app.gate1.alignment_score}/100</strong></span>
                    {app.gate1.strengths?.length > 0 && (
                      <div className="flex gap-1">
                        {app.gate1.strengths.slice(0, 3).map((s: any, i: number) => (
                          <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#E8F8F5', color: '#27AE60' }}>{typeof s === 'string' ? s : s.skill || s.name}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {gate === 2 && app.gate2 && (
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <span style={{ color: '#486581' }}>Evidence Rating: <strong style={{ color: '#102A43' }}>{app.gate2.evidence_rating}</strong></span>
                  </div>
                )}
                {gate === 3 && app.gate3 && (
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <span style={{ color: '#486581' }}>Readiness Index: <strong style={{ color: '#102A43' }}>{app.gate3.readiness_index}/100</strong></span>
                  </div>
                )}

                {/* APPROVAL BUTTONS — Human in the loop */}
                {isPending && (
                  <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid #E2E8F0' }}>
                    <button
                      onClick={() => handleDecision('passed')}
                      className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                      style={{ background: '#48BB78' }}
                    >
                      Approve — Pass to {gate < 3 ? `Gate ${gate + 1}` : 'Selection'}
                    </button>
                    <button
                      onClick={() => handleDecision('held')}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                      style={{ background: '#FEF3E2', color: '#E67E22' }}
                    >
                      Hold
                    </button>
                    <button
                      onClick={() => handleDecision('stopped')}
                      className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90"
                      style={{ background: '#FDEDEC', color: '#E74C3C' }}
                    >
                      Stop
                    </button>
                  </div>
                )}
                {!isPending && (
                  <div className="text-xs pt-2" style={{ color: '#829AB1', borderTop: '1px solid #F0F4F8' }}>
                    Decision recorded: {gateData?.reviewer_decision}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
