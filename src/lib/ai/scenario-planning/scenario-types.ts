/**
 * ESG Scenario Planning Types
 * Comprehensive type definitions for scenario modeling
 */

export interface BaseScenarioInput {
  organizationId: string;
  timeHorizon: number; // years
  baselineYear: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY';
  organizationData: {
    industry: string;
    size: 'small' | 'medium' | 'large' | 'enterprise';
    locations: Array<{
      country: string;
      region: string;
      facilities: number;
      employees: number;
    }>;
    currentEmissions: {
      scope1: { value: number; unit: 'tCO2e' };
      scope2: { value: number; unit: 'tCO2e' };
      scope3: { value: number; unit: 'tCO2e' };
      intensity: { value: number; unit: 'tCO2e/revenue' | 'tCO2e/employee' };
    };
    currentEnergy: {
      total: { value: number; unit: 'MWh' };
      renewable: { percentage: number };
      sources: Array<{
        type: 'grid' | 'solar' | 'wind' | 'hydro' | 'biomass' | 'gas' | 'oil' | 'coal';
        percentage: number;
        cost: number; // per MWh
      }>;
    };
    operations: {
      revenue: number;
      capex: number;
      opex: number;
      facilities: number;
      employees: number;
      vehicles: number;
      wasteGeneration: number; // tonnes/year
    };
  };
}

export interface ScenarioTargets {
  emissionTargets: {
    scope1: { reduction: number; targetYear: number }; // percentage reduction
    scope2: { reduction: number; targetYear: number };
    scope3: { reduction: number; targetYear: number };
    netZero: { targetYear: number; approach: 'full_reduction' | 'offsets_allowed' };
    science_based: {
      aligned: boolean;
      temperature: 1.5 | 2.0;
      pathway: 'absolute' | 'intensity';
    };
  };
  renewableTargets: {
    electricity: { percentage: number; targetYear: number };
    heat: { percentage: number; targetYear: number };
  };
  circularityTargets: {
    wasteReduction: { percentage: number; targetYear: number };
    recycling: { percentage: number; targetYear: number };
    materialEfficiency: { percentage: number; targetYear: number };
  };
  complianceTargets: {
    frameworks: Array<'TCFD' | 'CSRD' | 'SEC' | 'GRI' | 'SASB' | 'CDP'>;
    certifications: Array<'B_Corp' | 'ISO_14001' | 'LEED' | 'Energy_Star'>;
    ratings: Array<{
      provider: 'MSCI' | 'Sustainalytics' | 'CDP' | 'EcoVadis';
      target: string; // e.g., 'A' for CDP
      deadline: Date;
    }>;
  };
}

export interface Intervention {
  id: string;
  name: string;
  description: string;
  category: 'energy' | 'transport' | 'buildings' | 'operations' | 'supply_chain' | 'offsets';
  type: 'energy_efficiency' | 'renewable_energy' | 'electrification' | 'process_optimization' | 
        'building_upgrade' | 'transport_optimization' | 'supply_chain_engagement' | 
        'carbon_removal' | 'nature_based_solutions';
  
  financials: {
    capex: number;
    opex: number; // annual
    savings: number; // annual
    paybackPeriod: number; // years
    npv: number; // net present value
    irr: number; // internal rate of return %
  };
  
  impact: {
    scope1Reduction: number; // tCO2e/year
    scope2Reduction: number;
    scope3Reduction: number;
    energySavings: number; // MWh/year
    wastereduction: number; // tonnes/year
    waterSavings: number; // m3/year
    cobenefits: Array<{
      type: 'air_quality' | 'biodiversity' | 'jobs' | 'health' | 'community';
      description: string;
      quantification?: number;
    }>;
  };
  
  implementation: {
    duration: number; // months
    phases: Array<{
      name: string;
      duration: number; // months
      milestones: string[];
      dependencies: string[];
    }>;
    prerequisites: string[];
    risks: Array<{
      type: 'technical' | 'financial' | 'regulatory' | 'market' | 'operational';
      description: string;
      probability: number; // 0-1
      impact: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
    skillsRequired: string[];
    resourceRequirements: {
      internalFTE: number;
      externalConsultants: number;
      specializedEquipment: string[];
    };
  };
  
  performance: {
    technologyMaturity: 1 | 2 | 3 | 4 | 5; // 1=R&D, 5=Commercial
    scalability: 'pilot' | 'limited' | 'full_scale';
    replicability: number; // 0-1 score
    monitoringComplexity: 'low' | 'medium' | 'high';
    dataRequirements: string[];
  };
  
  external: {
    vendorDependent: boolean;
    regulatoryApprovalRequired: boolean;
    incentivesAvailable: Array<{
      type: 'tax_credit' | 'grant' | 'rebate' | 'loan';
      amount: number;
      jurisdiction: string;
      deadline?: Date;
    }>;
    marketAvailability: 'immediate' | 'limited' | 'future';
  };
}

export interface ScenarioAssumptions {
  economic: {
    discountRate: number; // %
    inflationRate: number; // %
    gdpGrowthRate: number; // %
    exchangeRates: Record<string, number>; // relative to base currency
  };
  
  energy: {
    electricityPriceGrowth: number; // % annual
    gasPriceGrowth: number;
    oilPriceGrowth: number;
    renewableCostDecline: number; // % annual
    gridEmissionFactorChange: number; // % annual improvement
    energyDemandGrowth: number; // % annual
  };
  
  carbon: {
    carbonPriceGrowth: number; // % annual
    carbonPriceVolatility: number; // standard deviation
    offsetPriceGrowth: number; // % annual
    offsetQualityImprovement: number; // % annual
    regulatoryStringency: 'low' | 'medium' | 'high';
  };
  
  technology: {
    innovationRate: number; // % annual cost decline
    adoptionRate: number; // S-curve parameter
    learningCurveEffect: number; // cost reduction per doubling of deployment
    digitalizationImpact: number; // efficiency gain from digital tools
  };
  
  regulatory: {
    carbonTaxIncrease: number; // % annual
    renewableStandards: Array<{
      jurisdiction: string;
      target: number; // %
      deadline: number; // year
    }>;
    emissionStandards: Array<{
      sector: string;
      reduction: number; // %
      deadline: number; // year
    }>;
    reportingRequirements: Array<{
      framework: string;
      mandatory: boolean;
      deadline: number; // year
    }>;
  };
  
  physical: {
    temperatureIncrease: number; // degrees C
    precipitationChange: number; // %
    extremeWeatherFrequency: number; // multiplier
    seaLevelRise: number; // cm
    ecosystemDegradation: number; // index 0-1
  };
  
  social: {
    employeeEngagement: number; // index 0-1
    customerDemand: number; // multiplier for green products
    investorFocus: number; // ESG weight in investment decisions
    supplierCapability: number; // supplier ESG maturity index
    communitySupport: number; // social license index
  };
}

export interface ScenarioOutcomeDetailed {
  scenarioId: string;
  scenarioName: string;
  probability: number;
  confidence: number; // model confidence 0-1
  
  timeline: Array<{
    year: number;
    date: Date;
    
    emissions: {
      scope1: { absolute: number; intensity: number; reduction: number };
      scope2: { absolute: number; intensity: number; reduction: number };
      scope3: { absolute: number; intensity: number; reduction: number };
      total: { absolute: number; intensity: number; reduction: number };
      avoided: number; // tCO2e avoided through interventions
      residual: number; // tCO2e requiring offsets
    };
    
    energy: {
      total: number; // MWh
      renewable: { absolute: number; percentage: number };
      efficiency: { improvement: number; savings: number };
      sources: Array<{
        type: string;
        amount: number; // MWh
        cost: number; // total cost
        emissions: number; // tCO2e
      }>;
    };
    
    costs: {
      capital: number;
      operational: number;
      carbon: { compliance: number; voluntary: number };
      energy: number;
      maintenance: number;
      financing: number;
      avoided: number; // costs avoided through interventions
    };
    
    savings: {
      energy: number;
      operational: number;
      carbon: number;
      regulatory: number; // avoided penalties
      other: number;
    };
    
    metrics: {
      roi: number; // %
      paybackPeriod: number; // years
      npv: number;
      irr: number; // %
      carbonIntensity: number; // tCO2e/revenue
      energyIntensity: number; // MWh/revenue
      costOfAbatement: number; // $/tCO2e
    };
    
    compliance: {
      targets: Array<{
        framework: string;
        requirement: string;
        status: 'achieved' | 'on_track' | 'at_risk' | 'missed';
        gap: number;
      }>;
      penalties: number;
      certificationStatus: Record<string, boolean>;
      ratingScores: Record<string, string>;
    };
    
    risks: {
      physical: Array<{
        type: string;
        probability: number;
        impact: number; // financial
        description: string;
      }>;
      transition: Array<{
        type: string;
        probability: number;
        impact: number;
        description: string;
      }>;
      regulatory: Array<{
        type: string;
        probability: number;
        impact: number;
        description: string;
      }>;
    };
  }>;
  
  keyMilestones: Array<{
    year: number;
    date: Date;
    type: 'emission_target' | 'financial_milestone' | 'technology_deployment' | 'compliance_deadline';
    description: string;
    status: 'achieved' | 'on_track' | 'at_risk' | 'missed';
    impact: string;
    confidence: number;
  }>;
  
  interventionResults: Array<{
    intervention: Intervention;
    deploymentYear: number;
    actualPerformance: {
      capex: number;
      opex: number;
      emissionReduction: number;
      energySavings: number;
      roi: number;
    };
    successFactors: string[];
    lessonsLearned: string[];
  }>;
  
  sensitivity: {
    keyDrivers: Array<{
      variable: string;
      elasticity: number; // % change in outcome / % change in variable
      impact: 'critical' | 'high' | 'medium' | 'low';
      direction: 'positive' | 'negative';
    }>;
    breakpoints: Array<{
      variable: string;
      threshold: number;
      consequence: string;
    }>;
  };
}

export interface ScenarioComparisonDetailed {
  scenarios: ScenarioOutcomeDetailed[];
  comparison: {
    emissionReduction: {
      range: { min: number; max: number; mean: number; std: number };
      probabilityDistribution: Array<{ value: number; probability: number }>;
      targets: Array<{
        target: number;
        achievementProbability: number;
        scenarios: string[];
      }>;
    };
    
    financialOutcome: {
      investment: { range: { min: number; max: number; mean: number; std: number } };
      roi: { range: { min: number; max: number; mean: number; std: number } };
      npv: { range: { min: number; max: number; mean: number; std: number } };
      payback: { range: { min: number; max: number; mean: number; std: number } };
    };
    
    riskProfile: {
      overall: 'low' | 'medium' | 'high';
      categories: Record<string, { score: number; description: string }>;
      topRisks: Array<{
        risk: string;
        scenarios: string[];
        mitigation: string;
      }>;
    };
    
    portfolioOptimization: {
      efficient_frontier: Array<{
        risk: number;
        return: number;
        emissionReduction: number;
        interventions: string[];
      }>;
      recommendedPortfolio: {
        interventions: string[];
        rationale: string;
        riskLevel: string;
        expectedOutcome: any;
      };
    };
  };
  
  insights: {
    keyFindings: string[];
    criticalDecisions: Array<{
      decision: string;
      impact: string;
      deadline: Date;
      options: Array<{
        option: string;
        pros: string[];
        cons: string[];
        cost: number;
      }>;
    }>;
    
    recommendations: Array<{
      priority: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
      category: 'investment' | 'operations' | 'strategy' | 'risk_management';
      action: string;
      rationale: string;
      impact: string;
      resources: string;
    }>;
    
    monitoringPlan: Array<{
      kpi: string;
      target: number;
      frequency: 'real_time' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
      source: string;
      threshold: { warning: number; critical: number };
      escalation: string;
    }>;
  };
}

export interface ScenarioValidation {
  inputValidation: {
    completeness: number; // 0-1 score
    consistency: Array<{
      check: string;
      status: 'pass' | 'warning' | 'fail';
      message: string;
    }>;
    qualityScore: number; // 0-1 score
  };
  
  modelValidation: {
    accuracy: number; // back-testing accuracy
    sensitivity: number; // model sensitivity to input changes
    robustness: number; // performance across scenarios
    calibration: number; // probability calibration
  };
  
  assumptions: {
    credibility: Array<{
      assumption: string;
      source: string;
      confidence: number;
      sensitivity: number;
    }>;
    uncertainties: Array<{
      variable: string;
      range: { min: number; max: number };
      distribution: 'normal' | 'uniform' | 'triangular' | 'beta';
      correlation: Record<string, number>;
    }>;
  };
  
  limitations: {
    scope: string[];
    temporal: string[];
    technical: string[];
    methodological: string[];
  };
  
  updates: {
    dataFreshness: Record<string, Date>;
    modelVersion: string;
    lastCalibration: Date;
    nextReview: Date;
  };
}

// Helper types for API responses
export interface ScenarioRequest {
  inputs: BaseScenarioInput;
  targets: ScenarioTargets;
  interventions: Intervention[];
  assumptions: Partial<ScenarioAssumptions>;
  options: {
    scenarios: Array<'optimistic' | 'pessimistic' | 'base' | 'stress'>;
    monteCarloRuns: number;
    sensitivity: string[];
    optimization: boolean;
    climateStress: boolean;
  };
}

export interface ScenarioResponse {
  requestId: string;
  status: 'completed' | 'processing' | 'error';
  results: ScenarioComparisonDetailed;
  validation: ScenarioValidation;
  metadata: {
    processingTime: number; // seconds
    dataSourcesUsed: string[];
    modelVersion: string;
    timestamp: Date;
  };
}