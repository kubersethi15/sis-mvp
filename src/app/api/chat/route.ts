// Chat API Route - POST /api/chat
// Connects the LEEE orchestrator to Claude API

import { NextRequest, NextResponse } from 'next/server';
import { LEEEOrchestrator } from '@/lib/orchestrator';
import { LEEESession, LEEEMessage, GapScanResult } from '@/types';
import { LEEE_GAP_SCAN_PROMPT, LEEE_EXTRACTION_PROMPT } from '@/lib/prompts';

// In-memory session store for MVP (replace with Supabase)
const sessions = new Map<string, {
  session: LEEESession;
  messages: LEEEMessage[];
  orchestrator: LEEEOrchestrator;
}>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, message, action } = body;

    if (action === 'start') return handleStart(body);
    if (action === 'extract') return handleExtract(session_id);

    if (!session_id || !message) {
      return NextResponse.json({ error: 'session_id and message required' }, { status: 400 });
    }

    const data = sessions.get(session_id);
    if (!data) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const { orchestrator } = data;
    const turn = data.messages.length + 1;

    // Add user message
    const userMsg: LEEEMessage = {
      id: crypto.randomUUID(), session_id, role: 'user', content: message,
      moth_stage: orchestrator.getState().currentStage, turn_number: turn,
      created_at: new Date().toISOString(),
    };
    orchestrator.addMessage(userMsg);
    data.messages.push(userMsg);

    // Gap scan after story 1 verification
    const state = orchestrator.getState();
    if (state.currentStage === 'verification' && state.storiesCompleted > 0 && !state.gapScan) {
      await runGapScan(orchestrator);
    }

    // Check session end
    if (orchestrator.shouldEndSession()) {
      const closing = await callClaude(orchestrator);
      const aMsg: LEEEMessage = {
        id: crypto.randomUUID(), session_id, role: 'assistant', content: closing,
        moth_stage: 'closing', turn_number: turn + 1, created_at: new Date().toISOString(),
      };
      orchestrator.addMessage(aMsg);
      data.messages.push(aMsg);
      data.session.status = 'completed';
      data.session.ended_at = new Date().toISOString();

      return NextResponse.json({
        message: closing, session_status: 'completed', stage: 'closing',
        stories_completed: state.storiesCompleted, should_extract: true,
      });
    }

    // Generate response
    const aiText = await callClaude(orchestrator);
    const aMsg: LEEEMessage = {
      id: crypto.randomUUID(), session_id, role: 'assistant', content: aiText,
      moth_stage: orchestrator.getState().currentStage, turn_number: turn + 1,
      created_at: new Date().toISOString(),
    };
    orchestrator.addMessage(aMsg);
    data.messages.push(aMsg);

    const updated = orchestrator.getState();
    return NextResponse.json({
      message: aiText, session_status: data.session.status, stage: updated.currentStage,
      stories_completed: updated.storiesCompleted, skills_evidenced: updated.gapScan,
      should_extract: false,
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function handleStart(body: any) {
  const id = crypto.randomUUID();
  const session: LEEESession = {
    id, user_id: 'demo-user', status: 'active', current_stage: 'opening',
    stories_completed: 0, language_used: body.language || 'en',
    accessibility_mode: body.accessibility_mode || {},
    started_at: new Date().toISOString(), skills_evidenced: {}, skills_gaps: {},
  };
  const orchestrator = new LEEEOrchestrator(session);
  sessions.set(id, { session, messages: [], orchestrator });
  return NextResponse.json({ session_id: id, session_status: 'active', stage: 'opening' });
}

async function callClaude(orchestrator: LEEEOrchestrator): Promise<string> {
  const msgs = orchestrator.buildLLMMessages();
  const system = msgs[0].content;
  let conversation = msgs.slice(1).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  if (conversation.length === 0) {
    conversation = [{ role: 'user', content: '[Session started. Greet the user warmly and begin.]' }];
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, system, messages: conversation }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('Claude API error:', err);
    return "Thank you for sharing. Could you tell me more about what happened next?";
  }

  const data = await res.json();
  const text = data.content?.find((b: any) => b.type === 'text')?.text;
  return text || "Could you tell me a bit more about that?";
}

async function runGapScan(orchestrator: LEEEOrchestrator) {
  const prompt = LEEE_GAP_SCAN_PROMPT.replace('{story_transcript}', orchestrator.getTranscript());
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 200, messages: [{ role: 'user', content: prompt }] }),
    });
    const data = await res.json();
    const text = data.content?.find((b: any) => b.type === 'text')?.text;
    if (text) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) orchestrator.updateGapScan(JSON.parse(match[0]) as GapScanResult);
    }
  } catch (e) { console.error('Gap scan error:', e); }
}

async function handleExtract(sessionId: string) {
  const data = sessions.get(sessionId);
  if (!data) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const prompt = LEEE_EXTRACTION_PROMPT.replace('{transcript}', data.orchestrator.getTranscript());
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] }),
    });
    const result = await res.json();
    const text = result.content?.find((b: any) => b.type === 'text')?.text;
    if (text) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return NextResponse.json({ extraction: JSON.parse(match[0]), session_id: sessionId, status: 'extracted' });
    }
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
