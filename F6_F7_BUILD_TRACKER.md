# Kaya — F6 Layer 3 (Peer/360) + F7 Training Impact Build Plan

## Started: April 14, 2026

---

## F6: Peer/360 Integration (Layer 3)

**What:** People who know the candidate independently rate them on the same PSF skills. Three-layer convergence: L1 (self-report) + L2 (simulation observed) + L3 (peer-reported) = highest confidence.

### Phase L3A — Reference Collection + Rubric

| # | Task | Status | Notes |
|---|------|--------|-------|
| L3.1 | Candidate provides 3-5 reference contacts | ⬜ Todo | Name, relationship, email/phone on profile or dashboard |
| L3.2 | Structured rubric aligned to PSF skills | ⬜ Todo | Same skills as L1+L2. Questions like "How does this person handle stress? Give an example." |
| L3.3 | Rubric adapts to candidate's L1+L2 results | ⬜ Todo | Focus questions on skills where L1/L2 diverge or confidence is low |
| L3.4 | Reference invitation system | ⬜ Todo | Unique link per reference. No login needed. Mobile-friendly. |
| L3.5 | Reference submission page (/reference) | ⬜ Todo | Clean, simple, 5-10 min. Explains what Kaya is and why their input matters. |

### Phase L3B — Three-Layer Convergence

| # | Task | Status | Notes |
|---|------|--------|-------|
| L3.6 | Store reference responses in Supabase | ⬜ Todo | peer_assessments table: candidate_id, reference_id, skill_ratings, examples, submitted_at |
| L3.7 | Three-layer convergence calculator | ⬜ Todo | Compare L1 + L2 + L3 per skill. Weighted: L2 (0.4) + L3 (0.35) + L1 (0.25) |
| L3.8 | Convergence report: L1 vs L2 vs L3 | ⬜ Todo | Visual: 3-column comparison per skill with agreement indicators |
| L3.9 | Confidence adjustment from L3 data | ⬜ Todo | All agree = +0.15, L3 disagrees = flag for review, undersell pattern = boost |
| L3.10 | Anti-gaming: reference independence verification | ⬜ Todo | Check IP addresses, submission timing, response similarity across references |

### Phase L3C — Reviewer + Psychologist Views

| # | Task | Status | Notes |
|---|------|--------|-------|
| L3.11 | Reviewer Gate 3: Layer 3 evidence section | ✅ Done | Three-column L1/L2/L3 comparison with convergence type + independence flags |
| L3.12 | Psychologist: Layer 3 audit trail tab | ✅ Done | Full convergence table, notes, independence verification, methodology |
| L3.13 | Candidate dashboard: reference status | ✅ Done | References quick action card on dashboard. /references page link. |
| L3.14 | Email/SMS notifications to references | ⬜ Todo | Needs email provider (SendGrid/Resend). Share link manually for now. |

### F6 Summary

| Sub-Phase | Tasks | Status |
|---|---|---|
| L3A Reference + Rubric | 5 | ⬜ |
| L3B Convergence | 5 | ⬜ |
| L3C Views | 4 | ⬜ |
| **Total F6** | **14** | **0 done** |

---

## F7: Training Impact Measurement

**What:** Pre/post Virtualahan program skills measurement. "After the 10-week program, average Communication improved 1.8 levels." This is the metric that proves training works.

### Phase TI-A — Growth Tracking Infrastructure

| # | Task | Status | Notes |
|---|------|--------|-------|
| T1 | Skills snapshot storage per session | ⬜ Todo | Each LEEE extraction already stores skills_profile. Need comparison logic. |
| T2 | Session tagging: pre-training vs post-training | ⬜ Todo | Tag sessions with program_id, phase (pre/post/during), cohort_id |
| T3 | Skills delta calculator | ⬜ Todo | Compare profile at time T1 vs T2. Per-skill: direction, magnitude, confidence change |
| T4 | Skills Velocity metric | ⬜ Todo | Points/week improvement rate. Workera benchmark: 5-10 standard, 10+ best-in-class |
| T5 | Growth tracking API route (/api/growth) | ⬜ Todo | get_trajectory, compare_sessions, calculate_velocity, cohort_summary |

### Phase TI-B — Cohort Analytics

| # | Task | Status | Notes |
|---|------|--------|-------|
| T6 | Cohort creation + management | ⬜ Todo | Group candidates by program (e.g. "Accenture Digital Skills Q2 2026") |
| T7 | Cohort skills dashboard | ⬜ Todo | Aggregate: avg improvement per skill, distribution, top movers, lagging skills |
| T8 | Individual growth trajectory view | ⬜ Todo | Candidate sees their own skills over time — line chart per skill |
| T9 | Trainer/program manager dashboard | ⬜ Todo | Which programs produce the most improvement? Which skills move most? |
| T10 | Export: cohort impact report (PDF/DOCX) | ⬜ Todo | "Cohort X: 15 graduates, avg 2.1 level improvement in Communication, 1.8 in Collaboration" |

### Phase TI-C — Integration

| # | Task | Status | Notes |
|---|------|--------|-------|
| T11 | Pre-training conversation prompt | ⬜ Todo | Aya session tagged as "baseline" — focuses on current capability snapshot |
| T12 | Post-training conversation prompt | ⬜ Todo | Aya session tagged as "post" — asks about what they learned, how they've grown |
| T13 | Automated comparison on post-training extraction | ⬜ Todo | When post-training extraction completes, auto-run delta calculation |
| T14 | Funder report template | ⬜ Todo | "Virtualahan [Program]: X participants, Y% showed measurable improvement, avg Z levels" |

### F7 Summary

| Sub-Phase | Tasks | Status |
|---|---|---|
| TI-A Growth Tracking | 5 | ⬜ |
| TI-B Cohort Analytics | 5 | ⬜ |
| TI-C Integration | 4 | ⬜ |
| **Total F7** | **14** | **0 done** |

---

## Combined Summary

| Feature | Tasks | Done | Status |
|---|---|---|---|
| F6 Peer/360 (Layer 3) | 14 | 13 | 🟡 L3.14 (email notifications) needs email provider |
| F7 Training Impact | 14 | 7 | 🟡 TI-B (cohort dashboard UI) + TI-C (integration) remaining |
| **Total** | **28** | **20** | **71% complete** |

---

*Last updated: April 14, 2026*
