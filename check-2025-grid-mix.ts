import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkGridMix() {
  console.log('🔍 Checking 2025 Grid Mix Metadata\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Get energy metrics
  const { data: energyMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, name, code, category')
    .in('category', ['Electricity', 'Purchased Energy']);

  console.log(`Found ${energyMetrics?.length} energy metrics\n`);

  // Get 2025 energy data
  const { data: energyData } = await supabase
    .from('metrics_data')
    .select('metric_id, period_start, value, co2e_emissions, metadata')
    .eq('organization_id', organizationId)
    .in('metric_id', energyMetrics?.map(m => m.id) || [])
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true });

  console.log(`Total 2025 energy records: ${energyData?.length}\n`);

  // Check which have grid_mix
  const withGridMix = energyData?.filter(r => r.metadata?.grid_mix) || [];
  const withoutGridMix = energyData?.filter(r => !r.metadata?.grid_mix) || [];

  console.log(`Records WITH grid_mix: ${withGridMix.length}`);
  console.log(`Records WITHOUT grid_mix: ${withoutGridMix.length}\n`);

  // Show sample with grid_mix
  if (withGridMix.length > 0) {
    console.log('Sample records WITH grid_mix:\n');
    withGridMix.slice(0, 3).forEach(r => {
      const metric = energyMetrics?.find(m => m.id === r.metric_id);
      console.log(`${r.period_start} - ${metric?.name}`);
      console.log(`  Value: ${r.value} kWh`);
      console.log(`  Emissions: ${r.co2e_emissions} kg`);
      console.log(`  Grid Mix:`, r.metadata.grid_mix);
      console.log('');
    });
  }

  // Show sample without grid_mix
  if (withoutGridMix.length > 0) {
    console.log('\nSample records WITHOUT grid_mix:\n');
    withoutGridMix.slice(0, 3).forEach(r => {
      const metric = energyMetrics?.find(m => m.id === r.metric_id);
      console.log(`${r.period_start} - ${metric?.name} (${metric?.code})`);
      console.log(`  Value: ${r.value} kWh`);
      console.log(`  Emissions: ${r.co2e_emissions} kg`);
      console.log(`  Metadata:`, r.metadata);
      console.log('');
    });
  }

  // Group by metric
  console.log('\nBreakdown by metric:\n');
  const metricGroups = new Map();
  energyData?.forEach(r => {
    const metric = energyMetrics?.find(m => m.id === r.metric_id);
    const key = metric?.name || 'Unknown';
    if (!metricGroups.has(key)) {
      metricGroups.set(key, { total: 0, withMix: 0 });
    }
    const group = metricGroups.get(key);
    group.total++;
    if (r.metadata?.grid_mix) group.withMix++;
  });

  metricGroups.forEach((stats, name) => {
    console.log(`${name}:`);
    console.log(`  Total: ${stats.total}, With grid_mix: ${stats.withMix}`);
  });
}

checkGridMix().catch(console.error);
