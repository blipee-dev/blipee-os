'use client';

/**
 * Suggestion Component
 *
 * Suggestion chips/pills for quick actions and prompts
 * Similar to ChatGPT's suggestion interface
 */

import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface SuggestionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Suggestions = forwardRef<HTMLDivElement, SuggestionsProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-wrap gap-2 justify-center',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Suggestions.displayName = 'Suggestions';

interface SuggestionProps {
  suggestion: string;
  onClick?: (suggestion: string) => void;
  className?: string;
}

export const Suggestion = forwardRef<HTMLButtonElement, SuggestionProps>(
  ({ className, suggestion, onClick, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={() => onClick?.(suggestion)}
        className={cn(
          'group px-3 py-1.5 rounded-full text-xs font-medium',
          'bg-white dark:bg-gray-800',
          'border border-gray-300 dark:border-gray-600',
          'text-gray-500 dark:text-gray-500',
          'hover:bg-gradient-to-r hover:from-green-500/20 hover:to-emerald-500/20',
          'hover:border-green-500 dark:hover:border-emerald-400',
          'transition-all duration-150',
          'shadow-sm hover:shadow',
          'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
          className
        )}
        {...props}
      >
        <span className="group-hover:bg-gradient-to-r group-hover:from-green-500 group-hover:to-emerald-500 group-hover:bg-clip-text group-hover:text-transparent">
          {suggestion}
        </span>
      </button>
    );
  }
);

Suggestion.displayName = 'Suggestion';
