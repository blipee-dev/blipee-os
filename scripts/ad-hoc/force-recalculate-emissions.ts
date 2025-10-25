/**
 * Force recalculate ALL emissions from metadata
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function forceRecalculate() {
  console.log('🔄 FORCE recalculating ALL co2e_emissions from metadata...\n');

  const { data: records, error } = await supabase
    .from('metrics_data')
    .select('id, value, co2e_emissions, metadata, period_start')
    .not('metadata->grid_mix->calculated_emissions_total_kgco2e', 'is', null);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`Processing ${records.length} records...\n`);

  let updated = 0;
  let failed = 0;

  for (const record of records) {
    const newEmissions = record.metadata.grid_mix.calculated_emissions_total_kgco2e;
    const currentEmissions = parseFloat(record.co2e_emissions) || 0;

    if (Math.abs(currentEmissions - newEmissions) < 0.01) {
      // Already correct
      continue;
    }

    const date = new Date(record.period_start);
    console.log(`Updating ${record.id.substring(0, 8)} (${date.toISOString().substring(0, 10)}): ${currentEmissions.toFixed(2)} → ${newEmissions.toFixed(2)} kgCO2e`);

    const { error: updateError } = await supabase
      .from('metrics_data')
      .update({ co2e_emissions: newEmissions.toString() })
      .eq('id', record.id);

    if (updateError) {
      console.log(`  ❌ Failed: ${updateError.message}`);
      failed++;
    } else {
      updated++;
    }

    // Rate limit to avoid overwhelming the database
    if (updated % 10 === 0) {
      await new Promise(r => setTimeout(r, 50));
    }
  }

  console.log(`\n✅ Updated: ${updated}`);
  console.log(`❌ Failed: ${failed}`);
}

forceRecalculate();
