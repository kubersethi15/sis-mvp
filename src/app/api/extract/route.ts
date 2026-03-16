import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase';
import { LEEE_EXTRACTION_PROMPT } from '@/lib/prompts';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { session_id } = await req.json();
    if (!session_id) return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });

    const supabase = createServerClient();
    const { data: session } = await supabase.from('leee_sessions').select('*').eq('id', session_id).single();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const { data: messages } = await supabase.from('leee_messages').select('*').eq('session_id', session_id).order('turn_number', { ascending: true });
    if (!messages?.length) return NextResponse.json({ error: 'No messages' }, { status: 400 });

    const transcript = messages.map((m: any) => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`).join('\n');
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5', max_tokens: 4000,
      messages: [{ role: 'user', content: LEEE_EXTRACTION_PROMPT.replace('{transcript}', transcript) }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: 'Parse failed' }, { status: 500 });

    const data = JSON.parse(jsonMatch[0]);
    const { data: extraction } = await supabase.from('leee_extractions').insert({
      session_id, episodes: data.episodes || [], skills_profile: data.skills_profile || [],
      evidence_map: data.skills_profile?.flatMap((s: any) => s.evidence) || [],
      narrative_summary: data.narrative_summary || '', gaming_flags: data.gaming_flags || [],
      layer2_seeds: data.layer2_seeds || [], session_quality: data.session_quality || {},
      extraction_model: 'claude-opus-4-5', extraction_prompt_version: '1.0',
      raw_extraction_response: data,
    }).select().single();

    await supabase.from('leee_sessions').update({
      status: 'completed', ended_at: new Date().toISOString(),
      duration_minutes: Math.floor((Date.now() - new Date(session.started_at).getTime()) / 60000),
    }).eq('id', session_id);

    return NextResponse.json({
      extraction_id: extraction?.id, skills_profile: data.skills_profile,
      narrative_summary: data.narrative_summary, gaming_flags: data.gaming_flags,
      session_quality: data.session_quality, layer2_seeds: data.layer2_seeds,
    });
  } catch (error) {
    console.error('Extraction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
