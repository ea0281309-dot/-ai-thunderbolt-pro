'use client';

import { useEffect, useState, useCallback } from 'react';
import { api, type Call, type HealthStatus } from './lib/api';
import NewCallForm from './components/NewCallForm';
import CallList from './components/CallList';
import EmotionAnalyzer from './components/EmotionAnalyzer';
import StatusBar from './components/StatusBar';

export default function Home() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState('');
  const [healthLoading, setHealthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'calls' | 'analyze'>('calls');

  const fetchHealth = useCallback(async () => {
    try {
      setHealthError('');
      const h = await api.health();
      setHealth(h);
    } catch (err) {
      setHealthError(err instanceof Error ? err.message : 'Connection failed');
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  const fetchCalls = useCallback(async () => {
    try {
      const { calls: list } = await api.getCalls();
      setCalls(list);
    } catch {
      // silently fail — calls load in background
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchCalls();
    const interval = setInterval(fetchCalls, 10000);
    return () => clearInterval(interval);
  }, [fetchHealth, fetchCalls]);

  const handleCallCreated = (call: Call) => {
    setCalls((prev) => [call, ...prev]);
  };

  const handleDelete = async (id: string) => {
    await api.deleteCall(id);
    setCalls((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              ⚡ AI Thunderbolt Pro
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              AI-powered calling service with emotional intelligence
            </p>
          </div>
          <StatusBar health={health} loading={healthLoading} error={healthError} />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Calls', value: calls.length, icon: '📞' },
            {
              label: 'Completed',
              value: calls.filter((c) => c.status === 'completed').length,
              icon: '✅',
            },
            {
              label: 'In Queue',
              value: calls.filter((c) => c.status === 'queued').length,
              icon: '⏳',
            },
            {
              label: 'Avg Duration',
              value:
                calls.filter((c) => c.duration).length > 0
                  ? `${Math.round(
                      calls
                        .filter((c) => c.duration)
                        .reduce((s, c) => s + (c.duration ?? 0), 0) /
                        calls.filter((c) => c.duration).length
                    )}s`
                  : '—',
              icon: '⏱',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 text-center"
            >
              <div className="text-2xl">{stat.icon}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stat.value}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('calls')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'calls'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            📞 Calls
          </button>
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === 'analyze'
                ? 'bg-purple-600 text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            🧠 Analyze Emotion
          </button>
        </div>

        {activeTab === 'calls' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <NewCallForm onCallCreated={handleCallCreated} />
            </div>
            <div className="lg:col-span-2">
              <CallList calls={calls} onDelete={handleDelete} />
            </div>
          </div>
        )}

        {activeTab === 'analyze' && (
          <div className="max-w-2xl mx-auto">
            <EmotionAnalyzer />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-12 py-6 text-center text-sm text-gray-400">
        AI Thunderbolt Pro © {new Date().getFullYear()} · Powered by emotional intelligence
      </footer>
    </div>
  );
}
