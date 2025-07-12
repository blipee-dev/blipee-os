/**
 * GRI Standards Mapper
 * Maps organizations to applicable GRI sector standards and manages disclosure requirements
 */

import {
  GRISectorStandard,
  IndustryClassification,
  MaterialTopic,
  GRIDisclosure,
  GRIMappingResult,
  DataPoint
} from './types';

interface GRIStandardDefinition {
  standard: GRISectorStandard;
  name: string;
  industries: string[]; // NAICS codes
  materialTopics: MaterialTopic[];
  coreDisclosures: GRIDisclosure[];
  sectorSpecificDisclosures: GRIDisclosure[];
}

export class GRIStandardsMapper {
  private standards: Map<GRISectorStandard, GRIStandardDefinition>;

  constructor() {
    this.standards = new Map();
    this.initializeStandards();
  }

  /**
   * Initialize GRI sector standards definitions
   */
  private initializeStandards(): void {
    // GRI 11: Oil and Gas Sector
    this.standards.set(GRISectorStandard.GRI_11_OIL_GAS, {
      standard: GRISectorStandard.GRI_11_OIL_GAS,
      name: 'Oil and Gas Sector',
      industries: ['211', '213111', '213112', '324110'], // NAICS codes
      materialTopics: this.getGRI11MaterialTopics(),
      coreDisclosures: this.getCoreDisclosures(),
      sectorSpecificDisclosures: this.getGRI11SpecificDisclosures()
    });

    // GRI 12: Coal Sector
    this.standards.set(GRISectorStandard.GRI_12_COAL, {
      standard: GRISectorStandard.GRI_12_COAL,
      name: 'Coal Sector',
      industries: ['2121', '212111', '212112', '212113'],
      materialTopics: this.getGRI12MaterialTopics(),
      coreDisclosures: this.getCoreDisclosures(),
      sectorSpecificDisclosures: this.getGRI12SpecificDisclosures()
    });

    // GRI 13: Agriculture, Aquaculture and Fishing
    this.standards.set(GRISectorStandard.GRI_13_AGRICULTURE, {
      standard: GRISectorStandard.GRI_13_AGRICULTURE,
      name: 'Agriculture, Aquaculture and Fishing Sectors',
      industries: ['111', '112', '114', '115'],
      materialTopics: this.getGRI13MaterialTopics(),
      coreDisclosures: this.getCoreDisclosures(),
      sectorSpecificDisclosures: this.getGRI13SpecificDisclosures()
    });

    // GRI 14: Mining Sector
    this.standards.set(GRISectorStandard.GRI_14_MINING, {
      standard: GRISectorStandard.GRI_14_MINING,
      name: 'Mining Sector',
      industries: ['212', '213114', '213115'], // Mining and support activities
      materialTopics: this.getGRI14MaterialTopics(),
      coreDisclosures: this.getCoreDisclosures(),
      sectorSpecificDisclosures: this.getGRI14SpecificDisclosures()
    });

    // GRI 15: Construction Sector
    this.standards.set(GRISectorStandard.GRI_15_CONSTRUCTION, {
      standard: GRISectorStandard.GRI_15_CONSTRUCTION,
      name: 'Construction and Real Estate Sector',
      industries: ['23', '236', '237', '238', '531'], // Construction and real estate
      materialTopics: this.getGRI15MaterialTopics(),
      coreDisclosures: this.getCoreDisclosures(),
      sectorSpecificDisclosures: this.getGRI15SpecificDisclosures()
    });

    // TODO: Add remaining Phase 2 standards
    // GRI 16: Financial Services
    // GRI 17: Public Sector
  }

  /**
   * Map organization to applicable GRI standards
   */
  async mapToGRIStandards(classification: IndustryClassification): Promise<GRIMappingResult> {
    const applicableStandards: GRISectorStandard[] = [];
    const allMaterialTopics: MaterialTopic[] = [];
    const requiredDisclosures: GRIDisclosure[] = [];
    const optionalDisclosures: GRIDisclosure[] = [];
    const sectorSpecificRequirements: string[] = [];

    // Check each GRI standard for applicability
    for (const [standard, definition] of this.standards) {
      if (this.isStandardApplicable(classification, definition)) {
        applicableStandards.push(standard);
        allMaterialTopics.push(...definition.materialTopics);
        requiredDisclosures.push(...definition.coreDisclosures);
        requiredDisclosures.push(...definition.sectorSpecificDisclosures);
        
        // Add sector-specific requirements
        sectorSpecificRequirements.push(
          `${definition.name}: Follow specific guidance in ${standard}`
        );
      }
    }

    // Remove duplicates
    const uniqueMaterialTopics = this.deduplicateMaterialTopics(allMaterialTopics);
    const uniqueRequiredDisclosures = this.deduplicateDisclosures(requiredDisclosures);

    return {
      applicableStandards,
      materialTopics: uniqueMaterialTopics,
      requiredDisclosures: uniqueRequiredDisclosures,
      optionalDisclosures,
      sectorSpecificRequirements,
      reportingGuidance: this.generateReportingGuidance(applicableStandards)
    };
  }

  /**
   * Check if a GRI standard applies to an organization
   */
  private isStandardApplicable(
    classification: IndustryClassification,
    definition: GRIStandardDefinition
  ): boolean {
    if (!classification.naicsCode) return false;

    // Check if NAICS code matches or is a child of standard industries
    return definition.industries.some(industryCode => 
      classification.naicsCode!.startsWith(industryCode)
    );
  }

  /**
   * Get core disclosures applicable to all sectors
   */
  private getCoreDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 305-1',
        title: 'Direct (Scope 1) GHG emissions',
        description: 'Gross direct (Scope 1) GHG emissions in metric tons of CO2 equivalent',
        requirements: [
          'Report gross direct (Scope 1) GHG emissions in metric tons of CO2 equivalent',
          'Exclude any GHG trades from the calculation',
          'Report biogenic CO2 emissions separately'
        ],
        dataPoints: [
          {
            name: 'scope1_emissions',
            type: 'quantitative',
            unit: 'tCO2e',
            required: true,
            guidance: 'Total Scope 1 emissions for the reporting period'
          }
        ],
        reportingGuidance: 'Use GHG Protocol Corporate Standard for calculation methodology'
      },
      {
        code: 'GRI 305-2',
        title: 'Energy indirect (Scope 2) GHG emissions',
        description: 'Gross location-based energy indirect (Scope 2) GHG emissions',
        requirements: [
          'Report location-based Scope 2 emissions',
          'Report market-based Scope 2 emissions if applicable',
          'Explain the methodology used'
        ],
        dataPoints: [
          {
            name: 'scope2_location_based',
            type: 'quantitative',
            unit: 'tCO2e',
            required: true,
            guidance: 'Location-based Scope 2 emissions'
          },
          {
            name: 'scope2_market_based',
            type: 'quantitative',
            unit: 'tCO2e',
            required: false,
            guidance: 'Market-based Scope 2 emissions if purchasing renewable energy'
          }
        ],
        reportingGuidance: 'Follow GHG Protocol Scope 2 Guidance'
      }
    ];
  }

  /**
   * Get GRI 11 Oil & Gas material topics
   */
  private getGRI11MaterialTopics(): MaterialTopic[] {
    return [
      {
        id: 'gri11-climate',
        name: 'Climate adaptation, resilience, and transition',
        description: 'Managing climate-related risks and opportunities in oil & gas operations',
        griStandard: 'GRI 11',
        relevance: 'high',
        impactAreas: ['Environment', 'Economy'],
        metrics: [
          {
            id: 'ghg_intensity',
            name: 'GHG Emissions Intensity',
            unit: 'tCO2e/BOE',
            category: 'environmental',
            calculationMethod: 'Total GHG emissions / Barrels of oil equivalent produced',
            benchmarkAvailable: true,
            regulatoryRequired: true,
            griAlignment: ['GRI 305-4']
          }
        ],
        disclosures: [
          {
            code: 'GRI 201-2',
            title: 'Financial implications of climate change',
            description: 'Financial implications and risks due to climate change',
            requirements: ['Describe climate-related risks and opportunities'],
            dataPoints: [],
            reportingGuidance: 'Align with TCFD recommendations'
          }
        ]
      },
      {
        id: 'gri11-air',
        name: 'Air emissions',
        description: 'Management of air emissions beyond GHG',
        griStandard: 'GRI 11',
        relevance: 'high',
        impactAreas: ['Environment', 'Health'],
        metrics: [
          {
            id: 'nox_emissions',
            name: 'NOx Emissions',
            unit: 'metric tons',
            category: 'environmental',
            calculationMethod: 'Direct measurement or emission factors',
            benchmarkAvailable: true,
            regulatoryRequired: true,
            griAlignment: ['GRI 305-7']
          }
        ],
        disclosures: []
      },
      {
        id: 'gri11-biodiversity',
        name: 'Biodiversity',
        description: 'Impacts on biodiversity and ecosystem services',
        griStandard: 'GRI 11',
        relevance: 'high',
        impactAreas: ['Environment'],
        metrics: [
          {
            id: 'protected_area_operations',
            name: 'Operations in Protected Areas',
            unit: 'number',
            category: 'environmental',
            calculationMethod: 'Count of operational sites in or near protected areas',
            benchmarkAvailable: false,
            regulatoryRequired: true,
            griAlignment: ['GRI 304-1']
          }
        ],
        disclosures: []
      }
    ];
  }

  /**
   * Get GRI 11 sector-specific disclosures
   */
  private getGRI11SpecificDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 11.2.2',
        title: 'Climate adaptation and resilience',
        description: 'Approach to climate adaptation and resilience',
        requirements: [
          'Describe climate scenario analysis conducted',
          'Report on physical and transition risks identified',
          'Explain adaptation strategies'
        ],
        dataPoints: [],
        reportingGuidance: 'Include both 1.5°C and 2°C scenarios'
      },
      {
        code: 'GRI 11.2.3',
        title: 'Approach to emissions reduction',
        description: 'Strategy for reducing GHG emissions',
        requirements: [
          'Report emissions reduction targets',
          'Describe decarbonization strategy',
          'Report progress against targets'
        ],
        dataPoints: [
          {
            name: 'emissions_reduction_target',
            type: 'quantitative',
            unit: 'percentage',
            required: true,
            guidance: 'Percentage reduction target from baseline year'
          }
        ],
        reportingGuidance: 'Targets should be science-based where possible'
      }
    ];
  }

  /**
   * Get GRI 12 Coal material topics
   */
  private getGRI12MaterialTopics(): MaterialTopic[] {
    return [
      {
        id: 'gri12-ghg',
        name: 'GHG emissions',
        description: 'Management of greenhouse gas emissions from coal operations',
        griStandard: 'GRI 12',
        relevance: 'high',
        impactAreas: ['Environment', 'Climate'],
        metrics: [
          {
            id: 'methane_emissions',
            name: 'Methane Emissions',
            unit: 'tCO2e',
            category: 'environmental',
            calculationMethod: 'Measured methane * GWP factor',
            benchmarkAvailable: true,
            regulatoryRequired: true,
            griAlignment: ['GRI 305-1']
          }
        ],
        disclosures: []
      },
      {
        id: 'gri12-closure',
        name: 'Closure and rehabilitation',
        description: 'Mine closure planning and site rehabilitation',
        griStandard: 'GRI 12',
        relevance: 'high',
        impactAreas: ['Environment', 'Community'],
        metrics: [
          {
            id: 'rehabilitation_provision',
            name: 'Rehabilitation Financial Provision',
            unit: 'USD',
            category: 'economic',
            calculationMethod: 'Total financial provision for closure',
            benchmarkAvailable: false,
            regulatoryRequired: true,
            griAlignment: ['GRI 12.2.5']
          }
        ],
        disclosures: []
      }
    ];
  }

  /**
   * Get GRI 12 sector-specific disclosures
   */
  private getGRI12SpecificDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 12.2.2',
        title: 'Methane emissions management',
        description: 'Management of methane emissions from coal mining',
        requirements: [
          'Report total methane emissions',
          'Describe methane capture and utilization',
          'Report on monitoring systems'
        ],
        dataPoints: [
          {
            name: 'methane_capture_rate',
            type: 'quantitative',
            unit: 'percentage',
            required: true,
            guidance: 'Percentage of methane captured vs total emissions'
          }
        ],
        reportingGuidance: 'Use IPCC emission factors where direct measurement not available'
      }
    ];
  }

  /**
   * Get GRI 13 Agriculture material topics
   */
  private getGRI13MaterialTopics(): MaterialTopic[] {
    return [
      {
        id: 'gri13-land',
        name: 'Natural ecosystem conversion',
        description: 'Conversion of natural ecosystems for agricultural use',
        griStandard: 'GRI 13',
        relevance: 'high',
        impactAreas: ['Environment', 'Biodiversity'],
        metrics: [
          {
            id: 'land_converted',
            name: 'Land Converted from Natural Ecosystems',
            unit: 'hectares',
            category: 'environmental',
            calculationMethod: 'Area of natural ecosystem converted in reporting period',
            benchmarkAvailable: false,
            regulatoryRequired: true,
            griAlignment: ['GRI 304-1']
          }
        ],
        disclosures: []
      },
      {
        id: 'gri13-soil',
        name: 'Soil health',
        description: 'Management of soil health and fertility',
        griStandard: 'GRI 13',
        relevance: 'high',
        impactAreas: ['Environment'],
        metrics: [
          {
            id: 'soil_organic_carbon',
            name: 'Soil Organic Carbon',
            unit: 'percentage',
            category: 'environmental',
            calculationMethod: 'Average SOC across agricultural land',
            benchmarkAvailable: true,
            regulatoryRequired: false,
            griAlignment: ['GRI 13.5']
          }
        ],
        disclosures: []
      },
      {
        id: 'gri13-pesticides',
        name: 'Pesticides use',
        description: 'Management of pesticide use and impacts',
        griStandard: 'GRI 13',
        relevance: 'high',
        impactAreas: ['Environment', 'Health'],
        metrics: [
          {
            id: 'pesticide_intensity',
            name: 'Pesticide Use Intensity',
            unit: 'kg/hectare',
            category: 'environmental',
            calculationMethod: 'Total pesticides used / Total agricultural area',
            benchmarkAvailable: true,
            regulatoryRequired: true,
            griAlignment: ['GRI 13.6']
          }
        ],
        disclosures: []
      }
    ];
  }

  /**
   * Get GRI 13 sector-specific disclosures
   */
  private getGRI13SpecificDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 13.3.2',
        title: 'Land and resource rights',
        description: 'Respect for land and resource rights',
        requirements: [
          'Report on land tenure assessments',
          'Describe FPIC processes',
          'Report disputes related to land rights'
        ],
        dataPoints: [
          {
            name: 'land_disputes',
            type: 'quantitative',
            unit: 'number',
            required: true,
            guidance: 'Number of unresolved land rights disputes'
          }
        ],
        reportingGuidance: 'Follow VGGT guidelines'
      }
    ];
  }

  /**
   * Get GRI 14 material topics
   */
  private getGRI14MaterialTopics(): MaterialTopic[] {
    return [
      {
        id: 'gri14-closure',
        name: 'Mine closure and rehabilitation',
        description: 'Planning and implementation of mine closure and site rehabilitation',
        griStandard: 'GRI 14',
        relevance: 'high',
        impactAreas: ['Environment', 'Community', 'Economic'],
        metrics: [
          {
            id: 'rehabilitation_progress',
            name: 'Land Rehabilitation Progress',
            unit: 'percentage',
            category: 'environmental',
            calculationMethod: 'Area rehabilitated / Total disturbed area',
            benchmarkAvailable: true,
            regulatoryRequired: true,
            griAlignment: ['GRI 14-1']
          }
        ],
        disclosures: []
      },
      {
        id: 'gri14-safety',
        name: 'Occupational health and safety in mining',
        description: 'Worker safety and health protection in mining operations',
        griStandard: 'GRI 14',
        relevance: 'high',
        impactAreas: ['Social', 'Workers'],
        metrics: [
          {
            id: 'fatality_rate',
            name: 'Fatality Rate',
            unit: 'per 200,000 hours',
            category: 'social',
            calculationMethod: 'Number of fatalities × 200,000 / Total work hours',
            benchmarkAvailable: true,
            regulatoryRequired: true,
            griAlignment: ['GRI 14-2']
          }
        ],
        disclosures: []
      }
    ];
  }

  /**
   * Get GRI 14 sector-specific disclosures
   */
  private getGRI14SpecificDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 14-1',
        title: 'Mine closure and rehabilitation',
        description: 'Processes for mine closure and rehabilitation planning',
        requirements: [
          'Description of closure planning process',
          'Rehabilitation progress and outcomes',
          'Post-closure monitoring activities'
        ],
        dataPoints: [
          {
            name: 'closure_fund',
            type: 'quantitative',
            unit: 'USD',
            required: true,
            guidance: 'Total funds allocated for mine closure'
          }
        ],
        reportingGuidance: 'Report on closure planning and rehabilitation progress'
      }
    ];
  }

  /**
   * Get GRI 15 material topics
   */
  private getGRI15MaterialTopics(): MaterialTopic[] {
    return [
      {
        id: 'gri15-safety',
        name: 'Building safety and quality',
        description: 'Ensuring structural integrity and construction safety',
        griStandard: 'GRI 15',
        relevance: 'high',
        impactAreas: ['Social', 'Governance'],
        metrics: [
          {
            id: 'safety_incidents_rate',
            name: 'Construction Safety Incident Rate',
            unit: 'per 100,000 hours',
            category: 'social',
            calculationMethod: 'Safety incidents × 100,000 / Total construction hours',
            benchmarkAvailable: true,
            regulatoryRequired: true,
            griAlignment: ['GRI 15-1']
          }
        ],
        disclosures: []
      },
      {
        id: 'gri15-sustainable',
        name: 'Sustainable design and construction',
        description: 'Integration of sustainability in design and construction',
        griStandard: 'GRI 15',
        relevance: 'high',
        impactAreas: ['Environment', 'Economic'],
        metrics: [
          {
            id: 'green_certifications',
            name: 'Green Building Certifications',
            unit: 'percentage',
            category: 'environmental',
            calculationMethod: 'Certified projects / Total projects',
            benchmarkAvailable: true,
            regulatoryRequired: false,
            griAlignment: ['GRI 15-2']
          }
        ],
        disclosures: []
      }
    ];
  }

  /**
   * Get GRI 15 sector-specific disclosures
   */
  private getGRI15SpecificDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 15-1',
        title: 'Building safety and quality',
        description: 'Management approach to building safety and quality assurance',
        requirements: [
          'Quality management system description',
          'Safety protocols and performance',
          'Building code compliance processes'
        ],
        dataPoints: [
          {
            name: 'safety_incidents',
            type: 'quantitative',
            unit: 'number',
            required: true,
            guidance: 'Total construction safety incidents'
          }
        ],
        reportingGuidance: 'Report on building safety management systems'
      }
    ];
  }

  /**
   * Generate reporting guidance based on applicable standards
   */
  private generateReportingGuidance(standards: GRISectorStandard[]): string {
    if (standards.length === 0) {
      return 'No sector-specific GRI standards apply. Follow GRI Universal Standards.';
    }

    const guidance = [
      `Your organization should report according to the following GRI Sector Standards:`,
      ...standards.map(s => `- ${s}: ${this.standards.get(s)?.name}`),
      '',
      'Key reporting requirements:',
      '1. Report on all material topics identified in the applicable standards',
      '2. Use sector-specific metrics and calculation methods',
      '3. Follow both Universal Standards and Sector Standards',
      '4. Provide sector context in management approach disclosures'
    ];

    return guidance.join('\n');
  }

  /**
   * Deduplicate material topics
   */
  private deduplicateMaterialTopics(topics: MaterialTopic[]): MaterialTopic[] {
    const seen = new Set<string>();
    return topics.filter(topic => {
      if (seen.has(topic.id)) return false;
      seen.add(topic.id);
      return true;
    });
  }

  /**
   * Deduplicate disclosures
   */
  private deduplicateDisclosures(disclosures: GRIDisclosure[]): GRIDisclosure[] {
    const seen = new Set<string>();
    return disclosures.filter(disclosure => {
      if (seen.has(disclosure.code)) return false;
      seen.add(disclosure.code);
      return true;
    });
  }

  /**
   * Get all available GRI standards
   */
  getAllStandards(): GRISectorStandard[] {
    return Array.from(this.standards.keys());
  }

  /**
   * Get details for a specific standard
   */
  getStandardDetails(standard: GRISectorStandard): GRIStandardDefinition | undefined {
    return this.standards.get(standard);
  }
}