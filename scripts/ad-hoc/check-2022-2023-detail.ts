import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check20222023Detail() {
  console.log('🔍 Checking 2022 and 2023 detailed breakdown...\n');

  const { data: wasteMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .eq('category', 'Waste');

  for (const year of [2022, 2023]) {
    console.log(`${'='.repeat(60)}`);
    console.log(`📅 ${year} DETAIL`);
    console.log(`${'='.repeat(60)}\n`);

    const { data: wasteData } = await supabase
      .from('metrics_data')
      .select('*')
      .in('metric_id', wasteMetrics?.map(m => m.id) || [])
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`);

    const byMetric: any = {};
    wasteData?.forEach(record => {
      const metric = wasteMetrics?.find(m => m.id === record.metric_id);
      if (!metric) return;

      if (!byMetric[metric.code]) {
        byMetric[metric.code] = {
          code: metric.code,
          name: metric.name,
          is_diverted: metric.is_diverted,
          is_recycling: metric.is_recycling,
          disposal_method: metric.disposal_method,
          total: 0,
          count: 0
        };
      }

      byMetric[metric.code].total += parseFloat(record.value);
      byMetric[metric.code].count++;
    });

    Object.values(byMetric).forEach((m: any) => {
      console.log(`${m.code}`);
      console.log(`  Total: ${m.total.toFixed(2)} tons (${m.count} records)`);
      console.log(`  Diverted: ${m.is_diverted}, Recycling: ${m.is_recycling}`);
      console.log(`  Method: ${m.disposal_method}\n`);
    });

    console.log('❌ PROBLEM: Missing landfill, incineration, and e-waste for these years!\n');
  }

  console.log('💡 SOLUTION:');
  console.log('   We need to backfill disposal data (landfill/incineration) for 2022-2023');
  console.log('   using the same pattern as 2024\n');
}

check20222023Detail();
