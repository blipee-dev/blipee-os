import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

// EDP 2025 Q4 reference data
const EDP_Q4_2025 = {
  renewable_percentage: 56.99,
  carbon_intensity: 127.52,
  sources: {
    hydro: 31.22,
    wind: 11.38,
    'other renewables': 10.71, // Likely solar + biomass
    'renewable cogeneration': 3.39,
    gas: 28.35,
    nuclear: 10.57,
    'fossil fuel cogeneration': 3.23,
    coal: 0.58,
    waste: 0.58
  }
};

async function compareWithEDP() {
  console.log('📊 Comparing Our Grid Mix Data with EDP Official Data\n');
  console.log('='.repeat(80));
  console.log('🏢 EDP Portugal 2025 Q4 (Oct-Dec) - Official Data:');
  console.log(`   Renewable: ${EDP_Q4_2025.renewable_percentage}%`);
  console.log(`   Carbon Intensity: ${EDP_Q4_2025.carbon_intensity} gCO2/kWh`);
  console.log('   Sources:');
  console.log(`     Hydro: ${EDP_Q4_2025.sources.hydro}%`);
  console.log(`     Wind: ${EDP_Q4_2025.sources.wind}%`);
  console.log(`     Other Renewables: ${EDP_Q4_2025.sources['other renewables']}%`);
  console.log(`     Natural Gas: ${EDP_Q4_2025.sources.gas}%`);
  console.log(`     Nuclear (imported): ${EDP_Q4_2025.sources.nuclear}%`);
  console.log('='.repeat(80));

  const { data: electricityMetric } = await supabase
    .from('metrics_catalog')
    .select('id')
    .eq('name', 'Electricity')
    .single();

  if (!electricityMetric) {
    console.log('❌ No Electricity metric found');
    return;
  }

  const { data: records } = await supabase
    .from('metrics_data')
    .select('period_start, metadata')
    .eq('organization_id', organizationId)
    .eq('metric_id', electricityMetric.id)
    .gte('period_start', '2025-01-01')
    .lte('period_start', '2025-12-31')
    .order('period_start');

  if (!records || records.length === 0) {
    console.log('❌ No 2025 records found');
    return;
  }

  console.log('\n📈 Our 2025 Grid Mix Data:\n');

  records.forEach(record => {
    const month = record.period_start.substring(0, 7);
    const monthName = new Date(record.period_start).toLocaleString('default', { month: 'short' });
    const gridMix = record.metadata?.grid_mix;

    if (gridMix) {
      const renewable = gridMix.renewable_percentage || 0;
      const carbon = gridMix.carbon_intensity_lifecycle || 0;

      // Calculate difference from EDP Q4 data
      const renewableDiff = renewable - EDP_Q4_2025.renewable_percentage;
      const carbonDiff = carbon - EDP_Q4_2025.carbon_intensity;

      const isOctober = month === '2025-10';
      const marker = isOctober ? ' 👈 Q4 comparison' : '';

      console.log(`${monthName} ${month}:${marker}`);
      console.log(`  Renewable: ${renewable.toFixed(1)}% (${renewableDiff > 0 ? '+' : ''}${renewableDiff.toFixed(1)}% vs EDP)`);
      console.log(`  Carbon: ${carbon} gCO2/kWh (${carbonDiff > 0 ? '+' : ''}${carbonDiff.toFixed(1)} vs EDP)`);

      // Show top sources
      if (gridMix.sources) {
        const topSources = gridMix.sources
          .sort((a: any, b: any) => b.percentage - a.percentage)
          .slice(0, 5);
        console.log(`  Top sources: ${topSources.map((s: any) => `${s.name} ${s.percentage.toFixed(1)}%`).join(', ')}`);
      }
      console.log('');
    }
  });

  console.log('='.repeat(80));
  console.log('📝 Analysis:');
  console.log('='.repeat(80));
  console.log('Our seasonal model shows higher renewable % in summer months due to:');
  console.log('  - High solar contribution during peak sunshine hours (used noon baseline)');
  console.log('  - EDP Q4 data represents Oct-Dec average (lower solar season)');
  console.log('');
  console.log('Our October data should be adjusted to better match EDP Q4 official figures.');
  console.log('Winter months (Jan-Feb) may be underestimating renewables vs actual grid mix.');
  console.log('='.repeat(80));
}

compareWithEDP();
