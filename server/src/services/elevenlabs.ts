import axios from 'axios';
import FormData from 'form-data';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

function getApiKey(): string {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) throw new Error('ELEVENLABS_API_KEY environment variable is not set.');
  return key;
}

export interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  preview_url?: string;
}

/**
 * Clone a voice using ElevenLabs Instant Voice Cloning API.
 */
export async function cloneVoice(
  name: string,
  description: string,
  audioBuffer: Buffer,
  audioFilename: string,
): Promise<ElevenLabsVoice> {
  const apiKey = getApiKey();
  const form = new FormData();
  form.append('name', name);
  form.append('description', description);
  form.append('files', audioBuffer, {
    filename: audioFilename,
    contentType: audioFilename.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg',
  });

  const response = await axios.post<ElevenLabsVoice>(
    `${ELEVENLABS_API_BASE}/voices/add`,
    form,
    {
      headers: {
        'xi-api-key': apiKey,
        ...form.getHeaders(),
      },
    },
  );
  return response.data;
}

/**
 * Generate a text-to-speech preview for a voice.
 */
export async function generatePreview(
  elevenLabsVoiceId: string,
  text: string,
): Promise<Buffer> {
  const apiKey = getApiKey();
  const response = await axios.post<Buffer>(
    `${ELEVENLABS_API_BASE}/text-to-speech/${elevenLabsVoiceId}`,
    {
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    },
    {
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
      },
      responseType: 'arraybuffer',
    },
  );
  return Buffer.from(response.data);
}

/**
 * Delete a cloned voice from ElevenLabs.
 */
export async function deleteVoice(elevenLabsVoiceId: string): Promise<void> {
  const apiKey = getApiKey();
  await axios.delete(`${ELEVENLABS_API_BASE}/voices/${elevenLabsVoiceId}`, {
    headers: { 'xi-api-key': apiKey },
  });
}
