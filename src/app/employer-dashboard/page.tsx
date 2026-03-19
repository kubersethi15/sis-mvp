'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function EmployerDashboardPage() {
  const [employer, setEmployer] = useState<any>(null);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vacancies' | 'applicants' | 'talent' | 'settings'>('vacancies');
  const [talentMatches, setTalentMatches] = useState<any[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const stateRes = await fetch('/api/demo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_demo_state' }),
      });
      const state = await stateRes.json();

      if (state.employers?.length > 0) {
        setEmployer(state.employers[0]);
      }
      setVacancies(state.vacancies || []);
      setApplications(state.applications || []);

      // Load talent matches — jobseekers with extracted skills
      try {
        const talentRes = await fetch('/api/psychologist', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_all_extractions' }),
        });
        const talentData = await talentRes.json();
        setTalentMatches(talentData.extractions || []);
      } catch (e) { /* skip */ }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Get applicants for a specific vacancy
  const getApplicantsForVacancy = (vacancyId: string) => {
    return applications.filter(a => a.vacancy_id === vacancyId);
  };

  const statusColor = (status: string) => {
    if (status === 'published') return 'bg-green-100 text-green-700';
    if (status === 'draft') return 'bg-gray-100 text-gray-600';
    if (status === 'closed') return 'bg-red-100 text-red-600';
    return 'bg-gray-100 text-gray-600';
  };

  const appStatusColor = (status: string) => {
    if (status === 'selected') return 'bg-green-100 text-green-700';
    if (status?.includes('passed')) return 'bg-blue-100 text-blue-700';
    if (status?.includes('pending')) return 'bg-amber-100 text-amber-700';
    return 'bg-gray-100 text-gray-600';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF9', color: '#829AB1' }}>Loading employer dashboard...</div>;

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      <nav className="px-6 py-3 flex items-center justify-between" style={{ background: '#102A43' }}>
        <Link href="/" className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#486581' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#48BB78' }} />
          </div>
          <span className="text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#F0F4F8' }}>kaya</span>
        </Link>
        <div className="flex flex-row items-center gap-5 flex-nowrap">
          <Link href="/employer" className="text-xs font-medium px-3 py-1.5 rounded-lg hover:opacity-90 transition-colors whitespace-nowrap" style={{ background: '#48BB78', color: 'white' }}>New Vacancy</Link>
          <Link href="/" className="text-xs whitespace-nowrap hover:opacity-80 transition-opacity" style={{ color: '#9FB3C8' }}>Home</Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg text-white shadow-md" style={{ background: '#102A43' }}>CL</div>
          <div>
            <h1 className="text-lg font-bold" style={{ color: '#102A43' }}>{employer?.organization_name || 'Employer Dashboard'}</h1>
            <p className="text-xs" style={{ color: '#627D98' }}>Kaya Employer Portal — Manage vacancies and hiring pipeline</p>
          </div>
        </div>
        <div className="flex gap-1 border-b border-gray-200">
          {[
            { id: 'vacancies' as const, label: `Vacancies (${vacancies.length})` },
            { id: 'talent' as const, label: `Talent Matches (${talentMatches.length})` },
            { id: 'applicants' as const, label: `Applicants (${applications.length})` },
            { id: 'settings' as const, label: 'Settings' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px' : 'text-gray-500 hover:text-gray-700'
              }`}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* VACANCIES TAB */}
        {activeTab === 'vacancies' && (
          <div className="space-y-4">
            {vacancies.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                
                <p className="text-gray-500 mb-3">No vacancies yet</p>
                <Link href="/employer" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Create Your First Vacancy →</Link>
              </div>
            ) : (
              vacancies.map(v => {
                const apps = getApplicantsForVacancy(v.id);
                const selected = apps.filter(a => a.status === 'selected').length;
                const inPipeline = apps.filter(a => a.status?.includes('gate') || a.status === 'applied').length;
                const createdDate = v.created_at ? new Date(v.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

                return (
                  <div key={v.id} className="bg-white rounded-xl border p-6" style={{ borderColor: '#E2E8F0' }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: '#102A43' }}>{v.title}</h3>
                        <p className="text-xs mt-1" style={{ color: '#829AB1' }}>
                          {v.description?.substring(0, 80) || 'No description'}
                          {createdDate ? ` · Posted ${createdDate}` : ''}
                        </p>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${v.status === 'published' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {v.status === 'published' ? 'Active' : v.status === 'draft' ? 'Draft' : v.status}
                      </span>
                    </div>

                    {/* Pipeline funnel */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1 rounded-xl p-4 text-center" style={{ background: '#F0F4F8' }}>
                        <div className="text-2xl font-bold" style={{ color: '#334E68' }}>{apps.length}</div>
                        <div className="text-[11px] font-medium" style={{ color: '#627D98' }}>Applied</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D9E2EC" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      <div className="flex-1 rounded-xl p-4 text-center" style={{ background: '#EBF5FB' }}>
                        <div className="text-2xl font-bold" style={{ color: '#2E86C1' }}>{inPipeline}</div>
                        <div className="text-[11px] font-medium" style={{ color: '#5DADE2' }}>In Pipeline</div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D9E2EC" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                      <div className="flex-1 rounded-xl p-4 text-center" style={{ background: '#E8F8F5' }}>
                        <div className="text-2xl font-bold" style={{ color: '#27AE60' }}>{selected}</div>
                        <div className="text-[11px] font-medium" style={{ color: '#48BB78' }}>Selected</div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Link href="/reviewer" className="text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: '#2E86C1' }}>View Pipeline →</Link>
                      <Link href="/employer" className="text-xs hover:opacity-80 transition-opacity" style={{ color: '#829AB1' }}>Edit JD →</Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TALENT MATCHES TAB — Jobseekers with extracted skills that match vacancy */}
        {activeTab === 'talent' && (
          <div>
            <p className="text-sm mb-4" style={{ color: '#627D98' }}>
              Candidates who have completed skills extraction through Kaya. Their skills are automatically matched against your vacancy requirements.
            </p>
            {talentMatches.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border" style={{ borderColor: '#E2E8F0' }}>
                <p className="text-sm" style={{ color: '#829AB1' }}>No candidates with extracted skills yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {talentMatches.map((ext: any, i: number) => {
                  const skills = ext.skills_profile || [];
                  const topSkills = skills.slice(0, 4);
                  const avgConf = skills.length > 0
                    ? Math.round((skills.reduce((a: number, s: any) => a + (s.confidence || 0.5), 0) / skills.length) * 100)
                    : 0;
                  const date = ext.created_at ? new Date(ext.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : '';

                  return (
                    <div key={ext.id || i} className="bg-white rounded-xl border p-5 hover:shadow-md transition-shadow" style={{ borderColor: '#E2E8F0' }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold" style={{ color: '#102A43' }}>Candidate {i + 1}</h3>
                          <p className="text-xs mt-0.5" style={{ color: '#829AB1' }}>{skills.length} skills extracted · {avgConf}% confidence · {date}</p>
                        </div>
                        <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: '#E8F8F5', color: '#27AE60' }}>
                          Skills Ready
                        </span>
                      </div>

                      {/* Top skills */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {topSkills.map((s: any, j: number) => (
                          <span key={j} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{
                            background: s.proficiency?.toLowerCase() === 'intermediate' ? '#EBF5FB' : s.proficiency?.toLowerCase() === 'advanced' ? '#E8F8F5' : '#FEF3E2',
                            color: s.proficiency?.toLowerCase() === 'intermediate' ? '#2E86C1' : s.proficiency?.toLowerCase() === 'advanced' ? '#27AE60' : '#E67E22',
                          }}>
                            {s.skill_name} · {s.proficiency}
                          </span>
                        ))}
                        {skills.length > 4 && (
                          <span className="text-xs" style={{ color: '#829AB1' }}>+{skills.length - 4} more</span>
                        )}
                      </div>

                      {/* Summary */}
                      {ext.narrative_summary && (
                        <p className="text-xs leading-relaxed mb-3" style={{ color: '#486581' }}>
                          {ext.narrative_summary.substring(0, 150)}...
                        </p>
                      )}

                      <div className="flex gap-3 pt-2" style={{ borderTop: '1px solid #F0F4F8' }}>
                        <button
                          onClick={async () => {
                            try {
                              const vacancyId = vacancies[0]?.id;
                              if (!vacancyId) { alert('No vacancy found. Create a vacancy first.'); return; }
                              const res = await fetch('/api/demo', {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ action: 'apply', vacancy_id: vacancyId, session_id: ext.session_id }),
                              });
                              if (res.ok) {
                                alert('Candidate added to pipeline!');
                                loadData();
                              }
                            } catch (e) { console.error(e); }
                          }}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg text-white transition-all hover:opacity-90"
                          style={{ background: '#48BB78' }}
                        >
                          Add to Pipeline
                        </button>
                        <Link href="/reviewer" className="text-xs font-medium" style={{ color: '#2E86C1' }}>View Pipeline →</Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* APPLICANTS TAB */}
        {activeTab === 'applicants' && (
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
            <div className="px-6 py-4" style={{ borderBottom: '1px solid #E2E8F0' }}>
              <h2 className="text-base font-semibold" style={{ color: '#102A43' }}>All Applicants</h2>
              <p className="text-xs" style={{ color: '#829AB1' }}>{applications.length} total applicant{applications.length !== 1 ? 's' : ''}</p>
            </div>
            {applications.length === 0 ? (
              <p className="text-center py-12 text-sm" style={{ color: '#829AB1' }}>No applications yet</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F0F4F8' }}>
                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#486581' }}>Applicant</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#486581' }}>Position</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#486581' }}>Current Gate</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#486581' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, i) => {
                    const gateNum = app.current_gate || (app.status?.match(/gate(\d)/)?.[1]) || '—';
                    const gateLabel = gateNum === '1' || gateNum === 1 ? 'Alignment' : gateNum === '2' || gateNum === 2 ? 'Evidence' : gateNum === '3' || gateNum === 3 ? 'Predictability' : 'Applied';
                    const statusClean = (app.status || 'pending').replace(/_/g, ' ').replace(/gate\d /i, '');
                    const vacancy = vacancies.find(v => v.id === app.vacancy_id);

                    return (
                      <tr key={i} className="border-t hover:bg-stone-50 transition-colors" style={{ borderColor: '#F0F4F8' }}>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium" style={{ color: '#102A43' }}>Candidate {i + 1}</div>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#486581' }}>{vacancy?.title || 'Unknown'}</td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium" style={{ color: '#486581' }}>Gate {gateNum} — {gateLabel}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${appStatusColor(app.status)}`}>
                            {statusClean}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-xl border p-6" style={{ borderColor: '#E2E8F0' }}>
            <h2 className="text-base font-semibold mb-4" style={{ color: '#102A43' }}>Company Settings</h2>
            {employer ? (
              <div className="space-y-4">
                <div className="text-sm" style={{ color: '#486581' }}>
                  <span className="font-medium" style={{ color: '#334E68' }}>Organization:</span> {employer.organization_name}
                </div>
                <div className="pt-4" style={{ borderTop: '1px solid #E2E8F0' }}>
                  <h3 className="text-sm font-medium mb-3" style={{ color: '#334E68' }}>Hiring Pipeline — Human Validators</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl text-center" style={{ background: '#EBF5FB' }}>
                      <div className="text-xs font-semibold" style={{ color: '#2E86C1' }}>Gate 1 — Alignment</div>
                      <div className="text-xs mt-1" style={{ color: '#5DADE2' }}>Recruiter</div>
                    </div>
                    <div className="p-4 rounded-xl text-center" style={{ background: '#E8F8F5' }}>
                      <div className="text-xs font-semibold" style={{ color: '#27AE60' }}>Gate 2 — Evidence</div>
                      <div className="text-xs mt-1" style={{ color: '#48BB78' }}>Hiring Manager</div>
                    </div>
                    <div className="p-4 rounded-xl text-center" style={{ background: '#F4ECF7' }}>
                      <div className="text-xs font-semibold" style={{ color: '#8E44AD' }}>Gate 3 — Predictability</div>
                      <div className="text-xs mt-1" style={{ color: '#AF7AC5' }}>Final Approver</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: '#829AB1' }}>No employer profile yet. <Link href="/employer" className="font-medium" style={{ color: '#2E86C1' }}>Create one</Link></p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
