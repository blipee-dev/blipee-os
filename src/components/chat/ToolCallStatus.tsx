'use client';

import { cn } from '@/lib/utils';
import {
  LineChart,
  Database,
  TrendingUp,
  BarChart3,
  Leaf,
  Droplet,
  Zap,
  Trash2,
  Plane,
  Building2,
  CheckCircle2,
  Loader2
} from 'lucide-react';

/**
 * Tool name to human-readable label and icon mapping
 */
const TOOL_CONFIG: Record<string, { label: string; icon: React.ComponentType<any> }> = {
  // Analysis tools
  analyzeCarbonFootprintTool: { label: 'Analyzing carbon footprint', icon: Leaf },
  analyzeWaterConsumptionTool: { label: 'Analyzing water consumption', icon: Droplet },
  analyzeEnergyConsumptionTool: { label: 'Analyzing energy consumption', icon: Zap },
  analyzeWasteGenerationTool: { label: 'Analyzing waste generation', icon: Trash2 },
  analyzeTransportationTool: { label: 'Analyzing transportation', icon: Plane },

  // Visualization tools
  getEmissionsTrend: { label: 'Generating emissions trend chart', icon: TrendingUp },
  getEmissionsBreakdown: { label: 'Creating emissions breakdown', icon: BarChart3 },
  getEmissionsYoYVariation: { label: 'Computing year-over-year changes', icon: TrendingUp },
  getSBTiProgress: { label: 'Analyzing SBTi progress', icon: LineChart },
  getMonthlyConsumption: { label: 'Fetching monthly consumption data', icon: BarChart3 },
  getTripAnalytics: { label: 'Analyzing travel patterns', icon: Plane },
  getBuildingEnergyBreakdown: { label: 'Breaking down building energy', icon: Building2 },

  // Data tools
  addMetricData: { label: 'Adding metric data', icon: Database },
  bulkAddMetricData: { label: 'Adding multiple metrics', icon: Database },
  updateMetricData: { label: 'Updating metric data', icon: Database },
  deleteMetricData: { label: 'Deleting metric data', icon: Database },
};

interface ToolCallStatusProps {
  toolName: string;
  state: 'input-available' | 'input-streaming' | 'output-available' | 'output-error';
  className?: string;
}

export function ToolCallStatus({ toolName, state, className }: ToolCallStatusProps) {
  const config = TOOL_CONFIG[toolName] || { label: `Running ${toolName}`, icon: Loader2 };
  const Icon = config.icon;

  const isComplete = state === 'output-available';
  const isError = state === 'output-error';
  const isLoading = state === 'input-available' || state === 'input-streaming';

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-300',
        isComplete && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        isError && 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
        isLoading && 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        className
      )}
    >
      {/* Icon with status indicator */}
      <div className="relative flex-shrink-0">
        {isComplete ? (
          <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
        ) : isError ? (
          <Icon className="size-5 text-red-600 dark:text-red-400" />
        ) : (
          <div className="relative">
            <Icon className="size-5 text-blue-600 dark:text-blue-400" />
            {isLoading && (
              <div className="absolute -inset-1">
                <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600 dark:border-blue-800 dark:border-t-blue-400" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status text */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            isComplete && 'text-green-700 dark:text-green-300',
            isError && 'text-red-700 dark:text-red-300',
            isLoading && 'text-blue-700 dark:text-blue-300'
          )}
        >
          {isComplete && '✓ '}
          {config.label}
          {isLoading && '...'}
        </p>
      </div>

      {/* Pulsing indicator for loading */}
      {isLoading && (
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  );
}

/**
 * Container for multiple tool call statuses
 */
interface ToolCallStatusGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ToolCallStatusGroup({ children, className }: ToolCallStatusGroupProps) {
  return (
    <div className={cn('space-y-2 my-4', className)}>
      {children}
    </div>
  );
}
