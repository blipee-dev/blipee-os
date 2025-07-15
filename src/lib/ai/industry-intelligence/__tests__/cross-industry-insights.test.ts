/**
 * Test suite for Cross-Industry Insights Engine
 */

import { CrossIndustryInsightsEngine } from '../cross-industry-insights';
import { IndustryClassification } from '../types';

describe('CrossIndustryInsightsEngine', () => {
  let engine: CrossIndustryInsightsEngine;

  beforeEach(() => {
    engine = new CrossIndustryInsightsEngine();
  });

  describe('performCrossIndustryComparison', () => {
    it('should perform comparison between manufacturing and technology industries', async () => {
      const organizationData = {
        emissions: {
          scope1: 15000,
          scope2: 8000,
          scope3: 45000
        },
        energy: {
          renewable_percentage: 25,
          total_consumption: 12000
        },
        workforce: {
          total_employees: 500,
          diversity_percentage: 35,
          safety_incidents: 2
        }
      };

      const result = await engine.performCrossIndustryComparison(
        'org-123',
        organizationData,
        IndustryClassification.MANUFACTURING,
        ['technology', 'automotive']
      );

      expect(result).toBeDefined();
      expect(result.organizationId).toBe('org-123');
      expect(result.primaryIndustry).toBe(IndustryClassification.MANUFACTURING);
      expect(result.comparedIndustries).toContain('technology');
      expect(result.comparedIndustries).toContain('automotive');
      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.transferableOpportunities.length).toBeGreaterThan(0);
    });

    it('should identify specific insights for energy sector', async () => {
      const organizationData = {
        emissions: {
          scope1: 85000,
          scope2: 15000,
          scope3: 25000
        },
        energy: {
          renewable_percentage: 15,
          total_consumption: 50000
        }
      };

      const result = await engine.performCrossIndustryComparison(
        'energy-org',
        organizationData,
        IndustryClassification.OIL_AND_GAS,
        ['renewable_energy']
      );

      expect(result.insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'performance_gap',
            category: 'environmental'
          })
        ])
      );
    });
  });

  describe('identifyTransferableOpportunities', () => {
    it('should identify opportunities from high-performing industries', () => {
      const organizationData = {
        energy: { renewable_percentage: 20 }
      };

      const benchmarks = new Map([
        ['technology', { renewable_percentage: 65 }],
        ['automotive', { renewable_percentage: 45 }]
      ]);

      const opportunities = engine['identifyTransferableOpportunities'](
        organizationData,
        benchmarks,
        IndustryClassification.MANUFACTURING
      );

      expect(opportunities.length).toBeGreaterThan(0);
      expect(opportunities[0]).toEqual(
        expect.objectContaining({
          sourceIndustry: 'technology',
          category: 'energy_management'
        })
      );
    });
  });

  describe('generateInsights', () => {
    it('should generate performance gap insights', () => {
      const organizationData = {
        emissions: { scope1: 25000 },
        energy: { renewable_percentage: 15 }
      };

      const benchmarks = new Map([
        ['technology', { scope1: 8000, renewable_percentage: 70 }]
      ]);

      const insights = engine['generateInsights'](
        organizationData,
        benchmarks,
        IndustryClassification.MANUFACTURING
      );

      expect(insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'performance_gap',
            metric: 'scope1_emissions'
          }),
          expect.objectContaining({
            type: 'performance_gap',
            metric: 'renewable_energy'
          })
        ])
      );
    });

    it('should generate leadership insights for high performers', () => {
      const organizationData = {
        energy: { renewable_percentage: 85 }
      };

      const benchmarks = new Map([
        ['technology', { renewable_percentage: 65 }]
      ]);

      const insights = engine['generateInsights'](
        organizationData,
        benchmarks,
        IndustryClassification.MANUFACTURING
      );

      expect(insights).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'leadership_opportunity',
            metric: 'renewable_energy'
          })
        ])
      );
    });
  });

  describe('calculatePerformanceScore', () => {
    it('should calculate accurate performance scores', () => {
      const organizationData = {
        emissions: {
          scope1: 15000,
          scope2: 8000
        },
        energy: {
          renewable_percentage: 45
        }
      };

      const industryAverage = {
        scope1: 20000,
        scope2: 12000,
        renewable_percentage: 35
      };

      const score = engine['calculatePerformanceScore'](
        organizationData,
        industryAverage
      );

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
      // Should be above 50 since org performs better than average
      expect(score).toBeGreaterThan(50);
    });

    it('should handle missing data gracefully', () => {
      const organizationData = {
        emissions: { scope1: 15000 }
      };

      const industryAverage = {
        scope1: 20000,
        renewable_percentage: 35
      };

      const score = engine['calculatePerformanceScore'](
        organizationData,
        industryAverage
      );

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getBenchmarkData', () => {
    it('should return benchmark data for specified industries', async () => {
      const benchmarks = await engine['getBenchmarkData'](['technology', 'automotive']);

      expect(benchmarks.size).toBe(2);
      expect(benchmarks.has('technology')).toBe(true);
      expect(benchmarks.has('automotive')).toBe(true);
      
      const techBenchmark = benchmarks.get('technology');
      expect(techBenchmark).toHaveProperty('scope1');
      expect(techBenchmark).toHaveProperty('renewable_percentage');
    });
  });
});