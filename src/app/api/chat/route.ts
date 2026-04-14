// Chat API Route - POST /api/chat
// Connects the LEEE orchestrator to Claude API
// Persists sessions and messages to Supabase

import { NextRequest, NextResponse } from 'next/server';
import { LEEEOrchestrator } from '@/lib/orchestrator';
import { LEEESession, LEEEMessage, GapScanResult } from '@/types';
import { LEEE_GAP_SCAN_PROMPT } from '@/lib/prompts';
import { createServerClient, getAuthenticatedUserId } from '@/lib/supabase';
import { buildCalibrationContext } from '@/lib/calibration';

// In-memory orchestrator cache (sessions + messages persisted to Supabase)
const orchestrators = new Map<string, LEEEOrchestrator>();

function db() {
  return createServerClient();
}

async function ensureDemoUser(): Promise<string> {
  const supabase = db();
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('full_name', 'Demo User')
    .limit(1)
    .single();
  
  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from('user_profiles')
    .insert({ full_name: 'Demo User', role: 'jobseeker', email: 'demo@sis.virtualahan.com' })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error creating demo user:', error);
    throw error;
  }
  return created.id;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, message, action } = body;

    if (action === 'start') return handleStart(req, body);
    if (action === 'extract') return handleExtract(session_id);
    if (action === 'extract_transcript') return handleExtractTranscript(body.transcript);

    if (!session_id || !message) {
      return NextResponse.json({ error: 'session_id and message required' }, { status: 400 });
    }

    let orchestrator = orchestrators.get(session_id);
    if (!orchestrator) {
      orchestrator = await rebuildOrchestrator(session_id);
      if (!orchestrator) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const state = orchestrator.getState();
    const turn = state.messages.length + 1;

    const userMsg: LEEEMessage = {
      id: crypto.randomUUID(), session_id, role: 'user', content: message,
      moth_stage: orchestrator.getState().currentStage, turn_number: turn,
      created_at: new Date().toISOString(),
    };
    orchestrator.addMessage(userMsg);
    await saveMessage(userMsg);

    const updatedState = orchestrator.getState();
    if (updatedState.currentStage === 'verification' && updatedState.storiesCompleted > 0 && !updatedState.gapScan) {
      await runGapScan(orchestrator);
    }

    if (orchestrator.shouldEndSession()) {
      const closing = await callClaude(orchestrator);
      const aMsg: LEEEMessage = {
        id: crypto.randomUUID(), session_id, role: 'assistant', content: closing,
        moth_stage: 'closing', turn_number: turn + 1, created_at: new Date().toISOString(),
      };
      orchestrator.addMessage(aMsg);
      await saveMessage(aMsg);

      await db().from('leee_sessions').update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        duration_minutes: Math.floor((Date.now() - new Date(updatedState.session.started_at).getTime()) / 60000),
        current_stage: 'closing',
        stories_completed: updatedState.storiesCompleted,
        skills_evidenced: updatedState.gapScan || {},
      }).eq('id', session_id);

      return NextResponse.json({
        message: closing, session_status: 'completed', stage: 'closing',
        stories_completed: updatedState.storiesCompleted, should_extract: true,
      });
    }

    const aiText = await callClaude(orchestrator);
    const aMsg: LEEEMessage = {
      id: crypto.randomUUID(), session_id, role: 'assistant', content: aiText,
      moth_stage: orchestrator.getState().currentStage, turn_number: turn + 1,
      created_at: new Date().toISOString(),
    };
    orchestrator.addMessage(aMsg);
    await saveMessage(aMsg);

    const finalState = orchestrator.getState();
    await db().from('leee_sessions').update({
      current_stage: finalState.currentStage,
      stories_completed: finalState.storiesCompleted,
      skills_evidenced: finalState.gapScan || {},
      updated_at: new Date().toISOString(),
    }).eq('id', session_id);

    return NextResponse.json({
      message: aiText, session_status: 'active', stage: finalState.currentStage,
      stories_completed: finalState.storiesCompleted, skills_evidenced: finalState.gapScan,
      should_extract: false,
      distress_level: finalState.userDistressLevel || 0,
      story_completeness: orchestrator.hasStoryCompleteness(),
    });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function handleStart(req: NextRequest, body: any) {
  const supabase = db();

  // Authenticate user — tries JWT first, then body user_id, then demo fallback
  let userId = await getAuthenticatedUserId(req, body);
  if (!userId) userId = await ensureDemoUser();

  // Ensure user_profiles row exists (auth user may not have one yet)
  const { data: existingProfile } = await supabase.from('user_profiles').select('id').eq('id', userId).single();
  if (!existingProfile) {
    // Get name from auth if available
    const authHeader = req.headers.get('authorization');
    let fullName = body.full_name || 'Kaya User';
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data: { user } } = await authClient.auth.getUser(authHeader.slice(7));
        if (user?.user_metadata?.full_name) fullName = user.user_metadata.full_name;
        if (user?.email && fullName === 'Kaya User') fullName = user.email.split('@')[0];
      } catch {}
    }
    await supabase.from('user_profiles').insert({ id: userId, full_name: fullName, role: 'jobseeker' });
  }

  // Fetch profile data for context injection — with calibration derivation (Ryan v2 R1+R3)
  let profileContext = '';
  let profileId = body.jobseeker_profile_id;

  // Fallback: if no profile_id, look up by user_id
  if (!profileId && userId) {
    const { data: profileLookup } = await supabase.from('jobseeker_profiles')
      .select('id').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single();
    if (profileLookup) profileId = profileLookup.id;
  }

  if (profileId) {
    const { data: profile } = await supabase.from('jobseeker_profiles')
      .select('*, user_profiles(full_name)')
      .eq('id', profileId).single();

    if (profile) {
      // Fetch vacancy data if available
      let vacancy = null;
      if (body.vacancy_id) {
        const { data: v } = await supabase.from('vacancies')
          .select('title, description, competency_blueprint, employer_name').eq('id', body.vacancy_id).single();
        vacancy = v;
      }

      // Fetch previous session skills + story summaries for continuity
      const prevSkills: string[] = [];
      const prevGaps: string[] = [];
      const prevStorySummaries: string[] = [];
      let sessionNumber = 1;
      const allPsfSkills = [
        'Building Inclusivity', 'Collaboration', 'Communication', 'Customer Orientation',
        'Developing People', 'Influence', 'Adaptability', 'Digital Fluency',
        'Global Perspective', 'Learning Agility', 'Self-Management',
        'Creative Thinking', 'Decision Making', 'Problem Solving', 'Sense Making',
        'Transdisciplinary Thinking',
      ];

      const { data: prevSessions } = await supabase.from('leee_sessions')
        .select('id, created_at').eq('user_id', userId).eq('status', 'completed')
        .order('created_at', { ascending: false }).limit(5);

      if (prevSessions?.length) {
        sessionNumber = prevSessions.length + 1;

        for (const ps of prevSessions) {
          // Get extraction data (skills + episode summaries)
          const { data: ext } = await supabase.from('leee_extractions')
            .select('skills_profile, narrative_summary, episodes')
            .eq('session_id', ps.id).limit(1).single();
          if (ext?.skills_profile) {
            for (const s of ext.skills_profile) {
              if (!prevSkills.includes(s.skill_name)) prevSkills.push(s.skill_name);
            }
          }
          if (ext?.episodes?.length) {
            for (const ep of ext.episodes) {
              if (ep.summary) prevStorySummaries.push(ep.summary);
            }
          }

          // ALSO get actual conversation messages for richer context
          // This captures what the user actually said, not just extracted episodes
          const { data: prevMsgs } = await supabase.from('leee_messages')
            .select('role, content')
            .eq('session_id', ps.id)
            .order('turn_number', { ascending: true })
            .limit(20);

          if (prevMsgs?.length) {
            const userMsgs = prevMsgs
              .filter((m: any) => m.role === 'user')
              .map((m: any) => m.content)
              .filter((c: string) => c && c.length > 10 && !c.startsWith('[SCENARIO') && !c.startsWith('[SIMULATION'));

            if (userMsgs.length > 0) {
              // Create a brief summary of what the user talked about
              const topicSummary = userMsgs.slice(0, 6).join(' | ');
              prevStorySummaries.push(`User discussed: ${topicSummary}`);
            }
          }

          // Add narrative summary if available
          if (ext?.narrative_summary && !prevStorySummaries.includes(ext.narrative_summary)) {
            prevStorySummaries.push(`Overall: ${ext.narrative_summary.substring(0, 200)}`);
          }
        }
        for (const sk of allPsfSkills) {
          if (!prevSkills.includes(sk)) prevGaps.push(sk);
        }
      }

      // Build full calibration context using Ryan's v2 logic
      const psychometrics = profile.psychometric_data || profile.riasec_scores ? {
        riasec_scores: profile.riasec_scores,
        high5_strengths: profile.high5_strengths,
        saboteur_scores: profile.saboteur_scores,
      } : null;

      profileContext = buildCalibrationContext(profile, vacancy, psychometrics, prevSkills, prevGaps, prevStorySummaries, sessionNumber);
    }
  }

  const { data: session, error } = await supabase
    .from('leee_sessions')
    .insert({
      user_id: userId,
      jobseeker_id: body.jobseeker_profile_id || null,
      application_id: body.application_id || null,
      status: 'active',
      current_stage: 'opening',
      stories_completed: 0,
      language_used: body.language || 'en',
      accessibility_mode: body.accessibility_mode || {},
      skills_evidenced: {},
      skills_gaps: {},
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }

  const leeeSession: LEEESession = {
    id: session.id, user_id: userId, status: 'active', current_stage: 'opening',
    stories_completed: 0, language_used: body.language || 'en',
    accessibility_mode: body.accessibility_mode || {},
    started_at: session.started_at, skills_evidenced: {}, skills_gaps: {},
  };

  const orchestrator = new LEEEOrchestrator(leeeSession);

  // Inject full calibration context (Ryan v2 R1+R3)
  if (profileContext) {
    (orchestrator as any)._extraContext = profileContext;
  }

  orchestrators.set(session.id, orchestrator);

  return NextResponse.json({
    session_id: session.id, session_status: 'active', stage: 'opening',
    has_profile_context: !!profileContext,
  });
}

async function rebuildOrchestrator(sessionId: string): Promise<LEEEOrchestrator | undefined> {
  const supabase = db();
  const { data: session } = await supabase.from('leee_sessions').select('*').eq('id', sessionId).single();
  if (!session) return undefined;

  const { data: messages } = await supabase.from('leee_messages').select('*').eq('session_id', sessionId).order('turn_number', { ascending: true });

  const leeeSession: LEEESession = {
    id: session.id, user_id: session.user_id, status: session.status,
    current_stage: session.current_stage, stories_completed: session.stories_completed,
    language_used: session.language_used, accessibility_mode: session.accessibility_mode || {},
    started_at: session.started_at, skills_evidenced: session.skills_evidenced || {},
    skills_gaps: session.skills_gaps || {},
  };

  const leeeMessages: LEEEMessage[] = (messages || []).map((m: any) => ({
    id: m.id, session_id: m.session_id, role: m.role, content: m.content,
    moth_stage: m.moth_stage, prompt_id: m.prompt_id, probe_type: m.probe_type,
    turn_number: m.turn_number, created_at: m.created_at,
  }));

  const orchestrator = new LEEEOrchestrator(leeeSession, leeeMessages);
  orchestrators.set(sessionId, orchestrator);
  return orchestrator;
}

async function saveMessage(msg: LEEEMessage) {
  const { error } = await db().from('leee_messages').insert({
    id: msg.id, session_id: msg.session_id, role: msg.role, content: msg.content,
    moth_stage: msg.moth_stage, prompt_id: msg.prompt_id || null,
    probe_type: msg.probe_type || null, turn_number: msg.turn_number,
  });
  if (error) console.error('Error saving message:', error);
}

async function callClaude(orchestrator: LEEEOrchestrator): Promise<string> {
  const { callLLM } = await import('@/lib/llm');
  const msgs = orchestrator.buildLLMMessages();
  const system = msgs[0].content;
  let conversation = msgs.slice(1)
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

  if (conversation.length === 0) {
    conversation = [{ role: 'user', content: '[Session started. Greet the user warmly and begin.]' }];
  }

  try {
    const result = await callLLM({ system, messages: conversation, maxTokens: 300 });
    if (result.provider === 'gemini') console.log('[Chat] Used Gemini fallback');
    return result.text || "Could you tell me a bit more about that?";
  } catch (error: any) {
    console.error('LLM error:', error.message);
    return "Kumusta! I'm Aya. I'm here to listen to your story and help you discover the skills you already have. Before we start — is there anything I should know to make this conversation comfortable for you?";
  }
}

async function runGapScan(orchestrator: LEEEOrchestrator) {
  const prompt = LEEE_GAP_SCAN_PROMPT.replace('{story_transcript}', orchestrator.getTranscript());
  try {
    const { callLLM } = await import('@/lib/llm');
    const result = await callLLM({
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 200,
    });
    const text = result.text;
    if (text) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) orchestrator.updateGapScan(JSON.parse(match[0]) as GapScanResult);
    }
  } catch (e) { console.error('Gap scan error:', e); }
}


function normalizeProficiency(p: string | undefined | null): string {
  if (!p || p === 'Not_scored' || p === 'not_scored') return 'Basic';
  const lower = p.toLowerCase();
  if (lower === 'basic' || lower === 'emerging') return 'Basic';
  if (lower === 'intermediate' || lower === 'developing') return 'Intermediate';
  if (lower === 'advanced' || lower === 'proficient') return 'Advanced';
  return 'Basic';
}

async function handleExtract(sessionId: string) {
  let orchestrator = orchestrators.get(sessionId);
  if (!orchestrator) {
    orchestrator = await rebuildOrchestrator(sessionId);
    if (!orchestrator) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const transcript = orchestrator.getTranscript();

  // Fetch vacancy skills for vacancy-weighted extraction
  const supabase = db();
  const { data: session } = await supabase.from('leee_sessions')
    .select('user_id, application_id').eq('id', sessionId).single();

  let vacancySkills: string[] = [];
  if (session?.application_id) {
    const { data: app } = await supabase.from('applications')
      .select('vacancy_id').eq('id', session.application_id).single();
    if (app?.vacancy_id) {
      const { data: vacancy } = await supabase.from('vacancies')
        .select('competency_blueprint').eq('id', app.vacancy_id).single();
      if (vacancy?.competency_blueprint?.human_centric_skills) {
        vacancySkills = vacancy.competency_blueprint.human_centric_skills.map((s: any) => s.skill || s);
      }
    }
  }

  try {
    const { runExtractionPipeline } = await import('@/lib/extraction-pipeline');

    // Count user messages to check minimum threshold
    const userMsgCount = orchestrator.getState().messages.filter(m => m.role === 'user').length;

    // If session is too short (fewer than 5 user messages), skip extraction
    if (userMsgCount < 5) {
      // Return previous session skills if available
      const { data: prevExts } = await supabase.from('leee_extractions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (prevExts?.length) {
        return NextResponse.json({
          extraction: {
            ...prevExts[0],
            narrative_summary: (prevExts[0].narrative_summary || '') + '\n\nNote: Your latest session was too brief to extract new skills. Your profile shows skills from previous conversations. Continue chatting with Aya to discover more.',
            _short_session: true,
          },
          session_id: sessionId,
          status: 'extracted',
        });
      }

      return NextResponse.json({
        extraction: { skills_profile: [], narrative_summary: 'This session was too brief to extract skills. Try telling Aya a longer story about a specific experience — what happened, what you did, and what the result was.', session_quality: { overall_confidence: 0, stories_completed: 0 } },
        session_id: sessionId,
        status: 'extracted',
      });
    }

    // Fetch voice analysis data if available (V2.5)
    let voiceAnalysis: any[] = [];
    try {
      const { data: sessionData } = await supabase.from('leee_sessions')
        .select('voice_analysis')
        .eq('id', sessionId)
        .single();
      if (sessionData?.voice_analysis) {
        voiceAnalysis = sessionData.voice_analysis;
      }
    } catch { /* voice data is optional */ }

    const sessionMinutes = Math.floor(
      (Date.now() - new Date(orchestrator.getState().session.started_at).getTime()) / 60000
    );
    const result = await runExtractionPipeline(
      transcript,
      vacancySkills,
      sessionMinutes,
      voiceAnalysis.length > 0 ? voiceAnalysis : undefined
    );

    if (!result.success) {
      console.error('Pipeline error:', result.error);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const profile = result.final_profile;

    // Build backwards-compatible extraction object for existing UI
    const extraction = {
      // New v2 fields
      ...profile,
      // Backwards-compatible fields for existing UI components
      episodes: (result.stages.stage1_episodes || []).map((ep: any, i: number) => ({
        episode_id: i + 1,
        summary: ep.episode_summary,
        star_er: result.stages.stage2_evidence?.find((ev: any) => ev.episode_id === ep.episode_id)?.star_er || {},
      })),
      skills_profile: [
        ...(profile.vacancy_aligned_skills || []).map((s: any, i: number) => ({
          skill_id: `SK${i + 1}`,
          skill_name: s.skill_name,
          proficiency: normalizeProficiency(s.proficiency),
          confidence: s.top_evidence?.adjusted_confidence
            || s.adjusted_confidence
            || s.confidence
            || (s.sufficiency === 'strong' ? 0.85 : s.sufficiency === 'adequate' ? 0.7 : 0.55),
          evidence_count: s.evidence_count || 1,
          sufficiency: s.sufficiency || 'adequate',
          evidence: s.top_evidence ? [{
            episode_id: 1,
            transcript_quote: s.top_evidence.transcript_quote,
            behavioral_indicator: s.top_evidence.mapping_rationale,
            proficiency_justification: s.proficiency_justification,
          }] : [],
        })),
        ...(profile.additional_skills_evidenced || []).map((s: any, i: number) => ({
          skill_id: `SK${10 + i}`,
          skill_name: s.skill_name,
          proficiency: normalizeProficiency(s.proficiency),
          confidence: s.top_evidence?.adjusted_confidence
            || s.adjusted_confidence
            || s.confidence
            || (s.sufficiency === 'strong' ? 0.85 : s.sufficiency === 'adequate' ? 0.7 : 0.55),
          evidence_count: s.evidence_count || 1,
          sufficiency: s.sufficiency || 'adequate',
          evidence: s.top_evidence ? [{
            episode_id: 1,
            transcript_quote: s.top_evidence?.transcript_quote || '',
            behavioral_indicator: s.top_evidence?.mapping_rationale || '',
            proficiency_justification: s.proficiency_justification,
          }] : [],
        })),
      ],
      narrative_summary: (profile.hiring_manager_summary || '')
        .replace(/This candidate/g, 'You')
        .replace(/this candidate/g, 'you')
        .replace(/The candidate/g, 'You')
        .replace(/the candidate/g, 'you')
        .replace(/They demonstrated/g, 'You demonstrated')
        .replace(/they demonstrated/g, 'you demonstrated')
        .replace(/Their standout/g, 'Your standout')
        .replace(/their standout/g, 'your standout')
        .replace(/They also/g, 'You also')
        .replace(/they also/g, 'you also')
        .replace(/They showed/g, 'You showed')
        .replace(/they showed/g, 'you showed')
        .replace(/Their /g, 'Your ')
        .replace(/their /g, 'your ')
        .replace(/ them /g, ' you ')
        .replace(/ she /gi, ' you ')
        .replace(/ he /gi, ' you ')
        .replace(/ her /gi, ' your ')
        .replace(/ his /gi, ' your '),
      // Keep original for employer/psychologist views
      _hiring_manager_summary_original: profile.hiring_manager_summary || '',
      gaming_flags: [],
      layer2_seeds: [],
      session_quality: {
        stories_completed: profile.session_metadata?.stories_completed || 0,
        evidence_density: (profile.session_metadata?.behavioral_evidence_count || 0) > 4 ? 'high' : 'medium',
        user_engagement: 'high',
        overall_confidence: 0.75,
      },
      // Pipeline audit data
      _pipeline_version: '5-stage-v1',
      _pipeline_timing: result.timing,
      _pipeline_stages: result.stages,
      _psychologist_review_flags: profile.psychologist_review_flags || [],
      _audit_trail: profile.audit_trail || {},
    };

    // Merge with previous session extractions if they exist
    if (session?.user_id) {
      const { data: prevSessions } = await supabase.from('leee_sessions')
        .select('id').eq('user_id', session.user_id).eq('status', 'completed')
        .neq('id', sessionId).order('created_at', { ascending: false }).limit(5);

      if (prevSessions?.length) {
        const prevSkillsMap: Record<string, any> = {};
        for (const ps of prevSessions) {
          const { data: ext } = await supabase.from('leee_extractions')
            .select('skills_profile').eq('session_id', ps.id).limit(1).single();
          if (ext?.skills_profile) {
            for (const s of ext.skills_profile) {
              const existing = prevSkillsMap[s.skill_id || s.skill_name];
              if (!existing || s.confidence > existing.confidence) {
                prevSkillsMap[s.skill_id || s.skill_name] = s;
              }
            }
          }
        }

        // Merge: for each skill, keep the HIGHEST confidence version
        const mergedMap: Record<string, any> = {};

        // Start with previous skills
        for (const [id, prevSkill] of Object.entries(prevSkillsMap)) {
          mergedMap[id] = { ...prevSkill, source: 'previous_session' };
        }

        // Overlay new skills — only override if new confidence is HIGHER
        for (const s of extraction.skills_profile) {
          const key = s.skill_id || s.skill_name;
          const existing = mergedMap[key];
          if (!existing || (s.confidence || 0) >= (existing.confidence || 0)) {
            mergedMap[key] = { ...s, source: 'current_session' };
          }
          // If new confidence is lower, keep previous but note current session also evidenced it
          else if (existing) {
            existing._also_evidenced_in_current = true;
          }
        }

        extraction.skills_profile = Object.values(mergedMap);
        (extraction as any)._merged = true;

        // Build cumulative narrative — combine previous summaries with current
        const prevNarratives: string[] = [];
        for (const ps of prevSessions) {
          const { data: ext } = await supabase.from('leee_extractions')
            .select('narrative_summary').eq('session_id', ps.id).limit(1).single();
          if (ext?.narrative_summary) prevNarratives.push(ext.narrative_summary);
        }
        if (prevNarratives.length > 0 && extraction.narrative_summary) {
          extraction.narrative_summary = extraction.narrative_summary + '\n\nFrom previous sessions: ' + prevNarratives[0].substring(0, 200);
        }
      }
    }

    // Persist to Supabase
    await supabase.from('leee_extractions').insert({
      session_id: sessionId,
      episodes: extraction.episodes || [],
      skills_profile: extraction.skills_profile || [],
      evidence_map: result.stages.stage3_mappings || [],
      narrative_summary: extraction.narrative_summary || '',
      gaming_flags: extraction.gaming_flags || [],
      layer2_seeds: extraction.layer2_seeds || [],
      layer3_recommendations: [],
      session_quality: extraction.session_quality || {},
      extraction_model: 'mixed: opus-4-5 (S2,S3,S5) + sonnet (S1,S4)',
      extraction_prompt_version: '5-stage-v1',
      raw_extraction_response: {
        pipeline_stages: result.stages,
        pipeline_timing: result.timing,
        final_profile: result.final_profile,
      },
    });

    return NextResponse.json({ extraction, session_id: sessionId, status: 'extracted' });
  } catch (e: any) {
    console.error('5-stage extraction error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Direct transcript extraction — for testing with the 5-stage pipeline
async function handleExtractTranscript(transcript: string) {
  if (!transcript) return NextResponse.json({ error: 'transcript required' }, { status: 400 });

  try {
    const { runExtractionPipeline } = await import('@/lib/extraction-pipeline');
    const result = await runExtractionPipeline(transcript);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      extraction: result.final_profile,
      stages: result.stages,
      timing: result.timing,
      status: 'extracted',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
