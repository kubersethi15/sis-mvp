import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    // Try OpenAI TTS first (if key available)
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'tts-1',
          input: text.substring(0, 4096),
          voice: 'nova', // warm female voice
          response_format: 'mp3',
          speed: 0.95,
        }),
      });

      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    // Fallback: return text for browser TTS
    return NextResponse.json({ fallback: 'browser_tts', text });
  } catch (e: any) {
    console.error('TTS error:', e);
    return NextResponse.json({ fallback: 'browser_tts', text: '' });
  }
}
