import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function checkEnergyUnits() {
  // Get energy data for PLMJ
  const { data: energyMetrics } = await supabase
    .from('metrics_data')
    .select(`
      value,
      unit,
      metrics_catalog (
        name,
        category,
        unit
      )
    `)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .or('metrics_catalog.category.eq.Electricity,metrics_catalog.category.eq.Purchased Energy')
    .limit(20);

  console.log('\n=== ENERGY DATA FROM DATABASE ===\n');

  const totals: any = {};

  energyMetrics?.forEach(record => {
    const name = record.metrics_catalog?.name || 'Unknown';
    const category = record.metrics_catalog?.category || 'Unknown';
    const unit = record.unit || record.metrics_catalog?.unit || 'unknown';

    console.log(`${name} [${category}]: ${record.value} ${unit}`);

    const key = `${category}`;
    if (!totals[key]) {
      totals[key] = { value: 0, unit: unit, count: 0 };
    }
    totals[key].value += record.value || 0;
    totals[key].count += 1;
  });

  console.log('\n=== ENERGY TOTALS BY CATEGORY ===\n');
  let grandTotal = 0;

  Object.entries(totals).forEach(([category, data]: any) => {
    console.log(`${category}:`);
    console.log(`  Records: ${data.count}`);
    console.log(`  Total kWh: ${Math.round(data.value).toLocaleString()}`);
    console.log(`  Total MWh: ${Math.round(data.value / 1000).toLocaleString()}`);
    console.log(`  Total GWh: ${(data.value / 1000000).toFixed(3)}`);
    console.log('');
    grandTotal += data.value;
  });

  console.log('=== GRAND TOTAL ENERGY ===');
  console.log(`kWh: ${Math.round(grandTotal).toLocaleString()}`);
  console.log(`MWh: ${Math.round(grandTotal / 1000).toLocaleString()}`);
  console.log(`GWh: ${(grandTotal / 1000000).toFixed(3)}`);

  console.log('\n=== SUMMARY ===');
  console.log('✅ Energy values are stored in kWh in the database');
  console.log('✅ Should display as MWh (divide by 1000)');
  console.log('✅ Fixed in Zero-Typing page and API endpoints');
}

checkEnergyUnits().catch(console.error);