// Server-side Text-to-Speech using OpenAI TTS
// Voice: 'nova' — warm, natural female voice that suits Aya
// Supports sentence chunking for faster first response
// Cost: ~$15/1M characters (~$0.01-0.02 per Aya response)

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, chunk_mode, voice_override } = body;

    if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ fallback: 'browser_tts', text });
    }

    // If chunk_mode, split into sentences and return first chunk fast
    if (chunk_mode) {
      const sentences = splitIntoSentences(text);
      const firstChunk = sentences.slice(0, 2).join(' ');

      const audio = await generateSpeech(openaiKey, firstChunk, voice_override);
      if (audio) {
        return new NextResponse(audio, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'X-Remaining-Text': encodeURIComponent(sentences.slice(2).join(' ')),
            'X-Total-Chunks': String(Math.ceil(sentences.length / 2)),
            'Cache-Control': 'no-cache',
          },
        });
      }
    }

    // Full text mode
    const audio = await generateSpeech(openaiKey, text, voice_override);
    if (audio) {
      return new NextResponse(audio, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return NextResponse.json({ fallback: 'browser_tts', text });
  } catch (e: any) {
    console.error('TTS error:', e);
    return NextResponse.json({ fallback: 'browser_tts', text: '' });
  }
}

async function generateSpeech(apiKey: string, text: string, voice?: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text.substring(0, 4096),
        voice: voice || 'nova', // Default nova for Aya, override for simulation characters
        response_format: 'mp3',
        speed: 0.95,
      }),
    });

    if (res.ok) {
      return await res.arrayBuffer();
    }

    console.error('OpenAI TTS error:', res.status, await res.text());
    return null;
  } catch (e) {
    console.error('TTS generation error:', e);
    return null;
  }
}

function splitIntoSentences(text: string): string[] {
  const raw = text.match(/[^.!?]+[.!?]+[\s]*/g) || [text];
  const merged: string[] = [];
  for (const s of raw) {
    if (merged.length > 0 && merged[merged.length - 1].length < 30) {
      merged[merged.length - 1] += s;
    } else {
      merged.push(s);
    }
  }
  return merged.filter(s => s.trim().length > 0);
}
