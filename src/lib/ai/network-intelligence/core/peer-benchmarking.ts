/**
 * Peer Benchmarking Service
 * Anonymous performance comparison across organizations
 */

import { createBrowserClient } from '@/lib/supabase/client';
import { PrivacyLayer } from '../privacy/privacy-layer';

export interface BenchmarkMetrics {
  organizationId: string;
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  region: string;
  metrics: {
    emissions: {
      total: number;
      intensity: number; // per revenue or sqft
      scope1: number;
      scope2: number;
      scope3: number;
    };
    energy: {
      consumption: number;
      renewable: number;
      intensity: number;
    };
    water: {
      usage: number;
      recycled: number;
      intensity: number;
    };
    waste: {
      generated: number;
      recycled: number;
      diversionRate: number;
    };
    social: {
      employeeSatisfaction: number;
      diversityScore: number;
      safetyIncidents: number;
    };
    governance: {
      boardDiversity: number;
      ethicsScore: number;
      transparencyScore: number;
    };
  };
  timestamp: Date;
}

export interface PeerComparison {
  metric: string;
  yourValue: number;
  peerAverage: number;
  percentile: number;
  quartile: 1 | 2 | 3 | 4;
  improvement: number; // Percentage improvement opportunity
  insights: string[];
}

export interface BenchmarkReport {
  organizationId: string;
  reportDate: Date;
  peerGroup: {
    industry: string;
    size: string;
    region: string;
    count: number;
  };
  comparisons: PeerComparison[];
  overallScore: number;
  rank: number;
  recommendations: string[];
}

export class PeerBenchmarkingService {
  private supabase;
  private privacyLayer: PrivacyLayer;

  constructor() {
    this.supabase = createBrowserClient();
    this.privacyLayer = new PrivacyLayer({
      kAnonymity: 5,
      epsilon: 1.0,
      suppressionThreshold: 3,
    });
  }

  /**
   * Submit metrics for benchmarking (with privacy preservation)
   */
  async submitMetrics(metrics: BenchmarkMetrics): Promise<{
    submitted: boolean;
    anonymized: boolean;
    contributionId: string;
  }> {
    console.log('📈 Submitting metrics for benchmarking...');

    try {
      // Anonymize sensitive metrics
      const anonymizedMetrics = await this.privacyLayer.anonymizeESGMetrics({
        emissions: metrics.metrics.emissions.total,
        energyConsumption: metrics.metrics.energy.consumption,
        waterUsage: metrics.metrics.water.usage,
        wasteGenerated: metrics.metrics.waste.generated,
        supplierCount: 0, // Not included in this example
        employeeCount: 0, // Not included in this example
      });

      // Store anonymized contribution
      const { data, error } = await this.supabase
        .from('benchmark_contributions')
        .insert({
          organization_id: metrics.organizationId,
          industry: metrics.industry,
          size: metrics.size,
          region: this.generalizeRegion(metrics.region),
          metrics: {
            ...metrics.metrics,
            emissions: {
              ...metrics.metrics.emissions,
              total: anonymizedMetrics.data.emissions,
            },
            energy: {
              ...metrics.metrics.energy,
              consumption: anonymizedMetrics.data.energyConsumption,
            },
            water: {
              ...metrics.metrics.water,
              usage: anonymizedMetrics.data.waterUsage,
            },
            waste: {
              ...metrics.metrics.waste,
              generated: anonymizedMetrics.data.wasteGenerated,
            },
          },
          privacy_applied: true,
          timestamp: new Date(),
        })
        .select()
        .single();

      if (error) throw error;

      return {
        submitted: true,
        anonymized: true,
        contributionId: data.id,
      };
    } catch (error) {
      console.error('Error submitting metrics:', error);
      throw error;
    }
  }

  /**
   * Get peer comparison for an organization
   */
  async getPeerComparison(
    organizationId: string,
    filters?: {
      industry?: string;
      size?: string;
      region?: string;
    }
  ): Promise<BenchmarkReport> {
    console.log('📈 Generating peer comparison report...');

    try {
      // Get organization's latest metrics
      const { data: orgData } = await this.supabase
        .from('benchmark_contributions')
        .select('*')
        .eq('organization_id', organizationId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (!orgData) {
        throw new Error('No benchmark data found for organization');
      }

      // Get peer data with privacy preservation
      const peerFilter = {
        industry: filters?.industry || orgData.industry,
        size: filters?.size || orgData.size,
        region: filters?.region || orgData.region,
      };

      const { data: peerData } = await this.supabase
        .from('benchmark_contributions')
        .select('*')
        .eq('industry', peerFilter.industry)
        .eq('size', peerFilter.size)
        .neq('organization_id', organizationId)
        .gte('timestamp', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)); // Last year

      if (!peerData || peerData.length < this.privacyLayer['config'].suppressionThreshold) {
        throw new Error('Insufficient peer data for comparison');
      }

      // Calculate comparisons
      const comparisons = await this.calculateComparisons(orgData, peerData);

      // Calculate overall score and rank
      const { score, rank } = this.calculateOverallPerformance(comparisons, peerData.length + 1);

      // Generate recommendations
      const recommendations = this.generateRecommendations(comparisons);

      return {
        organizationId,
        reportDate: new Date(),
        peerGroup: {
          industry: peerFilter.industry,
          size: peerFilter.size,
          region: peerFilter.region,
          count: peerData.length,
        },
        comparisons,
        overallScore: score,
        rank,
        recommendations,
      };
    } catch (error) {
      console.error('Error generating peer comparison:', error);
      throw error;
    }
  }

  /**
   * Get industry insights from collective data
   */
  async getIndustryInsights(industry: string): Promise<{
    trends: Array<{ metric: string; trend: 'improving' | 'declining' | 'stable'; change: number }>;
    leaders: Array<{ metric: string; topPerformance: number; averagePerformance: number }>;
    opportunities: string[];
  }> {
    console.log(`📈 Analyzing industry insights for ${industry}...`);

    try {
      // Get historical data for trend analysis
      const { data: historicalData } = await this.supabase
        .from('benchmark_contributions')
        .select('*')
        .eq('industry', industry)
        .gte('timestamp', new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000)) // 2 years
        .order('timestamp', { ascending: true });

      if (!historicalData || historicalData.length < 10) {
        throw new Error('Insufficient data for industry insights');
      }

      // Analyze trends
      const trends = this.analyzeTrends(historicalData);

      // Identify leaders (with privacy preservation)
      const leaders = await this.identifyLeaders(historicalData);

      // Generate opportunities
      const opportunities = this.identifyOpportunities(trends, leaders);

      return {
        trends,
        leaders,
        opportunities,
      };
    } catch (error) {
      console.error('Error generating industry insights:', error);
      throw error;
    }
  }

  /**
   * Join a benchmarking cohort
   */
  async joinCohort(
    organizationId: string,
    cohortType: 'industry' | 'size' | 'region' | 'custom',
    cohortId?: string
  ): Promise<{
    cohortId: string;
    memberCount: number;
    nextBenchmark: Date;
  }> {
    console.log(`📈 Joining ${cohortType} benchmarking cohort...`);

    try {
      // Get or create cohort
      let cohort;
      if (cohortId) {
        const { data } = await this.supabase
          .from('benchmark_cohorts')
          .select('*')
          .eq('id', cohortId)
          .single();
        cohort = data;
      } else {
        // Create new cohort based on organization attributes
        const { data: orgData } = await this.supabase
          .from('organizations')
          .select('*')
          .eq('id', organizationId)
          .single();

        const cohortName = `${cohortType}-${orgData[cohortType] || 'default'}`;
        
        const { data } = await this.supabase
          .from('benchmark_cohorts')
          .upsert({
            name: cohortName,
            type: cohortType,
            criteria: { [cohortType]: orgData[cohortType] },
            created_at: new Date(),
          })
          .select()
          .single();
        cohort = data;
      }

      // Add organization to cohort
      await this.supabase
        .from('cohort_members')
        .upsert({
          cohort_id: cohort.id,
          organization_id: organizationId,
          joined_at: new Date(),
          active: true,
        });

      // Get member count
      const { count } = await this.supabase
        .from('cohort_members')
        .select('*', { count: 'exact', head: true })
        .eq('cohort_id', cohort.id)
        .eq('active', true);

      return {
        cohortId: cohort.id,
        memberCount: count || 0,
        nextBenchmark: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      };
    } catch (error) {
      console.error('Error joining cohort:', error);
      throw error;
    }
  }

  // Private helper methods

  private async calculateComparisons(
    orgData: any,
    peerData: any[]
  ): Promise<PeerComparison[]> {
    const comparisons: PeerComparison[] = [];
    const metrics = [
      { path: 'metrics.emissions.intensity', name: 'Emissions Intensity' },
      { path: 'metrics.energy.renewable', name: 'Renewable Energy %' },
      { path: 'metrics.water.intensity', name: 'Water Intensity' },
      { path: 'metrics.waste.diversionRate', name: 'Waste Diversion Rate' },
      { path: 'metrics.social.employeeSatisfaction', name: 'Employee Satisfaction' },
      { path: 'metrics.governance.transparencyScore', name: 'Transparency Score' },
    ];

    for (const metric of metrics) {
      const yourValue = this.getNestedValue(orgData, metric.path);
      const peerValues = peerData.map(p => this.getNestedValue(p, metric.path)).filter(v => v != null);
      
      if (peerValues.length >= this.privacyLayer['config'].suppressionThreshold) {
        const benchmark = await this.privacyLayer.createAnonymousBenchmark(
          peerData,
          (p) => this.getNestedValue(p, metric.path) || 0
        );

        const percentile = this.calculatePercentile(yourValue, peerValues);
        const peerAverage = peerValues.reduce((a, b) => a + b, 0) / peerValues.length;
        
        comparisons.push({
          metric: metric.name,
          yourValue,
          peerAverage: Math.round(peerAverage * 100) / 100,
          percentile,
          quartile: this.getQuartile(percentile),
          improvement: Math.max(0, ((peerAverage - yourValue) / yourValue) * 100),
          insights: this.generateMetricInsights(metric.name, yourValue, peerAverage, percentile),
        });
      }
    }

    return comparisons;
  }

  private getNestedValue(obj: any, path: string): number | null {
    return path.split('.').reduce((curr, prop) => curr?.[prop], obj);
  }

  private calculatePercentile(value: number, peerValues: number[]): number {
    const sorted = [...peerValues].sort((a, b) => a - b);
    const below = sorted.filter(v => v < value).length;
    return Math.round((below / sorted.length) * 100);
  }

  private getQuartile(percentile: number): 1 | 2 | 3 | 4 {
    if (percentile >= 75) return 4;
    if (percentile >= 50) return 3;
    if (percentile >= 25) return 2;
    return 1;
  }

  private generateMetricInsights(
    metric: string,
    yourValue: number,
    peerAverage: number,
    percentile: number
  ): string[] {
    const insights: string[] = [];

    if (percentile >= 75) {
      insights.push(`You're in the top quartile for ${metric}`);
    } else if (percentile < 25) {
      insights.push(`Significant improvement opportunity in ${metric}`);
    }

    if (yourValue > peerAverage * 1.2) {
      insights.push('Performance significantly above peer average');
    } else if (yourValue < peerAverage * 0.8) {
      insights.push('Performance below peer average - consider improvement initiatives');
    }

    return insights;
  }

  private calculateOverallPerformance(
    comparisons: PeerComparison[],
    totalOrgs: number
  ): { score: number; rank: number } {
    const avgPercentile = comparisons.reduce((sum, c) => sum + c.percentile, 0) / comparisons.length;
    const score = Math.round(avgPercentile);
    const rank = Math.round((1 - avgPercentile / 100) * totalOrgs) + 1;
    
    return { score, rank };
  }

  private generateRecommendations(comparisons: PeerComparison[]): string[] {
    const recommendations: string[] = [];
    
    // Find bottom quartile metrics
    const weakAreas = comparisons.filter(c => c.quartile === 1);
    weakAreas.forEach(area => {
      recommendations.push(`Focus on improving ${area.metric} - currently in bottom quartile`);
    });

    // Find high improvement opportunities
    const highImprovement = comparisons.filter(c => c.improvement > 20);
    highImprovement.forEach(area => {
      recommendations.push(`${area.metric} has ${Math.round(area.improvement)}% improvement potential`);
    });

    // Add general recommendations
    if (recommendations.length === 0) {
      recommendations.push('Maintain current performance levels');
      recommendations.push('Consider setting stretch targets for top quartile metrics');
    }

    return recommendations;
  }

  private analyzeTrends(historicalData: any[]): Array<{
    metric: string;
    trend: 'improving' | 'declining' | 'stable';
    change: number;
  }> {
    // Group by year
    const yearlyAverages = new Map<number, any[]>();
    historicalData.forEach(data => {
      const year = new Date(data.timestamp).getFullYear();
      if (!yearlyAverages.has(year)) {
        yearlyAverages.set(year, []);
      }
      yearlyAverages.get(year)!.push(data);
    });

    // Calculate trends for key metrics
    const trends: any[] = [];
    const metrics = ['emissions.intensity', 'energy.renewable', 'waste.diversionRate'];
    
    metrics.forEach(metric => {
      const yearlyValues: number[] = [];
      yearlyAverages.forEach((yearData) => {
        const values = yearData.map(d => this.getNestedValue(d.metrics, metric)).filter(v => v != null);
        if (values.length > 0) {
          yearlyValues.push(values.reduce((a, b) => a + b, 0) / values.length);
        }
      });

      if (yearlyValues.length >= 2) {
        const change = ((yearlyValues[yearlyValues.length - 1] - yearlyValues[0]) / yearlyValues[0]) * 100;
        trends.push({
          metric: metric.replace('.', ' ').replace(/_/g, ' '),
          trend: change > 5 ? 'improving' : change < -5 ? 'declining' : 'stable',
          change: Math.round(change * 10) / 10,
        });
      }
    });

    return trends;
  }

  private async identifyLeaders(data: any[]): Promise<Array<{
    metric: string;
    topPerformance: number;
    averagePerformance: number;
  }>> {
    const metrics = ['emissions.intensity', 'energy.renewable', 'waste.diversionRate'];
    const leaders: any[] = [];

    for (const metric of metrics) {
      const values = data.map(d => this.getNestedValue(d.metrics, metric)).filter(v => v != null);
      if (values.length >= this.privacyLayer['config'].suppressionThreshold) {
        const benchmark = await this.privacyLayer.createAnonymousBenchmark(
          data,
          (d) => this.getNestedValue(d.metrics, metric) || 0
        );

        leaders.push({
          metric: metric.replace('.', ' ').replace(/_/g, ' '),
          topPerformance: benchmark.percentiles.p90,
          averagePerformance: benchmark.percentiles.p50,
        });
      }
    }

    return leaders;
  }

  private identifyOpportunities(
    trends: any[],
    leaders: any[]
  ): string[] {
    const opportunities: string[] = [];

    // Based on trends
    trends.forEach(trend => {
      if (trend.trend === 'declining') {
        opportunities.push(`Reverse declining trend in ${trend.metric}`);
      }
    });

    // Based on leader gaps
    leaders.forEach(leader => {
      const gap = ((leader.topPerformance - leader.averagePerformance) / leader.averagePerformance) * 100;
      if (gap > 30) {
        opportunities.push(`${Math.round(gap)}% performance gap in ${leader.metric} between leaders and average`);
      }
    });

    // General opportunities
    opportunities.push('Collaborate with peers to share best practices');
    opportunities.push('Set science-based targets aligned with industry leaders');

    return opportunities;
  }

  private generalizeRegion(region: string): string {
    // Simple region generalization for privacy
    const parts = region.split(',');
    return parts.length > 1 ? parts[parts.length - 1].trim() : region;
  }
}