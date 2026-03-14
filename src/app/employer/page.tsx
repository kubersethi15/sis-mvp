'use client';

import { useState, useCallback } from 'react';

// ============================================================
// TYPES
// ============================================================

interface Blueprint {
  title: string;
  summary: string;
  essential_requirements: Array<{ requirement: string; type: string; psf_skill_id: string | null }>;
  trainable_requirements: Array<{ requirement: string; type: string; psf_skill_id: string | null }>;
  competency_blueprint: {
    hard_skills: string[];
    human_centric_skills: Array<{ skill: string; importance: string; psf_skill_id: string }>;
    work_arrangement: string;
    schedule: string;
    location: string;
  };
  compensation: { range: string; benefits: string[] };
  inclusion_signals: string[];
}

interface AlignmentResult {
  alignment_score: number;
  competency_fit_map: Record<string, { status: string; evidence: string; confidence: number }>;
  strengths: Array<{ area: string; evidence: string }>;
  gaps: Array<{ area: string; severity: string; trainable: boolean; suggestion: string }>;
  recommendation: string;
  recommendation_rationale: string;
  inclusion_notes: string;
}

// ============================================================
// COMPONENT
// ============================================================

export default function EmployerDashboard() {
  const [activeTab, setActiveTab] = useState<'upload' | 'pipeline' | 'review'>('upload');
  const [jdText, setJdText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [employer, setEmployer] = useState<any>(null);
  const [vacancy, setVacancy] = useState<any>(null);
  const [alignment, setAlignment] = useState<AlignmentResult | null>(null);

  // Create employer profile (one-time)
  const setupEmployer = useCallback(async () => {
    const res = await fetch('/api/gate1', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_employer',
        organization_name: 'Cebuana Lhuillier',
        industry: 'Financial Services',
        locations: [{ city: 'Manila', country: 'Philippines' }],
        work_arrangements: { remote: true, onsite: true, hybrid: true },
      }),
    });
    const data = await res.json();
    setEmployer(data.employer);
    return data.employer;
  }, []);

  // Parse JD
  const handleParseJD = useCallback(async () => {
    if (!jdText.trim()) return;
    setIsProcessing(true);

    try {
      // Ensure employer exists
      let emp = employer;
      if (!emp) emp = await setupEmployer();

      // Parse JD
      const parseRes = await fetch('/api/gate1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'parse_jd', jd_text: jdText }),
      });
      const parseData = await parseRes.json();
      setBlueprint(parseData.blueprint);

      // Create vacancy
      const vacRes = await fetch('/api/gate1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_vacancy',
          employer_id: emp.id,
          title: parseData.blueprint.title || 'Untitled Position',
          description: parseData.blueprint.summary,
          jd_raw: jdText,
          competency_blueprint: parseData.blueprint.competency_blueprint,
          essential_requirements: parseData.blueprint.essential_requirements,
          trainable_requirements: parseData.blueprint.trainable_requirements,
          compensation_range: parseData.blueprint.compensation || {},
          work_arrangement: parseData.blueprint.competency_blueprint?.work_arrangement,
          location: parseData.blueprint.competency_blueprint?.location,
          status: 'published',
        }),
      });
      const vacData = await vacRes.json();
      setVacancy(vacData.vacancy);

    } catch (error) {
      console.error('JD parse error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [jdText, employer, setupEmployer]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">SIS Employer Dashboard</h1>
            <p className="text-sm text-gray-500">Skills Intelligence System — Gate 1 Alignment</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Recruiter View</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6 pt-4">
        <div className="flex gap-1 border-b border-gray-200">
          {[
            { id: 'upload' as const, label: '📄 Upload JD' },
            { id: 'pipeline' as const, label: '📊 Alignment Results' },
            { id: 'review' as const, label: '✅ Recruiter Review' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* TAB: Upload JD */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Upload Job Description</h2>
              <p className="text-sm text-gray-500 mb-4">
                Paste a job description below. The AI will parse it into a structured competency blueprint,
                distinguishing essential vs. trainable requirements and identifying human-centric skills.
              </p>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the full job description here..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={handleParseJD}
                  disabled={!jdText.trim() || isProcessing}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? '⏳ Analyzing JD...' : '🔍 Analyze & Create Vacancy'}
                </button>
                <span className="text-xs text-gray-400">
                  Pilot employer: Cebuana Lhuillier — JDs from ph.jobstreet.com/cebuana-lhuillier-jobs
                </span>
              </div>
            </div>

            {/* Blueprint Result */}
            {blueprint && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  📋 Competency Blueprint: {blueprint.title}
                </h2>
                <p className="text-sm text-gray-600 mb-4">{blueprint.summary}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Essential Requirements */}
                  <div>
                    <h3 className="text-sm font-semibold text-red-700 mb-2">Essential Requirements</h3>
                    <div className="space-y-2">
                      {blueprint.essential_requirements.map((req, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-red-500 mt-0.5">●</span>
                          <div>
                            <span className="text-gray-800">{req.requirement}</span>
                            <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{req.type}</span>
                            {req.psf_skill_id && (
                              <span className="ml-1 text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">{req.psf_skill_id}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trainable Requirements */}
                  <div>
                    <h3 className="text-sm font-semibold text-green-700 mb-2">Trainable Requirements</h3>
                    <div className="space-y-2">
                      {blueprint.trainable_requirements.map((req, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 mt-0.5">○</span>
                          <div>
                            <span className="text-gray-800">{req.requirement}</span>
                            <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{req.type}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Human-Centric Skills */}
                {blueprint.competency_blueprint.human_centric_skills?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-purple-700 mb-2">Human-Centric Skills Identified</h3>
                    <div className="flex flex-wrap gap-2">
                      {blueprint.competency_blueprint.human_centric_skills.map((skill, i) => (
                        <span
                          key={i}
                          className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                            skill.importance === 'critical' ? 'bg-purple-100 text-purple-700' :
                            skill.importance === 'important' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {skill.skill}
                          {skill.psf_skill_id && <span className="ml-1 opacity-60">({skill.psf_skill_id})</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Inclusion Signals */}
                {blueprint.inclusion_signals?.length > 0 && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-green-700 mb-1">♿ Inclusion Signals</h3>
                    <ul className="text-sm text-green-600">
                      {blueprint.inclusion_signals.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Status */}
                {vacancy && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                    <span className="text-blue-600">✅</span>
                    <span className="text-sm text-blue-700 font-medium">
                      Vacancy created and published — ID: {vacancy.id?.substring(0, 8)}...
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB: Alignment Results */}
        {activeTab === 'pipeline' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Alignment Pipeline</h2>
            <p className="text-sm text-gray-500 mb-6">
              Once jobseekers apply and their profiles are assessed against the vacancy, alignment results will appear here.
              The Recruiter reviews each candidate and decides: proceed to Gate 2, hold, reroute, or stop.
            </p>

            {/* Pipeline stages visualization */}
            <div className="flex items-center gap-2 mb-8">
              {['Gate 1: Alignment', 'Gate 2: Evidence', 'Gate 3: Predictability', 'Selected'].map((stage, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    i === 0 ? 'bg-blue-100 text-blue-700' :
                    i === 1 ? 'bg-green-100 text-green-700' :
                    i === 2 ? 'bg-purple-100 text-purple-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {stage}
                  </div>
                  {i < 3 && <span className="text-gray-300">→</span>}
                </div>
              ))}
            </div>

            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">📊</p>
              <p className="text-sm">No applications yet. Upload a JD and have jobseekers apply to see alignment results.</p>
            </div>
          </div>
        )}

        {/* TAB: Recruiter Review */}
        {activeTab === 'review' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recruiter Review Queue</h2>
            <p className="text-sm text-gray-500 mb-6">
              Candidates pending your review will appear here. For each candidate, you'll see the AI-generated
              alignment assessment and can decide: proceed to Gate 2, hold, reroute to another vacancy, or stop.
            </p>

            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-sm">No candidates pending review.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
