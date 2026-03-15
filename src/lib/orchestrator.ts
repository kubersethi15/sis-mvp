// LEEE Conversation Orchestrator
// Manages Moth-guided conversation flow, adaptive question selection, and session state

import { MothStage, LEEESession, LEEEMessage, GapScanResult, OrchestratorState } from '@/types';
import { LEEE_SYSTEM_PROMPT, LEEE_DYNAMIC_CONTEXT_TEMPLATE, LEEE_GAP_SCAN_PROMPT } from './prompts';
import { QUESTION_BANK, getPromptsByStage, getPromptsForSkillGap } from './question-bank';

// ============================================================
// STAGE TRANSITION LOGIC
// ============================================================

interface TransitionRule {
  from: MothStage;
  to: MothStage;
  condition: (state: OrchestratorState) => boolean;
}

const TRANSITION_RULES: TransitionRule[] = [
  // Opening → Story Select: after at least 5 warmup exchanges (genuine conversation)
  {
    from: 'opening',
    to: 'story_select',
    condition: (s) => {
      const openingTurns = s.messages.filter(m => m.moth_stage === 'opening' && m.role === 'user').length;
      return openingTurns >= 5;
    }
  },
  // Story Select → Elicitation: user has chosen a domain
  {
    from: 'story_select',
    to: 'elicitation',
    condition: (s) => {
      const selectTurns = s.messages.filter(m => m.moth_stage === 'story_select' && m.role === 'user').length;
      return selectTurns >= 1;
    }
  },
  // Elicitation → Core Probe: user has started telling a specific story
  {
    from: 'elicitation',
    to: 'core_probe',
    condition: (s) => {
      const elicitTurns = s.messages.filter(
        m => m.moth_stage === 'elicitation' && m.role === 'user'
      ).length;
      return elicitTurns >= 2;
    }
  },
  // Core Probe → Skill Probe: after action + decision + outcome established
  {
    from: 'core_probe',
    to: 'skill_probe',
    condition: (s) => {
      const probeTurns = s.messages.filter(
        m => m.moth_stage === 'core_probe' && m.role === 'user'
      ).length;
      return probeTurns >= 4; // enough turns for context + action + decision + outcome
    }
  },
  // Skill Probe → Verification: after 2-3 discriminating probes
  {
    from: 'skill_probe',
    to: 'verification',
    condition: (s) => {
      const skillTurns = s.messages.filter(
        m => m.moth_stage === 'skill_probe' && m.role === 'user'
      ).length;
      return skillTurns >= 2;
    }
  },
  // Verification → Story Select (for story 2): after verification complete
  {
    from: 'verification',
    to: 'story_select',
    condition: (s) => {
      const verifyTurns = s.messages.filter(
        m => m.moth_stage === 'verification' && m.role === 'user'
      ).length;
      return verifyTurns >= 1 && s.storiesCompleted < 2;
    }
  },
  // Verification → Micro Story (for story 3): after story 2 if gaps remain
  {
    from: 'verification',
    to: 'micro_story',
    condition: (s) => {
      const verifyTurns = s.messages.filter(
        m => m.moth_stage === 'verification' && m.role === 'user'
      ).length;
      return verifyTurns >= 1 && s.storiesCompleted >= 2 && !s.evidenceThresholdMet;
    }
  },
  // Verification → Closing: evidence threshold met or story 2 done with good coverage
  {
    from: 'verification',
    to: 'closing',
    condition: (s) => {
      const verifyTurns = s.messages.filter(
        m => m.moth_stage === 'verification' && m.role === 'user'
      ).length;
      return verifyTurns >= 1 && (s.evidenceThresholdMet || s.storiesCompleted >= 2);
    }
  },
  // Micro Story → Closing: always after micro story
  {
    from: 'micro_story',
    to: 'closing',
    condition: (s) => {
      const microTurns = s.messages.filter(
        m => m.moth_stage === 'micro_story' && m.role === 'user'
      ).length;
      return microTurns >= 1;
    }
  },
];

// ============================================================
// ORCHESTRATOR
// ============================================================

export class LEEEOrchestrator {
  private state: OrchestratorState;

  constructor(session: LEEESession, messages: LEEEMessage[] = []) {
    this.state = {
      session,
      messages,
      currentStage: session.current_stage || 'opening',
      storiesCompleted: session.stories_completed || 0,
      currentStoryTurnCount: 0,
      gapScan: null,
      suggestedPromptIds: [],
      evidenceThresholdMet: false,
      userDistressLevel: 0,
    };
  }

  // Get current state
  getState(): OrchestratorState {
    return { ...this.state };
  }

  // Add a message and update state
  addMessage(message: LEEEMessage): void {
    this.state.messages.push(message);
    if (message.role === 'user') {
      this.state.currentStoryTurnCount++;
      this.detectDistress(message.content);
      this.checkStageTransition();
      this.updateSuggestedPrompts();
    }
  }

  // Detect distress signals in user messages
  private detectDistress(content: string): void {
    const lower = content.toLowerCase();
    const distressKeywords = [
      'suicide', 'kill myself', 'end my life', 'want to die', 'self-harm',
      'hurting myself', 'can\'t go on', 'give up on life', 'hopeless',
    ];
    const mildDistressKeywords = [
      'depressed', 'anxious', 'panic', 'crying', 'overwhelmed',
      'can\'t cope', 'breaking down', 'falling apart', 'scared',
      'traumat', 'abuse', 'violence',
    ];

    if (distressKeywords.some(k => lower.includes(k))) {
      this.state.userDistressLevel = 3; // Crisis — stop immediately
    } else if (mildDistressKeywords.some(k => lower.includes(k))) {
      this.state.userDistressLevel = Math.max(this.state.userDistressLevel, 2) as 0 | 1 | 2 | 3;
    }
  }

  // Check if current story has enough STAR+E+R elements
  hasStoryCompleteness(): { complete: boolean; missing: string[] } {
    const storyMessages = this.state.messages.filter(
      m => m.role === 'user' && ['core_probe', 'skill_probe', 'elicitation'].includes(m.moth_stage)
    );
    const allText = storyMessages.map(m => m.content).join(' ').toLowerCase();

    const missing: string[] = [];
    // Check for situation/context signals
    const hasContext = allText.length > 50; // At least some substance
    if (!hasContext) missing.push('context');

    // Check for action signals (verbs indicating doing something)
    const actionWords = ['did', 'made', 'helped', 'created', 'built', 'solved', 'decided', 'went', 'told', 'asked', 'started', 'tried', 'figured', 'handled', 'managed'];
    const hasAction = actionWords.some(w => allText.includes(w));
    if (!hasAction) missing.push('action');

    // Check for outcome signals
    const outcomeWords = ['result', 'happened', 'turned out', 'worked', 'changed', 'better', 'success', 'achieved', 'ended up', 'outcome', 'finally'];
    const hasOutcome = outcomeWords.some(w => allText.includes(w));
    if (!hasOutcome) missing.push('outcome');

    // Check for reflection signals
    const reflectionWords = ['learned', 'realized', 'taught me', 'looking back', 'would do', 'differently', 'lesson', 'understand now'];
    const hasReflection = reflectionWords.some(w => allText.includes(w));
    if (!hasReflection) missing.push('reflection');

    return { complete: missing.length <= 1, missing }; // Allow 1 missing element
  }

  // Check if we should transition to next stage
  private checkStageTransition(): void {
    // Check transitions in order — first matching rule wins
    // But prioritize closing if time is running out
    const sessionMinutes = this.getSessionDurationMinutes();
    if (sessionMinutes >= 18 && this.state.currentStage !== 'closing') {
      this.transitionTo('closing');
      return;
    }

    for (const rule of TRANSITION_RULES) {
      if (rule.from === this.state.currentStage && rule.condition(this.state)) {
        this.transitionTo(rule.to);
        return;
      }
    }
  }

  private transitionTo(stage: MothStage): void {
    const prevStage = this.state.currentStage;
    this.state.currentStage = stage;

    // If transitioning from verification/closing back to story_select, increment story count
    if (
      (prevStage === 'verification' || prevStage === 'micro_story') &&
      (stage === 'story_select' || stage === 'closing')
    ) {
      this.state.storiesCompleted++;
      this.state.currentStoryTurnCount = 0;
    }
  }

  // Mark a story as complete (called after reflection probes)
  markStoryComplete(): void {
    this.state.storiesCompleted++;
    this.state.currentStoryTurnCount = 0;
  }

  // Update gap scan results
  updateGapScan(result: GapScanResult): void {
    this.state.gapScan = result;
    // Check if evidence threshold is met (at least 4 primary skills evidenced)
    const primaryEvidenced = [result.EQ, result.COMM, result.COLLAB, result.PS].filter(Boolean).length;
    this.state.evidenceThresholdMet = primaryEvidenced >= 3; // 3 of 4 primary skills
    this.state.session.skills_evidenced = result as any;
    this.updateSkillGaps();
  }

  private updateSkillGaps(): void {
    if (!this.state.gapScan) return;
    const gaps: Record<string, boolean> = {};
    const scan = this.state.gapScan;
    if (!scan.EQ) gaps['emotional_intelligence'] = true;
    if (!scan.COMM) gaps['communication'] = true;
    if (!scan.COLLAB) gaps['collaboration'] = true;
    if (!scan.PS) gaps['problem_solving'] = true;
    if (!scan.ADAPT) gaps['adaptability'] = true;
    if (!scan.LEARN) gaps['learning_agility'] = true;
    if (!scan.EMPATHY) gaps['empathy'] = true;
    if (!scan.DIGITAL) gaps['digital_fluency'] = true;
    this.state.skills_gaps = gaps as any;
    this.state.session.skills_gaps = gaps;
  }

  // Update distress level
  setDistressLevel(level: 0 | 1 | 2 | 3): void {
    this.state.userDistressLevel = level;
  }

  // Get session duration in minutes
  private getSessionDurationMinutes(): number {
    const start = new Date(this.state.session.started_at).getTime();
    const now = Date.now();
    return Math.floor((now - start) / 60000);
  }

  // Get suggested prompt IDs based on current state
  private updateSuggestedPrompts(): void {
    const stage = this.state.currentStage;
    const gaps = this.state.gapScan;
    const storyNum = this.state.storiesCompleted;

    let prompts: string[] = [];

    switch (stage) {
      case 'opening':
        prompts = ['F01', 'F02', 'F03', 'F04', 'F08', 'F09'];
        break;
      case 'story_select':
        if (storyNum === 0) {
          prompts = ['S11', 'S12', 'S18']; // First story — open choice
        } else if (storyNum === 1) {
          prompts = ['S19', 'S20']; // Second story — contrast with first
          // Add gap-targeted story selections
          if (gaps && !gaps.COLLAB) prompts.unshift('S14');
          if (gaps && !gaps.ADAPT) prompts.unshift('S13');
          if (gaps && !gaps.LEARN) prompts.unshift('S16');
        }
        break;
      case 'elicitation':
        prompts = ['E21', 'E22', 'E23', 'E24', 'E25', 'E28'];
        break;
      case 'core_probe':
        // Start with action, then decision, then outcome, then emotion, then reflection
        const coreUserTurns = this.state.messages.filter(
          m => m.moth_stage === 'core_probe' && m.role === 'user'
        ).length;
        if (coreUserTurns <= 1) prompts = ['P31', 'P32', 'E26']; // Action
        else if (coreUserTurns <= 2) prompts = ['P35', 'P36', 'P37']; // Decision
        else if (coreUserTurns <= 3) prompts = ['P41', 'P42']; // Outcome
        else if (coreUserTurns <= 4) prompts = ['P43', 'P44']; // Emotion
        else prompts = ['P47', 'P48', 'P49']; // Reflection
        break;
      case 'skill_probe':
        // Target gaps with discriminating probes
        prompts = [];
        if (gaps) {
          if (!gaps.COMM) prompts.push('X59', 'X66');
          if (!gaps.COLLAB) prompts.push('X67', 'P53', 'P54');
          if (!gaps.EQ) prompts.push('X60', 'X74');
          if (!gaps.PS) prompts.push('X64', 'X71');
          if (!gaps.ADAPT) prompts.push('X76');
          if (!gaps.EMPATHY) prompts.push('X68', 'X72');
        }
        if (prompts.length === 0) prompts = ['X62', 'X63', 'P46']; // Default discrimination probes
        break;
      case 'verification':
        prompts = ['V77', 'V80', 'V82', 'V83'];
        break;
      case 'micro_story':
        // Target weakest gaps
        if (gaps && !gaps.DIGITAL) prompts.push('Y89');
        if (gaps && !gaps.LEARN) prompts.push('Y89');
        if (gaps && !gaps.EMPATHY) prompts.push('Y91');
        if (prompts.length === 0) prompts = ['Y89', 'Y90', 'Y91', 'Y92', 'Y93'];
        break;
      case 'closing':
        prompts = ['C94', 'C95', 'C96', 'C97', 'C98'];
        break;
    }

    this.state.suggestedPromptIds = prompts;
  }

  // Build the dynamic context string to inject into the system prompt
  buildDynamicContext(): string {
    const s = this.state;
    const evidenced = s.gapScan
      ? Object.entries(s.gapScan)
          .filter(([_, v]) => v)
          .map(([k]) => k)
          .join(', ') || 'None yet'
      : 'None yet';
    const gaps = s.gapScan
      ? Object.entries(s.gapScan)
          .filter(([_, v]) => !v)
          .map(([k]) => k)
          .join(', ') || 'None — good coverage'
      : 'Not yet scanned';

    return LEEE_DYNAMIC_CONTEXT_TEMPLATE
      .replace('{current_stage}', s.currentStage)
      .replace('{stories_completed}', String(s.storiesCompleted))
      .replace('{duration_minutes}', String(this.getSessionDurationMinutes()))
      .replace('{skills_evidenced}', evidenced)
      .replace('{skills_gaps}', gaps)
      .replace('{language}', s.session.language_used || 'en')
      .replace('{accessibility_mode}', JSON.stringify(s.session.accessibility_mode || {}))
      .replace('{user_name}', 'User') // TODO: pull from profile
      .replace('{suggested_prompt_ids}', s.suggestedPromptIds.join(', '))
      .replace('{conversation_summary}', this.buildConversationSummary());
  }

  // Build conversation summary for context window management
  private buildConversationSummary(): string {
    const stories = this.state.storiesCompleted;
    if (stories === 0) return 'No stories completed yet.';

    const summaries: string[] = [];
    // Get last few messages as recent context
    const recentMessages = this.state.messages.slice(-6);
    summaries.push(`Stories completed: ${stories}`);
    summaries.push(`Current stage: ${this.state.currentStage}`);
    summaries.push(`Recent exchange: ${recentMessages.map(m => `${m.role}: ${m.content.substring(0, 100)}...`).join(' | ')}`);

    return summaries.join('\n');
  }

  // Build the full system message for the LLM
  buildSystemMessage(): string {
    const extraContext = (this as any)._extraContext || '';
    return LEEE_SYSTEM_PROMPT + '\n\n' + this.buildDynamicContext() + extraContext;
  }

  // Build messages array for LLM API call
  buildLLMMessages(): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [
      { role: 'system', content: this.buildSystemMessage() }
    ];

    // Add conversation history
    // For long conversations, summarize older messages to fit context window
    const allMessages = this.state.messages;
    const MAX_MESSAGES = 40; // Keep last 40 messages in full

    if (allMessages.length > MAX_MESSAGES) {
      // Summarize older messages
      const older = allMessages.slice(0, -MAX_MESSAGES);
      const summary = `[Earlier in the conversation: ${older.length} messages exchanged. ${this.state.storiesCompleted} stories discussed.]`;
      messages.push({ role: 'system', content: summary });

      // Add recent messages in full
      allMessages.slice(-MAX_MESSAGES).forEach(m => {
        messages.push({ role: m.role, content: m.content });
      });
    } else {
      allMessages.forEach(m => {
        messages.push({ role: m.role, content: m.content });
      });
    }

    return messages;
  }

  // Check if session should end
  shouldEndSession(): boolean {
    const duration = this.getSessionDurationMinutes();
    const totalUserTurns = this.state.messages.filter(m => m.role === 'user').length;
    return (
      this.state.currentStage === 'closing' ||
      duration >= 20 ||
      totalUserTurns >= 30 || // Hard limit: 30 user messages max
      this.state.userDistressLevel >= 3
    );
  }

  // Get the transcript for extraction
  getTranscript(): string {
    return this.state.messages
      .map(m => `${m.role === 'assistant' ? 'AI' : 'User'}: ${m.content}`)
      .join('\n');
  }
}
