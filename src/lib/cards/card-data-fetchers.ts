/**
 * Card Data Fetchers
 * Real-time data fetching for Zero-Typing cards
 *
 * NOTE: Currently using mock data. Real emissions/energy tables need to be created.
 * The Zero-Typing infrastructure tables (card_definitions, etc.) are working!
 */

import { createClient } from '@/lib/supabase/client';
import { CardData } from '@/components/cards/SmartCard';

/**
 * Fetch total emissions data from metrics_data table
 */
export async function fetchTotalEmissionsData(): Promise<CardData> {
  const supabase = createClient();

  try {
    // Get current month emissions from metrics_data
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: metricsData } = await supabase
      .from('metrics_data')
      .select(`
        value,
        co2_equivalent,
        metrics_catalog (
          scope,
          emission_factor
        )
      `)
      .gte('period_start', startOfMonth.toISOString())
      .order('period_start', { ascending: false });

    // Calculate total CO2 equivalent
    const total = metricsData?.reduce((sum, m) => {
      // Use co2_equivalent if available, otherwise calculate
      if (m.co2_equivalent) {
        return sum + m.co2_equivalent;
      }
      // Calculate using emission factor if available
      const factor = m.metrics_catalog?.emission_factor || 0;
      return sum + (m.value * factor);
    }, 0) || 0;

    // Get last month for comparison
    const lastMonth = new Date(startOfMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthEnd = new Date(startOfMonth);
    lastMonthEnd.setSeconds(-1);

    const { data: lastMonthData } = await supabase
      .from('metrics_data')
      .select('value, co2_equivalent, metrics_catalog(emission_factor)')
      .gte('period_start', lastMonth.toISOString())
      .lt('period_start', lastMonthEnd.toISOString());

    const lastMonthTotal = lastMonthData?.reduce((sum, m) => {
      if (m.co2_equivalent) return sum + m.co2_equivalent;
      const factor = m.metrics_catalog?.emission_factor || 0;
      return sum + (m.value * factor);
    }, 0) || 0;

    const trendValue = lastMonthTotal > 0 ? ((total - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    // Calculate by scope
    const byScope = {
      scope1: 0,
      scope2: 0,
      scope3: 0
    };

    metricsData?.forEach(m => {
      const co2 = m.co2_equivalent || (m.value * (m.metrics_catalog?.emission_factor || 0));
      const scope = m.metrics_catalog?.scope;
      if (scope === 'scope_1') byScope.scope1 += co2;
      else if (scope === 'scope_2') byScope.scope2 += co2;
      else if (scope === 'scope_3') byScope.scope3 += co2;
    });

    return {
      id: 'total-emissions-metric',
      type: 'metric',
      title: 'Total Emissions',
      value: (total / 1000).toFixed(2), // Convert kg to tons
      unit: 'tCO2e',
      trend: trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'neutral',
      trendValue: Math.abs(trendValue),
      subtitle: `This month • ${metricsData?.length || 0} data points`,
      metadata: {
        lastUpdated: new Date().toISOString(),
        scope1: byScope.scope1 / 1000,
        scope2: byScope.scope2 / 1000,
        scope3: byScope.scope3 / 1000,
      }
    };
  } catch (error) {
    console.error('Failed to fetch emissions data:', error);
    // Return mock data as fallback
    return {
      id: 'total-emissions-metric',
      type: 'metric',
      title: 'Total Emissions',
      value: '145.2',
      unit: 'tCO2e',
      trend: 'down',
      trendValue: 5.3,
      subtitle: 'Demo data',
    };
  }
}

/**
 * Fetch energy usage data from metrics_data table
 */
export async function fetchEnergyUsageData(): Promise<CardData> {
  const supabase = createClient();

  try {
    // Get current month's energy usage (electricity metrics)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: energyData } = await supabase
      .from('metrics_data')
      .select(`
        value,
        metrics_catalog (
          name,
          category,
          unit
        )
      `)
      .gte('period_start', startOfMonth.toISOString())
      .or('metrics_catalog.category.eq.Energy,metrics_catalog.name.ilike.%electricity%')
      .order('period_start', { ascending: false });

    const totalEnergy = energyData?.reduce((sum, e) => sum + (e.value || 0), 0) || 0;

    // Get last month for comparison
    const lastMonth = new Date(startOfMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthEnd = new Date(startOfMonth);
    lastMonthEnd.setSeconds(-1);

    const { data: lastMonthData } = await supabase
      .from('metrics_data')
      .select('value, metrics_catalog(category, name)')
      .gte('period_start', lastMonth.toISOString())
      .lt('period_start', lastMonthEnd.toISOString())
      .or('metrics_catalog.category.eq.Energy,metrics_catalog.name.ilike.%electricity%');

    const lastMonthTotal = lastMonthData?.reduce((sum, e) => sum + (e.value || 0), 0) || 0;
    const trendValue = lastMonthTotal > 0 ? ((totalEnergy - lastMonthTotal) / lastMonthTotal) * 100 : 0;

    return {
      id: 'energy-usage-metric',
      type: 'metric',
      title: 'Energy Usage',
      value: Math.round(totalEnergy).toLocaleString(),
      unit: 'kWh',
      trend: trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'neutral',
      trendValue: Math.abs(trendValue),
      subtitle: `This month • ${energyData?.length || 0} readings`,
      metadata: {
        lastUpdated: new Date().toISOString(),
        total: totalEnergy,
        dataPoints: energyData?.length || 0
      }
    };
  } catch (error) {
    console.error('Failed to fetch energy data:', error);
    // Return mock data as fallback
    return {
      id: 'energy-usage-metric',
      type: 'metric',
      title: 'Energy Usage',
      value: '2,456',
      unit: 'kWh',
      trend: 'up',
      trendValue: 3.2,
      subtitle: 'Demo data',
    };
  }
}

/**
 * Fetch critical alerts
 */
export async function fetchCriticalAlertsData(): Promise<CardData> {
  const supabase = createClient();
  
  try {
    const { data: alerts } = await supabase
      .from('alerts')
      .select('*')
      .eq('severity', 'critical')
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (!alerts || alerts.length === 0) {
      return {
        id: 'critical-alerts',
        type: 'alert',
        title: 'System Healthy',
        subtitle: 'No critical alerts',
        alerts: [],
        metadata: {
          count: 0,
          lastChecked: new Date().toISOString(),
        }
      };
    }
    
    return {
      id: 'critical-alerts',
      type: 'alert',
      title: 'Critical Alerts',
      subtitle: `${alerts.length} issue${alerts.length > 1 ? 's' : ''} need attention`,
      alerts: alerts.map(a => ({
        id: a.id,
        type: a.type,
        message: a.message,
        timestamp: a.created_at,
        severity: 'critical',
        action: () => console.log('Alert action:', a.id),
      })),
      metadata: {
        count: alerts.length,
        lastChecked: new Date().toISOString(),
      }
    };
  } catch (error) {
    console.error('Failed to fetch alerts:', error);
    return {
      id: 'critical-alerts',
      type: 'alert',
      title: 'Alerts',
      subtitle: 'Unable to fetch alerts',
      alerts: [],
    };
  }
}

/**
 * Fetch emissions trend chart data from metrics_data
 */
export async function fetchEmissionsTrendData(): Promise<CardData> {
  const supabase = createClient();

  try {
    // Get last 12 months of emissions data
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data: metricsData } = await supabase
      .from('metrics_data')
      .select(`
        period_start,
        co2_equivalent,
        value,
        metrics_catalog (
          emission_factor
        )
      `)
      .gte('period_start', twelveMonthsAgo.toISOString())
      .order('period_start', { ascending: true });

    // Group by month
    const monthlyEmissions = new Map<string, number>();

    metricsData?.forEach(m => {
      const month = m.period_start.substring(0, 7); // YYYY-MM format
      const co2 = m.co2_equivalent || (m.value * (m.metrics_catalog?.emission_factor || 0));
      monthlyEmissions.set(month, (monthlyEmissions.get(month) || 0) + co2);
    });

    // Convert to chart data
    const chartData = Array.from(monthlyEmissions.entries())
      .map(([month, value]) => ({
        x: month,
        y: value / 1000, // Convert kg to tons
      }))
      .slice(-12); // Last 12 months

    const total = chartData.reduce((sum, d) => sum + d.y, 0);
    const average = chartData.length > 0 ? total / chartData.length : 0;

    return {
      id: 'emissions-trend-chart',
      type: 'chart',
      title: 'Emissions Trend',
      subtitle: 'Last 12 months',
      chart: {
        type: 'line',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
        }
      },
      metadata: {
        total,
        average,
        dataPoints: chartData.length,
      }
    };
  } catch (error) {
    console.error('Failed to fetch trend data:', error);
    // Return mock chart data
    const mockData = Array.from({ length: 12 }, (_, i) => ({
      x: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 7),
      y: 140 + Math.random() * 20,
    }));

    return {
      id: 'emissions-trend-chart',
      type: 'chart',
      title: 'Emissions Trend',
      subtitle: 'Demo data',
      chart: {
        type: 'line',
        data: mockData,
      }
    };
  }
}

/**
 * Fetch system status data
 */
export async function fetchSystemStatusData(): Promise<CardData> {
  const supabase = createClient();

  try {
    // Check various system components
    const { data: { user } } = await supabase.auth.getUser();
    const dbConnected = !!user;

    // Get card definitions count (real agents)
    const { count: agentCount } = await supabase
      .from('card_definitions')
      .select('*', { count: 'exact', head: true })
      .eq('card_type', 'agent');

    const activeAgents = agentCount || 0;
    const totalAgents = 8;

    // Get data freshness from metrics_data
    const { data: latestData } = await supabase
      .from('metrics_data')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const lastUpdate = latestData?.created_at ?
      new Date(latestData.created_at) : new Date();
    const minutesAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 60000);

    // Check table health
    const { count: metricsCount } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact', head: true });

    const { count: catalogCount } = await supabase
      .from('metrics_catalog')
      .select('*', { count: 'exact', head: true });

    return {
      id: 'system-status',
      type: 'status',
      title: 'System Status',
      subtitle: dbConnected ? 'All systems operational' : 'Connection issue',
      status: {
        overall: dbConnected ? 'healthy' : 'degraded',
        components: [
          { name: 'Database', status: dbConnected ? 'operational' : 'error' },
          { name: 'AI Agents', status: 'operational', detail: `${activeAgents}/${totalAgents} registered` },
          { name: 'Metrics', status: 'operational', detail: `${metricsCount} data points` },
          { name: 'Catalog', status: 'operational', detail: `${catalogCount} metrics` },
          { name: 'Data Pipeline', status: minutesAgo < 60 ? 'operational' : 'delayed' },
        ]
      },
      metadata: {
        lastDataUpdate: lastUpdate.toISOString(),
        dataFreshness: minutesAgo < 5 ? 'real-time' : minutesAgo < 60 ? 'recent' : 'stale',
        activeAgents,
        totalAgents,
        metricsCount,
        catalogCount
      }
    };
  } catch (error) {
    console.error('Failed to fetch system status:', error);
    return {
      id: 'system-status',
      type: 'status',
      title: 'System Status',
      subtitle: 'Unable to determine status',
      status: {
        overall: 'unknown',
        components: []
      }
    };
  }
}

/**
 * Master data fetcher that routes to specific fetchers
 */
export async function fetchCardData(cardId: string): Promise<CardData | null> {
  switch (cardId) {
    case 'total-emissions-metric':
      return fetchTotalEmissionsData();
    case 'energy-usage-metric':
      return fetchEnergyUsageData();
    case 'critical-alerts':
      return fetchCriticalAlertsData();
    case 'emissions-trend-chart':
      return fetchEmissionsTrendData();
    case 'system-status':
      return fetchSystemStatusData();
    default:
      // For other cards, return basic data
      return null;
  }
}