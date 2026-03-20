import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';

export async function POST(req: NextRequest) {
  try {
    const { action, recent_context, skills_already_evidenced, skills_not_yet_evidenced, skill_gap, user_response, simulation_state } = await req.json();

    if (action === 'generate') {
      const evidenced = skills_already_evidenced || [];
      const gaps = skills_not_yet_evidenced || [];

      const result = await callLLM({
        system: `You generate micro role-play simulations for the Kaya skills assessment platform (Philippines).

YOUR ROLE: You are Aya's strategic brain. You decide what to test and how. You have two goals:
1. Deepen evidence on skills that have weak evidence (upgrade confidence)
2. Surface evidence for skills not yet seen (fill gaps)

YOU DECIDE which is more valuable based on the conversation context. If the user just told a rich story about customer service, a simulation that deepens Customer Orientation or Communication evidence may be MORE valuable than testing an unrelated gap. But if the conversation has been narrow (e.g., only family stories), steering toward a work simulation to test Problem Solving or Collaboration might be better.

Think like a skilled assessor: what simulation would produce the richest behavioral evidence for this specific person right now?

SIKOLOHIYANG PILIPINO — CULTURAL GROUNDING:
Your simulations must be culturally grounded in Filipino psychology, not generic Western role-plays.

Design characters who bring REAL Filipino social dynamics:
- A character motivated by UTANG NA LOOB: "Kuya, you helped me get this job. Now I need a favor but I'm scared to ask..." (tests how the user handles obligation and reciprocity)
- A character experiencing HIYA: "I made a mistake but I'm too embarrassed to tell the supervisor. Can you help me?" (tests empathy, problem-solving, leadership)
- A situation requiring PAKIKIRAMDAM: The character doesn't directly state their problem — the user has to SENSE what's wrong. "Ate seems quieter than usual at work today..." (tests emotional intelligence and interpersonal sensitivity)
- A BAYANIHAN moment: "There's a flood in the barangay and we need to organize supplies but nobody is taking charge..." (tests initiative, collaboration, leadership)
- A KAPWA dilemma: A situation where helping one person means disappointing another — both are valid relationships. Tests values-based decision making.

Use Filipino honorifics (Ate, Kuya, Tita, Lola, Boss), real settings (Cebuana branch, palengke, barangay hall, sari-sari store, OFW family group chat), and authentic emotional dynamics.

RULES:
1. Be contextual — relate to what the user was just discussing
2. Test a specific PSF (Philippine Skills Framework) skill
3. Culturally grounded Filipino context using SP concepts
4. SHORT — 2-3 exchanges only
5. Warm, realistic, not like a test
6. The character should feel real — give them a Filipino name, a personality, a reason for their behavior
7. The situation should have no obviously right answer — genuine dilemma

RESPOND WITH ONLY THIS JSON:
{
  "simulation_id": "SIM-001",
  "title": "3-5 word title",
  "psf_skill_tested": "exact PSF skill name",
  "pqf_level": "intermediate",
  "sp_concept": "primary SP concept: kapwa|pakikiramdam|bayanihan|hiya|utang_na_loob",
  "assessment_rationale": "1 sentence: why you chose to test THIS skill in THIS way",
  "setting": "1 sentence describing where this takes place",
  "opening_line": "What the character says to start (max 2 sentences, in character)",
  "character_name": "A Filipino first name",
  "character_role": "e.g. Ate Maria - worried customer, Kuya Jun - shy new hire",
  "character_instruction": "Hidden: emotional state, what they want, SP dynamics at play, how they respond to empathy vs dismissal",
  "extraction_focus": "What behavioral evidence to look for: pakikiramdam signals, kapwa orientation, de-escalation, solution-oriented thinking",
  "max_rounds": 3
}`,
        messages: [{
          role: 'user',
          content: `Generate a micro role-play simulation.

SKILLS ALREADY EVIDENCED: ${evidenced.length > 0 ? evidenced.join(', ') : 'None yet'}
SKILLS NOT YET EVIDENCED: ${gaps.length > 0 ? gaps.join(', ') : 'All covered'}
RECENT CONVERSATION (last 10 messages):
${recent_context || 'General conversation'}

Decide what to test. Explain your reasoning in assessment_rationale.`,
        }],
        maxTokens: 900,
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
