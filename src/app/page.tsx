import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      {/* Nav bar — Navy 900 with bloom mark */}
      <nav className="px-6 py-4 flex items-center justify-between" style={{ background: '#102A43' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#486581' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#48BB78' }} />
          </div>
          <span className="text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#F0F4F8' }}>kaya</span>
        </div>
        <span className="text-xs" style={{ color: '#829AB1' }}>kaya.work — Virtualahan Inc.</span>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif', color: '#102A43' }}>kaya</h1>
          <p className="text-lg mb-1" style={{ color: '#334E68' }}>Hiring intelligence, not paperwork.</p>
          <p className="text-sm" style={{ color: '#627D98' }}>
            Skills are everywhere. Credentials are not a proxy for capability — lived experience is evidence.
          </p>
        </div>

        <div className="text-center mb-10">
          <Link href="/auth"
            className="inline-block px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-lg text-white"
            style={{ background: '#102A43' }}>
            Get started — show what you can do →
          </Link>
          <p className="text-xs mt-2" style={{ color: '#829AB1' }}>
            Or <Link href="/my-dashboard" className="underline" style={{ color: '#486581' }}>go to your dashboard</Link> if already signed in
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/profile" className="block p-6 bg-white rounded-xl border hover:shadow-lg transition-all text-left" style={{ borderColor: '#D9E2EC' }}>
            <span className="text-2xl mb-3 block">👤</span>
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#102A43' }}>Create Profile</h2>
            <p className="text-sm" style={{ color: '#627D98' }}>Set up your profile — work history, education, skills.</p>
            <span className="text-xs font-medium mt-3 block" style={{ color: '#486581' }}>Jobseeker Profile →</span>
          </Link>
          <Link href="/chat" className="block p-6 bg-white rounded-xl border hover:shadow-lg transition-all text-left" style={{ borderColor: '#D9E2EC' }}>
            <span className="text-2xl mb-3 block">💬</span>
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#102A43' }}>Tell Your Story</h2>
            <p className="text-sm" style={{ color: '#627D98' }}>We have a conversation. Your stories become evidence.</p>
            <span className="text-xs font-medium mt-3 block" style={{ color: '#486581' }}>Gate 2 — Evidence →</span>
          </Link>
          <Link href="/vacancy" className="block p-6 bg-white rounded-xl border hover:shadow-lg transition-all text-left" style={{ borderColor: '#D9E2EC' }}>
            <span className="text-2xl mb-3 block">📋</span>
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#102A43' }}>Browse Jobs</h2>
            <p className="text-sm" style={{ color: '#627D98' }}>See matching vacancies, check alignment, and apply.</p>
            <span className="text-xs font-medium mt-3 block" style={{ color: '#486581' }}>Gate 1 — Alignment →</span>
          </Link>
          <Link href="/skills" className="block p-6 bg-white rounded-xl border hover:shadow-lg transition-all text-left" style={{ borderColor: '#D9E2EC' }}>
            <span className="text-2xl mb-3 block">✨</span>
            <h2 className="text-lg font-semibold mb-1" style={{ color: '#102A43' }}>Skills Profile</h2>
            <p className="text-sm" style={{ color: '#627D98' }}>Your proven skills — extracted from stories with full evidence.</p>
            <span className="text-xs font-medium mt-3 block" style={{ color: '#48BB78' }}>Your Verified Skills →</span>
          </Link>
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#829AB1' }}>For employers &amp; reviewers</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
          <Link href="/employer-dashboard" className="block p-4 bg-white rounded-xl border hover:shadow-md transition-all text-left" style={{ borderColor: '#D9E2EC' }}>
            <span className="text-xl mb-2 block">🏢</span>
            <h3 className="text-sm font-semibold" style={{ color: '#102A43' }}>Employer</h3>
            <p className="text-xs mt-1" style={{ color: '#627D98' }}>Manage vacancies and pipeline</p>
          </Link>
          <Link href="/reviewer" className="block p-4 bg-white rounded-xl border hover:shadow-md transition-all text-left" style={{ borderColor: '#D9E2EC' }}>
            <span className="text-xl mb-2 block">✅</span>
            <h3 className="text-sm font-semibold" style={{ color: '#102A43' }}>Reviewer</h3>
            <p className="text-xs mt-1" style={{ color: '#627D98' }}>Recruiter · Hiring Manager · Final Approver</p>
          </Link>
          <Link href="/psychologist" className="block p-4 bg-white rounded-xl border hover:shadow-md transition-all text-left" style={{ borderColor: '#D9E2EC' }}>
            <span className="text-xl mb-2 block">🧠</span>
            <h3 className="text-sm font-semibold" style={{ color: '#102A43' }}>Psychologist</h3>
            <p className="text-xs mt-1" style={{ color: '#627D98' }}>Validate &amp; sign-off</p>
          </Link>
        </div>

        <div className="rounded-xl p-5 mb-8" style={{ background: '#102A43' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#829AB1' }}>The three-gate model</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs font-bold mb-1" style={{ color: '#F0F4F8' }}>Gate 1</div>
              <div className="text-xs" style={{ color: '#9FB3C8' }}>Alignment</div>
              <div className="text-xs mt-1" style={{ color: '#627D98' }}>Recruiter decides</div>
            </div>
            <div>
              <div className="text-xs font-bold mb-1" style={{ color: '#F0F4F8' }}>Gate 2</div>
              <div className="text-xs" style={{ color: '#9FB3C8' }}>Evidence</div>
              <div className="text-xs mt-1" style={{ color: '#627D98' }}>Hiring Manager decides</div>
            </div>
            <div>
              <div className="text-xs font-bold mb-1" style={{ color: '#F0F4F8' }}>Gate 3</div>
              <div className="text-xs" style={{ color: '#9FB3C8' }}>Predictability</div>
              <div className="text-xs mt-1" style={{ color: '#627D98' }}>Final Approver decides</div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/demo" className="inline-block px-6 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md" style={{ background: '#243B53', color: '#D9E2EC' }}>
            🚀 End-to-end demo
          </Link>
          <span className="mx-3 text-xs" style={{ color: '#829AB1' }}>|</span>
          <Link href="/demo-day" className="inline-block px-6 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md" style={{ background: '#243B53', color: '#D9E2EC' }}>
            🎬 Demo Director
          </Link>
        </div>

        <p className="text-xs text-center mt-10" style={{ color: '#829AB1' }}>Pilot: Cebuana Lhuillier — Jakarta Conference · kaya.work · Virtualahan Inc.</p>
      </div>
    </div>
  );
}
