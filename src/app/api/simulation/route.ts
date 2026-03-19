import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const { action, recent_context, skill_gap, user_response, simulation_state } = await req.json();

    if (action === 'generate') {
      const result = await callLLM({
        system: `You generate micro role-play simulations for the Kaya skills assessment platform (Philippines).
The simulation must:
1. Be contextual — relate to what the user was just discussing
2. Test a specific PSF (Philippine Skills Framework) skill
3. Be set in a Filipino context (Cebuana Lhuillier branch, barangay, community, family business, school)
4. Be SHORT — the user will only have 2-3 exchanges
5. Feel natural, warm, realistic — not like a test

RESPOND WITH ONLY THIS JSON, NO OTHER TEXT:
{
  "simulation_id": "SIM-001",
  "title": "3-5 word title",
  "psf_skill_tested": "exact PSF skill name",
  "pqf_level": "intermediate",
  "setting": "1 sentence describing where this takes place",
  "opening_line": "What the other person says to start (max 2 sentences, in character)",
  "character_name": "A Filipino first name",
  "character_role": "e.g. Upset customer, New team member, Concerned parent",
  "character_instruction": "Hidden behavior guide: emotional state, what they want, how they respond to empathy vs dismissal",
  "extraction_focus": "What behavioral evidence to look for in responses",
  "max_rounds": 3
}`,
        messages: [{
          role: 'user',
          content: `Generate a micro role-play simulation.
Target PSF skill: ${skill_gap || 'Communication'}
Recent conversation: ${recent_context || 'General conversation'}
Make it relevant, warm, and Filipino.`,
        }],
        maxTokens: 800,
      });

      const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      try {
        return NextResponse.json({ simulation: JSON.parse(cleaned), provider: result.provider });
      } catch {
        return NextResponse.json({ error: 'Parse failed', raw: result.text }, { status: 500 });
      }
    }

    if (action === 'respond') {
      const round = simulation_state.current_round || 1;
      const maxRounds = simulation_state.max_rounds || 3;
      const isFinal = round >= maxRounds;

      const result = await callLLM({
        system: `You are playing a character in a role-play simulation for skills assessment.

CHARACTER: ${simulation_state.character_name} (${simulation_state.character_role})
SETTING: ${simulation_state.setting}
BEHAVIOR: ${simulation_state.character_instruction}
ROUND: ${round} of ${maxRounds}

Stay in character. 1-2 sentences max. React naturally to the user.
If empathetic → soften. If dismissive → escalate slightly.
${isFinal ? 'This is the FINAL round — begin to resolve.' : ''}

RESPOND WITH ONLY THIS JSON:
{
  "character_response": "1-2 sentences in character",
  "emotional_state": "calm|frustrated|appreciative|anxious|relieved",
  "is_final_round": ${isFinal},
  "skill_signals": ["PSF skills demonstrated by user"],
  "evidence_note": "Brief note on what response reveals"
}`,
        messages: [{
          role: 'user',
          content: `User responded: "${user_response}"
Previous exchanges:
${(simulation_state.history || []).map((h: any) => `${h.role}: ${h.text}`).join('\n')}`,
        }],
        maxTokens: 400,
      });

      const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      try {
        return NextResponse.json({ response: JSON.parse(cleaned), provider: result.provider });
      } catch {
        return NextResponse.json({ error: 'Parse failed', raw: result.text }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: any) {
    console.error('Simulation API error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
