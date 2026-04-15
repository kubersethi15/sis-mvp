'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Sign up
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/auth`,
          },
        });

        if (signUpError) { setError(signUpError.message); return; }

        // Create user profile in our table
        if (data.user) {
          // Clear any previous user's cached data
          localStorage.removeItem('kaya_jobseeker_profile_id');
          localStorage.removeItem('kaya_last_session_id');
          localStorage.removeItem('kaya_last_extraction');

          await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create',
              user_id: data.user.id,
              full_name: fullName,
              email,
            }),
          });
          localStorage.setItem('kaya_user_id', data.user.id);
        }

        setSuccess('Account created! Redirecting...');
        setTimeout(() => window.location.href = '/my-dashboard', 1000);

      } else {
        // Sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email, password,
        });

        if (signInError) { setError(signInError.message); return; }

        if (data.user) {
          // Clear previous user's cached data
          const previousUserId = localStorage.getItem('kaya_user_id');
          if (previousUserId && previousUserId !== data.user.id) {
            localStorage.removeItem('kaya_jobseeker_profile_id');
            localStorage.removeItem('kaya_last_session_id');
            localStorage.removeItem('kaya_last_extraction');
          }

          localStorage.setItem('kaya_user_id', data.user.id);

          // Get their jobseeker profile
          const profileRes = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_by_user', user_id: data.user.id }),
          });
          const profileData = await profileRes.json();
          if (profileData.profile) {
            localStorage.setItem('kaya_jobseeker_profile_id', profileData.profile.id);
          } else {
            localStorage.removeItem('kaya_jobseeker_profile_id');
          }
        }

        setSuccess('Signed in! Redirecting...');
        setTimeout(() => window.location.href = '/my-dashboard', 1000);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-kaya-stone-50">
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg mb-4 bg-kaya-navy-900">
            <div className="w-5 h-5 rounded-full bg-kaya-green-400" />
          </div>
          <h1 className="text-3xl font-bold font-display text-kaya-navy-900">
            kaya
          </h1>
          <p className="text-sm mt-1 text-kaya-stone-600">Show what you can do</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-kaya-stone-200 p-6 shadow-xl">
          {/* Toggle */}
          <div className="flex gap-1 bg-kaya-stone-100 rounded-xl p-1 mb-6">
            <button onClick={() => setMode('signin')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'signin' ? 'bg-white text-kaya-navy-900 shadow-sm' : 'text-stone-400'}`}>
              Sign In
            </button>
            <button onClick={() => setMode('signup')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${mode === 'signup' ? 'bg-white text-kaya-navy-900 shadow-sm' : 'text-stone-400'}`}>
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-kaya-navy-900 mb-1">Full Name</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                  placeholder="Juan dela Cruz"
                  className="w-full px-4 py-2.5 border border-kaya-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-300 outline-none bg-white" />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-kaya-navy-900 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="you@email.com"
                className="w-full px-4 py-2.5 border border-kaya-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-300 outline-none bg-white" />
            </div>

            <div>
              <label className="block text-sm font-medium text-kaya-navy-900 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 border border-kaya-stone-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-200 focus:border-amber-300 outline-none bg-white" />
              {mode === 'signin' && (
                <button type="button" onClick={async () => {
                  if (!email) { setError('Enter your email first'); return; }
                  setLoading(true);
                  const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth`,
                  });
                  setLoading(false);
                  if (resetErr) setError(resetErr.message);
                  else setSuccess('Password reset email sent. Check your inbox.');
                }} className="text-xs mt-1.5 hover:underline text-kaya-stone-600">
                  Forgot password?
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 bg-kaya-red-50 border border-kaya-red-400/20 rounded-xl text-sm text-kaya-red-400">
                {error}
                {(error.includes('not confirmed') || error.includes('Invalid') || error.includes('invalid')) && email && (
                  <button type="button" onClick={async () => {
                    setLoading(true);
                    const { error: resendErr } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${window.location.origin}/auth` } });
                    setLoading(false);
                    if (resendErr) setError(resendErr.message);
                    else { setError(''); setSuccess('Confirmation email resent. Check your inbox.'); }
                  }} className="block mt-2 text-xs font-medium underline text-red-700">
                    Resend confirmation email
                  </button>
                )}
              </div>
            )}
            {success && (
              <div className="p-3 bg-kaya-green-50 border border-kaya-green-100 rounded-xl text-sm text-kaya-green-400">{success}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 font-sans">
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Role-based entry */}
          <div className="mt-5 pt-5 border-t border-kaya-stone-100">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-center mb-3 text-kaya-stone-400">Other portals</p>
            <div className="grid grid-cols-2 gap-2">
              <a href="/employer-dashboard"
                className="p-3 rounded-xl border text-center hover:shadow-md transition-all border-kaya-stone-100 bg-white">
                <div className="text-xs font-semibold text-kaya-navy-900">Employer</div>
                <div className="text-[10px] mt-0.5 text-kaya-stone-400">Vacancies & pipeline</div>
              </a>
              <a href="/psychologist"
                className="p-3 rounded-xl border text-center hover:shadow-md transition-all border-kaya-stone-100 bg-white">
                <div className="text-xs font-semibold text-kaya-navy-900">Psychologist</div>
                <div className="text-[10px] mt-0.5 text-kaya-stone-400">Validate & sign-off</div>
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-kaya-stone-400 mt-6">
          Kaya — Hiring Intelligence by Virtualahan Inc.
        </p>
      </div>
    </div>
  );
}
