/**
 * Blipee DonutChart Component
 * Simple SVG-based donut chart matching HTML implementation exactly
 */

'use client';

import React from 'react';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  segments: DonutSegment[];
  className?: string;
  height?: string;
}

export function DonutChart({
  segments,
  className = '',
  height = '300px',
}: DonutChartProps) {
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segmentsSVG = segments.map((seg, index) => {
    const percentage = (seg.value / total) * 100;
    const dashArray = `${(percentage / 100) * circumference} ${circumference}`;
    const dashOffset = -offset;
    offset += (percentage / 100) * circumference;

    return (
      <circle
        key={index}
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke={seg.color}
        strokeWidth="40"
        strokeDasharray={dashArray}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 100 100)"
        className="donut-segment"
      />
    );
  });

  return (
    <>
      <style jsx>{`
        .donut-container {
          height: ${height};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2rem;
        }

        .donut-svg {
          width: 250px;
          height: 250px;
        }

        .donut-segment {
          transition: opacity 0.3s ease;
        }

        .donut-legend {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 4px;
        }

        .legend-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
      `}</style>

      <div className={`donut-container ${className}`.trim()}>
        <svg viewBox="0 0 200 200" className="donut-svg">
          {segmentsSVG}
          <circle cx="100" cy="100" r="50" fill="var(--glass-bg)" />
        </svg>

        <div className="donut-legend">
          {segments.map((seg, index) => (
            <div key={index} className="legend-item">
              <div className="legend-color" style={{ background: seg.color }}></div>
              <span className="legend-text">
                {seg.label} {((seg.value / total) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
