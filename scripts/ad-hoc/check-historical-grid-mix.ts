import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkHistoricalGridMix() {
  console.log('🔍 Checking Historical Grid Mix (2024)\n');

  // Get electricity metric
  const { data: electricityMetric } = await supabase
    .from('metrics_catalog')
    .select('id, name')
    .eq('code', 'scope2_electricity_grid')
    .single();

  console.log(`Electricity metric: ${electricityMetric?.name}\n`);

  // Get 2024 data with grid_mix
  const { data: data2024 } = await supabase
    .from('metrics_data')
    .select('period_start, value, co2e_emissions, metadata')
    .eq('organization_id', organizationId)
    .eq('metric_id', electricityMetric?.id)
    .gte('period_start', '2024-01-01')
    .lt('period_start', '2025-01-01')
    .order('period_start', { ascending: true })
    .limit(3);

  console.log('Sample 2024 records:\n');
  data2024?.forEach(r => {
    console.log(`${r.period_start}:`);
    console.log(`  Value: ${r.value} kWh`);
    console.log(`  Emissions: ${r.co2e_emissions} kg`);
    console.log(`  Has grid_mix: ${!!r.metadata?.grid_mix}`);
    if (r.metadata?.grid_mix) {
      console.log(`  Grid Mix:`, JSON.stringify(r.metadata.grid_mix, null, 2));
    }
    console.log('');
  });
}

checkHistoricalGridMix().catch(console.error);
