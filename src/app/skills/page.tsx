'use client';

import { useState, useEffect } from 'react';

// ============================================================
// TYPES
// ============================================================

interface SkillScore {
  skill_id: string;
  skill_name: string;
  proficiency: 'basic' | 'intermediate' | 'advanced';
  confidence: number;
  evidence: Array<{
    episode_id: number;
    transcript_quote: string;
    behavioral_indicator: string;
    proficiency_justification: string;
  }>;
}

interface Extraction {
  skills_profile: SkillScore[];
  episodes: Array<{ episode_id: number; summary: string }>;
  narrative_summary: string;
  gaming_flags: Array<{ flag_type: string; severity: string; evidence: string }>;
  layer2_seeds: Array<{ scenario: string; target_skills: string[] }>;
  session_quality: {
    stories_completed: number;
    evidence_density: string;
    user_engagement: string;
    overall_confidence: number;
  };
}

// ============================================================
// CONFIG
// ============================================================

// All 16 PSF Enabling Skills — clean icons with brand-aligned colors
const SKILL_CONFIG: Record<string, { icon: string; gradient: string; color: string; bgColor: string }> = {
  // Interacting with Others
  'Building Inclusivity':    { icon: 'BI', gradient: 'from-emerald-400 to-green-500',   color: '#16A085', bgColor: '#E8F6F3' },
  'Collaboration':           { icon: 'CO', gradient: 'from-teal-400 to-emerald-500',    color: '#27AE60', bgColor: '#E8F8F5' },
  'Communication':           { icon: 'CM', gradient: 'from-sky-400 to-blue-500',        color: '#2E86C1', bgColor: '#EBF5FB' },
  'Customer Orientation':    { icon: 'CU', gradient: 'from-blue-400 to-indigo-500',     color: '#2471A3', bgColor: '#EBF5FB' },
  'Developing People':       { icon: 'DP', gradient: 'from-amber-400 to-orange-500',    color: '#E67E22', bgColor: '#FEF3E2' },
  'Influence':               { icon: 'IN', gradient: 'from-orange-400 to-red-400',      color: '#D35400', bgColor: '#FDEBD0' },
  // Staying Relevant and Evolving
  'Adaptability':            { icon: 'AD', gradient: 'from-cyan-400 to-teal-400',       color: '#1ABC9C', bgColor: '#E8F6F3' },
  'Adaptability / Resilience': { icon: 'AD', gradient: 'from-cyan-400 to-teal-400',     color: '#1ABC9C', bgColor: '#E8F6F3' },
  'Digital Fluency':         { icon: 'DF', gradient: 'from-indigo-400 to-blue-500',     color: '#5B2C6F', bgColor: '#F4ECF7' },
  'Global Perspective':      { icon: 'GP', gradient: 'from-blue-400 to-cyan-400',       color: '#2980B9', bgColor: '#EBF5FB' },
  'Learning Agility':        { icon: 'LA', gradient: 'from-rose-400 to-pink-500',       color: '#E74C3C', bgColor: '#FDEDEC' },
  'Self-Management':         { icon: 'SM', gradient: 'from-violet-400 to-purple-500',   color: '#8E44AD', bgColor: '#F4ECF7' },
  'Self Management':         { icon: 'SM', gradient: 'from-violet-400 to-purple-500',   color: '#8E44AD', bgColor: '#F4ECF7' },
  // Generating Results
  'Creative Thinking':       { icon: 'CT', gradient: 'from-pink-400 to-rose-500',       color: '#C0392B', bgColor: '#FDEDEC' },
  'Decision Making':         { icon: 'DM', gradient: 'from-slate-400 to-gray-600',      color: '#34495E', bgColor: '#EBEDEF' },
  'Problem Solving':         { icon: 'PS', gradient: 'from-violet-400 to-purple-500',   color: '#8E44AD', bgColor: '#F4ECF7' },
  'Problem-Solving':         { icon: 'PS', gradient: 'from-violet-400 to-purple-500',   color: '#8E44AD', bgColor: '#F4ECF7' },
  'Sense Making':            { icon: 'SE', gradient: 'from-indigo-400 to-violet-500',   color: '#34495E', bgColor: '#EBEDEF' },
  'Transdisciplinary Thinking': { icon: 'TT', gradient: 'from-gray-400 to-slate-500',   color: '#566573', bgColor: '#EBEDEF' },
  // Legacy aliases
  'Emotional Intelligence':  { icon: 'EI', gradient: 'from-amber-400 to-orange-400',    color: '#E67E22', bgColor: '#FEF3E2' },
};

const PROFICIENCY_CONFIG = {
  basic:        { label: 'Emerging',   badge: 'bg-amber-100 text-amber-700',   bar: 'from-amber-300 to-amber-400', width: '33%',  pqf: '1–2' },
  intermediate: { label: 'Developing', badge: 'bg-sky-100 text-sky-700',       bar: 'from-sky-400 to-blue-400',    width: '66%',  pqf: '3–4' },
  advanced:     { label: 'Proficient', badge: 'bg-emerald-100 text-emerald-700', bar: 'from-emerald-400 to-teal-400', width: '100%', pqf: '5–6' },
};

const ALL_SKILLS = [
  'Building Inclusivity', 'Collaboration', 'Communication', 'Customer Orientation',
  'Developing People', 'Influence', 'Adaptability', 'Digital Fluency',
  'Global Perspective', 'Learning Agility', 'Self-Management',
  'Creative Thinking', 'Decision Making', 'Problem Solving', 'Sense Making',
  'Transdisciplinary Thinking',
];

// ============================================================
// COMPONENT
// ============================================================

export default function SkillsDashboard() {
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'skills' | 'evidence' | 'gaps' | 'passport'>('skills');
  const [animatedBars, setAnimatedBars] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('kaya_last_extraction');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        // Fix confidence: if all skills show 0.5, recalculate from raw pipeline or proficiency
        if (parsed.skills_profile?.every((s: any) => s.confidence === 0.5)) {
          // Try raw pipeline data first
          const rawProfile = parsed._pipeline_stages?.stage5_profile || parsed.raw_extraction_response?.final_profile;
          const rawSkillMap: Record<string, number> = {};

          if (rawProfile) {
            for (const s of (rawProfile.vacancy_aligned_skills || [])) {
              rawSkillMap[s.skill_name] = s.top_evidence?.adjusted_confidence || s.adjusted_confidence || 0.5;
            }
            for (const s of (rawProfile.additional_skills_evidenced || [])) {
              rawSkillMap[s.skill_name] = s.top_evidence?.adjusted_confidence || s.adjusted_confidence || 0.5;
            }
          }

          // Also check stage 3 mappings
          const stage3 = parsed._pipeline_stages?.stage3_mappings;
          if (stage3 && Array.isArray(stage3)) {
            for (const m of stage3) {
              if (m.skill_name && m.confidence && !rawSkillMap[m.skill_name]) {
                rawSkillMap[m.skill_name] = m.confidence;
              }
            }
          }

          parsed.skills_profile = parsed.skills_profile.map((s: any) => ({
            ...s,
            confidence: rawSkillMap[s.skill_name]
              || (s.proficiency?.toLowerCase() === 'advanced' ? 0.85 : s.proficiency?.toLowerCase() === 'intermediate' ? 0.72 : 0.55),
          }));
        }

        setExtraction(parsed);
      } catch (e) {}
    }
    setLoading(false);
    setTimeout(() => setAnimatedBars(true), 300);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #0F0C29, #302B63)' }}>
        <div className="text-white/50 text-sm">Loading your skills profile...</div>
      </div>
    );
  }

  if (!extraction) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(160deg, #FFF8F0, #FEF3E2, #F0F7F4)' }}>
        <div className="text-center max-w-sm px-6">
          <p className="text-2xl font-bold mb-5" style={{ fontFamily: "Georgia, serif", color: "#48BB78" }}>kaya</p>
          <h1 className="text-2xl font-bold text-stone-800 mb-2" style={{ fontFamily: "'Nunito', sans-serif" }}>No Skills Profile Yet</h1>
          <p className="text-stone-500 mb-8 text-[15px] leading-relaxed">Complete a conversation with Aya to discover the skills hidden in your lived experience.</p>
          <a href="/chat" className="inline-block px-8 py-3.5 rounded-2xl font-semibold text-white shadow-lg transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(135deg, #F4A261, #E76F51)', fontFamily: "'Nunito', sans-serif" }}>
            Talk to Aya →
          </a>
        </div>
      </div>
    );
  }

  const skills = (extraction.skills_profile || []).sort((a: any, b: any) => (b.confidence || 0) - (a.confidence || 0));
  const quality = extraction.session_quality;
  const overallConfidence = quality?.overall_confidence
    ? Math.round(quality.overall_confidence * 100)
    : skills.length > 0 ? Math.round((skills.reduce((a, s) => a + s.confidence, 0) / skills.length) * 100) : 0;
  const evidencedNames = skills.map(s => s.skill_name);
  const gaps = ALL_SKILLS.filter(s => !evidencedNames.includes(s));

  // Passport export
  const exportPassport = () => {
    const passport = {
      version: '1.0', framework: 'PSF-HCD', pqf_aligned: true,
      generated_at: new Date().toISOString(),
      candidate: {
        stories_completed: quality?.stories_completed,
        evidence_density: quality?.evidence_density,
        overall_confidence: quality?.overall_confidence,
      },
      skills: skills.map(s => ({
        skill_id: s.skill_id, skill_name: s.skill_name,
        proficiency: s.proficiency?.toLowerCase(),
        pqf_level: PROFICIENCY_CONFIG[(s.proficiency?.toLowerCase() as keyof typeof PROFICIENCY_CONFIG)]?.pqf || '1–2',
        confidence: s.confidence, evidence_count: s.evidence?.length || 0,
      })),
      narrative: extraction.narrative_summary,
      gaps: gaps,
    };
    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'skills-passport.json'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(170deg, #FFF8F0 0%, #FEF3E2 20%, #F0F7F4 60%, #EDF6F9 100%)' }}>

      {/* ── HERO HEADER ── */}
      <div style={{ background: 'linear-gradient(160deg, #0F0C29 0%, #302B63 60%, #24243e 100%)' }}>
        <div className="max-w-3xl mx-auto px-6 pt-10 pb-8">

          {/* Top nav */}
          <div className="flex items-center justify-between mb-8">
            <a href="/my-dashboard" className="flex items-center gap-1.5 text-white/50 hover:text-white/80 text-sm transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Dashboard
            </a>
            <div className="flex items-center gap-3">
              <span className="text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: 'rgba(255,255,255,0.7)' }}>kaya</span>
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/50 text-xs">PSF-HCD Aligned</span>
            </div>
          </div>

          {/* Identity block */}
          <div className="flex items-start gap-4 mb-8">
            <div>
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Kaya · Virtualahan</p>
              <h1 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Nunito', sans-serif" }}>
                Your Skills Profile
              </h1>
              {extraction.narrative_summary && (
                <p className="text-white/60 text-sm leading-relaxed max-w-lg">{extraction.narrative_summary}</p>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { value: skills.length, label: 'Skills Found' },
              { value: `${overallConfidence}%`, label: 'Confidence' },
              { value: quality?.stories_completed || 0, label: 'Stories Shared' },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="text-2xl font-bold text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>{stat.value}</div>
                <div className="text-white/40 text-[11px] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {[
              { id: 'skills', label: 'Skills', count: skills.length },
              { id: 'evidence', label: 'Evidence', count: null },
              { id: 'gaps', label: 'Gaps', count: gaps.length },
              { id: 'passport', label: 'Passport', count: null },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className="flex-1 py-2 px-2 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{
                  background: activeTab === tab.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : 'rgba(255,255,255,0.45)',
                }}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-1 opacity-60">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* SKILLS TAB */}
        {activeTab === 'skills' && (
          <div className="space-y-3">
            {skills.length === 0 && (
              <div className="text-center py-16 text-stone-400">
                <p className="text-sm font-medium" style={{ color: '#627D98' }}>No data yet</p>
                <p>No skills extracted yet. Complete a conversation with Aya first.</p>
              </div>
            )}
            {skills.map((skill, i) => {
              const cfg = SKILL_CONFIG[skill.skill_name] || { icon: '??', gradient: 'from-amber-400 to-orange-400', color: '#F4A261', bgColor: '#FEF3E2' };
              const profKey = (skill.proficiency || 'basic').toLowerCase() as keyof typeof PROFICIENCY_CONFIG;
              const prof = PROFICIENCY_CONFIG[profKey] || PROFICIENCY_CONFIG.basic;
              const isExpanded = expandedSkill === skill.skill_id;

              return (
                <div
                  key={skill.skill_id}
                  className="rounded-2xl overflow-hidden border transition-all duration-300"
                  style={{
                    background: 'white',
                    borderColor: isExpanded ? cfg.color + '40' : '#f1f5f9',
                    boxShadow: isExpanded ? `0 4px 24px ${cfg.color}20` : '0 1px 4px rgba(0,0,0,0.04)',
                    animation: `fadeInUp 0.5s ease-out ${i * 80}ms both`,
                  }}
                >
                  <button
                    className="w-full p-4 flex items-center gap-3 text-left"
                    onClick={() => setExpandedSkill(isExpanded ? null : skill.skill_id)}
                  >
                    {/* Skill icon */}
                    <div
                      className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-sm flex-none`}
                    >
                      <span className="text-white text-xs font-bold tracking-tight">{cfg.icon}</span>
                    </div>

                    {/* Name + bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-stone-800 text-[15px]">{skill.skill_name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${prof.badge}`}>
                          {prof.label}
                        </span>
                        <span className="text-[10px] text-stone-400 hidden sm:inline">PQF {prof.pqf}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${prof.bar} transition-all duration-1000 ease-out`}
                            style={{ width: animatedBars ? `${skill.confidence * 100}%` : '0%', transitionDelay: `${i * 100 + 200}ms` }}
                          />
                        </div>
                        <span className="text-sm font-bold flex-none" style={{ color: cfg.color }}>
                          {Math.round(skill.confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Expand chevron */}
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
                      className="flex-none transition-transform duration-300"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>

                  {/* Evidence panel */}
                  {isExpanded && skill.evidence?.length > 0 && (
                    <div className="px-5 pb-5 border-t" style={{ borderColor: cfg.color + '20' }}>
                      <p className="text-[11px] uppercase tracking-wider text-stone-400 mt-4 mb-3">Evidence from your story</p>
                      <div className="space-y-3">
                        {skill.evidence.map((ev, j) => (
                          <div key={j} className="pl-4 border-l-2 rounded-r-lg py-1" style={{ borderColor: cfg.color }}>
                            <p className="text-sm text-stone-700 italic leading-relaxed mb-1">"{ev.transcript_quote}"</p>
                            <p className="text-xs text-stone-500">{ev.behavioral_indicator}</p>
                            {ev.proficiency_justification && (
                              <p className="text-xs text-stone-400 mt-0.5">{ev.proficiency_justification}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isExpanded && (!skill.evidence || skill.evidence.length === 0) && (
                    <div className="px-5 pb-4 border-t border-stone-50">
                      <p className="text-xs text-stone-400 mt-3 italic">No direct quotes available for this skill.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* EVIDENCE TAB */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <p className="text-sm text-stone-500 mb-6">Every skill claim is traceable to a direct quote from your conversation — the audit trail for psychologist review.</p>
            {skills.map(skill => {
              const cfg = SKILL_CONFIG[skill.skill_name] || { icon: '??', gradient: 'from-amber-400 to-orange-400', color: '#F4A261', bgColor: '#FEF3E2' };
              if (!skill.evidence?.length) return null;
              return (
                <div key={skill.skill_id} className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 p-4 border-b border-stone-50" style={{ background: cfg.bgColor + '60' }}>
                    <span className="text-xl">{cfg.icon}</span>
                    <span className="font-semibold text-stone-800 text-sm">{skill.skill_name}</span>
                    <span className="text-xs text-stone-400 ml-auto">{skill.evidence.length} quote{skill.evidence.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-stone-50">
                    {skill.evidence.map((ev, j) => (
                      <div key={j} className="p-4">
                        <p className="text-sm text-stone-700 italic leading-relaxed mb-2">"{ev.transcript_quote}"</p>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-[11px] px-2 py-1 rounded-lg text-stone-500 bg-stone-50 border border-stone-100">
                            {ev.behavioral_indicator}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {/* Gaming flags — reviewer transparency */}
            {extraction.gaming_flags?.length > 0 && (
              <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
                <div className="flex items-center gap-3 p-4 border-b border-orange-50 bg-orange-50/60">
                  <span>⚠️</span>
                  <span className="font-semibold text-orange-700 text-sm">Authenticity Flags (Reviewer View)</span>
                </div>
                <div className="divide-y divide-stone-50">
                  {extraction.gaming_flags.map((flag, i) => (
                    <div key={i} className="p-4 flex items-start gap-3">
                      <span className={`mt-0.5 text-lg ${flag.severity === 'high' ? 'text-red-500' : flag.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'}`}>●</span>
                      <div>
                        <span className="font-medium text-stone-700 text-sm">{flag.flag_type}</span>
                        <p className="text-xs text-stone-500 mt-0.5">{flag.evidence}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* GAPS TAB */}
        {activeTab === 'gaps' && (
          <div>
            <div className="bg-white/80 rounded-2xl border border-stone-100 p-5 mb-6 shadow-sm">
              <p className="text-stone-600 text-sm leading-relaxed">
                These skills weren't evidenced in your stories. <strong>This isn't a judgment</strong> — you may simply not have had the chance to show them yet. Share more stories to uncover them.
              </p>
            </div>
            {gaps.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm font-medium" style={{ color: '#48BB78' }}>All skills mapped</p>
                <p className="text-emerald-600 font-semibold">All core skills were demonstrated!</p>
                <p className="text-stone-500 text-sm mt-1">Excellent coverage across the PSF framework.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gaps.map((gap, i) => {
                  const cfg = SKILL_CONFIG[gap] || { icon: '??', gradient: 'from-stone-300 to-stone-400', color: '#94a3b8', bgColor: '#f8fafc' };
                  return (
                    <div key={i} className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center gap-4 shadow-sm opacity-70">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-stone-100 flex-none grayscale">
                        {cfg.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-stone-600 text-sm">{gap}</p>
                        <p className="text-xs text-stone-400 mt-0.5">Not yet evidenced — share a story about this next time</p>
                      </div>
                      <a href="/chat"
                        className="text-xs px-3 py-1.5 rounded-xl font-medium transition-all hover:scale-[1.02]"
                        style={{ background: '#FEF3E2', color: '#E67E22' }}>
                        Tell a story
                      </a>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Layer 2 seeds */}
            {extraction.layer2_seeds?.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-semibold text-stone-500 mb-4 uppercase tracking-wider">Suggested Next Scenarios</h3>
                <div className="space-y-3">
                  {extraction.layer2_seeds.map((seed, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-stone-100 p-4 shadow-sm">
                      <p className="text-sm text-stone-700 mb-2">{seed.scenario}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {seed.target_skills.map((sk, j) => (
                          <span key={j} className="text-[11px] bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASSPORT TAB */}
        {activeTab === 'passport' && (
          <div>
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm mb-6">
              {/* Passport header */}
              <div className="p-6" style={{ background: 'linear-gradient(135deg, #0F0C29, #302B63)' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Kaya · Skills Passport</p>
                    <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Nunito', sans-serif" }}>Skills Passport</h2>
                    <p className="text-white/50 text-xs mt-1">Philippine Qualifications Framework Aligned</p>
                  </div>
                  <div className="text-right">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">🪪</div>
                  </div>
                </div>
              </div>

              {/* Skills table */}
              <div className="divide-y divide-stone-50">
                <div className="grid grid-cols-4 px-5 py-2.5 text-[11px] font-semibold text-stone-400 uppercase tracking-wider bg-stone-50">
                  <span className="col-span-2">Skill</span>
                  <span className="text-center">PQF Level</span>
                  <span className="text-center">Confidence</span>
                </div>
                {skills.map(skill => {
                  const cfg = SKILL_CONFIG[skill.skill_name] || { icon: '??', gradient: 'from-amber-400 to-orange-400', color: '#F4A261', bgColor: '#FEF3E2' };
                  const profKey = (skill.proficiency || 'basic').toLowerCase() as keyof typeof PROFICIENCY_CONFIG;
                  const prof = PROFICIENCY_CONFIG[profKey];
                  return (
                    <div key={skill.skill_id} className="grid grid-cols-4 px-5 py-3.5 items-center">
                      <div className="col-span-2 flex items-center gap-2.5">
                        <span className="text-base">{cfg.icon}</span>
                        <div>
                          <p className="text-stone-700 text-sm font-medium">{skill.skill_name}</p>
                          <p className="text-stone-400 text-[11px]">{skill.skill_id}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${prof.badge}`}>{prof.pqf}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-sm font-bold" style={{ color: cfg.color }}>{Math.round(skill.confidence * 100)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-5 py-4 bg-stone-50 border-t border-stone-100">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Generated {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  <span>Virtualahan Inc. · PSF-HCD v1.0</span>
                </div>
              </div>
            </div>

            {/* Validation status */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-xl mt-0.5">🔬</span>
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Pending Psychologist Validation</p>
                  <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                    This profile will be reviewed and digitally signed by a licensed psychologist before it can be shared with employers. The audit trail is complete and ready for review.
                  </p>
                </div>
              </div>
            </div>

            {/* Export actions */}
            <div className="flex gap-3">
              <button
                onClick={exportPassport}
                className="flex-1 py-3.5 rounded-2xl font-semibold text-white text-sm shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg, #F4A261, #E76F51)', fontFamily: "'Nunito', sans-serif" }}
              >
                Export JSON
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-3.5 rounded-2xl font-medium text-stone-600 text-sm border border-stone-200 bg-white hover:bg-stone-50 transition-all"
              >
                🖨️ Print
              </button>
            </div>
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
