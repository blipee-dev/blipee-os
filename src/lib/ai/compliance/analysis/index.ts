/**
 * Compliance Analysis Module Index
 *
 * Provides comprehensive cross-framework analysis, optimization, and comparison
 * capabilities for multi-framework compliance management.
 */

export { CrossFrameworkAnalyzer } from './cross-framework-analyzer';
export { FrameworkComparator } from './framework-comparator';
export { ComplianceOptimizationEngine } from './optimization-engine';

// Re-export types for convenience
export type {
  FrameworkOverlap,
  ComplianceOptimization,
  UnifiedComplianceStrategy,
  FrameworkComparison,
  RequirementGap,
  IntegrationOpportunity,
  OptimizationRecommendation,
  ResourceOptimization,
  ProcessOptimization,
  ComplianceEfficiencyMetrics
} from '../types';

/**
 * Unified Analysis Factory
 *
 * Provides convenient access to all analysis capabilities
 */
export class ComplianceAnalysisFactory {
  private organizationId: string;

  constructor(organizationId: string) {
    this.organizationId = organizationId;
  }

  /**
   * Create cross-framework analyzer
   */
  public createCrossFrameworkAnalyzer(): CrossFrameworkAnalyzer {
    return new CrossFrameworkAnalyzer(this.organizationId);
  }

  /**
   * Create framework comparator
   */
  public createFrameworkComparator(): FrameworkComparator {
    return new FrameworkComparator(this.organizationId);
  }

  /**
   * Create optimization engine
   */
  public createOptimizationEngine(): ComplianceOptimizationEngine {
    return new ComplianceOptimizationEngine(this.organizationId);
  }

  /**
   * Perform comprehensive analysis across all frameworks
   */
  public async performComprehensiveAnalysis(frameworkCodes: string[]) {
    const crossFrameworkAnalyzer = this.createCrossFrameworkAnalyzer();
    const optimizationEngine = this.createOptimizationEngine();

    // Initialize analyzers
    await crossFrameworkAnalyzer.initializeFrameworks(frameworkCodes);

    // Generate unified strategy
    const unifiedStrategy = await crossFrameworkAnalyzer.generateUnifiedStrategy();

    // Get framework overlaps
    const frameworkOverlaps = crossFrameworkAnalyzer.getFrameworkOverlaps();

    // Get optimization recommendations
    const optimizationRecommendations = crossFrameworkAnalyzer.getOptimizationRecommendations();

    // Create unified dashboard
    const unifiedDashboard = await crossFrameworkAnalyzer.createUnifiedDashboard();

    // Perform optimization analysis
    const optimizationAnalysis = await optimizationEngine.analyzeAndOptimize(frameworkCodes);

    // Generate optimization report
    const optimizationReport = await optimizationEngine.generateOptimizationReport(frameworkCodes);

    return {
      unifiedStrategy,
      frameworkOverlaps,
      optimizationRecommendations,
      unifiedDashboard,
      optimizationAnalysis,
      optimizationReport,
      summary: {
        frameworkCount: frameworkCodes.length,
        overallCompatibility: this.calculateAverageCompatibility(frameworkOverlaps),
        optimizationPotential: this.calculateOptimizationPotential(optimizationRecommendations),
        implementationTimeline: unifiedStrategy.timeline,
        expectedROI: optimizationAnalysis.roiAnalysis.reduce((sum, roi) => sum + roi.roi, 0) / optimizationAnalysis.roiAnalysis.length
      }
    };
  }

  /**
   * Perform pairwise framework comparison
   */
  public async performFrameworkComparison(framework1: string, framework2: string) {
    const comparator = this.createFrameworkComparator();
    return await comparator.compareFrameworks(framework1, framework2);
  }

  /**
   * Calculate average compatibility across framework overlaps
   */
  private calculateAverageCompatibility(overlaps: any[]): number {
    if (overlaps.length === 0) return 0;

    const totalCompatibility = overlaps.reduce((sum, overlap) => sum + overlap.overlapPercentage, 0);
    return Math.round(totalCompatibility / overlaps.length);
  }

  /**
   * Calculate optimization potential score
   */
  private calculateOptimizationPotential(recommendations: any[]): number {
    if (recommendations.length === 0) return 0;

    const totalBenefit = recommendations.reduce((sum, rec) =>
      sum + rec.effortReduction + rec.costSaving + rec.riskReduction, 0
    );

    return Math.min(100, Math.round(totalBenefit / recommendations.length));
  }
}

/**
 * Utility functions for analysis operations
 */
export const ComplianceAnalysisUtils = {
  /**
   * Validate framework codes
   */
  validateFrameworkCodes: (frameworkCodes: string[]): boolean => {
    const validCodes = ['SEC_CLIMATE', 'EU_CSRD', 'TCFD', 'GRI', 'CDP', 'SBTi', 'ISO_14001'];
    return frameworkCodes.every(code => validCodes.includes(code));
  },

  /**
   * Calculate framework priority matrix
   */
  calculateFrameworkPriority: (
    frameworkCodes: string[],
    organizationContext: any
  ): Record<string, 'high' | 'medium' | 'low'> => {
    const priorities: Record<string, 'high' | 'medium' | 'low'> = {};

    for (const code of frameworkCodes) {
      // Simplified priority calculation
      if (['SEC_CLIMATE', 'EU_CSRD'].includes(code)) {
        priorities[code] = 'high'; // Mandatory frameworks
      } else if (['TCFD', 'GRI'].includes(code)) {
        priorities[code] = 'medium'; // High-value voluntary frameworks
      } else {
        priorities[code] = 'low'; // Other frameworks
      }
    }

    return priorities;
  },

  /**
   * Estimate total implementation timeline
   */
  estimateImplementationTimeline: (frameworkCodes: string[]): string => {
    const baseTimeline = 12; // weeks
    const additionalPerFramework = 4; // weeks

    const totalWeeks = baseTimeline + (frameworkCodes.length - 1) * additionalPerFramework;

    if (totalWeeks <= 16) return `${totalWeeks} weeks`;
    if (totalWeeks <= 24) return `${Math.round(totalWeeks / 4)} months`;
    return `${Math.round(totalWeeks / 12)} quarters`;
  },

  /**
   * Calculate resource requirements
   */
  calculateResourceRequirements: (frameworkCodes: string[]): {
    teamSize: number;
    skillsRequired: string[];
    budgetEstimate: string;
  } => {
    const baseTeamSize = 3;
    const additionalPerFramework = 1;

    const teamSize = baseTeamSize + Math.floor(frameworkCodes.length / 2) * additionalPerFramework;

    const skillsRequired = [
      'Compliance expertise',
      'Data analysis',
      'Process automation',
      'Project management',
      'Technical integration'
    ];

    const baseBudget = 250000;
    const additionalPerFramework = 75000;
    const totalBudget = baseBudget + (frameworkCodes.length - 1) * additionalPerFramework;

    return {
      teamSize,
      skillsRequired,
      budgetEstimate: `$${totalBudget.toLocaleString()}`
    };
  }
};

export default {
  ComplianceAnalysisFactory,
  ComplianceAnalysisUtils,
  CrossFrameworkAnalyzer,
  FrameworkComparator,
  ComplianceOptimizationEngine
};