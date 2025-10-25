const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function getMetricsWithData() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  console.log('🔍 Querying metrics with data values > 0...\n');

  // Get all metrics_data entries with value > 0 or co2e_emissions > 0
  const { data: metricsData, error } = await supabase
    .from('metrics_data')
    .select(`
      metric_id,
      value,
      co2e_emissions,
      metrics_catalog (
        id,
        code,
        name,
        category,
        scope,
        unit
      )
    `)
    .eq('organization_id', organizationId)
    .or('value.gt.0,co2e_emissions.gt.0');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  // Aggregate by metric_id
  const metricMap = new Map();

  metricsData.forEach(entry => {
    const metric = entry.metrics_catalog;
    if (!metric) return;

    const metricId = entry.metric_id;

    if (!metricMap.has(metricId)) {
      metricMap.set(metricId, {
        id: metric.id,
        code: metric.code,
        name: metric.name,
        category: metric.category,
        scope: metric.scope,
        unit: metric.unit,
        data_points: 0,
        total_value: 0,
        total_emissions: 0
      });
    }

    const aggregated = metricMap.get(metricId);
    aggregated.data_points++;
    aggregated.total_value += entry.value || 0;
    aggregated.total_emissions += entry.co2e_emissions || 0;
  });

  // Convert to array and sort
  const metrics = Array.from(metricMap.values())
    .sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

  console.log(`✅ Found ${metrics.length} metrics with data:\n`);

  // Group by category for better readability
  const byCategory = metrics.reduce((acc, metric) => {
    if (!acc[metric.category]) {
      acc[metric.category] = [];
    }
    acc[metric.category].push(metric);
    return acc;
  }, {});

  Object.entries(byCategory).forEach(([category, categoryMetrics]) => {
    console.log(`\n📊 ${category} (${categoryMetrics.length} metrics):`);
    console.log('─'.repeat(80));
    categoryMetrics.forEach(metric => {
      console.log(`  ${metric.name}`);
      console.log(`    ID: ${metric.id}`);
      console.log(`    Code: ${metric.code}`);
      console.log(`    Scope: ${metric.scope}`);
      console.log(`    Unit: ${metric.unit}`);
      console.log(`    Data Points: ${metric.data_points}`);
      console.log(`    Total Value: ${metric.total_value.toFixed(2)} ${metric.unit}`);
      console.log(`    Total Emissions: ${metric.total_emissions.toFixed(2)} tCO2e`);
      console.log('');
    });
  });

  console.log('\n📋 Summary:');
  console.log('─'.repeat(80));
  Object.entries(byCategory).forEach(([category, categoryMetrics]) => {
    console.log(`  ${category}: ${categoryMetrics.length} metrics`);
  });
  console.log(`\n  Total: ${metrics.length} metrics with data`);
}

getMetricsWithData().catch(console.error);
