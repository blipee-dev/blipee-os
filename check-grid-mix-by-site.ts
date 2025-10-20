import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkGridMixBySite() {
  console.log('🔍 Checking Grid Mix Data by Site\n');
  console.log('='.repeat(80));

  try {
    // Get all sites
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name, location, address')
      .eq('organization_id', organizationId);

    if (!sites || sites.length === 0) {
      console.log('❌ No sites found');
      return;
    }

    console.log(`\n📍 Found ${sites.length} sites:\n`);

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

    // Check grid mix data for each site
    for (const site of sites) {
      const country = site.address?.country || 'PT';
      const city = site.address?.city || site.location;
      console.log(`\n📍 ${site.name} (${city}, ${country})`);
      console.log('─'.repeat(80));

      // Get historical data with grid mix (2024)
      const { data: historicalData } = await supabase
        .from('metrics_data')
        .select('period_start, value, metadata')
        .eq('organization_id', organizationId)
        .eq('metric_id', electricityMetric.id)
        .eq('site_id', site.id)
        .gte('period_start', '2024-01-01')
        .lte('period_start', '2024-12-31')
        .order('period_start', { ascending: true })
        .limit(3);

      if (!historicalData || historicalData.length === 0) {
        console.log('   ⚠️  No historical electricity data found');
        continue;
      }

      const withGridMix = historicalData.filter(d => d.metadata?.grid_mix?.sources?.length > 0);
      console.log(`   Historical records (2024): ${historicalData.length}`);
      console.log(`   With grid mix: ${withGridMix.length}`);

      if (withGridMix.length > 0) {
        const sampleMix = withGridMix[0].metadata.grid_mix;
        console.log(`\n   Sample Grid Mix (${withGridMix[0].period_start}):`);
        console.log(`   Provider: ${sampleMix.provider}`);
        console.log(`   Zone: ${sampleMix.zone}`);
        console.log(`   Renewable: ${sampleMix.renewable_percentage?.toFixed(1)}%`);
        console.log(`   Carbon Intensity: ${sampleMix.carbon_intensity_lifecycle?.toFixed(1)} gCO2eq/kWh`);
        console.log(`\n   Top Sources:`);
        (sampleMix.sources || []).slice(0, 5).forEach((source: any) => {
          const icon = source.renewable ? '🟢' : '🔴';
          console.log(`   ${icon} ${source.name}: ${source.percentage?.toFixed(1)}%`);
        });
      }

      // Check 2025 forecast data
      const { data: forecastData } = await supabase
        .from('metrics_data')
        .select('period_start, value, metadata')
        .eq('organization_id', organizationId)
        .eq('metric_id', electricityMetric.id)
        .eq('site_id', site.id)
        .gte('period_start', '2025-01-01')
        .order('period_start', { ascending: true })
        .limit(3);

      if (forecastData && forecastData.length > 0) {
        const forecastWithMix = forecastData.filter(d => d.metadata?.grid_mix?.sources?.length > 0);
        console.log(`\n   Forecast records (2025): ${forecastData.length}`);
        console.log(`   With grid mix: ${forecastWithMix.length}`);

        if (forecastWithMix.length === 0) {
          console.log(`   ⚠️  Forecasts missing grid mix metadata!`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY\n');
    console.log('Grid mix includes:');
    console.log('  - Renewable percentage by energy source');
    console.log('  - Carbon intensity (Scope 2 + Scope 3)');
    console.log('  - Energy source breakdown (solar, wind, hydro, gas, etc.)');
    console.log('  - Provider and zone information');
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkGridMixBySite();
