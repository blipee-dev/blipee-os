import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const organizationId = searchParams.get('organizationId');
    const siteId = searchParams.get('siteId');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 });
    }

    // Date range for the selected year
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    // Fetch water metrics data
    // Water metrics are in various categories with water-related codes or subcategory
    // Get water metric IDs from metrics_catalog first
    const { data: waterMetrics } = await supabase
      .from('metrics_catalog')
      .select('id')
      .or('subcategory.eq.Water,code.ilike.%water%');

    if (!waterMetrics || waterMetrics.length === 0) {
      return NextResponse.json({
        total_withdrawal: 0,
        total_discharge: 0,
        total_consumption: 0,
        withdrawal_by_source: [],
        discharge_by_destination: [],
        consumption_by_use: [],
        stress_areas_percentage: 0,
        intensity_revenue: 0,
        intensity_area: 0,
        intensity_fte: 0
      });
    }

    const waterMetricIds = waterMetrics.map(m => m.id);

    let query = supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog!inner(
          name,
          category,
          unit,
          code
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', startDate)
      .lte('period_start', endDate)
      .in('metric_id', waterMetricIds);

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: metricsData, error: metricsError } = await query;

    if (metricsError) {
      console.error('Error fetching water metrics:', metricsError);
      return NextResponse.json({ error: metricsError.message }, { status: 500 });
    }

    // Process water data based on metric codes (following water dashboard pattern)
    let totalWithdrawal = 0;
    let totalDischarge = 0;
    const withdrawalBySource: Record<string, number> = {};
    const dischargeByDestination: Record<string, number> = {};
    const consumptionByUse: Record<string, number> = {};

    metricsData?.forEach((metric: any) => {
      const metricCode = metric.metrics_catalog.code || '';
      const value = metric.value || 0;
      const metricName = metric.metrics_catalog.name;

      // Determine if this is withdrawal or discharge based on code
      const isDischarge = metricCode.includes('wastewater');

      if (isDischarge) {
        totalDischarge += value;
        dischargeByDestination[metricName] = (dischargeByDestination[metricName] || 0) + value;
      } else {
        totalWithdrawal += value;
        withdrawalBySource[metricName] = (withdrawalBySource[metricName] || 0) + value;
      }

      // Track consumption by use type (end-use categories)
      if (metricCode.includes('toilet') || metricCode.includes('kitchen') ||
          metricCode.includes('cleaning') || metricCode.includes('irrigation') ||
          metricCode.includes('other')) {
        consumptionByUse[metricName] = (consumptionByUse[metricName] || 0) + value;
      }
    });

    // GRI 303-5: Calculate consumption as withdrawal minus discharge
    const totalConsumption = totalWithdrawal - totalDischarge;

    // Fetch organization details for revenue (for intensity calculations)
    const { data: orgData } = await supabase
      .from('organizations')
      .select('annual_revenue')
      .eq('id', organizationId)
      .single();

    // Fetch site data for area and employee count
    let sitesQuery = supabase
      .from('sites')
      .select('total_area_sqm, total_employees')
      .eq('organization_id', organizationId);

    if (siteId) {
      sitesQuery = sitesQuery.eq('id', siteId);
    }

    const { data: sites } = await sitesQuery;

    const totalArea = sites?.reduce((sum, s) => sum + (s.total_area_sqm || 0), 0) || 0;
    const totalEmployees = sites?.reduce((sum, s) => sum + (s.total_employees || 0), 0) || 0;

    // Calculate intensity metrics (consumption in m³, convert to ML by dividing by 1000)
    const consumptionML = totalConsumption / 1000;
    const intensityRevenue = orgData?.annual_revenue ? consumptionML / (orgData.annual_revenue / 1000000) : 0;
    const intensityArea = totalArea > 0 ? consumptionML / totalArea : 0;
    const intensityFTE = totalEmployees > 0 ? consumptionML / totalEmployees : 0;

    // Format response
    const response = {
      total_withdrawal: Math.round(totalWithdrawal * 100) / 100,
      total_discharge: Math.round(totalDischarge * 100) / 100,
      total_consumption: Math.round(totalConsumption * 100) / 100,
      withdrawal_by_source: Object.entries(withdrawalBySource).map(([source, value]) => ({
        source,
        value: Math.round(value * 100) / 100,
        unit: 'ML'
      })),
      discharge_by_destination: Object.entries(dischargeByDestination).map(([destination, value]) => ({
        destination,
        value: Math.round(value * 100) / 100,
        unit: 'ML'
      })),
      consumption_by_use: Object.entries(consumptionByUse).map(([use, value]) => ({
        use,
        value: Math.round(value * 100) / 100,
        unit: 'ML'
      })),
      stress_areas_percentage: 0, // TODO: Implement water stress area calculation based on site locations
      intensity_revenue: intensityRevenue,
      intensity_area: intensityArea,
      intensity_fte: intensityFTE
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GRI 303 API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
