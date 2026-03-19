'use client';

import { useState } from 'react';

interface ScenarioOption {
  text: string;
  signal: string;
  proficiency_signal?: string;
}

interface Scenario {
  scenario: string;
  scenario_label: string;
  options: ScenarioOption[];
  target_skill: string;
  psf_skill_tested?: string;
  pqf_level_tested?: string;
  aya_reaction_template: string;
}

interface ScenarioCardProps {
  scenario: Scenario;
  onComplete: (chosenOption: ScenarioOption, ayaReaction: string) => void;
}

const SKILL_LABELS: Record<string, string> = {
  EQ: 'Emotional Intelligence', COMM: 'Communication', COLLAB: 'Collaboration',
  PS: 'Problem-Solving', ADAPT: 'Adaptability', LEARN: 'Learning Agility',
  EMPATHY: 'Empathy', DIGITAL: 'Digital Fluency',
};

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function ScenarioCard({ scenario, onComplete }: ScenarioCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleSelect = (idx: number) => {
    if (confirmed) return;
    setSelected(idx);
  };

  const handleConfirm = () => {
    if (selected === null || confirmed) return;
    setConfirmed(true);
    const chosen = scenario.options[selected];
    // Brief pause then call onComplete so Aya can react
    setTimeout(() => {
      onComplete(chosen, scenario.aya_reaction_template);
    }, 1200);
  };

  return (
    <div
      className="w-full my-4"
      style={{ animation: 'scenarioSlideIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
    >
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1a1035 0%, #0d1f2d 100%)',
          border: '1px solid rgba(244,162,97,0.3)',
          boxShadow: '0 8px 32px rgba(244,162,97,0.1)',
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div
              className="px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
              style={{ background: 'rgba(244,162,97,0.15)', color: '#F4A261', fontFamily: 'system-ui, sans-serif' }}
            >
              Quick scenario
            </div>
            <div
              className="px-3 py-1 rounded-full text-[10px] font-medium"
              style={{ background: 'rgba(42,157,143,0.15)', color: '#2A9D8F', fontFamily: 'system-ui, sans-serif' }}
            >
              {scenario.scenario_label}
            </div>
            {(scenario as any).psf_skill_tested && (
              <div
                className="px-3 py-1 rounded-full text-[10px] font-medium"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui, sans-serif' }}
              >
                PSF: {(scenario as any).psf_skill_tested}
              </div>
            )}
            {scenario.psf_skill_tested && (
              <div
                className="px-2 py-0.5 rounded-full text-[9px] font-medium"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', fontFamily: 'system-ui, sans-serif' }}
              >
                PSF: {scenario.psf_skill_tested}
              </div>
            )}
          </div>

          <p
            className="text-sm leading-relaxed"
            style={{ color: '#c8c8e8', fontFamily: "'Georgia', serif", fontSize: '0.95rem' }}
          >
            {scenario.scenario}
          </p>

          <p
            className="text-xs mt-3"
            style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'system-ui, sans-serif' }}
          >
            What would you do?
          </p>
        </div>

        {/* Options */}
        <div className="px-4 pb-2 space-y-2">
          {scenario.options.map((option, idx) => {
            const isSelected = selected === idx;
            const isConfirmed = confirmed && isSelected;
            const isDimmed = confirmed && !isSelected;

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={confirmed}
                className="w-full text-left px-4 py-3 rounded-2xl transition-all duration-300 flex items-start gap-3"
                style={{
                  background: isConfirmed
                    ? 'rgba(244,162,97,0.2)'
                    : isSelected
                      ? 'rgba(244,162,97,0.12)'
                      : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isConfirmed ? '#F4A261' : isSelected ? 'rgba(244,162,97,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  opacity: isDimmed ? 0.3 : 1,
                  transform: isSelected && !confirmed ? 'scale(1.01)' : 'scale(1)',
                }}
              >
                <span
                  className="flex-none w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                  style={{
                    background: isSelected ? '#F4A261' : 'rgba(255,255,255,0.08)',
                    color: isSelected ? '#0a0a0f' : 'rgba(255,255,255,0.4)',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {isConfirmed ? '✓' : OPTION_LETTERS[idx]}
                </span>
                <span
                  className="text-sm leading-relaxed"
                  style={{
                    color: isSelected ? '#e8e8f8' : 'rgba(255,255,255,0.6)',
                    fontFamily: 'system-ui, sans-serif',
                  }}
                >
                  {option.text}
                </span>
              </button>
            );
          })}
        </div>

        {/* Confirm button */}
        <div className="px-4 pb-5 pt-2">
          {!confirmed ? (
            <button
              onClick={handleConfirm}
              disabled={selected === null}
              className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
              style={{
                background: selected !== null
                  ? 'linear-gradient(135deg, #F4A261, #E76F51)'
                  : 'rgba(255,255,255,0.05)',
                color: selected !== null ? '#fff' : 'rgba(255,255,255,0.2)',
                fontFamily: 'system-ui, sans-serif',
                cursor: selected !== null ? 'pointer' : 'not-allowed',
              }}
            >
              {selected !== null ? 'Go with this →' : 'Pick an option above'}
            </button>
          ) : (
            <div
              className="text-center text-xs py-2"
              style={{ color: '#2A9D8F', fontFamily: 'system-ui, sans-serif', animation: 'fadeInUp 0.4s ease-out' }}
            >
              ✓ Got it — let me respond to that...
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scenarioSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
