# Kaya — High-Level System Summary

## What Kaya Does

Kaya is an AI-powered platform that helps people with disabilities get hired based on what they can actually do, not how they look, speak, or present in a traditional interview.

A deaf person who is a brilliant problem-solver. A wheelchair user who leads teams effortlessly. A person with a speech impediment who is deeply empathetic. Traditional hiring filters these people out. Kaya finds what they're capable of and proves it with evidence.

## Why It Matters

In the Philippines, 7.1 million people live with disabilities. Most are excluded from formal employment not because they lack skills, but because hiring processes rely on signals that discriminate: confidence performance in interviews, physical appearance, fluent articulation, formal credentials. Kaya replaces these biased signals with a validated skills profile built from three independent sources of evidence.

## Who Uses It

- **Job seekers** — particularly PWDs and people without formal credentials who have real skills
- **Employers** — who want to hire based on capability rather than appearances
- **Virtualahan** — the social enterprise that trains PWDs and needs to prove their programs work
- **Psychologists** — who validate the assessment and give it professional credibility
- **Funders** — who need evidence that the system creates real impact

## How the Three-Layer Assessment Works

### Layer 1: The Conversation
The job seeker talks to Aya, an AI assistant, through text or voice. Aya doesn't interview — she has a conversation. She draws out stories from the person's life: "Tell me about a time something went wrong and you had to figure it out." From these stories, the system extracts behavioral evidence of skills like problem-solving, communication, resilience, and collaboration.

The conversation is culturally grounded in Filipino context — Aya understands Taglish, uses respectful language (po/opo), and recognizes that indirect communication styles are culturally normal, not a weakness.

After the conversation, a 5-stage AI pipeline analyzes the transcript and produces a skills profile mapped to the Philippine Skills Framework.

### Layer 2: The Simulation
The job seeker enters a workplace simulation — a realistic scenario with AI characters who have their own personalities and agendas. For example: it's Friday afternoon at a branch counter, a customer discovers they were double-charged, a new colleague is watching, and the supervisor is on a call. What does the candidate do?

The system watches what they actually do (not what they say they would do) and scores their behavior across 7 dimensions. It then compares: does what they demonstrated in the simulation match what they told Aya about themselves?

### Layer 3: The References
People who know the candidate — former colleagues, trainers, community leaders, family — independently rate them on the same skills. The system compares all three layers:
- **All three agree** → highest confidence
- **Candidate undersells** (L2+L3 higher than L1) → common with modest people, confidence goes up
- **Candidate overclaims** (L1 higher than L2+L3) → flagged for review

You can rehearse answers for Layer 1. You might game a simulation in Layer 2. But you cannot fake what 5 independent people say about you in Layer 3.

## How Employers Use It

An employer posts a job description. Kaya analyzes it and identifies which human-centric skills the role requires. Candidates are matched against these requirements using evidence from all three layers.

The employer reviews candidates through three gates, each with a human reviewer:
- **Gate 1** — Does this person align with the role?
- **Gate 2** — Is there sufficient evidence of their capabilities?
- **Gate 3** — Can we predict they'll succeed? (simulation + references + convergence)

Every gate shows the AI's recommendation plus the evidence behind it. The human always makes the final decision.

Employers can also upload their own company context (job descriptions, handbook, company description) and the system generates workplace simulation scenarios specific to their actual workplace — a hospital gets patient scenarios, a bank gets compliance scenarios.

## How the Skills Passport Works

The output of all three layers is synthesized into a structured skills profile that includes: proficiency level per skill, evidence snippets, confidence scores, convergence data, and methodology documentation. A licensed psychologist reviews the full audit trail and endorses it.

This skills passport is designed to be portable — a candidate assessed once can use their profile for multiple job applications.

## High-Level Architecture

The system is built as a Next.js web application with a Supabase (PostgreSQL) database. AI services include Anthropic Claude (conversation and extraction), OpenAI (voice transcription and synthesis), Hume AI (emotion analysis from voice), and Google Gemini (fallback). It deploys to Vercel.

## Major Technologies
- Next.js 14 + TypeScript (web application)
- Supabase (database + authentication)
- Anthropic Claude API (conversation, extraction, simulation)
- OpenAI Whisper (speech-to-text for Taglish)
- OpenAI TTS (text-to-speech for Aya and characters)
- Hume AI (paralinguistic emotion analysis — 48 dimensions)
- Vercel (deployment)

## Current Stage

Advanced MVP. The core assessment pipeline (all three layers) is built and functional. The system has been demonstrated at the Jakarta conference (April 2026). It has not yet been used with real employers or real psychologists at scale. The employer scenario generation feature is built but untested with real company data.

## Roadmap Themes
1. **Market intelligence** — simulate the Philippine labor market to forecast skills demand (pending decision)
2. **Skills Passport v1** — machine-readable, QR-verifiable credential
3. **ASEAN portability** — cross-border skills recognition (2027)
4. **Government integration** — TESDA/DOLE API for credential verification (2027)
5. **Production hardening** — automated tests, error monitoring, database migrations

## Simple Process Flow

```
Job Seeker                          Employer
    │                                   │
    ▼                                   ▼
 Creates Profile                  Posts Vacancy
    │                              (auto-generates
    ▼                               skill blueprint)
 Talks to Aya                         │
 (voice or text)                      │
    │                                 │
    ▼                                 │
 Skills Extracted                     │
 (5-stage AI pipeline)                │
    │                                 │
    ▼                                 │
 Applies to Job ◄────────────────────►│
    │                                 │
    ▼                                 ▼
 Gate 1: Alignment ──── Reviewer decides
    │
    ▼
 Gate 2: Evidence ───── Reviewer decides
    │
    ▼
 Workplace Simulation
 (Layer 2)
    │
    ▼
 References Rate
 (Layer 3)
    │
    ▼
 Gate 3: Convergence ── Reviewer decides
    │
    ▼
 Psychologist Validates
    │
    ▼
 Skills Passport Issued
```
