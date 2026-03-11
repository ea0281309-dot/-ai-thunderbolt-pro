"use client";

import type { Call } from "@/lib/api";

const STATUS_COLOR: Record<string, string> = {
  queued: "bg-yellow-500/20 text-yellow-300",
  ringing: "bg-blue-500/20 text-blue-300",
  in_progress: "bg-emerald-500/20 text-emerald-300",
  completed: "bg-slate-500/20 text-slate-300",
  failed: "bg-red-500/20 text-red-400",
};

interface Props {
  calls: Call[];
}

export default function CallLog({ calls }: Props) {
  return (
    <section className="rounded-2xl bg-white/8 border border-white/10 p-6 backdrop-blur-sm h-full">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        📋 <span>Call Log</span>
        <span className="ml-auto text-xs bg-indigo-600/40 rounded-full px-2 py-0.5">
          {calls.length}
        </span>
      </h2>
      {calls.length === 0 ? (
        <p className="text-indigo-300/60 text-sm">No calls yet. Initiate one above!</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {calls.map((call) => (
            <li
              key={call.id}
              className="rounded-xl bg-white/5 border border-white/10 p-4 text-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-indigo-300">{call.id}</span>
                <span
                  className={`text-xs rounded-full px-2 py-0.5 ${
                    STATUS_COLOR[call.status] ?? "bg-white/10 text-white"
                  }`}
                >
                  {call.status}
                </span>
              </div>
              <p className="font-medium">{call.to}</p>
              <p className="text-indigo-200/70 line-clamp-2 mt-0.5">{call.message}</p>
              <p className="text-indigo-400/50 text-xs mt-1">
                {new Date(call.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
