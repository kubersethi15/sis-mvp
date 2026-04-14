# Kaya Advanced Voice System — Build Plan

## Owner: Kaya Team (Anshul is out — we handle everything)
## Started: April 14, 2026

---

## Architecture Overview

The advanced voice system has 5 layers:

1. **Voice I/O** — How we hear the candidate and how Aya speaks back
2. **Paralinguistic Analysis** — Emotion, tone, pace, confidence from the audio signal itself
3. **Conversational Intelligence** — Phase state machine, skill targeting, wellbeing protocol
4. **Voice-Enhanced Extraction** — Paralinguistic markers boost/reduce confidence in LEEE pipeline
5. **Voice Simulation** — Layer 2 workplace simulation via voice (characters speak)

---

## Phase V1 — Voice I/O Excellence (DONE ✅)

| # | Task | Status | Notes |
|---|------|--------|-------|
| V1.1 | Server-side STT via OpenAI Whisper | ✅ Done | /api/stt — accurate, handles Taglish, $0.006/min |
| V1.2 | OpenAI TTS with nova voice | ✅ Done | /api/tts — warm female voice, 0.95 speed |
| V1.3 | Sentence chunking for fast first response | ✅ Done | First 1-2 sentences play immediately |
| V1.4 | Silence detection (auto-stop recording) | ✅ Done | 2.5s silence threshold via amplitude analysis |
| V1.5 | Auto-listen after Aya speaks | ✅ Done | 800ms pause then mic reopens |
| V1.6 | Real-time amplitude visualization | ✅ Done | Orb pulses with voice level |
| V1.7 | Text input fallback | ✅ Done | Always available alongside voice |
| V1.8 | Session management (same as text chat) | ✅ Done | Same /api/chat, same Aya, same extraction |
| V1.9 | Multi-session support | ✅ Done | Multiple voice conversations build on skills |
| V1.10 | Taglish/Filipino language support | ✅ Done | Whisper auto-detects, context prompt with Filipino words |

---

## Phase V2 — Paralinguistic Analysis (Hume AI Integration)

**What:** Analyse the candidate's audio for emotional expression — not just WHAT they say, but HOW they say it. This is the layer Anshul was going to provide.

**Tool:** Hume AI Expression Measurement API
- Prosody model: 48 dimensions of emotion from tone, rhythm, timbre
- Vocal burst model: laughs, sighs, gasps (non-verbal vocalizations)
- Cost: ~$0.064/min audio-only (cheaper than a cup of coffee per session)
- SDK: Python and TypeScript, batch and streaming

**Paralinguistic → Skill Confidence Mapping (from the Playbook):**

| Voice Signal | Skill Boost | Confidence Δ |
|---|---|---|
| Emotional activation when describing helping others | Empathy | +0.10 |
| Calm, measured tone during chaotic situation stories | Self-Management | +0.10 |
| Energy/enthusiasm when describing problem-solving | Creative Thinking, Problem-Solving | +0.08 |
| Self-corrections ("actually, let me rethink that") | Authenticity (all scores) | +0.05 all |
| Natural laughter during adversity stories | Resilience | +0.10 |
| Thoughtful pauses before reflective answers | Self-Awareness | +0.08 |
| Flat tone when claiming stressful experience | Gaming flag | -0.15 |
| Rehearsed pace (unnaturally even delivery) | Gaming flag | -0.10 |
| Voice tremor/emotion when recalling genuine difficulty | Authenticity boost | +0.05 all |

| # | Task | Status | Notes |
|---|------|--------|-------|
| V2.1 | Hume AI account setup + API key | ⬜ Todo | Free tier: 10K chars/month, Audio-only: $0.064/min |
| V2.2 | /api/voice-analysis route — send audio to Hume Expression Measurement | ⬜ Todo | Prosody + Vocal Burst models |
| V2.3 | Store raw Hume output per message in Supabase | ⬜ Todo | voice_analysis table: session_id, message_index, hume_scores |
| V2.4 | Paralinguistic → PSF confidence mapper | ⬜ Todo | Maps Hume 48 dimensions to the skill boost table above |
| V2.5 | Integrate paralinguistic scores into LEEE Stage 5 | ⬜ Todo | Confidence adjustments based on voice signals |
| V2.6 | Gaming detection from audio signals | ⬜ Todo | Flat affect + stressful claim = flag; rehearsed pace = flag |
| V2.7 | Psychologist view: paralinguistic data tab | ⬜ Todo | Show Hume emotion timeline alongside transcript |
| V2.8 | Real-time emotion awareness for Aya | ⬜ Todo | Pass current emotional state to /api/chat so Aya adapts |

---

## Phase V3 — Conversational Intelligence (Playbook State Machine)

**What:** The Voice Playbook defines explicit phase transitions, question bank retrieval, mid-session skill gap tracking, and conversational repair. The orchestrator already implements most of this for text chat — this phase ensures voice uses it fully.

| # | Task | Status | Notes |
|---|------|--------|-------|
| V3.1 | Explicit phase state machine (stored per session) | ✅ Done | LEEEOrchestrator: 7 stages with TransitionRules, turn counting, timer-based closing |
| V3.2 | Phase transition criteria (measurable, not vibes) | ✅ Done | orchestrator.ts: turn count per stage, story completeness (STAR+E+R checks), session duration |
| V3.3 | Mid-session skill gap scan after each story cycle | ✅ Done | runGapScan() in chat route — 8-domain scan after verification stage |
| V3.4 | Question bank retrieval based on skill gaps | ✅ Done | question-bank.ts (305 lines, 98 prompts, trilingual) + updateSuggestedPrompts() targets gaps |
| V3.5 | Conversational repair library | ✅ Done | In system prompt: one-word answer probing, tangent redirect, story-about-others redirect, early-stop respect |
| V3.6 | Aya voice pacing — slight pause before responding | ✅ Done | 400ms delay before Aya speaks + acknowledgment audio first |
| V3.7 | Short acknowledgment during processing | ✅ Done | Plays "Mm-hmm" / "I see" / "I hear you" TTS while Claude thinks |
| V3.8 | Interruption handling | ✅ Done | Tap orb while Aya speaks → stops audio, returns to idle |
| V3.9 | Wellbeing protocol (3-level distress escalation) | ✅ Done | Orchestrator detects distress keywords (L1-L3), API exposes level, voice page responds |
| V3.10 | Stage progress indicator in voice UI | ✅ Done | Progress dots + stage label + stories count in bottom bar |
| V3.11 | Chat API enhanced with voice metadata | ✅ Done | Returns distress_level, story_completeness, stage to voice page |

---

## Phase V4 — Voice-Enhanced Extraction Pipeline

**What:** The LEEE pipeline currently processes text transcripts. This phase adds a parallel paralinguistic data stream that enriches the extraction.

| # | Task | Status | Notes |
|---|------|--------|-------|
| V4.1 | Store audio recordings per message (optional, consent-based) | ⬜ Todo | Supabase Storage or S3, encrypted, consent screen at session start |
| V4.2 | Post-session batch Hume analysis on full recording | ⬜ Todo | More accurate than per-message; sends full audio file |
| V4.3 | Emotion timeline generation | ⬜ Todo | Time-aligned emotion data: minute 3:24 = high empathy activation |
| V4.4 | LEEE Stage 1 enhancement: mark episodes with emotion peaks | ⬜ Todo | Episodes where voice emotion aligns with content = higher weight |
| V4.5 | LEEE Stage 5 enhancement: paralinguistic confidence adjustments | ⬜ Todo | Apply the skill boost table to final proficiency scores |
| V4.6 | Voice-specific gaming detection in LEEE Stage 4 | ⬜ Todo | Cross-reference: words say stress + voice says flat = flag |
| V4.7 | Extraction report: "Voice Signals" section | ⬜ Todo | Psychologist sees which evidence was boosted/flagged by voice analysis |

---

## Phase V5 — Voice Simulation (Layer 2 via Voice)

**What:** Candidates do the workplace simulation by speaking instead of typing. Characters speak with distinct voices.

| # | Task | Status | Notes |
|---|------|--------|-------|
| V5.1 | Character voice assignment (TTS voice per character) | ✅ Done | CHAR_VOICES array: onyx, shimmer, echo, fable, alloy. TTS route accepts voice_override. |
| V5.2 | Simulation page voice mode toggle | ✅ Done | Toggle on intro screen with on/off switch. State persists through simulation. |
| V5.3 | Multi-voice playback: characters speak in sequence | ✅ Done | speakCharacterMessages() plays each character with their voice, 300ms gap between |
| V5.4 | Candidate voice responses in simulation | ✅ Done | Mic button in input bar. recordVoiceInput() → Whisper STT → sendMessage(). Stop/start toggle. |
| V5.5 | Paralinguistic analysis during simulation | ⬜ Todo | Needs Hume AI integration (V2) — voice emotion during simulation |
| V5.6 | Simulation observer uses voice data | ⬜ Todo | Needs V2 — evaluateCheckpoint() receives paralinguistic data |

---

## Phase V6 — Production Hardening

| # | Task | Status | Notes |
|---|------|--------|-------|
| V6.1 | Consent screen for audio recording | ⬜ Todo | Clear opt-in before session, explain what's recorded and why |
| V6.2 | Audio data retention policy | ⬜ Todo | Auto-delete after extraction complete + psychologist review |
| V6.3 | Bandwidth optimization (compress audio before upload) | ⬜ Todo | Opus codec, 16kHz mono, ~6KB/s |
| V6.4 | Offline/poor connection handling | ⬜ Todo | Queue messages, reconnect, show status |
| V6.5 | Browser compatibility matrix | ⬜ Todo | Test Chrome, Safari, Firefox, mobile browsers |
| V6.6 | Accessibility: visual-only mode for deaf users | ⬜ Todo | Full text mode with no voice dependency |
| V6.7 | Rate limiting + cost monitoring | ⬜ Todo | Track Whisper + TTS + Hume costs per session |

---

## Summary

| Phase | Tasks | Done | Status |
|-------|-------|------|--------|
| V1 Voice I/O | 10 | 10 | ✅ Complete |
| V2 Paralinguistic (Hume) | 8 | 0 | ⬜ Next (waiting for API key) |
| V3 Conversational Intelligence | 11 | 11 | ✅ Complete |
| V4 Voice-Enhanced Extraction | 7 | 0 | ⬜ Blocked by V2 |
| V5 Voice Simulation | 6 | 4 | 🟡 V5.5-V5.6 need V2 |
| V6 Production Hardening | 7 | 0 | ⬜ Planned |
| **Total** | **49** | **25** | **51% complete** |

---

## Cost Estimate Per Voice Session (10 min)

| Service | Cost | Notes |
|---|---|---|
| Whisper STT | $0.06 | 10 min × $0.006/min |
| OpenAI TTS | $0.02 | ~1,500 chars of Aya response × $15/1M chars |
| Hume Prosody | $0.64 | 10 min × $0.064/min |
| Claude API (Aya) | $0.15 | ~5 turns × 3K tokens each |
| **Total per session** | **~$0.87** | Fully loaded including paralinguistic |
| **Without Hume** | **~$0.23** | Current cost (V1 only) |

---

## API Keys Required

| Service | Variable | Status |
|---|---|---|
| OpenAI (Whisper + TTS) | OPENAI_API_KEY | ✅ Set on Vercel |
| Hume AI (Expression Measurement) | HUME_API_KEY | ⬜ Need to set up |
| Anthropic (Claude / Aya) | ANTHROPIC_API_KEY | ✅ Set on Vercel |

---

## Dependencies on Other Systems

- LEEE extraction pipeline (Stage 5 modification for paralinguistic data)
- Supabase (voice_analysis table, audio storage)
- Psychologist page (new Voice Signals tab)
- Layer 2 simulation engine (voice mode adapter)

---

*This is a living document. Updated as phases complete.*
*Last updated: April 14, 2026*
