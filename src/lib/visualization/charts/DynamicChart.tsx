/**
 * Dynamic Chart Component
 * Renders various chart types based on data and configuration
 */

import React from 'react';

export interface ChartConfig {
  type: 'line' | 'area' | 'bar' | 'pie' | 'scatter';
  title?: string;
  data: any[];
  xKey?: string;
  yKey?: string;
  color?: string;
  colors?: string[];
  height?: number;
  width?: number;
}

interface DynamicChartProps {
  config: ChartConfig;
  className?: string;
}

export function DynamicChart({ config, className = '' }: DynamicChartProps) {
  const { type, title, data, height = 300 } = config;

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <div
        className="w-full bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600"
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {type.toUpperCase()} Chart Component
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
            {data?.length || 0} data points
          </p>
        </div>
      </div>
    </div>
  );
}

export default DynamicChart;
