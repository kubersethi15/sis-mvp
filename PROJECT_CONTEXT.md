# SIS MVP — Project Context & Handoff Document
## For: Claude (new chat continuity) | Updated: March 17, 2026

> **If you are a new Claude session:** Read this entire document before doing anything. It contains everything you need to understand the project, the current state, the people involved, and the decisions made. The GitHub repo is the source of truth for code. This document is the source of truth for context.

---

## 1. THE PROJECT IN ONE PARAGRAPH

Virtualahan Inc. (Philippines) is building the **Skills Intelligence System (SIS)** — an AI platform that extracts, measures, validates, and credentials human-centric skills for persons with disabilities (PWDs) and excluded talent in the Philippine labor market. The system uses the Philippine Skills Framework (PSF) 16 Enabling Skills and Competencies as its taxonomy. It is aligned with RA 12313 (LLDF Act), the Philippine Qualifications Framework (PQF), and the WEF New Economy Skills framework. The hard deadline is the **Jakarta conference, April 13–16, 2026**, with employer demos required before that date. The pilot employer is **Cebuana Lhuillier**.

---

## 2. THE PEOPLE

| Person | Role | What They Own |
|---|---|---|
| **Kuber Sethi** | Technical Architect (you're talking to him) | System architecture, build, all code |
| **Ryan Gersava** | Virtualahan project lead | Conversation design, question bank, playbook, co-creator liaison |
| **Jazzel** | Layer 2 AI simulation developer | Gate 3 simulation (future, not MVP) |
| **Chamar** | Layer 3 assessment framework | On leave — future |
| **Randy** | Skills Passport + HR Intelligence System | Downstream consumer of Skills Passport JSON |
| **Anshul** | Voice AI vendor | Proposal paused — voice is Phase 2 |

---

## 3. THE ARCHITECTURE — THREE LAYERS + OUTPUT

```
Layer 1: LEEE (Lived Experience Extraction Engine) — Kuber built this
  ↓ Aya (AI chatbot) elicits stories → extracts STAR+E+R behavioral evidence
  
Layer 2: AI Agent Simulation — Jazzel (future / Gate 3)
  ↓ Scenario-based simulations verify skills observed not self-reported

Layer 3: Assessment + Peer Validation — Chamar (future)
  ↓ 360 feedback, trial tasks, credential verification

Output: Skills Passport — Randy
  ↓ PQF-aligned, QR-verifiable, machine-readable JSON credential
```

**THREE GATES (employer-side):**
- Gate 1: Alignment — JD upload → competency blueprint → alignment score
- Gate 2: Evidence — LEEE session → skills extraction → Hiring Manager review
- Gate 3: Predictability — simulation + interview → Final Approver decision

**Human checkpoints at every gate.** SIS is a decision-SUPPORT system, not a decision-MAKING system. Every gate requires a human to review AI output and decide.

**Psychologist validation** is a separate post-gate step (not embedded in gates). A licensed psychologist reviews the full audit trail and endorses the Skills Passport.

---

## 4. THE CODEBASE

**Repo:** `github.com/kubersethi15/sis-mvp`  
**Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase, Anthropic API  
**Supabase:** `ftdnpsrbnjkvazspmenv.supabase.co`

### Key files:
```
src/lib/
  prompts.ts          — Aya system prompt (Ryan's v2 conversation design)
                        + LEEE extraction prompt (STAR+E+R, PSF taxonomy)
                        + gap scan prompt + scenario generation prompt
  calibration.ts      — Session calibration derivation (Ryan v2 §1.2)
                        derives experience_level, probe_depth, session_pace,
                        communication_style from jobseeker profile data
  orchestrator.ts     — Moth stage machine, session state management
  question-bank.ts    — 98 questions trilingual (Ryan's Question Bank V1)
  schema.sql          — Full database schema (all tables)

src/app/api/
  chat/route.ts       — Main LEEE conversation + extraction API
                        Calls claude-sonnet-4-20250514 for conversation (500 tokens)
                        Calls claude-opus-4-5 for extraction (4000 tokens)
  scenario/route.ts   — Dynamic scenario card generation
  gate1/route.ts      — Alignment assessment
  gate3/route.ts      — Gate 3 readiness index
  demo/route.ts       — Demo state management
  extract/route.ts    — Standalone extraction endpoint (also uses opus-4-5)
  profile/route.ts    — Jobseeker profile CRUD
  vacancy/route.ts    — Vacancy management + Q&A

src/components/
  LEEEChat.tsx        — Main chat UI (living landscape, dark theme, scenario cards)
  SuperpowersReveal.tsx — Cinematic fullscreen skills reveal (post-extraction)
  ScenarioCard.tsx    — Dynamic micro-simulation card (dark glassmorphic)

src/app/
  chat/               — Aya conversation (/chat)
  skills/             — Skills profile dashboard (/skills)
  demo-day/           — Three-act demo director for Friday (/demo-day)
  reviewer/           — HR recruiter pipeline dashboard (/reviewer)
  psychologist/       — Psychologist audit trail + sign-off (/psychologist)
  employer-dashboard/ — Employer vacancy management (/employer-dashboard)
  vacancy/            — Jobseeker vacancy browser + Q&A (/vacancy)
  my-dashboard/       — Jobseeker hub (/my-dashboard)
  profile/            — Jobseeker profile form (/profile)
  auth/               — Auth (/auth)
  demo/               — Technical demo runner (/demo)
```

---

## 5. AYA — THE CONVERSATIONAL AI

Aya is the LEEE chatbot. Key design principles (Ryan's spec):
- **Warm Filipino tita/tito** — two mates at a coffee shop, not an HR interviewer
- **Moth storytelling structure** — 5 phases: Seed → Stakes → Struggle → Shift → Meaning
- **Never names skills** — oblique questioning, no HR jargon
- **Follows emotional threads** — if user says "tough day", that IS the story entry
- **Golden Rule** — no pivot to story menu until 4-5 natural exchanges AND a natural connection exists
- **Languages** — English, Taglish, Filipino (mirrors user's choice)
- **SCENARIO trigger** — after a complete story, Aya can inject `[SCENARIO:{...}]` at end of message, which triggers a dynamic micro-simulation card in the UI

**Calibration (Ryan v2 — BUILT):**
Before each session, `calibration.ts` derives:
- `experience_level`: early_career / mid_career / senior / non_traditional
- `probe_depth`: gentle / standard / deep
- `session_pace`: unhurried / standard / efficient
- `communication_style`: formal / informal / mixed
Plus coaching notes (e.g. Avoider/Victim saboteur pattern warning)

This is injected as a structured block into Aya's system prompt at session start. Aya never reveals it to the user.

---

## 6. EXTRACTION — STAR+E+R

Post-session, the extraction prompt (claude-opus-4-5) analyses the transcript and produces:
- `skills_profile[]` — PSF skills with proficiency (Basic/Intermediate/Advanced), confidence score, evidence quotes
- `narrative_summary` — warm human-readable summary
- `gaming_flags[]` — authenticity flags
- `layer2_seeds[]` — scenario seeds for Gate 3
- `session_quality` — engagement, density, overall confidence

**Critical extraction rules (v2):**
- Self-deprecation is NOT honesty — score the behavior, not "hindi naman special"
- Disability-navigating experiences scored equal or higher proficiency
- Informal/community/family experience = formal experience when behavioral evidence present
- No quote = no claim

---

## 7. THE CHAT UI — LIVING LANDSCAPE

The chat UI (`LEEEChat.tsx`) has a **living landscape** — the background shifts through 8 colour palettes as the conversation deepens:
- Opening: cool dark dawn (slate/navy)
- Story select: warm amber beginning
- Core probe: rich teal
- Skill probe: deep gold
- Closing: soft dusk

Aya's avatar glows in the current stage colour. User message bubbles use the stage colour as a gradient. The progress bar has 5 milestone nodes with active glow. Everything transitions at 2s ease — felt, not noticed.

**Scenario cards** appear as dark glassmorphic pop-ups with 4 options after a complete story. User taps → choice logged as behavioral evidence → Aya reacts → conversation continues.

---

## 8. THE DEMO — FRIDAY (before Jakarta)

**`/demo-day`** — the Demo Director. Ryan opens this URL for Friday's demo. Three acts:

- **Act I — Jobseeker (Maria Reyes):** Profile → Chat with Aya → Story arc visual → Scenario card pops up → Superpowers Reveal → Skills Passport
- **Act II — Employer (Cebuana Lhuillier HR):** Vacancy → Gate 1 alignment → Gate 2 evidence review → Human checkpoints → Gate 3 readiness → Decision
- **Act III — Psychologist:** Audit trail → Quote evidence → Methodology references → Sign-off

Each step has: what to SAY, what to DO on screen, a live URL button, and (in Presenter Mode) whisper notes with strategy tips. Human checkpoint steps are explicitly flagged.

---

## 9. WHAT'S REMAINING (priority order)

### Pre-Friday (urgent):
1. **S10 — Vercel deploy** — live URL for employer demo. Kuber needs to do this.
2. **Dry run** — walk all 3 acts of `/demo-day` end-to-end without notes
3. **Seed demo data** — run `/demo` page to seed Cebuana employer + Maria profile

### Blocked on Ryan's team:
- **R4/R5 — Psychometric injection** — needs RIASEC/HIGH5/saboteur JSON per candidate
- **R2 — Structured disability fields** — needs Ryan to confirm field spec (severity, recently_diagnosed, etc.)

### Ready to build (post-Friday):
- R12 — System prompt v2 full replacement (Ryan's Cultural Intelligence Layer + Bridge Logic v2)
- R7 — Disability-as-evidence scoring (stronger with R2 fields)
- R9 — Vacancy competency weighting in extraction
- R11 — Self-reported challenges field in profile
- U1 — Mobile responsive design
- U8 — Virtualahan branding for Jakarta
- L12 — Accessibility mode (lower literacy, ND, TS users)
- T1-T9 — Testing with Ryan's transcripts + real profiles

---

## 10. KEY DECISIONS ON RECORD

| Decision | What Was Decided | Why |
|---|---|---|
| Voice → Text pivot | MVP is text-based (Taglish chatbot). Voice is Phase 2. | Co-creator accessibility feedback — voice excludes some PWD users |
| Gate architecture | All 3 gates built end-to-end by Kuber. Jazzel/Chamar plug in later. | Jakarta deadline — can't wait for team dependencies |
| Psychologist validation | Separate post-gate step, not embedded in gates | Keeps automated pipeline clean |
| Extraction model | claude-opus-4-5 for extraction. Sonnet for conversation turns. | Quality depth matters at extraction; latency matters mid-conversation |
| Scenario cards | Dynamic (AI-generated per conversation context), not pre-written | Pre-written won't scale; dynamic is harder to game |
| Option A (Ryan signed off) | Build all 3 gates end-to-end, LEEE as Gate 2 deep build | Ryan explicitly signed off on this scope |

---

## 11. FILES RYAN HAS SIGNED OFF ON

- `SIS_End_to_End_Process_Architecture_v2.docx` — governing document
- `SIS_Unified_Technical_Architecture_v2.docx` — full architecture (credits Ryan + Kuber)
- `LEEE_PreSession_Context_and_SystemPrompt_v2.md` — Ryan's v2 context injection spec (March 17)

---

## 12. HOW TO CONTINUE IN A NEW CHAT

1. Open a new Claude chat in this project
2. Say: **"Continue SIS build — read PROJECT_CONTEXT.md first"**
3. Claude will read this file from the project knowledge and have full context
4. The GitHub repo has all the code — clone it or reference it

**The most important things to know:**
- The demo is Friday (March 20). Vercel deploy is the #1 priority.
- Ryan sent a v2 context injection doc on March 17. R1+R3+R6 are done. R4+R5 blocked on his data.
- The living landscape UX + scenario cards were just built. Test them.
- `/demo-day` is the demo script. Ryan should open that URL on Friday.

---

*Last updated: March 17, 2026 | Kuber Sethi + Claude*
