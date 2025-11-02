/**
 * Blipee LineChart Component
 * Simple SVG-based line chart matching HTML implementation exactly
 */

'use client';

import React from 'react';

export interface LineDataPoint {
  label: string;
  value: number;
}

export interface LineChartProps {
  data: LineDataPoint[];
  className?: string;
  height?: string;
}

export function LineChart({
  data,
  className = '',
  height = '300px',
}: LineChartProps) {
  // Calculate dimensions and scales
  const width = 400;
  const chartHeight = 250;
  const padding = 40;
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const xStep = (width - 2 * padding) / (data.length - 1);

  // Generate path for line
  const points = data.map((d, i) => {
    const x = padding + i * xStep;
    const y = chartHeight - padding - ((d.value - minValue) / (maxValue - minValue)) * (chartHeight - 2 * padding);
    return { x, y, label: d.label, value: d.value };
  });

  const pathData = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
  ).join(' ');

  return (
    <>
      <style jsx>{`
        .line-chart {
          height: ${height};
          padding: 20px;
          position: relative;
        }

        .line-chart svg {
          width: 100%;
          height: 100%;
        }

        .chart-line {
          fill: none;
          stroke: url(#lineGradient);
          stroke-width: 3;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .chart-label {
          fill: var(--text-tertiary);
          font-size: 12px;
        }

        .chart-dot {
          transition: all 0.3s ease;
        }

        .chart-dot:hover {
          r: 6;
        }
      `}</style>

      <div className={`line-chart ${className}`.trim()}>
        <svg viewBox={`0 0 ${width} ${chartHeight}`}>
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          <path d={pathData} className="chart-line" />

          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
              className="chart-dot"
            />
          ))}

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
