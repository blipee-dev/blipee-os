/**
 * Construction Industry Model (GRI 15)
 * Implements GRI 15 sector standard for construction and real estate operations
 */

import { IndustryModel } from '../base-model';
import {
  IndustryClassification,
  MaterialTopic,
  GRIDisclosure,
  IndustryMetric,
  IndustryBenchmark,
  RegulatoryRequirement,
  IndustryRecommendation,
  IndustryModelConfig,
  GRISectorStandard,
  PeerComparison
} from '../types';

export class ConstructionGRI15Model extends IndustryModel {
  constructor() {
    const config: IndustryModelConfig = {
      industryName: 'Construction and Real Estate',
      griStandards: [GRISectorStandard.GRI_15_CONSTRUCTION],
      naicsCodes: [
        '23', // Construction
        '236', '237', '238', // Construction subsectors
        '531', // Real estate
        '531110', '531120', '531130', // Real estate leasing
        '236115', '236116', '236117', '236118', // Residential construction
        '237110', '237120', '237130', // Civil engineering
        '238110', '238120', '238130', '238140' // Specialty trades
      ],
      sicCodes: [
        '15', '16', '17', // Construction divisions
        '1521', '1522', '1531', '1541', // Building construction
        '1611', '1622', '1623', '1629', // Heavy construction
        '1711', '1721', '1731', '1741', // Special trade contractors
        '6512', '6513', '6514', '6515' // Real estate operators
      ],
      materialTopics: [
        'building-safety-quality',
        'sustainable-design-construction',
        'materials-sourcing',
        'construction-waste',
        'worker-safety-health',
        'community-development',
        'energy-efficiency',
        'water-management',
        'biodiversity-land-use',
        'supply-chain-management'
      ],
      specificMetrics: [],
      regulatoryFrameworks: ['OSHA', 'EPA', 'Building Codes', 'LEED', 'Energy Star'],
      certifications: ['LEED', 'BREEAM', 'ISO 14001', 'ISO 45001', 'WELL Building']
    };

    super(config);
  }

  protected async checkCustomApplicability(classification: IndustryClassification): Promise<boolean> {
    if (classification.customCode) {
      const constructionKeywords = [
        'construction', 'building', 'contractor', 'developer', 'real estate',
        'architecture', 'engineering', 'residential', 'commercial', 'infrastructure',
        'renovation', 'remodeling', 'concrete', 'steel', 'electrical', 'plumbing'
      ];
      
      return constructionKeywords.some(keyword => 
        classification.customCode!.toLowerCase().includes(keyword)
      );
    }
    return false;
  }

  getMaterialTopics(): MaterialTopic[] {
    return [
      {
        id: 'building-safety-quality',
        name: 'Building safety and quality',
        description: 'Ensuring structural integrity, safety systems, and quality construction practices',
        griStandard: 'GRI 15',
        relevance: 'high',
        impactAreas: ['Social', 'Governance', 'Community'],
        managementApproach: 'Implement comprehensive quality management and safety standards throughout construction lifecycle',
        metrics: [
          {
            id: 'safety_incidents_rate',
            name: 'Construction safety incident rate',
            unit: 'per 100,000 hours',
            category: 'social',
            calculationMethod: 'Safety incidents × 100,000 / Total construction hours',
            benchmarkAvailable: true,
            regulatoryRequired: true,
            griAlignment: ['GRI 403-2', 'GRI 15-1']
          },
          {
            id: 'building_code_compliance',
            name: 'Building code compliance rate',
            unit: '%',
            category: 'governance',
            calculationMethod: 'Projects meeting all codes / Total projects',
            benchmarkAvailable: true,
            regulatoryRequired: true,
            griAlignment: ['GRI 15-1']
          }
        ],
        disclosures: [
          {
            code: 'GRI 15-1',
            title: 'Building safety and quality',
            description: 'Management approach to building safety, quality assurance, and regulatory compliance',
            requirements: [
              'Quality management system description',
              'Safety protocols and performance',
              'Building code compliance processes'
            ],
            dataPoints: [
              { name: 'Safety incidents', type: 'quantitative', unit: 'number', required: true, guidance: 'Total construction safety incidents' },
              { name: 'Code violations', type: 'quantitative', unit: 'number', required: true, guidance: 'Building code violations identified' }
            ],
            reportingGuidance: 'Report on building safety management systems and quality assurance practices'
          }
        ]
      },
      {
        id: 'sustainable-design-construction',
        name: 'Sustainable design and construction',
        description: 'Integration of sustainability principles in design, construction methods, and building performance',
        griStandard: 'GRI 15',
        relevance: 'high',
        impactAreas: ['Environment', 'Economic'],
        managementApproach: 'Adopt green building standards and sustainable construction practices',
        metrics: [
          {
            id: 'green_building_certifications',
            name: 'Green building certifications',
            unit: '% of projects',
            category: 'environmental',
            calculationMethod: 'Certified green projects / Total projects',
            benchmarkAvailable: true,
            regulatoryRequired: false,
            griAlignment: ['GRI 15-2']
          },
          {
            id: 'energy_efficiency_rating',
            name: 'Building energy efficiency rating',
            unit: 'kWh/m²/year',
            category: 'environmental',
            calculationMethod: 'Annual energy consumption / Building area',
            benchmarkAvailable: true,
            regulatoryRequired: false,
            griAlignment: ['GRI 302-3', 'GRI 15-2']
          }
        ],
        disclosures: [
          {
            code: 'GRI 15-2',
            title: 'Sustainable design and construction',
            description: 'Integration of environmental considerations in design and construction processes',
            requirements: [
              'Sustainable design principles',
              'Green building certifications',
              'Environmental performance targets'
            ],
            dataPoints: [
              { name: 'LEED projects', type: 'quantitative', unit: 'number', required: false, guidance: 'Number of LEED certified projects' },
              { name: 'Energy efficiency', type: 'quantitative', unit: 'kWh/m²', required: true, guidance: 'Building energy performance' }
            ],
            reportingGuidance: 'Report on sustainable design practices and environmental performance'
          }
        ]
      },
      {
        id: 'materials-sourcing',
        name: 'Sustainable materials sourcing',
        description: 'Responsible procurement of construction materials with environmental and social considerations',
        griStandard: 'GRI 15',
        relevance: 'high',
        impactAreas: ['Environment', 'Social', 'Supply Chain'],
        managementApproach: 'Implement sustainable procurement policies and supplier engagement programs',
        metrics: [
          {
            id: 'sustainable_materials_percentage',
            name: 'Sustainable materials percentage',
            unit: '% by value',
            category: 'environmental',
            calculationMethod: 'Sustainable materials value / Total materials value',
            benchmarkAvailable: true,
            regulatoryRequired: false,
            griAlignment: ['GRI 301-1', 'GRI 15-3']
          },
          {
            id: 'local_materials_percentage',
            name: 'Local materials percentage',
            unit: '% by value',
            category: 'economic',
            calculationMethod: 'Local materials value / Total materials value',
            benchmarkAvailable: true,
            regulatoryRequired: false,
            griAlignment: ['GRI 204-1', 'GRI 15-3']
          }
        ],
        disclosures: [
          {
            code: 'GRI 15-3',
            title: 'Materials sourcing',
            description: 'Sustainable procurement practices and materials selection criteria',
            requirements: [
              'Materials sourcing policies',
              'Supplier sustainability requirements',
              'Materials environmental impact assessment'
            ],
            dataPoints: [
              { name: 'Certified materials', type: 'quantitative', unit: '%', required: true, guidance: 'Percentage of certified sustainable materials' },
              { name: 'Local suppliers', type: 'quantitative', unit: 'number', required: false, guidance: 'Number of local suppliers used' }
            ],
            reportingGuidance: 'Report on materials sourcing policies and sustainable procurement practices'
          }
        ]
      },
      {
        id: 'construction-waste',
        name: 'Construction and demolition waste',
        description: 'Management of construction, renovation, and demolition waste through reduction, reuse, and recycling',
        griStandard: 'GRI 15',
        relevance: 'high',
        impactAreas: ['Environment', 'Economic'],
        managementApproach: 'Implement waste hierarchy principles with focus on prevention and circular economy',
        metrics: [
          {
            id: 'waste_diversion_rate',
            name: 'Waste diversion rate',
            unit: '%',
            category: 'environmental',
            calculationMethod: 'Diverted waste / Total waste generated',
            benchmarkAvailable: true,
            regulatoryRequired: false,
            griAlignment: ['GRI 306-2', 'GRI 15-4']
          },
          {
            id: 'waste_intensity',
            name: 'Construction waste intensity',
            unit: 'kg/m²',
            category: 'environmental',
            calculationMethod: 'Total waste generated / Built area',
            benchmarkAvailable: true,
            regulatoryRequired: false,
            griAlignment: ['GRI 306-2', 'GRI 15-4']
          }
        ],
        disclosures: [
          {
            code: 'GRI 15-4',
            title: 'Construction and demolition waste',
            description: 'Management of waste generated during construction, renovation, and demolition activities',
            requirements: [
              'Waste management strategy',
              'Waste reduction and diversion practices',
              'Circular economy initiatives'
            ],
            dataPoints: [
              { name: 'Total waste', type: 'quantitative', unit: 'tonnes', required: true, guidance: 'Total construction waste generated' },
              { name: 'Waste diverted', type: 'quantitative', unit: 'tonnes', required: true, guidance: 'Waste diverted from landfill' }
            ],
            reportingGuidance: 'Report on construction waste management practices and performance'
          }
        ]
      },
      {
        id: 'worker-safety-health',
        name: 'Worker safety and health',
        description: 'Protection of construction workers through comprehensive safety programs and health protection',
        griStandard: 'GRI 15',
        relevance: 'high',
        impactAreas: ['Social', 'Workers'],
        managementApproach: 'Implement zero-harm safety culture with continuous monitoring and improvement',
        metrics: [
          {
            id: 'total_recordable_incident_rate',
            name: 'Total Recordable Incident Rate (TRIR)',
            unit: 'per 200,000 hours',
            category: 'social',
            calculationMethod: 'Recordable incidents × 200,000 / Total work hours',
            benchmarkAvailable: true,
            regulatoryRequired: true,
            griAlignment: ['GRI 403-2', 'GRI 15-5']
          },
          {
            id: 'lost_time_injury_rate',
            name: 'Lost Time Injury Rate (LTIR)',
            unit: 'per 200,000 hours',
            category: 'social',
            calculationMethod: 'Lost time injuries × 200,000 / Total work hours',
            benchmarkAvailable: true,
            regulatoryRequired: true,
            griAlignment: ['GRI 403-2', 'GRI 15-5']
          }
        ],
        disclosures: [
          {
            code: 'GRI 15-5',
            title: 'Worker safety and health',
            description: 'Occupational health and safety management in construction operations',
            requirements: [
              'Safety management system',
              'Injury and illness statistics',
              'Safety training and awareness programs'
            ],
            dataPoints: [
              { name: 'Work-related injuries', type: 'quantitative', unit: 'number', required: true, guidance: 'Total recordable work-related injuries' },
              { name: 'Safety training hours', type: 'quantitative', unit: 'hours', required: false, guidance: 'Total safety training provided' }
            ],
            reportingGuidance: 'Report on occupational health and safety management and performance'
          }
        ]
      }
    ];
  }

  getRequiredDisclosures(): GRIDisclosure[] {
    const materialTopics = this.getMaterialTopics();
    const allDisclosures: GRIDisclosure[] = [];

    // Collect all disclosures from material topics
    materialTopics.forEach(topic => {
      allDisclosures.push(...topic.disclosures);
    });

    // Add universal GRI disclosures
    allDisclosures.push(
      {
        code: 'GRI 2-1',
        title: 'Organizational details',
        description: 'Basic organizational information',
        requirements: ['Organization name', 'Nature of activities', 'Location of headquarters'],
        dataPoints: [
          { name: 'Organization name', type: 'qualitative', required: true, guidance: 'Legal name of the organization' },
          { name: 'Construction activities', type: 'qualitative', required: true, guidance: 'Types of construction services' }
        ],
        reportingGuidance: 'Provide basic organizational details including construction activities'
      },
      {
        code: 'GRI 305-1',
        title: 'Direct (Scope 1) GHG emissions',
        description: 'Direct greenhouse gas emissions from construction operations',
        requirements: ['Gross direct GHG emissions in metric tons of CO2 equivalent'],
        dataPoints: [
          { name: 'Scope 1 emissions', type: 'quantitative', unit: 'tCO2e', required: true, guidance: 'Direct emissions from construction equipment and vehicles' }
        ],
        reportingGuidance: 'Report direct GHG emissions from construction activities and fleet operations'
      }
    );

    return allDisclosures;
  }

  getIndustryMetrics(): IndustryMetric[] {
    const materialTopics = this.getMaterialTopics();
    const allMetrics: IndustryMetric[] = [];

    materialTopics.forEach(topic => {
      allMetrics.push(...topic.metrics);
    });

    // Add additional construction-specific metrics
    allMetrics.push(
      {
        id: 'project_completion_time',
        name: 'Average project completion time variance',
        unit: '% vs planned',
        category: 'economic',
        calculationMethod: '(Actual time - Planned time) / Planned time',
        benchmarkAvailable: true,
        regulatoryRequired: false,
        griAlignment: ['GRI 2-6']
      },
      {
        id: 'cost_variance',
        name: 'Project cost variance',
        unit: '% vs budget',
        category: 'economic',
        calculationMethod: '(Actual cost - Budgeted cost) / Budgeted cost',
        benchmarkAvailable: true,
        regulatoryRequired: false,
        griAlignment: ['GRI 2-6']
      },
      {
        id: 'customer_satisfaction',
        name: 'Customer satisfaction score',
        unit: 'scale 1-10',
        category: 'social',
        calculationMethod: 'Average customer satisfaction rating',
        benchmarkAvailable: true,
        regulatoryRequired: false,
        griAlignment: ['GRI 2-6']
      }
    );

    return allMetrics;
  }

  getRegulatoryRequirements(jurisdiction: string): RegulatoryRequirement[] {
    const baseRequirements = [
      {
        id: 'tcfd-construction',
        name: 'Task Force on Climate-related Financial Disclosures',
        jurisdiction: 'global',
        applicableIndustries: ['construction'],
        effectiveDate: new Date('2017-06-29'),
        requirements: [
          'Climate governance disclosure',
          'Climate strategy and risk management',
          'Climate scenario analysis',
          'Climate metrics and targets'
        ],
        penalties: 'Regulatory scrutiny and investor pressure',
        griAlignment: ['GRI 201-2', 'GRI 305-1', 'GRI 305-2']
      }
    ];

    if (jurisdiction === 'US') {
      baseRequirements.push(
        {
          id: 'osha-construction',
          name: 'OSHA Construction Standards',
          jurisdiction: 'US',
          applicableIndustries: ['construction'],
          effectiveDate: new Date('1971-04-28'),
          requirements: [
            'Personal protective equipment requirements',
            'Fall protection systems',
            'Excavation and trenching safety',
            'Electrical safety standards',
            'Hazard communication program'
          ],
          penalties: 'Fines up to $156,259 per willful violation, potential criminal prosecution',
          griAlignment: ['GRI 403-2', 'GRI 15-5']
        },
        {
          id: 'energy-star-buildings',
          name: 'Energy Star for Buildings',
          jurisdiction: 'US',
          applicableIndustries: ['construction', 'real estate'],
          effectiveDate: new Date('1992-01-01'),
          requirements: [
            'Energy performance benchmarking',
            'Building energy efficiency certification',
            'Annual energy consumption reporting',
            'Energy management best practices'
          ],
          penalties: 'No direct penalties, but affects building marketability and compliance with local ordinances',
          griAlignment: ['GRI 302-3', 'GRI 15-2']
        }
      );
    }

    if (jurisdiction === 'EU') {
      baseRequirements.push(
        {
          id: 'eu-construction-products',
          name: 'EU Construction Products Regulation',
          jurisdiction: 'EU',
          applicableIndustries: ['construction'],
          effectiveDate: new Date('2013-07-01'),
          requirements: [
            'CE marking for construction products',
            'Declaration of performance',
            'Essential characteristics compliance',
            'Product safety and environmental impact assessment'
          ],
          penalties: 'Market withdrawal, fines up to 4% of annual turnover',
          griAlignment: ['GRI 15-3', 'GRI 15-1']
        },
        {
          id: 'eu-energy-performance-buildings',
          name: 'EU Energy Performance of Buildings Directive',
          jurisdiction: 'EU',
          applicableIndustries: ['construction', 'real estate'],
          effectiveDate: new Date('2010-07-09'),
          requirements: [
            'Energy performance certificates',
            'Minimum energy performance standards',
            'Nearly zero-energy building requirements',
            'Regular building inspections'
          ],
          penalties: 'Member state specific penalties, potential building restrictions',
          griAlignment: ['GRI 302-3', 'GRI 15-2']
        }
      );
    }

    return baseRequirements;
  }

  async calculateESGScore(data: Record<string, any>): Promise<{
    overall: number;
    environmental: number;
    social: number;
    governance: number;
    breakdown: Record<string, number>;
  }> {
    const scores = {
      environmental: 0,
      social: 0,
      governance: 0,
      breakdown: {} as Record<string, number>
    };

    // Environmental score (35% weight)
    let envScore = 50; // Base score

    if (data.energy_efficiency_rating !== undefined) {
      // Lower energy consumption is better (good: <100 kWh/m²/year, poor: >200 kWh/m²/year)
      const energyScore = Math.max(0, Math.min(100, 150 - data.energy_efficiency_rating * 0.5));
      envScore += (energyScore - 50) * 0.3;
      scores.breakdown['energy_efficiency_rating'] = energyScore;
    }

    if (data.waste_diversion_rate !== undefined) {
      // Higher diversion rate is better
      const wasteScore = Math.max(0, Math.min(100, data.waste_diversion_rate));
      envScore += (wasteScore - 50) * 0.3;
      scores.breakdown['waste_diversion_rate'] = wasteScore;
    }

    if (data.sustainable_materials_percentage !== undefined) {
      // Higher sustainable materials percentage is better
      const materialsScore = Math.max(0, Math.min(100, data.sustainable_materials_percentage));
      envScore += (materialsScore - 50) * 0.4;
      scores.breakdown['sustainable_materials_percentage'] = materialsScore;
    }

    scores.environmental = Math.max(0, Math.min(100, envScore));

    // Social score (40% weight)
    let socialScore = 50; // Base score

    if (data.total_recordable_incident_rate !== undefined) {
      // Lower TRIR is better (good: <2.0, poor: >8.0)
      const trirScore = Math.max(0, Math.min(100, 100 - data.total_recordable_incident_rate * 10));
      socialScore += (trirScore - 50) * 0.4;
      scores.breakdown['total_recordable_incident_rate'] = trirScore;
    }

    if (data.lost_time_injury_rate !== undefined) {
      // Lower LTIR is better (good: <1.0, poor: >4.0)
      const ltirScore = Math.max(0, Math.min(100, 100 - data.lost_time_injury_rate * 20));
      socialScore += (ltirScore - 50) * 0.3;
      scores.breakdown['lost_time_injury_rate'] = ltirScore;
    }

    if (data.customer_satisfaction !== undefined) {
      // Higher satisfaction is better (1-10 scale)
      const customerScore = Math.max(0, Math.min(100, data.customer_satisfaction * 10));
      socialScore += (customerScore - 50) * 0.3;
      scores.breakdown['customer_satisfaction'] = customerScore;
    }

    scores.social = Math.max(0, Math.min(100, socialScore));

    // Governance score (25% weight)
    let govScore = 50; // Base score

    if (data.building_code_compliance !== undefined) {
      // Higher compliance is better
      const complianceScore = Math.max(0, Math.min(100, data.building_code_compliance));
      govScore += (complianceScore - 50) * 0.4;
      scores.breakdown['building_code_compliance'] = complianceScore;
    }

    if (data.green_building_certifications !== undefined) {
      // Higher certification rate is better
      const certificationScore = Math.max(0, Math.min(100, data.green_building_certifications));
      govScore += (certificationScore - 50) * 0.3;
      scores.breakdown['green_building_certifications'] = certificationScore;
    }

    if (data.cost_variance !== undefined) {
      // Lower cost variance is better (good: <5%, poor: >20%)
      const costScore = Math.max(0, Math.min(100, 100 - Math.abs(data.cost_variance) * 4));
      govScore += (costScore - 50) * 0.3;
      scores.breakdown['cost_variance'] = costScore;
    }

    scores.governance = Math.max(0, Math.min(100, govScore));

    // Calculate overall score with weights
    const overall = (
      scores.environmental * 0.35 +
      scores.social * 0.4 +
      scores.governance * 0.25
    );

    return {
      overall: Math.round(overall),
      environmental: Math.round(scores.environmental),
      social: Math.round(scores.social),
      governance: Math.round(scores.governance),
      breakdown: scores.breakdown
    };
  }

  async getBenchmarks(region: string = 'global'): Promise<IndustryBenchmark[]> {
    return [
      {
        metricId: 'total_recordable_incident_rate',
        industry: 'Construction',
        region,
        year: 2024,
        percentiles: { p10: 1.2, p25: 2.1, p50: 3.5, p75: 5.2, p90: 8.0 },
        average: 4.1,
        sampleSize: 200,
        leaders: ['Turner Construction', 'Skanska', 'Bechtel']
      },
      {
        metricId: 'energy_efficiency_rating',
        industry: 'Construction',
        region,
        year: 2024,
        percentiles: { p10: 80, p25: 110, p50: 140, p75: 180, p90: 220 },
        average: 145,
        sampleSize: 150,
        leaders: ['AECOM', 'Jacobs', 'Fluor']
      },
      {
        metricId: 'waste_diversion_rate',
        industry: 'Construction',
        region,
        year: 2024,
        percentiles: { p10: 25, p25: 45, p50: 65, p75: 80, p90: 90 },
        average: 62,
        sampleSize: 120,
        leaders: ['DPR Construction', 'Clark Construction', 'McCarthy']
      }
    ];
  }

  async compareToPeers(organizationData: Record<string, any>, peerData: Array<Record<string, any>>): Promise<PeerComparison> {
    if (peerData.length === 0) {
      return this.getDefaultPeerComparison();
    }

    const benchmarks = await this.getBenchmarks();
    const industryAverage: Record<string, number> = {};
    const percentileRank: Record<string, number> = {};

    benchmarks.forEach(benchmark => {
      industryAverage[benchmark.metricId] = benchmark.average;
      
      const orgValue = organizationData[benchmark.metricId];
      if (orgValue !== undefined) {
        const percentiles = Object.values(benchmark.percentiles).sort((a, b) => a - b);
        let rank = 0;
        for (let i = 0; i < percentiles.length; i++) {
          if (orgValue <= percentiles[i]) {
            rank = (i / (percentiles.length - 1)) * 100;
            break;
          }
        }
        percentileRank[benchmark.metricId] = Math.round(rank);
      }
    });

    const improvementOpportunities: string[] = [];
    
    if (organizationData.total_recordable_incident_rate > 5.0) {
      improvementOpportunities.push('Critical: Implement enhanced safety training and hazard prevention programs');
    }
    
    if (organizationData.waste_diversion_rate < 50) {
      improvementOpportunities.push('High: Improve construction waste management and recycling programs');
    }
    
    if (organizationData.energy_efficiency_rating > 160) {
      improvementOpportunities.push('Medium: Implement energy-efficient building design and technologies');
    }

    return {
      industryAverage,
      percentileRank,
      topPerformers: benchmarks.map(b => ({
        companyId: b.leaders[0] || 'unknown',
        name: b.leaders[0] || 'Industry Leader',
        metrics: { [b.metricId]: b.percentiles.p90 }
      })),
      improvementOpportunities
    };
  }

  async generateRecommendations(currentPerformance: Record<string, any>, benchmarks: IndustryBenchmark[]): Promise<IndustryRecommendation[]> {
    const recommendations: IndustryRecommendation[] = [];

    // Safety recommendations
    if (currentPerformance.total_recordable_incident_rate > 4.0) {
      recommendations.push({
        type: 'compliance',
        priority: 'critical',
        title: 'Enhance Construction Safety Program',
        description: 'Implement comprehensive safety management system with daily safety briefings, hazard identification, and incident prevention protocols',
        impact: 'Reduce injury risk, improve regulatory compliance, lower insurance costs',
        effort: 'medium',
        griAlignment: ['GRI 403-2', 'GRI 15-5'],
        estimatedCost: 500000,
        estimatedTimeline: '6-9 months'
      });
    }

    // Environmental recommendations
    if (currentPerformance.waste_diversion_rate < 60) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Implement Circular Construction Practices',
        description: 'Deploy comprehensive waste reduction, reuse, and recycling programs with material recovery tracking',
        impact: 'Reduce waste disposal costs, improve environmental performance, enhance sustainability credentials',
        effort: 'medium',
        griAlignment: ['GRI 306-2', 'GRI 15-4'],
        estimatedCost: 200000,
        estimatedTimeline: '3-6 months'
      });
    }

    // Energy efficiency recommendations
    if (currentPerformance.energy_efficiency_rating > 150) {
      recommendations.push({
        type: 'strategic',
        priority: 'high',
        title: 'Accelerate Green Building Adoption',
        description: 'Integrate high-performance building design standards and pursue green building certifications (LEED, BREEAM)',
        impact: 'Reduce operational costs, improve market competitiveness, attract ESG-conscious clients',
        effort: 'high',
        griAlignment: ['GRI 302-3', 'GRI 15-2'],
        estimatedCost: 1000000,
        estimatedTimeline: '12-18 months'
      });
    }

    // Quality and compliance recommendations
    if (currentPerformance.building_code_compliance < 95) {
      recommendations.push({
        type: 'compliance',
        priority: 'high',
        title: 'Strengthen Quality Assurance Systems',
        description: 'Implement robust quality management system with regular inspections and compliance monitoring',
        impact: 'Reduce rework costs, improve customer satisfaction, ensure regulatory compliance',
        effort: 'medium',
        griAlignment: ['GRI 15-1'],
        estimatedCost: 300000,
        estimatedTimeline: '6-12 months'
      });
    }

    return recommendations;
  }

  async validateData(data: Record<string, any>): Promise<{ isValid: boolean; errors: string[]; warnings: string[]; }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required metrics validation
    const requiredMetrics = ['total_recordable_incident_rate', 'building_code_compliance'];
    
    for (const metric of requiredMetrics) {
      if (data[metric] === undefined || data[metric] === null) {
        errors.push(`Missing required metric: ${metric}`);
      }
    }

    // Value range validation
    if (data.total_recordable_incident_rate !== undefined) {
      if (data.total_recordable_incident_rate < 0) {
        errors.push('Total recordable incident rate cannot be negative');
      } else if (data.total_recordable_incident_rate > 15) {
        warnings.push('Total recordable incident rate is exceptionally high - safety review recommended');
      }
    }

    if (data.building_code_compliance !== undefined) {
      if (data.building_code_compliance < 0 || data.building_code_compliance > 100) {
        errors.push('Building code compliance must be between 0 and 100%');
      } else if (data.building_code_compliance < 90) {
        warnings.push('Building code compliance is below industry expectations');
      }
    }

    if (data.waste_diversion_rate !== undefined) {
      if (data.waste_diversion_rate < 0 || data.waste_diversion_rate > 100) {
        errors.push('Waste diversion rate must be between 0 and 100%');
      }
    }

    if (data.energy_efficiency_rating !== undefined) {
      if (data.energy_efficiency_rating < 0) {
        errors.push('Energy efficiency rating cannot be negative');
      } else if (data.energy_efficiency_rating > 300) {
        warnings.push('Energy efficiency rating is very high - building performance review recommended');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  getReportingGuidance(): string {
    return `
# Construction and Real Estate (GRI 15) Reporting Guidance

## Overview
As a construction and real estate organization, you must report under GRI 15 sector standard which addresses the unique sustainability challenges in building design, construction, and operation.

## Key Reporting Requirements

### Building Safety and Quality (GRI 15-1)
- **Safety Management**: Describe your construction safety management system and protocols
- **Quality Assurance**: Report on quality control processes and building code compliance
- **Incident Reporting**: Disclose construction safety incidents and corrective actions

### Sustainable Design and Construction (GRI 15-2)
- **Green Building Standards**: Report on sustainable design principles and certifications pursued
- **Energy Performance**: Disclose building energy efficiency and performance targets
- **Innovation**: Describe innovative sustainable construction technologies and practices

### Materials Sourcing (GRI 15-3)
- **Procurement Policies**: Detail sustainable materials sourcing criteria and supplier requirements
- **Local Sourcing**: Report on local materials usage and supplier engagement
- **Environmental Impact**: Assess and report on materials environmental footprint

### Construction and Demolition Waste (GRI 15-4)
- **Waste Management**: Describe waste reduction, reuse, and recycling strategies
- **Circular Economy**: Report on circular construction practices and material recovery
- **Performance Metrics**: Disclose waste generation and diversion rates

### Worker Safety and Health (GRI 15-5)
- **Safety Programs**: Detail occupational health and safety management systems
- **Training and Awareness**: Report on safety training programs and worker engagement
- **Performance Indicators**: Disclose injury rates and safety performance metrics

## Industry-Specific Considerations
- **Building Lifecycle**: Address sustainability throughout design, construction, operation, and end-of-life
- **Supply Chain**: Focus on responsible sourcing and supplier sustainability requirements
- **Community Impact**: Report on local community engagement and development programs
- **Climate Resilience**: Address adaptation measures and resilient design principles

## Best Practices
- Align with recognized green building standards (LEED, BREEAM, WELL)
- Implement integrated design processes with sustainability from project inception
- Engage stakeholders throughout the building lifecycle
- Use performance-based metrics and continuous improvement approaches
- Provide case studies of exemplary sustainable projects

## Sector-Specific Metrics
Focus on metrics that reflect construction's unique impacts:
- Safety performance (injury rates, safety culture indicators)
- Environmental performance (energy efficiency, waste diversion, sustainable materials)
- Quality and compliance (building code compliance, customer satisfaction)
- Innovation (green building certifications, sustainable technology adoption)

This guidance ensures comprehensive reporting that meets stakeholder expectations and demonstrates leadership in sustainable construction practices.
    `.trim();
  }
}