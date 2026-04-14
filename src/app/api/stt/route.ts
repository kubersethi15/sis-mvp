// Server-side Speech-to-Text using OpenAI Whisper
// Receives audio blob from browser, returns accurate transcript
// Supports: English, Filipino, Taglish code-switching
// Cost: ~$0.006/minute

import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured', fallback: true }, { status: 500 });
    }

    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Send to OpenAI Whisper API
    const whisperForm = new FormData();
    whisperForm.append('file', audioFile, 'recording.webm');
    whisperForm.append('model', 'whisper-1');
    whisperForm.append('language', ''); // Auto-detect — handles English, Filipino, Taglish
    whisperForm.append('response_format', 'json');
    // Prompt helps Whisper understand context and handle code-switching
    whisperForm.append('prompt', 'This is a conversation in English, Filipino, or Taglish (code-switching). The speaker may use Filipino honorifics like Ate, Kuya, po, opo. Common words: naman, kasi, yung, mga, sige, oo, hindi, salamat, magandang, umaga, hapon.');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: whisperForm,
    });

    if (!res.ok) {
      const error = await res.text();
      console.error('Whisper API error:', error);
      return NextResponse.json({ error: 'Transcription failed', fallback: true }, { status: 500 });
    }

    const data = await res.json();

    return NextResponse.json({
      text: data.text || '',
      language: data.language || 'en',
    });
  } catch (e: any) {
    console.error('STT error:', e);
    return NextResponse.json({ error: e.message, fallback: true }, { status: 500 });
  }
}
