export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
export const ACTIVE_CALL_STORAGE_KEY = 'ai-thunderbolt-pro.active-call-sid';

export type Sentiment = 'positive' | 'negative' | 'neutral';

export interface EmotionEntry {
  emotion: string;
  confidence: number;
  sentiment: Sentiment;
  timestamp: string;
}

export interface CallRecord {
  sid: string;
  status: 'active' | 'ended';
  startedAt: string;
  endedAt?: string;
  durationSeconds?: number;
  emotions: EmotionEntry[];
}

interface ErrorPayload {
  error?: unknown;
  message?: unknown;
}

export class ApiError extends Error {
  status: number;
  path: string;

  constructor(status: number, message: string, path: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.path = path;
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) {
    return `Request failed with status ${response.status}`;
  }

  try {
    const payload = JSON.parse(text) as ErrorPayload;
    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error;
    }
    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message;
    }
  } catch {
    // Fall through to the raw response body below.
  }

  return text.trim();
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, init);
    if (!response.ok) {
      throw new ApiError(response.status, await parseErrorMessage(response), path);
    }

    return response.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const message = error instanceof Error && error.message ? error.message : 'The network request could not be completed.';
    throw new ApiError(0, message, path);
  }
}

export async function startCall(): Promise<CallRecord> {
  return requestJson<CallRecord>('/api/v2/calls/start', { method: 'POST' });
}

export async function getCall(sid: string): Promise<CallRecord> {
  return requestJson<CallRecord>(`/api/v2/calls/${encodeURIComponent(sid)}`);
}

export async function endCall(sid: string): Promise<CallRecord> {
  return requestJson<CallRecord>(`/api/v2/calls/${encodeURIComponent(sid)}/end`, {
    method: 'POST',
  });
}

export async function addEmotion(
  sid: string,
  emotion: string,
  confidence: number,
  sentiment: Sentiment,
): Promise<EmotionEntry> {
  return requestJson<EmotionEntry>(`/api/v2/calls/${encodeURIComponent(sid)}/emotion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ emotion, confidence, sentiment }),
  });
}

export async function listCalls(): Promise<CallRecord[]> {
  return requestJson<CallRecord[]>('/api/v2/calls');
}
