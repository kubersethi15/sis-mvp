'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import SuperpowersReveal from './SuperpowersReveal';
import ScenarioCard from './ScenarioCard';

// Auth helper — gets Supabase JWT for API calls
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {}
  return headers;
}

// ============================================================
// TYPES
// ============================================================

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  stage?: string;
  timestamp: Date;
  skillSparkle?: string; // skill discovered mid-conversation
}

interface SessionState {
  sessionId: string | null;
  status: 'idle' | 'active' | 'completed';
  stage: string;
  storiesCompleted: number;
  skillsEvidenced: Record<string, boolean> | null;
}

// ============================================================
// STAGE CONFIG — Story Arc Visualization
// ============================================================

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: string; progress: number; description: string; bg: string; orb1: string; orb2: string }> = {
  opening:     { label: 'Getting to Know You',     color: '#94a3b8', icon: '🌅', progress: 5,  description: 'Just getting started',    bg: 'linear-gradient(160deg, #0f172a 0%, #1e293b 50%, #0f2027 100%)',     orb1: 'rgba(148,163,184,0.12)', orb2: 'rgba(100,116,139,0.08)' },
  story_select:{ label: 'Finding Your Story',      color: '#F4A261', icon: '🌿', progress: 18, description: 'Something real coming up',  bg: 'linear-gradient(160deg, #1a0e05 0%, #2d1a0a 50%, #0f1a14 100%)',     orb1: 'rgba(244,162,97,0.15)',  orb2: 'rgba(42,157,143,0.08)' },
  elicitation: { label: 'Setting the Scene',       color: '#E9C46A', icon: '🦋', progress: 32, description: 'Tell me what happened',     bg: 'linear-gradient(160deg, #1a1205 0%, #2d2010 50%, #0a1a14 100%)',     orb1: 'rgba(233,196,106,0.18)', orb2: 'rgba(42,157,143,0.12)' },
  core_probe:  { label: 'The Heart of It',         color: '#2A9D8F', icon: '🔮', progress: 52, description: 'Going deeper now',          bg: 'linear-gradient(160deg, #051a18 0%, #0a2d28 50%, #051520 100%)',     orb1: 'rgba(42,157,143,0.22)',  orb2: 'rgba(244,162,97,0.12)' },
  skill_probe: { label: 'What It Revealed',        color: '#f59e0b', icon: '💎', progress: 68, description: 'The really good part',      bg: 'linear-gradient(160deg, #1a1005 0%, #2d1f00 50%, #0a1a0a 100%)',     orb1: 'rgba(245,158,11,0.22)',  orb2: 'rgba(42,157,143,0.15)' },
  verification:{ label: 'Bringing It Together',    color: '#f97316', icon: '', progress: 82, description: 'Almost there',              bg: 'linear-gradient(160deg, #1a0d05 0%, #2d1508 50%, #0a1510 100%)',     orb1: 'rgba(249,115,22,0.22)',  orb2: 'rgba(244,162,97,0.18)' },
  micro_story: { label: 'One More Story',          color: '#F4A261', icon: '', progress: 90, description: 'Quick one more',            bg: 'linear-gradient(160deg, #1a0e05 0%, #2d1a0a 50%, #0f1a14 100%)',     orb1: 'rgba(244,162,97,0.20)',  orb2: 'rgba(42,157,143,0.12)' },
  closing:     { label: 'Journey Complete',        color: '#2A9D8F', icon: '', progress: 100,'description': 'You did it',              bg: 'linear-gradient(160deg, #051a18 0%, #0a2518 50%, #0a1520 100%)',     orb1: 'rgba(42,157,143,0.25)',  orb2: 'rgba(244,162,97,0.15)' },
};

// ============================================================
// SKILL CONFIG
// ============================================================

const SKILL_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  EQ: { label: 'Emotional Intelligence', icon: '💛', color: '#F4A261' },
  COMM: { label: 'Communication', icon: '💬', color: '#2A9D8F' },
  COLLAB: { label: 'Collaboration', icon: '🤝', color: '#264653' },
  PS: { label: 'Problem Solving', icon: '🧩', color: '#E76F51' },
  ADAPT: { label: 'Adaptability', icon: '🌊', color: '#E9C46A' },
  LEARN: { label: 'Learning Agility', icon: '📚', color: '#F4A261' },
  EMPATHY: { label: 'Empathy', icon: '❤️', color: '#E76F51' },
  DIGITAL: { label: 'Digital Fluency', icon: '💻', color: '#264653' },
};

// Quick reply suggestions based on stage
const QUICK_REPLIES: Record<string, string[]> = {
  opening: ['I\'m doing well!', 'Medyo okay lang', 'It\'s been a tough day'],
  story_select: ['Something from work', 'A family experience', 'A community story', 'School experience'],
  core_probe: ['Let me think...', 'That\'s a great question', 'Can I skip this one?'],
  skill_probe: ['Yes, definitely', 'I\'m not sure', 'Can we move on?'],
  verification: ['Yes, that\'s right', 'Let me clarify', 'I\'d like to add something'],
  closing: ['Thank you, Aya!', 'Salamat!'],
};

// ============================================================
// ROTATING EXTRACTION MESSAGE — sub-component
// ============================================================

const EXTRACTION_MESSAGES = [
  'Reading between the lines of your story…',
  'Mapping your experiences to skills…',
  'Looking for patterns in what you shared…',
  'Checking for evidence of your strengths…',
  'Almost there — building your profile…',
];

function RotatingExtractionMessage() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % EXTRACTION_MESSAGES.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <p
      className="text-white/80 text-base font-medium text-center max-w-xs leading-relaxed"
      style={{ fontFamily: "'Nunito', sans-serif", transition: 'opacity 0.4s ease', minHeight: 52 }}
    >
      {EXTRACTION_MESSAGES[idx]}
    </p>
  );
}

// ============================================================
// COMPONENT
// ============================================================

export default function LEEEChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<SessionState>({
    sessionId: null, status: 'idle', stage: 'opening', storiesCompleted: 0, skillsEvidenced: null,
  });
  const [showWelcome, setShowWelcome] = useState(true);
  const [extraction, setExtraction] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [revealedSkills, setRevealedSkills] = useState<number>(0);
  const [newSkillSparkle, setNewSkillSparkle] = useState<string | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [pendingScenario, setPendingScenario] = useState<any>(null);
  const [scenarioCount, setScenarioCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  // Skill sparkle detection — when a new skill appears in evidenced skills
  useEffect(() => {
    if (session.skillsEvidenced) {
      const found = Object.entries(session.skillsEvidenced).filter(([_, v]) => v);
      if (found.length > 0) {
        const lastSkill = found[found.length - 1][0];
        const label = SKILL_LABELS[lastSkill];
        if (label) {
          setNewSkillSparkle(label.label);
          setTimeout(() => setNewSkillSparkle(null), 3000);
        }
      }
    }
  }, [session.skillsEvidenced]);

  // Start session
  const startSession = useCallback(async (language: string = 'en') => {
    setShowWelcome(false);
    setIsLoading(true);

    try {
      const profileId = localStorage.getItem('kaya_jobseeker_profile_id');
      const userId = localStorage.getItem('kaya_user_id');

      const headers = await authHeaders();
      const startRes = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'start', language,
          jobseeker_profile_id: profileId || undefined,
          user_id: userId || undefined,
        }),
      });
      const startData = await startRes.json();

      setSession({
        sessionId: startData.session_id, status: 'active', stage: 'opening',
        storiesCompleted: 0, skillsEvidenced: null,
      });
      localStorage.setItem('kaya_last_session_id', startData.session_id);

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ session_id: startData.session_id, message: '[SESSION START: Please greet the user warmly, introduce yourself as Aya, and begin Phase 1 of the conversation.]' }),
      });
      const chatData = await chatRes.json();

      setMessages([{
        id: crypto.randomUUID(), role: 'assistant', content: chatData.message,
        stage: chatData.stage, timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || !session.sessionId || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(), role: 'user', content: messageText, timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ session_id: session.sessionId, message: messageText }),
      });
      const data = await res.json();

      // Parse out any [SCENARIO:...] trigger from Aya's message
      let messageContent = data.message || '';
      const scenarioMatch = messageContent.match(/\[SCENARIO:(\{[\s\S]*?\})\]/);
      if (scenarioMatch && scenarioCount < 2) {
        // Strip the trigger from the displayed message
        messageContent = messageContent.replace(/\[SCENARIO:[\s\S]*?\]/, '').trim();
        // Generate scenario card in background
        try {
          const triggerData = JSON.parse(scenarioMatch[1]);
          const recentContext = messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');
          const scenRes = await fetch('/api/scenario', {
            method: 'POST',
            headers: await authHeaders(),
            body: JSON.stringify({ ...triggerData, recent_context: recentContext }),
          });
          const scenData = await scenRes.json();
          if (scenData.scenario) {
            setTimeout(() => setPendingScenario(scenData.scenario), 800);
            setScenarioCount(c => c + 1);
          }
        } catch (e) {
          console.error('Scenario generation error:', e);
        }
      }

      const aiMessage: Message = {
        id: crypto.randomUUID(), role: 'assistant', content: messageContent,
        stage: data.stage, timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setSession(prev => ({
        ...prev, stage: data.stage,
        status: data.session_status === 'completed' ? 'completed' : 'active',
        storiesCompleted: data.stories_completed,
        skillsEvidenced: data.skills_evidenced || prev.skillsEvidenced,
      }));

      if (data.should_extract) runExtraction(session.sessionId);
    } catch (error) {
      console.error('Send error:', error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: 'Sorry, I had a connection issue. Could you try saying that again?',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, session.sessionId, isLoading]);

  // Run extraction
  const runExtraction = async (sessionId: string) => {
    setIsExtracting(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ action: 'extract', session_id: sessionId }),
      });
      const data = await res.json();
      if (data.extraction) {
        setExtraction(data.extraction);
        localStorage.setItem('kaya_last_extraction', JSON.stringify(data.extraction));
        // Animate skill reveal
        setRevealedSkills(0);
        const total = data.extraction.skills_profile?.length || 0;
        for (let i = 0; i <= total; i++) {
          setTimeout(() => setRevealedSkills(i), i * 600);
        }
        // Show fullscreen superpowers reveal after brief delay
        setTimeout(() => setShowReveal(true), 300);
      } else {
        const res2 = await fetch('/api/chat', {
          method: 'POST',
          headers: await authHeaders(),
          body: JSON.stringify({ action: 'extract', session_id: sessionId }),
        });
        const data2 = await res2.json();
        if (data2.extraction) {
          setExtraction(data2.extraction);
          localStorage.setItem('kaya_last_extraction', JSON.stringify(data2.extraction));
        }
      }
    } catch (e) {
      console.error('Extraction error:', e);
    } finally {
      setIsExtracting(false);
    }
  };

  // Finish session
  const handleFinishSession = useCallback(async () => {
    if (!session.sessionId || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ session_id: session.sessionId, message: '[User chose to finish the conversation]' }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant', content: data.message,
        stage: 'closing', timestamp: new Date(),
      }]);
      setSession(prev => ({ ...prev, status: 'completed', stage: 'closing' }));
      if (session.sessionId) runExtraction(session.sessionId);
    } catch (error) {
      console.error('Finish error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session.sessionId, isLoading]);

  // Download transcript
  const downloadTranscript = useCallback(() => {
    const lines = messages.map(m =>
      `[${m.stage || 'unknown'}] ${m.role === 'assistant' ? 'Aya' : 'User'}: ${m.content}`
    ).join('\n\n');
    const header = `Kaya LEEE Conversation Transcript\nSession: ${session.sessionId}\nDate: ${new Date().toISOString()}\nStories completed: ${session.storiesCompleted}\n${'='.repeat(60)}\n\n`;
    const blob = new Blob([header + lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sis-transcript-${session.sessionId?.substring(0, 8) || 'unknown'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, session]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const stageConfig = STAGE_CONFIG[session.stage] || STAGE_CONFIG.opening;
  const quickReplies = QUICK_REPLIES[session.stage] || [];

  // Timer
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (session.status !== 'active') return;
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [session.status]);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      {/* FULLSCREEN SUPERPOWERS REVEAL — overlays everything */}
      {showReveal && extraction && (
        <SuperpowersReveal
          extraction={extraction}
          onDismiss={() => setShowReveal(false)}
        />
      )}

    <div className="flex flex-col h-screen relative overflow-hidden"
      style={{
        background: stageConfig.bg,
        transition: 'background 2s ease',
      }}>

      {/* ── LIVING LANDSCAPE — ambient orbs that shift with stage ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {/* Primary orb — top left */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl"
          style={{ background: stageConfig.orb1, transition: 'background 2s ease', animation: 'orbDrift1 12s ease-in-out infinite' }} />
        {/* Secondary orb — bottom right */}
        <div className="absolute -bottom-40 -right-20 w-80 h-80 rounded-full blur-3xl"
          style={{ background: stageConfig.orb2, transition: 'background 2s ease', animation: 'orbDrift2 16s ease-in-out infinite' }} />
        {/* Accent orb — center, subtle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl opacity-40"
          style={{ background: stageConfig.orb1, animation: 'orbDrift3 20s ease-in-out infinite' }} />
        {/* Grain texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")', backgroundRepeat: 'repeat', backgroundSize: '128px' }} />
      </div>

      {/* ── HEADER — dark glass ── */}
      <header className="flex-none relative z-10"
        style={{ background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">

            {/* Aya avatar + name */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${stageConfig.color}cc, ${stageConfig.color}66)`,
                    transition: 'background 2s ease',
                    animation: 'breathe 4s ease-in-out infinite',
                    boxShadow: `0 0 20px ${stageConfig.color}44`,
                  }}>
                  🦋
                </div>
                {session.status === 'active' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                    style={{ background: '#34d399', borderColor: 'rgba(0,0,0,0.4)' }} />
                )}
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white/90" style={{ fontFamily: "'Nunito', sans-serif", letterSpacing: '0.01em' }}>Aya</h1>
                <p className="text-[10px] transition-all duration-500" style={{ color: stageConfig.color, fontFamily: 'system-ui, sans-serif' }}>
                  {session.status === 'active' ? stageConfig.description : 'Kaya'}
                </p>
              </div>
            </div>

            {/* Timer + stage label */}
            {session.status === 'active' && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-white/30 font-mono tabular-nums">{mins}:{secs.toString().padStart(2, '0')}</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: `${stageConfig.color}18`, border: `1px solid ${stageConfig.color}30` }}>
                  <span className="text-xs">{stageConfig.icon}</span>
                  <span className="text-[10px] font-semibold" style={{ color: stageConfig.color, fontFamily: 'system-ui, sans-serif', letterSpacing: '0.03em' }}>
                    {stageConfig.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── JOURNEY RIVER — the progress visualization ── */}
          {session.status === 'active' && (
            <div className="mt-3">
              {/* Milestone nodes */}
              <div className="relative flex items-center justify-between mb-2 px-1">
                {/* Connecting line behind nodes */}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 h-px transition-all duration-1000 ease-out"
                  style={{ width: `calc(${stageConfig.progress}% - 2rem)`, background: `linear-gradient(90deg, ${stageConfig.color}88, ${stageConfig.color}44)` }} />

                {[
                  { icon: '🌅', threshold: 0,  stage: 'opening' },
                  { icon: '🌿', threshold: 18, stage: 'story_select' },
                  { icon: '🦋', threshold: 45, stage: 'core_probe' },
                  { icon: '💎', threshold: 68, stage: 'skill_probe' },
                  { icon: '', threshold: 95, stage: 'closing' },
                ].map((m, i) => {
                  const reached = stageConfig.progress >= m.threshold;
                  const isCurrent = i === [
                    'opening','story_select','elicitation','core_probe','skill_probe','verification','micro_story','closing'
                  ].indexOf(session.stage) || (i === 0 && session.stage === 'opening');
                  return (
                    <div key={i} className="relative z-10 flex flex-col items-center gap-1">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-700"
                        style={{
                          background: reached ? `${stageConfig.color}22` : 'rgba(255,255,255,0.04)',
                          border: `1.5px solid ${reached ? stageConfig.color + '60' : 'rgba(255,255,255,0.08)'}`,
                          transform: isCurrent ? 'scale(1.3)' : reached ? 'scale(1.05)' : 'scale(0.9)',
                          boxShadow: isCurrent ? `0 0 12px ${stageConfig.color}66` : 'none',
                          transition: 'all 0.6s ease',
                        }}>
                        <span style={{ fontSize: isCurrent ? '11px' : '9px', opacity: reached ? 1 : 0.25, transition: 'all 0.5s ease' }}>
                          {m.icon}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Liquid progress bar */}
              <div className="h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div className="h-full rounded-full transition-all duration-1200 ease-out relative overflow-hidden"
                  style={{ width: `${stageConfig.progress}%`, background: `linear-gradient(90deg, ${stageConfig.color}88, ${stageConfig.color})` }}>
                  {/* Shimmer */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)', animation: 'shimmer 2.5s ease-in-out infinite' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ── SKILL SPARKLE NOTIFICATION ── */}
      {newSkillSparkle && (
        <div className="flex-none mx-auto mt-3 z-10 relative" style={{ animation: 'slideDown 0.5s ease-out, fadeOut 0.5s ease-out 2.5s forwards' }}>
          <div className="px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(16px)', border: `1px solid ${stageConfig.color}40` }}>
            <span className="text-xs" style={{ color: stageConfig.color }}>✦</span>
            <span className="text-xs font-medium text-white/80" style={{ fontFamily: 'system-ui, sans-serif' }}>{newSkillSparkle} — signal detected</span>
          </div>
        </div>
      )}

      {/* MESSAGES AREA */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* WELCOME SCREEN */}
          {showWelcome && (
            <div className="flex flex-col items-center justify-center min-h-[65vh] text-center">
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, rgba(244,162,97,0.8), rgba(42,157,143,0.6))', animation: 'breathe 4s ease-in-out infinite', boxShadow: '0 0 60px rgba(244,162,97,0.25)' }}>
                  🦋
                </div>
                <div className="absolute -inset-4 rounded-3xl opacity-20" style={{ background: 'radial-gradient(circle, rgba(244,162,97,0.6) 0%, transparent 70%)', animation: 'breathe 4s ease-in-out infinite' }} />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Nunito', sans-serif" }}>
                Discover Your Superpowers
              </h2>
              <p className="max-w-sm mb-8 leading-relaxed text-[15px]" style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'system-ui, sans-serif' }}>
                Share real stories from your life. We'll uncover the skills you already have —
                no tests, no right or wrong answers.
              </p>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button onClick={() => startSession('en')}
                  className="px-6 py-3.5 text-white rounded-2xl font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #F4A261, #E76F51)', boxShadow: '0 8px 32px rgba(244,162,97,0.35)', fontFamily: "'Nunito', sans-serif" }}>
                  Start in English
                </button>
                <button onClick={() => startSession('taglish')}
                  className="px-6 py-3.5 rounded-2xl font-semibold transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(244,162,97,0.1)', border: '1.5px solid rgba(244,162,97,0.3)', color: 'rgba(244,162,97,0.9)', fontFamily: "'Nunito', sans-serif" }}>
                  Magsimula sa Taglish
                </button>
                <button onClick={() => startSession('fil')}
                  className="px-6 py-3.5 rounded-2xl font-medium transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.35)', fontFamily: "'Nunito', sans-serif" }}>
                  Magsimula sa Filipino
                </button>
              </div>

              <div className="flex items-center gap-4 mt-8 text-[11px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'system-ui, sans-serif' }}>
                <span>🕐 12–18 minutes</span>
                <span>·</span>
                <span>⏭ Skip any question</span>
                <span>·</span>
                <span>🔒 Private</span>
              </div>
            </div>
          )}

          {/* CHAT MESSAGES */}
          {messages.map((msg: any, idx) => (
            <div key={msg.id} className={`flex mb-5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animation: `messageIn 0.4s ease-out ${idx === messages.length - 1 ? '' : 'none'}` }}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-sm mr-2.5 mt-1 flex-none shadow-sm">
                  🦋
                </div>
              )}
              {/* Scenario choice — special pill styling */}
              {msg.isScenarioChoice ? (
                <div className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-br-md flex items-center gap-2"
                  style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)', border: `1px solid ${stageConfig.color}50` }}>
                  <span className="text-xs" style={{ color: stageConfig.color }}>•</span>
                  <span className="text-sm text-white/80" style={{ fontFamily: 'system-ui, sans-serif' }}>{msg.choiceText}</span>
                </div>
              ) : (
              <div className={`max-w-[78%] px-4 py-3 text-[15px] leading-relaxed ${
                msg.role === 'user'
                  ? 'text-white rounded-2xl rounded-br-md'
                  : 'rounded-2xl rounded-bl-md'
              }`} style={{
                fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                background: msg.role === 'user'
                  ? `linear-gradient(135deg, ${stageConfig.color}cc, ${stageConfig.color}88)`
                  : 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(12px)',
                border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                color: msg.role === 'user' ? '#fff' : 'rgba(255,255,255,0.88)',
                boxShadow: msg.role === 'user' ? `0 4px 20px ${stageConfig.color}33` : 'none',
              }}>
                {msg.content}
              </div>
              )}
            </div>
          ))}

          {/* SCENARIO CARD — Dynamic micro-simulation */}
          {pendingScenario && !isLoading && (
            <ScenarioCard
              scenario={pendingScenario}
              onComplete={(chosenOption, ayaReaction) => {
                setPendingScenario(null);
                // Add user's choice as a message
                const userChoice: any = {
                  id: crypto.randomUUID(), role: 'user',
                  content: `[Scenario choice: ${chosenOption.text}]`,
                  timestamp: new Date(),
                  isScenarioChoice: true,
                  choiceText: chosenOption.text,
                };
                // Add Aya's reaction
                const ayaMsg: any = {
                  id: crypto.randomUUID(), role: 'assistant',
                  content: ayaReaction,
                  timestamp: new Date(),
                };
                setMessages(prev => [...prev, userChoice, ayaMsg]);
                // Continue conversation naturally
                setTimeout(() => inputRef.current?.focus(), 300);
              }}
            />
          )}

          {/* TYPING INDICATOR */}
          {isLoading && (
            <div className="flex mb-5 justify-start" style={{ animation: 'messageIn 0.3s ease-out' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm mr-2.5 mt-1 flex-none"
                style={{ background: `linear-gradient(135deg, ${stageConfig.color}cc, ${stageConfig.color}66)`, boxShadow: `0 0 12px ${stageConfig.color}44` }}>
                🦋
              </div>
              <div className="px-5 py-3.5 rounded-2xl rounded-bl-md"
                style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full"
                      style={{ background: stageConfig.color, opacity: 0.7, animation: `aya-bounce 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUPERPOWERS REVEALED — Animated skill-by-skill reveal */}
          {extraction && (
            <div className="mt-8 mb-4" style={{ animation: 'messageIn 0.5s ease-out' }}>
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border border-amber-200/50 shadow-xl">
                <h3 className="text-xl font-bold text-stone-800 mb-2 flex items-center gap-2" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  Your Superpowers
                </h3>
                {extraction.narrative_summary && (
                  <p className="text-sm text-stone-500 mb-5 italic">{extraction.narrative_summary}</p>
                )}
                <div className="space-y-3">
                  {extraction.skills_profile?.map((skill: any, i: number) => {
                    const visible = i < revealedSkills;
                    return (
                      <div key={skill.skill_id}
                        className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                        style={{ transitionDelay: `${i * 100}ms` }}>
                        <div className="bg-white/90 rounded-2xl p-4 border border-amber-100 shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: '#FEF3E2' }}>
                            {SKILL_LABELS[skill.skill_id]?.icon || '⭐'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-stone-800 text-sm">{skill.skill_name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">{skill.proficiency}</span>
                            </div>
                            <div className="w-full bg-stone-100 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full transition-all duration-1000 bg-gradient-to-r from-amber-400 to-orange-400"
                                style={{ width: visible ? `${skill.confidence * 100}%` : '0%', transitionDelay: `${i * 200 + 400}ms` }} />
                            </div>
                          </div>
                          <span className="text-lg font-bold text-amber-600">{Math.round(skill.confidence * 100)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 flex gap-3">
                  <a href="/skills"
                    className="flex-1 text-center px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all text-sm">
                    View Full Profile →
                  </a>
                  <button onClick={downloadTranscript}
                    className="px-4 py-2.5 text-xs text-stone-500 border border-stone-200 rounded-xl hover:bg-white transition-all">
                    Download Transcript
                  </button>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* INPUT AREA */}
      {session.status === 'active' && !extraction && (
        <footer className="flex-none relative z-10"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-2xl mx-auto px-4 py-3">

            {/* Quick Reply Chips — only shown until user has sent their first message in this stage */}
            {quickReplies.length > 0 && !isLoading && messages.length > 0 && messages.filter(m => m.role === 'user').length < 2 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {quickReplies.map((reply, i) => (
                  <button key={i} onClick={() => sendMessage(reply)}
                    className="px-3 py-1.5 text-xs rounded-full transition-all hover:scale-[1.03] active:scale-[0.97]"
                    style={{
                      background: `${stageConfig.color}15`,
                      border: `1px solid ${stageConfig.color}30`,
                      color: stageConfig.color,
                      fontFamily: "'Nunito', sans-serif",
                    }}>
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Skill Badges */}
            {session.skillsEvidenced && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {Object.entries(SKILL_LABELS).map(([key, skill]) => {
                  const found = session.skillsEvidenced?.[key];
                  return (
                    <span key={key}
                      className="text-[10px] px-2 py-0.5 rounded-full transition-all duration-500"
                      style={{
                        background: found ? `${stageConfig.color}20` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${found ? stageConfig.color + '40' : 'rgba(255,255,255,0.06)'}`,
                        color: found ? stageConfig.color : 'rgba(255,255,255,0.2)',
                        transform: found ? 'scale(1.05)' : 'scale(1)',
                      }}>
                      {skill.icon} {skill.label}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="flex items-end gap-2">
              <textarea ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
                placeholder="Share your story..."
                rows={1}
                className="flex-1 resize-none rounded-2xl px-4 py-3 text-[15px] focus:outline-none transition-all"
                style={{
                  fontFamily: "'Nunito', 'Segoe UI', sans-serif",
                  background: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(8px)',
                  border: `1px solid rgba(255,255,255,0.10)`,
                  color: 'rgba(255,255,255,0.9)',
                  caretColor: stageConfig.color,
                }}
                disabled={isLoading}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
                className="p-3 rounded-2xl text-white disabled:opacity-20 transition-all hover:scale-[1.05] active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg, ${stageConfig.color}, ${stageConfig.color}cc)`, boxShadow: `0 4px 16px ${stageConfig.color}44`, transition: 'all 0.3s ease' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-[11px] text-white/25" style={{ fontFamily: 'system-ui, sans-serif' }}>
                Story {session.storiesCompleted + 1} of 3 · skip any question
              </p>
              {messages.length >= 6 && (
                <button onClick={handleFinishSession}
                  className="text-[11px] text-white/25 hover:text-white/50 transition-colors"
                  style={{ fontFamily: 'system-ui, sans-serif' }}>
                  Finish →
                </button>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* COMPLETED — Waiting for extraction */}
      {session.status === 'completed' && !extraction && !isExtracting && (
        <footer className="flex-none p-4 text-center relative z-10"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm text-white/60 mb-3" style={{ fontFamily: 'system-ui, sans-serif' }}>Session complete. Ready to see your superpowers?</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => session.sessionId && runExtraction(session.sessionId)}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all">
              Discover My Superpowers
            </button>
            <button onClick={downloadTranscript}
              className="px-4 py-2.5 text-xs rounded-xl transition-all"
              style={{ color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'system-ui, sans-serif' }}>
              Download Transcript
            </button>
          </div>
        </footer>
      )}

      {/* EXTRACTING */}
      {isExtracting && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center"
          style={{ background: stageConfig.bg, backdropFilter: 'blur(20px)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl" style={{ background: stageConfig.orb1, animation: 'orbDrift1 8s ease-in-out infinite' }} />
            <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl" style={{ background: stageConfig.orb2, animation: 'orbDrift2 12s ease-in-out infinite' }} />
          </div>
          <div className="relative mb-10">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-2xl"
              style={{ background: `linear-gradient(135deg, ${stageConfig.color}cc, ${stageConfig.color}66)`, animation: 'extractPulse 1.5s ease-in-out infinite', boxShadow: `0 0 60px ${stageConfig.color}44` }}>
              🦋
            </div>
            <div className="absolute -inset-6 rounded-full opacity-20"
              style={{ background: `radial-gradient(circle, ${stageConfig.color} 0%, transparent 70%)`, animation: 'extractPulse 1.5s ease-in-out infinite' }} />
          </div>
          <RotatingExtractionMessage />
          <div className="flex gap-3 mt-8">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full"
                style={{ background: stageConfig.color, animation: `extractDot 2s ease-in-out ${i * 0.3}s infinite` }} />
            ))}
          </div>
          <p className="text-white/20 text-xs mt-6" style={{ fontFamily: 'system-ui, sans-serif' }}>Analysing your stories against PSF framework…</p>
        </div>
      )}

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes messageIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          to { opacity: 0; }
        }
        @keyframes aya-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes orbDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(40px, -30px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes orbDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40% { transform: translate(-50px, 30px) scale(1.08); }
          70% { transform: translate(30px, -20px) scale(0.92); }
        }
        @keyframes orbDrift3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes extractPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.06); opacity: 0.85; }
        }
        @keyframes extractDot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
        textarea::placeholder { color: rgba(255,255,255,0.2); }
      `}} />
    </div>
    </>
  );
}
