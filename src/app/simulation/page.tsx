'use client';

import { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// ============================================================
// TYPES
// ============================================================

interface CharacterInfo {
  id: string;
  name: string;
  role: string;
  relationship: string;
}

interface CharMessage {
  character_id: string;
  character_name: string;
  message: string;
  tone: string;
  addressed_to: string;
}

interface CheckpointData {
  skills_evaluated: { skill_name: string; proficiency: string; confidence: number }[];
  observer_narrative: string;
}

interface ScenarioInfo {
  id: string;
  title: string;
  setting: string;
  opening_situation: string;
  duration_rounds: number;
  characters: CharacterInfo[];
  target_skills: string[];
}

// Character colors — consistent per character position
const CHAR_COLORS = [
  { bg: '#E8F8F5', text: '#1A9C78', border: '#A3E4D7', avatar: '#1A9C78' },
  { bg: '#EBF5FB', text: '#2471A3', border: '#AED6F1', avatar: '#2471A3' },
  { bg: '#F4ECF7', text: '#7D3C98', border: '#D2B4DE', avatar: '#7D3C98' },
  { bg: '#FEF5E7', text: '#CA6F1E', border: '#F5CBA7', avatar: '#CA6F1E' },
  { bg: '#FDEDEC', text: '#C0392B', border: '#F5B7B1', avatar: '#C0392B' },
];

const TONE_INDICATORS: Record<string, string> = {
  frustrated: '😤',
  calm: '😌',
  helpful: '🤝',
  confused: '😕',
  urgent: '⚡',
  supportive: '💚',
  dismissive: '😒',
  anxious: '😰',
  relieved: '😊',
};

// ============================================================
// COMPONENT
// ============================================================

export default function SimulationPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1929', color: '#829AB1' }}>Loading simulation...</div>}>
      <SimulationPage />
    </Suspense>
  );
}

function SimulationPage() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('app') || null;
  
  const [phase, setPhase] = useState<'intro' | 'active' | 'checkpoint' | 'complete'>('intro');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioInfo | null>(null);
  const [messages, setMessages] = useState<Array<{ type: 'character' | 'candidate' | 'system'; character?: CharMessage; text?: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [checkpoint, setCheckpoint] = useState<CheckpointData | null>(null);
  const [report, setReport] = useState<any>(null);
  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string>('scenario_customer_escalation');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Character color lookup
  const getCharColor = useCallback((charId: string) => {
    if (!scenario) return CHAR_COLORS[0];
    const idx = scenario.characters.findIndex(c => c.id === charId);
    return CHAR_COLORS[idx >= 0 ? idx % CHAR_COLORS.length : 0];
  }, [scenario]);

  const getCharInitials = (name: string) => name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  // ============================================================
  // START SIMULATION
  // ============================================================

  const startSimulation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulation-l2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          scenario_id: selectedScenario,
          application_id: applicationId,
        }),
      });
      const data = await res.json();

      if (data.session_id) {
        setSessionId(data.session_id);
        setScenario(data.scenario);
        setCurrentRound(data.current_round);
        setTotalRounds(data.total_rounds);

        // Add system message with opening situation
        setMessages([
          { type: 'system', text: data.scenario.opening_situation },
          ...data.opening_messages.map((m: CharMessage) => ({ type: 'character' as const, character: m })),
        ]);

        setPhase('active');
      } else {
        alert('Failed to start simulation: ' + (data.error || 'Unknown error'));
      }
    } catch (e) {
      console.error('Start error:', e);
      alert('Failed to start simulation. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedScenario]);

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const sendMessage = useCallback(async () => {
    if (!input.trim() || !sessionId || loading) return;

    const text = input.trim();
    setInput('');
    setMessages(prev => [...prev, { type: 'candidate', text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/simulation-l2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond',
          session_id: sessionId,
          message: text,
        }),
      });
      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, { type: 'system', text: `Error: ${data.error}` }]);
        setLoading(false);
        return;
      }

      // Add character responses with staggered animation feel
      const newMsgs = data.character_messages.map((m: CharMessage) => ({
        type: 'character' as const,
        character: m,
      }));
      setMessages(prev => [...prev, ...newMsgs]);
      setCurrentRound(data.current_round);

      // Handle checkpoint
      if (data.checkpoint) {
        setCheckpoint(data.checkpoint);
        setPhase('checkpoint');
      }

      // Handle completion
      if (data.is_complete) {
        await completeSimulation();
      }
    } catch (e) {
      console.error('Send error:', e);
      setMessages(prev => [...prev, { type: 'system', text: 'Connection issue. Try sending again.' }]);
    } finally {
      setLoading(false);
    }
  }, [input, sessionId, loading]);

  // ============================================================
  // COMPLETE SIMULATION
  // ============================================================

  const completeSimulation = useCallback(async () => {
    if (!sessionId) return;

    try {
      const res = await fetch('/api/simulation-l2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete',
          session_id: sessionId,
          application_id: applicationId,
        }),
      });
      const data = await res.json();

      if (data.report) {
        setReport(data.report);
        setPhase('complete');
      }
    } catch (e) {
      console.error('Complete error:', e);
    }
  }, [sessionId]);

  // Keyboard handling
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ============================================================
  // RENDER: INTRO SCREEN
  // ============================================================

  if (phase === 'intro') {
    return (
      <div className="min-h-screen" style={{ background: '#0B1929' }}>
        <nav className="px-4 sm:px-6 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <a href="/my-dashboard" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#1E3A5F' }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#48BB78' }} />
            </div>
            <span className="text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#F0F4F8' }}>kaya</span>
          </a>
          <a href="/my-dashboard" className="text-xs" style={{ color: '#627D98' }}>← Dashboard</a>
        </nav>

        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: 'rgba(72,187,120,0.15)', border: '1px solid rgba(72,187,120,0.2)' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: '#48BB78' }} />
              <span className="text-xs font-medium" style={{ color: '#48BB78' }}>Layer 2: Workplace Simulation</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: '#F0F4F8' }}>Show what you can do</h1>
            <p className="text-sm leading-relaxed" style={{ color: '#829AB1' }}>
              You'll enter a realistic workplace scenario with AI characters. Respond naturally — there are no right or wrong answers. We're observing how you handle the situation.
            </p>
          </div>

          {/* Scenario Selection */}
          <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#BCCCDC' }}>Choose a Scenario</h2>
            <div className="space-y-3">
              {[
                { id: 'scenario_customer_escalation', title: 'Customer Escalation', desc: 'Handle a frustrated customer at the branch counter', skills: 'Communication, Emotional Intelligence, Problem-Solving', duration: '~12 min', icon: '🏪' },
                { id: 'scenario_team_coordination', title: 'Team Coordination Under Pressure', desc: 'System is down, customers are waiting, team disagrees', skills: 'Collaboration, Adaptability, Decision Making', duration: '~12 min', icon: '👥' },
                { id: 'scenario_onboarding', title: 'Onboarding & Knowledge Transfer', desc: 'First week, trainer leaves, customer needs help', skills: 'Learning Agility, Communication, Work Ethic', duration: '~10 min', icon: '📋' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenario(s.id)}
                  className="w-full text-left p-4 rounded-xl transition-all"
                  style={{
                    background: selectedScenario === s.id ? 'rgba(72,187,120,0.1)' : 'rgba(255,255,255,0.02)',
                    border: selectedScenario === s.id ? '1px solid rgba(72,187,120,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{s.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: selectedScenario === s.id ? '#48BB78' : '#BCCCDC' }}>{s.title}</div>
                      <div className="text-xs mt-1" style={{ color: '#627D98' }}>{s.desc}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: '#829AB1' }}>{s.skills}</span>
                        <span className="text-[10px]" style={{ color: '#627D98' }}>{s.duration}</span>
                      </div>
                    </div>
                    {selectedScenario === s.id && (
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#48BB78' }}>
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* What to Expect */}
          <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#BCCCDC' }}>What to Expect</h2>
            <div className="space-y-2">
              {[
                'You\'ll interact with 3 AI characters in a workplace scenario',
                'Characters have their own personalities and agendas',
                'Respond naturally in English, Taglish, or Filipino',
                'There will be twists — the situation will evolve',
                'An observer evaluates your behavior (you won\'t see this during the simulation)',
                '5-6 rounds, approximately 10-12 minutes',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-none" style={{ background: '#48BB78' }} />
                  <span className="text-xs" style={{ color: '#829AB1' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={startSimulation}
            disabled={loading}
            className="w-full py-4 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: loading ? '#1E3A5F' : 'linear-gradient(135deg, #48BB78, #38A169)',
              color: 'white',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? 'Setting up scenario...' : 'Start Simulation →'}
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: CHECKPOINT
  // ============================================================

  if (phase === 'checkpoint' && checkpoint) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B1929' }}>
        <div className="max-w-lg mx-auto px-6 text-center">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(72,187,120,0.15)' }}>
            <span className="text-2xl">📋</span>
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: '#F0F4F8' }}>Checkpoint Evaluation</h2>
          <p className="text-xs mb-6" style={{ color: '#829AB1' }}>{checkpoint.observer_narrative}</p>

          <div className="space-y-2 mb-6">
            {checkpoint.skills_evaluated.map((s, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-sm font-medium" style={{ color: '#BCCCDC' }}>{s.skill_name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: s.proficiency === 'Advanced' ? 'rgba(72,187,120,0.15)' : s.proficiency === 'Intermediate' ? 'rgba(46,134,193,0.15)' : 'rgba(230,126,34,0.15)',
                    color: s.proficiency === 'Advanced' ? '#48BB78' : s.proficiency === 'Intermediate' ? '#5DADE2' : '#E67E22',
                  }}>{s.proficiency}</span>
                  <div className="w-12 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <div className="h-full rounded-full" style={{
                      width: `${Math.round((s.confidence || 0.5) * 100)}%`,
                      background: s.proficiency === 'Advanced' ? '#48BB78' : s.proficiency === 'Intermediate' ? '#5DADE2' : '#E67E22',
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setPhase('active')}
            className="px-8 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(72,187,120,0.15)', color: '#48BB78', border: '1px solid rgba(72,187,120,0.3)' }}
          >
            Continue Simulation →
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: COMPLETE
  // ============================================================

  if (phase === 'complete' && report) {
    return (
      <div className="min-h-screen" style={{ background: '#0B1929' }}>
        <nav className="px-4 sm:px-6 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <a href="/my-dashboard" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#1E3A5F' }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#48BB78' }} />
            </div>
            <span className="text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#F0F4F8' }}>kaya</span>
          </a>
        </nav>

        <div className="max-w-2xl mx-auto px-6 py-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(72,187,120,0.15)' }}>
              <span className="text-3xl">✨</span>
            </div>
            <h1 className="text-xl font-bold mb-2" style={{ color: '#F0F4F8' }}>Simulation Complete</h1>
            <p className="text-sm" style={{ color: '#829AB1' }}>{report.scenario_title} — {report.rounds_completed} rounds</p>
          </div>

          {/* Skills Observed */}
          <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 className="text-sm font-semibold mb-4" style={{ color: '#BCCCDC' }}>Skills Observed</h2>
            <div className="space-y-3">
              {(report.skill_scores || []).map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: '#BCCCDC' }}>{s.skill_name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{
                      background: s.proficiency === 'Advanced' ? 'rgba(72,187,120,0.15)' : s.proficiency === 'Intermediate' ? 'rgba(46,134,193,0.15)' : 'rgba(230,126,34,0.15)',
                      color: s.proficiency === 'Advanced' ? '#48BB78' : s.proficiency === 'Intermediate' ? '#5DADE2' : '#E67E22',
                    }}>{s.proficiency}</span>
                    <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="h-full rounded-full transition-all duration-1000" style={{
                        width: `${Math.round((s.confidence || 0.5) * 100)}%`,
                        background: s.proficiency === 'Advanced' ? '#48BB78' : s.proficiency === 'Intermediate' ? '#5DADE2' : '#E67E22',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Convergence (if available) */}
          {report.convergence?.length > 0 && (
            <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-sm font-semibold mb-4" style={{ color: '#BCCCDC' }}>Layer 1 ↔ Layer 2 Convergence</h2>
              <div className="space-y-2">
                {report.convergence.map((c: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <span className="text-xs" style={{ color: '#829AB1' }}>{c.skill_name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: '#627D98' }}>L1: {c.layer1_score}</span>
                      <span style={{ color: c.convergent ? '#48BB78' : '#E67E22' }}>{c.convergent ? '✓' : '⚠'}</span>
                      <span className="text-[10px]" style={{ color: '#627D98' }}>L2: {c.layer2_score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observer Summary */}
          {report.observer_summary && (
            <div className="rounded-2xl p-6 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <h2 className="text-sm font-semibold mb-3" style={{ color: '#BCCCDC' }}>Observer Summary</h2>
              <p className="text-xs leading-relaxed" style={{ color: '#829AB1' }}>{report.observer_summary}</p>
            </div>
          )}

          <div className="flex gap-3">
            <a href="/my-dashboard" className="flex-1 py-3 rounded-xl text-center text-sm font-medium" style={{ background: 'rgba(255,255,255,0.04)', color: '#829AB1', border: '1px solid rgba(255,255,255,0.08)' }}>
              Back to Dashboard
            </a>
            <a href="/skills" className="flex-1 py-3 rounded-xl text-center text-sm font-medium" style={{ background: 'rgba(72,187,120,0.15)', color: '#48BB78', border: '1px solid rgba(72,187,120,0.3)' }}>
              View Skills Profile →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER: ACTIVE SIMULATION (Main Chat Interface)
  // ============================================================

  return (
    <div className="h-screen flex flex-col" style={{ background: '#0B1929' }}>
      {/* Header */}
      <div className="flex-none px-4 sm:px-6 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/my-dashboard" className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#1E3A5F' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: '#48BB78' }} />
              </div>
              <span className="text-base tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#F0F4F8' }}>kaya</span>
            </a>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(72,187,120,0.15)', color: '#48BB78' }}>Simulation</span>
          </div>

          {/* Round Counter */}
          <div className="flex items-center gap-3">
            <div className="text-xs" style={{ color: '#627D98' }}>
              Round {currentRound} of {totalRounds}
            </div>
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div className="h-full rounded-full transition-all duration-500" style={{
                width: `${totalRounds > 0 ? (currentRound / totalRounds) * 100 : 0}%`,
                background: 'linear-gradient(90deg, #48BB78, #38A169)',
              }} />
            </div>
          </div>
        </div>

        {/* Character Roster */}
        {scenario && (
          <div className="flex items-center gap-3 mt-2">
            {scenario.characters.map((char, i) => {
              const color = CHAR_COLORS[i % CHAR_COLORS.length];
              return (
                <div key={char.id} className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: color.avatar }}>
                    {getCharInitials(char.name)}
                  </div>
                  <div>
                    <span className="text-[10px] font-medium" style={{ color: '#BCCCDC' }}>{char.name}</span>
                    <span className="text-[9px] ml-1" style={{ color: '#627D98' }}>{char.role}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
        {messages.map((msg, i) => {
          if (msg.type === 'system') {
            return (
              <div key={i} className="flex justify-center">
                <div className="px-4 py-2.5 rounded-xl max-w-lg text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-xs leading-relaxed" style={{ color: '#829AB1' }}>{msg.text}</span>
                </div>
              </div>
            );
          }

          if (msg.type === 'candidate') {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-xs sm:max-w-md px-4 py-3 rounded-2xl rounded-br-md" style={{ background: 'rgba(72,187,120,0.15)', border: '1px solid rgba(72,187,120,0.2)' }}>
                  <span className="text-sm" style={{ color: '#E6FFED' }}>{msg.text}</span>
                </div>
              </div>
            );
          }

          if (msg.type === 'character' && msg.character) {
            const char = msg.character;
            const color = getCharColor(char.character_id);
            const toneIcon = TONE_INDICATORS[char.tone] || '';

            return (
              <div key={i} className="flex items-start gap-2.5" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-none mt-0.5" style={{ background: color.avatar }}>
                  {getCharInitials(char.character_name)}
                </div>
                <div className="max-w-xs sm:max-w-md">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold" style={{ color: color.text }}>{char.character_name}</span>
                    {char.addressed_to !== 'candidate' && char.addressed_to !== 'everyone' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.05)', color: '#627D98' }}>
                        → {char.addressed_to}
                      </span>
                    )}
                    {toneIcon && <span className="text-xs">{toneIcon}</span>}
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.08)` }}>
                    <span className="text-sm" style={{ color: '#D4DEE8' }}>{char.message}</span>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-none" style={{ background: '#1E3A5F' }}>
              <div className="w-2 h-2 rounded-full" style={{ background: '#48BB78' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{
                    background: '#48BB78',
                    opacity: 0.6,
                    animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-none px-4 sm:px-6 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'; }}
            onKeyDown={handleKeyDown}
            placeholder="Type your response..."
            rows={1}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl text-sm resize-none outline-none"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#F0F4F8',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: input.trim() && !loading ? '#48BB78' : 'rgba(255,255,255,0.05)',
              color: input.trim() && !loading ? 'white' : '#627D98',
            }}
          >
            Send
          </button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px]" style={{ color: '#486581' }}>
            {scenario?.title} · Round {currentRound}/{totalRounds} · {scenario?.characters.length} characters
          </span>
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes bounce { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1.0); } }
      `}</style>
    </div>
  );
}
