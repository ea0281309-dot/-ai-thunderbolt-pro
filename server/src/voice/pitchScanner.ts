/**
 * pitchScanner.ts
 *
 * Enhanced pitch scanning module for voice cloning accuracy.
 * Detects fundamental frequency (F0), pitch contours, voice modulations,
 * and emotional tonalities from audio buffers.
 */

/** Result from a single pitch analysis frame */
export interface PitchFrame {
  /** Time offset in seconds from the start of the audio */
  timeSeconds: number;
  /** Detected fundamental frequency in Hz, or null when unvoiced */
  frequencyHz: number | null;
  /** Confidence score [0, 1] for this frame's pitch estimate */
  confidence: number;
  /** Whether this frame is classified as voiced speech */
  voiced: boolean;
}

/** Aggregate statistics produced by the pitch scanner */
export interface PitchScanResult {
  frames: PitchFrame[];
  /** Mean F0 across voiced frames, in Hz */
  meanPitchHz: number;
  /** Standard deviation of F0 across voiced frames */
  pitchStdDev: number;
  /** Detected pitch range [min, max] in Hz */
  pitchRangeHz: [number, number];
  /** Overall scan confidence [0, 1] */
  overallConfidence: number;
  /** Inferred emotional tonality */
  emotionalTonality: EmotionalTonality;
  /** Detected voice modulation patterns */
  modulations: VoiceModulation[];
}

/** Broad emotional category inferred from pitch dynamics */
export type EmotionalTonality =
  | "neutral"
  | "happy"
  | "sad"
  | "excited"
  | "calm"
  | "anxious";

/** A recurring pitch-movement pattern detected in the audio */
export interface VoiceModulation {
  type: "rising" | "falling" | "sustained" | "tremolo";
  /** Duration of the pattern in seconds */
  durationSeconds: number;
  /** Average pitch delta per second (Hz/s) during the pattern */
  rateHz: number;
}

/** User-configurable options for the pitch scanner */
export interface PitchScannerOptions {
  /**
   * Accuracy level from 0 (fastest / least accurate) to 1 (slowest / most
   * accurate).  Higher values reduce frame step size and apply stricter
   * voiced/unvoiced thresholds.
   * @default 0.8
   */
  accuracyLevel: number;
  /**
   * Frame duration in seconds.  Lower values capture faster pitch changes at
   * the cost of frequency resolution.
   * @default 0.025
   */
  frameDurationSeconds: number;
  /**
   * Frame step (hop) in seconds.  Smaller steps increase temporal resolution.
   * Derived from accuracyLevel when not supplied explicitly.
   */
  frameStepSeconds?: number;
  /**
   * Minimum frequency considered voiced speech (Hz).
   * @default 50
   */
  minFrequencyHz: number;
  /**
   * Maximum frequency considered voiced speech (Hz).
   * @default 500
   */
  maxFrequencyHz: number;
  /**
   * Voiced confidence threshold: frames below this are marked unvoiced.
   * Higher values are stricter and reduce false positives.
   * Automatically scaled with accuracyLevel.
   * @default 0.5
   */
  voicedThreshold?: number;
}

/** Default scanner options */
export const DEFAULT_OPTIONS: Readonly<PitchScannerOptions> = {
  accuracyLevel: 0.8,
  frameDurationSeconds: 0.025,
  minFrequencyHz: 50,
  maxFrequencyHz: 500,
};

/**
 * Resolves the complete option set, filling in derived defaults.
 */
export function resolveOptions(
  partial: Partial<PitchScannerOptions> = {}
): PitchScannerOptions {
  const base: PitchScannerOptions = { ...DEFAULT_OPTIONS, ...partial };

  // Frame step scales inversely with accuracyLevel so that higher accuracy
  // uses a smaller hop (denser analysis grid).
  if (base.frameStepSeconds === undefined) {
    base.frameStepSeconds =
      base.frameDurationSeconds * (1 - base.accuracyLevel * 0.5);
  }

  // Voiced threshold tightens as accuracy increases.
  if (base.voicedThreshold === undefined) {
    base.voicedThreshold = 0.35 + base.accuracyLevel * 0.3;
  }

  return base;
}

/**
 * Autocorrelation-based pitch detection for a single audio frame.
 *
 * Returns the estimated fundamental frequency and a confidence score.
 * The algorithm implements the Normalized Autocorrelation Function (NACF)
 * method which is robust across a wide range of voice types.
 */
export function detectPitchInFrame(
  samples: Float32Array,
  sampleRate: number,
  options: PitchScannerOptions
): { frequencyHz: number | null; confidence: number } {
  const minLag = Math.floor(sampleRate / options.maxFrequencyHz);
  const maxLag = Math.ceil(sampleRate / options.minFrequencyHz);

  if (samples.length < maxLag + 1) {
    return { frequencyHz: null, confidence: 0 };
  }

  // Compute normalized autocorrelation (NACF)
  const r0 = autocorrelate(samples, 0);
  if (r0 === 0) {
    return { frequencyHz: null, confidence: 0 };
  }

  let bestLag = minLag;
  let bestNacf = -Infinity;

  for (let lag = minLag; lag <= maxLag; lag++) {
    const nacf = autocorrelate(samples, lag) / r0;
    if (nacf > bestNacf) {
      bestNacf = nacf;
      bestLag = lag;
    }
  }

  const voicedThreshold = options.voicedThreshold ?? 0.5;
  if (bestNacf < voicedThreshold) {
    return { frequencyHz: null, confidence: bestNacf };
  }

  // Parabolic interpolation for sub-sample lag accuracy
  if (bestLag > minLag && bestLag < maxLag) {
    const prev = autocorrelate(samples, bestLag - 1) / r0;
    const next = autocorrelate(samples, bestLag + 1) / r0;
    const delta = (prev - next) / (2 * (2 * bestNacf - prev - next) || 1);
    bestLag += delta;
  }

  return {
    frequencyHz: sampleRate / bestLag,
    confidence: Math.min(bestNacf, 1),
  };
}

/** Computes the sum-of-products autocorrelation at a given lag. */
function autocorrelate(samples: Float32Array, lag: number): number {
  let sum = 0;
  const n = samples.length - lag;
  for (let i = 0; i < n; i++) {
    sum += samples[i] * samples[i + lag];
  }
  return sum;
}

/**
 * Scans an entire PCM audio buffer for pitch information.
 *
 * @param pcmSamples   Mono 32-bit float PCM samples in [-1, 1]
 * @param sampleRate   Sample rate in Hz (e.g. 44100 or 16000)
 * @param userOptions  Optional overrides (including accuracyLevel)
 * @returns            Complete scan result with statistics and modulations
 */
export function scanPitch(
  pcmSamples: Float32Array,
  sampleRate: number,
  userOptions: Partial<PitchScannerOptions> = {}
): PitchScanResult {
  const options = resolveOptions(userOptions);
  const frameSize = Math.round(options.frameDurationSeconds * sampleRate);
  const frameStep = Math.round((options.frameStepSeconds ?? 0.0125) * sampleRate);

  const frames: PitchFrame[] = [];

  for (
    let offset = 0;
    offset + frameSize <= pcmSamples.length;
    offset += frameStep
  ) {
    const frame = pcmSamples.subarray(offset, offset + frameSize);
    const { frequencyHz, confidence } = detectPitchInFrame(
      frame,
      sampleRate,
      options
    );
    frames.push({
      timeSeconds: offset / sampleRate,
      frequencyHz,
      confidence,
      voiced: frequencyHz !== null,
    });
  }

  const voicedFrames = frames.filter((f) => f.voiced && f.frequencyHz !== null);
  const pitchValues = voicedFrames.map((f) => f.frequencyHz as number);

  const meanPitchHz =
    pitchValues.length > 0
      ? pitchValues.reduce((a, b) => a + b, 0) / pitchValues.length
      : 0;

  const pitchStdDev =
    pitchValues.length > 1
      ? Math.sqrt(
          pitchValues
            .map((v) => Math.pow(v - meanPitchHz, 2))
            .reduce((a, b) => a + b, 0) / pitchValues.length
        )
      : 0;

  const pitchRangeHz: [number, number] =
    pitchValues.length > 0
      ? [Math.min(...pitchValues), Math.max(...pitchValues)]
      : [0, 0];

  const overallConfidence =
    frames.length > 0
      ? frames.reduce((a, b) => a + b.confidence, 0) / frames.length
      : 0;

  const emotionalTonality = inferEmotionalTonality(
    meanPitchHz,
    pitchStdDev,
    overallConfidence
  );

  const modulations = detectModulations(frames, sampleRate, frameStep);

  return {
    frames,
    meanPitchHz,
    pitchStdDev,
    pitchRangeHz,
    overallConfidence,
    emotionalTonality,
    modulations,
  };
}

/**
 * Infers emotional tonality from aggregate pitch statistics.
 * Heuristic thresholds are calibrated against common voice ranges.
 */
export function inferEmotionalTonality(
  meanPitchHz: number,
  pitchStdDev: number,
  confidence: number
): EmotionalTonality {
  if (confidence < 0.2 || meanPitchHz === 0) return "neutral";

  // High pitch + high variability → excited
  if (meanPitchHz > 220 && pitchStdDev > 40) return "excited";
  // High pitch + low variability → happy
  if (meanPitchHz > 180 && pitchStdDev <= 40) return "happy";
  // Low pitch + low variability → calm
  if (meanPitchHz < 120 && pitchStdDev < 15) return "calm";
  // Low pitch + moderate variability → sad
  if (meanPitchHz < 140 && pitchStdDev >= 15 && pitchStdDev < 35) return "sad";
  // Moderate pitch + high variability → anxious
  if (pitchStdDev > 50) return "anxious";

  return "neutral";
}

/**
 * Detects recurring pitch-movement patterns (modulations) in the frame
 * sequence.  Uses a simple sliding-window derivative approach.
 */
export function detectModulations(
  frames: PitchFrame[],
  sampleRate: number,
  frameStep: number
): VoiceModulation[] {
  const modulations: VoiceModulation[] = [];
  const voiced = frames.filter((f) => f.voiced && f.frequencyHz !== null);

  if (voiced.length < 3) return modulations;

  const stepSeconds = frameStep / sampleRate;
  let segmentStart = 0;

  for (let i = 1; i < voiced.length; i++) {
    const prev = voiced[i - 1].frequencyHz as number;
    const curr = voiced[i].frequencyHz as number;
    const delta = curr - prev;

    const segmentType = classifySegment(delta);
    const prevType =
      i > 1
        ? classifySegment(
            (voiced[i - 1].frequencyHz as number) -
              (voiced[i - 2].frequencyHz as number)
          )
        : segmentType;

    if (segmentType !== prevType || i === voiced.length - 1) {
      const segLen = (i - segmentStart) * stepSeconds;
      const segDelta =
        ((voiced[i - 1].frequencyHz as number) -
          (voiced[segmentStart].frequencyHz as number)) /
        (segLen || stepSeconds);

      if (segLen >= 0.05) {
        modulations.push({
          type: prevType,
          durationSeconds: segLen,
          rateHz: Math.abs(segDelta),
        });
      }
      segmentStart = i;
    }
  }

  return modulations;
}

/** Threshold Hz delta below which a pitch change is classified as sustained */
const SUSTAINED_THRESHOLD_HZ = 2;

function classifySegment(
  delta: number
): VoiceModulation["type"] {
  if (Math.abs(delta) < SUSTAINED_THRESHOLD_HZ) return "sustained";
  return delta > 0 ? "rising" : "falling";
}
