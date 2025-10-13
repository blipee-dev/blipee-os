/**
 * GRI Sector-Specific Dashboard Configuration
 * Maps GRI sector material topics to dashboard components
 */

export interface DashboardConfig {
  type: string;
  name: string;
  description: string;
  component: string; // Component path to lazy load
  icon: string; // Lucide icon name
  gri_reference?: string;
  color: string; // Tailwind color class
}

/**
 * Dashboard type to component mapping
 * Each material topic dashboard_type maps to a specific component
 */
export const DASHBOARD_REGISTRY: Record<string, DashboardConfig> = {
  // Standard GRI 300 Series (All Sectors)
  'ghg_emissions': {
    type: 'ghg_emissions',
    name: 'GHG Emissions',
    description: 'Scope 1, 2, 3 greenhouse gas emissions tracking',
    component: 'ComplianceDashboard', // Uses existing Compliance Dashboard
    icon: 'Leaf',
    gri_reference: 'GRI 305',
    color: 'green'
  },
  'energy': {
    type: 'energy',
    name: 'Energy',
    description: 'Energy consumption, intensity, and renewable energy',
    component: 'EnergyDashboard',
    icon: 'Zap',
    gri_reference: 'GRI 302',
    color: 'yellow'
  },
  'water_management': {
    type: 'water_management',
    name: 'Water & Effluents',
    description: 'Water withdrawal, consumption, discharge, and stress',
    component: 'WaterDashboard',
    icon: 'Droplet',
    gri_reference: 'GRI 303',
    color: 'blue'
  },
  'waste_management': {
    type: 'waste_management',
    name: 'Waste & Circular Economy',
    description: 'Waste diverted from and directed to disposal',
    component: 'WasteDashboard',
    icon: 'Recycle',
    gri_reference: 'GRI 306',
    color: 'green'
  },
  'biodiversity': {
    type: 'biodiversity',
    name: 'Biodiversity',
    description: 'Impacts on ecosystems and protected areas',
    component: 'BiodiversityDashboard',
    icon: 'Trees',
    gri_reference: 'GRI 304',
    color: 'emerald'
  },

  // Oil & Gas Sector (GRI 11)
  'air_quality': {
    type: 'air_quality',
    name: 'Air Quality',
    description: 'NOx, SOx, VOCs, particulate matter, and flaring',
    component: 'AirQualityDashboard',
    icon: 'Wind',
    gri_reference: 'GRI 11.3, GRI 12.3, GRI 14.5',
    color: 'sky'
  },
  'climate_resilience': {
    type: 'climate_resilience',
    name: 'Climate Resilience',
    description: 'Climate adaptation, risk management, and transition planning',
    component: 'ClimateResilienceDashboard',
    icon: 'Shield',
    gri_reference: 'GRI 11.2, GRI 12.2, GRI 13.2',
    color: 'purple'
  },
  'decommissioning': {
    type: 'decommissioning',
    name: 'Decommissioning & Rehabilitation',
    description: 'Asset decommissioning and site restoration',
    component: 'DecommissioningDashboard',
    icon: 'HardHat',
    gri_reference: 'GRI 11.7',
    color: 'orange'
  },
  'asset_integrity': {
    type: 'asset_integrity',
    name: 'Asset Integrity & Safety',
    description: 'Critical incident management and safety systems',
    component: 'AssetIntegrityDashboard',
    icon: 'ShieldCheck',
    gri_reference: 'GRI 11.8',
    color: 'red'
  },

  // Mining Sector (GRI 14)
  'tailings_management': {
    type: 'tailings_management',
    name: 'Tailings Management',
    description: 'CRITICAL: Tailings storage facility safety and monitoring',
    component: 'TailingsManagementDashboard',
    icon: 'AlertTriangle',
    gri_reference: 'GRI 14.1',
    color: 'red'
  },
  'mine_closure': {
    type: 'mine_closure',
    name: 'Mine Closure & Rehabilitation',
    description: 'Closure planning, progressive rehabilitation, and land restoration',
    component: 'MineClosureDashboard',
    icon: 'Landmark',
    gri_reference: 'GRI 12.7, GRI 14.7',
    color: 'brown'
  },
  'artisanal_mining': {
    type: 'artisanal_mining',
    name: 'Artisanal Mining',
    description: 'Engagement with artisanal and small-scale miners',
    component: 'ArtisanalMiningDashboard',
    icon: 'Users',
    gri_reference: 'GRI 12.8, GRI 14.8',
    color: 'amber'
  },

  // Agriculture Sector (GRI 13)
  'soil_health': {
    type: 'soil_health',
    name: 'Soil Health',
    description: 'Soil degradation, erosion, fertility, and organic matter',
    component: 'SoilHealthDashboard',
    icon: 'Layers',
    gri_reference: 'GRI 13.3',
    color: 'brown'
  },
  'land_conversion': {
    type: 'land_conversion',
    name: 'Land Use & Conversion',
    description: 'Deforestation, habitat conversion, and natural ecosystem protection',
    component: 'LandConversionDashboard',
    icon: 'MapPin',
    gri_reference: 'GRI 13.4',
    color: 'green'
  },
  'pesticides_use': {
    type: 'pesticides_use',
    name: 'Pesticides Management',
    description: 'Pesticide application, integrated pest management',
    component: 'PesticidesDashboard',
    icon: 'Spray',
    gri_reference: 'GRI 13.8',
    color: 'yellow'
  },
  'antibiotics_use': {
    type: 'antibiotics_use',
    name: 'Antibiotics Use',
    description: 'Antibiotic use in aquaculture and livestock',
    component: 'AntibioticsDashboard',
    icon: 'Pill',
    gri_reference: 'GRI 13.7',
    color: 'blue'
  },
  'food_waste': {
    type: 'food_waste',
    name: 'Food Loss & Waste',
    description: 'Food waste throughout the value chain',
    component: 'FoodWasteDashboard',
    icon: 'Apple',
    gri_reference: 'GRI 13.9',
    color: 'red'
  }
};

/**
 * Get dashboard configurations for a specific GRI sector
 */
export function getDashboardsForSector(sectorCode: string): DashboardConfig[] {
  const sectorDashboards: Record<string, string[]> = {
    'GRI_11': [ // Oil & Gas
      'ghg_emissions',
      'climate_resilience',
      'air_quality',
      'biodiversity',
      'water_management',
      'waste_management',
      'decommissioning',
      'asset_integrity'
    ],
    'GRI_12': [ // Coal
      'ghg_emissions',
      'climate_resilience',
      'air_quality',
      'water_management',
      'waste_management',
      'biodiversity',
      'mine_closure',
      'artisanal_mining'
    ],
    'GRI_13': [ // Agriculture
      'ghg_emissions',
      'climate_resilience',
      'soil_health',
      'land_conversion',
      'water_management',
      'biodiversity',
      'antibiotics_use',
      'pesticides_use',
      'food_waste'
    ],
    'GRI_14': [ // Mining
      'tailings_management', // CRITICAL - always first
      'water_management',
      'biodiversity',
      'waste_management',
      'air_quality',
      'ghg_emissions',
      'mine_closure',
      'artisanal_mining'
    ]
  };

  const dashboardTypes = sectorDashboards[sectorCode] || [];
  return dashboardTypes.map(type => DASHBOARD_REGISTRY[type]).filter(Boolean);
}

/**
 * Get standard GRI 300 series dashboards (fallback for organizations without sector)
 */
export function getStandardDashboards(): DashboardConfig[] {
  return [
    DASHBOARD_REGISTRY['ghg_emissions'],
    DASHBOARD_REGISTRY['energy'],
    DASHBOARD_REGISTRY['water_management'],
    DASHBOARD_REGISTRY['waste_management']
  ];
}

/**
 * Check if a dashboard component exists (for lazy loading)
 */
export function isDashboardImplemented(dashboardType: string): boolean {
  const implemented = [
    'ghg_emissions',
    'energy',
    'water_management',
    'waste_management'
  ];
  return implemented.includes(dashboardType);
}

/**
 * Get icon component name for a dashboard type
 */
export function getDashboardIcon(dashboardType: string): string {
  return DASHBOARD_REGISTRY[dashboardType]?.icon || 'BarChart3';
}

/**
 * Get color for a dashboard type
 */
export function getDashboardColor(dashboardType: string): string {
  return DASHBOARD_REGISTRY[dashboardType]?.color || 'gray';
}
