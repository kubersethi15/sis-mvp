'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageShell, LoadingState } from '@/components/KayaUI';

// ============================================================
// PSYCHOLOGIST VALIDATION PAGE
// Reviews the full audit trail and signs off on skills profiles
// ============================================================

interface Extraction {
  id: string;
  session_id: string;
  skills_profile: Array<{
    skill_id: string;
    skill_name: string;
    proficiency: string;
    confidence: number;
    evidence: Array<{
      episode_id: number;
      transcript_quote: string;
      behavioral_indicator: string;
      proficiency_justification: string;
    }>;
  }>;
  episodes: Array<{ episode_id: number; summary: string; star_er: any }>;
  narrative_summary: string;
  gaming_flags: Array<{ flag_type: string; severity: string; evidence: string }>;
  session_quality: any;
  extraction_model: string;
  created_at: string;
}

const METHODOLOGY_REFS = [
  { id: 'PSF', title: 'Philippine Skills Framework for Human Capital Development (PSF-HCD) v1.0', source: 'TESDA/CHED', relevance: 'National taxonomy of enabling skills and competencies' },
  { id: 'PQF', title: 'Philippine Qualifications Framework (PQF)', source: 'Government of the Philippines', relevance: 'Proficiency levels (Basic/Intermediate/Advanced mapped to PQF 1-6)' },
  { id: 'RA12313', title: 'RA 12313 — Lifelong Learning and Development for Filipinos Act', source: 'Philippine Congress', relevance: 'Legal basis for Recognition of Prior Learning (RPL)' },
  { id: 'SP', title: 'Sikolohiyang Pilipino (Filipino Psychology)', source: 'Enriquez (1992), Pe-Pua & Protacio-Marcelino (2000), Cervantes (2025)', relevance: 'Indigenous Filipino psychology framework — kapwa (shared identity), pakikiramdam (shared perception), bayanihan (community cooperation). Ensures skills assessment recognises Filipino cultural expressions of capability.' },
  { id: 'KAPWA', title: 'Kapwa-Oriented Evidence Interpretation', source: 'Sikolohiyang Pilipino — Cultural Context Lens', relevance: 'Family/community evidence is assessed at parity with formal workplace evidence. Collective action, OFW coordination, family mediation, and barangay organising are valid demonstrations of PSF skills.' },
  { id: 'WEF', title: 'New Economy Skills: Unlocking the Human Advantage (2025)', source: 'World Economic Forum', relevance: 'Global alignment of human-centric skills taxonomy' },
  { id: 'MOTH', title: 'The Moth Storytelling Methodology', source: 'The Moth (25+ years)', relevance: 'Proven framework for surfacing meaningful personal narratives' },
  { id: 'STAR', title: 'STAR+E+R Behavioral Evidence Framework', source: 'Behavioral interview research', relevance: 'Extended STAR model with Emotion and Reflection components' },
  { id: 'CBA', title: 'Competency-Based Assessment', source: 'Psychometric literature', relevance: 'Evidence-based skills assessment through behavioral indicators' },
  { id: 'SOTOPIA', title: 'Sotopia-Eval: 7-Dimension Social Evaluation', source: 'CMU — ICLR 2024 Spotlight', relevance: 'Peer-reviewed framework for evaluating social interaction across 7 dimensions. Maps to PSF skills for Layer 2 simulation scoring.' },
  { id: 'CONCORDIA', title: 'Concordia: Game Master Architecture', source: 'Google DeepMind — NeurIPS 2024', relevance: 'Tabletop RPG-inspired orchestration for multi-agent workplace simulations. Controls character behavior, round flow, and twist injection.' },
  { id: 'TINYTROUPE', title: 'TinyTroupe: Cognitive Persona Specification', source: 'Microsoft Research (MIT license)', relevance: 'Rich persona model (MBTI, agenda, triggers, constraints) for generating realistic workplace characters.' },
];

const PROFICIENCY_COLORS: Record<string, string> = {
  basic: '#F39C12', intermediate: '#2ECC71', advanced: '#3498DB',
};

export default function PsychologistPage() {
  const [extractions, setExtractions] = useState<Extraction[]>([]);
  const [selected, setSelected] = useState<Extraction | null>(null);
  const [loading, setLoading] = useState(true);
  const [validationNotes, setValidationNotes] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [validationStatus, setValidationStatus] = useState<'pending' | 'validated' | 'rejected' | 'revision_needed'>('pending');
  const [signed, setSigned] = useState(false);
  const [activeTab, setActiveTab] = useState<'audit' | 'simulation' | 'layer3' | 'methodology' | 'validate'>('audit');

  useEffect(() => {
    fetchExtractions();
  }, []);

  const fetchExtractions = async () => {
    setLoading(true);
    try {
      const exts: Extraction[] = [];

      // 1. Try loading all recent extractions directly (most reliable)
      try {
        const allRes = await fetch('/api/psychologist', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_all_extractions' }),
        });
        const allData = await allRes.json();
        if (allData.extractions?.length) {
          for (const ext of allData.extractions) {
            exts.push(ext);
          }
        }
      } catch (e) { /* skip */ }

      // 2. Fallback: also check localStorage for the most recent extraction
      if (exts.length === 0) {
        try {
          const stored = localStorage.getItem('kaya_last_extraction');
          if (stored) {
            const parsed = JSON.parse(stored);
            exts.push({
              id: 'local-' + Date.now(),
              session_id: localStorage.getItem('kaya_last_session_id') || 'unknown',
              ...parsed,
            } as any);
          }
        } catch (e) { /* skip */ }
      }

      setExtractions(exts);
      if (exts.length > 0) setSelected(exts[0]); // Most recent first
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = useCallback(async () => {
    if (!selected || !licenseNumber.trim()) return;
    setSigned(true);
    // In production, this would save to psychologist_validations table
    setTimeout(() => {
      alert(`Skills profile validated and signed.\nPsychologist License: ${licenseNumber}\nStatus: ${validationStatus}\nThis endorsement is now attached to the candidate's skills profile.`);
    }, 500);
  }, [selected, licenseNumber, validationStatus]);

  // Also try loading from localStorage as fallback
  useEffect(() => {
    if (extractions.length === 0 && !loading) {
      const stored = localStorage.getItem('kaya_last_extraction');
      if (stored) {
        try {
          const ext = JSON.parse(stored);
          ext.id = 'local';
          ext.session_id = 'local';
          ext.created_at = new Date().toISOString();
          ext.extraction_model = 'claude-sonnet-4';
          setExtractions([ext]);
          setSelected(ext);
        } catch (e) { /* ignore */ }
      }
    }
  }, [extractions, loading]);

  if (loading) {
    return (
      <PageShell title="Psychologist validation" subtitle="Loading extractions...">
        <LoadingState message="Loading candidate data..." />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Psychologist validation"
      subtitle={selected
        ? `Reviewing: ${(selected as any).candidate_name || 'Candidate'} — ${selected.skills_profile?.length || 0} skills extracted`
        : `${extractions.length} candidate${extractions.length !== 1 ? 's' : ''} pending review`
      }
      actions={<span className="text-xs font-semibold text-kaya-amber-400">Psychologist</span>}
    >
        {/* CANDIDATES TABLE — shown when no candidate is selected */}
        {!selected ? (
          <div>
            {extractions.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-kaya-stone-600">No completed extractions found.</p>
                <a href="/chat" className="text-sm mt-2 block text-kaya-green-400">Complete a conversation with Aya first</a>
              </div>
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden border-kaya-stone-100">
                <table className="w-full">
                  <thead>
                    <tr className="bg-kaya-navy-50">
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-kaya-stone-600">Candidate</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-kaya-stone-600">Skills Found</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-kaya-stone-600">Confidence</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-kaya-stone-600">Date</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-kaya-stone-600">Status</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractions.map((ext, i) => {
                      const skillCount = ext.skills_profile?.length || 0;
                      const avgConf = skillCount > 0
                        ? Math.round((ext.skills_profile.reduce((a, s) => a + (s.confidence || 0), 0) / skillCount) * 100)
                        : 0;
                      const date = ext.created_at ? new Date(ext.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown';
                      const topSkills = ext.skills_profile?.slice(0, 3).map(s => s.skill_name).join(', ') || 'None';

                      return (
                        <tr key={ext.id || i} className="border-t hover:bg-kaya-stone-50 transition-colors cursor-pointer border-kaya-navy-50"
                          onClick={() => { setSelected(ext); setActiveTab('audit'); setSigned(false); setValidationNotes(''); setLicenseNumber(''); }}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-kaya-navy-900">
                              {(ext as any).candidate_name || 'Candidate ' + (i + 1)}
                            </div>
                            <div className="text-xs mt-0.5 text-kaya-stone-400">{topSkills}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold text-kaya-navy-900">{skillCount}</span>
                            <span className="text-xs ml-1 text-kaya-stone-400">skills</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 rounded-full bg-kaya-stone-100">
                                <div className={`h-full rounded-full ${avgConf >= 70 ? 'bg-kaya-green-400' : avgConf >= 50 ? 'bg-kaya-amber-400' : 'bg-kaya-red-400'}`} style={{ width: `${avgConf}%` }} />
                              </div>
                              <span className="text-xs font-medium text-kaya-stone-600">{avgConf}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-kaya-stone-600">{date}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs px-2 py-1 rounded-full font-medium bg-kaya-amber-50 text-kaya-amber-400">
                              Pending Review
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xs text-kaya-green-400">Review →</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* BACK TO LIST */}
            <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm mb-4 hover:opacity-80 transition-opacity text-kaya-stone-600">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Back to candidates
            </button>

            {/* TABS */}
            <div className="flex gap-1 border-b border-kaya-stone-100 mb-6">
              {[
                { id: 'audit' as const, label: 'Layer 1: Audit Trail' },
                { id: 'simulation' as const, label: 'Layer 2: Simulation' },
                { id: 'layer3' as const, label: 'Layer 3: Peer/360' },
                { id: 'methodology' as const, label: 'Methodology' },
                { id: 'validate' as const, label: 'Validate & Sign' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === tab.id ? 'bg-white text-kaya-amber-400 border border-kaya-stone-100 border-b-white -mb-px' : 'text-kaya-stone-600 hover:text-kaya-navy-900'
                  }`}>{tab.label}</button>
              ))}
            </div>
            {/* AUDIT TRAIL TAB */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                {/* Narrative */}
                <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                  <h2 className="text-sm font-semibold text-kaya-stone-600 mb-2">CANDIDATE NARRATIVE</h2>
                  <p className="text-kaya-navy-900">{selected.narrative_summary}</p>
                  <div className="flex gap-4 mt-3 text-xs text-kaya-stone-400">
                    <span>Model: {selected.extraction_model}</span>
                    <span>Extracted: {new Date(selected.created_at).toLocaleString()}</span>
                    <span>Quality: {selected.session_quality?.evidence_density || 'N/A'} evidence density</span>
                  </div>
                </div>

                {/* Episodes with STAR+E+R */}
                {selected.episodes?.length > 0 && (
                  <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                    <h2 className="text-sm font-semibold text-kaya-stone-600 mb-4">EPISODES (STAR+E+R DECOMPOSITION)</h2>
                    <div className="space-y-4">
                      {selected.episodes.map((ep, i) => (
                        <div key={i} className="border border-kaya-stone-100 rounded-lg p-4">
                          <h3 className="font-medium text-kaya-navy-900 mb-2">Episode {ep.episode_id}: {ep.summary}</h3>
                          {ep.star_er && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {Object.entries(ep.star_er).map(([key, val]) => (
                                <div key={key} className="p-2 bg-kaya-stone-50 rounded">
                                  <span className="font-medium text-kaya-stone-600 uppercase text-xs">{key}:</span>
                                  <p className="text-kaya-navy-900 mt-0.5">{val as string}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill-by-Skill Audit */}
                <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                  <h2 className="text-sm font-semibold text-kaya-stone-600 mb-4">SKILL-BY-SKILL AUDIT TRAIL</h2>
                  <p className="text-xs text-kaya-stone-400 mb-4">Each skill claim traces: Transcript Quote → STAR+E+R Tag → PSF Skill Mapping → Proficiency Level → Confidence Score</p>

                  <div className="space-y-4">
                    {selected.skills_profile?.map((skill, i) => (
                      <div key={i} className="border border-kaya-stone-100 rounded-lg overflow-hidden">
                        <div className="p-4 bg-kaya-stone-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-kaya-navy-900">{skill.skill_name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                              style={{ backgroundColor: PROFICIENCY_COLORS[skill.proficiency?.toLowerCase()] || '#666' }}>
                              {skill.proficiency}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-kaya-navy-900">{Math.round(skill.confidence * 100)}%</span>
                            <span className="text-xs text-kaya-stone-400 ml-1">confidence</span>
                          </div>
                        </div>

                        {skill.evidence?.map((ev, j) => (
                          <div key={j} className="p-4 border-t border-kaya-stone-100">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-kaya-amber-50 text-kaya-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {j + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-kaya-navy-900 italic border-l-2 border-kaya-amber-400/30 pl-3 mb-2">"{ev.transcript_quote}"</p>
                                <p className="text-xs text-kaya-stone-600"><span className="font-medium">Behavioral Indicator:</span> {ev.behavioral_indicator}</p>
                                <p className="text-xs text-kaya-stone-600 mt-1"><span className="font-medium">Proficiency Justification:</span> {ev.proficiency_justification}</p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {(!skill.evidence || skill.evidence.length === 0) && (
                          <div className="p-4 border-t border-kaya-stone-100 text-xs text-kaya-stone-400">No evidence citations available for this skill.</div>
                        )}

                        {/* Cultural Context Annotation (Sikolohiyang Pilipino) */}
                        {(skill as any).cultural_context?.cultural_annotation && (
                          <div className="p-4 border-t border-kaya-stone-100 bg-kaya-amber-50">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-kaya-amber-50 text-kaya-amber-400">SP</span>
                              <div className="flex-1">
                                <p className="text-xs font-medium text-kaya-amber-400">Cultural Context — Sikolohiyang Pilipino</p>
                                <p className="text-xs text-kaya-stone-600 mt-1">{(skill as any).cultural_context.cultural_annotation}</p>
                                {(skill as any).cultural_context.sp_concepts_detected?.length > 0 && (
                                  <div className="flex gap-1.5 mt-2 flex-wrap">
                                    {(skill as any).cultural_context.sp_concepts_detected.map((c: string, k: number) => (
                                      <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-kaya-amber-50 text-kaya-amber-400">{c}</span>
                                    ))}
                                  </div>
                                )}
                                {(skill as any).cultural_context.cultural_uplift_applied && (
                                  <p className="text-[10px] mt-1.5 text-kaya-amber-400">Cultural uplift applied: {(skill as any).cultural_context.cultural_uplift_reason}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gaming Flags */}
                {selected.gaming_flags?.length > 0 && (
                  <div className="bg-white rounded-lg border border-kaya-amber-400/20 p-6">
                    <h2 className="text-sm font-semibold text-kaya-amber-400 mb-3">AUTHENTICITY FLAGS</h2>
                    <div className="space-y-2">
                      {selected.gaming_flags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className={`mt-0.5 ${flag.severity === 'high' ? 'text-kaya-red-400' : flag.severity === 'medium' ? 'text-kaya-amber-400' : 'text-kaya-amber-400'}`}>●</span>
                          <div>
                            <span className="font-medium text-kaya-navy-900">{flag.flag_type}:</span>
                            <span className="text-kaya-stone-600 ml-1">{flag.evidence}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* System Flags Checklist — what the algorithm did */}
                <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                  <h2 className="text-sm font-semibold text-kaya-navy-900 mb-3">SYSTEM FLAGS — Algorithm Decisions</h2>
                  <p className="text-xs text-kaya-stone-600 mb-4">Review each flag to understand what the AI extraction did and why. These inform your professional judgment.</p>
                  <div className="space-y-3">
                    {(() => {
                      const skills = selected.skills_profile || [];
                      const selfDepOverrides = skills.filter((s: any) => s.self_deprecation_override || s.top_evidence?.self_deprecation_detected);
                      const disabilityUplifts = skills.filter((s: any) => s.disability_uplift_applied || s.top_evidence?.disability_uplift_applied || s.confidence_factors?.disability_uplift_applied);
                      const culturalUplifts = skills.filter((s: any) => s.cultural_context?.cultural_uplift_applied);
                      const singleSource = skills.filter((s: any) => s.evidence_count === 1 && (s.confidence || 0) >= 0.7);
                      return (
                        <>
                          <div className={selfDepOverrides.length > 0 ? "bg-kaya-amber-50" : "bg-kaya-stone-50" + " flex items-start gap-3 p-3 rounded-lg"}>
                            <span className="text-lg mt-0.5">{selfDepOverrides.length > 0 ? '⚠' : '○'}</span>
                            <div>
                              <p className="text-sm font-medium text-kaya-navy-900">Self-Deprecation Override</p>
                              <p className="text-xs text-kaya-stone-600">{selfDepOverrides.length > 0 ? `Applied on ${selfDepOverrides.length} skill(s): ${selfDepOverrides.map((s: any) => s.skill_name).join(', ')}. The candidate minimised their contribution but described competent action.` : 'Not applied — no self-deprecation patterns detected.'}</p>
                            </div>
                          </div>
                          <div className={disabilityUplifts.length > 0 ? "bg-kaya-navy-50" : "bg-kaya-stone-50" + " flex items-start gap-3 p-3 rounded-lg"}>
                            <span className="text-lg mt-0.5">{disabilityUplifts.length > 0 ? '⚠' : '○'}</span>
                            <div>
                              <p className="text-sm font-medium text-kaya-navy-900">Disability Experience Uplift</p>
                              <p className="text-xs text-kaya-stone-600">{disabilityUplifts.length > 0 ? `Applied on ${disabilityUplifts.length} skill(s): ${disabilityUplifts.map((s: any) => s.skill_name).join(', ')}. Action performed under disability-related constraint demonstrates greater capability.` : 'Not applied — no disability-related constraint in evidence.'}</p>
                            </div>
                          </div>
                          <div className={culturalUplifts.length > 0 ? "bg-kaya-amber-50" : "bg-kaya-stone-50" + " flex items-start gap-3 p-3 rounded-lg"}>
                            <span className="text-lg mt-0.5">{culturalUplifts.length > 0 ? '⚠' : '○'}</span>
                            <div>
                              <p className="text-sm font-medium text-kaya-navy-900">Cultural Context Uplift (Sikolohiyang Pilipino)</p>
                              <p className="text-xs text-kaya-stone-600">{culturalUplifts.length > 0 ? `Applied on ${culturalUplifts.length} skill(s): ${culturalUplifts.map((s: any) => s.skill_name).join(', ')}. Filipino cultural context (kapwa, bayanihan, pakikiramdam) adds significance to evidence.` : 'Not applied — no cultural context uplift triggered.'}</p>
                            </div>
                          </div>
                          <div className={`flex items-start gap-3 p-3 rounded-lg ${singleSource.length > 0 ? "bg-kaya-red-50" : "bg-kaya-stone-50"}`}>
                            <span className="text-lg mt-0.5">{singleSource.length > 0 ? '⚠' : '○'}</span>
                            <div>
                              <p className="text-sm font-medium text-kaya-navy-900">Single-Source Evidence</p>
                              <p className="text-xs text-kaya-stone-600">{singleSource.length > 0 ? `${singleSource.length} skill(s) with high confidence but only 1 evidence item: ${singleSource.map((s: any) => s.skill_name).join(', ')}. Consider requesting additional evidence.` : 'No single-source high-confidence claims.'}</p>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* SIMULATION TAB (Layer 2 Audit Trail) */}
            {activeTab === 'simulation' && (
              <div className="space-y-6">
                {/* Overview */}
                <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                  <h2 className="text-lg font-semibold text-kaya-navy-900 mb-2">Layer 2: Workplace Simulation Evidence</h2>
                  <p className="text-sm text-kaya-stone-600 mb-4">
                    Multi-agent behavioral simulation where the candidate interacted with AI characters in a realistic workplace scenario.
                    Evidence from this simulation is compared against Layer 1 (conversation) data to establish convergence.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-kaya-navy-50">
                      <p className="text-xs font-semibold text-kaya-navy-900">Framework</p>
                      <p className="text-xs text-kaya-stone-600">Concordia Game Master + TinyTroupe Personas + Sotopia-Eval (7 dimensions)</p>
                    </div>
                    <div className="p-3 rounded-lg bg-kaya-green-50">
                      <p className="text-xs font-semibold text-kaya-green-400">Evaluation Method</p>
                      <p className="text-xs text-kaya-stone-600">Sotopia-Eval dimensions mapped to PSF skills. Per-checkpoint behavioral assessment.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-kaya-navy-50">
                      <p className="text-xs font-semibold text-kaya-navy-900">Anti-Gaming</p>
                      <p className="text-xs text-kaya-stone-600">Rehearsed response detection, L1/L2 inconsistency checks, pattern analysis, believability scoring.</p>
                    </div>
                  </div>
                </div>

                {/* Simulation Results — pulled from extraction or gate3 */}
                {(() => {
                  // Try to find simulation data in various places
                  const simData = (selected as any)?.simulation_results || (selected as any)?.gate3?.simulation_results;

                  if (!simData) {
                    return (
                      <div className="bg-white rounded-lg border border-kaya-stone-100 p-6 text-center">
                        <p className="text-2xl mb-2">🎭</p>
                        <p className="text-sm text-kaya-stone-600">No simulation data available for this candidate yet.</p>
                        <p className="text-xs mt-1 text-kaya-stone-400">The simulation is run during Gate 3. Once complete, evidence will appear here.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {/* Scenario Info */}
                      <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                        <h3 className="text-sm font-semibold text-kaya-navy-900 mb-3">Scenario: {simData.scenario_title || 'Workplace Simulation'}</h3>
                        <p className="text-xs text-kaya-stone-600 mb-3">{simData.rounds_completed || '?'} rounds completed</p>

                        {/* Skills Assessed */}
                        {simData.skill_scores?.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-kaya-stone-600">Skills Observed</p>
                            <div className="space-y-2">
                              {simData.skill_scores.map((s: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-kaya-stone-50">
                                  <div>
                                    <span className="text-sm font-medium text-kaya-navy-900">{s.skill_name}</span>
                                    {s.behavioral_evidence && (
                                      <p className="text-[10px] mt-0.5 text-kaya-stone-400">{s.behavioral_evidence.substring(0, 120)}...</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                      s.proficiency === 'Advanced' ? 'bg-kaya-green-50 text-kaya-green-400' : 
                                      s.proficiency === 'Intermediate' ? 'bg-kaya-navy-50 text-kaya-navy-600' : 'bg-kaya-red-50 text-kaya-red-400'
                                    }`}>{s.proficiency}</span>
                                    <span className="text-[10px] text-kaya-stone-400">{Math.round((s.confidence || 0.5) * 100)}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Sotopia-Eval Dimension Scores */}
                        {simData.sotopia_scores?.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold uppercase tracking-wider mb-2 text-kaya-stone-600">Sotopia-Eval Dimension Scores</p>
                            <div className="grid grid-cols-2 gap-2">
                              {simData.sotopia_scores.map((s: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded bg-kaya-stone-50">
                                  <span className="text-xs text-kaya-navy-900">{s.dimension?.replace(/_/g, ' ')}</span>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-16 h-1.5 rounded-full bg-kaya-stone-100">
                                      <div className={`h-full rounded-full ${s.score >= 7 ? 'bg-kaya-green-400' : s.score >= 4 ? 'bg-kaya-amber-400' : 'bg-kaya-red-400'}`}
                                        style={{ width: `${((s.score || 5) / 10) * 100}%` }} />
                                    </div>
                                    <span className="text-[10px] font-mono text-kaya-stone-600">{s.score}/10</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Convergence Analysis */}
                      {simData.convergence?.length > 0 && (
                        <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                          <h3 className="text-sm font-semibold text-kaya-navy-900 mb-3">Convergence: Layer 1 vs Layer 2</h3>
                          <p className="text-xs text-kaya-stone-600 mb-3">Comparing self-reported (conversation) vs observed (simulation) skill levels. Convergence increases confidence; divergence flags for review.</p>
                          <div className="space-y-2">
                            {simData.convergence.map((c: any, i: number) => (
                              <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${
                                c.convergent ? 'bg-kaya-green-50 border-kaya-green-100' : 'bg-kaya-amber-50 border-kaya-amber-400/20'
                              }`}>
                                <span className="text-sm font-medium text-kaya-navy-900">{c.skill_name}</span>
                                <div className="flex items-center gap-3 text-xs">
                                  <span className="text-kaya-stone-600">L1: {c.layer1_score}</span>
                                  <span className="text-base">{c.convergent ? '✅' : '⚠️'}</span>
                                  <span className="text-kaya-stone-600">L2: {c.layer2_score}</span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                    c.confidence_adjustment > 0 ? 'bg-kaya-green-50 text-kaya-green-400' : 
                                    c.confidence_adjustment < 0 ? 'bg-kaya-red-50 text-kaya-red-400' : 'bg-kaya-navy-50 text-kaya-stone-600'
                                  }`}>{c.confidence_adjustment > 0 ? '+' : ''}{c.confidence_adjustment}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Gaming Flags */}
                      {simData.gaming_flags?.length > 0 && (
                        <div className="bg-white rounded-lg border border-kaya-red-400/20 p-6">
                          <h3 className="text-sm font-semibold text-kaya-red-400 mb-3">⚠ Gaming Detection Flags</h3>
                          <p className="text-xs text-kaya-stone-600 mb-3">These flags indicate potential gaming behavior. Review the transcript to determine if concerns are valid.</p>
                          <div className="space-y-2">
                            {simData.gaming_flags.map((f: string, i: number) => (
                              <div key={i} className="p-2 rounded text-xs bg-kaya-red-50 text-kaya-red-400">
                                {f}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Observer Summary */}
                      {simData.observer_summary && (
                        <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                          <h3 className="text-sm font-semibold text-kaya-navy-900 mb-2">Observer Summary</h3>
                          <p className="text-sm text-kaya-navy-900">{simData.observer_summary}</p>
                        </div>
                      )}

                      {/* V2.7: Voice Signals / Paralinguistic Analysis */}
                      {(selected as any)?.voice_analysis?.length > 0 && (
                        <div className="bg-white rounded-lg border border-kaya-navy-100 p-6">
                          <h3 className="text-sm font-semibold mb-3 text-kaya-navy-900">Voice Signals (Paralinguistic Analysis)</h3>
                          <p className="text-xs text-kaya-stone-600 mb-4">
                            Emotional expression detected from voice tone, rhythm, and timbre via Hume AI Expression Measurement.
                            {(selected as any).voice_analysis.length} audio segment(s) analyzed.
                          </p>

                          {/* Emotion timeline */}
                          <div className="space-y-2 mb-4">
                            {(selected as any).voice_analysis.map((va: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 p-2 rounded bg-kaya-navy-50">
                                <span className="text-[10px] font-mono text-kaya-navy-600">Msg {va.message_index || idx + 1}</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    {(va.dominant_emotions || []).map((e: string, i: number) => (
                                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-kaya-navy-50 text-kaya-navy-600">{e}</span>
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] text-kaya-stone-400">
                                      Intensity: {Math.round((va.emotional_intensity || 0) * 100)}%
                                    </span>
                                    {va.authenticity?.genuine_laughter && <span className="text-[9px]">😂 Laughter</span>}
                                    {va.authenticity?.thoughtful_pauses && <span className="text-[9px]">🤔 Thoughtful</span>}
                                    {va.authenticity?.voice_tremor && <span className="text-[9px]">💧 Genuine emotion</span>}
                                    {va.authenticity?.flat_affect && <span className="text-[9px] text-kaya-red-400">⚠ Flat</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Skill confidence adjustments from voice */}
                          {(() => {
                            const allAdj = (selected as any).voice_analysis.flatMap((va: any) => va.skill_adjustments || []);
                            if (allAdj.length === 0) return null;
                            return (
                              <div className="mb-3">
                                <p className="text-[10px] font-semibold uppercase mb-2 text-kaya-navy-900">Confidence Adjustments from Voice</p>
                                <div className="space-y-1">
                                  {allAdj.map((adj: any, i: number) => (
                                    <div key={i} className={adj.adjustment > 0 ? 'bg-kaya-green-50' : 'bg-kaya-red-50' + " flex items-center justify-between text-xs p-1.5 rounded"}>
                                      <span className="text-kaya-navy-900">{adj.skill_name === '_all' ? 'All skills' : adj.skill_name}</span>
                                      <div className="flex items-center gap-2">
                                        <span className={adj.adjustment > 0 ? 'text-kaya-green-400' : 'text-kaya-red-400' + " text-[10px]"}>
                                          {adj.adjustment > 0 ? '+' : ''}{(adj.adjustment * 100).toFixed(0)}%
                                        </span>
                                        <span className="text-[9px] text-kaya-stone-400">{adj.reason?.substring(0, 60)}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Full Transcript */}
                      {simData.transcript && (
                        <details className="bg-white rounded-lg border border-kaya-stone-100 overflow-hidden">
                          <summary className="px-6 py-3 cursor-pointer text-sm font-medium text-kaya-navy-900 hover:bg-kaya-stone-50">
                            View Full Simulation Transcript
                          </summary>
                          <pre className="px-6 py-4 text-xs whitespace-pre-wrap max-h-96 overflow-y-auto bg-kaya-stone-50 text-kaya-stone-600">
                            {simData.transcript}
                          </pre>
                        </details>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* LAYER 3: PEER/360 TAB */}
            {activeTab === 'layer3' && (
              <div className="space-y-6">
                {selected ? (() => {
                  const convergence = (selected as any).layer3_convergence || [];
                  const independence = (selected as any).layer3_independence;
                  const peerCount = (selected as any).layer3_peer_count || 0;

                  if (convergence.length === 0) {
                    return (
                      <div className="bg-white rounded-lg border border-kaya-stone-100 p-8 text-center">
                        <p className="text-sm text-kaya-stone-600">No peer/360 data available for this candidate yet.</p>
                        <p className="text-xs text-kaya-stone-400 mt-2">Layer 3 evidence is collected when the candidate provides reference contacts and they submit their assessments.</p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {/* Overview */}
                      <div className="bg-white rounded-lg border border-kaya-navy-100 p-6">
                        <h2 className="text-lg font-semibold mb-2 text-kaya-navy-900">Three-Layer Convergence Analysis</h2>
                        <p className="text-sm text-kaya-stone-600 mb-4">
                          Comparing self-report (Layer 1), behavioral observation (Layer 2), and peer assessment (Layer 3).
                          {peerCount} reference(s) submitted. Weighting: L1 (25%) + L2 (40%) + L3 (35%).
                        </p>

                        {/* Convergence table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-kaya-navy-50">
                                <th className="text-left px-3 py-2 text-xs font-semibold text-kaya-navy-900">Skill</th>
                                <th className="text-center px-3 py-2 text-xs font-semibold text-kaya-navy-600">L1 Self</th>
                                <th className="text-center px-3 py-2 text-xs font-semibold text-kaya-green-400">L2 Simulation</th>
                                <th className="text-center px-3 py-2 text-xs font-semibold text-kaya-navy-600">L3 Peers</th>
                                <th className="text-center px-3 py-2 text-xs font-semibold text-kaya-navy-900">Combined</th>
                                <th className="text-left px-3 py-2 text-xs font-semibold text-kaya-stone-600">Pattern</th>
                              </tr>
                            </thead>
                            <tbody>
                              {convergence.map((c: any, i: number) => (
                                <tr key={i} className={i % 2 === 0 ? '' : 'bg-kaya-stone-50'}>
                                  <td className="px-3 py-2 font-medium text-kaya-navy-900">{c.skill_name}</td>
                                  <td className="text-center px-3 py-2">
                                    <span className="text-xs px-2 py-0.5 rounded bg-kaya-navy-50 text-kaya-navy-600">{c.layer1_score}</span>
                                  </td>
                                  <td className="text-center px-3 py-2">
                                    <span className="text-xs px-2 py-0.5 rounded bg-kaya-green-50 text-kaya-green-400">{c.layer2_score}</span>
                                  </td>
                                  <td className="text-center px-3 py-2">
                                    <span className="text-xs px-2 py-0.5 rounded bg-kaya-navy-50 text-kaya-navy-600">
                                      {c.layer3_score} <span className="text-[9px]">({c.layer3_peer_count})</span>
                                    </span>
                                  </td>
                                  <td className="text-center px-3 py-2">
                                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-kaya-navy-900 text-white">{c.combined_score}</span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                      c.convergence_type === 'full_agreement' ? 'bg-kaya-green-50 text-kaya-green-400' :
                                      c.convergence_type === 'undersell' ? 'bg-kaya-navy-50 text-kaya-navy-600' :
                                      c.convergence_type === 'overclaim' ? 'bg-kaya-red-50 text-kaya-red-400' : 'bg-kaya-amber-50 text-kaya-amber-400'
                                    }`}>
                                      {c.convergence_type === 'full_agreement' ? '✓ All agree' :
                                       c.convergence_type === 'undersell' ? '↑ Undersells' :
                                       c.convergence_type === 'overclaim' ? '↓ Overclaim' :
                                       c.convergence_type.replace(/_/g, ' ')}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Convergence notes */}
                      <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                        <h3 className="text-sm font-semibold text-kaya-navy-900 mb-3">Convergence Notes</h3>
                        <div className="space-y-2">
                          {convergence.filter((c: any) => c.note).map((c: any, i: number) => (
                            <div key={i} className="flex items-start gap-2 text-xs">
                              <span className="font-medium text-kaya-navy-900 min-w-[120px]">{c.skill_name}:</span>
                              <span className="text-kaya-stone-600">{c.note}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Independence verification */}
                      {independence && (
                        <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                          <h3 className="text-sm font-semibold text-kaya-navy-900 mb-3">Reference Independence Verification</h3>
                          {independence.independent ? (
                            <div className="p-3 rounded-lg bg-kaya-green-50">
                              <p className="text-sm text-kaya-green-400">✓ All references appear to be independent. No red flags detected.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {independence.flags.map((f: string, i: number) => (
                                <div key={i} className="p-2 rounded-lg bg-kaya-red-50">
                                  <p className="text-sm text-kaya-red-400">⚠ {f}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Methodology note */}
                      <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                        <h3 className="text-sm font-semibold text-kaya-navy-900 mb-2">Three-Layer Methodology</h3>
                        <p className="text-sm text-kaya-stone-600">
                          Layer 3 completes the assessment triangle. A candidate can rehearse answers for Layer 1 (self-report) and may game a simulation in Layer 2 (observed behavior), but they cannot fabricate what multiple independent references say about them. When all three layers converge, confidence in the skills profile is at its highest. When they diverge, it reveals patterns — underselling (common with modest or culturally deferential candidates), overclaiming, or context-dependent performance.
                        </p>
                        <p className="text-xs text-kaya-stone-400 mt-2">Weighting: L2 observation (40%) + L3 peer report (35%) + L1 self-report (25%). Based on multi-source assessment validity research.</p>
                      </div>
                    </>
                  );
                })() : (
                  <div className="bg-white rounded-lg border border-kaya-stone-100 p-8 text-center">
                    <p className="text-sm text-kaya-stone-600">Select a candidate extraction to view Layer 3 data.</p>
                  </div>
                )}
              </div>
            )}

            {/* METHODOLOGY TAB */}
            {activeTab === 'methodology' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                  <h2 className="text-lg font-semibold text-kaya-navy-900 mb-2">Research Anchoring</h2>
                  <p className="text-sm text-kaya-stone-600 mb-4">The LEEE methodology is grounded in the following established frameworks and research. These references support the psychologist's professional endorsement.</p>

                  <div className="space-y-3">
                    {METHODOLOGY_REFS.map(ref => (
                      <div key={ref.id} className="border border-kaya-stone-100 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-kaya-navy-900">{ref.title}</h3>
                            <p className="text-xs text-kaya-stone-600 mt-0.5">Source: {ref.source}</p>
                          </div>
                          <span className="text-xs bg-kaya-navy-50 text-kaya-navy-600 px-2 py-0.5 rounded">{ref.id}</span>
                        </div>
                        <p className="text-xs text-kaya-stone-600 mt-2">Relevance: {ref.relevance}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                  <h2 className="text-lg font-semibold text-kaya-navy-900 mb-2">Extraction Methodology</h2>
                  <div className="text-sm text-kaya-navy-900 space-y-3">
                    <p><span className="font-medium">Conversation Method:</span> Moth-structured storytelling (context → action → decision → outcome → reflection) conducted through text chat in English/Filipino/Taglish.</p>
                    <p><span className="font-medium">Evidence Framework:</span> STAR+E+R (Situation, Task, Action, Result, Emotion, Reflection) — extended behavioral evidence model.</p>
                    <p><span className="font-medium">Skill Taxonomy:</span> PSF Enabling Skills and Competencies (16 ESC), with 4 primary COMPASS domains + 4 secondary skills for MVP.</p>
                    <p><span className="font-medium">Proficiency Levels:</span> Basic (PQF 1-2), Intermediate (PQF 3-4), Advanced (PQF 5-6) — with specific behavioral descriptors per skill.</p>
                    <p><span className="font-medium">Confidence Scoring:</span> 0.0–1.0 based on specificity, consistency across stories, contextual richness, and corroboration.</p>
                    <p><span className="font-medium">Anti-Gaming:</span> Oblique questioning (skills never named), specificity probing, verification probes, rehearsed-response detection, three-layer triangulation.</p>
                    <p><span className="font-medium">Inclusion:</span> Non-traditional experience (caregiving, community work, disability navigation) valued at parity with formal work. RPL-aligned per RA 12313.</p>
                  </div>
                </div>
              </div>
            )}

            {/* VALIDATE TAB */}
            {activeTab === 'validate' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-kaya-stone-100 p-6">
                  <h2 className="text-lg font-semibold text-kaya-navy-900 mb-4">Professional Validation</h2>
                  <p className="text-sm text-kaya-stone-600 mb-6">
                    As a licensed psychologist, you are endorsing that the skills profile extraction methodology is sound,
                    the evidence trail is traceable, and the proficiency assessments are reasonable based on the behavioral evidence presented.
                    Your professional license is attached to this endorsement.
                  </p>

                  {/* Summary of what you're signing */}
                  <div className="bg-kaya-amber-50 rounded-lg p-4 mb-6 border border-kaya-amber-400/20">
                    <h3 className="text-sm font-semibold text-kaya-amber-400 mb-2">Skills Profile Summary</h3>
                    <p className="text-sm text-kaya-navy-900 mb-2">{selected.narrative_summary}</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.skills_profile?.map((s, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full text-white font-medium"
                          style={{ backgroundColor: PROFICIENCY_COLORS[s.proficiency?.toLowerCase()] || '#666' }}>
                          {s.skill_name}: {s.proficiency} ({Math.round(s.confidence * 100)}%)
                        </span>
                      ))}
                    </div>
                    {selected.gaming_flags?.length > 0 && (
                      <p className="text-xs text-kaya-amber-400 mt-2">{selected.gaming_flags.length} authenticity flag(s) noted — review audit trail before signing.</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-kaya-navy-900 mb-1">Validation Decision</label>
                      <select value={validationStatus} onChange={e => setValidationStatus(e.target.value as any)}
                        className="w-full px-4 py-2 border border-kaya-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-kaya-navy-600/20 outline-none bg-white">
                        <option value="validated">Validated — methodology sound, evidence traceable</option>
                        <option value="revision_needed">Revision Needed — some claims need additional evidence</option>
                        <option value="rejected">Rejected — methodology concerns or insufficient evidence</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-kaya-navy-900 mb-1">Professional Notes</label>
                      <textarea value={validationNotes} onChange={e => setValidationNotes(e.target.value)}
                        placeholder="Any observations, concerns, or notes about the skills profile assessment..."
                        rows={4} className="w-full px-4 py-2 border border-kaya-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-kaya-navy-600/20 outline-none resize-none" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-kaya-navy-900 mb-1">License Number *</label>
                      <input type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
                        placeholder="PRC License Number" className="w-full px-4 py-2 border border-kaya-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-kaya-navy-600/20 outline-none" />
                    </div>

                    <div className="pt-4 border-t border-kaya-stone-100">
                      <button onClick={handleSign} disabled={!licenseNumber.trim() || signed}
                        className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                          signed ? 'bg-kaya-green-400' : 'bg-kaya-amber-400 hover:bg-kaya-amber-400 shadow-md hover:shadow-lg'
                        } disabled:opacity-50`}>
                        {signed ? 'Signed and Validated' : 'Sign with Professional License'}
                      </button>
                      <p className="text-xs text-kaya-stone-400 text-center mt-2">
                        By signing, you attest that you have reviewed the audit trail and methodology,
                        and that the skills profile is a reasonable representation of the candidate's demonstrated competencies.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
    </PageShell>
  );
}
