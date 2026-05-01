// ============================================================
// KAYA — STAGE 5 v2: MISCHEL-SHODA SIGNATURE EXTRACTION
// ============================================================
//
// Status: Draft on feature branch — not deployed to production.
//
// What this replaces:
// The original STAGE_5_PROFICIENCY in src/lib/extraction-pipeline.ts produces
// holistic Basic/Intermediate/Advanced levels per PSF skill. This v2 produces
// if-then conditional signatures based on Mischel-Shoda (1995) behavioral
// signature theory — the unit of measure becomes the pattern, not the level.
//
// What stays the same: Stages 1–4 (segmentation, STAR+E+R extraction, skill
// mapping, consistency check). The signatures are extracted from the same
// validated mappings the old Stage 5 received.
//
// What's added in Stage 3: situation_features field (additive, optional —
// signatures still work without it but are stronger with it). See
// STAGE_3_SITUATION_FEATURES_ADDITION below.
//
// Internal level metadata: a derived level is still computed for filtering
// and threshold logic, but it never appears in the headline employer output.
// The signature is the unit of measure shown to humans.
// ============================================================

// ─── ADDITIVE STAGE 3 SCHEMA ───────────────────────────────────────────────
// This block appends to the existing Stage 3 prompt. Adds situation_features
// to each mapping output. Does not replace any existing fields.

export const STAGE_3_SITUATION_FEATURES_ADDITION = `

ADDITIONAL FIELD — SITUATION FEATURES:

For each mapping, additionally extract the psychological features of the
situation that activated the action. These features are what make the same
person behave differently in different contexts — the "if" half of an
if-then signature in Mischel-Shoda terms (1995, Psychological Review).

Add to each mapping output:

"situation_features": {
  "stakes": "low" | "moderate" | "high" | "personal",
  "familiarity": "routine" | "non-routine" | "novel",
  "power_position": "peer" | "junior" | "senior" | "mixed",
  "emotional_intensity": "low" | "moderate" | "high",
  "audience": "single-familiar" | "single-unfamiliar" | "group-familiar" | "group-unfamiliar" | "mixed",
  "resource_conditions": "adequate" | "constrained" | "scarce",
  "time_pressure": "none" | "moderate" | "acute",
  "cultural_register": "same-culture" | "cross-culture" | "hierarchical" | "informal"
}

EXTRACTION RULES FOR SITUATION FEATURES:

1. EXTRACT FROM EVIDENCE, NOT FROM CONTEXT YOU IMAGINE.
   The features should be readable from the STAR+E+R itself. If the situation
   doesn't say what the stakes were, mark stakes as "moderate" (the unmarked
   default) — don't assume.

2. STAKES IS ABOUT WHAT WAS ON THE LINE FOR THE PERSON OR PEOPLE INVOLVED.
   - "low": routine outcome, no significant consequence
   - "moderate": some real consequence (work outcome, relationship strain)
   - "high": significant consequence (job, money, safety, important relationship)
   - "personal": stakes were personal/emotional/identity-based for the person

3. FAMILIARITY IS ABOUT THE SITUATION TYPE, NOT THE PEOPLE.
   - "routine": person had done this kind of situation many times
   - "non-routine": situation was unusual but recognizable
   - "novel": person had not faced this situation type before

4. POWER POSITION IS THE PERSON'S POSITION RELATIVE TO OTHERS IN THE SITUATION.
   - "peer": working among equals
   - "junior": working under someone with more authority/seniority/expertise
   - "senior": others looking to the person for leadership/authority
   - "mixed": multiple positions in same situation

5. WHEN A FEATURE IS GENUINELY NOT INFERABLE FROM THE EVIDENCE, OMIT IT.
   An incomplete situation_features object is more honest than guessed values.

6. CULTURAL_REGISTER IS DIFFERENT FROM CULTURAL_CONTEXT.
   cultural_context (existing field) captures the SP concepts at play.
   cultural_register here captures the social register: same-culture casual,
   cross-culture, hierarchical (with seniors/authority figures present), or
   informal (family, friends, community).

These features are used downstream by the signature extraction (Stage 5 v2)
to identify if-then patterns. The richer and more accurate these features,
the better the signatures.
`;

// ─── STAGE 5 v2 — SIGNATURE EXTRACTION ─────────────────────────────────────

export const STAGE_5_SIGNATURE = `You are a behavioral signature extraction engine. Your task is to identify the if-then conditional patterns that characterize this person's behavior across the validated evidence — and to output them as their behavioral signature for each PSF Enabling Skill.

METHODOLOGY ANCHOR — READ THIS FIRST:

This is not proficiency scoring. You are not assigning Basic, Intermediate, or Advanced levels. You are identifying conditional patterns following Mischel and Shoda's (1995, Psychological Review) cognitive-affective system theory.

The core finding from that literature: human behavior is not consistent across situations the way trait theory assumes. People are consistent in CONDITIONAL PATTERNS — under situation features X, the person reliably does Y. Two people with identical "trait scores" can have completely different signatures, and the signature is far more informative about who the person is and what they will do in a new situation.

YOUR JOB:

For each PSF skill where 2 or more validated mappings exist, look across those mappings and identify the if-then conditional patterns. Each pattern has:
- An IF: the situation features that reliably activate this behavior
- A THEN: the action the person consistently takes when those features are present
- SUPPORTING NARRATIVES: which evidence items demonstrate this pattern
- A PATTERN STRENGTH: how reliable the pattern is (more support, more stable)

REASONING PRINCIPLES:

1. PATTERN REQUIRES AT LEAST TWO OBSERVATIONS WITH SIMILAR FEATURES.
   One observation is a data point, not a pattern. Two or more observations of similar situation features producing similar actions = a pattern. Mark single observations separately as "observed once — not yet a pattern."

2. SITUATION FEATURES DO THE WORK OF DISCRIMINATING PATTERNS.
   The same skill (e.g., Communication) may produce different patterns in different situation types — communicating to an unfamiliar audience may activate one behavior; communicating under emotional intensity may activate another. These are different patterns, not contradictions. Identify them as separate patterns.

3. CONTRADICTIONS ARE DIAGNOSTIC, NOT FAILURES.
   If the same situation features produced different actions across narratives, that is itself information. Surface it as a contradiction with the narrative IDs. Don't try to resolve it by picking one. The hiring manager (or psychologist) can interpret what the contradiction means — development over time, missing context, or genuine variability.

4. CULTURAL MARKERS DESCRIBE PATTERNS, THEY DO NOT DOWNGRADE THEM.
   Filipino respondents may show patterns like "defers initiation in senior-present situations" — which a Western framework might score as low Initiative. In signature terms, this is a culturally-adaptive pattern, not a deficit. Surface it descriptively. Note the cultural marker. Do not penalize it.

5. THE SIGNATURE IS A DESCRIPTION, NOT A RANKING.
   Patterns are not "better" or "worse" than each other. They are conditional regularities. The hiring manager evaluates fit — does this person's pattern match what the role requires?

6. INTERNAL LEVEL METADATA IS COMPUTED FOR FILTERING ONLY, NOT SHOWN.
   For each skill, derive an internal level (Basic/Intermediate/Advanced/Not Assessed) so downstream threshold logic and longitudinal validation can use a consistent unit. This level appears only in metadata, never in the headline output to humans. The signature is the headline.

INTERNAL LEVEL DERIVATION (for filtering metadata only):

A skill's internal level is derived from the patterns observed:

- "Not Assessed": fewer than 2 mappings for this skill, no patterns identified
- "Basic": patterns mostly in routine/familiar situations, action_independence guided
- "Intermediate": patterns include non-routine situations, with independent action and contextual adaptation across different situation features
- "Advanced": patterns include novel/high-stakes situations, with independent or leading action, and observable adaptation across multiple distinct situation feature profiles

Note: this level is metadata. It is computed for filtering and does not change how the signature is presented.

OUTPUT FORMAT — respond with ONLY this JSON, no other text:

{
  "signatures_by_skill": [
    {
      "skill_name": "Communication",
      "evidence_count": 4,
      "patterns": [
        {
          "pattern_id": "P1",
          "if_features": {
            "audience": "single-unfamiliar",
            "stakes": "moderate",
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
      "single_observations": [
        {
          "observation_id": "S1",
          "description": "Mediated between two relatives without speaking to them together first",
          "narrative": "EV11",
          "note": "Single instance. May indicate context-specific adaptation or measurement noise. Probe in interview if relevant to role."
        }
      ],
      "internal_level_metadata": {
        "derived_level": "Intermediate",
        "derivation_reasoning": "Multiple strong patterns observed across non-routine situations with independent action; pattern variability across distinct situation features indicates contextual adaptation.",
        "use_for": "filtering and threshold logic only — not surfaced to employer"
      }
    }
  ],
  "skills_with_insufficient_evidence": [
    {
      "skill_name": "Digital Fluency",
      "evidence_count": 0,
      "reason": "no behavioral evidence for this skill in the conversation"
    },
    {
      "skill_name": "Influence",
      "evidence_count": 1,
      "reason": "single mapping — not yet a pattern. Single observation surfaced for interview probe."
    }
  ],
  "session_metadata": {
    "stories_completed": 4,
    "total_evidence_items": 12,
    "total_patterns_identified": 8,
    "skills_with_signatures": 6,
    "skills_with_single_observations_only": 2,
    "skills_not_assessed": 8,
    "languages_used": ["taglish"],
    "anti_gaming_flags_total": 0
  },
  "psychologist_review_flags": [],
  "candidate_summary_narrative": "[2-3 sentence warm summary of the person — what their stories revealed about how they show up in different situations. Frame in pattern terms, not levels. This is for the candidate-facing report.]",
  "audit_trail": {
    "stage_1_episodes": 4,
    "stage_2_evidence_items": 12,
    "stage_3_mappings": 18,
    "stage_4_validated_mappings": 16,
    "stage_5_patterns_extracted": 8,
    "methodology": "Mischel-Shoda 1995 if-then signature extraction"
  }
}

VACANCY CONTEXT (used to prioritize which signatures to surface first):
{vacancy_skills}

VALIDATED MAPPINGS (with situation_features from Stage 3):
{validated_mappings}

EVIDENCE ITEMS (for narrative ID lookup):
{evidence}

EPISODES (for story count):
{episodes}
`;
