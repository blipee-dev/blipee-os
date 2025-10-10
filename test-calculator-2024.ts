import { config } from 'dotenv';
config();

import { getMonthlyEmissions } from './src/lib/sustainability/baseline-calculator';

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function test() {
  console.log('Testing calculator for 2024 data...\n');

  const data = await getMonthlyEmissions(ORG_ID, '2024-01-01', '2024-12-31');

  console.log(`✅ Got ${data.length} months`);
  console.log('\nFirst 3 months:');
  data.slice(0, 3).forEach(m => {
    console.log(`  ${m.month}: ${m.emissions.toFixed(1)} tCO2e`);
  });

  console.log('\nLast 3 months:');
  data.slice(-3).forEach(m => {
    console.log(`  ${m.month}: ${m.emissions.toFixed(1)} tCO2e`);
  });
}

test();
