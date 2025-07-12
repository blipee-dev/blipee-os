/**
 * Base Industry Model Abstract Class
 * Foundation for all industry-specific implementations
 */

import {
  IndustryClassification,
  MaterialTopic,
  GRIDisclosure,
  IndustryMetric,
  IndustryBenchmark,
  RegulatoryRequirement,
  IndustryAnalysis,
  PeerComparison,
  IndustryRecommendation,
  IndustryModelConfig,
  IndustryContext,
  GRISectorStandard
} from './types';

export abstract class IndustryModel {
  protected config: IndustryModelConfig;
  protected context: IndustryContext | null = null;

  constructor(config: IndustryModelConfig) {
    this.config = config;
  }

  /**
   * Get industry name
   */
  getName(): string {
    return this.config.industryName;
  }

  /**
   * Get applicable GRI standards
   */
  getGRIStandards(): GRISectorStandard[] {
    return this.config.griStandards;
  }

  /**
   * Check if this model applies to a given organization
   */
  async isApplicable(classification: IndustryClassification): Promise<boolean> {
    // Check NAICS codes
    if (classification.naicsCode && this.config.naicsCodes.includes(classification.naicsCode)) {
      return true;
    }

    // Check SIC codes
    if (classification.sicCode && this.config.sicCodes.includes(classification.sicCode)) {
      return true;
    }

    // Allow for custom implementation in derived classes
    return this.checkCustomApplicability(classification);
  }

  /**
   * Get material topics for this industry
   */
  abstract getMaterialTopics(): MaterialTopic[];

  /**
   * Get required GRI disclosures
   */
  abstract getRequiredDisclosures(): GRIDisclosure[];

  /**
   * Get industry-specific metrics
   */
  abstract getIndustryMetrics(): IndustryMetric[];

  /**
   * Get regulatory requirements by jurisdiction
   */
  abstract getRegulatoryRequirements(jurisdiction: string): RegulatoryRequirement[];

  /**
   * Calculate industry-specific ESG score
   */
  abstract calculateESGScore(data: Record<string, any>): Promise<{
    overall: number;
    environmental: number;
    social: number;
    governance: number;
    breakdown: Record<string, number>;
  }>;

  /**
   * Get peer benchmarks
   */
  abstract getBenchmarks(region?: string): Promise<IndustryBenchmark[]>;

  /**
   * Perform peer comparison
   */
  abstract compareToPeers(
    organizationData: Record<string, any>,
    peerData: Array<Record<string, any>>
  ): Promise<PeerComparison>;

  /**
   * Generate industry-specific recommendations
   */
  abstract generateRecommendations(
    currentPerformance: Record<string, any>,
    benchmarks: IndustryBenchmark[]
  ): Promise<IndustryRecommendation[]>;

  /**
   * Validate data against industry standards
   */
  abstract validateData(data: Record<string, any>): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }>;

  /**
   * Get reporting guidance
   */
  abstract getReportingGuidance(): string;

  /**
   * Custom applicability check for derived classes
   */
  protected abstract checkCustomApplicability(
    classification: IndustryClassification
  ): Promise<boolean>;

  /**
   * Set context for analysis
   */
  setContext(context: IndustryContext): void {
    this.context = context;
  }

  /**
   * Perform comprehensive industry analysis
   */
  async analyze(
    organizationId: string,
    organizationData: Record<string, any>,
    classification: IndustryClassification
  ): Promise<IndustryAnalysis> {
    // Get material topics
    const materialTopics = this.getMaterialTopics();

    // Get required disclosures
    const requiredDisclosures = this.getRequiredDisclosures();

    // Get benchmarks
    const benchmarks = await this.getBenchmarks(organizationData.region);

    // Get regulations
    const regulations = this.getRegulatoryRequirements(
      organizationData.jurisdiction || 'global'
    );

    // Perform peer comparison if peer data available
    const peerComparison = organizationData.peerData
      ? await this.compareToPeers(organizationData, organizationData.peerData)
      : this.getDefaultPeerComparison();

    // Generate recommendations
    const recommendations = await this.generateRecommendations(
      organizationData,
      benchmarks
    );

    return {
      organizationId,
      industry: classification,
      applicableGRIStandards: this.config.griStandards,
      materialTopics,
      requiredDisclosures,
      benchmarks,
      regulations,
      peerComparison,
      recommendations
    };
  }

  /**
   * Get default peer comparison when no peer data available
   */
  protected getDefaultPeerComparison(): PeerComparison {
    return {
      industryAverage: {},
      percentileRank: {},
      topPerformers: [],
      improvementOpportunities: [
        'Insufficient peer data for comparison',
        'Connect to industry networks for benchmarking'
      ]
    };
  }

  /**
   * Calculate material topic relevance
   */
  protected calculateRelevance(
    topic: string,
    organizationData: Record<string, any>
  ): 'high' | 'medium' | 'low' {
    // Default implementation - can be overridden
    const impactScore = organizationData[`${topic}_impact`] || 0;
    
    if (impactScore > 0.7) return 'high';
    if (impactScore > 0.3) return 'medium';
    return 'low';
  }

  /**
   * Format metric value with appropriate unit
   */
  protected formatMetricValue(value: number, metric: IndustryMetric): string {
    return `${value.toLocaleString()} ${metric.unit}`;
  }

  /**
   * Check regulatory compliance
   */
  protected checkCompliance(
    data: Record<string, any>,
    requirements: RegulatoryRequirement[]
  ): { compliant: boolean; gaps: string[] } {
    const gaps: string[] = [];
    let compliant = true;

    for (const req of requirements) {
      for (const requirement of req.requirements) {
        // Simple check - can be enhanced in derived classes
        if (!data[requirement]) {
          gaps.push(`Missing: ${requirement} (${req.name})`);
          compliant = false;
        }
      }
    }

    return { compliant, gaps };
  }
}