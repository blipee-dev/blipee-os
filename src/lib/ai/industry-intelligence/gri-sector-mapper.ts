/**
 * GRI Sector Standards Mapper
 * Maps organizations to appropriate GRI sector standards and materiality topics
 */

export interface GRISectorStandard {
  id: string;
  name: string;
  code: string; // e.g., 'GRI-11', 'GRI-12'
  effectiveDate: Date;
  status: 'published' | 'under_development' | 'planned';
  industries: string[];
  materialTopics: MaterialTopic[];
  requiredDisclosures: Disclosure[];
  keyMetrics: ESGMetric[];
  complianceRequirements: ComplianceRequirement[];
  peerBenchmarks: BenchmarkData[];
}

export interface MaterialTopic {
  id: string;
  name: string;
  category: 'environmental' | 'social' | 'governance';
  importance: 'high' | 'medium' | 'low';
  description: string;
  applicableMetrics: string[];
  reportingGuidance: string;
  stakeholderRelevance: string[];
}

export interface Disclosure {
  id: string;
  name: string;
  type: 'management_approach' | 'topic_specific';
  requirement: 'mandatory' | 'recommended';
  description: string;
  reportingCriteria: string[];
  verificationRequired: boolean;
}

export interface ESGMetric {
  id: string;
  name: string;
  unit: string;
  calculation: string;
  frequency: 'annual' | 'quarterly' | 'monthly';
  scope: 'scope1' | 'scope2' | 'scope3' | 'social' | 'governance';
  benchmarkAvailable: boolean;
}

export interface ComplianceRequirement {
  region: string;
  regulation: string;
  deadline: Date;
  status: 'compliant' | 'at_risk' | 'non_compliant';
  requiredActions: string[];
}

export interface BenchmarkData {
  metric: string;
  industryAverage: number;
  topQuartile: number;
  bottomQuartile: number;
  unitOfMeasure: string;
  lastUpdated: Date;
}

// Published GRI Sector Standards (2024-2025)
export const GRI_SECTOR_STANDARDS: GRISectorStandard[] = [
  {
    id: 'gri-11',
    name: 'Oil and Gas Sector',
    code: 'GRI-11',
    effectiveDate: new Date('2023-01-01'),
    status: 'published',
    industries: [
      'Oil and gas extraction',
      'Petroleum refining',
      'Pipeline transportation',
      'Oil and gas field services',
      'Petrochemicals',
      'Natural gas distribution'
    ],
    materialTopics: [
      {
        id: 'climate-change',
        name: 'Climate Change',
        category: 'environmental',
        importance: 'high',
        description: 'GHG emissions, energy transition, carbon pricing',
        applicableMetrics: ['scope1-emissions', 'scope2-emissions', 'scope3-emissions', 'methane-intensity'],
        reportingGuidance: 'Report absolute emissions and intensity metrics',
        stakeholderRelevance: ['investors', 'regulators', 'communities', 'customers']
      },
      {
        id: 'biodiversity',
        name: 'Biodiversity',
        category: 'environmental',
        importance: 'high',
        description: 'Impact on ecosystems, protected areas, restoration',
        applicableMetrics: ['land-use', 'spill-incidents', 'restoration-area'],
        reportingGuidance: 'Report on operational impacts and mitigation measures',
        stakeholderRelevance: ['communities', 'regulators', 'ngos']
      },
      {
        id: 'water-effluents',
        name: 'Water and Effluents',
        category: 'environmental',
        importance: 'high',
        description: 'Water consumption, wastewater discharge, water stress',
        applicableMetrics: ['water-withdrawal', 'water-discharge', 'water-recycled'],
        reportingGuidance: 'Report by source and quality',
        stakeholderRelevance: ['communities', 'regulators']
      },
      {
        id: 'local-communities',
        name: 'Local Communities',
        category: 'social',
        importance: 'high',
        description: 'Community engagement, indigenous rights, land use',
        applicableMetrics: ['community-investments', 'grievances', 'resettlement'],
        reportingGuidance: 'Report on consultation processes and impacts',
        stakeholderRelevance: ['communities', 'indigenous-peoples', 'governments']
      }
    ],
    requiredDisclosures: [
      {
        id: 'gri-11-1',
        name: 'Climate adaptation, resilience, and transition',
        type: 'topic_specific',
        requirement: 'mandatory',
        description: 'Strategy and actions for climate change adaptation and transition',
        reportingCriteria: ['climate-strategy', 'transition-plans', 'scenario-analysis'],
        verificationRequired: true
      },
      {
        id: 'gri-11-2',
        name: 'Air emissions',
        type: 'topic_specific',
        requirement: 'mandatory',
        description: 'Air pollutants and GHG emissions',
        reportingCriteria: ['nox-sox-emissions', 'particulate-matter', 'ghg-emissions'],
        verificationRequired: true
      }
    ],
    keyMetrics: [
      {
        id: 'scope1-emissions',
        name: 'Scope 1 GHG Emissions',
        unit: 'tCO2e',
        calculation: 'Direct emissions from owned/controlled sources',
        frequency: 'annual',
        scope: 'scope1',
        benchmarkAvailable: true
      },
      {
        id: 'methane-intensity',
        name: 'Methane Emissions Intensity',
        unit: 'tCH4/unit production',
        calculation: 'Methane emissions per unit of production',
        frequency: 'annual',
        scope: 'scope1',
        benchmarkAvailable: true
      }
    ],
    complianceRequirements: [
      {
        region: 'EU',
        regulation: 'CSRD',
        deadline: new Date('2024-12-31'),
        status: 'at_risk',
        requiredActions: ['Implement ESRS standards', 'Third-party verification']
      },
      {
        region: 'US',
        regulation: 'SEC Climate Disclosure',
        deadline: new Date('2025-03-31'),
        status: 'at_risk',
        requiredActions: ['Scope 1&2 verification', 'Climate risk assessment']
      }
    ],
    peerBenchmarks: [
      {
        metric: 'scope1-emissions-intensity',
        industryAverage: 45.2,
        topQuartile: 28.5,
        bottomQuartile: 62.8,
        unitOfMeasure: 'tCO2e/barrel',
        lastUpdated: new Date('2024-08-01')
      }
    ]
  },
  {
    id: 'gri-12',
    name: 'Coal Sector',
    code: 'GRI-12',
    effectiveDate: new Date('2024-01-01'),
    status: 'published',
    industries: [
      'Coal mining',
      'Coal preparation',
      'Coal power generation',
      'Coal transportation'
    ],
    materialTopics: [
      {
        id: 'climate-change-coal',
        name: 'Climate Change',
        category: 'environmental',
        importance: 'high',
        description: 'GHG emissions, coal transition, stranded assets',
        applicableMetrics: ['scope1-emissions', 'scope3-emissions', 'transition-plans'],
        reportingGuidance: 'Report on transition strategy and timeline',
        stakeholderRelevance: ['investors', 'regulators', 'communities']
      },
      {
        id: 'occupational-health-safety',
        name: 'Occupational Health and Safety',
        category: 'social',
        importance: 'high',
        description: 'Worker safety, mining hazards, health impacts',
        applicableMetrics: ['injury-rate', 'fatalities', 'occupational-illness'],
        reportingGuidance: 'Report comprehensive safety statistics',
        stakeholderRelevance: ['workers', 'unions', 'regulators']
      }
    ],
    requiredDisclosures: [],
    keyMetrics: [],
    complianceRequirements: [],
    peerBenchmarks: []
  },
  {
    id: 'gri-13',
    name: 'Agriculture, Aquaculture and Fishing',
    code: 'GRI-13',
    effectiveDate: new Date('2024-01-01'),
    status: 'published',
    industries: [
      'Crop production',
      'Animal production',
      'Aquaculture',
      'Fishing',
      'Food processing'
    ],
    materialTopics: [
      {
        id: 'food-security',
        name: 'Food Security',
        category: 'social',
        importance: 'high',
        description: 'Access to nutritious food, supply chain resilience',
        applicableMetrics: ['yield-productivity', 'food-loss-waste', 'nutrition-access'],
        reportingGuidance: 'Report on contribution to food security',
        stakeholderRelevance: ['communities', 'governments', 'consumers']
      },
      {
        id: 'soil-health',
        name: 'Soil Health',
        category: 'environmental',
        importance: 'high',
        description: 'Soil quality, erosion prevention, regenerative practices',
        applicableMetrics: ['soil-carbon', 'erosion-rate', 'soil-ph'],
        reportingGuidance: 'Report on soil management practices',
        stakeholderRelevance: ['farmers', 'communities', 'environmentalists']
      }
    ],
    requiredDisclosures: [],
    keyMetrics: [],
    complianceRequirements: [],
    peerBenchmarks: []
  },
  {
    id: 'gri-14',
    name: 'Mining Sector',
    code: 'GRI-14',
    effectiveDate: new Date('2026-01-01'),
    status: 'published',
    industries: [
      'Metal ore mining',
      'Non-metallic mineral mining',
      'Coal mining',
      'Mining support services'
    ],
    materialTopics: [
      {
        id: 'mine-closure',
        name: 'Mine Closure and Rehabilitation',
        category: 'environmental',
        importance: 'high',
        description: 'Post-mining land use, community transition, environmental restoration',
        applicableMetrics: ['rehabilitation-area', 'closure-provisions', 'post-mining-land-use'],
        reportingGuidance: 'Report on closure planning and implementation',
        stakeholderRelevance: ['communities', 'governments', 'environmentalists']
      }
    ],
    requiredDisclosures: [],
    keyMetrics: [],
    complianceRequirements: [],
    peerBenchmarks: []
  }
];

// Under Development Sector Standards
export const UNDER_DEVELOPMENT_STANDARDS: Partial<GRISectorStandard>[] = [
  {
    id: 'gri-15',
    name: 'Financial Services - Banking',
    code: 'GRI-15',
    status: 'under_development',
    industries: [
      'Commercial banking',
      'Investment banking',
      'Credit unions',
      'Digital banking'
    ]
  },
  {
    id: 'gri-16',
    name: 'Financial Services - Capital Markets',
    code: 'GRI-16',
    status: 'under_development',
    industries: [
      'Asset management',
      'Investment funds',
      'Pension funds',
      'Private equity'
    ]
  },
  {
    id: 'gri-17',
    name: 'Financial Services - Insurance',
    code: 'GRI-17',
    status: 'under_development',
    industries: [
      'Life insurance',
      'Property and casualty insurance',
      'Reinsurance',
      'Insurance broking'
    ]
  },
  {
    id: 'gri-18',
    name: 'Textiles and Apparel',
    code: 'GRI-18',
    status: 'under_development',
    industries: [
      'Textile production',
      'Apparel manufacturing',
      'Footwear manufacturing',
      'Fashion retail'
    ]
  }
];

// Planned Future Sectors (part of 40-sector program)
export const PLANNED_SECTORS = [
  'Technology and Telecommunications',
  'Automotive',
  'Manufacturing',
  'Construction and Real Estate',
  'Transportation and Logistics',
  'Healthcare and Pharmaceuticals',
  'Food and Beverage',
  'Retail and Consumer Goods',
  'Utilities',
  'Chemicals',
  'Aerospace and Defense',
  'Media and Entertainment'
];

export class GRISectorMapper {
  private sectorStandards: GRISectorStandard[];
  
  constructor() {
    this.sectorStandards = GRI_SECTOR_STANDARDS;
  }
  
  /**
   * Map organization industry to applicable GRI sector standard
   */
  mapOrganizationToSector(
    industry: string,
    description?: string,
    activities?: string[]
  ): GRISectorStandard | null {
    // Try exact industry match first
    for (const standard of this.sectorStandards) {
      if (standard.industries.includes(industry)) {
        return standard;
      }
    }
    
    // Try fuzzy matching on industry names
    const industryLower = industry.toLowerCase();
    for (const standard of this.sectorStandards) {
      for (const stdIndustry of standard.industries) {
        if (industryLower.includes(stdIndustry.toLowerCase()) ||
            stdIndustry.toLowerCase().includes(industryLower)) {
          return standard;
        }
      }
    }
    
    // Try matching on description or activities
    if (description || activities) {
      const searchText = [description, ...(activities || [])].join(' ').toLowerCase();
      
      for (const standard of this.sectorStandards) {
        for (const stdIndustry of standard.industries) {
          if (searchText.includes(stdIndustry.toLowerCase())) {
            return standard;
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Get material topics for organization based on sector
   */
  getMaterialTopics(
    sectorId: string,
    organizationSize?: 'small' | 'medium' | 'large',
    riskProfile?: 'low' | 'medium' | 'high'
  ): MaterialTopic[] {
    const sector = this.sectorStandards.find(s => s.id === sectorId);
    if (!sector) return [];
    
    let topics = sector.materialTopics;
    
    // Filter by organization characteristics
    if (organizationSize === 'small') {
      topics = topics.filter(t => t.importance !== 'low');
    }
    
    if (riskProfile === 'high') {
      topics = topics.filter(t => t.importance === 'high');
    }
    
    return topics.sort((a, b) => {
      const importanceOrder = { high: 3, medium: 2, low: 1 };
      return importanceOrder[b.importance] - importanceOrder[a.importance];
    });
  }
  
  /**
   * Get required disclosures for sector
   */
  getRequiredDisclosures(sectorId: string): Disclosure[] {
    const sector = this.sectorStandards.find(s => s.id === sectorId);
    return sector?.requiredDisclosures || [];
  }
  
  /**
   * Get key metrics for sector benchmarking
   */
  getKeyMetrics(sectorId: string): ESGMetric[] {
    const sector = this.sectorStandards.find(s => s.id === sectorId);
    return sector?.keyMetrics || [];
  }
  
  /**
   * Get peer benchmark data
   */
  getPeerBenchmarks(sectorId: string, metric: string): BenchmarkData | null {
    const sector = this.sectorStandards.find(s => s.id === sectorId);
    if (!sector) return null;
    
    return sector.peerBenchmarks.find(b => b.metric === metric) || null;
  }
  
  /**
   * Get compliance requirements by region
   */
  getComplianceRequirements(
    sectorId: string,
    region?: string
  ): ComplianceRequirement[] {
    const sector = this.sectorStandards.find(s => s.id === sectorId);
    if (!sector) return [];
    
    let requirements = sector.complianceRequirements;
    
    if (region) {
      requirements = requirements.filter(r => 
        r.region.toLowerCase() === region.toLowerCase()
      );
    }
    
    return requirements.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
  }
  
  /**
   * Get all available sectors
   */
  getAvailableSectors(): GRISectorStandard[] {
    return this.sectorStandards.filter(s => s.status === 'published');
  }
  
  /**
   * Get sectors under development
   */
  getUpcomingSectors(): Partial<GRISectorStandard>[] {
    return UNDER_DEVELOPMENT_STANDARDS;
  }
  
  /**
   * Check if organization needs specific sector guidance
   */
  assessSectorReadiness(
    industry: string,
    currentReporting?: string[]
  ): {
    hasApplicableSector: boolean;
    recommendedSector?: GRISectorStandard;
    gapsIdentified: string[];
    nextSteps: string[];
  } {
    const recommendedSector = this.mapOrganizationToSector(industry);
    const hasApplicableSector = !!recommendedSector;
    
    const gapsIdentified: string[] = [];
    const nextSteps: string[] = [];
    
    if (hasApplicableSector && recommendedSector) {
      // Check for reporting gaps
      const requiredDisclosures = recommendedSector.requiredDisclosures;
      const materialTopics = recommendedSector.materialTopics;
      
      if (!currentReporting) {
        gapsIdentified.push('No current sustainability reporting identified');
        nextSteps.push('Implement basic GRI Universal Standards');
        nextSteps.push(`Prepare for ${recommendedSector.name} sector requirements`);
      } else {
        // Check specific gaps
        materialTopics.forEach(topic => {
          const hasReporting = currentReporting.some(report => 
            report.toLowerCase().includes(topic.name.toLowerCase())
          );
          if (!hasReporting) {
            gapsIdentified.push(`Missing reporting on ${topic.name}`);
          }
        });
        
        if (gapsIdentified.length > 0) {
          nextSteps.push('Address identified material topic gaps');
          nextSteps.push('Align with sector-specific requirements');
        }
      }
    } else {
      gapsIdentified.push('No specific GRI sector standard available yet');
      nextSteps.push('Use GRI Universal Standards as foundation');
      nextSteps.push('Monitor for future sector standard development');
    }
    
    return {
      hasApplicableSector,
      recommendedSector,
      gapsIdentified,
      nextSteps
    };
  }
}