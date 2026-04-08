'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const GATES = [
  { num: 1, label: 'Alignment', reviewer: 'Recruiter', color: '#2E86C1', bg: '#EBF5FB' },
  { num: 2, label: 'Evidence', reviewer: 'Hiring Manager', color: '#27AE60', bg: '#E8F8F5' },
  { num: 3, label: 'Predictability', reviewer: 'Final Approver', color: '#8E44AD', bg: '#F4ECF7' },
];

export default function EmployerDashboardPage() {
  const [employer, setEmployer] = useState<any>(null);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'vacancies' | 'talent' | 'settings'>('overview');
  const [talentMatches, setTalentMatches] = useState<any[]>([]);
  const [expandedCandidate, setExpandedCandidate] = useState<string | null>(null);

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
      } catch (e) {}
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const getAppsForVacancy = (vid: string) => applications.filter(a => a.vacancy_id === vid);

  const getPipelineCounts = (vid?: string) => {
    const apps = vid ? getAppsForVacancy(vid) : applications;
    return {
      applied: apps.filter(a => a.status === 'applied' || a.status === 'eligibility_pending').length,
      gate1: apps.filter(a => a.status?.includes('gate1') || a.current_gate === 1).length,
      gate2: apps.filter(a => a.status?.includes('gate2') || a.current_gate === 2).length,
      gate3: apps.filter(a => a.status?.includes('gate3') || a.current_gate === 3).length,
      selected: apps.filter(a => a.status === 'selected').length,
      total: apps.length,
    };
  };

  const initials = (name: string) => name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '??';
  const companyInit = employer?.organization_name ? initials(employer.organization_name) : 'KY';
  const counts = getPipelineCounts();

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF9' }}><p className="text-sm" style={{ color: '#829AB1' }}>Loading...</p></div>;

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      <nav className="px-6 py-3 flex items-center justify-between" style={{ background: '#102A43' }}>
        <Link href="/employer-dashboard" className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#486581' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#48BB78' }} />
          </div>
          <span className="text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#F0F4F8' }}>kaya</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link href="/employer" className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: '#48BB78', color: 'white' }}>New Vacancy</Link>
          <Link href="/reviewer" className="text-xs" style={{ color: '#9FB3C8' }}>Pipeline</Link>
          <Link href="/psychologist" className="text-xs" style={{ color: '#9FB3C8' }}>Validation</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-md" style={{ background: '#102A43' }}>{companyInit}</div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#102A43' }}>{employer?.organization_name || 'Employer Dashboard'}</h1>
            <p className="text-xs" style={{ color: '#627D98' }}>Kaya Employer Portal</p>
          </div>
        </div>
        <div className="flex gap-1" style={{ borderBottom: '1px solid #E2E8F0' }}>
          {([
            { id: 'overview' as const, label: 'Overview' },
            { id: 'vacancies' as const, label: `Vacancies (${vacancies.length})` },
            { id: 'talent' as const, label: `Talent (${talentMatches.length})` },
            { id: 'settings' as const, label: 'Settings' },
          ]).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ color: activeTab === tab.id ? '#102A43' : '#829AB1', borderBottom: activeTab === tab.id ? '2px solid #102A43' : '2px solid transparent' }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* OVERVIEW */}
        {activeTab === 'overview' && (<div className="space-y-6">
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E2E8F0' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#102A43' }}>Hiring Pipeline</h2>
            <div className="flex items-stretch gap-2">
              {[
                { label: 'Applied', count: counts.applied, color: '#486581', bg: '#F0F4F8' },
                { label: 'Gate 1: Alignment', count: counts.gate1, color: '#2E86C1', bg: '#EBF5FB' },
                { label: 'Gate 2: Evidence', count: counts.gate2, color: '#27AE60', bg: '#E8F8F5' },
                { label: 'Gate 3: Predictability', count: counts.gate3, color: '#8E44AD', bg: '#F4ECF7' },
                { label: 'Selected', count: counts.selected, color: '#48BB78', bg: '#F0FFF4' },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className="flex-1 rounded-xl p-4 text-center" style={{ background: s.bg }}>
                    <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
                    <div className="text-[10px] font-medium mt-1" style={{ color: s.color, opacity: 0.8 }}>{s.label}</div>
                  </div>
                  {i < 4 && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D9E2EC" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 flex gap-4" style={{ borderTop: '1px solid #F0F4F8' }}>
              {GATES.map(g => (
                <div key={g.num} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                  <span className="text-[11px]" style={{ color: '#627D98' }}>Gate {g.num}: <span className="font-medium">{g.reviewer}</span></span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { n: vacancies.length, l: 'Active Vacancies' },
              { n: talentMatches.length, l: 'Talent Matches' },
              { n: counts.total, l: 'Total Applicants' },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-xl border p-5" style={{ borderColor: '#E2E8F0' }}>
                <div className="text-2xl font-bold" style={{ color: '#102A43' }}>{c.n}</div>
                <div className="text-xs mt-1" style={{ color: '#627D98' }}>{c.l}</div>
              </div>
            ))}
          </div>

          {talentMatches.length > 0 && (
            <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E2E8F0' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold" style={{ color: '#102A43' }}>Recent Talent Matches</h2>
                <button onClick={() => setActiveTab('talent')} className="text-xs font-medium" style={{ color: '#2E86C1' }}>View All →</button>
              </div>
              {talentMatches.slice(0, 3).map((ext: any, i: number) => {
                const skills = ext.skills_profile || [];
                const name = ext.candidate_name || `Candidate ${i + 1}`;
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg mb-2" style={{ background: '#F8FAFB' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#486581' }}>{initials(name)}</div>
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#102A43' }}>{name}</div>
                        <div className="text-[11px]" style={{ color: '#829AB1' }}>{skills.length} skills</div>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {skills.slice(0, 3).map((s: any, j: number) => (
                        <span key={j} className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#EBF5FB', color: '#2E86C1' }}>{s.skill_name}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <Link href="/employer" className="p-4 bg-white rounded-xl border text-center hover:shadow-md transition-all" style={{ borderColor: '#E2E8F0' }}>
              <div className="text-sm font-medium" style={{ color: '#334E68' }}>Create Vacancy</div>
              <div className="text-xs mt-1" style={{ color: '#829AB1' }}>AI-assisted JD builder</div>
            </Link>
            <Link href="/reviewer" className="p-4 bg-white rounded-xl border text-center hover:shadow-md transition-all" style={{ borderColor: '#E2E8F0' }}>
              <div className="text-sm font-medium" style={{ color: '#334E68' }}>Review Pipeline</div>
              <div className="text-xs mt-1" style={{ color: '#829AB1' }}>Approve at each gate</div>
            </Link>
            <Link href="/psychologist" className="p-4 bg-white rounded-xl border text-center hover:shadow-md transition-all" style={{ borderColor: '#E2E8F0' }}>
              <div className="text-sm font-medium" style={{ color: '#334E68' }}>Psych Validation</div>
              <div className="text-xs mt-1" style={{ color: '#829AB1' }}>Professional sign-off</div>
            </Link>
          </div>
        </div>)}

        {/* VACANCIES */}
        {activeTab === 'vacancies' && (<div className="space-y-4">
          {vacancies.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border" style={{ borderColor: '#E2E8F0' }}>
              <p className="text-sm mb-3" style={{ color: '#829AB1' }}>No vacancies yet</p>
              <Link href="/employer" className="inline-block px-5 py-2.5 rounded-lg text-sm font-medium text-white" style={{ background: '#102A43' }}>Create Your First Vacancy →</Link>
            </div>
          ) : vacancies.map(v => {
            const vc = getPipelineCounts(v.id);
            const apps = getAppsForVacancy(v.id);
            const dt = v.created_at ? new Date(v.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            return (
              <div key={v.id} className="bg-white rounded-xl border p-6" style={{ borderColor: '#E2E8F0' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold" style={{ color: '#102A43' }}>{v.title}</h3>
                    <p className="text-xs mt-1" style={{ color: '#829AB1' }}>{v.description?.substring(0, 100) || 'No description'}{dt && ` · ${dt}`}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: v.status === 'published' ? '#F0FFF4' : '#F0F4F8', color: v.status === 'published' ? '#48BB78' : '#829AB1' }}>
                    {v.status === 'published' ? 'Active' : v.status || 'Draft'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mb-4">
                  {[
                    { l: 'Applied', c: vc.applied, col: '#486581', bg: '#F0F4F8' },
                    { l: 'G1', c: vc.gate1, col: '#2E86C1', bg: '#EBF5FB' },
                    { l: 'G2', c: vc.gate2, col: '#27AE60', bg: '#E8F8F5' },
                    { l: 'G3', c: vc.gate3, col: '#8E44AD', bg: '#F4ECF7' },
                    { l: 'Selected', c: vc.selected, col: '#48BB78', bg: '#F0FFF4' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="rounded-lg px-3 py-2 text-center min-w-[56px]" style={{ background: s.bg }}>
                        <div className="text-lg font-bold" style={{ color: s.col }}>{s.c}</div>
                        <div className="text-[9px] font-medium" style={{ color: s.col, opacity: 0.7 }}>{s.l}</div>
                      </div>
                      {i < 4 && <span style={{ color: '#D9E2EC' }}>›</span>}
                    </div>
                  ))}
                </div>
                {apps.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {apps.map((a, ai) => (
                      <span key={ai} className="text-xs px-2.5 py-1 rounded-full" style={{ background: '#F0F4F8', color: '#486581' }}>{a.candidate_name || `Applicant ${ai + 1}`}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-4 pt-3" style={{ borderTop: '1px solid #F0F4F8' }}>
                  <Link href="/reviewer" className="text-xs font-medium" style={{ color: '#2E86C1' }}>Review Pipeline →</Link>
                  <Link href="/employer" className="text-xs" style={{ color: '#829AB1' }}>Edit Vacancy →</Link>
                </div>
              </div>
            );
          })}
        </div>)}

        {/* TALENT MATCHES */}
        {activeTab === 'talent' && (<div>
          <p className="text-sm mb-4" style={{ color: '#627D98' }}>Candidates with extracted skills, matched against your vacancies.</p>
          {talentMatches.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border" style={{ borderColor: '#E2E8F0' }}>
              <p className="text-sm" style={{ color: '#829AB1' }}>No candidates with extracted skills yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {talentMatches.map((ext: any, i: number) => {
                const skills = ext.skills_profile || [];
                const name = ext.candidate_name || `Candidate ${i + 1}`;
                const avgConf = skills.length > 0 ? Math.round((skills.reduce((a: number, s: any) => a + (s.confidence || 0.5), 0) / skills.length) * 100) : 0;
                const dt = ext.created_at ? new Date(ext.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '';
                const eid = ext.id || `ext-${i}`;
                const isOpen = expandedCandidate === eid;

                return (
                  <div key={eid} className="bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow" style={{ borderColor: '#E2E8F0' }}>
                    <div className="p-5 cursor-pointer" onClick={() => setExpandedCandidate(isOpen ? null : eid)}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: '#486581' }}>{initials(name)}</div>
                          <div>
                            <h3 className="font-semibold" style={{ color: '#102A43' }}>{name}</h3>
                            <p className="text-xs mt-0.5" style={{ color: '#829AB1' }}>{skills.length} skills · {avgConf}% confidence · {dt}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {ext.validation_status === 'validated' && <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: '#F0FFF4', color: '#48BB78' }}>Validated</span>}
                          <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: '#E8F8F5', color: '#27AE60' }}>Skills Ready</span>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#829AB1" strokeWidth="2" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.slice(0, 5).map((s: any, j: number) => (
                          <span key={j} className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{
                            background: s.proficiency?.toLowerCase() === 'advanced' ? '#E8F8F5' : s.proficiency?.toLowerCase() === 'intermediate' ? '#EBF5FB' : '#FEF3E2',
                            color: s.proficiency?.toLowerCase() === 'advanced' ? '#27AE60' : s.proficiency?.toLowerCase() === 'intermediate' ? '#2E86C1' : '#E67E22',
                          }}>{s.skill_name} · {s.proficiency}</span>
                        ))}
                        {skills.length > 5 && <span className="text-[11px] px-2 py-1" style={{ color: '#829AB1' }}>+{skills.length - 5} more</span>}
                      </div>
                    </div>

                    {isOpen && (
                      <div className="px-5 pb-5" style={{ borderTop: '1px solid #F0F4F8' }}>
                        <div className="pt-4 space-y-4">
                          <div className="flex flex-wrap gap-1.5">
                            {skills.map((s: any, j: number) => (
                              <div key={j} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg" style={{ background: '#F8FAFB' }}>
                                <span className="font-medium" style={{ color: '#334E68' }}>{s.skill_name}</span>
                                <span style={{ color: s.proficiency?.toLowerCase() === 'advanced' ? '#27AE60' : s.proficiency?.toLowerCase() === 'intermediate' ? '#2E86C1' : '#E67E22' }}>{s.proficiency}</span>
                                <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: '#E2E8F0' }}>
                                  <div className="h-full rounded-full" style={{ width: `${Math.round((s.confidence || 0.5) * 100)}%`, background: s.proficiency?.toLowerCase() === 'advanced' ? '#27AE60' : s.proficiency?.toLowerCase() === 'intermediate' ? '#2E86C1' : '#E67E22' }} />
                                </div>
                              </div>
                            ))}
                          </div>
                          {ext.narrative_summary && <div className="p-3 rounded-lg text-xs leading-relaxed" style={{ background: '#F8FAFB', color: '#486581' }}>{ext.narrative_summary}</div>}
                          <div className="flex gap-3 pt-2">
                            <button onClick={async () => {
                              const vid = vacancies[0]?.id;
                              if (!vid) { alert('Create a vacancy first.'); return; }
                              const res = await fetch('/api/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'apply', vacancy_id: vid, session_id: ext.session_id }) });
                              if (res.ok) { alert(`${name} added to pipeline!`); loadData(); }
                            }} className="text-xs font-medium px-4 py-2 rounded-lg text-white" style={{ background: '#48BB78' }}>Add to Pipeline</button>
                            <Link href="/reviewer" className="text-xs font-medium px-4 py-2 rounded-lg" style={{ background: '#EBF5FB', color: '#2E86C1' }}>View Pipeline →</Link>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>)}

        {/* SETTINGS */}
        {activeTab === 'settings' && (<div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E2E8F0' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#102A43' }}>Company Profile</h2>
          {employer ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[['Organization', employer.organization_name], ['Industry', employer.industry || 'Not set'], ['Location', employer.location || employer.locations?.[0]?.city || 'Not set'], ['Size', employer.company_size || 'Not set']].map(([l, v]) => (
                  <div key={l} className="text-sm"><span className="font-medium" style={{ color: '#334E68' }}>{l}: </span><span style={{ color: '#486581' }}>{v}</span></div>
                ))}
              </div>
              {employer.accessibility_features && <div className="text-sm pt-3" style={{ borderTop: '1px solid #E2E8F0' }}><span className="font-medium" style={{ color: '#334E68' }}>Accessibility: </span><span style={{ color: '#486581' }}>{employer.accessibility_features}</span></div>}
              <div className="pt-4" style={{ borderTop: '1px solid #E2E8F0' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: '#334E68' }}>Three-Gate Reviewer Assignments</p>
                <div className="grid grid-cols-3 gap-3">
                  {GATES.map(g => (
                    <div key={g.num} className="p-3 rounded-xl" style={{ background: g.bg }}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: g.color }}>Gate {g.num} — {g.label}</div>
                      <div className="text-sm font-medium mt-1" style={{ color: '#334E68' }}>{employer.reviewer_assignments?.[`gate${g.num}_${g.reviewer.toLowerCase().replace(' ', '_')}`] || g.reviewer}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={async (e) => { e.preventDefault(); const fd = new FormData(e.target as HTMLFormElement); try { const res = await fetch('/api/gate1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_employer', organization_name: fd.get('org_name'), industry: fd.get('industry'), locations: [{ city: fd.get('location'), country: 'Philippines' }], company_size: fd.get('company_size'), benefits: fd.get('benefits'), accessibility_features: fd.get('accessibility'), reviewer_assignments: { gate1_recruiter: fd.get('g1') || 'Recruiter', gate2_hiring_manager: fd.get('g2') || 'Hiring Manager', gate3_final_approver: fd.get('g3') || 'Final Approver' }, work_arrangements: { remote: true, onsite: true, hybrid: true } }) }); if (res.ok) window.location.reload(); } catch (err) { console.error(err); } }} className="space-y-4">
              <p className="text-sm mb-2" style={{ color: '#829AB1' }}>Set up your organisation to start posting vacancies.</p>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium mb-1" style={{ color: '#334E68' }}>Organisation *</label><input name="org_name" required placeholder="e.g. Cebuana Lhuillier" className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#D9E2EC' }} /></div>
                <div><label className="block text-xs font-medium mb-1" style={{ color: '#334E68' }}>Industry</label><input name="industry" placeholder="e.g. Financial Services" className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#D9E2EC' }} /></div>
                <div><label className="block text-xs font-medium mb-1" style={{ color: '#334E68' }}>Location</label><input name="location" placeholder="e.g. Manila" className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#D9E2EC' }} /></div>
                <div><label className="block text-xs font-medium mb-1" style={{ color: '#334E68' }}>Size</label><select name="company_size" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" style={{ borderColor: '#D9E2EC' }}><option value="">Select</option><option value="1-50">1-50</option><option value="51-200">51-200</option><option value="201-1000">201-1000</option><option value="1000+">1000+</option></select></div>
              </div>
              <div><label className="block text-xs font-medium mb-1" style={{ color: '#334E68' }}>Accessibility</label><input name="accessibility" placeholder="e.g. Wheelchair ramp, screen reader" className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#D9E2EC' }} /></div>
              <div><label className="block text-xs font-medium mb-1" style={{ color: '#334E68' }}>Benefits</label><input name="benefits" placeholder="e.g. HMO, flexible hours" className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#D9E2EC' }} /></div>
              <div className="pt-3" style={{ borderTop: '1px solid #E2E8F0' }}>
                <p className="text-xs font-semibold mb-3" style={{ color: '#334E68' }}>Gate Reviewers</p>
                <div className="grid grid-cols-3 gap-3">
                  {GATES.map(g => (<div key={g.num}><label className="block text-[10px] font-medium mb-1" style={{ color: g.color }}>Gate {g.num} — {g.label}</label><input name={`g${g.num}`} placeholder={g.reviewer} className="w-full px-3 py-2 border rounded-lg text-sm" style={{ borderColor: '#D9E2EC' }} /></div>))}
                </div>
              </div>
              <button type="submit" className="w-full py-3 rounded-lg text-sm font-semibold text-white" style={{ background: '#102A43' }}>Create Employer Profile</button>
            </form>
          )}
        </div>)}
      </div>
    </div>
  );
}
