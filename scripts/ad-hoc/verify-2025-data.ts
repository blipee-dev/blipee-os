import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function verify2025Data() {
  console.log('🔍 Verifying 2025 Forecast Data in Database\n');
  console.log('=' + '='.repeat(79) + '\n');

  const { data: data2025, count } = await supabase
    .from('metrics_data')
    .select('period_start, value, co2e_emissions, metric_id', { count: 'exact' })
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01');

  console.log(`Total 2025 records: ${count}\n`);

  if (!data2025 || data2025.length === 0) {
    console.log('❌ NO 2025 DATA FOUND!\n');
    return;
  }

  const withBoth = data2025.filter(r => r.value !== null && r.co2e_emissions !== null);
  const missingEmissions = data2025.filter(r => r.value !== null && r.co2e_emissions === null);

  console.log('Data Quality:');
  console.log(`  ✅ With value AND emissions: ${withBoth.length}`);
  console.log(`  ⚠️  With value but NO emissions: ${missingEmissions.length}\n`);

  // Sample energy data
  const { data: energyMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, name')
    .or('category.ilike.%energy%,category.ilike.%electricity%');

  const energyIds = energyMetrics?.map(m => m.id) || [];
  const energyData = data2025.filter(r => energyIds.includes(r.metric_id)).slice(0, 3);

  console.log('Sample Energy 2025:\n');
  energyData.forEach(r => {
    console.log(`  ${r.period_start}: value=${r.value}, emissions=${r.co2e_emissions}`);
  });
}

verify2025Data().catch(console.error);
