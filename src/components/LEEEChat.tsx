'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import SuperpowersReveal from './SuperpowersReveal';

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

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: string; progress: number; description: string }> = {
  opening: { label: 'Getting to Know You', color: '#F4A261', icon: '🌅', progress: 5, description: 'Building rapport' },
  story_select: { label: 'Finding a Story', color: '#E9C46A', icon: '🌿', progress: 15, description: 'Choosing what to share' },
  elicitation: { label: 'Tell Your Story', color: '#2A9D8F', icon: '🦋', progress: 30, description: 'Setting the scene' },
  core_probe: { label: 'Exploring What Happened', color: '#2A9D8F', icon: '🔮', progress: 50, description: 'The heart of your story' },
  skill_probe: { label: 'Going Deeper', color: '#264653', icon: '💎', progress: 65, description: 'Understanding the impact' },
  verification: { label: 'Wrapping Up', color: '#E76F51', icon: '🌟', progress: 80, description: 'Final reflections' },
  micro_story: { label: 'One More Quick Story', color: '#F4A261', icon: '⚡', progress: 88, description: 'A short example' },
  closing: { label: 'Thank You', color: '#2A9D8F', icon: '✨', progress: 98, description: 'Session complete' },
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
      const profileId = localStorage.getItem('sis_jobseeker_profile_id');
      const userId = localStorage.getItem('sis_user_id');

      const startRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      localStorage.setItem('sis_last_session_id', startData.session_id);

      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: startData.session_id, message: '[User has joined the session]' }),
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.sessionId, message: messageText }),
      });
      const data = await res.json();

      const aiMessage: Message = {
        id: crypto.randomUUID(), role: 'assistant', content: data.message,
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'extract', session_id: sessionId }),
      });
      const data = await res.json();
      if (data.extraction) {
        setExtraction(data.extraction);
        localStorage.setItem('sis_last_extraction', JSON.stringify(data.extraction));
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'extract', session_id: sessionId }),
        });
        const data2 = await res2.json();
        if (data2.extraction) {
          setExtraction(data2.extraction);
          localStorage.setItem('sis_last_extraction', JSON.stringify(data2.extraction));
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
        headers: { 'Content-Type': 'application/json' },
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
    const header = `SIS LEEE Conversation Transcript\nSession: ${session.sessionId}\nDate: ${new Date().toISOString()}\nStories completed: ${session.storiesCompleted}\n${'='.repeat(60)}\n\n`;
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

    <div className="flex flex-col h-screen" style={{ background: 'linear-gradient(170deg, #FFF8F0 0%, #FEF3E2 30%, #F0F7F4 60%, #EDF6F9 100%)' }}>

      {/* HEADER — Warm, Ambient */}
      <header className="flex-none backdrop-blur-md bg-white/60 border-b border-amber-100/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Aya Avatar with breathing animation */}
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center text-white text-lg shadow-lg" style={{ animation: 'breathe 4s ease-in-out infinite' }}>
                  🦋
                </div>
                {session.status === 'active' && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-stone-800" style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>Aya</h1>
                <p className="text-[11px] text-stone-400">{session.status === 'active' ? stageConfig.description : 'Skills Intelligence System'}</p>
              </div>
            </div>
            {session.status === 'active' && (
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-stone-400 font-mono tabular-nums">{mins}:{secs.toString().padStart(2, '0')}</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ backgroundColor: stageConfig.color + '15' }}>
                  <span className="text-xs">{stageConfig.icon}</span>
                  <span className="text-[11px] font-medium" style={{ color: stageConfig.color }}>{stageConfig.label}</span>
                </div>
              </div>
            )}
          </div>

          {/* Story Arc Progress — Visual Journey */}
          {session.status === 'active' && (
            <div className="mt-3 relative">
              {/* Journey milestones */}
              <div className="flex items-center justify-between mb-1.5">
                {[
                  { icon: '🌅', label: 'Meeting', threshold: 5 },
                  { icon: '🌿', label: 'Opening Up', threshold: 20 },
                  { icon: '🦋', label: 'Your Story', threshold: 45 },
                  { icon: '💎', label: 'Depth', threshold: 65 },
                  { icon: '✨', label: 'Complete', threshold: 90 },
                ].map((m, i) => {
                  const reached = stageConfig.progress >= m.threshold;
                  const active = stageConfig.progress >= m.threshold && (i === 4 || stageConfig.progress < [5, 20, 45, 65, 90][i + 1]);
                  return (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <span
                        className="transition-all duration-500"
                        style={{
                          fontSize: reached ? '13px' : '11px',
                          opacity: reached ? 1 : 0.3,
                          transform: active ? 'scale(1.25)' : reached ? 'scale(1.05)' : 'scale(0.9)',
                          filter: active ? 'drop-shadow(0 0 4px rgba(244,162,97,0.8))' : 'none',
                        }}
                      >
                        {m.icon}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Progress track */}
              <div className="h-1 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${stageConfig.progress}%`,
                    background: 'linear-gradient(90deg, #F4A261 0%, #2A9D8F 60%, #264653 100%)',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-stone-300">Beginning</span>
                <span className="text-[10px] font-medium" style={{ color: stageConfig.color }}>{stageConfig.description}</span>
                <span className="text-[10px] text-stone-300">{stageConfig.progress}%</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* SKILL SPARKLE NOTIFICATION */}
      {newSkillSparkle && (
        <div className="flex-none mx-auto mt-2" style={{ animation: 'slideDown 0.5s ease-out, fadeOut 0.5s ease-out 2.5s forwards' }}>
          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-lg">
            <span className="text-xs font-medium text-amber-700">✨ Skill signal detected: {newSkillSparkle}</span>
          </div>
        </div>
      )}

      {/* MESSAGES AREA */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* WELCOME SCREEN — Premium */}
          {showWelcome && (
            <div className="flex flex-col items-center justify-center min-h-[65vh] text-center">
              {/* Butterfly avatar */}
              <div className="relative mb-8">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center text-5xl shadow-2xl" style={{ animation: 'breathe 4s ease-in-out infinite' }}>
                  🦋
                </div>
                <div className="absolute -inset-3 rounded-3xl" style={{ background: 'radial-gradient(circle, rgba(244,162,97,0.15) 0%, transparent 70%)', animation: 'pulse 3s ease-in-out infinite' }} />
              </div>

              <h2 className="text-2xl font-bold text-stone-800 mb-2" style={{ fontFamily: "'Nunito', sans-serif" }}>
                Discover Your Superpowers
              </h2>
              <p className="text-stone-500 max-w-sm mb-8 leading-relaxed text-[15px]">
                Share real stories from your life and let us uncover the valuable skills you already have.
                No tests, no right or wrong answers.
              </p>

              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button onClick={() => startSession('en')}
                  className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ fontFamily: "'Nunito', sans-serif" }}>
                  Start in English
                </button>
                <button onClick={() => startSession('taglish')}
                  className="px-6 py-3.5 bg-white/80 backdrop-blur border-2 border-amber-200 text-amber-700 rounded-2xl font-semibold hover:bg-amber-50 transition-all hover:scale-[1.02]"
                  style={{ fontFamily: "'Nunito', sans-serif" }}>
                  Magsimula sa Taglish
                </button>
                <button onClick={() => startSession('fil')}
                  className="px-6 py-3.5 bg-white/60 border-2 border-stone-200 text-stone-500 rounded-2xl font-medium hover:bg-stone-50 transition-all"
                  style={{ fontFamily: "'Nunito', sans-serif" }}>
                  Magsimula sa Filipino
                </button>
              </div>

              <div className="flex items-center gap-4 mt-8 text-[11px] text-stone-400">
                <span>🕐 12–18 minutes</span>
                <span>•</span>
                <span>⏭️ Skip any question</span>
                <span>•</span>
                <span>🔒 Stories stay private</span>
              </div>
            </div>
          )}

          {/* CHAT MESSAGES */}
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`flex mb-5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animation: `messageIn 0.4s ease-out ${idx === messages.length - 1 ? '' : 'none'}` }}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-sm mr-2.5 mt-1 flex-none shadow-sm">
                  🦋
                </div>
              )}
              <div className={`max-w-[78%] px-4 py-3 text-[15px] leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-stone-700 to-stone-800 text-white rounded-2xl rounded-br-md shadow-md'
                  : 'bg-white/80 backdrop-blur-sm border border-stone-100 text-stone-700 rounded-2xl rounded-bl-md shadow-sm'
              }`} style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
                {msg.content}
              </div>
            </div>
          ))}

          {/* TYPING INDICATOR — Warm bubbles */}
          {isLoading && (
            <div className="flex mb-5 justify-start" style={{ animation: 'messageIn 0.3s ease-out' }}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-sm mr-2.5 mt-1 flex-none">
                🦋
              </div>
              <div className="bg-white/80 backdrop-blur-sm border border-stone-100 px-5 py-3.5 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-300" style={{ animation: 'aya-bounce 1.4s ease-in-out infinite' }} />
                  <div className="w-2 h-2 rounded-full bg-orange-300" style={{ animation: 'aya-bounce 1.4s ease-in-out 0.2s infinite' }} />
                  <div className="w-2 h-2 rounded-full bg-rose-300" style={{ animation: 'aya-bounce 1.4s ease-in-out 0.4s infinite' }} />
                </div>
              </div>
            </div>
          )}

          {/* SUPERPOWERS REVEALED — Animated skill-by-skill reveal */}
          {extraction && (
            <div className="mt-8 mb-4" style={{ animation: 'messageIn 0.5s ease-out' }}>
              <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border border-amber-200/50 shadow-xl">
                <h3 className="text-xl font-bold text-stone-800 mb-2 flex items-center gap-2" style={{ fontFamily: "'Nunito', sans-serif" }}>
                  ✨ Your Superpowers
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
                    📥 Transcript
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
        <footer className="flex-none border-t border-amber-100/50 bg-white/60 backdrop-blur-md">
          <div className="max-w-2xl mx-auto px-4 py-3">

            {/* Quick Reply Chips */}
            {quickReplies.length > 0 && !isLoading && messages.length > 0 && messages.length < 8 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {quickReplies.map((reply, i) => (
                  <button key={i} onClick={() => sendMessage(reply)}
                    className="px-3 py-1.5 text-xs rounded-full bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-all hover:scale-[1.03] active:scale-[0.97]"
                    style={{ fontFamily: "'Nunito', sans-serif" }}>
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
                      className={`text-[10px] px-2 py-0.5 rounded-full transition-all duration-500 ${
                        found ? 'bg-amber-100 text-amber-700 border border-amber-200 scale-105' : 'bg-stone-50 text-stone-300 border border-stone-100'
                      }`}>
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
                className="flex-1 resize-none rounded-2xl border border-stone-200 px-4 py-3 text-[15px] text-stone-700 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 bg-white/80 backdrop-blur transition-all"
                style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}
                disabled={isLoading}
              />
              <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
                className="p-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:shadow-lg disabled:opacity-30 transition-all hover:scale-[1.03] active:scale-[0.97]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 px-1">
              <p className="text-[11px] text-stone-400">
                Story {session.storiesCompleted + 1} of 3 • You can skip any question
              </p>
              {messages.length >= 6 && (
                <button onClick={handleFinishSession}
                  className="text-[11px] text-stone-400 hover:text-stone-600 transition-colors underline decoration-dotted">
                  Finish conversation
                </button>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* COMPLETED — Waiting for extraction */}
      {session.status === 'completed' && !extraction && !isExtracting && (
        <footer className="flex-none border-t border-amber-100/50 bg-white/60 backdrop-blur-md p-4 text-center">
          <p className="text-sm text-stone-600 mb-3">Session complete! Thank you for sharing your stories.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => session.sessionId && runExtraction(session.sessionId)}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all">
              ✨ Discover My Superpowers
            </button>
            <button onClick={downloadTranscript}
              className="px-4 py-2.5 text-xs text-stone-500 border border-stone-200 rounded-xl hover:bg-white transition-all">
              📥 Transcript
            </button>
          </div>
        </footer>
      )}

      {/* EXTRACTING — Full-screen animated overlay */}
      {isExtracting && (
        <div className="fixed inset-0 z-40 flex flex-col items-center justify-center"
          style={{ background: 'linear-gradient(160deg, #0F0C29, #302B63, #24243e)' }}>

          {/* Animated butterfly */}
          <div className="relative mb-10">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center text-5xl shadow-2xl"
              style={{ animation: 'extractPulse 1.5s ease-in-out infinite' }}>
              🦋
            </div>
            <div className="absolute -inset-6 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #F4A261 0%, transparent 70%)', animation: 'extractPulse 1.5s ease-in-out infinite' }} />
          </div>

          {/* Rotating messages */}
          <RotatingExtractionMessage />

          {/* Progress dots */}
          <div className="flex gap-3 mt-8">
            {[0, 1, 2, 3, 4].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: '#F4A261',
                  animation: `extractDot 2s ease-in-out ${i * 0.3}s infinite`,
                }} />
            ))}
          </div>

          <p className="text-white/30 text-xs mt-6">Analysing your stories against PSF framework…</p>
        </div>
      )}

      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes messageIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeOut {
          to { opacity: 0; transform: translateY(-5px); }
        }
        @keyframes aya-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}} />
    </div>
    </>
  );
}
