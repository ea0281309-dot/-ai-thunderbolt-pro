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

export interface Agent {
  id: string;
  name: string;
  description: string;
  voiceId?: string;
  language: string;
  createdAt: string;
}

export interface CreateVoiceBody {
  name: string;
  description?: string;
  gender: VoiceGender;
  language: string;
}

export interface UpdateVoiceBody {
  name?: string;
  description?: string;
  gender?: VoiceGender;
  language?: string;
}

export interface CreateAgentBody {
  name: string;
  description?: string;
  voiceId?: string;
  language?: string;
}

export interface UpdateAgentBody {
  name?: string;
  description?: string;
  voiceId?: string;
  language?: string;
}
