// Kaya Auth — Supabase session management
// Provides useAuth hook for client components
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient, User, Session } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profileId: string | null;
  userId: string | null;
  fullName: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null, session: null, loading: true,
    profileId: null, userId: null, fullName: null,
  });

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const userId = session.user.id;
        const fullName = session.user.user_metadata?.full_name || null;
        localStorage.setItem('kaya_user_id', userId);

        // Load profile ID
        const storedProfileId = localStorage.getItem('kaya_jobseeker_profile_id');

        setAuthState({
          user: session.user,
          session,
          loading: false,
          profileId: storedProfileId,
          userId,
          fullName,
        });

        // If no stored profile, try to fetch it
        if (!storedProfileId) {
          fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_by_user', user_id: userId }),
          }).then(r => r.json()).then(data => {
            if (data.profile?.id) {
              localStorage.setItem('kaya_jobseeker_profile_id', data.profile.id);
              setAuthState(prev => ({ ...prev, profileId: data.profile.id }));
            }
          }).catch(() => {});
        }
      } else {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        localStorage.setItem('kaya_user_id', session.user.id);
        setAuthState(prev => ({
          ...prev,
          user: session.user,
          session,
          userId: session.user.id,
          fullName: session.user.user_metadata?.full_name || prev.fullName,
        }));
      } else {
        localStorage.removeItem('kaya_user_id');
        localStorage.removeItem('kaya_jobseeker_profile_id');
        localStorage.removeItem('kaya_last_session_id');
        localStorage.removeItem('kaya_last_extraction');
        setAuthState({
          user: null, session: null, loading: false,
          profileId: null, userId: null, fullName: null,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('kaya_user_id');
    localStorage.removeItem('kaya_jobseeker_profile_id');
    localStorage.removeItem('kaya_last_session_id');
    localStorage.removeItem('kaya_last_extraction');
    window.location.href = '/auth';
  }, []);

  const isAuthenticated = !!authState.user;
  const requireAuth = useCallback(() => {
    if (!authState.loading && !authState.user) {
      window.location.href = '/auth';
    }
  }, [authState.loading, authState.user]);

  return {
    ...authState,
    isAuthenticated,
    signOut,
    requireAuth,
    supabase,
  };
}

// Get the Supabase access token for API calls
export async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}
