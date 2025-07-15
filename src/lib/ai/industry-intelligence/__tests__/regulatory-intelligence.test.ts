/**
 * Test suite for Predictive Regulatory Intelligence
 */

import { 
  RegulatoryIntelligenceEngine,
  RegulatoryChangeType,
  ChangeImpact 
} from '../regulatory-intelligence';
import { IndustryClassification } from '../types';

describe('RegulatoryIntelligenceEngine', () => {
  let engine: RegulatoryIntelligenceEngine;

  beforeEach(() => {
    engine = new RegulatoryIntelligenceEngine();
  });

  describe('predictRegulatoryChanges', () => {
    it('should predict regulatory changes for manufacturing industry', async () => {
      const predictions = await engine.predictRegulatoryChanges(
        IndustryClassification.MANUFACTURING,
        ['US', 'EU'],
        {
          timeHorizon: '24_months',
          confidenceThreshold: 0.6,
          includeEmergingTrends: true
        }
      );

      expect(predictions).toBeDefined();
      expect(predictions.predictions.length).toBeGreaterThan(0);
      expect(predictions.jurisdiction).toEqual(['US', 'EU']);
      expect(predictions.industry).toBe(IndustryClassification.MANUFACTURING);
      
      const highConfidencePredictions = predictions.predictions.filter(
        p => p.confidence >= 0.6
      );
      expect(highConfidencePredictions.length).toBeGreaterThan(0);
    });

    it('should predict changes with different time horizons', async () => {
      const shortTerm = await engine.predictRegulatoryChanges(
        IndustryClassification.OIL_AND_GAS,
        ['US'],
        { timeHorizon: '6_months' }
      );

      const longTerm = await engine.predictRegulatoryChanges(
        IndustryClassification.OIL_AND_GAS,
        ['US'],
        { timeHorizon: '60_months' }
      );

      expect(shortTerm.predictions.length).toBeLessThanOrEqual(longTerm.predictions.length);
      expect(shortTerm.predictions.every(p => p.confidence >= longTerm.predictions[0]?.confidence || 0)).toBe(true);
    });
  });

  describe('analyzeRegulatoryTrends', () => {
    it('should analyze trends in carbon pricing regulations', async () => {
      const trends = await engine.analyzeRegulatoryTrends(
        'carbon_pricing',
        ['US', 'EU', 'UK'],
        {
          historicalPeriod: '5_years',
          includeSubnational: true
        }
      );

      expect(trends).toBeDefined();
      expect(trends.trendType).toBe('carbon_pricing');
      expect(trends.trajectory.direction).toMatch(/increasing|stable|decreasing/);
      expect(trends.trajectory.acceleration).toMatch(/accelerating|steady|decelerating/);
      expect(trends.jurisdictionalVariation.length).toBeGreaterThan(0);
    });

    it('should identify regulatory convergence patterns', async () => {
      const trends = await engine.analyzeRegulatoryTrends(
        'scope3_disclosure',
        ['US', 'EU', 'UK', 'Canada'],
        { includeConvergenceAnalysis: true }
      );

      expect(trends.convergenceAnalysis).toBeDefined();
      expect(trends.convergenceAnalysis?.convergenceScore).toBeGreaterThanOrEqual(0);
      expect(trends.convergenceAnalysis?.convergenceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('assessImpact', () => {
    it('should assess high impact for scope 3 disclosure requirements', async () => {
      const impact = await engine.assessImpact(
        'org-123',
        {
          id: 'scope3-disclosure-rule',
          jurisdiction: 'US',
          title: 'SEC Climate Disclosure Rule',
          type: RegulatoryChangeType.DISCLOSURE_EXPANSION,
          effectiveDate: new Date('2025-01-01'),
          confidence: 0.85,
          description: 'Mandatory scope 3 emissions disclosure',
          affectedIndustries: [IndustryClassification.MANUFACTURING],
          requirements: ['scope3_emissions', 'transition_plans'],
          implementationTimeline: '18_months'
        },
        {
          industry: IndustryClassification.MANUFACTURING,
          jurisdictions: ['US'],
          currentScope3Tracking: false,
          annualRevenue: 500000000
        }
      );

      expect(impact.overall).toBe(ChangeImpact.HIGH);
      expect(impact.operational.effort).toBe(ChangeImpact.HIGH);
      expect(impact.financial.cost).toBeGreaterThan(0);
      expect(impact.timeline.preparation).toMatch(/\d+\s+(months|weeks)/);
    });

    it('should assess low impact for already compliant organizations', async () => {
      const impact = await engine.assessImpact(
        'org-456',
        {
          id: 'basic-reporting-rule',
          jurisdiction: 'US',
          title: 'Basic ESG Reporting',
          type: RegulatoryChangeType.REPORTING_ENHANCEMENT,
          effectiveDate: new Date('2024-06-01'),
          confidence: 0.9,
          description: 'Basic ESG metrics reporting',
          affectedIndustries: [IndustryClassification.TECHNOLOGY],
          requirements: ['basic_esg_metrics'],
          implementationTimeline: '6_months'
        },
        {
          industry: IndustryClassification.TECHNOLOGY,
          jurisdictions: ['US'],
          currentESGReporting: true,
          complianceMaturity: 'advanced'
        }
      );

      expect(impact.overall).toBe(ChangeImpact.LOW);
      expect(impact.operational.effort).toBe(ChangeImpact.LOW);
    });
  });

  describe('generateComplianceStrategy', () => {
    it('should generate comprehensive compliance strategy', async () => {
      const predictions = await engine.predictRegulatoryChanges(
        IndustryClassification.MANUFACTURING,
        ['US', 'EU'],
        { timeHorizon: '24_months' }
      );

      const strategy = await engine.generateComplianceStrategy(
        'org-123',
        predictions.predictions.slice(0, 3),
        {
          budget: 2000000,
          timeframe: '24_months',
          riskTolerance: 'medium',
          priorities: ['cost_efficiency', 'early_compliance']
        }
      );

      expect(strategy).toBeDefined();
      expect(strategy.organizationId).toBe('org-123');
      expect(strategy.approach).toMatch(/proactive|reactive|hybrid/);
      expect(strategy.phases.length).toBeGreaterThan(0);
      expect(strategy.totalCost).toBeLessThanOrEqual(2000000);
    });

    it('should prioritize high-impact changes', async () => {
      const highImpactChange = {
        id: 'high-impact-rule',
        jurisdiction: 'EU',
        title: 'CSRD Implementation',
        type: RegulatoryChangeType.DISCLOSURE_EXPANSION,
        effectiveDate: new Date('2025-01-01'),
        confidence: 0.95,
        description: 'Corporate Sustainability Reporting Directive',
        affectedIndustries: [IndustryClassification.MANUFACTURING],
        requirements: ['scope3_emissions', 'transition_plans', 'taxonomy_alignment'],
        implementationTimeline: '24_months'
      };

      const strategy = await engine.generateComplianceStrategy(
        'org-456',
        [highImpactChange],
        { riskTolerance: 'low' }
      );

      expect(strategy.phases[0].priority).toBe('critical');
      expect(strategy.phases[0].changes).toContain('high-impact-rule');
    });
  });

  describe('monitorRegulatory', () => {
    it('should set up monitoring for specified jurisdictions', async () => {
      const monitoring = await engine.monitorRegulatory(
        'org-123',
        ['US', 'EU', 'UK'],
        IndustryClassification.MANUFACTURING,
        {
          alertThreshold: 0.7,
          categories: ['disclosure', 'operational', 'governance'],
          notificationFreency: 'weekly'
        }
      );

      expect(monitoring).toBeDefined();
      expect(monitoring.monitoringId).toBeDefined();
      expect(monitoring.jurisdictions).toEqual(['US', 'EU', 'UK']);
      expect(monitoring.alertSettings.threshold).toBe(0.7);
    });
  });

  describe('getEarlyWarningSignals', () => {
    it('should identify early warning signals', async () => {
      const signals = await engine.getEarlyWarningSignals(
        ['US', 'EU'],
        IndustryClassification.OIL_AND_GAS,
        {
          lookAheadPeriod: '12_months',
          signalTypes: ['legislative', 'regulatory', 'judicial', 'industry']
        }
      );

      expect(signals.length).toBeGreaterThan(0);
      expect(signals[0]).toHaveProperty('type');
      expect(signals[0]).toHaveProperty('strength');
      expect(signals[0]).toHaveProperty('description');
      expect(signals[0]).toHaveProperty('implications');
    });
  });

  describe('benchmarkCompliance', () => {
    it('should benchmark organization against peers', async () => {
      const benchmark = await engine.benchmarkCompliance(
        'org-123',
        {
          industry: IndustryClassification.MANUFACTURING,
          jurisdiction: 'US',
          organizationSize: 'large',
          currentCompliance: {
            scope1_reporting: true,
            scope2_reporting: true,
            scope3_reporting: false,
            transition_plan: false,
            climate_governance: true
          }
        }
      );

      expect(benchmark).toBeDefined();
      expect(benchmark.overallScore).toBeGreaterThanOrEqual(0);
      expect(benchmark.overallScore).toBeLessThanOrEqual(100);
      expect(benchmark.peerComparison.percentile).toBeGreaterThanOrEqual(0);
      expect(benchmark.peerComparison.percentile).toBeLessThanOrEqual(100);
      expect(benchmark.gaps.length).toBeGreaterThan(0);
    });
  });

  describe('calculatePreparationTime', () => {
    it('should calculate realistic preparation timelines', () => {
      const requirements = [
        'scope3_emissions',
        'transition_plans',
        'climate_governance'
      ];

      const timeline = engine['calculatePreparationTime'](
        requirements,
        {
          currentCapabilities: ['scope1_reporting', 'scope2_reporting'],
          organizationSize: 'large',
          resourceAvailability: 'medium'
        }
      );

      expect(timeline.total).toMatch(/\d+\s+(months|weeks)/);
      expect(timeline.breakdown).toHaveProperty('scope3_emissions');
      expect(timeline.criticalPath.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    it('should handle invalid jurisdiction codes', async () => {
      await expect(
        engine.predictRegulatoryChanges(
          IndustryClassification.MANUFACTURING,
          ['INVALID'],
          { timeHorizon: '12_months' }
        )
      ).rejects.toThrow('Invalid jurisdiction');
    });

    it('should handle unsupported industry classifications', async () => {
      await expect(
        engine.predictRegulatoryChanges(
          'invalid_industry' as IndustryClassification,
          ['US'],
          { timeHorizon: '12_months' }
        )
      ).rejects.toThrow('Unsupported industry classification');
    });
  });
});