'use client';

import { type HealthStatus } from '../lib/api';

interface Props {
  health: HealthStatus | null;
  loading: boolean;
  error: string;
}

export default function StatusBar({ health, loading, error }: Props) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        Checking backend status…
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        Backend offline — {error || 'unable to connect'}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      Backend online · {health.service} v{health.version} · uptime{' '}
      {health.uptime}s · {health.environment}
    </div>
  );
}
