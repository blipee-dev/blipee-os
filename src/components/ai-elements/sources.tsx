'use client';

/**
 * Sources Component
 *
 * Collapsible sources section showing URLs and references used by the AI
 * Similar to ChatGPT's sources display
 */

import { cn } from '@/lib/utils';
import { ChevronDown, Link as LinkIcon } from 'lucide-react';
import { forwardRef, useState, createContext, useContext } from 'react';

interface SourcesContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const SourcesContext = createContext<SourcesContextValue | undefined>(undefined);

const useSourcesContext = () => {
  const context = useContext(SourcesContext);
  if (!context) {
    throw new Error('Sources components must be used within a Sources component');
  }
  return context;
};

interface SourcesProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Sources = forwardRef<HTMLDivElement, SourcesProps>(
  ({ className, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <SourcesContext.Provider value={{ isOpen, setIsOpen }}>
        <div
          ref={ref}
          className={cn(
            'border border-blue-200 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-900/20',
            className
          )}
          {...props}
        >
          {children}
        </div>
      </SourcesContext.Provider>
    );
  }
);

Sources.displayName = 'Sources';

interface SourcesTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  count: number;
}

export const SourcesTrigger = forwardRef<HTMLButtonElement, SourcesTriggerProps>(
  ({ className, count, ...props }, ref) => {
    const { isOpen, setIsOpen } = useSourcesContext();

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 w-full px-3 py-2 text-sm font-medium',
          'text-blue-700 dark:text-blue-400',
          'hover:bg-blue-100 dark:hover:bg-blue-900/40',
          'transition-colors duration-150 rounded-t-lg',
          className
        )}
        {...props}
      >
        <LinkIcon className="w-4 h-4" />
        <span>{count} {count === 1 ? 'source' : 'sources'}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 ml-auto transition-transform duration-200',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>
    );
  }
);

SourcesTrigger.displayName = 'SourcesTrigger';

interface SourcesContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const SourcesContent = forwardRef<HTMLDivElement, SourcesContentProps>(
  ({ className, children, ...props }, ref) => {
    const { isOpen } = useSourcesContext();

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'px-3 py-2 space-y-2',
          'border-t border-blue-200 dark:border-blue-800',
          'max-h-64 overflow-y-auto',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SourcesContent.displayName = 'SourcesContent';

interface SourceProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  title: string;
}

export const Source = forwardRef<HTMLAnchorElement, SourceProps>(
  ({ className, href, title, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'flex items-start gap-2 p-2 rounded-md',
          'text-sm text-blue-700 dark:text-blue-400',
          'hover:bg-blue-100 dark:hover:bg-blue-900/40',
          'transition-colors duration-150',
          className
        )}
        {...props}
      >
        <LinkIcon className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span className="break-all">{title || href}</span>
      </a>
    );
  }
);

Source.displayName = 'Source';
