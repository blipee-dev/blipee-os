/**
 * Sustainability Color Standards
 * Following GHG Protocol and industry best practices
 */

// Emissions Scopes - GHG Protocol Standard Colors
export const SCOPE_COLORS = {
  scope1: '#22c55e',     // Green - Direct emissions (owned/controlled sources)
  scope2: '#f59e0b',     // Amber/Orange - Indirect emissions (purchased energy)
  scope3: '#3b82f6',     // Blue - Other indirect emissions (value chain)
} as const;

// Performance Indicators
export const PERFORMANCE_COLORS = {
  excellent: '#10b981',  // Emerald Green - Exceeding targets
  good: '#22c55e',       // Green - Meeting targets
  warning: '#f59e0b',    // Amber - Needs attention
  poor: '#ef4444',       // Red - Below targets
  critical: '#dc2626',   // Dark Red - Critical issues
} as const;

// Resource Types
export const RESOURCE_COLORS = {
  energy: '#f59e0b',     // Amber/Orange - Electricity/Energy
  water: '#3b82f6',      // Blue - Water resources
  waste: '#6b7280',      // Gray - Waste materials
  carbon: '#374151',     // Dark Gray - CO2/Carbon
  renewable: '#10b981',  // Emerald - Renewable energy
  fossil: '#dc2626',     // Red - Fossil fuels
} as const;

// Trend Indicators
export const TREND_COLORS = {
  // For emissions, waste (where down is good)
  decreasing: '#22c55e', // Green - Good trend
  stable: '#6b7280',     // Gray - No change
  increasing: '#ef4444', // Red - Bad trend

  // For efficiency, renewable % (where up is good)
  improving: '#22c55e',  // Green - Good trend
  unchanged: '#6b7280',  // Gray - No change
  declining: '#ef4444',  // Red - Bad trend
} as const;

// Chart Color Palettes
export const CHART_PALETTES = {
  // For multiple data series
  primary: [
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
  ],

  // For emissions categories
  emissions: [
    '#22c55e', // Scope 1
    '#f59e0b', // Scope 2
    '#3b82f6', // Scope 3
  ],

  // For waste types
  waste: [
    '#dc2626', // Landfill (worst)
    '#f59e0b', // Incineration
    '#3b82f6', // Recycling
    '#22c55e', // Composting (best)
  ],
} as const;

// Emissions Intensity Colors (for heatmaps and gradients)
export const EMISSIONS_INTENSITY = {
  veryLow: '#10b981',   // Emerald - Excellent (0-25% of target)
  low: '#22c55e',       // Green - Good (25-50% of target)
  medium: '#f59e0b',    // Amber - Caution (50-75% of target)
  high: '#ef4444',      // Red - Warning (75-100% of target)
  veryHigh: '#dc2626',  // Dark Red - Critical (>100% of target)

  // Gradient for continuous scales
  gradient: {
    start: '#10b981',   // Green (low emissions)
    middle: '#f59e0b',  // Amber (medium)
    end: '#dc2626',     // Red (high emissions)
  }
} as const;

// Emissions by Source Type (sector-specific)
export const EMISSIONS_SOURCE_COLORS = {
  transportation: '#8b5cf6',  // Purple
  electricity: '#f59e0b',     // Amber/Orange
  heating: '#ef4444',         // Red
  manufacturing: '#6b7280',   // Gray
  agriculture: '#84cc16',     // Lime
  waste: '#78716c',          // Stone
  fugitive: '#f472b6',       // Pink
} as const;

// Heatmap Colors (for intensity visualization)
export const HEATMAP_COLORS = {
  low: '#dcfce7',        // Light green - Low impact
  medium: '#fef3c7',     // Light amber - Medium impact
  high: '#fee2e2',       // Light red - High impact
  veryHigh: '#fca5a5',   // Red - Very high impact
} as const;

// Background Colors (with transparency for overlays)
export const BG_COLORS = {
  scope1: 'rgba(34, 197, 94, 0.1)',   // Green with 10% opacity
  scope2: 'rgba(245, 158, 11, 0.1)',  // Amber with 10% opacity
  scope3: 'rgba(59, 130, 246, 0.1)',  // Blue with 10% opacity
  success: 'rgba(34, 197, 94, 0.05)', // Very light green
  warning: 'rgba(245, 158, 11, 0.05)', // Very light amber
  error: 'rgba(239, 68, 68, 0.05)',   // Very light red
} as const;

// Gradient Definitions
export const GRADIENTS = {
  scope1: 'from-green-400 to-green-600',
  scope2: 'from-amber-400 to-amber-600',
  scope3: 'from-blue-400 to-blue-600',
  energy: 'from-amber-400 to-orange-600',
  water: 'from-blue-400 to-blue-600',
  waste: 'from-gray-400 to-gray-600',
  success: 'from-green-400 to-emerald-600',
  warning: 'from-amber-400 to-orange-600',
  danger: 'from-red-400 to-red-600',
} as const;

// Utility function to get trend color based on metric type
export function getTrendColor(
  trend: 'up' | 'down' | 'stable',
  metricType: 'emissions' | 'efficiency' | 'waste' | 'energy' | 'water'
): string {
  // For emissions, waste, energy consumption - lower is better
  if (['emissions', 'waste', 'energy', 'water'].includes(metricType)) {
    return trend === 'down' ? TREND_COLORS.decreasing :
           trend === 'up' ? TREND_COLORS.increasing :
           TREND_COLORS.stable;
  }

  // For efficiency metrics - higher is better
  return trend === 'up' ? TREND_COLORS.improving :
         trend === 'down' ? TREND_COLORS.declining :
         TREND_COLORS.unchanged;
}

// Get emissions intensity color based on value and target
export function getEmissionsIntensityColor(
  value: number,
  target: number,
  type: 'hex' | 'class' = 'hex'
): string {
  const percentage = (value / target) * 100;

  let color: string;
  if (percentage <= 25) color = EMISSIONS_INTENSITY.veryLow;
  else if (percentage <= 50) color = EMISSIONS_INTENSITY.low;
  else if (percentage <= 75) color = EMISSIONS_INTENSITY.medium;
  else if (percentage <= 100) color = EMISSIONS_INTENSITY.high;
  else color = EMISSIONS_INTENSITY.veryHigh;

  if (type === 'class') {
    // Convert to Tailwind classes
    switch(color) {
      case EMISSIONS_INTENSITY.veryLow: return 'text-emerald-500 bg-emerald-50';
      case EMISSIONS_INTENSITY.low: return 'text-green-500 bg-green-50';
      case EMISSIONS_INTENSITY.medium: return 'text-amber-500 bg-amber-50';
      case EMISSIONS_INTENSITY.high: return 'text-red-500 bg-red-50';
      case EMISSIONS_INTENSITY.veryHigh: return 'text-red-700 bg-red-100';
      default: return 'text-gray-500 bg-gray-50';
    }
  }

  return color;
}

// Export type definitions
export type ScopeColor = keyof typeof SCOPE_COLORS;
export type PerformanceColor = keyof typeof PERFORMANCE_COLORS;
export type ResourceColor = keyof typeof RESOURCE_COLORS;
export type TrendColor = keyof typeof TREND_COLORS;