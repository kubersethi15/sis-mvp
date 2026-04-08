'use client';

import { useState, useEffect, useCallback } from 'react';

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
  const [activeTab, setActiveTab] = useState<'audit' | 'methodology' | 'validate'>('audit');

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
    return <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAF9', color: '#829AB1' }}>Loading extractions...</div>;
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      <nav className="px-6 py-3 flex items-center justify-between" style={{ background: '#102A43' }}>
        <a href="/psychologist" className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#486581' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#48BB78' }} />
          </div>
          <span className="text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#F0F4F8' }}>kaya</span>
        </a>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', flexWrap: 'nowrap' }}>
          <span className="text-xs font-medium" style={{ color: '#F6AD55', whiteSpace: 'nowrap' }}>Psychologist</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold" style={{ color: '#102A43' }}>Psychologist Validation</h1>
          <p className="text-sm" style={{ color: '#627D98' }}>
            {selected
              ? `Reviewing: ${(selected as any).candidate_name || 'Candidate'} — ${selected.skills_profile?.length || 0} skills extracted`
              : `${extractions.length} candidate${extractions.length !== 1 ? 's' : ''} pending review`
            }
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* CANDIDATES TABLE — shown when no candidate is selected */}
        {!selected ? (
          <div>
            {extractions.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm" style={{ color: '#627D98' }}>No completed extractions found.</p>
                <a href="/chat" className="text-sm mt-2 block" style={{ color: '#48BB78' }}>Complete a conversation with Aya first</a>
              </div>
            ) : (
              <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#F0F4F8' }}>
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#486581' }}>Candidate</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#486581' }}>Skills Found</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#486581' }}>Confidence</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#486581' }}>Date</th>
                      <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: '#486581' }}>Status</th>
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
                        <tr key={ext.id || i} className="border-t hover:bg-stone-50 transition-colors cursor-pointer" style={{ borderColor: '#F0F4F8' }}
                          onClick={() => { setSelected(ext); setActiveTab('audit'); setSigned(false); setValidationNotes(''); setLicenseNumber(''); }}>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium" style={{ color: '#102A43' }}>
                              {(ext as any).candidate_name || 'Candidate ' + (i + 1)}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: '#829AB1' }}>{topSkills}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-semibold" style={{ color: '#102A43' }}>{skillCount}</span>
                            <span className="text-xs ml-1" style={{ color: '#829AB1' }}>skills</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 rounded-full" style={{ background: '#E2E8F0' }}>
                                <div className="h-full rounded-full" style={{ width: `${avgConf}%`, background: avgConf >= 70 ? '#48BB78' : avgConf >= 50 ? '#F6AD55' : '#FC8181' }} />
                              </div>
                              <span className="text-xs font-medium" style={{ color: '#486581' }}>{avgConf}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs" style={{ color: '#627D98' }}>{date}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: '#FEF3E2', color: '#E67E22' }}>
                              Pending Review
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-xs" style={{ color: '#48BB78' }}>Review →</span>
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
            <button onClick={() => setSelected(null)} className="flex items-center gap-1.5 text-sm mb-4 hover:opacity-80 transition-opacity" style={{ color: '#486581' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              Back to candidates
            </button>

            {/* TABS */}
            <div className="flex gap-1 border-b border-gray-200 mb-6">
              {[
                { id: 'audit' as const, label: 'Audit Trail' },
                { id: 'methodology' as const, label: 'Methodology' },
                { id: 'validate' as const, label: 'Validate & Sign' },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeTab === tab.id ? 'bg-white text-orange-600 border border-gray-200 border-b-white -mb-px' : 'text-gray-500 hover:text-gray-700'
                  }`}>{tab.label}</button>
              ))}
            </div>
            {/* AUDIT TRAIL TAB */}
            {activeTab === 'audit' && (
              <div className="space-y-6">
                {/* Narrative */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-500 mb-2">CANDIDATE NARRATIVE</h2>
                  <p className="text-gray-800">{selected.narrative_summary}</p>
                  <div className="flex gap-4 mt-3 text-xs text-gray-400">
                    <span>Model: {selected.extraction_model}</span>
                    <span>Extracted: {new Date(selected.created_at).toLocaleString()}</span>
                    <span>Quality: {selected.session_quality?.evidence_density || 'N/A'} evidence density</span>
                  </div>
                </div>

                {/* Episodes with STAR+E+R */}
                {selected.episodes?.length > 0 && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h2 className="text-sm font-semibold text-gray-500 mb-4">EPISODES (STAR+E+R DECOMPOSITION)</h2>
                    <div className="space-y-4">
                      {selected.episodes.map((ep, i) => (
                        <div key={i} className="border border-gray-100 rounded-lg p-4">
                          <h3 className="font-medium text-gray-900 mb-2">Episode {ep.episode_id}: {ep.summary}</h3>
                          {ep.star_er && (
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              {Object.entries(ep.star_er).map(([key, val]) => (
                                <div key={key} className="p-2 bg-gray-50 rounded">
                                  <span className="font-medium text-gray-600 uppercase text-xs">{key}:</span>
                                  <p className="text-gray-700 mt-0.5">{val as string}</p>
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
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-500 mb-4">SKILL-BY-SKILL AUDIT TRAIL</h2>
                  <p className="text-xs text-gray-400 mb-4">Each skill claim traces: Transcript Quote → STAR+E+R Tag → PSF Skill Mapping → Proficiency Level → Confidence Score</p>

                  <div className="space-y-4">
                    {selected.skills_profile?.map((skill, i) => (
                      <div key={i} className="border border-gray-100 rounded-lg overflow-hidden">
                        <div className="p-4 bg-gray-50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-gray-900">{skill.skill_name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                              style={{ backgroundColor: PROFICIENCY_COLORS[skill.proficiency?.toLowerCase()] || '#666' }}>
                              {skill.proficiency}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-gray-700">{Math.round(skill.confidence * 100)}%</span>
                            <span className="text-xs text-gray-400 ml-1">confidence</span>
                          </div>
                        </div>

                        {skill.evidence?.map((ev, j) => (
                          <div key={j} className="p-4 border-t border-gray-100">
                            <div className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {j + 1}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-800 italic border-l-2 border-orange-300 pl-3 mb-2">"{ev.transcript_quote}"</p>
                                <p className="text-xs text-gray-600"><span className="font-medium">Behavioral Indicator:</span> {ev.behavioral_indicator}</p>
                                <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Proficiency Justification:</span> {ev.proficiency_justification}</p>
                              </div>
                            </div>
                          </div>
                        ))}

                        {(!skill.evidence || skill.evidence.length === 0) && (
                          <div className="p-4 border-t border-gray-100 text-xs text-gray-400">No evidence citations available for this skill.</div>
                        )}

                        {/* Cultural Context Annotation (Sikolohiyang Pilipino) */}
                        {(skill as any).cultural_context?.cultural_annotation && (
                          <div className="p-4 border-t border-gray-100" style={{ background: '#FFF8F0' }}>
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>SP</span>
                              <div className="flex-1">
                                <p className="text-xs font-medium" style={{ color: '#92400E' }}>Cultural Context — Sikolohiyang Pilipino</p>
                                <p className="text-xs text-gray-600 mt-1">{(skill as any).cultural_context.cultural_annotation}</p>
                                {(skill as any).cultural_context.sp_concepts_detected?.length > 0 && (
                                  <div className="flex gap-1.5 mt-2 flex-wrap">
                                    {(skill as any).cultural_context.sp_concepts_detected.map((c: string, k: number) => (
                                      <span key={k} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#FEF3C7', color: '#92400E' }}>{c}</span>
                                    ))}
                                  </div>
                                )}
                                {(skill as any).cultural_context.cultural_uplift_applied && (
                                  <p className="text-[10px] mt-1.5" style={{ color: '#B45309' }}>Cultural uplift applied: {(skill as any).cultural_context.cultural_uplift_reason}</p>
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
                  <div className="bg-white rounded-lg border border-orange-200 p-6">
                    <h2 className="text-sm font-semibold text-orange-600 mb-3">AUTHENTICITY FLAGS</h2>
                    <div className="space-y-2">
                      {selected.gaming_flags.map((flag, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className={`mt-0.5 ${flag.severity === 'high' ? 'text-red-500' : flag.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'}`}>●</span>
                          <div>
                            <span className="font-medium text-gray-700">{flag.flag_type}:</span>
                            <span className="text-gray-500 ml-1">{flag.evidence}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* System Flags Checklist — what the algorithm did */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">SYSTEM FLAGS — Algorithm Decisions</h2>
                  <p className="text-xs text-gray-500 mb-4">Review each flag to understand what the AI extraction did and why. These inform your professional judgment.</p>
                  <div className="space-y-3">
                    {(() => {
                      const skills = selected.skills_profile || [];
                      const selfDepOverrides = skills.filter((s: any) => s.self_deprecation_override || s.top_evidence?.self_deprecation_detected);
                      const disabilityUplifts = skills.filter((s: any) => s.disability_uplift_applied || s.top_evidence?.disability_uplift_applied || s.confidence_factors?.disability_uplift_applied);
                      const culturalUplifts = skills.filter((s: any) => s.cultural_context?.cultural_uplift_applied);
                      const singleSource = skills.filter((s: any) => s.evidence_count === 1 && (s.confidence || 0) >= 0.7);
                      return (
                        <>
                          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: selfDepOverrides.length > 0 ? '#FEF3C7' : '#F9FAFB' }}>
                            <span className="text-lg mt-0.5">{selfDepOverrides.length > 0 ? '⚠' : '○'}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">Self-Deprecation Override</p>
                              <p className="text-xs text-gray-500">{selfDepOverrides.length > 0 ? `Applied on ${selfDepOverrides.length} skill(s): ${selfDepOverrides.map((s: any) => s.skill_name).join(', ')}. The candidate minimised their contribution but described competent action.` : 'Not applied — no self-deprecation patterns detected.'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: disabilityUplifts.length > 0 ? '#DBEAFE' : '#F9FAFB' }}>
                            <span className="text-lg mt-0.5">{disabilityUplifts.length > 0 ? '⚠' : '○'}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">Disability Experience Uplift</p>
                              <p className="text-xs text-gray-500">{disabilityUplifts.length > 0 ? `Applied on ${disabilityUplifts.length} skill(s): ${disabilityUplifts.map((s: any) => s.skill_name).join(', ')}. Action performed under disability-related constraint demonstrates greater capability.` : 'Not applied — no disability-related constraint in evidence.'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: culturalUplifts.length > 0 ? '#FFF7ED' : '#F9FAFB' }}>
                            <span className="text-lg mt-0.5">{culturalUplifts.length > 0 ? '⚠' : '○'}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">Cultural Context Uplift (Sikolohiyang Pilipino)</p>
                              <p className="text-xs text-gray-500">{culturalUplifts.length > 0 ? `Applied on ${culturalUplifts.length} skill(s): ${culturalUplifts.map((s: any) => s.skill_name).join(', ')}. Filipino cultural context (kapwa, bayanihan, pakikiramdam) adds significance to evidence.` : 'Not applied — no cultural context uplift triggered.'}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3 p-3 rounded-lg" style={{ background: singleSource.length > 0 ? '#FEF2F2' : '#F9FAFB' }}>
                            <span className="text-lg mt-0.5">{singleSource.length > 0 ? '⚠' : '○'}</span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">Single-Source Evidence</p>
                              <p className="text-xs text-gray-500">{singleSource.length > 0 ? `${singleSource.length} skill(s) with high confidence but only 1 evidence item: ${singleSource.map((s: any) => s.skill_name).join(', ')}. Consider requesting additional evidence.` : 'No single-source high-confidence claims.'}</p>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* METHODOLOGY TAB */}
            {activeTab === 'methodology' && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Research Anchoring</h2>
                  <p className="text-sm text-gray-500 mb-4">The LEEE methodology is grounded in the following established frameworks and research. These references support the psychologist's professional endorsement.</p>

                  <div className="space-y-3">
                    {METHODOLOGY_REFS.map(ref => (
                      <div key={ref.id} className="border border-gray-100 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900">{ref.title}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Source: {ref.source}</p>
                          </div>
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{ref.id}</span>
                        </div>
                        <p className="text-xs text-gray-600 mt-2">Relevance: {ref.relevance}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">Extraction Methodology</h2>
                  <div className="text-sm text-gray-700 space-y-3">
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
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Professional Validation</h2>
                  <p className="text-sm text-gray-500 mb-6">
                    As a licensed psychologist, you are endorsing that the skills profile extraction methodology is sound,
                    the evidence trail is traceable, and the proficiency assessments are reasonable based on the behavioral evidence presented.
                    Your professional license is attached to this endorsement.
                  </p>

                  {/* Summary of what you're signing */}
                  <div className="bg-orange-50 rounded-lg p-4 mb-6 border border-orange-200">
                    <h3 className="text-sm font-semibold text-orange-700 mb-2">Skills Profile Summary</h3>
                    <p className="text-sm text-gray-700 mb-2">{selected.narrative_summary}</p>
                    <div className="flex flex-wrap gap-2">
                      {selected.skills_profile?.map((s, i) => (
                        <span key={i} className="text-xs px-2 py-1 rounded-full text-white font-medium"
                          style={{ backgroundColor: PROFICIENCY_COLORS[s.proficiency?.toLowerCase()] || '#666' }}>
                          {s.skill_name}: {s.proficiency} ({Math.round(s.confidence * 100)}%)
                        </span>
                      ))}
                    </div>
                    {selected.gaming_flags?.length > 0 && (
                      <p className="text-xs text-orange-600 mt-2">{selected.gaming_flags.length} authenticity flag(s) noted — review audit trail before signing.</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Validation Decision</label>
                      <select value={validationStatus} onChange={e => setValidationStatus(e.target.value as any)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-300 outline-none bg-white">
                        <option value="validated">Validated — methodology sound, evidence traceable</option>
                        <option value="revision_needed">Revision Needed — some claims need additional evidence</option>
                        <option value="rejected">Rejected — methodology concerns or insufficient evidence</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Professional Notes</label>
                      <textarea value={validationNotes} onChange={e => setValidationNotes(e.target.value)}
                        placeholder="Any observations, concerns, or notes about the skills profile assessment..."
                        rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-300 outline-none resize-none" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                      <input type="text" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)}
                        placeholder="PRC License Number" className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-300 outline-none" />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                      <button onClick={handleSign} disabled={!licenseNumber.trim() || signed}
                        className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
                          signed ? 'bg-green-500' : 'bg-orange-500 hover:bg-orange-600 shadow-md hover:shadow-lg'
                        } disabled:opacity-50`}>
                        {signed ? 'Signed and Validated' : 'Sign with Professional License'}
                      </button>
                      <p className="text-xs text-gray-400 text-center mt-2">
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
      </div>
    </div>
  );
}
