/**
 * Load test auth helpers.
 *
 * Creates ephemeral test users via the Supabase admin API (using service_role).
 * Users are marked with the load_test_run_id in their email for clean cleanup.
 * Each test user gets a real JWT we can use to make authenticated API calls.
 *
 * NOTE: this requires SUPABASE_SERVICE_ROLE_KEY in the env. The harness will
 * NEVER write that key to a file or transmit it to the deployed server. It
 * stays local for user creation only.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

export interface TestUser {
  userId: string;
  email: string;
  password: string;
  jwt: string;
  runId: string;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

let adminClient: SupabaseClient | null = null;
function getAdmin(): SupabaseClient {
  if (adminClient) return adminClient;
  adminClient = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  return adminClient;
}

/**
 * Create a new test user. The email follows the pattern:
 *   loadtest+<runId>-<uuid>@kaya-test.invalid
 *
 * `.invalid` is a reserved TLD that can never resolve to a real domain (RFC 2606),
 * so even if these somehow escaped cleanup, no real email is ever sent.
 *
 * The user is created with email_confirm=true so they can sign in immediately
 * without going through the confirmation flow.
 */
export async function createTestUser(runId: string): Promise<TestUser> {
  const admin = getAdmin();
  const password = 'LoadTest_' + randomUUID().replace(/-/g, '').slice(0, 16);
  const email = `loadtest+${runId}-${randomUUID().slice(0, 8)}@kaya-test.invalid`;

  // 1. Create the auth user
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: `Load Test User ${runId.slice(0, 6)}`,
      load_test_run_id: runId,
    },
  });
  if (createErr) throw new Error(`createUser failed: ${createErr.message}`);
  if (!created.user) throw new Error('createUser returned no user');

  // 2. Sign in to get a JWT
  const userClient = createClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  );
  const { data: signIn, error: signInErr } = await userClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signInErr) throw new Error(`signIn failed: ${signInErr.message}`);
  if (!signIn.session) throw new Error('signIn returned no session');

  return {
    userId: created.user.id,
    email,
    password,
    jwt: signIn.session.access_token,
    runId,
  };
}

/**
 * Make an authenticated API call using a test user's JWT.
 * Returns { status, body, latencyMs } for measurement.
 */
export async function authFetch(
  user: TestUser,
  baseUrl: string,
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; body: any; latencyMs: number; error?: string }> {
  const t0 = Date.now();
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.jwt}`,
        ...(init.headers || {}),
      },
    });
    const latencyMs = Date.now() - t0;
    let body: any = null;
    try {
      const text = await res.text();
      body = text ? JSON.parse(text) : null;
    } catch (parseErr: any) {
      return {
        status: res.status,
        body: null,
        latencyMs,
        error: `json_parse_error: ${parseErr.message}`,
      };
    }
    return { status: res.status, body, latencyMs };
  } catch (err: any) {
    return {
      status: 0,
      body: null,
      latencyMs: Date.now() - t0,
      error: `network_error: ${err.message}`,
    };
  }
}

/**
 * Delete all test users + their data for a given run_id.
 * Idempotent — safe to call even if some test data is already gone.
 */
export async function cleanupRun(runId: string): Promise<{ usersDeleted: number; errors: string[] }> {
  const admin = getAdmin();
  const errors: string[] = [];

  // Find all auth users with this run_id in metadata
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) {
    errors.push(`listUsers failed: ${error.message}`);
    return { usersDeleted: 0, errors };
  }

  const testUsers = data.users.filter(
    (u: any) => u.user_metadata?.load_test_run_id === runId
  );

  let deletedCount = 0;
  for (const user of testUsers) {
    // Delete the auth user. The service_role bypasses RLS, so cascading delete
    // of profile/session data depends on whether FKs have ON DELETE CASCADE.
    // For now, we do auth deletion only — application data with FK pointing to
    // this auth user becomes orphaned but inaccessible (FK to auth.users isn't
    // enforced at the app layer). A periodic cleanup job can sweep orphans.
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      errors.push(`delete ${user.id} failed: ${delErr.message}`);
    } else {
      deletedCount++;
    }
  }

  // Also clean up application data tied to this run.
  // user_profiles where load_test_run_id metadata is in the email pattern.
  const tablesToClean = [
    'leee_extractions',
    'leee_messages',
    'leee_sessions',
    'jobseeker_profiles',
    'user_profiles',
  ];
  for (const table of tablesToClean) {
    try {
      // We delete via service_role (bypasses RLS).
      // For tables without a direct user reference, we go via auth user IDs.
      const userIds = testUsers.map((u: any) => u.id);
      if (userIds.length === 0) continue;

      if (table === 'leee_messages' || table === 'leee_extractions') {
        // Indirect — via session_id
        const { data: sessions } = await admin
          .from('leee_sessions')
          .select('id')
          .in('user_id', userIds);
        const sessionIds = sessions?.map((s: any) => s.id) || [];
        if (sessionIds.length > 0) {
          await admin.from(table).delete().in('session_id', sessionIds);
        }
      } else if (table === 'user_profiles') {
        await admin.from(table).delete().in('id', userIds);
      } else {
        await admin.from(table).delete().in('user_id', userIds);
      }
    } catch (err: any) {
      errors.push(`cleanup ${table} failed: ${err.message}`);
    }
  }

  return { usersDeleted: deletedCount, errors };
}

/**
 * Generate a fresh run ID. Format: timestamp-random for human readability +
 * uniqueness across runs.
 */
export function newRunId(): string {
  const ts = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const rand = randomUUID().slice(0, 8);
  return `${ts}-${rand}`;
}
