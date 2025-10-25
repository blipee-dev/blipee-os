require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const currentYear = 2025;

  console.log('🔍 Checking 2025 data distribution...\n');

  // Check all 2025 data
  const { data: allData, error } = await supabase
    .from('metrics_data')
    .select('period_start, metric_id, co2e_emissions')
    .eq('organization_id', organizationId)
    .gte('period_start', `${currentYear}-01-01`)
    .lte('period_start', `${currentYear}-12-31`);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`✅ Found ${allData.length} total records for 2025\n`);

  // Group by period
  const byPeriod = {};
  allData.forEach(row => {
    if (!byPeriod[row.period_start]) {
      byPeriod[row.period_start] = {
        count: 0,
        uniqueMetrics: new Set(),
        totalEmissions: 0
      };
    }
    byPeriod[row.period_start].count++;
    byPeriod[row.period_start].uniqueMetrics.add(row.metric_id);
    byPeriod[row.period_start].totalEmissions += (row.co2e_emissions || 0);
  });

  console.log('📊 Data by period:');
  Object.keys(byPeriod).sort().forEach(period => {
    const data = byPeriod[period];
    console.log(`  ${period}: ${data.count} records, ${data.uniqueMetrics.size} metrics, ${data.totalEmissions.toFixed(2)} tCO2e`);
  });

  // Check unique metrics across all of 2025
  const uniqueMetrics = new Set();
  allData.forEach(row => uniqueMetrics.add(row.metric_id));
  console.log(`\n🔑 Total unique metrics in 2025: ${uniqueMetrics.size}`);
  console.log(`📊 Total emissions in 2025: ${allData.reduce((sum, row) => sum + (row.co2e_emissions || 0), 0).toFixed(2)} tCO2e`);

  // Now test the exact query used in replanning
  console.log('\n\n🧪 Testing exact replanning query...\n');

  const { data: metricsWithData, error: queryError } = await supabase
    .from('metrics_data')
    .select(`
      metric_id,
      metrics_catalog (
        id,
        name,
        code,
        unit,
        scope,
        category,
        subcategory
      )
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', `${currentYear}-01-01`)
    .lte('period_start', `${currentYear}-12-31`);

  if (queryError) {
    console.error('❌ Query error:', queryError);
    return;
  }

  console.log(`✅ Query returned ${metricsWithData.length} rows`);

  // Deduplicate
  const uniqueMetricsMap = new Map();
  metricsWithData.forEach((item) => {
    if (item.metrics_catalog && !uniqueMetricsMap.has(item.metric_id)) {
      uniqueMetricsMap.set(item.metric_id, {
        id: item.metric_id,
        code: item.metrics_catalog.code
      });
    }
  });

  const metrics = Array.from(uniqueMetricsMap.values());
  console.log(`✅ After deduplication: ${metrics.length} unique metrics\n`);

  // Test querying each metric
  console.log('🧪 Testing queries for first 5 metrics...\n');
  for (let i = 0; i < Math.min(5, metrics.length); i++) {
    const metric = metrics[i];

    const { data: metricData, error: metricError } = await supabase
      .from('metrics_data')
      .select('value, co2e_emissions')
      .eq('organization_id', organizationId)
      .eq('metric_id', metric.id)
      .gte('period_start', `${currentYear}-01-01`)
      .lte('period_start', `${currentYear}-12-31`);

    const emissions = (metricData || []).reduce((sum, d) => sum + (d.co2e_emissions || 0), 0);

    console.log(`  📊 Metric ${metric.code} (${metric.id}):`);
    console.log(`      Found ${metricData?.length || 0} data points`);
    console.log(`      Total emissions: ${emissions.toFixed(2)} tCO2e`);
  }
}

checkData().catch(console.error);
