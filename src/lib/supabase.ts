import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key (for API routes — bypasses RLS)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Extract authenticated user_id from request
// Checks: 1) Supabase JWT in Authorization header, 2) user_id in body (legacy/demo), 3) demo fallback
export async function getAuthenticatedUserId(req: NextRequest, body?: any): Promise<string | null> {
  // 1. Try Supabase JWT from Authorization header
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const authClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { user }, error } = await authClient.auth.getUser(token);
      if (user && !error) return user.id;
    } catch {}
  }

  // 2. Try user_id from request body (legacy — for backward compatibility and demo mode)
  if (body?.user_id) {
    const supabase = createServerClient();
    const { data } = await supabase.from('user_profiles').select('id').eq('id', body.user_id).single();
    if (data) return data.id;
  }

  // 3. Try from jobseeker_profile_id
  if (body?.jobseeker_profile_id) {
    const supabase = createServerClient();
    const { data } = await supabase.from('jobseeker_profiles').select('user_id').eq('id', body.jobseeker_profile_id).single();
    if (data) return data.user_id;
  }

  return null;
}
