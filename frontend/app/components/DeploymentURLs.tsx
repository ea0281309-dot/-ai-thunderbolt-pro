'use client';

import { useEffect, useState } from 'react';
import { api, type DeploymentInfo } from '../lib/api';

export default function DeploymentURLs() {
  const [info, setInfo] = useState<DeploymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getDeploymentInfo()
      .then(setInfo)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500 dark:text-gray-400">
        <span className="animate-spin mr-2">⏳</span> Loading deployment info…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 text-red-700 dark:text-red-300">
        <p className="font-semibold">⚠️ Could not fetch deployment URLs</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  const services = [
    {
      name: 'Frontend',
      platform: info?.frontend.platform,
      url: info?.frontend.url,
      icon: '🌐',
      color: 'indigo',
      hint: info?.instructions.vercel,
    },
    {
      name: 'Backend',
      platform: info?.backend.platform,
      url: info?.backend.url,
      icon: '🚂',
      color: 'purple',
      hint: info?.instructions.railway,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          🔗 Live Deployment URLs
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your AI Thunderbolt Pro services are deployed here
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {services.map((svc) => (
          <div
            key={svc.name}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{svc.icon}</span>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-lg">{svc.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{svc.platform}</p>
              </div>
            </div>

            {svc.url ? (
              <a
                href={svc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 px-4 py-3 text-indigo-700 dark:text-indigo-300 font-mono text-sm break-all hover:underline transition-colors"
              >
                {svc.url}
              </a>
            ) : (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 px-4 py-3 text-yellow-700 dark:text-yellow-300 text-sm">
                <p className="font-semibold">Not deployed yet</p>
                {svc.hint && <p className="mt-1 text-xs">{svc.hint}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-5 text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <p className="font-semibold text-gray-800 dark:text-gray-200">📋 Deployment checklist</p>
        <ol className="list-decimal list-inside space-y-1 ml-1">
          <li>
            Deploy <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">/backend</code> to{' '}
            <strong>Railway</strong> — Railway injects <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">RAILWAY_STATIC_URL</code> automatically.
          </li>
          <li>
            Copy the Railway URL, then deploy{' '}
            <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">/frontend</code> to{' '}
            <strong>Vercel</strong> with{' '}
            <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">NEXT_PUBLIC_BACKEND_URL</code> set to that URL.
          </li>
          <li>
            Set <code className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">NEXT_PUBLIC_FRONTEND_URL</code> on the Railway service to your Vercel URL so this panel shows both links.
          </li>
        </ol>
      </div>
    </div>
  );
}
