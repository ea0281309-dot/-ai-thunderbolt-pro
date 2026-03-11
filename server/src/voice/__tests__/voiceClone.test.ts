/**
 * voiceClone.test.ts
 *
 * Unit tests for the voice cloning module.
 * Validates parameter mapping, post-processing smoothing, and TTS payload
 * construction without requiring live API calls.
 */

import {
  mapAccuracyToVoiceSettings,
  applyPostProcessingSmoothing,
  buildTTSPayload,
  type ElevenLabsVoiceSettings,
  type PitchProfile,
  type SynthesisOptions,
} from "../voiceClone";

// ---------------------------------------------------------------------------
// mapAccuracyToVoiceSettings
// ---------------------------------------------------------------------------

describe("mapAccuracyToVoiceSettings", () => {
  it("returns values within [0, 1] for all parameters", () => {
    const settings = mapAccuracyToVoiceSettings(0.8);
    expect(settings.stability).toBeGreaterThanOrEqual(0);
    expect(settings.stability).toBeLessThanOrEqual(1);
    expect(settings.similarity_boost).toBeGreaterThanOrEqual(0);
    expect(settings.similarity_boost).toBeLessThanOrEqual(1);
    expect(settings.style).toBeGreaterThanOrEqual(0);
    expect(settings.style).toBeLessThanOrEqual(1);
  });

  it("increases similarity_boost with higher accuracy", () => {
    const low = mapAccuracyToVoiceSettings(0.1);
    const high = mapAccuracyToVoiceSettings(0.9);
    expect(high.similarity_boost).toBeGreaterThan(low.similarity_boost);
  });

  it("increases style with higher accuracy", () => {
    const low = mapAccuracyToVoiceSettings(0.1);
    const high = mapAccuracyToVoiceSettings(0.9);
    expect(high.style).toBeGreaterThan(low.style);
  });

  it("always sets use_speaker_boost to true", () => {
    expect(mapAccuracyToVoiceSettings(0).use_speaker_boost).toBe(true);
    expect(mapAccuracyToVoiceSettings(1).use_speaker_boost).toBe(true);
  });

  it("clamps accuracy below 0 to 0", () => {
    const neg = mapAccuracyToVoiceSettings(-1);
    const zero = mapAccuracyToVoiceSettings(0);
    expect(neg.similarity_boost).toBe(zero.similarity_boost);
    expect(neg.stability).toBe(zero.stability);
  });

  it("clamps accuracy above 1 to 1", () => {
    const over = mapAccuracyToVoiceSettings(2);
    const one = mapAccuracyToVoiceSettings(1);
    expect(over.similarity_boost).toBe(one.similarity_boost);
  });

  it("reduces stability for emotional voices (high pitch stdDev)", () => {
    const flat: PitchProfile = {
      meanPitchHz: 180,
      pitchStdDev: 5,
      pitchRangeHz: [170, 190],
      emotionalTonality: "calm",
    };
    const expressive: PitchProfile = {
      meanPitchHz: 180,
      pitchStdDev: 50,
      pitchRangeHz: [130, 260],
      emotionalTonality: "excited",
    };
    const flatSettings = mapAccuracyToVoiceSettings(0.8, flat);
    const expressiveSettings = mapAccuracyToVoiceSettings(0.8, expressive);
    expect(expressiveSettings.stability).toBeLessThan(flatSettings.stability);
  });

  it("does not reduce stability below 0.2 for very emotional voices", () => {
    const veryExpressive: PitchProfile = {
      meanPitchHz: 250,
      pitchStdDev: 100,
      pitchRangeHz: [100, 400],
      emotionalTonality: "anxious",
    };
    const settings = mapAccuracyToVoiceSettings(0.1, veryExpressive);
    expect(settings.stability).toBeGreaterThanOrEqual(0.2);
  });
});

// ---------------------------------------------------------------------------
// applyPostProcessingSmoothing
// ---------------------------------------------------------------------------

describe("applyPostProcessingSmoothing", () => {
  const baseSettings: ElevenLabsVoiceSettings = {
    stability: 0.5,
    similarity_boost: 0.7,
    style: 0.4,
    use_speaker_boost: true,
  };

  it("increases stability with positive smoothing", () => {
    const smoothed = applyPostProcessingSmoothing(baseSettings, 0.8);
    expect(smoothed.stability).toBeGreaterThan(baseSettings.stability);
  });

  it("decreases style with positive smoothing", () => {
    const smoothed = applyPostProcessingSmoothing(baseSettings, 0.8);
    expect(smoothed.style).toBeLessThan(baseSettings.style);
  });

  it("does not modify settings with zero smoothing", () => {
    const smoothed = applyPostProcessingSmoothing(baseSettings, 0);
    expect(smoothed.stability).toBe(baseSettings.stability);
    expect(smoothed.style).toBe(baseSettings.style);
  });

  it("keeps stability within [0, 1]", () => {
    const nearMax: ElevenLabsVoiceSettings = {
      ...baseSettings,
      stability: 0.95,
    };
    const smoothed = applyPostProcessingSmoothing(nearMax, 1.0);
    expect(smoothed.stability).toBeLessThanOrEqual(1);
  });

  it("keeps style at or above 0", () => {
    const lowStyle: ElevenLabsVoiceSettings = {
      ...baseSettings,
      style: 0.05,
    };
    const smoothed = applyPostProcessingSmoothing(lowStyle, 1.0);
    expect(smoothed.style).toBeGreaterThanOrEqual(0);
  });

  it("does not change similarity_boost or use_speaker_boost", () => {
    const smoothed = applyPostProcessingSmoothing(baseSettings, 0.5);
    expect(smoothed.similarity_boost).toBe(baseSettings.similarity_boost);
    expect(smoothed.use_speaker_boost).toBe(baseSettings.use_speaker_boost);
  });

  it("clamps smoothingFactor below 0 to 0", () => {
    const smoothed = applyPostProcessingSmoothing(baseSettings, -1);
    expect(smoothed.stability).toBe(baseSettings.stability);
  });

  it("clamps smoothingFactor above 1 to 1", () => {
    const s1 = applyPostProcessingSmoothing(baseSettings, 1);
    const sOver = applyPostProcessingSmoothing(baseSettings, 5);
    expect(sOver.stability).toBe(s1.stability);
  });
});

// ---------------------------------------------------------------------------
// buildTTSPayload
// ---------------------------------------------------------------------------

describe("buildTTSPayload", () => {
  const baseOptions: SynthesisOptions = {
    accuracyLevel: 0.8,
    smoothingFactor: 0.5,
  };

  it("includes the provided text verbatim", () => {
    const payload = buildTTSPayload("Hello world", baseOptions);
    expect(payload.text).toBe("Hello world");
  });

  it("uses eleven_multilingual_v2 model by default", () => {
    const payload = buildTTSPayload("test", baseOptions);
    expect(payload.model_id).toBe("eleven_multilingual_v2");
  });

  it("includes voice_settings in the payload", () => {
    const payload = buildTTSPayload("test", baseOptions);
    expect(payload.voice_settings).toBeDefined();
    expect(typeof payload.voice_settings.stability).toBe("number");
    expect(typeof payload.voice_settings.similarity_boost).toBe("number");
  });

  it("includes language_code when language is provided", () => {
    const payload = buildTTSPayload("Hola", {
      ...baseOptions,
      language: "es-ES",
    });
    expect(payload.language_code).toBe("es-ES");
  });

  it("omits language_code when language is not provided", () => {
    const payload = buildTTSPayload("Hello", baseOptions);
    expect(payload.language_code).toBeUndefined();
  });

/** Acceptable tolerance when comparing stability values in accuracy tests */
const STABILITY_TOLERANCE = 0.01;

  it("applies pitch profile to voice settings", () => {
    const pitchProfile: PitchProfile = {
      meanPitchHz: 250,
      pitchStdDev: 55,
      pitchRangeHz: [180, 320],
      emotionalTonality: "excited",
    };
    const withProfile = buildTTSPayload("test", {
      ...baseOptions,
      pitchProfile,
    });
    const without = buildTTSPayload("test", baseOptions);
    // Excited/emotional profile should reduce stability
    expect(withProfile.voice_settings.stability).toBeLessThan(
      without.voice_settings.stability + STABILITY_TOLERANCE
    );
  });

  it("smoothing is applied after accuracy mapping", () => {
    const noSmooth = buildTTSPayload("test", {
      ...baseOptions,
      smoothingFactor: 0,
    });
    const maxSmooth = buildTTSPayload("test", {
      ...baseOptions,
      smoothingFactor: 1,
    });
    expect(maxSmooth.voice_settings.stability).toBeGreaterThan(
      noSmooth.voice_settings.stability
    );
  });
});

// ---------------------------------------------------------------------------
// Integration: accuracy levels produce differentiated outputs
// ---------------------------------------------------------------------------

describe("accuracy level differentiation", () => {
  const text = "This is a calibration test.";

  it("produces different voice settings for accuracy 0.1 vs 0.9", () => {
    const low = buildTTSPayload(text, { accuracyLevel: 0.1, smoothingFactor: 0 });
    const high = buildTTSPayload(text, { accuracyLevel: 0.9, smoothingFactor: 0 });
    expect(high.voice_settings.similarity_boost).toBeGreaterThan(
      low.voice_settings.similarity_boost
    );
    expect(high.voice_settings.style).toBeGreaterThan(low.voice_settings.style);
  });

  it("produces deterministic output for the same inputs", () => {
    const opts: SynthesisOptions = { accuracyLevel: 0.75, smoothingFactor: 0.3 };
    const p1 = buildTTSPayload(text, opts);
    const p2 = buildTTSPayload(text, opts);
    expect(p1).toEqual(p2);
  });
});
