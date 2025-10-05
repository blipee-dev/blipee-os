import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: appUser } = await supabase
      .from('app_users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .single();

    if (!appUser?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = appUser.organization_id;

    // Get time range from query params (default to current month)
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('range') || 'month';

    const now = new Date();
    let periodStart: Date;

    if (timeRange === 'quarter') {
      periodStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    } else if (timeRange === 'year') {
      periodStart = new Date(now.getFullYear(), 0, 1);
    } else {
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    // Get all energy sources for the organization
    const { data: sources, error: sourcesError } = await supabase
      .from('energy_sources')
      .select('*')
      .eq('organization_id', organizationId);

    if (sourcesError) {
      throw sourcesError;
    }

    if (!sources || sources.length === 0) {
      return NextResponse.json({
        sources: [],
        total_consumption: 0,
        total_emissions: 0,
        total_cost: 0,
        renewable_percentage: 0
      });
    }

    // Get consumption data for each source
    const sourcesWithData = await Promise.all(
      sources.map(async (source) => {
        const { data: consumption } = await supabase
          .from('energy_consumption')
          .select('consumption_value, unit, emissions_tco2e, cost')
          .eq('source_id', source.id)
          .gte('period_start', periodStart.toISOString())
          .order('period_start', { ascending: false });

        const totalConsumption = consumption?.reduce((sum, c) => sum + (c.consumption_value || 0), 0) || 0;
        const totalEmissions = consumption?.reduce((sum, c) => sum + (c.emissions_tco2e || 0), 0) || 0;
        const totalCost = consumption?.reduce((sum, c) => sum + (c.cost || 0), 0) || 0;

        // Calculate trend (compare with previous period)
        let prevPeriodStart: Date;
        if (timeRange === 'quarter') {
          prevPeriodStart = new Date(periodStart.getFullYear(), periodStart.getMonth() - 3, 1);
        } else if (timeRange === 'year') {
          prevPeriodStart = new Date(periodStart.getFullYear() - 1, 0, 1);
        } else {
          prevPeriodStart = new Date(periodStart.getFullYear(), periodStart.getMonth() - 1, 1);
        }

        const { data: prevConsumption } = await supabase
          .from('energy_consumption')
          .select('consumption_value')
          .eq('source_id', source.id)
          .gte('period_start', prevPeriodStart.toISOString())
          .lt('period_start', periodStart.toISOString());

        const prevTotal = prevConsumption?.reduce((sum, c) => sum + (c.consumption_value || 0), 0) || 0;
        const trend = prevTotal > 0 ? ((totalConsumption - prevTotal) / prevTotal * 100) : 0;

        return {
          id: source.id,
          name: source.source_name,
          type: source.source_type,
          consumption: totalConsumption,
          unit: source.unit,
          emissions: totalEmissions,
          cost: totalCost,
          renewable: source.is_renewable,
          trend: Math.round(trend * 10) / 10,
          metadata: source.metadata
        };
      })
    );

    // Calculate totals
    const totalConsumption = sourcesWithData.reduce((sum, s) => {
      // Convert all to kWh for totaling
      if (s.unit === 'L') {
        return sum + (s.consumption * 10); // Rough conversion
      }
      return sum + s.consumption;
    }, 0);

    const totalEmissions = sourcesWithData.reduce((sum, s) => sum + s.emissions, 0);
    const totalCost = sourcesWithData.reduce((sum, s) => sum + s.cost, 0);

    const renewableConsumption = sourcesWithData
      .filter(s => s.renewable)
      .reduce((sum, s) => sum + s.consumption, 0);

    const renewablePercentage = totalConsumption > 0
      ? (renewableConsumption / totalConsumption * 100)
      : 0;

    return NextResponse.json({
      sources: sourcesWithData,
      total_consumption: totalConsumption,
      total_emissions: totalEmissions,
      total_cost: totalCost,
      renewable_percentage: Math.round(renewablePercentage * 10) / 10,
      period_start: periodStart.toISOString(),
      period_end: now.toISOString()
    });

  } catch (error) {
    console.error('Error fetching energy sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch energy sources' },
      { status: 500 }
    );
  }
}
