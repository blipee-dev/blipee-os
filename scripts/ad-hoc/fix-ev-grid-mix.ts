import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function fixEVGridMix() {
  console.log('🔧 Fixing EV Charging Grid Mix to Match Regular Electricity\n');
  console.log('='.repeat(80));

  // Get metric IDs
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name')
    .in('code', ['scope2_electricity_grid', 'scope2_ev_charging']);

  const electricityMetric = metrics.find(m => m.code === 'scope2_electricity_grid');
  const evMetric = metrics.find(m => m.code === 'scope2_ev_charging');

  if (!electricityMetric || !evMetric) {
    console.log('❌ Could not find metrics');
    return;
  }

  console.log(`\nMetrics found:`);
  console.log(`  Electricity: ${electricityMetric.name} (${electricityMetric.id})`);
  console.log(`  EV Charging: ${evMetric.name} (${evMetric.id})`);

  // Get all EV charging records (historical + forecast)
  const { data: evRecords } = await supabase
    .from('metrics_data')
    .select('id, period_start, value, metadata, site_id')
    .eq('organization_id', organizationId)
    .eq('metric_id', evMetric.id)
    .order('period_start');

  console.log(`\n📊 Found ${evRecords.length} EV charging records to update`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const evRecord of evRecords) {
    const period = evRecord.period_start;
    const siteId = evRecord.site_id;
    const consumption = parseFloat(evRecord.value);

    // Find matching electricity record for same period and site to get correct grid mix
    const { data: electricityRecords } = await supabase
      .from('metrics_data')
      .select('metadata')
      .eq('organization_id', organizationId)
      .eq('metric_id', electricityMetric.id)
      .eq('site_id', siteId)
      .eq('period_start', period)
      .limit(1);

    if (electricityRecords && electricityRecords.length > 0) {
      const correctGridMix = electricityRecords[0].metadata?.grid_mix;

      if (correctGridMix) {
        // Calculate correct renewable/non-renewable kWh based on consumption
        const renewablePercentage = correctGridMix.renewable_percentage || 0;
        const nonRenewablePercentage = 100 - renewablePercentage;
        const renewableKwh = consumption * (renewablePercentage / 100);
        const nonRenewableKwh = consumption * (nonRenewablePercentage / 100);

        // Calculate emissions
        let calculatedEmissionsScope2 = null;
        let calculatedEmissionsScope3 = null;
        let calculatedEmissionsTotal = null;

        if (correctGridMix.carbon_intensity_lifecycle) {
          const emissionFactorScope3 = correctGridMix.carbon_intensity_lifecycle * 0.15;
          const emissionFactorScope2 = correctGridMix.carbon_intensity_lifecycle * 0.85;

          calculatedEmissionsTotal = (consumption * correctGridMix.carbon_intensity_lifecycle) / 1000;
          calculatedEmissionsScope2 = (consumption * emissionFactorScope2) / 1000;
          calculatedEmissionsScope3 = (consumption * emissionFactorScope3) / 1000;
        }

        // Update metadata with correct grid mix
        const updatedMetadata = {
          ...evRecord.metadata,
          grid_mix: {
            ...correctGridMix,
            // Update consumption-specific values
            renewable_kwh: renewableKwh,
            non_renewable_kwh: nonRenewableKwh,
            renewable_percentage: renewablePercentage,
            non_renewable_percentage: nonRenewablePercentage,
            calculated_emissions_total_kgco2e: calculatedEmissionsTotal,
            calculated_emissions_scope2_kgco2e: calculatedEmissionsScope2,
            calculated_emissions_scope3_cat3_kgco2e: calculatedEmissionsScope3,
            updated_at: new Date().toISOString()
          }
        };

        // Update the record
        const { error } = await supabase
          .from('metrics_data')
          .update({ metadata: updatedMetadata })
          .eq('id', evRecord.id);

        if (error) {
          console.log(`❌ Error updating record ${evRecord.id}:`, error.message);
          errorCount++;
        } else {
          updatedCount++;
          if (updatedCount % 10 === 0) {
            console.log(`  ✅ Updated ${updatedCount}/${evRecords.length} records...`);
          }
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ UPDATE COMPLETE');
  console.log('='.repeat(80));
  console.log(`Total records: ${evRecords.length}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Skipped: ${evRecords.length - updatedCount - errorCount}`);
  console.log('='.repeat(80));
}

fixEVGridMix();
