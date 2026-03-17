const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export interface EmotionEntry {
  emotion: string;
  confidence: number;
  sentiment: 'positive' | 'negative' | 'neutral';
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

export async function startCall(): Promise<CallRecord> {
  const res = await fetch(`${API_URL}/api/v2/calls/start`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<CallRecord>;
}

export async function endCall(sid: string): Promise<CallRecord> {
  const res = await fetch(`${API_URL}/api/v2/calls/${sid}/end`, { method: 'POST' });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<CallRecord>;
}

export async function addEmotion(
  sid: string,
  emotion: string,
  confidence: number,
  sentiment: 'positive' | 'negative' | 'neutral',
): Promise<EmotionEntry> {
  const res = await fetch(`${API_URL}/api/v2/calls/${sid}/emotion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ emotion, confidence, sentiment }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<EmotionEntry>;
}

export async function listCalls(): Promise<CallRecord[]> {
  const res = await fetch(`${API_URL}/api/v2/calls`);
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<CallRecord[]>;
}
