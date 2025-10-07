import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runUpdate() {
  console.log('Running SQL UPDATE...\n');

  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      UPDATE metrics_data
      SET co2e_emissions = (metadata->'grid_mix'->>'calculated_emissions_total_kgco2e')::numeric
      WHERE metadata->'grid_mix'->>'calculated_emissions_total_kgco2e' IS NOT NULL
      RETURNING id;
    `
  });

  if (error) {
    console.error('Error:', error);
    console.log('\nTrying alternative approach with direct update loop...');
    await directUpdate();
  } else {
    console.log('Success!', data);
  }
}

async function directUpdate() {
  const { data: records } = await supabase
    .from('metrics_data')
    .select('id, metadata')
    .not('metadata->grid_mix->calculated_emissions_total_kgco2e', 'is', null);

  console.log(`\nUpdating ${records?.length} records directly...\n`);

  for (const record of records || []) {
    const newValue = record.metadata.grid_mix.calculated_emissions_total_kgco2e;

    const { error } = await supabase
      .from('metrics_data')
      .update({ co2e_emissions: newValue })
      .eq('id', record.id);

    if (error) {
      console.log(`Failed ${record.id}: ${error.message}`);
    } else {
      console.log(`✓ ${record.id.substring(0, 8)}: ${newValue.toFixed(2)} kgCO2e`);
    }
  }
}

runUpdate();
