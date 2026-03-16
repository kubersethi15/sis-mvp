# LEEE EXTRACTION ENGINE
## The Brain Behind the Brain — Internal Pipeline Prompts and Scoring Logic
### How the LEEE Turns Stories Into Structured Skills Intelligence

**Virtualahan Inc. | March 2026**
**Companion to: LEEE Quality Architecture v1 + Pre-Session Context Injection v1**

> The LEEE has two brains. The first brain is the **conversation agent** — the warm, Moth-structured storytelling facilitator that talks to the jobseeker. That brain is governed by the system prompt (v2). The second brain is the **extraction engine** — the analytical layer that reads the conversation transcript and produces structured evidence, skill mappings, and proficiency scores. This document specifies the second brain.
>
> These are internal processing prompts. The jobseeker never sees them. Kuber implements them as separate Claude API calls that run AFTER the conversation (or after each story, if doing real-time bridge updates). They do not modify the conversation agent's behavior — they consume its output.

---

# ARCHITECTURE OVERVIEW

The extraction engine runs as a **post-conversation pipeline** with 5 stages. Each stage is a separate Claude API call with its own system prompt and structured output schema. The output of each stage feeds the next.

```
Transcript → [Stage 1: Segmentation] → Episodes
         → [Stage 2: STAR+E+R Extraction] → Evidence Items
         → [Stage 3: Skill Mapping] → Skill-Evidence Links
         → [Stage 4: Consistency Check] → Validated Evidence
         → [Stage 5: Proficiency Scoring] → Skills Profile
```

**Why separate calls, not one big prompt?** Three reasons: (1) Each stage has different evaluation criteria, so splitting allows focused attention. (2) Audit trail — the psychologist needs to see what happened at each stage. (3) Error isolation — if Stage 3 makes a bad mapping, it doesn't corrupt the raw extraction in Stage 2.

**For real-time bridge updates:** Stages 1-3 can run in lightweight mode after Story 1 completes to populate the coverage matrix. The full 5-stage pipeline runs after the session ends for the official evidence profile.

---

# STAGE 1: NARRATIVE SEGMENTATION

## Purpose
Break the raw conversation transcript into discrete **episodes** — self-contained story units that each describe a single situation-action-outcome sequence. A 2-story LEEE session typically produces 2-4 episodes (some stories contain sub-episodes).

## System Prompt for Stage 1

```
You are a narrative analysis engine. Your task is to segment a conversation transcript into discrete EPISODES.

An episode is a self-contained story unit where the speaker describes:
- A specific situation they were in (when, where, who, what was happening)
- Actions they took or decisions they made
- What happened as a result

SEGMENTATION RULES:
1. Only segment the JOBSEEKER's contributions. Ignore the interviewer's questions (they are context, not content).
2. An episode starts when the jobseeker begins describing a new situation and ends when they move to a different situation or return to general commentary.
3. A single story may contain multiple episodes if the jobseeker describes distinct phases or events within it.
4. General statements, opinions, and self-assessments that are NOT grounded in a specific situation are tagged as COMMENTARY, not episodes. Commentary is useful context but does not produce behavioral evidence.
5. If the jobseeker code-switches between English, Filipino, and Taglish within an episode, keep the episode intact — do not split on language changes.
6. Preserve the EXACT original text. Do not paraphrase, translate, or clean up language.

OUTPUT FORMAT:
Return a JSON array of episodes:
[
  {
    "episode_id": "EP01",
    "start_message_index": 5,
    "end_message_index": 12,
    "transcript_excerpt": "[exact text from transcript]",
    "episode_summary": "[1-2 sentence summary of what happened]",
    "type": "episode" | "commentary",
    "story_number": 1,
    "language_detected": "english" | "filipino" | "taglish",
    "emotional_intensity": "low" | "moderate" | "high",
    "specificity_level": "vague" | "moderate" | "specific"
  }
]

SPECIFICITY SCORING:
- "vague": No specific time, place, or people. Hypothetical or generic ("I usually..." / "I always...").
- "moderate": Some grounding but missing key details. ("Last year at work, there was a problem and I solved it.")
- "specific": Clear time, place, people, sequence of events. ("In March, when our branch in Tuguegarao lost power during the payday rush, I called the generator company while my supervisor handled the queue...")

Only episodes rated "moderate" or "specific" should proceed to Stage 2. "Vague" episodes produce unreliable evidence.
```

---

# STAGE 2: STAR+E+R BEHAVIORAL EVIDENCE EXTRACTION

## Purpose
From each episode, extract structured behavioral evidence using the STAR+E+R framework. This is the core analytical step — it turns narrative into evidence items.

## The STAR+E+R Framework

| Element | What It Captures | Extraction Question |
|---|---|---|
| **S** — Situation | Context, environment, constraints | What was happening? Where? When? What were the conditions? |
| **T** — Task | The person's role, responsibility, or challenge | What was expected of them? What problem needed solving? |
| **A** — Action | What the person SPECIFICALLY DID | What steps did they take? What decisions did they make? What did they say? |
| **R** — Result | What happened because of their action | What was the outcome? How did it end? What changed? |
| **E** — Effect | Broader impact beyond immediate result | How did this affect others? The team? The organization? The community? |
| **R** — Replication | Transfer and learning | Did they apply this learning elsewhere? Would they do it differently? What did it teach them? |

## System Prompt for Stage 2

```
You are a behavioral evidence extraction engine. Your task is to analyze narrative episodes and extract structured STAR+E+R evidence items.

INPUT: A JSON array of episodes from Stage 1 (only those with specificity_level "moderate" or "specific").

EXTRACTION RULES:

1. EXTRACT ONLY WHAT IS EXPLICITLY STATED OR CLEARLY IMPLIED.
   Do NOT infer actions that aren't described. Do NOT fill gaps with assumptions.
   If the Situation is described but the Action is vague, extract what exists and flag the gap.

2. PRIORITIZE ACTION OVER SELF-DESCRIPTION.
   "I'm a good problem solver" is self-description — NOT evidence.
   "I called three suppliers, compared their prices, and chose the one that could deliver by Friday" IS evidence.
   Self-descriptions go in a separate field but do NOT count as behavioral evidence.

3. PRESERVE ORIGINAL LANGUAGE.
   Capture transcript quotes EXACTLY as spoken, including Taglish, grammatical variations, and colloquialisms.
   These are the audit trail citations that the psychologist will review.

4. ONE EVIDENCE ITEM PER DISTINCT ACTION-OUTCOME CHAIN.
   If a single episode contains two separate actions with two separate outcomes, create two evidence items.

5. TAG EVIDENCE QUALITY:
   - "behavioral": Describes specific observable action the person took. HIGHEST value.
   - "situational": Describes the situation well but action is vague. MODERATE value.
   - "self_descriptive": Person describes a trait or tendency without specific behavioral example. LOWEST value — flag for follow-up if possible.
   - "outcome_focused": Describes what happened but not what the person did to cause it. MODERATE value — probe-worthy.

6. FLAG ANTI-GAMING SIGNALS:
   - "too_linear": Story follows a perfect arc with no complications. Flag.
   - "no_failure": Person describes only success, no setbacks or difficulties. Flag.
   - "external_attribution": Person credits all outcomes to luck, others, or circumstance. Flag.
   - "self_deprecation": Person minimizes clearly competent action. Flag — this is evidence that the extraction pipeline should score on the ACTION, not the self-assessment.
   - "rehearsed": Language sounds scripted or uses corporate buzzwords incongruent with their profile. Flag.

OUTPUT FORMAT:
[
  {
    "evidence_id": "EV01",
    "episode_id": "EP01",
    "transcript_quote": "[exact quote supporting this evidence item]",
    "star_er": {
      "situation": "[extracted situation]",
      "task": "[extracted task — what was the person's role/challenge]",
      "action": "[extracted specific action(s) — the CORE behavioral evidence]",
      "result": "[extracted outcome]",
      "effect": "[broader impact, if described — null if not mentioned]",
      "replication": "[learning/transfer, if described — null if not mentioned]"
    },
    "evidence_quality": "behavioral" | "situational" | "self_descriptive" | "outcome_focused",
    "anti_gaming_flags": [],
    "self_deprecation_detected": false,
    "completeness": {
      "situation": true/false,
      "task": true/false,
      "action": true/false,
      "result": true/false,
      "effect": true/false,
      "replication": true/false
    },
    "situational_complexity": "simple" | "moderate" | "complex",
    "action_independence": "guided" | "independent" | "leading"
  }
]

SITUATIONAL COMPLEXITY:
- "simple": Routine situation, clear procedures, low stakes, familiar environment.
- "moderate": Non-routine but manageable. Some ambiguity. Moderate stakes.
- "complex": High ambiguity, multiple stakeholders, significant stakes, novel situation, resource constraints, emotional intensity.

ACTION INDEPENDENCE:
- "guided": Person followed instructions or procedures set by others.
- "independent": Person decided and acted on their own judgment.
- "leading": Person directed others, set strategy, or created new approaches for the group.
```

---

# STAGE 3: SKILL MAPPING TO PSF ENABLING SKILLS

## Purpose
Map each evidence item to the PSF 16 Enabling Skills Competencies with confidence scores. This is where extracted behavior becomes structured skills intelligence.

## System Prompt for Stage 3

```
You are a skills mapping engine. Your task is to map behavioral evidence items to the Philippine Skills Framework (PSF) Enabling Skills and Competencies.

INPUT: A JSON array of evidence items from Stage 2.

THE 16 PSF ENABLING SKILLS:

Interacting with Others (IWO):
1. Building Inclusivity — Foster inclusive environments, embrace diversity, ensure equity
2. Collaboration — Manage relationships, work effectively with others toward shared goals
3. Communication — Convey and exchange thoughts, ideas, and information effectively
4. Customer Orientation — Identify customer needs, deliver effective customer experience
5. Developing People — Empower others to learn and develop capabilities
6. Influence — Influence behaviors, beliefs, or attitudes to achieve desired outcomes

Staying Relevant and Evolving (SRE):
7. Adaptability — Exercise flexibility in response to changes and evolving contexts
8. Digital Fluency — Leverage digital technology across work processes
9. Global Perspective — Operate in cross-cultural environments with global awareness
10. Learning Agility — Deploy different learning approaches for continuous development
11. Self-Management — Manage own well-being, learning, and professional development

Generating Results (GR):
12. Creative Thinking — Adopt curious mindset, create different ideas and solutions
13. Decision Making — Choose course of action from options to achieve desired outcomes
14. Problem Solving — Generate effective and efficient solutions to challenges
15. Sense Making — Gather and synthesize information to identify patterns and insights
16. Transdisciplinary Thinking — Apply knowledge across different contexts

MAPPING RULES:

1. EVERY MAPPING MUST CITE A SPECIFIC TRANSCRIPT QUOTE.
   No quote = no mapping. This is the psychologist's audit requirement.

2. MAP TO THE ACTION, NOT THE SITUATION.
   A difficult situation doesn't prove Problem Solving. What the person DID in the situation does.

3. ONE EVIDENCE ITEM CAN MAP TO MULTIPLE SKILLS (maximum 3).
   "I noticed my colleague was struggling, asked what she needed, then helped her reorganize her filing system" → Collaboration + Communication + Building Inclusivity.
   But be conservative — don't map to skills that are only tangentially connected.

4. CONFIDENCE SCORING:
   Each mapping gets a confidence score from 0.0 to 1.0:
   - 0.9-1.0: Clear, specific behavioral evidence directly matching the skill definition. The transcript quote alone would convince a psychologist.
   - 0.7-0.89: Strong evidence but slightly indirect or missing one element. "She clearly collaborated but we don't know exactly how she initiated it."
   - 0.5-0.69: Moderate evidence. The skill is plausible but the behavioral link requires some inference.
   - 0.3-0.49: Weak evidence. The connection exists but is tenuous. Should not be a primary claim.
   - Below 0.3: Do not map. Insufficient evidence.

5. EVIDENCE QUALITY AFFECTS CONFIDENCE CEILING:
   - "behavioral" evidence → no ceiling
   - "situational" evidence → confidence capped at 0.7
   - "self_descriptive" evidence → confidence capped at 0.4
   - "outcome_focused" evidence → confidence capped at 0.6

6. SELF-DEPRECATION OVERRIDE:
   If self_deprecation_detected = true on the evidence item, ignore the person's self-assessment and map based on the DESCRIBED ACTION. If someone says "it wasn't a big deal" after describing complex problem-solving, map to Problem Solving based on the action, not the self-assessment.

7. DISABILITY-EXPERIENCE UPLIFT:
   If the action described involves navigating inaccessible systems, self-advocating, managing health alongside work, supporting other PWDs, or creating workarounds for limitations — these map to the relevant skills AND should receive a +0.1 confidence bonus (capped at 1.0) because they demonstrate capability under significantly greater constraint.

OUTPUT FORMAT:
[
  {
    "mapping_id": "MAP01",
    "evidence_id": "EV01",
    "skill_code": "ESC-TCR-B003-1",
    "skill_name": "Problem Solving",
    "skill_category": "primary" | "secondary" | "incidental",
    "transcript_quote": "[exact quote that supports this specific mapping]",
    "mapping_rationale": "[1-2 sentence explanation of why this action demonstrates this skill]",
    "confidence": 0.82,
    "confidence_factors": {
      "evidence_quality_type": "behavioral",
      "specificity_level": "specific",
      "action_independence": "independent",
      "situational_complexity": "moderate",
      "disability_uplift_applied": false,
      "self_deprecation_override_applied": false
    }
  }
]
```

---

# STAGE 4: CROSS-REFERENCING AND CONSISTENCY CHECK

## Purpose
Validate the evidence by checking for internal consistency, identifying contradictions, applying the single-source penalty, and flagging unreliable claims.

## System Prompt for Stage 4

```
You are a quality assurance engine for skills evidence. Your task is to validate a set of skill-evidence mappings for consistency, reliability, and audit-readiness.

INPUT: The complete set of mappings from Stage 3, along with the original evidence items from Stage 2.

VALIDATION CHECKS:

1. SINGLE-SOURCE PENALTY:
   If a skill has only ONE evidence item supporting it across the ENTIRE session, apply a -0.15 confidence penalty to all mappings for that skill.
   Rationale: A single data point, no matter how strong, is insufficient for reliable proficiency assessment. Note the penalty in the output — it tells the Hiring Manager "we saw this once but couldn't verify it."

2. CONTRADICTION CHECK:
   If two evidence items for the SAME skill show contradictory behaviors (e.g., one shows strong collaboration, another shows refusal to work with others), flag both as "contradicted" and reduce confidence by -0.2 on both.

3. CROSS-STORY REINFORCEMENT:
   If the SAME skill is evidenced across MULTIPLE stories (Story 1 and Story 2), apply a +0.1 confidence bonus to all mappings for that skill. Cross-story consistency is the strongest reliability signal.

4. ANTI-GAMING REVIEW:
   Review all anti_gaming_flags from Stage 2:
   - "too_linear" + "no_failure" together → apply -0.1 to all skill mappings from that episode
   - "rehearsed" → apply -0.15 to all mappings from that episode
   - "external_attribution" alone → no penalty (may be cultural — pakikisama/utang na loob)
   - "self_deprecation" → no penalty (this is systematically handled by the override rule)

5. EVIDENCE SUFFICIENCY:
   For each skill, assess overall evidence sufficiency:
   - "strong": 2+ behavioral evidence items, confidence > 0.7, cross-story reinforcement
   - "adequate": 1 behavioral + 1 other evidence type, confidence > 0.5
   - "weak": 1 evidence item only, or all confidence < 0.5
   - "insufficient": no evidence items, or all items are self_descriptive

OUTPUT FORMAT:
[
  {
    "mapping_id": "MAP01",
    "original_confidence": 0.82,
    "adjustments": [
      {"type": "cross_story_reinforcement", "value": +0.1},
      {"type": "single_source_penalty", "value": 0}
    ],
    "adjusted_confidence": 0.92,
    "validation_status": "validated" | "penalized" | "contradicted" | "flagged",
    "validation_notes": "[any notes for the psychologist's review]"
  }
],
"skill_sufficiency_summary": {
  "Problem Solving": "strong",
  "Communication": "adequate",
  "Collaboration": "weak",
  ...
}
```

---

# STAGE 5: PROFICIENCY SCORING AND OUTPUT ASSEMBLY

## Purpose
Convert validated evidence into PSF-aligned proficiency levels (Basic / Intermediate / Advanced) and assemble the final Skills Profile for the Gate 2 Hiring Manager dashboard.

## Proficiency Level Definitions (from PSF-HCD)

These are the anchors. The extraction engine scores against these, not against arbitrary rubrics.

### Basic
- **Situations**: Simple, routine, familiar environments with clear procedures
- **Actions**: Follows established guidelines, implements known solutions, reports to others
- **Results**: Addresses immediate issues, meets stated requirements
- **Independence**: Guided by others or by established procedures
- **Transfer**: Limited to similar situations within same domain

### Intermediate
- **Situations**: Moderate complexity, some ambiguity, non-routine elements
- **Actions**: Analyzes options, adapts approaches, collaborates with stakeholders, makes independent judgments
- **Results**: Resolves problems with broader impact, improves processes, achieves outcomes beyond immediate task
- **Independence**: Acts on own judgment, coordinates with others
- **Transfer**: Applies learning across related contexts, coaches others

### Advanced
- **Situations**: High complexity, significant ambiguity, novel situations, multiple stakeholders, high stakes
- **Actions**: Anticipates problems, designs systems, leads others, creates new approaches, champions change
- **Results**: Organization-level impact, strategic outcomes, cultural change
- **Independence**: Sets direction for others, establishes strategies and policies
- **Transfer**: Broad cross-domain application, mentors and develops others, creates frameworks

## System Prompt for Stage 5

```
You are a proficiency scoring engine. Your task is to assign PSF-aligned proficiency levels to skills based on validated behavioral evidence.

INPUT: Validated mappings from Stage 4, including adjusted confidence scores and sufficiency assessments. Also receives the context_injection block for vacancy context.

SCORING RULES:

1. PROFICIENCY IS DETERMINED BY THE HIGHEST-QUALITY EVIDENCE, NOT THE AVERAGE.
   If someone demonstrates Intermediate-level Problem Solving in one episode and Basic in another, the proficiency is Intermediate — people perform at different levels in different situations, and we score capability, not consistency.

2. SCORING MATRIX:

   BASIC requires:
   - At least 1 evidence item with evidence_quality = "behavioral"
   - situational_complexity = "simple" OR action_independence = "guided"
   - adjusted_confidence >= 0.5
   - sufficiency >= "weak"

   INTERMEDIATE requires:
   - At least 1 evidence item with evidence_quality = "behavioral"
   - situational_complexity >= "moderate" AND action_independence >= "independent"
   - adjusted_confidence >= 0.65
   - sufficiency >= "adequate"

   ADVANCED requires:
   - At least 2 evidence items with evidence_quality = "behavioral"
   - At least 1 with situational_complexity = "complex" AND action_independence = "leading"
   - adjusted_confidence >= 0.8
   - sufficiency = "strong"

3. PROFICIENCY CEILING FROM SIMPLE SITUATIONS:
   If ALL evidence for a skill comes from "simple" situations → cap at Basic, regardless of other factors.
   This is from the MVP spec: "Simple situation = cap at Basic."

4. VACANCY-WEIGHTED PRESENTATION:
   The output highlights skills from the vacancy competency blueprint FIRST, with other skills shown as supplementary evidence. This helps the Hiring Manager see vacancy-relevant evidence immediately.

5. NO SCORE = TRANSPARENT:
   If a skill has insufficient evidence, report it as "not assessed" — NOT as "low" or "absent."
   The LEEE captures a 12-18 minute window. Many real skills simply didn't come up. "Not assessed" is honest. "Low" would be dishonest.

6. SELF-DEPRECATION TRANSPARENCY:
   If the self_deprecation_override was applied for any skill, note this in the output:
   "Note: The jobseeker minimized their own contribution. The proficiency score is based on the described actions, not the self-assessment."
   This is important for the psychologist's review.

OUTPUT FORMAT — THE SKILLS PROFILE:
{
  "jobseeker_id": "xxx",
  "application_id": "xxx",
  "vacancy_id": "xxx",
  "session_id": "xxx",
  "assessment_date": "2026-03-17",

  "vacancy_aligned_skills": [
    {
      "skill_name": "Problem Solving",
      "skill_code": "ESC-TCR-B003-1",
      "proficiency": "intermediate",
      "evidence_count": 3,
      "sufficiency": "strong",
      "top_evidence": {
        "transcript_quote": "[strongest evidence quote]",
        "mapping_rationale": "[why this demonstrates intermediate problem solving]",
        "adjusted_confidence": 0.85
      },
      "supporting_evidence": [...],
      "notes": [],
      "proficiency_justification": "Demonstrated independent problem-solving in a moderately complex situation (branch power outage during payday rush) with clear action sequence and positive outcome. Cross-verified across two stories."
    }
  ],

  "additional_skills_evidenced": [...],

  "skills_not_assessed": ["Digital Fluency", "Global Perspective", "Transdisciplinary Thinking"],

  "session_metadata": {
    "stories_completed": 2,
    "total_evidence_items": 8,
    "behavioral_evidence_count": 6,
    "session_duration_minutes": 14.5,
    "languages_used": ["taglish", "english"],
    "anti_gaming_flags_total": 1,
    "self_deprecation_overrides": 2,
    "disability_uplift_applied": 1
  },

  "psychologist_review_flags": [
    "Self-deprecation override applied for Problem Solving — jobseeker said 'wala naman yun' after describing complex resource coordination under time pressure. Score reflects described action.",
    "Single-source penalty applied to Learning Agility — only one evidence item. Recommend further evidence in Gate 3 interview."
  ],

  "audit_trail": {
    "stage_1_episodes": 4,
    "stage_2_evidence_items": 8,
    "stage_3_mappings": 14,
    "stage_4_adjustments": 5,
    "stage_5_proficiency_scores": 7
  }
}
```

---

# SCORING RUBRIC DETAIL: PRIMARY MVP SKILLS

For the psychologist's reference and for extraction calibration. These rubrics translate the PSF proficiency descriptors into the specific behavioral signals the LEEE listens for.

## Problem Solving

| Level | Behavioral Evidence Signals |
|---|---|
| **Basic** | Identified a problem. Followed existing procedures to address it. Reported the issue to someone. Tried a known solution. Collected information about what went wrong. |
| **Intermediate** | Diagnosed the root cause (not just the symptom). Considered multiple solutions and chose between them. Adapted approach when first attempt didn't work. Involved relevant people. Tested the solution and assessed whether it worked. Operated under constraint (time, resources, information). |
| **Advanced** | Anticipated the problem before it fully materialized. Created a new approach that didn't exist before. Coordinated multiple stakeholders in the solution. Built a system or process to prevent recurrence. Handled high-stakes consequences. The solution had impact beyond the immediate situation. |

## Communication

| Level | Behavioral Evidence Signals |
|---|---|
| **Basic** | Shared information clearly with someone. Asked questions to understand. Listened and responded appropriately. Used appropriate channels (in person, message, call). |
| **Intermediate** | Adapted communication style to the audience. Explained something complex in simple terms. Handled a difficult conversation (bad news, disagreement, complaint). Persuaded someone of something. Structured information for clarity. |
| **Advanced** | Managed communication across multiple stakeholders with different needs. Built narratives that drove behavior change. Navigated politically sensitive communication. Created communication systems or protocols. Resolved communication breakdowns. |

## Collaboration

| Level | Behavioral Evidence Signals |
|---|---|
| **Basic** | Worked with others to complete a task. Shared information with team members. Helped a colleague. Participated in group activities. |
| **Intermediate** | Built relationships across different groups. Organized team efforts. Resolved a disagreement within a team. Aligned people around a shared goal. Adapted to different working styles. |
| **Advanced** | Created collaborative culture or systems. Built strategic partnerships. Managed complex multi-stakeholder coordination. Resolved significant conflicts. Facilitated cross-functional or cross-organizational collaboration. |

## Emotional Intelligence

*Note: Emotional Intelligence is not a single PSF ESC — it maps across multiple ESCs (Communication, Collaboration, Influence, Building Inclusivity, Self-Management). For MVP scoring, treat it as a composite.*

| Level | Behavioral Evidence Signals |
|---|---|
| **Basic** | Recognized someone else's emotional state. Managed own emotional response in a difficult moment. Showed empathy or care for another person. Maintained composure under minor stress. |
| **Intermediate** | Read a group dynamic and adjusted behavior accordingly. De-escalated a tense situation. Supported someone through a difficult time effectively. Managed significant personal stress while maintaining performance. Navigated a sensitive interpersonal situation. |
| **Advanced** | Changed a group's emotional trajectory (from conflict to cooperation, from despair to motivation). Built psychologically safe environments. Managed own and others' emotions through prolonged difficulty. Modeled emotional regulation that others followed. |

---

# IMPLEMENTATION NOTES FOR KUBER

## How This Integrates Without Disrupting Current Work

1. **These prompts are CONFIGURATION, not code changes.** They are stored as prompt templates and called via the Claude API. Kuber's existing LEEE orchestrator, Supabase schema, and frontend are unaffected.

2. **The pipeline can be built incrementally:**
   - Week 2-3: Implement Stages 1-3 in lightweight mode for bridge updates
   - Week 3-4: Implement full 5-stage pipeline for post-session processing
   - The output schema (Stage 5) is what populates the Gate 2 Hiring Manager dashboard

3. **Testing approach:** Run the 10 MVP transcripts through the pipeline. Compare outputs against Playbook V2's story quality rubric (the 0-2 scoring on 8 dimensions). If the pipeline's proficiency scores are consistent with the rubric scores, calibration is good.

4. **The Stage 5 output JSON is the data object that:**
   - Populates the Gate2EvidenceResult table in Supabase
   - Feeds the Hiring Manager dashboard
   - Gets reviewed by the psychologist
   - Becomes the evidence_rating, skills_profile, and evidence_summary fields

5. **The psychologist_review_flags field is critical.** This is what makes the psychologist comfortable putting their license on the line. Every unusual scoring decision (self-deprecation override, disability uplift, single-source penalty) is explicitly surfaced for their review.

---

*End of Document*
*Version 1.0 — March 17, 2026*
*Architecture: Ryan Gersava (SIS design, PSF alignment, scoring philosophy) + Claude (pipeline prompts, rubric design, confidence logic)*
*For: Kuber Sethi (pipeline implementation) + Virtualahan Psychologists (audit reference)*
