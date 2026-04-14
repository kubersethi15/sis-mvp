# KAYA (SIS) — System As-Is Master Documentation

**Version:** 1.0 | **Generated:** April 14, 2026 | **Codebase:** 77 source files, 23,475 lines
**Repository:** github.com/kubersethi15/sis-mvp | **Production:** kaya-mvp-rose.vercel.app

---

## A. Executive Overview

### What the platform is
Kaya (formerly "Skills Intelligence System" / SIS) is an AI-powered hiring intelligence platform that extracts, measures, validates, and credentials human-centric skills for persons with disabilities (PWDs) and excluded talent in the Philippine labor market. The name "Kaya" is Filipino for "capable."

### Who it serves
- **PWD job seekers** — people whose skills are invisible to traditional hiring processes
- **Employers** — organizations that want to hire based on actual capability rather than credentials or appearance
- **Virtualahan Inc.** — the social enterprise that trains PWDs and needs to prove training impact to funders
- **Psychologists** — licensed professionals who validate and endorse the skills assessment
- **Funders/Partners** — Ashoka, Cisco, government agencies who need evidence of systemic impact

### Core problem it solves
Traditional hiring discriminates against PWDs through biased signals: appearance, speech style, articulation quality, confidence performance, and formal credentials. A deaf candidate who is an exceptional problem-solver gets filtered out because they can't perform well in a standard interview. Kaya replaces these biased signals with validated behavioral evidence extracted from the candidate's actual lived experiences, observed behavior in simulations, and independent peer verification.

### Core product thesis
Skills are demonstrated through stories and behavior, not credentials. A three-layer evidence system (self-report + simulation + peer validation) with anti-gaming measures and psychologist endorsement produces a defensible skills profile that employers can trust.

### What makes this different from traditional hiring systems
- **Three-layer triangulation:** Not just a test or interview — L1 (conversation), L2 (simulation), L3 (peer/360) are cross-referenced
- **Anti-gaming across all layers:** Oblique questioning (L1), observer pattern detection (L2), reference independence verification (L3), voice incongruence detection (voice)
- **Cultural grounding:** Built for Filipino workplace culture with Sikolohiyang Pilipino concepts (kapwa, pakikiramdam, hiya, bayanihan, utang na loob), Taglish support, and cultural calibration
- **Psychologist validation:** Licensed PRC psychologist reviews full audit trail — not just AI output
- **Voice paralinguistic analysis:** Hume AI detects 48 emotion dimensions from voice tone, mapped to skill confidence adjustments
- **Employer-specific scenarios:** Auto-generated from employer's own workplace context, not generic assessments

---

## B. Product Scope and Purpose

### Mission
Make hiring fair for people whose capabilities are invisible to traditional processes, starting with PWDs in the Philippines.

### In-scope (built and deployed)
- Layer 1: AI conversation with Aya (text + voice) → LEEE 5-stage extraction → PSF-aligned skills profile
- Layer 2: Multi-agent workplace simulation (3 static + employer-generated scenarios) → Sotopia-Eval scoring → convergence analysis
- Layer 3: Peer/360 reference assessment → three-layer convergence → independence verification
- Three-Gate employer pipeline: Alignment → Evidence → Predictability, each with human reviewer
- Psychologist validation workflow with research anchoring
- Employer-specific scenario generation from seed material
- Training impact measurement with Skills Velocity and cohort analytics
- Advanced voice system with Hume AI paralinguistic analysis
- Micro-simulations and scenario cards embedded in conversation
- Bias audit across 4 communication styles

### Out-of-scope / future
- Skills Passport v1 (machine-readable, QR-verifiable credential) — for Randy to consume
- ASEAN cross-border portability (2027)
- Government API integration with TESDA/DOLE (2027)
- Market intelligence layer (MiroFish Phase 2 — pending Ryan confirmation)
- Skills demand forecasting from labor market data
- Automated email/SMS notifications (needs email provider)

### Current maturity level
**Advanced MVP / Early Production.** Core assessment pipeline is complete and functional end-to-end. UI is polished but not production-hardened for scale. Database schemas may need migration tooling. No CI/CD pipeline. No automated testing in production. Single-developer codebase with comprehensive documentation.

### Design principles evident from codebase
1. **Human-in-the-loop always** — every gate requires human review; AI supports decisions, doesn't make them
2. **Evidence over credentials** — skills scored from behavioral evidence, not self-reported claims
3. **Anti-gaming by design** — multiple detection mechanisms at every layer
4. **Cultural sensitivity** — Filipino context embedded in prompts, taxonomy, and conversation design
5. **Accessibility first** — voice mode, text mode, simple language, low-bandwidth considerations
6. **Graceful degradation** — Gemini fallback when Claude fails, static scenarios when employer-specific unavailable

---

## C. End-to-End User Journeys

### C1. PWD Job Seeker Journey

**Entry points:** `/` (landing page), `/my-dashboard`, direct link to `/chat` or `/chat-voice`

**Step 1: Profile Creation** (`/profile`)
- Creates account (Supabase Auth or demo mode)
- Fills profile: name, disability type, work experience, education, languages, accessibility needs
- Profile stored in `user_profiles` + `jobseeker_profiles` tables
- System derives calibration context (experience level, probe depth, communication style) via `calibration.ts`

**Step 2: Conversation with Aya** (`/chat` or `/chat-voice`)
- Aya conducts Moth-structured storytelling conversation
- 7-stage state machine: opening → story_select → elicitation → core_probe → skill_probe → verification → closing
- 305-question bank (trilingual: English, Filipino, Taglish)
- During conversation, scenario cards pop up testing skill gaps (2 per session max)
- If voice mode: Whisper STT, OpenAI TTS, Hume paralinguistic analysis in parallel
- Conversation stored in `leee_sessions` + `leee_messages` tables

**Step 3: Skills Extraction** (automatic on session completion)
- 5-stage LEEE pipeline runs on transcript
- Stage 1: Segmentation → episodes
- Stage 2: STAR+E+R evidence extraction
- Stage 3: PSF skill mapping with vacancy weighting
- Stage 4: Consistency validation + anti-gaming
- Stage 5: Proficiency scoring with holistic assessment
- If voice data available: paralinguistic confidence adjustments applied (±0.20 cap)
- If post-training session: auto-compares against baseline
- Result stored in `leee_extractions` table

**Step 4: Skills Profile View** (`/skills`)
- Sees skills radar chart with proficiency levels
- Evidence snippets for each skill
- Narrative summary
- Can start additional sessions to build more evidence

**Step 5: Apply to Vacancy** (`/vacancy`)
- Browses available vacancies
- System calculates alignment score against vacancy competency blueprint
- Application stored in `applications` table

**Step 6: Simulation (if Gate 2 passed)** (`/simulation`)
- Green "Start Simulation →" button appears on `/my-dashboard`
- Enters multi-agent workplace simulation (employer-specific or static)
- 3 characters, 5-6 rounds, 3 checkpoints, 2 twists
- Voice mode optional: characters speak with distinct voices
- Results stored in `gate3_results` table

**Step 7: Reference Collection** (`/references`)
- Provides 3-5 reference contacts
- Each reference gets unique link to `/reference?token=...`
- References rate independently on PSF-aligned rubric

**Failure points:** Session too short (<5 user messages) → extraction skipped. Poor connectivity → voice fails gracefully to text. Low evidence density → extraction produces low-confidence profile.

**Accessibility:** Voice mode for typing difficulties. Text mode for deaf users. Taglish support. Simple language. Consent screen before audio recording.

### C2. Employer / Recruiter Journey

**Entry points:** `/employer` (setup), `/employer-dashboard`

**Step 1: Organization Setup** (`/employer-dashboard` → Settings)
- Creates organization: name, industry, location, size, accessibility features, benefits
- Assigns gate reviewers: Gate 1 (Recruiter), Gate 2 (Hiring Manager), Gate 3 (Final Approver)
- Stored in `employers` table

**Step 2: Vacancy Creation** (`/employer-dashboard` → Vacancies)
- Creates vacancy: title, description, requirements, compensation
- System auto-generates competency blueprint from JD via Claude
- Blueprint includes human-centric skill requirements weighted by importance
- Stored in `vacancies` table

**Step 3: Scenario Generation** (`/employer-dashboard` → Scenarios)
- Pastes seed material (JDs, handbook, company description)
- System extracts knowledge graph → runs discovery simulation → generates ScenarioConfigs
- Employer previews and approves scenarios
- Stored in `employer_graphs` + `employer_scenarios` tables

**Step 4: Review Applications** (`/reviewer`)
- Pipeline view: Applied → Gate 1 → Gate 2 → Gate 3 → Selected
- Gate 1: Reviews alignment score, competency fit map, AI recommendation → Pass/Hold/Stop
- Gate 2: Reviews LEEE extraction, skills profile, evidence quality, gaming flags → Pass/Hold/Request more evidence
- Gate 3: Reviews simulation results, convergence (L1↔L2), gaming flags, Layer 3 peer data → Final decision

**Step 5: Talent Pool** (`/employer-dashboard` → Talent)
- Sees all assessed candidates with skill profiles
- Can match against vacancy requirements

### C3. Psychologist Journey

**Entry point:** `/psychologist`

**Step 1: Select Extraction** — chooses a candidate extraction from the list

**Step 2: Layer 1 Audit** — reviews LEEE extraction: episodes, evidence, skill mapping, confidence, gaming flags, anti-bias methodology, Sikolohiyang Pilipino cultural notes

**Step 3: Layer 2 Audit** — reviews simulation: Sotopia-Eval scores, convergence (L1↔L2), gaming flags, observer summary, voice signals (Hume emotion timeline, confidence adjustments), full transcript

**Step 4: Layer 3 Audit** — reviews peer/360: three-layer convergence table (L1/L2/L3 → combined), convergence types, notes, independence verification

**Step 5: Methodology Review** — research anchoring document (Moth storytelling, STAR+E+R, PSF, cultural calibration, anti-gaming)

**Step 6: Validate & Sign** — enters PRC license number, validation notes, endorses or requests revision

**Output:** `psychologist_validations` record with license number, methodology references, validation status

---

## D. Functional Architecture

### D1. Conversation Engine (Layer 1)
**Purpose:** Conduct Moth-structured storytelling conversations to elicit behavioral evidence
**Key files:** `src/lib/orchestrator.ts` (458 lines), `src/lib/prompts.ts` (619 lines), `src/lib/question-bank.ts` (305 lines), `src/lib/calibration.ts` (305 lines)
**Inputs:** User profile, previous session data, vacancy context
**Outputs:** Conversation transcript, session state, skill gap scan
**External services:** Anthropic Claude API (via `src/lib/llm.ts`), Google Gemini (fallback)
**Status:** Confirmed — production-ready

The orchestrator implements a 7-stage state machine (opening → story_select → elicitation → core_probe → skill_probe → verification → closing) with turn-count-based transitions. The question bank contains 305 questions organized by stage and skill gap, with trilingual support (English, Filipino, Taglish). The calibration module derives session parameters (experience_level, probe_depth, session_pace, communication_style) from jobseeker profile data.

Wellbeing protocol: `userDistressLevel` tracked (0-3). Level 3+ triggers crisis response in prompt.

### D2. LEEE Extraction Pipeline
**Purpose:** Transform conversation transcript into structured PSF-aligned skills profile
**Key files:** `src/lib/extraction-pipeline.ts` (752 lines)
**Inputs:** Conversation transcript, vacancy skills, session duration, voice analysis data (optional)
**Outputs:** Episodes, STAR+E+R evidence, skill mappings, validated evidence, proficiency scores
**External services:** Anthropic Claude API (Opus 4.5 for Stages 2, 3, 5; Sonnet for Stages 1, 4)
**Status:** Confirmed — production-ready

Five stages:
1. **Segmentation** (Sonnet) — identifies episodes from transcript, classifies by type (episode/scenario/simulation/commentary), scores specificity
2. **STAR+E+R Extraction** (Opus) — extracts Situation, Task, Action, Result, Emotion, Reflection per episode
3. **Skill Mapping** (Opus) — maps evidence to PSF skills, vacancy-weighted, with behavioral indicators
4. **Consistency Validation** (Sonnet) — cross-references across stories, checks for contradictions, validates sufficiency
5. **Proficiency Scoring** (Opus) — assigns Basic/Intermediate/Advanced per skill with confidence scores, narrative summary, gaming flags, Layer 2 seeds

Post-Stage-5 voice enhancement: if `voiceAnalysis` data exists, applies paralinguistic confidence adjustments (±0.20 cap per skill), adds voice_gaming_flags.

Model routing per stage defined in `STAGE_MODEL_MAP`. Gemini fallback via `callLLM()` in `src/lib/llm.ts`.

### D3. Multi-Agent Simulation Engine (Layer 2)
**Purpose:** Observe candidate behavior in realistic workplace scenarios
**Key files:** `src/lib/simulation/engine.ts` (788 lines), `src/lib/simulation/bias-audit.ts` (184 lines), `src/lib/simulation/selector.ts` (372 lines), `src/lib/scenarios/` (4 files)
**Inputs:** Scenario config, candidate messages, Layer 1 seeds
**Outputs:** Character messages, checkpoint evaluations (Sotopia-Eval 7 dimensions), convergence analysis, gaming flags
**External services:** Anthropic Claude API
**Status:** Confirmed — production-ready

Core classes/functions:
- `GameMaster` — orchestrates scenario, manages rounds, injects twists
- `executeCharacter()` — Managed Agents pattern, generates character responses based on personality/agenda/constraints
- `evaluateCheckpoint()` — Sotopia-Eval 7-dimension scoring (goal_completion, relationship_maintenance, social_norms, adaptability, emotional_handling, knowledge_application, overall)
- `calculateConvergence()` — compares L1 extraction scores against L2 simulation scores per skill
- `detectGaming()` — flags rehearsed responses, inconsistency, pattern matching, context mismatch, overclaiming
- `formatSimulationForExtraction()` — produces `[SIMULATION EVIDENCE]` tags for LEEE pipeline

Three pre-authored scenarios: Customer Escalation (branch counter), Team Coordination (system outage), Onboarding (trainer departure). Each has 3 characters with TinyTroupe-format personas, 5-6 rounds, 3 checkpoints, 2 twists.

Bias audit module tests scenarios across 4 communication styles (direct, indirect, formal, casual) to ensure no style is disadvantaged.

### D4. Employer Scenario Generation
**Purpose:** Auto-generate employer-specific workplace simulation scenarios from seed material
**Key files:** `src/lib/employer-intelligence/graph-extraction.ts` (198 lines), `src/lib/employer-intelligence/discovery-simulation.ts` (317 lines), `src/lib/employer-intelligence/scenario-generator.ts` (203 lines)
**Inputs:** Employer seed material (JDs, handbook, company description)
**Outputs:** Knowledge graph, discovered situations, ScenarioConfig objects
**External services:** Anthropic Claude API
**Status:** Confirmed — built, not yet production-tested with real employers

Pipeline: Seed material → Claude extracts knowledge graph (nodes: roles/departments/customers/processes, edges: relationships, friction points, critical skills, workplace culture) → Discovery simulation spawns 20-50 agents, runs 3-4 rounds per friction point, scores situations by assessment value → Scenario generator converts top situations to ScenarioConfig with characters, checkpoints, twists → Stored in Supabase, fed to GameMaster.

### D5. Voice System
**Purpose:** Enable voice-based conversation and extract paralinguistic skill signals
**Key files:** `src/app/chat-voice/page.tsx` (778 lines), `src/lib/voice/hume-client.ts` (345 lines), `src/app/api/stt/route.ts`, `src/app/api/tts/route.ts`, `src/app/api/voice-analysis/route.ts`
**Inputs:** Audio blobs from browser MediaRecorder
**Outputs:** Transcribed text, emotion analysis, skill confidence adjustments, gaming signals
**External services:** OpenAI Whisper (STT), OpenAI TTS (nova voice), Hume AI Expression Measurement (prosody + vocal burst)
**Status:** Confirmed — 48/49 tasks complete (manual browser testing remaining)

Voice flow: Browser records audio (opus/webm, 16kHz, noise suppression) → parallel: Whisper STT (transcription) + Hume AI (48-dimension emotion analysis) → text fed to chat API, emotion data stored per-message → at extraction time, paralinguistic adjustments applied to Stage 5 scoring.

Hume → PSF mapping (7 rules):
- Empathy signals (Sympathy+Admiration+Love > 0.6) → +0.10 Emotional Intelligence
- Calm during stress (Calmness+Determination) → +0.10 Self-Management
- Enthusiasm (Excitement+Interest+Determination > 0.6) → +0.08 Problem-Solving
- Genuine laughter (vocal burst) → +0.10 Adaptability
- Thoughtful pauses (Contemplation+Concentration > 0.3) → +0.08 Learning Agility
- Voice tremor (genuine emotion) → +0.05 all skills
- Flat affect (intensity < 0.15) → gaming flag

### D6. Peer/360 Assessment (Layer 3)
**Purpose:** Independent reference ratings for three-layer triangulation
**Key files:** `src/lib/layer3/peer-assessment.ts` (355 lines), `src/app/api/peer-assessment/route.ts` (276 lines), `src/app/reference/page.tsx` (233 lines)
**Inputs:** Reference contacts, L1/L2 skill data for adaptive rubric
**Outputs:** Skill ratings per reference, three-layer convergence, independence verification
**Status:** Confirmed — 13/14 tasks complete (email notifications remaining)

Rubric: 8 PSF-aligned questions with 1-5 scales, optional examples, relationship context, overall impression. Rubric adapts to prioritize skills where L1/L2 diverge or confidence is low.

Three-layer convergence: L1 (0.25 weight) + L2 (0.40) + L3 (0.35). Convergence types: full_agreement (+0.15 confidence), undersell (+0.05), overclaim (-0.10), various partial agreements. Anti-gaming: submission timing, identical ratings, copy-paste detection, suspiciously high average.

### D7. Training Impact Measurement
**Purpose:** Measure skill improvement attributable to training programs
**Key files:** `src/lib/growth/growth-engine.ts` (266 lines), `src/app/api/growth/route.ts` (212 lines), `src/app/api/growth-report/route.ts` (261 lines), `src/app/growth/page.tsx` (392 lines)
**Inputs:** Multiple extraction snapshots tagged by training phase
**Outputs:** Skill deltas, Skills Velocity, cohort summaries, funder reports
**Status:** Confirmed — 14/14 tasks complete

Key metrics:
- Skills Delta: per-skill proficiency change between two sessions
- Skills Velocity: proficiency points per week (>0.3 rapid, 0.1-0.3 standard, 0-0.1 slow, 0 stagnant, <0 declining)
- Auto-comparison: when a post-training extraction completes, automatically finds baseline and calculates delta
- Cohort summary: aggregate improvement across program participants

### D8. Three-Gate Employer Pipeline
**Purpose:** Structured decision process for hiring with human review at each stage
**Key files:** `src/app/api/gate1/route.ts` (497 lines), `src/app/api/demo/route.ts` (658 lines), `src/app/api/gate3/route.ts` (564 lines), `src/app/reviewer/page.tsx` (542 lines)
**Status:** Confirmed — production-ready

- Gate 1 (Alignment): JD competency blueprint vs candidate profile → alignment score, competency fit map, strengths/gaps
- Gate 2 (Evidence): LEEE extraction quality + skills profile → evidence rating, evidence gaps, recommendation
- Gate 3 (Predictability): L2 simulation + L3 peer/360 + convergence → readiness index, success conditions, support needs

Each gate stores results in `gate1_results`, `gate2_results`, `gate3_results` tables with AI recommendation + reviewer decision fields.

### D9. Micro-Simulations and Scenario Cards
**Purpose:** Embedded skill assessment moments during the Aya conversation
**Key files:** `src/components/ScenarioCard.tsx` (203 lines), `src/components/MicroSimulation.tsx` (207 lines), `src/app/api/scenario/route.ts`
**Status:** Confirmed — works in both text and voice modes

Scenario cards: Aya triggers `[SCENARIO:{domain, skill_gap, emotional_register}]` → `/api/scenario` generates dilemma with 2-3 options → candidate taps choice → `[SCENARIO EVIDENCE]` fed to extraction pipeline. Max 2 per session. Readiness-based triggering (6+ messages, past opening stage, targets skill gaps).

Micro-simulations: 2-3 round free-text role-play with a character. Candidate's actual words in the simulated situation produce `[SIMULATION EVIDENCE]`. Text-only in voice mode.

---

## E. Technical Architecture

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Pages:** 19 page components totaling 8,218 lines
- **Components:** 6 shared components totaling 2,441 lines (LEEEChat, ScenarioCard, MicroSimulation, SuperpowersReveal, BloomMark, KayaNav)
- **Deployment:** Vercel (auto-deploy from main branch)
- **Domain:** kaya-mvp-rose.vercel.app

### Backend
- **Framework:** Next.js API Routes (serverless functions on Vercel)
- **API Routes:** 22 route handlers totaling 5,391 lines
- **No separate backend server** — all logic runs in Vercel serverless functions
- **No background job infrastructure** — all processing is synchronous within API requests

### Data Layer
- **Database:** Supabase (PostgreSQL)
- **ORM:** Direct Supabase JS client (no ORM layer)
- **Key tables:** user_profiles, jobseeker_profiles, employers, vacancies, applications, leee_sessions, leee_messages, leee_extractions, gate1_results, gate2_results, gate3_results, peer_references, peer_assessments, employer_graphs, employer_scenarios, training_cohorts, psychologist_validations
- **Schema:** Defined in `schema.sql` (not in version control as migrations)
- **Storage:** No file storage configured — audio is processed in-memory and discarded

### Authentication
- **Provider:** Supabase Auth
- **Implementation:** `src/lib/supabase.ts` (server client), `src/lib/use-auth.ts` (client hook)
- **Middleware:** `src/middleware.ts` — route protection
- **Fallback:** Demo mode with auto-created demo user for testing

### AI/Model Providers
| Provider | Service | Usage | Cost |
|---|---|---|---|
| Anthropic | Claude Opus 4.5 | LEEE Stages 2, 3, 5 (evidence extraction, mapping, scoring) | ~$0.03/turn |
| Anthropic | Claude Sonnet | LEEE Stages 1, 4 (segmentation, validation), simulation character generation | ~$0.005/turn |
| Google | Gemini 2.5 Flash | Fallback when Claude fails | ~$0.001/turn |
| OpenAI | Whisper | Speech-to-text (Taglish support) | $0.006/min |
| OpenAI | TTS (nova) | Text-to-speech for Aya and simulation characters | ~$0.002/response |
| Hume AI | Expression Measurement | Paralinguistic analysis (prosody + vocal burst) | $0.064/min |

### Speech/Voice Stack
- **STT:** OpenAI Whisper via `/api/stt` — receives audio blob, returns transcript
- **TTS:** OpenAI TTS via `/api/tts` — receives text + optional voice_override, returns audio stream
- **Paralinguistic:** Hume AI batch API via `/api/voice-analysis` — receives audio blob, returns 48-dimension emotion analysis
- **Client:** Browser MediaRecorder API (opus/webm codec, 16kHz, echoCancellation + noiseSuppression)
- **Character voices:** 5 OpenAI TTS voices (onyx, shimmer, echo, fable, alloy) assigned to simulation characters

### Environment Variables
```
ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, HUME_API_KEY,
GEMINI_API_KEY, GITHUB_TOKEN
```

---

## F. Detailed Data Flow

### F1. Candidate Assessment Flow
```
Profile data (jobseeker_profiles)
    ↓ calibration.ts derives experience_level, probe_depth, session_pace
    ↓
Aya conversation (/api/chat → orchestrator.ts)
    ↓ Messages stored in leee_messages
    ↓ Stage transitions managed by orchestrator state machine
    ↓ Gap scan runs periodically → triggers scenario cards for skill gaps
    ↓ Voice data → Whisper (transcript) + Hume (emotion) in parallel
    ↓
Session completion (/api/chat action='extract')
    ↓ extraction-pipeline.ts runs 5 stages
    ↓ Voice analysis data applied post-Stage-5
    ↓ Auto-comparison if post-training tag
    ↓ Result stored in leee_extractions
    ↓
Skills profile available on /skills
    ↓ layer2_seeds identify skill gaps for simulation
    ↓
Application (/api/vacancy, /api/gate1)
    ↓ Alignment score calculated against vacancy competency blueprint
    ↓ Stored in applications + gate1_results
    ↓
Gate 2 reviewer passes → candidate invited to simulation
    ↓
Layer 2 simulation (/api/simulation-l2)
    ↓ GameMaster runs scenario (employer-specific or static)
    ↓ Checkpoints evaluated with Sotopia-Eval
    ↓ Convergence calculated (L1 vs L2)
    ↓ Gaming detection
    ↓ Stored in gate3_results
    ↓
Layer 3 peer assessment (/api/peer-assessment)
    ↓ References rate independently
    ↓ Three-layer convergence calculated
    ↓ Independence verified
    ↓ Stored in peer_assessments + gate3_results updated
    ↓
Psychologist reviews full audit trail (/psychologist)
    ↓ Endorses or requests revision
    ↓ Stored in psychologist_validations
```

---

## G. AI and Decisioning Layer

### G1. Aya Conversation AI
**Provider:** Anthropic Claude (via `src/lib/llm.ts`)
**Prompt:** `LEEE_SYSTEM_PROMPT` in `src/lib/prompts.ts` (619 lines total)
**Purpose:** Conduct Moth-structured storytelling conversation
**Key prompt elements:**
- Golden Rule: "You are NOT interviewing. You are having a conversation."
- 7-stage conversation structure with specific goals per stage
- Filipino cultural intelligence layer (SP concepts, Taglish, honorifics)
- Anti-gaming: oblique questioning, specificity probes, verification
- Scenario trigger mechanism: `[SCENARIO:{...}]` tags
- Wellbeing protocol: distress detection and crisis response
- Calibration context injected from `calibration.ts`

**Guardrails:** Cannot diagnose, prescribe, or provide medical/legal advice. Wellbeing protocol escalates at distress level 3. Session auto-closes after 35 minutes or evidence threshold met.

### G2. LEEE 5-Stage Pipeline
See Section D2 for full details. Each stage has its own prompt template in `extraction-pipeline.ts`:
- `STAGE_1_SEGMENTATION` — narrative analysis engine
- `STAGE_2_STAR_ER` — behavioral evidence extraction
- `STAGE_3_SKILL_MAPPING` — PSF skill alignment with vacancy weighting
- `STAGE_4_CONSISTENCY` — cross-referencing and anti-gaming validation
- `STAGE_5_PROFICIENCY` — holistic proficiency scoring

Anti-bias instructions embedded in Stage 5: "YOU ARE SCORING CAPABILITY, NOT CREDENTIALS. The person's job title, education level, formality of their experience, and eloquence of their storytelling are IRRELEVANT to proficiency scoring."

### G3. Simulation Character AI
**Prompt:** `CHARACTER_EXECUTION_PROMPT` in `src/lib/simulation/engine.ts`
**Purpose:** Generate realistic character responses in workplace simulations
**Pattern:** Managed Agents — each character has personality (MBTI, traits), agenda, constraints, backstory
**Guardrails:** Characters cannot be unreasonably difficult (constraints list). Observer evaluates candidates, not characters.

### G4. Scenario Card Generation
**Prompt:** `LEEE_SCENARIO_PROMPT` in `src/lib/prompts.ts`
**Purpose:** Generate culturally-grounded dilemmas testing specific PSF skills
**Structured output:** JSON with scenario, options (each with signal + proficiency level), Aya reaction template, SP concept reference

### G5. Employer Graph Extraction
**Prompt:** `GRAPH_EXTRACTION_PROMPT` in `src/lib/employer-intelligence/graph-extraction.ts`
**Purpose:** Extract workplace knowledge graph from seed material
**Structured output:** JSON with nodes, edges, friction_points, critical_skills, workplace_culture

---

## H. Skills Framework Implementation

### Where the 16 skills are defined
`src/lib/skills-taxonomy.ts` — `SKILLS_TAXONOMY` array of 8 Skill objects (4 primary, 4 secondary). Each includes PSF code, PSF cluster, WEF cluster, COMPASS domain, three-level proficiency descriptors (basic/intermediate/advanced), and extractability rating.

**Primary (COMPASS domains):** Emotional Intelligence (SK1), Communication (SK2), Collaboration (SK3), Problem-Solving (SK4)
**Secondary:** Adaptability/Resilience (SK5), Learning Agility (SK6), Sense Making (SK7), Building Inclusivity (SK8)

Note: The system references "16 PSF Enabling Skills" in documentation but the taxonomy file implements 8. The extraction pipeline prompt (Stage 3) instructs Claude to "map to all 16 PSF Enabling Skills and Competencies" and lists: Building Inclusivity, Collaboration, Communication, Customer Orientation, Developing People, Influence, Adaptability, Digital Fluency, Global Perspective, Learning Agility, Self-Management, Creative Thinking, Decision Making, Problem Solving, Sense Making, Transdisciplinary Thinking. The taxonomy file covers the top 8 by extractability. **Status: Partial implementation** — extraction maps to all 16, taxonomy defines 8 in detail.

### How skills are scored
- **Stage 5 prompt** instructs: score from behavioral evidence only, not credentials
- **Three proficiency levels:** Basic, Intermediate, Advanced (with detailed descriptors per skill)
- **Confidence:** 0.0-1.0 based on evidence density, cross-story consistency, and specificity
- **Sufficiency:** strong/adequate/insufficient per skill based on evidence count and quality
- **Voice adjustment:** paralinguistic data adds ±0.20 to confidence post-Stage-5
- **L3 adjustment:** three-layer convergence boosts/reduces confidence based on agreement pattern

### How evidence combines across layers
Three-layer convergence formula (in `src/lib/layer3/peer-assessment.ts`):
- Combined score = L2 (0.40 weight) + L3 (0.35) + L1 (0.25)
- Behavioral observation and peer validation weighted higher than self-report
- Full agreement: +0.15 confidence boost
- Overclaim pattern: -0.10 confidence reduction
- Undersell pattern: +0.05 confidence boost

---

## I. Employer-Side Intelligence Flow

### JD Processing
Employer pastes JD text → `/api/gate1` action `create_vacancy` → Claude generates competency blueprint:
- Extracts human-centric skill requirements
- Weights skills by importance (critical/important/nice-to-have)
- Identifies gaps in JD (skills the role likely needs but JD doesn't mention)
- Stored as `competency_blueprint` jsonb on `vacancies` table

### Candidate-Job Matching
`/api/match` — calculates alignment between candidate skills profile and vacancy competency blueprint:
- Per-skill match: candidate proficiency vs vacancy requirement
- Weighted by skill importance
- Returns alignment_score, fit_map, strengths, gaps
- Used in Gate 1 and Talent Pool views

### Explainability
Reviewers see: alignment score + per-skill fit map with evidence snippets + AI recommendation text. Not just scores — the rationale is visible. Psychologist sees full audit trail including extraction methodology and research anchoring.

---

## J. Accessibility and Inclusion Design

### Present in codebase
- **Voice mode** (`/chat-voice`) — full conversation via voice, no typing required
- **Text fallback** — always available alongside voice
- **Taglish support** — conversation AI and extraction handle English/Filipino/Taglish
- **Consent screen** — explains audio recording before voice session starts
- **Connection monitoring** — warns when offline
- **Simple language** — prompts instruct Aya to use conversational, non-clinical language
- **Profile captures disability type** — used in calibration context
- **Accessibility mode field** on sessions — `accessibility_mode: Record<string, boolean>`
- **TTS toggle** — can disable speech output while keeping text
- **Text input always visible** in voice mode

### Missing but important (identified gaps)
- No screen reader testing documented
- No WCAG compliance audit
- No keyboard navigation testing
- No low-bandwidth mode (images/assets not optimized)
- No cognitive load assessment of UI
- No sign language support
- Profile asks disability type but calibration doesn't deeply adapt beyond probe_depth

---

## K. Trust, Ethics, and Validation

### Psychologist Role
- Licensed PRC psychologist reviews full audit trail
- Sees all three layers: L1 extraction + L2 simulation + L3 peer/360
- Reviews methodology (Moth storytelling, STAR+E+R, PSF alignment, cultural calibration)
- Research anchoring document provided (7 academic frameworks cited)
- Enters PRC license number and validation notes
- Can endorse, reject, or request revision
- **Status:** Workflow built, not yet tested with actual psychologist

### Anti-Gaming Framework
- **L1:** Oblique questioning (never asks "are you good at X"), specificity probes, cross-story verification, gap scanning
- **L2:** Observer pattern detection (rehearsed responses, inconsistency, context mismatch, overclaiming), behavioral vs stated assessment
- **L3:** Reference independence verification (timing, identical ratings, copy-paste, suspiciously high scores)
- **Voice:** Flat affect detection, incongruent signals (high anxiety + high joy simultaneously)
- **Gaming flags surface** in reviewer and psychologist views with evidence

### Bias Mitigation
- Stage 5 prompt: "Score CAPABILITY, not CREDENTIALS"
- Bias audit module tests scenarios across 4 communication styles
- Cultural calibration: Filipino norms don't penalize indirect communication
- Three-layer design inherently reduces single-source bias
- **Gap:** No formal fairness metrics or disparate impact analysis implemented

### Data Sensitivity
- Audio discarded after transcription (not stored)
- Consent screen before voice recording
- Sessions can be deleted (Supabase RLS)
- No PII in extraction output (skill evidence is behavioral, not personal)
- **Gap:** No formal data retention policy, no GDPR/Philippine Data Privacy Act compliance documentation

---

## L. Data Model and Entities

### Core Entities (from `src/types/index.ts` and Supabase schema)

| Entity | Table | Key Fields |
|---|---|---|
| User Profile | user_profiles | id, full_name, role (UserRole), email |
| Jobseeker Profile | jobseeker_profiles | id, user_id, disability_type, work_experience, education, languages, accessibility_needs |
| Employer | employers | id, organization_name, industry, locations, reviewer_assignments |
| Vacancy | vacancies | id, employer_id, title, description, competency_blueprint (jsonb) |
| Application | applications | id, vacancy_id, jobseeker_id, status (ApplicationStatus), current_gate |
| LEEE Session | leee_sessions | id, user_id, status, current_stage (MothStage), stories_completed, skills_evidenced, session_tag, voice_analysis (jsonb) |
| LEEE Message | leee_messages | id, session_id, role, content, moth_stage, turn_number |
| LEEE Extraction | leee_extractions | id, session_id, episodes, skills_profile, evidence_map, narrative_summary, gaming_flags, layer2_seeds, growth_delta |
| Gate 1 Result | gate1_results | id, application_id, alignment_score, competency_fit_map, ai_recommendation, reviewer_decision |
| Gate 2 Result | gate2_results | id, application_id, leee_session_id, leee_skills_profile, evidence_rating, reviewer_decision |
| Gate 3 Result | gate3_results | id, application_id, simulation_results, readiness_index, layer3_convergence, layer3_independence |
| Peer Reference | peer_references | id, candidate_id, name, relationship, token, status |
| Peer Assessment | peer_assessments | id, reference_id, candidate_id, ratings (jsonb), overall_impression |
| Employer Graph | employer_graphs | id, employer_id, graph_data (jsonb), discoveries, critical_skills |
| Employer Scenarios | employer_scenarios | id, employer_id, scenarios (jsonb[]), generated_at |
| Training Cohort | training_cohorts | id, name, candidate_ids (uuid[]) |
| Psychologist Validation | psychologist_validations | id, jobseeker_id, psychologist_id, validation_status, license_number, methodology_references |

---

## M. API / Services / Integration Map

### API Routes (22 total)

| Route | Key Actions | Lines |
|---|---|---|
| /api/chat | start, message, extract, extract_transcript | 717 |
| /api/demo | get_demo_state, create_employer, create_vacancy, create_application, process_gates | 658 |
| /api/gate1 | create_employer, create_vacancy, calculate_alignment, apply | 497 |
| /api/gate3 | start_l2_simulation, complete_simulation | 564 |
| /api/simulation-l2 | start, respond, get_state, complete, bias_audit | 297 |
| /api/employer-graph | extract_graph, run_discovery, generate_scenarios, full_pipeline, get_scenarios | 280 |
| /api/peer-assessment | invite_references, get_rubric, submit_assessment, get_status, calculate_convergence | 276 |
| /api/match | calculate alignment between candidate and vacancy | 276 |
| /api/growth | get_trajectory, compare_sessions, tag_session, create_cohort, cohort_summary | 212 |
| /api/growth-report | cohort_report, individual_report, funder_report | 261 |
| /api/psychologist | get_all_extractions, get_extraction_detail | 141 |
| /api/voice-analysis | POST audio → Hume AI → paralinguistic profile | 80 |
| /api/stt | POST audio → Whisper → transcript | 55 |
| /api/tts | POST text → OpenAI TTS → audio stream | 96 |
| /api/scenario | POST trigger → generate scenario card | 45 |
| /api/simulation | Original single-character micro-simulation | 129 |
| /api/vacancy | CRUD for vacancies | 144 |
| /api/profile | CRUD for jobseeker profiles | 176 |
| /api/session | Session management | 125 |
| /api/resume | Resume parsing | 140 |
| /api/vacancy-export | Export vacancy data | 62 |
| /api/employer-intelligence | Alternate employer intelligence route | 160 |

### External Integrations
| Service | Purpose | Auth |
|---|---|---|
| Anthropic Claude API | LLM for conversation, extraction, simulation, scenario generation | ANTHROPIC_API_KEY |
| Google Gemini | LLM fallback | GEMINI_API_KEY |
| OpenAI Whisper | Speech-to-text | OPENAI_API_KEY |
| OpenAI TTS | Text-to-speech | OPENAI_API_KEY |
| Hume AI | Paralinguistic emotion analysis | HUME_API_KEY |
| Supabase | Database + Auth | SUPABASE keys |

---

## N. Repo Map for Future Maintainers

```
sis-mvp/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── page.tsx                  # Landing page
│   │   ├── layout.tsx                # Root layout
│   │   ├── api/                      # 22 API route handlers
│   │   │   ├── chat/route.ts         # ★ CORE: Aya conversation + extraction
│   │   │   ├── simulation-l2/route.ts # ★ Layer 2 simulation API
│   │   │   ├── peer-assessment/      # ★ Layer 3 peer/360
│   │   │   ├── employer-graph/       # Employer scenario generation
│   │   │   ├── growth/               # Training impact
│   │   │   └── ...
│   │   ├── chat/page.tsx             # Text chat (wrapper)
│   │   ├── chat-voice/page.tsx       # ★ Voice chat (full implementation)
│   │   ├── simulation/page.tsx       # ★ Layer 2 simulation UI
│   │   ├── psychologist/page.tsx     # ★ Psychologist validation UI
│   │   ├── reviewer/page.tsx         # ★ Three-gate reviewer UI
│   │   ├── employer-dashboard/       # Employer portal
│   │   ├── my-dashboard/             # Candidate dashboard
│   │   ├── reference/page.tsx        # Reference submission form
│   │   ├── growth/page.tsx           # Training impact dashboard
│   │   ├── skills/page.tsx           # Skills profile view
│   │   └── ...
│   ├── lib/                          # ★ CORE BUSINESS LOGIC
│   │   ├── prompts.ts                # Aya system prompt + scenario prompt
│   │   ├── orchestrator.ts           # 7-stage conversation state machine
│   │   ├── extraction-pipeline.ts    # ★ 5-stage LEEE pipeline
│   │   ├── question-bank.ts          # 305 trilingual questions
│   │   ├── calibration.ts            # Session calibration from profile
│   │   ├── skills-taxonomy.ts        # PSF skill definitions
│   │   ├── llm.ts                    # LLM abstraction (Claude + Gemini fallback)
│   │   ├── supabase.ts               # Database client
│   │   ├── simulation/
│   │   │   ├── engine.ts             # ★ GameMaster + characters + Sotopia-Eval
│   │   │   ├── bias-audit.ts         # Communication style bias testing
│   │   │   └── selector.ts           # Scenario selection logic
│   │   ├── scenarios/                # 3 pre-authored scenario configs
│   │   ├── employer-intelligence/    # Knowledge graph + discovery + generation
│   │   ├── voice/hume-client.ts      # Hume AI emotion analysis + PSF mapping
│   │   ├── layer3/peer-assessment.ts # Three-layer convergence engine
│   │   └── growth/growth-engine.ts   # Skills delta + velocity + cohort
│   ├── components/                   # Shared React components
│   │   ├── LEEEChat.tsx              # ★ Main chat component (1124 lines)
│   │   ├── ScenarioCard.tsx          # Interactive dilemma cards
│   │   ├── MicroSimulation.tsx       # Inline role-play
│   │   └── SuperpowersReveal.tsx     # Skills reveal animation
│   └── types/index.ts               # TypeScript type definitions
├── docs/                             # Supporting documentation
├── test/                             # Test scripts (manual, not CI)
├── *.md                              # Build trackers and roadmaps
├── package.json                      # Dependencies
└── tsconfig.json                     # TypeScript config
```

**Where to start for onboarding:**
1. Read `PROJECT_CONTEXT.md` — full project context and people
2. Read `src/types/index.ts` — data model
3. Read `src/lib/prompts.ts` — understand Aya's conversation design
4. Read `src/lib/extraction-pipeline.ts` — understand the extraction engine
5. Read `src/lib/simulation/engine.ts` — understand Layer 2
6. Run the demo: `/demo-day` or `/demo` for the full flow

---

## O. Build Status and Maturity Assessment

| Component | Tasks | Done | Maturity |
|---|---|---|---|
| Layer 1: Conversation + Extraction | ~40 | 40 | **Production-ready** — tested with demo data, Jakarta presentation |
| Layer 2: Multi-Agent Simulation | 38 | 38 | **Production-ready** — full engine, 3 scenarios, pipeline wired |
| Advanced Voice System | 49 | 48 | **Near-production** — missing manual browser testing |
| Employer Scenario Generation | 25 | 25 | **Built, untested with real employers** |
| Layer 3: Peer/360 | 14 | 13 | **Built, untested with real references** — email notifications missing |
| Training Impact | 14 | 14 | **Built, untested with real cohorts** |
| Three-Gate Pipeline | ~20 | 20 | **Production-ready** — demo tested |
| Psychologist Validation | ~8 | 8 | **UI built, untested with real psychologist** |
| Authentication | — | — | **Basic** — Supabase Auth with demo fallback |
| **Total codebase** | — | — | **77 files, 23,475 lines, 30+ commits this session** |

---

## P. Known Gaps, Risks, and Technical Debt

### Critical Gaps
1. **No database migrations** — schema defined in SQL file but no migration tooling. Schema changes require manual application.
2. **No automated tests in CI** — test files exist but are manual scripts. No CI/CD pipeline.
3. **No error monitoring** — no Sentry, LogRocket, or equivalent. Errors visible only in Vercel function logs.
4. **No rate limiting** — API routes have no request throttling. Could be abused.
5. **Single-developer codebase** — comprehensive but all knowledge in one person's head (mitigated by this documentation).

### Security/Privacy
6. **GitHub token was visible** in chat history — needs rotation.
7. **No formal data retention policy** — audio discarded but text persists indefinitely.
8. **No Philippine Data Privacy Act compliance documentation**.
9. **Supabase RLS rules not documented** — unclear what data isolation exists between employers.

### Scalability
10. **All processing synchronous** — LEEE extraction (5 Claude API calls) happens in a single Vercel function invocation. Long-running sessions may timeout.
11. **In-memory orchestrator cache** — session state cached in `Map<string, LEEEOrchestrator>`. Lost on serverless cold start. Mitigation: `rebuildOrchestrator()` from Supabase.
12. **No connection pooling** — each API call creates a new Supabase client.

### Quality
13. **Skills taxonomy defines 8 skills but system references 16** — mismatch between taxonomy file and extraction prompts.
14. **Employer scenario generation untested** with real employer data.
15. **Layer 3 convergence untested** with real peer assessments.
16. **Voice analysis (Hume) untested** in production environment.
17. **No A/B testing framework** for prompt improvements.

### Technical Debt
18. **Duplicate employer intelligence routes** — both `/api/employer-graph` and `/api/employer-intelligence` exist with overlapping functionality.
19. **Demo route is 658 lines** — contains significant business logic that should be in lib/.
20. **Inconsistent naming** — "SIS" vs "Kaya" in codebase; "LEEE" vs "extraction" in different contexts.
21. **No TypeScript strict mode** — potential type safety issues.

---

## Q. Roadmap Extraction

### Confirmed from trackers

| # | Feature | Status | Source |
|---|---|---|---|
| F1 Phase 1 | Employer-specific scenarios | ✅ Complete | SCENARIO_GEN_BUILD_TRACKER.md |
| F1 Phase 2 | MiroFish market intelligence | Pending Ryan | Kaya_Future_Product_Roadmap.md |
| F2 | Skills demand forecasting | Idea | Kaya_Future_Product_Roadmap.md |
| F3 | Employer workforce analytics | Idea | Kaya_Future_Product_Roadmap.md |
| F4 | ASEAN portability | 2027 | Kaya_Future_Product_Roadmap.md |
| F5 | Voice-first Layer 2 | ✅ Complete | VOICE_BUILD_TRACKER.md |
| F6 | Peer/360 Layer 3 | 13/14 | F6_F7_BUILD_TRACKER.md |
| F7 | Training impact measurement | ✅ Complete | F6_F7_BUILD_TRACKER.md |
| F8 | Government API | 2027 | Kaya_Future_Product_Roadmap.md |

### Inferred Next Priorities
1. **Production hardening** — database migrations, error monitoring, rate limiting, automated tests
2. **Real employer pilot** — test scenario generation with actual employer data
3. **Real psychologist pilot** — test validation workflow with licensed PRC psychologist
4. **Skills Passport v1** — machine-readable credential for Randy's system
5. **Email notifications** — reference invitations, application status updates
6. **MiroFish Phase 2** — pending Ryan's decision on 5 questions

---

## R. Open Questions

1. **Who manages Supabase schema changes?** No migration tooling exists. How are schema updates applied?
2. **What is the Skills Passport format?** Randy needs a machine-readable credential — what's the spec?
3. **Has a PRC psychologist reviewed the methodology?** The research anchoring document exists but has it been validated by an actual psychologist?
4. **What employer data is available for scenario generation testing?** The engine is built but untested with real data.
5. **What is the scaling plan?** Vercel serverless has timeout limits. The 5-stage extraction takes 30-60 seconds.
6. **Is there a pricing model?** Cost per assessment (~$1-3) is documented but no revenue model.
7. **What about the 16 vs 8 skills mismatch?** Should the taxonomy be expanded to match the extraction prompts?
8. **Is the MiroFish AGPL-3.0 license acceptable?** Legal review needed if Phase 2 proceeds.
9. **What data sources are available for F2 (skills forecasting)?** TESDA/PSA/DOLE data is public but needs automated ingestion.
10. **What accessibility standards should Kaya meet?** No WCAG target specified.

---

*End of SYSTEM_AS_IS_MASTER.md*
*This document was generated from the actual codebase, build trackers, project context files, and knowledge accumulated across multiple development sessions.*
