/**
 * Verify 2025 Grid Mix Update
 *
 * Check that grid mix from Electricity Maps API was correctly applied
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function verify() {
  console.log('🔍 Verifying 2025 Grid Mix Update\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Get sample records from October 2025
  const { data: records } = await supabase
    .from('metrics_data')
    .select('id, period_start, value, metadata')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-10-01')
    .lt('period_start', '2025-11-01')
    .limit(3);

  if (!records || records.length === 0) {
    console.error('❌ No October 2025 records found');
    return;
  }

  console.log(`✅ Found ${records.length} sample records from October 2025\n`);

  records.forEach((record, i) => {
    console.log(`Record ${i + 1}:`);
    console.log(`  Period: ${record.period_start}`);
    console.log(`  Value: ${record.value} kWh`);

    if (record.metadata?.grid_mix) {
      const gm = record.metadata.grid_mix;
      console.log(`  Grid Mix:`);
      console.log(`    Provider: ${gm.provider}`);
      console.log(`    Renewable: ${gm.renewable_percentage}%`);
      console.log(`    Non-Renewable: ${gm.non_renewable_percentage}%`);
      console.log(`    Carbon Intensity: ${gm.carbon_intensity_scope2 || 'N/A'} gCO2/kWh`);
      console.log(`    Sources (${gm.sources?.length || 0} total):`);
      if (gm.sources && gm.sources.length > 0) {
        gm.sources.slice(0, 5).forEach((s: any) => {
          console.log(`      - ${s.name}: ${s.percentage}% (${s.renewable ? 'renewable' : 'non-renewable'})`);
        });
        if (gm.sources.length > 5) {
          console.log(`      ... and ${gm.sources.length - 5} more`);
        }
      }
      console.log(`    Renewable kWh: ${gm.renewable_kwh?.toFixed(2) || 'N/A'}`);
      console.log(`    Non-Renewable kWh: ${gm.non_renewable_kwh?.toFixed(2) || 'N/A'}`);
    } else {
      console.log(`  ❌ No grid_mix found in metadata`);
    }
    console.log();
  });

  // Summary statistics
  const { data: allRecords } = await supabase
    .from('metrics_data')
    .select('metadata')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  const totalRecords = allRecords?.length || 0;
  const withGridMix = allRecords?.filter(r => r.metadata?.grid_mix).length || 0;
  const fromAPI = allRecords?.filter(r => r.metadata?.grid_mix?.provider === 'Electricity Maps API').length || 0;

  console.log('=' + '='.repeat(79));
  console.log('📊 Summary Statistics\n');
  console.log(`Total 2025 records: ${totalRecords}`);
  console.log(`Records with grid_mix: ${withGridMix} (${((withGridMix/totalRecords)*100).toFixed(1)}%)`);
  console.log(`Records from Electricity Maps API: ${fromAPI} (${((fromAPI/totalRecords)*100).toFixed(1)}%)`);
  console.log(`Records without grid_mix: ${totalRecords - withGridMix}`);
}

verify().catch(console.error);
