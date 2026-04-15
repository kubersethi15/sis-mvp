'use client';

import { useState, useEffect, useCallback } from 'react';
import { kayaFetch } from '@/lib/kaya-fetch';

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

  const [matchData, setMatchData] = useState<any>(null);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const profileId = localStorage.getItem('kaya_jobseeker_profile_id');
      if (profileId) {
        // Use matching engine
        const res = await kayaFetch('/api/match', { action: 'match_for_jobseeker', jobseeker_profile_id: profileId });
        const data = await res.json();
        setMatchData(data);
        const mapped = (data.matches || []).map((m: any) => ({
          id: m.vacancy_id, title: m.title, description: m.description,
          location: m.location, work_arrangement: m.work_arrangement,
          competency_blueprint: { human_centric_skills: m.human_centric_skills },
          essential_requirements: [], trainable_requirements: [],
          compensation_range: {}, employer_profiles: { organization_name: m.employer },
          _match_score: m.match_score, _match_breakdown: m.match_breakdown,
          _accessibility_friendly: m.accessibility_friendly,
        }));
        setVacancies(mapped);
        if (mapped.length > 0) setSelected(mapped[0]);
      } else {
        // Fallback: just list vacancies
        const res = await kayaFetch('/api/vacancy', { action: 'list' });
        const data = await res.json();
        setVacancies(data.vacancies || []);
        if (data.vacancies?.length > 0) setSelected(data.vacancies[0]);
      }
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
      const res = await kayaFetch('/api/vacancy', { action: 'ask', vacancy_id: selected.id, question, history: qaMessages });
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
      const profileId = localStorage.getItem('kaya_jobseeker_profile_id');
      const res = await kayaFetch('/api/vacancy', { action: 'check_alignment', vacancy_id: selected.id, jobseeker_profile_id: profileId });
      const data = await res.json();
      setAlignment(data.alignment);
    } catch (e) { console.error(e); }
    finally { setAlignmentLoading(false); }
  }, [selected]);

  // Apply with eligibility check
  const handleApply = useCallback(async () => {
    if (!selected) return;
    const profileId = localStorage.getItem('kaya_jobseeker_profile_id');
    if (!profileId) { alert('Please create your profile first at /profile'); return; }

    // Basic eligibility check
    const req = selected.competency_blueprint?.requirements || {};
    const eligibilityIssues: string[] = [];

    if (req.work_authorization && req.work_authorization !== 'any') {
      eligibilityIssues.push(`Work authorization: ${req.work_authorization} required`);
    }
    if (req.license_required) {
      eligibilityIssues.push(`License required: ${req.license_required}`);
    }

    if (eligibilityIssues.length > 0) {
      const proceed = confirm(
        `Eligibility check:\n\n${eligibilityIssues.join('\n')}\n\nPlease confirm you meet these requirements to proceed.`
      );
      if (!proceed) return;
    }

    try {
      const res = await kayaFetch('/api/demo', { action: 'apply', vacancy_id: selected.id, jobseeker_id: profileId });
      const data = await res.json();
      if (data.application) {
        setApplied(true);
        localStorage.setItem('kaya_last_application_id', data.application.id);
      }
    } catch (e) { console.error(e); }
  }, [selected]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-kaya-stone-50 text-kaya-stone-400">Loading vacancies...</div>;

  return (
    <div className="min-h-screen bg-kaya-stone-50">
      <nav className="px-6 py-3 flex items-center justify-between bg-kaya-navy-900">
        <a href="/my-dashboard" className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-kaya-stone-600">
            <div className="w-2.5 h-2.5 rounded-full bg-kaya-green-400" />
          </div>
          <span className="text-xl tracking-tight font-display text-kaya-navy-50">kaya</span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/my-dashboard" className="text-xs font-medium hover:opacity-80 text-kaya-stone-200">My Dashboard</a>
          <span className="text-xs font-medium px-2 py-1 rounded bg-kaya-navy-800 text-kaya-stone-200">Vacancies</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-kaya-navy-900">Job Vacancies</h1>
          <p className="text-sm text-kaya-stone-600">Browse opportunities matched to your skills</p>
        </div>
        {vacancies.length === 0 ? (
          <div className="text-center py-12 text-kaya-stone-400">
            
            <p>No vacancies published yet. Ask an employer to upload a JD at <a href="/employer" className="text-blue-500 underline">/employer</a></p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Vacancy List with Match Scores */}
            <div className="space-y-3">
              {matchData?.jobseeker && (
                <div className="p-3 bg-kaya-amber-50 rounded-lg border border-kaya-amber-400/20 mb-2">
                  <p className="text-xs font-medium text-kaya-amber-400">Matched for: {matchData.jobseeker.name}</p>
                  <p className="text-[10px] text-amber-500">{matchData.jobseeker.has_leee ? `${matchData.jobseeker.skills_count} skills evidenced` : 'Chat with Aya to improve matches'}</p>
                </div>
              )}
              {vacancies.map((v: any) => (
                <button key={v.id} onClick={() => { setSelected(v); setQaMessages([]); setAlignment(null); setApplied(false); }}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${selected?.id === v.id ? 'border-teal-300 bg-teal-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-kaya-navy-900 text-sm">{v.title}</h3>
                      <p className="text-xs text-kaya-stone-600 mt-0.5">{(v as any).employer_profiles?.organization_name || ''}</p>
                      <p className="text-xs text-kaya-stone-400 mt-0.5">{v.location || 'Location not specified'} • {v.work_arrangement || 'Not specified'}</p>
                    </div>
                    {(v as any)._match_score !== undefined && (
                      <div className={`text-right flex-shrink-0 ml-2 px-2 py-1 rounded-lg text-xs font-bold ${
                        (v as any)._match_score >= 70 ? 'bg-green-100 text-green-700' :
                        (v as any)._match_score >= 40 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {(v as any)._match_score}%
                      </div>
                    )}
                  </div>
                  {(v as any)._accessibility_friendly && (
                    <span className="text-[10px] bg-kaya-navy-50 text-kaya-navy-600 px-1.5 py-0.5 rounded mt-1 inline-block">♿ PWD-friendly</span>
                  )}
                </button>
              ))}
            </div>

            {/* Vacancy Detail + Q&A */}
            {selected && (
              <div className="lg:col-span-2 space-y-4">
                {/* Details */}
                <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                  <h2 className="text-lg font-bold text-kaya-navy-900">{selected.title}</h2>
                  <p className="text-sm text-kaya-stone-600 mt-2">{selected.description}</p>

                  {selected.essential_requirements?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-xs font-semibold text-kaya-stone-600 mb-2">REQUIREMENTS</h3>
                      <div className="space-y-1">
                        {selected.essential_requirements.map((r: any, i: number) => (
                          <div key={i} className="text-sm text-kaya-navy-900 flex items-start gap-2">
                            <span className="text-kaya-red-400 mt-0.5">●</span>
                            <span>{r.requirement || r}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selected.competency_blueprint?.human_centric_skills?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-xs font-semibold text-kaya-stone-600 mb-2">SKILLS WE VALUE</h3>
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
                      className="px-4 py-2 text-sm bg-kaya-navy-50 text-kaya-navy-600 rounded-lg hover:bg-blue-100 border border-kaya-navy-100 transition-colors disabled:opacity-50">
                      {alignmentLoading ? 'Checking...' : 'Check My Alignment'}
                    </button>
                    {!applied ? (
                      <button onClick={handleApply}
                        className="px-4 py-2 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 font-medium transition-colors">
                        Apply Now
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="px-4 py-2 text-sm bg-kaya-green-50 text-kaya-green-400 rounded-lg border border-kaya-green-100 font-medium">
                          Applied ✓
                        </span>
                        <span className="text-xs text-kaya-stone-400">Gate 1 alignment assessment running...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Alignment Result */}
                {alignment && (
                  <div className={`rounded-lg border p-4 ${alignment.alignment_score >= 70 ? 'bg-green-50 border-green-200' : alignment.alignment_score >= 40 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-kaya-navy-900">Your alignment score</h3>
                      <span className={`text-2xl font-bold ${alignment.alignment_score >= 70 ? 'text-kaya-green-400' : alignment.alignment_score >= 40 ? 'text-kaya-amber-400' : 'text-kaya-red-400'}`}>
                        {alignment.alignment_score}/100
                      </span>
                    </div>
                    <p className="text-sm text-kaya-stone-600">{alignment.recommendation_rationale || alignment.recommendation}</p>
                    {alignment.strengths?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {alignment.strengths.map((s: any, i: number) => (
                          <span key={i} className="text-xs bg-kaya-green-50 text-kaya-green-400 px-2 py-0.5 rounded">✓ {s.area || s}</span>
                        ))}
                      </div>
                    )}
                    {alignment.gaps?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {alignment.gaps.map((g: any, i: number) => (
                          <span key={i} className="text-xs bg-orange-100 text-kaya-amber-400 px-2 py-0.5 rounded">Gap: {g.area || g}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AI Q&A Chatbot */}
                <div className="bg-white rounded-lg border border-kaya-stone-100 p-4">
                  <h3 className="text-sm font-semibold text-kaya-navy-900 mb-3">💬 Ask About This Role</h3>
                  <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                    {qaMessages.length === 0 && (
                      <p className="text-xs text-kaya-stone-400">Ask any question about this role — compensation, schedule, requirements, team, anything.</p>
                    )}
                    {qaMessages.map((m, i) => (
                      <div key={i} className={`text-sm p-2 rounded-lg ${m.role === 'user' ? 'bg-blue-50 text-blue-800 ml-8' : 'bg-gray-50 text-kaya-navy-900 mr-8'}`}>
                        {m.content}
                      </div>
                    ))}
                    {qaLoading && (
                      <div className="text-sm p-2 bg-kaya-stone-50 rounded-lg mr-8 text-kaya-stone-400">Thinking...</div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={qaInput} onChange={e => setQaInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && askQuestion()}
                      placeholder="Ask about the role..."
                      className="flex-1 px-3 py-2 border border-kaya-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-300 outline-none" />
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
