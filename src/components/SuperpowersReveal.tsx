'use client';

import { useState, useEffect, useRef } from 'react';

// ============================================================
// TYPES
// ============================================================

interface SkillScore {
  skill_id: string;
  skill_name: string;
  proficiency: string;
  confidence: number;
  evidence?: Array<{ transcript_quote: string }>;
}

interface Extraction {
  skills_profile: SkillScore[];
  narrative_summary: string;
  session_quality?: {
    stories_completed: number;
    overall_confidence: number;
  };
}

interface SuperpowersRevealProps {
  extraction: Extraction;
  onDismiss: () => void;
}

// ============================================================
// CONFIG
// ============================================================

const SKILL_CONFIG: Record<string, { icon: string; gradient: string; ring: string }> = {
  'Emotional Intelligence':      { icon: '💛', gradient: 'from-amber-400 to-orange-400',    ring: 'ring-amber-300' },
  'Communication':               { icon: '💬', gradient: 'from-sky-400 to-blue-500',         ring: 'ring-sky-300' },
  'Collaboration':               { icon: '🤝', gradient: 'from-emerald-400 to-teal-500',     ring: 'ring-emerald-300' },
  'Problem-Solving':             { icon: '🧩', gradient: 'from-violet-400 to-purple-500',    ring: 'ring-violet-300' },
  'Adaptability / Resilience':   { icon: '🌊', gradient: 'from-cyan-400 to-teal-400',        ring: 'ring-cyan-300' },
  'Learning Agility':            { icon: '📚', gradient: 'from-rose-400 to-pink-500',        ring: 'ring-rose-300' },
  'Sense Making':                { icon: '🔮', gradient: 'from-indigo-400 to-violet-500',    ring: 'ring-indigo-300' },
  'Building Inclusivity':        { icon: '♿', gradient: 'from-green-400 to-emerald-500',    ring: 'ring-green-300' },
};

const PROFICIENCY_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  basic:        { label: 'Emerging',    bg: 'bg-amber-100',  text: 'text-amber-700' },
  intermediate: { label: 'Developing',  bg: 'bg-sky-100',    text: 'text-sky-700' },
  advanced:     { label: 'Proficient',  bg: 'bg-emerald-100',text: 'text-emerald-700' },
};

// Confetti particle colors
const PARTICLE_COLORS = ['#F4A261', '#2A9D8F', '#E76F51', '#264653', '#E9C46A', '#A8DADC', '#457B9D', '#F1FAEE'];

// ============================================================
// CONFETTI PARTICLE
// ============================================================

function Confetti({ active }: { active: boolean }) {
  const particles = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.2,
    dur: 1.8 + Math.random() * 1.2,
    size: 4 + Math.random() * 6,
    color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
    rotate: Math.random() * 360,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
  }));

  if (!active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: '-20px',
            width: p.size,
            height: p.size,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            backgroundColor: p.color,
            animation: `confettiFall ${p.dur}s ease-in ${p.delay}s both`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SuperpowersReveal({ extraction, onDismiss }: SuperpowersRevealProps) {
  const [phase, setPhase] = useState<'loading' | 'burst' | 'reveal' | 'done'>('loading');
  const [revealedCount, setRevealedCount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<SkillScore | null>(null);

  const skills = extraction.skills_profile || [];
  const totalSkills = skills.length;

  // Phase timeline
  useEffect(() => {
    // Loading → Burst
    const t1 = setTimeout(() => {
      setPhase('burst');
      setShowConfetti(true);
    }, 800);

    // Burst → Reveal
    const t2 = setTimeout(() => {
      setPhase('reveal');
    }, 1800);

    // Stagger skill reveals
    skills.forEach((_, i) => {
      setTimeout(() => setRevealedCount(i + 1), 1900 + i * 320);
    });

    // Done
    const t3 = setTimeout(() => setPhase('done'), 1900 + totalSkills * 320 + 400);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const quality = extraction.session_quality;
  const overallConfidence = quality?.overall_confidence
    ? Math.round(quality.overall_confidence * 100)
    : skills.length > 0 ? Math.round((skills.reduce((a, s) => a + s.confidence, 0) / skills.length) * 100) : 0;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-y-auto"
      style={{ background: 'linear-gradient(160deg, #0F0C29, #302B63, #24243e)' }}
    >
      <Confetti active={showConfetti} />

      {/* ── LOADING PHASE ── */}
      {phase === 'loading' && (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center text-5xl shadow-2xl"
              style={{ animation: 'breathePulse 1.2s ease-in-out infinite' }}
            >
              🦋
            </div>
            <div
              className="absolute -inset-4 rounded-3xl opacity-30"
              style={{ background: 'radial-gradient(circle, rgba(244,162,97,0.6) 0%, transparent 70%)', animation: 'breathePulse 1.2s ease-in-out infinite' }}
            />
          </div>
          <p className="text-white/70 text-sm tracking-widest uppercase" style={{ animation: 'fadeInUp 0.6s ease-out' }}>
            Uncovering your story…
          </p>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-amber-400"
                style={{ animation: `dotPulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── BURST PHASE ── */}
      {phase === 'burst' && (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
          <div
            className="text-8xl"
            style={{ animation: 'burstIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
          >

          </div>
          <h1
            className="text-3xl font-bold text-white text-center px-8"
            style={{ fontFamily: "'Nunito', sans-serif", animation: 'burstIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both' }}
          >
            Your Superpowers Are Revealed!
          </h1>
        </div>
      )}

      {/* ── REVEAL PHASE ── */}
      {(phase === 'reveal' || phase === 'done') && (
        <div className="w-full max-w-lg mx-auto px-4 pt-10 pb-24">

          {/* Header */}
          <div className="text-center mb-8" style={{ animation: 'fadeInUp 0.6s ease-out both' }}>
            <div className="text-2xl mb-3 font-bold" style={{ color: "#48BB78", fontFamily: "Georgia, serif", animation: "breathe 4s ease-in-out infinite" }}>kaya</div>
            <h1
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              Your Superpowers
            </h1>
            {extraction.narrative_summary && (
              <p className="text-white/60 text-sm leading-relaxed max-w-sm mx-auto"
                style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {extraction.narrative_summary}
              </p>
            )}

            {/* Stats row */}
            <div className="flex justify-center gap-6 mt-5">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">{totalSkills}</div>
                <div className="text-white/50 text-xs mt-0.5">Skills Found</div>
              </div>
              <div className="w-px bg-white/10" />
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">{overallConfidence}%</div>
                <div className="text-white/50 text-xs mt-0.5">Confidence</div>
              </div>
              {quality?.stories_completed && (
                <>
                  <div className="w-px bg-white/10" />
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">{quality.stories_completed}</div>
                    <div className="text-white/50 text-xs mt-0.5">Stories Shared</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Skill Cards — staggered reveal */}
          <div className="space-y-3">
            {skills.map((skill, i) => {
              const cfg = SKILL_CONFIG[skill.skill_name] || {
                icon: '⭐', gradient: 'from-amber-400 to-orange-400', ring: 'ring-amber-300',
              };
              const profLower = skill.proficiency?.toLowerCase() as keyof typeof PROFICIENCY_BADGE;
              const badge = PROFICIENCY_BADGE[profLower] || PROFICIENCY_BADGE.basic;
              const visible = i < revealedCount;
              const isSelected = selectedSkill?.skill_id === skill.skill_id;

              return (
                <div
                  key={skill.skill_id}
                  className="transition-all duration-700 cursor-pointer"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
                    transitionDelay: `${i * 60}ms`,
                  }}
                  onClick={() => setSelectedSkill(isSelected ? null : skill)}
                >
                  <div className={`rounded-2xl p-4 border transition-all duration-300 ${
                    isSelected
                      ? 'bg-white/15 border-white/30 shadow-lg shadow-amber-500/10'
                      : 'bg-white/8 border-white/10 hover:bg-white/12 hover:border-white/20'
                  }`}>
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className={`w-13 h-13 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-2xl shadow-lg flex-none`}
                        style={{ width: 52, height: 52 }}>
                        {cfg.icon}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-semibold text-white text-sm truncate">{skill.skill_name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-none ${badge.bg} ${badge.text}`}>
                            {badge.label}
                          </span>
                        </div>
                        {/* Confidence bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${cfg.gradient} transition-all duration-1000 ease-out`}
                              style={{
                                width: visible ? `${skill.confidence * 100}%` : '0%',
                                transitionDelay: `${i * 60 + 300}ms`,
                              }}
                            />
                          </div>
                          <span className="text-white/60 text-xs font-mono flex-none">
                            {Math.round(skill.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Evidence — expanded on tap */}
                    {isSelected && skill.evidence && skill.evidence.length > 0 && (
                      <div
                        className="mt-4 pt-4 border-t border-white/10 space-y-3"
                        style={{ animation: 'fadeInUp 0.3s ease-out' }}
                      >
                        <p className="text-white/50 text-[11px] uppercase tracking-wider mb-2">Evidence from your story</p>
                        {skill.evidence.slice(0, 2).map((ev, j) => (
                          <div key={j} className="pl-3 border-l border-white/20">
                            <p className="text-white/70 text-xs italic leading-relaxed">"{ev.transcript_quote}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA — appears after all skills revealed */}
          {phase === 'done' && (
            <div
              className="mt-8 space-y-3"
              style={{ animation: 'fadeInUp 0.6s ease-out both' }}
            >
              <a
                href="/skills"
                className="block w-full text-center py-4 rounded-2xl font-bold text-white shadow-2xl shadow-amber-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] text-[15px]"
                style={{
                  background: 'linear-gradient(135deg, #F4A261 0%, #E76F51 50%, #E9C46A 100%)',
                  fontFamily: "'Nunito', sans-serif",
                }}
              >
                View Full Skills Profile →
              </a>

              <button
                onClick={onDismiss}
                className="block w-full text-center py-3 rounded-2xl text-white/50 text-sm hover:text-white/80 transition-colors"
              >
                Back to conversation
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── DETAIL MODAL for tapped skill (mobile-friendly) ── */}
      {selectedSkill && (
        <div
          className="fixed bottom-0 left-0 right-0 z-60 bg-[#1a1730] border-t border-white/10 rounded-t-3xl p-6 max-h-[50vh] overflow-y-auto"
          style={{ animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          <div className="w-8 h-1 bg-white/20 rounded-full mx-auto mb-4" />
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{SKILL_CONFIG[selectedSkill.skill_name]?.icon || '⭐'}</span>
            <div>
              <h3 className="text-white font-bold">{selectedSkill.skill_name}</h3>
              <p className="text-white/50 text-xs">{selectedSkill.proficiency} level · {Math.round(selectedSkill.confidence * 100)}% confidence</p>
            </div>
          </div>
          {selectedSkill.evidence?.map((ev, i) => (
            <div key={i} className="mb-3 pl-3 border-l-2 border-amber-400/50">
              <p className="text-white/70 text-sm italic leading-relaxed">"{ev.transcript_quote}"</p>
            </div>
          ))}
          <button
            onClick={() => setSelectedSkill(null)}
            className="mt-2 text-white/40 text-xs hover:text-white/70 transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* ── ANIMATIONS ── */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes breathePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes burstIn {
          from { opacity: 0; transform: scale(0.3) rotate(-10deg); }
          to { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}} />
    </div>
  );
}
