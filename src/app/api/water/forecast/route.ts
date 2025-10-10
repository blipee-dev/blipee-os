import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import { EnterpriseForecast } from '@/lib/forecasting/enterprise-forecaster';

export const dynamic = 'force-dynamic';

/**
 * Enterprise-grade water forecasting using seasonal decomposition
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

    // Get historical water data for the past 36 months to build forecast model
    const historicalStartDate = new Date(startDate);
    historicalStartDate.setMonth(historicalStartDate.getMonth() - 36);

    // Get water-related metrics (they're categorized as "Purchased Goods & Services")
    const { data: waterMetrics } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .or('name.ilike.%water%,name.ilike.%wastewater%')
      .eq('category', 'Purchased Goods & Services');

    if (!waterMetrics || waterMetrics.length === 0) {
      return NextResponse.json({ forecast: [] });
    }

    const metricIds = waterMetrics.map(m => m.id);

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

    const historicalData = allData;

    if (!historicalData || historicalData.length === 0) {
      return NextResponse.json({ forecast: [] });
    }

    // Group by month
    const monthlyData: { [key: string]: { withdrawal: number; discharge: number; consumption: number; count: number } } = {};

    historicalData.forEach((record: any) => {
      const date = new Date(record.period_start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { withdrawal: 0, discharge: 0, consumption: 0, count: 0 };
      }

      const value = parseFloat(record.value) || 0;

      // Get metric details to determine if it's withdrawal, discharge, or consumption
      const metric = waterMetrics.find(m => m.id === record.metric_id);
      const metricName = metric?.name?.toLowerCase() || '';

      if (metricName.includes('discharge') || metricName.includes('effluent')) {
        monthlyData[monthKey].discharge += value;
      } else if (metricName.includes('consumption')) {
        monthlyData[monthKey].consumption += value;
      } else {
        // Default to withdrawal
        monthlyData[monthKey].withdrawal += value;
      }

      monthlyData[monthKey].count++;
    });

    // Calculate consumption if not directly available (withdrawal - discharge)
    Object.keys(monthlyData).forEach(monthKey => {
      if (monthlyData[monthKey].consumption === 0) {
        monthlyData[monthKey].consumption = monthlyData[monthKey].withdrawal - monthlyData[monthKey].discharge;
      }
    });

    // Convert to array
    const months = Object.keys(monthlyData).sort();
    const historicalMonthly = months.map(monthKey => ({
      monthKey,
      withdrawal: monthlyData[monthKey].withdrawal,
      discharge: monthlyData[monthKey].discharge,
      consumption: monthlyData[monthKey].consumption
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

    console.log(`🔬 Water Enterprise Forecasting: ${historicalMonthly.length} historical months → ${monthsToForecast} forecast months`);

    // Use enterprise forecaster for withdrawal
    const withdrawalData = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.withdrawal
    }));

    const withdrawalForecast = EnterpriseForecast.forecast(withdrawalData, monthsToForecast, false);

    // Use enterprise forecaster for discharge
    const dischargeData = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.discharge
    }));

    const dischargeForecast = EnterpriseForecast.forecast(dischargeData, monthsToForecast, false);

    // Use enterprise forecaster for consumption
    const consumptionData = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.consumption
    }));

    const consumptionForecast = EnterpriseForecast.forecast(consumptionData, monthsToForecast, false);

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
        withdrawal: withdrawalForecast.forecasted[i] || 0,
        discharge: dischargeForecast.forecasted[i] || 0,
        consumption: consumptionForecast.forecasted[i] || 0,
        isForecast: true,
        confidence: {
          withdrawalLower: withdrawalForecast.confidence.lower[i] || 0,
          withdrawalUpper: withdrawalForecast.confidence.upper[i] || 0,
          dischargeLower: dischargeForecast.confidence.lower[i] || 0,
          dischargeUpper: dischargeForecast.confidence.upper[i] || 0,
          consumptionLower: consumptionForecast.confidence.lower[i] || 0,
          consumptionUpper: consumptionForecast.confidence.upper[i] || 0
        }
      });

      currentMonth++;
    }

    console.log('✅ Water Enterprise Forecast:');
    console.log(`  Method: ${withdrawalForecast.method}`);
    console.log(`  Model Quality: R²=${withdrawalForecast.metadata.r2.toFixed(3)}`);
    console.log(`  Last actual: ${lastDataMonth.monthKey} (${(lastDataMonth.withdrawal / 1000).toFixed(1)} ML)`);
    console.log(`  Forecasted total withdrawal: ${(forecastMonths.reduce((sum, f) => sum + f.withdrawal, 0) / 1000).toFixed(1)} ML`);

    return NextResponse.json({
      forecast: forecastMonths,
      lastActualMonth: lastDataMonth.monthKey,
      model: withdrawalForecast.method,
      confidence: Math.max(0.5, withdrawalForecast.metadata.r2), // Use R² as confidence metric
      metadata: {
        withdrawalTrend: withdrawalForecast.metadata.trendSlope,
        dischargeTrend: dischargeForecast.metadata.trendSlope,
        consumptionTrend: consumptionForecast.metadata.trendSlope,
        r2: withdrawalForecast.metadata.r2,
        volatility: withdrawalForecast.metadata.volatility
      }
    });

  } catch (error) {
    console.error('Error generating water forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}
