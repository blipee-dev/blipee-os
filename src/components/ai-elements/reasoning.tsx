'use client';

/**
 * Reasoning Component
 *
 * Collapsible reasoning/thinking section for AI responses
 * Shows the AI's reasoning process before providing an answer
 *
 * Features:
 * - Auto-opens when streaming begins
 * - Auto-closes when streaming finishes
 * - Manual toggle control
 * - Built on Radix UI Collapsible primitives
 */

import { cn } from '@/lib/utils';
import { ChevronDown, Brain } from 'lucide-react';
import { forwardRef, useEffect, useState } from 'react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface ReasoningProps extends React.ComponentProps<typeof Collapsible> {
  children: React.ReactNode;
  isStreaming?: boolean;
  className?: string;
}

export const Reasoning = forwardRef<HTMLDivElement, ReasoningProps>(
  ({ className, children, isStreaming, open, onOpenChange, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    // Auto-open when streaming starts, auto-close when it finishes
    useEffect(() => {
      if (isStreaming !== undefined) {
        setIsOpen(isStreaming);
      }
    }, [isStreaming]);

    // Use controlled state if provided, otherwise use internal state
    const controlled = open !== undefined;
    const currentOpen = controlled ? open : isOpen;
    const handleOpenChange = controlled ? onOpenChange : setIsOpen;

    return (
      <Collapsible
        ref={ref}
        open={currentOpen}
        onOpenChange={handleOpenChange}
        className={cn(
          'border border-amber-200 dark:border-amber-800 rounded-lg bg-amber-50 dark:bg-amber-900/20',
          className
        )}
        {...props}
      >
        {children}
      </Collapsible>
    );
  }
);

Reasoning.displayName = 'Reasoning';

interface ReasoningTriggerProps extends React.ComponentProps<typeof CollapsibleTrigger> {
  title?: string;
}

export const ReasoningTrigger = forwardRef<HTMLButtonElement, ReasoningTriggerProps>(
  ({ className, title = 'Reasoning', ...props }, ref) => {
    return (
      <CollapsibleTrigger
        ref={ref}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 text-sm font-medium',
          'text-amber-700 dark:text-amber-400',
          'hover:bg-amber-100 dark:hover:bg-amber-900/40',
          'transition-colors duration-150 rounded-t-lg',
          'group',
          className
        )}
        {...props}
      >
        <Brain className="w-4 h-4" />
        <span>{title}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 ml-auto transition-transform duration-200',
            'group-data-[state=open]:rotate-180'
          )}
        />
      </CollapsibleTrigger>
    );
  }
);

ReasoningTrigger.displayName = 'ReasoningTrigger';

interface ReasoningContentProps extends React.ComponentProps<typeof CollapsibleContent> {
  children: React.ReactNode;
}

export const ReasoningContent = forwardRef<HTMLDivElement, ReasoningContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <CollapsibleContent
        ref={ref}
        className={cn(
          'px-3 py-2 text-sm text-amber-800 dark:text-amber-300',
          'border-t border-amber-200 dark:border-amber-800',
          'whitespace-pre-wrap',
          'max-h-64 overflow-y-auto',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          className
        )}
        {...props}
      >
        {children}
      </CollapsibleContent>
    );
  }
);

ReasoningContent.displayName = 'ReasoningContent';
