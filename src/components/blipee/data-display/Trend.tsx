/**
 * Blipee Trend Component
 * Displays trend indicators with arrows and percentages
 * Styled by docs/css .kpi-trend class
 */

'use client';

import React from 'react';

export type TrendType = 'positive' | 'negative' | 'neutral';

export interface TrendProps {
  type: TrendType;
  value: string | number;
  label?: string;
  className?: string;
}

export function Trend({
  type,
  value,
  label,
  className = '',
}: TrendProps) {
  const trendClass = type !== 'neutral' ? `trend-${type}` : '';

  // Add arrow based on type
  const arrow = type === 'positive' ? '↑' : type === 'negative' ? '↓' : '';

  return (
    <div className={`kpi-trend ${trendClass} ${className}`.trim()}>
      <span>
        {arrow && `${arrow} `}
        {value}
        {typeof value === 'number' && '%'}
      </span>
      {label && <span style={{ color: 'var(--text-tertiary)' }}>{label}</span>}
    </div>
  );
}
