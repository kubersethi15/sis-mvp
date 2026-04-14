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
// VOICE CHAT PAGE — Rebuilt for natural conversation feel
// STT: OpenAI Whisper (server-side) with browser fallback
// TTS: OpenAI nova voice with sentence chunking
// UX: Auto-listen, silence detection, smooth turn-taking
// ============================================================

export default function VoiceChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(true);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [whisperAvailable, setWhisperAvailable] = useState(true);
  const [autoListen, setAutoListen] = useState(true);
  const [amplitude, setAmplitude] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Timer
  useEffect(() => {
    if (!isStarted) return;
    const start = Date.now();
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, [isStarted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  // ============================================================
  // AUDIO RECORDING — captures audio for Whisper
  // ============================================================

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 },
      });
      streamRef.current = stream;

      // Set up amplitude analysis for visual feedback
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Animate amplitude
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const updateAmplitude = () => {
        analyser.getByteFrequencyData(dataArray as any);
        const avg = Array.from(dataArray).reduce((a, b) => a + b, 0) / dataArray.length;
        setAmplitude(avg / 255);
        animFrameRef.current = requestAnimationFrame(updateAmplitude);
      };
      updateAmplitude();

      // MediaRecorder for Whisper
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(250); // Collect data every 250ms
      mediaRecorderRef.current = recorder;
      setStatus('listening');
      setLiveTranscript('');

      // Silence detection — auto-stop after 2.5s of silence
      startSilenceDetection(analyser, dataArray);

    } catch (e: any) {
      console.error('Mic error:', e);
      if (e.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access in your browser settings.');
      }
    }
  }, []);

  const startSilenceDetection = (analyser: AnalyserNode, dataArray: Uint8Array) => {
    let silentFrames = 0;
    const SILENCE_THRESHOLD = 8;
    const FRAMES_FOR_SILENCE = 25;

    const check = () => {
      if (mediaRecorderRef.current?.state !== 'recording') return;

      analyser.getByteFrequencyData(dataArray as any);
      const avg = Array.from(dataArray).reduce((a, b) => a + b, 0) / dataArray.length;

      if (avg < SILENCE_THRESHOLD) {
        silentFrames++;
        if (silentFrames >= FRAMES_FOR_SILENCE && audioChunksRef.current.length > 0) {
          // Silence detected — auto-stop and send
          stopRecordingAndSend();
          return;
        }
      } else {
        silentFrames = 0; // Reset on speech
      }

      silenceTimerRef.current = setTimeout(check, 100);
    };
    check();
  };

  const stopRecordingAndSend = useCallback(async () => {
    // Stop silence detection
    if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    if (animFrameRef.current) { cancelAnimationFrame(animFrameRef.current); animFrameRef.current = null; }

    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== 'recording') return;

    setStatus('processing');
    setAmplitude(0);

    // Stop recording and get audio
    return new Promise<void>((resolve) => {
      recorder.onstop = async () => {
        // Stop mic stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        audioChunksRef.current = [];

        if (audioBlob.size < 1000) {
          // Too short — probably just noise
          setStatus('idle');
          resolve();
          return;
        }

        // Send to Whisper for transcription
        const transcript = await transcribeWithWhisper(audioBlob);

        if (transcript && transcript.trim()) {
          setLiveTranscript(transcript);
          await sendMessage(transcript);
        } else {
          setStatus('idle');
        }
        resolve();
      };
      recorder.stop();
    });
  }, []);

  // ============================================================
  // WHISPER STT — server-side transcription
  // ============================================================

  const transcribeWithWhisper = async (audioBlob: Blob): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const res = await fetch('/api/stt', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.fallback) {
        setWhisperAvailable(false);
        return ''; // Will fall back to browser STT
      }

      return data.text || '';
    } catch (e) {
      console.error('Whisper STT error:', e);
      setWhisperAvailable(false);
      return '';
    }
  };

  // ============================================================
  // TTS — OpenAI nova voice with sentence chunking
  // ============================================================

  const speak = useCallback(async (text: string) => {
    if (!voiceEnabled) { setStatus('idle'); return; }
    setStatus('speaking');

    try {
      // Request first chunk immediately for fast response
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

        // Check if there's more to speak
        const remaining = decodeURIComponent(res.headers.get('X-Remaining-Text') || '');

        audio.onended = async () => {
          URL.revokeObjectURL(url);
          if (remaining && remaining.trim()) {
            // Speak remaining text
            await speakChunk(remaining);
          } else {
            finishSpeaking();
          }
        };
        audio.onerror = () => { URL.revokeObjectURL(url); finishSpeaking(); };
        await audio.play();
        return;
      }

      // Fallback — browser TTS
      fallbackSpeak(text);
    } catch (e) {
      console.log('TTS failed, using browser fallback');
      fallbackSpeak(text);
    }
  }, [voiceEnabled]);

  const speakChunk = async (text: string) => {
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
        audio.onended = () => { URL.revokeObjectURL(url); finishSpeaking(); };
        audio.onerror = () => { URL.revokeObjectURL(url); finishSpeaking(); };
        await audio.play();
      } else {
        finishSpeaking();
      }
    } catch {
      finishSpeaking();
    }
  };

  const finishSpeaking = useCallback(() => {
    setStatus('idle');
    // Auto-listen after Aya finishes speaking
    if (autoListen && isStarted) {
      setTimeout(() => {
        if (mediaRecorderRef.current?.state !== 'recording') {
          startRecording();
        }
      }, 800); // Brief pause before listening again
    }
  }, [autoListen, isStarted, startRecording]);

  const fallbackSpeak = (text: string) => {
    if (!window.speechSynthesis) { setStatus('idle'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.05;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Samantha') || v.name.includes('Karen') ||
      (v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
    );
    if (preferred) utterance.voice = preferred;
    utterance.onend = () => finishSpeaking();
    utterance.onerror = () => finishSpeaking();
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current = null; }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setStatus('idle');
  };

  // ============================================================
  // SEND MESSAGE to Aya
  // ============================================================

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || !sessionId) return;
    setLiveTranscript('');
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
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: 'assistant',
        content: 'Sorry, I had a connection issue. Can you say that again?',
        timestamp: new Date(),
      }]);
      setStatus('idle');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isLoading, speak, voiceEnabled]);

  // ============================================================
  // SESSION MANAGEMENT
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
        body: JSON.stringify({ session_id: startData.session_id, message: '[SESSION START: Please greet the user warmly, introduce yourself as Aya, and begin Phase 1 of the conversation. Keep your greeting to 2-3 sentences — warm and natural, like meeting someone for coffee.]' }),
      });
      const chatData = await chatRes.json();

      const ayaMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: chatData.message, timestamp: new Date() };
      setMessages([ayaMsg]);
      setIsStarted(true);

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

  // ============================================================
  // TEXT INPUT — for typing when voice isn't possible
  // ============================================================

  const [textInput, setTextInput] = useState('');
  const handleTextSend = () => {
    if (textInput.trim() && !isLoading) {
      sendMessage(textInput.trim());
      setTextInput('');
    }
  };

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  // Orb visual properties based on state
  const orbGradient = status === 'listening'
    ? 'radial-gradient(circle, #FF6B6B 0%, #C0392B 70%)'
    : status === 'speaking'
    ? 'radial-gradient(circle, #BB86FC 0%, #7C3AED 70%)'
    : status === 'processing'
    ? 'radial-gradient(circle, #FFB347 0%, #E67E22 70%)'
    : 'radial-gradient(circle, #69DB7C 0%, #2B8A3E 70%)';

  const orbScale = status === 'listening' ? 1 + amplitude * 0.4 : status === 'speaking' ? 1.05 : 1;
  const orbShadow = status === 'listening'
    ? `0 0 ${30 + amplitude * 60}px rgba(255,107,107,${0.3 + amplitude * 0.4})`
    : status === 'speaking'
    ? '0 0 40px rgba(187,134,252,0.4)'
    : status === 'processing'
    ? '0 0 30px rgba(255,179,71,0.3)'
    : '0 0 25px rgba(105,219,124,0.3)';

  const statusLabel = status === 'listening' ? 'Listening...'
    : status === 'speaking' ? 'Aya is talking...'
    : status === 'processing' ? 'Thinking...'
    : 'Tap to talk';

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #080E1A 0%, #0F1B2D 40%, #1A0F2E 100%)' }}>
      {/* Header */}
      <div className="flex-none px-5 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <a href="/my-dashboard" className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </a>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: '#F0F4F8', fontFamily: 'Georgia, serif' }}>Aya</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {isStarted ? `${mins}:${secs.toString().padStart(2, '0')}` : 'Voice Mode'}
              {!whisperAvailable && isStarted && ' · Browser mic'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {isStarted && (
              <>
                <button onClick={() => setShowTranscript(!showTranscript)}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: showTranscript ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={showTranscript ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)'} strokeWidth="2">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </button>
                <button onClick={() => setAutoListen(!autoListen)}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: autoListen ? 'rgba(105,219,124,0.2)' : 'rgba(255,255,255,0.05)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={autoListen ? '#69DB7C' : 'rgba(255,255,255,0.3)'} strokeWidth="2">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Transcript area — scrollable messages */}
      {showTranscript && isStarted && (
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3" style={{ maxHeight: 'calc(100vh - 340px)' }}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full flex-none flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #F6AD55, #ED8936)' }}>
                  <span style={{ fontSize: '12px' }}>🦋</span>
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                style={{
                  background: msg.role === 'user' ? 'rgba(105,219,124,0.15)' : 'rgba(255,255,255,0.06)',
                  border: msg.role === 'user' ? '1px solid rgba(105,219,124,0.2)' : '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.85)',
                }}>
                {msg.content}
              </div>
            </div>
          ))}
          {/* Live transcript while listening */}
          {liveTranscript && status === 'listening' && (
            <div className="flex justify-end">
              <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm"
                style={{ background: 'rgba(105,219,124,0.08)', border: '1px dashed rgba(105,219,124,0.2)', color: 'rgba(255,255,255,0.5)' }}>
                {liveTranscript}...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Voice interaction area */}
      <div className={`flex flex-col items-center justify-center px-5 ${showTranscript && isStarted ? '' : 'flex-1'}`}
        style={{ minHeight: showTranscript && isStarted ? '260px' : '100%' }}>

        {!isStarted ? (
          /* ===== WELCOME SCREEN ===== */
          <div className="text-center">
            <div className="relative mx-auto mb-8">
              {/* Ambient glow */}
              <div className="absolute inset-0 w-36 h-36 rounded-full mx-auto" style={{
                background: 'radial-gradient(circle, rgba(246,173,85,0.15) 0%, transparent 70%)',
                transform: 'translate(-50%, -50%)', left: '50%', top: '50%',
                filter: 'blur(20px)',
              }} />
              <div className="relative w-28 h-28 rounded-full mx-auto flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #F6AD55, #ED8936)', boxShadow: '0 0 50px rgba(246,173,85,0.3)' }}>
                <span style={{ fontSize: '44px' }}>🦋</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#F0F4F8', fontFamily: 'Georgia, serif' }}>Talk with Aya</h1>
            <p className="text-sm mb-8 max-w-xs mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Have a conversation. Share your stories. Aya listens, responds, and helps discover the skills hidden in your experiences.
            </p>
            <button onClick={startSession} disabled={isLoading}
              className="px-10 py-4 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95"
              style={{
                background: isLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #48BB78, #38A169)',
                boxShadow: isLoading ? 'none' : '0 4px 25px rgba(72,187,120,0.35)',
              }}>
              {isLoading ? 'Connecting...' : 'Start Conversation'}
            </button>
            <p className="text-[10px] mt-5" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Uses your microphone · English, Filipino, or Taglish
            </p>
          </div>
        ) : (
          /* ===== ACTIVE SESSION — ORB + CONTROLS ===== */
          <div className="text-center">
            {/* The Orb */}
            <div className="relative mb-5">
              {/* Outer ambient pulse */}
              {(status === 'listening' || status === 'speaking') && (
                <div className="absolute rounded-full" style={{
                  width: '140px', height: '140px',
                  left: '50%', top: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: orbGradient,
                  opacity: 0.08,
                  animation: 'orbPulse 2s ease-in-out infinite',
                }} />
              )}
              {/* Main orb button */}
              <button
                onClick={() => {
                  if (status === 'listening') stopRecordingAndSend();
                  else if (status === 'speaking') stopSpeaking();
                  else if (status === 'idle') startRecording();
                }}
                disabled={status === 'processing'}
                className="relative w-24 h-24 rounded-full flex items-center justify-center transition-transform duration-150 active:scale-90 mx-auto"
                style={{
                  background: orbGradient,
                  transform: `scale(${orbScale})`,
                  boxShadow: orbShadow,
                  transition: 'transform 0.1s ease-out, box-shadow 0.2s ease-out',
                }}>
                {status === 'listening' ? (
                  /* Animated bars */
                  <div className="flex items-end gap-1 h-7">
                    {[0,1,2,3,4].map(i => (
                      <div key={i} className="w-1 rounded-full bg-white" style={{
                        height: `${8 + amplitude * 20 + Math.sin(Date.now() / 200 + i) * 4}px`,
                        opacity: 0.8 + amplitude * 0.2,
                        transition: 'height 0.1s ease-out',
                      }} />
                    ))}
                  </div>
                ) : status === 'speaking' ? (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 010 14.14" opacity="0.5"/><path d="M15.54 8.46a5 5 0 010 7.07"/>
                  </svg>
                ) : status === 'processing' ? (
                  <div className="flex gap-1.5">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-white" style={{ animation: `dotBounce 1.2s ease-in-out ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                ) : (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                )}
              </button>
            </div>

            <p className="text-sm font-medium mb-1" style={{ color: status === 'listening' ? '#FF6B6B' : status === 'speaking' ? '#BB86FC' : status === 'processing' ? '#FFB347' : '#69DB7C' }}>
              {statusLabel}
            </p>
            <p className="text-[10px] mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {status === 'listening' ? 'Speak naturally — I\'ll detect when you pause' :
               status === 'idle' && autoListen ? 'Auto-listen is on' : ''}
            </p>

            {/* Text input fallback */}
            <div className="flex items-center gap-2 max-w-sm mx-auto">
              <input type="text" placeholder="Or type here..."
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleTextSend(); }}
                disabled={isLoading || status === 'speaking'}
                className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)' }}
              />
              {textInput.trim() && (
                <button onClick={handleTextSend} disabled={isLoading}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
                  style={{ background: 'rgba(105,219,124,0.3)', border: '1px solid rgba(105,219,124,0.3)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#69DB7C" strokeWidth="2"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/></svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar */}
      {isStarted && (
        <div className="flex-none px-5 pb-6 pt-2">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <a href="/chat" className="text-[10px] px-3 py-1.5 rounded-full transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
              Switch to Text
            </a>
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              {messages.filter(m => m.role === 'user').length} messages
            </span>
            <button onClick={finishSession} disabled={isLoading || messages.length < 4}
              className="text-[10px] px-3 py-1.5 rounded-full transition-all"
              style={{ background: messages.length >= 4 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', color: messages.length >= 4 ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)' }}>
              Finish & See Skills →
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx global>{`
        @keyframes orbPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.08; }
          50% { transform: translate(-50%, -50%) scale(1.4); opacity: 0.03; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
}
