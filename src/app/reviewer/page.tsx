'use client';

import { useState } from 'react';

// ============================================================
// TYPES
// ============================================================

interface GateSummary {
  gate: number;
  title: string;
  reviewer: string;
  status: string;
  score?: number;
  recommendation?: string;
  details?: any;
}

// ============================================================
// COMPONENT
// ============================================================

export default function ReviewerDashboard() {
  const [activeView, setActiveView] = useState<'pipeline' | 'gate1' | 'gate2' | 'gate3'>('pipeline');
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">SIS Reviewer Dashboard</h1>
            <p className="text-sm text-gray-500">Three-Gate Hiring Pipeline</p>
          </div>
          <a href="/" className="text-xs text-gray-400 hover:text-gray-600">← Home</a>
        </div>
      </header>

      {/* Gate Tabs */}
      <div className="max-w-6xl mx-auto px-6 pt-4">
        <div className="flex gap-1 border-b border-gray-200">
          {[
            { id: 'pipeline' as const, label: '📊 Pipeline Overview' },
            { id: 'gate1' as const, label: '🔵 Gate 1: Alignment', role: 'Recruiter' },
            { id: 'gate2' as const, label: '🟢 Gate 2: Evidence', role: 'Hiring Manager' },
            { id: 'gate3' as const, label: '🟣 Gate 3: Predictability', role: 'Final Approver' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeView === tab.id
                  ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">

        {/* PIPELINE OVERVIEW */}
        {activeView === 'pipeline' && (
          <div className="space-y-6">
            {/* Pipeline Funnel */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Hiring Pipeline</h2>

              {/* Gate Flow */}
              <div className="flex items-stretch gap-3 mb-8">
                {[
                  { label: 'Applied', color: 'bg-gray-100 text-gray-700', count: 0 },
                  { label: 'Gate 1: Alignment', color: 'bg-blue-100 text-blue-700', count: 0 },
                  { label: 'Gate 2: Evidence', color: 'bg-green-100 text-green-700', count: 0 },
                  { label: 'Gate 3: Predictability', color: 'bg-purple-100 text-purple-700', count: 0 },
                  { label: 'Selected', color: 'bg-yellow-100 text-yellow-700', count: 0 },
                ].map((stage, i) => (
                  <div key={i} className="flex items-center gap-3 flex-1">
                    <div className={`${stage.color} rounded-lg p-4 flex-1 text-center`}>
                      <div className="text-2xl font-bold">{stage.count}</div>
                      <div className="text-xs font-medium mt-1">{stage.label}</div>
                    </div>
                    {i < 4 && <span className="text-gray-300 text-lg">→</span>}
                  </div>
                ))}
              </div>

              {/* Human Validators */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { gate: 'Gate 1', role: 'Recruiter', action: 'Reviews alignment score, decides proceed/hold/reroute/stop', color: 'border-blue-200 bg-blue-50' },
                  { gate: 'Gate 2', role: 'Hiring Manager', action: 'Reviews evidence profile, decides proceed/request more/hold/stop', color: 'border-green-200 bg-green-50' },
                  { gate: 'Gate 3', role: 'Final Approver', action: 'Reviews simulation + interview, approves or declines', color: 'border-purple-200 bg-purple-50' },
                  { gate: 'Post-Gate', role: 'Psychologist', action: 'Validates methodology, signs off on skills profile', color: 'border-orange-200 bg-orange-50' },
                ].map((v, i) => (
                  <div key={i} className={`rounded-lg border p-4 ${v.color}`}>
                    <div className="text-xs font-semibold text-gray-500">{v.gate}</div>
                    <div className="text-sm font-bold text-gray-900 mt-1">{v.role}</div>
                    <div className="text-xs text-gray-600 mt-2">{v.action}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Process Flow Diagram */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">End-to-End Process</h2>
              <div className="space-y-3 text-sm">
                {[
                  { step: '1', text: 'Employer creates profile & publishes vacancy', who: 'Employer', color: 'bg-gray-100' },
                  { step: '2', text: 'Jobseeker browses vacancies, asks AI questions about the role', who: 'Jobseeker', color: 'bg-gray-100' },
                  { step: '3', text: 'Jobseeker applies → Gate 1 alignment assessment runs', who: 'System', color: 'bg-blue-50' },
                  { step: '4', text: 'Recruiter reviews alignment → proceed/hold/reroute/stop', who: 'Recruiter', color: 'bg-blue-100' },
                  { step: '5', text: 'Gate 2: Profile data extracted + LEEE storytelling conversation', who: 'System + Jobseeker', color: 'bg-green-50' },
                  { step: '6', text: 'Hiring Manager reviews evidence → proceed/request more/hold/stop', who: 'Hiring Manager', color: 'bg-green-100' },
                  { step: '7', text: 'Gate 3: AI simulation + structured interview', who: 'System + Jobseeker', color: 'bg-purple-50' },
                  { step: '8', text: 'Final Approver reviews all gates → approve/decline', who: 'Final Approver', color: 'bg-purple-100' },
                  { step: '9', text: 'Psychologist validates skills profile + signs off', who: 'Psychologist', color: 'bg-orange-50' },
                  { step: '10', text: 'Selected → onboarding | Not selected → feedback + alternatives', who: 'HR', color: 'bg-yellow-50' },
                ].map((s, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${s.color}`}>
                    <div className="w-7 h-7 rounded-full bg-white border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                      {s.step}
                    </div>
                    <div className="flex-1 text-gray-800">{s.text}</div>
                    <div className="text-xs text-gray-500 flex-shrink-0">{s.who}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GATE 1 REVIEW */}
        {activeView === 'gate1' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">🔵</div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gate 1: Alignment Review</h2>
                <p className="text-sm text-gray-500">Recruiter — Does this candidate align with the role?</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Review AI-generated alignment scores. Decide: proceed to Gate 2, hold, reroute to another vacancy, or stop.
            </p>
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">📋</p>
              <p className="text-sm">No candidates pending Gate 1 review.</p>
              <p className="text-xs mt-1">Upload a JD in the <a href="/employer" className="text-blue-500 underline">Employer Dashboard</a> to start.</p>
            </div>
          </div>
        )}

        {/* GATE 2 REVIEW */}
        {activeView === 'gate2' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg">🟢</div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gate 2: Evidence Review</h2>
                <p className="text-sm text-gray-500">Hiring Manager — Is there sufficient evidence for this role?</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Review the role-specific Skills Profile combining jobseeker profile data + LEEE extraction results.
              Decide: proceed to Gate 3, request more evidence, hold, or stop.
            </p>
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-2">🔍</p>
              <p className="text-sm">No candidates pending Gate 2 review.</p>
            </div>
          </div>
        )}

        {/* GATE 3 REVIEW */}
        {activeView === 'gate3' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-lg">🟣</div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Gate 3: Predictability Review</h2>
                <p className="text-sm text-gray-500">Final Approver — Will this candidate succeed in the role?</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Review AI simulation results, structured interview scores, readiness index, success conditions, and support needs.
              Final decision: approve selection or decline.
            </p>

            {/* What the Final Approver sees */}
            <div className="border border-gray-100 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Final Approver reviews:</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <span className="font-medium text-blue-700">Gate 1 Summary</span>
                  <p className="text-xs text-gray-500 mt-1">Alignment score, strengths, gaps</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <span className="font-medium text-green-700">Gate 2 Summary</span>
                  <p className="text-xs text-gray-500 mt-1">Skills profile, evidence strength, evidence gaps</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium text-purple-700">Simulation Results</span>
                  <p className="text-xs text-gray-500 mt-1">Scenario performance, decision quality</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <span className="font-medium text-purple-700">Interview Results</span>
                  <p className="text-xs text-gray-500 mt-1">Behavioral answers, skill signals</p>
                </div>
              </div>
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium text-yellow-700">AI Readiness Index</span>
                <p className="text-xs text-gray-500 mt-1">Combined score across all gates + recommendation + support needs</p>
              </div>
            </div>

            <div className="text-center py-8 text-gray-400">
              <p className="text-4xl mb-2">🎯</p>
              <p className="text-sm">No candidates pending Gate 3 review.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
