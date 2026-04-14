// Voice Analysis API — Paralinguistic analysis via Hume AI
// POST /api/voice-analysis
// Receives audio blob, returns emotion analysis + skill confidence adjustments
// Stores results to Supabase for psychologist review

import { NextRequest, NextResponse } from 'next/server';
import { analyzeWithHume, buildParalinguisticProfile } from '@/lib/voice/hume-client';
import { createServerClient } from '@/lib/supabase';

function db() { return createServerClient(); }

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as File;
    const sessionId = formData.get('session_id') as string;
    const messageIndex = formData.get('message_index') as string;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Convert File to Blob for Hume
    const audioBlob = new Blob([await audioFile.arrayBuffer()], { type: audioFile.type });

    // Analyze with Hume
    const analysis = await analyzeWithHume(audioBlob);

    if (!analysis) {
      return NextResponse.json({
        error: 'Analysis unavailable',
        fallback: true,
        profile: null,
      });
    }

    // Build paralinguistic profile
    const profile = buildParalinguisticProfile(analysis);

    // V2.3: Store in Supabase if session_id provided
    if (sessionId) {
      try {
        // Store in a voice_analysis jsonb column on leee_sessions
        // or create/update a separate record
        const { data: session } = await db().from('leee_sessions')
          .select('voice_analysis')
          .eq('id', sessionId)
          .single();

        const existingAnalysis = (session?.voice_analysis as any[]) || [];
        existingAnalysis.push({
          message_index: parseInt(messageIndex || '0'),
          timestamp: new Date().toISOString(),
          dominant_emotions: profile.hume_raw.dominant_emotions,
          emotional_intensity: profile.hume_raw.emotional_intensity,
          skill_adjustments: profile.skill_adjustments,
          gaming_signals: profile.gaming_signals,
          authenticity: profile.hume_raw.authenticity_signals,
        });

        await db().from('leee_sessions').update({
          voice_analysis: existingAnalysis,
        }).eq('id', sessionId);
      } catch (e) {
        console.error('Failed to store voice analysis:', e);
        // Non-fatal — analysis still returned to client
      }
    }

    return NextResponse.json({
      profile,
      adjustments: profile.skill_adjustments,
      gaming: profile.gaming_signals,
      summary: profile.summary,
    });
  } catch (e: any) {
    console.error('Voice analysis error:', e);
    return NextResponse.json({ error: e.message, fallback: true }, { status: 500 });
  }
}
