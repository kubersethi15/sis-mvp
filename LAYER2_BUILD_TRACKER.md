# Layer 2: Multi-Agent Simulation — Build Tracker

## Ryan approved: April 14, 2026
## Build start: April 14, 2026

---

## Phase 0.5 — Scenario Authoring (3 days)

| # | Task | Status | Notes |
|---|------|--------|-------|
| S1 | Install inkjs + set up scenario infrastructure | ✅ Done | inkjs installed, simulation/engine.ts created (450+ lines), scenarios/ directory |
| S2 | Author Scenario 1: Customer Escalation | ✅ Done | 6 rounds, 3 characters (Carlos/Ana/Maria), 3 checkpoints, 2 twists |
| S3 | Author Scenario 2: Team Coordination | ⬜ Todo | 6 rounds, 3 characters, 3 checkpoints |
| S4 | Author Scenario 3: Onboarding & Knowledge Transfer | ⬜ Todo | 5 rounds, 3 characters, 3 checkpoints |
| S5 | Scenario testing in browser (inkjs runtime) | ⬜ Todo | Verify branching + checkpoints work |

## Phase 1 — Character Engine + Game Master (1 week)

| # | Task | Status | Notes |
|---|------|--------|-------|
| C1 | TinyTroupe persona spec: define character schema | ✅ Done | CharacterProfile interface with MBTI, agenda, triggers, style, constraints |
| C2 | Character generation prompt from JD + seeds | ✅ Done | generateCharacter() with TinyTroupe-pattern prompt |
| C3 | Game Master orchestrator | ✅ Done | GameMaster class: startSimulation(), processRound(), generateReport() |
| C4 | Character agent: individual Claude call per character | ✅ Done | executeCharacter() with Managed Agents fault isolation |
| C5 | Character memory: per-round context accumulation | ⬜ Todo | Each character remembers previous rounds |
| C6 | Round management: character actions → candidate → next | ⬜ Todo | Turn order, who speaks when |
| C7 | Checkpoint detection: trigger evaluation at defined points | ⬜ Todo | Ink knot → evaluation pause |

## Phase 2 — Simulation UI (1 week)

| # | Task | Status | Notes |
|---|------|--------|-------|
| U1 | Simulation page: /simulation route | ⬜ Todo | Standalone page for Gate 3 simulation |
| U2 | Multi-party chat interface | ⬜ Todo | Characters + candidate in team channel view |
| U3 | Character avatars + typing indicators | ⬜ Todo | Visual identity per character |
| U4 | Round counter + progress indicator | ⬜ Todo | "Round 3 of 6" |
| U5 | Checkpoint evaluation display | ⬜ Todo | Brief pause, show what's being assessed |
| U6 | Scenario intro screen | ⬜ Todo | Setting, characters, what to expect |
| U7 | Scenario completion screen | ⬜ Todo | Summary before full scoring |
| U8 | Mobile responsive | ⬜ Todo | Pipeline funnels etc on mobile |
| U9 | Connect to Gate 3 flow | ⬜ Todo | Reviewer approves Gate 2 → simulation starts |

## Phase 3 — Observer + Evidence Extraction (1 week)

| # | Task | Status | Notes |
|---|------|--------|-------|
| E1 | Observer agent prompt (Sotopia-Eval 7 dimensions) | ✅ Done | evaluateCheckpoint() with full Sotopia→PSF mapping |
| E2 | Per-checkpoint scoring | ⬜ Todo | Score specific competencies at each checkpoint |
| E3 | Evidence extraction: reuse STAR+E+R pipeline | ⬜ Todo | Feed simulation transcript to Stages 2-3 |
| E4 | Convergence report: Layer 1 vs Layer 2 | ⬜ Todo | Compare self-reported vs observed |
| E5 | Gaming detection in simulation context | ⬜ Todo | Rehearsed responses, inconsistency with L1 |
| E6 | Evidence storage to Supabase | ⬜ Todo | gate3_results with simulation evidence |

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
| 0.5 Scenarios | 5 | 2 | 0 | 3 |
| 1 Character Engine | 7 | 4 | 0 | 3 |
| 2 UI | 9 | 0 | 0 | 9 |
| 3 Observer + Evidence | 6 | 1 | 0 | 5 |
| 4 Scoring + Integration | 7 | 0 | 0 | 7 |
| **Total** | **34** | **7** | **0** | **27** |

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
