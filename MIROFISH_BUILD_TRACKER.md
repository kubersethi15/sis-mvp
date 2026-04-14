# Kaya × MiroFish — Swarm Intelligence Integration Build Plan

## Feature: F1 Market Intelligence Layer
## Priority: High — transforms Kaya from manual to auto-generated employer-specific scenarios
## Started: April 14, 2026

---

## What This Does

When a new employer onboards to Kaya, instead of using our 3 generic scenarios, MiroFish will:

1. **Ingest employer seed material** — JDs, handbook excerpts, company description, industry context
2. **Build a knowledge graph** — entities (roles, departments, customers), relationships (reporting lines, friction points), dynamics (pressure situations, skill demands)
3. **Run swarm simulation** — hundreds of AI agents representing the employer's workplace interact, revealing which situations most differentiate high/low performers
4. **Generate assessment scenarios** — auto-create workplace simulation scenarios (characters, settings, rounds, checkpoints, twists) grounded in the employer's actual context
5. **Feed into Layer 2 engine** — the generated scenarios slot directly into our existing GameMaster + Sotopia-Eval + Managed Agents architecture

**Result:** A hospital gets patient-interaction scenarios. A bank gets compliance scenarios. A logistics company gets coordination-under-pressure scenarios. All discovered automatically from their own data.

---

## Architecture Decision: Microservice

MiroFish is Python/FastAPI. Kaya is Next.js/TypeScript. We run MiroFish as a **separate microservice** rather than porting to TypeScript:

- MiroFish depends on OASIS (Python), GraphRAG, and Zep Cloud — all Python-native
- AGPL-3.0 license: running as a separate service (not embedded) likely avoids open-sourcing Kaya
- Faster to stand up — we use MiroFish as-is and add a Kaya adapter layer
- Communication: Kaya → REST API → MiroFish microservice → response
- Deployment: Docker container alongside Kaya on same server or separate

**The adapter layer** translates between MiroFish's social media output (Twitter/Reddit posts) and our workplace simulation format (ScenarioConfig with characters, rounds, checkpoints).

---

## MiroFish 5-Step Pipeline (What We're Adapting)

| MiroFish Step | What It Does | Kaya Adaptation |
|---|---|---|
| 1. Ontology Generation | LLM analyses seed docs, generates domain ontology | Generate workplace skill ontology from JDs + handbook |
| 2. GraphRAG Construction | Extracts entities + relationships into knowledge graph via Zep | Extract workplace entities: roles, departments, customers, processes, friction points |
| 3. Environment Setup | Generates agent personas from graph, configures simulation | Generate workplace character personas (TinyTroupe format) instead of social media users |
| 4. Simulation Run | OASIS runs agents on Twitter/Reddit-style platforms | **KEY CHANGE:** Replace social media platforms with workplace interaction model |
| 5. Report Generation | ReportAgent synthesizes findings into structured report | Generate ScenarioConfig objects (our format) instead of prediction reports |

---

## Phase M1 — Infrastructure Setup

| # | Task | Status | Notes |
|---|------|--------|-------|
| M1.1 | Clone MiroFish repo, understand codebase | ⬜ Todo | Key files: graph_builder.py, oasis_profile_generator.py, simulation_runner.py, report_agent.py |
| M1.2 | Docker setup for MiroFish microservice | ⬜ Todo | MiroFish already has Docker support — adapt for our use case |
| M1.3 | Zep Cloud account setup | ⬜ Todo | Required for GraphRAG knowledge graph storage. Free tier available. |
| M1.4 | MiroFish → Kaya API bridge route | ⬜ Todo | /api/market-intelligence — sends employer data, receives scenario configs |
| M1.5 | Employer seed material upload UI | ⬜ Todo | Employer dashboard: upload JDs, handbook, company description |
| M1.6 | Environment variables on Vercel/server | ⬜ Todo | ZEP_API_KEY, MIROFISH_URL (microservice endpoint) |

---

## Phase M2 — Workplace Ontology Adapter

MiroFish's ontology generator creates domain concepts from seed material. We need it to produce **workplace-relevant** concepts, not social media trends.

| # | Task | Status | Notes |
|---|------|--------|-------|
| M2.1 | Custom ontology prompt for workplace context | ⬜ Todo | Override MiroFish's default prompt with workplace-focused extraction |
| M2.2 | Entity types: roles, departments, customers, processes | ⬜ Todo | Map MiroFish entities to workplace graph nodes |
| M2.3 | Relationship types: reports-to, collaborates-with, serves, depends-on | ⬜ Todo | Map MiroFish relationships to workplace graph edges |
| M2.4 | Skill demand extraction from JDs | ⬜ Todo | From the graph, identify which PSF skills are most critical for this employer |
| M2.5 | Friction point identification | ⬜ Todo | Where do things go wrong? Customer complaints, team conflicts, process failures |
| M2.6 | Test with 3 employer profiles (hospital, bank, logistics) | ⬜ Todo | Verify ontology quality across different industries |

---

## Phase M3 — Workplace Simulation Adapter

This is the biggest change. MiroFish simulates social media (Twitter/Reddit). We need **workplace interaction** instead.

| # | Task | Status | Notes |
|---|------|--------|-------|
| M3.1 | Custom OASIS platform: "Workplace" instead of Twitter/Reddit | ⬜ Todo | Agent actions: request-help, delegate, escalate, resolve, collaborate, report |
| M3.2 | Workplace agent personas from knowledge graph | ⬜ Todo | Generate TinyTroupe-format characters from graph entities |
| M3.3 | Situation injection: simulate realistic workplace scenarios | ⬜ Todo | Instead of "trending topic" inject "customer complaint" or "system outage" |
| M3.4 | Interaction rules: hierarchy, professional norms, Filipino culture | ⬜ Todo | Agents respect reporting lines, use honorifics, exhibit pakikiramdam |
| M3.5 | Round management adapted for assessment context | ⬜ Todo | 5-6 rounds, checkpoint evaluation points, twist injection |
| M3.6 | Run 50-agent workplace simulation per employer seed | ⬜ Todo | Discover: which situations create the most behavioral differentiation? |
| M3.7 | Differentiation scoring: which scenarios reveal skill differences? | ⬜ Todo | Score each emerging scenario by assessment value |

---

## Phase M4 — Scenario Generation (The Output)

MiroFish produces reports. We need it to produce **ScenarioConfig objects** that slot into our existing GameMaster.

| # | Task | Status | Notes |
|---|------|--------|-------|
| M4.1 | ScenarioConfig generator from swarm output | ⬜ Todo | Takes top-scoring situations, generates setting + characters + checkpoints + twists |
| M4.2 | Character generation from graph personas | ⬜ Todo | Map swarm agent profiles to our CharacterProfile interface |
| M4.3 | Checkpoint mapping to PSF skills | ⬜ Todo | Each checkpoint evaluates specific skills identified as critical for this employer |
| M4.4 | Twist generation from friction points | ⬜ Todo | Graph friction points become scenario twists that test adaptability |
| M4.5 | Scenario validation: does it test what the employer needs? | ⬜ Todo | Cross-reference generated scenario skills against vacancy competency blueprint |
| M4.6 | Store generated scenarios in Supabase per employer | ⬜ Todo | employer_scenarios table: employer_id, scenarios[], generated_at, source_graph |
| M4.7 | Dynamic scenario selection: use generated instead of static 3 | ⬜ Todo | selectScenarios() checks employer_scenarios first, falls back to static |

---

## Phase M5 — Employer Dashboard Integration

| # | Task | Status | Notes |
|---|------|--------|-------|
| M5.1 | Seed material upload page on employer dashboard | ⬜ Todo | Upload JDs (PDF/DOCX), handbook excerpts, company description |
| M5.2 | Processing status indicator | ⬜ Todo | "Analyzing your workplace... Building knowledge graph... Generating scenarios..." |
| M5.3 | Generated scenarios preview for employer review | ⬜ Todo | Show employer what scenarios their candidates will face — can approve/reject/edit |
| M5.4 | Employer-specific scenario library | ⬜ Todo | Employers accumulate scenarios over time, can select which to use |
| M5.5 | "Regenerate scenarios" button with different seed material | ⬜ Todo | Employer can iterate by adding more context |
| M5.6 | Market intelligence report view (bonus) | ⬜ Todo | "Based on your data, the skills that differentiate performers are: X, Y, Z" |

---

## Phase M6 — Integration + Testing

| # | Task | Status | Notes |
|---|------|--------|-------|
| M6.1 | End-to-end: employer uploads → MiroFish → scenarios → candidate simulation | ⬜ Todo | Full pipeline test |
| M6.2 | Quality comparison: generated vs hand-authored scenarios | ⬜ Todo | Run both through same candidates, compare extraction quality |
| M6.3 | Bias audit on generated scenarios | ⬜ Todo | Do generated scenarios disadvantage any demographic? |
| M6.4 | Cost monitoring per employer onboarding | ⬜ Todo | GraphRAG + simulation + generation costs |
| M6.5 | Fallback: if MiroFish fails, use static scenarios | ⬜ Todo | Graceful degradation — never block candidate flow |
| M6.6 | Documentation for employer onboarding flow | ⬜ Todo | What seed material to provide, how long processing takes, what to expect |

---

## Summary

| Phase | Tasks | Done | Status |
|-------|-------|------|--------|
| M1 Infrastructure | 6 | 0 | ⬜ First |
| M2 Workplace Ontology | 6 | 0 | ⬜ Planned |
| M3 Workplace Simulation | 7 | 0 | ⬜ Planned |
| M4 Scenario Generation | 7 | 0 | ⬜ Planned |
| M5 Employer Dashboard | 6 | 0 | ⬜ Planned |
| M6 Integration + Testing | 6 | 0 | ⬜ Planned |
| **Total** | **38** | **0** | **0% — Starting** |

---

## Dependencies

| Dependency | What | Status |
|---|---|---|
| MiroFish repo (AGPL-3.0) | Swarm intelligence engine | Available: github.com/666ghj/MiroFish |
| OASIS (CAMEL-AI) | Multi-agent simulation framework | Built into MiroFish |
| Zep Cloud | GraphRAG knowledge graph storage | Need account + ZEP_API_KEY |
| Python 3.11-3.12 | MiroFish runtime | Need on server |
| Docker | MiroFish containerization | Available |
| OpenAI API | LLM calls for ontology + persona generation | ✅ Already have key |
| Layer 2 engine | GameMaster, ScenarioConfig, CharacterProfile | ✅ Already built |

---

## Cost Estimate Per Employer Onboarding

| Step | Cost | Notes |
|---|---|---|
| GraphRAG construction | $0.50-2.00 | Depends on seed material size. One-time per employer. |
| Swarm simulation (50 agents, 20 rounds) | $3-8 | LLM calls per agent per round. One-time per employer. |
| Scenario generation | $0.50-1.00 | Generate 3-5 scenarios from swarm output. One-time. |
| Zep Cloud storage | Free tier or $0.01/query | Persistent graph storage. |
| **Total per employer** | **~$5-12** | One-time cost. Scenarios reused for all candidates. |

---

## Key Technical Risks

| Risk | Mitigation |
|---|---|
| MiroFish's social media model (Twitter/Reddit) doesn't map well to workplace | Phase M3: Custom OASIS platform with workplace-specific actions |
| Generated scenarios are too generic or unrealistic | Phase M4.5: Validation against vacancy competency blueprint + employer review |
| Zep Cloud dependency adds latency + cost | Can replace with Supabase pgvector if needed |
| AGPL-3.0 license concerns | Running as separate microservice (not embedded) — needs legal review |
| MiroFish v0.1.2 is early, may have stability issues | Phase M6.5: Fallback to static scenarios if generation fails |
| LLM costs scale with seed material size | Cap seed material at 50K chars, batch LLM calls |

---

## What This Unlocks

When complete, Kaya becomes the **only hiring platform in the world** where:
1. An employer uploads their company context
2. AI discovers which situations differentiate their best performers
3. Candidates enter employer-specific workplace simulations
4. Skills are assessed against the employer's actual needs, not generic rubrics

No competitor does this. SHL uses pre-authored assessments. HireVue uses generic interview questions. Mursion uses pre-designed VR scenarios. Workera tests knowledge, not behavior. **Kaya + MiroFish = the first AI-powered assessment that adapts to each employer's reality.**

---

*This is a living document. Updated as phases complete.*
*Last updated: April 14, 2026*
