# Kaya — Consensus Infrastructure for Human-Centric Skills

**Status:** Design draft, feature branch `feature/mischel-signatures`
**Authors:** Kuber Sethi (engineering), Ryan Gersava (vision), with Claude
**Date:** April–May 2026

---

## What Kaya actually is

Kaya is not a measurement platform. It is **consensus infrastructure for human-centric skills**.

The reframe matters. Measurement implies we have invented a new scale and the right question is "who decided this scale is correct?" That question is unanswerable in any way that survives skeptical review of a novel instrument, and it's the wrong question regardless. Human-centric skills are not new. Empathy is real. Resilience is real. Communication, problem-solving, adaptability — all real. People already privately recognise who has these and who doesn't. What has been missing is **shared, transferable, network-validated agreement** about what those skills look like and how to recognise them across contexts.

The skills aren't new. The agreement is.

This is how money works. Money doesn't get measured into existence — it gets agreed into existence. Language works the same way. So does law. None of these are validated by correspondence to a deeper ground truth. They function because enough nodes in a network treat them as real, in structured ways, with reliable protocols. Once enough nodes agree, the consensus *becomes* infrastructure.

Kaya is that infrastructure for human-centric skills. The platform's job is not to "measure" empathy or score collaboration. Its job is to produce structured representations of someone's behavior that a network of nodes — the candidate, an AI extraction system, a psychologist, an employer, an accreditor — can converge on. Convergence is the goal. The output of the system is a proposal that enables that convergence.

This single reframe dissolves the bias problem Ryan identified. There is no "scale" creating automatic anchoring bias. There is no level being assigned. There is a structured representation of behavior, presented to multiple parties who must each recognise themselves, the candidate, or the role in it. Bias becomes detectable as failure of convergence, not invisible inside a number.

It also reframes the validation pathway. The primary question is not *"is this instrument correct?"* — that question requires a ground truth that doesn't exist. The primary question is *"does this protocol reliably produce agreement among the parties who need to agree?"* That question is empirically answerable. It is exactly what Ryan plans to test at the AI for Inclusion event — show employers Kaya's output for employees they already know, ask whether the representation matches what they already privately know. That is not validating an instrument. That is testing whether the consensus protocol works.

---

## Which nodes need to agree on what

Consensus is not the same as a vote. Money works because the agreement is *structured* — central banks, ledgers, transactions verified in particular ways. Kaya needs to be precise about which nodes need to agree, on what, for the consensus to function as infrastructure rather than opinion.

Four nodes matter, in this order:

**The candidate** is a node, with real weight. The representation of their behavior must be one they recognise — "yes, that is how I show up in those conditions." If the candidate does not recognise themselves, no further consensus is meaningful. This is what protects against the system being employer-imposed measurement dressed up as something else.

**The AI extraction system** (LEEE, Layer 2 simulation) is a node. It produces the structured representation from observable evidence — the conversation, the simulation behavior, the consistency checks. It must extract reliably enough that two runs on the same evidence produce the same representation. This is what the test-retest harness validates.

**The psychologist** is a node. They review the representation against the underlying evidence, and either ratify it, push back on specific claims, or flag where evidence is insufficient. This is what protects against the system over-claiming what the evidence supports.

**The employer** is a node. They look at the representation and either recognise it as describing someone who fits the role they need to fill, or they don't. Their recognition is the consensus check that the representation is decision-supportive in practice.

A representation that all four nodes recognise *is* what we mean by a valid skills profile. The consensus produces the validity. There is no further ground truth to appeal to — and there doesn't need to be, because the consensus is the infrastructure.

This also clarifies what failure looks like. If only employers' consensus matters, we recreate existing bias by collapsing the protocol to a single privileged node. If only the AI matters, we have a black box. If only psychologists matter, we have credentialed gatekeeping. The four-node structure is the safeguard. Each node's recognition is necessary. None alone is sufficient.

---

## How the protocol actually works

The technical mechanism is the Mischel-Shoda if-then behavioral signature (1995, *Psychological Review*). Other implementations are possible, but this one fits the consensus frame natively for a specific reason: signatures are *descriptive*, not *evaluative*. They describe what the person does under what conditions. That description is something the candidate can recognise or correct. It is something the psychologist can validate against the underlying evidence. It is something the employer can match against the conditions of the role they're hiring for. None of that requires anyone to agree on a scale or a level. It requires them to agree about whether a described pattern is real and present in the evidence.

The signature is the unit of consensus.

For each PSF Enabling Skill where Kaya has two or more pieces of behavioral evidence, the protocol identifies if-then conditional patterns: under situation features X, this person reliably does Y. Mischel and Shoda's foundational finding from the Wediko summer camp studies (Shoda, Mischel & Wright, 1993, 1994) was that human behavior is consistent in conditional patterns rather than in trait magnitudes. Two children with identical "aggression" trait scores had completely different signatures, and the signature was far more informative than the score about who the person actually was. Three decades of peer-reviewed work, including Fleeson's density distribution studies (2001, *JPSP*) and Whole Trait Theory (Fleeson & Jayawickreme, 2015), have substantiated this.

For Kaya, this means: STAR+E+R extraction already produces if-then evidence in raw form. The Situation is the if; the Action is the then. The current pipeline collapses this beautifully structured evidence into a single proficiency level at Stage 5 — and that collapse is where the information is lost, where the bias enters, and where the consensus protocol breaks because there is nothing left for the four nodes to agree about beyond a label.

The redesign is this: stop collapsing. Output the conditional patterns directly.

---

## What changes in the pipeline

### Stage 1 — Segmentation
**No change.** Episode segmentation works correctly.

### Stage 2 — STAR+E+R extraction
**No change.** The Situation/Action structure already captures the if-then pairing in raw form. We stop flattening it later.

### Stage 3 — Skill mapping
**Additive change only.** One new field on each mapping: `situation_features`. This is a structured tag set capturing the *psychological* features of the situation that activated the action — the "if" half of the signature in Mischel-Shoda terms.

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

These are extracted in the existing Stage 3 pass. Cost is negligible. Existing fields (skill_name, transcript_quote, mapping_rationale, confidence, confidence_factors, cultural_context) are untouched.

### Stage 4 — Consistency check
**No change.** Cross-story reinforcement and contradiction checks operate on the same mappings.

### Stage 5 — Rewritten
This is where the consensus protocol lives.

**Old Stage 5 does:** holds validated mappings against Basic/Intermediate/Advanced definitions, makes a holistic call which level the person sits at, outputs one level per skill plus a justification narrative.

**New Stage 5 does:** looks across validated mappings for each skill, identifies if-then conditional patterns from the situation_features and actions, outputs the patterns with evidence pointers and pattern strength, surfaces single observations separately as not-yet-patterns, computes an internal level only as filtering metadata never shown to humans.

The output is the structured representation that goes into the consensus protocol. The four nodes — candidate, psychologist, employer, AI — each interact with it, and convergence (or its failure) is what the validation pathway tracks.

---

## What the output looks like

### Per-skill signature (the unit of consensus)

```json
{
  "skill_name": "Communication",
  "evidence_count": 4,
  "patterns": [
    {
      "pattern_id": "P1",
      "if_features": {
        "audience": "single-unfamiliar",
        "stakes": "moderate-to-high",
        "topic_complexity": "technical"
      },
      "then_action": "structures information first, checks understanding before moving on",
      "supporting_narratives": ["EV03", "EV07", "EV12"],
      "support_count": 3,
      "pattern_strength": "strong",
      "cultural_marker": null,
      "contradictions": []
    },
    {
      "pattern_id": "P2",
      "if_features": {
        "power_position": "junior",
        "audience": "group-familiar"
      },
      "then_action": "defers initiation, listens for conversation structure, contributes specifically rather than generally",
      "supporting_narratives": ["EV02", "EV08", "EV14"],
      "support_count": 3,
      "pattern_strength": "strong",
      "cultural_marker": "kapwa-honoring deference — culturally-adaptive pattern, not deficit",
      "contradictions": []
    }
  ],
  "single_observations": [...],
  "internal_level_metadata": {
    "derived_level": "Intermediate",
    "use_for": "filtering and threshold logic only — never surfaced to humans"
  }
}
```

### What each node sees

**The candidate** sees the patterns described in plain language alongside the narrative quotes that support each one. The candidate-facing question is: *do you recognise yourself in this?* If yes, consensus from this node holds. If not, the candidate can flag specific patterns as misreading their experience, and those flags become signal — both to refine extraction and to inform the psychologist's review.

**The AI extraction system** produces the patterns from the evidence. Test-retest reliability (already infrastructure in the repo) measures whether two runs on the same evidence produce the same patterns. This is the AI's node-level consensus check: agreement-with-self.

**The psychologist** sees the patterns alongside the underlying STAR+E+R evidence and the mapping rationales. The psychologist-facing question is: *is the pattern Kaya identified actually present in the evidence, and is the cultural marker handled correctly?* They ratify, push back, or flag insufficient evidence. The psychologist's role is not to score the candidate. It is to validate that the AI's representation is faithful to the evidence the candidate provided.

**The employer** sees the patterns rendered as conditional matches against the conditions their role actually involves. *Role requires unfamiliar-audience technical communication?* Pattern P1 is evidenced — strong fit. *Role requires leading senior stakeholders in unstructured discussions?* Not yet evidenced — interview probe recommended. The employer's question is not "is this person Intermediate?" — it is *do I recognise someone who fits the conditions of the role I'm hiring for?*

When all four nodes recognise the same representation, that is consensus. That recognition is the validity claim Kaya makes — not "we measured this person correctly," but "we produced a representation the network agrees on."

---

## Why this also handles the cultural bias problem

In a measurement frame, "defers initiation when junior" is a pattern that scores low on Initiative or Communication under most Western-anchored rubrics. Filipino candidates exhibiting kapwa-honoring deference would systematically under-rate.

In the consensus frame, "defers initiation when junior" is a pattern. It is described accurately, with the cultural marker noted. The candidate recognises it as how they show up. The psychologist confirms it's present in the evidence. The employer evaluates whether their role rewards or penalises that pattern — different roles have different answers, and that's exactly the right question. The pattern is not a deficit and not an asset in the abstract. It is contextual information the employer uses to assess role fit.

This isn't culture being "added on" to the framework. It is the framework working as designed. Patterns describe what someone does under what conditions. Cultural register is one of the conditions. Behavior that adapts to cultural register is, in this frame, exactly as legitimate as any other behavior — and the protocol describes it accurately rather than evaluating it against an external standard.

---

## Validation pathway

In the measurement frame, validation requires correlation against a ground truth that doesn't exist. In the consensus frame, validation is consensus reliability — does the protocol reliably produce agreement among the four nodes?

Four studies, in sequence:

**Study 1 — Test-retest reliability of the AI node.** Run new Stage 5 five times on the same transcript. Pass threshold: ≥80% pattern overlap across runs. Infrastructure already built (`scripts/validation/test-retest.ts`).

**Study 2 — Candidate-AI consensus.** Show 10–20 candidates the patterns Kaya extracted from their conversation. Ask: do you recognise yourself? Pass threshold: ≥80% pattern recognition. Failures are diagnostic — they tell us where extraction is misreading evidence.

**Study 3 — Psychologist-AI consensus.** PRC psychologist reviews 20 candidate signatures against transcripts. Inter-rater agreement on whether each pattern is supported by the evidence cited. Pass threshold: Cohen's κ ≥ 0.60. This is the protocol equivalent of inter-rater reliability.

**Study 4 (longitudinal) — Employer-AI consensus.** AI for Inclusion event in June 2026. Show employers the patterns Kaya extracted for employees they already know. Pass threshold: ≥75% of patterns recognised by employers as accurate descriptions of how the employee actually shows up at work.

A protocol that passes all four is consensus infrastructure that works. The validation is empirical. The frame survives skeptical review because it is not claiming anything beyond what the consensus actually delivers.

---

## What this means for positioning

**To TESDA:** Kaya is not a new measurement system requiring accreditation. Kaya is consensus infrastructure for the agreement TESDA, employers, and candidates already need to reach about human-centric skills. The PSF framework is the shared language. Kaya is the protocol that makes large-scale agreement possible.

**To employers:** Kaya does not tell you who to hire. Kaya gives you a structured representation of someone's behavior. You decide whether you recognise a person who fits your role in it. If you don't, the protocol surfaces the gap as an interview probe rather than a missing score. The employer remains the decision-maker; Kaya is the infrastructure that makes the decision better-informed.

**To the academic community:** the work sits in social epistemology and consensus-protocol literature, alongside peer review systems, credentialing infrastructure, and structured evidence assessment in legal and medical contexts. The Mischel-Shoda signature provides the technical mechanism with three decades of peer-reviewed validation. Tal's model-based account of measurement (2016, 2017) provides the philosophical anchor — measurement itself, on Tal's account, is a coordinative achievement between a model, an instrument, and a community of users about what is being represented. Kaya operationalises that view directly.

**To candidates:** Kaya is a way for what you already know about yourself to become recognised by employers. Your stories are the evidence. The patterns are how the system describes what you do under different conditions. You are not being measured. You are being represented, in a way that makes consensus possible.

---

## Build sequencing

Phase 1 (1 week, no blocker): Stage 5 prompt rewrite + Stage 3 schema addition. Done — on this branch.

Phase 2 (3 days, no blocker): A/B test runner. Done — on this branch.

Phase 3 (1 week, no blocker): Test-retest harness extension for pattern-level stability.

Phase 4 (1 week, blocker: psychologist recruited): Psychologist consensus study (Study 3 above) on 20 signatures.

Phase 5 (1 week, blocker: validation passes): Update EmployerSkillsReport to render signatures. Wire into employer-dashboard. Build candidate-facing recognition view.

Phase 6 (1 week, blocker: signature output stable): Update Layer 2 Observer to test pattern reproduction in simulation.

Phase 7 (June 2026 — AI for Inclusion event): Employer-AI consensus study (Study 4). Real employers reviewing patterns for employees they already know.

Phases 1–3 produce enough working infrastructure for Ryan and the team to evaluate the protocol on real transcripts. That is the gate before further investment.

---

## A closing note on why this is the right frame

When Ryan said the measurement framing invites the question "who decided this scale is right?" — that question has no good answer for any novel instrument. It's the right question to ask, and it's why building "a new measurement system" was always a difficult position.

Money, language, law — none of these are answers to "who decided this scale is right?" They are answers to "how do enough people agree to operate as if this is real, in structured ways, reliably?" That second question has answers. Those answers are protocols, infrastructure, and conventions that work because they make consensus possible at scale.

Human-centric skills are real. People privately know who has them. Kaya is the infrastructure that makes the private knowledge shareable across a network. The Mischel-Shoda signature is the technical mechanism. The four-node structure is the consensus protocol. The validation studies test whether consensus actually emerges.

That's what we are building. Not a measurement of empathy. Infrastructure for agreement about what empathy looks like in this person, in these conditions, in this evidence — that the candidate, the psychologist, the employer, and the system itself can all converge on.

That is something defensible, novel, and genuinely useful. And it is what Kaya is for.
