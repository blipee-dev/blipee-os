/**
 * Framework Comparison Utility
 *
 * Provides detailed comparison and analysis between specific compliance frameworks.
 * Enables deep-dive analysis of framework relationships, differences, and integration opportunities.
 */

import {
  ComplianceFramework,
  ComplianceRequirement,
  FrameworkComparison,
  RequirementGap,
  IntegrationOpportunity
} from '../types';
import { FrameworkFactory } from '../frameworks';
import { BaseFrameworkEngine } from '../frameworks/base-framework';

/**
 * Detailed requirement comparison
 */
interface DetailedRequirementComparison {
  requirement1: ComplianceRequirement;
  requirement2: ComplianceRequirement | null;
  matchType: 'exact' | 'substantial' | 'partial' | 'unique' | 'gap';
  similarity: number;
  gaps: string[];
  integrationComplexity: 'low' | 'medium' | 'high';
  recommendations: string[];
}

/**
 * Framework scoring comparison
 */
interface ScoringComparison {
  framework1Score: number;
  framework2Score: number;
  scoringMethodDifferences: string[];
  weightingDifferences: {
    category: string;
    framework1Weight: number;
    framework2Weight: number;
    impact: 'low' | 'medium' | 'high';
  }[];
  recommendedAlignment: {
    category: string;
    recommendedWeight: number;
    rationale: string;
  }[];
}

/**
 * Implementation timeline comparison
 */
interface TimelineComparison {
  framework1Timeline: string;
  framework2Timeline: string;
  sharedMilestones: {
    milestone: string;
    framework1Date: Date;
    framework2Date: Date;
    alignmentOpportunity: boolean;
  }[];
  sequencingRecommendations: {
    phase: string;
    frameworks: string[];
    duration: string;
    dependencies: string[];
  }[];
}

/**
 * Framework Comparator Class
 */
export class FrameworkComparator {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  /**
   * Perform comprehensive comparison between two frameworks
   */
  public async compareFrameworks(
    framework1Code: string,
    framework2Code: string
  ): Promise<FrameworkComparison> {
    const engine1 = FrameworkFactory.createEngine(framework1Code, this.organizationId);
    const engine2 = FrameworkFactory.createEngine(framework2Code, this.organizationId);

    const [info1, info2] = await Promise.all([
      engine1.getFrameworkInfo(),
      engine2.getFrameworkInfo()
    ]);

    // Perform detailed requirement analysis
    const requirementComparison = await this.compareRequirements(info1, info2);

    // Compare scoring methodologies
    const scoringComparison = await this.compareScoringMethods(engine1, engine2);

    // Analyze implementation timelines
    const timelineComparison = await this.compareTimelines(info1, info2);

    // Identify integration opportunities
    const integrationOpportunities = await this.identifyIntegrationOpportunities(
      info1, info2, requirementComparison
    );

    // Calculate overall compatibility
    const compatibilityScore = this.calculateCompatibilityScore(requirementComparison);

    return {
      id: `comparison_${framework1Code}_${framework2Code}_${Date.now()}`,
      framework1: framework1Code,
      framework2: framework2Code,
      comparisonDate: new Date(),
      overallCompatibility: compatibilityScore,
      requirementOverlap: this.calculateRequirementOverlap(requirementComparison),
      uniqueRequirements: this.identifyUniqueRequirements(requirementComparison),
      gapAnalysis: await this.performGapAnalysis(requirementComparison),
      integrationComplexity: this.assessIntegrationComplexity(requirementComparison),
      recommendedApproach: await this.generateRecommendedApproach(
        framework1Code, framework2Code, requirementComparison, integrationOpportunities
      ),
      detailedComparison: {
        requirements: requirementComparison,
        scoring: scoringComparison,
        timeline: timelineComparison,
        integration: integrationOpportunities
      }
    };
  }

  /**
   * Compare requirements between two frameworks
   */
  private async compareRequirements(
    info1: ComplianceFramework,
    info2: ComplianceFramework
  ): Promise<DetailedRequirementComparison[]> {
    const comparisons: DetailedRequirementComparison[] = [];

    // Compare each requirement from framework 1
    for (const req1 of info1.requirements) {
      const bestMatch = this.findBestMatch(req1, info2.requirements);

      if (bestMatch) {
        const similarity = this.calculateDetailedSimilarity(req1, bestMatch.requirement);
        const gaps = this.identifyRequirementGaps(req1, bestMatch.requirement);

        comparisons.push({
          requirement1: req1,
          requirement2: bestMatch.requirement,
          matchType: this.categorizeMatch(similarity),
          similarity,
          gaps,
          integrationComplexity: this.assessRequirementIntegrationComplexity(req1, bestMatch.requirement),
          recommendations: this.generateRequirementRecommendations(req1, bestMatch.requirement, gaps)
        });
      } else {
        // Unique requirement in framework 1
        comparisons.push({
          requirement1: req1,
          requirement2: null,
          matchType: 'unique',
          similarity: 0,
          gaps: [`No equivalent requirement in ${info2.code}`],
          integrationComplexity: 'medium',
          recommendations: [`Consider adding similar requirement to ${info2.code} implementation`]
        });
      }
    }

    // Check for unique requirements in framework 2
    for (const req2 of info2.requirements) {
      const hasMatch = comparisons.some(c => c.requirement2?.id === req2.id);

      if (!hasMatch) {
        comparisons.push({
          requirement1: req2, // Use req2 as req1 for consistency
          requirement2: null,
          matchType: 'gap',
          similarity: 0,
          gaps: [`Missing requirement in ${info1.code}`],
          integrationComplexity: 'medium',
          recommendations: [`Consider adding to ${info1.code} implementation`]
        });
      }
    }

    return comparisons;
  }

  /**
   * Find best matching requirement
   */
  private findBestMatch(
    requirement: ComplianceRequirement,
    candidates: ComplianceRequirement[]
  ): { requirement: ComplianceRequirement; similarity: number } | null {
    let bestMatch = null;
    let highestSimilarity = 0;

    for (const candidate of candidates) {
      const similarity = this.calculateDetailedSimilarity(requirement, candidate);

      if (similarity > highestSimilarity && similarity > 0.3) {
        highestSimilarity = similarity;
        bestMatch = { requirement: candidate, similarity };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate detailed similarity between requirements
   */
  private calculateDetailedSimilarity(
    req1: ComplianceRequirement,
    req2: ComplianceRequirement
  ): number {
    let totalScore = 0;
    let weightSum = 0;

    // Title similarity (weight: 25%)
    const titleSimilarity = this.calculateTextSimilarity(req1.title, req2.title);
    totalScore += titleSimilarity * 0.25;
    weightSum += 0.25;

    // Description similarity (weight: 35%)
    const descSimilarity = this.calculateTextSimilarity(req1.description, req2.description);
    totalScore += descSimilarity * 0.35;
    weightSum += 0.35;

    // Category matching (weight: 20%)
    const categoryMatch = req1.category === req2.category ? 1 : 0;
    totalScore += categoryMatch * 0.20;
    weightSum += 0.20;

    // Type matching (weight: 10%)
    const typeMatch = req1.type === req2.type ? 1 : 0;
    totalScore += typeMatch * 0.10;
    weightSum += 0.10;

    // Priority alignment (weight: 10%)
    const priorityAlignment = this.calculatePriorityAlignment(req1.priority, req2.priority);
    totalScore += priorityAlignment * 0.10;
    weightSum += 0.10;

    return weightSum > 0 ? totalScore / weightSum : 0;
  }

  /**
   * Calculate text similarity using simple word overlap
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate priority alignment
   */
  private calculatePriorityAlignment(priority1: string, priority2: string): number {
    const priorityMap: Record<string, number> = {
      'critical': 5,
      'high': 4,
      'medium': 3,
      'low': 2,
      'optional': 1
    };

    const score1 = priorityMap[priority1] || 3;
    const score2 = priorityMap[priority2] || 3;

    const difference = Math.abs(score1 - score2);
    return Math.max(0, 1 - (difference / 4));
  }

  /**
   * Categorize match type based on similarity
   */
  private categorizeMatch(similarity: number): 'exact' | 'substantial' | 'partial' | 'unique' | 'gap' {
    if (similarity >= 0.95) return 'exact';
    if (similarity >= 0.75) return 'substantial';
    if (similarity >= 0.50) return 'partial';
    return 'unique';
  }

  /**
   * Identify gaps between requirements
   */
  private identifyRequirementGaps(req1: ComplianceRequirement, req2: ComplianceRequirement): string[] {
    const gaps: string[] = [];

    // Data requirement gaps
    const data1 = new Set(req1.dataRequirements?.map(d => d.type) || []);
    const data2 = new Set(req2.dataRequirements?.map(d => d.type) || []);

    const missingInReq2 = [...data1].filter(x => !data2.has(x));
    const missingInReq1 = [...data2].filter(x => !data1.has(x));

    if (missingInReq2.length > 0) {
      gaps.push(`Missing data requirements in ${req2.id}: ${missingInReq2.join(', ')}`);
    }

    if (missingInReq1.length > 0) {
      gaps.push(`Additional data requirements in ${req2.id}: ${missingInReq1.join(', ')}`);
    }

    // Frequency differences
    if (req1.frequency !== req2.frequency) {
      gaps.push(`Frequency mismatch: ${req1.frequency} vs ${req2.frequency}`);
    }

    // Priority differences
    if (req1.priority !== req2.priority) {
      gaps.push(`Priority mismatch: ${req1.priority} vs ${req2.priority}`);
    }

    return gaps;
  }

  /**
   * Assess integration complexity for a requirement pair
   */
  private assessRequirementIntegrationComplexity(
    req1: ComplianceRequirement,
    req2: ComplianceRequirement
  ): 'low' | 'medium' | 'high' {
    let complexityScore = 0;

    // Data requirement complexity
    const dataOverlap = this.calculateDataOverlap(req1, req2);
    if (dataOverlap < 0.5) complexityScore += 2;
    else if (dataOverlap < 0.8) complexityScore += 1;

    // Frequency alignment
    if (req1.frequency !== req2.frequency) complexityScore += 1;

    // Priority alignment
    if (req1.priority !== req2.priority) complexityScore += 1;

    // Type alignment
    if (req1.type !== req2.type) complexityScore += 2;

    if (complexityScore >= 4) return 'high';
    if (complexityScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Calculate data overlap between requirements
   */
  private calculateDataOverlap(req1: ComplianceRequirement, req2: ComplianceRequirement): number {
    const data1 = new Set(req1.dataRequirements?.map(d => d.type) || []);
    const data2 = new Set(req2.dataRequirements?.map(d => d.type) || []);

    if (data1.size === 0 && data2.size === 0) return 1; // Both empty
    if (data1.size === 0 || data2.size === 0) return 0; // One empty

    const intersection = new Set([...data1].filter(x => data2.has(x)));
    const union = new Set([...data1, ...data2]);

    return intersection.size / union.size;
  }

  /**
   * Generate recommendations for requirement integration
   */
  private generateRequirementRecommendations(
    req1: ComplianceRequirement,
    req2: ComplianceRequirement,
    gaps: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (gaps.length === 0) {
      recommendations.push('Requirements are well-aligned; consider unified implementation');
      return recommendations;
    }

    // Data requirement recommendations
    if (gaps.some(g => g.includes('Missing data requirements'))) {
      recommendations.push('Expand data collection to cover both requirements');
    }

    if (gaps.some(g => g.includes('Additional data requirements'))) {
      recommendations.push('Optimize data collection to serve multiple purposes');
    }

    // Frequency recommendations
    if (gaps.some(g => g.includes('Frequency mismatch'))) {
      recommendations.push('Align reporting frequencies or implement flexible scheduling');
    }

    // Priority recommendations
    if (gaps.some(g => g.includes('Priority mismatch'))) {
      recommendations.push('Establish unified priority framework across both requirements');
    }

    return recommendations;
  }

  /**
   * Compare scoring methodologies
   */
  private async compareScoringMethods(
    engine1: BaseFrameworkEngine,
    engine2: BaseFrameworkEngine
  ): Promise<ScoringComparison> {
    // Mock scoring comparison (in production, extract actual scoring methods)
    const mockAssessment1 = await engine1.assessCompliance();
    const mockAssessment2 = await engine2.assessCompliance();

    return {
      framework1Score: mockAssessment1.overallScore,
      framework2Score: mockAssessment2.overallScore,
      scoringMethodDifferences: [
        'Framework 1 uses weighted average across categories',
        'Framework 2 uses risk-adjusted scoring'
      ],
      weightingDifferences: [
        {
          category: 'Governance',
          framework1Weight: 25,
          framework2Weight: 20,
          impact: 'medium'
        },
        {
          category: 'Strategy',
          framework1Weight: 30,
          framework2Weight: 35,
          impact: 'low'
        }
      ],
      recommendedAlignment: [
        {
          category: 'Governance',
          recommendedWeight: 22.5,
          rationale: 'Average of both frameworks provides balanced approach'
        }
      ]
    };
  }

  /**
   * Compare implementation timelines
   */
  private async compareTimelines(
    info1: ComplianceFramework,
    info2: ComplianceFramework
  ): Promise<TimelineComparison> {
    // Mock timeline comparison (in production, extract actual timelines)
    return {
      framework1Timeline: '6-12 months',
      framework2Timeline: '9-15 months',
      sharedMilestones: [
        {
          milestone: 'Data Collection Setup',
          framework1Date: new Date('2024-03-31'),
          framework2Date: new Date('2024-04-15'),
          alignmentOpportunity: true
        }
      ],
      sequencingRecommendations: [
        {
          phase: 'Foundation Phase',
          frameworks: [info1.code, info2.code],
          duration: '2-3 months',
          dependencies: ['Data infrastructure', 'Team training']
        }
      ]
    };
  }

  /**
   * Identify integration opportunities
   */
  private async identifyIntegrationOpportunities(
    info1: ComplianceFramework,
    info2: ComplianceFramework,
    requirementComparison: DetailedRequirementComparison[]
  ): Promise<IntegrationOpportunity[]> {
    const opportunities: IntegrationOpportunity[] = [];

    // Data integration opportunities
    const dataOpportunities = this.identifyDataIntegrationOpportunities(requirementComparison);
    opportunities.push(...dataOpportunities);

    // Process integration opportunities
    const processOpportunities = this.identifyProcessIntegrationOpportunities(requirementComparison);
    opportunities.push(...processOpportunities);

    // Reporting integration opportunities
    const reportingOpportunities = this.identifyReportingIntegrationOpportunities(info1, info2);
    opportunities.push(...reportingOpportunities);

    return opportunities;
  }

  /**
   * Identify data integration opportunities
   */
  private identifyDataIntegrationOpportunities(
    requirementComparison: DetailedRequirementComparison[]
  ): IntegrationOpportunity[] {
    const opportunities: IntegrationOpportunity[] = [];

    const highOverlapRequirements = requirementComparison.filter(
      c => c.matchType === 'substantial' || c.matchType === 'exact'
    );

    if (highOverlapRequirements.length > 0) {
      opportunities.push({
        id: 'data_integration_1',
        type: 'data_integration',
        title: 'Unified Data Collection',
        description: `Consolidate data collection for ${highOverlapRequirements.length} overlapping requirements`,
        requirements: highOverlapRequirements.map(c => c.requirement1.id),
        benefitScore: highOverlapRequirements.length * 15,
        implementationEffort: 'medium',
        timelineSaving: highOverlapRequirements.length * 5,
        costSaving: highOverlapRequirements.length * 10,
        riskReduction: highOverlapRequirements.length * 8
      });
    }

    return opportunities;
  }

  /**
   * Identify process integration opportunities
   */
  private identifyProcessIntegrationOpportunities(
    requirementComparison: DetailedRequirementComparison[]
  ): IntegrationOpportunity[] {
    const opportunities: IntegrationOpportunity[] = [];

    const lowComplexityIntegrations = requirementComparison.filter(
      c => c.integrationComplexity === 'low' && c.matchType !== 'unique'
    );

    if (lowComplexityIntegrations.length > 0) {
      opportunities.push({
        id: 'process_integration_1',
        type: 'process_integration',
        title: 'Streamlined Assessment Process',
        description: `Unify assessment processes for ${lowComplexityIntegrations.length} similar requirements`,
        requirements: lowComplexityIntegrations.map(c => c.requirement1.id),
        benefitScore: lowComplexityIntegrations.length * 12,
        implementationEffort: 'low',
        timelineSaving: lowComplexityIntegrations.length * 3,
        costSaving: lowComplexityIntegrations.length * 8,
        riskReduction: lowComplexityIntegrations.length * 5
      });
    }

    return opportunities;
  }

  /**
   * Identify reporting integration opportunities
   */
  private identifyReportingIntegrationOpportunities(
    info1: ComplianceFramework,
    info2: ComplianceFramework
  ): IntegrationOpportunity[] {
    const opportunities: IntegrationOpportunity[] = [];

    // Check if frameworks have similar reporting periods
    const similarReporting = this.checkReportingSimilarity(info1, info2);

    if (similarReporting) {
      opportunities.push({
        id: 'reporting_integration_1',
        type: 'reporting_integration',
        title: 'Consolidated Reporting',
        description: `Combine reporting for ${info1.name} and ${info2.name}`,
        requirements: [],
        benefitScore: 40,
        implementationEffort: 'high',
        timelineSaving: 15,
        costSaving: 25,
        riskReduction: 20
      });
    }

    return opportunities;
  }

  /**
   * Check reporting similarity between frameworks
   */
  private checkReportingSimilarity(info1: ComplianceFramework, info2: ComplianceFramework): boolean {
    // Simplified check (in production, analyze actual reporting requirements)
    return info1.reportingPeriod === info2.reportingPeriod;
  }

  /**
   * Calculate overall compatibility score
   */
  private calculateCompatibilityScore(
    requirementComparison: DetailedRequirementComparison[]
  ): number {
    if (requirementComparison.length === 0) return 0;

    const totalSimilarity = requirementComparison.reduce((sum, c) => sum + c.similarity, 0);
    const averageSimilarity = totalSimilarity / requirementComparison.length;

    // Adjust for integration complexity
    const lowComplexityCount = requirementComparison.filter(c => c.integrationComplexity === 'low').length;
    const complexityBonus = (lowComplexityCount / requirementComparison.length) * 0.2;

    return Math.min(100, (averageSimilarity + complexityBonus) * 100);
  }

  /**
   * Calculate requirement overlap percentage
   */
  private calculateRequirementOverlap(
    requirementComparison: DetailedRequirementComparison[]
  ): number {
    const matchedRequirements = requirementComparison.filter(
      c => c.matchType !== 'unique' && c.matchType !== 'gap'
    );

    return requirementComparison.length > 0 ?
      (matchedRequirements.length / requirementComparison.length) * 100 : 0;
  }

  /**
   * Identify unique requirements
   */
  private identifyUniqueRequirements(
    requirementComparison: DetailedRequirementComparison[]
  ): { framework1Unique: string[]; framework2Unique: string[] } {
    const framework1Unique = requirementComparison
      .filter(c => c.matchType === 'unique' && c.requirement2 === null)
      .map(c => c.requirement1.id);

    const framework2Unique = requirementComparison
      .filter(c => c.matchType === 'gap')
      .map(c => c.requirement1.id);

    return { framework1Unique, framework2Unique };
  }

  /**
   * Perform gap analysis
   */
  private async performGapAnalysis(
    requirementComparison: DetailedRequirementComparison[]
  ): Promise<RequirementGap[]> {
    const gaps: RequirementGap[] = [];

    for (const comparison of requirementComparison) {
      if (comparison.gaps.length > 0) {
        gaps.push({
          id: `gap_${comparison.requirement1.id}`,
          requirementId: comparison.requirement1.id,
          gapType: this.categorizeGapType(comparison),
          description: comparison.gaps.join('; '),
          severity: this.assessGapSeverity(comparison),
          recommendedAction: comparison.recommendations.join('; '),
          implementationEffort: comparison.integrationComplexity,
          priority: this.calculateGapPriority(comparison)
        });
      }
    }

    return gaps.sort((a, b) => {
      const priorityScore = { high: 3, medium: 2, low: 1 };
      return priorityScore[b.priority] - priorityScore[a.priority];
    });
  }

  /**
   * Categorize gap type
   */
  private categorizeGapType(comparison: DetailedRequirementComparison): 'missing_requirement' | 'data_gap' | 'process_gap' | 'reporting_gap' {
    if (comparison.matchType === 'unique' || comparison.matchType === 'gap') {
      return 'missing_requirement';
    }

    if (comparison.gaps.some(g => g.includes('data requirements'))) {
      return 'data_gap';
    }

    if (comparison.gaps.some(g => g.includes('Frequency') || g.includes('Priority'))) {
      return 'process_gap';
    }

    return 'reporting_gap';
  }

  /**
   * Assess gap severity
   */
  private assessGapSeverity(comparison: DetailedRequirementComparison): 'low' | 'medium' | 'high' | 'critical' {
    if (comparison.matchType === 'unique' || comparison.matchType === 'gap') {
      return comparison.requirement1.priority === 'critical' ? 'critical' : 'high';
    }

    if (comparison.integrationComplexity === 'high') return 'high';
    if (comparison.gaps.length > 3) return 'medium';
    return 'low';
  }

  /**
   * Calculate gap priority
   */
  private calculateGapPriority(comparison: DetailedRequirementComparison): 'high' | 'medium' | 'low' {
    const severity = this.assessGapSeverity(comparison);
    const complexity = comparison.integrationComplexity;

    if (severity === 'critical' || (severity === 'high' && complexity !== 'high')) {
      return 'high';
    }

    if (severity === 'high' || (severity === 'medium' && complexity === 'low')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Assess integration complexity
   */
  private assessIntegrationComplexity(
    requirementComparison: DetailedRequirementComparison[]
  ): 'low' | 'medium' | 'high' {
    const complexityScores = { low: 1, medium: 2, high: 3 };

    const averageComplexity = requirementComparison.reduce(
      (sum, c) => sum + complexityScores[c.integrationComplexity], 0
    ) / requirementComparison.length;

    if (averageComplexity >= 2.5) return 'high';
    if (averageComplexity >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Generate recommended approach
   */
  private async generateRecommendedApproach(
    framework1Code: string,
    framework2Code: string,
    requirementComparison: DetailedRequirementComparison[],
    integrationOpportunities: IntegrationOpportunity[]
  ): Promise<string> {
    const compatibilityScore = this.calculateCompatibilityScore(requirementComparison);
    const integrationComplexity = this.assessIntegrationComplexity(requirementComparison);

    let approach = '';

    if (compatibilityScore >= 80) {
      approach = `High compatibility detected between ${framework1Code} and ${framework2Code}. `;
      approach += 'Recommended approach: Unified implementation with shared processes and consolidated reporting.';
    } else if (compatibilityScore >= 60) {
      approach = `Moderate compatibility between ${framework1Code} and ${framework2Code}. `;
      approach += 'Recommended approach: Phased integration focusing on high-overlap areas first.';
    } else if (compatibilityScore >= 40) {
      approach = `Limited compatibility between ${framework1Code} and ${framework2Code}. `;
      approach += 'Recommended approach: Parallel implementation with selective integration for data collection.';
    } else {
      approach = `Low compatibility between ${framework1Code} and ${framework2Code}. `;
      approach += 'Recommended approach: Independent implementation with minimal integration.';
    }

    // Add complexity considerations
    if (integrationComplexity === 'high') {
      approach += ' Consider engaging specialized consultants for complex integration points.';
    } else if (integrationComplexity === 'low') {
      approach += ' Integration appears straightforward and can be handled internally.';
    }

    // Add opportunity highlights
    if (integrationOpportunities.length > 0) {
      const topOpportunity = integrationOpportunities.sort((a, b) => b.benefitScore - a.benefitScore)[0];
      approach += ` Priority integration opportunity: ${topOpportunity.title}.`;
    }

    return approach;
  }
}

export default FrameworkComparator;