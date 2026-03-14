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
            href="/chat"
            className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all text-left"
          >
            <span className="text-3xl mb-3 block">💬</span>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Jobseeker</h2>
            <p className="text-sm text-gray-500">
              Tell your story to Aya. Discover the skills hidden in your lived experience.
            </p>
            <span className="text-xs text-teal-600 font-medium mt-3 block">Gate 2 — LEEE Chatbot →</span>
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
        </div>

        <p className="text-xs text-gray-400 mt-8">Pilot: Cebuana Lhuillier — Jakarta Conference Demo</p>
      </div>
    </div>
  );
}
