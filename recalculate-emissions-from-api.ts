/**
 * Recalculate emissions using accurate Electricity Maps emission factors
 *
 * This replaces outdated/generic emission factors with:
 * - Real-time grid-specific factors
 * - Location-based (Portugal)
 * - Time-specific (varies by year/month)
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function recalculateEmissions() {
  console.log('🔄 Recalculating emissions using Electricity Maps API factors...\n');

  // Get all electricity records with grid mix data
  const { data: records, error } = await supabase
    .from('metrics_data')
    .select('id, value, co2e_emissions, metadata')
    .not('metadata->grid_mix->carbon_intensity_lifecycle', 'is', null);

  if (error) {
    console.error('❌ Error fetching records:', error);
    return;
  }

  console.log(`Found ${records.length} electricity records with emission factors\n`);

  let updated = 0;
  let noChange = 0;
  let failed = 0;

  let totalOldEmissions = 0;
  let totalNewEmissions = 0;

  for (const record of records) {
    const gridMix = record.metadata.grid_mix;
    const currentEmissions = parseFloat(record.co2e_emissions) || 0;
    const newEmissions = gridMix.calculated_emissions_total_kgco2e;

    totalOldEmissions += currentEmissions;
    totalNewEmissions += newEmissions;

    // Check if recalculation is needed (allow 0.1 kgCO2e tolerance)
    if (Math.abs(currentEmissions - newEmissions) < 0.1) {
      noChange++;
      continue;
    }

    console.log(`Updating ${record.id.substring(0, 8)}...`);
    console.log(`  Old: ${currentEmissions.toFixed(2)} kgCO2e`);
    console.log(`  New: ${newEmissions.toFixed(2)} kgCO2e`);
    console.log(`  Diff: ${(currentEmissions - newEmissions).toFixed(2)} kgCO2e`);

    // Update emissions
    const { error: updateError } = await supabase
      .from('metrics_data')
      .update({
        co2e_emissions: newEmissions.toFixed(2) // Store as string with 2 decimals
      })
      .eq('id', record.id);

    if (updateError) {
      console.log(`  ❌ Error: ${updateError.message}`);
      failed++;
    } else {
      console.log(`  ✅ Updated`);
      updated++;
    }
  }

  const totalDifference = totalOldEmissions - totalNewEmissions;
  const percentChange = totalOldEmissions > 0
    ? ((totalDifference / totalOldEmissions) * 100)
    : 0;

  console.log('\n📊 Recalculation Summary:');
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ⏭️  No change: ${noChange}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📝 Total: ${records.length}`);
  console.log('');
  console.log('💰 Emissions Impact:');
  console.log(`  Old Total:  ${totalOldEmissions.toFixed(2)} kgCO2e`);
  console.log(`  New Total:  ${totalNewEmissions.toFixed(2)} kgCO2e`);
  console.log(`  Difference: ${totalDifference.toFixed(2)} kgCO2e (${percentChange.toFixed(1)}% ${totalDifference > 0 ? 'reduction' : 'increase'})`);
  console.log(`  In Tons:    ${(totalDifference / 1000).toFixed(2)} tCO2e`);
  console.log('');

  if (totalDifference > 0) {
    console.log('✅ Good news! Your actual emissions are LOWER than previously calculated.');
    console.log(`   You over-reported by ${(totalDifference / 1000).toFixed(2)} tons CO2e`);
  } else if (totalDifference < 0) {
    console.log('⚠️  Your actual emissions are HIGHER than previously calculated.');
    console.log(`   You under-reported by ${Math.abs(totalDifference / 1000).toFixed(2)} tons CO2e`);
  }

  console.log('\n💡 These accurate emission factors come from:');
  console.log('   - Electricity Maps API (real-time grid data)');
  console.log('   - Location-specific (Portugal)');
  console.log('   - Time-specific (varies by month/year)');
  console.log('   - GHG Protocol compliant (Scope 2 + Scope 3.3)');
}

recalculateEmissions();
