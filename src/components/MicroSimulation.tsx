'use client';

import { useState, useRef } from 'react';

interface SimulationData {
  simulation_id: string;
  title: string;
  psf_skill_tested: string;
  pqf_level: string;
  setting: string;
  opening_line: string;
  character_name: string;
  character_role: string;
  character_instruction: string;
  extraction_focus: string;
  max_rounds: number;
}

interface SimExchange {
  role: 'character' | 'user';
  text: string;
  skill_signals?: string[];
  evidence_note?: string;
}

interface Props {
  simulation: SimulationData;
  onComplete: (evidence: string, exchanges: SimExchange[]) => void;
}

export default function MicroSimulation({ simulation, onComplete }: Props) {
  const [exchanges, setExchanges] = useState<SimExchange[]>([
    { role: 'character', text: simulation.opening_line },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState(1);
  const [complete, setComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!input.trim() || loading || complete) return;
    const userText = input.trim();
    setInput('');

    const updated: SimExchange[] = [...exchanges, { role: 'user', text: userText }];
    setExchanges(updated);
    setLoading(true);

    try {
      const res = await fetch('/api/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond',
          user_response: userText,
          simulation_state: {
            character_name: simulation.character_name,
            character_role: simulation.character_role,
            setting: simulation.setting,
            character_instruction: simulation.character_instruction,
            current_round: round,
            max_rounds: simulation.max_rounds,
            history: updated.map(e => ({ role: e.role, text: e.text })),
          },
        }),
      });
      const data = await res.json();
      if (data.response) {
        const charMsg: SimExchange = {
          role: 'character',
          text: data.response.character_response,
          skill_signals: data.response.skill_signals,
          evidence_note: data.response.evidence_note,
        };
        const allExchanges = [...updated, charMsg];
        setExchanges(allExchanges);
        setRound(r => r + 1);

        if (data.response.is_final_round) {
          setComplete(true);
          const evidenceStr = `[SIMULATION EVIDENCE] Role-play: "${simulation.title}" | Setting: ${simulation.setting} | PSF Skill Tested: ${simulation.psf_skill_tested} | PQF Level: ${simulation.pqf_level} | Character: ${simulation.character_name} (${simulation.character_role}) | Exchanges: ${allExchanges.map(e => `${e.role}: "${e.text}"`).join(' → ')} | Skills Detected: ${(data.response.skill_signals || []).join(', ')} | Evidence: ${data.response.evidence_note || 'N/A'}`;
          setTimeout(() => onComplete(evidenceStr, allExchanges), 3000);
        }
      }
    } catch (e) {
      console.error('Simulation error:', e);
      setComplete(true);
      setTimeout(() => onComplete('', updated), 2000);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  return (
    <div className="w-full my-4" style={{ animation: 'scenarioSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
      <div className="rounded-3xl overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0d1f2d 0%, #1a0e2e 100%)',
        border: '1px solid rgba(139,92,246,0.3)',
        boxShadow: '0 8px 32px rgba(139,92,246,0.1)',
      }}>
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
              style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontFamily: 'system-ui, sans-serif' }}>
              Role-Play
            </div>
            <div className="px-3 py-1 rounded-full text-[10px] font-medium"
              style={{ background: 'rgba(42,157,143,0.15)', color: '#2A9D8F', fontFamily: 'system-ui, sans-serif' }}>
              {simulation.title}
            </div>
            <div className="px-3 py-1 rounded-full text-[10px] font-medium"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui, sans-serif' }}>
              PSF: {simulation.psf_skill_tested}
            </div>
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'system-ui, sans-serif' }}>
            {simulation.setting}
          </p>
        </div>

        {/* Exchanges */}
        <div className="px-5 pb-3 space-y-3">
          {exchanges.map((ex, i) => (
            <div key={i} className={`flex ${ex.role === 'user' ? 'justify-end' : 'justify-start'}`}
              style={{ animation: `messageIn 0.3s ease-out ${i * 0.1}s both` }}>
              {ex.role === 'character' && (
                <div className="flex items-start gap-2 max-w-[85%]">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-none mt-1"
                    style={{ background: 'rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                    {simulation.character_name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    {i === 0 && (
                      <p className="text-[10px] mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {simulation.character_name} · {simulation.character_role}
                      </p>
                    )}
                    <div className="px-3 py-2 rounded-2xl rounded-bl-md text-sm"
                      style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', fontFamily: 'system-ui, sans-serif' }}>
                      {ex.text}
                    </div>
                  </div>
                </div>
              )}
              {ex.role === 'user' && (
                <div className="px-3 py-2 rounded-2xl rounded-br-md text-sm max-w-[85%]"
                  style={{ background: 'rgba(139,92,246,0.25)', color: '#e8e8f8', fontFamily: 'system-ui, sans-serif' }}>
                  {ex.text}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: 'rgba(139,92,246,0.3)', color: '#a78bfa' }}>
                {simulation.character_name?.charAt(0) || 'C'}
              </div>
              <div className="flex gap-1">
                {[0,1,2].map(j => (
                  <div key={j} className="w-1.5 h-1.5 rounded-full"
                    style={{ background: '#a78bfa', animation: `aya-bounce 1.2s ease-in-out ${j*0.15}s infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input or done */}
        {!complete ? (
          <div className="px-4 pb-4 pt-1">
            <div className="flex gap-2">
              <input ref={inputRef} type="text" value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Type your response..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-2xl text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)', fontFamily: 'system-ui, sans-serif' }}
                autoFocus />
              <button onClick={handleSend} disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                style={{ background: input.trim() ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(139,92,246,0.3)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={input.trim() ? '#a78bfa' : 'rgba(255,255,255,0.2)'} strokeWidth="2">
                  <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-center mt-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Round {round} of {simulation.max_rounds} · Respond as yourself
            </p>
          </div>
        ) : (
          <div className="px-5 pb-5 pt-2 text-center">
            <div className="px-4 py-3 rounded-2xl" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <p className="text-xs font-medium" style={{ color: '#a78bfa' }}>Role-play complete</p>
              <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Aya is noting how you handled that...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
