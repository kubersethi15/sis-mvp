'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const authHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (data?.session?.access_token) h['Authorization'] = `Bearer ${data.session.access_token}`;
  return h;
};

interface Message { id: string; role: 'user' | 'assistant'; content: string; timestamp: Date; }

export default function VoiceChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showText, setShowText] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  // Timer
  useEffect(() => {
    if (!isStarted) return;
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [isStarted]);

  // Init speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Speak text using browser TTS (fallback) or server TTS
  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled) return;
    setStatus('speaking');

    try {
      // Try server TTS first
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.headers.get('content-type')?.includes('audio')) {
        // Server returned audio
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => { setStatus('idle'); URL.revokeObjectURL(url); };
        audio.onerror = () => { setStatus('idle'); fallbackSpeak(text); };
        await audio.play();
        return;
      }
    } catch (e) {
      console.log('Server TTS failed, using browser');
    }

    // Browser TTS fallback
    fallbackSpeak(text);
  }, [voiceEnabled]);

  const fallbackSpeak = (text: string) => {
    if (!synthRef.current) { setStatus('idle'); return; }
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    // Try to find a female English voice
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v => v.name.includes('Samantha') || v.name.includes('Karen') || v.name.includes('Moira') || (v.lang.startsWith('en') && v.name.toLowerCase().includes('female')));
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => setStatus('idle');
    utterance.onerror = () => setStatus('idle');
    synthRef.current.speak(utterance);
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (synthRef.current) synthRef.current.cancel();
    setStatus('idle');
  };

  // Start listening
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input not supported in this browser. Use Chrome, Edge, or Safari.');
      return;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-PH'; // English Philippines — handles Taglish well
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setStatus('listening');

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interimText += event.results[i][0].transcript;
        }
      }
      setTranscript(finalText || interimText);
    };

    recognition.onend = () => {
      // Auto-send if we have final text
      if (recognitionRef.current?._finalText) {
        sendMessage(recognitionRef.current._finalText);
        recognitionRef.current._finalText = null;
      }
      setStatus(prev => prev === 'listening' ? 'idle' : prev);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setStatus('idle');
      if (event.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone in browser settings.');
      }
    };

    recognitionRef.current = recognition;
    setTranscript('');
    recognition.start();
  }, []);

  // Stop listening and send
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current._finalText = transcript;
      recognitionRef.current.stop();
    }
  };

  // Send message to Aya
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || !sessionId) return;
    setTranscript('');
    setStatus('processing');
    setIsLoading(true);

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({ session_id: sessionId, message: text.trim() }),
      });
      const data = await res.json();

      const ayaMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: data.message, timestamp: new Date() };
      setMessages(prev => [...prev, ayaMsg]);

      // Speak Aya's response
      if (voiceEnabled && data.message) {
        await speak(data.message);
      } else {
        setStatus('idle');
      }
    } catch (e) {
      console.error('Send error:', e);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Sorry, connection issue. Try again.', timestamp: new Date() }]);
      setStatus('idle');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading, speak, voiceEnabled]);

  // Start session
  const startSession = async () => {
    setIsLoading(true);
    try {
      const profileId = localStorage.getItem('kaya_jobseeker_profile_id');
      const userId = localStorage.getItem('kaya_user_id');
      const headers = await authHeaders();

      const startRes = await fetch('/api/chat', {
        method: 'POST', headers,
        body: JSON.stringify({ action: 'start', language: 'en', jobseeker_profile_id: profileId || undefined, user_id: userId || undefined }),
      });
      const startData = await startRes.json();
      setSessionId(startData.session_id);
      localStorage.setItem('kaya_last_session_id', startData.session_id);

      const chatRes = await fetch('/api/chat', {
        method: 'POST', headers: await authHeaders(),
        body: JSON.stringify({ session_id: startData.session_id, message: '[SESSION START: Please greet the user warmly, introduce yourself as Aya, and begin Phase 1 of the conversation.]' }),
      });
      const chatData = await chatRes.json();

      const ayaMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: chatData.message, timestamp: new Date() };
      setMessages([ayaMsg]);
      setIsStarted(true);

      // Speak the greeting
      if (voiceEnabled) {
        await speak(chatData.message);
      } else {
        setStatus('idle');
      }
    } catch (e) {
      console.error('Failed to start:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Finish session
  const finishSession = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    stopSpeaking();
    try {
      await fetch('/api/chat', {
        method: 'POST', headers: await authHeaders(),
        body: JSON.stringify({ session_id: sessionId, message: '[USER REQUESTED END]', action: 'finish' }),
      });
      window.location.href = '/skills';
    } catch (e) {
      console.error(e);
      setIsLoading(false);
    }
  };

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  // Pulse animation for mic states
  const pulseColor = status === 'listening' ? '#EF4444' : status === 'speaking' ? '#8B5CF6' : status === 'processing' ? '#F59E0B' : '#48BB78';
  const statusText = status === 'listening' ? 'Listening...' : status === 'speaking' ? 'Aya is speaking...' : status === 'processing' ? 'Thinking...' : 'Tap to speak';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #0a1628 0%, #102A43 50%, #1a0e2e 100%)' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <a href="/my-dashboard" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>‹</span>
          </a>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: '#F0F4F8' }}>Aya</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Voice Mode · {mins}:{secs.toString().padStart(2, '0')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowText(!showText)} className="text-[10px] px-2 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
              {showText ? 'Hide Text' : 'Show Text'}
            </button>
            <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="text-[10px] px-2 py-1 rounded-full"
              style={{ background: voiceEnabled ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.1)', color: voiceEnabled ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>
              {voiceEnabled ? 'Voice On' : 'Voice Off'}
            </button>
          </div>
        </div>
      </div>

      {/* Messages — scrollable area */}
      {showText && (
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-none mt-1"
                  style={{ background: 'linear-gradient(135deg, #F6AD55, #ED8936)' }}>
                  <span style={{ fontSize: '14px' }}>🦋</span>
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}
                style={{
                  background: msg.role === 'user' ? 'rgba(72,187,120,0.2)' : 'rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.85)',
                  fontFamily: "'Nunito', sans-serif",
                }}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Voice visualization area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4" style={{ minHeight: showText ? '200px' : '400px' }}>
        {!isStarted ? (
          /* Welcome screen */
          <div className="text-center">
            <div className="w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F6AD55, #ED8936)', boxShadow: '0 0 40px rgba(246,173,85,0.3)' }}>
              <span style={{ fontSize: '40px' }}>🦋</span>
            </div>
            <h1 className="text-xl font-bold mb-2" style={{ color: '#F0F4F8', fontFamily: 'Georgia, serif' }}>Talk to Aya</h1>
            <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Share your stories through voice. Aya will listen and respond naturally.
            </p>
            <button onClick={startSession} disabled={isLoading}
              className="px-8 py-3.5 rounded-2xl font-semibold text-white text-sm transition-all"
              style={{ background: isLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #48BB78, #38A169)', boxShadow: '0 4px 20px rgba(72,187,120,0.3)' }}>
              {isLoading ? 'Starting...' : 'Start Voice Session'}
            </button>
            <p className="text-[10px] mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Uses your microphone · Works best on Chrome or Safari
            </p>
          </div>
        ) : (
          /* Active session — mic button + status */
          <div className="text-center">
            {/* Animated orb */}
            <div className="relative mb-4">
              {/* Outer pulse ring */}
              {(status === 'listening' || status === 'speaking') && (
                <div className="absolute inset-0 w-32 h-32 rounded-full mx-auto"
                  style={{ background: pulseColor, opacity: 0.15, animation: 'voicePulse 1.5s ease-in-out infinite', transform: 'translate(-50%, -50%)', left: '50%', top: '50%' }} />
              )}
              {/* Main button */}
              <button
                onClick={() => {
                  if (status === 'listening') { stopListening(); }
                  else if (status === 'speaking') { stopSpeaking(); }
                  else if (status === 'idle') { startListening(); }
                }}
                disabled={status === 'processing'}
                className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all mx-auto"
                style={{
                  background: status === 'listening' ? 'linear-gradient(135deg, #EF4444, #DC2626)'
                    : status === 'speaking' ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)'
                    : status === 'processing' ? 'linear-gradient(135deg, #F59E0B, #D97706)'
                    : 'linear-gradient(135deg, #48BB78, #38A169)',
                  boxShadow: `0 0 30px ${pulseColor}44`,
                }}>
                {status === 'listening' ? (
                  /* Stop icon */
                  <div className="w-6 h-6 rounded-sm" style={{ background: 'white' }} />
                ) : status === 'speaking' ? (
                  /* Speaker waves */
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14"/><path d="M15.54 8.46a5 5 0 010 7.07"/>
                  </svg>
                ) : status === 'processing' ? (
                  /* Loading dots */
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-white" style={{ animation: `aya-bounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                ) : (
                  /* Mic icon */
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                )}
              </button>
            </div>

            <p className="text-sm font-medium mb-1" style={{ color: pulseColor }}>{statusText}</p>

            {/* Live transcript */}
            {transcript && status === 'listening' && (
              <div className="px-4 py-2 rounded-xl mt-2 max-w-sm mx-auto" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{transcript}</p>
              </div>
            )}

            {/* Text input fallback */}
            <div className="mt-4 flex items-center gap-2 max-w-sm mx-auto">
              <input type="text" placeholder="Or type here..."
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && transcript.trim()) { sendMessage(transcript); } }}
                className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}
              />
              <button onClick={() => { if (transcript.trim()) sendMessage(transcript); }}
                disabled={!transcript.trim() || isLoading}
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: transcript.trim() ? 'rgba(72,187,120,0.4)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(72,187,120,0.3)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={transcript.trim() ? '#48BB78' : 'rgba(255,255,255,0.2)'} strokeWidth="2">
                  <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      {isStarted && (
        <div className="px-4 pb-6 pt-2">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <a href="/chat" className="text-[10px] px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              Switch to Text
            </a>
            <button onClick={finishSession} disabled={isLoading || messages.length < 4}
              className="text-[10px] px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.06)', color: messages.length >= 4 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)' }}>
              Finish →
            </button>
          </div>
        </div>
      )}

      {/* CSS animations */}
      <style jsx global>{`
        @keyframes voicePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
          50% { transform: translate(-50%, -50%) scale(1.3); opacity: 0.05; }
        }
        @keyframes aya-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
}
