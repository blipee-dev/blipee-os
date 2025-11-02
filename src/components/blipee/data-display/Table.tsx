/**
 * Blipee Table Component
 * Simple data table with glass morphism styling
 * Matches the HTML design system exactly
 */

'use client';

import React from 'react';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  className?: string;
}

export function Table<T = any>({
  columns,
  data,
  className = '',
}: TableProps<T>) {
  return (
    <>
      <style jsx>{`
        .blipee-table-wrapper {
          width: 100%;
          overflow-x: auto;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 16px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .blipee-table {
          width: 100%;
          border-collapse: collapse;
        }

        .blipee-table th {
          text-align: left;
          padding: 1rem;
          color: var(--text-tertiary);
          font-size: 0.875rem;
          font-weight: 600;
          border-bottom: 1px solid var(--glass-border);
        }

        .blipee-table td {
          padding: 1rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .blipee-table tbody tr:last-child td {
          border-bottom: none;
        }

        .blipee-table tbody tr:hover {
          background: rgba(16, 185, 129, 0.05);
        }

        @media (max-width: 768px) {
          .blipee-table-wrapper {
            padding: 1rem;
          }

          .blipee-table th,
          .blipee-table td {
            padding: 0.75rem;
            font-size: 0.8125rem;
          }
        }
      `}</style>

      <div className={`blipee-table-wrapper ${className}`.trim()}>
        <table className="blipee-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    textAlign: column.align || 'left',
                  }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((column) => {
                    const value = (row as any)[column.key];
                    const content = column.render
                      ? column.render(value, row, rowIndex)
                      : value;

                    return (
                      <td
                        key={column.key}
                        style={{ textAlign: column.align || 'left' }}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
