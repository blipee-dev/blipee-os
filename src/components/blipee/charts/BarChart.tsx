/**
 * Blipee BarChart Component
 * Simple CSS-based bar chart matching HTML implementation exactly
 */

'use client';

import React from 'react';

export interface BarData {
  label: string;
  value: number;
  displayValue?: string;
  color?: string;
}

export interface BarChartProps {
  data: BarData[];
  maxValue?: number;
  className?: string;
  height?: string;
}

export function BarChart({
  data,
  maxValue,
  className = '',
  height = '300px',
}: BarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value));

  return (
    <>
      <style jsx>{`
        .bar-chart {
          height: ${height};
          padding: 20px;
          display: flex;
          align-items: flex-end;
          gap: 12px;
          position: relative;
        }

        .bar {
          flex: 1;
          background: var(--gradient-primary);
          border-radius: 8px 8px 0 0;
          position: relative;
          transition: all 0.3s ease;
        }

        .bar:hover {
          opacity: 0.8;
          transform: translateY(-4px);
        }

        .bar-label {
          position: absolute;
          bottom: -24px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.75rem;
          color: var(--text-tertiary);
          white-space: nowrap;
        }

        .bar-value {
          position: absolute;
          top: -24px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
      `}</style>

      <div className={`bar-chart ${className}`.trim()}>
        {data.map((item, index) => {
          const barHeight = (item.value / max) * 100;
          const style: React.CSSProperties = {
            height: `${barHeight}%`,
          };

          if (item.color) {
            style.background = item.color;
          }

          return (
            <div key={index} className="bar" style={style}>
              <div className="bar-value">
                {item.displayValue || item.value}
              </div>
              <div className="bar-label">{item.label}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
