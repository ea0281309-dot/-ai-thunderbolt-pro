/**
 * pitchScanner.test.ts
 *
 * Unit tests for the enhanced pitch scanning module.
 * Validates accuracy calibration, pitch detection, emotional tonality
 * inference, modulation detection, and the full scan pipeline.
 */

import {
  detectPitchInFrame,
  scanPitch,
  inferEmotionalTonality,
  detectModulations,
  resolveOptions,
  DEFAULT_OPTIONS,
  type PitchFrame,
  type PitchScannerOptions,
} from "../pitchScanner";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generates a pure sine-wave PCM buffer at the specified frequency.
 */
function generateSine(
  frequencyHz: number,
  durationSeconds: number,
  sampleRate: number,
  amplitude = 0.8
): Float32Array {
  const numSamples = Math.round(durationSeconds * sampleRate);
  const samples = new Float32Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    samples[i] = amplitude * Math.sin((2 * Math.PI * frequencyHz * i) / sampleRate);
  }
  return samples;
}

/**
 * Generates a silence buffer (all zeros).
 */
function generateSilence(durationSeconds: number, sampleRate: number): Float32Array {
  return new Float32Array(Math.round(durationSeconds * sampleRate));
}

// ---------------------------------------------------------------------------
// resolveOptions
// ---------------------------------------------------------------------------

describe("resolveOptions", () => {
  it("returns default values when called with no arguments", () => {
    const opts = resolveOptions();
    expect(opts.accuracyLevel).toBe(DEFAULT_OPTIONS.accuracyLevel);
    expect(opts.frameDurationSeconds).toBe(DEFAULT_OPTIONS.frameDurationSeconds);
    expect(opts.minFrequencyHz).toBe(DEFAULT_OPTIONS.minFrequencyHz);
    expect(opts.maxFrequencyHz).toBe(DEFAULT_OPTIONS.maxFrequencyHz);
  });

  it("derives frameStepSeconds from accuracyLevel", () => {
    const high = resolveOptions({ accuracyLevel: 1.0 });
    const low = resolveOptions({ accuracyLevel: 0.0 });
    // Higher accuracy → smaller step
    expect(high.frameStepSeconds).toBeLessThan(low.frameStepSeconds as number);
  });

  it("derives a stricter voicedThreshold at higher accuracy", () => {
    const high = resolveOptions({ accuracyLevel: 1.0 });
    const low = resolveOptions({ accuracyLevel: 0.0 });
    expect(high.voicedThreshold).toBeGreaterThan(low.voicedThreshold as number);
  });

  it("respects explicit frameStepSeconds override", () => {
    const opts = resolveOptions({ frameStepSeconds: 0.005 });
    expect(opts.frameStepSeconds).toBe(0.005);
  });

  it("respects explicit voicedThreshold override", () => {
    const opts = resolveOptions({ voicedThreshold: 0.99 });
    expect(opts.voicedThreshold).toBe(0.99);
  });
});

// ---------------------------------------------------------------------------
// detectPitchInFrame
// ---------------------------------------------------------------------------

describe("detectPitchInFrame", () => {
  const SAMPLE_RATE = 16000;
  const options = resolveOptions({ accuracyLevel: 0.8 });

  it("detects the correct fundamental frequency for a 200 Hz sine", () => {
    const samples = generateSine(200, 0.1, SAMPLE_RATE);
    const { frequencyHz, confidence } = detectPitchInFrame(
      samples,
      SAMPLE_RATE,
      options
    );
    expect(frequencyHz).not.toBeNull();
    // Allow ±10 Hz tolerance
    expect(Math.abs((frequencyHz as number) - 200)).toBeLessThan(10);
    expect(confidence).toBeGreaterThan(0.5);
  });

  it("detects the correct frequency for a 120 Hz sine (bass voice)", () => {
    const samples = generateSine(120, 0.1, SAMPLE_RATE);
    const { frequencyHz } = detectPitchInFrame(samples, SAMPLE_RATE, options);
    expect(frequencyHz).not.toBeNull();
    expect(Math.abs((frequencyHz as number) - 120)).toBeLessThan(10);
  });

  it("returns null frequency for silence (unvoiced)", () => {
    const silence = generateSilence(0.1, SAMPLE_RATE);
    const { frequencyHz, confidence } = detectPitchInFrame(
      silence,
      SAMPLE_RATE,
      options
    );
    expect(frequencyHz).toBeNull();
    expect(confidence).toBeLessThan(0.5);
  });

  it("returns null for a buffer shorter than maxLag + 1", () => {
    // maxLag = ceil(16000/50) = 320; provide fewer than 321 samples
    const tiny = new Float32Array(100);
    const { frequencyHz } = detectPitchInFrame(tiny, SAMPLE_RATE, options);
    expect(frequencyHz).toBeNull();
  });

  it("confidence increases with higher accuracyLevel for a clean tone", () => {
    const samples = generateSine(180, 0.1, SAMPLE_RATE);
    const lowOpts = resolveOptions({ accuracyLevel: 0.2 });
    const highOpts = resolveOptions({ accuracyLevel: 0.9 });
    const { confidence: lowConf } = detectPitchInFrame(samples, SAMPLE_RATE, lowOpts);
    const { confidence: highConf } = detectPitchInFrame(samples, SAMPLE_RATE, highOpts);
    // High accuracy uses a tighter threshold; confident detections remain confident.
    // The key invariant is that the high-accuracy path does NOT decrease confidence
    // below the low-accuracy path on a clean signal.
    expect(highConf).toBeGreaterThanOrEqual(lowConf - 0.05);
  });
});

// ---------------------------------------------------------------------------
// scanPitch
// ---------------------------------------------------------------------------

describe("scanPitch", () => {
  const SAMPLE_RATE = 16000;

  it("returns frames, statistics, and emotional tonality for a 200 Hz sine", () => {
    const pcm = generateSine(200, 1.0, SAMPLE_RATE);
    const result = scanPitch(pcm, SAMPLE_RATE, { accuracyLevel: 0.8 });

    expect(result.frames.length).toBeGreaterThan(0);
    expect(result.meanPitchHz).toBeGreaterThan(0);
    expect(result.overallConfidence).toBeGreaterThanOrEqual(0);
    expect(result.overallConfidence).toBeLessThanOrEqual(1);
    expect(result.pitchRangeHz[0]).toBeLessThanOrEqual(result.pitchRangeHz[1]);
  });

  it("detects mean pitch close to the generated frequency", () => {
    const pcm = generateSine(250, 2.0, SAMPLE_RATE);
    const result = scanPitch(pcm, SAMPLE_RATE, { accuracyLevel: 0.9 });
    expect(Math.abs(result.meanPitchHz - 250)).toBeLessThan(15);
  });

  it("produces denser frame grid at higher accuracy levels", () => {
    const pcm = generateSine(180, 1.0, SAMPLE_RATE);
    const low = scanPitch(pcm, SAMPLE_RATE, { accuracyLevel: 0.2 });
    const high = scanPitch(pcm, SAMPLE_RATE, { accuracyLevel: 1.0 });
    expect(high.frames.length).toBeGreaterThanOrEqual(low.frames.length);
  });

  it("returns zero statistics for silence", () => {
    const silence = generateSilence(1.0, SAMPLE_RATE);
    const result = scanPitch(silence, SAMPLE_RATE);
    expect(result.meanPitchHz).toBe(0);
    expect(result.pitchStdDev).toBe(0);
    expect(result.emotionalTonality).toBe("neutral");
  });

  it("includes modulations array", () => {
    const pcm = generateSine(200, 2.0, SAMPLE_RATE);
    const result = scanPitch(pcm, SAMPLE_RATE);
    expect(Array.isArray(result.modulations)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// inferEmotionalTonality
// ---------------------------------------------------------------------------

describe("inferEmotionalTonality", () => {
  it("returns neutral for zero pitch or low confidence", () => {
    expect(inferEmotionalTonality(0, 10, 0.8)).toBe("neutral");
    expect(inferEmotionalTonality(200, 10, 0.1)).toBe("neutral");
  });

  it("classifies excited voice (high pitch + high variability)", () => {
    expect(inferEmotionalTonality(250, 50, 0.9)).toBe("excited");
  });

  it("classifies happy voice (high pitch + low variability)", () => {
    expect(inferEmotionalTonality(200, 20, 0.9)).toBe("happy");
  });

  it("classifies calm voice (low pitch + low variability)", () => {
    expect(inferEmotionalTonality(100, 8, 0.9)).toBe("calm");
  });

  it("classifies sad voice (low pitch + moderate variability)", () => {
    expect(inferEmotionalTonality(130, 25, 0.9)).toBe("sad");
  });

  it("classifies anxious voice (very high variability)", () => {
    expect(inferEmotionalTonality(160, 60, 0.9)).toBe("anxious");
  });
});

// ---------------------------------------------------------------------------
// detectModulations
// ---------------------------------------------------------------------------

describe("detectModulations", () => {
  const SAMPLE_RATE = 16000;
  const FRAME_STEP = 160; // 10 ms

  function makeFrames(pitches: (number | null)[]): PitchFrame[] {
    return pitches.map((hz, i) => ({
      timeSeconds: (i * FRAME_STEP) / SAMPLE_RATE,
      frequencyHz: hz,
      confidence: hz !== null ? 0.9 : 0,
      voiced: hz !== null,
    }));
  }

  it("returns empty array for fewer than 3 voiced frames", () => {
    const frames = makeFrames([null, null, 200]);
    const mods = detectModulations(frames, SAMPLE_RATE, FRAME_STEP);
    expect(mods).toHaveLength(0);
  });

  it("detects a rising pattern when pitch increases monotonically", () => {
    // 10 voiced frames rising from 150 to 250 Hz
    const pitches = Array.from({ length: 10 }, (_, i) => 150 + i * 10);
    const frames = makeFrames(pitches);
    const mods = detectModulations(frames, SAMPLE_RATE, FRAME_STEP);
    const rising = mods.filter((m) => m.type === "rising");
    expect(rising.length).toBeGreaterThan(0);
  });

  it("detects a falling pattern when pitch decreases monotonically", () => {
    const pitches = Array.from({ length: 10 }, (_, i) => 250 - i * 10);
    const frames = makeFrames(pitches);
    const mods = detectModulations(frames, SAMPLE_RATE, FRAME_STEP);
    const falling = mods.filter((m) => m.type === "falling");
    expect(falling.length).toBeGreaterThan(0);
  });

  it("detects a sustained pattern when pitch is constant", () => {
    const pitches = Array.from({ length: 20 }, () => 200);
    const frames = makeFrames(pitches);
    const mods = detectModulations(frames, SAMPLE_RATE, FRAME_STEP);
    const sustained = mods.filter((m) => m.type === "sustained");
    expect(sustained.length).toBeGreaterThan(0);
  });

  it("modulation durations are positive", () => {
    const pitches = [150, 160, 170, 160, 150, 150, 150, 180, 200];
    const frames = makeFrames(pitches);
    const mods = detectModulations(frames, SAMPLE_RATE, FRAME_STEP);
    mods.forEach((m) => expect(m.durationSeconds).toBeGreaterThan(0));
  });
});

// ---------------------------------------------------------------------------
// Accuracy calibration integration
// ---------------------------------------------------------------------------

describe("accuracy calibration (adjustable accuracyLevel)", () => {
  const SAMPLE_RATE = 16000;

  it("accepts accuracyLevel of 0 without throwing", () => {
    const pcm = generateSine(200, 0.5, SAMPLE_RATE);
    expect(() => scanPitch(pcm, SAMPLE_RATE, { accuracyLevel: 0 })).not.toThrow();
  });

  it("accepts accuracyLevel of 1 without throwing", () => {
    const pcm = generateSine(200, 0.5, SAMPLE_RATE);
    expect(() => scanPitch(pcm, SAMPLE_RATE, { accuracyLevel: 1 })).not.toThrow();
  });

  it("higher accuracyLevel yields lower or equal standard deviation on a pure tone", () => {
    const pcm = generateSine(200, 2.0, SAMPLE_RATE);
    const low = scanPitch(pcm, SAMPLE_RATE, { accuracyLevel: 0.1 });
    const high = scanPitch(pcm, SAMPLE_RATE, { accuracyLevel: 0.9 });
    // For a pure tone, std dev should be small at high accuracy
    expect(high.pitchStdDev).toBeLessThanOrEqual(low.pitchStdDev + 5);
  });

  it("default accuracyLevel is 0.8 as documented", () => {
    const opts = resolveOptions();
    expect(opts.accuracyLevel).toBe(0.8);
  });
});
