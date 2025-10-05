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

    // Get current period (default to current month)
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);

    // Fetch intensity metrics for the current period
    const { data: metrics, error: metricsError } = await supabase
      .from('energy_intensity_metrics')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('period_start', `${currentMonth}-01`)
      .order('created_at', { ascending: false });

    if (metricsError) {
      throw metricsError;
    }

    // If no data, return empty metrics
    if (!metrics || metrics.length === 0) {
      return NextResponse.json({
        perEmployee: { value: 0, unit: 'kWh/FTE', trend: 0 },
        perSquareMeter: { value: 0, unit: 'kWh/m²', trend: 0 },
        perRevenue: { value: 0, unit: 'MWh/$M', trend: 0 },
        perProduction: { value: 0, unit: 'kWh/unit', trend: 0 }
      });
    }

    // Group metrics by type
    const metricsByType = metrics.reduce((acc, metric) => {
      if (!acc[metric.metric_type]) {
        acc[metric.metric_type] = metric;
      }
      return acc;
    }, {} as Record<string, any>);

    // Format response
    const response = {
      perEmployee: metricsByType.per_employee ? {
        value: parseFloat(metricsByType.per_employee.value),
        unit: metricsByType.per_employee.unit,
        trend: parseFloat(metricsByType.per_employee.trend_percentage || 0)
      } : { value: 0, unit: 'kWh/FTE', trend: 0 },

      perSquareMeter: metricsByType.per_sqm ? {
        value: parseFloat(metricsByType.per_sqm.value),
        unit: metricsByType.per_sqm.unit,
        trend: parseFloat(metricsByType.per_sqm.trend_percentage || 0)
      } : { value: 0, unit: 'kWh/m²', trend: 0 },

      perRevenue: metricsByType.per_revenue ? {
        value: parseFloat(metricsByType.per_revenue.value),
        unit: metricsByType.per_revenue.unit,
        trend: parseFloat(metricsByType.per_revenue.trend_percentage || 0)
      } : { value: 0, unit: 'MWh/$M', trend: 0 },

      perProduction: metricsByType.per_production ? {
        value: parseFloat(metricsByType.per_production.value),
        unit: metricsByType.per_production.unit,
        trend: parseFloat(metricsByType.per_production.trend_percentage || 0)
      } : { value: 0, unit: 'kWh/unit', trend: 0 }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching energy intensity metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch energy intensity metrics' },
      { status: 500 }
    );
  }
}
