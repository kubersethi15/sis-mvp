# MVP CLOSURE AUDIT

**Question this document answers:** What is still actually incomplete before Kaya can be honestly called a full MVP ready to take to an employer for pilot testing?

**Audited by:** The developer who wrote every line of code.
**Date:** April 14, 2026
**Codebase:** 77 source files, 23,475 lines, deployed at kaya-mvp-rose.vercel.app

---

## Candidate Onboarding / Profile

**Status: BUILT AND USABLE**

Profile creation works. Captures: name, disability type, work experience, education, languages, accessibility needs. Stores in `user_profiles` + `jobseeker_profiles`. Supabase Auth with demo fallback. Calibration module (`src/lib/calibration.ts`, 305 lines) derives session parameters from profile data.

Files: `src/app/profile/page.tsx` (630 lines), `src/app/auth/page.tsx` (225 lines), `src/lib/calibration.ts`, `src/app/api/profile/route.ts`

**Remaining:** None for MVP. The profile works.

---

## Aya Text Conversation

**Status: BUILT AND USABLE**

7-stage Moth state machine (opening → story_select → elicitation → core_probe → skill_probe → verification → closing). 305 trilingual questions. Gap scanning for skill coverage. Scenario card triggers during conversation. Wellbeing protocol with distress detection. Session persistence to Supabase. Multi-session continuity (previous session skills/gaps carried forward).

Files: `src/lib/orchestrator.ts` (458 lines), `src/lib/prompts.ts` (619 lines), `src/lib/question-bank.ts` (305 lines), `src/components/LEEEChat.tsx` (1,124 lines), `src/app/api/chat/route.ts` (717 lines)

**Remaining:** None for MVP. This is the most tested part of the system.

---

## Aya Voice Conversation

**Status: BUILT BUT NEEDS POLISH**

Whisper STT + OpenAI TTS + silence detection + auto-listen + acknowledgments + pacing + consent screen + connection monitoring + scenario cards in voice. Hume paralinguistic analysis runs in parallel.

Files: `src/app/chat-voice/page.tsx` (778 lines), `src/app/api/stt/route.ts`, `src/app/api/tts/route.ts`, `src/app/api/voice-analysis/route.ts`

**Why "needs polish":** Not tested on actual Philippine mobile networks (low bandwidth, intermittent connectivity). Browser compatibility test (V6.5) not done — MediaRecorder API behavior varies across mobile Safari, Chrome Android, etc. The consent screen text may need legal review.

**Remaining work:** Browser testing (1-2 hours manual testing). Type: Testing.

---

## LEEE Extraction Pipeline

**Status: BUILT AND USABLE**

5-stage pipeline: Segmentation (Sonnet) → STAR+E+R (Opus) → Skill Mapping (Opus) → Consistency (Sonnet) → Proficiency (Opus). Handles scenario evidence, simulation evidence, voice analysis adjustments, auto-comparison for training tags.

Files: `src/lib/extraction-pipeline.ts` (752 lines)

**Remaining:** Test-retest reliability not measured (same transcript 5x should produce ±5% scores). This is validation, not build. Type: Validation.

---

## Micro-Simulations / Scenario Cards

**Status: BUILT AND USABLE**

Scenario cards: Aya triggers `[SCENARIO:{...}]` → `/api/scenario` generates dilemma → candidate taps choice → `[SCENARIO EVIDENCE]` enters extraction. Max 2 per session. Readiness-based triggering. Works in text and voice modes.

Micro-simulations: 2-3 round free-text role-play with a character. `[SIMULATION EVIDENCE]` enters extraction. Text-only.

Files: `src/components/ScenarioCard.tsx` (203 lines), `src/components/MicroSimulation.tsx` (207 lines), `src/app/api/scenario/route.ts`

**Remaining:** None for MVP.

---

## Layer 2 Simulation Engine

**Status: BUILT AND USABLE**

GameMaster with TinyTroupe personas, Concordia round management, Sotopia-Eval 7-dimension scoring. 3 pre-authored scenarios. Convergence analysis (L1 vs L2). Gaming detection (5 types). Bias audit across 4 communication styles. Voice mode with character voices (5 OpenAI TTS voices). Full pipeline wired: Gate 2 pass → candidate dashboard "Start Simulation" → simulation → results in Gate 3.

Files: `src/lib/simulation/engine.ts` (788 lines), `src/lib/simulation/bias-audit.ts` (184 lines), `src/lib/simulation/selector.ts` (372 lines), `src/lib/scenarios/` (4 files), `src/app/simulation/page.tsx` (810 lines), `src/app/api/simulation-l2/route.ts` (297 lines)

**Remaining:** Scenario validation with an assessment expert (are the 3 scenarios actually good at differentiating skill levels?). Type: Validation.

---

## Employer Scenario Generation

**Status: BUILT BUT NEEDS POLISH**

Knowledge graph extraction → discovery simulation → ScenarioConfig generation → employer dashboard. Full pipeline via `/api/employer-graph` action `full_pipeline`.

Files: `src/lib/employer-intelligence/graph-extraction.ts` (198 lines), `src/lib/employer-intelligence/discovery-simulation.ts` (317 lines), `src/lib/employer-intelligence/scenario-generator.ts` (203 lines), `src/app/api/employer-graph/route.ts` (280 lines)

**Why "needs polish":** Zero real employer data tested. The generated scenarios may be too generic or unrealistic. Need at least one employer to upload real JDs/handbook and evaluate the output.

**Remaining:** Test with real employer data. Type: Validation + possibly content iteration.

---

## Layer 3 / Peer / Reference

**Status: BUILT BUT NEEDS POLISH**

Rubric generation (8 PSF-aligned questions, adaptive to L1/L2 divergence). Reference invitation with unique tokens. Mobile-friendly submission form at `/reference?token=...`. Three-layer convergence calculator (L1: 0.25, L2: 0.40, L3: 0.35). Independence verification. Reviewer and psychologist views.

Files: `src/lib/layer3/peer-assessment.ts` (355 lines), `src/app/api/peer-assessment/route.ts` (276 lines), `src/app/reference/page.tsx` (233 lines)

**Why "needs polish":** Email/SMS notifications not implemented — references get links manually. No real references have used the form. The reference page needs a proper explanation of "what is Kaya" for someone who has never heard of it.

**Remaining:** Email notification integration (needs email provider — SendGrid/Resend). Reference page intro text. Test with real references. Type: Engineering (email) + Content (intro text) + Validation (real test).

---

## Psychologist Review Workflow

**Status: BUILT BUT NEEDS POLISH**

Full UI at `/psychologist` with 5 tabs: Layer 1 Audit Trail, Layer 2 Simulation, Layer 3 Peer/360, Methodology, Validate & Sign. Shows all evidence, gaming flags, convergence, voice signals, research anchoring. Validation form captures PRC license number.

Files: `src/app/psychologist/page.tsx` (898 lines), `src/app/api/psychologist/route.ts` (141 lines)

**Why "needs polish":** No actual psychologist has seen the interface. The research anchoring document (`docs/Research_Anchoring_Document_For_Psychologists.md`) exists but hasn't been reviewed by a psychologist. The validation workflow may need adjustments based on how psychologists actually want to work.

**Remaining:** Psychologist walkthrough and feedback. Type: Validation + stakeholder input.

---

## Skills Passport

**Status: PARTIALLY BUILT**

The skills profile exists and is viewable: `/skills` shows a radar chart with proficiency levels, evidence snippets, confidence scores, and narrative summary. The reviewer at each gate sees the evidence package. The psychologist sees the full audit trail and can endorse.

What does NOT exist: a downloadable/shareable portable credential. No PDF export. No QR code. No machine-readable JSON export that Randy's HR Intelligence System can consume. No "Skills Passport" document that a candidate can take to a different employer.

Files: `src/app/skills/page.tsx` (588 lines), extraction stored in `leee_extractions` table

**Remaining:** Export functionality — either PDF download from `/skills` or JSON export for Randy. Type: Engineering (2-3 days). This is an MVP gap if the pilot employer expects candidates to have a shareable credential.

---

## Final Employer-Readable Output Package

**Status: BUILT AND USABLE**

The reviewer at each gate sees: alignment score, per-skill fit map with evidence, AI recommendation, extraction details, simulation results, convergence data, gaming flags, support needs, and success conditions. This IS the employer-readable output.

Files: `src/app/reviewer/page.tsx` (542 lines), Gate 1/2/3 routes

**Remaining:** The reviewer UX could be clearer about what to look for at each gate (see Reviewer Guidance below). But the data is there.

---

## JD Ingestion

**Status: BUILT AND USABLE**

Employer pastes JD text → Claude generates competency blueprint → stores on vacancy. Blueprint includes human-centric skill requirements weighted by importance.

Files: `src/app/api/gate1/route.ts` (action `create_vacancy`), `src/app/employer-dashboard/page.tsx`

**Remaining:** None for MVP.

---

## Gate 1 (Alignment)

**Status: BUILT AND USABLE**

Calculates alignment between candidate profile/skills and vacancy competency blueprint. Shows fit map, strengths, gaps. Reviewer can Pass/Hold/Stop.

Files: `src/app/api/gate1/route.ts`, `src/app/reviewer/page.tsx`

**Remaining:** None for MVP.

---

## Gate 2 (Evidence Review)

**Status: BUILT AND USABLE**

Shows LEEE extraction, skills profile, evidence quality, gaming flags. Reviewer can Pass/Hold/Request more evidence/Stop. Pass triggers Layer 2 invitation.

Files: `src/app/api/demo/route.ts` (contains gate processing logic), `src/app/reviewer/page.tsx`

**Remaining:** None for MVP.

---

## Gate 3 (Readiness)

**Status: BUILT AND USABLE**

Shows simulation results (Sotopia-Eval scores, convergence, gaming flags), Layer 3 peer data (three-layer convergence table, independence flags), readiness index, success conditions, support needs. Reviewer makes final decision.

Files: `src/app/api/gate3/route.ts` (564 lines), `src/app/reviewer/page.tsx`

**Remaining:** None for MVP.

---

## Matching Logic

**Status: BUILT AND USABLE**

Alignment score = weighted match of candidate skills against vacancy competency blueprint. Per-skill match with importance weighting. Used in Gate 1 and Talent Pool.

Files: `src/app/api/match/route.ts` (276 lines)

**Remaining:** Basic but functional for MVP. No machine learning, no collaborative filtering. Sufficient for pilot.

---

## Reviewer Guidance / Reviewer UX

**Status: BUILT BUT NEEDS POLISH**

The reviewer page shows all the data but doesn't guide first-time users through what to look for at each gate. Jakarta demo feedback confirmed reviewers weren't sure what to evaluate. Brief guidance text at each gate would help.

Files: `src/app/reviewer/page.tsx`

**Remaining:** Add 2-3 sentence guidance per gate ("At this gate, you're checking whether..."). Type: Content/UX (1 hour).

---

## Accessibility Mode(s)

**Status: PARTIALLY BUILT**

Present: Voice mode (no typing needed), text mode (no audio needed), Taglish support, simple language, consent screen, TTS toggle, text input always visible in voice mode. Profile captures disability type and accessibility needs. `accessibility_mode` field on sessions.

Missing: No screen reader testing. No WCAG audit. No keyboard navigation testing. No cognitive load assessment. Profile captures disability type but conversation doesn't deeply adapt (beyond probe_depth calibration).

**Remaining for MVP:** Minimal — the voice/text modes cover the primary accessibility needs. WCAG audit is post-MVP. Type: Validation (quick screen reader check).

---

## Supporting Evidence Upload / File Handling

**Status: NOT BUILT**

No file upload for certificates, credentials, or supporting documents. Resume parsing exists (`/api/resume`) but is for text extraction, not file storage. Supabase Storage is not configured.

**Remaining:** This is post-MVP unless the pilot employer expects candidates to upload certificates. Type: Engineering (if needed).

---

## Psychometric Injections (RIASEC / HIGH5 / Saboteur)

**Status: BLOCKED BY INPUTS**

`calibration.ts` has architecture for psychometric data injection — slots exist for RIASEC, HIGH5, and saboteur data to influence conversation calibration. But Ryan has not provided: the data format, how to interpret results, or which psychometrics are in scope.

Files: `src/lib/calibration.ts` (references psychometric context)

**Remaining:** Ryan to provide psychometric data format and interpretation rules. Type: Stakeholder input.

---

## Growth / Training Impact Reporting

**Status: BUILT AND USABLE (for MVP it's post-MVP)**

Growth engine, velocity calculator, cohort analytics, auto-comparison, funder reports — all built. But training impact measurement is not required for the first employer pilot. It's required for Virtualahan's funder conversations.

Files: `src/lib/growth/growth-engine.ts`, `src/app/api/growth/route.ts`, `src/app/api/growth-report/route.ts`, `src/app/growth/page.tsx`

**Remaining:** Not MVP-blocking. Type: Post-MVP.

---

## Admin / Ops / Analytics

**Status: NOT BUILT**

No admin panel. No operational dashboard. No usage analytics. No user management beyond Supabase Auth dashboard. No way to see: how many sessions ran today, which ones failed, what the average extraction time is, how many candidates are at each gate stage.

**Remaining:** Post-MVP. The pilot can be operated without admin tooling if the team is small. Type: Post-MVP.

---

## Monitoring / Logging / Reliability

**Status: NOT BUILT**

No Sentry. No error tracking. No structured logging. No alerting. Errors visible only in Vercel function logs (which require manual checking). No uptime monitoring.

**Remaining:** Sentry integration (2-3 hours). Strongly recommended before pilot but technically post-MVP. Type: Engineering (quick win).

---

## Mobile / Low-Bandwidth Readiness

**Status: PARTIALLY BUILT**

The UI is responsive (Tailwind). Voice mode uses opus codec for bandwidth optimization. But: no formal mobile testing on Philippine Android devices. No low-bandwidth mode (images/assets not optimized). No progressive loading. No offline capability.

**Remaining:** Test on actual mobile devices. Type: Testing.

---

## Taglish / Multilingual Readiness

**Status: BUILT AND USABLE**

Aya's prompt supports Taglish. Question bank has trilingual questions. Whisper STT handles Taglish. Extraction pipeline handles code-switching. This has been tested in development.

**Remaining:** None for MVP.

---

## Taxonomy Consistency (8 vs 16 Skills)

**Status: NEEDS DECISION**

`src/lib/skills-taxonomy.ts` defines 8 skills in detail (4 primary + 4 secondary). The extraction pipeline Stage 3 prompt instructs Claude to map to all 16 PSF Enabling Skills. The UI shows whatever the extraction returns. So in practice, the extraction can produce scores for all 16, but only 8 have detailed proficiency descriptors in the taxonomy.

This is not a build issue — it's a design decision. Should we expand the taxonomy to 16 with detailed descriptors? Or is 8 sufficient for MVP?

**Remaining:** Decision from Ryan/team. Type: Stakeholder input.

---

## A. True Remaining MVP Build Work

These are actual engineering tasks that need to happen before employer pilot:

| # | Task | Type | Effort | Owner |
|---|---|---|---|---|
| 1 | Skills Passport export (PDF or JSON download from /skills) | Engineering | 2-3 days | Kuber |
| 2 | Email notification for reference invitations | Engineering | 1 day | Kuber (needs email provider account) |
| 3 | Reviewer guidance text at each gate | Content/UX | 1 hour | Kuber + Ryan |
| 4 | Reference page intro text ("What is Kaya and why are you being asked") | Content | 30 min | Kuber + Ryan |

Total remaining build work: approximately 3-4 days.

---

## B. Non-Build Blockers

| # | Blocker | Owner | Type |
|---|---|---|---|
| 1 | **Psychologist review of methodology** — no PRC psychologist has seen the system | Ryan | Stakeholder |
| 2 | **Real employer data for scenario generation testing** — need actual JDs + handbook from pilot employer | Ryan / employer | Data |
| 3 | **8 vs 16 skills decision** — which taxonomy scope for MVP? | Ryan | Product decision |
| 4 | **Skills Passport format for Randy** — what schema/format does the HR Intelligence System need? | Randy | Schema decision |
| 5 | **Psychometric data format** — if RIASEC/HIGH5/saboteur are MVP-scope, Ryan needs to provide format | Ryan | Data/decision |
| 6 | **Email provider account** — SendGrid or Resend for reference invitations | Kuber | Ops setup |
| 7 | **Business model** — who pays, how much, for what? Needed before approaching employers | Ryan/leadership | Strategy |

---

## C. Validation Required Before Employer Pilot

| # | Task | Type | Who |
|---|---|---|---|
| 1 | **Psychologist walkthrough** — actual PRC psychologist reviews UI and methodology | Validation | Ryan + psychologist |
| 2 | **Extraction accuracy test** — psychologist reviews 5 extractions, checks skill mappings | Validation | Psychologist |
| 3 | **Reviewer walkthrough** — actual employer reviewer uses the 3-gate pipeline with demo data | UAT | Ryan + employer contact |
| 4 | **Real candidate dry run** — 3-5 real PWD candidates go through the full flow | UAT | Virtualahan team |
| 5 | **Voice browser testing** — test on Chrome Android, Safari iOS, Firefox | Testing | Kuber |
| 6 | **Mobile network testing** — test voice mode on Philippine mobile data | Testing | Kuber / Virtualahan team |
| 7 | **Reference form test** — send real reference links, check completion rate and quality | UAT | Virtualahan team |
| 8 | **Employer scenario generation test** — test with real employer seed material | Validation | Kuber + employer |
| 9 | **Test-retest reliability** — same transcript extracted 5 times, check ±5% score range | Validation | Kuber |

---

## D. MVP Readiness Verdict

**Ready after specific missing build items.**

The core platform is built and functional end-to-end. The three-layer assessment (conversation + simulation + peer/360), the three-gate employer pipeline, the psychologist review interface, and the training impact measurement are all built and wired together. The remaining build work is approximately 3-4 days of engineering.

The more significant gap is validation, not build. The system has been demonstrated but not validated with: real employers, real psychologists, real PWD candidates, or real references. This validation is what separates "working prototype" from "employer pilot ready."

### Top 5 Things That Must Happen Next

| # | Action | Owner | Type | Effort |
|---|---|---|---|---|
| 1 | **Skills Passport export** — add PDF/JSON download to /skills | Kuber | Code | 2-3 days |
| 2 | **Psychologist walkthrough** — get a PRC psychologist to review 3 extractions and the methodology | Ryan | Validation | 1-2 weeks (scheduling) |
| 3 | **Real candidate dry run** — 3-5 PWD candidates complete the full L1+L2 flow | Ryan + Virtualahan | Validation | 1 week |
| 4 | **Reviewer guidance** — add gate-specific guidance text + test with a real reviewer | Kuber + Ryan | Content + UAT | 1-2 days |
| 5 | **Email provider setup + reference invitations** — enable L3 workflow without manual link sharing | Kuber | Code + Ops | 1 day |

After these 5 items, Kaya is ready for a controlled employer pilot with Virtualahan-placed candidates.

---

### Where Docs or Trackers Overstate Reality

The build trackers show high completion rates (38/38 Layer 2, 48/49 Voice, 25/25 Scenarios, 14/14 Growth). These numbers are accurate for code completeness — the features are built and compile. But "built" and "validated" are different things. The trackers do not capture: whether the extraction is accurate, whether the simulation scenarios are realistic, whether the voice system works on Philippine mobile networks, or whether a psychologist would endorse the methodology. The code is ahead of the validation.

### Where Docs or Trackers Understate Reality

The platform overview and truth pack describe the system as "not yet used with real employers." While true, the system is more complete than many products at this stage. The full three-layer pipeline is wired end-to-end. The voice system with paralinguistic analysis is genuinely advanced. The employer scenario generation is a feature no competitor has. The honest assessment is: this is a real, functional product — it just needs real users.

---

*This audit was conducted by the person who wrote every line of code. It is as honest as I can make it.*
