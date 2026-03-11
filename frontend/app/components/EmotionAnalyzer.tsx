'use client';

import { useState } from 'react';
import { api, type EmotionAnalysis } from '../lib/api';

const EMOTION_COLORS: Record<string, string> = {
  joy: 'bg-yellow-400',
  trust: 'bg-green-400',
  anticipation: 'bg-orange-400',
  surprise: 'bg-purple-400',
  fear: 'bg-gray-400',
  sadness: 'bg-blue-400',
  disgust: 'bg-teal-400',
  anger: 'bg-red-400',
};

export default function EmotionAnalyzer() {
  const [text, setText] = useState('');
  const [result, setResult] = useState<EmotionAnalysis | null>(null);
  const [sentiment, setSentiment] = useState<{ label: string; score: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setError('');
    setLoading(true);
    try {
      const [emotionRes, sentimentRes] = await Promise.all([
        api.analyzeEmotion(text),
        api.analyzeSentiment(text),
      ]);
      setResult(emotionRes.analysis);
      setSentiment(sentimentRes.sentiment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const sentimentColor =
    sentiment?.label === 'positive'
      ? 'text-green-600 dark:text-green-400'
      : sentiment?.label === 'negative'
      ? 'text-red-600 dark:text-red-400'
      : 'text-gray-600 dark:text-gray-400';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <span>🧠</span> Emotion Analyzer
      </h2>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="Enter call transcript or text to analyze emotions..."
        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
      />

      <button
        onClick={handleAnalyze}
        disabled={loading || !text.trim()}
        className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors"
      >
        {loading ? 'Analyzing...' : 'Analyze Emotion'}
      </button>

      {result && sentiment && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Dominant emotion: </span>
              <span className="font-semibold text-gray-900 dark:text-white capitalize">
                {result.dominantEmotion}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Sentiment: </span>
              <span className={`font-semibold capitalize ${sentimentColor}`}>
                {sentiment.label} ({(sentiment.score * 100).toFixed(0)}%)
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Emotion Scores
            </p>
            <div className="space-y-1.5">
              {Object.entries(result.scores)
                .sort(([, a], [, b]) => b - a)
                .map(([emotion, score]) => (
                  <div key={emotion} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 dark:text-gray-400 w-24 capitalize">
                      {emotion}
                    </span>
                    <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${EMOTION_COLORS[emotion] || 'bg-indigo-400'}`}
                        style={{ width: `${(score * 100).toFixed(1)}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-10 text-right">
                      {(score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500">
            Confidence: {(result.confidence * 100).toFixed(0)}%
          </p>
        </div>
      )}
    </div>
  );
}
