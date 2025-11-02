/**
 * Blipee Design System - Color Constants
 * Exact replica from docs/js/charts.js
 */

export const ChartColors = {
  // Solid Colors
  green: '#10b981',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  amber: '#f59e0b',
  cyan: '#06b6d4',
  red: '#ef4444',

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #10b981 0%, #0ea5e9 100%)',
    green: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    blue: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)',
    purple: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    red: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    amber: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
  },

  /**
   * Convert hex color to rgba with opacity
   * @param color - Hex color string (e.g., '#10b981')
   * @param opacity - Opacity value 0-1
   * @returns rgba color string
   */
  opacity: (color: string, opacity: number): string => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },
} as const;

// Type for chart color keys
export type ChartColorKey = keyof Omit<typeof ChartColors, 'gradients' | 'opacity'>;

// Type for gradient keys
export type GradientKey = keyof typeof ChartColors.gradients;

// Export individual colors for convenience
export const {
  green,
  blue,
  purple,
  amber,
  cyan,
  red,
  gradients,
  opacity,
} = ChartColors;
