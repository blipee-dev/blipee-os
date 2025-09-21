/**
 * Cross-Framework Analysis Test Suite
 *
 * Tests for cross-framework analysis, comparison, and optimization systems.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CrossFrameworkAnalyzer } from '../analysis/cross-framework-analyzer';
import { FrameworkComparator } from '../analysis/framework-comparator';
import { ComplianceOptimizationEngine } from '../analysis/optimization-engine';
import { ComplianceAnalysisFactory } from '../analysis';

const TEST_ORG_ID = 'test-org-analysis';
const TEST_FRAMEWORKS = ['SEC_CLIMATE', 'TCFD', 'EU_CSRD'];

describe('CrossFrameworkAnalyzer', () => {
  let analyzer: CrossFrameworkAnalyzer;

  beforeEach(() => {
    analyzer = new CrossFrameworkAnalyzer(TEST_ORG_ID);
  });

  describe('Initialization', () => {
    it('should initialize with framework codes', async () => {
      await analyzer.initializeFrameworks(TEST_FRAMEWORKS);
      expect(analyzer).toBeDefined();
    });

    it('should handle empty framework list', async () => {
      await expect(analyzer.initializeFrameworks([])).resolves.not.toThrow();
    });

    it('should handle invalid framework codes gracefully', async () => {
      // Should skip invalid codes and continue with valid ones
      await analyzer.initializeFrameworks(['INVALID', 'SEC_CLIMATE', 'UNKNOWN']);
      expect(analyzer).toBeDefined();
    });
  });

  describe('Unified Strategy Generation', () => {
    beforeEach(async () => {
      await analyzer.initializeFrameworks(TEST_FRAMEWORKS);
    });

    it('should generate unified compliance strategy', async () => {
      const strategy = await analyzer.generateUnifiedStrategy();

      expect(strategy).toBeDefined();
      expect(strategy.id).toBeDefined();
      expect(strategy.organizationId).toBe(TEST_ORG_ID);
      expect(strategy.activeFrameworks).toEqual(TEST_FRAMEWORKS);
      expect(strategy.optimizationPotential).toBeDefined();
      expect(strategy.implementationPlan).toBeInstanceOf(Array);
      expect(strategy.priorityActions).toBeInstanceOf(Array);
      expect(strategy.resourceOptimization).toBeDefined();
      expect(strategy.timeline).toBeDefined();
    });

    it('should include optimization potential metrics', async () => {
      const strategy = await analyzer.generateUnifiedStrategy();

      expect(strategy.optimizationPotential.effortReduction).toBeGreaterThanOrEqual(0);
      expect(strategy.optimizationPotential.costSaving).toBeGreaterThanOrEqual(0);
      expect(strategy.optimizationPotential.timelineSaving).toBeGreaterThanOrEqual(0);
      expect(strategy.optimizationPotential.riskReduction).toBeGreaterThanOrEqual(0);
    });

    it('should provide implementation plan', async () => {
      const strategy = await analyzer.generateUnifiedStrategy();

      expect(strategy.implementationPlan.length).toBeGreaterThan(0);
      strategy.implementationPlan.forEach(phase => {
        expect(phase.phase).toBeDefined();
        expect(phase.duration).toBeDefined();
        expect(phase.actions).toBeInstanceOf(Array);
      });
    });

    it('should identify priority actions', async () => {
      const strategy = await analyzer.generateUnifiedStrategy();

      expect(strategy.priorityActions.length).toBeGreaterThan(0);
      strategy.priorityActions.forEach(action => {
        expect(action.action).toBeDefined();
        expect(action.frameworks).toBeInstanceOf(Array);
        expect(action.priority).toMatch(/high|medium|low/);
      });
    });
  });

  describe('Framework Overlaps Analysis', () => {
    beforeEach(async () => {
      await analyzer.initializeFrameworks(TEST_FRAMEWORKS);
    });

    it('should identify framework overlaps', () => {
      const overlaps = analyzer.getFrameworkOverlaps();

      expect(overlaps).toBeInstanceOf(Array);
      overlaps.forEach(overlap => {
        expect(overlap.id).toBeDefined();
        expect(overlap.sourceFramework).toBeDefined();
        expect(overlap.targetFramework).toBeDefined();
        expect(overlap.overlapPercentage).toBeGreaterThanOrEqual(0);
        expect(overlap.overlapPercentage).toBeLessThanOrEqual(100);
        expect(overlap.sharedRequirements).toBeGreaterThanOrEqual(0);
      });
    });

    it('should calculate overlap percentages correctly', () => {
      const overlaps = analyzer.getFrameworkOverlaps();

      // Should have overlaps between TCFD and SEC_CLIMATE (both climate-focused)
      const tcfdSecOverlap = overlaps.find(o =>
        (o.sourceFramework === 'TCFD' && o.targetFramework === 'SEC_CLIMATE') ||
        (o.sourceFramework === 'SEC_CLIMATE' && o.targetFramework === 'TCFD')
      );

      if (tcfdSecOverlap) {
        expect(tcfdSecOverlap.overlapPercentage).toBeGreaterThan(30); // Expected significant overlap
      }
    });

    it('should sort overlaps by percentage', () => {
      const overlaps = analyzer.getFrameworkOverlaps();

      for (let i = 1; i < overlaps.length; i++) {
        expect(overlaps[i].overlapPercentage).toBeLessThanOrEqual(overlaps[i - 1].overlapPercentage);
      }
    });
  });

  describe('Optimization Recommendations', () => {
    beforeEach(async () => {
      await analyzer.initializeFrameworks(TEST_FRAMEWORKS);
    });

    it('should generate optimization recommendations', () => {
      const recommendations = analyzer.getOptimizationRecommendations();

      expect(recommendations).toBeInstanceOf(Array);
      recommendations.forEach(rec => {
        expect(rec.id).toBeDefined();
        expect(rec.type).toMatch(/data_collection|process_optimization/);
        expect(rec.title).toBeDefined();
        expect(rec.frameworks).toBeInstanceOf(Array);
        expect(rec.effortReduction).toBeGreaterThanOrEqual(0);
        expect(rec.costSaving).toBeGreaterThanOrEqual(0);
        expect(rec.priority).toMatch(/high|medium|low/);
      });
    });

    it('should prioritize high-impact recommendations', () => {
      const recommendations = analyzer.getOptimizationRecommendations();

      if (recommendations.length > 1) {
        const firstRec = recommendations[0];
        const lastRec = recommendations[recommendations.length - 1];

        const firstImpact = firstRec.effortReduction + firstRec.costSaving;
        const lastImpact = lastRec.effortReduction + lastRec.costSaving;

        expect(firstImpact).toBeGreaterThanOrEqual(lastImpact);
      }
    });
  });

  describe('Unified Dashboard', () => {
    beforeEach(async () => {
      await analyzer.initializeFrameworks(TEST_FRAMEWORKS);
    });

    it('should create unified dashboard configuration', async () => {
      const dashboard = await analyzer.createUnifiedDashboard();

      expect(dashboard).toBeDefined();
      expect(dashboard.id).toBeDefined();
      expect(dashboard.organizationId).toBe(TEST_ORG_ID);
      expect(dashboard.activeFrameworks).toEqual(TEST_FRAMEWORKS);
      expect(dashboard.consolidatedMetrics).toBeInstanceOf(Array);
      expect(dashboard.overallScore).toBeGreaterThanOrEqual(0);
      expect(dashboard.overallScore).toBeLessThanOrEqual(100);
      expect(dashboard.riskLevel).toMatch(/low|medium|high|critical/);
      expect(dashboard.nextDeadlines).toBeInstanceOf(Array);
    });

    it('should include consolidated metrics', async () => {
      const dashboard = await analyzer.createUnifiedDashboard();

      dashboard.consolidatedMetrics.forEach(metric => {
        expect(metric.id).toBeDefined();
        expect(metric.name).toBeDefined();
        expect(metric.frameworks).toBeInstanceOf(Array);
        expect(metric.frameworks.length).toBeGreaterThan(0);
        expect(metric.target).toBeGreaterThan(0);
        expect(metric.current).toBeGreaterThanOrEqual(0);
        expect(metric.trend).toMatch(/improving|declining|stable/);
      });
    });

    it('should assess risk level accurately', async () => {
      const dashboard = await analyzer.createUnifiedDashboard();

      // Risk level should be based on overall score and deadlines
      if (dashboard.overallScore < 60) {
        expect(['high', 'critical']).toContain(dashboard.riskLevel);
      } else if (dashboard.overallScore >= 90) {
        expect(['low', 'medium']).toContain(dashboard.riskLevel);
      }
    });
  });
});

describe('FrameworkComparator', () => {
  let comparator: FrameworkComparator;

  beforeEach(() => {
    comparator = new FrameworkComparator(TEST_ORG_ID);
  });

  describe('Framework Comparison', () => {
    it('should compare two frameworks', async () => {
      const comparison = await comparator.compareFrameworks('SEC_CLIMATE', 'TCFD');

      expect(comparison).toBeDefined();
      expect(comparison.id).toBeDefined();
      expect(comparison.framework1).toBe('SEC_CLIMATE');
      expect(comparison.framework2).toBe('TCFD');
      expect(comparison.comparisonDate).toBeInstanceOf(Date);
      expect(comparison.overallCompatibility).toBeGreaterThanOrEqual(0);
      expect(comparison.overallCompatibility).toBeLessThanOrEqual(100);
      expect(comparison.requirementOverlap).toBeGreaterThanOrEqual(0);
      expect(comparison.integrationComplexity).toMatch(/low|medium|high/);
    });

    it('should identify unique requirements', async () => {
      const comparison = await comparator.compareFrameworks('SEC_CLIMATE', 'EU_CSRD');

      expect(comparison.uniqueRequirements).toBeDefined();
      expect(comparison.uniqueRequirements.framework1Unique).toBeInstanceOf(Array);
      expect(comparison.uniqueRequirements.framework2Unique).toBeInstanceOf(Array);
    });

    it('should perform gap analysis', async () => {
      const comparison = await comparator.compareFrameworks('TCFD', 'GRI');

      expect(comparison.gapAnalysis).toBeInstanceOf(Array);
      comparison.gapAnalysis.forEach(gap => {
        expect(gap.id).toBeDefined();
        expect(gap.requirementId).toBeDefined();
        expect(gap.gapType).toMatch(/missing_requirement|data_gap|process_gap|reporting_gap/);
        expect(gap.severity).toMatch(/low|medium|high|critical/);
        expect(gap.priority).toMatch(/high|medium|low/);
      });
    });

    it('should generate recommended approach', async () => {
      const comparison = await comparator.compareFrameworks('SEC_CLIMATE', 'TCFD');

      expect(comparison.recommendedApproach).toBeDefined();
      expect(comparison.recommendedApproach.length).toBeGreaterThan(0);
      expect(comparison.recommendedApproach).toContain('approach');
    });

    it('should provide detailed comparison data', async () => {
      const comparison = await comparator.compareFrameworks('EU_CSRD', 'GRI');

      expect(comparison.detailedComparison).toBeDefined();
      expect(comparison.detailedComparison.requirements).toBeInstanceOf(Array);
      expect(comparison.detailedComparison.scoring).toBeDefined();
      expect(comparison.detailedComparison.timeline).toBeDefined();
      expect(comparison.detailedComparison.integration).toBeInstanceOf(Array);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid framework codes', async () => {
      await expect(
        comparator.compareFrameworks('INVALID', 'SEC_CLIMATE')
      ).rejects.toThrow();
    });

    it('should handle same framework comparison', async () => {
      const comparison = await comparator.compareFrameworks('SEC_CLIMATE', 'SEC_CLIMATE');

      expect(comparison.overallCompatibility).toBe(100);
      expect(comparison.requirementOverlap).toBe(100);
    });
  });
});

describe('ComplianceOptimizationEngine', () => {
  let optimizationEngine: ComplianceOptimizationEngine;

  beforeEach(() => {
    optimizationEngine = new ComplianceOptimizationEngine(TEST_ORG_ID);
  });

  describe('Optimization Analysis', () => {
    it('should analyze and optimize compliance operations', async () => {
      const analysis = await optimizationEngine.analyzeAndOptimize(TEST_FRAMEWORKS);

      expect(analysis).toBeDefined();
      expect(analysis.currentEfficiency).toBeDefined();
      expect(analysis.optimizationOpportunities).toBeInstanceOf(Array);
      expect(analysis.impactAnalysis).toBeInstanceOf(Array);
      expect(analysis.implementationRoadmap).toBeInstanceOf(Array);
      expect(analysis.roiAnalysis).toBeInstanceOf(Array);
    });

    it('should assess current efficiency metrics', async () => {
      const analysis = await optimizationEngine.analyzeAndOptimize(TEST_FRAMEWORKS);

      const efficiency = analysis.currentEfficiency;
      expect(efficiency.overall_efficiency).toBeGreaterThanOrEqual(0);
      expect(efficiency.overall_efficiency).toBeLessThanOrEqual(100);
      expect(efficiency.data_collection_efficiency).toBeGreaterThanOrEqual(0);
      expect(efficiency.process_automation_level).toBeGreaterThanOrEqual(0);
      expect(efficiency.frameworks_covered).toBe(TEST_FRAMEWORKS.length);
    });

    it('should identify optimization opportunities', async () => {
      const analysis = await optimizationEngine.analyzeAndOptimize(TEST_FRAMEWORKS);

      expect(analysis.optimizationOpportunities.length).toBeGreaterThan(0);
      analysis.optimizationOpportunities.forEach(opportunity => {
        expect(opportunity.id).toBeDefined();
        expect(opportunity.category).toBeDefined();
        expect(opportunity.title).toBeDefined();
        expect(opportunity.expectedBenefit).toBeGreaterThanOrEqual(0);
        expect(opportunity.costSaving).toBeGreaterThanOrEqual(0);
        expect(opportunity.priority).toMatch(/high|medium|low/);
        expect(opportunity.implementationEffort).toMatch(/low|medium|high/);
      });
    });

    it('should calculate impact analysis', async () => {
      const analysis = await optimizationEngine.analyzeAndOptimize(TEST_FRAMEWORKS);

      analysis.impactAnalysis.forEach(impact => {
        expect(impact.category).toBeDefined();
        expect(impact.currentState).toBeDefined();
        expect(impact.optimizedState).toBeDefined();
        expect(impact.improvement).toBeDefined();

        // Optimized state should be better than current
        expect(impact.optimizedState.efficiency).toBeGreaterThanOrEqual(impact.currentState.efficiency);
        expect(impact.optimizedState.cost).toBeLessThanOrEqual(impact.currentState.cost);
      });
    });

    it('should generate implementation roadmap', async () => {
      const analysis = await optimizationEngine.analyzeAndOptimize(TEST_FRAMEWORKS);

      expect(analysis.implementationRoadmap.length).toBeGreaterThan(0);
      analysis.implementationRoadmap.forEach(phase => {
        expect(phase.phase).toBeDefined();
        expect(phase.duration).toBeDefined();
        expect(phase.optimizations).toBeInstanceOf(Array);
        expect(phase.prerequisites).toBeInstanceOf(Array);
        expect(phase.deliverables).toBeInstanceOf(Array);
        expect(phase.successCriteria).toBeInstanceOf(Array);
      });
    });

    it('should calculate ROI for optimizations', async () => {
      const analysis = await optimizationEngine.analyzeAndOptimize(TEST_FRAMEWORKS);

      analysis.roiAnalysis.forEach(roi => {
        expect(roi.optimizationId).toBeDefined();
        expect(roi.investmentRequired).toBeDefined();
        expect(roi.expectedSavings).toBeDefined();
        expect(roi.paybackPeriod).toBeGreaterThan(0);
        expect(roi.roi).toBeDefined(); // Can be negative
        expect(roi.npv).toBeDefined();
        expect(roi.riskAdjustedROI).toBeLessThanOrEqual(roi.roi);
      });
    });
  });

  describe('Optimization Report', () => {
    it('should generate comprehensive optimization report', async () => {
      const report = await optimizationEngine.generateOptimizationReport(TEST_FRAMEWORKS);

      expect(report).toBeDefined();
      expect(report.executiveSummary).toBeDefined();
      expect(report.executiveSummary.length).toBeGreaterThan(100); // Should be substantial
      expect(report.keyFindings).toBeInstanceOf(Array);
      expect(report.recommendations).toBeInstanceOf(Array);
      expect(report.quickWins).toBeInstanceOf(Array);
      expect(report.strategicInitiatives).toBeInstanceOf(Array);
      expect(report.implementationPriorities).toBeInstanceOf(Array);
    });

    it('should identify quick wins', async () => {
      const report = await optimizationEngine.generateOptimizationReport(TEST_FRAMEWORKS);

      report.quickWins.forEach(win => {
        expect(win.priority).toBe('high');
        expect(win.implementationEffort).toBe('low');
      });
    });

    it('should identify strategic initiatives', async () => {
      const report = await optimizationEngine.generateOptimizationReport(TEST_FRAMEWORKS);

      report.strategicInitiatives.forEach(initiative => {
        expect(initiative.implementationEffort).toBe('high');
        const totalBenefit = initiative.expectedBenefit + initiative.costSaving + initiative.timelineSaving;
        expect(totalBenefit).toBeGreaterThan(150);
      });
    });
  });
});

describe('ComplianceAnalysisFactory', () => {
  let factory: ComplianceAnalysisFactory;

  beforeEach(() => {
    factory = new ComplianceAnalysisFactory(TEST_ORG_ID);
  });

  describe('Factory Methods', () => {
    it('should create cross-framework analyzer', () => {
      const analyzer = factory.createCrossFrameworkAnalyzer();
      expect(analyzer).toBeInstanceOf(CrossFrameworkAnalyzer);
    });

    it('should create framework comparator', () => {
      const comparator = factory.createFrameworkComparator();
      expect(comparator).toBeInstanceOf(FrameworkComparator);
    });

    it('should create optimization engine', () => {
      const engine = factory.createOptimizationEngine();
      expect(engine).toBeInstanceOf(ComplianceOptimizationEngine);
    });
  });

  describe('Comprehensive Analysis', () => {
    it('should perform comprehensive analysis', async () => {
      const analysis = await factory.performComprehensiveAnalysis(TEST_FRAMEWORKS);

      expect(analysis).toBeDefined();
      expect(analysis.unifiedStrategy).toBeDefined();
      expect(analysis.frameworkOverlaps).toBeInstanceOf(Array);
      expect(analysis.optimizationRecommendations).toBeInstanceOf(Array);
      expect(analysis.unifiedDashboard).toBeDefined();
      expect(analysis.optimizationAnalysis).toBeDefined();
      expect(analysis.optimizationReport).toBeDefined();
      expect(analysis.summary).toBeDefined();
    });

    it('should provide analysis summary', async () => {
      const analysis = await factory.performComprehensiveAnalysis(TEST_FRAMEWORKS);

      expect(analysis.summary.frameworkCount).toBe(TEST_FRAMEWORKS.length);
      expect(analysis.summary.overallCompatibility).toBeGreaterThanOrEqual(0);
      expect(analysis.summary.overallCompatibility).toBeLessThanOrEqual(100);
      expect(analysis.summary.optimizationPotential).toBeGreaterThanOrEqual(0);
      expect(analysis.summary.expectedROI).toBeDefined();
    });
  });

  describe('Pairwise Comparison', () => {
    it('should perform framework comparison', async () => {
      const comparison = await factory.performFrameworkComparison('SEC_CLIMATE', 'TCFD');

      expect(comparison).toBeDefined();
      expect(comparison.framework1).toBe('SEC_CLIMATE');
      expect(comparison.framework2).toBe('TCFD');
    });
  });
});

describe('Performance and Scalability', () => {
  let factory: ComplianceAnalysisFactory;

  beforeEach(() => {
    factory = new ComplianceAnalysisFactory(TEST_ORG_ID);
  });

  it('should handle analysis of all frameworks within reasonable time', async () => {
    const allFrameworks = ['SEC_CLIMATE', 'EU_CSRD', 'TCFD', 'GRI', 'CDP', 'SBTi', 'ISO_14001'];

    const start = performance.now();
    const analysis = await factory.performComprehensiveAnalysis(allFrameworks);
    const duration = performance.now() - start;

    expect(analysis).toBeDefined();
    expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
  });

  it('should handle concurrent analyses', async () => {
    const frameworkSets = [
      ['SEC_CLIMATE', 'TCFD'],
      ['EU_CSRD', 'GRI'],
      ['CDP', 'SBTi']
    ];

    const promises = frameworkSets.map(frameworks =>
      factory.performComprehensiveAnalysis(frameworks)
    );

    const results = await Promise.all(promises);

    results.forEach((result, index) => {
      expect(result).toBeDefined();
      expect(result.summary.frameworkCount).toBe(frameworkSets[index].length);
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  let factory: ComplianceAnalysisFactory;

  beforeEach(() => {
    factory = new ComplianceAnalysisFactory(TEST_ORG_ID);
  });

  it('should handle single framework analysis', async () => {
    const analysis = await factory.performComprehensiveAnalysis(['SEC_CLIMATE']);

    expect(analysis).toBeDefined();
    expect(analysis.summary.frameworkCount).toBe(1);
    expect(analysis.frameworkOverlaps.length).toBe(0); // No overlaps with single framework
  });

  it('should handle invalid organization ID', () => {
    expect(() => {
      new ComplianceAnalysisFactory('');
    }).toThrow();
  });

  it('should handle missing compliance data gracefully', async () => {
    const analyzer = factory.createCrossFrameworkAnalyzer();
    await analyzer.initializeFrameworks(['SEC_CLIMATE']);

    // Should not throw even with minimal data
    const strategy = await analyzer.generateUnifiedStrategy();
    expect(strategy).toBeDefined();
  });
});