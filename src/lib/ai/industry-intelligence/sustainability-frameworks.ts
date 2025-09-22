/**
 * Comprehensive Sustainability Frameworks Mapper
 * Includes GHG Protocol, LEED, WELL, BREEAM, and other major standards
 */

// ==================== GHG PROTOCOL ====================

export interface GHGProtocolScope {
  scope: 1 | 2 | 3;
  name: string;
  description: string;
  categories: GHGCategory[];
  calculationMethods: string[];
  emissionFactors: Record<string, number>;
}

export interface GHGCategory {
  id: string;
  name: string;
  description: string;
  examples: string[];
  measurementUnit: string;
  reportingGuidance: string;
}

export interface GHGInventory {
  organizationId: string;
  reportingYear: number;
  scope1: GHGScopeData;
  scope2: GHGScopeData;
  scope3: GHGScopeData;
  totalEmissions: number;
  intensity: GHGIntensityMetrics;
  methodology: string;
  verificationStatus: 'unverified' | 'third-party-verified' | 'internally-verified';
}

export interface GHGScopeData {
  total: number;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  byLocation: Record<string, number>;
  dataQuality: 'primary' | 'secondary' | 'estimated';
}

export interface GHGIntensityMetrics {
  perRevenue: number;
  perEmployee: number;
  perSquareMeter: number;
  perUnit: number;
  customMetrics: Record<string, number>;
}

// ==================== LEED ====================

export interface LEEDProject {
  projectId: string;
  projectName: string;
  certificationType: 'BD+C' | 'ID+C' | 'O+M' | 'ND' | 'Homes' | 'Cities';
  version: 'v4' | 'v4.1' | 'v5';
  targetLevel: 'Certified' | 'Silver' | 'Gold' | 'Platinum';
  credits: LEEDCredit[];
  totalPoints: number;
  status: 'registered' | 'under-review' | 'certified';
}

export interface LEEDCredit {
  category: LEEDCategory;
  creditId: string;
  creditName: string;
  pointsPossible: number;
  pointsAchieved: number;
  status: 'not-pursued' | 'pending' | 'achieved' | 'denied';
  documentation: string[];
  prerequisites: boolean;
}

export type LEEDCategory =
  | 'Location and Transportation'
  | 'Sustainable Sites'
  | 'Water Efficiency'
  | 'Energy and Atmosphere'
  | 'Materials and Resources'
  | 'Indoor Environmental Quality'
  | 'Innovation'
  | 'Regional Priority';

export interface LEEDScorecard {
  project: LEEDProject;
  categoryScores: Record<LEEDCategory, number>;
  prerequisites: LEEDPrerequisite[];
  achievedCredits: LEEDCredit[];
  projectedLevel: 'Certified' | 'Silver' | 'Gold' | 'Platinum';
  gapAnalysis: LEEDGapAnalysis;
}

export interface LEEDPrerequisite {
  category: LEEDCategory;
  name: string;
  status: 'met' | 'not-met' | 'pending';
  requirements: string[];
}

export interface LEEDGapAnalysis {
  currentPoints: number;
  targetPoints: number;
  gap: number;
  recommendations: LEEDRecommendation[];
}

export interface LEEDRecommendation {
  creditId: string;
  creditName: string;
  potentialPoints: number;
  effort: 'low' | 'medium' | 'high';
  cost: 'low' | 'medium' | 'high';
  timeline: string;
  rationale: string;
}

// ==================== WELL ====================

export interface WELLProject {
  projectId: string;
  projectName: string;
  version: 'v1' | 'v2' | 'v2-pilot';
  projectType: 'New and Existing Buildings' | 'Core' | 'Community' | 'Portfolio';
  targetLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  concepts: WELLConcept[];
  features: WELLFeature[];
  totalPoints: number;
  status: 'enrolled' | 'documentation-review' | 'performance-verification' | 'certified';
}

export interface WELLConcept {
  name: WELLConceptName;
  description: string;
  features: WELLFeature[];
  pointsAchieved: number;
  maxPoints: number;
}

export type WELLConceptName =
  | 'Air'
  | 'Water'
  | 'Nourishment'
  | 'Light'
  | 'Movement'
  | 'Thermal Comfort'
  | 'Sound'
  | 'Materials'
  | 'Mind'
  | 'Community'
  | 'Innovation';

export interface WELLFeature {
  featureId: string;
  featureName: string;
  concept: WELLConceptName;
  type: 'precondition' | 'optimization';
  parts: WELLFeaturePart[];
  pointValue: number;
  status: 'not-pursued' | 'pending' | 'achieved' | 'alternative-pursued';
  verificationMethod: 'performance-test' | 'spot-check' | 'documentation';
}

export interface WELLFeaturePart {
  partId: string;
  description: string;
  requirements: string[];
  meetsCriteria: boolean;
  evidence: string[];
}

export interface WELLScorecard {
  project: WELLProject;
  conceptScores: Record<WELLConceptName, number>;
  preconditions: WELLFeature[];
  optimizations: WELLFeature[];
  projectedLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  healthMetrics: WELLHealthMetrics;
  recommendations: WELLRecommendation[];
}

export interface WELLHealthMetrics {
  airQuality: number;
  waterQuality: number;
  thermalComfort: number;
  acousticComfort: number;
  lightingQuality: number;
  occupantSatisfaction: number;
}

export interface WELLRecommendation {
  featureId: string;
  concept: WELLConceptName;
  impact: 'high' | 'medium' | 'low';
  implementation: string;
  healthBenefits: string[];
  estimatedCost: string;
}

// ==================== BREEAM ====================

export interface BREEAMAssessment {
  projectId: string;
  projectName: string;
  scheme: 'New Construction' | 'In-Use' | 'Refurbishment' | 'Communities' | 'Infrastructure';
  version: '2014' | '2016' | '2018' | 'SD6078';
  targetRating: BREEAMRating;
  categories: BREEAMCategory[];
  totalScore: number;
  status: 'registered' | 'design-stage' | 'post-construction' | 'certified';
}

export type BREEAMRating = 'Pass' | 'Good' | 'Very Good' | 'Excellent' | 'Outstanding';

export interface BREEAMCategory {
  name: BREEAMCategoryName;
  weight: number;
  availableCredits: number;
  achievedCredits: number;
  score: number;
  weightedScore: number;
  issues: BREEAMIssue[];
}

export type BREEAMCategoryName =
  | 'Management'
  | 'Health and Wellbeing'
  | 'Energy'
  | 'Transport'
  | 'Water'
  | 'Materials'
  | 'Waste'
  | 'Land Use and Ecology'
  | 'Pollution'
  | 'Innovation';

export interface BREEAMIssue {
  issueId: string;
  issueName: string;
  category: BREEAMCategoryName;
  credits: number;
  creditsClaimed: number;
  status: 'not-assessed' | 'pending' | 'achieved' | 'not-achieved';
  evidence: string[];
  exemplaryLevel: boolean;
}

export interface BREEAMScorecard {
  assessment: BREEAMAssessment;
  categoryBreakdown: Record<BREEAMCategoryName, number>;
  minimumStandards: BREEAMMinimumStandard[];
  projectedRating: BREEAMRating;
  improvementPlan: BREEAMImprovement[];
  benchmarks: BREEAMBenchmark;
}

export interface BREEAMMinimumStandard {
  category: BREEAMCategoryName;
  issue: string;
  requiredFor: BREEAMRating[];
  status: 'met' | 'not-met' | 'pending';
}

export interface BREEAMImprovement {
  issueId: string;
  category: BREEAMCategoryName;
  potentialCredits: number;
  currentCredits: number;
  effort: 'low' | 'medium' | 'high';
  priority: 'high' | 'medium' | 'low';
  recommendations: string[];
}

export interface BREEAMBenchmark {
  sectorAverage: number;
  topQuartile: number;
  yourScore: number;
  percentile: number;
}

// ==================== UNIFIED FRAMEWORK MAPPER ====================

export class SustainabilityFrameworksMapper {
  private ghgProtocolScopes: Map<number, GHGProtocolScope>;
  private leedCategories: Map<string, LEEDCategory[]>;
  private wellConcepts: Map<string, WELLConcept>;
  private breeamCategories: Map<string, BREEAMCategory>;

  constructor() {
    this.ghgProtocolScopes = new Map();
    this.leedCategories = new Map();
    this.wellConcepts = new Map();
    this.breeamCategories = new Map();
    this.initializeFrameworks();
  }

  private initializeFrameworks(): void {
    this.initializeGHGProtocol();
    this.initializeLEED();
    this.initializeWELL();
    this.initializeBREEAM();
  }

  private initializeGHGProtocol(): void {
    // Scope 1: Direct Emissions
    this.ghgProtocolScopes.set(1, {
      scope: 1,
      name: 'Direct GHG Emissions',
      description: 'Emissions from sources owned or controlled by the organization',
      categories: [
        {
          id: 'stationary-combustion',
          name: 'Stationary Combustion',
          description: 'Fuel combustion in stationary equipment',
          examples: ['Boilers', 'Furnaces', 'Generators', 'Turbines'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report all fuel combustion from owned/controlled stationary sources'
        },
        {
          id: 'mobile-combustion',
          name: 'Mobile Combustion',
          description: 'Fuel combustion in mobile sources',
          examples: ['Company vehicles', 'Fleet trucks', 'Company aircraft', 'Forklifts'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report all fuel combustion from owned/controlled mobile sources'
        },
        {
          id: 'process-emissions',
          name: 'Process Emissions',
          description: 'Emissions from physical or chemical processes',
          examples: ['Cement production', 'Aluminum smelting', 'Chemical reactions'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report emissions from industrial processes'
        },
        {
          id: 'fugitive-emissions',
          name: 'Fugitive Emissions',
          description: 'Unintentional releases',
          examples: ['Refrigerant leaks', 'Methane leaks', 'SF6 from electrical equipment'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report all fugitive emissions from equipment and processes'
        }
      ],
      calculationMethods: ['Fuel-based', 'Mass balance', 'Continuous emissions monitoring'],
      emissionFactors: {
        'natural-gas': 0.00189, // tCO2e/m3
        'diesel': 2.68, // tCO2e/liter
        'gasoline': 2.31, // tCO2e/liter
        'coal': 2.42, // tCO2e/tonne
        'propane': 1.51 // tCO2e/liter
      }
    });

    // Scope 2: Indirect Emissions from Electricity
    this.ghgProtocolScopes.set(2, {
      scope: 2,
      name: 'Indirect GHG Emissions from Energy',
      description: 'Emissions from purchased electricity, steam, heating & cooling',
      categories: [
        {
          id: 'purchased-electricity',
          name: 'Purchased Electricity',
          description: 'Emissions from electricity consumption',
          examples: ['Grid electricity', 'Renewable energy purchases'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report both location-based and market-based emissions'
        },
        {
          id: 'purchased-steam',
          name: 'Purchased Steam',
          description: 'Emissions from purchased steam',
          examples: ['District heating', 'Industrial steam'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report emissions from all purchased steam'
        },
        {
          id: 'purchased-heating-cooling',
          name: 'Purchased Heating/Cooling',
          description: 'Emissions from purchased heating and cooling',
          examples: ['District cooling', 'Chilled water'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report emissions from purchased thermal energy'
        }
      ],
      calculationMethods: ['Location-based', 'Market-based'],
      emissionFactors: {
        'us-grid-average': 0.000429, // tCO2e/kWh
        'eu-grid-average': 0.000295, // tCO2e/kWh
        'renewable-energy': 0.0, // tCO2e/kWh
        'steam': 0.0686, // tCO2e/GJ
        'chilled-water': 0.0172 // tCO2e/ton-hour
      }
    });

    // Scope 3: Other Indirect Emissions
    this.ghgProtocolScopes.set(3, {
      scope: 3,
      name: 'Other Indirect GHG Emissions',
      description: 'All other indirect emissions in the value chain',
      categories: [
        {
          id: 'purchased-goods-services',
          name: 'Purchased Goods and Services',
          description: 'Upstream emissions from purchased goods and services',
          examples: ['Raw materials', 'Office supplies', 'IT equipment'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Use spend-based or supplier-specific data'
        },
        {
          id: 'capital-goods',
          name: 'Capital Goods',
          description: 'Upstream emissions from capital goods',
          examples: ['Buildings', 'Machinery', 'Equipment', 'Vehicles'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report cradle-to-gate emissions of capital purchases'
        },
        {
          id: 'fuel-energy-activities',
          name: 'Fuel and Energy-Related Activities',
          description: 'Emissions not included in Scope 1 or 2',
          examples: ['Upstream fuel production', 'T&D losses'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report well-to-tank and T&D losses'
        },
        {
          id: 'upstream-transportation',
          name: 'Upstream Transportation',
          description: 'Transportation of purchased goods',
          examples: ['Supplier logistics', 'Inbound shipping'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report emissions from third-party transportation'
        },
        {
          id: 'waste-operations',
          name: 'Waste Generated in Operations',
          description: 'Disposal and treatment of waste',
          examples: ['Landfill', 'Recycling', 'Composting'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report emissions from waste disposal methods'
        },
        {
          id: 'business-travel',
          name: 'Business Travel',
          description: 'Employee business travel',
          examples: ['Air travel', 'Hotels', 'Rental cars'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report emissions from all business travel'
        },
        {
          id: 'employee-commuting',
          name: 'Employee Commuting',
          description: 'Employee travel to/from work',
          examples: ['Personal vehicles', 'Public transit'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Survey employees or use average data'
        },
        {
          id: 'upstream-leased-assets',
          name: 'Upstream Leased Assets',
          description: 'Operation of leased assets',
          examples: ['Leased buildings', 'Leased vehicles'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report if not included in Scope 1 or 2'
        },
        {
          id: 'downstream-transportation',
          name: 'Downstream Transportation',
          description: 'Transportation of sold products',
          examples: ['Product distribution', 'Customer delivery'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report emissions from product distribution'
        },
        {
          id: 'processing-sold-products',
          name: 'Processing of Sold Products',
          description: 'Processing of intermediate products',
          examples: ['Manufacturing by customers'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report downstream processing emissions'
        },
        {
          id: 'use-of-sold-products',
          name: 'Use of Sold Products',
          description: 'End use of sold products',
          examples: ['Product energy consumption', 'Direct use emissions'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report expected lifetime emissions'
        },
        {
          id: 'end-of-life',
          name: 'End-of-Life Treatment',
          description: 'Disposal of sold products',
          examples: ['Product disposal', 'Recycling'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report end-of-life treatment emissions'
        },
        {
          id: 'downstream-leased-assets',
          name: 'Downstream Leased Assets',
          description: 'Operation of assets leased to others',
          examples: ['Leased properties', 'Leased equipment'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report tenant emissions if not in Scope 1 or 2'
        },
        {
          id: 'franchises',
          name: 'Franchises',
          description: 'Operation of franchises',
          examples: ['Franchise locations'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report franchise operation emissions'
        },
        {
          id: 'investments',
          name: 'Investments',
          description: 'Operation of investments',
          examples: ['Equity investments', 'Project finance'],
          measurementUnit: 'tCO2e',
          reportingGuidance: 'Report proportional emissions from investments'
        }
      ],
      calculationMethods: ['Spend-based', 'Average-data', 'Supplier-specific', 'Hybrid'],
      emissionFactors: {
        'air-travel-economy': 0.000090, // tCO2e/passenger-km
        'air-travel-business': 0.000260, // tCO2e/passenger-km
        'hotel-stay': 0.0168, // tCO2e/night
        'waste-landfill': 0.467, // tCO2e/tonne
        'waste-recycling': 0.021, // tCO2e/tonne
        'employee-commute-car': 0.000171 // tCO2e/km
      }
    });
  }

  private initializeLEED(): void {
    // Initialize LEED v4.1 BD+C categories and credits
    this.leedCategories.set('Location and Transportation', []);
    this.leedCategories.set('Sustainable Sites', []);
    this.leedCategories.set('Water Efficiency', []);
    this.leedCategories.set('Energy and Atmosphere', []);
    this.leedCategories.set('Materials and Resources', []);
    this.leedCategories.set('Indoor Environmental Quality', []);
    this.leedCategories.set('Innovation', []);
    this.leedCategories.set('Regional Priority', []);
  }

  private initializeWELL(): void {
    // Initialize WELL v2 concepts
    const concepts: WELLConceptName[] = [
      'Air', 'Water', 'Nourishment', 'Light', 'Movement',
      'Thermal Comfort', 'Sound', 'Materials', 'Mind', 'Community'
    ];

    concepts.forEach(concept => {
      this.wellConcepts.set(concept, {
        name: concept,
        description: `WELL ${concept} concept requirements`,
        features: [],
        pointsAchieved: 0,
        maxPoints: concept === 'Air' || concept === 'Water' ? 12 : 10
      });
    });
  }

  private initializeBREEAM(): void {
    // Initialize BREEAM categories with weights
    const categoryWeights: Record<BREEAMCategoryName, number> = {
      'Management': 12,
      'Health and Wellbeing': 15,
      'Energy': 19,
      'Transport': 8,
      'Water': 6,
      'Materials': 12.5,
      'Waste': 7.5,
      'Land Use and Ecology': 10,
      'Pollution': 10,
      'Innovation': 10
    };

    Object.entries(categoryWeights).forEach(([name, weight]) => {
      this.breeamCategories.set(name, {
        name: name as BREEAMCategoryName,
        weight,
        availableCredits: 10,
        achievedCredits: 0,
        score: 0,
        weightedScore: 0,
        issues: []
      });
    });
  }

  // ==================== GHG PROTOCOL METHODS ====================

  calculateGHGInventory(
    energyData: Record<string, number>,
    activityData: Record<string, number>,
    organizationInfo: any
  ): GHGInventory {
    const scope1 = this.calculateScope1(activityData);
    const scope2 = this.calculateScope2(energyData);
    const scope3 = this.calculateScope3(activityData, organizationInfo);

    const totalEmissions = scope1.total + scope2.total + scope3.total;

    return {
      organizationId: organizationInfo.id || 'org-1',
      reportingYear: new Date().getFullYear(),
      scope1,
      scope2,
      scope3,
      totalEmissions,
      intensity: {
        perRevenue: totalEmissions / (organizationInfo.revenue || 1000000),
        perEmployee: totalEmissions / (organizationInfo.employees || 100),
        perSquareMeter: totalEmissions / (organizationInfo.area || 10000),
        perUnit: totalEmissions / (organizationInfo.production || 1000),
        customMetrics: {}
      },
      methodology: 'GHG Protocol Corporate Standard',
      verificationStatus: 'internally-verified'
    };
  }

  private calculateScope1(activityData: Record<string, number>): GHGScopeData {
    const emissions: Record<string, number> = {};
    const scope1Config = this.ghgProtocolScopes.get(1)!;

    // Calculate emissions for each category
    scope1Config.categories.forEach(category => {
      let categoryEmissions = 0;

      switch (category.id) {
        case 'stationary-combustion':
          categoryEmissions = (activityData['natural-gas'] || 0) * scope1Config.emissionFactors['natural-gas'];
          break;
        case 'mobile-combustion':
          categoryEmissions = (activityData['fleet-diesel'] || 0) * scope1Config.emissionFactors['diesel'] +
                            (activityData['fleet-gasoline'] || 0) * scope1Config.emissionFactors['gasoline'];
          break;
        case 'process-emissions':
          categoryEmissions = activityData['process-emissions'] || 0;
          break;
        case 'fugitive-emissions':
          categoryEmissions = activityData['refrigerant-leakage'] || 0;
          break;
      }

      emissions[category.id] = categoryEmissions;
    });

    const total = Object.values(emissions).reduce((sum, val) => sum + val, 0);

    return {
      total,
      byCategory: emissions,
      bySource: emissions,
      byLocation: { 'main-facility': total },
      dataQuality: 'primary'
    };
  }

  private calculateScope2(energyData: Record<string, number>): GHGScopeData {
    const emissions: Record<string, number> = {};
    const scope2Config = this.ghgProtocolScopes.get(2)!;

    // Location-based calculation
    const electricityConsumption = energyData['electricity'] || 0;
    const gridFactor = scope2Config.emissionFactors['us-grid-average'];
    emissions['purchased-electricity'] = electricityConsumption * gridFactor;

    // Steam/heating/cooling if applicable
    emissions['purchased-steam'] = (energyData['steam'] || 0) * scope2Config.emissionFactors['steam'];
    emissions['purchased-heating-cooling'] = (energyData['cooling'] || 0) * scope2Config.emissionFactors['chilled-water'];

    const total = Object.values(emissions).reduce((sum, val) => sum + val, 0);

    return {
      total,
      byCategory: emissions,
      bySource: emissions,
      byLocation: { 'main-facility': total },
      dataQuality: 'secondary'
    };
  }

  private calculateScope3(activityData: Record<string, number>, organizationInfo: any): GHGScopeData {
    const emissions: Record<string, number> = {};
    const scope3Config = this.ghgProtocolScopes.get(3)!;

    // Calculate major Scope 3 categories
    emissions['business-travel'] =
      (activityData['air-travel-km'] || 0) * scope3Config.emissionFactors['air-travel-economy'] +
      (activityData['hotel-nights'] || 0) * scope3Config.emissionFactors['hotel-stay'];

    emissions['employee-commuting'] =
      (organizationInfo.employees || 100) * 220 * 30 * scope3Config.emissionFactors['employee-commute-car'];

    emissions['waste-operations'] =
      (activityData['waste-landfill'] || 0) * scope3Config.emissionFactors['waste-landfill'] +
      (activityData['waste-recycling'] || 0) * scope3Config.emissionFactors['waste-recycling'];

    emissions['purchased-goods-services'] = organizationInfo.procurement || 0 * 0.0001;

    const total = Object.values(emissions).reduce((sum, val) => sum + val, 0);

    return {
      total,
      byCategory: emissions,
      bySource: emissions,
      byLocation: { 'value-chain': total },
      dataQuality: 'estimated'
    };
  }

  // ==================== LEED METHODS ====================

  assessLEEDProject(
    projectInfo: any,
    sustainabilityData: any
  ): LEEDScorecard {
    const project: LEEDProject = {
      projectId: projectInfo.id || 'leed-1',
      projectName: projectInfo.name || 'Building Project',
      certificationType: 'BD+C',
      version: 'v4.1',
      targetLevel: 'Gold',
      credits: [],
      totalPoints: 0,
      status: 'under-review'
    };

    // Calculate category scores
    const categoryScores: Record<LEEDCategory, number> = {
      'Location and Transportation': this.calculateLEEDLocationScore(projectInfo),
      'Sustainable Sites': this.calculateLEEDSitesScore(sustainabilityData),
      'Water Efficiency': this.calculateLEEDWaterScore(sustainabilityData),
      'Energy and Atmosphere': this.calculateLEEDEnergyScore(sustainabilityData),
      'Materials and Resources': this.calculateLEEDMaterialsScore(sustainabilityData),
      'Indoor Environmental Quality': this.calculateLEEDIndoorScore(sustainabilityData),
      'Innovation': 0,
      'Regional Priority': 0
    };

    const totalPoints = Object.values(categoryScores).reduce((sum, score) => sum + score, 0);
    project.totalPoints = totalPoints;

    // Determine certification level
    let projectedLevel: 'Certified' | 'Silver' | 'Gold' | 'Platinum' = 'Certified';
    if (totalPoints >= 80) projectedLevel = 'Platinum';
    else if (totalPoints >= 60) projectedLevel = 'Gold';
    else if (totalPoints >= 50) projectedLevel = 'Silver';
    else if (totalPoints >= 40) projectedLevel = 'Certified';

    return {
      project,
      categoryScores,
      prerequisites: this.getLEEDPrerequisites(),
      achievedCredits: project.credits.filter(c => c.status === 'achieved'),
      projectedLevel,
      gapAnalysis: {
        currentPoints: totalPoints,
        targetPoints: 60, // Gold target
        gap: Math.max(0, 60 - totalPoints),
        recommendations: this.generateLEEDRecommendations(categoryScores)
      }
    };
  }

  private calculateLEEDLocationScore(projectInfo: any): number {
    let score = 0;
    if (projectInfo.transitAccess) score += 5;
    if (projectInfo.bicycleNetwork) score += 1;
    if (projectInfo.reducedParking) score += 1;
    if (projectInfo.greenVehicles) score += 1;
    return Math.min(score, 16);
  }

  private calculateLEEDSitesScore(data: any): number {
    let score = 0;
    if (data.siteDevelopment) score += 2;
    if (data.rainwaterManagement) score += 3;
    if (data.heatIslandReduction) score += 2;
    if (data.lightPollutionReduction) score += 1;
    return Math.min(score, 10);
  }

  private calculateLEEDWaterScore(data: any): number {
    const waterReduction = data.waterReduction || 0;
    if (waterReduction >= 50) return 11;
    if (waterReduction >= 40) return 8;
    if (waterReduction >= 30) return 6;
    if (waterReduction >= 20) return 4;
    return 2;
  }

  private calculateLEEDEnergyScore(data: any): number {
    const energyReduction = data.energyReduction || 0;
    if (energyReduction >= 50) return 20;
    if (energyReduction >= 40) return 16;
    if (energyReduction >= 30) return 12;
    if (energyReduction >= 20) return 8;
    if (energyReduction >= 10) return 4;
    return 2;
  }

  private calculateLEEDMaterialsScore(data: any): number {
    let score = 0;
    if (data.recycledContent) score += 2;
    if (data.regionalMaterials) score += 2;
    if (data.certifiedWood) score += 1;
    if (data.wasteManagement) score += 2;
    return Math.min(score, 13);
  }

  private calculateLEEDIndoorScore(data: any): number {
    let score = 0;
    if (data.indoorAirQuality) score += 3;
    if (data.lowEmittingMaterials) score += 3;
    if (data.thermalComfort) score += 2;
    if (data.daylighting) score += 3;
    if (data.acousticPerformance) score += 1;
    return Math.min(score, 16);
  }

  private getLEEDPrerequisites(): LEEDPrerequisite[] {
    return [
      {
        category: 'Energy and Atmosphere',
        name: 'Fundamental Commissioning',
        status: 'met',
        requirements: ['Commissioning authority', 'OPR and BOD', 'Commissioning plan']
      },
      {
        category: 'Water Efficiency',
        name: 'Water Use Reduction',
        status: 'met',
        requirements: ['20% reduction from baseline']
      },
      {
        category: 'Indoor Environmental Quality',
        name: 'Minimum IAQ Performance',
        status: 'met',
        requirements: ['Meet ASHRAE 62.1']
      }
    ];
  }

  private generateLEEDRecommendations(scores: Record<LEEDCategory, number>): LEEDRecommendation[] {
    const recommendations: LEEDRecommendation[] = [];

    if (scores['Energy and Atmosphere'] < 15) {
      recommendations.push({
        creditId: 'EA-c2',
        creditName: 'Optimize Energy Performance',
        potentialPoints: 18,
        effort: 'high',
        cost: 'high',
        timeline: '6-12 months',
        rationale: 'Energy optimization provides the most points and long-term savings'
      });
    }

    if (scores['Water Efficiency'] < 8) {
      recommendations.push({
        creditId: 'WE-c2',
        creditName: 'Indoor Water Use Reduction',
        potentialPoints: 6,
        effort: 'medium',
        cost: 'medium',
        timeline: '3-6 months',
        rationale: 'Water efficiency improvements are cost-effective'
      });
    }

    return recommendations;
  }

  // ==================== WELL METHODS ====================

  assessWELLProject(
    projectInfo: any,
    healthData: any
  ): WELLScorecard {
    const project: WELLProject = {
      projectId: projectInfo.id || 'well-1',
      projectName: projectInfo.name || 'Wellness Project',
      version: 'v2',
      projectType: 'New and Existing Buildings',
      targetLevel: 'Gold',
      concepts: [],
      features: [],
      totalPoints: 0,
      status: 'documentation-review'
    };

    // Calculate concept scores
    const conceptScores: Record<WELLConceptName, number> = {
      'Air': this.calculateWELLAirScore(healthData),
      'Water': this.calculateWELLWaterScore(healthData),
      'Nourishment': this.calculateWELLNourishmentScore(healthData),
      'Light': this.calculateWELLLightScore(healthData),
      'Movement': this.calculateWELLMovementScore(healthData),
      'Thermal Comfort': this.calculateWELLThermalScore(healthData),
      'Sound': this.calculateWELLSoundScore(healthData),
      'Materials': this.calculateWELLMaterialsScore(healthData),
      'Mind': this.calculateWELLMindScore(healthData),
      'Community': this.calculateWELLCommunityScore(healthData),
      'Innovation': 0
    };

    const totalPoints = Object.values(conceptScores).reduce((sum, score) => sum + score, 0);
    project.totalPoints = totalPoints;

    // Determine certification level
    let projectedLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' = 'Bronze';
    if (totalPoints >= 80) projectedLevel = 'Platinum';
    else if (totalPoints >= 60) projectedLevel = 'Gold';
    else if (totalPoints >= 50) projectedLevel = 'Silver';
    else if (totalPoints >= 40) projectedLevel = 'Bronze';

    const healthMetrics: WELLHealthMetrics = {
      airQuality: healthData.airQuality || 75,
      waterQuality: healthData.waterQuality || 80,
      thermalComfort: healthData.thermalComfort || 70,
      acousticComfort: healthData.acousticComfort || 65,
      lightingQuality: healthData.lightingQuality || 75,
      occupantSatisfaction: healthData.satisfaction || 72
    };

    return {
      project,
      conceptScores,
      preconditions: [],
      optimizations: [],
      projectedLevel,
      healthMetrics,
      recommendations: this.generateWELLRecommendations(conceptScores, healthMetrics)
    };
  }

  private calculateWELLAirScore(data: any): number {
    let score = 0;
    if (data.ventilation) score += 3;
    if (data.filtration) score += 2;
    if (data.airQualityMonitoring) score += 2;
    if (data.pollutantControl) score += 2;
    return Math.min(score, 12);
  }

  private calculateWELLWaterScore(data: any): number {
    let score = 0;
    if (data.waterQualityTesting) score += 3;
    if (data.waterFiltration) score += 2;
    if (data.drinkingWaterPromotion) score += 2;
    return Math.min(score, 12);
  }

  private calculateWELLNourishmentScore(data: any): number {
    let score = 0;
    if (data.healthyFoodOptions) score += 2;
    if (data.nutritionEducation) score += 1;
    if (data.foodProduction) score += 1;
    return Math.min(score, 10);
  }

  private calculateWELLLightScore(data: any): number {
    let score = 0;
    if (data.daylightAccess) score += 3;
    if (data.circadianLighting) score += 2;
    if (data.glareControl) score += 1;
    return Math.min(score, 10);
  }

  private calculateWELLMovementScore(data: any): number {
    let score = 0;
    if (data.activeDesign) score += 2;
    if (data.fitnessPrograms) score += 2;
    if (data.activeFurnishings) score += 1;
    return Math.min(score, 10);
  }

  private calculateWELLThermalScore(data: any): number {
    let score = 0;
    if (data.thermalZoning) score += 2;
    if (data.humidityControl) score += 1;
    if (data.radiantComfort) score += 1;
    return Math.min(score, 10);
  }

  private calculateWELLSoundScore(data: any): number {
    let score = 0;
    if (data.acousticPlanning) score += 2;
    if (data.soundMasking) score += 1;
    if (data.soundZones) score += 1;
    return Math.min(score, 10);
  }

  private calculateWELLMaterialsScore(data: any): number {
    let score = 0;
    if (data.materialRestrictions) score += 2;
    if (data.materialTransparency) score += 1;
    if (data.cleaningProducts) score += 1;
    return Math.min(score, 10);
  }

  private calculateWELLMindScore(data: any): number {
    let score = 0;
    if (data.mentalHealthSupport) score += 2;
    if (data.stressManagement) score += 2;
    if (data.restorativeSpaces) score += 1;
    return Math.min(score, 10);
  }

  private calculateWELLCommunityScore(data: any): number {
    let score = 0;
    if (data.communityAccess) score += 2;
    if (data.inclusiveDesign) score += 2;
    if (data.emergencyPreparedness) score += 1;
    return Math.min(score, 10);
  }

  private generateWELLRecommendations(
    scores: Record<WELLConceptName, number>,
    metrics: WELLHealthMetrics
  ): WELLRecommendation[] {
    const recommendations: WELLRecommendation[] = [];

    if (scores['Air'] < 8) {
      recommendations.push({
        featureId: 'A01',
        concept: 'Air',
        impact: 'high',
        implementation: 'Enhance ventilation and install air quality monitors',
        healthBenefits: ['Reduced respiratory issues', 'Improved cognitive function'],
        estimatedCost: '$50,000-100,000'
      });
    }

    if (metrics.occupantSatisfaction < 70) {
      recommendations.push({
        featureId: 'M02',
        concept: 'Mind',
        impact: 'high',
        implementation: 'Implement wellness programs and mental health support',
        healthBenefits: ['Reduced stress', 'Improved productivity'],
        estimatedCost: '$20,000-40,000'
      });
    }

    return recommendations;
  }

  // ==================== BREEAM METHODS ====================

  assessBREEAMProject(
    projectInfo: any,
    performanceData: any
  ): BREEAMScorecard {
    const assessment: BREEAMAssessment = {
      projectId: projectInfo.id || 'breeam-1',
      projectName: projectInfo.name || 'Sustainable Building',
      scheme: 'New Construction',
      version: '2018',
      targetRating: 'Excellent',
      categories: [],
      totalScore: 0,
      status: 'design-stage'
    };

    // Calculate category scores
    const categoryBreakdown: Record<BREEAMCategoryName, number> = {
      'Management': this.calculateBREEAMManagementScore(performanceData),
      'Health and Wellbeing': this.calculateBREEAMHealthScore(performanceData),
      'Energy': this.calculateBREEAMEnergyScore(performanceData),
      'Transport': this.calculateBREEAMTransportScore(performanceData),
      'Water': this.calculateBREEAMWaterScore(performanceData),
      'Materials': this.calculateBREEAMMaterialsScore(performanceData),
      'Waste': this.calculateBREEAMWasteScore(performanceData),
      'Land Use and Ecology': this.calculateBREEAMLandScore(performanceData),
      'Pollution': this.calculateBREEAMPollutionScore(performanceData),
      'Innovation': 0
    };

    // Calculate weighted score
    let totalWeightedScore = 0;
    Object.entries(categoryBreakdown).forEach(([category, score]) => {
      const categoryData = this.breeamCategories.get(category);
      if (categoryData) {
        totalWeightedScore += (score / 100) * categoryData.weight;
      }
    });

    assessment.totalScore = totalWeightedScore;

    // Determine rating
    let projectedRating: BREEAMRating = 'Pass';
    if (totalWeightedScore >= 85) projectedRating = 'Outstanding';
    else if (totalWeightedScore >= 70) projectedRating = 'Excellent';
    else if (totalWeightedScore >= 55) projectedRating = 'Very Good';
    else if (totalWeightedScore >= 45) projectedRating = 'Good';
    else if (totalWeightedScore >= 30) projectedRating = 'Pass';

    return {
      assessment,
      categoryBreakdown,
      minimumStandards: this.getBREEAMMinimumStandards(),
      projectedRating,
      improvementPlan: this.generateBREEAMImprovements(categoryBreakdown),
      benchmarks: {
        sectorAverage: 55,
        topQuartile: 70,
        yourScore: totalWeightedScore,
        percentile: totalWeightedScore > 55 ? 60 : 40
      }
    };
  }

  private calculateBREEAMManagementScore(data: any): number {
    let score = 0;
    if (data.commissioning) score += 20;
    if (data.constructionImpacts) score += 15;
    if (data.stakeholderParticipation) score += 15;
    return Math.min(score, 100);
  }

  private calculateBREEAMHealthScore(data: any): number {
    let score = 0;
    if (data.visualComfort) score += 20;
    if (data.indoorAirQuality) score += 20;
    if (data.thermalComfort) score += 15;
    if (data.acousticPerformance) score += 15;
    return Math.min(score, 100);
  }

  private calculateBREEAMEnergyScore(data: any): number {
    const energyReduction = data.energyReduction || 0;
    return Math.min(energyReduction * 2, 100);
  }

  private calculateBREEAMTransportScore(data: any): number {
    let score = 0;
    if (data.publicTransport) score += 30;
    if (data.cyclingFacilities) score += 20;
    if (data.travelPlan) score += 20;
    return Math.min(score, 100);
  }

  private calculateBREEAMWaterScore(data: any): number {
    const waterReduction = data.waterReduction || 0;
    return Math.min(waterReduction * 2.5, 100);
  }

  private calculateBREEAMMaterialsScore(data: any): number {
    let score = 0;
    if (data.responsibleSourcing) score += 25;
    if (data.materialEfficiency) score += 25;
    if (data.lifecycle) score += 20;
    return Math.min(score, 100);
  }

  private calculateBREEAMWasteScore(data: any): number {
    let score = 0;
    if (data.constructionWaste) score += 30;
    if (data.operationalWaste) score += 30;
    if (data.aggregatesReuse) score += 20;
    return Math.min(score, 100);
  }

  private calculateBREEAMLandScore(data: any): number {
    let score = 0;
    if (data.siteSelection) score += 25;
    if (data.ecologicalValue) score += 25;
    if (data.biodiversity) score += 25;
    return Math.min(score, 100);
  }

  private calculateBREEAMPollutionScore(data: any): number {
    let score = 0;
    if (data.refrigerants) score += 20;
    if (data.noxEmissions) score += 20;
    if (data.surfaceWaterRunoff) score += 20;
    if (data.lightPollution) score += 15;
    return Math.min(score, 100);
  }

  private getBREEAMMinimumStandards(): BREEAMMinimumStandard[] {
    return [
      {
        category: 'Energy',
        issue: 'Energy Efficiency',
        requiredFor: ['Excellent', 'Outstanding'],
        status: 'met'
      },
      {
        category: 'Water',
        issue: 'Water Consumption',
        requiredFor: ['Very Good', 'Excellent', 'Outstanding'],
        status: 'met'
      }
    ];
  }

  private generateBREEAMImprovements(scores: Record<BREEAMCategoryName, number>): BREEAMImprovement[] {
    const improvements: BREEAMImprovement[] = [];

    if (scores['Energy'] < 60) {
      improvements.push({
        issueId: 'Ene01',
        category: 'Energy',
        potentialCredits: 15,
        currentCredits: scores['Energy'] / 10,
        effort: 'high',
        priority: 'high',
        recommendations: ['Improve building fabric', 'Install renewable energy']
      });
    }

    if (scores['Transport'] < 50) {
      improvements.push({
        issueId: 'Tra01',
        category: 'Transport',
        potentialCredits: 10,
        currentCredits: scores['Transport'] / 10,
        effort: 'medium',
        priority: 'medium',
        recommendations: ['Enhance public transport access', 'Provide EV charging']
      });
    }

    return improvements;
  }

  // ==================== UNIFIED ASSESSMENT ====================

  performUnifiedAssessment(
    organizationData: any,
    buildingData: any,
    performanceData: any
  ): {
    ghg: GHGInventory;
    leed: LEEDScorecard;
    well: WELLScorecard;
    breeam: BREEAMScorecard;
    summary: UnifiedSummary;
  } {
    const ghg = this.calculateGHGInventory(
      performanceData.energy || {},
      performanceData.activities || {},
      organizationData
    );

    const leed = this.assessLEEDProject(
      buildingData,
      performanceData
    );

    const well = this.assessWELLProject(
      buildingData,
      performanceData.health || {}
    );

    const breeam = this.assessBREEAMProject(
      buildingData,
      performanceData
    );

    return {
      ghg,
      leed,
      well,
      breeam,
      summary: this.generateUnifiedSummary(ghg, leed, well, breeam)
    };
  }

  private generateUnifiedSummary(
    ghg: GHGInventory,
    leed: LEEDScorecard,
    well: WELLScorecard,
    breeam: BREEAMScorecard
  ): UnifiedSummary {
    return {
      carbonFootprint: ghg.totalEmissions,
      ghgBreakdown: {
        scope1: ghg.scope1.total,
        scope2: ghg.scope2.total,
        scope3: ghg.scope3.total
      },
      certifications: {
        leed: leed.projectedLevel,
        well: well.projectedLevel,
        breeam: breeam.projectedRating
      },
      scores: {
        leedPoints: leed.project.totalPoints,
        wellPoints: well.project.totalPoints,
        breeamScore: breeam.assessment.totalScore
      },
      topPriorities: [
        'Reduce Scope 1 emissions by 30%',
        'Achieve LEED Gold certification',
        'Improve WELL Air quality score',
        'Meet BREEAM Energy minimum standards'
      ],
      estimatedCost: '$500,000 - $1,000,000',
      roi: '3-5 years'
    };
  }
}

interface UnifiedSummary {
  carbonFootprint: number;
  ghgBreakdown: {
    scope1: number;
    scope2: number;
    scope3: number;
  };
  certifications: {
    leed: string;
    well: string;
    breeam: string;
  };
  scores: {
    leedPoints: number;
    wellPoints: number;
    breeamScore: number;
  };
  topPriorities: string[];
  estimatedCost: string;
  roi: string;
}

// Export singleton instance
export const sustainabilityFrameworks = new SustainabilityFrameworksMapper();