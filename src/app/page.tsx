import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl text-white font-bold">S</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Skills Intelligence System</h1>
        <p className="text-gray-500 mb-8">Virtualahan Inc. — MVP Demo</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/profile"
            className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all text-left"
          >
            <span className="text-3xl mb-3 block">👤</span>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Create Profile</h2>
            <p className="text-sm text-gray-500">
              Set up your jobseeker profile — work history, education, skills. This feeds into your alignment matching.
            </p>
            <span className="text-xs text-teal-600 font-medium mt-3 block">Gate 2A — Jobseeker Profile →</span>
          </Link>

          <Link
            href="/chat"
            className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all text-left"
          >
            <span className="text-3xl mb-3 block">💬</span>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Tell Your Story</h2>
            <p className="text-sm text-gray-500">
              Talk to Aya. Discover the skills hidden in your lived experience through storytelling.
            </p>
            <span className="text-xs text-teal-600 font-medium mt-3 block">Gate 2B — LEEE Chatbot →</span>
          </Link>

          <Link
            href="/employer"
            className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all text-left"
          >
            <span className="text-3xl mb-3 block">🏢</span>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Employer</h2>
            <p className="text-sm text-gray-500">
              Upload a job description. See AI-powered alignment assessment and manage your pipeline.
            </p>
            <span className="text-xs text-blue-600 font-medium mt-3 block">Gate 1 — Alignment Dashboard →</span>
          </Link>

          <Link
            href="/reviewer"
            className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all text-left"
          >
            <span className="text-3xl mb-3 block">✅</span>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Reviewer</h2>
            <p className="text-sm text-gray-500">
              Three-gate pipeline view. Review candidates at each stage with human-in-the-loop decisions.
            </p>
            <span className="text-xs text-purple-600 font-medium mt-3 block">All Gates — Reviewer Dashboard →</span>
          </Link>

          <Link
            href="/psychologist"
            className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all text-left"
          >
            <span className="text-3xl mb-3 block">🧠</span>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Psychologist</h2>
            <p className="text-sm text-gray-500">
              Review audit trails, verify methodology, and professionally validate skills profiles.
            </p>
            <span className="text-xs text-orange-600 font-medium mt-3 block">Post-Gate — Validation & Sign-off →</span>
          </Link>

          <Link
            href="/skills"
            className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-yellow-300 hover:shadow-lg transition-all text-left"
          >
            <span className="text-3xl mb-3 block">✨</span>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Skills Profile</h2>
            <p className="text-sm text-gray-500">
              View your discovered superpowers — skills extracted from your lived experience with full evidence.
            </p>
            <span className="text-xs text-yellow-600 font-medium mt-3 block">Your Superpowers Dashboard →</span>
          </Link>
        </div>

        {/* Demo Link */}
        <div className="mt-6">
          <Link
            href="/demo"
            className="block p-4 bg-gray-900 rounded-xl border border-gray-700 hover:border-purple-500 hover:shadow-lg transition-all text-center"
          >
            <span className="text-lg font-semibold text-white">🚀 End-to-End Demo Pipeline</span>
            <p className="text-xs text-gray-400 mt-1">Run the full 3-gate flow: Apply → Alignment → Evidence → Predictability → Decision</p>
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-8">Pilot: Cebuana Lhuillier — Jakarta Conference Demo</p>
      </div>
    </div>
  );
}
