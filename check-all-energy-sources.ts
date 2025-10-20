import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllEnergySources() {
  console.log('🔍 Checking ALL Energy Sources for 2025...\n');

  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Get ALL metrics (not just Electricity and Purchased Energy)
  const { data: allMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .order('category');

  if (!allMetrics) {
    console.error('❌ No metrics found');
    return;
  }

  // Check which categories might contain energy data
  const categoriesWithData = new Map<string, any>();

  for (const metric of allMetrics) {
    const { data } = await supabase
      .from('metrics_data')
      .select('value, period_start')
      .eq('organization_id', orgId)
      .eq('metric_id', metric.id)
      .gte('period_start', '2025-01-01')
      .lt('period_start', '2025-11-01')
      .limit(1);

    if (data && data.length > 0) {
      if (!categoriesWithData.has(metric.category)) {
        categoriesWithData.set(metric.category, []);
      }
      categoriesWithData.get(metric.category).push({
        name: metric.name,
        unit: metric.unit,
        id: metric.id
      });
    }
  }

  console.log('📊 Categories with 2025 data:\n');

  for (const [category, metrics] of categoriesWithData.entries()) {
    console.log(`\n📁 ${category}:`);

    for (const metric of metrics) {
      // Get total for this metric
      const { data } = await supabase
        .from('metrics_data')
        .select('value')
        .eq('organization_id', orgId)
        .eq('metric_id', metric.id)
        .gte('period_start', '2025-01-01')
        .lt('period_start', '2025-11-01');

      const total = data?.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0) || 0;

      console.log(`   - ${metric.name} (${metric.unit}): ${total.toFixed(2)}`);
    }
  }

  // Now calculate total energy using the same categories as the API
  console.log('\n\n🔍 Energy API Categories (Electricity + Purchased Energy):');

  const { data: energyMetrics } = await supabase
    .from('metrics_catalog')
    .select('*')
    .in('category', ['Electricity', 'Purchased Energy']);

  let totalEnergy = 0;

  if (energyMetrics) {
    for (const metric of energyMetrics) {
      const { data } = await supabase
        .from('metrics_data')
        .select('value')
        .eq('organization_id', orgId)
        .eq('metric_id', metric.id)
        .gte('period_start', '2025-01-01')
        .lt('period_start', '2025-11-01');

      const total = data?.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0) || 0;
      totalEnergy += total;

      console.log(`   ${metric.name} (${metric.category}): ${total.toFixed(2)} ${metric.unit}`);
    }
  }

  console.log(`\n📊 Total Energy (Jan-Oct 2025): ${totalEnergy.toFixed(2)} kWh`);
}

checkAllEnergySources();
