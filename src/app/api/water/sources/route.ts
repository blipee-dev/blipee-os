import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';

export const dynamic = 'force-dynamic';

async function calculateEndUseYoY(
  organizationId: string,
  siteId: string | null,
  startDate: string | null,
  endDate: string | null,
  waterMetrics: any[]
) {
  // Determine current and previous year ranges
  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  const endUseCodes = [
    'scope3_water_toilet',
    'scope3_water_kitchen',
    'scope3_water_cleaning',
    'scope3_water_irrigation',
    'scope3_water_other'
  ];

  const metricIds = waterMetrics
    .filter(m => endUseCodes.includes(m.code))
    .map(m => m.id);

  // Get current year data
  let currentQuery = supabaseAdmin
    .from('metrics_data')
    .select('value, metric_id, period_start')
    .eq('organization_id', organizationId)
    .in('metric_id', metricIds)
    .gte('period_start', `${currentYear}-01-01`)
    .lt('period_start', `${currentYear + 1}-01-01`);

  if (siteId) {
    currentQuery = currentQuery.eq('site_id', siteId);
  }

  const { data: currentData } = await currentQuery;

  // Get previous year data
  let prevQuery = supabaseAdmin
    .from('metrics_data')
    .select('value, metric_id, period_start')
    .eq('organization_id', organizationId)
    .in('metric_id', metricIds)
    .gte('period_start', `${prevYear}-01-01`)
    .lt('period_start', `${prevYear + 1}-01-01`);

  if (siteId) {
    prevQuery = prevQuery.eq('site_id', siteId);
  }

  const { data: prevData } = await prevQuery;

  // Aggregate by end-use type
  const currentByType: any = {};
  const prevByType: any = {};

  currentData?.forEach((r: any) => {
    const metric = waterMetrics.find(m => m.id === r.metric_id);
    if (metric) {
      if (!currentByType[metric.code]) {
        currentByType[metric.code] = { value: 0, name: metric.name, consumptionRate: metric.consumption_rate || 0 };
      }
      currentByType[metric.code].value += parseFloat(r.value);
    }
  });

  prevData?.forEach((r: any) => {
    const metric = waterMetrics.find(m => m.id === r.metric_id);
    if (metric) {
      if (!prevByType[metric.code]) {
        prevByType[metric.code] = { value: 0 };
      }
      prevByType[metric.code].value += parseFloat(r.value);
    }
  });

  // Calculate YoY changes
  return endUseCodes.map(code => {
    const current = currentByType[code] || { value: 0, name: '', consumptionRate: 0 };
    const previous = prevByType[code] || { value: 0 };

    const currentConsumption = current.value * current.consumptionRate;
    const prevConsumption = previous.value * current.consumptionRate;

    const change = currentConsumption - prevConsumption;
    const changePercent = prevConsumption > 0
      ? ((change / prevConsumption) * 100)
      : 0;

    return {
      code,
      name: current.name,
      current_consumption: Math.round(currentConsumption * 100) / 100,
      previous_consumption: Math.round(prevConsumption * 100) / 100,
      change: Math.round(change * 100) / 100,
      change_percent: Math.round(changePercent * 10) / 10
    };
  }).filter(item => item.name); // Only return items with data
}

export async function GET(request: NextRequest) {
  console.log('💧 [WATER-SOURCES] API called');

  try {
    const user = await getAPIUser(request);
    console.log('💧 [WATER-SOURCES] User auth:', user ? `✅ ${user.id}` : '❌ No user');

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const orgInfo = await getUserOrganizationById(user.id);
    console.log('💧 [WATER-SOURCES] Org info:', orgInfo.organizationId || '❌ No org');

    if (!orgInfo.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const organizationId = orgInfo.organizationId;

    // Get filter parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const siteId = searchParams.get('site_id');

    console.log('💧 [WATER-SOURCES] Filters:', {
      organizationId,
      startDate,
      endDate,
      siteId: siteId || 'all sites'
    });

    // Get water metrics from metrics_catalog - OPTIMIZED: only fetch needed fields
    // Water metrics are in "Purchased Goods & Services" category with "Water" subcategory
    // Also include wastewater treatment from Process Emissions
    const { data: waterMetrics, error: metricsError } = await supabaseAdmin
      .from('metrics_catalog')
      .select('id, code, name, unit, consumption_rate')
      .or('subcategory.eq.Water,code.ilike.%water%');

    console.log('💧 [WATER-SOURCES] Metrics catalog:', waterMetrics ? `✅ ${waterMetrics.length} metrics` : '❌ No metrics');

    if (metricsError) {
      console.error('❌ [WATER-SOURCES] Metrics error:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch water metrics', details: metricsError.message },
        { status: 500 }
      );
    }

    if (!waterMetrics || waterMetrics.length === 0) {
      console.log('💧 [WATER-SOURCES] No water metrics in catalog');
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
    // Supabase has a default 1000 row limit, so we need to fetch all data with pagination
    const metricIds = waterMetrics.map(m => m.id);

    let allWaterData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabaseAdmin
        .from('metrics_data')
        .select('metric_id, value, period_start, unit')
        .eq('organization_id', organizationId)
        .in('metric_id', metricIds)
        .range(from, from + pageSize - 1);

      // Apply date filters if provided
      if (startDate) {
        query = query.gte('period_start', startDate);
      }
      if (endDate) {
        // Filter out future months - only include data through current month
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const maxHistoricalDate = new Date(currentYear, currentMonth, 0); // Last day of current month
        const requestedEndDate = new Date(endDate);

        // Use the earlier of: requested end date OR current month end
        const effectiveEndDate = requestedEndDate <= maxHistoricalDate ? endDate : maxHistoricalDate.toISOString().split('T')[0];

        query = query.lte('period_start', effectiveEndDate);
      }

      // Apply site filter if provided
      if (siteId) {
        query = query.eq('site_id', siteId);
      }

      const { data: pageData, error: pageError } = await query.order('period_start', { ascending: false });

      if (pageError) {
        console.error('Error fetching water data:', pageError);
        return NextResponse.json(
          { error: 'Failed to fetch water data', details: pageError.message },
          { status: 500 }
        );
      }

      if (!pageData || pageData.length === 0) {
        hasMore = false;
      } else {
        allWaterData = [...allWaterData, ...pageData];
        from += pageSize;

        // If we got less than a full page, we're done
        if (pageData.length < pageSize) {
          hasMore = false;
        }
      }
    }

    const waterData = allWaterData;
    const dataError = null;

    console.log('💧 [WATER-SOURCES] Metrics data:', waterData ? `✅ ${waterData.length} records` : '❌ No data');
    if (waterData && waterData.length > 0) {
      console.log('💧 [WATER-SOURCES] Sample record:', {
        metric_id: waterData[0].metric_id,
        value: waterData[0].value,
        period: waterData[0].period_start
      });
    }

    if (dataError) {
      console.error('❌ [WATER-SOURCES] Data error:', dataError);
      return NextResponse.json(
        { error: 'Failed to fetch water data', details: dataError.message },
        { status: 500 }
      );
    }

    if (!waterData || waterData.length === 0) {
      console.log('💧 [WATER-SOURCES] Returning empty result');
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
        'scope3_water_recycled_toilet': { name: 'Recycled Water - Toilet Flush', type: 'recycled' },
        // End-use breakdown (GRI 303-3 detailed)
        'scope3_water_toilet': { name: 'Toilets & Sanitary', type: 'toilet' },
        'scope3_water_kitchen': { name: 'Kitchen & Cafeteria', type: 'kitchen' },
        'scope3_water_cleaning': { name: 'Cleaning & Maintenance', type: 'cleaning' },
        'scope3_water_irrigation': { name: 'Landscaping & Irrigation', type: 'irrigation' },
        'scope3_water_other': { name: 'Other Uses', type: 'other_use' },
        'scope3_wastewater_toilet': { name: 'Toilet Wastewater', type: 'wastewater' },
        'scope3_wastewater_kitchen': { name: 'Kitchen Wastewater', type: 'wastewater' },
        'scope3_wastewater_cleaning': { name: 'Cleaning Wastewater', type: 'wastewater' },
        'scope3_wastewater_other': { name: 'Other Wastewater', type: 'wastewater' },
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

      // Cost tracking removed - cost column does not exist in metrics_data
      // Future: Add cost tracking when column is added to schema
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

    // Calculate monthly trends for charts
    const monthlyData = (waterData || []).reduce((acc: any, record: any) => {
      const metric = waterMetrics.find(m => m.id === record.metric_id);
      const date = new Date(record.period_start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short' });
      const metricCode = metric?.code || '';
      const isDischarge = metricCode.includes('wastewater');

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          monthKey,
          withdrawal: 0,
          discharge: 0,
          consumption: 0,
          recycled: 0
        };
      }

      const value = parseFloat(record.value) || 0;

      if (isDischarge) {
        acc[monthKey].discharge += value;
      } else {
        acc[monthKey].withdrawal += value;
        if (metricCode.includes('recycled')) {
          acc[monthKey].recycled += value;
        }
      }

      return acc;
    }, {});

    const monthlyTrends = Object.values(monthlyData)
      .sort((a: any, b: any) => a.monthKey.localeCompare(b.monthKey))
      .map((m: any) => ({
        ...m,
        consumption: m.withdrawal - m.discharge,
        withdrawal: Math.round(m.withdrawal * 100) / 100,
        discharge: Math.round(m.discharge * 100) / 100,
        recycled: Math.round(m.recycled * 100) / 100
      }));

    // Calculate YoY comparison (current year vs previous year)
    const currentYear = new Date().getFullYear();
    const prevYearMonthlyData = monthlyTrends
      .filter((m: any) => m.monthKey.startsWith(String(currentYear - 1)))
      .reduce((acc: any, m: any) => {
        acc[m.month] = m.withdrawal;
        return acc;
      }, {});

    const prevYearMonthlyTrends = monthlyTrends
      .filter((m: any) => m.monthKey.startsWith(String(currentYear)))
      .map((m: any) => {
        const prevYearValue = prevYearMonthlyData[m.month] || 0;
        const change = prevYearValue > 0 ? m.withdrawal - prevYearValue : 0;
        return {
          month: m.month,
          monthKey: m.monthKey,
          change: Math.round(change * 100) / 100,
          current: m.withdrawal,
          previous: prevYearValue
        };
      });

    // Calculate water intensity per employee (m³ per employee)
    // Get total employees from sites
    let totalEmployees = 0;
    if (siteId) {
      // Single site selected
      const { data: siteData } = await supabaseAdmin
        .from('sites')
        .select('total_employees')
        .eq('id', siteId)
        .single();
      totalEmployees = siteData?.total_employees || 0;
    } else {
      // All sites in organization
      const { data: sitesData } = await supabaseAdmin
        .from('sites')
        .select('total_employees')
        .eq('organization_id', organizationId);
      totalEmployees = sitesData?.reduce((sum, site) => sum + (site.total_employees || 0), 0) || 0;
    }

    // Water intensity = consumption per employee (m³/employee)
    const waterIntensity = totalEmployees > 0 ? totalConsumption / totalEmployees : 0;

    // Calculate end-use breakdown for consumption visualization
    const endUseBreakdown = sources
      .filter((s: any) => ['toilet', 'kitchen', 'cleaning', 'irrigation', 'other_use'].includes(s.type))
      .map((s: any) => {
        // Get consumption rate from metrics_catalog
        const metric = waterMetrics.find(m => {
          const typeMap: any = {
            'toilet': 'scope3_water_toilet',
            'kitchen': 'scope3_water_kitchen',
            'cleaning': 'scope3_water_cleaning',
            'irrigation': 'scope3_water_irrigation',
            'other_use': 'scope3_water_other'
          };
          return m.code === typeMap[s.type];
        });

        const consumptionRate = metric?.consumption_rate || 0;
        const consumption = s.withdrawal * consumptionRate;
        const discharge = s.withdrawal * (1 - consumptionRate);

        return {
          name: s.name,
          type: s.type,
          withdrawal: Math.round(s.withdrawal * 100) / 100,
          consumption: Math.round(consumption * 100) / 100,
          discharge: Math.round(discharge * 100) / 100,
          consumption_rate: Math.round(consumptionRate * 100)
        };
      });

    // Calculate YoY comparison for end-use breakdown
    const endUseYoY = await calculateEndUseYoY(organizationId, siteId, startDate, endDate, waterMetrics);

    return NextResponse.json({
      sources,
      total_withdrawal: Math.round(totalWithdrawal * 100) / 100,
      total_consumption: Math.round(totalConsumption * 100) / 100,
      total_discharge: Math.round(totalDischarge * 100) / 100,
      total_recycled: Math.round(totalRecycled * 100) / 100,
      total_cost: Math.round(totalCost * 100) / 100,
      recycling_rate: Math.round(recyclingRate * 10) / 10,
      monthly_trends: monthlyTrends,
      prev_year_monthly_trends: prevYearMonthlyTrends,
      water_intensity: Math.round(waterIntensity * 100) / 100,
      end_use_breakdown: endUseBreakdown,
      end_use_yoy: endUseYoY
    });

  } catch (error) {
    console.error('Error fetching water sources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch water sources' },
      { status: 500 }
    );
  }
}
