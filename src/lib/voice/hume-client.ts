// Hume AI Expression Measurement — Paralinguistic Analysis
// Analyses audio for emotional expression: tone, rhythm, timbre, vocal bursts
// Maps 48 Hume emotion dimensions to PSF skill confidence adjustments
//
// Hume Prosody model: measures how speech is delivered
// Hume Vocal Burst model: detects laughs, sighs, gasps
// Cost: ~$0.064/min audio-only

// ============================================================
// HUME API CLIENT
// ============================================================

interface HumeProsodyScore {
  name: string;  // e.g. "Admiration", "Anxiety", "Determination"
  score: number; // 0-1 intensity
}

interface HumeAnalysisResult {
  prosody: HumeProsodyScore[];       // 48 dimensions from speech
  vocal_bursts: HumeProsodyScore[];  // laughs, sighs, gasps
  dominant_emotions: string[];        // top 3 emotions detected
  emotional_intensity: number;        // 0-1 overall intensity
  authenticity_signals: {
    self_corrections: boolean;        // "actually, let me rethink"
    genuine_laughter: boolean;        // natural laughter detected
    thoughtful_pauses: boolean;       // reflective silence
    voice_tremor: boolean;            // genuine emotion in voice
    flat_affect: boolean;             // suspiciously even delivery
    rehearsed_pace: boolean;          // unnaturally smooth
  };
}

export interface ParalinguisticProfile {
  hume_raw: HumeAnalysisResult;
  skill_adjustments: SkillConfidenceAdjustment[];
  gaming_signals: GamingSignal[];
  summary: string;
}

export interface SkillConfidenceAdjustment {
  skill_name: string;
  adjustment: number;  // -0.15 to +0.15
  reason: string;
  hume_dimensions: string[];  // which Hume dimensions triggered this
}

export interface GamingSignal {
  type: 'flat_affect' | 'rehearsed' | 'incongruent' | 'authentic';
  confidence: number;
  evidence: string;
}

// ============================================================
// ANALYSE AUDIO WITH HUME
// ============================================================

export async function analyzeWithHume(audioBlob: Blob): Promise<HumeAnalysisResult | null> {
  const humeKey = process.env.HUME_API_KEY;
  if (!humeKey) {
    console.warn('HUME_API_KEY not set — skipping paralinguistic analysis');
    return null;
  }

  try {
    // Upload audio to Hume Expression Measurement batch API
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    // Start inference job with prosody + vocal burst models
    const jobRes = await fetch('https://api.hume.ai/v0/batch/jobs', {
      method: 'POST',
      headers: {
        'X-Hume-Api-Key': humeKey,
      },
      body: (() => {
        const fd = new FormData();
        fd.append('file', audioBlob, 'audio.webm');
        fd.append('json', JSON.stringify({
          models: {
            prosody: {},
            burst: {},
          },
        }));
        return fd;
      })(),
    });

    if (!jobRes.ok) {
      console.error('Hume job creation failed:', jobRes.status, await jobRes.text());
      return null;
    }

    const job = await jobRes.json();
    const jobId = job.job_id;

    // Poll for results (batch processing typically takes 2-10 seconds)
    let attempts = 0;
    const MAX_ATTEMPTS = 15;
    while (attempts < MAX_ATTEMPTS) {
      await new Promise(r => setTimeout(r, 1500));
      attempts++;

      const statusRes = await fetch(`https://api.hume.ai/v0/batch/jobs/${jobId}`, {
        headers: { 'X-Hume-Api-Key': humeKey },
      });

      if (!statusRes.ok) continue;
      const statusData = await statusRes.json();

      if (statusData.state?.status === 'COMPLETED') {
        // Get predictions
        const predRes = await fetch(`https://api.hume.ai/v0/batch/jobs/${jobId}/predictions`, {
          headers: { 'X-Hume-Api-Key': humeKey },
        });

        if (!predRes.ok) return null;
        const predictions = await predRes.json();
        return parseHumePredictions(predictions);
      }

      if (statusData.state?.status === 'FAILED') {
        console.error('Hume job failed:', statusData);
        return null;
      }
    }

    console.warn('Hume analysis timed out after', MAX_ATTEMPTS, 'attempts');
    return null;
  } catch (e) {
    console.error('Hume analysis error:', e);
    return null;
  }
}

// ============================================================
// PARSE HUME PREDICTIONS
// ============================================================

function parseHumePredictions(predictions: any): HumeAnalysisResult {
  const prosodyScores: HumeProsodyScore[] = [];
  const burstScores: HumeProsodyScore[] = [];

  // Extract prosody predictions
  try {
    const prosodyData = predictions?.[0]?.results?.predictions?.[0]?.models?.prosody?.grouped_predictions;
    if (prosodyData) {
      for (const group of prosodyData) {
        for (const pred of (group.predictions || [])) {
          for (const emotion of (pred.emotions || [])) {
            const existing = prosodyScores.find(s => s.name === emotion.name);
            if (existing) {
              existing.score = Math.max(existing.score, emotion.score);
            } else {
              prosodyScores.push({ name: emotion.name, score: emotion.score });
            }
          }
        }
      }
    }
  } catch { /* parsing is best-effort */ }

  // Extract vocal burst predictions
  try {
    const burstData = predictions?.[0]?.results?.predictions?.[0]?.models?.burst?.grouped_predictions;
    if (burstData) {
      for (const group of burstData) {
        for (const pred of (group.predictions || [])) {
          for (const emotion of (pred.emotions || [])) {
            burstScores.push({ name: emotion.name, score: emotion.score });
          }
        }
      }
    }
  } catch { /* parsing is best-effort */ }

  // Sort by score
  prosodyScores.sort((a, b) => b.score - a.score);
  burstScores.sort((a, b) => b.score - a.score);

  // Determine dominant emotions (top 3)
  const dominant = prosodyScores.slice(0, 3).map(s => s.name);

  // Calculate overall emotional intensity
  const topScores = prosodyScores.slice(0, 5).map(s => s.score);
  const intensity = topScores.length > 0 ? topScores.reduce((a, b) => a + b, 0) / topScores.length : 0;

  // Detect authenticity signals
  const getScore = (name: string) => prosodyScores.find(s => s.name.toLowerCase() === name.toLowerCase())?.score || 0;
  const hasBurst = (name: string) => burstScores.some(s => s.name.toLowerCase().includes(name.toLowerCase()) && s.score > 0.3);

  return {
    prosody: prosodyScores,
    vocal_bursts: burstScores,
    dominant_emotions: dominant,
    emotional_intensity: intensity,
    authenticity_signals: {
      self_corrections: false, // Detected from transcript, not audio alone
      genuine_laughter: hasBurst('amusement') || hasBurst('laughter') || hasBurst('joy'),
      thoughtful_pauses: getScore('contemplation') > 0.3 || getScore('concentration') > 0.3,
      voice_tremor: getScore('distress') > 0.3 || getScore('sadness') > 0.4,
      flat_affect: intensity < 0.15, // Very low emotional expression
      rehearsed_pace: false, // Would need tempo analysis — future enhancement
    },
  };
}

// ============================================================
// MAP TO PSF SKILL CONFIDENCE ADJUSTMENTS (from Voice Playbook)
// ============================================================

export function mapToSkillAdjustments(analysis: HumeAnalysisResult): SkillConfidenceAdjustment[] {
  const adjustments: SkillConfidenceAdjustment[] = [];
  const getScore = (name: string) => analysis.prosody.find(s => s.name.toLowerCase() === name.toLowerCase())?.score || 0;

  // Emotional activation when describing helping others → +Empathy
  const empathySignals = getScore('sympathy') + getScore('admiration') + getScore('love');
  if (empathySignals > 0.6) {
    adjustments.push({
      skill_name: 'Emotional Intelligence',
      adjustment: 0.10,
      reason: 'Genuine emotional activation detected when describing interpersonal situations',
      hume_dimensions: ['Sympathy', 'Admiration', 'Love'],
    });
  }

  // Calm tone during chaotic situation stories → +Self-Management
  const calmDuringStress = getScore('calmness') > 0.3 && getScore('determination') > 0.2;
  if (calmDuringStress) {
    adjustments.push({
      skill_name: 'Self-Management',
      adjustment: 0.10,
      reason: 'Calm and determined vocal tone while describing stressful situations',
      hume_dimensions: ['Calmness', 'Determination'],
    });
  }

  // Energy/enthusiasm when describing problem-solving → +Problem-Solving
  const enthusiasmSignals = getScore('excitement') + getScore('interest') + getScore('determination');
  if (enthusiasmSignals > 0.6) {
    adjustments.push({
      skill_name: 'Problem-Solving',
      adjustment: 0.08,
      reason: 'Enthusiasm and engagement detected in problem-solving narratives',
      hume_dimensions: ['Excitement', 'Interest', 'Determination'],
    });
  }

  // Natural laughter during adversity stories → +Resilience
  if (analysis.authenticity_signals.genuine_laughter) {
    adjustments.push({
      skill_name: 'Adaptability',
      adjustment: 0.10,
      reason: 'Natural laughter during adversity stories — genuine resilience signal',
      hume_dimensions: ['Amusement (vocal burst)'],
    });
  }

  // Thoughtful pauses before reflective answers → +Self-Awareness
  if (analysis.authenticity_signals.thoughtful_pauses) {
    adjustments.push({
      skill_name: 'Learning Agility',
      adjustment: 0.08,
      reason: 'Thoughtful pauses indicate genuine reflection rather than rehearsed responses',
      hume_dimensions: ['Contemplation', 'Concentration'],
    });
  }

  // Voice tremor/genuine emotion during difficulty → +Authenticity (all scores)
  if (analysis.authenticity_signals.voice_tremor) {
    adjustments.push({
      skill_name: '_all',
      adjustment: 0.05,
      reason: 'Genuine emotional response detected — increases overall authenticity',
      hume_dimensions: ['Distress', 'Sadness'],
    });
  }

  return adjustments;
}

// ============================================================
// DETECT GAMING FROM VOICE SIGNALS
// ============================================================

export function detectVoiceGaming(analysis: HumeAnalysisResult): GamingSignal[] {
  const signals: GamingSignal[] = [];

  // Flat affect when claiming emotional experience
  if (analysis.authenticity_signals.flat_affect) {
    signals.push({
      type: 'flat_affect',
      confidence: 0.7,
      evidence: `Very low emotional intensity (${(analysis.emotional_intensity * 100).toFixed(0)}%) — voice shows minimal emotion while content may describe stressful/emotional situations`,
    });
  }

  // Check for incongruence: positive words but negative voice or vice versa
  const anxiety = analysis.prosody.find(s => s.name === 'Anxiety')?.score || 0;
  const joy = analysis.prosody.find(s => s.name === 'Joy')?.score || 0;
  if (anxiety > 0.5 && joy > 0.4) {
    signals.push({
      type: 'incongruent',
      confidence: 0.5,
      evidence: 'Mixed signals: high anxiety and high joy simultaneously — may indicate performative response',
    });
  }

  // Authentic signal: genuine emotion
  if (analysis.emotional_intensity > 0.4 && !analysis.authenticity_signals.flat_affect) {
    signals.push({
      type: 'authentic',
      confidence: 0.8,
      evidence: `Natural emotional expression (intensity: ${(analysis.emotional_intensity * 100).toFixed(0)}%) with appropriate variation — consistent with genuine recall`,
    });
  }

  return signals;
}

// ============================================================
// BUILD FULL PARALINGUISTIC PROFILE
// ============================================================

export function buildParalinguisticProfile(analysis: HumeAnalysisResult): ParalinguisticProfile {
  const adjustments = mapToSkillAdjustments(analysis);
  const gaming = detectVoiceGaming(analysis);

  const summary = [
    `Emotional intensity: ${(analysis.emotional_intensity * 100).toFixed(0)}%`,
    `Dominant emotions: ${analysis.dominant_emotions.join(', ')}`,
    adjustments.length > 0 ? `${adjustments.length} skill confidence adjustment(s)` : 'No confidence adjustments',
    gaming.filter(g => g.type !== 'authentic').length > 0
      ? `${gaming.filter(g => g.type !== 'authentic').length} gaming flag(s) from voice`
      : 'No voice-based gaming flags',
    analysis.authenticity_signals.genuine_laughter ? 'Natural laughter detected' : '',
    analysis.authenticity_signals.thoughtful_pauses ? 'Thoughtful pauses observed' : '',
  ].filter(Boolean).join('. ');

  return {
    hume_raw: analysis,
    skill_adjustments: adjustments,
    gaming_signals: gaming,
    summary,
  };
}
