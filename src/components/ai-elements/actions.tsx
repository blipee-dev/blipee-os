'use client';

/**
 * Actions Component
 *
 * Container and button components for message actions like copy, regenerate, etc.
 * Following ChatGPT mobile design patterns
 */

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface ActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Actions = forwardRef<HTMLDivElement, ActionsProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-1',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Actions.displayName = 'Actions';

interface ActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: React.ReactNode;
}

export const Action = forwardRef<HTMLButtonElement, ActionProps>(
  ({ className, label, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        title={label}
        aria-label={label}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg',
          'text-xs font-medium text-gray-600 dark:text-gray-400',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          'hover:text-gray-900 dark:hover:text-gray-100',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      >
        {children}
        <span className="sr-only md:not-sr-only">{label}</span>
      </button>
    );
  }
);

Action.displayName = 'Action';
