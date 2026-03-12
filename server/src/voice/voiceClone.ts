/**
 * voiceClone.ts
 *
 * ElevenLabs voice cloning integration with enhanced accuracy controls.
 * Provides functions to create, manage, and synthesize cloned voices while
 * applying the pitch-scan calibration data produced by pitchScanner.ts.
 */

import type { PitchScanResult } from "./pitchScanner";

// ---------------------------------------------------------------------------
// Types & interfaces
// ---------------------------------------------------------------------------

/** Stored metadata for a cloned voice */
export interface ClonedVoice {
  /** ElevenLabs voice ID returned after cloning */
  voiceId: string;
  /** Human-readable display name */
  name: string;
  description: string;
  gender: "male" | "female" | "neutral";
  /** BCP-47 language tag, e.g. "en-US" */
  language: string;
  createdAt: string;
  /** Pitch scan statistics captured during cloning */
  pitchProfile?: PitchProfile;
}

/** Distilled pitch statistics stored with the cloned voice record */
export interface PitchProfile {
  meanPitchHz: number;
  pitchStdDev: number;
  pitchRangeHz: [number, number];
  emotionalTonality: string;
}

/** Parameters for creating a new cloned voice */
export interface VoiceCloneRequest {
  name: string;
  description: string;
  gender: "male" | "female" | "neutral";
  language: string;
  /** Base64-encoded audio files (MP3 or WAV, 30 s – 5 min each) */
  audioFiles: string[];
  pitchScanResult?: PitchScanResult;
}

/** Parameters controlling speech synthesis quality */
export interface SynthesisOptions {
  /**
   * User-defined accuracy level [0, 1].
   * Maps to ElevenLabs similarity_boost and stability settings.
   * @default 0.8
   */
  accuracyLevel: number;
  /**
   * Post-processing smoothing factor [0, 1].
   * 0 = no smoothing, 1 = maximum smoothing.
   * @default 0.5
   */
  smoothingFactor: number;
  /** BCP-47 language tag used for pronunciation guidance */
  language?: string;
  /** Optional pitch profile used to bias synthesis parameters */
  pitchProfile?: PitchProfile;
}

/** Mapped ElevenLabs voice settings */
export interface ElevenLabsVoiceSettings {
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

/** ElevenLabs text-to-speech request body */
export interface ElevenLabsTTSPayload {
  text: string;
  model_id: string;
  voice_settings: ElevenLabsVoiceSettings;
  language_code?: string;
}

/** Result returned by synthesizeVoice */
export interface SynthesisResult {
  /** Raw audio bytes (MP3 from ElevenLabs) */
  audioBuffer: Buffer;
  /** MIME type of the audio data */
  contentType: "audio/mpeg";
  /** Duration estimate in seconds (based on average speaking rate) */
  estimatedDurationSeconds: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default accuracy level for synthesis */
const DEFAULT_ACCURACY_LEVEL = 0.8;
/** Average words per second for duration estimation */
const AVG_WORDS_PER_SECOND = 2.5;

// ---------------------------------------------------------------------------
// Parameter mapping
// ---------------------------------------------------------------------------

/**
 * Maps a [0, 1] accuracy level and optional pitch profile to ElevenLabs
 * voice settings.
 *
 * ElevenLabs parameters:
 * - `stability`       [0, 1]: lower = more expressive, higher = more stable
 * - `similarity_boost`[0, 1]: higher = closer to the original voice
 * - `style`           [0, 1]: higher = more expressive delivery
 * - `use_speaker_boost`: always true for cloned voices
 */
export function mapAccuracyToVoiceSettings(
  accuracyLevel: number,
  pitchProfile?: PitchProfile
): ElevenLabsVoiceSettings {
  const clampedAccuracy = Math.max(0, Math.min(1, accuracyLevel));

  // similarity_boost scales linearly with accuracy
  const similarity_boost = 0.5 + clampedAccuracy * 0.45;

  // stability: for emotional voices (high stdDev) we slightly reduce
  // stability to preserve expressiveness
  let stability = 0.3 + clampedAccuracy * 0.4;
  if (pitchProfile && pitchProfile.pitchStdDev > 30) {
    stability = Math.max(0.2, stability - 0.1);
  }

  // style: higher accuracy → more stylistic fidelity
  const style = clampedAccuracy * 0.5;

  return {
    stability,
    similarity_boost,
    style,
    use_speaker_boost: true,
  };
}

/**
 * Applies post-processing smoothing to a set of voice settings.
 * Smoothing raises stability and lowers the style exaggeration factor,
 * reducing artefacts in synthesized audio without changing voice identity.
 */
export function applyPostProcessingSmoothing(
  settings: ElevenLabsVoiceSettings,
  smoothingFactor: number
): ElevenLabsVoiceSettings {
  const s = Math.max(0, Math.min(1, smoothingFactor));
  return {
    ...settings,
    stability: Math.min(1, settings.stability + s * 0.15),
    style: Math.max(0, settings.style - s * 0.1),
  };
}

/**
 * Builds the complete ElevenLabs TTS request payload.
 */
export function buildTTSPayload(
  text: string,
  options: SynthesisOptions
): ElevenLabsTTSPayload {
  const rawSettings = mapAccuracyToVoiceSettings(
    options.accuracyLevel ?? DEFAULT_ACCURACY_LEVEL,
    options.pitchProfile
  );

  const voiceSettings = applyPostProcessingSmoothing(
    rawSettings,
    options.smoothingFactor ?? 0.5
  );

  const payload: ElevenLabsTTSPayload = {
    text,
    // Use the multilingual v2 model for best accuracy across languages
    model_id: "eleven_multilingual_v2",
    voice_settings: voiceSettings,
  };

  if (options.language) {
    payload.language_code = options.language;
  }

  return payload;
}

// ---------------------------------------------------------------------------
// Voice cloning & synthesis
// ---------------------------------------------------------------------------

/**
 * Clones a voice using the ElevenLabs Instant Voice Cloning API.
 *
 * @param request   Voice clone request data including audio files
 * @param apiKey    ElevenLabs API key from environment
 * @returns         The new ClonedVoice record including the ElevenLabs voice ID
 */
export async function cloneVoice(
  request: VoiceCloneRequest,
  apiKey: string
): Promise<ClonedVoice> {
  const formData = new FormData();
  formData.append("name", request.name);
  formData.append("description", request.description);

  for (let i = 0; i < request.audioFiles.length; i++) {
    const base64 = request.audioFiles[i];
    const binaryStr = Buffer.from(base64, "base64");
    const blob = new Blob([binaryStr], { type: "audio/mpeg" });
    formData.append("files", blob, `sample_${i + 1}.mp3`);
  }

  const response = await fetch(
    "https://api.elevenlabs.io/v1/voices/add",
    {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: formData,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs cloning failed (${response.status}): ${errorText}`
    );
  }

  const data = (await response.json()) as { voice_id: string };

  const pitchProfile: PitchProfile | undefined = request.pitchScanResult
    ? {
        meanPitchHz: request.pitchScanResult.meanPitchHz,
        pitchStdDev: request.pitchScanResult.pitchStdDev,
        pitchRangeHz: request.pitchScanResult.pitchRangeHz,
        emotionalTonality: request.pitchScanResult.emotionalTonality,
      }
    : undefined;

  return {
    voiceId: data.voice_id,
    name: request.name,
    description: request.description,
    gender: request.gender,
    language: request.language,
    createdAt: new Date().toISOString(),
    pitchProfile,
  };
}

/**
 * Synthesizes speech from a cloned voice using the ElevenLabs TTS API.
 *
 * @param text        Text to synthesize
 * @param voiceId     ElevenLabs voice ID
 * @param options     Synthesis quality options
 * @param apiKey      ElevenLabs API key
 * @returns           Audio buffer and metadata
 */
export async function synthesizeVoice(
  text: string,
  voiceId: string,
  options: SynthesisOptions,
  apiKey: string
): Promise<SynthesisResult> {
  const payload = buildTTSPayload(text, options);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs TTS failed (${response.status}): ${errorText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBuffer = Buffer.from(arrayBuffer);

  const wordCount = text.trim().split(/\s+/).length;
  const estimatedDurationSeconds = wordCount / AVG_WORDS_PER_SECOND;

  return {
    audioBuffer,
    contentType: "audio/mpeg",
    estimatedDurationSeconds,
  };
}

/**
 * Deletes a cloned voice from ElevenLabs.
 */
export async function deleteClonedVoice(
  voiceId: string,
  apiKey: string
): Promise<void> {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/voices/${voiceId}`,
    {
      method: "DELETE",
      headers: { "xi-api-key": apiKey },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `ElevenLabs delete failed (${response.status}): ${errorText}`
    );
  }
}
