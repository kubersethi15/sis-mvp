// Chat API Route - POST /api/chat
// Connects the LEEE orchestrator to Claude API
// Persists sessions and messages to Supabase

import { NextRequest, NextResponse } from 'next/server';
import { LEEEOrchestrator } from '@/lib/orchestrator';
import { LEEESession, LEEEMessage, GapScanResult } from '@/types';
import { LEEE_GAP_SCAN_PROMPT, LEEE_EXTRACTION_PROMPT } from '@/lib/prompts';
import { createServerClient } from '@/lib/supabase';

// In-memory orchestrator cache (sessions + messages persisted to Supabase)
const orchestrators = new Map<string, LEEEOrchestrator>();

function db() {
  return createServerClient();
}

async function ensureDemoUser(): Promise<string> {
  const supabase = db();
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('full_name', 'Demo User')
    .limit(1)
    .single();
  
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('user_profiles')
    .insert({ full_name: 'Demo User', role: 'jobseeker', email: 'demo@sis.virtualahan.com' })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error creating demo user:', error);
    throw error;
  }
  return created.id;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, message, action } = body;

    if (action === 'start') return handleStart(body);
    if (action === 'extract') return handleExtract(session_id);

    if (!session_id || !message) {
      return NextResponse.json({ error: 'session_id and message required' }, { status: 400 });
    }

    let orchestrator = orchestrators.get(session_id);
    if (!orchestrator) {
      orchestrator = await rebuildOrchestrator(session_id);
      if (!orchestrator) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const state = orchestrator.getState();
    const turn = state.messages.length + 1;

    const userMsg: LEEEMessage = {
      id: crypto.randomUUID(), session_id, role: 'user', content: message,
      moth_stage: orchestrator.getState().currentStage, turn_number: turn,
      created_at: new Date().toISOString(),
    };
    orchestrator.addMessage(userMsg);
    await saveMessage(userMsg);

    const updatedState = orchestrator.getState();
    if (updatedState.currentStage === 'verification' && updatedState.storiesCompleted > 0 && !updatedState.gapScan) {
      await runGapScan(orchestrator);
    }

    if (orchestrator.shouldEndSession()) {
      const closing = await callClaude(orchestrator);
      const aMsg: LEEEMessage = {
        id: crypto.randomUUID(), session_id, role: 'assistant', content: closing,
        moth_stage: 'closing', turn_number: turn + 1, created_at: new Date().toISOString(),
      };
      orchestrator.addMessage(aMsg);
      await saveMessage(aMsg);

      await db().from('leee_sessions').update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        duration_minutes: Math.floor((Date.now() - new Date(updatedState.session.started_at).getTime()) / 60000),
        current_stage: 'closing',
        stories_completed: updatedState.storiesCompleted,
        skills_evidenced: updatedState.gapScan || {},
      }).eq('id', session_id);

      return NextResponse.json({
        message: closing, session_status: 'completed', stage: 'closing',
        stories_completed: updatedState.storiesCompleted, should_extract: true,
      });
    }

    const aiText = await callClaude(orchestrator);
    const aMsg: LEEEMessage = {
      id: crypto.randomUUID(), session_id, role: 'assistant', content: aiText,
      moth_stage: orchestrator.getState().currentStage, turn_number: turn + 1,
      created_at: new Date().toISOString(),
    };
    orchestrator.addMessage(aMsg);
    await saveMessage(aMsg);

    const finalState = orchestrator.getState();
    await db().from('leee_sessions').update({
      current_stage: finalState.currentStage,
      stories_completed: finalState.storiesCompleted,
      skills_evidenced: finalState.gapScan || {},
      updated_at: new Date().toISOString(),
    }).eq('id', session_id);

    return NextResponse.json({
      message: aiText, session_status: 'active', stage: finalState.currentStage,
      stories_completed: finalState.storiesCompleted, skills_evidenced: finalState.gapScan,
      should_extract: false,
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleStart(body: any) {
  const supabase = db();
  const userId = await ensureDemoUser();

  const { data: session, error } = await supabase
    .from('leee_sessions')
    .insert({
      user_id: userId,
      status: 'active',
      current_stage: 'opening',
      stories_completed: 0,
      language_used: body.language || 'en',
      accessibility_mode: body.accessibility_mode || {},
      skills_evidenced: {},
      skills_gaps: {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }

  const leeeSession: LEEESession = {
    id: session.id, user_id: userId, status: 'active', current_stage: 'opening',
    stories_completed: 0, language_used: body.language || 'en',
    accessibility_mode: body.accessibility_mode || {},
    started_at: session.started_at, skills_evidenced: {}, skills_gaps: {},
  };

  const orchestrator = new LEEEOrchestrator(leeeSession);
  orchestrators.set(session.id, orchestrator);

  return NextResponse.json({ session_id: session.id, session_status: 'active', stage: 'opening' });
}

async function rebuildOrchestrator(sessionId: string): Promise<LEEEOrchestrator | null> {
  const supabase = db();
  const { data: session } = await supabase.from('leee_sessions').select('*').eq('id', sessionId).single();
  if (!session) return null;

  const { data: messages } = await supabase.from('leee_messages').select('*').eq('session_id', sessionId).order('turn_number', { ascending: true });

  const leeeSession: LEEESession = {
    id: session.id, user_id: session.user_id, status: session.status,
    current_stage: session.current_stage, stories_completed: session.stories_completed,
    language_used: session.language_used, accessibility_mode: session.accessibility_mode || {},
    started_at: session.started_at, skills_evidenced: session.skills_evidenced || {},
    skills_gaps: session.skills_gaps || {},
  };

  const leeeMessages: LEEEMessage[] = (messages || []).map((m: any) => ({
    id: m.id, session_id: m.session_id, role: m.role, content: m.content,
    moth_stage: m.moth_stage, prompt_id: m.prompt_id, probe_type: m.probe_type,
    turn_number: m.turn_number, created_at: m.created_at,
  }));

  const orchestrator = new LEEEOrchestrator(leeeSession, leeeMessages);
  orchestrators.set(sessionId, orchestrator);
  return orchestrator;
}

async function saveMessage(msg: LEEEMessage) {
  const { error } = await db().from('leee_messages').insert({
    id: msg.id, session_id: msg.session_id, role: msg.role, content: msg.content,
    moth_stage: msg.moth_stage, prompt_id: msg.prompt_id || null,
    probe_type: msg.probe_type || null, turn_number: msg.turn_number,
  });
  if (error) console.error('Error saving message:', error);
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
  let orchestrator = orchestrators.get(sessionId);
  if (!orchestrator) {
    orchestrator = await rebuildOrchestrator(sessionId);
    if (!orchestrator) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const prompt = LEEE_EXTRACTION_PROMPT.replace('{transcript}', orchestrator.getTranscript());
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
      if (match) {
        const extraction = JSON.parse(match[0]);

        await db().from('leee_extractions').insert({
          session_id: sessionId,
          episodes: extraction.episodes || [],
          skills_profile: extraction.skills_profile || [],
          evidence_map: extraction.evidence_map || [],
          narrative_summary: extraction.narrative_summary || '',
          gaming_flags: extraction.gaming_flags || [],
          layer2_seeds: extraction.layer2_seeds || [],
          layer3_recommendations: extraction.layer3_recommendations || [],
          session_quality: extraction.session_quality || {},
          extraction_model: 'claude-sonnet-4-20250514',
          extraction_prompt_version: '1.0',
          raw_extraction_response: extraction,
        });

        return NextResponse.json({ extraction, session_id: sessionId, status: 'extracted' });
      }
    }
    return NextResponse.json({ error: 'Extraction failed to parse' }, { status: 500 });
  } catch (e: any) {
    console.error('Extraction error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
