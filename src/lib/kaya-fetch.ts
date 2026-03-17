// Kaya API client — authenticated fetch wrapper
// Automatically attaches Supabase JWT to all API calls

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function kayaFetch(url: string, body: any): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch {}

  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

// Shorthand for common patterns
export async function kayaApi(url: string, body: any): Promise<any> {
  const res = await kayaFetch(url, body);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
