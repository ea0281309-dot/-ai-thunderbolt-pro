/**
 * voices.ts – REST API routes for voice management
 *
 * Endpoints
 * ---------
 * GET    /api/voices          – list all cloned voices
 * POST   /api/voices/clone    – clone a new voice from audio samples
 * POST   /api/voices/:id/preview – synthesize a preview with accuracy control
 * DELETE /api/voices/:id      – remove a cloned voice
 */

import { Router, Request, Response } from "express";
import type { ClonedVoice, SynthesisOptions } from "../voice/voiceClone";
import {
  cloneVoice,
  synthesizeVoice,
  deleteClonedVoice,
} from "../voice/voiceClone";
import { scanPitch } from "../voice/pitchScanner";

const router = Router();

/** In-memory voice store (replace with a real DB in production) */
const voiceStore: Map<string, ClonedVoice> = new Map();

function getApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    throw new Error("ELEVENLABS_API_KEY environment variable is not set");
  }
  return key;
}

// ---------------------------------------------------------------------------
// GET /api/voices
// ---------------------------------------------------------------------------
router.get("/", (_req: Request, res: Response) => {
  res.json({ voices: Array.from(voiceStore.values()) });
});

// ---------------------------------------------------------------------------
// POST /api/voices/clone
// ---------------------------------------------------------------------------
router.post("/clone", async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      gender,
      language,
      audioFiles,
      pcmSamples,
      sampleRate,
      accuracyLevel,
    } = req.body as {
      name: string;
      description: string;
      gender: "male" | "female" | "neutral";
      language: string;
      /** Base64-encoded MP3/WAV audio sample files */
      audioFiles: string[];
      /** Optional raw PCM samples (number[]) for pitch pre-scan */
      pcmSamples?: number[];
      sampleRate?: number;
      accuracyLevel?: number;
    };

    if (!name || !audioFiles?.length) {
      res.status(400).json({ error: "name and audioFiles are required" });
      return;
    }

    // Optional pitch pre-scan to embed in the voice record
    let pitchScanResult;
    if (pcmSamples && sampleRate) {
      pitchScanResult = scanPitch(
        new Float32Array(pcmSamples),
        sampleRate,
        { accuracyLevel: accuracyLevel ?? 0.8 }
      );
    }

    const voice = await cloneVoice(
      { name, description, gender, language, audioFiles, pitchScanResult },
      getApiKey()
    );

    voiceStore.set(voice.voiceId, voice);
    res.status(201).json({ voice });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// POST /api/voices/:id/preview
// ---------------------------------------------------------------------------
router.post("/:id/preview", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const voice = voiceStore.get(id);

    if (!voice) {
      res.status(404).json({ error: "Voice not found" });
      return;
    }

    const {
      // Default preview text; should match VoicePreview.tsx defaultSampleText
      text = "Hello! This is a preview of your cloned voice.",
      accuracyLevel = 0.8,
      smoothingFactor = 0.5,
    } = req.body as {
      text?: string;
      accuracyLevel?: number;
      smoothingFactor?: number;
    };

    const options: SynthesisOptions = {
      accuracyLevel,
      smoothingFactor,
      language: voice.language,
      pitchProfile: voice.pitchProfile,
    };

    const result = await synthesizeVoice(
      text,
      voice.voiceId,
      options,
      getApiKey()
    );

    res.setHeader("Content-Type", result.contentType);
    res.setHeader(
      "X-Estimated-Duration",
      String(result.estimatedDurationSeconds)
    );
    res.send(result.audioBuffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/voices/:id
// ---------------------------------------------------------------------------
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!voiceStore.has(id)) {
      res.status(404).json({ error: "Voice not found" });
      return;
    }

    await deleteClonedVoice(id, getApiKey());
    voiceStore.delete(id);
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

export default router;
