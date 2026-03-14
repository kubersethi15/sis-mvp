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
| | | | | |

---

## GATE 3 — PREDICTABILITY

| # | Issue | Severity | Details | Found During |
|---|-------|----------|---------|--------------|
| | | | | |

---

## UX / DESIGN

| # | Issue | Severity | Details | Found During |
|---|-------|----------|---------|--------------|
| | | | | |

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
| Gate 2 — Extraction | 0 |
| Gate 3 | 0 |
| UX / Design | 0 |
| Psychologist | 0 |
| Accessibility | 0 |
| Performance | 0 |
| Research | 0 |
| **Total** | **3** |
