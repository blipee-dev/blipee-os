/**
 * Regenerate 2025 Waste Forecasts BY SOURCE
 *
 * IMPORTANT: This forecasts actual waste volume (tons) for each waste type,
 * and lets the database trigger calculate emissions based on emission factors.
 */

import { createClient } from '@supabase/supabase-js';
import { EnterpriseForecast } from './src/lib/forecasting/enterprise-forecaster';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function regenerateWasteForecasts() {
  console.log('🗑️  Regenerating 2025 Waste Forecasts BY SOURCE\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Step 1: Get all waste-related metrics
  console.log('📋 Step 1: Fetching waste metrics...\n');

  // Get ALL metrics first, then filter by name (excluding wastewater)
  const { data: allMetrics } = await supabase
    .from('metrics_catalog')
    .select('*');

  const wasteMetrics = allMetrics?.filter(m => {
    const nameLC = (m.name || '').toLowerCase();
    const categoryLC = (m.category || '').toLowerCase();

    // Include waste but exclude wastewater (already handled)
    return (nameLC.includes('waste') || categoryLC.includes('waste')) &&
           !nameLC.includes('wastewater') &&
           categoryLC !== 'Purchased Goods & Services'; // Exclude wastewater metrics
  }) || [];

  if (!wasteMetrics || wasteMetrics.length === 0) {
    console.error('❌ No waste metrics found');
    return;
  }

  console.log(`✅ Found ${wasteMetrics.length} waste metrics\n`);

  wasteMetrics.forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.name} (${m.category}) - ${m.unit}`);
  });

  // Step 2: Delete existing 2025 waste forecasts
  console.log('\n\n🗑️  Step 2: Deleting old 2025 waste forecasts...\n');

  const wasteMetricIds = wasteMetrics.map(m => m.id);

  const { error: deleteError, count } = await supabase
    .from('metrics_data')
    .delete({ count: 'exact' })
    .eq('organization_id', organizationId)
    .in('metric_id', wasteMetricIds)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  if (deleteError) {
    console.error('❌ Error deleting old forecasts:', deleteError);
    return;
  }

  console.log(`✅ Deleted ${count || 0} old waste forecast records\n`);

  // Step 3: Generate forecasts for each waste metric
  console.log('🤖 Step 3: Generating waste volume forecasts...\n');

  let totalForecasts = 0;
  const forecastsToInsert: any[] = [];
  let metricsProcessed = 0;

  for (const metric of wasteMetrics) {
    metricsProcessed++;

    // Fetch historical VOLUME data (value field, not emissions) from 2022-2024
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

      // Group by month - USE VALUE (actual waste volume), NOT emissions!
      const monthlyData = new Map<string, number>();
      siteData.forEach(r => {
        const month = r.period_start.substring(0, 7);
        const volume = r.value || 0;  // ✅ CORRECT: Use actual waste volume value
        monthlyData.set(month, (monthlyData.get(month) || 0) + volume);
      });

      const months = Array.from(monthlyData.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([month, volume]) => ({ month, emissions: volume })); // Note: 'emissions' field name is just for the forecaster

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

        forecast.forecasted.forEach((forecastedVolume, i) => {
          const actualSiteId = siteId === 'null' ? null : siteId;

          forecastsToInsert.push({
            organization_id: organizationId,
            metric_id: metric.id,
            site_id: actualSiteId,
            period_start: forecastMonths[i],
            period_end: new Date(new Date(forecastMonths[i]).setMonth(new Date(forecastMonths[i]).getMonth() + 1)).toISOString().split('T')[0],
            value: forecastedVolume,  // ✅ CORRECT: Store actual waste volume (tons)
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
              forecast_type: 'waste_volume',
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
      console.log(`   Processed ${metricsProcessed}/${wasteMetrics.length} waste metrics...`);
    }
  }

  console.log(`\n✅ Generated ${totalForecasts} waste forecast records\n`);

  // Step 4: Insert forecasts in batches
  console.log('💾 Step 4: Inserting waste forecasts into database...\n');
  console.log('⚠️  Note: Database trigger will calculate CO2e emissions from volume values\n');

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

  console.log('\n🎉 Waste forecast regeneration complete!\n');
  console.log('Summary:');
  console.log(`  Old forecasts deleted: ${count || 0}`);
  console.log(`  New forecasts created: ${totalForecasts}`);
  console.log(`  Training period: 2022-2024`);
  console.log(`  Forecast period: Jan-Dec 2025 (12 months)`);
  console.log(`  Forecast type: Waste VOLUME (not emissions)`);
  console.log(`  Emissions calculation: Automatic via database trigger`);
  console.log(`  Model improvements:`);
  console.log(`    ✓ Outlier detection (MAD-based)`);
  console.log(`    ✓ Longer trend window (24-36 months)`);
  console.log(`    ✓ Trend dampening (φ=0.95)`);
  console.log(`    ✓ Robust statistics`);
}

regenerateWasteForecasts().catch(console.error);
