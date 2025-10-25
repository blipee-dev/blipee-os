const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function check2023Data() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  console.log('🔍 Checking for data in 2023 (baseline year)...\n');

  // Get all metrics with data in 2023
  const { data: data2023, error: error2023 } = await supabase
    .from('metrics_data')
    .select(`
      metric_id,
      period_start,
      value,
      co2e_emissions,
      metrics_catalog (
        id,
        code,
        name,
        category,
        scope
      )
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2023-01-01')
    .lt('period_start', '2024-01-01')
    .or('value.gt.0,co2e_emissions.gt.0');

  if (error2023) {
    console.error('❌ Error:', error2023);
    return;
  }

  console.log(`Found ${data2023.length} data entries in 2023\n`);

  // Group by metric
  const metricMap = new Map();

  data2023.forEach(entry => {
    const metric = entry.metrics_catalog;
    if (!metric) return;

    const metricId = entry.metric_id;
    if (!metricMap.has(metricId)) {
      metricMap.set(metricId, {
        id: metric.id,
        name: metric.name,
        code: metric.code,
        category: metric.category,
        scope: metric.scope,
        data_points_2023: 0,
        total_emissions_2023: 0,
        earliest_date: entry.period_start
      });
    }

    const aggregated = metricMap.get(metricId);
    aggregated.data_points_2023++;
    aggregated.total_emissions_2023 += entry.co2e_emissions || 0;

    if (entry.period_start < aggregated.earliest_date) {
      aggregated.earliest_date = entry.period_start;
    }
  });

  const metrics2023 = Array.from(metricMap.values()).sort((a, b) =>
    a.category.localeCompare(b.category) || a.name.localeCompare(b.name)
  );

  console.log('📊 Metrics WITH data in 2023:\n');
  console.log('='.repeat(80));

  const byCategory = metrics2023.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {});

  Object.entries(byCategory).forEach(([category, metrics]) => {
    console.log(`\n${category} (${metrics.length} metrics):`);
    metrics.forEach(metric => {
      console.log(`  • ${metric.name}`);
      console.log(`    Code: ${metric.code}`);
      console.log(`    Scope: ${metric.scope}`);
      console.log(`    Earliest: ${metric.earliest_date}`);
      console.log(`    2023 data points: ${metric.data_points_2023}`);
      console.log(`    2023 emissions: ${metric.total_emissions_2023.toFixed(2)} tCO2e`);
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\n✅ Total: ${metrics2023.length} metrics with data in 2023`);

  // Now check what the API is detecting
  console.log('\n' + '='.repeat(80));
  console.log('🔍 Now checking what the detection API reports...\n');

  const response = await fetch(
    `http://localhost:3000/api/sustainability/baseline/detect-new-metrics?organizationId=${organizationId}&baselineYear=2023`
  );
  const apiData = await response.json();

  console.log(`API detected ${apiData.count} "new" metrics\n`);

  // Check if any of the "new" metrics actually have 2023 data
  const falsePositives = [];
  const trueNewMetrics = [];

  apiData.newMetrics.forEach(newMetric => {
    const has2023Data = metrics2023.find(m => m.id === newMetric.metric_id);

    if (has2023Data) {
      falsePositives.push({
        ...newMetric,
        data_points_2023: has2023Data.data_points_2023,
        emissions_2023: has2023Data.total_emissions_2023
      });
    } else {
      trueNewMetrics.push(newMetric);
    }
  });

  if (falsePositives.length > 0) {
    console.log('⚠️  FALSE POSITIVES - These metrics DO have 2023 data:');
    console.log('='.repeat(80));
    falsePositives.forEach(metric => {
      console.log(`\n❌ ${metric.metric_name} (${metric.category})`);
      console.log(`   API says first data: ${metric.first_data_date}`);
      console.log(`   BUT has ${metric.data_points_2023} data points in 2023!`);
      console.log(`   2023 emissions: ${metric.emissions_2023.toFixed(2)} tCO2e`);
    });
  }

  if (trueNewMetrics.length > 0) {
    console.log('\n\n✅ TRUE NEW METRICS - Started tracking after 2023:');
    console.log('='.repeat(80));
    trueNewMetrics.forEach(metric => {
      console.log(`\n✓ ${metric.metric_name} (${metric.category})`);
      console.log(`  First data: ${metric.first_data_date}`);
      console.log(`  Data points: ${metric.data_points_count}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📋 SUMMARY:');
  console.log(`  Metrics with 2023 data: ${metrics2023.length}`);
  console.log(`  API detected as "new": ${apiData.count}`);
  console.log(`  False positives: ${falsePositives.length}`);
  console.log(`  True new metrics: ${trueNewMetrics.length}`);

  if (falsePositives.length > 0) {
    console.log('\n⚠️  ISSUE FOUND: The detection query is incorrectly identifying metrics that');
    console.log('   DO have 2023 data as "new metrics". This needs to be fixed.');
  }
}

check2023Data().catch(console.error);
