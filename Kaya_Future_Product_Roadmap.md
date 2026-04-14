# Kaya — Future Product Roadmap

## Living document. Updated as new ideas, research, and direction emerge.

**Last updated:** April 14, 2026 | Kuber Sethi

**What this document is:** A running log of future product ideas, architectural directions, and strategic enhancements that sit beyond the current 4-sprint post-Jakarta plan. Each item captures the idea, why it matters, what it depends on, and rough effort. Items move from here into sprint plans when prioritized.

**What this document is NOT:** A committed build plan. Everything here is directional until Ryan confirms and we scope it.

---

## F1. Market Intelligence Layer (MiroFish-Powered)

| | |
|---|---|
| **Priority** | High — differentiates Kaya from every competitor |
| **Inspired by** | MiroFish swarm intelligence engine (54K GitHub stars, Shanda Group) |
| **Depends on** | Layer 2 simulation engine built first (Sprint 3) |
| **Effort** | 6-8 weeks (can run parallel to Layer 2 once engine exists) |
| **Phase** | Sprint 5-6 |

### The Idea

Port MiroFish's swarm intelligence engine into Kaya as a market intelligence layer. When a new employer onboards, Kaya doesn't just accept their JD — it analyzes their entire context and generates evidence-based simulation scenarios automatically.

### What It Does

**For each new employer:**
1. Employer uploads seed material: JDs, company handbook excerpts, industry reports, customer data, operational manuals, org structure
2. MiroFish-style GraphRAG builds a knowledge graph: entities (roles, departments, customers, processes), relationships (reporting lines, dependencies, friction points), and dynamics (pressure points, failure modes, skill demands)
3. Swarm simulation runs: hundreds of AI agents representing the employer's workforce, customers, and stakeholders interact in simulated scenarios
4. Intelligence output: "Here are the 5 situations that most differentiate high performers from low performers in this company. Here are the skills that matter most. Here are the scenarios Kaya should run."

**For ongoing market intelligence:**
1. Feed industry-wide data: TESDA reports, DOLE labor market data, JobStreet trends, Philippine industry reports, WEF skills data
2. Swarm simulates: how is the labor market shifting? What skills are emerging? Where are gaps widening?
3. Intelligence output: "Customer service roles are shifting digital-first — add digital communication fluency to assessments" or "Remote collaboration is the #1 skill gap for PWD employment — prioritize in Layer 2 scenarios"

### Why It Matters for Kaya

Current state: we manually design scenarios based on JDs and Ryan's domain expertise. This works for one employer but doesn't scale. When Kaya serves 50 employers across different industries, we can't hand-design scenarios for each one.

MiroFish solves this: the swarm discovers what matters by simulating the actual workplace dynamics, not by us guessing. Each employer gets scenarios grounded in their specific context — a hospital gets patient interaction scenarios, a bank gets compliance + customer scenarios, a logistics company gets coordination + time-pressure scenarios. All generated automatically from their seed material.

### What We'd Port From MiroFish

MiroFish is Python (FastAPI backend) with these key components:

| MiroFish Component | What It Does | How We'd Use It |
|---|---|---|
| `graph_builder.py` (18K) | Builds knowledge graph from seed docs via GraphRAG | Extract entities + relationships from employer data. Understand the workplace structure. |
| `oasis_profile_generator.py` (49K) | Generates agent personas from knowledge graph entities | Generate realistic workplace agent profiles for swarm simulation. |
| `ontology_generator.py` (19K) | Generates domain ontology from seed material | Discover which skills and sub-competencies matter for this employer/industry. |
| `simulation_runner.py` (68K) | Runs multi-agent simulation with round management | Run the workplace swarm to discover high-signal scenarios. |
| `report_agent.py` (97K) | Synthesizes simulation results into structured reports | Produce "here's what your workforce dynamics look like" intelligence reports. |

**Integration approach:** Run MiroFish's Python backend as a microservice alongside Kaya's Next.js app. Kaya's employer onboarding flow calls the MiroFish service with seed material, receives structured intelligence back, and uses it to configure Layer 2 scenarios automatically.

### The Flow

```
Employer uploads seed material (JDs, handbook, reports)
        ↓
MiroFish GraphRAG extracts entities + relationships
        ↓
Knowledge graph: roles, customers, processes, friction points
        ↓
Swarm simulation: hundreds of agents interact
        ↓
Intelligence report: "These 5 scenarios differentiate high performers"
        ↓
Kaya auto-generates Layer 2 simulation scenarios
        ↓
Candidate enters employer-specific workplace simulation
```

### What This Changes

- **Scenario design goes from manual to automated.** Ryan doesn't need to design scenarios for every employer. The swarm discovers what to test.
- **Every employer gets personalized assessment.** A hospital's scenarios feel like a hospital. A bank feels like a bank. Not generic.
- **Skills ontology becomes employer-specific.** Instead of only 16 PSF skills, the swarm discovers which sub-competencies matter for THIS employer. Feeds into Enhancement #3 (granular ontology).
- **Market intelligence becomes a product feature.** Employers don't just use Kaya for hiring — they use it to understand their own workforce dynamics and skill gaps. This is a separate revenue stream.

### Open Questions

- Do we run MiroFish as a separate Python microservice or port the core logic to TypeScript? Microservice is faster to stand up; porting is cleaner long-term.
- How much seed material does an employer need to provide? MiroFish works with any text, but more context = better scenarios. Minimum viable: 3-5 JDs + company description.
- Do we use MiroFish's Zep Cloud dependency or replace with Supabase? Zep adds cost but provides better graph memory. Evaluate based on quality difference.
- License: MiroFish is AGPL-3.0. If we run it as a separate service (not embedded in our codebase), AGPL likely doesn't require us to open-source Kaya. But needs legal review.

---

## F2. Skills Demand Forecasting

| | |
|---|---|
| **Priority** | Medium — valuable for Virtualahan program design |
| **Inspired by** | Workera's workforce intelligence analytics |
| **Depends on** | F1 (Market Intelligence Layer) |
| **Effort** | 2-3 weeks on top of F1 |
| **Phase** | Sprint 6-7 |

### The Idea

Use the market intelligence layer to forecast which skills will be in demand 6-12 months from now. Feed it TESDA announcements, DOLE labor market reports, industry hiring trends, employer JD patterns over time.

### Why It Matters

Virtualahan trains PWDs. If they can see that "digital customer service" demand is rising 6 months before the market peaks, they can adjust their training programs proactively. This turns Kaya from a hiring tool into a workforce planning tool. Funders (Ashoka, Cisco) would see this as systemic impact, not just individual placement.

### Output

- "Communication" demand is flat, but "Digital Communication" (sub-competency) is growing 40% quarter-over-quarter
- Top 3 emerging skill gaps for PWD employment: remote collaboration, digital fluency, async written communication
- Recommended Virtualahan curriculum additions based on forecasted demand

---

## F3. Employer Workforce Analytics Dashboard

| | |
|---|---|
| **Priority** | Medium — revenue opportunity |
| **Inspired by** | Workera's workforce intelligence; Eightfold's talent intelligence |
| **Depends on** | F1 + sufficient candidate volume |
| **Effort** | 4-6 weeks |
| **Phase** | Sprint 7-8 |

### The Idea

Aggregate (anonymized) skills data across all candidates to give employers workforce-level insights. Not just "here's this candidate's profile" but "here's what the talent pool looks like for your industry in this region."

### Output

- "73% of candidates in your region score Intermediate+ in Communication, but only 12% score Intermediate+ in Digital Fluency"
- "Your top skill gap vs. available talent: Problem-Solving under time pressure"
- "Candidates who completed Virtualahan's digital skills program score 1.8 proficiency levels higher in Digital Literacy"
- Benchmarking: "Your new hires' average skills profile vs. industry average"

### Revenue Model

This is the feature that makes Kaya a platform, not a tool. Employers pay for ongoing workforce intelligence, not just per-candidate assessment. Workera charges $40/user/year for similar capabilities. Kaya could offer this as a premium employer tier.

---

## F4. ASEAN Skills Portability

| | |
|---|---|
| **Priority** | High (long-term strategic) |
| **Inspired by** | AQRF (ASEAN Qualifications Reference Framework), TESDA Skills Passport |
| **Depends on** | Skills Passport v1 (Sprint 4), PQF alignment |
| **Effort** | 8-12 weeks (includes regulatory research) |
| **Phase** | 2027 |

### The Idea

A Filipino worker's Kaya skills passport is recognized across all 10 ASEAN member states through AQRF alignment. The skills profile maps to each country's national qualifications framework, enabling cross-border employment verification.

### Why It Matters

This is Ryan's biggest vision. 1.3 billion people with disabilities globally. The Philippines is one country. If Kaya's skills passport is portable, it scales across ASEAN (680M people) and eventually globally. This is the W3C Verifiable Credentials 2.0 + AQRF alignment play.

---

## F5. Voice-First Assessment Mode

| | |
|---|---|
| **Priority** | Medium |
| **Inspired by** | Workera's Talk for Sage (voice-based assessment, Aug 2025) |
| **Depends on** | Layer 1 voice mode (already built as /chat-voice) |
| **Effort** | 4-6 weeks for Layer 2 voice simulation |
| **Phase** | Sprint 5-6 |

### The Idea

Layer 2 simulations run via voice, not text. The candidate speaks to AI characters who speak back. Voice adds paralinguistic signals (tone, confidence, pace) that text can't capture. For PWDs with typing difficulties, voice removes a barrier.

### What Changes

- Character agents produce audio responses (TTS)
- Candidate speaks (STT → text → fed to character agents)
- Observer Agent gets both text transcript AND paralinguistic metadata (confidence, emotional activation, speech rate)
- Paralinguistic data adds a confidence modifier to behavioral scoring

---

## F6. Peer/360 Integration (Layer 3)

| | |
|---|---|
| **Priority** | Medium |
| **Inspired by** | Chamar's original Layer 3 design |
| **Depends on** | Layer 2 built, candidate has references |
| **Effort** | 4 weeks |
| **Phase** | Sprint 6-7 |

### The Idea

People who know the candidate (peers, community members, former colleagues, trainers, family) independently rate them on specific skills using a structured rubric. The system compares self-report (L1) + observed (L2) + peer-reported (L3) for maximum triangulation.

### What Changes

- Candidate provides 3-5 reference contacts
- System sends structured rubric (aligned to same PSF skills)
- References rate independently
- Three-layer convergence: L1 + L2 + L3 = highest confidence score

---

## F7. Training Impact Measurement

| | |
|---|---|
| **Priority** | High for Virtualahan's mission |
| **Inspired by** | Workera's Learning Velocity metric |
| **Depends on** | Growth Tracking (Enhancement #4 from Strategic Enhancements doc) |
| **Effort** | 2-3 weeks on top of growth tracking |
| **Phase** | Sprint 5 |

### The Idea

Pre/post Virtualahan program conversations measuring actual skill movement attributable to the training. "After 10-week Accenture digital skills training, average Communication score improved 1.8 proficiency levels."

### Why It Matters

This is the metric that proves Virtualahan's programs work. For funders, government partners, and Ashoka/Cisco — measured skills improvement is the strongest evidence of impact. Workera uses "Learning Velocity" (5-10 points/week standard, 10+ best-in-class) as their signature metric. Kaya's equivalent: Skills Velocity per Virtualahan cohort.

---

## F8. Open API for Government Integration

| | |
|---|---|
| **Priority** | Medium (depends on TESDA relationship) |
| **Depends on** | Skills Passport v1, TESDA discussions post-Jakarta |
| **Effort** | 4-6 weeks |
| **Phase** | 2027 |

### The Idea

TESDA, DOLE, CHED, or other government agencies can query Kaya's API to verify a candidate's skills profile. The skills passport becomes a government-recognized credential, not just a Virtualahan output.

---

## Tracking

| # | Feature | Status | Sprint | Depends On |
|---|---|---|---|---|
| F1 | Market Intelligence (MiroFish) | Planned | 5-6 | Layer 2 engine |
| F2 | Skills Demand Forecasting | Idea | 6-7 | F1 |
| F3 | Employer Analytics Dashboard | Idea | 7-8 | F1 + volume |
| F4 | ASEAN Portability | Vision | 2027 | Skills Passport v1 |
| F5 | Voice-First Layer 2 | Idea | 5-6 | Layer 2 engine |
| F6 | Peer/360 (Layer 3) | Designed | 6-7 | Layer 2 |
| F7 | Training Impact Measurement | Planned | 5 | Growth Tracking |
| F8 | Government API | Vision | 2027 | TESDA relationship |

---

*This is a living document. Add new items as they come up. Move items to sprint plans when prioritized with Ryan.*
