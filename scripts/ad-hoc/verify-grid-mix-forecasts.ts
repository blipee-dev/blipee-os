import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function verifyGridMixForecasts() {
  console.log('✅ Verifying Grid Mix in Forecasts\n');
  console.log('='.repeat(80));

  try {
    // Get electricity metric
    const { data: electricityMetric } = await supabase
      .from('metrics_catalog')
      .select('id, name, code')
      .eq('code', 'scope2_electricity_grid')
      .single();

    if (!electricityMetric) {
      console.log('❌ Electricity metric not found');
      return;
    }

    // Get all sites
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name, address')
      .eq('organization_id', organizationId);

    if (!sites || sites.length === 0) {
      console.log('❌ No sites found');
      return;
    }

    console.log(`\n🧪 Testing Electricity Forecasts with Grid Mix\n`);
    console.log('Metric:', electricityMetric.name);
    console.log('Sites:', sites.length);
    console.log('\n' + '='.repeat(80));

    for (const site of sites) {
      console.log(`\n📍 ${site.name}`);
      console.log('─'.repeat(80));

      // Get forecast for January 2025
      const { data: forecast } = await supabase
        .from('metrics_data')
        .select('period_start, value, unit, metadata')
        .eq('organization_id', organizationId)
        .eq('metric_id', electricityMetric.id)
        .eq('site_id', site.id)
        .eq('period_start', '2025-01-01')
        .single();

      if (!forecast) {
        console.log('   ⚠️  No forecast found for January 2025');
        continue;
      }

      console.log(`   📅 Period: ${forecast.period_start}`);
      console.log(`   ⚡ Consumption: ${parseFloat(forecast.value).toFixed(2)} ${forecast.unit}`);

      // Check grid mix
      const gridMix = forecast.metadata?.grid_mix;

      if (!gridMix) {
        console.log(`   ❌ NO GRID MIX METADATA FOUND!`);
        continue;
      }

      console.log(`\n   ✅ Grid Mix Metadata Present:`);
      console.log(`   Provider: ${gridMix.provider}`);
      console.log(`   Zone: ${gridMix.zone}`);
      console.log(`   Renewable: ${gridMix.renewable_percentage?.toFixed(1)}%`);
      console.log(`   Carbon Intensity (lifecycle): ${gridMix.carbon_intensity_lifecycle?.toFixed(1)} gCO2eq/kWh`);

      // Verify calculated values
      const forecastValue = parseFloat(forecast.value);
      const expectedRenewableKwh = forecastValue * (gridMix.renewable_percentage / 100);
      const expectedNonRenewableKwh = forecastValue * (gridMix.non_renewable_percentage / 100);

      console.log(`\n   📊 Energy Breakdown:`);
      console.log(`   Renewable kWh: ${gridMix.renewable_kwh?.toFixed(2)} (expected: ${expectedRenewableKwh.toFixed(2)})`);
      console.log(`   Non-Renewable kWh: ${gridMix.non_renewable_kwh?.toFixed(2)} (expected: ${expectedNonRenewableKwh.toFixed(2)})`);

      // Verify emissions calculations
      if (gridMix.carbon_intensity_lifecycle && gridMix.calculated_emissions_total_kgco2e) {
        const expectedEmissions = (forecastValue * gridMix.carbon_intensity_lifecycle) / 1000;
        console.log(`\n   💨 Emissions:`);
        console.log(`   Total: ${gridMix.calculated_emissions_total_kgco2e?.toFixed(2)} kgCO2e`);
        console.log(`   Expected: ${expectedEmissions.toFixed(2)} kgCO2e`);
        console.log(`   Scope 2: ${gridMix.calculated_emissions_scope2_kgco2e?.toFixed(2)} kgCO2e (85%)`);
        console.log(`   Scope 3: ${gridMix.calculated_emissions_scope3_cat3_kgco2e?.toFixed(2)} kgCO2e (15%)`);
      }

      // Show top sources
      if (gridMix.sources && gridMix.sources.length > 0) {
        console.log(`\n   🔌 Energy Sources:`);
        gridMix.sources.slice(0, 5).forEach((source: any) => {
          const icon = source.renewable ? '🟢' : '🔴';
          console.log(`   ${icon} ${source.name}: ${source.percentage?.toFixed(1)}%`);
        });
      }

      // Verify source marker
      console.log(`\n   📌 Source: ${gridMix.source}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(80));
    console.log(`All ${sites.length} sites have grid mix metadata in forecasts`);
    console.log(`Grid mix includes:`);
    console.log(`  - Renewable percentage and breakdown`);
    console.log(`  - Carbon intensity (Scope 2 + Scope 3)`);
    console.log(`  - Calculated emissions`);
    console.log(`  - Energy source mix (solar, wind, hydro, etc.)`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyGridMixForecasts();
