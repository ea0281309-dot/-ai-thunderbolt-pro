'use client';

import { type Call } from '../lib/api';

const STATUS_STYLES: Record<string, string> = {
  queued: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

const EMOTION_EMOJIS: Record<string, string> = {
  joy: '😊',
  trust: '🤝',
  anticipation: '🎯',
  surprise: '😲',
  fear: '😨',
  sadness: '😢',
  disgust: '😖',
  anger: '😠',
};

interface Props {
  calls: Call[];
  onDelete: (id: string) => void;
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function CallList({ calls, onDelete }: Props) {
  if (calls.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 text-center">
        <div className="text-5xl mb-3">📵</div>
        <p className="text-gray-500 dark:text-gray-400">No calls yet. Initiate your first AI call above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>📋</span> Call History
          <span className="ml-auto text-sm font-normal text-gray-500 dark:text-gray-400">
            {calls.length} call{calls.length !== 1 ? 's' : ''}
          </span>
        </h2>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {calls.map((call) => (
          <li key={call.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-white truncate">
                    {call.phoneNumber}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_STYLES[call.status] || STATUS_STYLES.cancelled}`}
                  >
                    {call.status}
                  </span>
                  {call.emotionScore && (
                    <span className="text-sm" title={`Emotion: ${call.emotionScore.dominantEmotion}`}>
                      {EMOTION_EMOJIS[call.emotionScore.dominantEmotion] || '🎭'}{' '}
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {call.emotionScore.dominantEmotion}
                      </span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span>🎙 {call.voiceProfile}</span>
                  <span>🌐 {call.language}</span>
                  <span>⏱ {formatDuration(call.duration)}</span>
                  <span className="hidden sm:inline">
                    {new Date(call.createdAt).toLocaleString()}
                  </span>
                </div>
                {call.transcript && (
                  <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 truncate">
                    💬 {call.transcript}
                  </p>
                )}
              </div>
              <button
                onClick={() => onDelete(call.id)}
                title="Delete call"
                className="shrink-0 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded"
              >
                🗑
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
