# 6. Managed Agents Architecture for Kaya

**Inspired by:** Anthropic's "Scaling Managed Agents" (Lance Martin, Gabe Cemaj, Michael Cohen — April 2026)

**Build effort:** Medium-high (6-8 weeks for full implementation)

**Phase:** Sprint 3-4 (Verification → Scale)

---

## The Core Insight

Anthropic's Managed Agents paper solves a fundamental problem: how to run AI agents that work reliably over long time horizons by **decoupling the brain (Claude + harness) from the hands (sandboxes and tools) and the session (durable event log)**. Each component can fail or be replaced independently. The brain becomes stateless cattle, the session becomes the durable source of truth, and the hands are interchangeable execution environments.

This maps directly onto three Kaya challenges we haven't solved yet.

---

## Challenge 1: Aya Conversation Sessions That Exceed Context Windows

**Current state:** Aya conversations run in a single API call chain. If a user shares 3-4 rich stories over 30+ minutes, the conversation approaches Claude's context limit. We currently use `max_tokens: 300` for responses and `max_tokens: 500` for extraction, but the accumulated transcript grows unbounded. Mid-session, the system prompt + full message history + gap scan context can exceed the window, causing degraded responses or failures.

**Managed Agents solution — Session as durable event log:**

Instead of keeping the entire conversation in Claude's context window, treat each Aya turn as an event in a durable session log (which we already store in Supabase). The harness reconstructs Claude's context window each turn by:

1. Always including: system prompt + calibration context + current Moth stage
2. Selectively including: last 6-8 messages (recent conversation flow)
3. Summarizing: earlier messages as a compressed "story so far" context block
4. Injecting: mid-session gap scan results as structured context

This is the `getEvents()` → selective retrieval → context engineering pattern from the paper. The session log in Supabase already stores every message — we just need to change how we reconstruct Claude's context window from it.

**What to build:**
- Context window manager in `orchestrator.ts` — instead of passing all messages, selectively compose the context per turn
- Story summarization between Moth stages — compress completed stories into evidence summaries
- Gap scan results injected as structured context, not appended as conversation messages
- Session recovery: if Aya crashes mid-conversation, user returns and conversation resumes from the session log (partially built — FB-001 fix)

**Impact on Adaptive Conversation Intelligence (#1):** This directly enables longer, adaptive sessions. If we're not constrained by context window, we can let sessions run until evidence is sufficient rather than cutting them off at a fixed length.

---

## Challenge 2: Multi-Agent Extraction Pipeline

**Current state:** Our 5-stage extraction pipeline (`extraction-pipeline.ts`) runs sequentially: Segment → Extract → Map → Score → Validate → Assemble. Each stage is a separate Claude call, but they share a single execution context. If Stage 3 fails, the whole pipeline fails.

**Managed Agents solution — Many brains, many hands:**

The paper describes how decoupling brains from hands means each agent is a tool call: `execute(name, input) → string`. Each extraction stage becomes an independent "hand" that the orchestrating "brain" dispatches work to. Benefits:

1. **Fault isolation:** Stage 3 failing doesn't kill Stages 1-2's results. The brain catches the error and can retry or skip.
2. **Parallel execution:** Stages 1 and 2 are sequential (2 needs 1's output), but Stage 3 (skill mapping) could run in parallel across different skills once evidence is extracted.
3. **Model selection per stage:** The paper notes that different tasks need different capabilities. We already do this (Sonnet for stages 1/4, could use different models for scoring vs. mapping). Managed Agents formalizes this.
4. **Audit trail:** Each stage's input/output is logged as a session event. The psychologist sees not just the final output but every intermediate decision. This directly strengthens the ECD documentation (#2).

**What to build:**
- Refactor `runExtractionPipeline()` to use a dispatcher pattern — each stage is an independent function that receives input and returns structured output
- Add retry logic per stage (currently if any stage fails, the whole extraction fails)
- Log intermediate results to Supabase (not just final output) — creates the audit trail psychologists need
- Consider parallel execution for Stage 3 (skill mapping across evidence items)

---

## Challenge 3: Layer 2 Multi-Agent Simulations (Gate 3)

**Current state:** Gate 3 is a placeholder. Jazzel is supposed to build multi-agent workplace simulations, but nothing is integrated yet. The current Gate 3 auto-populates with static readiness scores.

**Managed Agents solution — The simulation architecture:**

This is where Managed Agents becomes transformative for Kaya. A workplace simulation is inherently a multi-agent problem:

- **The scenario agent** (brain) designs a workplace situation based on the candidate's skills profile and the job requirements
- **The role-play agents** (hands) simulate colleagues, customers, or managers that the candidate interacts with
- **The evaluation agent** (brain) observes the interaction and scores behavioral evidence
- **The candidate interface** (hand) presents the scenario and captures responses

The paper's `execute(name, input) → string` interface means each simulation character is a separate tool call. The orchestrating brain manages the scenario flow, dispatches character responses, and collects evidence. The session log captures the entire simulation for audit.

**What to build:**
- Simulation orchestrator using the brain/hands pattern — one Claude instance manages the scenario, separate instances play roles
- Scenario generation from LEEE extraction output (we already generate Layer 2 seed scenarios)
- Behavioral evidence extraction from simulation responses (reuse our Stage 2-3 pipeline)
- Integration point for Jazzel's work — his multi-agent simulations plug into this same `execute()` interface

---

## Challenge 4: Long-Horizon Career Development (Growth Tracking)

**Current state:** Kaya is a one-shot system. User talks to Aya, gets skills profile, done.

**Managed Agents solution — Sessions that span months:**

The paper's key insight is that the session log persists independently of any single brain or hand. For Kaya, this means a jobseeker's entire history — every conversation, every extraction, every gate decision — lives in a durable session log that any future interaction can reference.

When a user returns 3 months later after completing Virtualahan training:
1. The harness calls `getEvents()` to retrieve their history
2. Context engineering selects relevant prior evidence
3. Aya opens with: "Last time we talked, you shared a story about organizing your community relief effort. Tell me what's happened since then."
4. Delta extraction compares new evidence to existing profile
5. Skills Velocity is calculated from the difference

This is essentially the "initializer agent" pattern from the long-running agents paper — each return visit starts by reading the progress file (prior skills profile) and git history (conversation history), then makes incremental progress.

**What to build:**
- Return visit detection in session initialization (partially exists in calibration.ts)
- Prior profile injection into Aya's context (the calibration system already derives context from profile data)
- Delta extraction mode in the pipeline — compare new evidence against existing skills
- Skills Velocity calculation and storage

---

## Integration with Existing Strategic Enhancements

| Enhancement | Managed Agents Pattern | Benefit |
|---|---|---|
| #1 Adaptive Conversation | Session as durable log + selective context retrieval | Sessions can run until evidence is sufficient, not until context runs out |
| #2 ECD Framework | Per-stage audit logging in session events | Every extraction decision is logged and traceable for psychologist review |
| #3 Granular Ontology | Parallel skill mapping (many hands) | Map evidence to 200+ sub-competencies in parallel, not sequentially |
| #4 Growth Tracking | Long-horizon session spanning months | Return visits reference full history without replaying it |
| #5 Career Pathfinding | Multi-brain for role matching + gap analysis | Separate agents for role search, gap analysis, and learning path generation |

---

## Implementation Priority

1. **Context window management for Aya** (Sprint 2) — highest impact, prevents conversation degradation. Uses the session log pattern.
2. **Extraction pipeline fault isolation** (Sprint 2) — retry logic per stage, intermediate audit logging. Low effort, high reliability improvement.
3. **Return visit flow** (Sprint 3-4) — builds on Growth Tracking enhancement. Uses the long-horizon session pattern.
4. **Layer 2 simulation orchestrator** (Sprint 3) — multi-agent workplace scenarios. The biggest architectural change. Design the `execute()` interface now so Jazzel can plug in.

---

## Discussion Points for Ryan

- **The session log pattern is already partially implemented** — we store messages and extractions in Supabase. The shift is using this data to reconstruct Claude's context window intelligently rather than passing the full conversation.
- **The multi-agent simulation architecture should be designed now** even if implementation is Sprint 3. Jazzel's work should target the same `execute(name, input) → string` interface so it plugs in cleanly.
- **Security model matters** — the paper emphasizes that credentials should never be in the sandbox where generated code runs. For Kaya, this means the Anthropic API key and Supabase service role key should be in a vault, not accessible from user-facing code. We're partially there (server-side API routes) but should formalize this.
- **The "cattle not pets" principle** applies to our Vercel deployment — if a serverless function fails mid-extraction, we should be able to resume from the session log rather than losing the work. This is essentially what our session persistence (FB-001) already does for conversations.
