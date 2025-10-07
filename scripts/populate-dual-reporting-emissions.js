const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Default emission factors (tCO2e/MWh)
const EMISSION_FACTORS = {
  // Location-based (grid average for Portugal)
  location_based: {
    portugal: 0.234, // IEA 2023 Portugal grid emission factor
    default: 0.475   // Global average
  },

  // Market-based (contractual instruments)
  market_based: {
    renewable: 0.0,        // RECs, green tariffs
    supplier_specific: 0.2, // Typical supplier-specific factor
    residual_mix: 0.5      // When no contractual instruments
  }
};

async function populateDualReportingEmissions() {
  console.log('=== POPULATING DUAL REPORTING EMISSIONS ===\n');

  // Get all Scope 2 metrics from catalog first
  const { data: scope2Metrics, error: catalogError } = await supabaseAdmin
    .from('metrics_catalog')
    .select('id, code, name, scope, energy_source_type, fuel_source')
    .eq('scope', 'scope_2');

  if (catalogError) {
    console.error('❌ Error fetching metrics catalog:', catalogError);
    return;
  }

  const scope2MetricIds = scope2Metrics.map(m => m.id);
  console.log(`Found ${scope2Metrics.length} Scope 2 metrics in catalog`);

  // Get all Scope 2 electricity metrics data
  const { data: scope2Data, error: fetchError } = await supabaseAdmin
    .from('metrics_data')
    .select('id, metric_id, value, unit, scope2_method, co2e_emissions')
    .in('metric_id', scope2MetricIds)
    .not('value', 'is', null);

  if (fetchError) {
    console.error('❌ Error fetching Scope 2 data:', fetchError);
    return;
  }

  console.log(`Found ${scope2Data.length} Scope 2 records\n`);

  // Create lookup map for metrics
  const metricsMap = new Map(scope2Metrics.map(m => [m.id, m]));

  let updated = 0;
  let skipped = 0;

  for (const record of scope2Data) {
    const metric = metricsMap.get(record.metric_id);

    // Skip if not electricity-related
    if (!metric?.code.includes('electric') && !metric?.code.includes('grid')) {
      skipped++;
      continue;
    }

    // Convert value to MWh if needed
    let mwhValue = parseFloat(record.value);
    if (record.unit?.toLowerCase() === 'kwh') {
      mwhValue = mwhValue / 1000;
    } else if (record.unit?.toLowerCase() === 'gj') {
      mwhValue = mwhValue / 3.6; // 1 MWh = 3.6 GJ
    }

    // Determine if this is renewable electricity
    const isRenewable = metric?.energy_source_type === 'renewable' ||
                       metric?.code.includes('renewable') ||
                       metric?.code.includes('solar') ||
                       metric?.code.includes('wind');

    // Calculate location-based emissions (always uses grid factor)
    const locationBasedEmissions = mwhValue * EMISSION_FACTORS.location_based.portugal;

    // Calculate market-based emissions
    let marketBasedEmissions;
    if (isRenewable) {
      // Renewable electricity with RECs = 0 emissions
      marketBasedEmissions = 0;
    } else if (record.scope2_method === 'market_based') {
      // Use existing market-based factor if specified
      marketBasedEmissions = (record.co2e_emissions / 1000) || (mwhValue * EMISSION_FACTORS.market_based.supplier_specific);
    } else {
      // Default to residual mix if no contractual instruments
      marketBasedEmissions = mwhValue * EMISSION_FACTORS.market_based.residual_mix;
    }

    // Prepare update
    const updates = {
      emissions_location_based: parseFloat(locationBasedEmissions.toFixed(3)),
      emissions_market_based: parseFloat(marketBasedEmissions.toFixed(3)),
      grid_region: 'Portugal',
      emission_factor_source: isRenewable ?
        'Renewable Energy Certificate (REC)' :
        'IEA 2023 Portugal Grid Emission Factor',
      data_quality: 'measured'
    };

    // Update the record
    const { error: updateError } = await supabaseAdmin
      .from('metrics_data')
      .update(updates)
      .eq('id', record.id);

    if (updateError) {
      console.error(`❌ Error updating record ${record.id}:`, updateError);
    } else {
      console.log(`✅ ${metric.code}: LB=${locationBasedEmissions.toFixed(3)} tCO2e, MB=${marketBasedEmissions.toFixed(3)} tCO2e`);
      updated++;
    }
  }

  console.log('\n=== DUAL REPORTING SUMMARY ===');
  console.log(`Total Scope 2 records: ${scope2Data.length}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);

  // Show totals
  const { data: totals } = await supabaseAdmin
    .from('metrics_data')
    .select('emissions_location_based, emissions_market_based')
    .not('emissions_location_based', 'is', null);

  if (totals && totals.length > 0) {
    const totalLB = totals.reduce((sum, r) => sum + (parseFloat(r.emissions_location_based) || 0), 0);
    const totalMB = totals.reduce((sum, r) => sum + (parseFloat(r.emissions_market_based) || 0), 0);

    console.log('\n=== TOTAL SCOPE 2 EMISSIONS ===');
    console.log(`Location-based: ${totalLB.toFixed(2)} tCO2e`);
    console.log(`Market-based: ${totalMB.toFixed(2)} tCO2e`);
    console.log(`Difference: ${(totalLB - totalMB).toFixed(2)} tCO2e (${((totalLB - totalMB) / totalLB * 100).toFixed(1)}%)`);
  }
}

populateDualReportingEmissions();
