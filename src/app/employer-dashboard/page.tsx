'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function EmployerDashboardPage() {
  const [employer, setEmployer] = useState<any>(null);
  const [vacancies, setVacancies] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vacancies' | 'applicants' | 'settings'>('vacancies');

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

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading employer dashboard...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-lg text-white shadow-md">🏢</div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">{employer?.organization_name || 'Employer Dashboard'}</h1>
              <p className="text-xs text-gray-500">Skills Intelligence System — Employer Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/employer" className="text-xs text-blue-600 font-medium px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">+ New Vacancy</Link>
            <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">Home</Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 pt-4">
        <div className="flex gap-1 border-b border-gray-200">
          {[
            { id: 'vacancies' as const, label: `📋 Vacancies (${vacancies.length})` },
            { id: 'applicants' as const, label: `👥 All Applicants (${applications.length})` },
            { id: 'settings' as const, label: '⚙️ Company Settings' },
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
                <p className="text-3xl mb-2">📋</p>
                <p className="text-gray-500 mb-3">No vacancies yet</p>
                <Link href="/employer" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Create Your First Vacancy →</Link>
              </div>
            ) : (
              vacancies.map(v => {
                const apps = getApplicantsForVacancy(v.id);
                const selected = apps.filter(a => a.status === 'selected').length;
                const inPipeline = apps.filter(a => a.status?.includes('gate') || a.status === 'applied').length;

                return (
                  <div key={v.id} className="bg-white rounded-lg border border-gray-200 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{v.title}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">ID: {v.id?.substring(0, 8)}... • Created: {new Date(v.created_at || '').toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor(v.status)}`}>{v.status}</span>
                    </div>

                    {/* Pipeline mini-view */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 bg-gray-100 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-gray-700">{apps.length}</div>
                        <div className="text-[10px] text-gray-500">Applied</div>
                      </div>
                      <span className="text-gray-300">→</span>
                      <div className="flex-1 bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-blue-700">{inPipeline}</div>
                        <div className="text-[10px] text-blue-500">In Pipeline</div>
                      </div>
                      <span className="text-gray-300">→</span>
                      <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-green-700">{selected}</div>
                        <div className="text-[10px] text-green-500">Selected</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href="/reviewer" className="text-xs text-blue-600 hover:text-blue-700 font-medium">View Pipeline →</Link>
                      <span className="text-gray-300">•</span>
                      <Link href="/employer" className="text-xs text-gray-500 hover:text-gray-700">Edit JD →</Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* APPLICANTS TAB */}
        {activeTab === 'applicants' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">All Applicants</h2>
            {applications.length === 0 ? (
              <p className="text-center py-8 text-gray-400">No applications yet</p>
            ) : (
              <div className="space-y-3">
                {applications.map((app, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-sm font-medium text-gray-800">Application {app.id?.substring(0, 8)}...</span>
                      <span className="text-xs text-gray-400 ml-2">Gate {app.current_gate || 0}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${appStatusColor(app.status)}`}>
                      {app.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Settings</h2>
            {employer ? (
              <div className="space-y-3 text-sm text-gray-600">
                <div><span className="font-medium text-gray-700">Organization:</span> {employer.organization_name}</div>
                <div><span className="font-medium text-gray-700">Employer ID:</span> {employer.id?.substring(0, 12)}...</div>
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="font-medium text-gray-700 mb-2">Human Validators</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg text-center">
                      <div className="text-xs font-medium text-blue-700">Gate 1</div>
                      <div className="text-xs text-blue-500">Recruiter</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-center">
                      <div className="text-xs font-medium text-green-700">Gate 2</div>
                      <div className="text-xs text-green-500">Hiring Manager</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg text-center">
                      <div className="text-xs font-medium text-purple-700">Gate 3</div>
                      <div className="text-xs text-purple-500">Final Approver</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No employer profile yet. <Link href="/employer" className="text-blue-600 underline">Create one</Link></p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
