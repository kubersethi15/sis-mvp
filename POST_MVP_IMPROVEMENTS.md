# Kaya — Improvements & Outstanding Items
## Updated: March 17, 2026
## Product: Kaya (kaya.work) by Virtualahan Inc.

---

## COMPLETED THIS SESSION (March 17, 2026)

| # | What | Source Doc | Details |
|---|------|-----------|---------|
| R12 | System prompt v2 full replacement | LEEE_PreSession_Context_and_SystemPrompt_v2.md | 7 saboteur response patterns, confidence-capability gap, thematic bridge v2, HIGH5-informed story selection, disability-as-evidence live, recently-diagnosed safety, capability-not-difficulty closing, contextual follow-up rules 7-9. Scenario trigger + Golden Rule preserved. |
| EX1-8 | 5-stage extraction pipeline | Internal Pipeline Prompts and Scoring Logic | Stage 1: Segmentation, Stage 2: STAR+E+R, Stage 3: Skill Mapping (16 PSF ESC), Stage 4: Consistency Check, Stage 5: Proficiency Scoring. Full audit trail. Psychologist review flags. Replaces monolithic prompt. |
| IMP-03 | Self-deprecation override — both layers | Ryan v2 | Aya probes past minimization live. Stage 3 scores behavior not self-assessment. Flagged for psychologist. |
| IMP-04 | Disability uplift (+0.1) | Ryan v2 + Pipeline | Stage 3 applies +0.1 to disability-navigating actions. Flagged in psychologist_review_flags. |
| IMP-05 | Vacancy-weighted extraction | Ryan v2 | Vacancy skills weighted in Stage 3 + highlighted first in Stage 5. |
| IMP-06 | All 16 PSF ESC in extraction | Pipeline doc | Expanded from 8 to 16. "not_assessed" for missing skills (not "low"). |
| IMP-07 | Cross-story reinforcement (+0.1) | Pipeline Stage 4 | Same skill across stories gets confidence bonus. |
| IMP-08 | Single-source penalty (-0.15) | Pipeline Stage 4 | Single evidence = penalised + flagged for psychologist. |
| IMP-09 | Evidence quality ceiling | Pipeline Stage 3 | behavioral=uncapped, situational=0.7, outcome_focused=0.6, self_descriptive=0.4. |
| IMP-10 | Anti-gaming cultural sensitivity | Pipeline Stage 4 | external_attribution = no penalty (pakikisama). rehearsed = -0.15. |
| BR1-7 | Kaya branding — all pages | Kaya_Brand_Guidelines_v1.0 | Navy 900 nav, Stone 50 background, Green 400 success states, Georgia wordmark. Applied to: landing, auth, profile, chat, my-dashboard, employer, employer-dashboard, reviewer, psychologist, vacancy, skills. All "SIS" references → "Kaya". |

---

## REMAINING — RYAN V2 DOC (LEEE_PreSession_Context_and_SystemPrompt_v2.md)

| # | Item | Status | Blocked? | Notes |
|---|------|--------|----------|-------|
| R2 | Structured disability context schema | ⬜ Todo | Ryan | Extend DB: severity, recently_diagnosed, communication_impact, accommodation_notes, sensitivity_level. |
| R4 | Psychometric data injection (full) | 🔶 Blocked | X7 | v2 prompt has all 7 saboteur instructions. Needs per-candidate JSON from Ryan's team. |
| R5 | Full saboteur injection per candidate | 🔶 Blocked | X7 | Same as R4. |
| R10 | Experience snapshot synthesis | ⬜ Todo | — | "most relevant role + notable achievement" computed from work history. |
| R11 | Self-reported challenges field | ⬜ Todo | — | Add challenges[] to schema + profile form. Ryan's doc shows 5 types. |
| R13 | Coverage matrix — UI integration | 🔶 Partial | — | runLightweightExtraction() exists. Needs UI to show real-time skill coverage. |
| R14 | Session timer + pace enforcement | ⬜ Todo | — | Enforce calibration pace targets in orchestrator. |
| R15 | Profile form — extended disability fields | ⬜ Todo | Ryan | Sensitive UX. Needs confirmed field spec. |
| R16 | Profile form — self-reported challenges | ⬜ Todo | — | Free-text or structured input. |

---

## REMAINING — PIPELINE DOC (Internal Pipeline Prompts and Scoring Logic)

| # | Item | Status | Notes |
|---|------|--------|-------|
| SIM1 | Load Joy Anne simulation as test fixture | ⬜ Next | Extract transcript from docs/LEEE_Full_Simulation_JoyAnne_Cebuana.md |
| SIM2 | Run Joy Anne through 5-stage pipeline | ⬜ Next | Compare actual output against Ryan's expected skills profile |
| PERF1 | Pipeline performance testing | ⬜ Todo | Measure 5-stage timing. Target <30s total. |

---

## REMAINING — KAYA BRAND GUIDELINES (Kaya_Brand_Guidelines_v1.0)

| # | Item | Status | Notes |
|---|------|--------|-------|
| BR8 | Bloom mark SVG | 🔶 Placeholder | CSS circle placeholder consistent across all pages. Needs proper SVG from design. |

---

## REMAINING — GENERAL BUILD

| # | Item | Status | Notes |
|---|------|--------|-------|
| S10 | Vercel deploy | ⬜ Todo | Live URL for demo. Next week. |
| U1 | Mobile responsive | ⬜ Todo | PH users are mobile-first. |
| U8 | Virtualahan branding for Jakarta | ✅ Done | Now Kaya branding. |
| T1-T9 | Testing with real data | ⬜ Todo | Ryan's 10 transcripts + 7 profiles. |
| O2 | Onboarding plan generation | ⬜ Todo | 30/90 day plan for selected candidates. |
| O3 | Manager handoff notes | ⬜ Todo | Support needs from Gate 3. |

---

## PREVIOUSLY LOGGED ISSUES

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| G1-01 | SK mappings in JD parser wrong | Medium | Open |
| G1-02 | Requirement type tagging too broad | Low | Open |
| G1-03 | JobStreet boilerplate not filtered | Low | Open |
| E-01 | EQ not extracted when present | Medium | Likely fixed by 5-stage pipeline — needs re-test |
| E-02 | All skills same proficiency level | Medium | Likely fixed by Stage 5 matrix — needs re-test |
| E-03 | Proficiency case sensitivity | Low | Fixed |

---

## SUMMARY

| Category | Done | Remaining | Blocked |
|----------|------|-----------|---------|
| Ryan v2 doc (R1-R16) | 8 | 6 | 2 |
| Pipeline doc (EX + SIM) | 8 | 3 | 0 |
| Kaya branding (BR1-8) | 7 | 0 | 1 (SVG) |
| Joy Anne simulation | 0 | 2 | 0 |
| General build | many | 8 | 0 |
| Previous issues | 1 fixed | 5 | 0 |
