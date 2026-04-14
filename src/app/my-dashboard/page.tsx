'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { kayaFetch } from '@/lib/kaya-fetch';

// ============================================================
// JOBSEEKER DASHBOARD
// The central hub: profile status, LEEE session, matching vacancies,
// applications, skills profile — all in one place
// ============================================================

interface DashboardData {
  user: { name: string; email: string } | null;
  profile: any | null;
  leeeSession: { id: string; status: string; stories: number } | null;
  extraction: any | null;
  applications: any[];
  matches: any[];
}

export default function MyDashboard() {
  const [data, setData] = useState<DashboardData>({
    user: null, profile: null, leeeSession: null, extraction: null, applications: [], matches: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const profileId = localStorage.getItem('kaya_jobseeker_profile_id');
      const userId = localStorage.getItem('kaya_user_id');

      let profile = null;
      let user = null;

      // Get profile
      if (profileId) {
        const res = await kayaFetch('/api/profile', { action: 'get', profile_id: profileId });
        const d = await res.json();
        profile = d.profile;
        user = profile?.user_profiles ? { name: profile.user_profiles.full_name, email: profile.user_profiles.email } : null;
      } else if (userId) {
        // Fallback — find profile by user_id
        const res = await kayaFetch('/api/profile', { action: 'get_by_user', user_id: userId });
        const d = await res.json();
        if (d.profile) {
          profile = d.profile;
          localStorage.setItem('kaya_jobseeker_profile_id', d.profile.id);
          user = profile?.user_profiles ? { name: profile.user_profiles.full_name, email: profile.user_profiles.email } : null;
        }
      }

      // Get LEEE session
      let leeeSession = null;
      let extraction = null;
      const storedExtraction = localStorage.getItem('kaya_last_extraction');
      if (storedExtraction) {
        try { extraction = JSON.parse(storedExtraction); } catch (e) {}
      }
      const sessionId = localStorage.getItem('kaya_last_session_id');
      if (sessionId) {
        leeeSession = { id: sessionId, status: extraction ? 'completed' : 'active', stories: extraction?.session_quality?.stories_completed || 0 };
      }

      // Get matches
      let matches: any[] = [];
      if (profileId) {
        try {
          const matchRes = await kayaFetch('/api/match', { action: 'match_for_jobseeker', jobseeker_profile_id: profileId });
          const matchData = await matchRes.json();
          matches = (matchData.matches || []).slice(0, 5);
        } catch (e) {}
      }

      // Get applications
      let applications: any[] = [];
      try {
        const appRes = await kayaFetch('/api/demo', { action: 'get_demo_state' });
        const appData = await appRes.json();
        applications = (appData.applications || []).filter((a: any) => profileId && a.jobseeker_id === profileId);
      } catch (e) {}

      setData({ user, profile, leeeSession, extraction, applications, matches });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const profileCompletion = data.profile?.completion_percentage || 0;
  const hasProfile = !!data.profile;
  const hasLEEE = !!data.extraction;
  const skillsCount = data.extraction?.skills_profile?.length || 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF9' }}>
        <div style={{ color: '#829AB1' }}>Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      {/* Kaya Nav */}
      <nav className="px-6 py-3 flex items-center justify-between" style={{ background: '#102A43' }}>
        <a href="/my-dashboard" className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#486581' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#48BB78' }} />
          </div>
          <span className="text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#F0F4F8' }}>kaya</span>
        </a>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/profile" className="text-xs" style={{ color: '#9FB3C8', whiteSpace: 'nowrap' }}>Edit Profile</Link>
          <Link href="/faq" className="text-xs" style={{ color: '#9FB3C8', whiteSpace: 'nowrap' }}>Help</Link>
          <button
            onClick={async () => {
              try {
                const { createClient } = await import('@supabase/supabase-js');
                const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
                await sb.auth.signOut();
              } catch {}
              localStorage.clear();
              window.location.href = '/auth';
            }}
            className="text-xs"
            style={{ color: '#9FB3C8', whiteSpace: 'nowrap' }}
          >Sign Out</button>
        </div>
      </nav>

      {/* Greeting */}
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-2">
        <h1 className="text-lg font-bold" style={{ color: '#102A43' }}>
          {data.user?.name ? `Kumusta, ${data.user.name.split(' ')[0]}!` : 'My Dashboard'}
        </h1>
        <p className="text-xs" style={{ color: '#627D98' }}>Show what you can do — your stories become evidence</p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-4 space-y-6">

        {/* JOURNEY PROGRESS */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-500 mb-4">YOUR JOURNEY</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { step: 1, label: 'Create Profile', done: hasProfile, icon: '', href: '/profile', description: profileCompletion > 0 ? `${profileCompletion}% complete` : 'Tell us about yourself' },
              { step: 2, label: 'Tell Your Story', done: hasLEEE, icon: '', href: hasLEEE ? '/chat?new=1' : '/chat', description: hasLEEE ? `${skillsCount} skills discovered` : 'Chat with Aya' },
              { step: 3, label: 'Browse Jobs', done: data.matches.length > 0, icon: '', href: '/vacancy', description: data.matches.length > 0 ? `${data.matches.length} matches` : 'Find matching vacancies' },
              { step: 4, label: 'Apply & Grow', done: data.applications.length > 0, icon: '', href: '/vacancy', description: data.applications.length > 0 ? `${data.applications.length} application(s)` : 'Start your journey' },
            ].map((s) => (
              <Link key={s.step} href={s.href}
                className={`p-4 rounded-xl border text-center transition-all hover:shadow-md hover:scale-[1.02] ${
                  s.done ? 'bg-amber-50 border-amber-200' : 'bg-white border-stone-200 hover:border-amber-200'
                }`}>
                <div className="text-2xl mb-2">{s.done ? '•' : '○'}</div>
                <div className="text-xs font-semibold text-stone-700">{s.label}</div>
                <div className="text-[10px] text-stone-400 mt-1">{s.description}</div>
              </Link>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-1000"
              style={{ width: `${[hasProfile, hasLEEE, data.matches.length > 0, data.applications.length > 0].filter(Boolean).length * 25}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* SKILLS SNAPSHOT */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-stone-500">YOUR SUPERPOWERS</h2>
              {hasLEEE && <Link href="/skills" className="text-xs text-amber-600 hover:text-amber-700">View Full Profile →</Link>}
            </div>

            {hasLEEE ? (
              <div className="space-y-3">
                {data.extraction.skills_profile?.slice(0, 4).map((skill: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-sky-400 to-blue-500">
                      {skill.skill_name?.substring(0, 2).toUpperCase() || '??'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-stone-700">{skill.skill_name}</span>
                        <span className="text-[10px] text-amber-600 font-medium">
                          {(skill.proficiency === 'Not_scored' || skill.proficiency === 'not_scored' || !skill.proficiency) ? 'Emerging' : skill.proficiency} • {Math.round((skill.confidence || 0.5) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                          style={{ width: `${skill.confidence * 100}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
                {data.extraction.skills_profile?.length > 4 && (
                  <p className="text-[10px] text-stone-400 text-center">+{data.extraction.skills_profile.length - 4} more skills</p>
                )}

                {/* Continue with Aya — start new session */}
                <div className="pt-3 mt-3" style={{ borderTop: '1px solid #E2E8F0' }}>
                  <Link href="/chat?new=1"
                    className="block text-center px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:shadow-md"
                    style={{ background: '#102A43', color: '#F0F4F8' }}>
                    Continue with Aya — discover more skills
                  </Link>
                  <p className="text-[10px] text-center mt-1.5" style={{ color: '#829AB1' }}>
                    {data.extraction.skills_profile?.length || 0} of 16 PSF skills evidenced
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm mb-2" style={{ color: "#829AB1" }}>No skills extracted yet</p>
                <p className="text-sm text-stone-500 mb-3">Your superpowers haven't been discovered yet</p>
                <Link href="/chat"
                  className="inline-block px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all">
                  Talk to Aya →
                </Link>
              </div>
            )}
          </div>

          {/* PROFILE SNAPSHOT */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-stone-500">YOUR PROFILE</h2>
              <Link href="/profile" className="text-xs text-amber-600 hover:text-amber-700">Edit →</Link>
            </div>

            {hasProfile ? (
              <div className="space-y-3">
                {/* Completion */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-stone-500">Profile Completion</span>
                      <span className="text-xs font-bold text-amber-600">{profileCompletion}%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-2">
                      <div className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                        style={{ width: `${profileCompletion}%` }} />
                    </div>
                  </div>
                </div>

                {/* Quick facts */}
                <div className="space-y-2 text-xs" style={{ color: '#486581' }}>
                  {data.profile.preferred_location && (
                    <div className="flex items-center gap-2">Location: {data.profile.preferred_location}</div>
                  )}
                  {data.profile.work_history?.length > 0 && (
                    <div className="flex items-center gap-2">{data.profile.work_history.length} work experience{data.profile.work_history.length > 1 ? 's' : ''}</div>
                  )}
                  {data.profile.education?.length > 0 && (
                    <div className="flex items-center gap-2">{data.profile.education.length} education record{data.profile.education.length > 1 ? 's' : ''}</div>
                  )}
                  {data.profile.certifications?.length > 0 && (
                    <div className="flex items-center gap-2">{data.profile.certifications.length} certification{data.profile.certifications.length > 1 ? 's' : ''}</div>
                  )}
                  {data.profile.disability_type && data.profile.disability_type !== 'prefer_not_to_say' && (
                    <div className="flex items-center gap-2">Disability: {data.profile.disability_type}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                
                <p className="text-sm text-stone-500 mb-3">Create your profile to get started</p>
                <Link href="/profile"
                  className="inline-block px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all">
                  Create Profile →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* MATCHING VACANCIES */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-stone-500">JOBS FOR YOU</h2>
            <Link href="/vacancy" className="text-xs text-amber-600 hover:text-amber-700">Browse All →</Link>
          </div>

          {data.matches.length > 0 ? (
            <div className="space-y-3">
              {data.matches.map((match: any, i: number) => (
                <Link key={i} href="/vacancy"
                  className="flex items-center justify-between p-3 rounded-xl border border-stone-100 hover:border-amber-200 hover:bg-amber-50/50 transition-all">
                  <div>
                    <div className="text-sm font-medium text-stone-800">{match.title}</div>
                    <div className="text-xs text-stone-400">{match.employer} • {match.location || 'Location not set'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {match.accessibility_friendly && <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Accessible</span>}
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      match.match_score >= 70 ? 'bg-green-100 text-green-700' :
                      match.match_score >= 40 ? 'bg-amber-100 text-amber-700' :
                      'bg-stone-100 text-stone-500'
                    }`}>
                      {match.match_score}% match
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-stone-400">
              <p className="text-sm">{hasProfile ? 'No vacancies available yet' : 'Create your profile to see matching jobs'}</p>
            </div>
          )}
        </div>

        {/* APPLICATIONS */}
        {data.applications.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-sm font-semibold text-stone-500 mb-4">YOUR APPLICATIONS</h2>
            <div className="space-y-2">
              {data.applications.map((app: any, i: number) => {
                const isDeclined = app.status === 'not_selected' || app.status?.includes('stopped');
                const isSelected = app.status === 'selected' || app.status === 'onboarding';
                const isPending = app.status?.includes('pending');
                const isGate3 = app.status === 'gate3_pending' || app.status === 'gate3_simulation' || app.current_gate === 3;
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-stone-100">
                    <div>
                      <span className="text-sm text-stone-700">{app.vacancies?.title || `Application ${app.id?.substring(0, 8)}`}</span>
                      {app.vacancies?.employer_name && (
                        <span className="text-xs text-stone-400 ml-2">at {app.vacancies.employer_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        isSelected ? 'bg-green-100 text-green-700' :
                        isPending ? 'bg-amber-100 text-amber-700' :
                        isDeclined ? 'bg-red-50 text-red-600' :
                        'bg-stone-100 text-stone-500'
                      }`}>
                        {isSelected ? 'Selected' : isDeclined ? 'Not Selected' : app.status?.replace(/_/g, ' ')}
                      </span>
                      {isGate3 && !isSelected && !isDeclined && (
                        <Link href={`/simulation?app=${app.id}`} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: '#48BB78' }}>
                          Start Simulation →
                        </Link>
                      )}
                      {isDeclined && (
                        <Link href="/feedback" className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: '#F0F4F8', color: '#2E86C1' }}>
                          View Feedback
                        </Link>
                      )}
                      {isSelected && (
                        <Link href="/onboarding" className="text-xs font-medium px-2 py-1 rounded-lg" style={{ background: '#E8F8F5', color: '#27AE60' }}>
                          Onboarding
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/chat" className="p-4 bg-white/80 rounded-xl border border-stone-200 text-center hover:border-amber-200 hover:shadow-md transition-all">
            <span className="text-xl" style={{ fontFamily: "Georgia, serif", color: "#48BB78" }}>kaya</span>
            <p className="text-xs font-medium text-stone-700 mt-1">Talk to Aya</p>
          </Link>
          <Link href="/skills" className="p-4 bg-white/80 rounded-xl border border-stone-200 text-center hover:border-amber-200 hover:shadow-md transition-all">
            <span className="text-sm font-semibold" style={{ color: '#48BB78' }}>NEW</span>
            <p className="text-xs font-medium text-stone-700 mt-1">My Skills</p>
          </Link>
          <Link href="/vacancy" className="p-4 bg-white/80 rounded-xl border border-stone-200 text-center hover:border-amber-200 hover:shadow-md transition-all">
            <span className="text-sm font-semibold" style={{ color: '#486581' }}>JOBS</span>
            <p className="text-xs font-medium text-stone-700 mt-1">Browse Jobs</p>
          </Link>
          <Link href="/references" className="p-4 bg-white/80 rounded-xl border border-stone-200 text-center hover:border-purple-200 hover:shadow-md transition-all">
            <span className="text-sm font-semibold" style={{ color: '#8E44AD' }}>360°</span>
            <p className="text-xs font-medium text-stone-700 mt-1">References</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
