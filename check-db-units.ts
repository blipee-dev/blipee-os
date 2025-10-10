import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function checkUnits() {
  console.log('Checking raw database values for co2e_emissions');

  // Get a few sample records from 2023
  const { data: samples } = await supabase
    .from('metrics_data')
    .select('period_start, co2e_emissions, scope')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2023-01-01')
    .lt('period_start', '2023-02-01')
    .order('period_start', { ascending: true })
    .limit(10);

  console.log('\n📊 Sample records from January 2023:');
  samples?.forEach(s => {
    console.log(`  ${s.period_start}: ${s.co2e_emissions} (${s.scope})`);
  });

  // Get total for 2023 without any conversion
  const { data: all2023 } = await supabase
    .from('metrics_data')
    .select('co2e_emissions')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2023-01-01')
    .lt('period_start', '2024-01-01');

  const rawSum = all2023?.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0) || 0;

  console.log('\n📊 2023 Totals:');
  console.log(`  Raw sum (as stored in DB): ${rawSum.toFixed(2)}`);
  console.log(`  Divided by 1000 (tCO2e): ${(rawSum / 1000).toFixed(2)}`);
  console.log(`  Expected from calculator: 429.30 tCO2e`);

  // Check if they're in kg or already in tonnes
  if (Math.abs((rawSum / 1000) - 429.3) < 1) {
    console.log('\n✅ Values are stored in kgCO2e (need /1000 conversion)');
  } else if (Math.abs(rawSum - 429.3) < 1) {
    console.log('\n✅ Values are already stored in tCO2e (no conversion needed)');
  } else {
    console.log('\n❌ Values don\'t match expected total!');
  }
}

checkUnits();
