/**
 * Check what metrics are included in Scope 2 "Purchased Electricity" 83.8 tCO2e
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.com',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function checkScope2Breakdown() {
  console.log('🔍 Checking Scope 2 breakdown for 2025...\n');

  const { data, error } = await supabase
    .from('metrics_data')
    .select(`
      co2e_emissions,
      value,
      period_start,
      metrics_catalog!inner(
        name,
        category,
        subcategory,
        scope,
        unit
      )
    `)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .eq('metrics_catalog.scope', 'scope_2')
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`✅ Found ${data.length} Scope 2 records for 2025\n`);

  // Group by metric name
  const metricMap = new Map();

  data.forEach(record => {
    const metricName = record.metrics_catalog.name;
    const category = record.metrics_catalog.category;
    const subcategory = record.metrics_catalog.subcategory;
    const emissions = (record.co2e_emissions || 0) / 1000; // Convert to tCO2e
    const value = record.value || 0;
    const unit = record.metrics_catalog.unit;

    const key = `${metricName} (${category})`;

    if (!metricMap.has(key)) {
      metricMap.set(key, {
        name: metricName,
        category,
        subcategory,
        unit,
        totalValue: 0,
        totalEmissions: 0,
        records: 0
      });
    }

    const metric = metricMap.get(key);
    metric.totalValue += value;
    metric.totalEmissions += emissions;
    metric.records++;
  });

  // Sort by emissions (highest first)
  const metrics = Array.from(metricMap.values())
    .sort((a, b) => b.totalEmissions - a.totalEmissions);

  console.log('📊 Scope 2 Metrics Breakdown:\n');
  console.log('Metric Name                Category              Value         Emissions    Records');
  console.log('─'.repeat(95));

  let totalEmissions = 0;
  metrics.forEach(metric => {
    const name = metric.name.padEnd(25);
    const category = metric.category.padEnd(20);
    const value = `${metric.totalValue.toFixed(1)} ${metric.unit}`.padEnd(12);
    const emissions = `${metric.totalEmissions.toFixed(1)} tCO2e`.padEnd(12);
    const records = metric.records.toString().padEnd(8);

    console.log(`${name} ${category} ${value} ${emissions} ${records}`);
    totalEmissions += metric.totalEmissions;
  });

  console.log('─'.repeat(95));
  console.log(`${'TOTAL'.padEnd(45)}                      ${totalEmissions.toFixed(1)} tCO2e`);

  console.log('\n✅ Analysis complete!');
  console.log(`\nThe "purchased_electricity: 83.8 tCO2e" includes ALL these metrics combined.`);
}

checkScope2Breakdown();
