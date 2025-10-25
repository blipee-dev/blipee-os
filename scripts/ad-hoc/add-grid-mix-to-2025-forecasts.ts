import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

// Portugal 2025 projected grid mix (based on EDP/REN trends)
const gridMix2025 = {
  year: 2025,
  zone: 'PT',
  provider: 'REN/IEA Projection for 2025',
  renewable_percentage: 70.5, // Projected increase from 2024
  sources: [
    { name: 'Hydro', renewable: true, percentage: 28.5 },
    { name: 'Wind', renewable: true, percentage: 29.8 },
    { name: 'Solar', renewable: true, percentage: 10.8 },
    { name: 'Biomass', renewable: true, percentage: 7.4 },
    { name: 'Natural Gas', renewable: false, percentage: 18.2 },
    { name: 'Coal', renewable: false, percentage: 2.1 },
    { name: 'Other', renewable: false, percentage: 3.2 }
  ],
  carbon_intensity_scope2: 155, // Projected improvement from 165 in 2024
  carbon_intensity_lifecycle: 155,
  carbon_intensity_scope3_cat3: 0,
  note: 'Projected Portugal grid mix for 2025 based on renewable energy trends'
};

async function addGridMix() {
  console.log('⚡ Adding Grid Mix to 2025 Energy Forecasts\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Get electricity and EV charging metrics (grid-connected)
  const { data: gridMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, name, code')
    .in('code', ['scope2_electricity_grid', 'scope2_ev_charging']);

  console.log(`Grid-connected metrics: ${gridMetrics?.length}\n`);
  gridMetrics?.forEach(m => console.log(`  - ${m.name} (${m.code})`));

  const metricIds = gridMetrics?.map(m => m.id) || [];

  // Get all 2025 records for these metrics
  const { data: records2025 } = await supabase
    .from('metrics_data')
    .select('id, metric_id, value, metadata, period_start')
    .eq('organization_id', organizationId)
    .in('metric_id', metricIds)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  console.log(`\n📊 Found ${records2025?.length} 2025 grid electricity records\n`);

  if (!records2025 || records2025.length === 0) {
    console.log('❌ No 2025 electricity records found');
    return;
  }

  let updated = 0;
  let errors = 0;

  for (const record of records2025) {
    const value = parseFloat(record.value) || 0;
    
    // Calculate renewable and non-renewable kWh based on grid mix
    const renewable_kwh = value * (gridMix2025.renewable_percentage / 100);
    const non_renewable_kwh = value * ((100 - gridMix2025.renewable_percentage) / 100);

    // Merge grid_mix into existing metadata
    const updatedMetadata = {
      ...record.metadata,
      grid_mix: {
        ...gridMix2025,
        renewable_kwh,
        non_renewable_kwh,
        fossil_free_percentage: gridMix2025.renewable_percentage,
        fetched_at: new Date().toISOString()
      }
    };

    // Update the record
    const { error } = await supabase
      .from('metrics_data')
      .update({ metadata: updatedMetadata })
      .eq('id', record.id);

    if (error) {
      console.error(`❌ Error updating ${record.id}:`, error.message);
      errors++;
    } else {
      updated++;
      if (updated % 10 === 0) {
        console.log(`   Updated ${updated}/${records2025.length} records...`);
      }
    }
  }

  console.log(`\n✅ Update complete!`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Errors: ${errors}`);
  console.log(`\n📊 2025 Grid Mix Applied:`);
  console.log(`   Renewable: ${gridMix2025.renewable_percentage}%`);
  console.log(`   Carbon Intensity: ${gridMix2025.carbon_intensity_scope2} gCO2eq/kWh`);
  console.log(`   Sources:`, gridMix2025.sources.map(s => `${s.name} (${s.percentage}%)`).join(', '));
}

addGridMix().catch(console.error);
