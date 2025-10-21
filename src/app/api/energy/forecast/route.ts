import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import { EnterpriseForecast } from '@/lib/forecasting/enterprise-forecaster';

export const dynamic = 'force-dynamic';

/**
 * Enterprise-grade energy forecasting using seasonal decomposition
 * Uses Prophet-style additive model: Trend + Seasonality + Residuals
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orgInfo = await getUserOrganizationById(user.id);
    if (!orgInfo.organizationId) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const siteId = searchParams.get('site_id');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date required' }, { status: 400 });
    }

    // Use ALL available historical data from 2022 onwards, including 2025 YTD
    // This gives the ML model the most comprehensive dataset with recent patterns
    const historicalStartDate = new Date('2022-01-01');

    // Filter out future months from current year to avoid using forecast data as historical data
    const now = new Date();
    const filterYear = now.getFullYear();
    const filterMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const maxHistoricalDate = new Date(filterYear, filterMonth, 0); // Last day of current month

    const { data: energyMetrics } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .in('category', ['Purchased Energy', 'Electricity']);

    if (!energyMetrics || energyMetrics.length === 0) {
      return NextResponse.json({ forecast: [] });
    }

    const metricIds = energyMetrics.map(m => m.id);

    // Fetch ALL data with pagination to avoid 1000-record limit
    let allData: any[] = [];
    let rangeStart = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabaseAdmin
        .from('metrics_data')
        .select('*')
        .eq('organization_id', orgInfo.organizationId)
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
      // Skip future months from current year (they might be forecasts stored in the database)
      const recordDate = new Date(record.period_start);
      if (recordDate > maxHistoricalDate) {
        return false;
      }

      const key = `${record.metric_id}|${record.period_start}|${record.site_id || 'null'}`;
      if (seenRecords.has(key)) {
        return false; // Skip duplicate
      }
      seenRecords.add(key);
      return true;
    });

    debug.log(`📊 Energy forecast data (API): ${allData.length} total, ${historicalData.length} historical (filtered future months and duplicates)`);
    debug.log(`📅 Filtering dates - maxHistoricalDate: ${maxHistoricalDate.toISOString()}, filterYear: ${filterYear}, filterMonth: ${filterMonth}`);

    if (!historicalData || historicalData.length === 0) {
      return NextResponse.json({ forecast: [] });
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

      // Check if we have grid mix metadata for this record
      const gridMix = record.metadata?.grid_mix;

      monthlyData[monthKey].total += consumption;

      if (isRenewable) {
        // Direct renewable energy (solar panels, wind turbines owned)
        monthlyData[monthKey].renewable += consumption;
      } else if (gridMix && gridMix.renewable_kwh) {
        // Grid electricity with renewable component from grid mix
        monthlyData[monthKey].renewable += gridMix.renewable_kwh;
        monthlyData[monthKey].fossil += gridMix.non_renewable_kwh || (consumption - gridMix.renewable_kwh);
      } else {
        // Fossil fuel energy (no renewable component)
        monthlyData[monthKey].fossil += consumption;
      }

      monthlyData[monthKey].count++;
    });

    // Convert to array and calculate averages
    const months = Object.keys(monthlyData).sort();
    const historicalMonthly = months.map(monthKey => ({
      monthKey,
      total: monthlyData[monthKey].total,
      renewable: monthlyData[monthKey].renewable,
      fossil: monthlyData[monthKey].fossil
    }));

    debug.log(`📅 Monthly data keys found: ${months.join(', ')}`);

    // Find last month with actual data
    const lastDataMonth = historicalMonthly[historicalMonthly.length - 1];
    const [lastYear, lastMonth] = lastDataMonth.monthKey.split('-').map(Number);
    debug.log(`📅 Last data month: ${lastDataMonth.monthKey} (lastYear: ${lastYear}, lastMonth: ${lastMonth})`);

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


    // Use enterprise forecaster for total energy
    const totalEnergyData = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.total
    }));

    const totalForecast = EnterpriseForecast.forecast(totalEnergyData, monthsToForecast, false);

    // Use enterprise forecaster for renewable
    const renewableData = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.renewable
    }));

    const renewableForecast = EnterpriseForecast.forecast(renewableData, monthsToForecast, false);

    // Use enterprise forecaster for fossil
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


    return NextResponse.json({
      forecast: forecastMonths,
      lastActualMonth: lastDataMonth.monthKey,
      model: totalForecast.method,
      confidence: Math.max(0.5, totalForecast.metadata.r2), // Use R² as confidence metric
      metadata: {
        totalTrend: totalForecast.metadata.trendSlope,
        renewableTrend: renewableForecast.metadata.trendSlope,
        fossilTrend: fossilForecast.metadata.trendSlope,
        r2: totalForecast.metadata.r2,
        volatility: totalForecast.metadata.volatility
      }
    });

  } catch (error) {
    console.error('Error generating energy forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}
