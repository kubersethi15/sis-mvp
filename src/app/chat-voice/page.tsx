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

// ============================================================
// VOICE CHAT — Talk to Aya
// STT: OpenAI Whisper (server-side) with browser fallback
// TTS: OpenAI nova voice with sentence chunking
// ============================================================

export default function VoiceChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showText, setShowText] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [ayaThinking, setAyaThinking] = useState('');
  const [currentStage, setCurrentStage] = useState('opening');
  const [storiesCompleted, setStoriesCompleted] = useState(0);
  const [consentGiven, setConsentGiven] = useState(false);
  const [connectionOk, setConnectionOk] = useState(true);
  const [sessionCost, setSessionCost] = useState({ stt: 0, tts: 0, llm: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const useWhisperRef = useRef(true);

  const thinkingMessages = ['Aya is listening...', 'Let me think about that...', 'Hmm, interesting...', 'Processing your story...', 'I hear you...'];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, status]);

  useEffect(() => {
    if (!isStarted) return;
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [isStarted]);

  useEffect(() => {
    if (status !== 'processing') { setAyaThinking(''); return; }
    let idx = 0;
    setAyaThinking(thinkingMessages[0]);
    const t = setInterval(() => { idx = (idx + 1) % thinkingMessages.length; setAyaThinking(thinkingMessages[idx]); }, 2500);
    return () => clearInterval(t);
  }, [status]);

  // V6.4: Connection monitoring
  useEffect(() => {
    const handleOnline = () => setConnectionOk(true);
    const handleOffline = () => setConnectionOk(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setConnectionOk(navigator.onLine);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  // V6.7: Cost tracking helper
  const trackCost = useCallback((type: 'stt' | 'tts' | 'llm', seconds?: number) => {
    setSessionCost(prev => {
      if (type === 'stt') return { ...prev, stt: prev.stt + (seconds || 5) * 0.0001 }; // $0.006/min
      if (type === 'tts') return { ...prev, tts: prev.tts + 0.002 }; // ~$0.002 per response
      if (type === 'llm') return { ...prev, llm: prev.llm + 0.03 }; // ~$0.03 per Claude call
      return prev;
    });
  }, []);

  // ============================================================
  // TTS — Aya speaks with OpenAI nova voice
  // ============================================================

  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled) return;
    setStatus('speaking');
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, chunk_mode: true }),
      });

      if (res.headers.get('content-type')?.includes('audio')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        const remaining = res.headers.get('X-Remaining-Text');

        audio.onended = async () => {
          URL.revokeObjectURL(url);
          if (remaining) {
            const decoded = decodeURIComponent(remaining);
            if (decoded.trim()) { await speakMore(decoded); return; }
          }
          setStatus('idle');
          // Auto-resume listening after Aya finishes
          setTimeout(() => { if (!isRecordingRef.current) startListening(); }, 700);
        };
        audio.onerror = () => { URL.revokeObjectURL(url); setStatus('idle'); };
        await audio.play();
        return;
      }
      // Fallback
      browserSpeak(text);
    } catch {
      browserSpeak(text);
    }
  }, [voiceEnabled]);

  const speakMore = async (text: string) => {
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.headers.get('content-type')?.includes('audio')) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          URL.revokeObjectURL(url); setStatus('idle');
          setTimeout(() => { if (!isRecordingRef.current) startListening(); }, 700);
        };
        audio.onerror = () => { URL.revokeObjectURL(url); setStatus('idle'); };
        await audio.play();
      }
    } catch { setStatus('idle'); }
  };

  const browserSpeak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) { setStatus('idle'); return; }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.92; utt.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const pref = voices.find(v => v.name.includes('Samantha') || v.name.includes('Karen') || (v.lang.startsWith('en') && v.name.toLowerCase().includes('female')));
    if (pref) utt.voice = pref;
    utt.onend = () => { setStatus('idle'); setTimeout(() => { if (!isRecordingRef.current) startListening(); }, 700); };
    utt.onerror = () => setStatus('idle');
    window.speechSynthesis.speak(utt);
  };

  const stopSpeaking = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setStatus('idle');
  };

  // ============================================================
  // STT — MediaRecorder → Whisper API (server-side)
  // ============================================================

  const startListening = useCallback(async () => {
    if (status === 'speaking' || status === 'processing' || isLoading) return;

    if (useWhisperRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 }
        });
        streamRef.current = stream;
        audioChunksRef.current = [];

        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : 'audio/webm';
        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

        recorder.onstop = async () => {
          stream.getTracks().forEach(t => t.stop());
          streamRef.current = null;
          isRecordingRef.current = false;

          if (audioChunksRef.current.length === 0) { setStatus('idle'); return; }

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (audioBlob.size < 4000) { setStatus('idle'); return; } // Skip noise

          setStatus('processing');
          setTranscript('Transcribing...');

          try {
            const form = new FormData();
            form.append('audio', audioBlob, 'recording.webm');
            const res = await fetch('/api/stt', { method: 'POST', body: form });
            const data = await res.json();
            if (data.text?.trim()) {
              setTranscript(data.text);
              sendMessage(data.text);
            } else {
              setTranscript(''); setStatus('idle');
            }
          } catch {
            setTranscript(''); setStatus('idle');
          }
        };

        mediaRecorderRef.current = recorder;
        recorder.start(250);
        isRecordingRef.current = true;
        setStatus('listening');
        setTranscript('');

        // Max 30s per recording
        silenceTimerRef.current = setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
        }, 30000);
        return;
      } catch {
        useWhisperRef.current = false;
      }
    }

    // Browser fallback
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice not supported. Use Chrome or Safari.');
      return;
    }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-PH';
    rec.onstart = () => { setStatus('listening'); isRecordingRef.current = true; };
    rec.onresult = (e: any) => { let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; setTranscript(t); };
    rec.onend = () => { isRecordingRef.current = false; if (transcript.trim()) sendMessage(transcript); else setStatus('idle'); };
    rec.onerror = () => { isRecordingRef.current = false; setStatus('idle'); };
    rec.start();
  }, [status, isLoading]);

  const stopListening = () => {
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (mediaRecorderRef.current?.state === 'recording') { mediaRecorderRef.current.stop(); }
    else { isRecordingRef.current = false; setStatus('idle'); }
  };

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  // Acknowledgment phrases — played while Aya "thinks" to fill silence
  const ACKNOWLEDGMENTS = [
    "Mm-hmm...", "I see...", "Go on...", "That's interesting...",
    "I hear you...", "Tell me more...", "Okay...", "Right...",
  ];
  const getAcknowledgment = () => ACKNOWLEDGMENTS[Math.floor(Math.random() * ACKNOWLEDGMENTS.length)];

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || !sessionId) return;
    setTranscript(''); setTextInput(''); setStatus('processing'); setIsLoading(true);

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    // Show acknowledgment while processing (V3.7)
    const ack = getAcknowledgment();
    setAyaThinking(ack);

    // Play brief acknowledgment audio if voice enabled (V3.6)
    if (voiceEnabled) {
      try {
        const ackRes = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: ack }),
        });
        if (ackRes.headers.get('content-type')?.includes('audio')) {
          const blob = await ackRes.blob();
          const url = URL.createObjectURL(blob);
          const ackAudio = new Audio(url);
          ackAudio.volume = 0.7;
          ackAudio.onended = () => URL.revokeObjectURL(url);
          await ackAudio.play().catch(() => {});
        }
      } catch { /* acknowledgment is optional */ }
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: await authHeaders(),
        body: JSON.stringify({ session_id: sessionId, message: text.trim() }),
      });
      const data = await res.json();
      setAyaThinking('');
      trackCost('llm'); // Track Claude API call cost

      // Handle distress escalation (V3 Wellbeing Protocol)
      if (data.distress_level >= 3) {
        // Crisis — Aya's response already handles this via prompt, but show visual indicator
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(), role: 'assistant',
          content: data.message, timestamp: new Date(),
        }]);
        if (voiceEnabled) await speak(data.message);
        else setStatus('idle');
        return;
      }

      // Brief pause before Aya responds (V3.6 — natural pacing)
      await new Promise(resolve => setTimeout(resolve, 400));

      const ayaMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: data.message, timestamp: new Date() };
      setMessages(prev => [...prev, ayaMsg]);

      // Store stage info for UI awareness
      if (data.stage) setCurrentStage(data.stage);
      if (data.stories_completed !== undefined) setStoriesCompleted(data.stories_completed);

      if (voiceEnabled && data.message) await speak(data.message);
      else setStatus('idle');
    } catch {
      setAyaThinking('');
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Sorry, connection issue. Try again?', timestamp: new Date() }]);
      setStatus('idle');
    } finally { setIsLoading(false); }
  }, [sessionId, isLoading, speak, voiceEnabled]);

  // ============================================================
  // SESSION
  // ============================================================

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
        body: JSON.stringify({
          session_id: startData.session_id,
          message: '[SESSION START: Greet warmly, introduce yourself as Aya. Keep it to 2-3 sentences — this is voice mode so be brief and natural. Sound like a friend, not a robot.]'
        }),
      });
      const chatData = await chatRes.json();
      setMessages([{ id: crypto.randomUUID(), role: 'assistant', content: chatData.message, timestamp: new Date() }]);
      setIsStarted(true);

      if (voiceEnabled) await speak(chatData.message);
      else setStatus('idle');
    } catch { console.error('Start failed'); }
    finally { setIsLoading(false); }
  };

  const finishSession = async () => {
    if (!sessionId) return;
    setIsLoading(true); stopSpeaking(); stopListening();
    try {
      await fetch('/api/chat', {
        method: 'POST', headers: await authHeaders(),
        body: JSON.stringify({ session_id: sessionId, message: '[USER REQUESTED END]', action: 'finish' }),
      });
      window.location.href = '/skills';
    } catch { setIsLoading(false); }
  };

  const handleMainAction = () => {
    if (status === 'listening') stopListening();
    else if (status === 'speaking') stopSpeaking();
    else if (status === 'idle' && isStarted) startListening();
  };

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const orbColor = status === 'listening' ? '#EF4444' : status === 'speaking' ? '#8B5CF6' : status === 'processing' ? '#F59E0B' : '#48BB78';
  const statusLabel = status === 'listening' ? 'Listening... tap to send' : status === 'speaking' ? 'Aya is talking...' : status === 'processing' ? (ayaThinking || 'Thinking...') : isStarted ? 'Tap to speak' : '';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0a1628 0%, #0f2035 40%, #1a0e2e 100%)' }}>

      {/* V6.1: Consent Screen */}
      {!consentGiven && !isStarted && (
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(246,173,85,0.15)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F6AD55" strokeWidth="2">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-3" style={{ color: '#F0F4F8' }}>Voice Conversation with Aya</h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              This session uses your microphone to have a voice conversation. Your audio is sent to a secure server for transcription only — it is not stored or shared.
            </p>
            <div className="space-y-2 text-left mb-6 px-4">
              {[
                'Your microphone will be used to hear what you say',
                'Audio is transcribed to text, then discarded',
                'The text conversation is saved (same as text chat)',
                'You can switch to text-only mode at any time',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-none" style={{ background: '#48BB78' }} />
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{item}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setConsentGiven(true)}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #48BB78, #38A169)', boxShadow: '0 4px 20px rgba(72,187,120,0.3)' }}>
              I Understand — Continue
            </button>
            <a href="/chat" className="block text-xs mt-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Use text chat instead →
            </a>
          </div>
        </div>
      )}

      {/* V6.4: Connection warning banner */}
      {!connectionOk && (
        <div className="px-4 py-2 text-center text-xs" style={{ background: 'rgba(239,68,68,0.15)', color: '#FCA5A5' }}>
          Connection lost — voice may not work. Check your internet.
        </div>
      )}

      {/* Main UI — only show after consent */}
      {consentGiven && (
      <>
      {/* Header */}
      <div className="flex-none px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <a href="/my-dashboard" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </a>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <div className="w-2 h-2 rounded-full" style={{ background: isStarted ? '#48BB78' : '#627D98' }} />
              <span className="text-sm font-semibold" style={{ color: '#F0F4F8', fontFamily: 'Georgia, serif' }}>Aya</span>
            </div>
            {isStarted && <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Voice · {mins}:{secs.toString().padStart(2, '0')}</p>}
          </div>
          <div className="flex items-center gap-1.5">
            {isStarted && (
              <>
                <button onClick={() => setShowText(!showText)} className="text-[10px] px-2.5 py-1 rounded-full"
                  style={{ background: showText ? 'rgba(72,187,120,0.2)' : 'rgba(255,255,255,0.06)', color: showText ? '#48BB78' : 'rgba(255,255,255,0.4)' }}>
                  {showText ? 'Text' : 'Text'}
                </button>
                <button onClick={() => setVoiceEnabled(!voiceEnabled)} className="text-[10px] px-2.5 py-1 rounded-full"
                  style={{ background: voiceEnabled ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)', color: voiceEnabled ? '#a78bfa' : 'rgba(255,255,255,0.4)' }}>
                  {voiceEnabled ? '🔊' : '🔇'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Transcript */}
      {showText && isStarted && (
        <div className="flex-none overflow-y-auto px-4 py-2 space-y-2" style={{ maxHeight: '35vh' }}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-none" style={{ background: 'linear-gradient(135deg, #F6AD55, #ED8936)' }}>
                  <span style={{ fontSize: '10px' }}>🦋</span>
                </div>
              )}
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-[13px] ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                style={{ background: msg.role === 'user' ? 'rgba(72,187,120,0.15)' : 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)' }}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {!isStarted ? (
          <div className="text-center max-w-xs">
            <div className="w-28 h-28 rounded-full mx-auto mb-8 flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #F6AD55, #ED8936, #DD6B20)', boxShadow: '0 0 60px rgba(246,173,85,0.2)' }}>
              <span style={{ fontSize: '48px' }}>🦋</span>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0F4F8', fontFamily: 'Georgia, serif' }}>Talk to Aya</h1>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Share your stories through voice. Just like talking to a friend.
            </p>
            <button onClick={startSession} disabled={isLoading}
              className="w-full py-4 rounded-2xl font-semibold text-white text-sm active:scale-95 transition-transform"
              style={{ background: isLoading ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #48BB78, #38A169)', boxShadow: isLoading ? 'none' : '0 4px 24px rgba(72,187,120,0.3)' }}>
              {isLoading ? 'Starting...' : 'Start Talking'}
            </button>
            <a href="/chat" className="block text-[11px] mt-5" style={{ color: 'rgba(255,255,255,0.25)' }}>Prefer text? →</a>
          </div>
        ) : (
          <div className="text-center w-full max-w-xs">
            {/* Orb */}
            <div className="relative mx-auto mb-6" style={{ width: '140px', height: '140px' }}>
              {(status === 'listening' || status === 'speaking') && (
                <>
                  <div className="absolute rounded-full" style={{ inset: '-12px', background: `radial-gradient(circle, ${orbColor}15 0%, transparent 70%)`, animation: 'pulse1 2s ease-in-out infinite' }} />
                  <div className="absolute rounded-full" style={{ inset: '-24px', background: `radial-gradient(circle, ${orbColor}08 0%, transparent 70%)`, animation: 'pulse2 2s ease-in-out 0.5s infinite' }} />
                </>
              )}
              {status === 'processing' && (
                <div className="absolute rounded-full" style={{ inset: '-6px', border: '2px solid transparent', borderTopColor: orbColor, borderRightColor: `${orbColor}40`, animation: 'spin 1.2s linear infinite' }} />
              )}
              <button onClick={handleMainAction} disabled={status === 'processing'}
                className="relative w-full h-full rounded-full flex items-center justify-center transition-all active:scale-95"
                style={{
                  background: status === 'listening' ? 'linear-gradient(135deg, #EF4444, #DC2626)' : status === 'speaking' ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : status === 'processing' ? 'linear-gradient(135deg, #1E3A5F, #0f2035)' : 'linear-gradient(135deg, #48BB78, #38A169)',
                  boxShadow: `0 0 40px ${orbColor}30`,
                }}>
                {status === 'listening' ? (
                  <div className="flex items-center gap-1">{[0,1,2,3,4].map(i => (<div key={i} className="w-1 rounded-full bg-white" style={{ animation: `wave 1s ease-in-out ${i*0.12}s infinite` }} />))}</div>
                ) : status === 'speaking' ? (
                  <div className="flex flex-col items-center">
                    <span style={{ fontSize: '36px' }}>🦋</span>
                    <div className="flex gap-0.5 mt-1">{[0,1,2].map(i => (<div key={i} className="w-1 h-1 rounded-full bg-white/60" style={{ animation: `speakDot 1.4s ease-in-out ${i*0.2}s infinite` }} />))}</div>
                  </div>
                ) : status === 'processing' ? (
                  <div className="flex flex-col items-center">
                    <span style={{ fontSize: '32px', opacity: 0.7 }}>🦋</span>
                    <div className="flex gap-1.5 mt-2">{[0,1,2].map(i => (<div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: orbColor, animation: `bounce 1.2s ease-in-out ${i*0.15}s infinite` }} />))}</div>
                  </div>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5"><path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
                )}
              </button>
            </div>

            <p className="text-sm font-medium mb-2" style={{ color: orbColor }}>{statusLabel}</p>

            {transcript && (status === 'listening' || status === 'processing') && (
              <div className="px-4 py-2 rounded-xl mb-3" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>{transcript}</p>
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && textInput.trim()) sendMessage(textInput); }}
                placeholder="Or type here..."
                className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }} />
              {textInput.trim() && (
                <button onClick={() => sendMessage(textInput)} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(72,187,120,0.3)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#48BB78" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom */}
      {isStarted && (
        <div className="flex-none px-4 pb-6 pt-3">
          {/* Stage progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {['opening', 'story_select', 'elicitation', 'core_probe', 'skill_probe', 'verification', 'closing'].map((stage, i) => {
              const stageLabels: Record<string, string> = {
                opening: 'Getting to know you',
                story_select: 'Choosing a story',
                elicitation: 'Tell me more',
                core_probe: 'Diving deeper',
                skill_probe: 'Exploring details',
                verification: 'Wrapping up story',
                closing: 'Finishing up',
              };
              const isActive = currentStage === stage;
              const isPast = ['opening', 'story_select', 'elicitation', 'core_probe', 'skill_probe', 'verification', 'closing'].indexOf(currentStage) > i;
              return (
                <div key={stage} className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full transition-all" style={{
                    background: isActive ? '#48BB78' : isPast ? 'rgba(72,187,120,0.4)' : 'rgba(255,255,255,0.1)',
                    boxShadow: isActive ? '0 0 6px rgba(72,187,120,0.5)' : 'none',
                  }} />
                  {isActive && (
                    <span className="text-[8px] mt-1 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {stageLabels[stage] || stage}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          {storiesCompleted > 0 && (
            <p className="text-center text-[9px] mb-2" style={{ color: 'rgba(72,187,120,0.5)' }}>
              {storiesCompleted} {storiesCompleted === 1 ? 'story' : 'stories'} shared
            </p>
          )}
          <div className="flex items-center justify-between max-w-xs mx-auto">
            <a href="/chat" className="text-[11px] px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>Text Mode</a>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{messages.filter(m => m.role === 'user').length} messages</span>
            <button onClick={finishSession} disabled={isLoading || messages.length < 4}
              className="text-[11px] px-3 py-1.5 rounded-full"
              style={{ background: messages.length >= 4 ? 'rgba(72,187,120,0.15)' : 'rgba(255,255,255,0.05)', color: messages.length >= 4 ? '#48BB78' : 'rgba(255,255,255,0.2)' }}>
              Finish →
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes pulse1 { 0%,100% { transform:scale(1); opacity:0.6; } 50% { transform:scale(1.15); opacity:0.2; } }
        @keyframes pulse2 { 0%,100% { transform:scale(1); opacity:0.4; } 50% { transform:scale(1.2); opacity:0.1; } }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes wave { 0%,100% { height:8px; } 50% { height:28px; } }
        @keyframes speakDot { 0%,100% { transform:scale(0.8); opacity:0.4; } 50% { transform:scale(1.2); opacity:1; } }
        @keyframes bounce { 0%,80%,100% { transform:scale(0); } 40% { transform:scale(1); } }
      `}</style>

      {/* Close consent wrapper */}
      </>
      )}
    </div>
  );
}
