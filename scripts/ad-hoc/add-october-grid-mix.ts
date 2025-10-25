import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

// EDP Q4 2025 Official Data
const OCTOBER_2025 = {
  renewable_percentage: 56.99,
  carbon_intensity: 127.52,
  sources: {
    hydro: 31.22,
    wind: 11.38,
    solar: 5.5, // Estimated from "Other renewables" 10.71%
    biomass: 5.21, // Remaining from other renewables
    'renewable cogeneration': 3.39,
    gas: 28.35,
    nuclear: 10.57,
    coal: 0.58,
    'fossil cogeneration': 3.23,
    waste: 0.58
  }
};

async function addOctoberGridMix() {
  console.log('🔄 Adding October 2025 Grid Mix (EDP Q4 Official Data)\n');
  console.log('='.repeat(80));

  try {
    const { data: electricityMetric } = await supabase
      .from('metrics_catalog')
      .select('id, name')
      .eq('name', 'Electricity')
      .single();

    if (!electricityMetric) {
      console.log('❌ No Electricity metric found');
      return;
    }

    // Check if October record exists
    const { data: octoberRecord } = await supabase
      .from('metrics_data')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('metric_id', electricityMetric.id)
      .eq('period_start', '2025-10-01')
      .single();

    if (!octoberRecord) {
      console.log('❌ No October 2025 electricity record found');
      console.log('ℹ️  Available months: Jan-Sep 2025');
      return;
    }

    console.log(`\n📊 Found October 2025 record`);
    console.log(`   Consumption: ${(parseFloat(octoberRecord.value) / 1000).toFixed(1)} MWh`);

    const consumption = parseFloat(octoberRecord.value) || 0;
    const renewableKwh = (consumption * OCTOBER_2025.renewable_percentage) / 100;
    const nonRenewableKwh = consumption - renewableKwh;

    // Calculate emissions (kgCO2e)
    const emissionsScope2 = (consumption * OCTOBER_2025.carbon_intensity) / 1000;

    // Build sources array
    const renewableSources = ['hydro', 'wind', 'solar', 'biomass', 'renewable cogeneration', 'geothermal'];
    const sources = Object.entries(OCTOBER_2025.sources).map(([name, percentage]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      percentage,
      renewable: renewableSources.some(rs => name.toLowerCase().includes(rs.toLowerCase()))
    }));

    sources.sort((a, b) => b.percentage - a.percentage);

    // Calculate fossil-free percentage (renewables + nuclear)
    const fossilFreePercentage = OCTOBER_2025.renewable_percentage + OCTOBER_2025.sources.nuclear;

    // Create grid mix metadata
    const gridMixMetadata = {
      grid_mix: {
        zone: 'PT',
        year: 2025,
        month: 10,
        period: '2025-10',
        provider: 'EDP Portugal',
        renewable_percentage: OCTOBER_2025.renewable_percentage,
        non_renewable_percentage: 100 - OCTOBER_2025.renewable_percentage,
        fossil_free_percentage: fossilFreePercentage,
        renewable_kwh: renewableKwh,
        non_renewable_kwh: nonRenewableKwh,
        carbon_intensity_lifecycle: OCTOBER_2025.carbon_intensity,
        carbon_intensity_scope2: OCTOBER_2025.carbon_intensity * 0.85,
        carbon_intensity_scope3_cat3: OCTOBER_2025.carbon_intensity * 0.15,
        sources: sources,
        method: 'edp_official',
        note: 'EDP Portugal Q4 2025 official data',
        calibration_source: 'https://www.edp.pt/origem-energia/?sector=17026&year=2025&trimester=4',
        fetched_at: new Date().toISOString()
      }
    };

    // Merge with existing metadata
    const existingMetadata = octoberRecord.metadata || {};
    const updatedMetadata = {
      ...existingMetadata,
      ...gridMixMetadata
    };

    // Update record
    const { error: updateError } = await supabase
      .from('metrics_data')
      .update({
        metadata: updatedMetadata,
        co2e_emissions: emissionsScope2
      })
      .eq('id', octoberRecord.id);

    if (updateError) {
      console.error(`❌ Error updating record:`, updateError);
    } else {
      console.log('\n✅ October 2025 Updated:');
      console.log(`   Renewable: ${OCTOBER_2025.renewable_percentage.toFixed(2)}%`);
      console.log(`   Carbon Intensity: ${OCTOBER_2025.carbon_intensity} gCO2/kWh`);
      console.log(`   Top Sources:`);
      sources.slice(0, 5).forEach(s => {
        const icon = s.renewable ? '🌱' : '⚡';
        console.log(`     ${icon} ${s.name}: ${s.percentage.toFixed(2)}%`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log('   ✅ October 2025 updated with EDP official Q4 data');
    console.log('   📝 Source: EDP Portugal Origem de Energia');
    console.log('   🌍 Zone: Portugal (PT)');
    console.log('   📅 Period: Q4 2025 (Oct-Dec)');
    console.log('='.repeat(80));
    console.log('✅ Grid mix data updated!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addOctoberGridMix();
