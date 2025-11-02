/**
 * Blipee ProgressRings Component
 * Multiple circular progress indicators
 * Based on progressRings() in charts.js
 */

'use client';

import React from 'react';

export interface ProgressRing {
  label: string;
  value: number;
  color: string;
}

export interface ProgressRingsProps {
  rings: ProgressRing[];
  className?: string;
  height?: string;
}

export function ProgressRings({
  rings,
  className = '',
  height = '300px',
}: ProgressRingsProps) {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  return (
    <>
      <style jsx>{`
        .progress-rings {
          height: ${height};
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 20px;
        }

        .progress-ring {
          position: relative;
          width: 120px;
          height: 120px;
        }

        .progress-ring svg {
          width: 100%;
          height: 100%;
          transform: rotate(-90deg);
        }

        .progress-ring-circle {
          fill: none;
          stroke-width: 8;
          transition: stroke-dashoffset 0.5s ease;
        }

        .progress-ring-bg {
          stroke: var(--glass-border);
        }

        .progress-ring-value {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
        }

        .progress-percentage {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .progress-label {
          font-size: 0.75rem;
          color: var(--text-tertiary);
          margin-top: 0.25rem;
        }
      `}</style>

      <div className={`progress-rings ${className}`.trim()}>
        {rings.map((ring, index) => {
          const offset = circumference - (ring.value / 100) * circumference;

          return (
            <div key={index} className="progress-ring">
              <svg viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="progress-ring-circle progress-ring-bg"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="progress-ring-circle"
                  stroke={ring.color}
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                />
              </svg>
              <div className="progress-ring-value">
                <div className="progress-percentage">{ring.value}%</div>
                <div className="progress-label">{ring.label}</div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
