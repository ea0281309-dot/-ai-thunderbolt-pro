import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      {
        'bg-gray-700 text-gray-300': variant === 'default',
        'bg-blue-900/50 text-blue-300': variant === 'blue',
        'bg-green-900/50 text-green-300': variant === 'green',
        'bg-yellow-900/50 text-yellow-300': variant === 'yellow',
        'bg-red-900/50 text-red-300': variant === 'red',
        'bg-purple-900/50 text-purple-300': variant === 'purple',
      },
      className,
    )}
  >
    {children}
  </span>
);
