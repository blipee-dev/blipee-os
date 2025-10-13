/**
 * INITIATIVES LIBRARY
 * Industry-standard reduction initiatives with cost/impact data
 * Based on GHG Protocol, IEA, and industry benchmarks
 */

export interface InitiativeTemplate {
  id: string;
  name: string;
  description: string;
  type: 'energy_efficiency' | 'renewable_energy' | 'fuel_switch' | 'fleet_electrification' |
        'behavioral_change' | 'procurement_policy' | 'supplier_engagement' |
        'process_optimization' | 'carbon_offset' | 'other';

  // Applicable metrics (metric codes from catalog)
  applicableMetrics: string[];

  // Scope coverage
  scopes: ('scope1' | 'scope2' | 'scope3')[];

  // Impact data (percentage reductions or absolute)
  typicalReduction: {
    min: number;  // Minimum reduction percentage
    typical: number;  // Typical reduction percentage
    max: number;  // Maximum reduction percentage
  };

  // Cost data (in EUR per tCO2e reduced)
  costPerTCO2e: {
    min: number;
    typical: number;
    max: number;
  };

  // Implementation timeline
  implementationMonths: {
    min: number;
    typical: number;
    max: number;
  };

  // Financial parameters
  capexMultiplier?: number;  // Multiplier based on facility size
  annualOpexPercentage?: number;  // % of CAPEX
  annualSavingsPercentage?: number;  // % of baseline cost

  // Risk and confidence
  riskLevel: 'low' | 'medium' | 'high';
  confidenceScore: number;  // 0-1

  // Requirements
  requirements?: string[];
  considerations?: string[];

  // Industry applicability
  industries?: string[];  // Empty = all industries
}

export const INITIATIVES_LIBRARY: InitiativeTemplate[] = [
  // ============================================================================
  // ENERGY EFFICIENCY - SCOPE 2
  // ============================================================================
  {
    id: 'led-lighting-upgrade',
    name: 'LED Lighting Retrofit',
    description: 'Replace traditional lighting with LED fixtures across all facilities',
    type: 'energy_efficiency',
    applicableMetrics: ['ELEC_GRID', 'ELEC_RENEWABLE', 'ENERGY_TOTAL'],
    scopes: ['scope2'],
    typicalReduction: { min: 50, typical: 65, max: 75 },
    costPerTCO2e: { min: 15, typical: 30, max: 50 },
    implementationMonths: { min: 2, typical: 6, max: 12 },
    capexMultiplier: 25,  // €25/m² of facility space
    annualOpexPercentage: 2,
    annualSavingsPercentage: 60,
    riskLevel: 'low',
    confidenceScore: 0.9,
    requirements: ['Facility access', 'Electrical infrastructure assessment'],
    considerations: ['Payback typically 2-4 years', 'Minimal disruption']
  },

  {
    id: 'hvac-optimization',
    name: 'HVAC System Optimization',
    description: 'Install smart controls, optimize schedules, and improve efficiency',
    type: 'energy_efficiency',
    applicableMetrics: ['ELEC_GRID', 'ELEC_RENEWABLE', 'ENERGY_TOTAL', 'GAS_NATURAL'],
    scopes: ['scope1', 'scope2'],
    typicalReduction: { min: 15, typical: 25, max: 40 },
    costPerTCO2e: { min: 20, typical: 40, max: 70 },
    implementationMonths: { min: 3, typical: 9, max: 18 },
    capexMultiplier: 50,
    annualOpexPercentage: 5,
    annualSavingsPercentage: 25,
    riskLevel: 'medium',
    confidenceScore: 0.8,
    requirements: ['BMS system', 'Technical expertise'],
    considerations: ['Requires ongoing monitoring', 'Seasonal variation']
  },

  {
    id: 'building-envelope',
    name: 'Building Insulation & Envelope Improvement',
    description: 'Improve insulation, seal air leaks, upgrade windows',
    type: 'energy_efficiency',
    applicableMetrics: ['ELEC_GRID', 'GAS_NATURAL', 'HEATING_OIL', 'ENERGY_TOTAL'],
    scopes: ['scope1', 'scope2'],
    typicalReduction: { min: 20, typical: 30, max: 50 },
    costPerTCO2e: { min: 40, typical: 80, max: 120 },
    implementationMonths: { min: 6, typical: 12, max: 24 },
    capexMultiplier: 150,
    annualOpexPercentage: 1,
    annualSavingsPercentage: 35,
    riskLevel: 'medium',
    confidenceScore: 0.85,
    requirements: ['Building access', 'Structural assessment'],
    considerations: ['Long payback period', 'High upfront cost']
  },

  // ============================================================================
  // RENEWABLE ENERGY - SCOPE 2
  // ============================================================================
  {
    id: 'solar-pv-rooftop',
    name: 'Rooftop Solar PV Installation',
    description: 'Install solar photovoltaic panels on available roof space',
    type: 'renewable_energy',
    applicableMetrics: ['ELEC_GRID', 'ELEC_RENEWABLE'],
    scopes: ['scope2'],
    typicalReduction: { min: 30, typical: 50, max: 80 },
    costPerTCO2e: { min: 25, typical: 50, max: 100 },
    implementationMonths: { min: 6, typical: 12, max: 18 },
    capexMultiplier: 1200,  // €/kWp installed
    annualOpexPercentage: 2,
    annualSavingsPercentage: 70,
    riskLevel: 'low',
    confidenceScore: 0.9,
    requirements: ['Suitable roof space', 'Grid connection', 'Permits'],
    considerations: ['25-year lifespan', 'Incentives may apply', 'Weather dependent']
  },

  {
    id: 'renewable-energy-ppa',
    name: 'Renewable Energy Power Purchase Agreement',
    description: 'Sign long-term PPA for wind or solar energy',
    type: 'renewable_energy',
    applicableMetrics: ['ELEC_GRID', 'ELEC_RENEWABLE'],
    scopes: ['scope2'],
    typicalReduction: { min: 80, typical: 95, max: 100 },
    costPerTCO2e: { min: 10, typical: 25, max: 50 },
    implementationMonths: { min: 3, typical: 6, max: 12 },
    capexMultiplier: 0,  // No CAPEX, operational expense
    annualOpexPercentage: 0,
    annualSavingsPercentage: 0,  // Cost-neutral to slight premium
    riskLevel: 'low',
    confidenceScore: 0.95,
    requirements: ['Legal review', 'Long-term commitment'],
    considerations: ['10-20 year contracts', 'Price hedging']
  },

  // ============================================================================
  // FLEET & TRANSPORTATION - SCOPE 1 & 3
  // ============================================================================
  {
    id: 'fleet-electrification',
    name: 'Electric Vehicle Fleet Transition',
    description: 'Replace fossil fuel vehicles with electric vehicles',
    type: 'fleet_electrification',
    applicableMetrics: ['FLEET_DIESEL', 'FLEET_PETROL', 'TRANSPORT_COMPANY_VEHICLES'],
    scopes: ['scope1', 'scope3'],
    typicalReduction: { min: 60, typical: 75, max: 90 },
    costPerTCO2e: { min: 100, typical: 200, max: 400 },
    implementationMonths: { min: 6, typical: 18, max: 36 },
    capexMultiplier: 35000,  // €/vehicle
    annualOpexPercentage: 10,
    annualSavingsPercentage: 40,  // Fuel savings
    riskLevel: 'medium',
    confidenceScore: 0.75,
    requirements: ['Charging infrastructure', 'Route compatibility'],
    considerations: ['Battery lifecycle', 'Range limitations', 'Resale value']
  },

  {
    id: 'optimized-routing',
    name: 'Fleet Route Optimization Software',
    description: 'AI-powered route optimization to reduce fuel consumption',
    type: 'process_optimization',
    applicableMetrics: ['FLEET_DIESEL', 'FLEET_PETROL', 'TRANSPORT_DELIVERY'],
    scopes: ['scope1', 'scope3'],
    typicalReduction: { min: 10, typical: 20, max: 30 },
    costPerTCO2e: { min: 5, typical: 15, max: 30 },
    implementationMonths: { min: 1, typical: 3, max: 6 },
    capexMultiplier: 5000,  // Software license
    annualOpexPercentage: 20,
    annualSavingsPercentage: 25,
    riskLevel: 'low',
    confidenceScore: 0.85,
    requirements: ['Telematics integration', 'Driver training'],
    considerations: ['Quick payback', 'Requires driver adoption']
  },

  {
    id: 'sustainable-travel-policy',
    name: 'Sustainable Business Travel Policy',
    description: 'Prioritize rail over air, remote meetings, economy class',
    type: 'behavioral_change',
    applicableMetrics: ['TRANSPORT_BUSINESS_TRAVEL_AIR', 'TRANSPORT_BUSINESS_TRAVEL_RAIL'],
    scopes: ['scope3'],
    typicalReduction: { min: 20, typical: 40, max: 60 },
    costPerTCO2e: { min: 0, typical: 5, max: 15 },
    implementationMonths: { min: 1, typical: 3, max: 6 },
    capexMultiplier: 0,
    annualOpexPercentage: 0,
    annualSavingsPercentage: 35,  // Travel cost reduction
    riskLevel: 'low',
    confidenceScore: 0.7,
    requirements: ['Policy enforcement', 'Culture change'],
    considerations: ['Employee acceptance critical', 'COVID shifted baseline']
  },

  // ============================================================================
  // FUEL SWITCHING - SCOPE 1
  // ============================================================================
  {
    id: 'heat-pump-installation',
    name: 'Replace Gas Boilers with Heat Pumps',
    description: 'Install air-source or ground-source heat pumps',
    type: 'fuel_switch',
    applicableMetrics: ['GAS_NATURAL', 'HEATING_OIL', 'HEATING'],
    scopes: ['scope1'],
    typicalReduction: { min: 60, typical: 75, max: 85 },
    costPerTCO2e: { min: 80, typical: 150, max: 250 },
    implementationMonths: { min: 6, typical: 12, max: 18 },
    capexMultiplier: 800,  // €/kW heating capacity
    annualOpexPercentage: 3,
    annualSavingsPercentage: 40,
    riskLevel: 'medium',
    confidenceScore: 0.8,
    requirements: ['Building insulation', 'Electrical capacity', 'Space for equipment'],
    considerations: ['Climate dependent', 'Efficiency improves with insulation']
  },

  {
    id: 'biogas-fuel-switch',
    name: 'Switch to Renewable Biogas',
    description: 'Replace natural gas with certified biogas',
    type: 'fuel_switch',
    applicableMetrics: ['GAS_NATURAL'],
    scopes: ['scope1'],
    typicalReduction: { min: 70, typical: 85, max: 95 },
    costPerTCO2e: { min: 30, typical: 60, max: 100 },
    implementationMonths: { min: 1, typical: 3, max: 6 },
    capexMultiplier: 0,  // Same infrastructure
    annualOpexPercentage: 0,
    annualSavingsPercentage: -20,  // 20% premium cost
    riskLevel: 'low',
    confidenceScore: 0.9,
    requirements: ['Supplier availability', 'Certification tracking'],
    considerations: ['No infrastructure changes', 'Supply chain risk']
  },

  // ============================================================================
  // SUPPLY CHAIN - SCOPE 3
  // ============================================================================
  {
    id: 'supplier-engagement-program',
    name: 'Supplier Carbon Reduction Program',
    description: 'Work with top suppliers to reduce their emissions',
    type: 'supplier_engagement',
    applicableMetrics: ['PURCHASED_GOODS', 'UPSTREAM_TRANSPORT'],
    scopes: ['scope3'],
    typicalReduction: { min: 10, typical: 25, max: 40 },
    costPerTCO2e: { min: 20, typical: 50, max: 100 },
    implementationMonths: { min: 12, typical: 24, max: 36 },
    capexMultiplier: 50000,  // Program setup
    annualOpexPercentage: 20,
    annualSavingsPercentage: 0,
    riskLevel: 'high',
    confidenceScore: 0.6,
    requirements: ['Supplier cooperation', 'Data collection capability'],
    considerations: ['Long timeline', 'Requires supplier buy-in', 'Hard to measure']
  },

  {
    id: 'sustainable-procurement',
    name: 'Sustainable Procurement Policy',
    description: 'Prioritize low-carbon suppliers and materials',
    type: 'procurement_policy',
    applicableMetrics: ['PURCHASED_GOODS', 'CAPITAL_GOODS'],
    scopes: ['scope3'],
    typicalReduction: { min: 15, typical: 30, max: 50 },
    costPerTCO2e: { min: 10, typical: 30, max: 60 },
    implementationMonths: { min: 6, typical: 12, max: 18 },
    capexMultiplier: 25000,  // Policy development and training
    annualOpexPercentage: 10,
    annualSavingsPercentage: -5,  // May cost 5% more
    riskLevel: 'medium',
    confidenceScore: 0.7,
    requirements: ['Procurement team training', 'Supplier carbon data'],
    considerations: ['May increase costs', 'Supplier availability varies']
  },

  // ============================================================================
  // WASTE & WATER - SCOPE 3
  // ============================================================================
  {
    id: 'waste-reduction-program',
    name: 'Waste Reduction & Recycling Program',
    description: 'Increase recycling rates, reduce waste to landfill',
    type: 'process_optimization',
    applicableMetrics: ['WASTE_LANDFILL', 'WASTE_RECYCLED', 'WASTE_TOTAL'],
    scopes: ['scope3'],
    typicalReduction: { min: 30, typical: 50, max: 70 },
    costPerTCO2e: { min: 20, typical: 40, max: 80 },
    implementationMonths: { min: 3, typical: 6, max: 12 },
    capexMultiplier: 10000,  // Bins, signage, training
    annualOpexPercentage: 15,
    annualSavingsPercentage: 25,  // Waste disposal savings
    riskLevel: 'low',
    confidenceScore: 0.8,
    requirements: ['Employee engagement', 'Waste contractor cooperation'],
    considerations: ['Requires behavior change', 'Continuous monitoring needed']
  },

  {
    id: 'water-efficiency',
    name: 'Water Efficiency Upgrades',
    description: 'Low-flow fixtures, leak detection, rainwater harvesting',
    type: 'process_optimization',
    applicableMetrics: ['WATER_MUNICIPAL', 'WATER_TOTAL'],
    scopes: ['scope3'],
    typicalReduction: { min: 20, typical: 35, max: 50 },
    costPerTCO2e: { min: 15, typical: 30, max: 60 },
    implementationMonths: { min: 2, typical: 6, max: 12 },
    capexMultiplier: 8000,
    annualOpexPercentage: 5,
    annualSavingsPercentage: 40,
    riskLevel: 'low',
    confidenceScore: 0.85,
    requirements: ['Plumbing access', 'Water audit'],
    considerations: ['Quick payback', 'Low risk']
  },

  // ============================================================================
  // CARBON OFFSETS - ALL SCOPES
  // ============================================================================
  {
    id: 'carbon-offsets-reforestation',
    name: 'Carbon Offsets - Reforestation Projects',
    description: 'Purchase verified carbon credits from reforestation',
    type: 'carbon_offset',
    applicableMetrics: ['TOTAL_EMISSIONS'],  // Can apply to any
    scopes: ['scope1', 'scope2', 'scope3'],
    typicalReduction: { min: 90, typical: 100, max: 100 },  // Offsets all residual
    costPerTCO2e: { min: 10, typical: 25, max: 50 },
    implementationMonths: { min: 1, typical: 2, max: 3 },
    capexMultiplier: 0,
    annualOpexPercentage: 100,  // Ongoing purchase
    annualSavingsPercentage: 0,
    riskLevel: 'medium',
    confidenceScore: 0.75,
    requirements: ['Budget allocation', 'Due diligence on quality'],
    considerations: ['Should be last resort after reductions', 'Quality varies', 'Permanence risk']
  }
];

/**
 * Get applicable initiatives for a specific metric
 */
export function getInitiativesForMetric(metricCode: string): InitiativeTemplate[] {
  return INITIATIVES_LIBRARY.filter(init =>
    init.applicableMetrics.includes(metricCode) ||
    init.applicableMetrics.includes('TOTAL_EMISSIONS')
  );
}

/**
 * Get initiatives by type
 */
export function getInitiativesByType(type: InitiativeTemplate['type']): InitiativeTemplate[] {
  return INITIATIVES_LIBRARY.filter(init => init.type === type);
}

/**
 * Get initiatives by scope
 */
export function getInitiativesByScope(scope: 'scope1' | 'scope2' | 'scope3'): InitiativeTemplate[] {
  return INITIATIVES_LIBRARY.filter(init => init.scopes.includes(scope));
}

/**
 * Calculate initiative impact
 */
export function calculateInitiativeImpact(
  initiative: InitiativeTemplate,
  baselineEmissions: number,
  facilitySize?: number
): {
  reductionTCO2e: { min: number; typical: number; max: number };
  capex: number;
  annualOpex: number;
  annualSavings: number;
  paybackYears: number;
} {
  const reductionTCO2e = {
    min: baselineEmissions * (initiative.typicalReduction.min / 100),
    typical: baselineEmissions * (initiative.typicalReduction.typical / 100),
    max: baselineEmissions * (initiative.typicalReduction.max / 100)
  };

  const capex = initiative.capexMultiplier
    ? (facilitySize || 1000) * initiative.capexMultiplier
    : 0;

  const annualOpex = capex * (initiative.annualOpexPercentage || 0) / 100;
  const annualSavings = capex * (initiative.annualSavingsPercentage || 0) / 100;

  const netAnnualSavings = annualSavings - annualOpex;
  const paybackYears = netAnnualSavings > 0 ? capex / netAnnualSavings : 999;

  return {
    reductionTCO2e,
    capex,
    annualOpex,
    annualSavings,
    paybackYears
  };
}
