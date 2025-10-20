import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMonthlyBreakdown() {
  console.log('🔍 Checking 2025 Monthly Energy Breakdown...\n');

  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Get energy metrics
  const { data: energyMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .in('category', ['Electricity', 'Purchased Energy']);

  if (!energyMetrics) {
    console.error('❌ No energy metrics found');
    return;
  }

  const metricIds = energyMetrics.map(m => m.id);

  // Get all 2025 data
  const { data: allData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', orgId)
    .in('metric_id', metricIds)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2025-11-01')
    .order('period_start', { ascending: true });

  if (!allData || allData.length === 0) {
    console.log('❌ No data found for 2025');
    return;
  }

  console.log(`📊 Total records found: ${allData.length}\n`);

  // Group by month
  const monthlyData: { [key: string]: any[] } = {};

  allData.forEach(record => {
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = [];
    }

    monthlyData[monthKey].push(record);
  });

  // Print monthly breakdown
  const months = Object.keys(monthlyData).sort();

  months.forEach(monthKey => {
    const records = monthlyData[monthKey];
    const totalValue = records.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0);
    const uniqueMetrics = new Set(records.map(r => r.metric_id)).size;
    const uniqueRecords = new Set(records.map(r => r.id)).size;

    console.log(`📅 ${monthKey}:`);
    console.log(`   Records: ${records.length} (${uniqueRecords} unique)`);
    console.log(`   Metrics: ${uniqueMetrics}`);
    console.log(`   Total Energy: ${totalValue.toFixed(2)} kWh`);

    // Check for duplicates
    const duplicates = records.length - uniqueRecords;
    if (duplicates > 0) {
      console.log(`   ⚠️  DUPLICATES: ${duplicates} duplicate records found!`);

      // Show duplicate details
      const recordCounts = new Map<string, number>();
      records.forEach(r => {
        const key = `${r.metric_id}|${r.period_start}|${r.site_id || 'null'}`;
        recordCounts.set(key, (recordCounts.get(key) || 0) + 1);
      });

      recordCounts.forEach((count, key) => {
        if (count > 1) {
          console.log(`      - ${key}: ${count} copies`);
        }
      });
    }

    // Show metric names
    const metricNames = records.map(r => {
      const metric = energyMetrics.find(m => m.id === r.metric_id);
      return metric?.name || r.metric_id;
    });
    const uniqueMetricNames = [...new Set(metricNames)];
    console.log(`   Metrics: ${uniqueMetricNames.join(', ')}`);
    console.log('');
  });

  console.log('\n📊 Summary:');
  console.log(`Total months with data: ${months.length}`);
  console.log(`Expected months (Jan-Oct): 10`);
  console.log(`Missing months: ${10 - months.length}`);
}

checkMonthlyBreakdown();
