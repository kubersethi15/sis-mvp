'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    async function load() {
      // Get applications that passed all gates
      const { data: apps } = await supabase.from('applications')
        .select('*, vacancies(title, employer_name), jobseeker_profiles(*, user_profiles(full_name))')
        .in('status', ['approved', 'hired', 'onboarding'])
        .order('updated_at', { ascending: false });

      if (apps?.length) {
        const enriched = [];
        for (const app of apps) {
          const name = app.jobseeker_profiles?.user_profiles?.full_name || 'Candidate';
          const { data: sessions } = await supabase.from('leee_sessions')
            .select('id').eq('application_id', app.id).eq('status', 'completed').limit(1);
          let extraction = null;
          if (sessions?.length) {
            const { data: ext } = await supabase.from('leee_extractions')
              .select('*').eq('session_id', sessions[0].id).limit(1).single();
            extraction = ext;
          }
          enriched.push({ ...app, candidate_name: name, extraction });
        }
        setCandidates(enriched);
      }
      setLoading(false);
    }
    load();
  }, []);

  const skills = selected?.extraction?.skills_profile || [];
  const strengths = skills.filter((s: any) => (s.confidence || 0) >= 0.7).slice(0, 5);
  const developing = skills.filter((s: any) => (s.confidence || 0) >= 0.4 && (s.confidence || 0) < 0.7);
  const gaps = skills.filter((s: any) => (s.confidence || 0) < 0.4);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-kaya-stone-50"><p className="text-kaya-stone-400">Loading...</p></div>;

  return (
    <div className="min-h-screen bg-kaya-stone-50">
      <nav className="px-6 py-3 flex items-center justify-between bg-kaya-navy-900">
        <a href="/employer-dashboard" className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-kaya-stone-600">
            <div className="w-2.5 h-2.5 rounded-full bg-kaya-green-400" />
          </div>
          <span className="text-xl tracking-tight font-display text-kaya-navy-50">kaya</span>
        </a>
        <div className="flex flex-row items-center gap-3 flex-wrap">
          <a href="/employer-dashboard" className="text-xs text-kaya-stone-400 whitespace-nowrap">Dashboard</a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pt-8 pb-16">
        <h1 className="text-xl font-bold mb-1 text-kaya-navy-900">Onboarding — Skills-Informed Placement</h1>
        <p className="text-sm mb-6 text-kaya-stone-600">Use evidence-based skills profiles to inform team placement and development plans.</p>

        {candidates.length === 0 ? (
          <div className="bg-white rounded-xl border border-kaya-stone-100 p-8 text-center">
            <p className="text-sm text-kaya-stone-600">No approved candidates yet. Candidates appear here after passing all three gates.</p>
          </div>
        ) : !selected ? (
          <div className="space-y-3">
            {candidates.map((c, i) => (
              <button key={i} onClick={() => setSelected(c)}
                className="w-full text-left bg-white rounded-xl border border-kaya-stone-100 p-5 hover:border-green-300 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-kaya-navy-900">{c.candidate_name}</p>
                    <p className="text-xs text-kaya-stone-600">{c.vacancies?.title} at {c.vacancies?.employer_name}</p>
                  </div>
                  <div className="text-xs px-3 py-1 rounded-full font-medium bg-kaya-green-50 text-kaya-green-400">
                    {c.extraction?.skills_profile?.length || 0} skills mapped
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelected(null)} className="text-xs text-kaya-stone-600 mb-4 hover:text-gray-700">← Back to list</button>

            <div className="bg-white rounded-xl border border-kaya-stone-100 p-6 mb-6">
              <h2 className="text-lg font-bold text-kaya-navy-900">{selected.candidate_name}</h2>
              <p className="text-sm text-kaya-stone-600">{selected.vacancies?.title} at {selected.vacancies?.employer_name}</p>
              {selected.extraction?.narrative_summary && (
                <p className="text-sm text-kaya-stone-600 mt-3 leading-relaxed">{selected.extraction.narrative_summary}</p>
              )}
            </div>

            {/* Strengths — what they can do from day one */}
            {strengths.length > 0 && (
              <div className="bg-white rounded-xl border border-kaya-green-100 p-6 mb-4">
                <h3 className="text-sm font-semibold text-kaya-green-400 mb-3">Can Deploy From Day One</h3>
                <p className="text-xs text-kaya-stone-600 mb-3">These skills are well-evidenced. Assign responsibilities that leverage these immediately.</p>
                <div className="space-y-2">
                  {strengths.map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-kaya-green-50">
                      <span className="text-sm font-medium text-kaya-navy-900">{s.skill_name}</span>
                      <span className="text-xs text-kaya-green-400 font-medium">{s.proficiency} — {Math.round((s.confidence || 0) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Developing — support needed */}
            {developing.length > 0 && (
              <div className="bg-white rounded-xl border border-kaya-amber-400/20 p-6 mb-4">
                <h3 className="text-sm font-semibold text-kaya-amber-400 mb-3">Developing — Pair with Support</h3>
                <p className="text-xs text-kaya-stone-600 mb-3">Early evidence exists. Provide mentoring, shadowing, or structured practice opportunities.</p>
                <div className="space-y-2">
                  {developing.map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-kaya-amber-50">
                      <span className="text-sm font-medium text-kaya-navy-900">{s.skill_name}</span>
                      <span className="text-xs text-kaya-amber-400 font-medium">{Math.round((s.confidence || 0) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gaps — development plan */}
            {gaps.length > 0 && (
              <div className="bg-white rounded-xl border border-kaya-stone-100 p-6 mb-4">
                <h3 className="text-sm font-semibold text-kaya-navy-900 mb-3">Development Plan Focus</h3>
                <p className="text-xs text-kaya-stone-600 mb-3">Include in the 30/60/90 day development plan. Not a weakness — just not yet demonstrated.</p>
                <div className="flex flex-wrap gap-2">
                  {gaps.map((s: any, i: number) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-kaya-stone-50 text-kaya-stone-600">{s.skill_name}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Manager notes */}
            <div className="bg-white rounded-xl border border-kaya-stone-100 p-6">
              <h3 className="text-sm font-semibold text-kaya-navy-900 mb-3">Manager Onboarding Notes</h3>
              <p className="text-xs text-kaya-stone-600 mb-3">This person was assessed through storytelling, not tests. Their strengths are real, evidence-backed capabilities observed through behavioral evidence. Meet them where they are.</p>
              <div className="text-sm text-kaya-stone-600 space-y-2">
                <p><strong>Week 1:</strong> Orient to team. Assign tasks that leverage top strengths. Observe in action.</p>
                <p><strong>Week 2-4:</strong> Introduce developing skill areas with structured support. Pair with a mentor.</p>
                <p><strong>Month 2-3:</strong> Expand responsibilities. Revisit development plan. Check in on progress.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
