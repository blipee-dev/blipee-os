/**
 * Sector-Specific Intensity Metrics
 * Implements SBTi sector-specific pathways and GRI production-based intensity calculations
 */

export interface SectorIntensityBenchmarks {
  low: number;      // Best in class
  average: number;  // Industry average
  high: number;     // Below average
}

export interface SectorIntensityConfig {
  sectorName: string;
  sectorCategory: string;
  griStandard?: string;
  sbtiPathway?: string;
  defaultProductionUnit: string;
  intensityDenominatorOptions: string[];
  benchmarks: {
    production: SectorIntensityBenchmarks;    // Production-based (tCO2e per production unit)
    perEmployee?: SectorIntensityBenchmarks;  // tCO2e/FTE
    perRevenue?: SectorIntensityBenchmarks;   // tCO2e/M€ revenue
    perArea?: SectorIntensityBenchmarks;      // kgCO2e/m²
    perValueAdded?: SectorIntensityBenchmarks; // tCO2e/M€ value added (GEVA)
  };
}

/**
 * Map of industry sectors to their intensity configurations
 * Aligned with GRI 11-17 sector standards and SBTi sector pathways
 */
export const SECTOR_INTENSITY_CONFIG: Record<string, SectorIntensityConfig> = {
  // Energy Sectors (GRI 11-12)
  'Oil and Gas': {
    sectorName: 'Oil and Gas',
    sectorCategory: 'energy',
    griStandard: 'GRI 11',
    sbtiPathway: 'SDA Oil & Gas',
    defaultProductionUnit: 'boe',
    intensityDenominatorOptions: ['boe', 'MWh', 'ton'],
    benchmarks: {
      production: { low: 15.0, average: 25.0, high: 40.0 },
      perEmployee: { low: 150.0, average: 350.0, high: 600.0 },
      perRevenue: { low: 150.0, average: 300.0, high: 500.0 },
      perArea: { low: 200.0, average: 450.0, high: 800.0 }
    }
  },
  'Coal': {
    sectorName: 'Coal',
    sectorCategory: 'energy',
    griStandard: 'GRI 12',
    sbtiPathway: 'SDA Coal',
    defaultProductionUnit: 'ton',
    intensityDenominatorOptions: ['ton', 'MWh'],
    benchmarks: {
      production: { low: 80.0, average: 120.0, high: 180.0 }
    }
  },
  'Electric Utilities': {
    sectorName: 'Electric Utilities',
    sectorCategory: 'energy',
    sbtiPathway: 'SDA Power',
    defaultProductionUnit: 'MWh',
    intensityDenominatorOptions: ['MWh'],
    benchmarks: {
      production: { low: 0.2, average: 0.5, high: 0.8 }
    }
  },
  'Renewable Energy': {
    sectorName: 'Renewable Energy',
    sectorCategory: 'energy',
    sbtiPathway: 'SDA Power',
    defaultProductionUnit: 'MWh',
    intensityDenominatorOptions: ['MWh'],
    benchmarks: {
      production: { low: 0.01, average: 0.02, high: 0.05 }
    }
  },

  // Agriculture (GRI 13)
  'Agriculture': {
    sectorName: 'Agriculture',
    sectorCategory: 'agriculture',
    griStandard: 'GRI 13',
    sbtiPathway: 'SDA Agriculture',
    defaultProductionUnit: 'ton',
    intensityDenominatorOptions: ['ton', 'hectare'],
    benchmarks: {
      production: { low: 0.5, average: 1.2, high: 2.5 }
    }
  },
  'Aquaculture': {
    sectorName: 'Aquaculture',
    sectorCategory: 'agriculture',
    griStandard: 'GRI 13',
    defaultProductionUnit: 'ton',
    intensityDenominatorOptions: ['ton'],
    benchmarks: {
      production: { low: 1.0, average: 2.5, high: 4.0 }
    }
  },

  // Mining (GRI 14)
  'Mining': {
    sectorName: 'Mining',
    sectorCategory: 'manufacturing',
    griStandard: 'GRI 14',
    defaultProductionUnit: 'ton',
    intensityDenominatorOptions: ['ton', 'tonne-ore'],
    benchmarks: {
      production: { low: 5.0, average: 12.0, high: 25.0 }
    }
  },

  // Manufacturing Sectors
  'Food and Beverage': {
    sectorName: 'Food and Beverage',
    sectorCategory: 'manufacturing',
    defaultProductionUnit: 'ton',
    intensityDenominatorOptions: ['ton', 'liter', 'unit'],
    benchmarks: {
      production: { low: 0.3, average: 0.8, high: 1.5 }
    }
  },
  'Chemicals': {
    sectorName: 'Chemicals',
    sectorCategory: 'manufacturing',
    sbtiPathway: 'SDA Chemicals',
    defaultProductionUnit: 'ton',
    intensityDenominatorOptions: ['ton'],
    benchmarks: {
      production: { low: 1.5, average: 3.5, high: 7.0 }
    }
  },
  'Steel': {
    sectorName: 'Steel',
    sectorCategory: 'manufacturing',
    sbtiPathway: 'SDA Steel',
    defaultProductionUnit: 'ton',
    intensityDenominatorOptions: ['ton'],
    benchmarks: {
      production: { low: 1.4, average: 1.9, high: 2.5 }
    }
  },
  'Cement': {
    sectorName: 'Cement',
    sectorCategory: 'manufacturing',
    sbtiPathway: 'SDA Cement',
    defaultProductionUnit: 'ton',
    intensityDenominatorOptions: ['ton'],
    benchmarks: {
      production: { low: 0.5, average: 0.7, high: 0.9 }
    }
  },
  'Aluminum': {
    sectorName: 'Aluminum',
    sectorCategory: 'manufacturing',
    sbtiPathway: 'SDA Aluminum',
    defaultProductionUnit: 'ton',
    intensityDenominatorOptions: ['ton'],
    benchmarks: {
      production: { low: 6.0, average: 12.0, high: 18.0 }
    }
  },
  'Automotive': {
    sectorName: 'Automotive',
    sectorCategory: 'manufacturing',
    defaultProductionUnit: 'vehicle',
    intensityDenominatorOptions: ['vehicle', 'ton'],
    benchmarks: {
      production: { low: 1.5, average: 3.0, high: 5.0 }
    }
  },

  // Transportation
  'Airlines': {
    sectorName: 'Airlines',
    sectorCategory: 'transportation',
    sbtiPathway: 'SDA Aviation',
    defaultProductionUnit: 'passenger-km',
    intensityDenominatorOptions: ['passenger-km', 'ton-km', 'RTK'],
    benchmarks: {
      production: { low: 0.08, average: 0.12, high: 0.18 }
    }
  },
  'Maritime Shipping': {
    sectorName: 'Maritime Shipping',
    sectorCategory: 'transportation',
    sbtiPathway: 'SDA Shipping',
    defaultProductionUnit: 'ton-km',
    intensityDenominatorOptions: ['ton-km', 'TEU-km'],
    benchmarks: {
      production: { low: 0.01, average: 0.02, high: 0.04 }
    }
  },
  'Road Freight': {
    sectorName: 'Road Freight',
    sectorCategory: 'transportation',
    sbtiPathway: 'SDA Transport',
    defaultProductionUnit: 'ton-km',
    intensityDenominatorOptions: ['ton-km', 'vehicle-km'],
    benchmarks: {
      production: { low: 0.05, average: 0.10, high: 0.20 }
    }
  },

  // Buildings & Real Estate
  'Commercial Real Estate': {
    sectorName: 'Commercial Real Estate',
    sectorCategory: 'buildings',
    sbtiPathway: 'SDA Buildings',
    defaultProductionUnit: 'm2',
    intensityDenominatorOptions: ['m2', 'building'],
    benchmarks: {
      production: { low: 30.0, average: 60.0, high: 100.0 }
    }
  },
  'Hotels and Hospitality': {
    sectorName: 'Hotels and Hospitality',
    sectorCategory: 'services',
    defaultProductionUnit: 'room-night',
    intensityDenominatorOptions: ['room-night', 'm2'],
    benchmarks: {
      production: { low: 15.0, average: 30.0, high: 50.0 }
    }
  },

  // Services
  'Financial Services': {
    sectorName: 'Financial Services',
    sectorCategory: 'services',
    defaultProductionUnit: 'FTE',
    intensityDenominatorOptions: ['FTE', 'revenue'],
    benchmarks: {
      production: { low: 2.0, average: 5.0, high: 10.0 }
    }
  },
  'Technology and Software': {
    sectorName: 'Technology and Software',
    sectorCategory: 'services',
    defaultProductionUnit: 'FTE',
    intensityDenominatorOptions: ['FTE', 'revenue', 'user'],
    benchmarks: {
      production: { low: 1.0, average: 3.0, high: 6.0 }
    }
  },
  'Healthcare': {
    sectorName: 'Healthcare',
    sectorCategory: 'services',
    defaultProductionUnit: 'bed',
    intensityDenominatorOptions: ['bed', 'patient', 'm2'],
    benchmarks: {
      production: { low: 3.0, average: 8.0, high: 15.0 }
    }
  },
  'Retail': {
    sectorName: 'Retail',
    sectorCategory: 'services',
    defaultProductionUnit: 'm2',
    intensityDenominatorOptions: ['m2', 'revenue'],
    benchmarks: {
      production: { low: 40.0, average: 80.0, high: 150.0 }
    }
  },
  'Professional Services': {
    sectorName: 'Professional Services',
    sectorCategory: 'services',
    defaultProductionUnit: 'FTE',
    intensityDenominatorOptions: ['FTE', 'revenue'],
    benchmarks: {
      production: { low: 1.5, average: 4.0, high: 8.0 },      // tCO2e/FTE
      perEmployee: { low: 1.5, average: 4.0, high: 8.0 },     // tCO2e/FTE (same as production for services)
      perRevenue: { low: 8.0, average: 18.0, high: 35.0 },    // tCO2e/M€ revenue (office-based services)
      perArea: { low: 20.0, average: 35.0, high: 60.0 },      // kgCO2e/m² (office buildings)
      perValueAdded: { low: 12.0, average: 28.0, high: 50.0 } // tCO2e/M€ value added (GEVA for services)
    }
  }
};

/**
 * Get production unit label for display
 */
export function getProductionUnitLabel(unit: string): string {
  const labels: Record<string, string> = {
    'boe': 'barrels of oil equivalent',
    'MWh': 'megawatt-hours',
    'ton': 'tonnes',
    'tonne-ore': 'tonnes of ore',
    'hectare': 'hectares',
    'liter': 'liters',
    'unit': 'units',
    'vehicle': 'vehicles',
    'passenger-km': 'passenger-kilometers',
    'ton-km': 'tonne-kilometers',
    'RTK': 'revenue tonne-kilometers',
    'TEU-km': 'TEU-kilometers',
    'vehicle-km': 'vehicle-kilometers',
    'm2': 'square meters',
    'building': 'buildings',
    'room-night': 'room-nights',
    'FTE': 'full-time employees',
    'revenue': 'million € revenue',
    'user': 'active users',
    'bed': 'hospital beds',
    'patient': 'patients',
    'subscriber': 'subscribers',
    'data-TB': 'terabytes of data'
  };
  return labels[unit] || unit;
}

/**
 * Calculate sector-specific physical intensity
 */
export function calculateSectorIntensity(
  totalEmissions: number, // in tCO2e
  productionVolume: number,
  productionUnit: string,
  sectorName?: string
): {
  intensity: number;
  unit: string;
  benchmark?: 'excellent' | 'good' | 'average' | 'poor';
  benchmarkValue?: number;
} {
  if (!productionVolume || productionVolume <= 0) {
    return { intensity: 0, unit: `tCO2e/${productionUnit}` };
  }

  const intensity = totalEmissions / productionVolume;

  // Get benchmark if sector is known
  let benchmark: 'excellent' | 'good' | 'average' | 'poor' | undefined;
  let benchmarkValue: number | undefined;

  if (sectorName && SECTOR_INTENSITY_CONFIG[sectorName]) {
    const config = SECTOR_INTENSITY_CONFIG[sectorName];
    const productionBenchmarks = config.benchmarks.production;
    benchmarkValue = productionBenchmarks.average;

    if (intensity <= productionBenchmarks.low) {
      benchmark = 'excellent';
    } else if (intensity <= productionBenchmarks.average) {
      benchmark = 'good';
    } else if (intensity <= productionBenchmarks.high) {
      benchmark = 'average';
    } else {
      benchmark = 'poor';
    }
  }

  return {
    intensity,
    unit: `tCO2e/${productionUnit}`,
    benchmark,
    benchmarkValue
  };
}

/**
 * Get available intensity denominators for a sector
 */
export function getAvailableDenominators(sectorName: string): string[] {
  const config = SECTOR_INTENSITY_CONFIG[sectorName];
  if (!config) {
    return ['FTE', 'revenue', 'm2']; // Default fallback
  }
  return config.intensityDenominatorOptions;
}

/**
 * Calculate benchmark for any intensity metric type
 */
export function calculateBenchmarkForMetric(
  value: number,
  sectorName: string,
  metricType: 'perEmployee' | 'perRevenue' | 'perArea' | 'perValueAdded'
): {
  benchmark?: 'excellent' | 'good' | 'average' | 'poor';
  benchmarkValue?: number;
} {
  if (!SECTOR_INTENSITY_CONFIG[sectorName]) {
    return {};
  }

  const config = SECTOR_INTENSITY_CONFIG[sectorName];
  const benchmarks = config.benchmarks[metricType];

  if (!benchmarks) {
    return {};
  }

  let benchmark: 'excellent' | 'good' | 'average' | 'poor';

  if (value <= benchmarks.low) {
    benchmark = 'excellent';
  } else if (value <= benchmarks.average) {
    benchmark = 'good';
  } else if (value <= benchmarks.high) {
    benchmark = 'average';
  } else {
    benchmark = 'poor';
  }

  return {
    benchmark,
    benchmarkValue: benchmarks.average
  };
}

/**
 * Get SBTi pathway for a sector
 */
export function getSBTiPathway(sectorName: string): string | null {
  const config = SECTOR_INTENSITY_CONFIG[sectorName];
  return config?.sbtiPathway || null;
}

/**
 * Get GRI sector standard for a sector
 */
export function getGRISectorStandard(sectorName: string): string | null {
  const config = SECTOR_INTENSITY_CONFIG[sectorName];
  return config?.griStandard || null;
}
