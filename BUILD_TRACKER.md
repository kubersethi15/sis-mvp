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
| S8 | Supabase auth configured | ⬜ Todo | Email/password for MVP |
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
| L16 | Timer / session duration tracking | 🔶 Partial | Orchestrator tracks; needs UI display |
| L17 | Wellbeing monitoring (distress detection) | 🔶 Partial | Prompt instructs; needs explicit detection logic |
| L18 | Story completion detection | 🔶 Partial | Basic turn counting; needs STAR+E+R completeness check |

### Extraction Pipeline

| # | Task | Status | Notes |
|---|------|--------|-------|
| E1 | Extraction prompt (post-session) | ✅ Done | Full STAR+E+R + JSON output schema |
| E2 | Extraction API route | ✅ Done | /api/extract endpoint |
| E3 | Extraction results display in UI | 🔶 Partial | Basic display exists; needs polishing |
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
| E16 | Audit trail: quote → STAR+E+R → skill → score → confidence | 🔶 Partial | Data stored; needs UI display for psychologist review |

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
| P1 | Jobseeker profile creation form | ⬜ Todo | Basic info, disability, education, work history |
| P2 | Jobseeker profile DB storage | ✅ Done | Schema designed with all fields |
| P3 | Profile completeness tracking | ⬜ Todo | Percentage indicator |
| P4 | Evidence repository (upload portfolio/certs) | ⬜ Todo | File upload to Supabase storage |
| P5 | Psychometric data display (RIASEC, HIGH5) | ⬜ Todo | From Employment Accelerator intake |
| P6 | Combined evidence view (profile + LEEE) | ⬜ Todo | Hiring Manager review screen |

---

## GATE 1 — ALIGNMENT (LIGHTER BUILD)

| # | Task | Status | Notes |
|---|------|--------|-------|
| A1 | Employer profile creation | ✅ Done | API route + DB persistence |
| A2 | Vacancy Design Module (JD upload/builder) | ✅ Done | AI-powered JD parser → competency blueprint |
| A3 | Vacancy publishing (platform, PDF, QR) | 🔶 Partial | DB published; PDF/QR not yet |
| A4 | Pre-application eligibility filter | ⬜ Todo | Licenses, work auth, schedule, salary |
| A5 | AI alignment assessment generation | ✅ Done | Compares blueprint vs jobseeker profile + LEEE |
| A6 | Alignment score + competency fit map | ✅ Done | Score, fit map, strengths, gaps, inclusion notes |
| A7 | Recruiter review dashboard | ✅ Done | Three-tab UI: upload, pipeline, review queue |
| A8 | Matching engine (vacancy ↔ jobseeker) | ⬜ Todo | Skill overlap, evidence readiness, location, schedule |
| A9 | Vacancy Q&A assistant (grounded, no hallucination) | ⬜ Todo | Jobseeker-facing pre-application chatbot |

---

## GATE 3 — PREDICTABILITY (LIGHTER BUILD)

| # | Task | Status | Notes |
|---|------|--------|-------|
| R1 | AI simulation interface (basic) | ⬜ Todo | Novel scenario based on Layer 2 seeds from LEEE |
| R2 | Structured interview interface | ⬜ Todo | AI-assisted interview with scoring |
| R3 | Readiness index calculation | ⬜ Todo | Combined simulation + interview score |
| R4 | Final Approver review dashboard | ⬜ Todo | View all gate outputs, approve/decline |
| R5 | Integration with Jazzel's simulation (future) | ⬜ Todo | Defined interface; Jazzel plugs in |
| R6 | Integration with Chamar's assessment (future) | ⬜ Todo | Defined interface; Chamar plugs in |

---

## POST-GATE: PSYCHOLOGIST VALIDATION

| # | Task | Status | Notes |
|---|------|--------|-------|
| V1 | Psychologist validation interface | ⬜ Todo | View full audit trail for a candidate |
| V2 | Audit trail display (quote → STAR+E+R → skill → score) | ⬜ Todo | Traceable chain for each skill claim |
| V3 | Signature + license endorsement | ⬜ Todo | Digital sign-off with license number |
| V4 | Methodology references display | ⬜ Todo | Research publications linked to methodology |
| V5 | Research anchoring document | ⬜ Todo | Formal lit review for psychologists |
| V6 | Validation status tracking | ⬜ Todo | Pending/validated/rejected/revision needed |

---

## POST-SELECTION: FEEDBACK & ONBOARDING

| # | Task | Status | Notes |
|---|------|--------|-------|
| O1 | Candidate feedback report (non-selected) | ⬜ Todo | Skills to strengthen, alternative roles, learning recs |
| O2 | Onboarding plan generation (selected) | ⬜ Todo | Checklist, 30/90 day plan, training recs |
| O3 | Manager handoff notes | ⬜ Todo | Support needs from Gate 3 |

---

## SKILLS DASHBOARD & OUTPUT

| # | Task | Status | Notes |
|---|------|--------|-------|
| D1 | Jobseeker skills profile dashboard | ⬜ Todo | Visual display of extracted skills + proficiency |
| D2 | Evidence locker view | ⬜ Todo | Browse skill → quote → confidence |
| D3 | Skills Passport output (JSON for Randy) | ⬜ Todo | PQF-aligned, machine-readable |
| D4 | Employer pipeline dashboard | ⬜ Todo | Applicant flow, stage conversion, time per stage |
| D5 | Skill gap visualization | ⬜ Todo | What wasn't evidenced + what to do next |

---

## UX / DESIGN POLISH (JAKARTA DEMO)

| # | Task | Status | Notes |
|---|------|--------|-------|
| U1 | Mobile-responsive design | ⬜ Todo | Mobile-first for PH users |
| U2 | Chat UX polish (animations, typing indicator) | 🔶 Partial | Basic exists; needs polish |
| U3 | Progress visualization during conversation | 🔶 Partial | Stage indicator exists; needs story arc visual |
| U4 | Skills revealed animation (post-extraction) | ⬜ Todo | "Superpowers discovered" moment |
| U5 | Accessibility (screen reader, keyboard nav) | ⬜ Todo | WCAG compliance |
| U6 | Low-bandwidth optimization | ⬜ Todo | Minimal assets, progressive loading |
| U7 | Loading states and error handling | 🔶 Partial | Basic loading; needs graceful error UX |
| U8 | Branding and visual identity | ⬜ Todo | Virtualahan branding for Jakarta |

---

## TESTING & VALIDATION

| # | Task | Status | Notes |
|---|------|--------|-------|
| T1 | Test with Ryan's 10 simulated transcripts | ⬜ Todo | Verify extraction produces correct skill signals |
| T2 | Test with 7 real jobseeker profiles | ⬜ Todo | Verify fair, accurate skills profiles across diverse backgrounds |
| T3 | Test-retest reliability (same transcript 5x) | ⬜ Todo | Scores within ±5% |
| T4 | Anti-gaming test (fabricated stories) | ⬜ Todo | System flags 50%+ of fakes |
| T5 | Taglish conversation test | ⬜ Todo | Full session in Taglish |
| T6 | Accessibility test (screen reader) | ⬜ Todo | Core functions usable |
| T7 | End-to-end flow test (all 3 gates) | ⬜ Todo | Full pipeline demo run |
| T8 | Cebuana Lhuillier JD test | ⬜ Todo | Real JDs through Gate 1 alignment |
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
| LEEE Extraction Pipeline | 16 | 9 | 4 | 3 |
| Anti-Gaming | 5 | 4 | 1 | 0 |
| Jobseeker Profile (Gate 2A) | 6 | 1 | 0 | 5 |
| Gate 1 — Alignment | 9 | 4 | 1 | 4 |
| Gate 3 — Predictability | 6 | 0 | 0 | 6 |
| Psychologist Validation | 6 | 0 | 0 | 6 |
| Feedback & Onboarding | 3 | 0 | 0 | 3 |
| Dashboards & Output | 5 | 0 | 0 | 5 |
| UX Polish | 8 | 0 | 3 | 5 |
| Testing & Validation | 9 | 0 | 0 | 9 |
| **TOTAL** | **101** | **39** | **12** | **50** |

**39 done, 12 partial, 50 remaining — ~45% through the build**

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
