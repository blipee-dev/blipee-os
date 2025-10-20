import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function debugDashboardQuery() {
  console.log('🔍 Debugging Energy Dashboard Query\n');
  console.log('=' .repeat(80));

  // Simulate what the dashboard does - get energy metrics
  const { data: energyMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .in('category', ['Purchased Energy', 'Electricity']);

  const metricCount = energyMetrics ? energyMetrics.length : 0;
  console.log('\n📊 Energy Metrics in Dashboard Query:');
  console.log(`Found ${metricCount} metrics\n`);

  if (energyMetrics) {
    energyMetrics.forEach(m => {
      console.log(`  - ${m.name} (${m.category}) - ID: ${m.id}`);
    });
  }

  const metricIds = energyMetrics ? energyMetrics.map(m => m.id) : [];

  // Query 2025 data like the dashboard would
  const { data: data2025 } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', organizationId)
    .in('metric_id', metricIds)
    .gte('period_start', '2025-01-01')
    .lte('period_start', '2025-12-31')
    .order('period_start', { ascending: true });

  const recordCount = data2025 ? data2025.length : 0;
  console.log(`\n📈 Data for 2025: ${recordCount} records\n`);

  if (data2025 && data2025.length > 0) {
    // Group by metric and month
    const bySource: any = {};

    data2025.forEach(record => {
      const metric = energyMetrics?.find(m => m.id === record.metric_id);
      const sourceName = metric?.name || 'Unknown';
      const month = record.period_start.substring(0, 7);

      if (!bySource[sourceName]) {
        bySource[sourceName] = {};
      }

      if (!bySource[sourceName][month]) {
        bySource[sourceName][month] = 0;
      }

      bySource[sourceName][month] += parseFloat(record.value);
    });

    // Display monthly breakdown
    for (const [source, months] of Object.entries(bySource)) {
      console.log(`\n${source}:`);
      const monthData = months as any;
      let total = 0;

      Object.entries(monthData)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([month, value]) => {
          console.log(`  ${month}: ${((value as number) / 1000).toFixed(1)} MWh`);
          total += value as number;
        });

      console.log(`  TOTAL: ${(total / 1000).toFixed(1)} MWh`);
    }

    // Calculate monthly totals
    console.log('\n\n📅 Monthly Totals (all sources):');
    const monthlyTotals: any = {};

    data2025.forEach(record => {
      const month = record.period_start.substring(0, 7);
      if (!monthlyTotals[month]) {
        monthlyTotals[month] = 0;
      }
      monthlyTotals[month] += parseFloat(record.value);
    });

    Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, total]) => {
        console.log(`  ${month}: ${((total as number) / 1000).toFixed(1)} MWh`);
      });

  } else {
    console.log('❌ No data found for 2025!');
  }

  console.log('\n' + '='.repeat(80));
}

debugDashboardQuery();
