/**
 * Blipee ChartCard Component
 * Card for displaying charts with header and description
 * Exact replica from docs/ design system
 */

'use client';

import React from 'react';

export interface ChartCardProps {
  /** Chart title */
  title: string;
  /** Chart description */
  description?: string;
  /** Chart content */
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
}

export function ChartCard({
  title,
  description,
  children,
  className = '',
}: ChartCardProps) {
  return (
    <div className={`chart-card ${className}`.trim()}>
      <div className="chart-header">
        <h2 className="chart-title">{title}</h2>
        {description && (
          <p className="chart-description">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
