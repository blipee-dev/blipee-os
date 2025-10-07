import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkAllYearsWaste() {
  console.log('🔍 Checking waste data across ALL years...\n');

  // Get all waste metrics
  const { data: wasteMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .eq('category', 'Waste');

  for (const year of [2022, 2023, 2024, 2025]) {
    const { data: wasteData } = await supabase
      .from('metrics_data')
      .select('*')
      .in('metric_id', wasteMetrics?.map(m => m.id) || [])
      .gte('period_start', `${year}-01-01`)
      .lte('period_end', `${year}-12-31`);

    // Calculate totals
    let totalGenerated = 0;
    let totalDiverted = 0;
    let totalRecycling = 0;
    let totalDisposal = 0;

    wasteData?.forEach(record => {
      const metric = wasteMetrics?.find(m => m.id === record.metric_id);
      if (!metric) return;

      const value = parseFloat(record.value);
      totalGenerated += value;

      if (metric.is_diverted) {
        totalDiverted += value;
      }
      if (metric.is_recycling) {
        totalRecycling += value;
      }
      if (!metric.is_diverted) {
        totalDisposal += value;
      }
    });

    console.log(`${'='.repeat(60)}`);
    console.log(`📅 ${year}`);
    console.log(`${'='.repeat(60)}`);
    console.log(`Records: ${wasteData?.length || 0}`);
    console.log(`Total Generated: ${totalGenerated.toFixed(2)} tons`);
    console.log(`Total Diverted: ${totalDiverted.toFixed(2)} tons (${totalGenerated > 0 ? ((totalDiverted / totalGenerated) * 100).toFixed(1) : 0}%)`);
    console.log(`Total Recycling: ${totalRecycling.toFixed(2)} tons (${totalGenerated > 0 ? ((totalRecycling / totalGenerated) * 100).toFixed(1) : 0}%)`);
    console.log(`Total Disposal: ${totalDisposal.toFixed(2)} tons (${totalGenerated > 0 ? ((totalDisposal / totalGenerated) * 100).toFixed(1) : 0}%)`);
    console.log('');
  }

  console.log('\n💡 What period is the dashboard showing?');
  console.log('   Check the period selector in the UI');
  console.log('   If it shows wrong data, it might be filtering by a specific month or site\n');
}

checkAllYearsWaste();
