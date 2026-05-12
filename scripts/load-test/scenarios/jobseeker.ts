/**
 * Single jobseeker journey for load testing.
 *
 * Each call to runJobseekerJourney() simulates one full user going through:
 *   1. signup (admin API)
 *   2. start_session (POST /api/chat action=start)
 *   3. send N user messages (POST /api/chat with session_id+message)
 *   4. trigger extraction (POST /api/chat action=extract)
 *   5. fetch profile (POST /api/profile action=get_by_user)
 *
 * Each stage timed. Failures classified. Partial completion captured.
 *
 * The function returns a UserJourneyResult that aggregates everything,
 * which the orchestrator combines across N concurrent users.
 */

import {
  createTestUser,
  authFetch,
  TestUser,
} from '../lib/auth.js';
import {
  StageResult,
  UserJourneyResult,
  runStage,
  sleep,
  classifyError,
} from '../lib/measure.js';
import { pickRandomScript } from './conversation.js';

export interface JourneyConfig {
  baseUrl: string;
  runId: string;
  // Min/max number of messages to send before triggering extraction.
  // Default 6-10 (realistic LEEE conversation length).
  minMessages?: number;
  maxMessages?: number;
  // Optional: delay between messages (ms). Simulates a real user typing.
  // Default 500ms to keep load tests fast; real users take ~10-30s per turn.
  messageDelayMs?: number;
}

export async function runJobseekerJourney(
  config: JourneyConfig
): Promise<UserJourneyResult> {
  const startedAt = new Date().toISOString();
  const t0 = Date.now();
  const stages: StageResult[] = [];
  let user: TestUser | null = null;
  let sessionId: string | null = null;
  let completed = false;
  let failedStage: string | undefined;

  const script = pickRandomScript();
  const minMsg = config.minMessages ?? 6;
  const maxMsg = config.maxMessages ?? Math.min(10, script.responses.length);
  const numMessages = minMsg + Math.floor(Math.random() * (maxMsg - minMsg + 1));

  try {
    // ───── Stage 1: signup ─────
    const signupResult = await runStage('signup', async () => {
      const t0 = Date.now();
      try {
        user = await createTestUser(config.runId);
        return {
          status: 200,
          body: { userId: user.userId },
          latencyMs: Date.now() - t0,
        };
      } catch (err: any) {
        return {
          status: 500,
          body: null,
          latencyMs: Date.now() - t0,
          error: `signup_failed: ${err.message}`,
        };
      }
    });
    stages.push(signupResult);
    if (!signupResult.success || !user) {
      failedStage = 'signup';
      return finalize();
    }

    // ───── Stage 2: start session ─────
    const startResult = await runStage('start_session', () =>
      authFetch(user!, config.baseUrl, '/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          action: 'start',
          user_id: user!.userId,
          full_name: `Load Test User ${config.runId.slice(0, 6)}`,
        }),
      })
    );
    stages.push(startResult);
    if (!startResult.success) {
      failedStage = 'start_session';
      return finalize();
    }
    // Extract session_id from response body. The API may return it under
    // different keys depending on the route version, so check multiple shapes.
    sessionId =
      startResult.body?.session?.id ||
      startResult.body?.session_id ||
      startResult.body?.id ||
      null;
    if (!sessionId) {
      failedStage = 'start_session';
      stages[stages.length - 1].success = false;
      stages[stages.length - 1].errorClass = 'missing_session_id';
      stages[stages.length - 1].errorDetail = `start_session response had no session id. Body keys: ${Object.keys(startResult.body || {}).join(',')}`;
      return finalize();
    }

    // ───── Stage 3: send messages (LEEE conversation) ─────
    const messageDelay = config.messageDelayMs ?? 500;
    for (let i = 0; i < numMessages; i++) {
      const content = script.responses[i % script.responses.length];
      const msgResult = await runStage(`message_${String(i + 1).padStart(2, '0')}`, () =>
        authFetch(user!, config.baseUrl, '/api/chat', {
          method: 'POST',
          body: JSON.stringify({ session_id: sessionId, message: content }),
        })
      );
      stages.push(msgResult);
      if (!msgResult.success) {
        failedStage = msgResult.stage;
        return finalize();
      }
      if (i < numMessages - 1) await sleep(messageDelay);
    }

    // ───── Stage 4: trigger extraction ─────
    const extractResult = await runStage(
      'extract',
      () =>
        authFetch(user!, config.baseUrl, '/api/chat', {
          method: 'POST',
          body: JSON.stringify({ session_id: sessionId, action: 'extract' }),
        }),
      { maxRetries: 0 } // extraction is expensive, don't retry
    );
    stages.push(extractResult);
    if (!extractResult.success) {
      failedStage = 'extract';
      return finalize();
    }

    // ───── Stage 5: fetch profile ─────
    const profileResult = await runStage('fetch_profile', () =>
      authFetch(user!, config.baseUrl, '/api/profile', {
        method: 'POST',
        body: JSON.stringify({ action: 'get_by_user', user_id: user!.userId }),
      })
    );
    stages.push(profileResult);
    if (!profileResult.success) {
      failedStage = 'fetch_profile';
      return finalize();
    }

    completed = true;
  } catch (err: any) {
    // Catch-all for unexpected errors
    stages.push({
      stage: 'unexpected',
      success: false,
      latencyMs: Date.now() - t0,
      errorClass: 'harness_error',
      errorDetail: err.message,
      retryCount: 0,
    });
    failedStage = 'unexpected';
  }

  return finalize();

  function finalize(): UserJourneyResult {
    return {
      runId: config.runId,
      userId: user?.userId || 'unknown',
      email: user?.email || 'unknown',
      startedAt,
      finishedAt: new Date().toISOString(),
      totalLatencyMs: Date.now() - t0,
      stages,
      completed,
      failedStage,
    };
  }
}
