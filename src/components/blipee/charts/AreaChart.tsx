/**
 * Blipee AreaChart Component
 * Simple SVG-based area chart matching HTML implementation exactly
 */

'use client';

import React from 'react';

export interface AreaDataPoint {
  label: string;
  value: number;
}

export interface AreaChartProps {
  data: AreaDataPoint[];
  className?: string;
  height?: string;
}

export function AreaChart({
  data,
  className = '',
  height = '300px',
}: AreaChartProps) {
  // Calculate dimensions and scales
  const width = 400;
  const chartHeight = 250;
  const padding = 40;
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const xStep = (width - 2 * padding) / (data.length - 1);

  // Generate path for line and area
  const points = data.map((d, i) => {
    const x = padding + i * xStep;
    const y = chartHeight - padding - ((d.value - minValue) / (maxValue - minValue)) * (chartHeight - 2 * padding);
    return { x, y, label: d.label, value: d.value };
  });

  const linePathData = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
  ).join(' ');

  // Area path: line + close to bottom
  const areaPathData = linePathData +
    ` L ${points[points.length - 1].x},${chartHeight - padding}` +
    ` L ${points[0].x},${chartHeight - padding} Z`;

  return (
    <>
      <style jsx>{`
        .area-chart {
          height: ${height};
          padding: 20px;
          position: relative;
        }

        .area-chart svg {
          width: 100%;
          height: 100%;
        }

        .chart-line {
          fill: none;
          stroke: url(#areaLineGradient);
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .chart-area {
          fill: url(#areaGradient);
          opacity: 0.3;
        }

        .chart-label {
          fill: var(--text-tertiary);
          font-size: 12px;
        }
      `}</style>

      <div className={`area-chart ${className}`.trim()}>
        <svg viewBox={`0 0 ${width} ${chartHeight}`}>
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0.1 }} />
            </linearGradient>
            <linearGradient id="areaLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          <path d={areaPathData} className="chart-area" />
          <path d={linePathData} className="chart-line" />

          {points.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={chartHeight - 10}
              className="chart-label"
              textAnchor="middle"
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>
    </>
  );
}
