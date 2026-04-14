# Layer 2: Multi-Agent Simulation — Build Tracker

## Ryan approved: April 14, 2026
## Build start: April 14, 2026

---

## Phase 0.5 — Scenario Authoring (3 days)

| # | Task | Status | Notes |
|---|------|--------|-------|
| S1 | Install inkjs + set up scenario infrastructure | ✅ Done | inkjs installed, simulation/engine.ts created (450+ lines), scenarios/ directory |
| S2 | Author Scenario 1: Customer Escalation | ✅ Done | 6 rounds, 3 characters (Carlos/Ana/Maria), 3 checkpoints, 2 twists |
| S3 | Author Scenario 2: Team Coordination | ✅ Done | 6 rounds, 3 characters (Ben/Joy/Ana), 3 checkpoints, 2 twists |
| S4 | Author Scenario 3: Onboarding & Knowledge Transfer | ✅ Done | 5 rounds, 3 characters (Maria/Carlos/Ana), 3 checkpoints, 2 twists |
| S5 | Scenario registry + seed-based selection | ✅ Done | scenarios/index.ts — selectScenarios() matches layer2_seeds to scenarios |

## Phase 1 — Character Engine + Game Master (1 week)

| # | Task | Status | Notes |
|---|------|--------|-------|
| C1 | TinyTroupe persona spec: define character schema | ✅ Done | CharacterProfile interface with MBTI, agenda, triggers, style, constraints |
| C2 | Character generation prompt from JD + seeds | ✅ Done | generateCharacter() with TinyTroupe-pattern prompt |
| C3 | Game Master orchestrator | ✅ Done | GameMaster class: startSimulation(), processRound(), generateReport() |
| C4 | Character agent: individual Claude call per character | ✅ Done | executeCharacter() with Managed Agents fault isolation |
| C5 | Character memory: per-round context accumulation | ✅ Done | character_memories Map in GameMaster, updated each round |
| C6 | Round management: character actions → candidate → next | ✅ Done | processRound() handles full turn cycle with twist injection |
| C7 | Checkpoint detection: trigger evaluation at defined points | ✅ Done | Checks checkpoints array, triggers evaluateCheckpoint() at matching round |
| C8 | Scenario selection from Layer 1 seeds | ✅ Done | selector.ts — selectScenario() scores scenarios against skill gaps |
| C9 | Adaptive difficulty from Layer 1 proficiency | ✅ Done | basic/intermediate/advanced modifiers + gaming flag escalation |
| C10 | Reflection phase post-scenario | ✅ Done | evaluateReflection() — metacognition, self-awareness, growth orientation |
| C11 | Holistic arc assessment (not just checkpoints) | ✅ Done | evaluateHolisticArc() — trajectory, adaptation arc, authenticity |

## Phase 2 — Simulation UI (1 week)

| # | Task | Status | Notes |
|---|------|--------|-------|
| U1 | Simulation page: /simulation route | ✅ Done | src/app/simulation/page.tsx — full 4-phase UI |
| U2 | Multi-party chat interface | ✅ Done | Team channel view with character messages + candidate replies |
| U3 | Character avatars + typing indicators | ✅ Done | Color-coded initials, tone emoji indicators, bounce loading dots |
| U4 | Round counter + progress indicator | ✅ Done | "Round 3 of 6" + progress bar in header |
| U5 | Checkpoint evaluation display | ✅ Done | Modal with skills assessed, proficiency badges, confidence bars |
| U6 | Scenario intro screen | ✅ Done | 3 scenario cards with descriptions, skill tags, duration |
| U7 | Scenario completion screen | ✅ Done | Skills observed, convergence display, observer summary |
| U8 | Mobile responsive | ✅ Done | Flex layout, responsive max-widths, touch-friendly inputs |
| U9 | Layer 2 API route | ✅ Done | /api/simulation-l2 — start, respond, get_state, complete actions + Supabase storage |

## Phase 3 — Observer + Evidence Extraction (1 week)

| # | Task | Status | Notes |
|---|------|--------|-------|
| E1 | Observer agent prompt (Sotopia-Eval 7 dimensions) | ✅ Done | evaluateCheckpoint() with full Sotopia→PSF mapping |
| E2 | Per-checkpoint scoring | ✅ Done | evaluateCheckpoint() scores skills at each defined checkpoint |
| E3 | Evidence extraction: reuse STAR+E+R pipeline | ✅ Done | formatSimulationForExtraction() outputs [SIMULATION EVIDENCE] tags for LEEE pipeline |
| E4 | Convergence report: Layer 1 vs Layer 2 | ✅ Done | calculateConvergence() in engine.ts — L1=L2/L2>L1/L2<L1 |
| E5 | Gaming detection in simulation context | ✅ Done | detectGaming() — checks rehearsed, inconsistency, pattern, context_mismatch, overclaiming |
| E6 | Evidence storage to Supabase | ✅ Done | API route saves to gate3_results + updates application status |

## Phase 4 — Scoring + Bias Audit + Integration (1 week)

| # | Task | Status | Notes |
|---|------|--------|-------|
| I1 | Readiness index calculation (G1 + G2 + G3) | ⬜ Todo | Combined score across all gates |
| I2 | Reviewer Gate 3 tab: show simulation evidence | ⬜ Todo | Transcript + observer notes + scores |
| I3 | Psychologist view: simulation audit trail | ⬜ Todo | Full evidence chain from simulation |
| I4 | Bias audit: run scenarios with varied response styles | ⬜ Todo | Taglish, formal, shortened responses |
| I5 | Bias audit: check scoring consistency across styles | ⬜ Todo | Flag disparities |
| I6 | Replace Gate 3 placeholder with real simulation flow | ⬜ Todo | Demo API gate_decision triggers simulation |
| I7 | End-to-end test: L1 → L2 → reviewer → psychologist | ⬜ Todo | Full pipeline with simulation |

---

## Summary

| Phase | Total | Done | In Progress | Todo |
|-------|-------|------|-------------|------|
| 0.5 Scenarios | 5 | 5 | 0 | 0 |
| 1 Character Engine | 11 | 11 | 0 | 0 |
| 2 UI | 9 | 9 | 0 | 0 |
| 3 Observer + Evidence | 6 | 6 | 0 | 0 |
| 4 Scoring + Integration | 7 | 0 | 0 | 7 |
| **Total** | **38** | **31** | **0** | **7** |

---

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scenario structure | Ink (inkjs) | MIT license, JS runtime, branch-and-bottleneck pattern |
| Character personas | TinyTroupe spec | Richest persona model, cognitive psychology grounding |
| Orchestration | Concordia Game Master pattern | Tabletop RPG maps to assessment, NeurIPS 2024 |
| Evaluation | Sotopia-Eval 7 dimensions | ICLR 2024 Spotlight, peer-reviewed, maps to PSF |
| Agent infrastructure | Managed Agents pattern | Brain/hands decoupling, fault isolation, durable sessions |
| Character memory | Generative Agents pattern | Memory stream + retrieval per character per round |
| LLM | Claude (Anthropic) | Already our primary, Gemini fallback |
| Framework | TypeScript / Next.js | Same stack as Layer 1, no Python microservice needed |

*Last updated: April 14, 2026*
