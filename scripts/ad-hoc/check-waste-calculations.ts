import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkWasteCalculations() {
  console.log('🔍 Checking waste calculations for 2024...\n');

  // Get all waste metrics with their metadata
  const { data: wasteMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .eq('category', 'Waste');

  console.log(`📊 Found ${wasteMetrics?.length} waste metrics\n`);

  // Get 2024 waste data
  const { data: wasteData } = await supabase
    .from('metrics_data')
    .select('*')
    .in('metric_id', wasteMetrics?.map(m => m.id) || [])
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31')
    .order('period_start');

  console.log(`📈 Found ${wasteData?.length} waste records in 2024\n`);

  // Group by metric
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
        material_type: metric.waste_material_type,
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

  console.log('📋 Breakdown by metric:\n');
  Object.values(byMetric).forEach((m: any) => {
    console.log(`${m.code}`);
    console.log(`  Name: ${m.name}`);
    console.log(`  Total: ${m.total.toFixed(2)} tons (${m.count} records)`);
    console.log(`  Material: ${m.material_type || 'not set'}`);
    console.log(`  Method: ${m.disposal_method || 'not set'}`);
    console.log(`  Is Diverted: ${m.is_diverted}`);
    console.log(`  Is Recycling: ${m.is_recycling}\n`);

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
  console.log('📊 TOTALS FOR 2024:');
  console.log('='.repeat(60));
  console.log(`Total Generated: ${totalGenerated.toFixed(2)} tons`);
  console.log(`Total Diverted: ${totalDiverted.toFixed(2)} tons`);
  console.log(`Total Recycling: ${totalRecycling.toFixed(2)} tons`);
  console.log(`Total Disposal: ${totalDisposal.toFixed(2)} tons`);
  console.log(`\nDiversion Rate: ${((totalDiverted / totalGenerated) * 100).toFixed(1)}%`);
  console.log(`Recycling Rate: ${((totalRecycling / totalGenerated) * 100).toFixed(1)}%`);
  console.log(`Disposal Rate: ${((totalDisposal / totalGenerated) * 100).toFixed(1)}%`);

  console.log('\n💡 Expected values:');
  console.log('  - Diversion Rate should be ~50% (recycling + composting)');
  console.log('  - Recycling Rate should be ~35% (recycling only)');
  console.log('  - Disposal Rate should be ~50% (landfill + ewaste)');
}

checkWasteCalculations();
