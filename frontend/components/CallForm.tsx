"use client";

import { useState, FormEvent } from "react";
import { initiateCall, type Call } from "@/lib/api";

interface Props {
  onCallCreated: (call: Call) => void;
}

export default function CallForm({ onCallCreated }: Props) {
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const call = await initiateCall(to, message);
      onCallCreated(call);
      setSuccess(`Call ${call.id} queued successfully!`);
      setTo("");
      setMessage("");
    } catch {
      setError("Could not initiate call. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl bg-white/8 border border-white/10 p-6 backdrop-blur-sm">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📞 <span>Initiate AI Call</span>
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-indigo-200">Phone number</span>
          <input
            type="tel"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="+15551234567"
            required
            className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 outline-none focus:border-indigo-400 placeholder:text-white/30 text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-indigo-200">Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi! This is an AI-powered call from Thunderbolt Pro…"
            rows={3}
            required
            className="rounded-lg bg-white/10 border border-white/20 px-3 py-2 outline-none focus:border-indigo-400 placeholder:text-white/30 text-white resize-none"
          />
        </label>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-emerald-400 text-sm">{success}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-5 py-2 text-sm font-semibold transition-colors"
        >
          {loading ? "Queuing…" : "Start Call ⚡"}
        </button>
      </form>
    </section>
  );
}
