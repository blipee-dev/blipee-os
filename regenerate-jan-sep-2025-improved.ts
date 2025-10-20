/**
 * Regenerate Jan-Sep 2025 forecasts using IMPROVED model
 *
 * Improvements:
 * - Outlier detection (MAD-based)
 * - Longer trend window (24-36 months)
 * - Trend dampening (φ=0.95)
 * - Robust statistics
 * - Full historical data from 2022-2024
 */

import { createClient } from '@supabase/supabase-js';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function regenerateJanSep2025() {
  console.log('🔄 Regenerating Jan-Sep 2025 Forecasts with IMPROVED Model\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Step 1: Delete existing Jan-Sep 2025 data
  console.log('🗑️  Step 1: Deleting old Jan-Sep 2025 data...');
  const { error: deleteError, count } = await supabase
    .from('metrics_data')
    .delete({ count: 'exact' })
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2025-10-01');

  if (deleteError) {
    console.error('❌ Error deleting old data:', deleteError);
    return;
  }

  console.log(`✅ Deleted ${count || 0} old records\n`);

  // Step 2: Get all metrics
  console.log('📋 Step 2: Fetching all metrics...');
  const { data: metrics, error: metricsError } = await supabase
    .from('metrics_catalog')
    .select('*');

  if (metricsError || !metrics) {
    console.error('❌ Error fetching metrics:', metricsError);
    return;
  }

  console.log(`✅ Found ${metrics.length} metrics\n`);

  // Step 3: Get all sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', organizationId);

  console.log(`✅ Found ${sites?.length || 0} sites\n`);

  // Step 4: Generate forecasts for each metric
  console.log('🤖 Step 3: Generating forecasts with IMPROVED model...\n');

  let totalForecasts = 0;
  const forecastsToInsert: any[] = [];
  let metricsProcessed = 0;

  for (const metric of metrics) {
    metricsProcessed++;

    // Fetch historical data from 2022-2024 ONLY (not including 2025)
    const { data: historicalData } = await supabase
      .from('metrics_data')
      .select('metric_id, site_id, period_start, value, co2e_emissions')
      .eq('organization_id', organizationId)
      .eq('metric_id', metric.id)
      .gte('period_start', '2022-01-01')
      .lt('period_start', '2025-01-01')  // Only 2022-2024
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

      // Group by month
      const monthlyData = new Map<string, number>();
      siteData.forEach(r => {
        const month = r.period_start.substring(0, 7);
        const value = r.co2e_emissions || r.value || 0;
        monthlyData.set(month, (monthlyData.get(month) || 0) + value);
      });

      const months = Array.from(monthlyData.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, emissions]) => ({ month, emissions }));

      if (months.length < 12) continue;

      // Generate forecast for Jan-Sep 2025 (9 months)
      try {
        const forecast = EnterpriseForecast.forecast(months, 9, false);

        // Create forecast records for Jan-Sep 2025
        const forecastMonths = [
          '2025-01-01', '2025-02-01', '2025-03-01',
          '2025-04-01', '2025-05-01', '2025-06-01',
          '2025-07-01', '2025-08-01', '2025-09-01'
        ];

        forecast.forecasted.forEach((value, i) => {
          const actualSiteId = siteId === 'null' ? null : siteId;

          forecastsToInsert.push({
            organization_id: organizationId,
            metric_id: metric.id,
            site_id: actualSiteId,
            period_start: forecastMonths[i],
            period_end: new Date(new Date(forecastMonths[i]).setMonth(new Date(forecastMonths[i]).getMonth() + 1)).toISOString().split('T')[0],
            value: value,
            co2e_emissions: value,  // Trigger will preserve this
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
              generated_at: new Date().toISOString()
            }
          });

          totalForecasts++;
        });
      } catch (error) {
        console.error(`⚠️  Error forecasting ${metric.name} for site ${siteId}:`, error);
      }
    }

    // Progress update every 20 metrics
    if (metricsProcessed % 20 === 0) {
      console.log(`   Processed ${metricsProcessed}/${metrics.length} metrics...`);
    }
  }

  console.log(`\n✅ Generated ${totalForecasts} forecast records\n`);

  // Step 5: Insert forecasts in batches
  console.log('💾 Step 4: Inserting new forecasts into database...\n');

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

  console.log('\n🎉 Jan-Sep 2025 forecast regeneration complete!\n');
  console.log('Summary:');
  console.log(`  Old records deleted: ${count || 0}`);
  console.log(`  New forecasts created: ${totalForecasts}`);
  console.log(`  Training period: 2022-2024 (36 months)`);
  console.log(`  Forecast period: Jan-Sep 2025 (9 months)`);
  console.log(`  Model improvements:`);
  console.log(`    ✓ Outlier detection (MAD-based)`);
  console.log(`    ✓ Longer trend window (24-36 months)`);
  console.log(`    ✓ Trend dampening (φ=0.95)`);
  console.log(`    ✓ Robust statistics`);
  console.log(`    ✓ Full historical data (2022-2024)`);
}

regenerateJanSep2025().catch(console.error);
