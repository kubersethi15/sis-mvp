# Kaya — Roadmap and Recommendations

## 1. Confirmed Roadmap Items (from trackers)

### Complete
| Feature | Tracker | Tasks | Status |
|---|---|---|---|
| Layer 1: LEEE Conversation + Extraction | BUILD_TRACKER.md | ~40 | ✅ Production-ready |
| Layer 2: Multi-Agent Simulation | LAYER2_BUILD_TRACKER.md | 38/38 | ✅ Complete |
| Voice System (V1-V6 + Hume AI) | VOICE_BUILD_TRACKER.md | 48/49 | ✅ Near-complete (browser testing) |
| Employer Scenario Generation (Phase 1) | SCENARIO_GEN_BUILD_TRACKER.md | 25/25 | ✅ Complete |
| Training Impact (F7) | F6_F7_BUILD_TRACKER.md | 14/14 | ✅ Complete |
| Peer/360 Layer 3 (F6) | F6_F7_BUILD_TRACKER.md | 13/14 | 🟡 Email notifications remaining |
| Three-Gate Pipeline | BUILD_TRACKER.md | ~20 | ✅ Production-ready |

### Pending External Decision
| Feature | Blocker | Source |
|---|---|---|
| Market Intelligence (F1 Phase 2) | Ryan to answer 5 questions | Kaya_Dynamic_Scenarios_For_Ryan.docx |
| Skills Demand Forecasting (F2) | Depends on F1 Phase 2 | Kaya_Future_Product_Roadmap.md |
| Employer Workforce Analytics (F3) | Depends on F1 + candidate volume | Kaya_Future_Product_Roadmap.md |

### Future (2027)
| Feature | Dependency | Source |
|---|---|---|
| ASEAN Portability (F4) | Skills Passport v1 + regional agreements | Kaya_Future_Product_Roadmap.md |
| Government API (F8) | TESDA relationship + Skills Passport | Kaya_Future_Product_Roadmap.md |

---

## 2. Likely Next Milestones

Based on current state and gaps:

**Milestone 1: First Real Employer Pilot (2-4 weeks)**
- Test employer scenario generation with actual company data
- Test three-gate pipeline with real reviewers
- Test reference collection with real people
- Fix any issues that emerge from real usage

**Milestone 2: Psychologist Pilot (1-2 weeks)**
- Get a licensed PRC psychologist to review the methodology
- Test validation workflow end-to-end
- Incorporate feedback into research anchoring document

**Milestone 3: Skills Passport v1 (2-3 weeks)**
- Define machine-readable format with Randy
- QR-verifiable credential
- Export functionality from candidate dashboard

**Milestone 4: Production Hardening (3-4 weeks)**
- Database migration tooling
- Error monitoring (Sentry)
- Rate limiting
- Automated test suite
- CI/CD pipeline

---

## 3. Architecture Improvements Recommended

### High Priority

**Database migrations.** Currently schema is a SQL file applied manually. Implement Prisma or Supabase CLI migrations. Every schema change should be version-controlled and reversible. Risk: schema drift between environments.

**Background job processing.** The 5-stage LEEE extraction runs synchronously in a Vercel function. This works now but will timeout for long sessions. Move extraction to a background job (Vercel Cron, Supabase Edge Functions, or a dedicated worker). Return a job ID and poll for completion.

**Error monitoring.** No observability exists. Add Sentry for error tracking, structured logging for API routes, and basic analytics for session quality metrics.

**Orchestrator persistence.** The in-memory `Map<string, LEEEOrchestrator>` is a fragility point. Cold starts lose state. The `rebuildOrchestrator()` function mitigates this but adds latency. Consider persisting orchestrator state to Supabase on every turn.

### Medium Priority

**Connection pooling.** Each API call creates a new Supabase client. Use a connection pool for production.

**Rate limiting.** No request throttling on any API route. Add basic rate limiting, especially on AI-intensive endpoints.

**Consolidate duplicate routes.** `/api/employer-graph` and `/api/employer-intelligence` overlap. Pick one.

**Skills taxonomy expansion.** Expand taxonomy from 8 to 16 skills to match extraction prompts. The mismatch between taxonomy file (8) and extraction prompt (16) is a data integrity concern.

### Low Priority

**TypeScript strict mode.** Enable strict null checks for better type safety.

**Component refactoring.** LEEEChat.tsx is 1,124 lines. Consider extracting scenario card logic, simulation UI, and message rendering into sub-components.

**Demo route refactoring.** demo/route.ts is 658 lines with business logic that should be in lib/. Extract into shared services.

---

## 4. Product Improvements Recommended

### High Priority

**Email/SMS notifications.** References need to receive invitation links. Candidates need application status updates. Add SendGrid or Resend integration. This unblocks the Layer 3 workflow for real usage.

**Session quality indicator.** During conversation, show the candidate a subtle indicator of how much evidence has been collected. "Keep going — Aya is learning about your skills" vs "Great — we have a good picture."

**Employer onboarding flow.** The current employer setup is spread across multiple pages. Create a guided wizard: Organization → Vacancy → Scenarios → Invite candidates.

### Medium Priority

**Skills Passport export.** Candidates should be able to download/share their skills profile as a PDF or machine-readable credential. This is what Randy needs for the HR Intelligence System.

**Multi-session intelligence.** When a candidate returns for a second conversation, Aya already uses previous session data. But the dashboard should clearly show: "Session 1: 4 skills evidenced. Session 2: 6 skills evidenced. Combined profile strength: High."

**Candidate feedback on declined applications.** When a candidate is declined at any gate, provide constructive, specific feedback about what evidence was missing and how they could improve.

### Low Priority

**Language preference.** Let candidates set preferred language (English/Filipino/Taglish) before starting, rather than auto-detecting.

**Session recording consent granularity.** Currently binary (consent to audio or don't). Consider: consent to transcription only, consent to emotion analysis, consent to storage for review.

---

## 5. Trust, Fairness, and Compliance Improvements

### High Priority

**Philippine Data Privacy Act compliance.** Document data processing, storage, retention, and deletion policies. Implement data subject rights (access, correction, deletion). Required for any real employer deployment.

**Formal fairness audit.** Implement disparate impact analysis: do candidates with certain disability types, communication styles, or language preferences score systematically different? The bias audit module tests scenarios but doesn't test across actual candidate demographics.

**Psychologist methodology review.** Before deploying to real employers, get written endorsement from at least one PRC-licensed psychologist confirming the methodology is sound.

### Medium Priority

**Explainability improvements.** When a candidate is scored, the evidence trail should be crystal clear: "This candidate scored Intermediate on Problem-Solving because of Episode 2 (they described solving a delivery routing issue under time pressure) and their simulation checkpoint 2 performance (they prioritized team coordination over speed)."

**Consent management.** Track what each user has consented to. If they consent to audio but not emotion analysis, respect that. If they withdraw consent, delete relevant data.

**Audit logging.** Record every reviewer decision, psychologist validation, and AI recommendation change. This creates an audit trail for compliance and dispute resolution.

### Low Priority

**Cultural fairness testing.** Test the system with candidates from different Philippine regions (Tagalog, Visayan, Mindanao) to ensure no regional bias in extraction or scoring.

**Right to explanation.** If a candidate is declined, they should be able to understand why. This may become a legal requirement under Philippine employment law.

---

## 6. Documentation Improvements

### High Priority

**README.md.** Currently empty. Write a comprehensive README covering: what the project is, how to set up locally, environment variables needed, database setup, how to run tests, deployment process.

**Supabase schema documentation.** Document every table, column, type, and relationship. Currently spread across types/index.ts and schema.sql with no single source of truth.

**API documentation.** Each of the 22 API routes should have documented request/response contracts. Consider generating from TypeScript types.

### Medium Priority

**Prompt versioning.** Prompts are currently inline in source files. Consider extracting to a prompts/ directory with version numbers. When prompts change, old versions should be preserved for debugging extraction differences.

**Decision log.** Document major architectural decisions (why Next.js, why Supabase, why not MiroFish for Phase 1, why in-our-stack approach, etc.) in an ADR (Architecture Decision Record) format.

### Low Priority

**Contributing guide.** If the team grows beyond one developer, document: code style, PR process, testing expectations, deployment process.

**Glossary normalization.** The codebase uses "SIS" and "Kaya" interchangeably, "LEEE" and "extraction" interchangeably. Pick canonical terms and update.

---

*Last updated: April 14, 2026*
