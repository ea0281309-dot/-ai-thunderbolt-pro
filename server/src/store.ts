import { v4 as uuidv4 } from 'uuid';
import type { Voice, Agent } from './types/voice.js';

// In-memory data store – replace with PostgreSQL/Redis in production
const voices: Map<string, Voice> = new Map();
const agents: Map<string, Agent> = new Map();

// Seed preset voices
function seedPresetVoices(): void {
  const presets: Omit<Voice, 'id' | 'createdAt'>[] = [
    {
      name: 'Adam',
      description: 'A warm, authoritative male voice ideal for professional calls.',
      gender: 'male',
      language: 'en',
      elevenLabsVoiceId: 'pNInz6obpgDQGcFmaJgB',
      isPreset: true,
    },
    {
      name: 'Rachel',
      description: 'A calm, articulate female voice perfect for customer service.',
      gender: 'female',
      language: 'en',
      elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM',
      isPreset: true,
    },
    {
      name: 'Domi',
      description: 'A neutral, professional voice suitable for any context.',
      gender: 'neutral',
      language: 'en',
      elevenLabsVoiceId: 'AZnzlk1XvdvUeBnXmlld',
      isPreset: true,
    },
    {
      name: 'Bella',
      description: 'A friendly, approachable female voice for warm interactions.',
      gender: 'female',
      language: 'en',
      elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL',
      isPreset: true,
    },
    {
      name: 'Josh',
      description: 'A confident, energetic male voice for sales and marketing.',
      gender: 'male',
      language: 'en',
      elevenLabsVoiceId: 'TxGEqnHWrfWFTfGW9XjX',
      isPreset: true,
    },
  ];

  for (const preset of presets) {
    const id = uuidv4();
    voices.set(id, { ...preset, id, createdAt: new Date().toISOString() });
  }
}

seedPresetVoices();

// --- Voice CRUD ---
export const voiceStore = {
  list(): Voice[] {
    return Array.from(voices.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  get(id: string): Voice | undefined {
    return voices.get(id);
  },

  create(data: Omit<Voice, 'id' | 'createdAt'>): Voice {
    const voice: Voice = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    voices.set(voice.id, voice);
    return voice;
  },

  update(id: string, data: Partial<Omit<Voice, 'id' | 'createdAt'>>): Voice | undefined {
    const existing = voices.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    voices.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return voices.delete(id);
  },
};

// --- Agent CRUD ---
export const agentStore = {
  list(): Agent[] {
    return Array.from(agents.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  get(id: string): Agent | undefined {
    return agents.get(id);
  },

  create(data: Omit<Agent, 'id' | 'createdAt'>): Agent {
    const agent: Agent = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    agents.set(agent.id, agent);
    return agent;
  },

  update(id: string, data: Partial<Omit<Agent, 'id' | 'createdAt'>>): Agent | undefined {
    const existing = agents.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    agents.set(id, updated);
    return updated;
  },

  delete(id: string): boolean {
    return agents.delete(id);
  },
};
