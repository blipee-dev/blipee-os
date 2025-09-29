import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function compare() {
  // Get 2024 full year
  const { data: data2024 } = await supabase
    .from('metrics_data')
    .select('co2e_emissions')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31');

  const total2024 = data2024?.reduce((sum, d) => sum + (d.co2e_emissions || 0) / 1000, 0) || 0;

  // Get 2025 Jan-Aug
  const { data: data2025 } = await supabase
    .from('metrics_data')
    .select('co2e_emissions')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2025-01-01')
    .lte('period_end', '2025-08-31');

  const total2025 = data2025?.reduce((sum, d) => sum + (d.co2e_emissions || 0) / 1000, 0) || 0;

  console.log('=== EMISSIONS COMPARISON ===\n');
  console.log(`2024 (12 months): ${total2024.toFixed(1)} tCO2e`);
  console.log(`2025 (8 months):  ${total2025.toFixed(1)} tCO2e`);
  console.log('');
  console.log(`2025 is ${((total2025 / total2024 * 100).toFixed(1))}% of 2024 total`);
  console.log('\nMonthly average:');
  console.log(`  2024: ${(total2024 / 12).toFixed(1)} tCO2e/month`);
  console.log(`  2025: ${(total2025 / 8).toFixed(1)} tCO2e/month`);
  console.log('');

  if (total2025 > total2024) {
    console.log('⚠️  YES! 8 months of 2025 predictions exceed ALL of 2024!');
    console.log('This is clearly unrealistic and needs adjustment.');
    console.log(`\nExcess: ${(total2025 - total2024).toFixed(1)} tCO2e`);
    console.log(`\nProjected 2025 full year at this rate: ${(total2025 / 8 * 12).toFixed(1)} tCO2e`);
    console.log(`That would be ${((total2025 / 8 * 12 / total2024 - 1) * 100).toFixed(0)}% growth over 2024!`);
  } else {
    console.log('✅ 2025 predictions (8 months) are less than 2024 total');
  }
}

compare();