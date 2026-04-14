# Kaya — Dynamic Scenario Generation Build Plan

## Phase 1: Employer-Specific Scenarios (Our Stack — Building Now)
## Phase 2: Market Intelligence Layer (MiroFish — Pending Ryan Confirmation)
## Started: April 14, 2026

---

## Phase 1: Employer-Specific Scenario Generation

**Stack:** Next.js + Supabase + Claude (what we already have)
**No new infrastructure. No new services. No new dependencies.**

### How It Works

```
Employer uploads seed material (JDs, handbook, company description)
    ↓
Claude extracts knowledge graph → entities + relationships
    ↓
Stored in Supabase (employer_graph_nodes + employer_graph_edges)
    ↓
Extended GameMaster runs discovery simulation (20-50 workplace agents)
    ↓
Situations scored by assessment value (which ones differentiate performers?)
    ↓
Claude generates ScenarioConfigs from top-scoring situations
    ↓
Employer previews + approves scenarios
    ↓
Candidates enter employer-specific workplace simulations
```

### Phase 1A — Knowledge Graph Extraction

| # | Task | Status | Notes |
|---|------|--------|-------|
| G1 | Employer seed material upload (JDs, handbook, company desc) | ⬜ Todo | Employer dashboard: file upload + text input (Phase 1D) |
| G2 | Claude knowledge graph extraction prompt | ✅ Done | graph-extraction.ts — extracts nodes, edges, friction points, critical skills, culture |
| G3 | Supabase schema: employer_graphs table | ✅ Done | employer_id, graph_data (jsonb), nodes_count, edges_count, critical_skills |
| G4 | Supabase schema: employer_scenarios table | ✅ Done | employer_id, scenarios (jsonb[]), generated_at, validations |
| G5 | Knowledge graph API route (/api/employer-graph) | ✅ Done | extract_graph, run_discovery, generate_scenarios, full_pipeline, get_scenarios |
| G6 | Critical skill identification from graph | ✅ Done | CriticalSkill interface with importance ranking + evidence from seed |

### Phase 1B — Discovery Simulation

| # | Task | Status | Notes |
|---|------|--------|-------|
| D1 | WorkplaceSwarm (discovery-simulation.ts) | ✅ Done | runDiscoverySimulation() — spawns agents, injects situations, scores results |
| D2 | Agent generation from graph nodes | ✅ Done | generateSwarmAgents() — TinyTroupe-format personas from graph entities |
| D3 | Situation injection from friction points | ✅ Done | High-value friction points become simulation situations |
| D4 | Interaction model: workplace actions | ✅ Done | 9 action types: request_help, delegate, escalate, resolve, collaborate, disagree, avoid, support, complain |
| D5 | Assessment value scoring | ✅ Done | scoreSimulation() — behavioral differentiation, skill coverage, realism, fairness, cultural sensitivity |
| D6 | Top-5 situation extraction | ✅ Done | Ranked by assessment_value, top N returned |
| D7 | Discovery simulation API route | ✅ Done | Integrated into /api/employer-graph (run_discovery action) |

### Phase 1C — Scenario Generation

| # | Task | Status | Notes |
|---|------|--------|-------|
| S1 | ScenarioConfig generator from discovery output | ✅ Done | generateScenarioFromDiscovery() — full ScenarioConfig with characters, checkpoints, twists |
| S2 | Character generation from graph agents | ✅ Done | Characters generated with Filipino names, personalities, agendas, constraints |
| S3 | Checkpoint mapping to employer-critical skills | ✅ Done | Checkpoints use Sotopia dimensions mapped to employer's critical PSF skills |
| S4 | Twist generation from friction points | ✅ Done | Graph friction points become scenario twists that test adaptability |
| S5 | Scenario validation against vacancy blueprint | ✅ Done | validateScenarioAgainstVacancy() — coverage %, missing/extra skills |
| S6 | Store in Supabase: employer_scenarios table | ✅ Done | Stored via API route with validations |
| S7 | Dynamic selection: generated scenarios first, static fallback | ✅ Done | selectScenarios() accepts employerScenarios param, uses those first |

### Phase 1D — Employer Dashboard

| # | Task | Status | Notes |
|---|------|--------|-------|
| E1 | Seed material upload page | ✅ Done | Textarea on Scenarios tab — paste JDs, handbook, company desc |
| E2 | Processing status indicator | ✅ Done | Real-time status: "Analysing..." → "Done! X scenarios generated" with spinner |
| E3 | Generated scenarios preview | ✅ Done | Shows title, setting, characters, target skills for each scenario |
| E4 | Approve/reject/regenerate controls | ✅ Done | Regenerate with different seed material. Active badge shows scenarios in use. |
| E5 | Employer scenario library | ✅ Done | Graph summary (entities, relationships, friction points, critical skills) + scenario cards |

### Phase 1 Summary

| Sub-Phase | Tasks | Status |
|---|---|---|
| 1A Knowledge Graph | 6 | ✅ Complete |
| 1B Discovery Simulation | 7 | ✅ Complete |
| 1C Scenario Generation | 7 | ✅ Complete |
| 1D Employer Dashboard | 5 | ✅ Complete |
| **Total Phase 1** | **25** | **25 done (100%)** |

### 🎉 Phase 1 Complete — Employer-Specific Scenario Generation fully built.
**New API keys:** None
**Cost per employer:** ~$1-3 (Claude calls for graph extraction + discovery simulation + scenario generation. One-time per employer, scenarios reused.)

---

## Phase 2: Market Intelligence Layer (Pending Ryan Confirmation)

**What it is:** Large-scale labor market simulation using MiroFish swarm engine. Not employer-specific — industry-wide intelligence.

**What it requires:** Python microservice (MiroFish/OASIS), Zep Cloud account, Docker hosting, separate server.

**What it delivers:**
- Feed TESDA/DOLE/industry data → simulate labor market dynamics
- "Digital customer service demand rising 40% — add to assessments"
- "Remote collaboration is #1 PWD employment skill gap"
- Workforce planning tool for Virtualahan + employers
- Revenue stream: employers pay for market intelligence, not just hiring

**Why it's separate:** Different infrastructure, different scale (hundreds of agents vs 20-50), different product (intelligence reports vs assessment scenarios), different buyer (workforce planners vs hiring managers).

**What Ryan needs to confirm:**
1. Is market intelligence a near-term priority or future-state?
2. Budget for additional infrastructure (Python server ~$20-50/month, Zep Cloud)
3. Who is the buyer? Virtualahan internal? Employers? Funders?
4. What data sources are available? (TESDA reports, DOLE data, industry partnerships)
5. Is the AGPL-3.0 license acceptable? (MiroFish code — needs legal review if concerned)

**Estimated build time:** 6-8 weeks (after Phase 1 complete)
**New infrastructure:** Python/FastAPI server, Docker, Zep Cloud

---

*This is a living document. Updated as phases complete.*
*Last updated: April 14, 2026*
