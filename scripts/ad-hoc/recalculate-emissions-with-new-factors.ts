/**
 * Recalculate co2e_emissions column using new year-specific emission factors
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function recalculateEmissions() {
  console.log('🔄 Recalculating co2e_emissions column with new year-specific factors...\n');

  // Get all electricity records with grid mix data
  const { data: records, error } = await supabase
    .from('metrics_data')
    .select('id, value, co2e_emissions, metadata, period_start')
    .not('metadata->grid_mix->calculated_emissions_total_kgco2e', 'is', null)
    .order('period_start', { ascending: true });

  if (error) {
    console.error('❌ Error fetching records:', error);
    return;
  }

  console.log(`Found ${records.length} electricity records with emission data\n`);

  let updated = 0;
  let noChange = 0;
  let failed = 0;

  let totalOldEmissions = 0;
  let totalNewEmissions = 0;

  // Track by year
  const byYear: { [year: string]: { old: number; new: number; count: number } } = {};

  for (const record of records) {
    const gridMix = record.metadata.grid_mix;
    const currentEmissions = parseFloat(record.co2e_emissions) || 0;
    const newEmissions = gridMix.calculated_emissions_total_kgco2e;

    const date = new Date(record.period_start);
    const year = date.getFullYear();

    if (!byYear[year]) {
      byYear[year] = { old: 0, new: 0, count: 0 };
    }

    byYear[year].old += currentEmissions;
    byYear[year].new += newEmissions;
    byYear[year].count++;

    totalOldEmissions += currentEmissions;
    totalNewEmissions += newEmissions;

    // Check if recalculation is needed (allow 0.1 kgCO2e tolerance)
    if (Math.abs(currentEmissions - newEmissions) < 0.1) {
      noChange++;
      continue;
    }

    // Update emissions
    const { error: updateError } = await supabase
      .from('metrics_data')
      .update({
        co2e_emissions: newEmissions.toFixed(2)
      })
      .eq('id', record.id);

    if (updateError) {
      console.log(`  ❌ Error updating ${record.id.substring(0, 8)}: ${updateError.message}`);
      failed++;
    } else {
      updated++;
    }
  }

  const totalDifference = totalNewEmissions - totalOldEmissions;
  const percentChange = totalOldEmissions > 0
    ? ((totalDifference / totalOldEmissions) * 100)
    : 0;

  console.log('📊 Emissions by Year:\n');

  Object.keys(byYear).sort().forEach(year => {
    const data = byYear[year];
    const diff = data.new - data.old;
    const pct = data.old > 0 ? ((diff / data.old) * 100) : 0;

    console.log(`Year ${year}:`);
    console.log(`  Records: ${data.count}`);
    console.log(`  Old Total: ${data.old.toFixed(2)} kgCO2e (${(data.old / 1000).toFixed(2)} tCO2e)`);
    console.log(`  New Total: ${data.new.toFixed(2)} kgCO2e (${(data.new / 1000).toFixed(2)} tCO2e)`);
    console.log(`  Change: ${diff > 0 ? '+' : ''}${diff.toFixed(2)} kgCO2e (${pct > 0 ? '+' : ''}${pct.toFixed(1)}%)`);
    console.log('');
  });

  console.log('\n📊 Recalculation Summary:');
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ⏭️  No change: ${noChange}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📝 Total: ${records.length}`);
  console.log('');
  console.log('💰 Total Emissions Impact:');
  console.log(`  Old Total:  ${totalOldEmissions.toFixed(2)} kgCO2e (${(totalOldEmissions / 1000).toFixed(2)} tCO2e)`);
  console.log(`  New Total:  ${totalNewEmissions.toFixed(2)} kgCO2e (${(totalNewEmissions / 1000).toFixed(2)} tCO2e)`);
  console.log(`  Difference: ${totalDifference > 0 ? '+' : ''}${totalDifference.toFixed(2)} kgCO2e (${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%)`);
  console.log(`  In Tons:    ${totalDifference > 0 ? '+' : ''}${(totalDifference / 1000).toFixed(2)} tCO2e`);
  console.log('');

  if (totalDifference > 0) {
    console.log('⚠️  Emissions INCREASED due to more accurate year-specific factors.');
    console.log(`   2022 was a high-emission year (energy crisis), which increases total.`);
  } else if (totalDifference < 0) {
    console.log('✅ Emissions DECREASED due to more accurate factors.');
  }

  console.log('\n💡 Now using accurate year-specific emission factors:');
  console.log('   - 2022: 225.7 gCO2/kWh (energy crisis year)');
  console.log('   - 2023: 152.0 gCO2/kWh (exceptional renewables)');
  console.log('   - 2024: 104.9 gCO2/kWh (record low emissions)');
  console.log('   - 2025: 128.0 gCO2/kWh (current)');
}

recalculateEmissions();
