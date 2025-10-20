import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkNovDecData() {
  console.log('🔍 Checking for Nov-Dec 2025 Energy Data...\n');

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

  // Get Nov-Dec 2025 data
  const { data: novDecData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', orgId)
    .in('metric_id', metricIds)
    .gte('period_start', '2025-11-01')
    .lte('period_start', '2025-12-31')
    .order('period_start', { ascending: true });

  console.log(`📊 Nov-Dec 2025 records found: ${novDecData?.length || 0}\n`);

  if (novDecData && novDecData.length > 0) {
    const totalValue = novDecData.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0);
    console.log(`💡 Total Energy (Nov-Dec): ${totalValue.toFixed(2)} kWh\n`);

    // Group by month
    const byMonth: any = {};
    novDecData.forEach(r => {
      const date = new Date(r.period_start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = [];
      }
      byMonth[monthKey].push(r);
    });

    Object.keys(byMonth).sort().forEach(monthKey => {
      const records = byMonth[monthKey];
      const total = records.reduce((sum: number, r: any) => sum + (parseFloat(r.value) || 0), 0);

      console.log(`📅 ${monthKey}:`);
      console.log(`   Records: ${records.length}`);
      console.log(`   Total: ${total.toFixed(2)} kWh`);

      // Check if any have metadata indicating forecast
      const forecastRecords = records.filter((r: any) =>
        r.metadata?.is_forecast ||
        r.metadata?.forecast ||
        r.is_forecast
      );

      if (forecastRecords.length > 0) {
        console.log(`   ⚠️  FORECAST RECORDS: ${forecastRecords.length}`);
      }

      console.log('');
    });
  } else {
    console.log('✅ No Nov-Dec data found (as expected for current period)');
  }

  // Also check total with date filter matching what API uses
  const { data: allData } = await supabase
    .from('metrics_data')
    .select('value')
    .eq('organization_id', orgId)
    .in('metric_id', metricIds)
    .gte('period_start', '2025-01-01')
    .lte('period_start', '2025-12-31'); // This is what API uses!

  const apiTotal = allData?.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0) || 0;
  console.log(`\n📊 Total using API filter (start >= 2025-01-01 AND start <= 2025-12-31): ${apiTotal.toFixed(2)} kWh`);
}

checkNovDecData();
