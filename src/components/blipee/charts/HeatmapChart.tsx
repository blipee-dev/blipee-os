/**
 * Blipee HeatmapChart Component
 * Simple grid-based heatmap matching HTML implementation exactly
 */

'use client';

import React from 'react';

export interface HeatmapCell {
  value: number;
  color: string;
}

export interface HeatmapChartProps {
  data: HeatmapCell[];
  title?: string;
  className?: string;
  height?: string;
  gridCols?: number;
  gridRows?: number;
  showValues?: boolean;
}

export function HeatmapChart({
  data,
  title,
  className = '',
  height = '300px',
  gridCols = 7,
  gridRows = 5,
  showValues = true,
}: HeatmapChartProps) {
  return (
    <>
      <style jsx>{`
        .heatmap-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .heatmap-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .heatmap {
          height: ${height};
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(${gridCols}, 1fr);
          grid-template-rows: repeat(${gridRows}, 1fr);
          gap: 8px;
        }

        .heatmap-cell {
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 500;
          color: white;
          transition: all 0.3s ease;
        }

        .heatmap-cell:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          z-index: 10;
        }
      `}</style>

      <div className={`heatmap-container ${className}`.trim()}>
        {title && <div className="heatmap-title">{title}</div>}

        <div className="heatmap">
          {data.map((cell, index) => (
            <div
              key={index}
              className="heatmap-cell"
              style={{ background: cell.color }}
            >
              {showValues && cell.value}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
