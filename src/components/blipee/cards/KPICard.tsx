/**
 * Blipee KPICard Component
 * Card for displaying key performance indicators with metrics and trends
 * Exact replica from docs/ design system
 */

'use client';

import React from 'react';

export type IconColor = 'green' | 'blue' | 'purple' | 'amber' | 'red';
export type TrendType = 'positive' | 'negative' | 'neutral';

export interface KPICardProps {
  /** KPI label/title */
  label: string;
  /** KPI value (can be string or number) */
  value: string | number;
  /** Icon element to display */
  icon: React.ReactNode;
  /** Icon background color variant */
  iconColor?: IconColor;
  /** Trend text (e.g., "↑ 8.2%") */
  trend?: string;
  /** Trend comparison text (e.g., "vs last month") */
  trendComparison?: string;
  /** Trend type for color coding */
  trendType?: TrendType;
  /** Custom class name */
  className?: string;
}

export function KPICard({
  label,
  value,
  icon,
  iconColor = 'green',
  trend,
  trendComparison,
  trendType = 'neutral',
  className = '',
}: KPICardProps) {
  const iconColorClass = `icon-${iconColor}`;
  const trendClass = trendType !== 'neutral' ? `trend-${trendType}` : '';

  return (
    <div className={`kpi-card ${className}`.trim()}>
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        <div className={`kpi-icon ${iconColorClass}`}>
          {icon}
        </div>
      </div>

      <div className="kpi-value">{value}</div>

      {trend && (
        <div className={`kpi-trend ${trendClass}`.trim()}>
          <span>{trend}</span>
          {trendComparison && (
            <span style={{ color: 'var(--text-tertiary)' }}>
              {trendComparison}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
