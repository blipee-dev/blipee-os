'use client';

import React, { ReactNode } from 'react';
import { designTokens } from '@/styles/design-tokens';

interface ChartGridProps {
  children: ReactNode;
  columns?: 1 | 2;
  className?: string;
}

/**
 * ChartGrid - Responsive grid layout for chart cards
 *
 * @example
 * ```tsx
 * <ChartGrid columns={2}>
 *   <ChartCard title="Emissions Trend" icon={TrendingUp}>
 *     <LineChart ... />
 *   </ChartCard>
 *   <ChartCard title="Scope Breakdown" icon={PieChart}>
 *     <PieChart ... />
 *   </ChartCard>
 * </ChartGrid>
 * ```
 */
export function ChartGrid({ children, columns = 2, className = '' }: ChartGridProps) {
  const gridClass = columns === 2
    ? designTokens.gridLayouts.charts
    : designTokens.gridLayouts.mixed;

  return (
    <div className={`${gridClass} ${className}`}>
      {children}
    </div>
  );
}
