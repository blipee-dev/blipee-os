/**
 * Benchmark Engine
 * Creates and manages industry benchmarks from peer data
 */

import {
  IndustryBenchmark,
  IndustryMetric,
  GRISectorStandard
} from './types';

interface BenchmarkDataPoint {
  organizationId: string;
  metricId: string;
  value: number;
  year: number;
  region?: string;
  verified: boolean;
}

interface BenchmarkConfig {
  minSampleSize: number;
  outlierThreshold: number; // Standard deviations from mean
  requireVerified: boolean;
  enableAnonymization: boolean;
}

interface BenchmarkFilter {
  industry?: string;
  region?: string;
  year?: number;
  sizeCategory?: 'small' | 'medium' | 'large' | 'enterprise';
  griStandard?: GRISectorStandard;
}

export class BenchmarkEngine {
  private dataPoints: Map<string, BenchmarkDataPoint[]>;
  private config: BenchmarkConfig;
  private benchmarkCache: Map<string, IndustryBenchmark>;

  constructor(config?: Partial<BenchmarkConfig>) {
    this.dataPoints = new Map();
    this.benchmarkCache = new Map();
    
    this.config = {
      minSampleSize: 10,
      outlierThreshold: 3,
      requireVerified: false,
      enableAnonymization: true,
      ...config
    };
  }

  /**
   * Add data point to benchmark database
   */
  addDataPoint(dataPoint: BenchmarkDataPoint): void {
    const key = this.getDataPointKey(dataPoint);
    
    if (!this.dataPoints.has(key)) {
      this.dataPoints.set(key, []);
    }

    this.dataPoints.get(key)!.push(dataPoint);
    
    // Invalidate cache for this metric
    this.invalidateCache(dataPoint.metricId);
  }

  /**
   * Add multiple data points
   */
  addBulkDataPoints(dataPoints: BenchmarkDataPoint[]): void {
    dataPoints.forEach(point => this.addDataPoint(point));
  }

  /**
   * Calculate benchmark for a specific metric
   */
  calculateBenchmark(
    metricId: string,
    filter: BenchmarkFilter
  ): IndustryBenchmark | null {
    // Check cache first
    const cacheKey = this.getCacheKey(metricId, filter);
    if (this.benchmarkCache.has(cacheKey)) {
      return this.benchmarkCache.get(cacheKey)!;
    }

    // Get relevant data points
    const relevantPoints = this.getRelevantDataPoints(metricId, filter);

    if (relevantPoints.length < this.config.minSampleSize) {
      return null;
    }

    // Remove outliers
    const cleanedData = this.removeOutliers(relevantPoints);

    if (cleanedData.length < this.config.minSampleSize) {
      return null;
    }

    // Calculate statistics
    const values = cleanedData.map(p => p.value).sort((a, b) => a - b);
    const benchmark: IndustryBenchmark = {
      metricId,
      industry: filter.industry || 'all',
      region: filter.region,
      year: filter.year || new Date().getFullYear(),
      percentiles: {
        p10: this.calculatePercentile(values, 10),
        p25: this.calculatePercentile(values, 25),
        p50: this.calculatePercentile(values, 50),
        p75: this.calculatePercentile(values, 75),
        p90: this.calculatePercentile(values, 90)
      },
      average: this.calculateAverage(values),
      sampleSize: cleanedData.length,
      leaders: this.identifyLeaders(cleanedData, metricId)
    };

    // Cache the result
    this.benchmarkCache.set(cacheKey, benchmark);

    return benchmark;
  }

  /**
   * Get benchmarks for multiple metrics
   */
  calculateMultipleBenchmarks(
    metricIds: string[],
    filter: BenchmarkFilter
  ): IndustryBenchmark[] {
    return metricIds
      .map(id => this.calculateBenchmark(id, filter))
      .filter(b => b !== null) as IndustryBenchmark[];
  }

  /**
   * Get percentile rank for a specific value
   */
  getPercentileRank(
    metricId: string,
    value: number,
    filter: BenchmarkFilter
  ): number | null {
    const relevantPoints = this.getRelevantDataPoints(metricId, filter);
    
    if (relevantPoints.length < this.config.minSampleSize) {
      return null;
    }

    const values = relevantPoints.map(p => p.value).sort((a, b) => a - b);
    const rank = values.filter(v => v <= value).length;
    
    return (rank / values.length) * 100;
  }

  /**
   * Get improvement potential
   */
  getImprovementPotential(
    metricId: string,
    currentValue: number,
    targetPercentile: number,
    filter: BenchmarkFilter
  ): {
    targetValue: number;
    improvement: number;
    percentageChange: number;
  } | null {
    const benchmark = this.calculateBenchmark(metricId, filter);
    
    if (!benchmark) {
      return null;
    }

    let targetValue: number;
    
    if (targetPercentile <= 10) {
      targetValue = benchmark.percentiles.p10;
    } else if (targetPercentile <= 25) {
      targetValue = benchmark.percentiles.p25;
    } else if (targetPercentile <= 50) {
      targetValue = benchmark.percentiles.p50;
    } else if (targetPercentile <= 75) {
      targetValue = benchmark.percentiles.p75;
    } else {
      targetValue = benchmark.percentiles.p90;
    }

    const improvement = targetValue - currentValue;
    const percentageChange = (improvement / currentValue) * 100;

    return {
      targetValue,
      improvement,
      percentageChange
    };
  }

  /**
   * Get trend over time
   */
  getTrend(
    metricId: string,
    filter: Omit<BenchmarkFilter, 'year'>,
    years: number = 5
  ): Array<{
    year: number;
    average: number;
    median: number;
    sampleSize: number;
  }> {
    const currentYear = new Date().getFullYear();
    const trend = [];

    for (let i = years - 1; i >= 0; i--) {
      const yearFilter = { ...filter, year: currentYear - i };
      const benchmark = this.calculateBenchmark(metricId, yearFilter);
      
      if (benchmark) {
        trend.push({
          year: benchmark.year,
          average: benchmark.average,
          median: benchmark.percentiles.p50,
          sampleSize: benchmark.sampleSize
        });
      }
    }

    return trend;
  }

  /**
   * Compare organizations
   */
  compareOrganizations(
    organizationIds: string[],
    metricIds: string[],
    year?: number
  ): Record<string, Record<string, number | null>> {
    const comparison: Record<string, Record<string, number | null>> = {};

    for (const orgId of organizationIds) {
      comparison[orgId] = {};
      
      for (const metricId of metricIds) {
        const dataPoint = this.getOrganizationDataPoint(orgId, metricId, year);
        comparison[orgId][metricId] = dataPoint ? dataPoint.value : null;
      }
    }

    return comparison;
  }

  /**
   * Get data point key for storage
   */
  private getDataPointKey(dataPoint: BenchmarkDataPoint): string {
    return `${dataPoint.metricId}_${dataPoint.year}_${dataPoint.region || 'global'}`;
  }

  /**
   * Get cache key
   */
  private getCacheKey(metricId: string, filter: BenchmarkFilter): string {
    return `${metricId}_${filter.industry || 'all'}_${filter.region || 'global'}_${
      filter.year || 'latest'
    }_${filter.sizeCategory || 'all'}`;
  }

  /**
   * Get relevant data points based on filter
   */
  private getRelevantDataPoints(
    metricId: string,
    filter: BenchmarkFilter
  ): BenchmarkDataPoint[] {
    const allPoints: BenchmarkDataPoint[] = [];

    // Collect all data points for this metric
    for (const [key, points] of this.dataPoints) {
      if (key.startsWith(metricId)) {
        allPoints.push(...points);
      }
    }

    // Apply filters
    return allPoints.filter(point => {
      if (filter.year && point.year !== filter.year) return false;
      if (filter.region && point.region !== filter.region) return false;
      if (this.config.requireVerified && !point.verified) return false;
      
      return true;
    });
  }

  /**
   * Remove outliers using IQR method
   */
  private removeOutliers(dataPoints: BenchmarkDataPoint[]): BenchmarkDataPoint[] {
    if (dataPoints.length < 4) return dataPoints;

    const values = dataPoints.map(p => p.value).sort((a, b) => a - b);
    
    const q1 = this.calculatePercentile(values, 25);
    const q3 = this.calculatePercentile(values, 75);
    const iqr = q3 - q1;
    
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return dataPoints.filter(p => 
      p.value >= lowerBound && p.value <= upperBound
    );
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (lower === upper) {
      return sortedValues[lower];
    }

    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Calculate average
   */
  private calculateAverage(values: number[]): number {
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Identify industry leaders
   */
  private identifyLeaders(
    dataPoints: BenchmarkDataPoint[],
    metricId: string
  ): string[] {
    // For some metrics, lower is better (e.g., emissions)
    const lowerIsBetter = this.isLowerBetterMetric(metricId);
    
    // Sort by value
    const sorted = [...dataPoints].sort((a, b) => 
      lowerIsBetter ? a.value - b.value : b.value - a.value
    );

    // Take top 10% or max 5
    const leaderCount = Math.min(Math.ceil(sorted.length * 0.1), 5);
    
    // Return anonymized IDs if enabled
    if (this.config.enableAnonymization) {
      return sorted
        .slice(0, leaderCount)
        .map((_, i) => `Leader${i + 1}`);
    }

    return sorted
      .slice(0, leaderCount)
      .map(p => p.organizationId);
  }

  /**
   * Check if lower values are better for a metric
   */
  private isLowerBetterMetric(metricId: string): boolean {
    const lowerBetterMetrics = [
      'ghg_intensity',
      'emissions',
      'water_consumption',
      'waste_generated',
      'spill_volume',
      'trir',
      'ltir',
      'incident_rate'
    ];

    return lowerBetterMetrics.some(m => metricId.includes(m));
  }

  /**
   * Get organization data point
   */
  private getOrganizationDataPoint(
    organizationId: string,
    metricId: string,
    year?: number
  ): BenchmarkDataPoint | null {
    const targetYear = year || new Date().getFullYear();
    
    for (const points of this.dataPoints.values()) {
      const point = points.find(p => 
        p.organizationId === organizationId && 
        p.metricId === metricId &&
        p.year === targetYear
      );
      
      if (point) return point;
    }

    return null;
  }

  /**
   * Invalidate cache for a metric
   */
  private invalidateCache(metricId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.benchmarkCache.keys()) {
      if (key.startsWith(metricId)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.benchmarkCache.delete(key));
  }

  /**
   * Load benchmark data from external source
   */
  async loadBenchmarkData(source: string): Promise<void> {
    // In production, this would load from database or API
    // Mock implementation for now
    const mockData: BenchmarkDataPoint[] = [
      {
        organizationId: 'org1',
        metricId: 'ghg_intensity_upstream',
        value: 15.2,
        year: 2024,
        region: 'north_america',
        verified: true
      },
      {
        organizationId: 'org2',
        metricId: 'ghg_intensity_upstream',
        value: 22.8,
        year: 2024,
        region: 'north_america',
        verified: true
      }
    ];

    this.addBulkDataPoints(mockData);
  }

  /**
   * Export benchmarks for reporting
   */
  exportBenchmarks(
    metricIds: string[],
    filter: BenchmarkFilter
  ): any {
    const benchmarks = this.calculateMultipleBenchmarks(metricIds, filter);
    
    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        filter,
        metrics: metricIds,
        config: this.config
      },
      benchmarks: benchmarks.map(b => ({
        ...b,
        interpretation: this.interpretBenchmark(b)
      }))
    };
  }

  /**
   * Interpret benchmark results
   */
  private interpretBenchmark(benchmark: IndustryBenchmark): string {
    const spread = benchmark.percentiles.p90 - benchmark.percentiles.p10;
    const coefficient = spread / benchmark.average;

    if (coefficient > 1) {
      return 'High variability in industry performance - significant opportunity for leaders';
    } else if (coefficient > 0.5) {
      return 'Moderate variability - room for improvement across the industry';
    } else {
      return 'Low variability - industry has converged on similar performance levels';
    }
  }

  /**
   * Clear all data
   */
  clearData(): void {
    this.dataPoints.clear();
    this.benchmarkCache.clear();
  }

  /**
   * Get statistics about the benchmark database
   */
  getStatistics(): {
    totalDataPoints: number;
    uniqueMetrics: number;
    organizationCount: number;
    yearRange: { min: number; max: number };
  } {
    let totalPoints = 0;
    const metrics = new Set<string>();
    const organizations = new Set<string>();
    let minYear = Infinity;
    let maxYear = -Infinity;

    for (const points of this.dataPoints.values()) {
      totalPoints += points.length;
      
      points.forEach(p => {
        metrics.add(p.metricId);
        organizations.add(p.organizationId);
        minYear = Math.min(minYear, p.year);
        maxYear = Math.max(maxYear, p.year);
      });
    }

    return {
      totalDataPoints: totalPoints,
      uniqueMetrics: metrics.size,
      organizationCount: organizations.size,
      yearRange: {
        min: minYear === Infinity ? 0 : minYear,
        max: maxYear === -Infinity ? 0 : maxYear
      }
    };
  }
}