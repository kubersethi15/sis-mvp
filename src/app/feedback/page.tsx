'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function FeedbackPage() {
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<any>(null);
  const [extraction, setExtraction] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const userId = localStorage.getItem('kaya_user_id');
      if (!userId) { setLoading(false); return; }

      // Get latest extraction
      const { data: sessions } = await supabase.from('leee_sessions')
        .select('id').eq('user_id', userId).eq('status', 'completed')
        .order('created_at', { ascending: false }).limit(1);

      if (sessions?.length) {
        const { data: ext } = await supabase.from('leee_extractions')
          .select('*').eq('session_id', sessions[0].id).limit(1).single();
        if (ext) setExtraction(ext);
      }

      // Get latest application with feedback
      const { data: apps } = await supabase.from('applications')
        .select('*, vacancies(title, employer_name)')
        .eq('jobseeker_id', userId)
        .order('created_at', { ascending: false }).limit(1);

      if (apps?.length) setFeedback(apps[0]);
      setLoading(false);
    }
    load();
  }, []);

  const skills = extraction?.skills_profile || [];
  const demonstrated = skills.filter((s: any) => (s.confidence || 0) >= 0.6);
  const toStrengthen = skills.filter((s: any) => (s.confidence || 0) > 0 && (s.confidence || 0) < 0.6);
  const allPsf = ['Communication', 'Collaboration', 'Problem Solving', 'Adaptability', 'Self-Management', 'Learning Agility', 'Decision Making', 'Influence', 'Customer Orientation', 'Developing People', 'Digital Fluency', 'Creative Thinking', 'Building Inclusivity', 'Global Perspective', 'Sense Making', 'Transdisciplinary Thinking'];
  const notAssessed = allPsf.filter(s => !skills.some((sk: any) => sk.skill_name === s));

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF9' }}><p className="text-gray-400">Loading...</p></div>;

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      <nav className="px-6 py-3 flex items-center justify-between" style={{ background: '#102A43' }}>
        <a href="/my-dashboard" className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#486581' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#48BB78' }} />
          </div>
          <span className="text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#F0F4F8' }}>kaya</span>
        </a>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <a href="/my-dashboard" className="text-xs" style={{ color: '#9FB3C8', whiteSpace: 'nowrap' }}>Dashboard</a>
          <a href="/vacancy" className="text-xs" style={{ color: '#9FB3C8', whiteSpace: 'nowrap' }}>Browse Jobs</a>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-8 pb-16">
        <div className="mb-8">
          <h1 className="text-xl font-bold" style={{ color: '#102A43' }}>Your Skills Feedback</h1>
          <p className="text-sm mt-1" style={{ color: '#627D98' }}>
            {feedback?.vacancies?.title
              ? `Feedback from your application to ${feedback.vacancies.title} at ${feedback.vacancies.employer_name}`
              : 'Based on your conversations with Aya'}
          </p>
        </div>

        {/* Encouragement */}
        <div className="bg-white rounded-xl border border-green-200 p-6 mb-6" style={{ background: '#F0FFF4' }}>
          <p className="text-sm font-medium" style={{ color: '#276749' }}>
            Every conversation reveals something valuable about you. Here's what your stories showed — and where you can grow.
          </p>
        </div>

        {/* Skills You Demonstrated */}
        {demonstrated.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#102A43' }}>Skills You Demonstrated</h2>
            <p className="text-xs text-gray-500 mb-4">These skills came through clearly in your stories. They are real capabilities backed by evidence.</p>
            <div className="space-y-3">
              {demonstrated.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#F7FAFC' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-green-400 to-green-600">
                    {s.skill_name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{s.skill_name}</p>
                    <p className="text-xs text-gray-500">{s.proficiency} — {Math.round((s.confidence || 0) * 100)}% confidence</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills to Strengthen */}
        {toStrengthen.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#102A43' }}>Skills to Strengthen</h2>
            <p className="text-xs text-gray-500 mb-4">We saw early signs of these skills but need more evidence. Continue chatting with Aya to build stronger evidence.</p>
            <div className="space-y-3">
              {toStrengthen.map((s: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#FFFBEB' }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-amber-400 to-amber-600">
                    {s.skill_name?.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{s.skill_name}</p>
                    <p className="text-xs text-gray-500">{Math.round((s.confidence || 0) * 100)}% — tell more stories to strengthen this</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Not Yet Assessed */}
        {notAssessed.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#102A43' }}>Not Yet Assessed</h2>
            <p className="text-xs text-gray-500 mb-4">These skills didn't come up in your stories yet. That doesn't mean you don't have them — it means we haven't heard the right story yet.</p>
            <div className="flex flex-wrap gap-2">
              {notAssessed.map((s, i) => (
                <span key={i} className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-500">{s}</span>
              ))}
            </div>
          </div>
        )}

        {/* What to do next */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#102A43' }}>What You Can Do Next</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. <strong>Continue with Aya</strong> — share more stories to discover additional skills and strengthen existing ones.</p>
            <p>2. <strong>Browse other vacancies</strong> — your skills may be a better match for a different role.</p>
            <p>3. <strong>Upskill</strong> — focus on the skills to strengthen. Even small experiences count as evidence.</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Link href="/chat?new=1" className="flex-1 text-center py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: '#102A43' }}>
            Continue with Aya
          </Link>
          <Link href="/vacancy" className="flex-1 text-center py-3 rounded-xl text-sm font-semibold border"
            style={{ color: '#102A43', borderColor: '#D9E2EC' }}>
            Browse Vacancies
          </Link>
        </div>
      </div>
    </div>
  );
}
