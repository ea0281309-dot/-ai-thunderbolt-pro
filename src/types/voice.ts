export type VoiceGender = 'male' | 'female' | 'neutral';

export interface Voice {
  id: string;
  name: string;
  description: string;
  gender: VoiceGender;
  language: string;
  elevenLabsVoiceId?: string;
  previewUrl?: string;
  isPreset: boolean;
  createdAt: string;
}

export interface CreateVoicePayload {
  name: string;
  description: string;
  gender: VoiceGender;
  language: string;
  audioFile: File;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  voiceId?: string;
  language: string;
  createdAt: string;
}
