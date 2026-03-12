import { Router, Request, Response } from 'express';
import multer from 'multer';
import { voiceStore } from '../store.js';
import { cloneVoice, generatePreview, deleteVoice } from '../services/elevenlabs.js';
import type { CreateVoiceBody, UpdateVoiceBody } from '../types/voice.js';

const router = Router();

// Multer config – store audio in memory (max 50 MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/wave'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only MP3 and WAV audio files are accepted.'));
    }
  },
});

// GET /api/voices
router.get('/', (_req: Request, res: Response) => {
  res.json(voiceStore.list());
});

// GET /api/voices/:id
router.get('/:id', (req: Request, res: Response) => {
  const voice = voiceStore.get(req.params.id);
  if (!voice) return res.status(404).json({ error: 'Voice not found.' });
  return res.json(voice);
});

// POST /api/voices – clone a new voice
router.post('/', upload.single('audio'), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Audio file is required.' });
  }

  const { name, description = '', gender, language } = req.body as CreateVoiceBody;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Voice name is required.' });
  }
  if (!['male', 'female', 'neutral'].includes(gender)) {
    return res.status(400).json({ error: 'Invalid gender. Must be male, female, or neutral.' });
  }

  let elevenLabsVoiceId: string | undefined;
  try {
    if (process.env.ELEVENLABS_API_KEY) {
      const result = await cloneVoice(
        name.trim(),
        description.trim(),
        req.file.buffer,
        req.file.originalname,
      );
      elevenLabsVoiceId = result.voice_id;
    }
  } catch (err) {
    // Log error but don't fail – store without ElevenLabs ID
    console.error('[ElevenLabs] Failed to clone voice:', err);
  }

  const voice = voiceStore.create({
    name: name.trim(),
    description: description.trim(),
    gender,
    language: language ?? 'en',
    elevenLabsVoiceId,
    isPreset: false,
  });

  return res.status(201).json(voice);
});

// PATCH /api/voices/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const voice = voiceStore.get(req.params.id);
  if (!voice) return res.status(404).json({ error: 'Voice not found.' });
  if (voice.isPreset) return res.status(403).json({ error: 'Preset voices cannot be edited.' });

  const { name, description, gender, language } = req.body as UpdateVoiceBody;
  if (name !== undefined && !name.trim()) {
    return res.status(400).json({ error: 'Voice name cannot be empty.' });
  }

  const updated = voiceStore.update(req.params.id, {
    ...(name !== undefined && { name: name.trim() }),
    ...(description !== undefined && { description: description.trim() }),
    ...(gender !== undefined && { gender }),
    ...(language !== undefined && { language }),
  });

  return res.json(updated);
});

// DELETE /api/voices/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const voice = voiceStore.get(req.params.id);
  if (!voice) return res.status(404).json({ error: 'Voice not found.' });
  if (voice.isPreset) return res.status(403).json({ error: 'Preset voices cannot be deleted.' });

  // Delete from ElevenLabs if available
  if (voice.elevenLabsVoiceId && process.env.ELEVENLABS_API_KEY) {
    try {
      await deleteVoice(voice.elevenLabsVoiceId);
    } catch (err) {
      console.error('[ElevenLabs] Failed to delete voice:', err);
    }
  }

  voiceStore.delete(req.params.id);
  return res.status(204).send();
});

// POST /api/voices/:id/preview
router.post('/:id/preview', async (req: Request, res: Response) => {
  const voice = voiceStore.get(req.params.id);
  if (!voice) return res.status(404).json({ error: 'Voice not found.' });

  const text: string = req.body.text ?? 'Hello! This is a preview of my voice. I am an AI assistant ready to help you.';

  if (!voice.elevenLabsVoiceId || !process.env.ELEVENLABS_API_KEY) {
    // Return a placeholder URL when ElevenLabs is not configured
    return res.json({ audioUrl: voice.previewUrl ?? null });
  }

  try {
    const audioBuffer = await generatePreview(voice.elevenLabsVoiceId, text);
    const base64 = audioBuffer.toString('base64');
    return res.json({ audioUrl: `data:audio/mpeg;base64,${base64}` });
  } catch (err) {
    console.error('[ElevenLabs] Failed to generate preview:', err);
    return res.status(500).json({ error: 'Failed to generate voice preview.' });
  }
});

export default router;
