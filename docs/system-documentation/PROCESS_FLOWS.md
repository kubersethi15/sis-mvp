# Kaya — Process Flows

## 1. Candidate Assessment Journey

```mermaid
flowchart TD
    A[Job Seeker Creates Profile] --> B[Talks to Aya - Voice or Text]
    B --> C{Session Complete?}
    C -->|No, continue| B
    C -->|Yes| D[LEEE 5-Stage Extraction]
    D --> E[Skills Profile Generated]
    E --> F[Browse & Apply to Vacancies]
    F --> G[Gate 1: Alignment Review]
    G -->|Pass| H[Gate 2: Evidence Review]
    G -->|Hold/Stop| Z1[Feedback to Candidate]
    H -->|Pass| I[Layer 2: Workplace Simulation]
    H -->|More Evidence| B
    H -->|Stop| Z1
    I --> J[Layer 3: References Rate]
    J --> K[Three-Layer Convergence]
    K --> L[Gate 3: Final Review]
    L -->|Selected| M[Psychologist Validation]
    L -->|Declined| Z1
    M --> N[Skills Passport Issued]
```

**Plain English:** The candidate creates a profile, then has a conversation with Aya (text or voice). The AI extracts skills from their stories using a 5-stage pipeline. They apply to a job. A human reviewer checks alignment (Gate 1), then evidence quality (Gate 2). If passed, they enter a workplace simulation where AI characters test their behavior. References independently rate them. All three layers are compared (convergence). A final reviewer decides (Gate 3). If selected, a psychologist validates the full audit trail and issues a skills passport.

## 2. LEEE Extraction Pipeline

```mermaid
flowchart LR
    A[Conversation Transcript] --> B[Stage 1: Segmentation]
    B --> C[Episodes Identified]
    C --> D[Stage 2: STAR+E+R]
    D --> E[Evidence Items]
    E --> F[Stage 3: Skill Mapping]
    F --> G[Skill-Evidence Links]
    G --> H[Stage 4: Consistency]
    H --> I[Validated Evidence]
    I --> J[Stage 5: Proficiency]
    J --> K[Skills Profile]
    
    V[Voice Analysis - Hume AI] -.->|Post-Stage 5| K
    T[Training Tag] -.->|Auto-compare vs baseline| K
```

**Plain English:** The transcript goes through 5 AI stages. Stage 1 identifies discrete stories (episodes). Stage 2 extracts structured evidence using STAR+E+R format. Stage 3 maps evidence to PSF skills weighted by the vacancy requirements. Stage 4 cross-references for consistency and catches gaming. Stage 5 assigns proficiency levels with confidence scores. If voice data exists, paralinguistic adjustments are applied. If the session is tagged post-training, it auto-compares against the baseline.

## 3. Layer 2 Simulation Flow

```mermaid
flowchart TD
    A[Candidate Enters Simulation] --> B[Scenario Selected]
    B --> C{Employer-specific available?}
    C -->|Yes| D[Use Generated Scenario]
    C -->|No| E[Use Static Scenario]
    D --> F[GameMaster Starts]
    E --> F
    F --> G[Characters Speak - Round 1]
    G --> H[Candidate Responds]
    H --> I{Checkpoint?}
    I -->|Yes| J[Sotopia-Eval Scoring]
    I -->|No| K{Twist?}
    J --> K
    K -->|Yes| L[Inject Twist]
    K -->|No| M{More Rounds?}
    L --> G
    M -->|Yes| G
    M -->|No| N[Calculate Convergence L1↔L2]
    N --> O[Gaming Detection]
    O --> P[Store Results]
```

**Plain English:** The candidate enters a workplace simulation with 3 AI characters who have distinct personalities and agendas. The system uses employer-generated scenarios if available, otherwise static ones. Over 5-6 rounds, characters respond to the candidate, checkpoints evaluate performance on 7 dimensions, and twists escalate complexity. After completion, the system compares simulation behavior (L2) against conversation claims (L1) to check convergence.

## 4. Three-Layer Convergence

```mermaid
flowchart TD
    L1[Layer 1: Self-Report<br/>Weight 0.25] --> CONV[Convergence Calculator]
    L2[Layer 2: Simulation<br/>Weight 0.40] --> CONV
    L3[Layer 3: Peer/360<br/>Weight 0.35] --> CONV
    CONV --> TYPE{Convergence Type}
    TYPE --> FA[Full Agreement<br/>+0.15 confidence]
    TYPE --> US[Undersell<br/>L2+L3 > L1<br/>+0.05 confidence]
    TYPE --> OC[Overclaim<br/>L1 > L2+L3<br/>-0.10 confidence]
    TYPE --> DIV[Divergent<br/>Flag for review]
    FA --> COMBINED[Combined Score + Confidence]
    US --> COMBINED
    OC --> COMBINED
    DIV --> COMBINED
```

**Plain English:** Each skill is scored independently by three layers. The combined score weights behavioral observation (L2) highest at 40%, peer validation (L3) at 35%, and self-report (L1) at 25%. When all three agree, confidence is highest. When the candidate undersells (peers and simulation rate them higher than they rate themselves), confidence is boosted. When they overclaim (they say they're better than simulation and peers suggest), confidence is reduced and it's flagged for the psychologist.

## 5. Employer Scenario Generation

```mermaid
flowchart TD
    A[Employer Uploads Seed Material] --> B[Claude Extracts Knowledge Graph]
    B --> C[Nodes: Roles, Departments,<br/>Customers, Processes]
    B --> D[Edges: Reports-to, Serves,<br/>Depends-on, Conflicts-with]
    B --> E[Friction Points + Critical Skills]
    C --> F[Discovery Simulation]
    D --> F
    E --> F
    F --> G[20-50 Agents Spawned from Graph]
    G --> H[Agents Interact Over 3-4 Rounds]
    H --> I[Situations Scored by Assessment Value]
    I --> J[Top Situations → ScenarioConfig]
    J --> K[Characters + Checkpoints + Twists]
    K --> L[Employer Previews & Approves]
    L --> M[Candidates Enter<br/>Employer-Specific Simulations]
```

**Plain English:** The employer pastes their workplace context (job descriptions, handbook, company description). Claude extracts a knowledge graph of their workplace — who works there, how they relate, what goes wrong. A discovery simulation spawns agents from this graph and lets them interact to find which situations most differentiate skilled from unskilled performers. The top situations are converted into full simulation scenarios with characters, checkpoints, and twists. The employer previews and approves. Candidates then enter simulations tailored to that specific workplace.

## 6. Psychologist Validation Flow

```mermaid
flowchart TD
    A[Psychologist Opens /psychologist] --> B[Selects Candidate Extraction]
    B --> C[Reviews Layer 1: Audit Trail<br/>Episodes, Evidence, Skills,<br/>Gaming Flags, Cultural Notes]
    C --> D[Reviews Layer 2: Simulation<br/>Sotopia-Eval Scores, Convergence,<br/>Voice Signals, Observer Summary]
    D --> E[Reviews Layer 3: Peer/360<br/>Three-Layer Convergence Table,<br/>Independence Verification]
    E --> F[Reviews Methodology<br/>Research Anchoring Document]
    F --> G{Decision}
    G -->|Endorse| H[Enters PRC License + Notes<br/>Skills Passport Validated]
    G -->|Reject| I[Returns with Revision Notes]
    G -->|Request Revision| J[Specific Issues Flagged]
```

**Plain English:** The psychologist reviews the complete evidence trail across all three layers. They see the extraction (what was said), the simulation (what was done), the peer ratings (what others confirm), and the methodology (why this approach is valid). They then make a professional judgment: endorse the skills passport (entering their PRC license number), reject it, or request specific revisions. This human validation is what gives the skills passport professional credibility.

## 7. Training Impact Measurement

```mermaid
flowchart TD
    A[Baseline Session<br/>Tagged 'baseline'] --> B[LEEE Extraction<br/>Snapshot 1]
    C[Training Program<br/>10 weeks] --> D[Post-Program Session<br/>Tagged 'post-program']
    D --> E[LEEE Extraction<br/>Snapshot 2]
    E --> F[Auto-Compare<br/>Finds Baseline, Calculates Delta]
    F --> G[Skills Delta per Skill<br/>Direction + Magnitude]
    F --> H[Skills Velocity<br/>Points per Week]
    B --> I[Cohort Aggregation]
    G --> I
    H --> I
    I --> J[Funder Report<br/>'15 graduates, avg 2.1 level<br/>improvement in Communication']
```

**Plain English:** Before training, the candidate does a baseline conversation with Aya. After the program, they do another one tagged as "post-program." The system automatically finds the baseline and calculates how each skill changed. Skills Velocity measures the improvement rate per week. Multiple candidates are aggregated into cohort reports showing which programs produce the most improvement — the metric that proves to funders and government that training works.
