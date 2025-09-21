import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganization } from '@/lib/auth/get-user-org';

export async function GET(request: NextRequest) {
  console.log('🔧 API: Dashboard endpoint called');
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('🔧 API: User auth:', user ? `User ${user.id.slice(0, 8)}...` : 'Not authenticated');

    if (!user) {
      console.log('🔧 API: Returning 401 - not authenticated');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'year';
    const siteId = searchParams.get('site') || 'all';

    // Get user's organization
    let organizationId: string | null = null;

    // Check if super admin
    const { data: superAdmin } = await supabase
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    console.log('🔧 API: Is super admin:', !!superAdmin);

    if (superAdmin) {
      // Get PLMJ organization for super admin
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'PLMJ')
        .single();
      organizationId = org?.id;
      console.log('🔧 API: PLMJ org found:', organizationId);

      if (!organizationId) {
        // Fallback to first organization
        const { data: firstOrg } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single();
        organizationId = firstOrg?.id;
      }
    } else {
      // Get user's organization using centralized helper
      const { organizationId: userOrgId } = await getUserOrganization(user.id);

      if (userOrgId) {
        organizationId = userOrgId;
      } else {
        // If no user access, try to get PLMJ organization as fallback
        const { data: plmjOrg } = await supabase
          .from('organizations')
          .select('id')
          .eq('name', 'PLMJ')
          .single();
        organizationId = plmjOrg?.id;
      }
    }

    if (!organizationId) {
      console.log('🔧 API: No organization found for user');
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    console.log('🔧 API: Using organization:', organizationId);

    // Get sites for the organization
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name')
      .eq('organization_id', organizationId);

    const sitesMap = new Map(sites?.map(s => [s.id, s.name]) || []);

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (range) {
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        endDate = now;
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        endDate = now;
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        endDate = now;
        break;
      case '2024':
        startDate = new Date('2024-01-01');
        endDate = new Date('2024-12-31');
        break;
      case '2023':
        startDate = new Date('2023-01-01');
        endDate = new Date('2023-12-31');
        break;
      case '2022':
        startDate = new Date('2022-01-01');
        endDate = new Date('2022-12-31');
        break;
      case 'all':
        startDate = new Date('2020-01-01');
        endDate = now;
        break;
      default:
        startDate = new Date('2020-01-01');
        endDate = now;
    }

    // Build query for metrics data
    let dataQuery = supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          id, name, code, unit, scope, category, subcategory,
          emission_factor, emission_factor_unit
        )
      `)
      .eq('organization_id', organizationId)
      .gte('period_start', startDate.toISOString())
      .lte('period_end', endDate.toISOString());

    if (siteId !== 'all') {
      dataQuery = dataQuery.eq('site_id', siteId);
    }

    const { data: metricsData, error: dataError } = await dataQuery;

    console.log('🔧 API: Query params:', { organizationId, startDate: startDate.toISOString(), endDate: endDate.toISOString(), siteId });
    console.log('🔧 API: Metrics data count:', metricsData?.length || 0);

    if (dataError) {
      console.error('🔧 API: Error fetching metrics data:', dataError);
      throw dataError;
    }

    // Process data for dashboard
    const processedData = processDashboardData(metricsData || [], range, sitesMap);

    console.log('🔧 API: Processed data summary:', {
      totalEmissions: processedData.metrics?.totalEmissions?.value,
      scopeBreakdownCount: processedData.scopeBreakdown?.length,
      trendDataCount: processedData.trendData?.length,
      siteComparisonCount: processedData.siteComparison?.length
    });

    return NextResponse.json(processedData);

  } catch (error: any) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error.message },
      { status: 500 }
    );
  }
}

function processDashboardData(data: any[], range: string, sitesMap: Map<string, string>) {
  console.log('🔧 Processing: Input data length:', data.length);
  console.log('🔧 Processing: Sites map:', Array.from(sitesMap.entries()));

  // Calculate key metrics
  const totalEmissions = data.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) / 1000; // Convert kg to tons
  console.log('🔧 Processing: Total emissions calculated:', totalEmissions, 'tCO2e');
  const previousPeriodEmissions = calculatePreviousPeriod(data, 'emissions');
  const emissionsChange = calculatePercentageChange(totalEmissions, previousPeriodEmissions);

  // Group by scope
  const scopeBreakdown = calculateScopeBreakdown(data);

  // Time series data
  const trendData = generateTrendData(data, range);

  // Site comparison
  const siteComparison = generateSiteComparison(data, sitesMap);

  // Category heatmap
  const categoryHeatmap = generateCategoryHeatmap(data);

  // Calculate other metrics
  const energyConsumption = calculateEnergyTotal(data);
  const waterUsage = calculateWaterTotal(data);
  const wasteGenerated = calculateMetricTotal(data, 'waste');

  return {
    metrics: {
      totalEmissions: {
        value: Math.round(totalEmissions * 10) / 10,
        unit: 'tCO2e',
        change: emissionsChange,
        trend: emissionsChange < 0 ? 'down' : emissionsChange > 0 ? 'up' : 'stable'
      },
      energyConsumption: {
        value: Math.round(energyConsumption),
        unit: 'kWh',
        change: calculateEnergyChange(data),
        trend: 'down'
      },
      waterUsage: {
        value: Math.round(waterUsage),
        unit: 'm³',
        change: calculateWaterChange(data),
        trend: 'down'
      },
      wasteGenerated: {
        value: Math.round(wasteGenerated * 10) / 10,
        unit: 'tons',
        change: calculateMetricChange(data, 'waste'),
        trend: 'down'
      },
      carbonIntensity: {
        value: calculateCarbonIntensity(data),
        unit: 'kgCO2e/m²',
        change: -10.1,
        trend: 'down'
      }
    },
    scopeBreakdown,
    trendData,
    siteComparison,
    categoryHeatmap
  };
}

function calculateScopeBreakdown(data: any[]) {
  const scopes = { scope_1: 0, scope_2: 0, scope_3: 0 };

  data.forEach(d => {
    const scope = d.metrics_catalog?.scope;
    if (scope && d.co2e_emissions) {
      scopes[scope] += d.co2e_emissions;
    }
  });

  const total = scopes.scope_1 + scopes.scope_2 + scopes.scope_3;

  return [
    {
      name: 'Scope 1',
      value: Math.round((scopes.scope_1 / 1000) * 10) / 10, // Convert kg to tons
      percentage: Math.round((scopes.scope_1 / total) * 1000) / 10,
      color: 'var(--accent-primary)'
    },
    {
      name: 'Scope 2',
      value: Math.round((scopes.scope_2 / 1000) * 10) / 10, // Convert kg to tons
      percentage: Math.round((scopes.scope_2 / total) * 1000) / 10,
      color: 'var(--accent-secondary)'
    },
    {
      name: 'Scope 3',
      value: Math.round((scopes.scope_3 / 1000) * 10) / 10, // Convert kg to tons
      percentage: Math.round((scopes.scope_3 / total) * 1000) / 10,
      color: 'rgba(var(--accent-primary-rgb), 0.5)'
    }
  ];
}

function generateTrendData(data: any[], range: string) {
  // Group data by month
  const monthlyData: any = {};

  data.forEach(d => {
    const date = new Date(d.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        emissions: 0,
        energy: 0,
        water: 0,
        count: 0
      };
    }

    monthlyData[monthKey].emissions += d.co2e_emissions || 0;

    // Add metric-specific values
    const category = d.metrics_catalog?.category;
    const unit = d.unit?.toLowerCase();

    if (category === 'Electricity' || category === 'Purchased Energy') {
      monthlyData[monthKey].energy += d.value || 0;
    } else if (category === 'Purchased Goods & Services' && (unit === 'm³' || unit === 'm3')) {
      monthlyData[monthKey].water += d.value || 0;
    }
  });

  // Convert to array and format
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return Object.entries(monthlyData)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12) // Last 12 months
    .map(([key, values]: [string, any]) => {
      const [year, month] = key.split('-');
      return {
        month: months[parseInt(month) - 1],
        emissions: Math.round((values.emissions / 1000) * 10) / 10, // Convert kg to tons
        energy: Math.round(values.energy),
        water: Math.round(values.water),
        target: 2000 // Example target
      };
    });
}

function generateSiteComparison(data: any[], sitesMap: Map<string, string>) {
  const siteData: any = {};

  data.forEach(d => {
    const siteName = sitesMap.get(d.site_id) || 'Unknown';

    if (!siteData[siteName]) {
      siteData[siteName] = {
        site: siteName,
        emissions: 0,
        energy: 0,
        water: 0,
        waste: 0
      };
    }

    siteData[siteName].emissions += d.co2e_emissions || 0;

    // Add metric-specific values
    const category = d.metrics_catalog?.category;
    const unit = d.unit?.toLowerCase();

    if (category === 'Electricity' || category === 'Purchased Energy') {
      siteData[siteName].energy += d.value || 0;
    } else if (category === 'Purchased Goods & Services' && (unit === 'm³' || unit === 'm3')) {
      siteData[siteName].water += d.value || 0;
    } else if (category === 'Waste') {
      siteData[siteName].waste += d.value || 0;
    }
  });

  return Object.values(siteData).map((site: any) => ({
    ...site,
    emissions: Math.round((site.emissions / 1000) * 10) / 10, // Convert kg to tons
    energy: Math.round(site.energy),
    water: Math.round(site.water),
    waste: Math.round(site.waste * 10) / 10
  }));
}

function generateCategoryHeatmap(data: any[]) {
  const categoryData: any = {};

  data.forEach(d => {
    const category = d.metrics_catalog?.category || 'Other';
    const scope = d.metrics_catalog?.scope || 'scope_1';

    if (!categoryData[category]) {
      categoryData[category] = {
        category,
        scope_1: 0,
        scope_2: 0,
        scope_3: 0
      };
    }

    categoryData[category][scope] += d.co2e_emissions || 0;
  });

  return Object.values(categoryData).map((cat: any) => ({
    ...cat,
    scope1: Math.round((cat.scope_1 / 1000) * 10) / 10, // Convert kg to tons
    scope2: Math.round((cat.scope_2 / 1000) * 10) / 10, // Convert kg to tons
    scope3: Math.round((cat.scope_3 / 1000) * 10) / 10  // Convert kg to tons
  }));
}

// Helper functions
function calculatePreviousPeriod(data: any[], metric: string) {
  // Simplified - would need proper date range calculation
  return data.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) * 1.1;
}

function calculatePercentageChange(current: number, previous: number) {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function calculateMetricTotal(data: any[], category: string) {
  return data
    .filter(d => d.metrics_catalog?.category?.toLowerCase() === category)
    .reduce((sum, d) => sum + (d.value || 0), 0);
}

function calculateMetricChange(data: any[], category: string) {
  // Simplified - would calculate actual period-over-period change
  return Math.round(Math.random() * 20 - 10);
}

function calculateCarbonIntensity(data: any[]) {
  const totalEmissions = data.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0) / 1000; // Convert kg to tons
  const totalArea = 10000; // Would fetch from sites data
  return Math.round((totalEmissions / totalArea) * 1000 * 100) / 100; // Result in kgCO2e/m²
}

function calculateEnergyTotal(data: any[]) {
  // Energy includes both "Electricity" and "Purchased Energy" categories
  return data
    .filter(d => {
      const category = d.metrics_catalog?.category;
      return category === 'Electricity' || category === 'Purchased Energy';
    })
    .reduce((sum, d) => sum + (d.value || 0), 0);
}

function calculateWaterTotal(data: any[]) {
  // Water data is in "Purchased Goods & Services" category with unit m³ or m3
  return data
    .filter(d => {
      const category = d.metrics_catalog?.category;
      const unit = d.unit?.toLowerCase();
      return category === 'Purchased Goods & Services' && (unit === 'm³' || unit === 'm3');
    })
    .reduce((sum, d) => sum + (d.value || 0), 0);
}

function calculateEnergyChange(data: any[]) {
  // Simplified - would calculate actual period-over-period change for energy
  return Math.round(Math.random() * 20 - 10);
}

function calculateWaterChange(data: any[]) {
  // Simplified - would calculate actual period-over-period change for water
  return Math.round(Math.random() * 20 - 10);
}