/**
 * Design Tokens for blipee OS
 * Central source of truth for colors, spacing, typography, and visual styles
 */

export const designTokens = {
  // Color System
  colors: {
    // Scope colors (for emissions data)
    scope: {
      scope1: '#EF4444', // Red
      scope2: '#3B82F6', // Blue
      scope3: '#6B7280', // Gray
    },

    // Status colors
    status: {
      success: '#10B981', // Green
      warning: '#F59E0B', // Yellow
      danger: '#EF4444', // Red
      info: '#3B82F6', // Blue
      neutral: '#6B7280', // Gray
    },

    // Category-specific colors (for metric types)
    category: {
      electricity: '#3B82F6', // Blue
      gas: '#F97316', // Orange
      heating: '#F97316', // Orange
      cooling: '#06B6D4', // Cyan
      transport: '#8B5CF6', // Purple
      fleet: '#8B5CF6', // Purple
      waste: '#92400E', // Brown
      water: '#14B8A6', // Teal
      travel: '#4F46E5', // Indigo
      fuel: '#EF4444', // Red
      default: '#6B7280', // Gray
    },

    // Standard framework colors
    framework: {
      ghg: '#06B6D4', // Cyan - GHG Protocol
      gri: '#3B82F6', // Blue - GRI
      tcfd: '#8B5CF6', // Purple - TCFD
      esrs: '#F97316', // Orange - ESRS
      sbti: '#10B981', // Green - SBTi
    },

    // Semantic colors
    semantic: {
      onTrack: '#10B981', // Green
      atRisk: '#F59E0B', // Yellow
      offTrack: '#EF4444', // Red
      forecasted: '#8B5CF6', // Purple
    },
  },

  // Spacing System (Tailwind scale)
  spacing: {
    cardPadding: 'p-4',
    sectionPadding: 'p-4 sm:p-6',
    cardGap: 'gap-4',
    sectionGap: 'space-y-6',
    gridGap: 'gap-4',
  },

  // Typography
  typography: {
    pageTitle: 'text-2xl font-bold text-gray-900 dark:text-white',
    sectionTitle: 'text-lg font-semibold text-gray-900 dark:text-white',
    cardTitle: 'text-sm text-gray-500 dark:text-gray-400',
    metricValue: 'text-2xl font-bold text-gray-900 dark:text-white',
    metricUnit: 'text-xs text-gray-500 dark:text-gray-400',
    description: 'text-sm text-[#616161] dark:text-[#757575]',
    badgeText: 'text-xs',
    label: 'text-xs text-gray-500 dark:text-gray-400',
    bodyText: 'text-sm text-gray-700 dark:text-white/80',
  },

  // Shadows
  shadows: {
    card: 'shadow-sm',
    dropdown: 'shadow-lg',
    modal: 'shadow-xl',
  },

  // Border Radius
  radius: {
    card: 'rounded-lg',
    button: 'rounded-lg',
    dropdown: 'rounded-xl',
    input: 'rounded-lg',
    badge: 'rounded',
    pill: 'rounded-full',
  },

  // Glass Morphism Effects
  glassMorphism: {
    card: 'bg-white dark:bg-[#212121] rounded-lg shadow-sm',
    cardHover: 'bg-white dark:bg-[#212121] rounded-lg shadow-sm hover:shadow-md transition-shadow',
    dropdown: 'bg-white dark:bg-[#212121] border border-gray-200 dark:border-white/[0.05] rounded-xl shadow-lg',
    overlay: 'backdrop-blur-xl bg-white/[0.03] border border-white/[0.05]',
  },

  // Interactive States
  interactive: {
    button: {
      base: 'px-4 py-2 rounded-lg transition-all',
      hover: 'hover:bg-gray-50 dark:hover:bg-white/[0.05]',
      active: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      disabled: 'opacity-50 cursor-not-allowed',
    },
    dropdown: {
      item: 'w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all',
      itemHover: 'hover:bg-gray-50 dark:hover:bg-white/[0.05] text-gray-700 dark:text-white/80',
      itemActive: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    },
  },

  // Chart Configuration
  charts: {
    colors: {
      scope1: '#EF4444',
      scope2: '#3B82F6',
      scope3: '#6B7280',
      total: '#8B5CF6',
      forecast: '#8B5CF6',
    },
    grid: {
      stroke: '#374151',
      opacity: 0.1,
    },
    axis: {
      stroke: '#9CA3AF',
      fontSize: '10px',
    },
    tooltip: {
      background: 'rgba(0, 0, 0, 0.8)',
      border: 'none',
      borderRadius: '8px',
      color: 'white',
    },
  },

  // Progress Bars
  progressBar: {
    height: 'h-1.5',
    background: 'bg-gray-200 dark:bg-gray-700',
    fill: 'transition-all',
  },

  // Badges
  badges: {
    ghg: 'px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 text-xs rounded',
    gri: 'px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded',
    tcfd: 'px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded',
    esrs: 'px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs rounded',
    sbti: 'px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded',
  },

  // Loading States
  loading: {
    spinner: 'animate-spin rounded-full h-12 w-12 border-b-2 mx-auto',
    shimmer: 'animate-pulse bg-gray-200 dark:bg-gray-700',
  },

  // Icons
  icons: {
    small: 'w-4 h-4',
    medium: 'w-5 h-5',
    large: 'w-6 h-6',
    extraLarge: 'w-16 h-16',
  },

  // Card Heights
  cardHeights: {
    metric: 'auto',
    chart: 'h-[420px]',
    table: 'min-h-[400px]',
  },

  // Grid Layouts
  gridLayouts: {
    metrics: 'grid grid-cols-4 gap-4',
    charts: 'grid grid-cols-1 lg:grid-cols-2 gap-4',
    mixed: 'grid grid-cols-1 gap-4',
  },
} as const;

// Helper function to get category color
export function getCategoryColor(categoryName: string): string {
  const nameLower = categoryName.toLowerCase();

  if (nameLower.includes('electricity') || nameLower.includes('grid')) {
    return designTokens.colors.category.electricity;
  }
  if (nameLower.includes('gas') || nameLower.includes('heating')) {
    return designTokens.colors.category.gas;
  }
  if (nameLower.includes('transport') || nameLower.includes('vehicle') || nameLower.includes('fleet')) {
    return designTokens.colors.category.transport;
  }
  if (nameLower.includes('waste')) {
    return designTokens.colors.category.waste;
  }
  if (nameLower.includes('travel') || nameLower.includes('flight')) {
    return designTokens.colors.category.travel;
  }
  if (nameLower.includes('cooling') || nameLower.includes('refrigerant') || nameLower.includes('hvac')) {
    return designTokens.colors.category.cooling;
  }
  if (nameLower.includes('fuel') || nameLower.includes('diesel') || nameLower.includes('petrol')) {
    return designTokens.colors.category.fuel;
  }
  if (nameLower.includes('water')) {
    return designTokens.colors.category.water;
  }

  return designTokens.colors.category.default;
}

// Helper function to get status color
export function getStatusColor(status: 'on_track' | 'at_risk' | 'off_track' | string): string {
  switch (status) {
    case 'on_track':
      return designTokens.colors.semantic.onTrack;
    case 'at_risk':
      return designTokens.colors.semantic.atRisk;
    case 'off_track':
      return designTokens.colors.semantic.offTrack;
    default:
      return designTokens.colors.status.neutral;
  }
}

// Type exports for TypeScript
export type ScopeColor = keyof typeof designTokens.colors.scope;
export type StatusColor = keyof typeof designTokens.colors.status;
export type CategoryColor = keyof typeof designTokens.colors.category;
export type FrameworkColor = keyof typeof designTokens.colors.framework;
