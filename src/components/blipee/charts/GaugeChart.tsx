/**
 * Blipee GaugeChart Component
 * Simple SVG-based gauge chart matching HTML implementation exactly
 */

'use client';

import React from 'react';

export interface GaugeChartProps {
  value: number;
  label: string;
  className?: string;
  height?: string;
}

export function GaugeChart({
  value,
  label,
  className = '',
  height = '300px',
}: GaugeChartProps) {
  const radius = 80;
  const circumference = Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <>
      <style jsx>{`
        .gauge-container {
          height: ${height};
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .gauge-svg {
          width: 250px;
          height: 200px;
        }

        .gauge-background {
          fill: none;
          stroke: var(--glass-border);
          stroke-width: 20;
          stroke-linecap: round;
        }

        .gauge-fill {
          fill: none;
          stroke: url(#gaugeGradient);
          stroke-width: 20;
          stroke-linecap: round;
          transition: stroke-dashoffset 0.3s ease;
        }

        .gauge-value {
          position: absolute;
          top: 55%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .gauge-number {
          font-size: 2rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
        }

        .gauge-label {
          font-size: 0.875rem;
          color: var(--text-tertiary);
          margin-top: 0.5rem;
        }
      `}</style>

      <div className={`gauge-container ${className}`.trim()}>
        <svg viewBox="0 0 200 120" className="gauge-svg">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          <path
            d="M 20,100 A 80,80 0 0,1 180,100"
            className="gauge-background"
          />

          <path
            d="M 20,100 A 80,80 0 0,1 180,100"
            className="gauge-fill"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>

        <div className="gauge-value">
          <div className="gauge-number">{value}%</div>
          <div className="gauge-label">{label}</div>
        </div>
      </div>
    </>
  );
}
