import { NextRequest, NextResponse } from 'next/server';
import { LEEE_SCENARIO_PROMPT } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  try {
    const { domain, skill_gap, emotional_register, recent_context } = await req.json();

    const prompt = LEEE_SCENARIO_PROMPT
      .replace('{domain}', domain || 'work')
      .replace('{skill_gap}', skill_gap || 'PS')
      .replace('{emotional_register}', emotional_register || 'conflict')
      .replace('{recent_context}', recent_context || '')
      .replace('{skill_gap}', skill_gap || 'PS'); // second occurrence

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514', // Sonnet fine here — simple JSON generation
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    const text = data.content?.find((b: any) => b.type === 'text')?.text || '';

    // Parse JSON from response
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: 'Failed to generate scenario' }, { status: 500 });
    }

    const scenario = JSON.parse(match[0]);
    return NextResponse.json({ scenario });

  } catch (error: any) {
    console.error('Scenario API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
