/**
 * Blipee Card Component
 * Generic glass morphism card container
 * Based on .chart-card and .kpi-card patterns from HTML
 */

'use client';

import React from 'react';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Enable hover effects */
  hover?: boolean;
}

export function Card({
  children,
  className = '',
  onClick,
  hover = false,
}: CardProps) {
  return (
    <>
      <style jsx>{`
        .card {
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .card-hover:hover {
          border-color: var(--green);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.1);
          transform: translateY(-4px);
        }

        .card-clickable {
          cursor: pointer;
        }
      `}</style>

      <div
        className={`card ${hover ? 'card-hover' : ''} ${onClick ? 'card-clickable' : ''} ${className}`.trim()}
        onClick={onClick}
      >
        {children}
      </div>
    </>
  );
}
