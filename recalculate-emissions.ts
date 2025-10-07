import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Emission factors
const RENEWABLE_EMISSION_FACTOR = 0.02;  // kgCO2e/kWh (lifecycle emissions from renewables)
const NON_RENEWABLE_EMISSION_FACTOR = 0.71;  // kgCO2e/kWh (fossil fuel grid electricity)

async function recalculateEmissions() {
  console.log('\n🔄 Recalculating emissions based on renewable/non-renewable split...\n');

  try {
    // Get all electricity records with grid_mix metadata
    const { data: records, error } = await supabase
      .from('metrics_data')
      .select('id, value, co2e_emissions, metadata')
      .not('metadata->grid_mix', 'is', null);

    if (error || !records) {
      console.error('❌ Error fetching records:', error);
      return;
    }

    console.log(`📊 Found ${records.length} records with grid_mix metadata\n`);

    let updated = 0;
    let totalOldEmissions = 0;
    let totalNewEmissions = 0;

    for (const record of records) {
      const gridMix = record.metadata?.grid_mix;
      if (!gridMix) continue;

      const renewableKWh = gridMix.renewable_kwh || 0;
      const nonRenewableKWh = gridMix.non_renewable_kwh || 0;

      // Calculate new emissions based on renewable/non-renewable split
      const newEmissions = (renewableKWh * RENEWABLE_EMISSION_FACTOR) +
                          (nonRenewableKWh * NON_RENEWABLE_EMISSION_FACTOR);

      const oldEmissions = parseFloat(record.co2e_emissions as string);
      totalOldEmissions += oldEmissions;
      totalNewEmissions += newEmissions;

      // Update the record
      const { error: updateError } = await supabase
        .from('metrics_data')
        .update({
          co2e_emissions: newEmissions,
          metadata: {
            ...record.metadata,
            grid_mix: {
              ...gridMix,
              renewable_emission_factor: RENEWABLE_EMISSION_FACTOR,
              non_renewable_emission_factor: NON_RENEWABLE_EMISSION_FACTOR,
              old_emissions: oldEmissions,
              new_emissions: newEmissions,
              emissions_reduction: oldEmissions - newEmissions
            }
          }
        })
        .eq('id', record.id);

      if (updateError) {
        console.error(`❌ Error updating record ${record.id}:`, updateError);
      } else {
        updated++;
        if (updated % 10 === 0) {
          console.log(`✅ Updated ${updated} records...`);
        }
      }
    }

    console.log(`\n✅ Emissions recalculation complete!`);
    console.log(`   Records updated: ${updated}`);
    console.log(`   Old total emissions: ${(totalOldEmissions / 1000).toFixed(2)} tCO2e`);
    console.log(`   New total emissions: ${(totalNewEmissions / 1000).toFixed(2)} tCO2e`);
    console.log(`   Emissions reduction: ${((totalOldEmissions - totalNewEmissions) / 1000).toFixed(2)} tCO2e`);
    console.log(`   Reduction %: ${((totalOldEmissions - totalNewEmissions) / totalOldEmissions * 100).toFixed(1)}%\n`);

    // Show sample comparisons
    console.log('📊 Sample emission changes:\n');
    const { data: sample } = await supabase
      .from('metrics_data')
      .select('period_start, value, co2e_emissions, metadata')
      .not('metadata->grid_mix', 'is', null)
      .limit(5);

    if (sample) {
      sample.forEach(s => {
        const gridMix = (s.metadata as any)?.grid_mix;
        console.log(`${gridMix?.period}: ${s.value} kWh`);
        console.log(`  Old emissions: ${gridMix?.old_emissions?.toFixed(2)} kgCO2e`);
        console.log(`  New emissions: ${s.co2e_emissions} kgCO2e`);
        console.log(`  Reduction: ${gridMix?.emissions_reduction?.toFixed(2)} kgCO2e (${(gridMix?.emissions_reduction / gridMix?.old_emissions * 100).toFixed(1)}%)\n`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

recalculateEmissions().catch(console.error);
