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

    // Get water metrics from metrics_catalog
    // Water metrics are in "Purchased Goods & Services" category with "Water" subcategory
    // Also include wastewater treatment from Process Emissions
    const { data: waterMetrics, error: metricsError } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .or('subcategory.eq.Water,code.ilike.%water%');

    if (metricsError) {
      console.error('Error fetching water metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch water metrics', details: metricsError.message },
        { status: 500 }
      );
    }

    if (!waterMetrics || waterMetrics.length === 0) {
      return NextResponse.json({
        sources: [],
        total_withdrawal: 0,
        total_consumption: 0,
        total_discharge: 0,
        total_recycled: 0,
        total_cost: 0,
        recycling_rate: 0
      });
    }

    // Get water data from metrics_data
    const metricIds = waterMetrics.map(m => m.id);
    let query = supabaseAdmin
      .from('metrics_data')
      .select('*')
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

    const { data: waterData, error: dataError } = await query.order('period_start', { ascending: false });

    if (dataError) {
      console.error('Error fetching water data:', dataError);
      return NextResponse.json(
        { error: 'Failed to fetch water data', details: dataError.message },
        { status: 500 }
      );
    }

    if (!waterData || waterData.length === 0) {
      return NextResponse.json({
        sources: [],
        total_withdrawal: 0,
        total_consumption: 0,
        total_discharge: 0,
        total_recycled: 0,
        total_cost: 0,
        recycling_rate: 0
      });
    }

    // Separate withdrawal and discharge data for GRI 303 reporting
    let totalWithdrawal = 0;
    let totalDischarge = 0;
    const sourcesByType: any = {};

    (waterData || []).forEach((record: any) => {
      const metric = waterMetrics.find(m => m.id === record.metric_id);
      const metricCode = metric?.code || '';
      const value = parseFloat(record.value) || 0;

      // Determine if this is withdrawal or discharge
      const isDischarge = metricCode.includes('wastewater');
      const isRecycled = metricCode.includes('recycled');

      // Map metric codes to display names and source types
      const typeMapping: { [key: string]: { name: string, type: string } } = {
        'scope3_water_supply': { name: 'Water Supply (Municipal)', type: 'municipal' },
        'scope3_wastewater': { name: 'Wastewater Discharge', type: 'wastewater' },
        'scope1_wastewater_treatment': { name: 'On-site Wastewater Treatment', type: 'wastewater_treatment' },
        'scope3_water_municipal': { name: 'Municipal Water', type: 'municipal' },
        'scope3_water_groundwater': { name: 'Groundwater', type: 'groundwater' },
        'scope3_water_surface': { name: 'Surface Water', type: 'surface_water' },
        'scope3_water_seawater': { name: 'Seawater', type: 'seawater' },
        'scope3_water_rainwater': { name: 'Rainwater', type: 'rainwater' },
        'scope3_water_recycled': { name: 'Recycled Water', type: 'recycled' },
      };

      const sourceInfo = typeMapping[metricCode] || { name: metric?.name || 'Other', type: 'other' };

      if (!sourcesByType[sourceInfo.type]) {
        sourcesByType[sourceInfo.type] = {
          name: sourceInfo.name,
          type: sourceInfo.type,
          withdrawal: 0,
          discharge: 0,
          unit: metric?.unit || 'm³',
          cost: 0,
          isRecycled: isRecycled
        };
      }

      // Add to appropriate category
      if (isDischarge) {
        sourcesByType[sourceInfo.type].discharge += value;
        totalDischarge += value;
      } else {
        sourcesByType[sourceInfo.type].withdrawal += value;
        totalWithdrawal += value;
      }

      // Add cost if available
      sourcesByType[sourceInfo.type].cost += parseFloat(record.cost) || 0;
    });

    const sources = Object.values(sourcesByType);

    // Calculate GRI 303-5: Water Consumption = Withdrawal - Discharge
    const totalConsumption = totalWithdrawal - totalDischarge;

    // Calculate recycled/reused water
    const totalRecycled = sources
      .filter((s: any) => s.isRecycled)
      .reduce((sum: number, s: any) => sum + s.withdrawal, 0);

    const totalCost = sources.reduce((sum: number, s: any) => sum + s.cost, 0);

    const recyclingRate = totalConsumption > 0
      ? (totalRecycled / totalConsumption * 100)
      : 0;

    return NextResponse.json({
      sources,
      total_withdrawal: Math.round(totalWithdrawal * 100) / 100,
      total_consumption: Math.round(totalConsumption * 100) / 100,
      total_discharge: Math.round(totalDischarge * 100) / 100,
      total_recycled: Math.round(totalRecycled * 100) / 100,
      total_cost: Math.round(totalCost * 100) / 100,
      recycling_rate: Math.round(recyclingRate * 10) / 10
    });

  } catch (error) {
    console.error('Error fetching water sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch water sources' },
      { status: 500 }
    );
  }
}
