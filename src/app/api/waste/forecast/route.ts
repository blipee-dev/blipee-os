import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUserOrganizationById } from '@/lib/auth/get-user-org';
import { EnterpriseForecast } from '@/lib/forecasting/enterprise-forecaster';

export const dynamic = 'force-dynamic';

/**
 * Enterprise-grade waste forecasting using seasonal decomposition
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

    // Get historical waste data for the past 36 months to build forecast model
    const historicalStartDate = new Date(startDate);
    historicalStartDate.setMonth(historicalStartDate.getMonth() - 36);

    // Get waste metrics from metrics_catalog
    const { data: wasteMetrics } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .eq('category', 'Waste');

    if (!wasteMetrics || wasteMetrics.length === 0) {
      return NextResponse.json({ forecast: [] });
    }

    const metricIds = wasteMetrics.map(m => m.id);

    // Fetch waste data from metrics_data with pagination
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
    const monthlyData: { [key: string]: { generated: number; diverted: number; disposal: number; emissions: number; count: number } } = {};

    historicalData.forEach((record: any) => {
      const metric = wasteMetrics.find(m => m.id === record.metric_id);
      if (!metric) return;

      const date = new Date(record.period_start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { generated: 0, diverted: 0, disposal: 0, emissions: 0, count: 0 };
      }

      // Get quantity (convert to tons if needed)
      const value = parseFloat(record.value) || 0;
      const recordUnit = record.unit || metric.unit || 'tons';
      const valueInTons = recordUnit === 'kg' ? value / 1000 : value;

      // Get emissions (convert from kgCO2e to tCO2e)
      const emissionsInTons = (parseFloat(record.co2e_emissions) || 0) / 1000;

      // Check if diverted using metric metadata
      const isDiverted = metric.is_diverted || false;

      monthlyData[monthKey].generated += valueInTons;
      monthlyData[monthKey].emissions += emissionsInTons;

      if (isDiverted) {
        monthlyData[monthKey].diverted += valueInTons;
      } else {
        monthlyData[monthKey].disposal += valueInTons;
      }

      monthlyData[monthKey].count++;
    });

    // Convert to array
    const months = Object.keys(monthlyData).sort();
    const historicalMonthly = months.map(monthKey => ({
      monthKey,
      generated: monthlyData[monthKey].generated,
      diverted: monthlyData[monthKey].diverted,
      disposal: monthlyData[monthKey].disposal,
      emissions: monthlyData[monthKey].emissions
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

    console.log(`🔬 Waste Enterprise Forecasting: ${historicalMonthly.length} historical months → ${monthsToForecast} forecast months`);

    // Use enterprise forecaster for generated waste
    const generatedData = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.generated
    }));

    const generatedForecast = EnterpriseForecast.forecast(generatedData, monthsToForecast, false);

    // Use enterprise forecaster for diverted waste
    const divertedData = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.diverted
    }));

    const divertedForecast = EnterpriseForecast.forecast(divertedData, monthsToForecast, false);

    // Use enterprise forecaster for emissions
    const emissionsData = historicalMonthly.map(m => ({
      month: m.monthKey,
      emissions: m.emissions
    }));

    const emissionsForecast = EnterpriseForecast.forecast(emissionsData, monthsToForecast, false);

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

      const generated = generatedForecast.forecasted[i] || 0;
      const diverted = divertedForecast.forecasted[i] || 0;
      const emissions = emissionsForecast.forecasted[i] || 0;

      forecastMonths.push({
        monthKey,
        month: new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'short' }),
        generated,
        diverted,
        disposal: generated - diverted, // Calculate disposal as generated - diverted
        emissions,
        isForecast: true,
        confidence: {
          generatedLower: generatedForecast.confidence.lower[i] || 0,
          generatedUpper: generatedForecast.confidence.upper[i] || 0,
          divertedLower: divertedForecast.confidence.lower[i] || 0,
          divertedUpper: divertedForecast.confidence.upper[i] || 0,
          emissionsLower: emissionsForecast.confidence.lower[i] || 0,
          emissionsUpper: emissionsForecast.confidence.upper[i] || 0
        }
      });

      currentMonth++;
    }

    console.log('✅ Waste Enterprise Forecast:');
    console.log(`  Method: ${generatedForecast.method}`);
    console.log(`  Model Quality: R²=${generatedForecast.metadata.r2.toFixed(3)}`);
    console.log(`  Last actual: ${lastDataMonth.monthKey} (${lastDataMonth.generated.toFixed(1)} tons)`);
    console.log(`  Forecasted total: ${forecastMonths.reduce((sum, f) => sum + f.generated, 0).toFixed(1)} tons`);

    return NextResponse.json({
      forecast: forecastMonths,
      lastActualMonth: lastDataMonth.monthKey,
      model: generatedForecast.method,
      confidence: Math.max(0.5, generatedForecast.metadata.r2), // Use R² as confidence metric
      metadata: {
        generatedTrend: generatedForecast.metadata.trendSlope,
        divertedTrend: divertedForecast.metadata.trendSlope,
        emissionsTrend: emissionsForecast.metadata.trendSlope,
        r2: generatedForecast.metadata.r2,
        volatility: generatedForecast.metadata.volatility
      }
    });

  } catch (error) {
    console.error('Error generating waste forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}
