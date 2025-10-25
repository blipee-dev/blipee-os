import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testTargetsAPI() {
  console.log('Testing /api/sustainability/targets endpoint\n');

  const response = await fetch('http://localhost:3000/api/sustainability/targets', {
    headers: {
      'Cookie': `supabase-auth-token=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    }
  });

  if (!response.ok) {
    console.error('API request failed:', response.status);
    return;
  }

  const data = await response.json();

  console.log('API Response:');
  console.log('='.repeat(60));

  if (data.targets && data.targets.length > 0) {
    data.targets.forEach((target: any) => {
      console.log(`\n📊 ${target.target_name} (${target.target_type})`);
      console.log(`   Baseline (${target.baseline_year}): ${target.baseline_emissions} tCO2e`);
      console.log(`   Current (${new Date().getFullYear()}): ${target.current_emissions} tCO2e`);
      console.log(`   Target (${target.target_year}): ${target.target_emissions} tCO2e`);
      console.log(`   Is Forecast: ${target.is_forecast}`);
      if (target.is_forecast) {
        console.log(`   Actual YTD: ${target.actual_ytd} tCO2e`);
        console.log(`   Forecasted Remaining: ${target.forecasted_remaining} tCO2e`);
      }
    });
  }

  console.log('\n' + '='.repeat(60));
}

testTargetsAPI().catch(console.error);
