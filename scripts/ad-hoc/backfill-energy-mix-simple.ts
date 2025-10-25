/**
 * Simple backfill script - Updates existing energy records with grid mix data
 *
 * This script doesn't rely on database triggers or tables.
 * It directly calls Electricity Maps API and updates metadata.
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const apiKey = process.env.ELECTRICITY_MAPS_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch carbon intensity from Electricity Maps
async function fetchCarbonIntensity(zone: string, datetime: string) {
  try {
    const response = await fetch(
      `https://api.electricitymap.org/v3/carbon-intensity/history?zone=${zone}&datetime=${datetime}`,
      {
        headers: { 'auth-token': apiKey }
      }
    );

    if (!response.ok) return null;
    const data = await response.json();

    // API returns {history: [...]}
    if (data.history && data.history.length > 0) {
      return data.history[0];
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function fetchGridMix(zone: string, datetime: string) {
  try {
    const response = await fetch(
      `https://api.electricitymap.org/v3/power-breakdown/history?zone=${zone}&datetime=${datetime}`,
      {
        headers: { 'auth-token': apiKey }
      }
    );

    if (!response.ok) return null;
    const data = await response.json();

    // API returns {history: [...]} for historical requests
    // We want the first/closest record
    if (data.history && data.history.length > 0) {
      return data.history[0];
    }

    return null;
  } catch (error) {
    return null;
  }
}

function convertToEnergyMix(breakdown: any) {
  const consumption = breakdown.powerConsumptionBreakdown || {};
  const total = breakdown.powerConsumptionTotal || 0;

  if (total === 0) return { renewable_percentage: 0, sources: [] };

  const sourceMapping: any = {
    'solar': { name: 'Solar', renewable: true },
    'wind': { name: 'Wind', renewable: true },
    'hydro': { name: 'Hydro', renewable: true },
    'hydro discharge': { name: 'Hydro Storage', renewable: true },
    'biomass': { name: 'Biomass', renewable: true },
    'geothermal': { name: 'Geothermal', renewable: true },
    'nuclear': { name: 'Nuclear', renewable: false },
    'gas': { name: 'Natural Gas', renewable: false },
    'coal': { name: 'Coal', renewable: false },
    'oil': { name: 'Oil', renewable: false },
    'unknown': { name: 'Unknown', renewable: false },
    'battery discharge': { name: 'Battery', renewable: true }
  };

  const sources: any[] = [];

  Object.entries(consumption).forEach(([source, value]: [string, any]) => {
    if (value !== null && value > 0) {
      const config = sourceMapping[source] || { name: source, renewable: false };
      const percentage = (value / total) * 100;
      sources.push({
        name: config.name,
        percentage: Math.round(percentage * 100) / 100,
        renewable: config.renewable
      });
    }
  });

  const renewablePercentage = breakdown.renewablePercentage !== null
    ? breakdown.renewablePercentage
    : 0;

  return {
    renewable_percentage: Math.round(renewablePercentage * 100) / 100,
    non_renewable_percentage: Math.round((100 - renewablePercentage) * 100) / 100,
    sources: sources.sort((a, b) => b.percentage - a.percentage)
  };
}

async function backfill() {
  console.log('🔄 Backfilling energy mix data from Electricity Maps API\n');

  // Get electricity metrics
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, energy_type')
    .eq('energy_type', 'electricity');

  console.log(`Found ${metrics?.length || 0} electricity metrics\n`);

  // Get all electricity records
  const { data: records } = await supabase
    .from('metrics_data')
    .select('id, metric_id, value, period_start, metadata')
    .in('metric_id', metrics?.map(m => m.id) || [])
    .order('period_start', { ascending: true }); // Oldest first (more likely to have API data)

  console.log(`Processing ${records?.length || 0} records...\n`);

  let updated = 0;
  let skipped = 0;
  let future = 0;
  let failed = 0;

  for (const record of records || []) {
    // Skip if already has Scope 2 and Scope 3 emission factors
    if (record.metadata?.grid_mix?.sources?.length > 0 &&
        record.metadata?.grid_mix?.carbon_intensity_scope2 &&
        record.metadata?.grid_mix?.carbon_intensity_scope3_cat3) {
      skipped++;
      continue;
    }

    const date = new Date(record.period_start);
    const datetime = date.toISOString();

    // Skip future dates (API only has historical + current data)
    if (date > new Date()) {
      future++;
      continue;
    }

    console.log(`Processing ${record.id.substring(0, 8)} (${datetime.substring(0, 10)})...`);

    // Fetch grid mix from API
    const breakdown = await fetchGridMix('PT', datetime);
    if (!breakdown) {
      console.log(`  ⚠️  No grid mix data from API`);
      failed++;
      continue;
    }

    // Check if we got valid data
    if (!breakdown.renewablePercentage && breakdown.renewablePercentage !== 0) {
      console.log(`  ⚠️  Invalid grid mix data from API`);
      failed++;
      continue;
    }

    // Fetch carbon intensity from API (lifecycle = Scope 2 + Scope 3)
    const carbonData = await fetchCarbonIntensity('PT', datetime);

    // Convert grid mix
    const mix = convertToEnergyMix(breakdown);
    const totalKwh = parseFloat(record.value) || 0;
    const renewableKwh = totalKwh * (mix.renewable_percentage / 100);
    const nonRenewableKwh = totalKwh * (mix.non_renewable_percentage / 100);

    // Calculate emissions using carbon intensity (gCO2eq/kWh)
    let emissionFactorLifecycle = null;
    let emissionFactorScope2 = null;
    let emissionFactorScope3 = null;
    let calculatedEmissionsTotal = null;
    let calculatedEmissionsScope2 = null;
    let calculatedEmissionsScope3 = null;

    if (carbonData && carbonData.carbonIntensity) {
      emissionFactorLifecycle = carbonData.carbonIntensity; // gCO2eq/kWh (total)

      // Electricity Maps lifecycle factor includes both Scope 2 and Scope 3
      // According to literature, Scope 3 upstream is typically 10-20% of lifecycle
      // For Portugal's mix, we estimate Scope 3 as 15% of total lifecycle
      // This is a conservative estimate; actual split varies by source
      emissionFactorScope3 = emissionFactorLifecycle * 0.15; // Upstream (15%)
      emissionFactorScope2 = emissionFactorLifecycle * 0.85; // Direct (85%)

      calculatedEmissionsTotal = (totalKwh * emissionFactorLifecycle) / 1000; // kgCO2e
      calculatedEmissionsScope2 = (totalKwh * emissionFactorScope2) / 1000; // kgCO2e
      calculatedEmissionsScope3 = (totalKwh * emissionFactorScope3) / 1000; // kgCO2e
    }

    // Update metadata with grid mix AND emission factors (Scope 2 + Scope 3)
    const newMetadata = {
      ...(record.metadata || {}),
      grid_mix: {
        provider: 'Electricity Maps',
        zone: breakdown.zone,
        datetime: breakdown.datetime,
        country: 'PT',
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        renewable_percentage: mix.renewable_percentage,
        non_renewable_percentage: mix.non_renewable_percentage,
        renewable_kwh: renewableKwh,
        non_renewable_kwh: nonRenewableKwh,
        sources: mix.sources,

        // Emission factors (gCO2eq/kWh)
        carbon_intensity_lifecycle: emissionFactorLifecycle, // Total (Scope 2 + 3)
        carbon_intensity_scope2: emissionFactorScope2, // Direct emissions at plant
        carbon_intensity_scope3_cat3: emissionFactorScope3, // Upstream (fuel extraction, transport)

        // Calculated emissions (kgCO2e)
        calculated_emissions_total_kgco2e: calculatedEmissionsTotal,
        calculated_emissions_scope2_kgco2e: calculatedEmissionsScope2,
        calculated_emissions_scope3_cat3_kgco2e: calculatedEmissionsScope3,

        emission_factor_type: carbonData?.emissionFactorType || null,
        source: 'electricity_maps_api',
        updated_at: new Date().toISOString()
      }
    };

    // Direct update using service key (bypasses RLS)
    try {
      const { error } = await supabase
        .from('metrics_data')
        .update({ metadata: newMetadata })
        .eq('id', record.id);

      if (error) {
        console.log(`  ❌ Error: ${error.message}`);
        failed++;
      } else {
        const emissionInfo = emissionFactorLifecycle
          ? ` | Scope 2: ${emissionFactorScope2.toFixed(0)} + Scope 3: ${emissionFactorScope3.toFixed(0)} = ${emissionFactorLifecycle.toFixed(0)} gCO2/kWh`
          : '';
        console.log(`  ✅ Updated (${mix.renewable_percentage}% renewable${emissionInfo})`);
        updated++;
      }
    } catch (err: any) {
      console.log(`  ❌ Exception: ${err.message}`);
      failed++;
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n📊 Backfill Summary:`);
  console.log(`  ✅ Updated: ${updated}`);
  console.log(`  ⏭️  Already had data: ${skipped}`);
  console.log(`  📅 Future dates: ${future}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  📝 Total: ${records?.length || 0}`);
}

backfill();
