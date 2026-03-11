"use client";

import { useState } from "react";
import CallForm from "./CallForm";
import EmotionAnalyzer from "./EmotionAnalyzer";
import CallLog from "./CallLog";
import type { Call } from "@/lib/api";

export default function Dashboard() {
  const [calls, setCalls] = useState<Call[]>([]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 backdrop-blur-sm bg-white/5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <span className="text-3xl">⚡</span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">AI Thunderbolt Pro</h1>
            <p className="text-xs text-indigo-300">AI-powered calling with emotional intelligence</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-10 grid gap-8 md:grid-cols-2">
        {/* Left column */}
        <div className="flex flex-col gap-8">
          <CallForm onCallCreated={(c) => setCalls((prev) => [c, ...prev])} />
          <EmotionAnalyzer />
        </div>

        {/* Right column */}
        <div>
          <CallLog calls={calls} />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-indigo-400/60 py-6">
        AI Thunderbolt Pro &mdash; built with Next.js &amp; Express
      </footer>
    </div>
  );
}
