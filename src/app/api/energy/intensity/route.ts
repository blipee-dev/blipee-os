import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const orgInfo = await getUserOrganizationById(user.id);
    if (!orgInfo.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = orgInfo.organizationId;

    // Get filter parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const siteId = searchParams.get('site_id');

    // Get energy metrics from metrics_catalog
    const { data: energyMetrics } = await supabaseAdmin
      .from('metrics_catalog')
      .select('id')
      .in('category', ['Purchased Energy', 'Electricity']);

    if (!energyMetrics || energyMetrics.length === 0) {
      return NextResponse.json({
        perEmployee: { value: 0, unit: 'kWh/FTE', trend: 0 },
        perSquareMeter: { value: 0, unit: 'kWh/m²', trend: 0 },
        perRevenue: { value: 0, unit: 'MWh/$M', trend: 0 },
        perProduction: { value: 0, unit: 'kWh/unit', trend: 0 }
      });
    }

    const metricIds = energyMetrics.map(m => m.id);

    // Get total energy consumption (kWh) with filters
    let query = supabaseAdmin
      .from('metrics_data')
      .select('value')
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds);

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('period_start', startDate);
    }
    if (endDate) {
      query = query.lte('period_start', endDate);
    }

    // Apply site filter if provided
    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: energyData } = await query;

    const totalConsumptionKwh = (energyData || []).reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);

    // Get organization and sites data for intensity calculations
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('metadata')
      .eq('id', organizationId)
      .single();

    // Get sites data to aggregate employees and area
    let sitesQuery = supabaseAdmin
      .from('sites')
      .select('total_employees, total_area_sqm')
      .eq('organization_id', organizationId);

    // If filtering by specific site, only get that site's data
    if (siteId) {
      sitesQuery = sitesQuery.eq('id', siteId);
    }

    const { data: sites } = await sitesQuery;

    // Aggregate from sites
    const totalEmployees = (sites || []).reduce((sum, s) => sum + (s.total_employees || 0), 0);
    const totalAreaSqm = (sites || []).reduce((sum, s) => sum + (s.total_area_sqm || 0), 0);
    const annualRevenue = org?.metadata?.annual_revenue || 0;

    // Calculate intensity metrics
    const perEmployee = totalEmployees > 0
      ? totalConsumptionKwh / totalEmployees
      : 0;

    const perSquareMeter = totalAreaSqm > 0
      ? totalConsumptionKwh / totalAreaSqm
      : 0;

    const perRevenue = annualRevenue > 0
      ? (totalConsumptionKwh / 1000) / (annualRevenue / 1000000) // MWh per $M
      : 0;

    return NextResponse.json({
      perEmployee: {
        value: Math.round(perEmployee * 10) / 10,
        unit: 'kWh/FTE',
        trend: 0
      },
      perSquareMeter: {
        value: Math.round(perSquareMeter * 10) / 10,
        unit: 'kWh/m²',
        trend: 0
      },
      perRevenue: {
        value: Math.round(perRevenue * 10) / 10,
        unit: 'MWh/$M',
        trend: 0
      },
      perProduction: {
        value: 0,
        unit: 'kWh/unit',
        trend: 0
      }
    });

  } catch (error) {
    console.error('Error fetching energy intensity metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch energy intensity metrics' },
      { status: 500 }
    );
  }
}
