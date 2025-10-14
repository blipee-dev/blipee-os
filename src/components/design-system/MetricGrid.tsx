'use client';

import React, { ReactNode } from 'react';
import { designTokens } from '@/styles/design-tokens';

interface MetricGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
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
  const gridClass = `grid grid-cols-${columns} ${designTokens.spacing.gridGap}`;

  return (
    <div className={`${gridClass} ${className}`}>
      {children}
    </div>
  );
}
