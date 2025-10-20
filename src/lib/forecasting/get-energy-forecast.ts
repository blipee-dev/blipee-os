import { supabaseAdmin } from '@/lib/supabase/admin';
import { EnterpriseForecast } from './enterprise-forecaster';

/**
 * Shared function to get energy forecast for an organization
 * Used by both the API endpoint and internal calculations
 */
export async function getEnergyForecast(
  organizationId: string,
  startDate: string,
  endDate: string,
  siteId?: string
) {
  try {
    // Use ALL available historical data from 2022 onwards, including 2025 YTD
    // This gives the ML model the most comprehensive dataset with recent patterns
    const historicalStartDate = new Date('2022-01-01');

    const { data: energyMetrics } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .in('category', ['Purchased Energy', 'Electricity']);

    if (!energyMetrics || energyMetrics.length === 0) {
      return { forecast: [] };
    }

    const metricIds = energyMetrics.map(m => m.id);

    // Fetch ALL data with pagination
    let allData: any[] = [];
    let rangeStart = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabaseAdmin
        .from('metrics_data')
        .select('*')
        .eq('organization_id', organizationId)
        .in('metric_id', metricIds)
        .gte('period_start', historicalStartDate.toISOString().split('T')[0])
        .order('period_start', { ascending: true })
        .range(rangeStart, rangeStart + batchSize - 1);

      if (siteId) {
        query = query.eq('site_id', siteId);
      }

      const { data: batchData, error } = await query;

      if (error || !batchData || batchData.length === 0) {
        hasMore = false;
        break;
      }

      allData = allData.concat(batchData);

      if (batchData.length < batchSize) {
        hasMore = false;
      } else {
        rangeStart += batchSize;
      }
    }

    // DEDUPLICATION: Remove duplicate records before processing
    // The database has duplicate records (same metric_id, period_start, site_id)
    const seenRecords = new Set<string>();
    const historicalData = allData.filter((record: any) => {
      const key = `${record.metric_id}|${record.period_start}|${record.site_id || 'null'}`;
      if (seenRecords.has(key)) {
        return false; // Skip duplicate
      }
      seenRecords.add(key);
      return true;
    });

    console.log(`📊 Energy forecast data: ${allData.length} total, ${historicalData.length} unique (${allData.length - historicalData.length} duplicates removed)`);

    if (!historicalData || historicalData.length === 0) {
      return { forecast: [] };
    }

    // Group by month
    const monthlyData: { [key: string]: { total: number; renewable: number; fossil: number; count: number } } = {};

    historicalData.forEach((record: any) => {
      const metric = energyMetrics.find(m => m.id === record.metric_id);
      const date = new Date(record.period_start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, renewable: 0, fossil: 0, count: 0 };
      }

      const consumption = parseFloat(record.value) || 0;
      const isRenewable = metric?.is_renewable || false;
      const gridMix = record.metadata?.grid_mix;

      monthlyData[monthKey].total += consumption;

      if (isRenewable) {
        monthlyData[monthKey].renewable += consumption;
      } else if (gridMix && gridMix.renewable_kwh) {
        monthlyData[monthKey].renewable += gridMix.renewable_kwh;
        monthlyData[monthKey].fossil += gridMix.non_renewable_kwh || (consumption - gridMix.renewable_kwh);
      } else {
        monthlyData[monthKey].fossil += consumption;
      }

      monthlyData[monthKey].count++;
    });

    // Convert to array
    const months = Object.keys(monthlyData).sort();
    const historicalMonthly = months.map(monthKey => ({
      monthKey,
      total: monthlyData[monthKey].total,
      renewable: monthlyData[monthKey].renewable,
      fossil: monthlyData[monthKey].fossil
    }));

    // Find last month with actual data
    const lastDataMonth = historicalMonthly[historicalMonthly.length - 1];
    const [lastYear, lastMonth] = lastDataMonth.monthKey.split('-').map(Number);

    // Calculate how many months to forecast
    const endYear = new Date(endDate).getFullYear();
    const endMonth = new Date(endDate).getMonth() + 1;

    let monthsToForecast = 0;
    let currentYear = lastYear;
    let currentMonth = lastMonth + 1;

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      monthsToForecast++;
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    // Use enterprise forecaster
    const totalEnergyData = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.total
    }));

    const totalForecast = EnterpriseForecast.forecast(totalEnergyData, monthsToForecast, false);

    const renewableData = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.renewable
    }));

    const renewableForecast = EnterpriseForecast.forecast(renewableData, monthsToForecast, false);

    const fossilData = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.fossil
    }));

    const fossilForecast = EnterpriseForecast.forecast(fossilData, monthsToForecast, false);

    // Build forecast months array
    const forecastMonths: any[] = [];
    currentYear = lastYear;
    currentMonth = lastMonth + 1;

    for (let i = 0; i < monthsToForecast; i++) {
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }

      const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

      forecastMonths.push({
        monthKey,
        month: new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'short' }),
        total: totalForecast.forecasted[i] || 0,
        renewable: renewableForecast.forecasted[i] || 0,
        fossil: fossilForecast.forecasted[i] || 0,
        isForecast: true,
        confidence: {
          totalLower: totalForecast.confidence.lower[i] || 0,
          totalUpper: totalForecast.confidence.upper[i] || 0,
          renewableLower: renewableForecast.confidence.lower[i] || 0,
          renewableUpper: renewableForecast.confidence.upper[i] || 0
        }
      });

      currentMonth++;
    }

    return {
      forecast: forecastMonths,
      lastActualMonth: lastDataMonth.monthKey,
      model: totalForecast.method,
      confidence: Math.max(0.5, totalForecast.metadata.r2),
      metadata: {
        totalTrend: totalForecast.metadata.trendSlope,
        renewableTrend: renewableForecast.metadata.trendSlope,
        fossilTrend: fossilForecast.metadata.trendSlope,
        r2: totalForecast.metadata.r2,
        volatility: totalForecast.metadata.volatility
      }
    };

  } catch (error) {
    console.error('Error generating energy forecast:', error);
    return { forecast: [] };
  }
}
