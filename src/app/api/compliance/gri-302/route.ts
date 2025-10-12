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

    // Fetch energy metrics data
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
      .in('metrics_catalog.category', [
        'Electricity',
        'Purchased Energy',
        'Stationary Combustion',
        'Mobile Combustion'
      ]);

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: metricsData, error: metricsError } = await query;

    if (metricsError) {
      console.error('Error fetching energy metrics:', metricsError);
      return NextResponse.json({ error: metricsError.message }, { status: 500 });
    }

    // Fetch the metrics catalog to get is_renewable flag
    const metricIds = [...new Set(metricsData?.map((m: any) => m.metric_id) || [])];
    const { data: catalogMetrics } = await supabase
      .from('metrics_catalog')
      .select('id, name, code, category, unit, is_renewable, energy_type')
      .in('id', metricIds);

    const catalogMap = new Map(catalogMetrics?.map(m => [m.id, m]) || []);

    // Process energy data - keep in kWh for consistency with energy dashboard
    const energyBySource: Record<string, { value: number; unit: string; is_renewable: boolean }> = {};
    let totalConsumption = 0;
    let pureRenewableConsumption = 0;
    let totalRenewableFromGrid = 0;
    let totalNonRenewableFromGrid = 0;

    metricsData?.forEach((metric: any) => {
      const catalogMetric = catalogMap.get(metric.metric_id);
      const metricName = catalogMetric?.name || metric.metrics_catalog.name;
      const value = metric.value || 0;
      const unit = catalogMetric?.unit || metric.metrics_catalog.unit;
      const isRenewable = catalogMetric?.is_renewable || false;

      // Keep in kWh (don't convert to MWh)
      const valueInKWh = value;

      if (!energyBySource[metricName]) {
        energyBySource[metricName] = { value: 0, unit: 'kWh', is_renewable: isRenewable };
      }

      energyBySource[metricName].value += valueInKWh;
      totalConsumption += valueInKWh;

      // Track 100% renewable sources
      if (isRenewable) {
        pureRenewableConsumption += valueInKWh;
      }

      // Process grid mix data for accurate renewable calculation
      const gridMix = metric.metadata?.grid_mix;
      if (gridMix) {
        totalRenewableFromGrid += gridMix.renewable_kwh || 0;
        totalNonRenewableFromGrid += gridMix.non_renewable_kwh || 0;
      }
    });

    // Calculate accurate renewable percentage including grid mix
    // Total renewable = 100% renewable sources (solar, wind) + renewable portion of grid electricity
    const totalRenewableEnergy = pureRenewableConsumption + totalRenewableFromGrid;
    const renewablePercentage = totalConsumption > 0 ? (totalRenewableEnergy / totalConsumption) * 100 : 0;

    console.log('🌱 GRI 302 Renewable Calculation:');
    console.log('  Pure renewable (solar/wind):', pureRenewableConsumption, 'kWh');
    console.log('  Grid renewable:', totalRenewableFromGrid, 'kWh');
    console.log('  Total renewable:', totalRenewableEnergy, 'kWh');
    console.log('  Total consumption:', totalConsumption, 'kWh');
    console.log('  Renewable %:', renewablePercentage.toFixed(2), '%');

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

    // Calculate intensity metrics
    const totalConsumptionMWh = totalConsumption / 1000;

    // Intensity per revenue: MWh / €M (convert revenue to millions)
    const intensityRevenue = annualRevenue ? totalConsumptionMWh / (annualRevenue / 1000000) : 0;

    // Intensity per area: kWh / m² (keep in kWh for area as MWh/m² is too small)
    const intensityArea = totalArea ? totalConsumption / totalArea : 0;

    // Intensity per employee: MWh / FTE (use MWh for per-employee)
    const intensityFTE = totalEmployees ? totalConsumptionMWh / totalEmployees : 0;

    console.log('📊 GRI 302 Intensity Calculations:');
    console.log('  Total consumption:', totalConsumptionMWh, 'MWh', '(', totalConsumption, 'kWh)');
    console.log('  Annual revenue:', annualRevenue, '€');
    console.log('  Total area:', totalArea, 'm²');
    console.log('  Total employees:', totalEmployees);
    console.log('  Intensity per revenue:', intensityRevenue.toFixed(2), 'MWh/€M');
    console.log('  Intensity per area:', intensityArea.toFixed(2), 'kWh/m²');
    console.log('  Intensity per FTE:', intensityFTE.toFixed(2), 'MWh/FTE');

    // Fetch previous year data for reduction calculation
    const previousYear = year - 1;
    const { data: previousYearData } = await supabase
      .from('metrics_data')
      .select(`
        value,
        metrics_catalog!inner(category, unit)
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', `${previousYear}-01-01`)
      .lte('period_start', `${previousYear}-12-31`)
      .in('metrics_catalog.category', ['Electricity', 'Purchased Energy', 'Stationary Combustion', 'Mobile Combustion']);

    let previousYearConsumptionKWh = 0;
    previousYearData?.forEach((metric: any) => {
      const value = metric.value || 0;
      previousYearConsumptionKWh += value; // Keep in kWh
    });

    const previousYearConsumptionMWh = previousYearConsumptionKWh / 1000;
    const reductionFromPreviousYear = previousYearConsumptionMWh > 0
      ? Math.round((previousYearConsumptionMWh - totalConsumptionMWh) * 10) / 10
      : undefined;

    // Fetch base year settings
    const { data: baseYearSettings } = await supabase
      .from('ghg_inventory_settings')
      .select('base_year')
      .eq('organization_id', organizationId)
      .single();

    let baseYearConsumption = undefined;
    if (baseYearSettings?.base_year) {
      const { data: baseYearData } = await supabase
        .from('metrics_data')
        .select(`
          value,
          metrics_catalog!inner(category, unit)
        `)
        .eq('organization_id', organizationId)
        .gte('period_start', `${baseYearSettings.base_year}-01-01`)
        .lte('period_start', `${baseYearSettings.base_year}-12-31`)
        .in('metrics_catalog.category', ['Electricity', 'Purchased Energy', 'Stationary Combustion', 'Mobile Combustion']);

      let baseTotalKWh = 0;
      baseYearData?.forEach((metric: any) => {
        const value = metric.value || 0;
        baseTotalKWh += value; // Keep in kWh
      });
      const baseTotalMWh = baseTotalKWh / 1000;
      baseYearConsumption = baseTotalMWh > 0 ? Math.round(baseTotalMWh * 10) / 10 : undefined;
    }

    // Calculate actual renewable and non-renewable energy in MWh (1 decimal place)
    const totalRenewableEnergyMWh = Math.round((totalRenewableEnergy / 1000) * 10) / 10;
    const totalNonRenewableEnergyMWh = Math.round(((totalConsumption - totalRenewableEnergy) / 1000) * 10) / 10;

    // Format response - convert to MWh for display (1 decimal place for energy values)
    const response = {
      total_consumption: Math.round(totalConsumptionMWh * 10) / 10,
      renewable_energy: totalRenewableEnergyMWh, // NEW: Actual renewable energy including grid mix
      non_renewable_energy: totalNonRenewableEnergyMWh, // NEW: Actual non-renewable energy
      renewable_percentage: Math.round(renewablePercentage * 10) / 10,
      non_renewable_percentage: Math.round((100 - renewablePercentage) * 10) / 10,
      by_source: Object.entries(energyBySource).map(([source, data]) => ({
        source,
        value: Math.round((data.value / 1000) * 10) / 10, // Convert kWh to MWh, 1 decimal
        unit: 'MWh',
        is_renewable: data.is_renewable
      })),
      intensity_revenue: Math.round(intensityRevenue * 100) / 100,
      intensity_area: Math.round(intensityArea * 100) / 100,
      intensity_fte: Math.round(intensityFTE * 100) / 100,
      reduction_from_previous_year: reductionFromPreviousYear,
      base_year: baseYearSettings?.base_year,
      base_year_consumption: baseYearConsumption
    };

    console.log('✅ GRI 302 Final Response:');
    console.log('  Total consumption:', response.total_consumption, 'MWh');
    console.log('  Renewable energy:', response.renewable_energy, 'MWh');
    console.log('  Non-renewable energy:', response.non_renewable_energy, 'MWh');
    console.log('  Renewable %:', response.renewable_percentage, '%');
    console.log('  Intensity per revenue:', response.intensity_revenue, 'MWh/€M');
    console.log('  Intensity per area:', response.intensity_area, 'kWh/m²');
    console.log('  Intensity per FTE:', response.intensity_fte, 'MWh/FTE');

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in GRI 302 API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
