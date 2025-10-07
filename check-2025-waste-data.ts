import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check2025WasteData() {
  console.log('🔍 Checking 2025 waste data...\n');

  // Get all waste metrics
  const { data: wasteMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .eq('category', 'Waste');

  // Get 2025 waste data
  const { data: wasteData2025 } = await supabase
    .from('metrics_data')
    .select('*')
    .in('metric_id', wasteMetrics?.map(m => m.id) || [])
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31')
    .order('period_start');

  console.log(`📊 Found ${wasteData2025?.length} waste records in 2025\n`);

  if (!wasteData2025 || wasteData2025.length === 0) {
    console.log('❌ NO DATA FOR 2025!\n');
    console.log('💡 This explains why you see:');
    console.log('   - Generated: 0.8 tons (probably showing 2024 data or last month)');
    console.log('   - Diverted: 0.0% (no data)');
    console.log('   - Recycling: 0.0% (no data)\n');

    console.log('🔧 Solutions:');
    console.log('   1. Change period filter to "2024" to see actual data');
    console.log('   2. OR add 2025 data to the database');
    console.log('   3. OR check if period filter is set correctly\n');
    return;
  }

  // Group by metric
  const byMetric: any = {};
  wasteData2025?.forEach(record => {
    const metric = wasteMetrics?.find(m => m.id === record.metric_id);
    if (!metric) return;

    if (!byMetric[metric.code]) {
      byMetric[metric.code] = {
        code: metric.code,
        name: metric.name,
        is_diverted: metric.is_diverted,
        is_recycling: metric.is_recycling,
        total: 0,
        count: 0
      };
    }

    byMetric[metric.code].total += parseFloat(record.value);
    byMetric[metric.code].count++;
  });

  // Calculate totals
  let totalGenerated = 0;
  let totalDiverted = 0;
  let totalRecycling = 0;
  let totalDisposal = 0;

  console.log('📋 2025 Data by metric:\n');
  Object.values(byMetric).forEach((m: any) => {
    console.log(`${m.code}: ${m.total.toFixed(2)} tons (${m.count} records)`);

    totalGenerated += m.total;
    if (m.is_diverted) {
      totalDiverted += m.total;
    }
    if (m.is_recycling) {
      totalRecycling += m.total;
    }
    if (!m.is_diverted) {
      totalDisposal += m.total;
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('📊 2025 TOTALS:');
  console.log('='.repeat(60));
  console.log(`Total Generated: ${totalGenerated.toFixed(2)} tons`);
  console.log(`Total Diverted: ${totalDiverted.toFixed(2)} tons`);
  console.log(`Total Recycling: ${totalRecycling.toFixed(2)} tons`);
  console.log(`Total Disposal: ${totalDisposal.toFixed(2)} tons`);
  console.log(`\nDiversion Rate: ${totalGenerated > 0 ? ((totalDiverted / totalGenerated) * 100).toFixed(1) : 0}%`);
  console.log(`Recycling Rate: ${totalGenerated > 0 ? ((totalRecycling / totalGenerated) * 100).toFixed(1) : 0}%`);
}

check2025WasteData();
