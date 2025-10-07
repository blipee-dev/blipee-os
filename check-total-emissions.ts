import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTotal() {
  // Get ALL records with grid_mix
  const { data: records } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, period_start, metadata')
    .not('metadata->grid_mix->calculated_emissions_total_kgco2e', 'is', null);

  if (!records) return;

  const byYear: { [year: string]: number } = {};
  let total = 0;

  records.forEach(record => {
    const emissions = parseFloat(record.co2e_emissions) || 0;
    const year = new Date(record.period_start).getFullYear();

    if (!byYear[year]) byYear[year] = 0;
    byYear[year] += emissions;
    total += emissions;
  });

  console.log('Total Emissions by Year (from co2e_emissions column):\n');
  Object.keys(byYear).sort().forEach(year => {
    console.log(`${year}: ${byYear[year].toFixed(2)} kgCO2e (${(byYear[year] / 1000).toFixed(2)} tCO2e)`);
  });

  console.log(`\nGrand Total: ${total.toFixed(2)} kgCO2e (${(total / 1000).toFixed(2)} tCO2e)`);
}

checkTotal();
