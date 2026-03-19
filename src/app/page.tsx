import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#FAFAF9' }}>
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between" style={{ background: '#102A43' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#486581' }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#48BB78' }} />
          </div>
          <span className="text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: '#F0F4F8' }}>kaya</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/auth" className="text-xs font-medium hover:opacity-80 transition-opacity" style={{ color: '#BCCCDC' }}>Sign In</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Georgia, serif', color: '#102A43' }}>
            Show what you can do.
          </h1>
          <p className="text-lg mb-2" style={{ color: '#334E68' }}>
            Your stories are evidence of real skills.
          </p>
          <p className="text-sm max-w-md mx-auto mb-8" style={{ color: '#627D98' }}>
            Kaya discovers your capabilities through conversation — not resumes, not tests.
            Every skill maps to the Philippine Skills Framework and is verified by a licensed professional.
          </p>
          <Link href="/auth"
            className="inline-block px-8 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all text-base text-white"
            style={{ background: '#102A43' }}>
            Get Started
          </Link>
          <p className="text-xs mt-3" style={{ color: '#829AB1' }}>
            Already have an account?{' '}
            <Link href="/auth" className="underline" style={{ color: '#486581' }}>Sign in</Link>
            {' '}or{' '}
            <Link href="/my-dashboard" className="underline" style={{ color: '#486581' }}>go to dashboard</Link>
          </p>
        </div>

        {/* How it works */}
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: '#829AB1' }}>How it works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-white rounded-xl border text-center" style={{ borderColor: '#E2E8F0' }}>
              <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-bold text-white" style={{ background: '#48BB78' }}>1</div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#102A43' }}>Create Your Profile</h3>
              <p className="text-xs" style={{ color: '#627D98' }}>Tell us about yourself — experience, education, goals.</p>
            </div>
            <div className="p-5 bg-white rounded-xl border text-center" style={{ borderColor: '#E2E8F0' }}>
              <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-bold text-white" style={{ background: '#2E86C1' }}>2</div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#102A43' }}>Share Your Stories</h3>
              <p className="text-xs" style={{ color: '#627D98' }}>Have a conversation with Aya. No tests — just real experiences.</p>
            </div>
            <div className="p-5 bg-white rounded-xl border text-center" style={{ borderColor: '#E2E8F0' }}>
              <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-sm font-bold text-white" style={{ background: '#8E44AD' }}>3</div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#102A43' }}>Discover Your Skills</h3>
              <p className="text-xs" style={{ color: '#627D98' }}>See your proven capabilities — PSF-aligned, PQF-graded, evidence-backed.</p>
            </div>
          </div>
        </div>

        {/* Three-gate model */}
        <div className="rounded-xl p-6 mb-12" style={{ background: '#102A43' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-center" style={{ color: '#829AB1' }}>The Three-Gate Hiring Pipeline</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm font-bold mb-1" style={{ color: '#F0F4F8' }}>Gate 1</div>
              <div className="text-xs mb-1" style={{ color: '#9FB3C8' }}>Alignment</div>
              <div className="text-[10px]" style={{ color: '#627D98' }}>Recruiter reviews fit</div>
            </div>
            <div>
              <div className="text-sm font-bold mb-1" style={{ color: '#F0F4F8' }}>Gate 2</div>
              <div className="text-xs mb-1" style={{ color: '#9FB3C8' }}>Evidence</div>
              <div className="text-[10px]" style={{ color: '#627D98' }}>Manager reviews skills</div>
            </div>
            <div>
              <div className="text-sm font-bold mb-1" style={{ color: '#F0F4F8' }}>Gate 3</div>
              <div className="text-xs mb-1" style={{ color: '#9FB3C8' }}>Predictability</div>
              <div className="text-[10px]" style={{ color: '#627D98' }}>Approver decides</div>
            </div>
          </div>
          <p className="text-[10px] text-center mt-3" style={{ color: '#627D98' }}>AI extracts and recommends. Humans decide at every gate. A psychologist endorses.</p>
        </div>

        {/* Portal links for demo */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          <Link href="/employer-dashboard" className="p-4 bg-white rounded-xl border text-center hover:shadow-md transition-all" style={{ borderColor: '#E2E8F0' }}>
            <div className="text-sm font-semibold" style={{ color: '#102A43' }}>Employer Portal</div>
            <div className="text-[10px] mt-1" style={{ color: '#829AB1' }}>Vacancies & talent pipeline</div>
          </Link>
          <Link href="/reviewer" className="p-4 bg-white rounded-xl border text-center hover:shadow-md transition-all" style={{ borderColor: '#E2E8F0' }}>
            <div className="text-sm font-semibold" style={{ color: '#102A43' }}>Reviewer Portal</div>
            <div className="text-[10px] mt-1" style={{ color: '#829AB1' }}>Three-gate approval</div>
          </Link>
          <Link href="/psychologist" className="p-4 bg-white rounded-xl border text-center hover:shadow-md transition-all" style={{ borderColor: '#E2E8F0' }}>
            <div className="text-sm font-semibold" style={{ color: '#102A43' }}>Psychologist Portal</div>
            <div className="text-[10px] mt-1" style={{ color: '#829AB1' }}>Validate & sign-off</div>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-xs text-center" style={{ color: '#829AB1' }}>Kaya — Hiring Intelligence by Virtualahan Inc. · Pilot: Cebuana Lhuillier</p>
      </div>
    </div>
  );
}
