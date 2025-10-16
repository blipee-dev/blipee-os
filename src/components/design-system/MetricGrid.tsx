'use client';

import React, { ReactNode } from 'react';
import { designTokens } from '@/styles/design-tokens';

interface MetricGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

/**
 * MetricGrid - Grid layout for metric cards
 *
 * @example
 * ```tsx
 * <MetricGrid columns={4}>
 *   <MetricCard ... />
 *   <MetricCard ... />
 *   <MetricCard ... />
 *   <MetricCard ... />
 * </MetricGrid>
 * ```
 */
export function MetricGrid({ children, columns = 4, className = '' }: MetricGridProps) {
  // Use explicit className to avoid Tailwind purging
  const gridClass = columns === 2 ? 'grid grid-cols-1 md:grid-cols-2'
    : columns === 3 ? 'grid grid-cols-1 md:grid-cols-3'
    : columns === 4 ? 'grid grid-cols-1 md:grid-cols-4'
    : 'grid grid-cols-1 md:grid-cols-5';

  return (
    <div className={`${gridClass} ${designTokens.spacing.gridGap} ${className}`}>
      {children}
    </div>
  );
}
