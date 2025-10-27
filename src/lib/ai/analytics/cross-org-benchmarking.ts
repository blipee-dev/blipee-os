/**
 * Cross-Organizational Benchmarking Service
 *
 * Enables global agents to:
 * - Compare organization performance across all organizations
 * - Identify best practices and patterns
 * - Provide industry benchmarks and insights
 * - Calculate percentile rankings
 *
 * Uses existing benchmark tables: benchmark_cohorts, peer_benchmarks, sector_benchmarks
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface OrganizationPerformance {
  organizationId: string;
  metric: string;
  value: number;
  timestamp: Date;
}

export interface BenchmarkComparison {
  organizationId: string;
  metric: string;
  organizationValue: number;
  industryAverage: number;
  industryMedian: number;
  percentileRank: number; // 0-100, higher is better
  topPercentile: boolean; // True if in top 10%
  comparison: 'excellent' | 'above_average' | 'average' | 'below_average' | 'poor';
  peerCount: number; // Number of organizations in comparison
}

export interface BestPractice {
  organizationId: string;
  practiceArea: string;
  description: string;
  impact: number; // Score 0-100
  adoptionCount: number; // How many orgs use this
  relatedMetrics: string[];
}

/**
 * Calculate cross-organizational metrics for a specific metric type
 */
export async function calculateCrossOrgMetrics(
  metric: string,
  supabase: SupabaseClient
): Promise<{ avg: number; median: number; top10Threshold: number; count: number } | null> {
  try {
    // Query all organizations for this metric
    // This would typically come from a metrics table - adjust based on actual schema
    const { data: metrics, error } = await supabase
      .from('organization_metrics')
      .select('organization_id, value')
      .eq('metric_name', metric)
      .gte('measured_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('value', { ascending: false });

    if (error || !metrics || metrics.length === 0) {
      console.warn(`[Cross-Org] No metrics found for ${metric}`);
      return null;
    }

    const values = metrics.map((m: any) => m.value).sort((a: number, b: number) => b - a);
    const count = values.length;
    const avg = values.reduce((sum: number, v: number) => sum + v, 0) / count;
    const median = values[Math.floor(count / 2)];
    const top10Index = Math.floor(count * 0.1);
    const top10Threshold = values[top10Index];

    return { avg, median, top10Threshold, count };
  } catch (error) {
    console.error('[Cross-Org] Error calculating metrics:', error);
    return null;
  }
}

/**
 * Get benchmark comparison for an organization
 */
export async function getBenchmarkComparison(
  organizationId: string,
  metric: string,
  organizationValue: number,
  supabase: SupabaseClient
): Promise<BenchmarkComparison | null> {
  try {
    const stats = await calculateCrossOrgMetrics(metric, supabase);
    if (!stats) return null;

    // Calculate percentile rank
    const { data: allMetrics, error } = await supabase
      .from('organization_metrics')
      .select('value')
      .eq('metric_name', metric)
      .gte('measured_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error || !allMetrics) return null;

    const betterCount = allMetrics.filter((m: any) => m.value > organizationValue).length;
    const percentileRank = ((allMetrics.length - betterCount) / allMetrics.length) * 100;

    const topPercentile = percentileRank >= 90;

    let comparison: 'excellent' | 'above_average' | 'average' | 'below_average' | 'poor';
    if (percentileRank >= 90) comparison = 'excellent';
    else if (percentileRank >= 70) comparison = 'above_average';
    else if (percentileRank >= 40) comparison = 'average';
    else if (percentileRank >= 20) comparison = 'below_average';
    else comparison = 'poor';

    return {
      organizationId,
      metric,
      organizationValue,
      industryAverage: stats.avg,
      industryMedian: stats.median,
      percentileRank: Math.round(percentileRank),
      topPercentile,
      comparison,
      peerCount: stats.count,
    };
  } catch (error) {
    console.error('[Cross-Org] Error getting benchmark comparison:', error);
    return null;
  }
}

/**
 * Identify best practices from top-performing organizations
 */
export async function identifyBestPractices(
  metric: string,
  supabase: SupabaseClient
): Promise<BestPractice[]> {
  try {
    const stats = await calculateCrossOrgMetrics(metric, supabase);
    if (!stats) return [];

    // Get top 10% organizations
    const { data: topOrgs, error } = await supabase
      .from('organization_metrics')
      .select('organization_id, value')
      .eq('metric_name', metric)
      .gte('value', stats.top10Threshold)
      .gte('measured_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error || !topOrgs) return [];

    // Analyze what these organizations do differently
    // This is a simplified version - real implementation would analyze patterns
    const practices: BestPractice[] = [];

    // Example: Check if they use certain features more
    for (const org of topOrgs) {
      const practice: BestPractice = {
        organizationId: org.organization_id,
        practiceArea: metric,
        description: `Top performer in ${metric}`,
        impact: Math.round((org.value / stats.avg) * 100),
        adoptionCount: 1, // Would calculate from actual data
        relatedMetrics: [metric],
      };
      practices.push(practice);
    }

    return practices;
  } catch (error) {
    console.error('[Cross-Org] Error identifying best practices:', error);
    return [];
  }
}

/**
 * Get industry insights for an organization
 */
export async function getIndustryInsights(
  organizationId: string,
  supabase: SupabaseClient
): Promise<string[]> {
  const insights: string[] = [];

  try {
    // Example metrics to benchmark
    const metricsToCheck = [
      'carbon_emissions_reduction',
      'energy_efficiency',
      'waste_reduction',
      'renewable_energy_usage',
      'water_conservation',
    ];

    for (const metric of metricsToCheck) {
      // Get organization's value (this is a simplified query)
      const { data: orgMetrics } = await supabase
        .from('organization_metrics')
        .select('value')
        .eq('organization_id', organizationId)
        .eq('metric_name', metric)
        .order('measured_at', { ascending: false })
        .limit(1)
        .single();

      if (!orgMetrics) continue;

      const comparison = await getBenchmarkComparison(
        organizationId,
        metric,
        orgMetrics.value,
        supabase
      );

      if (!comparison) continue;

      // Generate insights based on comparison
      if (comparison.topPercentile) {
        insights.push(
          `🏆 Excellent performance in ${metric.replace(/_/g, ' ')}: You're in the top 10% (${comparison.percentileRank}th percentile)`
        );
      } else if (comparison.comparison === 'above_average') {
        insights.push(
          `✅ Above average in ${metric.replace(/_/g, ' ')}: ${comparison.percentileRank}th percentile`
        );
      } else if (comparison.comparison === 'below_average' || comparison.comparison === 'poor') {
        const improvementPotential = Math.round(
          ((comparison.industryMedian - comparison.organizationValue) / comparison.organizationValue) *
            100
        );
        insights.push(
          `⚠️ Opportunity in ${metric.replace(/_/g, ' ')}: ${improvementPotential}% below industry median`
        );
      }
    }

    return insights;
  } catch (error) {
    console.error('[Cross-Org] Error getting industry insights:', error);
    return insights;
  }
}

/**
 * Get peer organizations for benchmarking
 * Uses existing benchmark_cohorts and peer_benchmarks tables
 */
export async function getPeerOrganizations(
  organizationId: string,
  supabase: SupabaseClient
): Promise<string[]> {
  try {
    // Query existing peer_benchmarks table
    const { data: peers, error } = await supabase
      .from('peer_benchmarks')
      .select('peer_organization_id')
      .eq('organization_id', organizationId);

    if (error || !peers) {
      // Fallback: Get organizations in same sector
      const { data: org } = await supabase
        .from('organizations')
        .select('industry_sector')
        .eq('id', organizationId)
        .single();

      if (org?.industry_sector) {
        const { data: sectorPeers } = await supabase
          .from('organizations')
          .select('id')
          .eq('industry_sector', org.industry_sector)
          .neq('id', organizationId)
          .limit(10);

        return sectorPeers?.map((p: any) => p.id) || [];
      }

      return [];
    }

    return peers.map((p: any) => p.peer_organization_id);
  } catch (error) {
    console.error('[Cross-Org] Error getting peer organizations:', error);
    return [];
  }
}

/**
 * Share anonymized best practice with all organizations
 */
export async function shareBestPractice(
  practiceArea: string,
  description: string,
  impact: number,
  relatedMetrics: string[],
  supabase: SupabaseClient
): Promise<boolean> {
  try {
    // Insert into benchmark_contributions table
    const { error } = await supabase.from('benchmark_contributions').insert({
      practice_area: practiceArea,
      description,
      impact_score: impact,
      related_metrics: relatedMetrics,
      shared_at: new Date().toISOString(),
      anonymized: true, // Don't reveal which organization contributed
    });

    if (error) {
      console.error('[Cross-Org] Error sharing best practice:', error);
      return false;
    }

    console.log(`[Cross-Org] ✅ Shared best practice: ${practiceArea}`);
    return true;
  } catch (error) {
    console.error('[Cross-Org] Error sharing best practice:', error);
    return false;
  }
}
