import { createClient } from '@supabase/supabase-js';
import { PrivacyPreservingNetwork } from '../ai/network-intelligence/privacy-layer';
import { NetworkGraphEngine } from '../ai/network-intelligence/graph-engine';

export interface BenchmarkRequest {
  organizationId: string;
  metric: string;
  category: 'emissions' | 'energy' | 'waste' | 'water' | 'social' | 'governance';
  filters?: {
    industry?: string;
    region?: string;
    size?: 'small' | 'medium' | 'large' | 'enterprise';
    timeframe?: 'month' | 'quarter' | 'year';
  };
}

export interface BenchmarkResult {
  organizationPosition: number;
  percentile: number;
  industryAverage: number;
  topPerformers: number;
  bottomPerformers: number;
  improvementOpportunity: number;
  anonymizedPeers: number;
  insights: string[];
  recommendations: string[];
}

export class PeerBenchmarkingService {
  private static instance: PeerBenchmarkingService;
  private privacyNetwork: PrivacyPreservingNetwork;
  private graphEngine: NetworkGraphEngine;
  private supabase: any;
  private benchmarkCache: Map<string, { result: BenchmarkResult; timestamp: Date }> = new Map();
  private cacheExpiry = 3600000; // 1 hour

  private constructor() {
    this.privacyNetwork = new PrivacyPreservingNetwork();
    this.graphEngine = new NetworkGraphEngine();
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  static getInstance(): PeerBenchmarkingService {
    if (!PeerBenchmarkingService.instance) {
      PeerBenchmarkingService.instance = new PeerBenchmarkingService();
    }
    return PeerBenchmarkingService.instance;
  }

  /**
   * Get benchmark comparison for an organization
   */
  async getBenchmark(request: BenchmarkRequest): Promise<BenchmarkResult> {
    const cacheKey = this.getCacheKey(request);
    
    // Check cache
    const cached = this.benchmarkCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp.getTime()) < this.cacheExpiry) {
      console.log('📊 Returning cached benchmark');
      return cached.result;
    }

    try {
      console.log(`📊 Generating benchmark for ${request.metric}`);

      // Get organization's current performance
      const orgPerformance = await this.getOrganizationMetric(
        request.organizationId,
        request.metric,
        request.category
      );

      // Create anonymous benchmark using privacy-preserving methods
      const benchmark = await this.privacyNetwork.createAnonymousBenchmark(
        request.metric,
        request.filters || {}
      );

      // Calculate organization's position
      const position = this.calculatePosition(orgPerformance, benchmark);

      // Generate insights
      const insights = await this.generateInsights(
        request,
        orgPerformance,
        benchmark,
        position
      );

      // Get improvement recommendations
      const recommendations = await this.getRecommendations(
        request,
        position,
        benchmark
      );

      const result: BenchmarkResult = {
        organizationPosition: orgPerformance,
        percentile: position.percentile,
        industryAverage: benchmark.mean,
        topPerformers: benchmark.percentiles.p90,
        bottomPerformers: benchmark.percentiles.p10,
        improvementOpportunity: Math.max(0, benchmark.percentiles.p75 - orgPerformance),
        anonymizedPeers: benchmark.sampleSize,
        insights,
        recommendations
      };

      // Cache result
      this.benchmarkCache.set(cacheKey, {
        result,
        timestamp: new Date()
      });

      // Store benchmark for network learning
      await this.storeBenchmarkResult(request, result);

      return result;

    } catch (error) {
      console.error('Benchmark error:', error);
      throw error;
    }
  }

  /**
   * Get real-time peer comparison
   */
  async getRealTimePeerComparison(
    organizationId: string,
    metrics: string[]
  ): Promise<{
    metrics: Array<{
      name: string;
      value: number;
      peerAverage: number;
      ranking: number;
      trend: 'improving' | 'stable' | 'declining';
    }>;
    overallScore: number;
    peerGroup: string;
  }> {
    const results = await Promise.all(
      metrics.map(async (metric) => {
        const benchmark = await this.getBenchmark({
          organizationId,
          metric,
          category: this.getMetricCategory(metric)
        });

        const trend = await this.getMetricTrend(organizationId, metric);

        return {
          name: metric,
          value: benchmark.organizationPosition,
          peerAverage: benchmark.industryAverage,
          ranking: benchmark.percentile,
          trend
        };
      })
    );

    // Calculate overall sustainability score
    const overallScore = this.calculateOverallScore(results);

    return {
      metrics: results,
      overallScore,
      peerGroup: await this.identifyPeerGroup(organizationId)
    };
  }

  /**
   * Join or create industry benchmark group
   */
  async joinBenchmarkGroup(
    organizationId: string,
    groupType: 'industry' | 'region' | 'size' | 'custom',
    groupIdentifier: string
  ): Promise<{
    groupId: string;
    members: number;
    benchmarksAvailable: string[];
  }> {
    // Find or create benchmark group
    const { data: existingGroup } = await this.supabase
      .from('benchmark_groups')
      .select('*')
      .eq('group_type', groupType)
      .eq('group_identifier', groupIdentifier)
      .single();

    let groupId: string;
    
    if (existingGroup) {
      groupId = existingGroup.id;
      
      // Add organization to group
      await this.supabase.from('benchmark_group_members').insert({
        group_id: groupId,
        organization_id: organizationId,
        joined_at: new Date().toISOString(),
        data_sharing_consent: true
      });
    } else {
      // Create new group
      const { data: newGroup } = await this.supabase
        .from('benchmark_groups')
        .insert({
          group_type: groupType,
          group_identifier: groupIdentifier,
          created_by: organizationId,
          min_members_for_benchmark: 5,
          anonymization_threshold: 3
        })
        .select()
        .single();
      
      groupId = newGroup.id;
    }

    // Get group info
    const { data: members } = await this.supabase
      .from('benchmark_group_members')
      .select('organization_id')
      .eq('group_id', groupId);

    const { data: benchmarks } = await this.supabase
      .from('group_benchmarks')
      .select('metric')
      .eq('group_id', groupId)
      .eq('is_active', true);

    return {
      groupId,
      members: members?.length || 1,
      benchmarksAvailable: benchmarks?.map(b => b.metric) || []
    };
  }

  /**
   * Create custom peer group for benchmarking
   */
  async createCustomPeerGroup(
    organizationId: string,
    name: string,
    criteria: {
      industries?: string[];
      regions?: string[];
      sizeRange?: { min: number; max: number };
      certifications?: string[];
    }
  ): Promise<{
    groupId: string;
    potentialMembers: number;
    invitationCode: string;
  }> {
    // Create custom group
    const { data: group } = await this.supabase
      .from('benchmark_groups')
      .insert({
        group_type: 'custom',
        group_identifier: name,
        created_by: organizationId,
        criteria,
        invitation_code: this.generateInvitationCode(),
        is_private: true
      })
      .select()
      .single();

    // Find potential members based on criteria
    const potentialMembers = await this.findPotentialMembers(criteria);

    return {
      groupId: group.id,
      potentialMembers: potentialMembers.length,
      invitationCode: group.invitation_code
    };
  }

  /**
   * Private helper methods
   */
  private async getOrganizationMetric(
    organizationId: string,
    metric: string,
    category: string
  ): Promise<number> {
    // Map metric names to database fields
    const metricMapping: Record<string, string> = {
      'total_emissions': 'co2e_kg',
      'energy_intensity': 'energy_per_sqm',
      'waste_diverted': 'waste_diverted_percentage',
      'water_usage': 'water_consumption_m3',
      'employee_satisfaction': 'employee_satisfaction_score',
      'board_diversity': 'board_diversity_percentage'
    };

    const field = metricMapping[metric] || metric;

    // Get latest metric value
    const { data } = await this.supabase
      .from(`${category}_metrics`)
      .select(field)
      .eq('organization_id', organizationId)
      .order('period_end', { ascending: false })
      .limit(1)
      .single();

    return data?.[field] || 0;
  }

  private calculatePosition(
    orgValue: number,
    benchmark: any
  ): { percentile: number; rank: number } {
    const { distribution } = benchmark;
    
    // Calculate percentile
    let percentile = 0;
    for (let i = 0; i < distribution.length; i++) {
      if (orgValue <= distribution[i]) {
        percentile = (i / distribution.length) * 100;
        break;
      }
    }

    // For metrics where lower is better (e.g., emissions)
    if (benchmark.lowerIsBetter) {
      percentile = 100 - percentile;
    }

    return {
      percentile: Math.round(percentile),
      rank: Math.ceil((1 - percentile / 100) * benchmark.sampleSize)
    };
  }

  private async generateInsights(
    request: BenchmarkRequest,
    orgValue: number,
    benchmark: any,
    position: { percentile: number; rank: number }
  ): Promise<string[]> {
    const insights: string[] = [];

    // Performance insight
    if (position.percentile >= 75) {
      insights.push(`You're in the top 25% of organizations for ${request.metric}`);
    } else if (position.percentile >= 50) {
      insights.push(`Your ${request.metric} performance is above average`);
    } else if (position.percentile >= 25) {
      insights.push(`Your ${request.metric} performance is below average`);
    } else {
      insights.push(`Significant improvement needed in ${request.metric}`);
    }

    // Gap analysis
    const gap = Math.abs(orgValue - benchmark.mean);
    const gapPercentage = (gap / benchmark.mean) * 100;
    
    if (orgValue > benchmark.mean && benchmark.lowerIsBetter) {
      insights.push(`You're ${gapPercentage.toFixed(1)}% above the industry average`);
    } else if (orgValue < benchmark.mean && !benchmark.lowerIsBetter) {
      insights.push(`You're ${gapPercentage.toFixed(1)}% below the industry average`);
    }

    // Trend insight
    const trend = await this.getMetricTrend(request.organizationId, request.metric);
    if (trend === 'improving') {
      insights.push('Your performance has been improving over the past 3 months');
    } else if (trend === 'declining') {
      insights.push('Your performance has been declining - immediate action recommended');
    }

    // Peer comparison
    if (benchmark.sampleSize >= 10) {
      insights.push(`Based on anonymous data from ${benchmark.sampleSize} similar organizations`);
    }

    return insights;
  }

  private async getRecommendations(
    request: BenchmarkRequest,
    position: { percentile: number },
    benchmark: any
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Get best practices from top performers
    if (position.percentile < 75) {
      const bestPractices = await this.getBestPractices(request.metric, request.category);
      recommendations.push(...bestPractices.slice(0, 3));
    }

    // Specific recommendations based on gap
    const improvementTarget = benchmark.percentiles.p75;
    const currentValue = request.organizationId; // Would be actual org value
    const improvementNeeded = ((improvementTarget - currentValue) / currentValue) * 100;

    if (improvementNeeded > 20) {
      recommendations.push(`Target ${improvementNeeded.toFixed(0)}% improvement to reach top quartile`);
    }

    // Industry-specific recommendations
    if (request.filters?.industry) {
      const industryRecs = await this.getIndustryRecommendations(
        request.filters.industry,
        request.metric
      );
      recommendations.push(...industryRecs.slice(0, 2));
    }

    return recommendations;
  }

  private async getBestPractices(metric: string, category: string): Promise<string[]> {
    // This would fetch from a best practices database
    const practicesMap: Record<string, string[]> = {
      'total_emissions': [
        'Implement energy management system (ISO 50001)',
        'Transition to renewable energy sources',
        'Optimize HVAC and lighting systems',
        'Engage employees in energy conservation'
      ],
      'waste_diverted': [
        'Implement comprehensive recycling program',
        'Partner with circular economy vendors',
        'Digitize processes to reduce paper waste',
        'Conduct waste audits quarterly'
      ],
      'water_usage': [
        'Install low-flow fixtures and sensors',
        'Implement rainwater harvesting',
        'Monitor and fix leaks promptly',
        'Reuse greywater where possible'
      ]
    };

    return practicesMap[metric] || ['Consult industry best practices', 'Engage sustainability consultants'];
  }

  private async getIndustryRecommendations(
    industry: string,
    metric: string
  ): Promise<string[]> {
    // Industry-specific recommendations
    const { data: recommendations } = await this.supabase
      .from('industry_recommendations')
      .select('recommendation')
      .eq('industry', industry)
      .eq('metric', metric)
      .limit(5);

    return recommendations?.map(r => r.recommendation) || [];
  }

  private getMetricCategory(metric: string): 'emissions' | 'energy' | 'waste' | 'water' | 'social' | 'governance' {
    const categoryMap: Record<string, any> = {
      'total_emissions': 'emissions',
      'scope1_emissions': 'emissions',
      'scope2_emissions': 'emissions',
      'scope3_emissions': 'emissions',
      'energy_consumption': 'energy',
      'energy_intensity': 'energy',
      'renewable_percentage': 'energy',
      'waste_generated': 'waste',
      'waste_diverted': 'waste',
      'water_usage': 'water',
      'water_recycled': 'water',
      'employee_satisfaction': 'social',
      'safety_incidents': 'social',
      'board_diversity': 'governance',
      'ethics_training': 'governance'
    };

    return categoryMap[metric] || 'emissions';
  }

  private async getMetricTrend(
    organizationId: string,
    metric: string
  ): Promise<'improving' | 'stable' | 'declining'> {
    // Get last 3 months of data
    const { data: history } = await this.supabase
      .from('metric_history')
      .select('value, period_end')
      .eq('organization_id', organizationId)
      .eq('metric', metric)
      .order('period_end', { ascending: false })
      .limit(3);

    if (!history || history.length < 3) return 'stable';

    // Calculate trend
    const recent = history[0].value;
    const oldest = history[2].value;
    const change = ((recent - oldest) / oldest) * 100;

    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  private calculateOverallScore(metrics: any[]): number {
    // Weight different metrics
    const weights: Record<string, number> = {
      'total_emissions': 0.3,
      'energy_intensity': 0.2,
      'waste_diverted': 0.15,
      'water_usage': 0.15,
      'employee_satisfaction': 0.1,
      'board_diversity': 0.1
    };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const metric of metrics) {
      const weight = weights[metric.name] || 0.1;
      weightedSum += metric.ranking * weight;
      totalWeight += weight;
    }

    return Math.round(weightedSum / totalWeight);
  }

  private async identifyPeerGroup(organizationId: string): Promise<string> {
    // Get organization details
    const { data: org } = await this.supabase
      .from('organizations')
      .select('industry, employee_count, annual_revenue')
      .eq('id', organizationId)
      .single();

    if (!org) return 'Unknown';

    // Determine size category
    let size = 'small';
    if (org.employee_count > 1000 || org.annual_revenue > 1000000000) {
      size = 'enterprise';
    } else if (org.employee_count > 250 || org.annual_revenue > 50000000) {
      size = 'large';
    } else if (org.employee_count > 50 || org.annual_revenue > 10000000) {
      size = 'medium';
    }

    return `${org.industry} - ${size}`;
  }

  private async findPotentialMembers(criteria: any): Promise<any[]> {
    let query = this.supabase.from('organizations').select('id, name');

    if (criteria.industries?.length) {
      query = query.in('industry', criteria.industries);
    }

    if (criteria.regions?.length) {
      query = query.in('region', criteria.regions);
    }

    if (criteria.sizeRange) {
      query = query
        .gte('employee_count', criteria.sizeRange.min)
        .lte('employee_count', criteria.sizeRange.max);
    }

    const { data } = await query;
    return data || [];
  }

  private generateInvitationCode(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private getCacheKey(request: BenchmarkRequest): string {
    return `${request.organizationId}-${request.metric}-${JSON.stringify(request.filters || {})}`;
  }

  private async storeBenchmarkResult(
    request: BenchmarkRequest,
    result: BenchmarkResult
  ): Promise<void> {
    try {
      await this.supabase.from('benchmark_results').insert({
        organization_id: request.organizationId,
        metric: request.metric,
        category: request.category,
        percentile: result.percentile,
        peer_count: result.anonymizedPeers,
        filters: request.filters,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error storing benchmark result:', error);
    }
  }
}