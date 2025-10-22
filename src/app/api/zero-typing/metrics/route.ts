import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  try {

    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id, organization:organizations(*)')
      .eq('user_id', user.id)
      .single();

    if (!member) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const currentMonth = new Date();
    const lastMonth = subMonths(currentMonth, 1);

    // Get current month metrics data
    const { data: currentMetrics } = await supabase
      .from('metrics_data')
      .select(`
        value,
        unit,
        co2e_emissions,
        metric:metrics_catalog(code, name, scope, category)
      `)
      .eq('organization_id', member.organization_id)
      .gte('period_start', startOfMonth(currentMonth).toISOString())
      .lte('period_end', endOfMonth(currentMonth).toISOString());

    // Get last month metrics for comparison
    const { data: lastMetrics } = await supabase
      .from('metrics_data')
      .select(`
        value,
        co2e_emissions,
        metric:metrics_catalog(code, name, scope, category)
      `)
      .eq('organization_id', member.organization_id)
      .gte('period_start', startOfMonth(lastMonth).toISOString())
      .lte('period_end', endOfMonth(lastMonth).toISOString());

    // Calculate aggregated metrics
    const metrics = {
      emissions: {
        scope1: 0,
        scope2: 0,
        scope3: 0,
        total: 0,
        trend: 0,
        unit: 'tCO2e'
      },
      energy: {
        consumption: 0,
        renewable: 0,
        trend: 0,
        unit: 'MWh'
      },
      water: {
        consumption: 0,
        recycled: 0,
        trend: 0,
        unit: 'm³'
      },
      waste: {
        generated: 0,
        recycled: 0,
        diverted: 0,
        trend: 0,
        unit: 'tons'
      }
    };

    // Process current metrics
    currentMetrics?.forEach(item => {
      if (!item.metric) return;

      // Emissions by scope
      if (item.metric.scope) {
        const emissions = item.co2e_emissions || 0;
        if (item.metric.scope === 'scope_1') metrics.emissions.scope1 += emissions;
        if (item.metric.scope === 'scope_2') metrics.emissions.scope2 += emissions;
        if (item.metric.scope === 'scope_3') metrics.emissions.scope3 += emissions;
        metrics.emissions.total += emissions;
      }

      // Energy metrics
      if (item.metric.category === 'energy') {
        metrics.energy.consumption += item.value || 0;
        if (item.metric.code?.includes('renewable')) {
          metrics.energy.renewable += item.value || 0;
        }
      }

      // Water metrics
      if (item.metric.category === 'water') {
        metrics.water.consumption += item.value || 0;
        if (item.metric.code?.includes('recycled')) {
          metrics.water.recycled += item.value || 0;
        }
      }

      // Waste metrics
      if (item.metric.category === 'waste') {
        metrics.waste.generated += item.value || 0;
        if (item.metric.code?.includes('recycled')) {
          metrics.waste.recycled += item.value || 0;
        }
        if (item.metric.code?.includes('diverted')) {
          metrics.waste.diverted += item.value || 0;
        }
      }
    });

    // Calculate trends (comparing with last month)
    if (lastMetrics && lastMetrics.length > 0) {
      const lastEmissions = lastMetrics.reduce((sum, item) => sum + (item.co2e_emissions || 0), 0);
      const lastEnergy = lastMetrics
        .filter(item => item.metric?.category === 'energy')
        .reduce((sum, item) => sum + (item.value || 0), 0);
      const lastWater = lastMetrics
        .filter(item => item.metric?.category === 'water')
        .reduce((sum, item) => sum + (item.value || 0), 0);
      const lastWaste = lastMetrics
        .filter(item => item.metric?.category === 'waste')
        .reduce((sum, item) => sum + (item.value || 0), 0);

      // Calculate percentage changes
      if (lastEmissions > 0) {
        metrics.emissions.trend = ((metrics.emissions.total - lastEmissions) / lastEmissions) * 100;
      }
      if (lastEnergy > 0) {
        metrics.energy.trend = ((metrics.energy.consumption - lastEnergy) / lastEnergy) * 100;
      }
      if (lastWater > 0) {
        metrics.water.trend = ((metrics.water.consumption - lastWater) / lastWater) * 100;
      }
      if (lastWaste > 0) {
        metrics.waste.trend = ((metrics.waste.generated - lastWaste) / lastWaste) * 100;
      }
    }

    // Get active AI suggestions count (from agent alerts or predictions)
    const { count: aiSuggestionsCount } = await supabase
      .from('agent_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', member.organization_id)
      .eq('status', 'pending')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Calculate efficiency improvements (mock for now, should be based on historical data)
    const efficiencyGain = 45; // This should be calculated from actual performance data

    return NextResponse.json({
      organization: member.organization,
      metrics,
      stats: {
        aiSuggestions: aiSuggestionsCount || 8,
        quickActions: 12, // This should be dynamic based on available actions
        efficiencyGain
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching zero-typing metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();

    const user = await getAPIUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { start, end, organizationId } = body;

    if (!start || !end || !organizationId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get metrics data for the specified period
    const { data: metricsDataRaw } = await supabaseAdmin
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('period_start', start)
      .lte('period_end', end);

    // Get metrics definitions
    const { data: metricDefs } = await supabaseAdmin
      .from('metrics_catalog')
      .select('id, name, unit, scope, category');

    // Join the data manually
    const metrics = metricsDataRaw?.map(m => ({
      ...m,
      metrics_catalog: metricDefs?.find(def => def.id === m.metric_id)
    }));

    // Process metrics data
    let processedMetrics = null;

    if (metrics && metrics.length > 0) {
      const allMetrics = metrics;

      // Filter for specific categories
      const energy = metrics.filter(m =>
        m.metrics_catalog?.category === 'Electricity' ||
        m.metrics_catalog?.category === 'Purchased Energy'
      );

      const water = metrics.filter(m =>
        m.metrics_catalog?.category === 'Purchased Goods & Services' &&
        (m.metrics_catalog?.name === 'Water' || m.metrics_catalog?.name === 'Wastewater')
      );

      const waste = metrics.filter(m =>
        m.metrics_catalog?.category === 'Waste'
      );

      // Calculate totals
      const calculateTotal = (items: any[]) => {
        return items.reduce((sum, item) => sum + (item.value || 0), 0);
      };

      const calculateEmissionsTotal = (items: any[]) => {
        return items.reduce((sum, item) => sum + ((item.co2e_emissions || 0) / 1000), 0);
      };

      const calculateEnergyTotal = (items: any[]) => {
        return items.reduce((sum, item) => sum + ((item.value || 0) / 1000), 0);
      };

      // Get previous period for trends
      // For year periods, use the previous year
      const startDate = new Date(start);
      const endDate = new Date(end);

      let previousStart: string;
      let previousEnd: string;

      // Check if this is a full year period
      const startYear = startDate.getFullYear();
      const endYear = endDate.getFullYear();
      const isFullYear = startDate.getMonth() === 0 && startDate.getDate() === 1 &&
                         endDate.getMonth() === 11 && endDate.getDate() === 31 &&
                         startYear === endYear;

      if (isFullYear) {
        // For full year, use previous year
        previousStart = `${startYear - 1}-01-01`;
        previousEnd = `${startYear - 1}-12-31`;
      } else {
        // For other periods, shift by the period length
        const periodLength = endDate.getTime() - startDate.getTime() + 24 * 60 * 60 * 1000; // Add one day to include the end date
        previousStart = new Date(startDate.getTime() - periodLength).toISOString().split('T')[0];
        previousEnd = new Date(endDate.getTime() - periodLength).toISOString().split('T')[0];
      }

      const { data: previousMetricsRaw } = await supabaseAdmin
        .from('metrics_data')
        .select('*')
        .eq('organization_id', organizationId)
        .gte('period_start', previousStart)
        .lte('period_end', previousEnd);

      const previousMetrics = previousMetricsRaw?.map(m => ({
        ...m,
        metrics_catalog: metricDefs?.find(def => def.id === m.metric_id)
      }));

      // Calculate previous totals
      let previousEmissionsTotal = 0;
      let previousEnergyTotal = 0;
      let previousWaterTotal = 0;
      let previousWasteTotal = 0;

      if (previousMetrics && previousMetrics.length > 0) {
        previousEmissionsTotal = calculateEmissionsTotal(previousMetrics);

        const prevEnergy = previousMetrics.filter(m =>
          m.metrics_catalog?.category === 'Electricity' ||
          m.metrics_catalog?.category === 'Purchased Energy'
        );
        previousEnergyTotal = calculateEnergyTotal(prevEnergy);

        const prevWater = previousMetrics.filter(m =>
          m.metrics_catalog?.category === 'Purchased Goods & Services' &&
          (m.metrics_catalog?.name === 'Water' || m.metrics_catalog?.name === 'Wastewater')
        );
        previousWaterTotal = calculateTotal(prevWater);

        const prevWaste = previousMetrics.filter(m =>
          m.metrics_catalog?.category === 'Waste'
        );
        previousWasteTotal = calculateTotal(prevWaste);
      }

      // Calculate trends
      const calculateTrend = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      const currentEmissionsTotal = calculateEmissionsTotal(allMetrics);
      const currentEnergyTotal = calculateEnergyTotal(energy);
      const currentWaterTotal = calculateTotal(water);
      const currentWasteTotal = calculateTotal(waste);

      processedMetrics = {
        emissions: {
          total: currentEmissionsTotal,
          unit: 'tCO2e',
          trend: calculateTrend(currentEmissionsTotal, previousEmissionsTotal),
          data: allMetrics
        },
        energy: {
          total: currentEnergyTotal,
          unit: 'MWh',
          trend: calculateTrend(currentEnergyTotal, previousEnergyTotal),
          data: energy
        },
        water: {
          total: currentWaterTotal,
          unit: 'm³',
          trend: calculateTrend(currentWaterTotal, previousWaterTotal),
          data: water
        },
        waste: {
          total: currentWasteTotal,
          unit: 'tons',
          trend: calculateTrend(currentWasteTotal, previousWasteTotal),
          data: waste
        },
        period: {
          start,
          end,
          label: `${start} to ${end}`,
          type: 'custom'
        }
      };
    } else {
      // No data - return empty structure
      processedMetrics = {
        emissions: { total: 0, unit: 'tCO2e', trend: 0, data: [] },
        energy: { total: 0, unit: 'MWh', trend: 0, data: [] },
        water: { total: 0, unit: 'm³', trend: 0, data: [] },
        waste: { total: 0, unit: 'tons', trend: 0, data: [] },
        period: { start, end, label: `${start} to ${end}`, type: 'custom' }
      };
    }

    return NextResponse.json({
      metrics: metrics || [],
      processed: processedMetrics,
      count: metrics?.length || 0
    });

  } catch (error) {
    console.error('Error fetching period metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}