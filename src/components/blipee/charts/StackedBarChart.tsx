/**
 * Blipee StackedBarChart Component
 * Simple CSS-based stacked bar chart matching HTML implementation exactly
 */

'use client';

import React from 'react';

export interface BarSegment {
  value: number;
  color: string;
}

export interface StackedBarData {
  label: string;
  segments: BarSegment[];
}

export interface StackedBarChartProps {
  data: StackedBarData[];
  maxValue?: number;
  className?: string;
  height?: string;
}

export function StackedBarChart({
  data,
  maxValue,
  className = '',
  height = '300px',
}: StackedBarChartProps) {
  // Calculate max total value across all bars
  const max =
    maxValue ||
    Math.max(
      ...data.map((bar) => bar.segments.reduce((sum, seg) => sum + seg.value, 0))
    );

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

        .stacked-bar {
          flex: 1;
          display: flex;
          flex-direction: column-reverse;
          border-radius: 8px 8px 0 0;
          position: relative;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        .stacked-bar:hover {
          opacity: 0.8;
          transform: translateY(-4px);
        }

        .bar-segment {
          width: 100%;
          transition: all 0.3s ease;
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
        {data.map((bar, barIndex) => {
          const total = bar.segments.reduce((sum, seg) => sum + seg.value, 0);
          const barHeight = (total / max) * 100;

          return (
            <div
              key={barIndex}
              className="stacked-bar"
              style={{ height: `${barHeight}%` }}
            >
              {bar.segments.map((segment, segIndex) => {
                const segmentHeight = (segment.value / total) * 100;

                return (
                  <div
                    key={segIndex}
                    className="bar-segment"
                    style={{
                      height: `${segmentHeight}%`,
                      background: segment.color,
                    }}
                  />
                );
              })}

              <div className="bar-value">{total}</div>
              <div className="bar-label">{bar.label}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
