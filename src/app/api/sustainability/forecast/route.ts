import { NextRequest, NextResponse } from 'next/server';
import { getAPIUser } from '@/lib/auth/server-auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import { EnterpriseForecast } from '@/lib/forecasting/enterprise-forecaster';

export const dynamic = 'force-dynamic';

/**
 * Enterprise-grade emissions forecasting using seasonal decomposition
 * Uses Prophet-style additive model: Trend + Seasonality + Residuals
 * Same approach as Energy forecasting but for emissions across all scopes
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAPIUser(request);
    if (!user) {
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

    // Fetch ALL data with pagination to avoid 1000-record limit
    let allData: any[] = [];
    let rangeStart = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabaseAdmin
        .from('metrics_data')
        .select('metric_id, site_id, co2e_emissions, period_start, metrics_catalog!inner(scope)')
        .eq('organization_id', orgInfo.organizationId)
        .gte('period_start', historicalStartDate.toISOString().split('T')[0])
        .order('period_start', { ascending: true })
        .range(rangeStart, rangeStart + batchSize - 1);

      // ✅ CRITICAL FIX: Filter by site_id if provided
      if (siteId) {
        query = query.eq('site_id', siteId);
      }

      const { data: batchData, error } = await query;

      if (error) {
        console.error(`❌ Query error:`, error);
        hasMore = false;
        break;
      }

      if (!batchData || batchData.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`📦 Fetched batch: ${batchData.length} records (range: ${rangeStart}-${rangeStart + batchSize - 1})${siteId ? ` for site ${siteId}` : ''}`);
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

    console.log(`📊 Emissions forecast data: ${allData.length} total, ${historicalData.length} historical (filtered future months and duplicates)${siteId ? ` for site ${siteId}` : ''}`);

    if (!historicalData || historicalData.length === 0) {
      console.log(`⚠️ No historical data found${siteId ? ` for site ${siteId}` : ''}`);
      return NextResponse.json({ forecast: [] });
    }

    // Debug: Log sample records to understand structure
    if (historicalData.length > 0) {
      console.log(`📋 Sample record:`, JSON.stringify(historicalData[0], null, 2));
    }

    // Group by month and scope
    const monthlyData: { [key: string]: { scope1: number; scope2: number; scope3: number } } = {};

    historicalData.forEach((record: any) => {
      const date = new Date(record.period_start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { scope1: 0, scope2: 0, scope3: 0 };
      }

      const emissions = parseFloat(record.co2e_emissions) || 0; // Already in kg CO2e

      // Handle both possible structures for metrics_catalog
      const scope = record.metrics_catalog?.scope || (record.metrics_catalog as any)?.scope;

      if (!scope) {
        console.warn(`⚠️ No scope found for record:`, record.metric_id, record.period_start);
        return;
      }

      if (scope === 'scope_1') {
        monthlyData[monthKey].scope1 += emissions;
      } else if (scope === 'scope_2') {
        monthlyData[monthKey].scope2 += emissions;
      } else if (scope === 'scope_3') {
        monthlyData[monthKey].scope3 += emissions;
      }
    });

    console.log(`📅 Monthly data aggregated for ${Object.keys(monthlyData).length} months`);

    // Convert to array format sorted chronologically
    const historicalMonthly = Object.keys(monthlyData)
      .sort()
      .map(monthKey => ({
        monthKey,
        total: monthlyData[monthKey].scope1 + monthlyData[monthKey].scope2 + monthlyData[monthKey].scope3,
        scope1: monthlyData[monthKey].scope1,
        scope2: monthlyData[monthKey].scope2,
        scope3: monthlyData[monthKey].scope3
      }));

    // Debug: Log sample monthly data
    if (historicalMonthly.length > 0) {
      console.log(`📊 Sample monthly data (first 3):`, historicalMonthly.slice(0, 3));
      console.log(`📊 Sample monthly data (last 3):`, historicalMonthly.slice(-3));
      const totalEmissions = historicalMonthly.reduce((sum, m) => sum + m.total, 0);
      console.log(`📊 Total historical emissions: ${(totalEmissions / 1000).toFixed(1)} tCO2e across ${historicalMonthly.length} months`);
    }



    if (historicalMonthly.length === 0) {
      return NextResponse.json({ forecast: [] });
    }

    // Use the last available month as the starting point for forecasting
    const selectedStartDate = new Date(startDate);
    const selectedEndDate = new Date(endDate);


    // Find the last month in our historical data
    const lastDataMonth = historicalMonthly[historicalMonthly.length - 1];
    const [lastYear, lastMonth] = lastDataMonth.monthKey.split('-').map(Number);


    // Calculate how many months to forecast from last historical data to end of selected period
    const endYear = selectedEndDate.getFullYear();
    const endMonth = selectedEndDate.getMonth() + 1;


    let monthsToForecast = 0;
    let currentYear = lastYear;
    let currentMonth = lastMonth + 1;

    // Count months from last historical data to end of selected period
    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      monthsToForecast++;
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }


    // If no months to forecast (last data is after selected period), return empty
    if (monthsToForecast === 0) {
      return NextResponse.json({ forecast: [] });
    }


    // Use enterprise forecaster for total emissions
    const totalEmissionsData = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.total
    }));

    const totalForecast = EnterpriseForecast.forecast(totalEmissionsData, monthsToForecast, false);

    // Use enterprise forecaster for scope 1
    const scope1Data = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.scope1
    }));

    const scope1Forecast = EnterpriseForecast.forecast(scope1Data, monthsToForecast, false);

    // Use enterprise forecaster for scope 2
    const scope2Data = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.scope2
    }));

    const scope2Forecast = EnterpriseForecast.forecast(scope2Data, monthsToForecast, false);

    // Use enterprise forecaster for scope 3
    const scope3Data = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.scope3
    }));

    const scope3Forecast = EnterpriseForecast.forecast(scope3Data, monthsToForecast, false);

    // Build forecast months array - only include months within selected period
    const forecastMonths: any[] = [];
    currentYear = lastYear;
    currentMonth = lastMonth + 1;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < monthsToForecast; i++) {
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }

      const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
      const monthDate = new Date(currentYear, currentMonth - 1, 1);

      // Only include forecast months that are within the selected period
      if (monthDate >= selectedStartDate && monthDate <= selectedEndDate) {
        const yearShort = currentYear.toString().slice(-2);

        forecastMonths.push({
          monthKey,
          month: `${monthNames[currentMonth - 1]} ${yearShort}`,
          total: (totalForecast.forecasted[i] || 0) / 1000, // Convert kg to tonnes
          scope1: (scope1Forecast.forecasted[i] || 0) / 1000,
          scope2: (scope2Forecast.forecasted[i] || 0) / 1000,
          scope3: (scope3Forecast.forecasted[i] || 0) / 1000,
          forecast: true,
          confidence: {
            totalLower: (totalForecast.confidence.lower[i] || 0) / 1000,
            totalUpper: (totalForecast.confidence.upper[i] || 0) / 1000
          }
        });
      }

      currentMonth++;
    }


    return NextResponse.json({
      forecast: forecastMonths,
      lastActualMonth: lastDataMonth.monthKey,
      model: totalForecast.method,
      confidence: Math.max(0.5, totalForecast.metadata.r2), // Use R² as confidence metric
      metadata: {
        totalTrend: totalForecast.metadata.trendSlope,
        scope1Trend: scope1Forecast.metadata.trendSlope,
        scope2Trend: scope2Forecast.metadata.trendSlope,
        scope3Trend: scope3Forecast.metadata.trendSlope,
        r2: totalForecast.metadata.r2,
        volatility: totalForecast.metadata.volatility
      }
    });

  } catch (error) {
    console.error('❌ [forecast] API Error:', error);
    console.error('❌ [forecast] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ [forecast] Error message:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      {
        error: 'Failed to generate forecast',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
