import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecord() {
  // Get one 2022 record
  const { data: records } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('period_start', '2022-01-01')
    .limit(1);

  if (!records || records.length === 0) {
    console.log('No record found');
    return;
  }

  const record = records[0];
  console.log('Record ID:', record.id);
  console.log('Period:', record.period_start);
  console.log('kWh:', record.value);
  console.log('Stored co2e_emissions:', record.co2e_emissions);
  console.log('co2e_emissions type:', typeof record.co2e_emissions);
  console.log('Calculated (metadata):', record.metadata?.grid_mix?.calculated_emissions_total_kgco2e);
  console.log('Factor:', record.metadata?.grid_mix?.carbon_intensity_lifecycle);

  const expected = (parseFloat(record.value) * record.metadata.grid_mix.carbon_intensity_lifecycle) / 1000;
  console.log('Expected:', expected.toFixed(2));

  // Try direct update
  console.log('\nAttempting direct update...');
  const newValue = record.metadata.grid_mix.calculated_emissions_total_kgco2e.toFixed(2);
  console.log('New value:', newValue);

  const { error } = await supabase
    .from('metrics_data')
    .update({ co2e_emissions: newValue })
    .eq('id', record.id);

  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Update successful!');
  }

  // Re-fetch to verify
  console.log('\nRe-fetching...');
  const { data: updated } = await supabase
    .from('metrics_data')
    .select('co2e_emissions')
    .eq('id', record.id)
    .single();

  console.log('After update:', updated?.co2e_emissions);
}

checkRecord();
