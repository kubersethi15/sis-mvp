'use client';

import { useState, useCallback, useEffect } from 'react';

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

  const [recommendations, setRecommendations] = useState<any[]>([]);

  // Parse JD
  const handleParseJD = useCallback(async () => {
    if (!jdText.trim()) return;
    setIsProcessing(true);
    setRecommendations([]);

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
      setRecommendations(parseData.recommendations || []);

      // Create vacancy
      const vacRes = await fetch('/api/gate1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_vacancy',
          employer_id: emp.id,
          employer_name: emp.organization_name || 'Employer',
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
      if (vacData.error) {
        console.error('Vacancy save error:', vacData.error);
        alert('Failed to save vacancy: ' + vacData.error);
      } else {
        setVacancy(vacData.vacancy);
      }

    } catch (error) {
      console.error('JD parse error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [jdText, employer, setupEmployer]);

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      {/* Kaya Nav */}
      <nav className="px-6 py-3 flex items-center justify-between" style={{ background: '#102A43' }}>
        <a href="/" className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#486581' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#48BB78' }} />
          </div>
          <span className="text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#F0F4F8' }}>kaya</span>
        </a>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '20px', flexWrap: 'nowrap' }}>
          <a href="/employer-dashboard" className="text-xs" style={{ color: '#9FB3C8', whiteSpace: 'nowrap' }}>Employer</a>
          <a href="/" className="text-xs" style={{ color: '#9FB3C8', whiteSpace: 'nowrap' }}>Home</a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="mb-4">
          <h1 className="text-xl font-bold" style={{ color: '#102A43' }}>Vacancy Design & Alignment</h1>
          <p className="text-sm" style={{ color: '#627D98' }}>Upload a job description → AI creates a competency blueprint → match candidates</p>
        </div>
        <div className="flex gap-1 border-b border-gray-200">
          {[
            { id: 'upload' as const, label: 'Upload JD' },
            { id: 'pipeline' as const, label: 'Alignment Results' },
            { id: 'review' as const, label: 'Recruiter Review' },
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
                  className="px-6 py-2 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  style={{ background: '#102A43' }}
                >
                  {isProcessing ? 'Analysing...' : 'Analyse & Create Vacancy'}
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
                  Competency Blueprint: {blueprint.title}
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
                    <h3 className="text-sm font-semibold text-green-700 mb-1">Inclusion Signals</h3>
                    <ul className="text-sm text-green-600">
                      {blueprint.inclusion_signals.map((s, i) => (
                        <li key={i}>• {s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Status */}
                {vacancy && (
                  <VacancySharePanel vacancyId={vacancy.id} />
                )}
              </div>
            )}

            {/* AI RECOMMENDATIONS FOR JD IMPROVEMENT */}
            {recommendations.length > 0 && (
              <div className="bg-white rounded-lg border border-amber-200 p-6">
                <h2 className="text-lg font-semibold text-amber-700 mb-2">💡 AI Recommendations to Improve This JD</h2>
                <p className="text-xs text-gray-500 mb-4">These suggestions help attract better-matched candidates and make the vacancy more inclusive.</p>
                <div className="space-y-3">
                  {recommendations.map((rec: any, i: number) => (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${
                      rec.priority === 'high' ? 'bg-red-50 border border-red-100' :
                      rec.priority === 'medium' ? 'bg-amber-50 border border-amber-100' :
                      'bg-gray-50 border border-gray-100'
                    }`}>
                      <span className={`text-sm mt-0.5 ${
                        rec.priority === 'high' ? 'text-red-500' : rec.priority === 'medium' ? 'text-amber-500' : 'text-gray-400'
                      }`}>
                        {rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🔵'}
                      </span>
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">{rec.type.replace(/_/g, ' ')}</span>
                        <p className="text-sm text-gray-700 mt-0.5">{rec.recommendation}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
              
              <p className="text-sm">No candidates pending review.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// VACANCY SHARE PANEL — QR code, link copy, PDF print
// ============================================================

function VacancySharePanel({ vacancyId }: { vacancyId: string }) {
  const [shareData, setShareData] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/vacancy-export', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_share_data', vacancy_id: vacancyId }),
    }).then(r => r.json()).then(setShareData).catch(console.error);
  }, [vacancyId]);

  const copyLink = () => {
    if (shareData?.share_url) {
      navigator.clipboard.writeText(shareData.share_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const printVacancy = () => {
    if (!shareData?.print_data) return;
    const d = shareData.print_data;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>${d.title} — ${d.employer}</title>
      <style>body{font-family:system-ui,sans-serif;max-width:700px;margin:40px auto;padding:0 20px;color:#333}
      h1{font-size:24px;margin-bottom:4px} .employer{color:#666;font-size:14px;margin-bottom:20px}
      .section{margin:16px 0} .section h3{font-size:13px;text-transform:uppercase;color:#888;margin-bottom:8px}
      .req{padding:4px 0;font-size:14px} .skill-badge{display:inline-block;background:#f0f0f0;padding:4px 10px;border-radius:20px;font-size:12px;margin:2px}
      .qr{text-align:center;margin:30px 0} .qr img{width:200px} .footer{font-size:11px;color:#aaa;text-align:center;margin-top:30px;border-top:1px solid #eee;padding-top:10px}
      @media print{body{margin:20px}}</style></head><body>
      <h1>${d.title}</h1>
      <div class="employer">${d.employer} • ${d.location || ''} • ${d.work_arrangement || ''}</div>
      <p>${d.description || ''}</p>
      ${d.essential_requirements?.length ? `<div class="section"><h3>Requirements</h3>${d.essential_requirements.map((r: any) => `<div class="req">• ${r.requirement || r}</div>`).join('')}</div>` : ''}
      ${d.human_centric_skills?.length ? `<div class="section"><h3>Skills We Value</h3>${d.human_centric_skills.map((s: any) => `<span class="skill-badge">${s.skill || s}</span>`).join(' ')}</div>` : ''}
      ${d.compensation?.range ? `<div class="section"><h3>Compensation</h3><p>${d.compensation.range}</p></div>` : ''}
      ${d.inclusion_statement ? `<div class="section"><h3>Inclusion</h3><p>${d.inclusion_statement}</p></div>` : ''}
      <div class="qr"><h3>Apply Now — Scan QR Code</h3><img src="${d.qr_code_url}" alt="QR Code" /><p style="font-size:12px;color:#666">${d.share_url}</p></div>
      <div class="footer">Powered by Kaya — Virtualahan Inc.</div>
      </body></html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  if (!shareData) return <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-600">Vacancy published. Loading share options...</div>;

  return (
    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-600">Published</span>
        <span className="text-sm text-blue-700 font-semibold">Vacancy Published!</span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        {/* QR Code */}
        <img src={shareData.qr_code_url} alt="QR Code" className="w-20 h-20 rounded-lg border border-blue-200" />
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">Share this vacancy:</p>
          <div className="flex items-center gap-2">
            <input type="text" value={shareData.share_url} readOnly
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg text-gray-600" />
            <button onClick={copyLink}
              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={printVacancy}
          className="px-3 py-1.5 text-xs bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          🖨️ Print / Save as PDF
        </button>
        <a href={shareData.share_url} target="_blank"
          className="px-3 py-1.5 text-xs bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
          🔗 Open Vacancy Page
        </a>
      </div>
      <p className="text-[10px] text-gray-400 mt-2">QR code leads jobseekers directly to the vacancy with AI Q&A and Apply button.</p>
    </div>
  );
}
