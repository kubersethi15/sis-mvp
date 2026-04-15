# PROJECT TRUTH PACK

**What this document is:** The honest operating truth of the Kaya project. Not marketing. Not a pitch deck. Not polished for anyone. This is what someone inheriting this project — human or AI — needs to know to make good decisions.

**Last updated:** April 14, 2026

---

## 1. Vision and Mission

### What Kaya is fundamentally trying to change
Hiring in the Philippines (and globally) is broken for people with disabilities. The entire hiring funnel — resume screening, interviews, assessments — uses signals that correlate with able-bodiedness, not with capability. Kaya is trying to build an alternative evidence path: one where a person's actual skills are extracted from their lived experience, observed in realistic situations, and confirmed by people who know them, then presented to employers in a form they can trust.

### Why this matters
7.1 million Filipinos live with disabilities. Most are excluded from formal employment. Virtualahan trains PWDs but struggles to get them hired because employers don't trust non-traditional signals. The Philippine government has passed legislation (RA 12313) supporting recognition of prior learning, and the PSF provides a skills taxonomy. But there is no technology platform that operationalizes this for PWDs. Kaya is that platform.

### What long-term success looks like
Every employer in the Philippines can hire based on skills evidence rather than credentials. PWD candidates have a portable skills passport recognized by employers, TESDA, and ASEAN labor markets. Virtualahan can demonstrate measurable training impact to funders. The three-layer assessment model becomes a standard for inclusive hiring.

### What short-term success looks like
One real employer uses the system to hire one real PWD candidate based on the skills profile instead of a traditional interview. A psychologist endorses the methodology. Virtualahan can show a funder a cohort report demonstrating measurable skill improvement from their training program.

We are not there yet.

---

## 2. Core Product Thesis

### The strongest belief behind the product
People demonstrate skills through stories and behavior, not through test scores or credentials. If you can extract behavioral evidence from how someone actually handled a real situation, observe how they handle a simulated one, and confirm it through people who know them — you have a better signal than any interview or aptitude test.

### Why the team believes this should work
The Moth storytelling methodology is validated for eliciting authentic narratives. STAR+E+R is an established framework for behavioral evidence extraction. The Philippine Skills Framework provides a government-backed taxonomy. Multi-agent simulation (Sotopia-Eval, TinyTroupe) is an emerging but credible approach to behavioral observation. Three-source triangulation is a well-established psychometric principle.

The novel contribution is combining all of these into a single platform with anti-gaming at every layer, cultural grounding for the Philippine context, and psychologist validation for institutional credibility.

### What makes Kaya different
No existing tool combines all of: conversation-based skill extraction + multi-agent simulation + peer/360 validation + paralinguistic analysis + employer-specific scenario generation + cultural calibration + psychologist endorsement. SHL, HireVue, Mursion, Workera, and Pymetrics each do pieces. None do the full triangle.

**Honest caveat:** "Different" doesn't mean "better." The combination is theoretically stronger but hasn't been validated with real users at scale. Each individual component is at a different maturity level.

---

## 3. Problem Definition

### Specific failures in current hiring
- Resume screening filters out people without formal credentials, regardless of demonstrated capability
- Video/in-person interviews reward confidence performance, articulation fluency, and physical presentation
- Standardized assessments (SHL, Pymetrics) are designed for neurotypical, able-bodied candidates
- Reference checks are unstructured and superficial ("would you recommend this person?")
- There is no mechanism to capture skills from non-traditional experience (caring for a family member, managing a community project, navigating daily life with a disability)

### Traditional signals Kaya believes are flawed
- Formal education as a proxy for capability
- Interview confidence as a proxy for competence
- Physical presentation as a proxy for professionalism
- Continuous employment history as a proxy for reliability
- Fluent articulation as a proxy for intelligence

### Human-centric skills Kaya thinks are undervalued
The PSF 16 Enabling Skills, particularly: Emotional Intelligence, Communication, Collaboration, Problem-Solving, Adaptability, Learning Agility, Building Inclusivity, Sense Making. These are the skills that determine workplace success but are invisible in traditional hiring. They are often the strongest capabilities of people who have navigated life with a disability.

---

## 4. User Groups and Buyer Groups

### Job seekers
The primary beneficiary. PWDs and excluded talent who have skills but no way to prove them. They interact with Aya (conversation), do simulations, provide references. They receive a skills profile. They are not the buyer.

### Employers
The likely buyer. Companies that want to hire PWDs (CSR, diversity mandates, Virtualahan partnerships) or companies that want better hiring signals generally. They post JDs, review candidates through gates, make hiring decisions. They pay for the service (model TBD).

### Recruiters / Hiring Managers
The actual daily users on the employer side. They operate the three-gate pipeline. Their experience determines whether employers actually use the system.

### Psychologists
Validators. They review and endorse. They are not daily users. Their involvement is periodic and per-candidate or per-cohort. They need to be compensated. No pricing model exists for this yet.

### Virtualahan internal team
Ryan (product direction, conversation design, PSF expertise), Kuber (all technical implementation), Jazzel (Layer 2 simulation — originally separate, now absorbed into main build), Chamar (Layer 3 assessment — originally separate, now absorbed), Randy (Skills Passport consumer — downstream).

**Honest note:** The entire codebase has been built by one developer (Kuber). There is no engineering team. This is a strength (coherence, speed) and a risk (bus factor of 1).

### Future buyers / funders / ecosystem partners
Ashoka, Cisco (funders who need impact metrics), TESDA/DOLE (government partners who need skills data), other employers beyond the initial pilot. These are not users today but their needs shape the roadmap.

---

## 5. Real Current State

| Module | Status | Honest Assessment |
|---|---|---|
| Candidate onboarding/profile | **Built, usable** | Works. Profile creation, disability capture, language preferences. No real users yet. |
| Aya conversation (text) | **Built, demo-tested** | 7-stage state machine, 305-question bank, calibration, gap scanning. Demonstrated at Jakarta. Prompt quality is good. Not tested with real PWD candidates at volume. |
| Aya conversation (voice) | **Built, untested in production** | Whisper STT + OpenAI TTS + silence detection + auto-listen. Works in demo. Not tested on low-bandwidth Philippine mobile networks. |
| LEEE extraction pipeline | **Built, partially validated** | 5-stage pipeline produces structured output. Tested with simulated transcripts. Not validated against psychologist judgment. Test-retest reliability not measured. |
| Hume paralinguistic analysis | **Built, untested** | Integration complete. Hume API connected. Emotion → PSF mapping coded. Zero real voice sessions processed through it. |
| Micro-simulations / scenario cards | **Built, demo-tested** | Scenario cards work in text and voice. Generated from skill gaps. Evidence feeds extraction. Not tested with real candidates. |
| Layer 2 simulation engine | **Built, demo-tested** | GameMaster, 3 scenarios, Sotopia-Eval, convergence, gaming detection. Works in demo. Character realism and scenario validity not externally evaluated. |
| Employer scenario generation | **Built, untested** | Knowledge graph extraction, discovery simulation, ScenarioConfig generation. Zero real employer data tested. |
| Layer 3 / peer / reference | **Built, untested** | Rubric, reference page, convergence calculator, independence verification. Zero references have actually used the system. |
| Psychologist review | **Built, untested** | UI complete with L1+L2+L3 tabs, methodology, validation. No actual psychologist has used it. |
| Skills passport | **Not built** | No export format. No machine-readable credential. No QR verification. |
| Employer JD ingestion | **Built, usable** | Claude generates competency blueprint from JD. Works. Quality depends on JD quality. |
| Gate 1 alignment | **Built, demo-tested** | Alignment score + fit map. Works with demo data. |
| Gate 2 evidence review | **Built, demo-tested** | Shows extraction, skills, gaming flags. Reviewer can pass/hold/stop. |
| Gate 3 readiness | **Built, partial** | Shows simulation + convergence + L3. Decision flow works. |
| Matching logic | **Built, basic** | Alignment score against competency blueprint. Weighted by importance. No learning-to-rank. |
| Training impact | **Built, untested** | Growth engine, velocity, cohort analytics, funder reports. Zero real cohort data. |
| Analytics/admin/ops | **Not built** | No admin panel, no operational dashboard, no usage analytics, no error monitoring. |

---

## 6. Product Learnings So Far

### From Jakarta demo and testing
- **The conversation quality matters more than anything.** When Aya feels like a real conversation partner, people open up. When she feels like an interview bot, they give rehearsed answers. The Golden Rule prompt ("You are NOT interviewing") is the single most important design decision.
- **Filipino users naturally code-switch.** Taglish support isn't a nice-to-have, it's essential. Users mix English and Filipino mid-sentence. The system must handle this seamlessly.
- **The extraction pipeline works but is slow.** Five sequential Claude API calls take 30-60 seconds. Users need to know something is happening.
- **Scenario cards are engaging.** Users in demo responded well to the interactive dilemma cards during conversation. They broke up the "tell me a story" pattern and felt natural.
- **The three-gate pipeline confuses first-time reviewers.** The concept of three human checkpoints is strong but the UI needs better guidance — reviewers aren't sure what to look for at each gate.

### What Ryan believes works best
- Storytelling-based extraction over structured questioning
- Oblique skill measurement (never naming the skill being measured)
- Cultural grounding with SP concepts
- Psychologist endorsement as the trust mechanism
- Evidence from lived experience, not just work experience

### What feels weak or risky
- **Layer 2 scenario realism.** The pre-authored scenarios are generic. Employer-generated scenarios haven't been tested. If the simulation feels artificial, the behavioral evidence is less valid.
- **Layer 3 reference quality.** In Filipino culture, strong social bonds may produce uniformly positive references. The independence verification helps but may not be enough.
- **Extraction accuracy.** No formal validation against human judgment. If a psychologist reviews the extraction and disagrees with the skill mappings, the whole system's credibility is at risk.
- **Single-developer dependency.** Everything was built by one person. If Kuber is unavailable, no one else can maintain or extend the system.

### What surprised the team
- How much the voice system adds. Paralinguistic signals (genuine laughter, thoughtful pauses, emotional activation) provide information that text simply cannot capture.
- How well employer scenario generation works conceptually — the knowledge graph → discovery simulation → scenario generation pipeline produces surprisingly relevant scenarios from minimal seed material.
- How many features were needed beyond the core assessment — employer dashboards, reviewer workflows, psychologist validation, training measurement, reference collection. The assessment is maybe 40% of the product; the workflow is 60%.

---

## 7. Trust, Fairness, and Defensibility Model

### Bias the system explicitly tries to reduce
- Credential bias (scoring capability not credentials)
- Articulation bias (Aya prompt instructs: "eloquence of storytelling is IRRELEVANT to proficiency scoring")
- Communication style bias (bias audit tests across direct/indirect/formal/casual styles)
- Cultural bias (SP concepts embedded, Taglish support, Filipino workplace norms)
- Appearance/disability bias (no video, no physical assessment)

### Where bias could still enter
- **LLM training data bias.** Claude was trained primarily on English text. Its understanding of Filipino cultural norms comes from the prompt, not from lived experience. If the prompt is insufficient, it may misinterpret culturally-specific behavior.
- **Verbosity bias.** People who tell longer, more detailed stories may produce more evidence and higher scores. People with communication disabilities may produce less evidence, leading to lower confidence scores.
- **Literacy bias.** Text-based conversation favors literate users. Voice mode mitigates this but introduces accent bias.
- **Accent bias in Whisper.** OpenAI Whisper may transcribe non-standard Filipino English accents less accurately, degrading evidence quality.
- **Scenario cultural bias.** The three pre-authored scenarios are set in a financial services branch context. Candidates from other industries may feel less familiar with the setting.
- **Reference network bias.** Candidates with larger professional networks have more references to draw from. Candidates who are more isolated (common among PWDs) have fewer.

### What the psychologist is endorsing in practice
The psychologist reviews whether the extracted evidence supports the proficiency ratings. They are not conducting a clinical assessment. They are checking: does the evidence trail make sense? Are the skill mappings defensible? Are there red flags? This is a methodological endorsement, not a clinical diagnosis.

**What we are comfortable claiming:** The system produces a structured, evidence-based skills profile from behavioral data, validated through multiple independent sources.

**What we are NOT comfortable claiming:** That the scores are psychometrically valid. That they predict job performance. That they are equivalent to standardized assessments. These claims require formal validation studies that have not been conducted.

### Gaming concerns
- **Rehearsed stories in L1:** Mitigated by oblique questioning, specificity probes, cross-story verification. Not eliminated.
- **Performance in L2:** Harder to game than L1 because it requires real-time behavioral responses. But a candidate who does many simulations will improve.
- **Reference manipulation in L3:** Independence verification checks for coordination. But a candidate could coach references.
- **Voice gaming:** Flat affect detection flags emotionless delivery. But some disabilities affect voice tone, and the system must not penalize this. This is a genuine fairness tension.

---

## 8. Matching and Scoring Philosophy

### How matching should work conceptually
Matching is decision support, not decision making. The system should surface "here is the evidence, here are the gaps, here is how the three layers converge" — and let a human decide. It should not produce a single number that ranks candidates.

### What should matter most
Behavioral evidence from specific situations (not general claims). Layer 2 behavioral observation (what they did) should outweigh Layer 1 self-report (what they said). Layer 3 peer validation should confirm or challenge both. Confidence should be transparent — "we are 85% confident in this Communication score because we have strong evidence from two stories and a simulation" is better than just "Intermediate."

### How layers combine
Conceptually: L2 (0.40) + L3 (0.35) + L1 (0.25). Behavioral observation and peer validation weighted higher than self-report. This weighting is coded but not empirically validated. It reflects the design philosophy that what you do and what others see matters more than what you say.

### Current matching is basic
Alignment score = weighted match of candidate skills against vacancy competency blueprint. No machine learning. No collaborative filtering. No learning-to-rank. This is sufficient for MVP but will need sophistication if the platform serves hundreds of employers.

---

## 9. Business and Operating Model

### Likely buyer
Employers, specifically those with PWD hiring commitments (CSR, diversity mandates, Virtualahan partnerships). Virtualahan is the initial channel — they place candidates and need a system to support that process.

### End user
Job seekers (candidates doing assessments), employer reviewers (operating the gates), psychologists (validating profiles).

### Who runs it operationally
Today: Kuber builds and maintains everything. Ryan provides product direction and PSF expertise. No operations team exists. No customer support exists.

### Likely monetization
**Unknown and undecided.** Workera charges $40/user/year. Kaya's cost per assessment is approximately $1-3 in AI API calls. A per-assessment or per-hire fee to employers is the most likely model. Funder subsidies may cover the cost for initial deployments. This needs a business model decision.

### Human review burden
Every candidate requires: at least one reviewer at each gate (3 reviews minimum), a psychologist validation, and reference collection. At 100 candidates/month, that's 300+ reviewer actions and 100 psychologist validations. This is operationally heavy. The system needs to make each review as efficient as possible, and may need to explore cohort-level psychologist validation.

### Scaling risks
- Synchronous extraction (5 API calls per session) doesn't scale. Needs background processing.
- Single Vercel deployment. No horizontal scaling strategy.
- Psychologist bottleneck at volume.
- Reference collection dropout (getting 3-5 people to fill out a form is hard).
- Employer reviewer fatigue if the three-gate process feels too heavy.

---

## 10. Success Metrics

### KPIs that would prove Kaya works
- **Hiring conversion:** PWD candidates assessed through Kaya get hired at a higher rate than through traditional process
- **Employer satisfaction:** Employers report the skills evidence was useful for their decision
- **Extraction accuracy:** Psychologist agrees with ≥75% of skill mappings when reviewing the evidence trail
- **Score stability:** Same transcript re-analyzed produces scores within ±5%
- **Candidate completion:** ≥70% of candidates who start a session complete it
- **Layer convergence rate:** ≥60% of skills show convergence across L1+L2+L3 (full_agreement or partial agreement)
- **Training impact:** Measurable skill improvement (≥0.5 proficiency levels average) for Virtualahan cohorts

### Early signs that matter most
- A real employer uses the skills evidence in a real hiring decision
- A psychologist endorses the methodology without major revisions
- A PWD candidate reports "Aya understood my experience"
- Ryan says the extraction output matches his expert judgment

### What failure would look like
- Employers ignore the skills evidence and hire based on interviews anyway
- Psychologists reject the methodology as insufficiently rigorous
- Candidates find the process confusing, intimidating, or too long
- The extraction consistently misjudges skill levels when validated by experts
- The system penalizes candidates with certain disability types

---

## 11. Strategic Choices and Design Beliefs

### Why storytelling (Moth framework)
Stories produce richer behavioral evidence than direct questions. "Tell me about a time you handled something difficult" produces context, actions, emotions, and outcomes. "Rate your resilience from 1-10" produces nothing useful. The Moth methodology specifically trains people to share stakes, struggle, and shift — exactly the structure that reveals skills.

### Why STAR+E+R
STAR (Situation, Task, Action, Result) is established in behavioral interviewing. We added Emotion and Reflection because: Emotion reveals self-awareness and emotional intelligence (critical for PWD assessment). Reflection reveals learning agility and growth mindset. Together they capture not just what happened but what it meant to the person.

### Why PSF 16 skills
The Philippine Skills Framework is the government-backed taxonomy. Using it means Kaya's output is legible to TESDA, employers, and the education system. It also provides a shared language that the psychologist can validate against. We started with 8 (4 primary COMPASS + 4 secondary) for extractability; the pipeline references all 16.

### Why simulations
Self-report has inherent limitations — people may genuinely believe they're good at something they're not, or they may underestimate themselves. Observation in a realistic scenario reveals actual behavior. The simulation provides behavioral data that self-report cannot.

### Why psychologist signoff
Trust. An AI-generated skills profile is not enough for an employer to change their hiring behavior. A licensed professional reviewing the evidence trail and endorsing it creates institutional credibility. The psychologist is not scoring — they're auditing. This distinction matters.

### Why human checkpoints at every gate
The system is designed as decision support, not decision making. This is both ethical (AI should not determine someone's employment) and practical (employers won't trust fully automated hiring decisions for a novel system).

### Why employer-side job intelligence
Most JDs don't describe the human skills roles require. If the system only assessed candidates without also translating employer needs, the matching would be meaningless. The competency blueprint generation and scenario creation ensure that what's being assessed is what's being demanded.

---

## 12. Biggest Unresolved Questions

1. **Has the extraction been validated by a psychologist?** No. This is the single highest-priority validation. If a psychologist reviews the output and says "this doesn't hold up," we need to know immediately.

2. **What is the business model?** No pricing, no revenue model, no commercial strategy. This needs to be decided before approaching employers beyond Virtualahan's network.

3. **How do we handle the 8 vs 16 skills mismatch?** The taxonomy implements 8 skills in detail. The extraction prompts reference 16. Which is the source of truth? Should we expand or narrow?

4. **Does the system actually reduce bias?** We believe it does, but we haven't measured it. A formal fairness audit comparing outcomes across disability types, communication styles, and language preferences is needed.

5. **Will employers actually use a three-gate process?** It's more work than traditional screening. The value proposition must be compelling and the UX must be streamlined.

6. **Is the paralinguistic analysis fair to all disability types?** Voice emotion analysis may disadvantage people whose disability affects their voice tone. This is a genuine fairness tension that needs research.

7. **What does Randy need for the Skills Passport?** The format, schema, and verification mechanism haven't been defined. This is a downstream dependency that blocks the credentialing story.

8. **What happens when this isn't one developer?** The codebase is 23,475 lines written by one person. The architecture is coherent but there are no code reviews, no testing pipeline, and limited documentation of design decisions.

9. **Is the MiroFish market intelligence direction worth the infrastructure complexity?** Ryan hasn't confirmed. The simpler Phase 1 (employer-specific scenarios in our stack) is built. Phase 2 adds a Python microservice for large-scale labor market simulation. The value vs complexity tradeoff needs decision.

10. **How do we get real employer data to test scenario generation?** The engine is built but untested. We need an employer willing to provide JDs, handbook excerpts, and company context. Without this, we can't validate the feature.

---

## 13. What Kaya Really Is Today

Kaya is a working prototype of a three-layer skills assessment platform. It has a genuine conversation AI that draws out stories from people's lives, a 5-stage extraction pipeline that turns those stories into structured skill evidence, a multi-agent simulation engine that observes behavior under pressure, a peer validation system that cross-checks everything, and a training impact measurement system that proves programs work.

All of this runs on a real codebase — 77 source files, 23,475 lines, deployed to a real URL, using real AI services. It's not a mockup or a slide deck. It works.

But it has not been used by a real employer to make a real hiring decision. It has not been validated by a real psychologist. It has not been tested with real PWD candidates at scale. It has not been tested on real Philippine mobile networks. It does not have automated tests, error monitoring, or a scaling strategy.

The gap between "works in demo" and "changes how people get hired" is operational, institutional, and trust-based — not just technical. The technology is ahead of the validation. The next phase is not more features; it's proving that the features work with real people making real decisions.

The system was built by one developer in approximately 8 weeks, alongside Ryan's design direction and PSF expertise. It represents a significant technical achievement but also a significant bus factor risk. The documentation exists to mitigate this — but documentation does not replace a team.

Kaya has genuine potential. The three-layer design is theoretically sound. The cultural grounding is real. The technology is functional. What it needs now is not more code — it's real users, real validation, and real decisions about business model and operational sustainability.

---

*This document will be wrong in some details by next week. That's fine. Its purpose is not to be perfect — it's to be honest about where things actually stand, so that whoever reads it can make good decisions.*
