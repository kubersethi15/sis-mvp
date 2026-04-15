'use client';

import { useState, useEffect } from 'react';
import { PageShell, TabBar, Card, SectionHeader, Button, LoadingState, EmptyState } from '@/components/KayaUI';

// ============================================================
// GROWTH DASHBOARD — Training Impact Measurement
// For: Virtualahan trainers, program managers, funders
// Shows: skill trajectories, cohort performance, impact metrics
// ============================================================

interface Trajectory {
  candidate_id: string;
  sessions: any[];
  deltas: any[];
  velocity: any[];
  overall_improvement: number;
  top_improved: string[];
  needs_attention: string[];
  summary: string;
}

export default function GrowthDashboard() {
  const [activeTab, setActiveTab] = useState<'individual' | 'cohort' | 'create'>('individual');
  const [userId, setUserId] = useState('');
  const [trajectory, setTrajectory] = useState<Trajectory | null>(null);
  const [loading, setLoading] = useState(false);
  const [cohortId, setCohortId] = useState('');
  const [cohortSummary, setCohortSummary] = useState<any>(null);
  const [newCohortName, setNewCohortName] = useState('');
  const [newCohortCandidates, setNewCohortCandidates] = useState('');

  const loadTrajectory = async () => {
    if (!userId.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/growth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_trajectory', user_id: userId.trim() }),
      });
      const data = await res.json();
      setTrajectory(data.trajectory || null);
    } catch { setTrajectory(null); }
    finally { setLoading(false); }
  };

  const loadCohort = async () => {
    if (!cohortId.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/growth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cohort_summary', cohort_id: cohortId.trim() }),
      });
      const data = await res.json();
      setCohortSummary(data.summary || null);
    } catch { setCohortSummary(null); }
    finally { setLoading(false); }
  };

  const createCohort = async () => {
    if (!newCohortName.trim()) return;
    setLoading(true);
    try {
      const candidateIds = newCohortCandidates.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch('/api/growth', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_cohort',
          cohort_name: newCohortName.trim(),
          candidate_ids: candidateIds,
        }),
      });
      const data = await res.json();
      if (data.cohort) {
        setCohortId(data.cohort.id);
        setActiveTab('cohort');
        setNewCohortName('');
        setNewCohortCandidates('');
      }
    } catch {}
    finally { setLoading(false); }
  };

  const PROF_COLOR: Record<string, { background: string; color: string }> = {
    'Advanced': { background: '#E1F5EE', color: '#1D9E75' },
    'Intermediate': { background: '#E6F1FB', color: '#185FA5' },
    'Basic': { background: '#FEF0F0', color: '#D94F4F' },
  };

  return (
    <PageShell
      title="Training impact dashboard"
      subtitle="Skills velocity · Growth tracking · Cohort analytics"
      backHref="/employer-dashboard"
      actions={<span className="text-xs text-kaya-stone-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-kaya-green-400" />Kaya Growth Engine</span>}
    >
      <TabBar
        tabs={[
          { id: 'individual' as const, label: 'Individual trajectory' },
          { id: 'cohort' as const, label: 'Cohort analytics' },
          { id: 'create' as const, label: 'Create cohort' },
        ]}
        active={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

        {/* INDIVIDUAL TRAJECTORY */}
        {activeTab === 'individual' && (
          <div className="space-y-6">
            {/* Search */}
            <div className="bg-white rounded-xl border p-4 border-kaya-stone-100">
              <div className="flex gap-3">
                <input value={userId} onChange={e => setUserId(e.target.value)}
                  placeholder="Enter candidate user ID..." className="flex-1 px-4 py-2.5 border rounded-lg text-sm border-kaya-stone-100 text-kaya-navy-900" />
                <button onClick={loadTrajectory} disabled={loading || !userId.trim()}
                  className={`${loading ? "bg-kaya-stone-400" : "bg-kaya-navy-900"} px-6 py-2.5 rounded-lg text-sm font-semibold text-white`}>
                  {loading ? 'Loading...' : 'Load Trajectory'}
                </button>
              </div>
            </div>

            {trajectory && (
              <>
                {/* Summary */}
                <div className="bg-white rounded-xl border p-6 border-kaya-stone-100">
                  <h2 className="text-base font-semibold mb-3 text-kaya-navy-900">Growth Summary</h2>
                  <p className="text-sm mb-4 text-kaya-stone-600">{trajectory.summary}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg text-center bg-kaya-green-50">
                      <div className="text-2xl font-bold text-kaya-green-400">{trajectory.sessions.length}</div>
                      <div className="text-[10px] text-kaya-stone-600">Sessions</div>
                    </div>
                    <div className={trajectory.overall_improvement > 0 ? "bg-kaya-green-50" : "bg-kaya-red-50" + " p-3 rounded-lg text-center"}>
                      <div className={trajectory.overall_improvement > 0 ? "text-kaya-green-400" : "text-kaya-red-400" + " text-2xl font-bold"}>
                        {trajectory.overall_improvement > 0 ? '+' : ''}{trajectory.overall_improvement}
                      </div>
                      <div className="text-[10px] text-kaya-stone-600">Avg Level Change</div>
                    </div>
                    <div className="p-3 rounded-lg text-center bg-kaya-navy-50">
                      <div className="text-2xl font-bold text-kaya-navy-600">{trajectory.deltas.filter(d => d.direction === 'improved').length}</div>
                      <div className="text-[10px] text-kaya-stone-600">Skills Improved</div>
                    </div>
                  </div>
                </div>

                {/* Skill Deltas */}
                {trajectory.deltas.length > 0 && (
                  <div className="bg-white rounded-xl border p-6 border-kaya-stone-100">
                    <h3 className="text-sm font-semibold mb-3 text-kaya-navy-900">Skill Changes</h3>
                    <div className="space-y-2">
                      {trajectory.deltas.map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-kaya-stone-50">
                          <span className="text-sm font-medium text-kaya-navy-900">{d.skill_name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs px-2 py-0.5 rounded" style={PROF_COLOR[d.from_proficiency] || { background: '#F0F4F8', color: '#627D98' }}>{d.from_proficiency}</span>
                            <span className={d.direction === 'improved' ? 'text-kaya-green-400' : d.direction === 'declined' ? 'text-kaya-red-400' : 'text-kaya-stone-400' + " text-xs"}>
                              {d.direction === 'improved' ? '→ ↑' : d.direction === 'declined' ? '→ ↓' : '→ ='}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded" style={PROF_COLOR[d.to_proficiency] || { background: '#F0F4F8', color: '#627D98' }}>{d.to_proficiency}</span>
                            <span className="text-[10px] text-kaya-stone-200">{d.time_between_days}d</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Velocity */}
                {trajectory.velocity.length > 0 && (
                  <div className="bg-white rounded-xl border p-6 border-kaya-stone-100">
                    <h3 className="text-sm font-semibold mb-1 text-kaya-navy-900">Skills Velocity</h3>
                    <p className="text-xs mb-3 text-kaya-stone-400">Improvement rate per week. Benchmark: 0.1-0.3 standard, 0.3+ rapid.</p>
                    <div className="space-y-2">
                      {trajectory.velocity.map((v, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded bg-kaya-stone-50">
                          <span className="text-sm text-kaya-navy-900">{v.skill_name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 rounded-full bg-kaya-stone-100">
                              <div className="h-full rounded-full" style={{
                                width: `${Math.min(100, Math.abs(v.velocity) * 300)}%`,
                                background: v.velocity > 0.3 ? '#27AE60' : v.velocity > 0.1 ? '#2E86C1' : v.velocity > 0 ? '#F39C12' : '#E74C3C',
                              }} />
                            </div>
                            <span className="text-xs font-mono text-kaya-stone-600 min-w-[45px]">{v.velocity}/wk</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{
                              background: v.classification === 'rapid' ? '#D4EFDF' : v.classification === 'standard' ? '#D4E6F1' : v.classification === 'declining' ? '#FADBD8' : '#FCF3CF',
                              color: v.classification === 'rapid' ? '#1E8449' : v.classification === 'standard' ? '#2471A3' : v.classification === 'declining' ? '#C0392B' : '#7D6608',
                            }}>{v.classification}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!trajectory && !loading && userId && (
              <div className="text-center py-8">
                <p className="text-sm text-kaya-stone-400">No growth data found. The candidate needs at least 2 completed sessions.</p>
              </div>
            )}
          </div>
        )}

        {/* COHORT ANALYTICS */}
        {activeTab === 'cohort' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border p-4 border-kaya-stone-100">
              <div className="flex gap-3">
                <input value={cohortId} onChange={e => setCohortId(e.target.value)}
                  placeholder="Enter cohort ID..." className="flex-1 px-4 py-2.5 border rounded-lg text-sm border-kaya-stone-100 text-kaya-navy-900" />
                <button onClick={loadCohort} disabled={loading || !cohortId.trim()}
                  className={loading ? "bg-kaya-stone-400" : "bg-kaya-navy-600" + " px-6 py-2.5 rounded-lg text-sm font-semibold text-white"}>
                  {loading ? 'Loading...' : 'Load Cohort'}
                </button>
              </div>
            </div>

            {cohortSummary && (
              <>
                <div className="bg-white rounded-xl border p-6 border-kaya-stone-100">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-base font-semibold text-kaya-navy-900">{cohortSummary.cohort_name}</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/growth-report', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'cohort_report', cohort_id: cohortId }),
                            });
                            const data = await res.json();
                            const blob = new Blob([JSON.stringify(data.report, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = `cohort_report_${cohortId}.json`;
                            a.click(); URL.revokeObjectURL(url);
                          } catch {}
                        }}
                        className="text-[10px] px-3 py-1.5 rounded-lg font-medium bg-kaya-navy-50 text-kaya-navy-600">
                        Export Report
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch('/api/growth-report', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'funder_report', cohort_ids: [cohortId], program_name: cohortSummary.cohort_name }),
                            });
                            const data = await res.json();
                            const blob = new Blob([JSON.stringify(data.report, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url; a.download = `funder_report_${cohortId}.json`;
                            a.click(); URL.revokeObjectURL(url);
                          } catch {}
                        }}
                        className="text-[10px] px-3 py-1.5 rounded-lg font-medium bg-kaya-navy-50 text-kaya-navy-600">
                        Funder Report
                      </button>
                    </div>
                  </div>
                  <p className="text-sm mb-4 text-kaya-stone-600">{cohortSummary.summary}</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg text-center bg-kaya-navy-50">
                      <div className="text-2xl font-bold text-kaya-navy-600">{cohortSummary.candidate_count}</div>
                      <div className="text-[10px] text-kaya-stone-600">Participants</div>
                    </div>
                    <div className="p-3 rounded-lg text-center bg-kaya-green-50">
                      <div className="text-2xl font-bold text-kaya-green-400">
                        {cohortSummary.avg_improvement > 0 ? '+' : ''}{cohortSummary.avg_improvement}
                      </div>
                      <div className="text-[10px] text-kaya-stone-600">Avg Improvement</div>
                    </div>
                    <div className="p-3 rounded-lg text-center bg-kaya-navy-50">
                      <div className="text-2xl font-bold text-kaya-navy-600">
                        {Object.values(cohortSummary.skill_improvements || {}).filter((s: any) => s.avg_delta > 0).length}
                      </div>
                      <div className="text-[10px] text-kaya-stone-600">Skills Improved</div>
                    </div>
                  </div>
                </div>

                {/* Per-skill breakdown */}
                {Object.keys(cohortSummary.skill_improvements || {}).length > 0 && (
                  <div className="bg-white rounded-xl border p-6 border-kaya-stone-100">
                    <h3 className="text-sm font-semibold mb-3 text-kaya-navy-900">Skills Breakdown</h3>
                    <div className="space-y-2">
                      {Object.entries(cohortSummary.skill_improvements).map(([skill, data]: [string, any], i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-kaya-stone-50">
                          <span className="text-sm font-medium text-kaya-navy-900">{skill}</span>
                          <div className="flex items-center gap-3">
                            <span className={data.avg_delta > 0 ? 'text-kaya-green-400' : data.avg_delta < 0 ? 'text-kaya-red-400' : 'text-kaya-stone-400' + " text-xs"}>
                              {data.avg_delta > 0 ? '+' : ''}{data.avg_delta} avg
                            </span>
                            <span className="text-[10px] text-kaya-stone-400">
                              {data.improved_count}/{data.total_count} improved
                            </span>
                            <div className="w-16 h-2 rounded-full bg-kaya-stone-100">
                              <div className="h-full rounded-full" style={{
                                width: `${Math.round((data.improved_count / Math.max(1, data.total_count)) * 100)}%`,
                                background: data.avg_delta > 0 ? '#27AE60' : '#E74C3C',
                              }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top movers */}
                {cohortSummary.top_movers?.length > 0 && (
                  <div className="bg-white rounded-xl border p-6 border-kaya-stone-100">
                    <h3 className="text-sm font-semibold mb-3 text-kaya-navy-900">Top Movers</h3>
                    <div className="space-y-1.5">
                      {cohortSummary.top_movers.map((m: any, i: number) => (
                        <div key={i} className={i === 0 ? 'bg-kaya-green-50' : 'bg-kaya-stone-50' + " flex items-center justify-between text-sm p-2 rounded"}>
                          <span className="text-kaya-navy-900">{i + 1}. {m.candidate_id.substring(0, 12)}...</span>
                          <span className="font-semibold text-kaya-green-400">+{m.improvement} levels</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CREATE COHORT */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-xl border p-6 border-kaya-stone-100">
            <h2 className="text-base font-semibold mb-4 text-kaya-navy-900">Create Training Cohort</h2>
            <p className="text-sm mb-4 text-kaya-stone-600">
              Group candidates by training program to measure collective impact. Tag their sessions as &ldquo;baseline&rdquo; before training starts and &ldquo;post-program&rdquo; after.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-kaya-navy-900">Cohort Name *</label>
                <input value={newCohortName} onChange={e => setNewCohortName(e.target.value)}
                  placeholder="e.g. Accenture Digital Skills Q2 2026"
                  className="w-full px-4 py-2.5 border rounded-lg text-sm border-kaya-stone-100 text-kaya-navy-900" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-kaya-navy-900">Candidate User IDs (comma-separated)</label>
                <textarea value={newCohortCandidates} onChange={e => setNewCohortCandidates(e.target.value)}
                  placeholder="user-id-1, user-id-2, user-id-3"
                  rows={3} className="w-full px-4 py-2.5 border rounded-lg text-sm resize-none border-kaya-stone-100 text-kaya-navy-900" />
              </div>
              <button onClick={createCohort} disabled={loading || !newCohortName.trim()}
                className={loading ? "bg-kaya-stone-400" : "bg-kaya-navy-600" + " px-6 py-2.5 rounded-lg text-sm font-semibold text-white"}>
                {loading ? 'Creating...' : 'Create Cohort'}
              </button>
            </div>
          </div>
        )}
    </PageShell>
  );
}
