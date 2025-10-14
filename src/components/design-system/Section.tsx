'use client';

import React, { ReactNode } from 'react';
import { designTokens } from '@/styles/design-tokens';

interface SectionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Section - Container for grouping content with consistent spacing
 *
 * @example
 * ```tsx
 * <Section>
 *   <MetricGrid columns={4}>
 *     ...
 *   </MetricGrid>
 * </Section>
 *
 * <Section>
 *   <ChartGrid columns={2}>
 *     ...
 *   </ChartGrid>
 * </Section>
 * ```
 */
export function Section({ children, className = '' }: SectionProps) {
  return (
    <div className={`${designTokens.spacing.sectionGap} ${className}`}>
      {children}
    </div>
  );
}
