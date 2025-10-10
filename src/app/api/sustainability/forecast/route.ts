import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import { EnterpriseForecast } from '@/lib/forecasting/enterprise-forecaster';
import { getMonthlyEmissions, getProjectedAnnualEmissions } from '@/lib/sustainability/baseline-calculator';

export const dynamic = 'force-dynamic';

/**
 * Enterprise-grade emissions forecasting using seasonal decomposition
 * Uses Prophet-style additive model: Trend + Seasonality + Residuals
 * Same approach as Energy forecasting but for emissions across all scopes
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

    // ✅ USE CALCULATOR for monthly emissions (now with pagination support)
    console.log('✅ Using calculator for monthly emissions...');

    // Get all historical data using calculator (now handles pagination internally)
    const historicalStartDate = '2020-01-01';
    const monthlyEmissionsData = await getMonthlyEmissions(orgInfo.organizationId, historicalStartDate, endDate);

    if (!monthlyEmissionsData || monthlyEmissionsData.length === 0) {
      console.log('⚠️ No historical data found');
      return NextResponse.json({ forecast: [] });
    }

    // Convert calculator format to forecast format (kg CO2e for forecaster)
    const historicalMonthly = monthlyEmissionsData.map(m => ({
      monthKey: m.month,
      total: m.emissions * 1000, // Convert tCO2e to kg for forecaster
      scope1: m.scope_1 * 1000,
      scope2: m.scope_2 * 1000,
      scope3: m.scope_3 * 1000
    }));

    console.log(`✅ Calculator monthly data: ${historicalMonthly.length} months (scope-by-scope rounding)`);
    console.log(`📊 Month range: ${historicalMonthly[0]?.monthKey} to ${historicalMonthly[historicalMonthly.length - 1]?.monthKey}`);

    console.log(`📊 Historical monthly aggregated: ${historicalMonthly.length} months`);
    console.log(`📊 Month range: ${historicalMonthly[0]?.monthKey} to ${historicalMonthly[historicalMonthly.length - 1]?.monthKey}`);

    if (historicalMonthly.length === 0) {
      console.log('⚠️ No historical data available');
      return NextResponse.json({ forecast: [] });
    }

    // Use the last available month as the starting point for forecasting
    const selectedStartDate = new Date(startDate);
    const selectedEndDate = new Date(endDate);

    console.log(`📊 Selected period: ${selectedStartDate.toISOString().split('T')[0]} to ${selectedEndDate.toISOString().split('T')[0]}`);

    // Find the last month in our historical data
    const lastDataMonth = historicalMonthly[historicalMonthly.length - 1];
    const [lastYear, lastMonth] = lastDataMonth.monthKey.split('-').map(Number);

    console.log(`📊 Last historical data month: ${lastDataMonth.monthKey} (year=${lastYear}, month=${lastMonth})`);

    // Calculate how many months to forecast from last historical data to end of selected period
    const endYear = selectedEndDate.getFullYear();
    const endMonth = selectedEndDate.getMonth() + 1;

    console.log(`📊 Forecast target: ${endYear}-${String(endMonth).padStart(2, '0')}`);

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

    console.log(`📊 Months to forecast: ${monthsToForecast} (from ${lastYear}-${String(lastMonth).padStart(2, '0')} to ${endYear}-${String(endMonth).padStart(2, '0')})`);

    // If no months to forecast (last data is after selected period), return empty
    if (monthsToForecast === 0) {
      console.log('⚠️ No months to forecast (last historical data is after selected period)');
      return NextResponse.json({ forecast: [] });
    }

    console.log(`🔬 Emissions Enterprise Forecasting: ${historicalMonthly.length} historical months → ${monthsToForecast} forecast months`);

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

    console.log('✅ Emissions Enterprise Forecast:');
    console.log(`  Method: ${totalForecast.method}`);
    console.log(`  Model Quality: R²=${totalForecast.metadata.r2.toFixed(3)}`);
    console.log(`  Last actual: ${lastDataMonth.monthKey} (${(lastDataMonth.total / 1000).toFixed(1)} tCO2e)`);
    console.log(`  Forecasted total: ${(forecastMonths.reduce((sum, f) => sum + f.total, 0)).toFixed(1)} tCO2e`);

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
    console.error('Error generating emissions forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}
