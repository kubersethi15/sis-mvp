# Kaya LEEE — Research Anchoring Document
## For: Licensed Psychologists Reviewing Skills Profiles
### Virtualahan Inc. | March 2026

---

## Purpose

This document provides the research and methodological basis for the Lived Experience Extraction Engine (LEEE), the core assessment component of the Kaya hiring intelligence platform. It is intended for licensed psychologists who are asked to review, validate, and endorse skills profiles produced by the system.

As a reviewing psychologist, you are not being asked to trust a black box. Every skill claim in a Kaya profile traces to a specific transcript quote, through a documented analytical pipeline, to a proficiency score. This document explains the frameworks, the scoring logic, and the safeguards that make that chain defensible.

---

## 1. Foundational Frameworks

### Philippine Skills Framework for Human Capital Development (PSF-HCD)
The PSF-HCD defines 16 Enabling Skills and Competencies (ESC) organized into three clusters: Interacting with Others, Staying Relevant and Evolving, and Generating Results. Kaya uses the PSF as its primary taxonomy, with proficiency levels aligned to the Philippine Qualifications Framework (PQF) Levels 1-6 mapped to Basic (PQF 1-2), Intermediate (PQF 3-4), and Advanced (PQF 5-6).

### Philippine Qualifications Framework (PQF)
The PQF provides the national standard for proficiency levels. Kaya's extraction pipeline scores skills against PQF-aligned behavioral descriptors, ensuring that a "Basic" rating in Kaya means the same thing as PQF Level 1-2 across any assessment context.

### RA 12313 — Lifelong Learning and Development for Filipinos (LLDF) Act
This legislation provides the legal basis for Recognition of Prior Learning (RPL) — the principle that skills acquired through non-formal and informal means deserve formal recognition. Kaya's approach to treating family, community, and informal work experience as equal evidence to formal credentials is grounded in this Act.

### World Economic Forum — New Economy Skills (2025)
The WEF report "Unlocking the Human Advantage" confirms the growing importance of human-centric skills in the labor market and provides global taxonomy alignment. Kaya's focus on skills like Emotional Intelligence, Collaboration, and Adaptability reflects WEF findings that these capabilities are increasingly valued but poorly measured.

---

## 2. Assessment Methodology

### The Moth Storytelling Framework
The LEEE uses an adapted version of The Moth storytelling structure (Seeds → Stakes → Struggle → Shift → Meaning) to elicit personal narratives. This is a deliberate design choice: storytelling surfaces behavioral evidence more naturally than direct questioning. When people tell stories, they describe what they actually did — the actions, decisions, and outcomes that constitute behavioral evidence — rather than what they think they should say.

### STAR+E+R Behavioral Evidence Framework
The extraction pipeline uses an extended STAR model:
- **S**ituation — context, environment, constraints
- **T**ask — the person's role, responsibility, or challenge
- **A**ction — what the person specifically did (the core behavioral evidence)
- **R**esult — what happened because of their action
- **E**ffect — broader impact beyond the immediate result
- **R**eplication — transfer and learning across contexts

The +E+R extension captures depth that standard STAR misses. Effect reveals the scope of impact. Replication reveals whether the capability transfers — a key indicator of higher proficiency.

### Competency-Based Assessment (CBA)
Kaya's approach aligns with established CBA principles: skills are assessed through observable behavioral evidence rather than self-report, credentials, or proxies. Every skill claim must be supported by a specific transcript quote showing what the person did, not what they said they can do.

---

## 3. The 5-Stage Extraction Pipeline

The extraction runs as five sequential analytical stages, each producing auditable output:

**Stage 1 — Narrative Segmentation:** The conversation transcript is broken into discrete episodes, each rated for specificity (vague, moderate, specific). Only episodes with moderate or specific grounding proceed. This filters out general statements and self-descriptions.

**Stage 2 — STAR+E+R Evidence Extraction:** Each episode is decomposed into structured evidence items with quality tags (behavioral, situational, self-descriptive, outcome-focused), situational complexity (simple, moderate, complex), and action independence (guided, independent, leading).

**Stage 3 — Skill Mapping:** Evidence items are mapped to the 16 PSF Enabling Skills with confidence scores (0.0-1.0). Confidence is bounded by evidence quality: behavioral evidence has no ceiling, situational evidence caps at 0.7, self-descriptive caps at 0.4. A disability experience uplift of +0.1 is applied when relevant, recognizing that capability demonstrated under significantly greater constraint is stronger evidence. A self-deprecation override ensures that cultural minimization patterns (common in Filipino culture as "hiya") do not reduce scores.

**Stage 4 — Consistency Check:** Cross-story reinforcement (+0.1 bonus when the same skill appears in multiple stories), single-source penalty (-0.15 when only one evidence item supports a skill), contradiction detection, and anti-gaming review with cultural sensitivity (external attribution alone receives no penalty, as it may reflect pakikisama or utang na loob rather than fabrication).

**Stage 5 — Proficiency Scoring:** Validated evidence is scored against the PQF-aligned proficiency matrix. Basic requires simple situations with guided action. Intermediate requires moderate complexity with independent judgment. Advanced requires high complexity with leading/strategic action across multiple stakeholders. Skills without sufficient evidence are reported as "not assessed" rather than scored low.

---

## 4. Safeguards and Flags

### What Gets Flagged for Your Review

Every Kaya skills profile includes a `psychologist_review_flags` section. These are the situations where the automated pipeline made a judgment call that requires human validation:

- **Self-deprecation override applied:** The person minimized their own contribution (e.g., "hindi naman special yun") but the described behavior warranted a higher score. The pipeline scored the action, not the self-assessment. You should review whether the transcript evidence supports the higher score.

- **Disability uplift applied:** A +0.1 confidence bonus was applied because the person demonstrated capability while managing disability-related challenges. You should review whether the uplift is proportionate to the additional constraint.

- **Single-source penalty applied:** Only one evidence item supports a skill. The pipeline applied -0.15 and recommends further evidence in Gate 3. You should consider whether the single instance is strong enough to stand alone or genuinely needs corroboration.

- **Anti-gaming flag:** The pipeline detected a pattern (too-linear narrative, rehearsed language, or absence of failure/difficulty) that may indicate fabricated or coached responses. You should review the flagged episodes.

### What You Are Endorsing

When you validate a Kaya skills profile, you are endorsing that:
1. The methodology described above is psychometrically sound
2. The evidence trail (transcript quote → STAR+E+R → skill mapping → proficiency) is traceable and defensible
3. The scoring adjustments (overrides, uplifts, penalties) were appropriately applied
4. The profile is a fair representation of the person's demonstrated capabilities within the 12-18 minute assessment window

You are NOT endorsing that the person has definitively proven these skills for all time, or that the 12-18 minute window captured all their capabilities. The LEEE is one data source in a three-gate assessment process.

---

## 5. Limitations

- The LEEE captures a 12-18 minute window. Many real skills simply don't come up. "Not assessed" is the honest answer, not "absent."
- Self-reported narratives are inherently subjective. The three-gate model (conversation + simulation + interview) is designed to triangulate across methods.
- Cultural patterns (hiya, pakikisama) may affect how stories are told. The pipeline accounts for these but cannot eliminate all cultural variance.
- The system has not yet undergone formal psychometric validation (e.g., construct validity studies, large-sample DIF analysis). This is planned for the post-pilot phase.

---

## 6. References

1. Philippine Skills Framework for Human Capital Development Version 1.0. Department of Labor and Employment (DOLE), Technical Education and Skills Development Authority (TESDA), Commission on Higher Education (CHED).
2. Philippine Qualifications Framework. Republic Act No. 10968.
3. Lifelong Learning and Development for Filipinos Act. Republic Act No. 12313.
4. World Economic Forum. (2025). New Economy Skills: Unlocking the Human Advantage.
5. The Moth. Storytelling methodology. 25+ years of narrative practice.
6. Campion, M. A., Palmer, D. K., & Campion, J. E. (1997). A review of structure in the selection interview. Personnel Psychology, 50(3), 655-702. [Behavioral interviewing foundations]
7. Spencer, L. M., & Spencer, S. M. (1993). Competence at Work: Models for Superior Performance. John Wiley & Sons. [Competency-based assessment]
8. Gersava, R. (2026). LEEE Quality Architecture v1 + Pre-Session Context Injection v2. Virtualahan Inc. [Internal methodology documents]

---

*Version 1.0 — March 2026*
*Prepared by: Kuber Sethi (Technical Architect) and Ryan Gersava (SIS Design Lead)*
*For: Virtualahan Inc. Psychologist Review Panel*
