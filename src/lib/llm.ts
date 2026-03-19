// Shared LLM utility — Claude primary, Gemini fallback
// Used by both Aya chat and extraction pipeline

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface LLMRequest {
  system?: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  maxTokens: number;
  model?: string; // Anthropic model name
}

interface LLMResponse {
  text: string;
  provider: 'anthropic' | 'gemini';
  model: string;
}

// Call Claude (Anthropic)
async function callAnthropic(req: LLMRequest): Promise<LLMResponse> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not set');

  const model = req.model || 'claude-sonnet-4-20250514';
  const body: any = {
    model,
    max_tokens: req.maxTokens,
    messages: req.messages,
  };
  if (req.system) body.system = req.system;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.content?.find((b: any) => b.type === 'text')?.text || '';

    return { text, provider: 'anthropic', model };
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// Call Gemini (Google AI)
async function callGemini(req: LLMRequest): Promise<LLMResponse> {
  if (!GEMINI_API_KEY) throw new Error('GOOGLE_AI_API_KEY not set');

  // Convert Anthropic message format to Gemini format
  const contents: any[] = [];

  // Gemini doesn't have a system parameter in the same way —
  // prepend system as first user message context
  if (req.system) {
    contents.push({
      role: 'user',
      parts: [{ text: `[System instructions — follow these throughout the conversation]\n\n${req.system}\n\n[End of system instructions. Now respond to the conversation below.]` }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I will follow these instructions.' }],
    });
  }

  for (const msg of req.messages) {
    contents.push({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    });
  }

  // Use Gemini 2.0 Flash for speed
  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          maxOutputTokens: req.maxTokens,
          temperature: 0.7,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini ${res.status}: ${err}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return { text, provider: 'gemini', model };
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// Main function — try Claude first, fall back to Gemini
export async function callLLM(req: LLMRequest): Promise<LLMResponse> {
  // Try Anthropic first
  try {
    return await callAnthropic(req);
  } catch (anthropicError: any) {
    const status = anthropicError.message?.match(/Anthropic (\d+)/)?.[1];
    const isRetryable = status === '429' || status === '500' || status === '502' || status === '503' ||
      anthropicError.name === 'AbortError' || anthropicError.message?.includes('ECONNREFUSED');

    if (!isRetryable || !GEMINI_API_KEY) {
      throw anthropicError; // Not retryable or no Gemini key — fail
    }

    console.warn(`[LLM Fallback] Anthropic failed (${anthropicError.message}), trying Gemini...`);

    try {
      const result = await callGemini(req);
      console.log(`[LLM Fallback] Gemini succeeded (${result.model})`);
      return result;
    } catch (geminiError: any) {
      console.error(`[LLM Fallback] Gemini also failed: ${geminiError.message}`);
      throw new Error(`Both providers failed. Anthropic: ${anthropicError.message}. Gemini: ${geminiError.message}`);
    }
  }
}

// Convenience: call for JSON extraction (strips markdown fences, parses)
export async function callLLMForJSON(req: LLMRequest): Promise<{ data: any; provider: string; model: string }> {
  const result = await callLLM(req);
  const cleaned = result.text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    return { data: JSON.parse(cleaned), provider: result.provider, model: result.model };
  } catch (e) {
    // Try to repair truncated JSON
    let repaired = cleaned;
    const openQuotes = (repaired.match(/"/g) || []).length;
    if (openQuotes % 2 !== 0) repaired += '"';

    let openBraces = 0, openBrackets = 0, inString = false;
    for (let i = 0; i < repaired.length; i++) {
      const ch = repaired[i];
      if (ch === '"' && (i === 0 || repaired[i - 1] !== '\\')) inString = !inString;
      if (!inString) {
        if (ch === '{') openBraces++;
        if (ch === '}') openBraces--;
        if (ch === '[') openBrackets++;
        if (ch === ']') openBrackets--;
      }
    }
    repaired += ']'.repeat(Math.max(0, openBrackets)) + '}'.repeat(Math.max(0, openBraces));

    return { data: JSON.parse(repaired), provider: result.provider, model: result.model };
  }
}
