'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// ============================================================
// REFERENCE ASSESSMENT PAGE
// A reference (colleague, trainer, family member) rates the candidate
// Clean, mobile-friendly, no login needed. ~5-10 minutes.
// ============================================================

function ReferencePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [rubric, setRubric] = useState<any[]>([]);
  const [candidateName, setCandidateName] = useState('the candidate');
  const [refInfo, setRefInfo] = useState<any>(null);
  const [instructions, setInstructions] = useState('');
  const [ratings, setRatings] = useState<Record<string, { rating: number; example: string }>>({});
  const [overall, setOverall] = useState('');
  const [context, setContext] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setError('No reference token provided.'); setLoading(false); return; }
    loadRubric();
  }, [token]);

  const loadRubric = async () => {
    try {
      const res = await fetch('/api/peer-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_rubric', token }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); setLoading(false); return; }
      setRubric(data.rubric || []);
      setCandidateName(data.candidate_name || 'the candidate');
      setRefInfo(data.reference);
      setInstructions(data.instructions || '');
      // Initialize ratings
      const initial: Record<string, { rating: number; example: string }> = {};
      for (const q of (data.rubric || [])) { initial[q.skill_name] = { rating: 0, example: '' }; }
      setRatings(initial);
    } catch (e) { setError('Failed to load. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    // Validate — all skills rated
    const unrated = rubric.filter(q => !ratings[q.skill_name]?.rating);
    if (unrated.length > 0) { setError(`Please rate all skills. Missing: ${unrated.map(q => q.skill_name).join(', ')}`); return; }

    setSubmitting(true); setError('');
    try {
      const res = await fetch('/api/peer-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_assessment',
          token,
          ratings: Object.entries(ratings).map(([skill, data]) => ({
            skill_name: skill, rating: data.rating, example: data.example || undefined,
          })),
          overall_impression: overall,
          relationship_context: context,
        }),
      });
      const data = await res.json();
      if (data.success) { setSubmitted(true); }
      else { setError(data.error || 'Submission failed.'); }
    } catch { setError('Connection error. Please try again.'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-kaya-stone-50">
      <p className="text-sm text-kaya-stone-400">Loading assessment...</p>
    </div>
  );

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-kaya-stone-50">
      <div className="max-w-sm text-center">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-kaya-green-50">
          <span className="text-3xl">✅</span>
        </div>
        <h1 className="text-xl font-bold mb-2 text-kaya-navy-900">Thank You!</h1>
        <p className="text-sm text-kaya-stone-600">
          Your assessment of {candidateName} has been submitted. Your input helps build an accurate picture of their capabilities and supports their career journey.
        </p>
        <p className="text-xs mt-4 text-kaya-stone-200">You can close this page now.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-kaya-stone-50">
      {/* Header */}
      <div className="px-6 py-4 bg-kaya-navy-900">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-kaya-stone-600">
            <div className="w-2.5 h-2.5 rounded-full bg-kaya-green-400" />
          </div>
          <div>
            <span className="text-lg font-display text-kaya-navy-50">kaya</span>
            <p className="text-[10px] text-kaya-stone-400">Peer Assessment</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-6">
        {/* What is Kaya — context for references */}
        <div className="mb-6 p-4 rounded-kaya bg-white border border-kaya-stone-100">
          <p className="text-body font-semibold text-kaya-navy-900 mb-2">Why you&apos;re being asked</p>
          <p className="text-caption text-kaya-stone-600 leading-relaxed">
            Kaya is a skills assessment platform that helps people demonstrate their real capabilities to employers.
            {candidateName ? ` ${candidateName} has` : ' This candidate has'} completed a skills conversation and workplace simulation.
            Your independent assessment helps verify their skills from someone who knows them — making the profile more trustworthy for employers.
          </p>
          <p className="text-caption text-kaya-stone-400 mt-2">
            Your responses are confidential and used only for skills assessment. It takes about 5 minutes.
          </p>
        </div>

        {/* Intro */}
        <div className="mb-6">
          <h1 className="text-lg font-bold mb-2 text-kaya-navy-900">
            Assessment for {candidateName}
          </h1>
          {refInfo && (
            <p className="text-xs mb-2 text-kaya-stone-400">
              You're providing this as: {refInfo.name} ({refInfo.relationship})
            </p>
          )}
          <p className="text-sm leading-relaxed text-kaya-stone-600">{instructions}</p>
        </div>

        {/* Relationship context */}
        <div className="mb-6 p-4 rounded-xl bg-white border border-kaya-stone-100">
          <label className="block text-sm font-medium mb-2 text-kaya-navy-900">
            How well do you know {candidateName}?
          </label>
          <textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder={`e.g. "We worked together for 2 years at the same company" or "I was their trainer in the Virtualahan program"`}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm outline-none resize-none border-kaya-stone-100 text-kaya-navy-900"
          />
        </div>

        {/* Skill ratings */}
        <div className="space-y-4 mb-6">
          {rubric.map((q, i) => (
            <div key={q.skill_name} className="p-4 rounded-xl bg-white border border-kaya-stone-100">
              <p className="text-sm font-semibold mb-1 text-kaya-navy-900">{q.question}</p>
              <p className="text-xs mb-3 text-kaya-stone-400">{q.description}</p>

              {/* Rating scale */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-kaya-stone-200">{q.low_anchor}</span>
                <span className="text-[10px] text-kaya-stone-200">{q.high_anchor}</span>
              </div>
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setRatings(prev => ({ ...prev, [q.skill_name]: { ...prev[q.skill_name], rating: n } }))}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all border-2 ${
                      ratings[q.skill_name]?.rating === n 
                        ? 'bg-kaya-green-400 text-white border-kaya-green-400' 
                        : 'bg-kaya-navy-50 text-kaya-stone-600 border-transparent'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Optional example */}
              <input
                type="text"
                value={ratings[q.skill_name]?.example || ''}
                onChange={e => setRatings(prev => ({ ...prev, [q.skill_name]: { ...prev[q.skill_name], example: e.target.value } }))}
                placeholder="Optional: give a specific example you've seen"
                className="w-full px-3 py-2 border rounded-lg text-xs outline-none border-kaya-stone-100 text-kaya-stone-600"
              />
            </div>
          ))}
        </div>

        {/* Overall impression */}
        <div className="mb-6 p-4 rounded-xl bg-white border border-kaya-stone-100">
          <label className="block text-sm font-medium mb-2 text-kaya-navy-900">
            Overall, what stands out about {candidateName}?
          </label>
          <textarea
            value={overall}
            onChange={e => setOverall(e.target.value)}
            placeholder="What would you want an employer to know about this person? What are they great at?"
            rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm outline-none resize-none border-kaya-stone-100 text-kaya-navy-900"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-2 rounded-lg text-sm bg-kaya-red-50 text-kaya-red-400">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all ${submitting ? 'bg-kaya-stone-400' : 'bg-kaya-green-400 hover:bg-kaya-green-300'}`}
        >
          {submitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
        <p className="text-[10px] text-center mt-3 text-kaya-stone-200">
          Your responses are confidential and used only for skills assessment purposes.
        </p>
      </div>
    </div>
  );
}

export default function ReferencePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-kaya-stone-50"><p className="text-sm text-kaya-stone-400">Loading...</p></div>}>
      <ReferencePage />
    </Suspense>
  );
}
