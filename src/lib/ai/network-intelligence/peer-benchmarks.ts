import { createClient } from '@supabase/supabase-js';
import {
  PeerBenchmark,
  BenchmarkComparison,
  BenchmarkReport,
  IndustryStatistics,
  PerformanceGap
} from './types';

interface BenchmarkingOptions {
  cohortType: 'industry' | 'size' | 'region' | 'custom';
  includeAnonymous?: boolean;
  minSampleSize?: number;
  confidenceLevel?: number;
}

export class PeerBenchmarkingEngine {
  private supabase: ReturnType<typeof createClient>;
  private cache: Map<string, any> = new Map();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  /**
   * Get peer benchmarks for an organization
   */
  async getPeerBenchmarks(
    organizationId: string,
    metrics: string[] = ['emissions', 'energy', 'waste', 'water'],
    options: BenchmarkingOptions = { cohortType: 'industry' }
  ): Promise<BenchmarkReport> {
    const cacheKey = `benchmarks-${organizationId}-${metrics.join(',')}-${JSON.stringify(options)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Get organization details
      const { data: org } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (!org) {
        throw new Error('Organization not found');
      }

      // Find peer cohort
      const cohort = await this.findPeerCohort(org, options);
      
      // Get benchmark data
      const benchmarks = await this.getBenchmarkData(cohort.id, metrics);
      
      // Calculate comparisons
      const comparisons = await this.calculateComparisons(organizationId, benchmarks, metrics);
      
      // Generate insights
      const insights = this.generateInsights(comparisons, org);

      const report: BenchmarkReport = {
        organizationId,
        peerGroup: {
          cohortId: cohort.id,
          name: cohort.name,
          size: benchmarks.sampleSize,
          criteria: cohort.criteria
        },
        comparisons,
        overallScore: this.calculateOverallScore(comparisons),
        rank: this.calculateRank(comparisons, benchmarks.sampleSize),
        insights,
        metadata: {
          generatedAt: new Date(),
          confidenceLevel: benchmarks.confidenceLevel,
          dataQuality: benchmarks.dataQuality
        }
      };

      this.setCached(cacheKey, report);
      return report;

    } catch (error) {
      console.error('Error getting peer benchmarks:', error);
      throw error;
    }
  }

  /**
   * Contribute anonymized data to benchmarks
   */
  async contributeBenchmarkData(
    organizationId: string,
    metrics: Record<string, number>,
    applyPrivacy: boolean = true
  ): Promise<void> {
    try {
      // Get organization details for cohort assignment
      const { data: org } = await this.supabase
        .from('organizations')
        .select('industry, size_category, region')
        .eq('id', organizationId)
        .single();

      if (!org) throw new Error('Organization not found');

      // Apply privacy if requested
      let processedMetrics = metrics;
      if (applyPrivacy) {
        const { PrivacyLayer } = await import('./privacy/privacy-layer');
        const privacyLayer = new PrivacyLayer();
        const anonymized = await privacyLayer.anonymizeESGMetrics(metrics);
        processedMetrics = anonymized.data;
      }

      // Store contribution
      await this.supabase
        .from('benchmark_contributions')
        .insert({
          organization_id: organizationId,
          industry: org.industry,
          size: org.size_category,
          region: org.region,
          metrics: processedMetrics,
          privacy_applied: applyPrivacy,
          timestamp: new Date()
        });

      // Update cohort statistics
      await this.updateCohortStatistics(org.industry, org.size_category, org.region);

    } catch (error) {
      console.error('Error contributing benchmark data:', error);
      throw error;
    }
  }

  /**
   * Get industry statistics
   */
  async getIndustryStatistics(
    industry: string,
    metric: string
  ): Promise<IndustryStatistics> {
    try {
      const { data: stats } = await this.supabase
        .from('network_benchmarks')
        .select('*')
        .eq('industry', industry)
        .eq('metric_name', metric)
        .single();

      if (!stats) {
        return this.calculateIndustryStatistics(industry, metric);
      }

      return {
        industry,
        metric,
        mean: stats.statistics.mean,
        median: stats.statistics.median,
        percentiles: stats.statistics.percentiles,
        standardDeviation: stats.statistics.stdDev,
        sampleSize: stats.sample_size,
        lastUpdated: new Date(stats.created_at)
      };

    } catch (error) {
      console.error('Error getting industry statistics:', error);
      throw error;
    }
  }

  /**
   * Find performance gaps and improvement opportunities
   */
  async identifyPerformanceGaps(
    organizationId: string,
    targetPercentile: number = 75
  ): Promise<PerformanceGap[]> {
    try {
      const benchmarks = await this.getPeerBenchmarks(organizationId);
      const gaps: PerformanceGap[] = [];

      for (const comparison of benchmarks.comparisons) {
        if (comparison.percentile < targetPercentile) {
          const targetValue = this.getPercentileValue(
            comparison.metric,
            targetPercentile,
            comparison.peerGroup
          );

          gaps.push({
            metric: comparison.metric,
            currentValue: comparison.organizationValue,
            targetValue,
            gap: targetValue - comparison.organizationValue,
            percentileGap: targetPercentile - comparison.percentile,
            improvementPotential: this.calculateImprovementPotential(
              comparison.organizationValue,
              targetValue
            ),
            estimatedEffort: this.estimateEffort(comparison.metric, comparison.gap),
            recommendations: await this.getImprovementRecommendations(
              comparison.metric,
              comparison.gap
            )
          });
        }
      }

      return gaps.sort((a, b) => b.improvementPotential - a.improvementPotential);

    } catch (error) {
      console.error('Error identifying performance gaps:', error);
      throw error;
    }
  }

  /**
   * Create custom peer cohort
   */
  async createCustomCohort(
    name: string,
    criteria: Record<string, any>,
    organizationIds?: string[]
  ): Promise<string> {
    try {
      const { data: cohort, error } = await this.supabase
        .from('benchmark_cohorts')
        .insert({
          name,
          type: 'custom',
          criteria,
          created_at: new Date()
        })
        .select()
        .single();

      if (error) throw error;

      // Add members if provided
      if (organizationIds && organizationIds.length > 0) {
        const members = organizationIds.map(orgId => ({
          cohort_id: cohort.id,
          organization_id: orgId,
          joined_at: new Date(),
          active: true
        }));

        await this.supabase
          .from('cohort_members')
          .insert(members);
      }

      return cohort.id;

    } catch (error) {
      console.error('Error creating custom cohort:', error);
      throw error;
    }
  }

  // Private helper methods

  private async findPeerCohort(
    organization: any,
    options: BenchmarkingOptions
  ): Promise<any> {
    const criteria = {
      industry: organization.industry,
      size: organization.size_category,
      region: organization.region
    };

    // Look for existing cohort
    const { data: existingCohort } = await this.supabase
      .from('benchmark_cohorts')
      .select('*')
      .eq('type', options.cohortType)
      .contains('criteria', { [options.cohortType]: criteria[options.cohortType] })
      .single();

    if (existingCohort) {
      return existingCohort;
    }

    // Create new cohort
    const { data: newCohort } = await this.supabase
      .from('benchmark_cohorts')
      .insert({
        name: `${criteria[options.cohortType]} ${options.cohortType} cohort`,
        type: options.cohortType,
        criteria: { [options.cohortType]: criteria[options.cohortType] }
      })
      .select()
      .single();

    return newCohort;
  }

  private async getBenchmarkData(cohortId: string, metrics: string[]): Promise<any> {
    const { data: contributions } = await this.supabase
      .from('benchmark_contributions')
      .select('metrics')
      .eq('cohort_id', cohortId);

    if (!contributions || contributions.length === 0) {
      return {
        sampleSize: 0,
        statistics: {},
        confidenceLevel: 0,
        dataQuality: 'insufficient'
      };
    }

    const statistics: Record<string, any> = {};
    
    for (const metric of metrics) {
      const values = contributions
        .map(c => c.metrics[metric])
        .filter(v => v !== null && v !== undefined);

      if (values.length > 0) {
        statistics[metric] = {
          mean: this.calculateMean(values),
          median: this.calculateMedian(values),
          percentiles: this.calculatePercentiles(values),
          stdDev: this.calculateStdDev(values)
        };
      }
    }

    return {
      sampleSize: contributions.length,
      statistics,
      confidenceLevel: this.calculateConfidence(contributions.length),
      dataQuality: this.assessDataQuality(contributions)
    };
  }

  private async calculateComparisons(
    organizationId: string,
    benchmarks: any,
    metrics: string[]
  ): Promise<BenchmarkComparison[]> {
    // Get organization's metrics
    const { data: orgData } = await this.supabase
      .from('organizations')
      .select('metrics')
      .eq('id', organizationId)
      .single();

    const comparisons: BenchmarkComparison[] = [];

    for (const metric of metrics) {
      const orgValue = orgData?.metrics?.[metric] || 0;
      const peerStats = benchmarks.statistics[metric];

      if (peerStats) {
        comparisons.push({
          metric,
          organizationValue: orgValue,
          peerAverage: peerStats.mean,
          peerMedian: peerStats.median,
          percentile: this.calculatePercentile(orgValue, peerStats),
          gap: orgValue - peerStats.mean,
          relativePerformance: (orgValue - peerStats.mean) / peerStats.mean,
          peerGroup: {
            min: Math.min(...peerStats.values || [0]),
            max: Math.max(...peerStats.values || [0]),
            quartiles: peerStats.percentiles
          }
        });
      }
    }

    return comparisons;
  }

  private generateInsights(comparisons: BenchmarkComparison[], org: any): string[] {
    const insights: string[] = [];

    // Overall performance insight
    const avgPercentile = comparisons.reduce((sum, c) => sum + c.percentile, 0) / comparisons.length;
    if (avgPercentile > 75) {
      insights.push(`Your organization is performing in the top quartile of your peer group`);
    } else if (avgPercentile < 25) {
      insights.push(`Significant improvement opportunities exist across multiple metrics`);
    }

    // Specific metric insights
    for (const comparison of comparisons) {
      if (comparison.percentile > 90) {
        insights.push(`Leading performance in ${comparison.metric} (top 10%)`);
      } else if (comparison.percentile < 20) {
        insights.push(`${comparison.metric} is a key area for improvement`);
      }

      if (comparison.relativePerformance < -0.5) {
        insights.push(`${comparison.metric} is 50%+ below peer average`);
      }
    }

    // Trend insights
    if (comparisons.some(c => c.gap > 0) && comparisons.some(c => c.gap < 0)) {
      insights.push(`Mixed performance across metrics suggests targeted improvement strategy`);
    }

    return insights;
  }

  private calculateOverallScore(comparisons: BenchmarkComparison[]): number {
    if (comparisons.length === 0) return 0;
    
    const avgPercentile = comparisons.reduce((sum, c) => sum + c.percentile, 0) / comparisons.length;
    return Math.round(avgPercentile);
  }

  private calculateRank(comparisons: BenchmarkComparison[], sampleSize: number): string {
    const overallPercentile = this.calculateOverallScore(comparisons);
    const rank = Math.ceil((1 - overallPercentile / 100) * sampleSize);
    return `${rank} of ${sampleSize}`;
  }

  private async updateCohortStatistics(
    industry: string,
    size: string,
    region: string
  ): Promise<void> {
    // This would typically trigger a background job to recalculate statistics
    console.log(`Updating statistics for ${industry} ${size} ${region}`);
  }

  private calculateIndustryStatistics(
    industry: string,
    metric: string
  ): IndustryStatistics {
    // Fallback calculation when no cached statistics exist
    return {
      industry,
      metric,
      mean: 0,
      median: 0,
      percentiles: { 25: 0, 50: 0, 75: 0, 90: 0 },
      standardDeviation: 0,
      sampleSize: 0,
      lastUpdated: new Date()
    };
  }

  private getPercentileValue(
    metric: string,
    percentile: number,
    peerGroup: any
  ): number {
    // Interpolate percentile value from quartiles
    const quartiles = peerGroup.quartiles || {};
    
    if (percentile <= 25) return quartiles[25] || 0;
    if (percentile <= 50) return quartiles[50] || 0;
    if (percentile <= 75) return quartiles[75] || 0;
    if (percentile <= 90) return quartiles[90] || 0;
    
    return peerGroup.max || 0;
  }

  private calculateImprovementPotential(current: number, target: number): number {
    if (current === 0) return 100;
    return Math.abs((target - current) / current) * 100;
  }

  private estimateEffort(metric: string, gap: number): 'low' | 'medium' | 'high' {
    const gapPercent = Math.abs(gap);
    
    if (gapPercent < 10) return 'low';
    if (gapPercent < 30) return 'medium';
    return 'high';
  }

  private async getImprovementRecommendations(
    metric: string,
    gap: number
  ): Promise<string[]> {
    // Generate metric-specific recommendations
    const recommendations: string[] = [];
    
    if (metric === 'emissions' && gap > 0) {
      recommendations.push('Implement energy efficiency measures');
      recommendations.push('Transition to renewable energy sources');
      recommendations.push('Optimize supply chain emissions');
    } else if (metric === 'water' && gap > 0) {
      recommendations.push('Install water-efficient fixtures');
      recommendations.push('Implement water recycling systems');
      recommendations.push('Monitor and reduce water waste');
    } else if (metric === 'waste' && gap > 0) {
      recommendations.push('Implement circular economy practices');
      recommendations.push('Increase recycling rates');
      recommendations.push('Reduce packaging materials');
    }
    
    return recommendations;
  }

  // Statistical helper methods

  private calculateMean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    
    return sorted[mid];
  }

  private calculatePercentiles(values: number[]): Record<number, number> {
    const sorted = [...values].sort((a, b) => a - b);
    const percentiles: Record<number, number> = {};
    
    [25, 50, 75, 90].forEach(p => {
      const index = Math.ceil((p / 100) * sorted.length) - 1;
      percentiles[p] = sorted[Math.max(0, index)];
    });
    
    return percentiles;
  }

  private calculateStdDev(values: number[]): number {
    const mean = this.calculateMean(values);
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = this.calculateMean(squaredDiffs);
    return Math.sqrt(variance);
  }

  private calculatePercentile(value: number, stats: any): number {
    const values = stats.values || [];
    const below = values.filter((v: number) => v < value).length;
    return (below / values.length) * 100;
  }

  private calculateConfidence(sampleSize: number): number {
    // Simple confidence calculation based on sample size
    if (sampleSize < 10) return 0.5;
    if (sampleSize < 30) return 0.7;
    if (sampleSize < 100) return 0.85;
    return 0.95;
  }

  private assessDataQuality(contributions: any[]): string {
    if (contributions.length < 5) return 'insufficient';
    if (contributions.length < 20) return 'moderate';
    if (contributions.length < 50) return 'good';
    return 'excellent';
  }

  private getCached(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCached(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}