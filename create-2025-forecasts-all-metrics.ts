import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

// SBTi reduction rate: 4.2% annual reduction
const REDUCTION_RATE = 0.042;

async function create2025ForecastsForAllMetrics() {
  console.log('🔄 Creating 2025 Forecasts for All Metrics\n');
  console.log('='.repeat(80));

  try {
    // Get all metrics with 2024 data
    const { data: data2024, error: error2024 } = await supabase
      .from('metrics_data')
      .select('metric_id, period_start, value, site_id')
      .eq('organization_id', organizationId)
      .gte('period_start', '2024-01-01')
      .lte('period_start', '2024-12-31')
      .order('period_start', { ascending: true });

    if (error2024) {
      console.error('❌ Error fetching 2024 data:', error2024);
      return;
    }

    if (!data2024 || data2024.length === 0) {
      console.log('❌ No 2024 data found');
      return;
    }

    console.log(`✅ Found ${data2024.length} records in 2024`);

    // Get metric details
    const { data: metricsInfo } = await supabase
      .from('metrics_catalog')
      .select('id, code, name, category, unit, scope');

    if (!metricsInfo) {
      console.log('❌ No metrics catalog found');
      return;
    }

    // Check which metrics already have 2025 data
    const { data: data2025Existing } = await supabase
      .from('metrics_data')
      .select('metric_id')
      .eq('organization_id', organizationId)
      .gte('period_start', '2025-01-01')
      .lte('period_start', '2025-12-31');

    const metricsWithForecast = new Set((data2025Existing || []).map(d => d.metric_id));

    // Group 2024 data by metric, site, and month
    const metricGroups = new Map();

    data2024.forEach(record => {
      const metric = metricsInfo.find(m => m.id === record.metric_id);
      if (!metric) return;

      // Skip if already has 2025 forecast
      if (metricsWithForecast.has(record.metric_id)) {
        return;
      }

      const month = record.period_start.substring(0, 7);
      const key = `${record.metric_id}|${record.site_id || 'null'}|${month}`;

      if (!metricGroups.has(key)) {
        metricGroups.set(key, {
          metric_id: record.metric_id,
          metric_name: metric.name,
          category: metric.category,
          unit: metric.unit,
          scope: metric.scope,
          site_id: record.site_id,
          month: month,
          values: []
        });
      }

      metricGroups.get(key).values.push(parseFloat(record.value) || 0);
    });

    console.log(`\n📊 Found ${metricGroups.size} unique metric/site/month combinations to forecast\n`);

    const forecastRecords = [];
    const monthsToForecast = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09'];

    // Create forecasts for each metric/site combination
    metricGroups.forEach((group, key) => {
      const monthNum = parseInt(group.month.substring(5, 7));
      const avgValue = group.values.reduce((sum, v) => sum + v, 0) / group.values.length;

      // Apply reduction rate (4.2% reduction from 2024 to 2025)
      const forecastValue = avgValue * (1 - REDUCTION_RATE);

      // Create forecast for corresponding 2025 month
      const month2025 = monthsToForecast[monthNum - 1];
      if (month2025) {
        forecastRecords.push({
          organization_id: organizationId,
          metric_id: group.metric_id,
          site_id: group.site_id,
          period_start: `${month2025}-01`,
          period_end: `${month2025}-${new Date(2025, monthNum, 0).getDate()}`,
          value: forecastValue.toString(),
          metadata: {
            is_forecast: true,
            forecast_method: 'linear_projection',
            reduction_rate: REDUCTION_RATE,
            base_year: 2024,
            base_month: group.month,
            base_value: avgValue,
            note: `Projected from ${group.month} with 4.2% SBTi reduction`
          }
        });
      }
    });

    console.log(`📈 Creating ${forecastRecords.length} forecast records for 2025\n`);

    // Group by category for reporting
    const byCategory = new Map();
    forecastRecords.forEach(record => {
      const metric = metricsInfo.find(m => m.id === record.metric_id);
      if (!metric) return;

      if (!byCategory.has(metric.category)) {
        byCategory.set(metric.category, []);
      }
      byCategory.get(metric.category).push({ ...record, metric_name: metric.name });
    });

    // Insert forecasts in batches of 100
    const batchSize = 100;
    let insertedCount = 0;

    for (let i = 0; i < forecastRecords.length; i += batchSize) {
      const batch = forecastRecords.slice(i, i + batchSize);

      const { error } = await supabase
        .from('metrics_data')
        .insert(batch);

      if (error) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
      } else {
        insertedCount += batch.length;
        console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} records)`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 FORECAST SUMMARY BY CATEGORY:');
    console.log('='.repeat(80));

    byCategory.forEach((records, category) => {
      const uniqueMetrics = new Set(records.map(r => r.metric_name));
      console.log(`\n📂 ${category}: ${records.length} records (${uniqueMetrics.size} metrics)`);
      uniqueMetrics.forEach(name => {
        const count = records.filter(r => r.metric_name === name).length;
        console.log(`   ${name}: ${count} records`);
      });
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ COMPLETE');
    console.log('='.repeat(80));
    console.log(`Total records inserted: ${insertedCount}/${forecastRecords.length}`);
    console.log(`Reduction rate applied: ${(REDUCTION_RATE * 100).toFixed(1)}% (SBTi 4.2%)`);
    console.log(`Forecast period: Jan-Sep 2025`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

(async () => {
  await create2025ForecastsForAllMetrics();
  process.exit(0);
})();
