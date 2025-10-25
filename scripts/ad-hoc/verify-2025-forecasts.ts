import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function verify2025Forecasts() {
  console.log('🔍 Verifying 2025 ML Forecasts\n');
  console.log('='.repeat(80));

  try {
    // Get all 2025 forecast data
    const { data: forecasts } = await supabase
      .from('metrics_data')
      .select('metric_id, site_id, period_start, value, unit, metadata')
      .eq('organization_id', organizationId)
      .gte('period_start', '2025-01-01')
      .lte('period_start', '2025-12-31');

    if (!forecasts || forecasts.length === 0) {
      console.log('❌ No 2025 forecasts found');
      return;
    }

    // Filter only ML forecasts
    const mlForecasts = forecasts.filter(f =>
      f.metadata && f.metadata.is_forecast === true
    );

    console.log(`\n✅ Total 2025 records: ${forecasts.length}`);
    console.log(`✅ ML forecasts: ${mlForecasts.length}\n`);

    // Get metric details
    const { data: metricsInfo } = await supabase
      .from('metrics_catalog')
      .select('id, code, name, category, unit, scope');

    if (!metricsInfo) {
      console.log('❌ No metrics catalog found');
      return;
    }

    // Group by category
    const byCategory = new Map<string, {
      metrics: Set<string>,
      sites: Set<string>,
      records: number,
      methods: Map<string, number>
    }>();

    mlForecasts.forEach(f => {
      const metric = metricsInfo.find(m => m.id === f.metric_id);
      if (!metric) return;

      if (!byCategory.has(metric.category)) {
        byCategory.set(metric.category, {
          metrics: new Set(),
          sites: new Set(),
          records: 0,
          methods: new Map()
        });
      }

      const cat = byCategory.get(metric.category)!;
      cat.metrics.add(metric.name);
      cat.sites.add(f.site_id || 'All Sites');
      cat.records++;

      const method = f.metadata?.forecast_method || 'unknown';
      cat.methods.set(method, (cat.methods.get(method) || 0) + 1);
    });

    console.log('📊 FORECAST SUMMARY BY CATEGORY:\n');
    console.log('='.repeat(80));

    byCategory.forEach((info, category) => {
      console.log(`\n📂 ${category}`);
      console.log(`   Metrics: ${info.metrics.size}`);
      console.log(`   Sites: ${info.sites.size}`);
      console.log(`   Records: ${info.records}`);
      console.log(`   Methods:`);
      info.methods.forEach((count, method) => {
        console.log(`      - ${method}: ${count} records`);
      });
    });

    // Check site-by-site aggregation
    console.log('\n' + '='.repeat(80));
    console.log('🏢 SITE AGGREGATION VERIFICATION:\n');

    const siteAggregates = mlForecasts.filter(f => f.site_id === null);
    const siteForecast = mlForecasts.filter(f => f.site_id !== null);

    console.log(`Site-specific forecasts: ${siteForecast.length}`);
    console.log(`"All Sites" aggregates: ${siteAggregates.length}`);

    // Sample verification: Check if "All Sites" equals sum of individual sites
    const sampleMetric = metricsInfo.find(m => m.name === 'Water');
    if (sampleMetric) {
      console.log(`\n✅ Sample Verification: ${sampleMetric.name}`);

      const jan2025AllSites = mlForecasts.find(f =>
        f.metric_id === sampleMetric.id &&
        f.site_id === null &&
        f.period_start === '2025-01-01'
      );

      const jan2025Sites = mlForecasts.filter(f =>
        f.metric_id === sampleMetric.id &&
        f.site_id !== null &&
        f.period_start === '2025-01-01'
      );

      if (jan2025AllSites && jan2025Sites.length > 0) {
        const sumOfSites = jan2025Sites.reduce((sum, s) => sum + parseFloat(s.value), 0);
        const allSitesValue = parseFloat(jan2025AllSites.value);
        const difference = Math.abs(allSitesValue - sumOfSites);

        console.log(`   All Sites value: ${allSitesValue.toFixed(2)} ${sampleMetric.unit}`);
        console.log(`   Sum of sites: ${sumOfSites.toFixed(2)} ${sampleMetric.unit}`);
        console.log(`   Difference: ${difference.toFixed(2)} (${(difference / allSitesValue * 100).toFixed(2)}%)`);

        if (difference < 0.01) {
          console.log(`   ✅ Aggregation verified!`);
        } else {
          console.log(`   ⚠️  Aggregation mismatch`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📈 MODEL QUALITY SUMMARY:\n');

    // Analyze model quality
    const qualityMetrics = mlForecasts
      .filter(f => f.metadata?.model_quality?.r2 !== undefined)
      .map(f => ({
        name: metricsInfo.find(m => m.id === f.metric_id)?.name,
        r2: f.metadata.model_quality.r2,
        method: f.metadata.forecast_method
      }));

    const avgR2ByMethod = new Map<string, { sum: number, count: number }>();
    qualityMetrics.forEach(q => {
      if (!avgR2ByMethod.has(q.method)) {
        avgR2ByMethod.set(q.method, { sum: 0, count: 0 });
      }
      const m = avgR2ByMethod.get(q.method)!;
      m.sum += q.r2;
      m.count++;
    });

    avgR2ByMethod.forEach((stats, method) => {
      const avgR2 = (stats.sum / stats.count * 100).toFixed(1);
      console.log(`${method}: ${avgR2}% average R² (${stats.count} models)`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`Total 2025 forecasts: ${mlForecasts.length}`);
    console.log(`Categories covered: ${byCategory.size}`);
    console.log(`Metrics forecasted: ${new Set(mlForecasts.map(f => f.metric_id)).size}`);
    console.log(`Period: Jan-Sep 2025 (9 months)`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verify2025Forecasts();
