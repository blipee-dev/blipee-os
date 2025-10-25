import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkMetricsData() {
  console.log('🔍 Checking metrics_data table for 2025 energy data\n');
  console.log('=' .repeat(80));

  try {
    // Get metric names
    const { data: metrics } = await supabase
      .from('metrics_catalog')
      .select('id, name, category')
      .in('name', ['Electricity', 'Purchased Cooling', 'Purchased Heating', 'EV Charging']);

    console.log('\n📊 Energy Metrics:');
    if (metrics) {
      metrics.forEach(m => {
        console.log(`   ${m.name}: ${m.id}`);
      });
    }

    // Check 2025 data
    const { data: data2025, error } = await supabase
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('period_start', '2025-01-01')
      .lte('period_start', '2025-09-30')
      .order('period_start', { ascending: true });

    if (error) {
      console.error('❌ Error:', error);
      return;
    }

    const recordCount = data2025 ? data2025.length : 0;
    console.log(`\n📈 Found ${recordCount} records for 2025 (Jan-Sep)\n`);

    if (data2025 && data2025.length > 0) {
      // Group by metric and month
      const byMetric: any = {};

      data2025.forEach(record => {
        const metric = metrics?.find(m => m.id === record.metric_id);
        const metricName = metric?.name || record.metric_id;

        if (!byMetric[metricName]) {
          byMetric[metricName] = [];
        }

        byMetric[metricName].push({
          month: record.period_start.substring(0, 7),
          value: parseFloat(record.value),
          co2e: parseFloat(record.co2e_emissions || 0),
          unit: record.unit,
          metadata: record.metadata
        });
      });

      // Display by metric
      for (const [metricName, records] of Object.entries(byMetric)) {
        console.log(`\n📊 ${metricName}`);
        console.log('   ' + '-'.repeat(70));

        const recordsArray = records as any[];
        recordsArray.forEach(r => {
          console.log(`   ${r.month}: ${(r.value / 1000).toFixed(1)} MWh | ${r.co2e.toFixed(1)} kgCO2e | Source: ${r.metadata?.source || 'N/A'}`);
        });

        const total = recordsArray.reduce((sum, r) => sum + r.value, 0);
        console.log(`   TOTAL: ${(total / 1000).toFixed(1)} MWh`);
      }

      // Monthly totals
      console.log('\n\n📅 MONTHLY TOTALS');
      console.log('   ' + '='.repeat(70));

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
          console.log(`   ${month}: ${(total as number / 1000).toFixed(1)} MWh`);
        });

    } else {
      console.log('❌ No data found for 2025!');
    }

    // Check what data exists in the table
    console.log('\n\n🔍 Checking all available data...');
    const { data: allData, count } = await supabase
      .from('metrics_data')
      .select('period_start', { count: 'exact' })
      .eq('organization_id', organizationId)
      .order('period_start', { ascending: false })
      .limit(10);

    console.log(`\n   Total records in table: ${count}`);
    console.log(`   Last 10 records:`);
    if (allData) {
      allData.forEach(d => {
        console.log(`      ${d.period_start}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkMetricsData();
