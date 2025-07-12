/**
 * GRI 12 Coal Sector Model
 * Comprehensive implementation of GRI 12 sector standard for coal companies
 */

import { IndustryModel } from '../base-model';
import {
  IndustryClassification,
  MaterialTopic,
  GRIDisclosure,
  IndustryMetric,
  IndustryBenchmark,
  RegulatoryRequirement,
  PeerComparison,
  IndustryRecommendation,
  GRISectorStandard,
  DataPoint
} from '../types';

export class CoalGRI12Model extends IndustryModel {
  constructor() {
    super({
      industryName: 'Coal',
      griStandards: [GRISectorStandard.GRI_12_COAL],
      naicsCodes: ['2121', '212111', '212112', '212113'],
      sicCodes: ['1221', '1222', '1231'],
      materialTopics: [
        'climate-adaptation',
        'air-emissions',
        'biodiversity',
        'waste',
        'water-marine-resources',
        'closure-rehabilitation',
        'critical-incident-management',
        'occupational-health-safety',
        'employment-practices',
        'non-discrimination',
        'forced-labor',
        'freedom-association',
        'rights-indigenous-peoples',
        'local-communities',
        'land-resource-rights',
        'conflict-security',
        'anti-corruption',
        'anti-competitive-behavior',
        'payments-governments',
        'public-policy'
      ],
      specificMetrics: this.defineIndustryMetrics(),
      regulatoryFrameworks: ['EU-ETS', 'MSHA', 'NPDES', 'CAA', 'SMCRA'],
      certifications: ['ISO-14001', 'ISO-45001', 'ISO-50001']
    });
  }

  /**
   * Define coal industry-specific metrics
   */
  private defineIndustryMetrics(): IndustryMetric[] {
    return [
      // Environmental metrics
      {
        id: 'ghg_intensity_coal',
        name: 'Coal GHG Intensity',
        unit: 'tCO2e/tonne coal',
        category: 'environmental',
        calculationMethod: 'Total GHG emissions / Coal production volume',
        benchmarkAvailable: true,
        regulatoryRequired: true,
        griAlignment: ['GRI 305-4', 'GRI 12.2.1']
      },
      {
        id: 'methane_emissions_coal',
        name: 'Coal Mine Methane Emissions',
        unit: 'tCO2e',
        category: 'environmental',
        calculationMethod: 'Direct measurement or emission factors per IPCC guidelines',
        benchmarkAvailable: true,
        regulatoryRequired: true,
        griAlignment: ['GRI 305-1', 'GRI 12.2.2']
      },
      {
        id: 'methane_capture_rate',
        name: 'Methane Capture Rate',
        unit: '%',
        category: 'environmental',
        calculationMethod: 'Methane captured / Total methane emissions',
        benchmarkAvailable: true,
        regulatoryRequired: false,
        griAlignment: ['GRI 12.2.2']
      },
      {
        id: 'air_quality_index',
        name: 'Local Air Quality Impact',
        unit: 'AQI points',
        category: 'environmental',
        calculationMethod: 'Particulate matter impact on local air quality',
        benchmarkAvailable: false,
        regulatoryRequired: true,
        griAlignment: ['GRI 305-7', 'GRI 12.3.2']
      },
      {
        id: 'land_disturbed',
        name: 'Land Disturbed',
        unit: 'hectares',
        category: 'environmental',
        calculationMethod: 'Total area of land disturbed for mining activities',
        benchmarkAvailable: true,
        regulatoryRequired: true,
        griAlignment: ['GRI 304-1', 'GRI 12.4.3']
      },
      {
        id: 'land_rehabilitated',
        name: 'Land Rehabilitated',
        unit: 'hectares',
        category: 'environmental',
        calculationMethod: 'Area of disturbed land successfully rehabilitated',
        benchmarkAvailable: true,
        regulatoryRequired: true,
        griAlignment: ['GRI 304-3', 'GRI 12.6.5']
      },
      {
        id: 'rehabilitation_provision',
        name: 'Rehabilitation Financial Provision',
        unit: 'USD millions',
        category: 'economic',
        calculationMethod: 'Total financial provision for mine closure and rehabilitation',
        benchmarkAvailable: false,
        regulatoryRequired: true,
        griAlignment: ['GRI 12.6.2']
      },
      {
        id: 'coal_ash_generated',
        name: 'Coal Ash Generated',
        unit: 'tonnes',
        category: 'environmental',
        calculationMethod: 'Total coal combustion ash and byproducts generated',
        benchmarkAvailable: true,
        regulatoryRequired: true,
        griAlignment: ['GRI 306-3', 'GRI 12.5.4']
      },
      {
        id: 'acid_mine_drainage',
        name: 'Acid Mine Drainage Incidents',
        unit: 'count',
        category: 'environmental',
        calculationMethod: 'Number of acid mine drainage incidents requiring remediation',
        benchmarkAvailable: false,
        regulatoryRequired: true,
        griAlignment: ['GRI 303-3', 'GRI 12.7.3']
      },
      
      // Safety metrics
      {
        id: 'fatality_rate_coal',
        name: 'Fatality Rate',
        unit: 'per million hours',
        category: 'social',
        calculationMethod: 'Work-related fatalities per million hours worked',
        benchmarkAvailable: true,
        regulatoryRequired: true,
        griAlignment: ['GRI 403-2', 'GRI 12.8.2']
      },
      {
        id: 'injury_frequency_rate',
        name: 'Injury Frequency Rate',
        unit: 'per million hours',
        category: 'social',
        calculationMethod: 'Lost time injuries per million hours worked',
        benchmarkAvailable: true,
        regulatoryRequired: true,
        griAlignment: ['GRI 403-9', 'GRI 12.8.3']
      },
      {
        id: 'coal_workers_pneumoconiosis',
        name: 'Coal Workers Pneumoconiosis Cases',
        unit: 'count',
        category: 'social',
        calculationMethod: 'New cases of coal workers pneumoconiosis diagnosed',
        benchmarkAvailable: false,
        regulatoryRequired: true,
        griAlignment: ['GRI 403-10', 'GRI 12.8.4']
      },
      
      // Social metrics
      {
        id: 'mine_closure_jobs',
        name: 'Mine Closure Job Transition',
        unit: '%',
        category: 'social',
        calculationMethod: 'Percentage of workers successfully transitioned to new employment',
        benchmarkAvailable: false,
        regulatoryRequired: false,
        griAlignment: ['GRI 401-1', 'GRI 12.9.3']
      },
      {
        id: 'community_investment',
        name: 'Community Investment',
        unit: 'USD per capita',
        category: 'social',
        calculationMethod: 'Community development investment per local resident',
        benchmarkAvailable: false,
        regulatoryRequired: false,
        griAlignment: ['GRI 413-1', 'GRI 12.15.4']
      }
    ];
  }

  /**
   * Get material topics for coal industry
   */
  getMaterialTopics(): MaterialTopic[] {
    return [
      {
        id: 'gri12-climate',
        name: 'Climate adaptation, resilience, and transition',
        description: 'Managing transition away from coal in line with climate commitments',
        griStandard: 'GRI 12.2',
        relevance: 'high',
        impactAreas: ['Environment', 'Economy', 'Society'],
        managementApproach: 'Develop transition strategy, invest in clean technologies, support worker retraining',
        metrics: this.config.specificMetrics.filter(m => 
          ['ghg_intensity_coal', 'methane_emissions_coal', 'methane_capture_rate'].includes(m.id)
        ),
        disclosures: this.getClimateDisclosures()
      },
      {
        id: 'gri12-air',
        name: 'Air emissions',
        description: 'Management of particulate matter and other air pollutants',
        griStandard: 'GRI 12.3',
        relevance: 'high',
        impactAreas: ['Environment', 'Health'],
        managementApproach: 'Install emission controls, monitor air quality, reduce fugitive dust',
        metrics: this.config.specificMetrics.filter(m => 
          ['air_quality_index'].includes(m.id)
        ),
        disclosures: this.getAirEmissionDisclosures()
      },
      {
        id: 'gri12-biodiversity',
        name: 'Biodiversity',
        description: 'Impacts on ecosystems from mining and coal combustion',
        griStandard: 'GRI 12.4',
        relevance: 'high',
        impactAreas: ['Environment'],
        managementApproach: 'Conduct impact assessments, implement avoidance and mitigation measures',
        metrics: this.config.specificMetrics.filter(m => 
          ['land_disturbed', 'land_rehabilitated'].includes(m.id)
        ),
        disclosures: this.getBiodiversityDisclosures()
      },
      {
        id: 'gri12-waste',
        name: 'Waste',
        description: 'Management of coal ash, overburden, and mining waste',
        griStandard: 'GRI 12.5',
        relevance: 'high',
        impactAreas: ['Environment'],
        managementApproach: 'Minimize waste generation, ensure safe disposal, explore beneficial reuse',
        metrics: this.config.specificMetrics.filter(m => 
          ['coal_ash_generated'].includes(m.id)
        ),
        disclosures: this.getWasteDisclosures()
      },
      {
        id: 'gri12-closure',
        name: 'Closure and rehabilitation',
        description: 'Mine closure planning and site rehabilitation',
        griStandard: 'GRI 12.6',
        relevance: 'high',
        impactAreas: ['Environment', 'Community'],
        managementApproach: 'Develop comprehensive closure plans, ensure adequate financial provisions',
        metrics: this.config.specificMetrics.filter(m => 
          ['rehabilitation_provision', 'land_rehabilitated'].includes(m.id)
        ),
        disclosures: this.getClosureDisclosures()
      },
      {
        id: 'gri12-water',
        name: 'Water and marine resources',
        description: 'Water consumption and quality impacts from coal operations',
        griStandard: 'GRI 12.7',
        relevance: 'high',
        impactAreas: ['Environment', 'Community'],
        managementApproach: 'Minimize water use, prevent contamination, treat acid mine drainage',
        metrics: this.config.specificMetrics.filter(m => 
          ['acid_mine_drainage'].includes(m.id)
        ),
        disclosures: this.getWaterDisclosures()
      },
      {
        id: 'gri12-health-safety',
        name: 'Occupational health and safety',
        description: 'Protection of coal workers from occupational hazards',
        griStandard: 'GRI 12.8',
        relevance: 'high',
        impactAreas: ['Social'],
        managementApproach: 'Implement comprehensive safety management, prevent occupational diseases',
        metrics: this.config.specificMetrics.filter(m => 
          ['fatality_rate_coal', 'injury_frequency_rate', 'coal_workers_pneumoconiosis'].includes(m.id)
        ),
        disclosures: this.getHealthSafetyDisclosures()
      },
      {
        id: 'gri12-employment',
        name: 'Employment practices',
        description: 'Managing workforce through energy transition',
        griStandard: 'GRI 12.9',
        relevance: 'high',
        impactAreas: ['Social', 'Economic'],
        managementApproach: 'Support just transition, provide retraining, ensure fair employment practices',
        metrics: this.config.specificMetrics.filter(m => 
          ['mine_closure_jobs'].includes(m.id)
        ),
        disclosures: this.getEmploymentDisclosures()
      },
      {
        id: 'gri12-communities',
        name: 'Local communities',
        description: 'Impacts on communities dependent on coal industry',
        griStandard: 'GRI 12.15',
        relevance: 'high',
        impactAreas: ['Social', 'Economic'],
        managementApproach: 'Support economic diversification, invest in community development',
        metrics: this.config.specificMetrics.filter(m => 
          ['community_investment'].includes(m.id)
        ),
        disclosures: this.getCommunityDisclosures()
      }
    ];
  }

  /**
   * Get required GRI disclosures
   */
  getRequiredDisclosures(): GRIDisclosure[] {
    const disclosures: GRIDisclosure[] = [];
    
    this.getMaterialTopics().forEach(topic => {
      disclosures.push(...topic.disclosures);
    });

    disclosures.push(...this.getUniversalDisclosures());

    return disclosures;
  }

  /**
   * Get industry-specific metrics
   */
  getIndustryMetrics(): IndustryMetric[] {
    return this.config.specificMetrics;
  }

  /**
   * Get regulatory requirements by jurisdiction
   */
  getRegulatoryRequirements(jurisdiction: string): RegulatoryRequirement[] {
    const requirements: RegulatoryRequirement[] = [];

    if (jurisdiction === 'US' || jurisdiction === 'global') {
      requirements.push({
        id: 'msha',
        name: 'Mine Safety and Health Administration Standards',
        jurisdiction: 'US',
        applicableIndustries: ['Coal'],
        effectiveDate: new Date('1977-11-09'),
        requirements: [
          'Conduct regular safety inspections',
          'Maintain dust control standards',
          'Report accidents and injuries',
          'Provide safety training'
        ],
        penalties: 'Up to $70,000 per violation, criminal penalties for willful violations',
        griAlignment: ['GRI 403-1', 'GRI 403-9', 'GRI 12.8.2'],
        complianceDeadline: new Date('2025-12-31')
      });

      requirements.push({
        id: 'smcra',
        name: 'Surface Mining Control and Reclamation Act',
        jurisdiction: 'US',
        applicableIndustries: ['Coal'],
        effectiveDate: new Date('1977-08-03'),
        requirements: [
          'Obtain mining permits',
          'Post reclamation bonds',
          'Restore disturbed land',
          'Protect water resources'
        ],
        penalties: 'Civil penalties up to $10,000 per day per violation',
        griAlignment: ['GRI 304-3', 'GRI 12.6.2', 'GRI 12.6.5'],
        complianceDeadline: new Date('2025-12-31')
      });
    }

    if (jurisdiction === 'EU' || jurisdiction === 'global') {
      requirements.push({
        id: 'eu-ets-coal',
        name: 'EU ETS for Coal Power Plants',
        jurisdiction: 'EU',
        applicableIndustries: ['Coal'],
        effectiveDate: new Date('2005-01-01'),
        requirements: [
          'Monitor and report CO2 emissions',
          'Surrender emission allowances',
          'Participate in carbon market',
          'Phase out by 2030 (some countries)'
        ],
        penalties: '€100 per tCO2e excess emissions',
        griAlignment: ['GRI 305-1', 'GRI 305-2', 'GRI 12.2.1'],
        complianceDeadline: new Date('2030-12-31')
      });
    }

    return requirements;
  }

  /**
   * Calculate industry-specific ESG score
   */
  async calculateESGScore(data: Record<string, any>): Promise<{
    overall: number;
    environmental: number;
    social: number;
    governance: number;
    breakdown: Record<string, number>;
  }> {
    const weights = {
      environmental: 0.50, // Higher weight due to climate impact
      social: 0.35,
      governance: 0.15
    };

    // Environmental score calculation
    const envScores = {
      ghgIntensity: this.scoreGHGIntensity(data.ghg_intensity_coal),
      methaneManagement: this.scoreMethaneManagement(data.methane_capture_rate),
      landRehabilitation: this.scoreLandRehabilitation(data.land_rehabilitated, data.land_disturbed),
      wasteManagement: this.scoreWasteManagement(data.coal_ash_generated),
      waterProtection: this.scoreWaterProtection(data.acid_mine_drainage)
    };

    const environmental = this.weightedAverage(envScores, {
      ghgIntensity: 0.30,
      methaneManagement: 0.25,
      landRehabilitation: 0.20,
      wasteManagement: 0.15,
      waterProtection: 0.10
    });

    // Social score calculation
    const socialScores = {
      safety: this.scoreSafety(data.fatality_rate_coal, data.injury_frequency_rate),
      healthProtection: this.scoreHealthProtection(data.coal_workers_pneumoconiosis),
      justTransition: this.scoreJustTransition(data.mine_closure_jobs),
      communitySupport: this.scoreCommunitySupport(data.community_investment),
      employment: data.employment_practices_score || 0.6
    };

    const social = this.weightedAverage(socialScores, {
      safety: 0.35,
      healthProtection: 0.25,
      justTransition: 0.20,
      communitySupport: 0.15,
      employment: 0.05
    });

    // Governance score calculation
    const govScores = {
      transitionStrategy: data.transition_strategy_score || 0.5,
      transparency: data.transparency_score || 0.7,
      compliance: data.regulatory_compliance_score || 0.8,
      stakeholderEngagement: data.stakeholder_engagement_score || 0.6
    };

    const governance = this.weightedAverage(govScores, {
      transitionStrategy: 0.35,
      transparency: 0.25,
      compliance: 0.25,
      stakeholderEngagement: 0.15
    });

    const overall = (
      environmental * weights.environmental +
      social * weights.social +
      governance * weights.governance
    );

    return {
      overall,
      environmental,
      social,
      governance,
      breakdown: {
        ...envScores,
        ...socialScores,
        ...govScores
      }
    };
  }

  /**
   * Get peer benchmarks
   */
  async getBenchmarks(region?: string): Promise<IndustryBenchmark[]> {
    return [
      {
        metricId: 'ghg_intensity_coal',
        industry: 'Coal',
        region: region || 'global',
        year: 2024,
        percentiles: {
          p10: 0.85,
          p25: 1.02,
          p50: 1.25,
          p75: 1.48,
          p90: 1.75
        },
        average: 1.31,
        sampleSize: 85,
        leaders: ['company1', 'company2', 'company3']
      },
      {
        metricId: 'methane_capture_rate',
        industry: 'Coal',
        region: region || 'global',
        year: 2024,
        percentiles: {
          p10: 45,
          p25: 60,
          p50: 75,
          p75: 85,
          p90: 92
        },
        average: 73,
        sampleSize: 65,
        leaders: ['company4', 'company5', 'company6']
      },
      {
        metricId: 'fatality_rate_coal',
        industry: 'Coal',
        region: region || 'global',
        year: 2024,
        percentiles: {
          p10: 0.02,
          p25: 0.05,
          p50: 0.08,
          p75: 0.12,
          p90: 0.18
        },
        average: 0.09,
        sampleSize: 120,
        leaders: ['company7', 'company8', 'company9']
      }
    ];
  }

  /**
   * Perform peer comparison
   */
  async compareToPeers(
    organizationData: Record<string, any>,
    peerData: Array<Record<string, any>>
  ): Promise<PeerComparison> {
    const metrics = ['ghg_intensity_coal', 'methane_capture_rate', 'fatality_rate_coal', 'land_rehabilitated'];
    const industryAverage: Record<string, number> = {};
    const percentileRank: Record<string, number> = {};

    for (const metric of metrics) {
      const orgValue = organizationData[metric];
      const peerValues = peerData.map(p => p[metric]).filter(v => v !== undefined);
      
      if (peerValues.length > 0) {
        industryAverage[metric] = peerValues.reduce((a, b) => a + b, 0) / peerValues.length;
        
        const belowOrg = peerValues.filter(v => v <= orgValue).length;
        percentileRank[metric] = (belowOrg / peerValues.length) * 100;
      }
    }

    const topPerformers = peerData
      .map(peer => ({
        companyId: peer.id,
        name: peer.name,
        score: this.calculatePeerScore(peer),
        metrics: {
          ghg_intensity: peer.ghg_intensity_coal,
          methane_capture: peer.methane_capture_rate,
          safety: peer.fatality_rate_coal
        }
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const improvementOpportunities = this.identifyImprovementAreas(
      organizationData,
      industryAverage,
      percentileRank
    );

    return {
      industryAverage,
      percentileRank,
      topPerformers,
      improvementOpportunities
    };
  }

  /**
   * Generate industry-specific recommendations
   */
  async generateRecommendations(
    currentPerformance: Record<string, any>,
    benchmarks: IndustryBenchmark[]
  ): Promise<IndustryRecommendation[]> {
    const recommendations: IndustryRecommendation[] = [];

    // Transition strategy
    if (!currentPerformance.transition_strategy || currentPerformance.transition_strategy_score < 0.6) {
      recommendations.push({
        type: 'strategic',
        priority: 'critical',
        title: 'Develop Just Transition Strategy',
        description: 'Create comprehensive plan for transitioning away from coal operations while supporting affected workers and communities.',
        impact: 'Essential for long-term viability and regulatory compliance',
        effort: 'high',
        griAlignment: ['GRI 12.2.1', 'GRI 12.9.3'],
        estimatedCost: 10000000,
        estimatedTimeline: '24-36 months'
      });
    }

    // Methane management
    const methaneBenchmark = benchmarks.find(b => b.metricId === 'methane_capture_rate');
    if (methaneBenchmark && currentPerformance.methane_capture_rate < methaneBenchmark.percentiles.p50) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Improve Methane Capture Systems',
        description: 'Install or upgrade ventilation air methane (VAM) systems and coal mine methane (CMM) capture.',
        impact: 'Reduce GHG emissions by 30-50% and potentially generate revenue',
        effort: 'medium',
        griAlignment: ['GRI 305-1', 'GRI 12.2.2'],
        estimatedCost: 3000000,
        estimatedTimeline: '12-18 months'
      });
    }

    // Safety improvements
    if (currentPerformance.fatality_rate_coal > 0.1) {
      recommendations.push({
        type: 'compliance',
        priority: 'critical',
        title: 'Enhance Mine Safety Program',
        description: 'Implement advanced safety technologies, improve training, and strengthen safety culture.',
        impact: 'Prevent fatalities and injuries, ensure regulatory compliance',
        effort: 'high',
        griAlignment: ['GRI 403-1', 'GRI 12.8.2'],
        estimatedCost: 2000000,
        estimatedTimeline: '6-12 months'
      });
    }

    // Land rehabilitation
    const rehabilitationRate = currentPerformance.land_rehabilitated / currentPerformance.land_disturbed;
    if (rehabilitationRate < 0.8) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Accelerate Land Rehabilitation',
        description: 'Increase rehabilitation activities and improve success rates using best practices.',
        impact: 'Meet regulatory requirements and improve community relations',
        effort: 'medium',
        griAlignment: ['GRI 304-3', 'GRI 12.6.5'],
        estimatedCost: 5000000,
        estimatedTimeline: '18-24 months'
      });
    }

    return recommendations;
  }

  /**
   * Validate data against industry standards
   */
  async validateData(data: Record<string, any>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required metrics validation
    const requiredMetrics = [
      'ghg_intensity_coal',
      'methane_emissions_coal',
      'land_disturbed',
      'fatality_rate_coal'
    ];

    for (const metric of requiredMetrics) {
      if (data[metric] === undefined || data[metric] === null) {
        errors.push(`Missing required metric: ${metric}`);
      }
    }

    // Value validation
    if (data.ghg_intensity_coal !== undefined && data.ghg_intensity_coal < 0) {
      errors.push('GHG intensity cannot be negative');
    }

    if (data.methane_capture_rate !== undefined && (data.methane_capture_rate < 0 || data.methane_capture_rate > 100)) {
      errors.push('Methane capture rate must be between 0 and 100%');
    }

    // Warnings
    if (data.fatality_rate_coal > 0.15) {
      warnings.push('Fatality rate is very high - immediate safety review required');
    }

    if (data.coal_workers_pneumoconiosis > 0) {
      warnings.push('Coal workers pneumoconiosis cases detected - enhance health monitoring');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get reporting guidance
   */
  getReportingGuidance(): string {
    return `
Coal Sector Reporting Guidance (GRI 12):

1. Climate and Transition:
   - Report strategy for transitioning away from coal
   - Include scenario analysis aligned with Paris Agreement
   - Disclose stranded asset risks and mitigation plans
   - Report progress on emission reduction targets

2. Methane Management:
   - Report total methane emissions using IPCC methodology
   - Disclose methane capture and utilization rates
   - Include plans for improving capture efficiency
   - Report on ventilation air methane (VAM) projects

3. Mine Safety and Health:
   - Report fatality and injury rates per standard definitions
   - Include data on occupational diseases (pneumoconiosis)
   - Describe safety management systems and culture programs
   - Report on emergency preparedness and response

4. Environmental Management:
   - Report on land disturbance and rehabilitation
   - Include water quality monitoring results
   - Disclose coal ash management practices
   - Report biodiversity impact assessments

5. Closure and Rehabilitation:
   - Disclose closure plans for all operations
   - Report financial provisions for rehabilitation
   - Include post-closure monitoring commitments
   - Describe stakeholder engagement in closure planning

6. Just Transition:
   - Report on workforce transition support
   - Include community economic diversification initiatives
   - Disclose retraining and reskilling programs
   - Report on social dialogue with unions and communities

7. Regulatory Compliance:
   - Report compliance with MSHA standards (US)
   - Include SMCRA compliance status (US)
   - Report EU ETS compliance (EU)
   - Disclose any regulatory violations or penalties

Remember: Coal companies face unique transition challenges. Transparency about phase-out plans, worker support, and community impact is essential for stakeholder trust.
    `;
  }

  /**
   * Check custom applicability
   */
  protected async checkCustomApplicability(
    classification: IndustryClassification
  ): Promise<boolean> {
    if (classification.customCode) {
      const coalKeywords = ['coal', 'mining', 'lignite', 'anthracite', 'bituminous'];
      return coalKeywords.some(keyword => 
        classification.customCode.toLowerCase().includes(keyword)
      );
    }
    return false;
  }

  // Scoring helper methods
  private scoreGHGIntensity(value: number): number {
    if (value <= 0.8) return 1.0;
    if (value <= 1.1) return 0.8;
    if (value <= 1.4) return 0.6;
    if (value <= 1.7) return 0.4;
    return 0.2;
  }

  private scoreMethaneManagement(captureRate: number): number {
    if (captureRate >= 90) return 1.0;
    if (captureRate >= 75) return 0.8;
    if (captureRate >= 60) return 0.6;
    if (captureRate >= 40) return 0.4;
    return 0.2;
  }

  private scoreLandRehabilitation(rehabilitated: number, disturbed: number): number {
    if (!disturbed || disturbed === 0) return 0.5;
    const rate = rehabilitated / disturbed;
    if (rate >= 0.9) return 1.0;
    if (rate >= 0.8) return 0.8;
    if (rate >= 0.7) return 0.6;
    if (rate >= 0.5) return 0.4;
    return 0.2;
  }

  private scoreWasteManagement(ashGenerated: number): number {
    // Score based on ash utilization rate (assumed in data)
    // Lower ash generation per unit coal is better
    if (ashGenerated <= 100) return 1.0;
    if (ashGenerated <= 500) return 0.8;
    if (ashGenerated <= 1000) return 0.6;
    if (ashGenerated <= 2000) return 0.4;
    return 0.2;
  }

  private scoreWaterProtection(incidents: number): number {
    if (incidents === 0) return 1.0;
    if (incidents <= 1) return 0.8;
    if (incidents <= 3) return 0.6;
    if (incidents <= 5) return 0.4;
    return 0.2;
  }

  private scoreSafety(fatalityRate: number, injuryRate: number): number {
    let score = 0;
    
    // Fatality rate scoring (70% weight)
    if (fatalityRate === 0) score += 0.7;
    else if (fatalityRate <= 0.05) score += 0.56;
    else if (fatalityRate <= 0.1) score += 0.42;
    else if (fatalityRate <= 0.15) score += 0.28;
    else score += 0.14;

    // Injury rate scoring (30% weight)
    if (injuryRate <= 2) score += 0.3;
    else if (injuryRate <= 5) score += 0.24;
    else if (injuryRate <= 8) score += 0.18;
    else if (injuryRate <= 12) score += 0.12;
    else score += 0.06;

    return score;
  }

  private scoreHealthProtection(pneumoconiosisCases: number): number {
    if (pneumoconiosisCases === 0) return 1.0;
    if (pneumoconiosisCases <= 1) return 0.7;
    if (pneumoconiosisCases <= 3) return 0.5;
    if (pneumoconiosisCases <= 5) return 0.3;
    return 0.1;
  }

  private scoreJustTransition(transitionRate: number): number {
    if (transitionRate >= 90) return 1.0;
    if (transitionRate >= 75) return 0.8;
    if (transitionRate >= 60) return 0.6;
    if (transitionRate >= 40) return 0.4;
    return 0.2;
  }

  private scoreCommunitySupport(investmentPerCapita: number): number {
    if (investmentPerCapita >= 500) return 1.0;
    if (investmentPerCapita >= 300) return 0.8;
    if (investmentPerCapita >= 150) return 0.6;
    if (investmentPerCapita >= 50) return 0.4;
    return 0.2;
  }

  private weightedAverage(scores: Record<string, number>, weights: Record<string, number>): number {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [key, score] of Object.entries(scores)) {
      const weight = weights[key] || 0;
      totalScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private calculatePeerScore(peer: Record<string, any>): number {
    let score = 0;
    if (peer.ghg_intensity_coal < 1.2) score += 0.3;
    if (peer.methane_capture_rate > 70) score += 0.3;
    if (peer.fatality_rate_coal < 0.08) score += 0.4;
    return score;
  }

  private identifyImprovementAreas(
    orgData: Record<string, any>,
    avgData: Record<string, number>,
    percentiles: Record<string, number>
  ): string[] {
    const opportunities: string[] = [];

    if (percentiles.ghg_intensity_coal < 50) {
      opportunities.push('Transition planning and emission reduction strategies');
    }

    if (percentiles.methane_capture_rate < 50) {
      opportunities.push('Methane capture system improvements and VAM projects');
    }

    if (percentiles.fatality_rate_coal < 50) {
      opportunities.push('Enhanced safety management and worker protection');
    }

    if (!orgData.transition_strategy) {
      opportunities.push('Develop comprehensive just transition strategy');
    }

    return opportunities;
  }

  // Disclosure helper methods (similar structure to Oil & Gas model)
  private getClimateDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 12.2.1',
        title: 'Coal sector climate transition',
        description: 'Strategy for transitioning from coal operations',
        requirements: [
          'Describe transition timeline and milestones',
          'Report on alternative business opportunities',
          'Include worker and community support plans'
        ],
        dataPoints: [],
        reportingGuidance: 'Align with Paris Agreement and national energy policies'
      }
    ];
  }

  private getAirEmissionDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 12.3.2',
        title: 'Air quality management',
        description: 'Management of particulate matter and local air quality',
        requirements: [
          'Report PM2.5 and PM10 emissions',
          'Include local air quality monitoring',
          'Describe dust control measures'
        ],
        dataPoints: [],
        reportingGuidance: 'Include both stack emissions and fugitive dust'
      }
    ];
  }

  private getBiodiversityDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 12.4.3',
        title: 'Biodiversity and ecosystem impacts',
        description: 'Impacts on biodiversity from coal mining',
        requirements: [
          'Report land disturbance by ecosystem type',
          'Include species impact assessments',
          'Describe offset and mitigation measures'
        ],
        dataPoints: [],
        reportingGuidance: 'Follow IUCN guidelines for impact assessment'
      }
    ];
  }

  private getWasteDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 12.5.4',
        title: 'Coal combustion residuals',
        description: 'Management of coal ash and combustion byproducts',
        requirements: [
          'Report coal ash generation and disposal',
          'Include beneficial reuse rates',
          'Describe disposal site monitoring'
        ],
        dataPoints: [],
        reportingGuidance: 'Follow EPA Coal Ash Rule requirements'
      }
    ];
  }

  private getClosureDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 12.6.2',
        title: 'Mine closure provisions',
        description: 'Financial provisions for mine closure and rehabilitation',
        requirements: [
          'Report total closure liability',
          'Include adequacy assessments',
          'Describe closure plan updates'
        ],
        dataPoints: [],
        reportingGuidance: 'Include both legal and constructive obligations'
      }
    ];
  }

  private getWaterDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 12.7.3',
        title: 'Water quality impacts',
        description: 'Impacts on water quality from coal operations',
        requirements: [
          'Report acid mine drainage incidents',
          'Include water treatment effectiveness',
          'Describe long-term monitoring plans'
        ],
        dataPoints: [],
        reportingGuidance: 'Include both active and legacy sites'
      }
    ];
  }

  private getHealthSafetyDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 12.8.2',
        title: 'Coal mining safety',
        description: 'Safety performance in coal mining operations',
        requirements: [
          'Report fatality and injury rates',
          'Include leading safety indicators',
          'Describe safety management systems'
        ],
        dataPoints: [],
        reportingGuidance: 'Use MSHA or equivalent definitions'
      }
    ];
  }

  private getEmploymentDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 12.9.3',
        title: 'Just transition support',
        description: 'Support for workers during coal phase-out',
        requirements: [
          'Report retraining program participation',
          'Include job placement success rates',
          'Describe community transition support'
        ],
        dataPoints: [],
        reportingGuidance: 'Align with ILO Just Transition Guidelines'
      }
    ];
  }

  private getCommunityDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 12.15.4',
        title: 'Community economic support',
        description: 'Economic support for coal-dependent communities',
        requirements: [
          'Report community investment programs',
          'Include economic diversification initiatives',
          'Describe stakeholder engagement processes'
        ],
        dataPoints: [],
        reportingGuidance: 'Focus on long-term economic sustainability'
      }
    ];
  }

  private getUniversalDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 2-1',
        title: 'Organizational details',
        description: 'Basic information about the organization',
        requirements: [
          'Legal name and ownership',
          'Location of headquarters',
          'Countries of operation'
        ],
        dataPoints: [],
        reportingGuidance: 'Provide complete organizational context'
      }
    ];
  }
}