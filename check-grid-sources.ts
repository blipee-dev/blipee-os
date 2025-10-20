import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkGridSources() {
  console.log('🔍 Checking Grid Mix Sources Breakdown\n');

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
    .lte('period_start', '2025-09-30')
    .order('period_start');

  if (!records || records.length === 0) {
    console.log('❌ No records found');
    return;
  }

  console.log('📊 Grid Mix Sources by Month:\n');

  records.forEach(record => {
    const month = record.period_start.substring(0, 7);
    const gridMix = record.metadata?.grid_mix;

    console.log(`\n${month}:`);
    if (gridMix?.sources && Array.isArray(gridMix.sources)) {
      const renewable = gridMix.renewable_percentage || 0;
      const carbonIntensity = gridMix.carbon_intensity_lifecycle || 0;
      console.log(`  Renewable %: ${renewable.toFixed(1)}%`);
      console.log(`  Carbon Intensity: ${carbonIntensity} gCO2/kWh`);
      console.log(`  Sources:`);
      gridMix.sources
        .sort((a: any, b: any) => (b.percentage || 0) - (a.percentage || 0))
        .forEach((source: any) => {
          const icon = source.renewable ? '🌱' : '⚡';
          const pct = source.percentage || 0;
          console.log(`    ${icon} ${source.name}: ${pct.toFixed(1)}%`);
        });
    } else {
      console.log('  ❌ No sources data');
    }
  });
}

checkGridSources();
