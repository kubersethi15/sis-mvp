'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageShell, TabBar, Card, SectionHeader, Button, StatusBadge, ProficiencyBadge, ConfidenceBar, MetricCard, DataTable, TableRow, TableCell, LoadingState, EmptyState, Divider, Alert } from '@/components/KayaUI';

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
  gate3: { readiness_index: number; success_conditions: any[]; support_needs: any[]; ai_recommendation: string; reviewer_decision: string; simulation_results?: any } | null;
}

export default function ReviewerDashboard() {
  const [activeView, setActiveView] = useState('pipeline');
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
            id: app.id, status: app.status, current_gate: app.current_gate,
            applied_at: det.application?.applied_at, final_outcome: app.final_outcome,
            vacancy: det.vacancy ? { title: det.vacancy.title, employer_id: det.vacancy.employer_id } : null,
            jobseeker: { full_name: jsName },
            gate1: det.gates?.gate1 || null, gate2: det.gates?.gate2 || null, gate3: det.gates?.gate3 || null,
          });
        } catch {}
      }
      setApps(detailed);
    } catch (e) { console.error('Load error:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGateAction = async (appId: string, gate: number, action: string) => {
    try {
      await fetch('/api/demo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'process_gate', application_id: appId, gate, decision: action }),
      });
      fetchData();
    } catch {}
  };

  if (loading) {
    return (
      <PageShell title="Three-gate hiring pipeline" subtitle="Alignment → Evidence → Predictability">
        <LoadingState message="Loading pipeline data..." />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Three-gate hiring pipeline"
      subtitle="Human decision at every gate"
      backHref="/employer-dashboard"
      actions={<Button variant="ghost" size="sm" onClick={fetchData}>Refresh</Button>}
    >
      <TabBar
        tabs={[
          { id: 'pipeline', label: 'Pipeline overview' },
          { id: 'gate1', label: 'Gate 1: Alignment' },
          { id: 'gate2', label: 'Gate 2: Evidence' },
          { id: 'gate3', label: 'Gate 3: Predictability' },
        ]}
        active={activeView}
        onChange={setActiveView}
      />

      {activeView === 'pipeline' && (
        <div className="space-y-6">
          <Card>
            <SectionHeader title="Hiring funnel" />
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
              <MetricCard label="Applied" value={counts.applied} />
              <MetricCard label="Gate 1" value={counts.gate1} sublabel="Alignment" />
              <MetricCard label="Gate 2" value={counts.gate2} sublabel="Evidence" />
              <MetricCard label="Gate 3" value={counts.gate3} sublabel="Predictability" />
              <MetricCard label="Selected" value={counts.selected} variant="success" />
            </div>
          </Card>

          <Card>
            <SectionHeader title="All applications" subtitle={`${apps.length} total`} />
            {apps.length === 0 ? (
              <EmptyState title="No applications yet" description="Candidates will appear here when they apply to your vacancies." />
            ) : (
              <div className="mt-4 space-y-3">
                {apps.map(app => (
                  <ApplicationCard key={app.id} app={app} onAction={handleGateAction} />
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {activeView === 'gate1' && <GateView gate={1} apps={apps} onAction={handleGateAction} />}
      {activeView === 'gate2' && <GateView gate={2} apps={apps} onAction={handleGateAction} />}
      {activeView === 'gate3' && <GateView gate={3} apps={apps} onAction={handleGateAction} />}
    </PageShell>
  );
}

function ApplicationCard({ app, onAction }: { app: AppData; onAction: (id: string, gate: number, action: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-kaya-stone-200/60 rounded-kaya-lg overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-kaya-stone-50/50 transition-colors text-left">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-kaya-navy-900 flex items-center justify-center text-white text-caption font-bold">
            {app.jobseeker?.full_name?.charAt(0) || '?'}
          </div>
          <div>
            <span className="text-body font-semibold text-kaya-navy-900">{app.jobseeker?.full_name || 'Unknown'}</span>
            <span className="text-caption text-kaya-stone-600 ml-2">{app.vacancy?.title || 'No vacancy'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={app.status as any} />
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-kaya-stone-200 transition-transform ${expanded ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-kaya-stone-200/40 space-y-2 pt-3">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(g => {
              const gd = g === 1 ? app.gate1 : g === 2 ? app.gate2 : app.gate3;
              const labels: Record<number, string> = { 1: 'Alignment', 2: 'Evidence', 3: 'Predictability' };
              return (
                <div key={g} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-caption font-bold ${gd ? 'bg-kaya-navy-900 text-white' : 'bg-kaya-stone-50 text-kaya-stone-200 border border-kaya-stone-200'}`}>{g}</div>
                  <span className="text-caption text-kaya-stone-600">{labels[g]}</span>
                  {gd && <StatusBadge status={((gd as any).reviewer_decision || 'pending') as any} size="sm" />}
                  {g < 3 && <span className="text-kaya-stone-200 mx-1">→</span>}
                </div>
              );
            })}
          </div>

          {app.gate1 && (
            <GateDetail gate={1} data={app.gate1} appId={app.id} onAction={onAction} skills={null} sim={null} />
          )}
          {app.gate2 && (
            <GateDetail gate={2} data={app.gate2} appId={app.id} onAction={onAction} skills={app.gate2.leee_skills_profile} sim={null} />
          )}
          {app.gate3 && (
            <GateDetail gate={3} data={app.gate3} appId={app.id} onAction={onAction} skills={null} sim={(app.gate3 as any).simulation_results} />
          )}
        </div>
      )}
    </div>
  );
}

function GateDetail({ gate, data, appId, onAction, skills, sim }: {
  gate: number; data: any; appId: string;
  onAction: (id: string, gate: number, action: string) => void;
  skills: any[] | null; sim: any | null;
}) {
  const labels: Record<number, string> = { 1: 'Alignment', 2: 'Evidence', 3: 'Predictability' };
  return (
    <div className="p-3 rounded-kaya bg-kaya-navy-50/50">
      <div className="flex items-center justify-between mb-1">
        <span className="text-caption font-semibold text-kaya-navy-900">Gate {gate} — {labels[gate]}</span>
        {gate === 1 && <span className="text-caption font-mono text-kaya-navy-600">{data.alignment_score}%</span>}
        {gate === 2 && <StatusBadge status={data.evidence_rating as any} size="sm" />}
        {gate === 3 && <span className="text-caption font-mono text-kaya-navy-600">Readiness: {data.readiness_index}/100</span>}
      </div>
      <p className="text-caption text-kaya-stone-600 mb-2">{data.ai_recommendation}</p>

      {skills && skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {skills.slice(0, 5).map((s: any, i: number) => (
            <span key={i} className="inline-flex items-center gap-1 text-caption px-2 py-0.5 rounded-kaya-sm bg-white border border-kaya-stone-200/60">
              <span className="text-kaya-navy-900 font-medium">{s.skill_name}</span>
              <ProficiencyBadge level={s.proficiency} size="sm" />
            </span>
          ))}
        </div>
      )}

      {sim?.convergence?.length > 0 && (
        <div className="space-y-1 mb-2">
          <span className="text-caption font-semibold text-kaya-navy-600">L1 ↔ L2 Convergence</span>
          {sim.convergence.slice(0, 3).map((c: any, i: number) => (
            <div key={i} className="flex items-center justify-between text-caption px-2 py-1 rounded-kaya-sm bg-white">
              <span className="text-kaya-navy-900">{c.skill_name}</span>
              <div className="flex items-center gap-2">
                <span className="text-kaya-stone-600">L1: {c.layer1_score}</span>
                <span className={c.convergent ? 'text-kaya-green-400' : 'text-kaya-warning'}>{c.convergent ? '✓' : '⚠'}</span>
                <span className="text-kaya-stone-600">L2: {c.layer2_score}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {sim?.gaming_flags?.length > 0 && (
        <Alert variant="warning">
          <span className="font-semibold block mb-0.5">Gaming flags</span>
          {sim.gaming_flags.map((f: string, i: number) => <p key={i} className="text-caption">{f}</p>)}
        </Alert>
      )}

      {!data.reviewer_decision && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="success" onClick={() => onAction(appId, gate, 'passed')}>
            {gate === 3 ? 'Select' : gate === 2 ? 'Pass → Simulation' : 'Pass'}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onAction(appId, gate, 'held')}>Hold</Button>
          <Button size="sm" variant="danger" onClick={() => onAction(appId, gate, gate === 3 ? 'declined' : 'stopped')}>
            {gate === 3 ? 'Decline' : 'Stop'}
          </Button>
        </div>
      )}
    </div>
  );
}

function GateView({ gate, apps, onAction }: { gate: number; apps: AppData[]; onAction: (id: string, gate: number, action: string) => void }) {
  const config: Record<number, { title: string; role: string; desc: string; guidance: string }> = {
    1: { title: 'Gate 1: Alignment', role: 'Recruiter', desc: 'Does this candidate align with the role requirements?', guidance: 'Check whether the candidate\'s profile and skills match what the role needs. Look at the alignment score, strengths, and gaps. Pass candidates who show potential alignment even if not perfect.' },
    2: { title: 'Gate 2: Evidence', role: 'Hiring Manager', desc: 'Is there sufficient behavioral evidence?', guidance: 'Review the extracted skills evidence from the Aya conversation. Look at specific stories and behavioral indicators, not just scores. Check evidence quality and watch for gaming flags.' },
    3: { title: 'Gate 3: Predictability', role: 'Final Approver', desc: 'Will this candidate succeed in the role?', guidance: 'Review the simulation performance, peer validation, and three-layer convergence. Look for consistency across all evidence sources. Check gaming flags and support needs.' },
  };
  const cfg = config[gate];

  const gateApps = apps.filter(a => {
    if (gate === 1) return a.gate1 !== null;
    if (gate === 2) return a.gate2 !== null;
    return a.gate3 !== null;
  });

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-body font-bold bg-kaya-navy-900 text-white">G{gate}</div>
          <div>
            <h2 className="text-h1 text-kaya-navy-900">{cfg.title}</h2>
            <p className="text-caption text-kaya-stone-600">{cfg.role} — {cfg.desc}</p>
          </div>
        </div>
        <div className="px-4 py-3 rounded-kaya bg-kaya-navy-50 border-l-2 border-kaya-navy-600">
          <p className="text-caption text-kaya-navy-900">{cfg.guidance}</p>
        </div>
      </Card>

      {gateApps.length === 0 ? (
        <EmptyState title={`No candidates at ${cfg.title}`} description="Candidates will appear here as they progress through the pipeline." />
      ) : (
        <div className="space-y-4">
          {gateApps.map(app => {
            const gateData = gate === 1 ? app.gate1 : gate === 2 ? app.gate2 : app.gate3;
            if (!gateData) return null;
            return (
              <Card key={app.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-kaya-navy-900 flex items-center justify-center text-white font-bold text-body">
                      {app.jobseeker?.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h3 className="text-h2 text-kaya-navy-900">{app.jobseeker?.full_name}</h3>
                      <span className="text-caption text-kaya-stone-600">{app.vacancy?.title}</span>
                    </div>
                  </div>
                  <StatusBadge status={(gateData.reviewer_decision || 'pending') as any} />
                </div>

                <div className="p-3 rounded-kaya bg-kaya-stone-50 mb-4">
                  <span className="text-caption font-semibold text-kaya-navy-900 block mb-1">AI recommendation</span>
                  <p className="text-body text-kaya-stone-600">{gateData.ai_recommendation}</p>
                </div>

                {gate === 1 && app.gate1 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-caption font-semibold text-kaya-navy-900">Alignment</span>
                      <div className="flex-1 h-2 rounded-full bg-kaya-stone-50">
                        <div className="h-full rounded-full bg-kaya-navy-600 transition-all" style={{ width: `${app.gate1.alignment_score}%` }} />
                      </div>
                      <span className="text-body font-mono font-bold text-kaya-navy-900">{app.gate1.alignment_score}%</span>
                    </div>
                    {app.gate1.strengths?.length > 0 && (
                      <div>
                        <span className="text-caption font-semibold text-kaya-green-400">Strengths</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {app.gate1.strengths.map((s: any, i: number) => (
                            <span key={i} className="text-caption px-2 py-0.5 rounded-kaya-sm bg-kaya-green-50 text-kaya-green-400">{typeof s === 'string' ? s : s.skill || s.strength}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {app.gate1.gaps?.length > 0 && (
                      <div>
                        <span className="text-caption font-semibold text-kaya-warning">Gaps</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {app.gate1.gaps.map((g: any, i: number) => (
                            <span key={i} className="text-caption px-2 py-0.5 rounded-kaya-sm bg-kaya-warning-bg text-kaya-warning">{typeof g === 'string' ? g : g.skill || g.gap}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {gate === 2 && app.gate2?.leee_skills_profile?.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-caption font-semibold text-kaya-navy-900 block mb-2">Extracted skills</span>
                    {app.gate2!.leee_skills_profile.map((s: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 py-1.5">
                        <span className="text-body font-medium text-kaya-navy-900 w-36 flex-none">{s.skill_name}</span>
                        <ConfidenceBar value={s.confidence || 0.5} />
                        <ProficiencyBadge level={s.proficiency} />
                      </div>
                    ))}
                  </div>
                )}

                {gate === 3 && app.gate3 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-caption font-semibold text-kaya-navy-900">Readiness</span>
                      <div className="flex-1 h-2 rounded-full bg-kaya-stone-50">
                        <div className="h-full rounded-full bg-kaya-green-400" style={{ width: `${app.gate3.readiness_index}%` }} />
                      </div>
                      <span className="text-body font-mono font-bold text-kaya-navy-900">{app.gate3.readiness_index}/100</span>
                    </div>
                    {(app.gate3 as any).simulation_results?.convergence?.length > 0 && (
                      <DataTable headers={['Skill', 'Conversation', '', 'Simulation']}>
                        {(app.gate3 as any).simulation_results.convergence.map((c: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell><span className="font-medium text-kaya-navy-900">{c.skill_name}</span></TableCell>
                            <TableCell>{c.layer1_score}</TableCell>
                            <TableCell><span className={c.convergent ? 'text-kaya-green-400' : 'text-kaya-warning'}>{c.convergent ? '✓ Match' : '⚠ Divergent'}</span></TableCell>
                            <TableCell>{c.layer2_score}</TableCell>
                          </TableRow>
                        ))}
                      </DataTable>
                    )}
                    {(app.gate3 as any).simulation_results?.gaming_flags?.length > 0 && (
                      <Alert variant="warning">
                        <span className="font-semibold">Gaming flags</span>
                        {(app.gate3 as any).simulation_results.gaming_flags.map((f: string, i: number) => <p key={i}>{f}</p>)}
                      </Alert>
                    )}
                  </div>
                )}

                {!gateData.reviewer_decision && (
                  <>
                    <Divider />
                    <div className="flex items-center justify-between">
                      <span className="text-caption text-kaya-stone-600">Your decision</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="success" onClick={() => onAction(app.id, gate, 'passed')}>{gate === 3 ? 'Select' : 'Pass'}</Button>
                        <Button size="sm" variant="secondary" onClick={() => onAction(app.id, gate, 'held')}>Hold</Button>
                        <Button size="sm" variant="danger" onClick={() => onAction(app.id, gate, gate === 3 ? 'declined' : 'stopped')}>{gate === 3 ? 'Decline' : 'Stop'}</Button>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
