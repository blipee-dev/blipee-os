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

    // Get historical energy data for the past 36 months to build forecast model
    const historicalStartDate = new Date(startDate);
    historicalStartDate.setMonth(historicalStartDate.getMonth() - 36);

    const { data: energyMetrics } = await supabaseAdmin
      .from('metrics_catalog')
      .select('*')
      .in('category', ['Purchased Energy', 'Electricity']);

    if (!energyMetrics || energyMetrics.length === 0) {
      return NextResponse.json({ forecast: [] });
    }

    const metricIds = energyMetrics.map(m => m.id);
    let query = supabaseAdmin
      .from('metrics_data')
      .select('*')
      .eq('organization_id', orgInfo.organizationId)
      .in('metric_id', metricIds)
      .gte('period_start', historicalStartDate.toISOString().split('T')[0])
      .order('period_start', { ascending: true });

    if (siteId) {
      query = query.eq('site_id', siteId);
    }

    const { data: historicalData } = await query;

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

      monthlyData[monthKey].total += consumption;
      if (isRenewable) {
        monthlyData[monthKey].renewable += consumption;
      } else {
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

    console.log(`🔬 Energy Enterprise Forecasting: ${historicalMonthly.length} historical months → ${monthsToForecast} forecast months`);

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

    console.log('✅ Energy Enterprise Forecast:');
    console.log(`  Method: ${totalForecast.method}`);
    console.log(`  Model Quality: R²=${totalForecast.metadata.r2.toFixed(3)}`);
    console.log(`  Last actual: ${lastDataMonth.monthKey} (${(lastDataMonth.total / 1000).toFixed(1)} MWh)`);
    console.log(`  Forecasted total: ${(forecastMonths.reduce((sum, f) => sum + f.total, 0) / 1000).toFixed(1)} MWh`);

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
