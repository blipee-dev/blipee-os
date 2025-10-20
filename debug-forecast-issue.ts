import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function debugIssue() {
  console.log('🔍 Debug: Comparing actual Sep vs forecast Oct\n');

  // Get one specific metric to trace through
  const { data: sepData } = await supabase
    .from('metrics_data')
    .select('*, metrics_catalog(name, category)')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-09-01')
    .lt('period_start', '2025-10-01')
    .limit(5);

  const { data: octData } = await supabase
    .from('metrics_data')
    .select('*, metrics_catalog(name, category)')
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-10-01')
    .lt('period_start', '2025-11-01')
    .limit(5);

  console.log('September 2025 sample:');
  sepData?.forEach(r => {
    console.log(`  ${r.metrics_catalog?.name}:`);
    console.log(`    value: ${r.value} ${r.unit}`);
    console.log(`    co2e_emissions: ${r.co2e_emissions} kg`);
    console.log(`    site_id: ${r.site_id?.substring(0, 8)}...\n`);
  });

  console.log('\nOctober 2025 forecast sample:');
  octData?.forEach(r => {
    console.log(`  ${r.metrics_catalog?.name}:`);
    console.log(`    value: ${r.value} ${r.unit}`);
    console.log(`    co2e_emissions: ${r.co2e_emissions} kg`);
    console.log(`    site_id: ${r.site_id?.substring(0, 8)}...\n`);
  });
}

debugIssue().catch(console.error);
