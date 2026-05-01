# Kaya — Mischel-Shoda Signature Redesign Design Document

**Status:** Design draft, feature branch `feature/mischel-signatures`
**Author:** Kuber Sethi (with Claude)
**Date:** April–May 2026
**Methodology basis:** Mischel & Shoda (1995, *Psychological Review*); Shoda, Mischel & Wright (1993, 1994); Fleeson (2001, *JPSP*); Whole Trait Theory (Fleeson & Jayawickreme, 2015)

---

## What problem this solves

The current LEEE pipeline produces holistic proficiency levels (Basic/Intermediate/Advanced) for each PSF skill at Stage 5. Two structural problems:

1. **Anchoring bias.** Whether numerical or labelled, a single ordinal output on a hierarchy creates automatic bias in employer cognition. The hiring manager sees "Intermediate Communication" and starts thinking in ranking terms before reading any evidence.

2. **Information loss.** The same person, in different situations, behaves differently — and that variation is the *most diagnostic information about them*. Compressing it into a single level discards exactly the information employers need to assess role fit.

Mischel and Shoda's resolution: the right unit of measure for human behavior is the **if-then conditional pattern** — *under situation features X, this person reliably does Y*. Patterns are stable. Patterns are individuating. Patterns survive the cultural-bias problem because they describe what the person does, not where they sit on someone else's scale.

The current pipeline already extracts the raw material for if-then signatures (STAR+E+R is a structured if-then). The redesign is mostly in Stage 5 output — replacing the holistic level call with a pattern extraction. Stages 1, 2, 4 are unchanged. Stage 3 gets one additive field.

---

## What changes — stage by stage

### Stage 1 — Segmentation
**No change.** Episode segmentation works correctly.

### Stage 2 — STAR+E+R extraction
**No change.** The Situation/Action structure already captures the if-then pairing in raw form. We just stop flattening it later.

### Stage 3 — Skill mapping
**Additive change only.** One new field on each mapping: `situation_features`. This is a structured tag set that captures the *psychological* features of the situation that activated the action — not just the situational_complexity scalar that already exists.

The features taxonomy (drawn from Shoda's later situation-perception research):

```
situation_features: {
  stakes: "low" | "moderate" | "high" | "personal",
  familiarity: "routine" | "non-routine" | "novel",
  power_position: "peer" | "junior" | "senior" | "mixed",
  emotional_intensity: "low" | "moderate" | "high",
  audience: "single-familiar" | "single-unfamiliar" | "group-familiar" | "group-unfamiliar" | "mixed",
  resource_conditions: "adequate" | "constrained" | "scarce",
  time_pressure: "none" | "moderate" | "acute",
  cultural_register: "same-culture" | "cross-culture" | "hierarchical" | "informal"
}
```

These are extracted as part of the existing Stage 3 pass. Cost is negligible — same LLM call, additional fields in the JSON output.

The existing schema (skill_name, transcript_quote, mapping_rationale, confidence, confidence_factors, cultural_context) is untouched. `situation_features` is added alongside.

### Stage 4 — Consistency check
**No change.** The cross-story reinforcement and contradiction checks still operate on the same mappings. They feed the signature extraction in Stage 5 with the same inputs they always did.

### Stage 5 — REWRITTEN
This is where the methodology lives.

**Old Stage 5 prompt does:**
- Take all validated mappings for each skill
- Hold them against the Basic/Intermediate/Advanced definitions
- Make a holistic call: which level does this person sit at for this skill?
- Output: one level per skill, plus a justification narrative

**New Stage 5 prompt does:**
- Take all validated mappings for each skill (where 2+ mappings exist)
- Look at the situation_features for each mapping
- Identify conditional patterns: what situation features reliably activate what kind of action?
- Output the if-then signatures, with evidence pointers and pattern strength
- For skills with only 1 mapping: surface as "observed once, not yet a pattern"
- For skills with 0 mappings: surface as "not assessed"

**Internally, a level *can* still be computed for filtering and threshold logic** (this is metadata only, never headline output to humans). The level is derived from the signatures — for example, "across multiple high-complexity situations, person consistently demonstrates independent option-generation" → maps to Intermediate-equivalent level for downstream filtering. But the score is no longer the unit of measure shown to anyone making a hiring decision.

---

## What the new output looks like

### Per-skill signature

```json
{
  "skill_name": "Communication",
  "evidence_count": 4,
  "patterns": [
    {
      "pattern_id": "P1",
      "if": {
        "audience": "single-unfamiliar",
        "stakes": "moderate-to-high",
        "topic_complexity": "technical"
      },
      "then": "structures information first, checks understanding before moving on",
      "supporting_narratives": ["EV03", "EV07", "EV12"],
      "support_count": 3,
      "pattern_strength": "strong",
      "contradictions": []
    },
    {
      "pattern_id": "P2",
      "if": {
        "emotional_intensity": "high",
        "message_valence": "unwelcome",
        "audience": "single-familiar"
      },
      "then": "names the emotion first, validates, then introduces new information",
      "supporting_narratives": ["EV05", "EV09"],
      "support_count": 2,
      "pattern_strength": "moderate",
      "contradictions": []
    },
    {
      "pattern_id": "P3",
      "if": {
        "power_position": "junior",
        "audience": "group-familiar"
      },
      "then": "defers initiation, listens for conversation structure, contributes specifically rather than generally",
      "supporting_narratives": ["EV02", "EV08", "EV14"],
      "support_count": 3,
      "pattern_strength": "strong",
      "cultural_marker": "kapwa-honoring deference — culturally adaptive behavior, not deficit",
      "contradictions": []
    }
  ],
  "single_observations": [
    {
      "observation": "Mediated between two relatives without speaking to them together first — different from cross-team-handoff pattern",
      "narrative": "EV11",
      "note": "Single instance. May indicate context-specific adaptation or measurement noise."
    }
  ],
  "internal_level_metadata": {
    "derived_level": "Intermediate",
    "derivation": "Multiple strong patterns observed across non-routine and high-emotional-intensity situations with independent action.",
    "use_for": "filtering and threshold logic only — not surfaced to employer"
  }
}
```

### Employer-facing rendering

The employer never sees the level metadata. They see the signature in human-readable form, supported by quoted evidence. The decision-support framing matches role requirements against the patterns observed:

- *Role requires unfamiliar-audience technical communication?* Pattern P1 evidenced across three contexts — strong fit.
- *Role requires leading senior stakeholders in unstructured discussions?* Not yet evidenced — interview probe recommended.
- *Role rewards initiative-taking with senior peers?* Pattern P3 suggests this person defers in junior position; check whether deference is contextual or persistent.

This is decision-supportive without being ranked.

---

## What's hard about this — explicitly

Three honest difficulties.

**1. Two narratives is the floor for a pattern.** A pattern needs at least two observations of similar situation features producing similar actions. With only one observation we have a data point, not a pattern. This means the conversation needs to surface multiple instances per skill across distinct situations — which the current Aya design partially supports but could be tuned for. Bridges between stories should explicitly probe contrast cases.

**2. Signature output is harder for hiring managers to scan than a label.** A label is a one-glance read. A signature requires reading. Mitigation: visual design (joint display format), employer training, and evidence drill-down on click. Acceptance: this asks more of the employer in exchange for materially better information.

**3. Inter-rater reliability for signature extraction is less established than for level scoring.** Mischel-Shoda is empirically validated as a description of behavior, but the LLM extraction of signatures from STAR+E+R is genuinely novel. The test-retest harness already built (scripts/validation/test-retest.ts) needs to be extended to measure pattern-level reliability across runs. We should expect — and verify — that pattern *content* is more stable across runs than levels were, because the underlying STAR+E+R is the same and signatures are descriptive not interpretive.

---

## Validation plan for the redesign

Three steps before deploying to production:

**Step 1 — A/B output comparison on existing transcripts.** Run both Stage 5 versions on the same set of 5–10 transcripts. Compare side by side. Does the signature output preserve the information the level conveyed, plus more? Does it surface insights the level obscured?

**Step 2 — Stability testing.** Extend the test-retest harness to evaluate pattern-level stability. Run the new Stage 5 five times on the same transcript. Measure: are the same patterns identified? Are the same narratives cited? Pass threshold: ≥80% pattern overlap across runs.

**Step 3 — Psychologist review.** The PRC psychologist (when recruited) reviews 5 candidate signatures against transcripts. Inter-rater reliability between LLM-extracted signatures and psychologist-extracted signatures. Cohen's κ ≥ 0.60 target.

Only if all three pass does the redesigned pipeline replace the current Stage 5 in production.

---

## Build effort and sequencing

Phase 1 (1 week, no blocker): Stage 5 prompt rewrite + Stage 3 schema addition. Standalone in this feature branch.

Phase 2 (3 days, no blocker): A/B test runner — given a transcript, runs both old and new Stage 5, outputs comparison.

Phase 3 (1 week, no blocker): Updated test-retest harness for pattern-level stability.

Phase 4 (1 week, blocker: psychologist recruited): Psychologist inter-rater study on 5 signatures.

Phase 5 (1 week, blocker: validation passes): Update EmployerSkillsReport to render signatures. Wire into employer-dashboard.

Phase 6 (1 week, blocker: signature output stable): Update Layer 2 Observer to test pattern reproduction in simulation rather than score convergence.

Phases 1–3 produce enough working infrastructure for Ryan and the team to evaluate the methodology on real transcripts. That's the gate before further investment.
