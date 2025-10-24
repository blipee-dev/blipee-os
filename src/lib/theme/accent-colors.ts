/**
 * Dynamic Accent Color System
 *
 * Provides utilities to generate color classes based on the selected accent color.
 * All UI elements use these utilities to maintain a monochromatic color scheme.
 */

import { type AccentColor } from '@/providers/ThemeProvider';

/**
 * Color shade definitions for each accent color
 * Each accent has 9 shades from lightest (50) to darkest (900)
 */
const accentColorMap = {
  green: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  orange: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  pink: {
    50: '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    300: '#f9a8d4',
    400: '#f472b6',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
    800: '#9d174d',
    900: '#831843',
  },
  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
  },
} as const;

export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

/**
 * Get the hex color value for a specific accent color and shade
 */
export function getAccentColor(accent: AccentColor, shade: ColorShade): string {
  return accentColorMap[accent][shade];
}

/**
 * Get Tailwind CSS class for text color
 */
export function getAccentTextClass(accent: AccentColor, shade: ColorShade): string {
  return `text-${accent}-${shade}`;
}

/**
 * Get Tailwind CSS class for background color
 */
export function getAccentBgClass(accent: AccentColor, shade: ColorShade): string {
  return `bg-${accent}-${shade}`;
}

/**
 * Get Tailwind CSS class for border color
 */
export function getAccentBorderClass(accent: AccentColor, shade: ColorShade): string {
  return `border-${accent}-${shade}`;
}

/**
 * Get all color classes for a specific shade (text, bg, border)
 */
export function getAccentClasses(
  accent: AccentColor,
  shade: ColorShade,
  type: 'text' | 'bg' | 'border' = 'text'
): string {
  switch (type) {
    case 'text':
      return getAccentTextClass(accent, shade);
    case 'bg':
      return getAccentBgClass(accent, shade);
    case 'border':
      return getAccentBorderClass(accent, shade);
  }
}

/**
 * Get gradient classes for the accent color
 */
export function getAccentGradientClass(accent: AccentColor, direction: 'to-r' | 'to-br' = 'to-r'): string {
  const fromShade = 500;
  const toShade = 600;
  return `bg-gradient-${direction} from-${accent}-${fromShade} to-${accent}-${toShade}`;
}

/**
 * Icon color mapping for different categories
 * Maps each category to a specific shade of the accent color for visual distinction
 */
export const categoryIconShades: Record<string, ColorShade> = {
  // Emissions categories
  scope1: 700,      // Darkest for primary emissions
  scope2: 600,      // Medium-dark for energy emissions
  scope3: 500,      // Medium for indirect emissions

  // Resource categories
  energy: 600,      // Same as scope2 (they're related)
  water: 500,
  waste: 600,

  // Operational categories
  transportation: 500,
  supplychain: 400,
  humanexperience: 400,
  compliance: 600,

  // Default fallback
  default: 500,
};

/**
 * Get icon color class for a category with the current accent
 */
export function getCategoryIconClass(accent: AccentColor, category: string): string {
  const shade = categoryIconShades[category.toLowerCase()] || categoryIconShades.default;
  return getAccentTextClass(accent, shade);
}

/**
 * Badge/ranking color variations
 */
export const rankingColorShades = {
  first: { from: 600, to: 700 },    // Darkest gradient
  second: { from: 500, to: 600 },   // Medium gradient
  third: { from: 400, to: 500 },    // Lighter gradient
  default: { from: 300, to: 400 },  // Lightest gradient
};

/**
 * Get gradient class for ranking badges
 */
export function getRankingGradientClass(accent: AccentColor, rank: number): string {
  let colorDef;
  if (rank === 0) colorDef = rankingColorShades.first;
  else if (rank === 1) colorDef = rankingColorShades.second;
  else if (rank === 2) colorDef = rankingColorShades.third;
  else colorDef = rankingColorShades.default;

  return `bg-gradient-to-r from-${accent}-${colorDef.from} to-${accent}-${colorDef.to}`;
}

/**
 * Score color mapping based on performance score
 */
export function getScoreColorClass(accent: AccentColor, score: number, type: 'text' | 'bg' = 'text'): string {
  let shade: ColorShade;

  if (score >= 85) shade = 600;       // Excellent - darkest
  else if (score >= 70) shade = 500;  // Good - medium-dark
  else if (score >= 50) shade = 400;  // Fair - medium
  else shade = 300;                   // Needs improvement - lighter

  return type === 'text'
    ? getAccentTextClass(accent, shade)
    : getAccentBgClass(accent, shade);
}

/**
 * Get inline style for accent color (useful for dynamic SVG colors, etc.)
 */
export function getAccentColorStyle(accent: AccentColor, shade: ColorShade): { color: string } {
  return { color: getAccentColor(accent, shade) };
}
