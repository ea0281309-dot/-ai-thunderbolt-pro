"use client";

import { useState, FormEvent } from "react";
import { analyzeEmotion, type EmotionResult } from "@/lib/api";

const EMOTION_EMOJI: Record<string, string> = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  anxious: "😰",
  neutral: "😐",
  excited: "🤩",
  frustrated: "😤",
};

export default function EmotionAnalyzer() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<EmotionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await analyzeEmotion(text);
      setResult(data);
    } catch {
      setError("Could not analyze emotion. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white/8 border border-white/10 p-6 backdrop-blur-sm">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        🧠 <span>Emotion Analyzer</span>
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-indigo-200">Enter text to analyze</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="How are you feeling about this call?"
            rows={3}
            required
            className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 outline-none focus:border-indigo-400 placeholder:text-white/30 text-white resize-none"
          />
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-5 py-2 text-sm font-semibold transition-colors"
        >
          {loading ? "Analyzing…" : "Analyze Emotion 🧠"}
        </button>
      </form>
      {result && (
        <div className="mt-4 rounded-xl bg-white/5 border border-white/10 p-4 text-sm">
          <p className="text-indigo-200 mb-1">Result:</p>
          <p className="text-2xl font-bold">
            {EMOTION_EMOJI[result.emotion] ?? "🤔"}{" "}
            <span className="capitalize">{result.emotion}</span>
          </p>
          <p className="text-indigo-300 text-xs mt-1">
            Confidence: {(result.confidence * 100).toFixed(0)}%
          </p>
        </div>
      )}
    </section>
  );
}
