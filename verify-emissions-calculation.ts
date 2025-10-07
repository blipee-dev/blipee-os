/**
 * Verify emissions calculations are correct
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyEmissions() {
  console.log('🔍 Verifying emissions calculations...\n');

  const { data: records, error } = await supabase
    .from('metrics_data')
    .select('period_start, value, co2e_emissions, metadata')
    .not('metadata->grid_mix', 'is', null)
    .order('period_start', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Sample of first 10 records:\n');

  records.forEach((record, i) => {
    const date = new Date(record.period_start);
    const kwh = parseFloat(record.value);
    const storedEmissions = parseFloat(record.co2e_emissions);
    const factor = record.metadata.grid_mix.carbon_intensity_lifecycle;
    const calculatedEmissions = record.metadata.grid_mix.calculated_emissions_total_kgco2e;
    const expectedEmissions = (kwh * factor) / 1000;

    console.log(`[${i + 1}] ${date.toISOString().substring(0, 10)}`);
    console.log(`    kWh: ${kwh.toFixed(2)}`);
    console.log(`    Factor: ${factor} gCO2/kWh`);
    console.log(`    Expected: ${expectedEmissions.toFixed(2)} kgCO2e`);
    console.log(`    Calculated (metadata): ${calculatedEmissions.toFixed(2)} kgCO2e`);
    console.log(`    Stored (co2e_emissions): ${storedEmissions.toFixed(2)} kgCO2e`);
    console.log(`    ✓ Match: ${Math.abs(storedEmissions - calculatedEmissions) < 0.1 ? 'YES' : 'NO'}`);
    console.log('');
  });
}

verifyEmissions();
