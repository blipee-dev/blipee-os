import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function forecastAllMetricsML() {
  console.log('🤖 Enterprise ML Forecasting for All Metrics\n');
  console.log('='.repeat(80));

  try {
    // Get all sites with address information for grid mix
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name, address')
      .eq('organization_id', organizationId);

    if (!sites || sites.length === 0) {
      console.log('❌ No sites found');
      return;
    }

    console.log(`\n📍 Found ${sites.length} sites:`);
    sites.forEach(s => console.log(`   - ${s.name} (${s.id})`));

    // Get all metrics
    const { data: metrics } = await supabase
      .from('metrics_catalog')
      .select('id, code, name, category, unit, scope, energy_type');

    if (!metrics) {
      console.log('❌ No metrics found');
      return;
    }

    // Check which metrics already have 2025 forecasts
    const { data: existing2025 } = await supabase
      .from('metrics_data')
      .select('metric_id, site_id')
      .eq('organization_id', organizationId)
      .gte('period_start', '2025-01-01');

    const existingCombos = new Set(
      (existing2025 || []).map(d => `${d.metric_id}|${d.site_id || 'all'}`)
    );

    console.log(`\n✅ ${existingCombos.size} metric/site combinations already have 2025 forecasts`);

    const forecastRecords: any[] = [];
    const monthsToForecast = 9; // Jan-Sep 2025
    let forecastedCount = 0;
    let skippedCount = 0;

    // Process each metric
    for (const metric of metrics) {
      console.log(`\n📊 Processing: ${metric.name} (${metric.category})`);

      const siteForecasts: Map<number, number[]> = new Map();

      // Forecast for each site
      for (const site of sites) {
        const comboKey = `${metric.id}|${site.id}`;

        // Skip if already has forecast
        if (existingCombos.has(comboKey)) {
          skippedCount++;
          continue;
        }

        // Get historical data for this metric + site (include metadata for grid mix)
        const { data: historicalData } = await supabase
          .from('metrics_data')
          .select('period_start, value, metadata')
          .eq('organization_id', organizationId)
          .eq('metric_id', metric.id)
          .eq('site_id', site.id)
          .gte('period_start', '2022-01-01')
          .lte('period_start', '2024-12-31')
          .order('period_start', { ascending: true });

        if (!historicalData || historicalData.length < 6) {
          console.log(`   ⚠️  ${site.name}: Not enough data (${historicalData?.length || 0} months)`);
          continue;
        }

        // Group by month and average (in case there are multiple records per month)
        const monthlyData = new Map<string, number[]>();
        historicalData.forEach(d => {
          const month = d.period_start.substring(0, 7);
          if (!monthlyData.has(month)) {
            monthlyData.set(month, []);
          }
          monthlyData.get(month)!.push(parseFloat(d.value) || 0);
        });

        // Create time series
        const timeSeries = Array.from(monthlyData.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, values]) => ({
            month,
            emissions: values.reduce((sum, v) => sum + v, 0) / values.length
          }));

        // Run ML forecast
        const forecast = EnterpriseForecast.forecast(timeSeries, monthsToForecast, false);

        console.log(`   ✅ ${site.name}: ${timeSeries.length} months → ${forecast.forecasted.length} forecasts`);
        console.log(`      Method: ${forecast.method}, R²: ${(forecast.metadata.r2 * 100).toFixed(1)}%`);

        // Store site forecast
        siteForecasts.set(site.id as any, forecast.forecasted);

        // Extract the most recent grid mix from historical data (for electricity metrics)
        let gridMixTemplate = null;
        if (metric.energy_type === 'electricity' && historicalData.length > 0) {
          // Find the most recent record with grid_mix metadata
          const recentWithMix = [...historicalData]
            .reverse()
            .find(d => d.metadata?.grid_mix?.sources?.length > 0);

          if (recentWithMix?.metadata?.grid_mix) {
            gridMixTemplate = recentWithMix.metadata.grid_mix;
            console.log(`      Grid Mix: ${gridMixTemplate.renewable_percentage?.toFixed(1)}% renewable (${gridMixTemplate.provider})`);
          }
        }

        // Create forecast records for this site
        for (let i = 0; i < monthsToForecast; i++) {
          const month = 2025 + Math.floor(i / 12);
          const monthNum = (i % 12) + 1;
          const periodStart = `${month}-${String(monthNum).padStart(2, '0')}-01`;
          const daysInMonth = new Date(month, monthNum, 0).getDate();
          const periodEnd = `${month}-${String(monthNum).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

          // Build forecast metadata
          const forecastMetadata: any = {
            is_forecast: true,
            forecast_method: forecast.method,
            model_quality: {
              r2: forecast.metadata.r2,
              trend_slope: forecast.metadata.trendSlope,
              seasonal_strength: forecast.metadata.seasonalStrength,
              volatility: forecast.metadata.volatility
            },
            confidence_interval: {
              lower: forecast.confidence.lower[i],
              upper: forecast.confidence.upper[i]
            },
            historical_months: timeSeries.length,
            generated_at: new Date().toISOString()
          };

          // Add grid mix for electricity metrics
          if (gridMixTemplate) {
            const forecastValue = forecast.forecasted[i];
            const renewablePercentage = gridMixTemplate.renewable_percentage || 0;
            const nonRenewablePercentage = 100 - renewablePercentage;
            const renewableKwh = forecastValue * (renewablePercentage / 100);
            const nonRenewableKwh = forecastValue * (nonRenewablePercentage / 100);

            // Calculate emissions using grid mix carbon intensity
            let calculatedEmissionsScope2 = null;
            let calculatedEmissionsScope3 = null;
            let calculatedEmissionsTotal = null;

            if (gridMixTemplate.carbon_intensity_lifecycle) {
              const emissionFactorScope3 = gridMixTemplate.carbon_intensity_lifecycle * 0.15;
              const emissionFactorScope2 = gridMixTemplate.carbon_intensity_lifecycle * 0.85;

              calculatedEmissionsTotal = (forecastValue * gridMixTemplate.carbon_intensity_lifecycle) / 1000;
              calculatedEmissionsScope2 = (forecastValue * emissionFactorScope2) / 1000;
              calculatedEmissionsScope3 = (forecastValue * emissionFactorScope3) / 1000;
            }

            forecastMetadata.grid_mix = {
              ...gridMixTemplate,
              // Update for forecast period
              year: month,
              month: monthNum,
              period: `${month}-${String(monthNum).padStart(2, '0')}`,
              datetime: `${periodStart}T00:00:00Z`,
              // Calculate renewable/non-renewable percentages and kWh for forecast value
              renewable_percentage: renewablePercentage,
              non_renewable_percentage: nonRenewablePercentage,
              renewable_kwh: renewableKwh,
              non_renewable_kwh: nonRenewableKwh,
              // Update calculated emissions
              calculated_emissions_total_kgco2e: calculatedEmissionsTotal,
              calculated_emissions_scope2_kgco2e: calculatedEmissionsScope2,
              calculated_emissions_scope3_cat3_kgco2e: calculatedEmissionsScope3,
              // Mark as forecast-derived
              source: 'forecast_inherited_from_historical',
              updated_at: new Date().toISOString()
            };
          }

          forecastRecords.push({
            organization_id: organizationId,
            metric_id: metric.id,
            site_id: site.id,
            period_start: periodStart,
            period_end: periodEnd,
            value: forecast.forecasted[i].toString(),
            unit: metric.unit,
            metadata: forecastMetadata
          });
          forecastedCount++;
        }
      }

      // Note: "All Sites" aggregation is handled dynamically by the API
      // We do NOT create pre-aggregated site_id=null records to avoid double counting
      if (siteForecasts.size > 0) {
        console.log(`   ✅ Forecasted ${siteForecasts.size} sites (All Sites will be calculated dynamically by API)`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('💾 INSERTING FORECASTS INTO DATABASE');
    console.log('='.repeat(80));

    // Insert in batches
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < forecastRecords.length; i += batchSize) {
      const batch = forecastRecords.slice(i, i + batchSize);

      const { error } = await supabase
        .from('metrics_data')
        .insert(batch);

      if (error) {
        console.error(`❌ Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
      } else {
        insertedCount += batch.length;
        console.log(`✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} records`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ FORECAST COMPLETE');
    console.log('='.repeat(80));
    console.log(`Total forecasts created: ${forecastedCount}`);
    console.log(`Total records inserted: ${insertedCount}/${forecastRecords.length}`);
    console.log(`Skipped (already exist): ${skippedCount}`);
    console.log(`Period: Jan-Sep 2025`);
    console.log(`Method: Enterprise ML (Prophet-style decomposition)`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

(async () => {
  await forecastAllMetricsML();
  process.exit(0);
})();
