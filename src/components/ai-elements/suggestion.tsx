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
          'px-4 py-2 rounded-full text-sm font-medium',
          'bg-white dark:bg-gray-800',
          'border border-gray-300 dark:border-gray-600',
          'text-gray-700 dark:text-gray-300',
          'hover:bg-gray-50 dark:hover:bg-gray-700',
          'hover:border-emerald-500 dark:hover:border-emerald-400',
          'transition-all duration-150',
          'shadow-sm hover:shadow',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
          className
        )}
        {...props}
      >
        {suggestion}
      </button>
    );
  }
);

Suggestion.displayName = 'Suggestion';
