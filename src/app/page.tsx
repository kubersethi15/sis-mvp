import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-kaya-stone-50">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between bg-kaya-navy-900">
        <div className="flex items-center gap-2.5">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="2.5" fill="#E6F1FB" />
            {[0, 51, 103, 154, 206, 257, 309].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              const x2 = 12 + 8 * Math.cos(rad);
              const y2 = 12 + 8 * Math.sin(rad);
              return (
                <g key={i}>
                  <line x1="12" y1="12" x2={x2} y2={y2} stroke={i >= 5 ? '#1D9E75' : '#185FA5'} strokeWidth="1.5" opacity="0.7" />
                  <circle cx={x2} cy={y2} r="2" fill={i >= 5 ? '#1D9E75' : '#185FA5'} />
                </g>
              );
            })}
          </svg>
          <span className="text-lg tracking-tight font-display text-white/90">kaya</span>
        </div>
        <Link href="/auth" className="text-caption font-medium text-kaya-stone-200 hover:text-white transition-colors">Sign in</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* Hero */}
        <div className="text-center mb-14">
          <h1 className="text-display font-display text-kaya-navy-900 mb-3">
            Hire who can.
          </h1>
          <p className="text-h2 text-kaya-navy-900 mb-2 font-normal">
            Your stories are evidence of real skills.
          </p>
          <p className="text-body text-kaya-stone-600 max-w-md mx-auto mb-8">
            Kaya discovers your capabilities through conversation — not resumes, not tests.
            Every skill maps to the Philippine Skills Framework and is verified by a licensed professional.
          </p>
          <Link href="/auth"
            className="inline-block px-8 py-3.5 rounded-kaya-sm font-semibold text-body text-white bg-kaya-navy-900 hover:bg-kaya-navy-800 shadow-kaya-md hover:shadow-kaya-lg transition-all">
            Get started
          </Link>
          <p className="text-caption mt-3 text-kaya-stone-400">
            Already have an account?{' '}
            <Link href="/auth" className="underline text-kaya-navy-600 hover:text-kaya-navy-900">Sign in</Link>
            {' '}or{' '}
            <Link href="/my-dashboard" className="underline text-kaya-navy-600 hover:text-kaya-navy-900">go to dashboard</Link>
          </p>
        </div>

        {/* How it works */}
        <div className="mb-14">
          <p className="text-caption font-semibold uppercase tracking-widest mb-5 text-center text-kaya-stone-400">How it works</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { num: '1', title: 'Create your profile', desc: 'Tell us about yourself — experience, education, goals.', color: 'bg-kaya-green-400' },
              { num: '2', title: 'Share your stories', desc: 'Have a conversation with Aya. No tests — just real experiences.', color: 'bg-kaya-navy-600' },
              { num: '3', title: 'Discover your skills', desc: 'See your proven capabilities — PSF-aligned, evidence-backed.', color: 'bg-kaya-navy-900' },
            ].map(step => (
              <div key={step.num} className="p-5 bg-white rounded-kaya border border-kaya-stone-100 text-center shadow-kaya hover:shadow-kaya-md transition-shadow">
                <div className={`w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-caption font-bold text-white ${step.color}`}>{step.num}</div>
                <h3 className="text-h3 text-kaya-navy-900 mb-1">{step.title}</h3>
                <p className="text-caption text-kaya-stone-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Three-gate model */}
        <div className="rounded-kaya p-6 mb-14 bg-kaya-navy-900">
          <p className="text-caption font-semibold uppercase tracking-widest mb-4 text-center text-kaya-stone-400">The three-gate hiring pipeline</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { gate: 'Gate 1', name: 'Alignment', role: 'Recruiter reviews fit' },
              { gate: 'Gate 2', name: 'Evidence', role: 'Manager reviews skills' },
              { gate: 'Gate 3', name: 'Predictability', role: 'Approver decides' },
            ].map(g => (
              <div key={g.gate}>
                <div className="text-body font-bold mb-1 text-kaya-navy-50">{g.gate}</div>
                <div className="text-caption mb-1 text-kaya-stone-400">{g.name}</div>
                <div className="text-caption text-kaya-stone-600">{g.role}</div>
              </div>
            ))}
          </div>
          <p className="text-caption text-center mt-4 text-kaya-stone-600">AI extracts and recommends. Humans decide at every gate. A psychologist endorses.</p>
        </div>

        {/* Portal links */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { href: '/employer-dashboard', title: 'Employer portal', desc: 'Vacancies & talent pipeline' },
            { href: '/reviewer', title: 'Reviewer portal', desc: 'Three-gate approval' },
            { href: '/psychologist', title: 'Psychologist portal', desc: 'Validate & sign-off' },
          ].map(link => (
            <Link key={link.href} href={link.href} className="p-4 bg-white rounded-kaya border border-kaya-stone-100 text-center hover:shadow-kaya-md hover:border-kaya-navy-100 transition-all">
              <div className="text-body font-semibold text-kaya-navy-900">{link.title}</div>
              <div className="text-caption mt-1 text-kaya-stone-400">{link.desc}</div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <p className="text-caption text-center text-kaya-stone-400">kaya.work · Virtualahan Inc. · Hire who can.</p>
      </div>
    </div>
  );
}
