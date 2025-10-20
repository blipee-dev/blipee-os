/**
 * Regenerate 2025 Energy Forecasts BY SOURCE (consumption values, not emissions)
 *
 * IMPORTANT: This forecasts actual consumption (kWh, liters, m³) for each energy source,
 * and lets the database trigger calculate emissions based on emission factors.
 */

import { createClient } from '@supabase/supabase-js';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function regenerateEnergyForecasts() {
  console.log('⚡ Regenerating 2025 Energy Forecasts BY SOURCE\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Step 1: Get all energy-related metrics
  console.log('📋 Step 1: Fetching energy metrics...\n');

  const { data: energyMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .or('category.ilike.%energy%,category.ilike.%electricity%,category.ilike.%combustion%');

  if (!energyMetrics || energyMetrics.length === 0) {
    console.error('❌ No energy metrics found');
    return;
  }

  console.log(`✅ Found ${energyMetrics.length} energy metrics\n`);

  energyMetrics.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.name} (${m.category}) - ${m.unit}`);
  });

  // Step 2: Delete existing 2025 energy forecasts
  console.log('\n\n🗑️  Step 2: Deleting old 2025 energy forecasts...\n');

  const energyMetricIds = energyMetrics.map(m => m.id);

  const { error: deleteError, count } = await supabase
    .from('metrics_data')
    .delete({ count: 'exact' })
    .eq('organization_id', organizationId)
    .in('metric_id', energyMetricIds)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  if (deleteError) {
    console.error('❌ Error deleting old forecasts:', deleteError);
    return;
  }

  console.log(`✅ Deleted ${count || 0} old energy forecast records\n`);

  // Step 3: Generate forecasts for each energy metric
  console.log('🤖 Step 3: Generating energy consumption forecasts...\n');

  let totalForecasts = 0;
  const forecastsToInsert: any[] = [];
  let metricsProcessed = 0;

  for (const metric of energyMetrics) {
    metricsProcessed++;

    // Fetch historical CONSUMPTION data (value field, not emissions) from 2022-2024
    const { data: historicalData } = await supabase
      .from('metrics_data')
      .select('metric_id, site_id, period_start, value, unit')
      .eq('organization_id', organizationId)
      .eq('metric_id', metric.id)
      .gte('period_start', '2022-01-01')
      .lt('period_start', '2025-01-01')
      .order('period_start', { ascending: true });

    if (!historicalData || historicalData.length < 12) {
      continue; // Need at least 12 months
    }

    // Deduplicate
    const seen = new Set<string>();
    const uniqueData = historicalData.filter(r => {
      const key = `${r.metric_id}|${r.period_start}|${r.site_id || 'null'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Group by site
    const bySite = new Map<string, any[]>();
    uniqueData.forEach(record => {
      const siteKey = record.site_id || 'null';
      if (!bySite.has(siteKey)) {
        bySite.set(siteKey, []);
      }
      bySite.get(siteKey)!.push(record);
    });

    // Generate forecast for each site
    for (const [siteId, siteData] of bySite.entries()) {
      if (siteData.length < 12) continue;

      // Group by month - USE VALUE (actual consumption), NOT emissions!
      const monthlyData = new Map<string, number>();
      siteData.forEach(r => {
        const month = r.period_start.substring(0, 7);
        const consumption = r.value || 0;  // ✅ CORRECT: Use actual consumption value
        monthlyData.set(month, (monthlyData.get(month) || 0) + consumption);
      });

      const months = Array.from(monthlyData.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, consumption]) => ({ month, emissions: consumption })); // Note: 'emissions' field name is just for the forecaster

      if (months.length < 12) continue;

      // Generate forecast for all of 2025 (12 months)
      try {
        const forecast = EnterpriseForecast.forecast(months, 12, false);

        // Create forecast records for Jan-Dec 2025
        const forecastMonths = [
          '2025-01-01', '2025-02-01', '2025-03-01', '2025-04-01',
          '2025-05-01', '2025-06-01', '2025-07-01', '2025-08-01',
          '2025-09-01', '2025-10-01', '2025-11-01', '2025-12-01'
        ];

        forecast.forecasted.forEach((forecastedConsumption, i) => {
          const actualSiteId = siteId === 'null' ? null : siteId;

          forecastsToInsert.push({
            organization_id: organizationId,
            metric_id: metric.id,
            site_id: actualSiteId,
            period_start: forecastMonths[i],
            period_end: new Date(new Date(forecastMonths[i]).setMonth(new Date(forecastMonths[i]).getMonth() + 1)).toISOString().split('T')[0],
            value: forecastedConsumption,  // ✅ CORRECT: Store actual consumption (kWh, liters, m³)
            co2e_emissions: null,  // ✅ Let database trigger calculate this from value × emission_factor
            unit: metric.unit,
            metadata: {
              forecast_method: forecast.method,
              confidence_lower: forecast.confidence.lower[i],
              confidence_upper: forecast.confidence.upper[i],
              r2: forecast.metadata.r2,
              trend_slope: forecast.metadata.trendSlope,
              improved_model: true,
              outlier_detection: true,
              dampening: 0.95,
              training_period: '2022-2024',
              forecast_type: 'energy_consumption',
              generated_at: new Date().toISOString()
            }
          });

          totalForecasts++;
        });
      } catch (error) {
        console.error(`⚠️  Error forecasting ${metric.name} for site ${siteId}:`, error);
      }
    }

    // Progress update every 5 metrics
    if (metricsProcessed % 5 === 0) {
      console.log(`   Processed ${metricsProcessed}/${energyMetrics.length} energy metrics...`);
    }
  }

  console.log(`\n✅ Generated ${totalForecasts} energy forecast records\n`);

  // Step 4: Insert forecasts in batches
  console.log('💾 Step 4: Inserting energy forecasts into database...\n');
  console.log('⚠️  Note: Database trigger will calculate CO2e emissions from consumption values\n');

  const batchSize = 100;
  for (let i = 0; i < forecastsToInsert.length; i += batchSize) {
    const batch = forecastsToInsert.slice(i, i + batchSize);
    const { error: insertError } = await supabase
      .from('metrics_data')
      .insert(batch);

    if (insertError) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, insertError);
    } else {
      console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} records)`);
    }
  }

  console.log('\n🎉 Energy forecast regeneration complete!\n');
  console.log('Summary:');
  console.log(`  Old forecasts deleted: ${count || 0}`);
  console.log(`  New forecasts created: ${totalForecasts}`);
  console.log(`  Training period: 2022-2024`);
  console.log(`  Forecast period: Jan-Dec 2025 (12 months)`);
  console.log(`  Forecast type: Energy CONSUMPTION (not emissions)`);
  console.log(`  Emissions calculation: Automatic via database trigger`);
  console.log(`  Model improvements:`);
  console.log(`    ✓ Outlier detection (MAD-based)`);
  console.log(`    ✓ Longer trend window (24-36 months)`);
  console.log(`    ✓ Trend dampening (φ=0.95)`);
  console.log(`    ✓ Robust statistics`);
}

regenerateEnergyForecasts().catch(console.error);
