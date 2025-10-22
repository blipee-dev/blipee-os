import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {

    // Get current user
    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;

    // Fetch metrics catalog with actual emissions data
    const { data: metricsData, error: metricsError } = await supabaseAdmin
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog!inner(
          id,
          name,
          category,
          subcategory,
          scope,
          unit,
          emission_factor,
          description
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', new Date(new Date().getFullYear() - 1, 0, 1).toISOString())
      .order('co2e_emissions', { ascending: false });

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    // Aggregate metrics by catalog entry
    const metricAggregation = new Map();

    metricsData?.forEach(record => {
      const metricId = record.metrics_catalog?.id;
      if (!metricId) return;

      if (!metricAggregation.has(metricId)) {
        metricAggregation.set(metricId, {
          id: metricId,
          name: record.metrics_catalog.name,
          category: record.metrics_catalog.category,
          subcategory: record.metrics_catalog.subcategory,
          scope: record.metrics_catalog.scope === 'scope_1' ? 1 :
                 record.metrics_catalog.scope === 'scope_2' ? 2 : 3,
          unit: record.metrics_catalog.unit,
          emissionFactor: record.metrics_catalog.emission_factor,
          description: record.metrics_catalog.description,
          emissions: 0,
          quantity: 0,
          dataPoints: 0,
          sites: new Set(),
          latestValue: 0,
          trend: []
        });
      }

      const metric = metricAggregation.get(metricId);
      metric.emissions += record.co2e_emissions || 0;
      metric.quantity += record.quantity || 0;
      metric.dataPoints += 1;
      if (record.site_id) metric.sites.add(record.site_id);
      metric.latestValue = record.co2e_emissions || 0;

      // Add to trend data (last 6 months)
      const date = new Date(record.period_start);
      metric.trend.push({
        date: date.toISOString(),
        month: date.toLocaleDateString('en', { month: 'short' }),
        value: record.co2e_emissions || 0
      });
    });

    // Convert to array and sort
    const metrics = Array.from(metricAggregation.values()).map(m => ({
      ...m,
      sites: Array.from(m.sites),
      trend: m.trend.slice(-6) // Last 6 data points
    })).sort((a, b) => b.emissions - a.emissions);

    // Group by scope and category for summary
    const scopeSummary = {
      scope1: metrics.filter(m => m.scope === 1).reduce((sum, m) => sum + m.emissions, 0),
      scope2: metrics.filter(m => m.scope === 2).reduce((sum, m) => sum + m.emissions, 0),
      scope3: metrics.filter(m => m.scope === 3).reduce((sum, m) => sum + m.emissions, 0)
    };

    const categorySummary = metrics.reduce((acc, metric) => {
      if (!acc[metric.category]) {
        acc[metric.category] = {
          name: metric.category,
          emissions: 0,
          metrics: []
        };
      }
      acc[metric.category].emissions += metric.emissions;
      acc[metric.category].metrics.push(metric);
      return acc;
    }, {} as Record<string, any>);

    // Get top emission sources
    const topSources = metrics.slice(0, 10).map(m => ({
      id: m.id,
      name: m.name,
      category: m.category,
      scope: m.scope,
      emissions: m.emissions,
      percentage: (m.emissions / (scopeSummary.scope1 + scopeSummary.scope2 + scopeSummary.scope3)) * 100
    }));

    // Identify reduction opportunities
    const opportunities = metrics
      .filter(m => m.emissions > 1000) // Focus on significant sources
      .map(m => {
        let reductionPotential = 'low';
        let initiatives = [];

        // Determine reduction potential based on category
        if (m.category === 'Electricity' || m.category === 'Energy') {
          reductionPotential = 'high';
          initiatives = ['Renewable energy', 'Energy efficiency', 'Smart controls'];
        } else if (m.category === 'Transportation' || m.category === 'Travel') {
          reductionPotential = 'high';
          initiatives = ['Fleet electrification', 'Route optimization', 'Virtual meetings'];
        } else if (m.category === 'Waste') {
          reductionPotential = 'medium';
          initiatives = ['Recycling program', 'Waste reduction', 'Circular economy'];
        } else if (m.category === 'Supply Chain' || m.category === 'Purchased Goods') {
          reductionPotential = 'medium';
          initiatives = ['Supplier engagement', 'Local sourcing', 'Sustainable procurement'];
        }

        return {
          metricId: m.id,
          metricName: m.name,
          currentEmissions: m.emissions,
          reductionPotential,
          initiatives,
          estimatedReduction: reductionPotential === 'high' ? 0.5 : reductionPotential === 'medium' ? 0.3 : 0.1
        };
      })
      .sort((a, b) => (b.currentEmissions * b.estimatedReduction) - (a.currentEmissions * a.estimatedReduction))
      .slice(0, 15);

    return NextResponse.json({
      metrics,
      scopeSummary,
      categorySummary: Object.values(categorySummary),
      topSources,
      opportunities,
      metadata: {
        totalMetrics: metrics.length,
        totalEmissions: scopeSummary.scope1 + scopeSummary.scope2 + scopeSummary.scope3,
        dataPoints: metricsData?.length || 0,
        dateRange: {
          start: new Date(new Date().getFullYear() - 1, 0, 1).toISOString(),
          end: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}