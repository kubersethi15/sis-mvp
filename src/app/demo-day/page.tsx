'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// ============================================================
// SIS DEMO DIRECTOR — Friday Demo Guide
// Three lenses: Jobseeker · Employer · Psychologist
// One URL. Three acts. Zero confusion.
// ============================================================

type Lens = 'jobseeker' | 'employer' | 'psychologist';

interface Step {
  id: string;
  title: string;
  caption: string;       // what to SAY to the room
  action: string;        // what to DO on screen
  url?: string;
  urlLabel?: string;
  humanMoment?: boolean; // flag for human checkpoint steps
  wowMoment?: boolean;   // flag for the big reveal moments
  note?: string;         // presenter whisper note
}

// ============================================================
// DEMO SCRIPT
// ============================================================

const ACTS: Record<Lens, { label: string; persona: string; icon: string; color: string; tagline: string; steps: Step[] }> = {

  jobseeker: {
    label: 'Act I — The Jobseeker',
    persona: 'Maria Reyes, 34',
    icon: '🌱',
    color: '#2A9D8F',
    tagline: '"I never thought my experiences were worth anything on paper."',
    steps: [
      {
        id: 'j1',
        title: 'Maria finds a vacancy',
        caption: 'Maria is a caregiver, community leader, PWD advocate. No formal HR experience. She sees a Branch Staff vacancy at Cebuana Lhuillier.',
        action: 'Open the vacancy page. Show the Cebuana job description.',
        url: '/vacancy',
        urlLabel: 'Open Vacancy Browser →',
        note: 'Scroll to show the AI Q&A — Maria can ask "Am I qualified?" and get an honest answer.',
      },
      {
        id: 'j2',
        title: 'She talks to Aya',
        caption: 'No resume. No formal training. But Maria has stories. Aya asks her to share one — not about her job history, but about a real moment in her life.',
        action: 'Open the chat. Show the welcome screen. Click "Magsimula sa Taglish" to show the language option.',
        url: '/chat',
        urlLabel: 'Open Aya Chat →',
        wowMoment: true,
        note: 'Let Aya send the first message. Point out: no skill names mentioned, no test framing. Just: "Tell me your story."',
      },
      {
        id: 'j3',
        title: 'Her story surfaces skills',
        caption: 'Maria tells a story about organising a barangay evacuation. She didn\'t call it leadership. Aya found it.',
        action: 'Show the story arc bar advancing as the conversation deepens. Point out the stage labels — "Exploring What Happened", "Going Deeper".',
        note: 'Watch the skill sparkles appear mid-conversation. These are real-time signals — the system is already reading while she talks.',
      },
      {
        id: 'j4',
        title: 'Her superpowers are revealed',
        caption: 'After the session ends — the system analyses everything she shared. Then this happens.',
        action: 'Click "Discover My Superpowers". Wait for the cinematic reveal.',
        wowMoment: true,
        note: 'Let the animation play in full. Don\'t narrate over it. The room will feel it.',
      },
      {
        id: 'j5',
        title: 'Her Skills Passport',
        caption: 'Every skill is backed by a direct quote from Maria\'s own words. Not inferred. Not guessed. Evidenced.',
        action: 'Navigate to the full skills profile. Click on one skill to expand the evidence. Show the quote.',
        url: '/skills',
        urlLabel: 'Open Skills Profile →',
        note: 'Click the Export JSON button. Say: "This is Maria\'s Skills Passport — PQF-aligned, machine-readable, portable. Randy\'s system picks this up."',
      },
    ],
  },

  employer: {
    label: 'Act II — The Employer',
    persona: 'Cebuana Lhuillier HR',
    icon: '🏢',
    color: '#E76F51',
    tagline: '"We need people who stay calm under pressure and treat customers with dignity."',
    steps: [
      {
        id: 'e1',
        title: 'The vacancy is live',
        caption: 'Cebuana\'s HR team posted the Branch Staff role. The system parsed the JD and built a competency blueprint automatically.',
        action: 'Open the employer dashboard. Show the Cebuana vacancy with its competency blueprint.',
        url: '/employer-dashboard',
        urlLabel: 'Open Employer Dashboard →',
        note: 'Point to the AI-generated requirements: "Emotional resilience under financial stress. Customer empathy. Reliability." These came from the JD, not manual entry.',
      },
      {
        id: 'e2',
        title: 'Maria applies — Gate 1',
        caption: 'Maria applies. The system immediately runs Gate 1: alignment. Does her skills profile match what Cebuana needs?',
        action: 'Switch to the Reviewer dashboard. Find Maria\'s application. Show her Gate 1 alignment score.',
        url: '/reviewer',
        urlLabel: 'Open Reviewer Dashboard →',
        note: 'Point out the competency fit map — green/amber/red per skill. The AI isn\'t making the decision. It\'s giving the recruiter a structured starting point.',
      },
      {
        id: 'e3',
        title: 'The human checkpoint — Gate 1',
        caption: 'The recruiter looks at the alignment report. The AI recommends: Proceed to Gate 2. But this is not automatic.',
        action: 'Show the decision panel. Point to the "Recruiter Decision" section. The options: Proceed / Hold / Reroute / Stop.',
        humanMoment: true,
        note: 'This is the first human checkpoint. Say: "The AI never makes the final call. Every gate requires a human to look at the evidence and decide. SIS is a decision-support tool, not a decision-making tool."',
      },
      {
        id: 'e4',
        title: 'Gate 2 — Evidence review',
        caption: 'The recruiter proceeds Maria to Gate 2. Now the Hiring Manager reviews the full skills evidence from her LEEE session.',
        action: 'Click into the Gate 2 tab. Show Maria\'s skills profile, evidence quotes, confidence scores, and gaming flags.',
        note: 'Open one skill card. Read the quote aloud. Say: "This is a real sentence Maria said. The system mapped it to this skill. The hiring manager can agree, query, or flag it."',
      },
      {
        id: 'e5',
        title: 'The human checkpoint — Gate 2',
        caption: 'The Hiring Manager reviews the evidence. The AI recommendation is here. But again — the human decides.',
        action: 'Show the Gate 2 decision panel. Point to the AI recommendation text and the HM decision field side by side.',
        humanMoment: true,
        wowMoment: true,
        note: 'Say: "Notice the AI gives a recommendation AND a rationale. The HM can accept it, override it, or ask for more evidence. The audit trail records both the AI recommendation and the human decision — separately."',
      },
      {
        id: 'e6',
        title: 'Gate 3 — Readiness index',
        caption: 'Maria reaches Gate 3. The system generates a readiness index — probability of success in this specific role, with support conditions.',
        action: 'Show the Gate 3 tab. Point to the readiness index score and the success conditions list.',
        note: 'Emphasise the support conditions: "These aren\'t weaknesses. They\'re onboarding signals. The system is telling the manager what Maria will need to thrive in the first 90 days."',
      },
      {
        id: 'e7',
        title: 'The final decision',
        caption: 'The Final Approver sees everything — all three gates, all AI recommendations, all human checkpoints. They make the call.',
        action: 'Show the full application view with all three gates summarised. Point to the final decision panel.',
        humanMoment: true,
        note: 'Say: "Three humans touched this decision. Three AI recommendations. Full audit trail. If anyone asks why Maria was selected — or not selected — every step is documented."',
      },
    ],
  },

  psychologist: {
    label: 'Act III — The Psychologist',
    persona: 'Licensed Psychologist',
    icon: '🔬',
    color: '#264653',
    tagline: '"Before I sign my name to anything, I need to see the evidence."',
    steps: [
      {
        id: 'p1',
        title: 'Why a psychologist at all?',
        caption: 'SIS doesn\'t just claim Maria has skills. It invites a licensed psychologist to review the evidence and formally endorse the profile. This is what makes the Skills Passport credible.',
        action: 'Open the psychologist validation page.',
        url: '/psychologist',
        urlLabel: 'Open Psychologist View →',
        note: 'Frame it: "This is the accountability layer. The AI system, Ryan\'s conversation design, and a licensed professional all touch every credential. That\'s what makes it defensible to TESDA and CHED."',
      },
      {
        id: 'p2',
        title: 'The audit trail',
        caption: 'The psychologist sees the full chain: Maria\'s exact words → the behavioral indicator extracted → the skill claimed → the proficiency level assigned → the confidence score. Every link is traceable.',
        action: 'Expand one skill. Show the evidence chain: quote → STAR+E+R breakdown → skill mapping → proficiency justification.',
        wowMoment: true,
        note: 'Say: "A psychologist reviewing this doesn\'t have to trust the AI. They can read Maria\'s actual words and judge for themselves whether the evidence supports the claim."',
      },
      {
        id: 'p3',
        title: 'Gaming flags are visible',
        caption: 'If the system detected anything suspicious — rehearsed language, inconsistencies, vague stories — the psychologist sees those flags too.',
        action: 'Scroll to the Authenticity Flags section. Show what a flag looks like (or explain what it would show).',
        note: 'If no flags: "No flags means the system found the stories specific, consistent, and spontaneous. That\'s a good signal." If flags present: show them as a feature, not a bug.',
      },
      {
        id: 'p4',
        title: 'The methodology is transparent',
        caption: 'The psychologist doesn\'t just see the output. They see the method: PSF framework, STAR+E+R model, PQF alignment, WEF skills taxonomy, Moth storytelling research.',
        action: 'Scroll to the Methodology References section. Show the citations.',
        note: 'Say: "Every methodological choice is documented and linked to a published source. This isn\'t a black box. It\'s a peer-reviewable instrument."',
      },
      {
        id: 'p5',
        title: 'Sign-off and endorsement',
        caption: 'The psychologist reviews the profile, agrees with the evidence, enters their license number, and signs. Maria\'s Skills Passport is now formally endorsed.',
        action: 'Show the validation sign-off section. Point to the license number field and the endorsement button.',
        humanMoment: true,
        wowMoment: true,
        note: 'Say: "This is the final human checkpoint. A licensed professional, not an algorithm, is putting their name on Maria\'s credential. That\'s what makes it portable, trustworthy, and PQF-ready."',
      },
      {
        id: 'p6',
        title: 'The full picture',
        caption: 'Maria told stories. The system extracted evidence. Three human professionals reviewed it. A psychologist signed it. Now Cebuana has something they can genuinely trust.',
        action: 'Pause. Let that land. Then summarise the full journey in one sentence.',
        note: 'Closing line: "SIS doesn\'t replace human judgement. It makes human judgement better — faster, fairer, and fully documented."',
      },
    ],
  },
};

// ============================================================
// COMPONENT
// ============================================================

export default function DemoDay() {
  const [activeLens, setActiveLens] = useState<Lens>('jobseeker');
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [presenterMode, setPresenterMode] = useState(false);

  const act = ACTS[activeLens];
  const step = act.steps[activeStep];
  const totalSteps = act.steps.length;

  const markDone = () => {
    setCompletedSteps(prev => new Set([...Array.from(prev), step.id]));
    if (activeStep < totalSteps - 1) setActiveStep(s => s + 1);
  };

  const goTo = (lens: Lens, stepIdx: number) => {
    setActiveLens(lens);
    setActiveStep(stepIdx);
  };

  const lensKeys: Lens[] = ['jobseeker', 'employer', 'psychologist'];

  return (
    <div
      className="min-h-screen"
      style={{
        background: '#0a0a0f',
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}
    >
      {/* ── TOP BAR ── */}
      <header style={{ borderBottom: '1px solid #1e1e2e', background: '#0d0d18' }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
              style={{ background: 'linear-gradient(135deg, #F4A261, #E76F51)' }}>
              🦋
            </div>
            <div>
              <span className="text-white font-semibold text-sm tracking-wide">Skills Intelligence System</span>
              <span className="text-xs ml-3 px-2 py-0.5 rounded" style={{ background: '#1e1e2e', color: '#F4A261' }}>
                Demo Director — Friday Session
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPresenterMode(p => !p)}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: presenterMode ? '#F4A261' : '#1e1e2e',
                color: presenterMode ? '#0a0a0f' : '#888',
                border: '1px solid #2e2e3e',
              }}
            >
              {presenterMode ? '🎭 Presenter Mode ON' : '🎭 Presenter Mode'}
            </button>
            <Link href="/" className="text-xs text-stone-600 hover:text-stone-400 transition-colors">
              ← Back to App
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">

        {/* ── ACT SWITCHER ── */}
        <div className="flex gap-3 mb-8">
          {lensKeys.map(lens => {
            const a = ACTS[lens];
            const isActive = activeLens === lens;
            const doneCount = a.steps.filter(s => completedSteps.has(s.id)).length;
            return (
              <button
                key={lens}
                onClick={() => { setActiveLens(lens); setActiveStep(0); }}
                className="flex-1 text-left p-4 rounded-2xl transition-all border"
                style={{
                  background: isActive ? `${a.color}18` : '#111118',
                  borderColor: isActive ? a.color : '#1e1e2e',
                  transform: isActive ? 'translateY(-2px)' : 'none',
                  boxShadow: isActive ? `0 8px 32px ${a.color}22` : 'none',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{a.icon}</span>
                  {doneCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${a.color}22`, color: a.color }}>
                      {doneCount}/{a.steps.length}
                    </span>
                  )}
                </div>
                <div className="text-xs font-semibold mb-0.5" style={{ color: isActive ? a.color : '#555', fontFamily: 'system-ui, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {a.label}
                </div>
                <div className="text-xs" style={{ color: '#444', fontFamily: 'system-ui, sans-serif' }}>
                  {a.persona}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── PERSONA TAGLINE ── */}
        <div className="mb-6 px-1">
          <p className="text-lg italic" style={{ color: '#555', fontFamily: "'Georgia', serif" }}>
            {act.tagline}
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">

          {/* ── STEP LIST (left) ── */}
          <div className="col-span-4">
            <div className="text-xs font-semibold mb-3 tracking-widest uppercase" style={{ color: '#333', fontFamily: 'system-ui, sans-serif' }}>
              Steps
            </div>
            <div className="space-y-1.5">
              {act.steps.map((s, i) => {
                const isActive = i === activeStep;
                const isDone = completedSteps.has(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStep(i)}
                    className="w-full text-left px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: isActive ? `${act.color}18` : isDone ? '#111118' : '#0d0d18',
                      borderLeft: `3px solid ${isActive ? act.color : isDone ? '#222' : 'transparent'}`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xs mt-0.5 flex-none w-5 text-center"
                        style={{ color: isDone ? '#2A9D8F' : isActive ? act.color : '#333', fontFamily: 'system-ui, sans-serif' }}>
                        {isDone ? '✓' : i + 1}
                      </span>
                      <div>
                        <div className="text-xs font-medium leading-snug" style={{ color: isActive ? '#e8e8e8' : isDone ? '#444' : '#555', fontFamily: 'system-ui, sans-serif' }}>
                          {s.title}
                        </div>
                        {s.humanMoment && (
                          <span className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded" style={{ background: '#3d1a00', color: '#F4A261', fontFamily: 'system-ui, sans-serif' }}>
                            👤 Human checkpoint
                          </span>
                        )}
                        {s.wowMoment && (
                          <span className="text-[10px] mt-1 inline-block px-1.5 py-0.5 rounded ml-1" style={{ background: '#1a2d1a', color: '#52c77f', fontFamily: 'system-ui, sans-serif' }}>
                            ✨ Wow moment
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Progress */}
            <div className="mt-6 px-1">
              <div className="flex justify-between text-xs mb-1.5" style={{ color: '#333', fontFamily: 'system-ui, sans-serif' }}>
                <span>Act progress</span>
                <span>{act.steps.filter(s => completedSteps.has(s.id)).length} / {act.steps.length}</span>
              </div>
              <div className="h-1 rounded-full" style={{ background: '#1e1e2e' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(act.steps.filter(s => completedSteps.has(s.id)).length / act.steps.length) * 100}%`,
                    background: act.color,
                  }} />
              </div>
            </div>
          </div>

          {/* ── MAIN STAGE (right) ── */}
          <div className="col-span-8">

            {/* Step header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs mb-1 font-semibold tracking-widest uppercase" style={{ color: act.color, fontFamily: 'system-ui, sans-serif' }}>
                  Step {activeStep + 1} of {totalSteps}
                  {step.humanMoment && <span className="ml-3 normal-case tracking-normal font-normal px-2 py-0.5 rounded" style={{ background: '#3d1a00', color: '#F4A261' }}>👤 Human checkpoint</span>}
                  {step.wowMoment && <span className="ml-2 normal-case tracking-normal font-normal px-2 py-0.5 rounded" style={{ background: '#1a2d1a', color: '#52c77f' }}>✨ Wow moment</span>}
                </div>
                <h2 className="text-2xl font-bold" style={{ color: '#e8e8e8', fontFamily: "'Georgia', serif" }}>
                  {step.title}
                </h2>
              </div>
              {completedSteps.has(step.id) && (
                <span className="text-sm px-3 py-1 rounded-full" style={{ background: '#1a2d1a', color: '#52c77f', fontFamily: 'system-ui, sans-serif' }}>✓ Done</span>
              )}
            </div>

            {/* Caption — what to SAY */}
            <div className="rounded-2xl p-5 mb-4" style={{ background: '#0d0d18', border: '1px solid #1e1e2e' }}>
              <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#333', fontFamily: 'system-ui, sans-serif' }}>
                🎙 Say to the room
              </div>
              <p className="text-base leading-relaxed" style={{ color: '#c8c8d8', fontFamily: "'Georgia', serif", fontSize: '1.05rem' }}>
                {step.caption}
              </p>
            </div>

            {/* Action — what to DO */}
            <div className="rounded-2xl p-5 mb-4" style={{ background: '#0d1a0d', border: '1px solid #1e2e1e' }}>
              <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#2A9D8F', fontFamily: 'system-ui, sans-serif' }}>
                🖥 Do on screen
              </div>
              <p className="text-sm leading-relaxed" style={{ color: '#88b888', fontFamily: 'system-ui, sans-serif' }}>
                {step.action}
              </p>
              {step.url && (
                <a
                  href={step.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.02]"
                  style={{ background: act.color, color: '#fff', fontFamily: 'system-ui, sans-serif', textDecoration: 'none' }}
                >
                  {step.urlLabel}
                </a>
              )}
            </div>

            {/* Presenter note — only in presenter mode */}
            {presenterMode && step.note && (
              <div className="rounded-2xl p-5 mb-4" style={{ background: '#1a1400', border: '1px solid #2e2500' }}>
                <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: '#F4A261', fontFamily: 'system-ui, sans-serif' }}>
                  🤫 Presenter whisper
                </div>
                <p className="text-sm leading-relaxed italic" style={{ color: '#a88040', fontFamily: 'system-ui, sans-serif' }}>
                  {step.note}
                </p>
              </div>
            )}

            {/* Human checkpoint callout */}
            {step.humanMoment && (
              <div className="rounded-2xl p-5 mb-4" style={{ background: '#1a0d00', border: '1px solid #3d2000' }}>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <div className="text-sm font-bold mb-1" style={{ color: '#F4A261', fontFamily: 'system-ui, sans-serif' }}>Human Checkpoint</div>
                    <p className="text-xs leading-relaxed" style={{ color: '#a87040', fontFamily: 'system-ui, sans-serif' }}>
                      This is a deliberate pause point. The AI has done its work. Now a human reviews, questions, and decides.
                      SIS is a <em>decision-support system</em> — not a decision-making system.
                      Every gate requires a human to look at the evidence and sign off.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setActiveStep(s => Math.max(0, s - 1))}
                disabled={activeStep === 0}
                className="px-5 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: '#1e1e2e', color: activeStep === 0 ? '#333' : '#888', fontFamily: 'system-ui, sans-serif', border: '1px solid #2e2e3e' }}
              >
                ← Prev
              </button>

              <button
                onClick={markDone}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01]"
                style={{
                  background: completedSteps.has(step.id) ? '#1e2e1e' : act.color,
                  color: completedSteps.has(step.id) ? '#52c77f' : '#fff',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                {completedSteps.has(step.id)
                  ? '✓ Done — click again to advance'
                  : activeStep === totalSteps - 1
                    ? '✓ Complete this act'
                    : 'Mark done & next →'}
              </button>

              <button
                onClick={() => setActiveStep(s => Math.min(totalSteps - 1, s + 1))}
                disabled={activeStep === totalSteps - 1}
                className="px-5 py-2.5 rounded-xl text-sm transition-all"
                style={{ background: '#1e1e2e', color: activeStep === totalSteps - 1 ? '#333' : '#888', fontFamily: 'system-ui, sans-serif', border: '1px solid #2e2e3e' }}
              >
                Skip →
              </button>
            </div>
          </div>
        </div>

        {/* ── QUICK JUMP ── */}
        <div className="mt-12 pt-8" style={{ borderTop: '1px solid #1e1e2e' }}>
          <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#333', fontFamily: 'system-ui, sans-serif' }}>
            Quick jump — all pages
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { href: '/chat', label: 'Aya Chat', icon: '💬', note: 'Jobseeker' },
              { href: '/skills', label: 'Skills Profile', icon: '✨', note: 'Jobseeker' },
              { href: '/vacancy', label: 'Vacancy Browser', icon: '📋', note: 'Jobseeker' },
              { href: '/my-dashboard', label: 'My Dashboard', icon: '👤', note: 'Jobseeker' },
              { href: '/employer-dashboard', label: 'Employer Dashboard', icon: '🏢', note: 'Employer' },
              { href: '/reviewer', label: 'Reviewer Dashboard', icon: '📊', note: 'Employer' },
              { href: '/psychologist', label: 'Psychologist View', icon: '🔬', note: 'Psychologist' },
              { href: '/demo', label: 'Tech Demo Runner', icon: '⚡', note: 'Internal' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 p-3 rounded-xl transition-all hover:scale-[1.02]"
                style={{ background: '#0d0d18', border: '1px solid #1e1e2e', textDecoration: 'none' }}
              >
                <span className="text-base flex-none mt-0.5">{link.icon}</span>
                <div>
                  <div className="text-xs font-medium" style={{ color: '#888', fontFamily: 'system-ui, sans-serif' }}>{link.label}</div>
                  <div className="text-[10px]" style={{ color: '#333', fontFamily: 'system-ui, sans-serif' }}>{link.note}</div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── DEMO DAY CHECKLIST ── */}
        <div className="mt-8 p-6 rounded-2xl" style={{ background: '#0d0d18', border: '1px solid #1e1e2e' }}>
          <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#333', fontFamily: 'system-ui, sans-serif' }}>
            Before Friday — checklist
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs" style={{ fontFamily: 'system-ui, sans-serif' }}>
            {[
              { item: 'Run a full session with Aya (English)', done: false },
              { item: 'Run a full session with Aya (Taglish)', done: false },
              { item: 'Confirm extraction produces 4+ skills', done: false },
              { item: 'Confirm SuperpowersReveal plays on mobile', done: false },
              { item: 'Seed demo data (Cebuana vacancy + Maria profile)', done: false },
              { item: 'Walk all 3 acts end-to-end without notes', done: false },
              { item: 'Deploy to Vercel with live URL', done: false },
              { item: 'Brief Ryan on human checkpoint framing', done: false },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 px-3 rounded-lg" style={{ background: '#111118' }}>
                <span style={{ color: c.done ? '#52c77f' : '#2e2e3e' }}>{c.done ? '✓' : '○'}</span>
                <span style={{ color: c.done ? '#52c77f' : '#555' }}>{c.item}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
