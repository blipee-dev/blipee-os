import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function check2025() {
  // Check a sample of 2025 data
  const { data } = await supabase
    .from('metrics_data')
    .select('metric_id, value, unit, co2e_emissions')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-12-31')
    .limit(10);

  console.log('Sample 2025 data:');
  data?.forEach(d => {
    console.log(`  Value: ${d.value}, Unit: ${d.unit}, Emissions: ${(d.co2e_emissions/1000).toFixed(2)} tCO2e`);
  });

  // Check if values are 0 or actually have data
  const nonZeroValues = data?.filter(d => d.value && d.value > 0);
  console.log(`\nNon-zero values: ${nonZeroValues?.length || 0} out of ${data?.length || 0}`);

  // Get totals
  const { data: all2025 } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, value')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-08-31');

  const totalEmissions = all2025?.reduce((sum, d) => sum + (d.co2e_emissions || 0) / 1000, 0) || 0;
  const totalValue = all2025?.reduce((sum, d) => sum + (d.value || 0), 0) || 0;

  console.log('\nTotal 2025 (Jan-Aug):');
  console.log(`  Emissions: ${totalEmissions.toFixed(1)} tCO2e`);
  console.log(`  Sum of values: ${totalValue}`);
  console.log(`  Records: ${all2025?.length}`);

  // Check 2024 for comparison
  const { data: sample2024 } = await supabase
    .from('metrics_data')
    .select('metric_id, value, unit, co2e_emissions')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-01-31')
    .limit(5);

  console.log('\n2024 January sample for comparison:');
  sample2024?.forEach(d => {
    console.log(`  Value: ${d.value}, Unit: ${d.unit}, Emissions: ${(d.co2e_emissions/1000).toFixed(2)} tCO2e`);
  });
}

check2025();