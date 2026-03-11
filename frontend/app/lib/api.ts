const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export interface Call {
  id: string;
  phoneNumber: string;
  script: string | null;
  voiceProfile: string;
  language: string;
  status: 'queued' | 'in-progress' | 'completed' | 'failed' | 'cancelled';
  emotionScore: { dominantEmotion: string; confidence: number } | null;
  transcript: string | null;
  duration: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmotionAnalysis {
  dominantEmotion: string;
  scores: Record<string, number>;
  confidence: number;
}

export interface DeploymentInfo {
  frontend: { platform: string; url: string | null };
  backend: { platform: string; url: string | null };
  instructions: { railway: string; vercel: string };
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  environment: string;
  uptime: number;
  timestamp: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => apiFetch<HealthStatus>('/health'),

  getDeploymentInfo: () => apiFetch<DeploymentInfo>('/api/deployment'),

  getCalls: () => apiFetch<{ calls: Call[]; total: number }>('/api/calls'),

  createCall: (data: { phoneNumber: string; script?: string; voiceProfile?: string; language?: string }) =>
    apiFetch<Call>('/api/calls', { method: 'POST', body: JSON.stringify(data) }),

  deleteCall: (id: string) =>
    fetch(`${BACKEND_URL}/api/calls/${id}`, { method: 'DELETE' }),

  analyzeEmotion: (text: string) =>
    apiFetch<{ analysis: EmotionAnalysis; analyzedAt: string }>('/api/analysis/emotion', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  analyzeSentiment: (text: string) =>
    apiFetch<{ sentiment: { label: string; score: number }; analyzedAt: string }>(
      '/api/analysis/sentiment',
      { method: 'POST', body: JSON.stringify({ text }) }
    ),
};
