# Layer 2: Multi-Agent Workplace Simulation — Build Plan

## For Ryan & Kuber | Post-Jakarta Sprint 3

---

## What We're Building

A multi-agent workplace simulation where the candidate interacts with 3-5 AI characters in a realistic scenario. Characters have distinct personalities, memories, and agendas. They interact with the candidate AND with each other. An observer agent watches everything and extracts behavioral evidence using our existing STAR+E+R pipeline.

This replaces the current single-character micro-simulation with something closer to what MiroFish does — but focused on individual skills assessment rather than crowd prediction.

---

## What We Already Have (Foundation)

| Component | Status | File |
|---|---|---|
| Gate 3 API with generate/submit/score | Built | `src/app/api/gate3/route.ts` (521 lines) |
| Single-character simulation UI | Built | `src/components/MicroSimulation.tsx` (207 lines) |
| Scenario card UI | Built | `src/components/ScenarioCard.tsx` (203 lines) |
| Simulation API (character response) | Built | `src/app/api/simulation/route.ts` (129 lines) |
| Layer 2 seed generation from LEEE | Built | `extraction-pipeline.ts` — generates layer2_seeds[] |
| Extraction pipeline handles simulation evidence | Built | `[SIMULATION EVIDENCE]` tags in Stage 1-3 |
| Scenario types defined | Designed | Team Conflict, Customer Crisis, Resource Constraint, New Process, Culture Clash |
| Agent roles defined | Designed | Scenario Agent, Character Agents, Observer Agent, Scoring Agent, Gaming Detection Agent |

**We're not starting from zero.** The skeleton exists. What's missing is the multi-agent orchestration.

---

## What MiroFish Teaches Us (Borrow, Don't Clone)

### Borrow
1. **Agent persona generation from seed material** — MiroFish uses GraphRAG to extract entities/relationships from documents and generate agent personalities. We do the same from JD + employer profile + candidate skills profile. Each character gets a backstory, communication style, agenda, and relationship to other characters.

2. **Persistent memory per agent** — MiroFish uses Zep Cloud. We use Supabase. Each character remembers what the candidate said in previous rounds. If the candidate promises to follow up on something in round 1, the manager character asks about it in round 3.

3. **Emergent interaction** — Characters don't just respond to the candidate. They respond to each other. The angry customer escalates. The colleague intervenes. The manager observes. The candidate navigates a living situation, not a scripted quiz.

4. **Observer/Report Agent** — MiroFish has a ReportAgent that synthesizes emergent behavior. Our Observer Agent watches all exchanges and produces structured behavioral evidence.

### Don't Clone
- MiroFish spawns thousands of agents. We need 3-5 well-crafted characters per scenario.
- MiroFish uses GraphRAG + Neo4j. We use simpler context injection — the JD and employer profile are small enough to fit in a prompt.
- MiroFish simulates social media (Twitter/Reddit). We simulate a workplace (Slack-like team channel + direct messages).
- MiroFish predicts crowd behavior. We assess individual competency.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│           SIMULATION ORCHESTRATOR           │
│          (Brain — manages flow)             │
│                                              │
│  Reads: JD, employer profile, candidate     │
│         skills profile, layer2_seeds         │
│  Produces: scenario setup, character         │
│           profiles, round management         │
└──────────┬──────────────────────┬───────────┘
           │                      │
    ┌──────▼──────┐        ┌─────▼──────┐
    │  CHARACTER   │        │  OBSERVER   │
    │  AGENTS      │        │  AGENT      │
    │  (Hands)     │        │  (Brain)    │
    │              │        │             │
    │  3-5 agents  │        │  Watches    │
    │  each with:  │        │  all turns, │
    │  - persona   │        │  extracts   │
    │  - agenda    │        │  STAR+E+R   │
    │  - memory    │        │  evidence   │
    │  - style     │        │             │
    └──────────────┘        └─────────────┘
           │                      │
    ┌──────▼──────────────────────▼───────────┐
    │         SIMULATION UI                    │
    │   Candidate sees: team channel view      │
    │   Characters post, candidate responds    │
    │   5-8 rounds per scenario                │
    └──────────────────────────────────────────┘
           │
    ┌──────▼──────────────────────────────────┐
    │      SCORING + EVIDENCE ASSEMBLY         │
    │   Reuses extraction pipeline Stages 2-3  │
    │   Compares to Layer 1 claims             │
    │   Produces convergence report            │
    └──────────────────────────────────────────┘
```

---

## The Five Agent Types (Per Scenario)

### 1. Scenario Agent (Orchestrator)
- Generates the scenario setup from layer2_seeds + JD + employer context
- Defines the scene: who's involved, what's at stake, what constraints exist
- Controls round progression: introduces complications, escalates tension, adds time pressure
- Decides when to end the scenario (after sufficient evidence or max rounds)

### 2. Character Agents (3-5 per scenario)
Each character has:
- **Name and role** — "Maria, your team lead" / "Carlos, the frustrated customer" / "Ana, the new colleague"
- **Personality** — derived from the scenario type and employer context
- **Agenda** — what they want from this interaction (may conflict with what the candidate wants)
- **Communication style** — direct vs. indirect, formal vs. casual, calm vs. emotional
- **Memory** — remembers previous rounds within this scenario
- **Relationship to candidate** — manager, peer, customer, report

Characters generated dynamically from seed material (MiroFish pattern):
- JD says "customer-facing role" → generate a difficult customer character
- Employer profile says "team-based work" → generate 2 colleagues with conflicting approaches
- Layer2_seeds says "test collaboration in professional context" → generate a scenario requiring joint decision-making

### 3. Observer Agent (Silent Evaluator)
- Reads every exchange but never speaks in the simulation
- Tags behavioral evidence in real-time: "Candidate used de-escalation language" / "Candidate took initiative to propose solution" / "Candidate deferred to authority without adding own perspective"
- Produces STAR+E+R structured evidence at scenario end
- Compares observed behavior to Layer 1 self-reported claims

### 4. Scoring Agent
- Takes Observer Agent's evidence and scores against PSF rubrics
- Produces convergence report: Layer 1 said "Intermediate Communication" — Layer 2 observed "Advanced de-escalation, Basic written clarity"
- Flags discrepancies for psychologist review

### 5. Gaming Detection Agent
- Watches for: overly polished responses, lack of emotional engagement, responses that feel rehearsed, inconsistency with Layer 1 personality signals
- Flags suspicious patterns without blocking the simulation

---

## Scenario Types (Start with 3 for Cebuana Lhuillier)

### Scenario 1: Customer Escalation
- Setting: Branch counter, end of day
- Characters: Angry customer (Carlos) who was overcharged, new colleague (Ana) watching and learning, branch supervisor (Maria) on a call in the back
- Skills tested: Communication, Emotional Intelligence, Problem-Solving, Customer Service
- Twist (round 3): Customer threatens to go to social media. Supervisor is unavailable. Colleague makes the situation worse by giving wrong information.

### Scenario 2: Team Coordination Under Pressure
- Setting: Monday morning, system is down, 15 customers waiting
- Characters: Senior colleague (Ben) who wants to do things the old manual way, tech support on phone (Joy) who's unhelpful, queue of impatient customers (represented by Ana as spokesperson)
- Skills tested: Collaboration, Adaptability, Decision Making, Self-Management
- Twist: Senior colleague and the candidate disagree on approach. Someone needs to make a call.

### Scenario 3: Onboarding & Knowledge Transfer
- Setting: New branch, first week, candidate needs to learn and contribute simultaneously
- Characters: Trainer (Maria) who's overwhelmed, fellow new hire (Carlos) who's struggling, customer (Ana) who needs help NOW
- Skills tested: Learning Agility, Communication, Collaboration, Work Ethic
- Twist: Trainer gets called away. Candidate and fellow new hire must figure things out together.

---

## Build Phases

### Phase 1: Orchestrator + Character Engine (Week 1-2)
**Files to create/modify:**
- `src/lib/simulation-engine.ts` — NEW: orchestrator, character generation, round management
- `src/app/api/simulation/route.ts` — MODIFY: multi-character support
- `src/app/api/gate3/route.ts` — MODIFY: use new simulation engine

**What it does:**
- Takes layer2_seeds + JD + employer profile as input
- Generates 3-5 character profiles with personas, agendas, communication styles
- Manages round-by-round flow: character actions → candidate responds → characters react
- Each character is a separate Claude call with its own system prompt (Managed Agents pattern: `execute(character_name, input) → response`)

**Key design decision:** Each character gets its own system prompt containing only: (a) their persona, (b) the scenario context, (c) the conversation history, (d) their memory of previous rounds. They do NOT see the Observer's notes or scoring. This prevents characters from "teaching to the test."

### Phase 2: Simulation UI (Week 2-3)
**Files to create/modify:**
- `src/components/WorkplaceSimulation.tsx` — NEW: multi-character chat interface
- `src/app/simulation/page.tsx` — NEW: standalone simulation page (accessible from Gate 3)

**UI concept:** Slack-like team channel view
- Left sidebar: list of characters with status (online, typing, away)
- Main panel: chronological message thread showing all characters + candidate
- Characters post messages addressed to different people (including each other)
- Candidate can respond to specific characters or the whole channel
- Visual indicators: who's speaking, tension level, time pressure
- Round counter: "Round 3 of 6"

**Why Slack-like:** Familiar to anyone who's used messaging. Natural for multi-party conversation. Characters can talk to each other visibly. The candidate sees the full social dynamics, not just their own thread.

### Phase 3: Observer + Evidence Extraction (Week 3)
**Files to create/modify:**
- `src/lib/simulation-observer.ts` — NEW: observer agent logic
- `src/lib/extraction-pipeline.ts` — MODIFY: add simulation evidence processing mode

**What it does:**
- After each round, Observer Agent reviews all exchanges
- Tags behavioral evidence: what skill was demonstrated, what proficiency level, what the specific behavioral indicator was
- At scenario end, produces structured STAR+E+R evidence from simulation observations
- Feeds into existing extraction pipeline Stages 2-3 (evidence extraction + skill mapping)
- Produces convergence report comparing Layer 1 (self-reported) vs Layer 2 (observed)

### Phase 4: Scoring + Integration (Week 3-4)
**Files to modify:**
- `src/app/api/gate3/route.ts` — MODIFY: use simulation evidence in readiness calculation
- `src/app/reviewer/page.tsx` — MODIFY: Gate 3 tab shows simulation evidence
- `src/app/psychologist/page.tsx` — MODIFY: audit trail includes simulation observations

**What it does:**
- Scoring Agent takes Observer's evidence and scores against PSF rubrics
- Convergence calculation: for each skill, Layer 1 score vs Layer 2 score
  - Both agree → HIGH confidence, use higher score
  - Layer 2 higher than Layer 1 → candidate undersold themselves (common for PWDs)
  - Layer 2 lower than Layer 1 → possible gaming in Layer 1, flag for review
- Readiness index combines: alignment score (Gate 1) + evidence strength (Gate 2) + simulation performance (Gate 3)
- Reviewer sees: simulation transcript + observer notes + skill scores + convergence report
- Psychologist sees: full audit trail including every character interaction

---

## What We Take From MiroFish (Specifically)

| MiroFish Component | Kaya Adaptation | Implementation |
|---|---|---|
| GraphRAG entity extraction from seed docs | Character generation from JD + employer profile | Prompt-based (no Neo4j needed — docs are small enough) |
| Agent persona with personality + memory | Character profiles with agenda + communication style + round memory | System prompt per character + conversation history |
| Social media simulation (Twitter/Reddit) | Workplace simulation (Slack-like team channel) | New React component |
| Thousands of interacting agents | 3-5 characters per scenario | Focused on assessment quality, not scale |
| ReportAgent synthesizing emergent patterns | Observer Agent producing STAR+E+R evidence | Reuses our extraction pipeline |
| Zep Cloud for persistent agent memory | Supabase for simulation state + round history | Already have the infrastructure |
| `execute(name, input) → string` pattern | Each character is a separate Claude call | Managed Agents architecture |

---

## What This Changes for the Hiring Pipeline

**Before (current):**
Gate 3 auto-populates with static placeholder data. No actual assessment.

**After:**
Gate 3 becomes a real behavioral assessment. The candidate demonstrates skills in a realistic scenario. The employer gets:
- Layer 1 evidence: "The candidate said they handle angry customers well"
- Layer 2 evidence: "In a simulated customer escalation, the candidate used de-escalation language, proposed a concrete solution, and followed up proactively"
- Convergence: "Layer 1 claimed Intermediate Communication. Layer 2 observed Advanced de-escalation, Intermediate written clarity. Convergent with nuance."

This is the three-layer triangulation that makes Kaya's methodology defensible. Self-report alone is weak. Self-report validated by simulation is strong. Self-report + simulation + psychologist endorsement is publishable.

---

## Estimated Effort

| Phase | Duration | Dependencies |
|---|---|---|
| Phase 1: Orchestrator + Character Engine | 1.5 weeks | Layer 2 seeds from extraction (already built) |
| Phase 2: Simulation UI | 1 week | Phase 1 |
| Phase 3: Observer + Evidence | 1 week | Phase 1, extraction pipeline (already built) |
| Phase 4: Scoring + Integration | 0.5 weeks | Phase 2-3 |
| **Total** | **4 weeks** | Fits in Sprint 3 (Verification) |

---

## Discussion Points for Ryan

1. **Which 3 scenarios should we build first?** Customer escalation, team coordination, and onboarding seem right for Cebuana Lhuillier branch staff. Does Ryan agree?

2. **UI: Slack-like channel or something else?** The Slack-like view makes multi-party conversation natural. But if candidates aren't familiar with Slack, we could do a simpler chat view with character avatars.

3. **How many rounds per scenario?** Current thinking: 5-8 rounds (each round = all characters act + candidate responds). Should take 10-15 minutes per scenario. 2 scenarios per Gate 3 assessment = 20-30 minutes.

4. **Should characters speak in Taglish?** If the candidate used Taglish with Aya in Layer 1, should the simulation characters also code-switch? This would make the scenario feel more realistic for Filipino users.

5. **Convergence threshold:** If Layer 1 says "Intermediate" and Layer 2 says "Basic" for the same skill, what happens? Flag for psychologist? Auto-use the lower score? Use a weighted average?

6. **This replaces waiting for Jazzel.** We're building it ourselves using MiroFish-inspired architecture + Managed Agents infrastructure patterns. Jazzel's work can still plug in later through the same `execute()` interface if he produces anything.
