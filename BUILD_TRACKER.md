# SIS MVP Build Tracker
## Based on: SIS End-to-End Process Architecture v2.0 (Ryan signed off)
## Deadline: Jakarta Conference, April 13–16, 2026
## Pilot Employer: Cebuana Lhuillier

Last updated: March 15, 2026

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
| E1 | Extraction prompt (post-session) | ✅ Done | Full STAR+E+R + JSON output schema |
| E2 | Extraction API route | ✅ Done | /api/extract endpoint |
| E3 | Extraction results display in UI | ✅ Done | Skills dashboard + psychologist audit trail |
| E4 | Stage 1: Narrative segmentation | 🔶 Partial | Handled by extraction prompt; no separate stage |
| E5 | Stage 2: Behavioral evidence extraction (STAR+E+R) | ✅ Done | In extraction prompt |
| E6 | Stage 3: Skill mapping to PSF taxonomy | ✅ Done | In extraction prompt |
| E7 | Stage 4: Cross-referencing & consistency check | 🔶 Partial | Gaming flags in prompt; needs stronger logic |
| E8 | Stage 5: Scoring (Basic/Intermediate/Advanced) | ✅ Done | Proficiency rubrics in prompt |
| E9 | Confidence score calculation | 🔶 Partial | In prompt; needs validation with real data |
| E10 | Evidence map (skill → quote → confidence) | ✅ Done | In extraction output schema |
| E11 | Narrative summary generation | ✅ Done | In extraction output |
| E12 | Layer 2 seed scenario generation | ✅ Done | In extraction output |
| E13 | Layer 3 assessment recommendations | ✅ Done | In extraction output |
| E14 | Gaming flag detection | 🔶 Partial | Basic flags; needs testing with fabricated stories |
| E15 | Extraction results persistence to Supabase | ✅ Done | Full extraction saved to leee_extractions with audit trail |
| E16 | Audit trail: quote → STAR+E+R → skill → score → confidence | ✅ Done | Full display in psychologist validation page |
| E17 | Role-specific extraction (contextualised to vacancy) | ✅ Done | Vacancy context injected into system prompt, steers toward role-relevant stories |
| E18 | Auto-extract from profile before LEEE | ✅ Done | Profile context injected into Aya — knows name, work, education, disability |

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
| V5 | Research anchoring document | 🔶 Partial | Methodology tab covers it; standalone doc still needed |
| V6 | Validation status tracking | ✅ Done | Validated/revision needed/rejected + DB persistence |

---

## POST-SELECTION: FEEDBACK & ONBOARDING

| # | Task | Status | Notes |
|---|------|--------|-------|
| O1 | Candidate feedback report (non-selected) | ✅ Done | Auto-generated in Gate 3 API for declined candidates |
| O2 | Onboarding plan generation (selected) | ⬜ Todo | Checklist, 30/90 day plan, training recs |
| O3 | Manager handoff notes | ⬜ Todo | Support needs from Gate 3 |

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
| U1 | Mobile-responsive design | ⬜ Todo | Mobile-first for PH users |
| U2 | Chat UX polish (animations, typing indicator) | ✅ Done | Typing dots, timer, progress bar, gradient bubbles |
| U3 | Progress visualization during conversation | 🔶 Partial | Stage indicator exists; needs story arc visual |
| U4 | Skills revealed animation (post-extraction) | ⬜ Todo | "Superpowers discovered" moment |
| U5 | Accessibility (screen reader, keyboard nav) | ⬜ Todo | WCAG compliance |
| U6 | Low-bandwidth optimization | ⬜ Todo | Minimal assets, progressive loading |
| U7 | Loading states and error handling | ✅ Done | Error messages, extraction retry, loading spinners |
| U8 | Branding and visual identity | ⬜ Todo | Virtualahan branding for Jakarta |

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
| X2 | Research anchoring document | ⬜ Todo | Kuber | For psychologist validation |
| X3 | Psychologist onboarding | ⬜ Pending | Ryan | Define review process with psych team |
| X4 | Jazzel simulation integration spec | ⬜ Future | Jazzel | Gate 3 plug-in |
| X5 | Chamar assessment integration spec | ⬜ Future | Chamar | Gate 3 plug-in |
| X6 | Randy Skills Passport schema | ⬜ Future | Randy | JSON output format agreement |

---

## SUMMARY

| Category | Total | Done | Partial | Todo |
|----------|-------|------|---------|------|
| Setup & Infrastructure | 10 | 8 | 0 | 2 |
| LEEE Conversation Engine | 18 | 13 | 3 | 2 |
| LEEE Extraction Pipeline | 18 | 9 | 4 | 5 |
| Anti-Gaming | 5 | 4 | 1 | 0 |
| Jobseeker Profile (Gate 2A) | 6 | 1 | 0 | 5 |
| Gate 1 — Alignment | 10 | 4 | 1 | 5 |
| Gate 3 — Predictability | 7 | 5 | 0 | 2 |
| Psychologist Validation | 6 | 0 | 0 | 6 |
| Feedback & Onboarding | 3 | 1 | 0 | 2 |
| Dashboards & Output | 5 | 1 | 0 | 4 |
| UX Polish | 8 | 0 | 3 | 5 |
| Testing & Validation | 9 | 0 | 0 | 9 |
| **TOTAL** | **105** | **67** | **8** | **30** |

**84 done, 7 partial, 17 remaining — ~87% through the build**

---

## PRIORITY ORDER FOR NEXT STEPS

1. **Finish LEEE conversation UX** — polish the natural conversation flow, test thoroughly
2. **Connect Supabase** — persist sessions, messages, and extractions
3. **Extraction polish** — test with real transcripts, validate scoring accuracy
4. **Jobseeker profile creation** — basic form + DB storage
5. **Skills dashboard** — visual output of extracted skills
6. **Gate 1 lighter build** — JD upload → alignment assessment → Recruiter review
7. **Gate 3 lighter build** — basic simulation + interview → Final Approver review
8. **Reviewer dashboards** — Recruiter, Hiring Manager, Final Approver views
9. **Psychologist validation interface**
10. **UX polish + mobile + branding for Jakarta demo**
11. **End-to-end testing with real data**
12. **Deploy to Vercel for demo**
