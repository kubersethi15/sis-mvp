'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// ============================================================
// TYPES
// ============================================================

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  stage?: string;
  timestamp: Date;
}

interface SessionState {
  sessionId: string | null;
  status: 'idle' | 'active' | 'completed';
  stage: string;
  storiesCompleted: number;
  skillsEvidenced: Record<string, boolean> | null;
}

// ============================================================
// STAGE DISPLAY CONFIG
// ============================================================

const STAGE_CONFIG: Record<string, { label: string; color: string; icon: string; progress: number }> = {
  opening: { label: 'Getting Started', color: '#2E86C1', icon: '👋', progress: 5 },
  story_select: { label: 'Choosing a Story', color: '#27AE60', icon: '📖', progress: 15 },
  elicitation: { label: 'Tell Your Story', color: '#27AE60', icon: '✨', progress: 30 },
  core_probe: { label: 'Exploring Details', color: '#E67E22', icon: '🔍', progress: 50 },
  skill_probe: { label: 'Going Deeper', color: '#E67E22', icon: '💡', progress: 65 },
  verification: { label: 'Wrapping Up Story', color: '#8E44AD', icon: '✅', progress: 75 },
  micro_story: { label: 'One More Quick Story', color: '#2E86C1', icon: '⚡', progress: 85 },
  closing: { label: 'Finishing Up', color: '#27AE60', icon: '🎉', progress: 95 },
};

// ============================================================
// SKILL BADGES
// ============================================================

const SKILL_LABELS: Record<string, { label: string; icon: string }> = {
  EQ: { label: 'Emotional Intelligence', icon: '💛' },
  COMM: { label: 'Communication', icon: '💬' },
  COLLAB: { label: 'Collaboration', icon: '🤝' },
  PS: { label: 'Problem Solving', icon: '🧩' },
  ADAPT: { label: 'Adaptability', icon: '🌊' },
  LEARN: { label: 'Learning Agility', icon: '📚' },
  EMPATHY: { label: 'Empathy', icon: '❤️' },
  DIGITAL: { label: 'Digital Fluency', icon: '💻' },
};

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

  // Start session
  const startSession = useCallback(async (language: string = 'en') => {
    setShowWelcome(false);
    setIsLoading(true);

    try {
      // Create session
      const startRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', language }),
      });
      const startData = await startRes.json();

      setSession({
        sessionId: startData.session_id,
        status: 'active',
        stage: 'opening',
        storiesCompleted: 0,
        skillsEvidenced: null,
      });

      // Get first AI message
      const chatRes = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: startData.session_id,
          message: '[User has joined the session]',
        }),
      });
      const chatData = await chatRes.json();

      setMessages([{
        id: crypto.randomUUID(),
        role: 'assistant',
        content: chatData.message,
        stage: chatData.stage,
        timestamp: new Date(),
      }]);

    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!input.trim() || !session.sessionId || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.sessionId,
          message: userMessage.content,
        }),
      });
      const data = await res.json();

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message,
        stage: data.stage,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setSession(prev => ({
        ...prev,
        stage: data.stage,
        status: data.session_status === 'completed' ? 'completed' : 'active',
        storiesCompleted: data.stories_completed,
        skillsEvidenced: data.skills_evidenced || prev.skillsEvidenced,
      }));

      // If session completed, trigger extraction
      if (data.should_extract) {
        runExtraction(session.sessionId);
      }

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
        // Store for skills dashboard
        localStorage.setItem('sis_last_extraction', JSON.stringify(data.extraction));
      }
    } catch (e) {
      console.error('Extraction error:', e);
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const stageConfig = STAGE_CONFIG[session.stage] || STAGE_CONFIG.opening;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 to-white">

      {/* HEADER */}
      <header className="flex-none border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                A
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-800">Aya</h1>
                <p className="text-xs text-slate-500">Skills Intelligence System</p>
              </div>
            </div>
            {session.status === 'active' && (
              <div className="flex items-center gap-2">
                <span className="text-sm">{stageConfig.icon}</span>
                <span className="text-xs font-medium" style={{ color: stageConfig.color }}>
                  {stageConfig.label}
                </span>
              </div>
            )}
          </div>

          {/* PROGRESS BAR */}
          {session.status === 'active' && (
            <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stageConfig.progress}%`, backgroundColor: stageConfig.color }}
              />
            </div>
          )}
        </div>
      </header>

      {/* MESSAGES AREA */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* WELCOME SCREEN */}
          {showWelcome && (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-3xl shadow-lg mb-6">
                A
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Discover Your Superpowers
              </h2>
              <p className="text-slate-500 max-w-md mb-8 leading-relaxed">
                Share real stories from your life and let us uncover the valuable skills you already have.
                No tests, no right or wrong answers — just your stories.
              </p>
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button
                  onClick={() => startSession('en')}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start in English
                </button>
                <button
                  onClick={() => startSession('taglish')}
                  className="px-6 py-3 bg-white border-2 border-emerald-200 text-emerald-700 rounded-xl font-medium hover:bg-emerald-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Magsimula sa Taglish
                </button>
                <button
                  onClick={() => startSession('fil')}
                  className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Magsimula sa Filipino
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-6">
                12–18 minutes • You can skip any question • Your stories stay private
              </p>
            </div>
          )}

          {/* CHAT MESSAGES */}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-none shadow-sm">
                  A
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl leading-relaxed text-[15px] ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md shadow-md'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* TYPING INDICATOR */}
          {isLoading && (
            <div className="flex mb-4 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-none">
                A
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          {/* EXTRACTION RESULTS */}
          {extraction && (
            <div className="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl">
              <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
                ✨ Your Skills Profile
              </h3>
              {extraction.narrative_summary && (
                <p className="text-sm text-slate-600 mb-4 italic">{extraction.narrative_summary}</p>
              )}
              <div className="grid gap-3">
                {extraction.skills_profile?.map((skill: any) => (
                  <div key={skill.skill_id} className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-800">{skill.skill_name}</span>
                      <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
                        skill.proficiency === 'advanced' ? 'bg-purple-100 text-purple-700' :
                        skill.proficiency === 'intermediate' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {skill.proficiency}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.round(skill.confidence * 100)}%`,
                          backgroundColor: skill.proficiency === 'advanced' ? '#8E44AD' :
                            skill.proficiency === 'intermediate' ? '#2E86C1' : '#27AE60',
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Confidence: {Math.round(skill.confidence * 100)}%
                    </p>
                    {skill.evidence?.[0] && (
                      <p className="text-xs text-slate-400 mt-2 italic">
                        "{skill.evidence[0].transcript_quote?.substring(0, 100)}..."
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* EXTRACTING INDICATOR */}
          {isExtracting && (
            <div className="mt-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm text-slate-600">Analyzing your stories and building your skills profile...</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* INPUT AREA */}
      {session.status === 'active' && (
        <footer className="flex-none border-t border-slate-200 bg-white/80 backdrop-blur-sm">
          <div className="max-w-2xl mx-auto px-4 py-3">
            {/* Skills badges (show after gap scan) */}
            {session.skillsEvidenced && (
              <div className="flex gap-1.5 mb-2 flex-wrap">
                {Object.entries(session.skillsEvidenced).map(([key, found]) => {
                  const skill = SKILL_LABELS[key];
                  if (!skill) return null;
                  return (
                    <span
                      key={key}
                      className={`text-xs px-2 py-0.5 rounded-full transition-all ${
                        found
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {skill.icon} {skill.label}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Share your story..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-[15px] text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300 bg-white transition-all"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg disabled:opacity-40 disabled:shadow-none transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2 text-center">
              Story {session.storiesCompleted + 1} of 3 • You can skip any question
            </p>
          </div>
        </footer>
      )}

      {/* COMPLETED STATE */}
      {session.status === 'completed' && !extraction && !isExtracting && (
        <footer className="flex-none border-t border-slate-200 bg-white p-4 text-center">
          <p className="text-sm text-slate-600 mb-2">Session complete! Thank you for sharing your stories.</p>
          <button
            onClick={() => session.sessionId && runExtraction(session.sessionId)}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all"
          >
            View My Skills Profile
          </button>
        </footer>
      )}
    </div>
  );
}
