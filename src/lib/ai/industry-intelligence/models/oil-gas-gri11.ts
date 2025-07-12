/**
 * GRI 11 Oil and Gas Sector Model
 * Comprehensive implementation of GRI 11 sector standard for oil and gas companies
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

export class OilGasGRI11Model extends IndustryModel {
  constructor() {
    super({
      industryName: 'Oil and Gas',
      griStandards: [GRISectorStandard.GRI_11_OIL_GAS],
      naicsCodes: ['211', '213111', '213112', '324110', '486'],
      sicCodes: ['1311', '1321', '1381', '1382', '1389', '2911', '4612', '4613'],
      materialTopics: [
        'climate-adaptation',
        'air-emissions',
        'biodiversity',
        'waste',
        'water-marine-resources',
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
        'public-policy',
        'supply-chain-management'
      ],
      specificMetrics: this.defineIndustryMetrics(),
      regulatoryFrameworks: ['EU-ETS', 'EPA-GHG', 'OGMP-2.0', 'TCFD'],
      certifications: ['ISO-14001', 'ISO-45001', 'API-Q1', 'API-Q2']
    });
  }

  /**
   * Define industry-specific metrics
   */
  private defineIndustryMetrics(): IndustryMetric[] {
    return [
      {
        id: 'ghg_intensity_upstream',
        name: 'Upstream GHG Intensity',
        unit: 'kgCO2e/BOE',
        category: 'environmental',
        calculationMethod: '(Scope 1 + Scope 2 emissions from upstream) / BOE produced',
        benchmarkAvailable: true,
        regulatoryRequired: true,
        griAlignment: ['GRI 305-4', 'GRI 11.2.4']
      },
      {
        id: 'methane_intensity',
        name: 'Methane Intensity',
        unit: '%',
        category: 'environmental',
        calculationMethod: 'Methane emissions / Natural gas produced',
        benchmarkAvailable: true,
        regulatoryRequired: true,
        griAlignment: ['GRI 305-7', 'GRI 11.3.2']
      },
      {
        id: 'flaring_intensity',
        name: 'Flaring Intensity',
        unit: 'm³/BOE',
        category: 'environmental',
        calculationMethod: 'Volume flared / BOE produced',
        benchmarkAvailable: true,
        regulatoryRequired: false,
        griAlignment: ['GRI 11.3.3']
      },
      {
        id: 'water_intensity',
        name: 'Water Consumption Intensity',
        unit: 'm³/BOE',
        category: 'environmental',
        calculationMethod: 'Total water consumed / BOE produced',
        benchmarkAvailable: true,
        regulatoryRequired: false,
        griAlignment: ['GRI 303-5', 'GRI 11.6.4']
      },
      {
        id: 'spill_volume',
        name: 'Hydrocarbon Spill Volume',
        unit: 'barrels',
        category: 'environmental',
        calculationMethod: 'Total volume of hydrocarbon spills > 1 barrel',
        benchmarkAvailable: true,
        regulatoryRequired: true,
        griAlignment: ['GRI 306-3', 'GRI 11.8.2']
      },
      {
        id: 'trir',
        name: 'Total Recordable Incident Rate',
        unit: 'per 200,000 hours',
        category: 'social',
        calculationMethod: '(Recordable incidents × 200,000) / Hours worked',
        benchmarkAvailable: true,
        regulatoryRequired: true,
        griAlignment: ['GRI 403-9', 'GRI 11.9.10']
      },
      {
        id: 'process_safety_events',
        name: 'Process Safety Events',
        unit: 'count',
        category: 'social',
        calculationMethod: 'Number of Tier 1 and Tier 2 process safety events',
        benchmarkAvailable: true,
        regulatoryRequired: true,
        griAlignment: ['GRI 11.8.3']
      },
      {
        id: 'local_procurement',
        name: 'Local Procurement Spend',
        unit: '%',
        category: 'economic',
        calculationMethod: 'Local supplier spend / Total procurement spend',
        benchmarkAvailable: false,
        regulatoryRequired: false,
        griAlignment: ['GRI 204-1', 'GRI 11.14.6']
      }
    ];
  }

  /**
   * Get material topics for oil & gas industry
   */
  getMaterialTopics(): MaterialTopic[] {
    return [
      {
        id: 'gri11-climate',
        name: 'Climate adaptation, resilience, and transition',
        description: 'Managing climate-related risks and transition to low-carbon economy',
        griStandard: 'GRI 11.2',
        relevance: 'high',
        impactAreas: ['Environment', 'Economy', 'Society'],
        managementApproach: 'Implement science-based targets, invest in low-carbon technologies, develop transition strategy',
        metrics: this.config.specificMetrics.filter(m => 
          ['ghg_intensity_upstream', 'methane_intensity'].includes(m.id)
        ),
        disclosures: this.getClimateDisclosures()
      },
      {
        id: 'gri11-air',
        name: 'Air emissions',
        description: 'Management of air pollutants beyond GHG emissions',
        griStandard: 'GRI 11.3',
        relevance: 'high',
        impactAreas: ['Environment', 'Health'],
        managementApproach: 'Implement emission reduction technologies, monitor air quality, reduce flaring',
        metrics: this.config.specificMetrics.filter(m => 
          ['flaring_intensity'].includes(m.id)
        ),
        disclosures: this.getAirEmissionDisclosures()
      },
      {
        id: 'gri11-biodiversity',
        name: 'Biodiversity',
        description: 'Protection of ecosystems and species in operational areas',
        griStandard: 'GRI 11.4',
        relevance: 'high',
        impactAreas: ['Environment'],
        managementApproach: 'Conduct biodiversity assessments, implement mitigation hierarchy, support conservation',
        metrics: [],
        disclosures: this.getBiodiversityDisclosures()
      },
      {
        id: 'gri11-waste',
        name: 'Waste',
        description: 'Management of hazardous and non-hazardous waste',
        griStandard: 'GRI 11.5',
        relevance: 'medium',
        impactAreas: ['Environment'],
        managementApproach: 'Minimize waste generation, ensure proper disposal, implement circular economy principles',
        metrics: [],
        disclosures: this.getWasteDisclosures()
      },
      {
        id: 'gri11-water',
        name: 'Water and marine resources',
        description: 'Water consumption and impacts on marine ecosystems',
        griStandard: 'GRI 11.6',
        relevance: 'high',
        impactAreas: ['Environment', 'Community'],
        managementApproach: 'Implement water efficiency measures, protect water sources, engage with communities',
        metrics: this.config.specificMetrics.filter(m => 
          ['water_intensity'].includes(m.id)
        ),
        disclosures: this.getWaterDisclosures()
      },
      {
        id: 'gri11-incidents',
        name: 'Critical incident management',
        description: 'Prevention and response to operational incidents',
        griStandard: 'GRI 11.8',
        relevance: 'high',
        impactAreas: ['Environment', 'Safety', 'Economy'],
        managementApproach: 'Implement robust safety management systems, emergency response plans, regular drills',
        metrics: this.config.specificMetrics.filter(m => 
          ['spill_volume', 'process_safety_events'].includes(m.id)
        ),
        disclosures: this.getIncidentDisclosures()
      },
      {
        id: 'gri11-health-safety',
        name: 'Occupational health and safety',
        description: 'Protection of workforce health and safety',
        griStandard: 'GRI 11.9',
        relevance: 'high',
        impactAreas: ['Social'],
        managementApproach: 'Implement comprehensive HSE management system, safety culture programs',
        metrics: this.config.specificMetrics.filter(m => 
          ['trir'].includes(m.id)
        ),
        disclosures: this.getHealthSafetyDisclosures()
      },
      {
        id: 'gri11-communities',
        name: 'Local communities',
        description: 'Impacts on and engagement with local communities',
        griStandard: 'GRI 11.15',
        relevance: 'high',
        impactAreas: ['Social', 'Economic'],
        managementApproach: 'Conduct social impact assessments, implement grievance mechanisms, support local development',
        metrics: this.config.specificMetrics.filter(m => 
          ['local_procurement'].includes(m.id)
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
    
    // Aggregate all disclosures from material topics
    this.getMaterialTopics().forEach(topic => {
      disclosures.push(...topic.disclosures);
    });

    // Add universal disclosures
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
        id: 'epa-ghgrp',
        name: 'EPA Greenhouse Gas Reporting Program',
        jurisdiction: 'US',
        applicableIndustries: ['Oil & Gas'],
        effectiveDate: new Date('2010-01-01'),
        requirements: [
          'Report annual GHG emissions if > 25,000 tCO2e',
          'Use EPA-approved calculation methods',
          'Submit by March 31 each year'
        ],
        penalties: 'Up to $51,796 per day per violation',
        griAlignment: ['GRI 305-1', 'GRI 305-2'],
        complianceDeadline: new Date('2025-03-31')
      });
    }

    if (jurisdiction === 'EU' || jurisdiction === 'global') {
      requirements.push({
        id: 'eu-ets',
        name: 'EU Emissions Trading System',
        jurisdiction: 'EU',
        applicableIndustries: ['Oil & Gas'],
        effectiveDate: new Date('2005-01-01'),
        requirements: [
          'Monitor and report verified emissions',
          'Surrender allowances equal to emissions',
          'Comply with MRV regulations'
        ],
        penalties: '€100 per tCO2e excess emissions',
        griAlignment: ['GRI 305-1', 'GRI 305-2', 'GRI 201-2'],
        complianceDeadline: new Date('2025-04-30')
      });

      requirements.push({
        id: 'methane-regulation',
        name: 'EU Methane Regulation',
        jurisdiction: 'EU',
        applicableIndustries: ['Oil & Gas'],
        effectiveDate: new Date('2024-01-01'),
        requirements: [
          'Measure and report methane emissions',
          'Implement leak detection and repair (LDAR)',
          'Limit venting and flaring'
        ],
        penalties: 'Varies by member state',
        griAlignment: ['GRI 305-7', 'GRI 11.3.2'],
        complianceDeadline: new Date('2025-01-01')
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
      environmental: 0.45,
      social: 0.30,
      governance: 0.25
    };

    // Environmental score calculation
    const envScores = {
      ghgIntensity: this.scoreGHGIntensity(data.ghg_intensity_upstream),
      methaneManagement: this.scoreMethaneIntensity(data.methane_intensity),
      waterManagement: this.scoreWaterIntensity(data.water_intensity),
      spillPrevention: this.scoreSpillVolume(data.spill_volume),
      biodiversity: data.biodiversity_score || 0.5
    };

    const environmental = this.weightedAverage(envScores, {
      ghgIntensity: 0.35,
      methaneManagement: 0.25,
      waterManagement: 0.15,
      spillPrevention: 0.15,
      biodiversity: 0.10
    });

    // Social score calculation
    const socialScores = {
      safety: this.scoreSafety(data.trir),
      processSafety: this.scoreProcessSafety(data.process_safety_events),
      communityEngagement: data.community_score || 0.6,
      localContent: this.scoreLocalContent(data.local_procurement),
      humanRights: data.human_rights_score || 0.7
    };

    const social = this.weightedAverage(socialScores, {
      safety: 0.30,
      processSafety: 0.25,
      communityEngagement: 0.20,
      localContent: 0.15,
      humanRights: 0.10
    });

    // Governance score calculation
    const govScores = {
      transparency: data.transparency_score || 0.7,
      ethics: data.ethics_score || 0.7,
      boardDiversity: data.board_diversity_score || 0.6,
      riskManagement: data.risk_management_score || 0.7,
      payments: data.government_payments_transparency || 0.8
    };

    const governance = this.weightedAverage(govScores, {
      transparency: 0.25,
      ethics: 0.25,
      boardDiversity: 0.15,
      riskManagement: 0.20,
      payments: 0.15
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
    // In production, this would fetch from a benchmark database
    return [
      {
        metricId: 'ghg_intensity_upstream',
        industry: 'Oil & Gas',
        region: region || 'global',
        year: 2024,
        percentiles: {
          p10: 10.5,
          p25: 15.2,
          p50: 22.8,
          p75: 35.6,
          p90: 48.3
        },
        average: 26.4,
        sampleSize: 150,
        leaders: ['shell', 'bp', 'equinor']
      },
      {
        metricId: 'methane_intensity',
        industry: 'Oil & Gas',
        region: region || 'global',
        year: 2024,
        percentiles: {
          p10: 0.05,
          p25: 0.12,
          p50: 0.20,
          p75: 0.35,
          p90: 0.52
        },
        average: 0.25,
        sampleSize: 120,
        leaders: ['totalenergies', 'eni', 'repsol']
      },
      {
        metricId: 'trir',
        industry: 'Oil & Gas',
        region: region || 'global',
        year: 2024,
        percentiles: {
          p10: 0.12,
          p25: 0.23,
          p50: 0.41,
          p75: 0.68,
          p90: 1.05
        },
        average: 0.48,
        sampleSize: 180,
        leaders: ['exxonmobil', 'chevron', 'conocophillips']
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
    const metrics = ['ghg_intensity_upstream', 'methane_intensity', 'trir', 'water_intensity'];
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

    // Identify top performers
    const topPerformers = peerData
      .map(peer => ({
        companyId: peer.id,
        name: peer.name,
        score: this.calculatePeerScore(peer),
        metrics: {
          ghg_intensity: peer.ghg_intensity_upstream,
          methane_intensity: peer.methane_intensity,
          safety: peer.trir
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

    // GHG intensity recommendations
    const ghgBenchmark = benchmarks.find(b => b.metricId === 'ghg_intensity_upstream');
    if (ghgBenchmark && currentPerformance.ghg_intensity_upstream > ghgBenchmark.percentiles.p50) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Reduce Upstream GHG Intensity',
        description: 'Your GHG intensity is above industry median. Implement energy efficiency measures and electrification.',
        impact: 'Could reduce emissions by 15-25% and improve ESG ratings',
        effort: 'high',
        griAlignment: ['GRI 305-4', 'GRI 11.2.4'],
        estimatedCost: 5000000,
        estimatedTimeline: '18-24 months'
      });
    }

    // Methane management
    const methaneBenchmark = benchmarks.find(b => b.metricId === 'methane_intensity');
    if (methaneBenchmark && currentPerformance.methane_intensity > 0.2) {
      recommendations.push({
        type: 'compliance',
        priority: 'critical',
        title: 'Implement Methane Reduction Program',
        description: 'Methane intensity exceeds OGMP 2.0 Gold Standard target. Deploy LDAR program and eliminate routine flaring.',
        impact: 'Achieve regulatory compliance and reduce methane emissions by 75%',
        effort: 'medium',
        griAlignment: ['GRI 305-7', 'GRI 11.3.2'],
        estimatedCost: 2000000,
        estimatedTimeline: '12 months'
      });
    }

    // Safety improvements
    if (currentPerformance.trir > 0.5) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Enhance Safety Management System',
        description: 'TRIR exceeds industry best practices. Implement behavior-based safety program and enhance training.',
        impact: 'Reduce incidents by 40% and improve workforce morale',
        effort: 'medium',
        griAlignment: ['GRI 403-9', 'GRI 11.9.10'],
        estimatedCost: 500000,
        estimatedTimeline: '6-9 months'
      });
    }

    // Reporting improvements
    if (!currentPerformance.tcfd_aligned) {
      recommendations.push({
        type: 'reporting',
        priority: 'medium',
        title: 'Align Climate Reporting with TCFD',
        description: 'Enhance climate-related financial disclosures following TCFD recommendations.',
        impact: 'Meet investor expectations and regulatory requirements',
        effort: 'low',
        griAlignment: ['GRI 201-2', 'GRI 11.2.2'],
        estimatedCost: 100000,
        estimatedTimeline: '3 months'
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
      'ghg_intensity_upstream',
      'methane_intensity',
      'spill_volume',
      'trir'
    ];

    for (const metric of requiredMetrics) {
      if (data[metric] === undefined || data[metric] === null) {
        errors.push(`Missing required metric: ${metric}`);
      }
    }

    // Value range validation
    if (data.ghg_intensity_upstream !== undefined && data.ghg_intensity_upstream < 0) {
      errors.push('GHG intensity cannot be negative');
    }

    if (data.methane_intensity !== undefined && (data.methane_intensity < 0 || data.methane_intensity > 100)) {
      errors.push('Methane intensity must be between 0 and 100%');
    }

    // Warnings for unusual values
    if (data.ghg_intensity_upstream > 100) {
      warnings.push('GHG intensity seems unusually high - please verify');
    }

    if (data.trir > 5) {
      warnings.push('TRIR is very high - immediate safety review recommended');
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
Oil and Gas Sector Reporting Guidance (GRI 11):

1. Scope and Boundaries:
   - Include all upstream, midstream, and downstream operations
   - Report on operated assets and equity share of non-operated assets
   - Clearly define organizational boundaries

2. Key Metrics to Report:
   - GHG emissions intensity (Scope 1+2) per BOE
   - Methane emissions and intensity
   - Flaring volumes and intensity
   - Water consumption in water-stressed areas
   - Spill volumes and incidents
   - Safety metrics (TRIR, LTIR, fatalities)
   - Process safety events (Tier 1 & 2)

3. Climate Reporting:
   - Align with TCFD recommendations
   - Include scenario analysis (1.5°C and 2°C)
   - Report Scope 3 emissions (Category 11: Use of sold products)
   - Disclose climate targets and transition strategy

4. Biodiversity and Ecosystems:
   - Report on operations in or near protected areas
   - Describe biodiversity impact assessments and mitigation
   - Include marine and freshwater ecosystem impacts

5. Social Performance:
   - Report on community engagement and grievances
   - Include local content and procurement data
   - Describe human rights due diligence processes
   - Report on security practices and incidents

6. Governance and Ethics:
   - Disclose payments to governments (country-by-country)
   - Report on anti-corruption measures
   - Include contract transparency initiatives
   - Describe board oversight of ESG issues

7. Sector-Specific Requirements:
   - Follow IOGP, API, and IPIECA reporting guidelines
   - Use SASB Oil & Gas standards for financial materiality
   - Align with OGMP 2.0 for methane reporting
   - Include decommissioning liabilities and provisions

Remember: Transparency and comparability are key. Use industry-standard methodologies and clearly explain any deviations or limitations in your data.
    `;
  }

  /**
   * Check custom applicability
   */
  protected async checkCustomApplicability(
    classification: IndustryClassification
  ): Promise<boolean> {
    // Additional checks beyond NAICS/SIC codes
    if (classification.customCode) {
      const oilGasKeywords = ['petroleum', 'oil', 'gas', 'drilling', 'refining', 'pipeline'];
      return oilGasKeywords.some(keyword => 
        classification.customCode.toLowerCase().includes(keyword)
      );
    }
    return false;
  }

  // Scoring helper methods
  private scoreGHGIntensity(value: number): number {
    if (value <= 10) return 1.0;
    if (value <= 20) return 0.8;
    if (value <= 30) return 0.6;
    if (value <= 40) return 0.4;
    return 0.2;
  }

  private scoreMethaneIntensity(value: number): number {
    if (value <= 0.05) return 1.0;
    if (value <= 0.15) return 0.8;
    if (value <= 0.25) return 0.6;
    if (value <= 0.40) return 0.4;
    return 0.2;
  }

  private scoreWaterIntensity(value: number): number {
    if (value <= 0.5) return 1.0;
    if (value <= 1.0) return 0.8;
    if (value <= 2.0) return 0.6;
    if (value <= 3.0) return 0.4;
    return 0.2;
  }

  private scoreSpillVolume(value: number): number {
    if (value === 0) return 1.0;
    if (value <= 10) return 0.8;
    if (value <= 100) return 0.6;
    if (value <= 500) return 0.4;
    return 0.2;
  }

  private scoreSafety(trir: number): number {
    if (trir <= 0.2) return 1.0;
    if (trir <= 0.4) return 0.8;
    if (trir <= 0.6) return 0.6;
    if (trir <= 1.0) return 0.4;
    return 0.2;
  }

  private scoreProcessSafety(events: number): number {
    if (events === 0) return 1.0;
    if (events <= 1) return 0.8;
    if (events <= 3) return 0.6;
    if (events <= 5) return 0.4;
    return 0.2;
  }

  private scoreLocalContent(percentage: number): number {
    if (percentage >= 80) return 1.0;
    if (percentage >= 60) return 0.8;
    if (percentage >= 40) return 0.6;
    if (percentage >= 20) return 0.4;
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
    // Simple scoring for peer ranking
    let score = 0;
    if (peer.ghg_intensity_upstream < 20) score += 0.3;
    if (peer.methane_intensity < 0.2) score += 0.3;
    if (peer.trir < 0.5) score += 0.4;
    return score;
  }

  private identifyImprovementAreas(
    orgData: Record<string, any>,
    avgData: Record<string, number>,
    percentiles: Record<string, number>
  ): string[] {
    const opportunities: string[] = [];

    if (percentiles.ghg_intensity_upstream < 50) {
      opportunities.push('GHG intensity reduction through energy efficiency and electrification');
    }

    if (percentiles.methane_intensity < 50) {
      opportunities.push('Methane leak detection and repair program implementation');
    }

    if (percentiles.trir < 50) {
      opportunities.push('Safety culture enhancement and training programs');
    }

    if (orgData.renewable_energy_percentage < 10) {
      opportunities.push('Increase renewable energy procurement for operations');
    }

    return opportunities;
  }

  // Disclosure helper methods
  private getClimateDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 305-1',
        title: 'Direct (Scope 1) GHG emissions',
        description: 'Report total Scope 1 emissions from all operations',
        requirements: [
          'Include emissions from combustion, flaring, venting, and fugitives',
          'Report by business segment (upstream, midstream, downstream)',
          'Use API Compendium or similar methodology'
        ],
        dataPoints: [
          {
            name: 'scope1_total',
            type: 'quantitative',
            unit: 'tCO2e',
            required: true,
            guidance: 'Total direct emissions'
          },
          {
            name: 'scope1_combustion',
            type: 'quantitative',
            unit: 'tCO2e',
            required: false,
            guidance: 'Emissions from fuel combustion'
          }
        ],
        reportingGuidance: 'Follow IPIECA/API/IOGP guidance'
      },
      {
        code: 'GRI 11.2.4',
        title: 'GHG emissions intensity',
        description: 'Report GHG intensity for different business segments',
        requirements: [
          'Calculate intensity per unit of production',
          'Report separately for upstream, refining, and chemicals',
          'Include both operated and equity basis'
        ],
        dataPoints: [
          {
            name: 'upstream_ghg_intensity',
            type: 'quantitative',
            unit: 'kgCO2e/BOE',
            required: true,
            guidance: 'Upstream production intensity'
          }
        ],
        reportingGuidance: 'Use consistent production accounting methods'
      }
    ];
  }

  private getAirEmissionDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 305-7',
        title: 'NOx, SOx, and other air emissions',
        description: 'Report significant air emissions by type',
        requirements: [
          'Include NOx, SOx, VOCs, and PM',
          'Report methane emissions separately',
          'Describe calculation methodology'
        ],
        dataPoints: [
          {
            name: 'nox_emissions',
            type: 'quantitative',
            unit: 'metric tons',
            required: true,
            guidance: 'Total NOx emissions'
          },
          {
            name: 'sox_emissions',
            type: 'quantitative',
            unit: 'metric tons',
            required: true,
            guidance: 'Total SOx emissions'
          },
          {
            name: 'voc_emissions',
            type: 'quantitative',
            unit: 'metric tons',
            required: true,
            guidance: 'Total VOC emissions'
          }
        ],
        reportingGuidance: 'Use direct measurement or emission factors'
      }
    ];
  }

  private getBiodiversityDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 304-1',
        title: 'Operations in protected areas',
        description: 'Sites in or adjacent to protected areas',
        requirements: [
          'List all sites in IUCN Category I-VI areas',
          'Include UNESCO World Heritage sites',
          'Report on biodiversity value'
        ],
        dataPoints: [
          {
            name: 'sites_in_protected_areas',
            type: 'quantitative',
            unit: 'count',
            required: true,
            guidance: 'Number of operational sites'
          }
        ],
        reportingGuidance: 'Use IBAT or similar tools for screening'
      }
    ];
  }

  private getWasteDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 306-3',
        title: 'Waste generated',
        description: 'Total waste by type and disposal method',
        requirements: [
          'Report hazardous and non-hazardous separately',
          'Include drilling waste and produced water',
          'Describe waste minimization efforts'
        ],
        dataPoints: [
          {
            name: 'hazardous_waste',
            type: 'quantitative',
            unit: 'metric tons',
            required: true,
            guidance: 'Total hazardous waste generated'
          }
        ],
        reportingGuidance: 'Follow local regulatory definitions'
      }
    ];
  }

  private getWaterDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 303-5',
        title: 'Water consumption',
        description: 'Total water consumption by source',
        requirements: [
          'Report freshwater and other water separately',
          'Include water consumption in water-stressed areas',
          'Report produced water management'
        ],
        dataPoints: [
          {
            name: 'freshwater_consumption',
            type: 'quantitative',
            unit: 'm³',
            required: true,
            guidance: 'Total freshwater consumed'
          }
        ],
        reportingGuidance: 'Use WRI Aqueduct for water stress assessment'
      }
    ];
  }

  private getIncidentDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 11.8.2',
        title: 'Oil spills',
        description: 'Number and volume of recorded spills',
        requirements: [
          'Report spills > 1 barrel reaching environment',
          'Include location and impact',
          'Describe remediation efforts'
        ],
        dataPoints: [
          {
            name: 'spill_count',
            type: 'quantitative',
            unit: 'number',
            required: true,
            guidance: 'Number of reportable spills'
          },
          {
            name: 'spill_volume',
            type: 'quantitative',
            unit: 'barrels',
            required: true,
            guidance: 'Total volume spilled'
          }
        ],
        reportingGuidance: 'Follow regulatory reporting thresholds'
      }
    ];
  }

  private getHealthSafetyDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 403-9',
        title: 'Work-related injuries',
        description: 'Injury rates for employees and contractors',
        requirements: [
          'Report TRIR, LTIR, and fatalities',
          'Include contractor data',
          'Describe safety management system'
        ],
        dataPoints: [
          {
            name: 'trir',
            type: 'quantitative',
            unit: 'per 200,000 hours',
            required: true,
            guidance: 'Total recordable incident rate'
          },
          {
            name: 'fatalities',
            type: 'quantitative',
            unit: 'number',
            required: true,
            guidance: 'Work-related fatalities'
          }
        ],
        reportingGuidance: 'Use IOGP or OSHA definitions'
      }
    ];
  }

  private getCommunityDisclosures(): GRIDisclosure[] {
    return [
      {
        code: 'GRI 413-1',
        title: 'Local community engagement',
        description: 'Operations with community engagement programs',
        requirements: [
          'Report percentage of sites with programs',
          'Describe engagement mechanisms',
          'Include grievance data'
        ],
        dataPoints: [
          {
            name: 'sites_with_engagement',
            type: 'quantitative',
            unit: 'percentage',
            required: true,
            guidance: 'Percentage of sites with formal engagement'
          }
        ],
        reportingGuidance: 'Include all significant operations'
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