/**
 * Re-backfill grid mix with accurate year-specific emission factors
 *
 * Uses historical emission factors from official sources:
 * - Portugal 2022: 142 gCO2/kWh (61% renewable)
 * - Portugal 2023: 124 gCO2/kWh (76% renewable)
 * - Portugal 2024: 130 gCO2/kWh (72% renewable)
 * - Portugal 2025: 128 gCO2/kWh (74% renewable - current)
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import {
  getHistoricalEmissionFactor,
  splitEmissionFactors
} from './src/lib/external/historical-emission-factors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function backfillWithHistoricalFactors() {
  console.log('🔄 Re-backfilling emission factors with accurate year-specific data\n');

  // Get all electricity records with grid mix
  const { data: records, error } = await supabase
    .from('metrics_data')
    .select('id, period_start, value, metadata')
    .not('metadata->grid_mix', 'is', null)
    .order('period_start', { ascending: true });

  if (error) {
    console.error('❌ Error fetching records:', error);
    return;
  }

  console.log(`Found ${records.length} records with grid mix metadata\n`);

  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  // Group by year for summary
  const byYear: { [year: string]: { old: number[], new: number[], count: number } } = {};

  for (const record of records) {
    const date = new Date(record.period_start);
    const year = date.getFullYear();
    const gridMix = record.metadata.grid_mix;

    // Get country from metadata (default PT)
    const country = gridMix.country || 'PT';

    // Get historical emission factor for this year
    const historicalFactor = getHistoricalEmissionFactor(country, year);

    if (!historicalFactor) {
      console.log(`  ⚠️  No historical data for ${country} ${year}`);
      failed++;
      continue;
    }

    // Calculate emissions
    const totalKwh = parseFloat(record.value) || 0;
    const factors = splitEmissionFactors(historicalFactor.lifecycle_gco2_kwh);

    const calculatedEmissionsTotal = (totalKwh * factors.lifecycle) / 1000; // kgCO2e
    const calculatedEmissionsScope2 = (totalKwh * factors.scope2) / 1000;
    const calculatedEmissionsScope3 = (totalKwh * factors.scope3_cat3) / 1000;

    // Calculate renewable split
    const renewableKwh = totalKwh * (historicalFactor.renewable_percentage / 100);
    const nonRenewableKwh = totalKwh - renewableKwh;

    // Update metadata with year-specific factors
    const newMetadata = {
      ...record.metadata,
      grid_mix: {
        ...gridMix,
        // Update emission factors
        carbon_intensity_lifecycle: factors.lifecycle,
        carbon_intensity_scope2: factors.scope2,
        carbon_intensity_scope3_cat3: factors.scope3_cat3,

        // Update calculated emissions
        calculated_emissions_total_kgco2e: calculatedEmissionsTotal,
        calculated_emissions_scope2_kgco2e: calculatedEmissionsScope2,
        calculated_emissions_scope3_cat3_kgco2e: calculatedEmissionsScope3,

        // Update renewable percentages
        renewable_percentage: historicalFactor.renewable_percentage,
        non_renewable_percentage: 100 - historicalFactor.renewable_percentage,
        renewable_kwh: renewableKwh,
        non_renewable_kwh: nonRenewableKwh,

        // Add source info
        emission_factor_source: historicalFactor.source,
        emission_factor_year_specific: true,
        updated_at: new Date().toISOString()
      }
    };

    // Track changes by year
    if (!byYear[year]) {
      byYear[year] = { old: [], new: [], count: 0 };
    }

    const oldFactor = gridMix.carbon_intensity_lifecycle || 0;
    byYear[year].old.push(oldFactor);
    byYear[year].new.push(factors.lifecycle);
    byYear[year].count++;

    // Check if update is needed (allow 1 gCO2/kWh tolerance)
    if (Math.abs(oldFactor - factors.lifecycle) < 1) {
      unchanged++;
      continue;
    }

    // Update record
    const { error: updateError } = await supabase
      .from('metrics_data')
      .update({
        metadata: newMetadata,
        co2e_emissions: calculatedEmissionsTotal.toFixed(2)
      })
      .eq('id', record.id);

    if (updateError) {
      console.log(`  ❌ Error updating ${record.id.substring(0, 8)}: ${updateError.message}`);
      failed++;
    } else {
      updated++;
    }
  }

  console.log('\n📊 Summary by Year:\n');

  Object.keys(byYear).sort().forEach(year => {
    const data = byYear[year];
    const avgOld = data.old.reduce((a, b) => a + b, 0) / data.old.length;
    const avgNew = data.new.reduce((a, b) => a + b, 0) / data.new.length;
    const change = avgNew - avgOld;
    const changePercent = avgOld > 0 ? ((change / avgOld) * 100) : 0;

    console.log(`Year ${year}:`);
    console.log(`  Records: ${data.count}`);
    console.log(`  Old Avg: ${avgOld.toFixed(1)} gCO2/kWh`);
    console.log(`  New Avg: ${avgNew.toFixed(1)} gCO2/kWh`);
    console.log(`  Change: ${change > 0 ? '+' : ''}${change.toFixed(1)} gCO2/kWh (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%)`);
    console.log('');
  });

  console.log('📊 Update Summary:');
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ⏭️  No change needed: ${unchanged}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📝 Total: ${records.length}`);
}

backfillWithHistoricalFactors();
