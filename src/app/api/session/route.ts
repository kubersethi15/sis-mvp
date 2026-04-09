// POST /api/session
// Creates a new LEEE conversation session and returns the opening message from Aya

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase';
import { LEEE_SYSTEM_PROMPT } from '@/lib/prompts';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Route to get_messages for session resume
    if (action === 'get_messages') return getSessionMessages(body);

    // Original session creation logic
    const { user_id, language = 'en', accessibility_mode = {} } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // 1. Create session
    const { data: session, error } = await supabase
      .from('leee_sessions')
      .insert({
        user_id,
        status: 'active',
        current_stage: 'opening',
        stories_completed: 0,
        language_used: language,
        accessibility_mode: accessibility_mode,
        started_at: new Date().toISOString(),
        skills_evidenced: {},
        skills_gaps: {},
      })
      .select()
      .single();

    if (error || !session) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    // 2. Generate Aya's opening message
    const openingContext = `
## CURRENT SESSION STATE
- Current stage: opening
- Stories completed: 0/3
- Session just started
- Language preference: ${language}
- Accessibility mode: ${JSON.stringify(accessibility_mode)}

This is the very first message of the session. Welcome the user warmly. Use the Opening prompts (F01-F04, F09). Keep it natural and inviting — not a wall of text. 2-3 short sentences max. Make them feel comfortable.
`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: LEEE_SYSTEM_PROMPT + '\n\n' + openingContext,
      messages: [
        { role: 'user', content: '[Session started — generate your opening greeting]' }
      ],
    });

    const openingMessage = response.content[0].type === 'text'
      ? response.content[0].text
      : 'Hi! I\'m here to listen to your stories. We\'ll talk about real experiences from your life. There are no right or wrong answers.';

    // 3. Save opening message
    await supabase
      .from('leee_messages')
      .insert({
        session_id: session.id,
        role: 'assistant',
        content: openingMessage,
        moth_stage: 'opening',
        prompt_id: 'F01',
        turn_number: 1,
      });

    return NextResponse.json({
      session_id: session.id,
      message: openingMessage,
      session_state: {
        current_stage: 'opening',
        stories_completed: 0,
        should_end: false,
        duration_minutes: 0,
      },
    });

  } catch (error: any) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// Get messages for an existing session (for resume)
async function getSessionMessages(body: any) {
  const { session_id } = body;
  if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 });

  const supabase = createServerClient();

  const { data: session } = await supabase.from('leee_sessions')
    .select('*').eq('id', session_id).single();

  if (!session) return NextResponse.json({ messages: [], session: null });

  const { data: messages } = await supabase.from('leee_messages')
    .select('*').eq('session_id', session_id)
    .order('turn_number', { ascending: true });

  return NextResponse.json({ session, messages: messages || [] });
}
