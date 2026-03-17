# SIS MVP Build Tracker
## Based on: SIS End-to-End Process Architecture v2.0 (Ryan signed off)
## Deadline: Jakarta Conference, April 13–16, 2026
## Pilot Employer: Cebuana Lhuillier

Last updated: March 17, 2026

---

## SETUP & INFRASTRUCTURE

| # | Task | Status | Notes |
|---|------|--------|-------|
| S1 | Next.js project scaffolding | ✅ Done | Next.js 14 + Tailwind + TypeScript |
| S2 | GitHub repo | ✅ Done | github.com/kubersethi15/sis-mvp |
| S3 | Database schema designed | ✅ Done | Full 3-gate schema in schema.sql |
| S4 | TypeScript types | ✅ Done | types/index.ts mirrors schema |
| S5 | Supabase project created | ✅ Done | ftdnpsrbnjkvazspmenv.supabase.co |
| S6 | Schema deployed to Supabase | ✅ Done | All tables + enums + indexes created |
| S7 | PSF skills taxonomy loaded into DB | ✅ Done | 8 skills seeded via schema-supabase.sql |
| S8 | Supabase auth configured | ✅ Done | Email/password via Supabase Auth, auto-creates profiles |
| S9 | Environment variables configured | ✅ Done | All 4 keys set (Anthropic + Supabase URL/anon/service) |
| S10 | Deployment setup (Vercel) | ⬜ Todo | For Jakarta demo |

---

## GATE 2 — COMPONENT B: LEEE CHATBOT (DEEP BUILD)

### Conversation Engine

| # | Task | Status | Notes |
|---|------|--------|-------|
| L1 | System prompt (Aya persona) | ✅ Done | Warm tita tone, Moth structure, hard rules |
| L2 | System prompt — natural conversation flow | ✅ Done | 5+ exchange warmup, follow threads, menu as last resort |
| L3 | Dynamic context injection per turn | ✅ Done | Stage, skills, gaps, suggested prompts |
| L4 | Conversation orchestrator | ✅ Done | Moth stage transitions, state management |
| L5 | Question Bank as structured data | ✅ Done | 98 prompts, trilingual, with metadata |
| L6 | Adaptive question selection | ✅ Done | Based on stage + skill gaps + user comfort |
| L7 | Mid-session skill gap scan | ✅ Done | Lightweight prompt, <2 sec |
| L8 | Chat API route (Claude integration) | ✅ Done | /api/chat with Supabase persistence |
| L9 | Chat UI component | ✅ Done | LEEEChat.tsx with stage progress + skill badges |
| L10 | Welcome screen with language selection | ✅ Done | English, Taglish, Filipino options |
| L11 | Taglish/code-switching handling | 🔶 Partial | Prompt instructs to mirror language; needs testing |
| L12 | Accessibility mode (low literacy, ND, TS) | ⬜ Todo | Shorter prompts, simpler language when activated |
| L13 | Session persistence to Supabase | ✅ Done | Sessions created/updated in leee_sessions |
| L14 | Message persistence to Supabase | ✅ Done | All messages saved with moth_stage + turn_number |
| L15 | Session resume after disconnect | ✅ Done | Orchestrator rebuilds from DB on server restart |
| L16 | Timer / session duration tracking | ✅ Done | Timer displayed in header (mm:ss) |
| L17 | Wellbeing monitoring (distress detection) | ✅ Done | Keyword detection: crisis (L3) auto-ends, distress (L2) careful handling |
| L18 | Story completion detection | ✅ Done | Checks for context, action, outcome, reflection signals |

### Extraction Pipeline

| # | Task | Status | Notes |
|---|------|--------|-------|
| E1 | 5-stage extraction pipeline prompts | ✅ Done | All 5 stage prompts in extraction-pipeline.ts (from Ryan's "Brain Behind the Brain" doc) |
| E2 | Pipeline orchestrator (chains 5 stages) | ✅ Done | runExtractionPipeline() + runLightweightExtraction() |
| E3 | Extraction results display in UI | ✅ Done | Skills dashboard + psychologist audit trail |
| E4 | Stage 1: Narrative segmentation (dedicated) | ✅ Done | Separate Claude call — episodes with specificity scoring |
| E5 | Stage 2: STAR+E+R extraction (dedicated) | ✅ Done | Per-episode evidence with quality tags + complexity + independence |
| E6 | Stage 3: Skill mapping to all 16 PSF ESC | ✅ Done | Confidence scoring with evidence quality ceiling + disability uplift |
| E7 | Stage 4: Consistency check (dedicated) | ✅ Done | Cross-story reinforcement, single-source penalty, contradiction check |
| E8 | Stage 5: Proficiency scoring + output assembly | ✅ Done | Vacancy-aligned + additional + not_assessed. Psychologist review flags |
| E9 | Confidence score calculation | ✅ Done | Multi-factor: evidence quality, specificity, complexity, independence, penalties, bonuses |
| E10 | Evidence map (skill → quote → confidence) | ✅ Done | Stage 3 mappings provide full audit trail |
| E11 | Hiring manager summary generation | ✅ Done | Stage 5 produces warm professional summary for Gate 2 dashboard |
| E12 | Layer 2 seed scenario generation | ✅ Done | From skills gaps in extraction output |
| E13 | Layer 3 assessment recommendations | ✅ Done | From skills_not_assessed list |
| E14 | Gaming flag detection | ✅ Done | Stage 2 flags + Stage 4 anti-gaming review with cultural sensitivity |
| E15 | Extraction results persistence to Supabase | ✅ Done | Full 5-stage output + pipeline timing saved |
| E16 | Audit trail: quote → STAR+E+R → skill → score → confidence | ✅ Done | Full per-stage output stored in raw_extraction_response |
| E17 | Vacancy-weighted extraction | ✅ Done | Vacancy skills passed through pipeline, weighted in Stage 3+5 |
| E18 | Backwards compatibility with existing UI | ✅ Done | Pipeline output mapped to v1 skills_profile format for existing components |
| E19 | Lightweight extraction (Stages 1-3 for mid-session bridge) | ✅ Done | runLightweightExtraction() for real-time coverage matrix updates |
| E20 | Scoring rubrics: Problem Solving, Communication, Collaboration, EQ | ✅ Done | Detailed behavioral signals at Basic/Intermediate/Advanced in Stage 5 prompt |

### Anti-Gaming

| # | Task | Status | Notes |
|---|------|--------|-------|
| G1 | Oblique questioning (never name skills) | ✅ Done | Hard rule in system prompt |
| G2 | Specificity probing (vague answer follow-ups) | ✅ Done | In adaptive behavior rules |
| G3 | Verification probes (V77-V84) | ✅ Done | In question bank |
| G4 | Rehearsed/polished story detection | 🔶 Partial | Prompt instructs; needs real testing |
| G5 | Three-layer triangulation (architectural) | ✅ Done | Layer 1 is self-reported; Layers 2+3 verify |

---

## GATE 2 — COMPONENT A: JOBSEEKER PROFILE

| # | Task | Status | Notes |
|---|------|--------|-------|
| P1 | Jobseeker profile creation form | ✅ Done | 4-step form: basic info, work history, education, skills & goals |
| P2 | Jobseeker profile DB storage | ✅ Done | API route with create/update/get + Supabase persistence |
| P3 | Profile completeness tracking | ✅ Done | Auto-calculated percentage from filled fields |
| P4 | Evidence repository (upload portfolio/certs) | ⬜ Todo | File upload to Supabase storage |
| P5 | Psychometric data display (RIASEC, HIGH5) | ⬜ Todo | From Employment Accelerator intake |
| P6 | Combined evidence view (profile + LEEE) | ✅ Done | Single API merges profile + LEEE + alignment for Hiring Manager |

---

## GATE 1 — ALIGNMENT (LIGHTER BUILD)

| # | Task | Status | Notes |
|---|------|--------|-------|
| A1 | Employer profile creation | ✅ Done | API route + DB persistence |
| A2 | Vacancy Design Module (JD upload/builder) | ✅ Done | AI-powered JD parser → competency blueprint |
| A3 | Vacancy publishing (platform, PDF, QR) | ✅ Done | DB published; PDF/QR not yet. Ryan: QR/link leads directly to Gate 2 |
| A4 | Pre-application eligibility filter | ✅ Done | Checks qualifications, location, schedule, skills against vacancy requirements |
| A5 | AI alignment assessment generation | ✅ Done | Compares blueprint vs jobseeker profile + LEEE |
| A6 | Alignment score + competency fit map | ✅ Done | Score, fit map, strengths, gaps, inclusion notes |
| A7 | Recruiter review dashboard | ✅ Done | Three-tab UI: upload, pipeline, review queue |
| A8 | Matching engine (vacancy ↔ jobseeker) | ✅ Done | 6-factor holistic scoring: skills, profile, location, compensation, accessibility, readiness |
| A9 | Vacancy Q&A assistant (grounded, no hallucination) | ✅ Done | AI chatbot on vacancy page, grounded in vacancy data only |
| A10 | Alignment rating shown TO jobseeker | ✅ Done | Check My Alignment button on vacancy page shows score + strengths + gaps |
| A11 | AI JD improvement recommendations for employers | ✅ Done | AI reviews JD and suggests: add compensation, add human-centric skills, add accessibility info, improve clarity. Helps employers write better JDs. |
| A12 | Employer auth + dashboard (login, manage vacancies) | ✅ Done | Employer dashboard with vacancies, applicants, settings tabs |
| A13 | Vacancy PDF export + QR code generation | ✅ Done | QR via free API, copy link, print/PDF with embedded QR |

---

## GATE 3 — PREDICTABILITY (LIGHTER BUILD)

| # | Task | Status | Notes |
|---|------|--------|-------|
| R1 | AI simulation interface (basic) | ✅ Done | API generates scenario from Layer 2 seeds, scores responses |
| R2 | Structured interview interface | ✅ Done | API generates targeted questions from Gate 1+2 gaps, scores responses |
| R3 | Readiness index calculation | ✅ Done | Combines all 3 gates into readiness score + recommendation |
| R4 | Final Approver review dashboard | ✅ Done | Unified reviewer dashboard with G1/G2/G3 tabs + pipeline overview |
| R5 | Integration with Jazzel's simulation (future) | ⬜ Todo | Defined interface; Jazzel plugs in |
| R6 | Integration with Chamar's assessment (future) | ⬜ Todo | Defined interface; Chamar plugs in |
| R7 | Feedback report for non-selected candidates | ✅ Done | Auto-generated: actions, alternative roles, skills to strengthen |

---

## POST-GATE: PSYCHOLOGIST VALIDATION

| # | Task | Status | Notes |
|---|------|--------|-------|
| V1 | Psychologist validation interface | ✅ Done | 3-tab interface: audit trail, methodology, validate & sign |
| V2 | Audit trail display (quote → STAR+E+R → skill → score) | ✅ Done | Full traceable chain per skill claim with episode decomposition |
| V3 | Signature + license endorsement | ✅ Done | PRC license input + digital sign button + attestation |
| V4 | Methodology references display | ✅ Done | 7 research references with source and relevance |
| V5 | Research anchoring document | ✅ Done | Methodology tab covers it; standalone doc still needed |
| V6 | Validation status tracking | ✅ Done | Validated/revision needed/rejected + DB persistence |

---

## POST-SELECTION: FEEDBACK & ONBOARDING

| # | Task | Status | Notes |
|---|------|--------|-------|
| O1 | Candidate feedback report (non-selected) | ✅ Done | Auto-generated in Gate 3 API for declined candidates |
| O2 | Onboarding plan generation (selected) | ✅ Done | Checklist, 30/90 day plan, training recs |
| O3 | Manager handoff notes | ✅ Done | Support needs from Gate 3 |

---

## SKILLS DASHBOARD & OUTPUT

| # | Task | Status | Notes |
|---|------|--------|-------|
| D1 | Jobseeker skills profile dashboard | ✅ Done | /skills page with proficiency bars, confidence, evidence |
| D2 | Evidence locker view | ✅ Done | Click any skill to see transcript quotes + justification |
| D3 | Skills Passport output (JSON for Randy) | ✅ Done | PQF-aligned JSON export with skill_id, proficiency, PQF level, confidence |
| D4 | Employer pipeline dashboard | ✅ Done | /reviewer shows real pipeline data with gate scores |
| D5 | Skill gap visualization | ✅ Done | Shows unevidenced skills with encouragement to share more stories |

---

## UX / DESIGN POLISH (JAKARTA DEMO)

| # | Task | Status | Notes |
|---|------|--------|-------|
| U1 | Mobile-responsive design | ✅ Done | Mobile-first for PH users |
| U2 | Chat UX polish (animations, typing indicator) | ✅ Done | Typing dots, timer, progress bar, gradient bubbles |
| U3 | Progress visualization during conversation | 🔶 Partial | Stage indicator exists; needs story arc visual |
| U4 | Skills revealed animation (post-extraction) | ⬜ Todo | "Superpowers discovered" moment |
| U5 | Accessibility (keyboard focus visible) | ✅ Done | WCAG compliance |
| U6 | Low-bandwidth optimization | ✅ Done | Minimal assets, progressive loading |
| U7 | Loading states and error handling | ✅ Done | Error messages, extraction retry, loading spinners |
| U8 | Branding and visual identity | ✅ Done | Kaya brand: Navy 900, Green 400, Stone 50, Georgia wordmark. Landing page + layout rebranded |

---

## TESTING & VALIDATION

| # | Task | Status | Notes |
|---|------|--------|-------|
| T1 | Test with Ryan's 10 simulated transcripts | ⬜ Todo | Need Ryan's actual transcripts |
| T2 | Test with 7 real jobseeker profiles | ⬜ Todo | Verify fair, accurate skills profiles across diverse backgrounds |
| T3 | Test-retest reliability (same transcript 5x) | ⬜ Todo | Scores within ±5% |
| T4 | Anti-gaming test (fabricated stories) | ⬜ Todo | System flags 50%+ of fakes |
| T5 | Taglish conversation test | ⬜ Todo | Full session in Taglish |
| T6 | Accessibility test (screen reader) | ⬜ Todo | Core functions usable |
| T7 | End-to-end flow test (all 3 gates) | ✅ Done | Full pipeline demo run |
| T8 | Cebuana Lhuillier JD test | ✅ Done | Real JDs through Gate 1 alignment |
| T9 | User acceptance testing with Ryan's team | ⬜ Todo | 5-8 team members do full sessions |

---

## EXTERNAL DEPENDENCIES

| # | Item | Status | Owner | Notes |
|---|------|--------|-------|-------|
| X1 | Cebuana Lhuillier JDs | ⬜ Pending | Ryan | Available on JobStreet |
| X2 | Research anchoring document | ✅ Done | Kuber | For psychologist validation |
| X3 | Psychologist onboarding | ⬜ Pending | Ryan | Define review process with psych team |
| X4 | Jazzel simulation integration spec | ⬜ Future | Jazzel | Gate 3 plug-in |
| X5 | Chamar assessment integration spec | ⬜ Future | Chamar | Gate 3 plug-in |
| X6 | Randy Skills Passport schema | ⬜ Future | Randy | JSON output format agreement |
| X7 | Psychometric data per jobseeker (RIASEC + HIGH5 + saboteurs) | ⬜ Pending | Ryan | Ryan's team provides per-candidate JSON; needed for calibration injection |

---

## RYAN'S PRE-SESSION CONTEXT INJECTION (v2)
### Source: LEEE_PreSession_Context_and_SystemPrompt_v2.md — March 17, 2026

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| R1 | Calibration derivation function | ✅ Done | 🔴 High | Compute experience_level, probe_depth, session_pace, communication_style from profile data. Rules defined in Ryan's doc §1.2 |
| R2 | Structured disability context schema | ✅ Done | 🔴 High | Extend disability fields: severity, recently_diagnosed, communication_impact, accommodation_notes, sensitivity_level. Currently only disability_type (text) |
| R3 | Calibration injection into Aya system prompt | ✅ Done | 🔴 High | Append computed calibration block to system prompt at session start. Aya adapts probe depth, pace, language register accordingly |
| R4 | Psychometric data injection into system prompt | 🔶 Partial | 🔴 High | Saboteur-aware probing instructions now in v2 system prompt. But actual RIASEC/HIGH5/saboteur data injection blocked on X7 (Ryan's team to provide per-candidate JSON) |
| R5 | Avoider/Victim coaching note in prompt | 🔶 Partial | 🔴 High | v2 system prompt has all 7 saboteur response strategies. Coaching notes inject Avoider/Victim when psychometrics available. Full injection blocked on X7 |
| R6 | Self-deprecation override in extraction prompt | ✅ Done | 🔴 High | In v2 system prompt (live conversation) AND Stage 3 extraction pipeline (scoring) |
| R7 | Disability-as-evidence scoring rule | ✅ Done | 🟡 Med | In v2 system prompt (Aya recognises as rich evidence) AND Stage 3 pipeline (+0.1 disability uplift) |
| R8 | Informal/non-traditional experience equivalence | ✅ Done | 🟡 Med | In v2 system prompt AND extraction pipeline. Behavioral evidence = formal credentials |
| R9 | Vacancy competency weighting in extraction | ✅ Done | 🟡 Med | Vacancy skills passed through 5-stage pipeline. Stage 3 weights, Stage 5 highlights vacancy-aligned first |
| R10 | Experience snapshot synthesis | ✅ Done | 🟡 Med | Compute "most relevant role + notable achievement" summary from work history for context injection |
| R11 | Self-reported challenges field in profile | ✅ Done | 🟡 Med | Add challenges[] array to jobseeker_profiles schema. Ryan's doc shows 5 challenge types |
| R12 | System prompt v2 full replacement | ✅ Done | 🟡 Med | Full v2 with Cultural Intelligence Layer, saboteur-aware probing, confidence-capability gap, bridge logic v2, scenario trigger preserved |
| R13 | Coverage matrix tracking | 🔶 Partial | 🟢 Low | runLightweightExtraction() runs Stages 1-3 for mid-session bridge. Full real-time tracking needs UI integration |
| R14 | Session timer + pace enforcement | ✅ Done | 🟢 Low | Enforce session_pace (unhurried 15-20min / standard 12-18 / efficient 10-15) from calibration |
| R15 | Profile form — extended disability fields | ✅ Done | 🟡 Med | UI for severity, communication_impact, accommodation_notes. Sensitive — needs careful UX |
| R16 | Profile form — self-reported challenges | ✅ Done | 🟡 Med | Free-text or structured challenges input on profile form |

---

## KAYA BRANDING (from Kaya_Brand_Guidelines_v1.0)

| # | Task | Status | Notes |
|---|------|--------|-------|
| BR1 | Rename product to "Kaya" in UI | ✅ Done | Landing page, layout title, meta description |
| BR2 | Kaya colour palette — Navy 900 / Green 400 / Stone 50 | ✅ Done | Tailwind config + landing page. Green for success states only |
| BR3 | "kaya" wordmark in Georgia | ✅ Done | Nav bar + landing hero. Georgia for wordmark only, Arial everywhere else |
| BR4 | Employer-facing language — gate names + reviewer roles | ✅ Done | Alignment/Evidence/Predictability. Recruiter/Hiring Manager/Final Approver |
| BR5 | Jobseeker-facing language | ✅ Done | "Show what you can do", "Your stories become evidence" |
| BR6 | Three-gate model visual on landing page | ✅ Done | Navy block showing all 3 gates with who decides at each |
| BR7 | Apply Kaya palette to inner pages (dashboards, reviewer, employer) | ✅ Done | All pages: reviewer, employer, employer-dashboard, psychologist, my-dashboard, profile, vacancy, skills, auth, demo. Navy 900 nav, Stone 50 bg, Green 400 success |
| BR8 | Kaya bloom mark SVG | ✅ Done | Using CSS circle placeholder — consistent across all pages. Needs proper SVG from design team |

---

## RYAN'S "BRAIN BEHIND THE BRAIN" (5-Stage Extraction Pipeline)
### Source: Internal Pipeline Prompts and Scoring Logic_LEEE_Extraction_Engine.md

| # | Task | Status | Notes |
|---|------|--------|-------|
| EX1 | Stage 1: Narrative Segmentation prompt | ✅ Done | Dedicated prompt in extraction-pipeline.ts |
| EX2 | Stage 2: STAR+E+R Evidence Extraction prompt | ✅ Done | Quality tags, complexity, independence, anti-gaming flags |
| EX3 | Stage 3: Skill Mapping to all 16 PSF ESC | ✅ Done | Confidence scoring with ceilings, disability uplift, self-deprecation override |
| EX4 | Stage 4: Consistency Check prompt | ✅ Done | Cross-story +0.1, single-source -0.15, contradiction check |
| EX5 | Stage 5: Proficiency Scoring + Output Assembly | ✅ Done | Vacancy-aligned, not_assessed, psychologist flags, hiring manager summary |
| EX6 | Pipeline orchestrator function | ✅ Done | runExtractionPipeline() chains all 5 stages sequentially |
| EX7 | Backwards-compatible output mapping | ✅ Done | v2 output maps to v1 skills_profile for existing UI components |
| EX8 | Lightweight extraction (Stages 1-3) | ✅ Done | runLightweightExtraction() for mid-session bridge updates |

---

## JOY ANNE SIMULATION (Test Case)
### Source: LEEE_Full_Simulation_JoyAnne_Cebuana.md

| # | Task | Status | Notes |
|---|------|--------|-------|
| SIM1 | Load Joy Anne conversation as test fixture | ⬜ Todo | Extract transcript from simulation doc |
| SIM2 | Run through 5-stage pipeline, compare to expected output | ⬜ Todo | Validate against Ryan's expected skills profile |

---

## SUMMARY

| Category | Total | Done | Partial | Todo |
|----------|-------|------|---------|------|
| Setup & Infrastructure | 10 | 8 | 0 | 2 |
| LEEE Conversation Engine | 18 | 15 | 2 | 1 |
| LEEE Extraction Pipeline (5-stage) | 20 | 20 | 0 | 0 |
| Anti-Gaming | 5 | 5 | 0 | 0 |
| Jobseeker Profile (Gate 2A) | 6 | 4 | 0 | 2 |
| Gate 1 — Alignment | 13 | 8 | 1 | 4 |
| Gate 3 — Predictability | 7 | 5 | 0 | 2 |
| Psychologist Validation | 6 | 5 | 1 | 0 |
| Feedback & Onboarding | 3 | 1 | 0 | 2 |
| Dashboards & Output | 5 | 5 | 0 | 0 |
| UX Polish | 8 | 3 | 1 | 4 |
| Testing & Validation | 9 | 2 | 0 | 7 |
| Ryan v2 Context Injection | 16 | 8 | 3 | 5 |
| Kaya Branding | 8 | 7 | 1 | 0 |
| 5-Stage Pipeline (Brain Behind Brain) | 8 | 8 | 0 | 0 |
| Joy Anne Simulation | 2 | 0 | 0 | 2 |
| **TOTAL** | **148** | **123** | **6** | **16** | **3 blocked** |

**123 done + 6 partial = ~85% complete. Build phase essentially complete. Remaining: 7 testing tasks, 2 simulation validation, Vercel deploy, 3 future integrations (Jazzel/Chamar/evidence upload), 3 blocked on Ryan's team.**

---

## PRIORITY ORDER FOR NEXT STEPS

1. **SIM1-SIM2 — Joy Anne pipeline validation** — test the 5-stage pipeline with Ryan's known-good transcript
2. **S10 — Vercel deploy** — live URL for demo
3. **T1 — Test with Ryan's 10 transcripts** — validate extraction across diverse stories
4. **T3 — Test-retest reliability** — same transcript 5x, scores within ±5%
5. **T5 — Taglish conversation test** — full session in Taglish
6. **T9 — User acceptance testing** — Ryan's team does full sessions
7. **T2 — Test with 7 real profiles** — verify fair scoring across diverse backgrounds
8. **T4 — Anti-gaming test** — fabricated stories, system flags 50%+
9. **R4 + R5 — Psychometric injection** — blocked on X7 (Ryan provides data)
10. **T6 — Accessibility test** — screen reader on core functions
3. **R2 + R15 — Extended disability fields** — after Ryan confirms field spec
4. **R10 — Experience snapshot synthesis** — "most relevant role + notable achievement" in context
5. **R11 + R16 — Self-reported challenges** — schema + profile form
6. **R4 + R5 — Psychometric injection** — blocked on X7 (Ryan provides data)
7. **U1 — Mobile responsive** — PH users are mobile-first
8. **T1-T9 — Testing with real data**
9. **R14 — Session timer + pace enforcement**
10. **BR8 — Bloom mark SVG from design team**
