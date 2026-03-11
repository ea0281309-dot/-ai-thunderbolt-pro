const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface Call {
  id: string;
  to: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface EmotionResult {
  text: string;
  emotion: string;
  confidence: number;
  analyzedAt: string;
}

export async function fetchCalls(): Promise<Call[]> {
  const res = await fetch(`${API_URL}/api/calls`);
  if (!res.ok) throw new Error("Failed to fetch calls");
  const data = await res.json();
  return data.calls as Call[];
}

export async function initiateCall(to: string, message: string): Promise<Call> {
  const res = await fetch(`${API_URL}/api/calls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, message }),
  });
  if (!res.ok) throw new Error("Failed to initiate call");
  const data = await res.json();
  return data.call as Call;
}

export async function analyzeEmotion(text: string): Promise<EmotionResult> {
  const res = await fetch(`${API_URL}/api/emotions/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Failed to analyze emotion");
  return res.json() as Promise<EmotionResult>;
}
