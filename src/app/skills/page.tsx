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

const SKILL_CONFIG: Record<string, { icon: string; color: string; bgColor: string }> = {
  'Emotional Intelligence': { icon: '💛', color: '#E67E22', bgColor: '#FEF3E2' },
  'Communication': { icon: '💬', color: '#2E86C1', bgColor: '#EBF5FB' },
  'Collaboration': { icon: '🤝', color: '#27AE60', bgColor: '#E8F8F5' },
  'Problem-Solving': { icon: '🧩', color: '#8E44AD', bgColor: '#F4ECF7' },
  'Adaptability / Resilience': { icon: '🌊', color: '#1ABC9C', bgColor: '#E8F6F3' },
  'Learning Agility': { icon: '📚', color: '#E74C3C', bgColor: '#FDEDEC' },
  'Sense Making': { icon: '🔮', color: '#34495E', bgColor: '#EBEDEF' },
  'Building Inclusivity': { icon: '♿', color: '#16A085', bgColor: '#E8F6F3' },
};

const PROFICIENCY_CONFIG = {
  basic: { label: 'Basic', color: '#F39C12', width: '33%', level: 1 },
  intermediate: { label: 'Intermediate', color: '#2ECC71', width: '66%', level: 2 },
  advanced: { label: 'Advanced', color: '#3498DB', width: '100%', level: 3 },
};

// ============================================================
// COMPONENT
// ============================================================

export default function SkillsDashboard() {
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [showEvidence, setShowEvidence] = useState(false);

  // Load most recent extraction from localStorage or URL param
  useEffect(() => {
    // Check localStorage for last extraction
    const stored = localStorage.getItem('sis_last_extraction');
    if (stored) {
      try {
        setExtraction(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored extraction');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading your skills profile...</div>
      </div>
    );
  }

  if (!extraction) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-5xl mb-4">✨</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Skills Profile Yet</h1>
          <p className="text-gray-500 mb-6">Complete a conversation with Aya first to discover your superpowers.</p>
          <a href="/chat" className="px-6 py-2 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors">
            Talk to Aya →
          </a>
        </div>
      </div>
    );
  }

  const skills = extraction.skills_profile || [];
  const quality = extraction.session_quality;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your Superpowers</h1>
            <p className="text-sm text-gray-500">Skills discovered from your lived experience</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEvidence(!showEvidence)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                showEvidence ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {showEvidence ? '🔍 Evidence On' : '🔍 Show Evidence'}
            </button>
            <a href="/chat" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
              ← Back to Chat
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* Narrative Summary */}
        {extraction.narrative_summary && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 mb-2">YOUR STORY</h2>
            <p className="text-gray-800 leading-relaxed">{extraction.narrative_summary}</p>
          </div>
        )}

        {/* Overall Score */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500">SKILLS DISCOVERED</h2>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>{quality?.stories_completed || 0} stories shared</span>
              <span>•</span>
              <span>Evidence: {quality?.evidence_density || 'N/A'}</span>
              <span>•</span>
              <span>Confidence: {Math.round((quality?.overall_confidence || 0) * 100)}%</span>
            </div>
          </div>

          {/* Skills Grid */}
          <div className="space-y-4">
            {skills.map((skill) => {
              const config = SKILL_CONFIG[skill.skill_name] || { icon: '⭐', color: '#666', bgColor: '#f5f5f5' };
              const profKey = (skill.proficiency || 'basic').toLowerCase() as keyof typeof PROFICIENCY_CONFIG;
              const prof = PROFICIENCY_CONFIG[profKey] || PROFICIENCY_CONFIG.basic;
              const isExpanded = expandedSkill === skill.skill_id;

              return (
                <div key={skill.skill_id} className="rounded-lg border border-gray-100 overflow-hidden">
                  {/* Skill Header */}
                  <button
                    onClick={() => setExpandedSkill(isExpanded ? null : skill.skill_id)}
                    className="w-full p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                      style={{ backgroundColor: config.bgColor }}
                    >
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{skill.skill_name}</span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: config.bgColor, color: config.color }}
                        >
                          {prof.label}
                        </span>
                      </div>
                      {/* Proficiency Bar */}
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: prof.width, backgroundColor: config.color }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold" style={{ color: config.color }}>
                        {Math.round(skill.confidence * 100)}%
                      </div>
                      <div className="text-xs text-gray-400">confidence</div>
                    </div>
                    <span className="text-gray-300 text-sm">{isExpanded ? '▼' : '▶'}</span>
                  </button>

                  {/* Expanded Evidence */}
                  {(isExpanded || showEvidence) && skill.evidence?.length > 0 && (
                    <div className="px-4 pb-4 border-t border-gray-100">
                      <div className="pt-3 space-y-3">
                        {skill.evidence.map((ev, i) => (
                          <div key={i} className="pl-4 border-l-2" style={{ borderColor: config.color }}>
                            <p className="text-sm text-gray-700 italic mb-1">"{ev.transcript_quote}"</p>
                            <p className="text-xs text-gray-500">{ev.behavioral_indicator}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{ev.proficiency_justification}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {skills.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🔍</p>
              <p className="text-sm">No skills extracted yet. Complete a full conversation with Aya first.</p>
            </div>
          )}
        </div>

        {/* Layer 2 Seeds (What's Next) */}
        {extraction.layer2_seeds?.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">WHAT'S NEXT — SIMULATION SCENARIOS</h2>
            <p className="text-xs text-gray-400 mb-4">
              Based on your stories, here are scenarios that could help demonstrate more of your skills:
            </p>
            <div className="space-y-2">
              {extraction.layer2_seeds.map((seed, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <span className="text-purple-500 mt-0.5">🎯</span>
                  <div>
                    <p className="text-sm text-gray-800">{seed.scenario}</p>
                    <div className="flex gap-1 mt-1">
                      {seed.target_skills.map((sk, j) => (
                        <span key={j} className="text-xs bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gaming Flags (visible to reviewers only in production — shown in MVP for transparency) */}
        {extraction.gaming_flags?.length > 0 && (
          <div className="bg-white rounded-xl border border-orange-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-orange-500 mb-3">⚠️ AUTHENTICITY FLAGS (Reviewer View)</h2>
            <div className="space-y-2">
              {extraction.gaming_flags.map((flag, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className={`mt-0.5 ${flag.severity === 'high' ? 'text-red-500' : flag.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'}`}>
                    ●
                  </span>
                  <div>
                    <span className="font-medium text-gray-700">{flag.flag_type}:</span>
                    <span className="text-gray-500 ml-1">{flag.evidence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SKILL GAP VISUALIZATION */}
        {skills.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">SKILL GAPS — WHAT WASN'T EVIDENCED</h2>
            <p className="text-xs text-gray-400 mb-4">Skills that weren't demonstrated in your stories. These aren't weaknesses — you may simply not have had the chance to show them.</p>
            {(() => {
              const allSkills = ['Emotional Intelligence', 'Communication', 'Collaboration', 'Problem-Solving', 'Adaptability / Resilience', 'Learning Agility', 'Sense Making', 'Building Inclusivity'];
              const evidenced = skills.map(s => s.skill_name);
              const gaps = allSkills.filter(s => !evidenced.includes(s));
              if (gaps.length === 0) return <p className="text-sm text-green-600">🎉 All core skills were demonstrated! Great coverage.</p>;
              return (
                <div className="space-y-2">
                  {gaps.map((gap, i) => {
                    const cfg = SKILL_CONFIG[gap] || { icon: '⭐', color: '#999', bgColor: '#f5f5f5' };
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg opacity-40" style={{ backgroundColor: cfg.bgColor }}>{cfg.icon}</div>
                        <div className="flex-1">
                          <span className="text-sm text-gray-500">{gap}</span>
                          <p className="text-xs text-gray-400">Not yet evidenced — try sharing a story about this next time</p>
                        </div>
                        <div className="w-full max-w-[120px] bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full bg-gray-200" style={{ width: '0%' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* SKILLS PASSPORT EXPORT (JSON for Randy) */}
        {skills.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-500">SKILLS PASSPORT</h2>
              <button
                onClick={() => {
                  const passport = {
                    version: '1.0',
                    framework: 'PSF-HCD',
                    pqf_aligned: true,
                    generated_at: new Date().toISOString(),
                    candidate: { stories_completed: quality?.stories_completed, evidence_density: quality?.evidence_density, overall_confidence: quality?.overall_confidence },
                    skills: skills.map(s => ({
                      skill_id: s.skill_id, skill_name: s.skill_name,
                      proficiency: s.proficiency?.toLowerCase(),
                      pqf_level: s.proficiency?.toLowerCase() === 'basic' ? '1-2' : s.proficiency?.toLowerCase() === 'intermediate' ? '3-4' : '5-6',
                      confidence: s.confidence,
                      evidence_count: s.evidence?.length || 0,
                    })),
                    narrative: extraction.narrative_summary,
                    gaps: (() => {
                      const all = ['SK1','SK2','SK3','SK4','SK5','SK6','SK7','SK8'];
                      const found = skills.map(s => s.skill_id);
                      return all.filter(s => !found.includes(s));
                    })(),
                  };
                  const blob = new Blob([JSON.stringify(passport, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'skills-passport.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors"
              >
                📥 Export JSON
              </button>
            </div>
            <p className="text-xs text-gray-400">PQF-aligned, machine-readable skills passport. Compatible with Randy's HR Intelligence System.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <div key={i} className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <span className="font-medium">{s.skill_id}</span>
                  <span className="text-gray-400 mx-1">|</span>
                  <span>{s.skill_name}</span>
                  <span className="text-gray-400 mx-1">|</span>
                  <span className="font-medium" style={{ color: PROFICIENCY_CONFIG[s.proficiency?.toLowerCase() as keyof typeof PROFICIENCY_CONFIG]?.color || '#666' }}>
                    {s.proficiency}
                  </span>
                  <span className="text-gray-400 mx-1">|</span>
                  <span>PQF {s.proficiency?.toLowerCase() === 'basic' ? '1-2' : s.proficiency?.toLowerCase() === 'intermediate' ? '3-4' : '5-6'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Trail Note */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">
            Every skill claim is backed by a direct quote from your conversation.
            Click any skill to see the evidence. This audit trail can be reviewed by licensed psychologists.
          </p>
        </div>
      </div>
    </div>
  );
}
