import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function createOctDecForecasts() {
  console.log('🚀 CREATING OCTOBER-DECEMBER 2025 ML FORECASTS\n');
  console.log('='.repeat(120));

  // Get all metrics with Jan-Sep 2025 data
  const { data: data2025 } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      metric_id,
      site_id,
      metrics_catalog!inner(id, code, name, scope, unit, category)
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2025-10-01');

  if (!data2025) {
    console.error('❌ No 2025 data found');
    return;
  }

  // Get unique metrics
  const uniqueMetrics = new Map<string, any>();
  data2025.forEach(d => {
    const key = `${d.metric_id}_${d.site_id || 'null'}`;
    if (!uniqueMetrics.has(key)) {
      uniqueMetrics.set(key, {
        metricId: d.metric_id,
        siteId: d.site_id,
        code: d.metrics_catalog.code,
        name: d.metrics_catalog.name,
        scope: d.metrics_catalog.scope,
        unit: d.metrics_catalog.unit,
        category: d.metrics_catalog.category
      });
    }
  });

  console.log(`\n📊 Found ${uniqueMetrics.size} unique metric/site combinations\n`);

  const results: any[] = [];
  let processedCount = 0;

  for (const [key, metric] of uniqueMetrics.entries()) {
    processedCount++;
    console.log(`\n[${processedCount}/${uniqueMetrics.size}] Processing: ${metric.name}`);
    console.log('─'.repeat(120));

    // Fetch ALL historical data (2022-2024)
    // Note: Not filtering by site_id for historical data to get full dataset
    const { data: historicalData } = await supabaseAdmin
      .from('metrics_data')
      .select('period_start, value, co2e_emissions')
      .eq('organization_id', organizationId)
      .eq('metric_id', metric.metricId)
      .gte('period_start', '2022-01-01')
      .lt('period_start', '2025-01-01')
      .order('period_start', { ascending: true });

    if (!historicalData || historicalData.length < 12) {
      console.log(`   ⚠️  Insufficient historical data (${historicalData?.length || 0} months) - Skipping`);
      results.push({ metric: metric.name, success: false, reason: 'Insufficient data' });
      continue;
    }

    // Check growth trend (2023 vs 2024)
    const data2023 = historicalData.filter(d => d.period_start?.startsWith('2023'));
    const data2024 = historicalData.filter(d => d.period_start?.startsWith('2024'));

    const total2023 = data2023.reduce((sum, d) => sum + ((d.co2e_emissions || 0) / 1000), 0);
    const total2024 = data2024.reduce((sum, d) => sum + ((d.co2e_emissions || 0) / 1000), 0);
    const growthRate = total2023 > 0 ? ((total2024 - total2023) / total2023) * 100 : 0;
    const isGrowing = growthRate > 10; // Growing > 10%

    console.log(`   📈 2023→2024 trend: ${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}% ${isGrowing ? '(GROWING)' : '(STABLE)'}`);

    // Prepare monthly data for ML
    let monthlyData: { month: string; emissions: number }[];

    if (isGrowing) {
      // For growing metrics, use only 2023-2024 data (more recent trend)
      monthlyData = historicalData
        .filter(d => d.period_start && d.period_start >= '2023-01-01')
        .map(d => ({
          month: d.period_start?.substring(0, 7) || '',
          emissions: (d.co2e_emissions || 0) / 1000
        }));
      console.log(`   🎯 Using 2023-2024 data only (${monthlyData.length} months) for growth trend`);
    } else {
      // For stable metrics, use all available data
      monthlyData = historicalData.map(d => ({
        month: d.period_start?.substring(0, 7) || '',
        emissions: (d.co2e_emissions || 0) / 1000
      }));
      console.log(`   🎯 Using all historical data (${monthlyData.length} months)`);
    }

    // Run ML forecast for 12 months
    const forecast = EnterpriseForecast.forecast(monthlyData, 12, false);
    console.log(`   ✅ ML Forecast: ${forecast.method} | R²: ${forecast.metadata.r2.toFixed(4)}`);

    // Calculate emission factor
    const avgEmissionFactor = historicalData.reduce((sum, d) => {
      const value = d.value || 0;
      const emissions = d.co2e_emissions || 0;
      return sum + (value > 0 ? emissions / value : 0);
    }, 0) / historicalData.filter(d => (d.value || 0) > 0).length;

    // Create Oct-Dec records
    const months = [
      { month: '2025-10', name: 'October', index: 9 },
      { month: '2025-11', name: 'November', index: 10 },
      { month: '2025-12', name: 'December', index: 11 }
    ];

    let insertedCount = 0;
    let errorCount = 0;

    for (const { month, name: monthName, index } of months) {
      const forecastEmissionsKg = forecast.forecasted[index] * 1000;
      const forecastValue = avgEmissionFactor > 0 ? forecastEmissionsKg / avgEmissionFactor : 0;

      // Check if record already exists
      let query = supabaseAdmin
        .from('metrics_data')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('metric_id', metric.metricId)
        .eq('period_start', `${month}-01`);

      if (metric.siteId) {
        query = query.eq('site_id', metric.siteId);
      } else {
        query = query.is('site_id', null);
      }

      const { data: existing } = await query.maybeSingle();

      if (existing) {
        console.log(`   ⏭️  ${monthName}: Already exists, skipping`);
        continue;
      }

      // Insert new record
      const { error: insertError } = await supabaseAdmin
        .from('metrics_data')
        .insert({
          organization_id: organizationId,
          metric_id: metric.metricId,
          site_id: metric.siteId,
          period_start: `${month}-01`,
          period_end: `${month}-${month === '2025-11' ? '30' : '31'}`,
          value: forecastValue,
          unit: metric.unit,
          co2e_emissions: forecastEmissionsKg,
          data_quality: 'calculated',
          notes: `ML forecast using ${forecast.method} (${monthlyData.length} months training, ${isGrowing ? 'growth trend' : 'full history'})`,
          metadata: {
            forecast_method: forecast.method,
            forecast_model: 'EnterpriseForecast',
            forecast_r2: forecast.metadata.r2,
            seasonal_strength: forecast.metadata.seasonalStrength,
            trend_slope: forecast.metadata.trendSlope,
            training_months: monthlyData.length,
            growth_adjusted: isGrowing,
            created_at: new Date().toISOString()
          }
        });

      if (insertError) {
        console.log(`   ❌ ${monthName}: Error - ${insertError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ ${monthName}: ${forecast.forecasted[index].toFixed(4)} tCO2e`);
        insertedCount++;
      }
    }

    results.push({
      metric: metric.name,
      success: insertedCount > 0,
      insertedCount,
      errorCount,
      isGrowing
    });

    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log('\n\n' + '═'.repeat(120));
  console.log('📊 FINAL SUMMARY');
  console.log('═'.repeat(120));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalInserted = results.reduce((sum, r) => sum + (r.insertedCount || 0), 0);
  const totalErrors = results.reduce((sum, r) => sum + (r.errorCount || 0), 0);
  const growthAdjusted = results.filter(r => r.isGrowing).length;

  console.log(`\n✅ Successfully processed: ${successful.length} metrics`);
  console.log(`❌ Failed: ${failed.length} metrics`);
  console.log(`📝 Total records inserted: ${totalInserted}`);
  console.log(`⚠️  Total errors: ${totalErrors}`);
  console.log(`📈 Growth-adjusted forecasts: ${growthAdjusted} metrics`);

  if (successful.length > 0) {
    console.log('\n\n✅ SUCCESSFULLY CREATED OCT-DEC FORECASTS FOR:');
    console.log('─'.repeat(120));
    successful.forEach(r => {
      const growthBadge = r.isGrowing ? '📈 (growth trend)' : '';
      console.log(`   • ${r.metric} ${growthBadge} - ${r.insertedCount} records`);
    });
  }

  if (failed.length > 0) {
    console.log('\n\n❌ FAILED TO CREATE FORECASTS FOR:');
    console.log('─'.repeat(120));
    failed.forEach(r => {
      console.log(`   • ${r.metric} - ${r.reason || 'Unknown error'}`);
    });
  }

  console.log('\n\n🎉 COMPLETION');
  console.log('═'.repeat(120));
  console.log('\nOct-Dec 2025 forecasts have been created!');
  console.log('\nKey improvements:');
  console.log('  ✅ Growing metrics use 2023-2024 data only (respects growth trend)');
  console.log('  ✅ Stable metrics use full historical data (better seasonality)');
  console.log('  ✅ All forecasts use EnterpriseForecast model');
  console.log('  ✅ Data quality marked as "calculated"');
  console.log('  ✅ Metadata includes forecast details for audit trail');
  console.log('\nNext steps:');
  console.log('  1. Refresh your dashboards to see full 2025 projections');
  console.log('  2. Annual totals will now be complete (Jan-Dec)');
  console.log('  3. Growing metrics (plane travel, electricity) will show realistic continuation');

  console.log('\n' + '═'.repeat(120));
}

createOctDecForecasts().catch(console.error);
