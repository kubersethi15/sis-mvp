# SIS Post-MVP Improvements
## Items to address after Jakarta conference (April 13-16, 2026)
## Keep this updated as we find things during build and testing!

Last updated: March 15, 2026

---

## GATE 1 — ALIGNMENT

| # | Issue | Severity | Details | Found During |
|---|-------|----------|---------|--------------|
| G1-01 | SK mappings in JD parser not accurate | Medium | SK8 is Building Inclusivity, not Adaptability (should be SK5). Parser sometimes maps skills to wrong PSF IDs. Need to tighten the mapping logic in the JD parse prompt. | Testing with Cebuana Lhuillier Branch Staff JD |
| G1-02 | Requirement type tagging too broad | Low | "Can start ASAP" and "willing to work Sundays" tagged as "experience" — should be "availability" or "schedule". Need to add availability/schedule as a requirement type in the parser. | Testing with Cebuana Lhuillier Branch Staff JD |
| G1-03 | JobStreet screening questions not filtered | Low | Employer screening questions from JobStreet (salary expectations, qualifications, etc.) get included in the raw JD text. Not harmful but clutters the input. Could add a pre-filter to strip common job board boilerplate. | Testing with Cebuana Lhuillier Branch Staff JD |

---

## GATE 2 — LEEE CHATBOT

| # | Issue | Severity | Details | Found During |
|---|-------|----------|---------|--------------|
| | | | | |

---

## GATE 2 — EXTRACTION PIPELINE

| # | Issue | Severity | Details | Found During |
|---|-------|----------|---------|--------------|
| E-01 | EQ not extracted when present | Medium | Kuber's story had clear empathy signals (understanding client needs, making them feel heard, patience with closed client) but Emotional Intelligence was not extracted. Extraction prompt may need stronger EQ indicators for relationship-building contexts. | Testing with Kuber CSM story |
| E-02 | All skills scored at same level (Intermediate) | Medium | 4 skills all scored Intermediate. Problem-Solving evidence was arguably stronger than Collaboration evidence but both got same proficiency. Extraction should differentiate more between levels based on evidence strength. | Testing with Kuber CSM story |
| E-03 | Proficiency case sensitivity | Low | Extraction returned "Intermediate" (capital I) but PROFICIENCY_CONFIG expected "intermediate" (lowercase). Fixed with .toLowerCase() but extraction prompt should specify lowercase output. | Skills dashboard crash |
| E-04 | 5-stage pipeline latency | Medium | New 5-stage pipeline makes 5 sequential API calls (~15-30 sec total vs ~5 sec monolithic). Consider parallelising Stages 1+2 or using Sonnet instead of Opus for faster stages. | Architecture review March 17 |
| E-05 | Pipeline error recovery | Low | If Stage 3 fails, Stages 4-5 don't run and entire extraction fails. Should implement partial-result return so psychologist can review whatever stages completed. | Architecture review March 17 |
| E-06 | Old monolithic extraction prompt still in prompts.ts | Low | LEEE_EXTRACTION_PROMPT is still exported but no longer called by the API. Remove or mark as deprecated to avoid confusion. | Code review March 17 |

---

## GATE 3 — PREDICTABILITY

| # | Issue | Severity | Details | Found During |
|---|-------|----------|---------|--------------|
| | | | | |

---

## UX / DESIGN

| # | Issue | Severity | Details | Found During |
|---|-------|----------|---------|--------------|
| UX-01 | Kaya branding only on landing page | Medium | Inner pages (dashboards, reviewer, employer, psychologist) still use old amber/teal colour scheme. Need to extend Navy 900 / Stone 50 / Green 400 palette across all pages. | Branding pass March 17 |
| UX-02 | Bloom mark is CSS placeholder | Low | Using a CSS circle with green dot as the Kaya bloom mark. Need proper SVG of the 7-node network from brand guidelines. | Branding pass March 17 |
| UX-03 | Chat UI uses dark theme — needs Kaya alignment | Low | LEEEChat.tsx has its own living landscape dark theme which is intentional for the story experience. But the chrome around it (header, controls) should use Navy palette. Assess post-demo. | Branding pass March 17 |

---

## PSYCHOLOGIST VALIDATION

| # | Issue | Severity | Details | Found During |
|---|-------|----------|---------|--------------|
| | | | | |

---

## ACCESSIBILITY

| # | Issue | Severity | Details | Found During |
|---|-------|----------|---------|--------------|
| | | | | |

---

## PERFORMANCE / SCALABILITY

| # | Issue | Severity | Details | Found During |
|---|-------|----------|---------|--------------|
| | | | | |

---

## RESEARCH & ACCREDITATION

| # | Issue | Severity | Details | Found During |
|---|-------|----------|---------|--------------|
| | | | | |

---

## SUMMARY

| Category | Count |
|----------|-------|
| Gate 1 | 3 |
| Gate 2 — Chatbot | 0 |
| Gate 2 — Extraction | 6 |
| Gate 3 | 0 |
| UX / Design | 3 |
| Psychologist | 0 |
| Accessibility | 0 |
| Performance | 0 |
| Research | 0 |
| **Total** | **12** |
