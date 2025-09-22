/**
 * Dashboard Builder Component
 * Allows creation and customization of dashboards
 */

import React from 'react';
import { Widget } from '../widgets/widget-library';

export interface DashboardConfig {
  id: string;
  title: string;
  widgets: Widget[];
  layout: 'grid' | 'flex';
}

interface DashboardBuilderProps {
  config: DashboardConfig;
  onConfigChange?: (config: DashboardConfig) => void;
  className?: string;
}

export function DashboardBuilder({ config, onConfigChange, className = '' }: DashboardBuilderProps) {
  const { title, widgets, layout } = config;

  return (
    <div className={`w-full ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Dashboard with {widgets.length} widgets
        </p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {widgets.map((widget) => (
          <div
            key={widget.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 h-48"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {widget.title}
            </h3>
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {widget.type.toUpperCase()} Widget
              </p>
            </div>
          </div>
        ))}
      </div>

      {widgets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No widgets configured. Add widgets to get started.
          </p>
        </div>
      )}
    </div>
  );
}

export default DashboardBuilder;
