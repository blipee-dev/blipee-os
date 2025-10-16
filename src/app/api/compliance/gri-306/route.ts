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

    // Fetch waste metrics data
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
      .eq('metrics_catalog.category', 'Waste');

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: metricsData, error: metricsError } = await query;

    if (metricsError) {
      console.error('Error fetching waste metrics:', metricsError);
      return NextResponse.json({ error: metricsError.message }, { status: 500 });
    }

    // Classification of waste methods
    const diversionMethods = [
      'recycling',
      'reuse',
      'compost',
      'recovery',
      'energy recovery'
    ];

    const disposalMethods = [
      'landfill',
      'incineration',
      'deep well',
      'on-site storage'
    ];

    // Process waste data
    let totalWaste = 0;
    let wasteDiverted = 0;
    let wasteDisposed = 0;
    let hazardousWaste = 0;
    let nonHazardousWaste = 0;
    const byDisposalMethod: Record<string, { value: number; is_diverted: boolean; is_hazardous: boolean }> = {};

    metricsData?.forEach((metric: any) => {
      const metricName = metric.metrics_catalog.name.toLowerCase();
      const value = metric.value || 0;

      totalWaste += value;

      // Determine if diverted or disposed
      const isDiverted = diversionMethods.some(method => metricName.includes(method));
      const isDisposed = disposalMethods.some(method => metricName.includes(method));
      const isHazardous = metricName.includes('hazardous');

      if (isDiverted) {
        wasteDiverted += value;
      } else if (isDisposed) {
        wasteDisposed += value;
      } else {
        // Default: if not clearly diverted, count as disposed
        wasteDisposed += value;
      }

      if (isHazardous) {
        hazardousWaste += value;
      } else {
        nonHazardousWaste += value;
      }

      // Group by method
      const methodName = metric.metrics_catalog.name;
      if (!byDisposalMethod[methodName]) {
        byDisposalMethod[methodName] = { value: 0, is_diverted: isDiverted, is_hazardous: isHazardous };
      }
      byDisposalMethod[methodName].value += value;
    });

    // Calculate diversion rate
    const diversionRate = totalWaste > 0 ? (wasteDiverted / totalWaste) * 100 : 0;

    // Fetch organization details for intensity calculations
    const { data: orgData } = await supabase
      .from('organizations')
      .select('annual_revenue, total_area, employee_count')
      .eq('id', organizationId)
      .single();

    // If organization-level data is missing, aggregate from sites
    let totalArea = orgData?.total_area || 0;
    let totalEmployees = orgData?.employee_count || 0;
    let annualRevenue = orgData?.annual_revenue || 0;

    if (!totalArea || !totalEmployees) {
      const { data: sitesData } = await supabase
        .from('sites')
        .select('total_area_sqm, total_employees')
        .eq('organization_id', organizationId);

      if (sitesData && sitesData.length > 0) {
        totalArea = sitesData.reduce((sum, site) => sum + (site.total_area_sqm || 0), 0);
        totalEmployees = sitesData.reduce((sum, site) => sum + (site.total_employees || 0), 0);
      }
    }

    // Calculate intensity metrics (in tonnes per unit)
    const intensityRevenue = annualRevenue ? totalWaste / (annualRevenue / 1000000) : 0;
    const intensityArea = totalArea ? totalWaste / totalArea : 0;
    const intensityFTE = totalEmployees ? totalWaste / totalEmployees : 0;


    // Format response
    const response = {
      total_waste: Math.round(totalWaste * 100) / 100,
      waste_diverted: Math.round(wasteDiverted * 100) / 100,
      waste_disposed: Math.round(wasteDisposed * 100) / 100,
      diversion_rate: Math.round(diversionRate * 10) / 10,
      by_disposal_method: Object.entries(byDisposalMethod).map(([method, data]) => ({
        method,
        value: Math.round(data.value * 100) / 100,
        unit: 't',
        is_diverted: data.is_diverted
      })),
      hazardous_waste: Math.round(hazardousWaste * 100) / 100,
      non_hazardous_waste: Math.round(nonHazardousWaste * 100) / 100,
      intensity_revenue: Math.round(intensityRevenue * 1000) / 1000, // 3 decimal places
      intensity_area: Math.round(intensityArea * 1000) / 1000, // 3 decimal places
      intensity_fte: Math.round(intensityFTE * 1000) / 1000 // 3 decimal places
    };


    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GRI 306 API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
