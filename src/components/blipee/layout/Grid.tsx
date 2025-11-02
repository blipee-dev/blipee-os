/**
 * Blipee Grid Component
 * Responsive grid layout system for organizing content
 */

'use client';

import React from 'react';

export type GridCols = 1 | 2 | 3 | 4 | 6 | 12;
export type GridGap = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface GridProps {
  cols?: GridCols;
  smCols?: GridCols;
  mdCols?: GridCols;
  lgCols?: GridCols;
  gap?: GridGap;
  children: React.ReactNode;
  className?: string;
}

const gapMap: Record<GridGap, string> = {
  none: '0',
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};

export function Grid({
  cols = 1,
  smCols,
  mdCols,
  lgCols,
  gap = 'md',
  children,
  className = '',
}: GridProps) {
  // Build responsive grid template
  const gridTemplateColumns = `repeat(${cols}, 1fr)`;
  const smGridTemplateColumns = smCols ? `repeat(${smCols}, 1fr)` : undefined;
  const mdGridTemplateColumns = mdCols ? `repeat(${mdCols}, 1fr)` : undefined;
  const lgGridTemplateColumns = lgCols ? `repeat(${lgCols}, 1fr)` : undefined;

  return (
    <>
      <style jsx>{`
        .blipee-grid {
          display: grid;
          grid-template-columns: ${gridTemplateColumns};
          gap: ${gapMap[gap]};
        }

        @media (min-width: 640px) {
          .blipee-grid {
            ${smGridTemplateColumns ? `grid-template-columns: ${smGridTemplateColumns};` : ''}
          }
        }

        @media (min-width: 768px) {
          .blipee-grid {
            ${mdGridTemplateColumns ? `grid-template-columns: ${mdGridTemplateColumns};` : ''}
          }
        }

        @media (min-width: 1024px) {
          .blipee-grid {
            ${lgGridTemplateColumns ? `grid-template-columns: ${lgGridTemplateColumns};` : ''}
          }
        }
      `}</style>
      <div className={`blipee-grid ${className}`.trim()}>
        {children}
      </div>
    </>
  );
}
