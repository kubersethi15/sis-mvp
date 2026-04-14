# Kaya Scenario Intelligence — Build Plan

## Phase 1: Employer-Specific Scenario Generation (Our Stack)
## Phase 2: Market Intelligence Layer (MiroFish, pending Ryan confirmation)
## Started: April 14, 2026

---

## Phase 1 — Employer-Specific Scenario Generation

**What:** When an employer onboards, Kaya analyses their context and auto-generates workplace simulation scenarios. A hospital gets patient scenarios. A bank gets compliance scenarios. No manual authoring needed.

**Stack:** All existing — Next.js + Supabase + Claude. Zero new infrastructure.

**How it works:**
1. Employer uploads seed material (JDs, company description, handbook excerpts)
2. Claude extracts a workplace knowledge graph (entities, relationships, friction points)
3. Extended GameMaster runs a workplace discovery simulation (20-50 agents)
4. Claude generates ScenarioConfig objects from the highest-signal situations
5. Scenarios stored in Supabase, used for all candidates applying to that employer

### Phase 1A — Knowledge Graph Extraction

| # | Task | Status | Notes |
|---|------|--------|-------|
| S1.1 | Employer seed material upload on employer dashboard | ⬜ Todo | Upload JDs (text/PDF), company description, optional handbook |
| S1.2 | Seed material storage in Supabase | ⬜ Todo | employer_seed_materials table: employer_id, documents[], uploaded_at |
| S1.3 | Knowledge graph extraction prompt | ✅ Done | extractWorkplaceGraph() — entities, relationships, friction points, critical skills |
| S1.4 | Graph storage in Supabase | ✅ Done | employer_intelligence table: workplace_graph jsonb |
| S1.5 | Skill demand identification from graph | ✅ Done | critical_skills ranked in extraction output |
| S1.6 | /api/employer-intelligence route | ✅ Done | generate, get_scenarios, get_graph actions |

### Phase 1B — Discovery Simulation

| # | Task | Status | Notes |
|---|------|--------|-------|
| S1.7 | Workplace agent generator from graph nodes | ✅ Done | Graph roles become discovery simulation agents with personas |
| S1.8 | Discovery GameMaster (extends existing engine) | ✅ Done | runDiscoverySimulation() — analyses graph for top assessment situations |
| S1.9 | Situation injection from friction points | ✅ Done | Friction points drive scenario discovery, scored by assessment value |
| S1.10 | Interaction logging: which situations create behavioral differentiation | ✅ Done | differentiation_score per situation + what_good/weak_candidate_does |
| S1.11 | Top-5 situation extraction | ✅ Done | Sorted by differentiation_score, top 5 returned |

### Phase 1C — Scenario Generation

| # | Task | Status | Notes |
|---|------|--------|-------|
| S1.12 | ScenarioConfig generator from top situations | ✅ Done | generateScenarioFromSituation() — full scenario with characters, checkpoints, twists |
| S1.13 | Character generator from graph personas | ✅ Done | TinyTroupe-pattern characters with MBTI, agenda, backstory, Filipino cultural grounding |
| S1.14 | Checkpoint mapping to employer's critical skills | ✅ Done | Checkpoints evaluate skills from graph.critical_skills |
| S1.15 | Twist generator from friction points | ✅ Done | Friction points become twists with character reactions |
| S1.16 | Scenario validation against vacancy competency blueprint | ✅ Done | Prompt requires scenarios test employer's critical skills |
| S1.17 | Store in Supabase: employer_intelligence table | ✅ Done | employer_id, workplace_graph, discovery_results, generated_scenarios, generated_at |

### Phase 1D — Integration

| # | Task | Status | Notes |
|---|------|--------|-------|
| S1.18 | selectScenarios() checks employer_scenarios first | ⬜ Todo | If employer has generated scenarios, use those. Fall back to static 3. |
| S1.19 | Employer scenario preview on dashboard | ⬜ Todo | Show generated scenarios — employer can approve/reject/regenerate |
| S1.20 | Processing status UI | ⬜ Todo | "Analysing your workplace... Generating scenarios..." with progress |
| S1.21 | Regenerate button with updated seed material | ⬜ Todo | Employer adds more docs → re-extracts graph → re-generates scenarios |
| S1.22 | End-to-end test: upload → graph → simulation → scenarios → candidate assessment | ⬜ Todo | Full pipeline verification |
| S1.23 | Bias audit on generated scenarios | ⬜ Todo | Run bias-audit.ts against generated scenarios |
| S1.24 | Fallback: if generation fails, use static scenarios | ⬜ Todo | Graceful degradation — never block the candidate |

### Phase 1 Summary

| Sub-phase | Tasks | Done |
|-----------|-------|------|
| 1A Knowledge Graph | 6 | 0 |
| 1B Discovery Simulation | 5 | 0 |
| 1C Scenario Generation | 6 | 0 |
| 1D Integration | 7 | 0 |
| **Total Phase 1** | **24** | **0** |

**Cost per employer:** ~$0.50-2.00 (Claude calls for extraction + generation). One-time. Scenarios reused for all candidates.

**No new infrastructure. No new API keys. No new services.**

---

## Phase 2 — Market Intelligence Layer (MiroFish, Pending Ryan)

**What:** Large-scale labor market simulation. Feed industry-wide data → swarm simulates market dynamics → outputs workforce intelligence and demand forecasting.

**This is NOT employer-specific. This is macro-level:**
- "Digital customer service demand is growing 40% QoQ — update assessment focus"
- "Top 3 skill gaps for PWD employment: remote collaboration, digital fluency, async communication"
- "Banking sector shifting from in-branch to digital-first — adjust scenarios for Cebuana, BDO, etc."
- Virtualahan can use this to adjust their training programs proactively

**Why this needs MiroFish (full Python stack):**
- Needs 100-500+ agents simulating an entire labor market, not just one employer
- Cross-employer dynamics: how does one industry's shift affect another?
- Persistent agent memory across simulation runs (agents learn and evolve)
- OASIS framework handles million-agent scale that our TypeScript engine can't match
- GraphRAG from industry-wide data sources (TESDA, DOLE, JobStreet, WEF)

**What Ryan needs to confirm for Phase 2:**

1. **Is this a priority?** Phase 1 (employer-specific scenarios) makes hiring better today. Phase 2 (market intelligence) is a strategic positioning play for funders and workforce planning. Which matters more right now?

2. **Data sources:** What industry data do we feed? TESDA announcements, DOLE labor market reports, JobStreet/Indeed trends, WEF data, employer JD patterns? Who gathers this?

3. **Who is the customer?** Is market intelligence for employers (workforce planning), for Virtualahan (training program design), or for government (policy making)?

4. **Infrastructure budget:** Phase 2 needs a Python server (Docker, ~$12-24/month on DigitalOcean/Railway), Zep Cloud or self-hosted Neo4j, and higher LLM costs ($5-15 per market simulation run).

5. **Timeline:** Phase 2 is 6-8 weeks of work. Should we start after Phase 1 ships, or run in parallel?

**Phase 2 tasks (high-level, detailed planning after Ryan confirms):**
- Stand up MiroFish as Python microservice (Docker)
- Replace Zep with Supabase pgvector if possible, or use Zep Cloud
- Custom workplace ontology adapter
- Custom OASIS platform: workplace interactions instead of Twitter/Reddit
- Industry data ingestion pipeline
- Market intelligence report generation
- Employer dashboard: "Your industry is shifting — here's what to assess for"
- Skills demand forecasting for Virtualahan program design

---

## What No Competitor Has

**Phase 1 alone** gives Kaya something nobody else does — employer-specific assessment scenarios generated from the employer's own context.

**Phase 1 + Phase 2** turns Kaya into a workforce intelligence platform — not just "hire this person" but "here's what your industry needs, here's what skills to develop, here's how to assess for it."

---

*Last updated: April 14, 2026*
