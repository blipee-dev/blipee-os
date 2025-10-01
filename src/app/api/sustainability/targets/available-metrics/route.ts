import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (memberError || !memberData?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organizationId = memberData.organization_id;

    // Determine baseline year dynamically
    const currentYear = new Date().getFullYear();
    let baselineYear = currentYear - 1; // Most recent complete year

    // First check if we have data for the preferred baseline year
    const { data: checkData } = await supabaseAdmin
      .from('metrics_data')
      .select('period_end')
      .eq('organization_id', organizationId)
      .gte('period_start', `${baselineYear}-01-01`)
      .lte('period_end', `${baselineYear}-12-31`)
      .limit(1);

    // If no data for last year, find the most recent year with data
    if (!checkData || checkData.length === 0) {
      const { data: availableYears } = await supabaseAdmin
        .from('metrics_data')
        .select('period_end')
        .eq('organization_id', organizationId)
        .order('period_end', { ascending: false })
        .limit(1);

      if (availableYears && availableYears.length > 0) {
        baselineYear = new Date(availableYears[0].period_end).getFullYear();
      }
    }

    const startOfBaseline = `${baselineYear}-01-01`;
    const endOfBaseline = `${baselineYear}-12-31`;

    // Fetch all unique metrics with their total emissions and values
    const { data: metricsData, error: metricsError } = await supabaseAdmin
      .from('metrics_data')
      .select(`
        value,
        unit,
        co2e_emissions,
        metrics_catalog (
          id,
          name,
          category,
          subcategory,
          scope,
          unit,
          description,
          emission_factor
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', startOfBaseline)
      .lte('period_end', endOfBaseline);

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
      return NextResponse.json({ error: 'Failed to fetch metrics data' }, { status: 500 });
    }

    // Aggregate by metric catalog ID
    const aggregatedMetrics = new Map();

    metricsData?.forEach(item => {
      if (!item.metrics_catalog?.id) return;

      const metricId = item.metrics_catalog.id;

      if (!aggregatedMetrics.has(metricId)) {
        aggregatedMetrics.set(metricId, {
          id: metricId,
          name: item.metrics_catalog.name,
          category: item.metrics_catalog.category,
          subcategory: item.metrics_catalog.subcategory,
          scope: item.metrics_catalog.scope,
          unit: item.unit || item.metrics_catalog.unit,
          description: item.metrics_catalog.description,
          emissionFactor: item.metrics_catalog.emission_factor,
          totalValue: 0,
          totalEmissions: 0,
          dataPoints: 0,
          strategies: determineStrategies(item.metrics_catalog)
        });
      }

      const metric = aggregatedMetrics.get(metricId);
      metric.totalValue += item.value || 0;
      metric.totalEmissions += item.co2e_emissions || 0;
      metric.dataPoints += 1;
    });

    // Convert to array and sort by emissions impact
    const metricsArray = Array.from(aggregatedMetrics.values())
      .filter(m => m.totalEmissions > 0) // Only metrics with emissions
      .sort((a, b) => b.totalEmissions - a.totalEmissions);

    // Categorize metrics by type
    const categorizedMetrics = {
      energy: metricsArray.filter(m =>
        m.category?.toLowerCase().includes('energy') ||
        m.name?.toLowerCase().includes('electricity') ||
        m.name?.toLowerCase().includes('heating') ||
        m.name?.toLowerCase().includes('cooling')
      ),
      transportation: metricsArray.filter(m =>
        m.category?.toLowerCase().includes('transport') ||
        m.category?.toLowerCase().includes('travel') ||
        m.name?.toLowerCase().includes('fleet') ||
        m.name?.toLowerCase().includes('vehicle')
      ),
      waste: metricsArray.filter(m =>
        m.category?.toLowerCase().includes('waste') ||
        m.name?.toLowerCase().includes('disposal') ||
        m.name?.toLowerCase().includes('recycl')
      ),
      water: metricsArray.filter(m =>
        m.category?.toLowerCase().includes('water') ||
        m.name?.toLowerCase().includes('water')
      ),
      materials: metricsArray.filter(m =>
        m.category?.toLowerCase().includes('material') ||
        m.category?.toLowerCase().includes('procurement') ||
        m.name?.toLowerCase().includes('paper') ||
        m.name?.toLowerCase().includes('plastic')
      ),
      other: metricsArray.filter(m => {
        const isOther = !['energy', 'transportation', 'waste', 'water', 'materials'].some(cat => {
          const catMetrics = categorizedMetrics[cat as keyof typeof categorizedMetrics];
          return catMetrics?.some(cm => cm.id === m.id);
        });
        return isOther;
      })
    };

    return NextResponse.json({
      totalMetrics: metricsArray.length,
      totalEmissions: metricsArray.reduce((sum, m) => sum + m.totalEmissions, 0),
      metrics: metricsArray,
      categorized: categorizedMetrics,
      baselineYear: baselineYear,
      note: `Using ${baselineYear} as baseline year (most recent complete year with data)`
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Intelligently determine reduction strategies based on metric characteristics
function determineStrategies(metricCatalog: any) {
  const name = metricCatalog.name?.toLowerCase() || '';
  const category = metricCatalog.category?.toLowerCase() || '';
  const subcategory = metricCatalog.subcategory?.toLowerCase() || '';
  const unit = metricCatalog.unit?.toLowerCase() || '';

  // Energy metrics
  if (category.includes('energy') || name.includes('electricity') || name.includes('heating') || name.includes('cooling')) {
    return {
      hasDualStrategy: true,
      reduction: 'Energy Efficiency',
      improvement: 'Renewable Energy',
      reductionMax: 50, // Realistic efficiency gains
      improvementMax: 100 // Can go 100% renewable
    };
  }

  // Transportation
  if (category.includes('transport') || category.includes('travel')) {
    if (name.includes('business') || name.includes('air')) {
      return {
        hasDualStrategy: true,
        reduction: 'Trip Reduction',
        improvement: 'Mode Shift (Rail/EV)',
        reductionMax: 50,
        improvementMax: 80 // Can't eliminate all emissions from travel
      };
    }
    if (name.includes('fleet') || name.includes('vehicle')) {
      return {
        hasDualStrategy: true,
        reduction: 'Fleet Optimization',
        improvement: 'Electric Vehicles',
        reductionMax: 30,
        improvementMax: 100 // Can go fully electric
      };
    }
    return {
      hasDualStrategy: true,
      reduction: 'Reduce Distance',
      improvement: 'Low-Carbon Options',
      reductionMax: 40,
      improvementMax: 70
    };
  }

  // Waste
  if (category.includes('waste') || name.includes('disposal')) {
    if (name.includes('landfill')) {
      return {
        hasDualStrategy: true,
        reduction: 'Waste Prevention',
        improvement: 'Diversion (Recycling/Composting)',
        reductionMax: 50,
        improvementMax: 90 // Some waste always remains
      };
    }
    if (name.includes('recycl')) {
      return {
        hasDualStrategy: true,
        reduction: 'Material Reduction',
        improvement: 'Recycling Rate',
        reductionMax: 40,
        improvementMax: 95 // High recycling possible
      };
    }
    return {
      hasDualStrategy: true,
      reduction: 'Waste Reduction',
      improvement: 'Better Treatment',
      reductionMax: 45,
      improvementMax: 75
    };
  }

  // Water
  if (category.includes('water') || name.includes('water')) {
    return {
      hasDualStrategy: true,
      reduction: 'Water Conservation',
      improvement: 'Recycled/Rainwater',
      reductionMax: 40,
      improvementMax: 60 // Partial recycled water use
    };
  }

  // Materials/Procurement
  if (category.includes('material') || category.includes('procurement')) {
    return {
      hasDualStrategy: true,
      reduction: 'Reduce Consumption',
      improvement: 'Sustainable Sourcing',
      reductionMax: 35,
      improvementMax: 80 // Can source mostly sustainable
    };
  }

  // Refrigerants (high impact)
  if (name.includes('refrigerant') || name.includes('f-gas')) {
    return {
      hasDualStrategy: true,
      reduction: 'Leak Prevention',
      improvement: 'Low-GWP Alternatives',
      reductionMax: 90, // Can prevent most leaks
      improvementMax: 95 // Can switch to low-GWP
    };
  }

  // Default single strategy
  return {
    hasDualStrategy: false,
    reduction: 'Reduction',
    improvement: null,
    reductionMax: 50,
    improvementMax: 0
  };
}