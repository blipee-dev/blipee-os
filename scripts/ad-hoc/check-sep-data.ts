import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkSepData() {
  console.log('🔍 Checking September 2025 Data for Comparison\n');

  const { data, count } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-09-01')
    .lt('period_start', '2025-10-01');

  console.log(`Total September records: ${count}`);

  if (data) {
    // Deduplicate
    const seen = new Set<string>();
    const unique = data.filter(r => {
      const key = `${r.metric_id}|${r.period_start}|${r.site_id || 'null'}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const totalEmissions = unique.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
    console.log(`Unique September records: ${unique.length}`);
    console.log(`Total September emissions: ${(totalEmissions / 1000).toFixed(1)} tCO2e\n`);

    console.log('First 5 unique records:');
    unique.slice(0, 5).forEach(r => {
      console.log(`  Metric: ${r.metric_id?.substring(0, 8)}... Site: ${r.site_id?.substring(0, 8) || 'null'}...`);
      console.log(`  Value: ${r.co2e_emissions} kg CO2e`);
    });
  }
}

checkSepData().catch(console.error);
