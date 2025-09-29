/**
 * GHG Protocol Official Color Standards
 *
 * These colors follow the Greenhouse Gas Protocol's official
 * color conventions for sustainability reporting and visualization
 */

export const GHG_PROTOCOL_COLORS = {
  // Emission Scopes (Official GHG Protocol Colors)
  scope1: {
    primary: '#DC2626',     // Red-600 - Direct emissions (combustion, company vehicles, etc.)
    light: '#FCA5A5',       // Red-300
    dark: '#991B1B',        // Red-800
    gradient: 'from-red-600 to-red-700'
  },
  scope2: {
    primary: '#D97706',     // Orange-600 - Indirect energy emissions (purchased electricity)
    light: '#FCD34D',       // Orange-300
    dark: '#92400E',        // Orange-800
    gradient: 'from-orange-600 to-orange-700'
  },
  scope3: {
    primary: '#2563EB',     // Blue-600 - Other indirect emissions (supply chain, business travel)
    light: '#93C5FD',       // Blue-300
    dark: '#1E40AF',        // Blue-800
    gradient: 'from-blue-600 to-blue-700'
  },

  // Data Types
  historical: {
    primary: '#374151',     // Gray-700 - Neutral for actual data
    light: '#9CA3AF',       // Gray-400
    dark: '#111827'         // Gray-900
  },
  forecast: {
    primary: '#059669',     // Emerald-600 - Green for predictions/forecasts
    light: '#6EE7B7',       // Emerald-300
    dark: '#047857'         // Emerald-700
  },
  target: {
    primary: '#EF4444',     // Red-500 - Targets and goals
    light: '#FCA5A5',       // Red-300
    dark: '#DC2626'         // Red-600
  },

  // Status Colors
  onTrack: '#10B981',       // Emerald-500
  behindTarget: '#EF4444',  // Red-500
  neutral: '#6B7280',       // Gray-500

  // Confidence bands and uncertainty
  confidence: {
    primary: '#3B82F6',     // Blue-500
    opacity: 0.2
  }
} as const;

/**
 * Helper function to get scope color by number
 */
export function getScopeColor(scopeNumber: 1 | 2 | 3, variant: 'primary' | 'light' | 'dark' = 'primary') {
  const scopeMap = {
    1: GHG_PROTOCOL_COLORS.scope1,
    2: GHG_PROTOCOL_COLORS.scope2,
    3: GHG_PROTOCOL_COLORS.scope3
  };

  return scopeMap[scopeNumber][variant];
}

/**
 * Get all scope colors for charts
 */
export function getAllScopeColors(variant: 'primary' | 'light' | 'dark' = 'primary') {
  return [
    GHG_PROTOCOL_COLORS.scope1[variant],
    GHG_PROTOCOL_COLORS.scope2[variant],
    GHG_PROTOCOL_COLORS.scope3[variant]
  ];
}