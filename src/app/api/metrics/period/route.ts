import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const supabaseAdmin = createAdminClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { start, end, organizationId } = body;

    if (!organizationId || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Fetch metrics for the specified period
    const { data: metrics, error: metricsError } = await supabaseAdmin
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          name,
          unit,
          scope,
          category
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', start)
      .lte('period_end', end)
      .order('created_at', { ascending: false })
      .limit(500);

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }

    // Process metrics data
    let processedMetrics = null;
    
    if (metrics && metrics.length > 0) {
      // Group metrics by category
      const emissions = metrics.filter(m =>
        m.metrics_catalog?.category === 'Electricity' ||
        m.metrics_catalog?.category === 'Business Travel' ||
        m.metrics_catalog?.category === 'Waste'
      );

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

      // Calculate emissions total (convert kg to tonnes)
      const calculateEmissionsTotal = (items: any[]) => {
        return items.reduce((sum, item) => sum + ((item.co2e_emissions || 0) / 1000), 0);
      };

      // Calculate energy total (convert kWh to MWh)
      const calculateEnergyTotal = (items: any[]) => {
        return items.reduce((sum, item) => sum + ((item.value || 0) / 1000), 0);
      };

      // Group by month for time periods
      const monthlyData: any = {};
      metrics.forEach(metric => {
        const month = new Date(metric.period_start).toISOString().substring(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = {
            emissions: 0,
            energy: 0,
            water: 0,
            waste: 0,
            period: month
          };
        }

        const category = metric.metrics_catalog?.category;
        if (category === 'Electricity' || category === 'Business Travel' || category === 'Waste') {
          monthlyData[month].emissions += (metric.co2e_emissions || 0) / 1000; // Convert kg to tonnes
        }
        if (category === 'Electricity' || category === 'Purchased Energy') {
          monthlyData[month].energy += (metric.value || 0) / 1000; // Convert kWh to MWh
        }
        if (category === 'Purchased Goods & Services' &&
           (metric.metrics_catalog?.name === 'Water' || metric.metrics_catalog?.name === 'Wastewater')) {
          monthlyData[month].water += metric.value || 0;
        }
        if (category === 'Waste') {
          monthlyData[month].waste += metric.value || 0;
        }
      });

      // Calculate trends (mock for now - should be based on historical comparison)
      const currentTotal = calculateEmissionsTotal(emissions);
      const previousPeriodTotal = currentTotal * 1.1; // Mock previous period
      const trend = previousPeriodTotal > 0
        ? ((currentTotal - previousPeriodTotal) / previousPeriodTotal * 100)
        : 0;

      processedMetrics = {
        emissions: {
          total: calculateEmissionsTotal(emissions), // Use emissions total, not value
          unit: 'tCO2e',
          trend: trend,
          data: emissions
        },
        energy: {
          total: calculateEnergyTotal(energy), // Convert kWh to MWh
          unit: 'MWh',
          trend: -8,
          data: energy
        },
        water: {
          total: calculateTotal(water), // Water uses value in m³
          unit: 'm³',
          trend: -5,
          data: water
        },
        waste: {
          total: calculateTotal(waste), // Waste uses value in tons
          unit: 'tons',
          trend: -15,
          data: waste
        },
        monthly: Object.values(monthlyData).sort((a: any, b: any) => b.period.localeCompare(a.period)),
        period: {
          start,
          end,
          label: formatPeriodLabel(start, end),
          type: determinePeriodType(start, end)
        }
      };
    } else {
      // No data for the period
      processedMetrics = {
        emissions: { total: 0, unit: 'tCO2e', trend: 0, data: [] },
        energy: { total: 0, unit: 'MWh', trend: 0, data: [] },
        water: { total: 0, unit: 'm³', trend: 0, data: [] },
        waste: { total: 0, unit: 'tons', trend: 0, data: [] },
        monthly: [],
        period: {
          start,
          end,
          label: formatPeriodLabel(start, end),
          type: determinePeriodType(start, end)
        }
      };
    }

    return NextResponse.json({
      metrics,
      processed: processedMetrics,
      count: metrics?.length || 0
    });

  } catch (error) {
    console.error('Error in metrics period API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function formatPeriodLabel(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear === endYear) {
    // Same year
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 31) {
      return `Last ${daysDiff} Days`;
    } else if (daysDiff <= 93) {
      return `Q${Math.ceil((startDate.getMonth() + 1) / 3)} ${startYear}`;
    } else if (daysDiff >= 364) {
      return `${startYear}`;
    } else {
      return `${startDate.toLocaleDateString('en', { month: 'short' })} - ${endDate.toLocaleDateString('en', { month: 'short' })} ${startYear}`;
    }
  } else {
    return `${startYear} - ${endYear}`;
  }
}

function determinePeriodType(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 31) return 'days';
  if (daysDiff <= 93) return 'quarter';
  if (daysDiff >= 364) return 'year';
  return 'month';
}