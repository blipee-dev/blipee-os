/**
 * Tests for BenchmarkEngine
 * Validates peer benchmarking and performance analysis
 */

import { BenchmarkEngine } from '../benchmark-engine';
import { IndustryClassification } from '../types';

describe('BenchmarkEngine', () => {
  let engine: BenchmarkEngine;

  beforeEach(() => {
    engine = new BenchmarkEngine();
  });

  describe('Initialization', () => {
    test('should initialize with supported industries', () => {
      const industries = engine.getSupportedIndustries();
      
      expect(industries).toContain('oil-gas');
      expect(industries).toContain('coal');
      expect(industries).toContain('agriculture');
      expect(industries.length).toBeGreaterThanOrEqual(3);
    });

    test('should initialize with supported regions', () => {
      const regions = engine.getSupportedRegions();
      
      expect(regions).toContain('global');
      expect(regions).toContain('north_america');
      expect(regions).toContain('europe');
      expect(regions).toContain('asia_pacific');
      expect(regions.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Benchmark Data Retrieval', () => {
    test('should get benchmarks for oil & gas industry', async () => {
      const benchmarks = await engine.getBenchmarks('oil-gas', 'global', 2024);

      expect(benchmarks.length).toBeGreaterThan(0);

      benchmarks.forEach(benchmark => {
        expect(benchmark.metricId).toBeDefined();
        expect(benchmark.industry).toBe('oil-gas');
        expect(benchmark.region).toBe('global');
        expect(benchmark.year).toBe(2024);
        expect(benchmark.percentiles).toBeDefined();
        expect(benchmark.percentiles.p10).toBeLessThan(benchmark.percentiles.p90);
        expect(benchmark.average).toBeGreaterThan(0);
        expect(benchmark.sampleSize).toBeGreaterThan(0);
        expect(Array.isArray(benchmark.leaders)).toBe(true);
      });
    });

    test('should get benchmarks for coal industry', async () => {
      const benchmarks = await engine.getBenchmarks('coal', 'global', 2024);

      expect(benchmarks.length).toBeGreaterThan(0);
      
      const safetyBenchmarks = benchmarks.filter(b => b.metricId.includes('safety'));
      expect(safetyBenchmarks.length).toBeGreaterThan(0);
    });

    test('should get benchmarks for agriculture industry', async () => {
      const benchmarks = await engine.getBenchmarks('agriculture', 'global', 2024);

      expect(benchmarks.length).toBeGreaterThan(0);
      
      const yieldBenchmarks = benchmarks.filter(b => b.metricId.includes('yield'));
      expect(yieldBenchmarks.length).toBeGreaterThan(0);
    });

    test('should support regional benchmarks', async () => {
      const globalBenchmarks = await engine.getBenchmarks('oil-gas', 'global', 2024);
      const naBenchmarks = await engine.getBenchmarks('oil-gas', 'north_america', 2024);

      expect(globalBenchmarks.length).toBeGreaterThan(0);
      expect(naBenchmarks.length).toBeGreaterThan(0);
      
      // Regional benchmarks might be different from global
      expect(globalBenchmarks).not.toEqual(naBenchmarks);
    });

    test('should support historical benchmarks', async () => {
      const current = await engine.getBenchmarks('oil-gas', 'global', 2024);
      const historical = await engine.getBenchmarks('oil-gas', 'global', 2023);

      expect(current.length).toBeGreaterThan(0);
      expect(historical.length).toBeGreaterThan(0);
    });
  });

  describe('Percentile Calculation', () => {
    test('should calculate percentile rank correctly', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      const testValue = 75;

      const percentile = engine.calculatePercentile(testValue, values);

      expect(percentile).toBeGreaterThan(70);
      expect(percentile).toBeLessThan(90);
    });

    test('should handle edge cases in percentile calculation', () => {
      const values = [1, 2, 3, 4, 5];
      
      // Value below range
      expect(engine.calculatePercentile(0, values)).toBe(0);
      
      // Value above range
      expect(engine.calculatePercentile(10, values)).toBe(100);
      
      // Value at exact percentile
      expect(engine.calculatePercentile(3, values)).toBe(50);
    });

    test('should handle duplicate values', () => {
      const values = [1, 2, 2, 2, 3];
      const percentile = engine.calculatePercentile(2, values);
      
      expect(percentile).toBeGreaterThan(0);
      expect(percentile).toBeLessThan(100);
    });
  });

  describe('Peer Comparison', () => {
    test('should compare organization to industry peers', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const organizationData = {
        ghg_intensity_upstream: 25.0,
        methane_intensity: 0.2,
        trir: 0.4,
        water_intensity: 1.8
      };

      const comparison = await engine.compareToPeers(
        classification,
        organizationData,
        'global'
      );

      expect(comparison).toBeDefined();
      expect(comparison.industry).toBeDefined();
      expect(comparison.region).toBe('global');
      expect(comparison.metrics).toBeDefined();
      
      Object.keys(comparison.metrics).forEach(metricId => {
        const metric = comparison.metrics[metricId];
        expect(metric.value).toBeDefined();
        expect(metric.percentileRank).toBeGreaterThanOrEqual(0);
        expect(metric.percentileRank).toBeLessThanOrEqual(100);
        expect(metric.industryAverage).toBeGreaterThan(0);
        expect(metric.topQuartile).toBeGreaterThan(0);
        expect(metric.status).toMatch(/above_average|average|below_average|top_quartile|bottom_quartile/);
      });

      expect(Array.isArray(comparison.topPerformers)).toBe(true);
      expect(Array.isArray(comparison.improvementOpportunities)).toBe(true);
    });

    test('should identify top performers', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const organizationData = {
        ghg_intensity_upstream: 50.0, // Above average
        trir: 2.0 // Poor safety performance
      };

      const comparison = await engine.compareToPeers(
        classification,
        organizationData,
        'global'
      );

      expect(comparison.topPerformers.length).toBeGreaterThan(0);
      
      comparison.topPerformers.forEach(performer => {
        expect(performer.metricId).toBeDefined();
        expect(performer.companyName).toBeDefined();
        expect(performer.value).toBeGreaterThan(0);
        expect(performer.percentileRank).toBeGreaterThan(75); // Top quartile
      });
    });

    test('should provide improvement opportunities', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const organizationData = {
        ghg_intensity_upstream: 80.0, // Very high
        methane_intensity: 1.5, // Very high
        trir: 5.0 // Very poor safety
      };

      const comparison = await engine.compareToPeers(
        classification,
        organizationData,
        'global'
      );

      expect(comparison.improvementOpportunities.length).toBeGreaterThan(0);
      
      comparison.improvementOpportunities.forEach(opportunity => {
        expect(opportunity.metricId).toBeDefined();
        expect(opportunity.currentValue).toBeGreaterThan(0);
        expect(opportunity.targetValue).toBeGreaterThan(0);
        expect(opportunity.potentialImprovement).toBeGreaterThan(0);
        expect(opportunity.priority).toMatch(/critical|high|medium|low/);
        expect(opportunity.timeframe).toMatch(/immediate|short_term|medium_term|long_term/);
        expect(Array.isArray(opportunity.recommendations)).toBe(true);
      });
    });
  });

  describe('Trend Analysis', () => {
    test('should analyze performance trends', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const historicalData = [
        { year: 2020, ghg_intensity_upstream: 30.0, trir: 1.0 },
        { year: 2021, ghg_intensity_upstream: 28.0, trir: 0.8 },
        { year: 2022, ghg_intensity_upstream: 25.0, trir: 0.6 },
        { year: 2023, ghg_intensity_upstream: 23.0, trir: 0.5 }
      ];

      const trends = await engine.analyzeTrends(
        classification,
        historicalData,
        'global'
      );

      expect(trends).toBeDefined();
      expect(trends.overallTrend).toMatch(/improving|stable|declining/);
      expect(trends.metrics).toBeDefined();
      
      Object.keys(trends.metrics).forEach(metricId => {
        const metric = trends.metrics[metricId];
        expect(metric.trend).toMatch(/improving|stable|declining/);
        expect(metric.changeRate).toBeDefined();
        expect(metric.volatility).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(metric.yearOverYear)).toBe(true);
      });

      expect(Array.isArray(trends.insights)).toBe(true);
      expect(Array.isArray(trends.predictions)).toBe(true);
    });

    test('should detect performance volatility', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const volatileData = [
        { year: 2020, ghg_intensity_upstream: 30.0 },
        { year: 2021, ghg_intensity_upstream: 50.0 }, // Big jump
        { year: 2022, ghg_intensity_upstream: 20.0 }, // Big drop
        { year: 2023, ghg_intensity_upstream: 45.0 }  // Big jump again
      ];

      const trends = await engine.analyzeTrends(
        classification,
        volatileData,
        'global'
      );

      const ghgTrend = trends.metrics['ghg_intensity_upstream'];
      expect(ghgTrend.volatility).toBeGreaterThan(0.3); // High volatility
    });
  });

  describe('Outlier Detection', () => {
    test('should detect statistical outliers', () => {
      const values = [10, 12, 11, 13, 12, 11, 14, 13, 15, 100]; // 100 is outlier
      const outliers = engine.detectOutliers(values);

      expect(outliers.length).toBeGreaterThan(0);
      expect(outliers).toContain(100);
    });

    test('should not flag normal values as outliers', () => {
      const values = [10, 12, 11, 13, 12, 11, 14, 13, 15, 16];
      const outliers = engine.detectOutliers(values);

      expect(outliers.length).toBe(0);
    });
  });

  describe('Benchmark Quality Assessment', () => {
    test('should assess benchmark data quality', async () => {
      const benchmarks = await engine.getBenchmarks('oil-gas', 'global', 2024);
      
      benchmarks.forEach(benchmark => {
        const quality = engine.assessBenchmarkQuality(benchmark);
        
        expect(quality.score).toBeGreaterThanOrEqual(0);
        expect(quality.score).toBeLessThanOrEqual(100);
        expect(quality.sampleSizeAdequate).toBeDefined();
        expect(quality.dataRecency).toBeDefined();
        expect(quality.industryRepresentation).toBeDefined();
        expect(Array.isArray(quality.limitations)).toBe(true);
      });
    });

    test('should flag low quality benchmarks', async () => {
      const lowQualityBenchmark = {
        metricId: 'test_metric',
        industry: 'oil-gas',
        region: 'global',
        year: 2024,
        sampleSize: 3, // Very small sample
        percentiles: { p10: 10, p25: 15, p50: 20, p75: 25, p90: 30 },
        average: 20,
        leaders: []
      };

      const quality = engine.assessBenchmarkQuality(lowQualityBenchmark);
      
      expect(quality.score).toBeLessThan(50);
      expect(quality.sampleSizeAdequate).toBe(false);
      expect(quality.limitations).toContain('Sample size too small');
    });
  });

  describe('Custom Peer Groups', () => {
    test('should create custom peer groups', async () => {
      const peerIds = ['company1', 'company2', 'company3'];
      const metrics = ['ghg_intensity_upstream', 'trir', 'water_intensity'];

      const customGroup = await engine.createCustomPeerGroup(
        peerIds,
        metrics,
        'Custom Oil & Gas Peers'
      );

      expect(customGroup).toBeDefined();
      expect(customGroup.id).toBeDefined();
      expect(customGroup.name).toBe('Custom Oil & Gas Peers');
      expect(customGroup.peerIds).toEqual(peerIds);
      expect(customGroup.metrics).toEqual(metrics);
      expect(customGroup.benchmarks).toBeDefined();
    });

    test('should compare against custom peer groups', async () => {
      const organizationData = {
        ghg_intensity_upstream: 25.0,
        trir: 0.4
      };

      const customGroupId = 'test-group-id';

      const comparison = await engine.compareToCustomPeerGroup(
        organizationData,
        customGroupId
      );

      expect(comparison).toBeDefined();
      expect(comparison.groupId).toBe(customGroupId);
      expect(comparison.metrics).toBeDefined();
    });
  });

  describe('Performance Scoring', () => {
    test('should calculate overall performance score', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const organizationData = {
        ghg_intensity_upstream: 15.0, // Good performance
        methane_intensity: 0.1, // Good performance
        trir: 0.2, // Good safety
        water_intensity: 1.0 // Good water efficiency
      };

      const score = await engine.calculatePerformanceScore(
        classification,
        organizationData,
        'global'
      );

      expect(score).toBeDefined();
      expect(score.overall).toBeGreaterThan(70); // Should be high for good performance
      expect(score.overall).toBeLessThanOrEqual(100);
      expect(score.environmental).toBeGreaterThan(0);
      expect(score.social).toBeGreaterThan(0);
      expect(score.governance).toBeGreaterThan(0);
      expect(score.breakdown).toBeDefined();
      
      Object.keys(score.breakdown).forEach(metricId => {
        expect(score.breakdown[metricId]).toBeGreaterThanOrEqual(0);
        expect(score.breakdown[metricId]).toBeLessThanOrEqual(100);
      });
    });

    test('should penalize poor performance', async () => {
      const classification: IndustryClassification = {
        naicsCode: '211110',
        confidence: 0.9
      };

      const organizationData = {
        ghg_intensity_upstream: 80.0, // Poor performance
        methane_intensity: 2.0, // Poor performance
        trir: 8.0, // Poor safety
        water_intensity: 10.0 // Poor water efficiency
      };

      const score = await engine.calculatePerformanceScore(
        classification,
        organizationData,
        'global'
      );

      expect(score.overall).toBeLessThan(40); // Should be low for poor performance
      expect(score.environmental).toBeLessThan(40);
      expect(score.social).toBeLessThan(40);
    });
  });

  describe('Error Handling', () => {
    test('should handle unknown industries gracefully', async () => {
      const benchmarks = await engine.getBenchmarks('unknown-industry', 'global', 2024);
      expect(benchmarks).toBeDefined();
      expect(benchmarks.length).toBe(0);
    });

    test('should handle unknown regions gracefully', async () => {
      const benchmarks = await engine.getBenchmarks('oil-gas', 'unknown-region', 2024);
      expect(benchmarks).toBeDefined();
      expect(benchmarks.length).toBe(0);
    });

    test('should handle missing data in comparisons', async () => {
      const classification: IndustryClassification = {
        confidence: 0.0
      };

      const organizationData = {};

      const comparison = await engine.compareToPeers(
        classification,
        organizationData,
        'global'
      );

      expect(comparison).toBeDefined();
      expect(comparison.metrics).toBeDefined();
      expect(Object.keys(comparison.metrics).length).toBe(0);
    });
  });

  describe('Caching and Performance', () => {
    test('should cache benchmark data', async () => {
      const start1 = Date.now();
      const benchmarks1 = await engine.getBenchmarks('oil-gas', 'global', 2024);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const benchmarks2 = await engine.getBenchmarks('oil-gas', 'global', 2024);
      const time2 = Date.now() - start2;

      expect(benchmarks1).toEqual(benchmarks2);
      expect(time2).toBeLessThan(time1); // Second call should be faster
    });

    test('should clear cache when requested', () => {
      engine.clearCache();
      
      const cacheSize = engine.getCacheSize();
      expect(cacheSize).toBe(0);
    });
  });
});