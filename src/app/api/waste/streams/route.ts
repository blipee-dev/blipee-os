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

    // Get waste metrics from metrics_catalog with new metadata
    // Exclude wastewater metrics (they have waste in the code but are in "Purchased Goods & Services")
    const { data: wasteMetrics, error: metricsError } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .eq('category', 'Waste');

    if (metricsError) {
      console.error('Error fetching waste metrics:', metricsError);
      return NextResponse.json(
        { error: 'Failed to fetch waste metrics', details: metricsError.message },
        { status: 500 }
      );
    }

    if (!wasteMetrics || wasteMetrics.length === 0) {
      return NextResponse.json({
        streams: [],
        total_generated: 0,
        total_diverted: 0,
        total_disposal: 0,
        total_recycling: 0,
        diversion_rate: 0,
        recycling_rate: 0,
        total_emissions: 0
      });
    }

    // Get waste data from metrics_data
    // NOTE: For YoY comparison, we need to fetch data for both current and previous year
    // So we expand the date range to include previous year data
    const metricIds = wasteMetrics.map(m => m.id);
    let query = supabaseAdmin
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds);

    // For YoY comparison, extend date range to include previous year
    if (startDate && endDate) {
      const startYear = new Date(startDate).getFullYear();
      const prevYearStart = `${startYear - 1}-01-01`;
      query = query.gte('period_start', prevYearStart);
      query = query.lte('period_start', endDate);
    } else if (startDate) {
      const startYear = new Date(startDate).getFullYear();
      const prevYearStart = `${startYear - 1}-01-01`;
      query = query.gte('period_start', prevYearStart);
    } else if (endDate) {
      query = query.lte('period_start', endDate);
    }

    // Apply site filter if provided
    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: wasteData, error: dataError } = await query.order('period_start', { ascending: false });

    if (dataError) {
      console.error('Error fetching waste data:', dataError);
      return NextResponse.json(
        { error: 'Failed to fetch waste data', details: dataError.message },
        { status: 500 }
      );
    }

    if (!wasteData || wasteData.length === 0) {
      return NextResponse.json({
        streams: [],
        total_generated: 0,
        total_diverted: 0,
        total_disposal: 0,
        total_recycling: 0,
        diversion_rate: 0,
        recycling_rate: 0,
        total_emissions: 0
      });
    }

    // Filter data for current period only (for totals)
    const currentPeriodData = (wasteData || []).filter((record: any) => {
      if (!startDate && !endDate) return true;
      const recordDate = new Date(record.period_start);
      if (startDate && recordDate < new Date(startDate)) return false;
      if (endDate && recordDate > new Date(endDate)) return false;
      return true;
    });

    // Group by waste material type and disposal method using new metadata
    const streamsByType = (currentPeriodData || []).reduce((acc: any, record: any) => {
      const metric = wasteMetrics.find(m => m.id === record.metric_id);
      if (!metric) return acc;

      const materialType = metric.waste_material_type || 'mixed';
      const disposalMethod = metric.disposal_method || 'other';
      const key = `${materialType}-${disposalMethod}`;

      if (!acc[key]) {
        acc[key] = {
          material_type: materialType,
          disposal_method: disposalMethod,
          quantity: 0,
          unit: 'tons',
          is_diverted: metric.is_diverted || false,
          is_recycling: metric.is_recycling || false,
          has_energy_recovery: metric.has_energy_recovery || false,
          emissions: 0,
          cost: 0,
          gri_classification: metric.is_diverted ? 'GRI 306-4: Diverted' : 'GRI 306-5: Disposal'
        };
      }

      // Add quantity - check if conversion needed
      const value = parseFloat(record.value) || 0;
      const recordUnit = record.unit || metric.unit || 'tons';

      // Convert to tons if needed
      const valueInTons = recordUnit === 'kg' ? value / 1000 : value;

      acc[key].quantity += valueInTons;

      // Add emissions (convert from kgCO2e to tCO2e)
      acc[key].emissions += (parseFloat(record.co2e_emissions) || 0) / 1000;

      // Add cost if available
      if (metric.cost_per_ton) {
        acc[key].cost += value * metric.cost_per_ton;
      }

      return acc;
    }, {});

    const streams = Object.values(streamsByType);

    // Calculate totals using new metadata flags
    const totalGenerated = streams.reduce((sum: number, s: any) => sum + s.quantity, 0);

    const totalDiverted = streams
      .filter((s: any) => s.is_diverted)
      .reduce((sum: number, s: any) => sum + s.quantity, 0);

    const totalRecycling = streams
      .filter((s: any) => s.is_recycling)
      .reduce((sum: number, s: any) => sum + s.quantity, 0);

    const totalDisposal = streams
      .filter((s: any) => !s.is_diverted)
      .reduce((sum: number, s: any) => sum + s.quantity, 0);

    const totalEmissions = streams.reduce((sum: number, s: any) => sum + s.emissions, 0);
    const totalCost = streams.reduce((sum: number, s: any) => sum + s.cost, 0);

    // Calculate rates
    const diversionRate = totalGenerated > 0
      ? (totalDiverted / totalGenerated * 100)
      : 0;

    const recyclingRate = totalGenerated > 0
      ? (totalRecycling / totalGenerated * 100)
      : 0;

    // Calculate monthly trends
    const monthlyData = (wasteData || []).reduce((acc: any, record: any) => {
      const metric = wasteMetrics.find(m => m.id === record.metric_id);
      if (!metric) return acc;

      const date = new Date(record.period_start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short' });

      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          monthKey,
          generated: 0,
          diverted: 0,
          recycled: 0,
          composted: 0,
          incinerated: 0,
          landfill: 0,
          emissions: 0,
          // Material breakdown
          paper: 0,
          plastic: 0,
          metal: 0,
          glass: 0,
          organic: 0,
          ewaste: 0
        };
      }

      const value = parseFloat(record.value) || 0;
      const recordUnit = record.unit || metric.unit || 'tons';
      const valueInTons = recordUnit === 'kg' ? value / 1000 : value;
      const emissions = (parseFloat(record.co2e_emissions) || 0) / 1000;

      acc[monthKey].generated += valueInTons;
      acc[monthKey].emissions += emissions;

      // Add to diverted/recycled based on flags
      if (metric.is_diverted) {
        acc[monthKey].diverted += valueInTons;
      }
      if (metric.is_recycling) {
        acc[monthKey].recycled += valueInTons;
      }

      // Add by disposal method
      const disposalMethod = metric.disposal_method || 'other';
      if (disposalMethod === 'composting') {
        acc[monthKey].composted += valueInTons;
      } else if (disposalMethod.includes('incineration')) {
        acc[monthKey].incinerated += valueInTons;
      } else if (disposalMethod === 'landfill') {
        acc[monthKey].landfill += valueInTons;
      }

      // Add by material type
      const materialType = metric.waste_material_type || 'mixed';
      if (acc[monthKey][materialType] !== undefined) {
        acc[monthKey][materialType] += valueInTons;
      }

      return acc;
    }, {});

    const monthlyTrends = Object.values(monthlyData)
      .sort((a: any, b: any) => a.monthKey.localeCompare(b.monthKey))
      .map((m: any) => ({
        ...m,
        generated: Math.round(m.generated * 100) / 100,
        diverted: Math.round(m.diverted * 100) / 100,
        recycled: Math.round(m.recycled * 100) / 100,
        composted: Math.round(m.composted * 100) / 100,
        incinerated: Math.round(m.incinerated * 100) / 100,
        landfill: Math.round(m.landfill * 100) / 100,
        emissions: Math.round(m.emissions * 100) / 100,
        diversion_rate: m.generated > 0 ? Math.round((m.diverted / m.generated * 100) * 10) / 10 : 0,
        recycling_rate: m.generated > 0 ? Math.round((m.recycled / m.generated * 100) * 10) / 10 : 0
      }));

    // Calculate YoY comparison
    const currentYear = new Date().getFullYear();

    const prevYearMonthlyData = monthlyTrends
      .filter((m: any) => m.monthKey.startsWith(String(currentYear - 1)))
      .reduce((acc: any, m: any) => {
        acc[m.month] = m.generated;
        return acc;
      }, {});

    const prevYearMonthlyTrends = monthlyTrends
      .filter((m: any) => m.monthKey.startsWith(String(currentYear)))
      .map((m: any) => {
        const prevYearValue = prevYearMonthlyData[m.month] || 0;
        const change = prevYearValue > 0 ? m.generated - prevYearValue : 0;
        return {
          month: m.month,
          monthKey: m.monthKey,
          change: Math.round(change * 100) / 100,
          current: m.generated,
          previous: prevYearValue
        };
      });

    // Material-specific breakdown for circular economy insights
    const materialBreakdown = streams.reduce((acc: any, stream: any) => {
      const material = stream.material_type;
      if (!acc[material]) {
        acc[material] = {
          material: material,
          total: 0,
          recycled: 0,
          diverted: 0,
          disposal: 0,
          recycling_rate: 0,
          diversion_rate: 0
        };
      }

      acc[material].total += stream.quantity;
      if (stream.is_recycling) {
        acc[material].recycled += stream.quantity;
      }
      if (stream.is_diverted) {
        acc[material].diverted += stream.quantity;
      } else {
        acc[material].disposal += stream.quantity;
      }

      return acc;
    }, {});

    // Calculate rates for each material
    Object.values(materialBreakdown).forEach((mat: any) => {
      mat.recycling_rate = mat.total > 0 ? Math.round((mat.recycled / mat.total * 100) * 10) / 10 : 0;
      mat.diversion_rate = mat.total > 0 ? Math.round((mat.diverted / mat.total * 100) * 10) / 10 : 0;
    });

    return NextResponse.json({
      streams,
      total_generated: Math.round(totalGenerated * 100) / 100,
      total_diverted: Math.round(totalDiverted * 100) / 100,
      total_recycling: Math.round(totalRecycling * 100) / 100,
      total_disposal: Math.round(totalDisposal * 100) / 100,
      total_landfill: Math.round(totalDisposal * 100) / 100, // For backwards compatibility
      diversion_rate: Math.round(diversionRate * 10) / 10,
      recycling_rate: Math.round(recyclingRate * 10) / 10,
      total_emissions: Math.round(totalEmissions * 100) / 100,
      total_cost: Math.round(totalCost * 100) / 100,
      monthly_trends: monthlyTrends,
      prev_year_monthly_trends: prevYearMonthlyTrends,
      material_breakdown: Object.values(materialBreakdown),
      // Compliance indicators
      gri_306_4_diverted: Math.round(totalDiverted * 100) / 100,
      gri_306_5_disposal: Math.round(totalDisposal * 100) / 100,
      esrs_e5_recycling: Math.round(totalRecycling * 100) / 100,
      circular_economy_score: Math.round(diversionRate * 10) / 10
    });

  } catch (error) {
    console.error('Error processing waste data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
