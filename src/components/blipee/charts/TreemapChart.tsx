/**
 * Blipee TreemapChart Component
 * Simple grid-based treemap matching HTML implementation exactly
 */

'use client';

import React from 'react';

export interface TreemapDataItem {
  label: string;
  value: number;
  color: string;
}

export interface TreemapChartProps {
  data: TreemapDataItem[];
  title?: string;
  className?: string;
  height?: string;
  gridCols?: number;
  gridRows?: number;
}

export function TreemapChart({
  data,
  title,
  className = '',
  height = '300px',
  gridCols = 4,
  gridRows = 3,
}: TreemapChartProps) {
  return (
    <>
      <style jsx>{`
        .treemap-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .treemap-title {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .treemap {
          height: ${height};
          padding: 20px;
          display: grid;
          grid-template-columns: repeat(${gridCols}, 1fr);
          grid-template-rows: repeat(${gridRows}, 1fr);
          gap: 8px;
        }

        .treemap-cell {
          border-radius: 6px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .treemap-cell:hover {
          transform: scale(1.05);
          z-index: 10;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .treemap-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          z-index: 2;
        }

        .treemap-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          z-index: 2;
        }
      `}</style>

      <div className={`treemap-container ${className}`.trim()}>
        {title && <div className="treemap-title">{title}</div>}

        <div className="treemap">
          {data.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="treemap-cell"
              style={{ background: item.color }}
            >
              <div className="treemap-label">{item.label}</div>
              <div className="treemap-value">{item.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
