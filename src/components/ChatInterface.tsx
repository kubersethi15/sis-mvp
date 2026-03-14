'use client';

// LEEE Chat Interface - "Next-level" conversational experience
// NOT a generic chatbot widget — this is a storytelling experience

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MothStage } from '@/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  stage?: MothStage;
  timestamp: Date;
}

interface SessionMetadata {
  stage: MothStage;
  stories_completed: number;
  session_should_end: boolean;
}

// Stage display config — what the user sees
const STAGE_CONFIG: Record<MothStage, { label: string; emoji: string; color: string; description: string }> = {
  opening: { label: 'Getting Started', emoji: '👋', color: 'from-blue-500 to-cyan-500', description: "Let's get to know each other" },
  story_select: { label: 'Choose Your Story', emoji: '📖', color: 'from-purple-500 to-pink-500', description: 'Pick a story to share' },
  elicitation: { label: 'Your Story', emoji: '✨', color: 'from-amber-500 to-orange-500', description: 'Tell me what happened' },
  core_probe: { label: 'Going Deeper', emoji: '🔍', color: 'from-emerald-500 to-teal-500', description: "Let's explore the details" },
  skill_probe: { label: 'Going Deeper', emoji: '🔍', color: 'from-emerald-500 to-teal-500', description: 'Understanding your approach' },
  verification: { label: 'Almost There', emoji: '🎯', color: 'from-indigo-500 to-blue-500', description: 'A few more details' },
  micro_story: { label: 'Quick Story', emoji: '⚡', color: 'from-yellow-500 to-amber-500', description: 'One more short example' },
  closing: { label: 'Wrapping Up', emoji: '🙏', color: 'from-rose-500 to-pink-500', description: 'Thank you for sharing' },
};

interface ChatInterfaceProps {
  sessionId: string;
  userName?: string;
  onSessionEnd?: (sessionId: string) => void;
}

export default function ChatInterface({ sessionId, userName, onSessionEnd }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentStage, setCurrentStage] = useState<MothStage>('opening');
  const [storiesCompleted, setStoriesCompleted] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [showStageTransition, setShowStageTransition] = useState(false);
  const [prevStage, setPrevStage] = useState<MothStage>('opening');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    if (!isLoading && !sessionEnded) {
      inputRef.current?.focus();
    }
  }, [isLoading, sessionEnded]);

  // Stage transition animation
  useEffect(() => {
    if (currentStage !== prevStage) {
      setShowStageTransition(true);
      const timer = setTimeout(() => setShowStageTransition(false), 2000);
      setPrevStage(currentStage);
      return () => clearTimeout(timer);
    }
  }, [currentStage, prevStage]);

  // Send initial greeting when session starts
  useEffect(() => {
    if (messages.length === 0) {
      sendMessage('__init__');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const isInit = text === '__init__';

    if (!isInit) {
      // Add user message to UI
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        stage: currentStage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMsg]);
    }

    setIsLoading(true);
    setIsStreaming(true);
    setInput('');

    // Create placeholder for assistant response
    const assistantId = `assistant-${Date.now()}`;
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      stage: currentStage,
      timestamp: new Date(),
    }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: isInit
            ? 'Hello, I am ready to start. Please welcome me and begin the session.'
            : text,
        }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));

            if (data.error) {
              console.error('Stream error:', data.error);
              break;
            }

            if (data.text) {
              // Update streaming message
              setMessages(prev => prev.map(m =>
                m.id === assistantId
                  ? { ...m, content: m.content + data.text }
                  : m
              ));
            }

            if (data.done && data.metadata) {
              const meta = data.metadata as SessionMetadata;
              setCurrentStage(meta.stage);
              setStoriesCompleted(meta.stories_completed);
              if (meta.session_should_end) {
                setSessionEnded(true);
                onSessionEnd?.(sessionId);
              }
            }
          } catch (e) {
            // Skip malformed chunks
          }
        }
      }
    } catch (error) {
      console.error('Send error:', error);
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'Sorry, something went wrong. Please try again.' }
          : m
      ));
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [sessionId, currentStage, onSessionEnd]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || sessionEnded) return;
    sendMessage(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const stageConfig = STAGE_CONFIG[currentStage];

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header — Story progress */}
      <header className="flex-shrink-0 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${stageConfig.color} flex items-center justify-center text-lg`}>
                {stageConfig.emoji}
              </div>
              <div>
                <h1 className="text-sm font-semibold text-slate-800">{stageConfig.label}</h1>
                <p className="text-xs text-slate-500">{stageConfig.description}</p>
              </div>
            </div>

            {/* Story progress dots */}
            <div className="flex items-center gap-2">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    i < storiesCompleted
                      ? 'bg-emerald-500 scale-100'
                      : i === storiesCompleted
                        ? 'bg-amber-400 scale-110 animate-pulse'
                        : 'bg-slate-200 scale-90'
                  }`}
                  title={i < storiesCompleted ? `Story ${i + 1} complete` : i === storiesCompleted ? 'Current story' : 'Upcoming'}
                />
              ))}
              <span className="text-xs text-slate-400 ml-1">
                {storiesCompleted}/3 stories
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Stage transition overlay */}
      {showStageTransition && (
        <div className="absolute inset-x-0 top-16 z-10 flex justify-center animate-fade-in-down">
          <div className={`px-6 py-3 rounded-full bg-gradient-to-r ${stageConfig.color} text-white text-sm font-medium shadow-lg`}>
            {stageConfig.emoji} {stageConfig.label}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-1">
                  A
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-slate-800 text-white rounded-br-md'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-md shadow-sm'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                {msg.content === '' && isStreaming && (
                  <div className="flex gap-1 py-1">
                    <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t border-slate-200 bg-white/90 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          {sessionEnded ? (
            <div className="text-center py-4">
              <p className="text-slate-600 text-sm mb-3">Thank you for sharing your stories! ✨</p>
              <button
                onClick={() => onSessionEnd?.(sessionId)}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-sm font-medium hover:shadow-lg transition-all"
              >
                View Your Skills Profile
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isLoading ? 'Aya is thinking...' : 'Share your story...'}
                  disabled={isLoading}
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 disabled:opacity-50 transition-all"
                  style={{ maxHeight: '120px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white flex items-center justify-center hover:shadow-lg disabled:opacity-30 disabled:hover:shadow-none transition-all flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
                </svg>
              </button>
            </form>
          )}
          {/* Skip button — always available */}
          {!sessionEnded && !isLoading && messages.length > 2 && (
            <div className="flex justify-center mt-2">
              <button
                onClick={() => sendMessage('I would like to skip this question.')}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Skip this question
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
