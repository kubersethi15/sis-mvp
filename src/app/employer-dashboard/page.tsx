'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageShell, TabBar, Card, SectionHeader, Button, StatusBadge, MetricCard, DataTable, TableRow, TableCell, GateIndicator, LoadingState, EmptyState, Input, TextArea, Alert, Divider } from '@/components/KayaUI';

export default function EmployerDashboardPage() {
  const [employer, setEmployer] = useState<any>(null);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [talentMatches, setTalentMatches] = useState<any[]>([]);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);
  const [seedText, setSeedText] = useState('');
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioStatus, setScenarioStatus] = useState('');
  const [generatedScenarios, setGeneratedScenarios] = useState<any[]>([]);
  const [graphSummary, setGraphSummary] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const stateRes = await fetch('/api/demo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_demo_state' }),
      });
      const state = await stateRes.json();
      if (state.employers?.length > 0) setEmployer(state.employers[0]);
      setVacancies(state.vacancies || []);
      setApplications(state.applications || []);
      try {
        const talentRes = await fetch('/api/psychologist', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_all_extractions' }),
        });
        const talentData = await talentRes.json();
        setTalentMatches(talentData.extractions || []);
      } catch {}
    } catch (e) { console.error('Failed to load:', e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <PageShell title="Employer dashboard" subtitle="Kaya employer portal">
      <LoadingState message="Loading your workspace..." />
    </PageShell>
  );

  const counts = { applied: 0, gate1: 0, gate2: 0, gate3: 0, selected: 0 };
  applications.forEach(a => {
    if (a.status?.includes('gate1')) counts.gate1++;
    else if (a.status?.includes('gate2')) counts.gate2++;
    else if (a.status?.includes('gate3')) counts.gate3++;
    else if (a.status === 'selected') counts.selected++;
    else counts.applied++;
  });

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'vacancies', label: 'Vacancies', count: vacancies.length },
    { id: 'talent', label: 'Talent pool', count: talentMatches.length },
    { id: 'scenarios', label: 'Scenarios' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <PageShell
      title={employer?.organization_name || 'Employer dashboard'}
      subtitle="Kaya employer portal"
      actions={
        <Link href="/reviewer" className="text-caption text-white/60 hover:text-white transition-colors">
          Open reviewer portal →
        </Link>
      }
    >
      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {/* ═══════════ OVERVIEW ═══════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Pipeline metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <MetricCard label="Applied" value={counts.applied} variant="navy" />
            <MetricCard label="Gate 1" value={counts.gate1} />
            <MetricCard label="Gate 2" value={counts.gate2} />
            <MetricCard label="Gate 3" value={counts.gate3} />
            <MetricCard label="Selected" value={counts.selected} variant="success" />
          </div>

          {/* Gate process */}
          <Card>
            <SectionHeader title="Three-gate hiring process" subtitle="Every gate has a human reviewer. Kaya supports decisions, never makes them." />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { gate: 1 as const, title: 'Alignment', role: 'Recruiter', desc: 'Does this candidate align with what the role needs?' },
                { gate: 2 as const, title: 'Evidence', role: 'Hiring manager', desc: 'Is there sufficient behavioral evidence of their capabilities?' },
                { gate: 3 as const, title: 'Predictability', role: 'Final approver', desc: 'Given simulation + peer data, will this person succeed?' },
              ].map(g => (
                <div key={g.gate} className="p-4 rounded-kaya border border-kaya-stone-200">
                  <GateIndicator gate={g.gate} status="pending" />
                  <p className="text-body text-kaya-stone-600 mt-3">{g.desc}</p>
                  <p className="text-caption text-kaya-stone-200 mt-1">Reviewer: {g.role}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent applications */}
          {applications.length > 0 && (
            <Card>
              <SectionHeader
                title="Recent applications"
                action={<Link href="/reviewer" className="text-caption text-kaya-navy-600 hover:underline">View all in reviewer →</Link>}
              />
              <DataTable headers={['Candidate', 'Vacancy', 'Status', 'Gate']}>
                {applications.slice(0, 5).map((app, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-kaya-navy-900">{app.jobseekers?.user_profiles?.full_name || 'Candidate'}</TableCell>
                    <TableCell>{app.vacancies?.title || '—'}</TableCell>
                    <TableCell><StatusBadge status={app.status?.includes('passed') ? 'passed' : app.status?.includes('selected') ? 'selected' : app.status?.includes('stopped') ? 'stopped' : 'pending'} size="sm" /></TableCell>
                    <TableCell className="text-kaya-navy-900 font-medium">{app.current_gate || 1}</TableCell>
                  </TableRow>
                ))}
              </DataTable>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════ VACANCIES ═══════════ */}
      {activeTab === 'vacancies' && (
        <div className="space-y-4">
          {vacancies.length === 0 ? (
            <EmptyState title="No vacancies yet" description="Create your first vacancy to start receiving applications." action={<Link href="/employer"><Button>Create vacancy</Button></Link>} />
          ) : (
            vacancies.map((v, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-h2 text-kaya-navy-900">{v.title}</h3>
                    <p className="text-body text-kaya-stone-600 mt-1 line-clamp-2">{v.description?.substring(0, 200)}</p>
                  </div>
                  <StatusBadge status="active" size="sm" />
                </div>
                {v.competency_blueprint?.human_centric_skills && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-kaya-stone-200">
                    {v.competency_blueprint.human_centric_skills.slice(0, 6).map((s: any, j: number) => (
                      <span key={j} className="text-caption px-2 py-0.5 rounded-kaya-sm bg-kaya-navy-50 text-kaya-navy-600 font-medium">
                        {typeof s === 'string' ? s : s.skill}
                      </span>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* ═══════════ TALENT POOL ═══════════ */}
      {activeTab === 'talent' && (
        <div>
          {talentMatches.length === 0 ? (
            <EmptyState title="No assessed candidates yet" description="Candidates who complete the Kaya process will appear here with their verified skills." />
          ) : (
            <div className="space-y-3">
              {talentMatches.map((t: any, i: number) => (
                <Card key={i} padding="tight">
                  <button onClick={() => setExpandedCandidate(expandedCandidate === t.id ? null : t.id)} className="w-full text-left">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-h3 text-kaya-navy-900">{t.candidate_name || `Candidate ${(t.id || '').substring(0, 8)}`}</span>
                        <span className="text-caption text-kaya-stone-600 ml-2">
                          {t.skills_profile?.length || 0} skills evidenced
                        </span>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B4B2A9" strokeWidth="2" className={`transition-transform ${expandedCandidate === t.id ? 'rotate-180' : ''}`}>
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>
                  </button>
                  {expandedCandidate === t.id && t.skills_profile && (
                    <div className="mt-3 pt-3 border-t border-kaya-stone-200 space-y-2">
                      {t.skills_profile.map((s: any, j: number) => (
                        <div key={j} className="flex items-center justify-between">
                          <span className="text-body text-kaya-stone-600">{s.skill_name}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-caption px-1.5 py-0.5 rounded-kaya-sm font-medium ${
                              s.proficiency === 'Advanced' ? 'bg-kaya-green-50 text-kaya-green-400' :
                              s.proficiency === 'Intermediate' ? 'bg-kaya-navy-50 text-kaya-navy-600' :
                              'bg-kaya-stone-50 text-kaya-stone-600'
                            }`}>{s.proficiency}</span>
                            <div className="w-12 h-1 rounded-full bg-kaya-stone-200">
                              <div className="h-full rounded-full bg-kaya-navy-600" style={{ width: `${Math.round((s.confidence || 0.5) * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════ SCENARIOS ═══════════ */}
      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          <Card>
            <SectionHeader
              title="Custom assessment scenarios"
              subtitle="Generate workplace simulation scenarios tailored to your company. Upload job descriptions, handbook excerpts, or company information."
            />
            <TextArea
              value={seedText}
              onChange={(e: any) => setSeedText(e.target.value)}
              placeholder={"Paste your workplace context here.\n\nExamples:\n• Job descriptions for the roles you're hiring\n• Company handbook excerpts about team structure\n• Description of common workplace challenges\n• Customer interaction guidelines"}
              rows={8}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-caption text-kaya-stone-200">
                {seedText.length > 0 ? `${seedText.length} characters` : 'Paste or type your company context'}
                {seedText.length > 0 && seedText.length < 200 && ' — add more detail for better results'}
              </span>
              <Button
                variant={seedText.length >= 100 ? 'primary' : 'secondary'}
                disabled={scenarioLoading || seedText.length < 100 || !employer?.id}
                onClick={async () => {
                  if (!employer?.id || seedText.length < 100) return;
                  setScenarioLoading(true);
                  setScenarioStatus('Analysing your workplace...');
                  try {
                    const res = await fetch('/api/employer-graph', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'full_pipeline', employer_id: employer.id, seed_material: seedText }),
                    });
                    const data = await res.json();
                    if (data.success) {
                      setGraphSummary(data.graph_summary);
                      setGeneratedScenarios(data.scenarios || []);
                      setScenarioStatus(`Done — ${data.scenarios?.length || 0} scenarios generated.`);
                    } else {
                      setScenarioStatus('Generation failed: ' + (data.error || 'Unknown error'));
                    }
                  } catch (e: any) { setScenarioStatus('Error: ' + e.message); }
                  finally { setScenarioLoading(false); }
                }}
              >
                {scenarioLoading ? 'Generating...' : 'Generate scenarios'}
              </Button>
            </div>

            {scenarioStatus && (
              <div className="mt-3">
                <Alert variant={scenarioStatus.includes('Done') ? 'success' : scenarioStatus.includes('Error') || scenarioStatus.includes('failed') ? 'error' : 'info'}>
                  {scenarioLoading && <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full mr-2 animate-spin" />}
                  {scenarioStatus}
                </Alert>
              </div>
            )}
          </Card>

          {/* Graph summary */}
          {graphSummary && (
            <Card>
              <SectionHeader title="Workplace analysis" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <MetricCard label="Entities found" value={graphSummary.nodes} variant="navy" />
                <MetricCard label="Relationships" value={graphSummary.edges} />
                <MetricCard label="Friction points" value={graphSummary.friction_points} />
                <MetricCard label="Industry" value={graphSummary.industry || 'General'} />
              </div>
              {graphSummary.critical_skills?.length > 0 && (
                <div>
                  <p className="text-h3 text-kaya-navy-900 mb-2">Critical skills identified</p>
                  <div className="flex flex-wrap gap-1.5">
                    {graphSummary.critical_skills.map((s: string, i: number) => (
                      <span key={i} className="text-caption px-2 py-0.5 rounded-kaya-sm bg-kaya-navy-50 text-kaya-navy-600 font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Generated scenarios */}
          {generatedScenarios.length > 0 && (
            <Card>
              <SectionHeader
                title={`Generated scenarios (${generatedScenarios.length})`}
                action={<StatusBadge status="active" size="sm" />}
              />
              <div className="space-y-3">
                {generatedScenarios.map((s: any, i: number) => (
                  <div key={i} className="p-4 rounded-kaya border border-kaya-stone-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-h3 text-kaya-navy-900">{s.title}</span>
                      <span className="text-caption px-1.5 py-0.5 rounded-kaya-sm bg-kaya-stone-50 text-kaya-stone-600">
                        {s.characters?.length || '?'} characters · {s.target_skills?.length || '?'} skills
                      </span>
                    </div>
                    <p className="text-body text-kaya-stone-600">{s.setting}</p>
                    {s.target_skills && (
                      <div className="flex gap-1 mt-2">
                        {s.target_skills.map((sk: string, j: number) => (
                          <span key={j} className="text-caption px-1.5 py-0.5 rounded-kaya-sm bg-kaya-navy-50 text-kaya-navy-600">{sk}</span>
                        ))}
                      </div>
                    )}
                    {s.characters && (
                      <div className="flex gap-2 mt-2 pt-2 border-t border-kaya-stone-200">
                        {s.characters.map((c: any, j: number) => (
                          <span key={j} className="text-caption px-2 py-0.5 rounded-full bg-kaya-stone-50 text-kaya-stone-600">{c.name} ({c.role})</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {generatedScenarios.length === 0 && !scenarioLoading && !graphSummary && (
            <EmptyState title="No custom scenarios yet" description="Upload your workplace context above to generate employer-specific assessment scenarios." />
          )}
        </div>
      )}

      {/* ═══════════ SETTINGS ═══════════ */}
      {activeTab === 'settings' && (
        <Card>
          <SectionHeader title="Company profile" />
          {employer ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ['Organisation', employer.organization_name],
                  ['Industry', employer.industry || 'Not set'],
                  ['Location', employer.location || employer.locations?.[0]?.city || 'Not set'],
                  ['Size', employer.company_size || 'Not set'],
                ].map(([l, v]) => (
                  <div key={l as string}>
                    <span className="text-h3 text-kaya-navy-900">{l}: </span>
                    <span className="text-body text-kaya-stone-600">{v}</span>
                  </div>
                ))}
              </div>
              {employer.accessibility_features && (
                <>
                  <Divider />
                  <div>
                    <span className="text-h3 text-kaya-navy-900">Accessibility: </span>
                    <span className="text-body text-kaya-stone-600">{employer.accessibility_features}</span>
                  </div>
                </>
              )}
              <Divider />
              <div>
                <p className="text-h3 text-kaya-navy-900 mb-3">Three-gate reviewer assignments</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {([
                    { gate: 1 as const, label: 'Alignment', role: 'Recruiter' },
                    { gate: 2 as const, label: 'Evidence', role: 'Hiring manager' },
                    { gate: 3 as const, label: 'Predictability', role: 'Final approver' },
                  ]).map(g => (
                    <div key={g.gate} className="p-3 rounded-kaya border border-kaya-stone-200">
                      <GateIndicator gate={g.gate} status="pending" />
                      <p className="text-body text-kaya-stone-600 mt-2">
                        {employer.reviewer_assignments?.[`gate${g.gate}_${g.role.toLowerCase().replace(' ', '_')}`] || g.role}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-body text-kaya-stone-600">Set up your organisation to start posting vacancies.</p>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.target as HTMLFormElement);
                try {
                  const res = await fetch('/api/gate1', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'create_employer', organization_name: fd.get('org_name'),
                      industry: fd.get('industry'), locations: [{ city: fd.get('location'), country: 'Philippines' }],
                      company_size: fd.get('company_size'), benefits: fd.get('benefits'),
                      accessibility_features: fd.get('accessibility'),
                      reviewer_assignments: { gate1_recruiter: fd.get('g1') || 'Recruiter', gate2_hiring_manager: fd.get('g2') || 'Hiring Manager', gate3_final_approver: fd.get('g3') || 'Final Approver' },
                      work_arrangements: { remote: true, onsite: true, hybrid: true }
                    })
                  });
                  if (res.ok) window.location.reload();
                } catch (err) { console.error(err); }
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Organisation *" name="org_name" required placeholder="e.g. Accenture Philippines" />
                  <Input label="Industry" name="industry" placeholder="e.g. Financial services" />
                  <Input label="Location" name="location" placeholder="e.g. Manila" />
                  <div>
                    <label className="block text-h3 text-kaya-navy-900 mb-1">Size</label>
                    <select name="company_size" className="w-full px-3 py-2.5 text-body text-kaya-navy-900 bg-white border border-kaya-stone-200 rounded-kaya outline-none focus:border-kaya-navy-600">
                      <option value="">Select</option>
                      <option value="1-50">1–50</option>
                      <option value="51-200">51–200</option>
                      <option value="201-1000">201–1,000</option>
                      <option value="1000+">1,000+</option>
                    </select>
                  </div>
                </div>
                <Input label="Accessibility features" name="accessibility" placeholder="e.g. Wheelchair ramp, screen reader support" />
                <Input label="Benefits" name="benefits" placeholder="e.g. HMO, flexible hours" />
                <Divider />
                <p className="text-h3 text-kaya-navy-900">Gate reviewers</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input label="Gate 1 — Alignment" name="g1" placeholder="Recruiter" />
                  <Input label="Gate 2 — Evidence" name="g2" placeholder="Hiring manager" />
                  <Input label="Gate 3 — Predictability" name="g3" placeholder="Final approver" />
                </div>
                <Button type="submit" className="w-full">Create employer profile</Button>
              </form>
            </div>
          )}
        </Card>
      )}
    </PageShell>
  );
}
