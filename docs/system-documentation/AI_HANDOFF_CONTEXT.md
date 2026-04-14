# KAYA — AI Handoff Context

**Purpose:** Enable another AI system to understand this platform end-to-end in minimal context.

## System Identity
**Name:** Kaya (previously "SIS" / "Skills Intelligence System")
**What:** AI hiring platform for PWD (persons with disabilities) in the Philippines
**Stack:** Next.js 14 + TypeScript + Supabase + Claude API + OpenAI + Hume AI
**Deployment:** Vercel (kaya-mvp-rose.vercel.app)
**Repo:** github.com/kubersethi15/sis-mvp
**Size:** 77 source files, 23,475 lines, 22 API routes

## Core Concept: Three-Layer Evidence Triangulation

```
Layer 1 (L1): SELF-REPORT — Aya (AI chatbot) conducts Moth-structured conversation
  → 5-stage LEEE extraction pipeline → PSF-aligned skills profile
  Weight: 0.25 in final score

Layer 2 (L2): OBSERVED BEHAVIOR — Multi-agent workplace simulation
  → Sotopia-Eval 7-dimension scoring → convergence with L1
  Weight: 0.40 in final score

Layer 3 (L3): PEER-REPORTED — Independent references rate on structured rubric
  → Three-layer convergence → independence verification
  Weight: 0.35 in final score

Output: Combined skills profile with convergence type and confidence
```

## Key Entities

| Entity | Table | Primary Key | Purpose |
|---|---|---|---|
| User Profile | user_profiles | uuid | Auth identity |
| Jobseeker Profile | jobseeker_profiles | uuid | Disability, experience, education |
| Employer | employers | uuid | Organization with reviewer assignments |
| Vacancy | vacancies | uuid | JD + competency_blueprint (jsonb) |
| Application | applications | uuid | Tracks candidate through 3 gates |
| LEEE Session | leee_sessions | uuid | Conversation session state |
| LEEE Message | leee_messages | uuid | Individual conversation messages |
| LEEE Extraction | leee_extractions | uuid | 5-stage extraction output |
| Gate 1/2/3 Results | gate[1-3]_results | uuid | Per-gate AI recommendation + human decision |
| Peer Reference | peer_references | uuid | Reference contact with unique token |
| Peer Assessment | peer_assessments | uuid | Reference ratings + examples |
| Employer Graph | employer_graphs | uuid | Knowledge graph from seed material |
| Psychologist Validation | psychologist_validations | uuid | Licensed endorsement |

## Key Workflows

### Candidate Flow
Profile → Aya conversation (7-stage state machine) → LEEE extraction (5 stages: Segment → STAR+E+R → Map → Validate → Score) → Skills profile → Apply to vacancy → Gate 1 (alignment) → Gate 2 (evidence) → L2 simulation → L3 references → Gate 3 (convergence) → Psychologist validation

### Employer Flow
Create org → Post vacancy (auto-generates competency blueprint) → Upload seed material → Generate employer-specific scenarios → Review candidates through 3 gates → Final decision

### Extraction Pipeline (critical path)
```
Transcript → Stage 1 (Sonnet: segment into episodes)
          → Stage 2 (Opus: STAR+E+R extraction per episode)
          → Stage 3 (Opus: PSF skill mapping, vacancy-weighted)
          → Stage 4 (Sonnet: consistency validation, anti-gaming)
          → Stage 5 (Opus: proficiency scoring, narrative)
          → Post-S5: voice adjustments (Hume data, ±0.20 cap)
          → Post-S5: auto-comparison if post-training tag
```

## Important Terminology
- **LEEE** — Lived Experience Extraction Engine (the 5-stage pipeline)
- **Moth storytelling** — conversation structure inspired by The Moth storytelling events
- **STAR+E+R** — Situation, Task, Action, Result + Emotion + Reflection (evidence structure)
- **PSF** — Philippine Skills Framework (national skills taxonomy)
- **PQF** — Philippine Qualifications Framework
- **SP** — Sikolohiyang Pilipino (Filipino Psychology — cultural framework)
- **Sotopia-Eval** — 7-dimension evaluation framework for social simulations
- **TinyTroupe** — Character persona generation pattern (Microsoft Research)
- **Managed Agents** — Pattern where each simulation character has independent agency
- **GameMaster** — Orchestrator class for Layer 2 simulations
- **Skills Velocity** — Improvement rate per week (Workera-inspired metric)
- **Three-layer convergence** — L1+L2+L3 compared per skill with weighted scoring

## Key Assumptions
1. Human reviewers always make final decisions (AI supports, doesn't decide)
2. Filipino cultural context is essential (not optional flavoring)
3. Voice data is analyzed but never stored (privacy)
4. Skills are demonstrated through behavior, not self-reported claims
5. Anti-gaming is non-negotiable at every layer
6. The system serves ALL employers, not just one pilot company

## Current Limitations
- No database migration tooling (schema changes are manual)
- No CI/CD pipeline or automated tests in production
- In-memory orchestrator cache lost on serverless cold start (rebuilt from Supabase)
- Skills taxonomy implements 8 of 16 PSF skills in detail
- Employer scenario generation untested with real employer data
- No email/SMS notification system
- No formal accessibility audit (WCAG)
- Synchronous 5-stage extraction may timeout on Vercel for long sessions

## Where Ambiguity Exists
- `gate2_results` schema inferred but not confirmed in codebase (may be created via demo route)
- `employer_graphs` and `employer_scenarios` tables may not exist in Supabase yet (created by API but no migration)
- Some API routes have overlapping functionality (/api/employer-graph vs /api/employer-intelligence)
- L3 convergence data storage location on gate3_results not confirmed via schema

## What to Inspect First
1. `src/types/index.ts` — complete type system
2. `src/lib/extraction-pipeline.ts` — the intellectual core
3. `src/lib/prompts.ts` — Aya's personality and conversation design
4. `src/lib/simulation/engine.ts` — Layer 2 architecture
5. `PROJECT_CONTEXT.md` — project history and people
6. Build tracker files (*.md in root) — what's built vs planned
