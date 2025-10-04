/**
 * Compliance Dashboard Design Tokens
 * Clean, modern, accessible color scheme aligned with GHG Protocol and industry standards
 * Follows WCAG AA contrast requirements (4.5:1 minimum)
 */

export const complianceColors = {
  // Base Neutrals (Light Mode)
  light: {
    gray900: '#0F172A',
    gray700: '#334155',
    gray500: '#64748B',
    gray300: '#CBD5E1',
    gray100: '#F1F5F9',
    surface: '#FFFFFF',
  },

  // Base Neutrals (Dark Mode)
  dark: {
    surface: '#0B1020',
    elev1: '#111827',
    elev2: '#1a1a1a',
    text: '#E5E7EB',
    textMuted: '#9CA3AF',
  },

  // Primary (Data & Actions) - Trustworthy Blue
  primary: {
    600: '#2563EB',
    500: '#3B82F6',
    400: '#60A5FA',
    300: '#93C5FD',
    200: '#BFDBFE',
    100: '#DBEAFE',
  },

  // Support (Sustainability & Progress) - Green
  green: {
    700: '#15803D',
    600: '#16A34A',
    500: '#22C55E',
    400: '#4ADE80',
    300: '#86EFAC',
    200: '#BBF7D0',
    100: '#DCFCE7',
  },

  // Warnings (Risk & Uncertainty) - Amber
  amber: {
    700: '#B45309',
    600: '#D97706',
    500: '#F59E0B',
    400: '#FBBF24',
    300: '#FCD34D',
    200: '#FDE68A',
    100: '#FEF3C7',
  },

  // Errors (Critical Issues) - Red
  red: {
    700: '#B91C1C',
    600: '#DC2626',
    500: '#EF4444',
    400: '#F87171',
    300: '#FCA5A5',
    200: '#FECACA',
    100: '#FEE2E2',
  },

  // Accent (Highlights) - Teal
  teal: {
    600: '#0D9488',
    500: '#14B8A6',
    400: '#2DD4BF',
    300: '#5EEAD4',
    200: '#99F6E4',
    100: '#CCFBF1',
  },

  // GHG Protocol Scope Colors (Conventional & Accessible)
  scopes: {
    scope1: {
      primary: '#1D4ED8',     // Blue 700 - Direct emissions
      light: '#3B82F6',       // Blue 500
      background: '#DBEAFE',  // Blue 100
    },
    scope2LocationBased: {
      primary: '#3B82F6',     // Blue 500 - Purchased energy (location)
      light: '#60A5FA',       // Blue 400
      background: '#BFDBFE',  // Blue 200
    },
    scope2MarketBased: {
      primary: '#93C5FD',     // Blue 300 - Lighter for differentiation
      light: '#BFDBFE',       // Blue 200
      background: '#DBEAFE',  // Blue 100
    },
    scope3: {
      // Categories 1-15 use graduated neutral-to-teal scale
      cat1to5: ['#64748B', '#78859D', '#8C93AF', '#A0A1C1', '#B4AFD3'],
      cat6to10: ['#BFDBFE', '#DBEAFE', '#C7E9F9', '#B3DFF5', '#9FD5F1'],
      cat11to15: ['#CCFBF1', '#99F6E4', '#5EEAD4', '#2DD4BF', '#14B8A6'],
    }
  },

  // Data Quality Indicators
  dataQuality: {
    high: {       // Primary data, measured
      color: '#16A34A',
      bg: '#DCFCE7',
      border: '#BBF7D0',
    },
    medium: {     // Calculated, secondary data
      color: '#D97706',
      bg: '#FEF3C7',
      border: '#FDE68A',
    },
    low: {        // Estimated, proxy data
      color: '#DC2626',
      bg: '#FEE2E2',
      border: '#FECACA',
    }
  },

  // Compliance Status
  compliance: {
    complete: {
      color: '#16A34A',
      bg: '#DCFCE7',
      icon: '#22C55E',
    },
    inProgress: {
      color: '#D97706',
      bg: '#FEF3C7',
      icon: '#F59E0B',
    },
    incomplete: {
      color: '#DC2626',
      bg: '#FEE2E2',
      icon: '#EF4444',
    },
    notApplicable: {
      color: '#64748B',
      bg: '#F1F5F9',
      icon: '#94A3B8',
    }
  },

  // Framework-specific accent colors
  frameworks: {
    ghg: {
      primary: '#2563EB',
      gradient: ['#2563EB', '#1D4ED8'],
    },
    gri: {
      primary: '#16A34A',
      gradient: ['#16A34A', '#15803D'],
    },
    esrs: {
      primary: '#7C3AED',
      gradient: ['#7C3AED', '#6D28D9'],
    },
    tcfd: {
      primary: '#0D9488',
      gradient: ['#0D9488', '#0F766E'],
    },
    ifrs: {
      primary: '#DC2626',
      gradient: ['#DC2626', '#B91C1C'],
    }
  },

  // Visualization-specific
  charts: {
    // Stacked bars, waterfall charts
    series: [
      '#3B82F6',  // Blue
      '#10B981',  // Green
      '#F59E0B',  // Amber
      '#8B5CF6',  // Purple
      '#EC4899',  // Pink
      '#14B8A6',  // Teal
      '#F97316',  // Orange
      '#06B6D4',  // Cyan
    ],
    // Target lines, projections
    target: {
      line: '#DC2626',
      fill: '#FEE2E2',
      dash: [5, 5],
    },
    // Trend lines
    trend: {
      positive: '#16A34A',
      negative: '#DC2626',
      neutral: '#64748B',
    }
  }
};

// Typography scale
export const typography = {
  sizes: {
    h1: '1.875rem',     // 30px
    h2: '1.5rem',       // 24px
    h3: '1.25rem',      // 20px
    h4: '1.125rem',     // 18px
    body: '1rem',       // 16px
    small: '0.875rem',  // 14px
    tiny: '0.75rem',    // 12px
    metric: '2rem',     // 32px - for large numbers
    metricLarge: '2.5rem', // 40px
  },
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeights: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  }
};

// Spacing (8px grid)
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

// Border radius
export const borderRadius = {
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

// Shadows (subtle, elevation-based)
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
};

// Component-specific tokens
export const components = {
  card: {
    background: complianceColors.light.surface,
    backgroundDark: complianceColors.dark.elev1,
    border: complianceColors.light.gray300,
    borderDark: 'rgba(255, 255, 255, 0.05)',
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    shadow: shadows.sm,
  },
  badge: {
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: borderRadius.full,
    fontSize: typography.sizes.tiny,
    fontWeight: typography.weights.semibold,
  },
  tooltip: {
    background: 'rgba(0, 0, 0, 0.9)',
    color: '#FFFFFF',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    fontSize: typography.sizes.small,
  }
};

// Accessibility helpers
export const a11y = {
  focusRing: {
    width: '2px',
    color: complianceColors.primary[500],
    offset: '2px',
  },
  minContrastRatio: 4.5, // WCAG AA
};

// Export utility functions
export const getStatusColor = (status: 'complete' | 'in-progress' | 'incomplete' | 'not-applicable') => {
  const statusMap = {
    'complete': complianceColors.compliance.complete,
    'in-progress': complianceColors.compliance.inProgress,
    'incomplete': complianceColors.compliance.incomplete,
    'not-applicable': complianceColors.compliance.notApplicable,
  };
  return statusMap[status] || statusMap['not-applicable'];
};

export const getDataQualityColor = (quality: number) => {
  if (quality >= 0.8) return complianceColors.dataQuality.high;
  if (quality >= 0.6) return complianceColors.dataQuality.medium;
  return complianceColors.dataQuality.low;
};

export const getScopeColor = (scope: 'scope_1' | 'scope_2_lb' | 'scope_2_mb' | 'scope_3') => {
  const scopeMap = {
    'scope_1': complianceColors.scopes.scope1.primary,
    'scope_2_lb': complianceColors.scopes.scope2LocationBased.primary,
    'scope_2_mb': complianceColors.scopes.scope2MarketBased.primary,
    'scope_3': complianceColors.scopes.scope3.cat1to5[0],
  };
  return scopeMap[scope];
};

export const getScope3CategoryColor = (categoryIndex: number) => {
  const { cat1to5, cat6to10, cat11to15 } = complianceColors.scopes.scope3;
  if (categoryIndex < 5) return cat1to5[categoryIndex];
  if (categoryIndex < 10) return cat6to10[categoryIndex - 5];
  return cat11to15[categoryIndex - 10];
};
