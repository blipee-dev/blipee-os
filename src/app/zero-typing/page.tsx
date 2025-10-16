import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import { PermissionService } from '@/lib/auth/permission-service';
import ZeroTypingClient from './ZeroTypingClient';

export default async function ZeroTypingPage() {
  const supabase = await createServerSupabaseClient();
  const supabaseAdmin = createAdminClient();

  // Check authentication
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/signin?redirect=/zero-typing');
  }

  // Check if user is super admin
  const isSuperAdmin = await PermissionService.isSuperAdmin(user.id);

  if (!isSuperAdmin) {
    redirect('/sustainability?error=admin_only');
  }

  // Get user's organization and role
  const { organizationId, role } = await getUserOrganizationById(user.id);

  if (!organizationId) {
    redirect('/unauthorized?reason=no_organization');
  }


  // Get organization details
  const { data: organization, error: orgError } = await supabaseAdmin
    .from('organizations')
    .select('id, name, slug, industry_primary, headquarters_address')
    .eq('id', organizationId)
    .single();


  // Fetch sites for the organization
  const { data: sites, error: sitesError } = await supabaseAdmin
    .from('sites')
    .select('id, name, location, address')
    .eq('organization_id', organizationId);


  // Fetch team members for the organization
  const { data: teamMembers } = await supabaseAdmin
    .from('app_users')
    .select('id, name, email, role')
    .eq('organization_id', organizationId);


  // Fetch active alerts for the organization
  const { data: alerts } = await supabaseAdmin
    .from('alerts')
    .select('id, severity, message, created_at')
    .eq('organization_id', organizationId)
    .eq('resolved', false)
    .order('created_at', { ascending: false })
    .limit(10);


  // Fetch devices count for all sites
  let devicesCount = 0;
  if (sites && sites.length > 0) {
    const siteIds = sites.map(s => s.id);
    const { count } = await supabaseAdmin
      .from('devices')
      .select('*', { count: 'exact', head: true })
      .in('site_id', siteIds);
    devicesCount = count || 0;
  }


  // Get metrics data for the organization (server-side)
  let metricsData = null;
  let processedMetrics = null;
  let totalMetricsCount = 0;

  // Get metrics for current year by default
  const currentYear = new Date().getFullYear(); // 2025
  const defaultStartDate = `${currentYear}-01-01`;
  const defaultEndDate = `${currentYear}-12-31`;

  // Previous period for trend calculation
  const previousYear = currentYear - 1;
  const previousStartDate = `${previousYear}-01-01`;
  const previousEndDate = `${previousYear}-12-31`;

  if (organizationId) {
    // Get total count of metrics
    const { count: metricsCount } = await supabaseAdmin
      .from('metrics_data')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    totalMetricsCount = metricsCount || 0;

    // Get recent metrics for display (limited for performance)
    const { data: metricsDataRaw, error: metricsError } = await supabaseAdmin
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('period_start', defaultStartDate)
      .lte('period_end', defaultEndDate)
      .order('created_at', { ascending: false });
      // Removed limit to get all data, not just 100 records

    // Get metrics definitions from metrics_catalog
    const { data: metricDefs } = await supabaseAdmin
      .from('metrics_catalog')
      .select('id, name, unit, scope, category');

    // Join the data manually - rename to metrics_catalog to match table
    const metrics = metricsDataRaw?.map(m => ({
      ...m,
      metrics_catalog: metricDefs?.find(def => def.id === m.metric_id)
    }));

    // Get previous period data for trend calculation
    const { data: previousMetricsRaw } = await supabaseAdmin
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('period_start', previousStartDate)
      .lte('period_end', previousEndDate);

    const previousMetrics = previousMetricsRaw?.map(m => ({
      ...m,
      metrics_catalog: metricDefs?.find(def => def.id === m.metric_id)
    }));

    metricsData = metrics;

    // Process metrics data for display
    if (metrics && metrics.length > 0) {
      // ALL metrics contribute to emissions total
      const allMetrics = metrics; // Use all metrics for emissions calculation

      // Filter for specific categories for individual cards
      const energy = metrics.filter(m =>
        m.metrics_catalog?.category === 'Electricity' ||
        m.metrics_catalog?.category === 'Purchased Energy'
      );

      const water = metrics.filter(m =>
        m.metrics_catalog?.category === 'Purchased Goods & Services' &&
        (m.metrics_catalog?.name === 'Water' || m.metrics_catalog?.name === 'Wastewater')
      );

      const waste = metrics.filter(m =>
        m.metrics_catalog?.category === 'Waste'
      );

      // Calculate totals and trends
      // IMPORTANT: co2e_emissions is stored in kgCO2e, convert to tCO2e by dividing by 1000
      // IMPORTANT: energy values are stored in kWh, convert to MWh by dividing by 1000
      const calculateTotal = (items: any[]) => {
        return items.reduce((sum, item) => sum + (item.value || 0), 0);
      };

      const calculateEmissionsTotal = (items: any[]) => {
        return items.reduce((sum, item) => sum + ((item.co2e_emissions || 0) / 1000), 0); // Convert kg to tonnes
      };

      const calculateEnergyTotal = (items: any[]) => {
        return items.reduce((sum, item) => sum + ((item.value || 0) / 1000), 0); // Convert kWh to MWh
      };

      // Calculate previous period totals for trends
      const calculateTrend = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      // Calculate previous period values
      let previousEmissionsTotal = 0;
      let previousEnergyTotal = 0;
      let previousWaterTotal = 0;
      let previousWasteTotal = 0;

      if (previousMetrics && previousMetrics.length > 0) {
        previousEmissionsTotal = calculateEmissionsTotal(previousMetrics);

        const prevEnergy = previousMetrics.filter(m =>
          m.metrics_catalog?.category === 'Electricity' ||
          m.metrics_catalog?.category === 'Purchased Energy'
        );
        previousEnergyTotal = calculateEnergyTotal(prevEnergy);

        const prevWater = previousMetrics.filter(m =>
          m.metrics_catalog?.category === 'Purchased Goods & Services' &&
          (m.metrics_catalog?.name === 'Water' || m.metrics_catalog?.name === 'Wastewater')
        );
        previousWaterTotal = calculateTotal(prevWater);

        const prevWaste = previousMetrics.filter(m =>
          m.metrics_catalog?.category === 'Waste'
        );
        previousWasteTotal = calculateTotal(prevWaste);
      };

      // Group by month for time periods
      const monthlyData: any = {};
      metrics.forEach(metric => {
        const month = new Date(metric.period_start).toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = {
            emissions: 0,
            energy: 0,
            water: 0,
            waste: 0,
            period: month
          };
        }

        const category = metric.metrics_catalog?.category;
        const name = metric.metrics_catalog?.name;

        // ALL metrics contribute to total emissions
        monthlyData[month].emissions += (metric.co2e_emissions || 0) / 1000; // Convert kg to tonnes

        // Category-specific values
        if (category === 'Electricity' || category === 'Purchased Energy') {
          monthlyData[month].energy += (metric.value || 0) / 1000; // Convert kWh to MWh
        }
        if (category === 'Purchased Goods & Services' &&
           (name === 'Water' || name === 'Wastewater')) {
          monthlyData[month].water += metric.value || 0;
        }
        if (category === 'Waste') {
          monthlyData[month].waste += metric.value || 0;
        }
      });

      // Calculate current totals
      const currentEmissionsTotal = calculateEmissionsTotal(allMetrics);
      const currentEnergyTotal = calculateEnergyTotal(energy);
      const currentWaterTotal = calculateTotal(water);
      const currentWasteTotal = calculateTotal(waste);

      processedMetrics = {
        emissions: {
          total: currentEmissionsTotal,
          unit: 'tCO2e',
          trend: calculateTrend(currentEmissionsTotal, previousEmissionsTotal),
          data: allMetrics
        },
        energy: {
          total: currentEnergyTotal,
          unit: 'MWh',
          trend: calculateTrend(currentEnergyTotal, previousEnergyTotal),
          data: energy
        },
        water: {
          total: currentWaterTotal,
          unit: 'm³',
          trend: calculateTrend(currentWaterTotal, previousWaterTotal),
          data: water
        },
        waste: {
          total: currentWasteTotal,
          unit: 'tons',
          trend: calculateTrend(currentWasteTotal, previousWasteTotal),
          data: waste
        },
        monthly: Object.values(monthlyData).sort((a: any, b: any) => b.period.localeCompare(a.period)),
        period: {
          start: defaultStartDate,
          end: defaultEndDate,
          label: `${currentYear}`,
          type: 'year'
        }
      };
    } else {
      // No data for the current period - provide empty structure
      processedMetrics = {
        emissions: { total: 0, unit: 'tCO2e', trend: 0, data: [] },
        energy: { total: 0, unit: 'MWh', trend: 0, data: [] },
        water: { total: 0, unit: 'm³', trend: 0, data: [] },
        waste: { total: 0, unit: 'tons', trend: 0, data: [] },
        monthly: [],
        period: {
          start: defaultStartDate,
          end: defaultEndDate,
          label: `${currentYear}`,
          type: 'year'
        }
      };

    }
  }

  // Build session object for client component
  const session = {
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0],
      role: role
    },
    current_organization: organization ? {
      ...organization,
      country: organization.headquarters_address?.country || 'Unknown'
    } : null,
    permissions: [] // Add permissions if needed
  };

  // Create organization data object
  const organizationData = {
    sites: sites || [],
    teamMembers: teamMembers || [],
    alerts: alerts || [],
    devicesCount: devicesCount,
    sitesCount: sites?.length || 0,
    teamCount: teamMembers?.length || 0,
    alertsCount: alerts?.length || 0,
    metricsCount: totalMetricsCount
  };
  });

  return (
    <ZeroTypingClient
      session={session}
      initialMetricsData={metricsData}
      processedMetrics={processedMetrics}
      organizationData={organizationData}
    />
  );
}
