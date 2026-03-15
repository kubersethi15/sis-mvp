'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================================
// VACANCY PAGE — Jobseeker View
// Shows vacancy details, AI Q&A chatbot, alignment rating, apply button
// Ryan: "AI chatbot available to answer all vacancy questions before apply"
// Ryan: "reveals alignment rating at the end of the assessment"
// ============================================================

interface Vacancy {
  id: string;
  title: string;
  description: string;
  competency_blueprint: any;
  essential_requirements: any[];
  trainable_requirements: any[];
  compensation_range: any;
  work_arrangement: string;
  location: string;
  employer_profiles?: { organization_name: string };
}

interface QAMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function VacancyPage() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [selected, setSelected] = useState<Vacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [qaMessages, setQaMessages] = useState<QAMessage[]>([]);
  const [qaInput, setQaInput] = useState('');
  const [qaLoading, setQaLoading] = useState(false);
  const [alignment, setAlignment] = useState<any>(null);
  const [alignmentLoading, setAlignmentLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    fetchVacancies();
  }, []);

  const fetchVacancies = async () => {
    try {
      const res = await fetch('/api/vacancy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      const data = await res.json();
      setVacancies(data.vacancies || []);
      if (data.vacancies?.length > 0) setSelected(data.vacancies[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // AI Q&A about the vacancy
  const askQuestion = useCallback(async () => {
    if (!qaInput.trim() || !selected) return;
    const question = qaInput.trim();
    setQaInput('');
    setQaMessages(prev => [...prev, { role: 'user', content: question }]);
    setQaLoading(true);

    try {
      const res = await fetch('/api/vacancy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ask', vacancy_id: selected.id, question, history: qaMessages }),
      });
      const data = await res.json();
      setQaMessages(prev => [...prev, { role: 'assistant', content: data.answer || 'Sorry, I couldn\'t find an answer to that.' }]);
    } catch (e) {
      setQaMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, there was an error. Please try again.' }]);
    } finally { setQaLoading(false); }
  }, [qaInput, selected, qaMessages]);

  // Check alignment
  const checkAlignment = useCallback(async () => {
    if (!selected) return;
    setAlignmentLoading(true);
    try {
      const profileId = localStorage.getItem('sis_jobseeker_profile_id');
      const res = await fetch('/api/vacancy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_alignment', vacancy_id: selected.id, jobseeker_profile_id: profileId }),
      });
      const data = await res.json();
      setAlignment(data.alignment);
    } catch (e) { console.error(e); }
    finally { setAlignmentLoading(false); }
  }, [selected]);

  // Apply
  const handleApply = useCallback(async () => {
    if (!selected) return;
    const profileId = localStorage.getItem('sis_jobseeker_profile_id');
    if (!profileId) { alert('Please create your profile first at /profile'); return; }

    try {
      const res = await fetch('/api/demo', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'apply', vacancy_id: selected.id, jobseeker_id: profileId }),
      });
      const data = await res.json();
      if (data.application) {
        setApplied(true);
        localStorage.setItem('sis_last_application_id', data.application.id);
      }
    } catch (e) { console.error(e); }
  }, [selected]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading vacancies...</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Job Vacancies</h1>
            <p className="text-sm text-gray-500">Browse opportunities matched to your skills</p>
          </div>
          <a href="/" className="text-xs text-gray-400 hover:text-gray-600">← Home</a>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {vacancies.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-2">📋</p>
            <p>No vacancies published yet. Ask an employer to upload a JD at <a href="/employer" className="text-blue-500 underline">/employer</a></p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vacancy List */}
            <div className="space-y-3">
              {vacancies.map(v => (
                <button key={v.id} onClick={() => { setSelected(v); setQaMessages([]); setAlignment(null); setApplied(false); }}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${selected?.id === v.id ? 'border-teal-300 bg-teal-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <h3 className="font-semibold text-gray-900 text-sm">{v.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{v.location || 'Location not specified'}</p>
                  <p className="text-xs text-gray-400 mt-1">{v.work_arrangement || 'Not specified'}</p>
                </button>
              ))}
            </div>

            {/* Vacancy Detail + Q&A */}
            {selected && (
              <div className="lg:col-span-2 space-y-4">
                {/* Details */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-bold text-gray-900">{selected.title}</h2>
                  <p className="text-sm text-gray-600 mt-2">{selected.description}</p>

                  {selected.essential_requirements?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-xs font-semibold text-gray-500 mb-2">REQUIREMENTS</h3>
                      <div className="space-y-1">
                        {selected.essential_requirements.map((r: any, i: number) => (
                          <div key={i} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-red-400 mt-0.5">●</span>
                            <span>{r.requirement || r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.competency_blueprint?.human_centric_skills?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-xs font-semibold text-gray-500 mb-2">SKILLS WE VALUE</h3>
                      <div className="flex flex-wrap gap-2">
                        {selected.competency_blueprint.human_centric_skills.map((s: any, i: number) => (
                          <span key={i} className="text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full">{s.skill}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="mt-6 flex gap-3">
                    <button onClick={checkAlignment} disabled={alignmentLoading}
                      className="px-4 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50">
                      {alignmentLoading ? '⏳ Checking...' : '📊 Check My Alignment'}
                    </button>
                    {!applied ? (
                      <button onClick={handleApply}
                        className="px-4 py-2 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium transition-colors">
                        ✅ Apply Now
                      </button>
                    ) : (
                      <span className="px-4 py-2 text-sm bg-green-50 text-green-600 rounded-lg border border-green-200 font-medium">
                        ✅ Applied!
                      </span>
                    )}
                  </div>
                </div>

                {/* Alignment Result */}
                {alignment && (
                  <div className={`rounded-lg border p-4 ${alignment.alignment_score >= 70 ? 'bg-green-50 border-green-200' : alignment.alignment_score >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900">Your Alignment Score</h3>
                      <span className="text-2xl font-bold" style={{ color: alignment.alignment_score >= 70 ? '#27AE60' : alignment.alignment_score >= 40 ? '#F39C12' : '#E74C3C' }}>
                        {alignment.alignment_score}/100
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{alignment.recommendation_rationale || alignment.recommendation}</p>
                    {alignment.strengths?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {alignment.strengths.map((s: any, i: number) => (
                          <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">✓ {s.area || s}</span>
                        ))}
                      </div>
                    )}
                    {alignment.gaps?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {alignment.gaps.map((g: any, i: number) => (
                          <span key={i} className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">Gap: {g.area || g}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AI Q&A Chatbot */}
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">💬 Ask About This Role</h3>
                  <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                    {qaMessages.length === 0 && (
                      <p className="text-xs text-gray-400">Ask any question about this role — compensation, schedule, requirements, team, anything.</p>
                    )}
                    {qaMessages.map((m, i) => (
                      <div key={i} className={`text-sm p-2 rounded-lg ${m.role === 'user' ? 'bg-blue-50 text-blue-800 ml-8' : 'bg-gray-50 text-gray-700 mr-8'}`}>
                        {m.content}
                      </div>
                    ))}
                    {qaLoading && (
                      <div className="text-sm p-2 bg-gray-50 rounded-lg mr-8 text-gray-400">Thinking...</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={qaInput} onChange={e => setQaInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && askQuestion()}
                      placeholder="Ask about the role..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
                    <button onClick={askQuestion} disabled={!qaInput.trim() || qaLoading}
                      className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600 disabled:opacity-50 transition-colors">
                      Ask
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
