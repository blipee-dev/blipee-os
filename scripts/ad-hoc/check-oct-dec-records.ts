import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkRecords() {
  console.log('🔍 Checking Oct-Dec 2025 Records\n');

  const { data, error, count } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-10-01')
    .lte('period_start', '2025-12-31');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total records: ${count}`);
  console.log(`Data length: ${data?.length || 0}\n`);

  if (data && data.length > 0) {
    console.log('First 10 records:');
    data.slice(0, 10).forEach(r => {
      console.log(`  ${r.period_start}: ${r.co2e_emissions} kg CO2e = ${(r.co2e_emissions / 1000).toFixed(2)} tCO2e (metric: ${r.metric_id?.substring(0, 8)}...)`);
      console.log(`    Value: ${r.value} ${r.unit}`);
      console.log(`    Metadata: improved=${r.metadata?.improved_model}, r2=${r.metadata?.r2?.toFixed(3)}`);
    });

    // Sum all emissions
    const totalEmissions = data.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
    console.log(`\n  Total Oct-Dec emissions: ${(totalEmissions / 1000).toFixed(1)} tCO2e`);
  } else {
    console.log('No records found for Oct-Dec 2025');
  }

  // Check if any records exist at all for this org in October
  const { data: allOct, count: octCount } = await supabase
    .from('metrics_data')
    .select('period_start', { count: 'exact' })
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-10-01')
    .lt('period_start', '2025-11-01');

  console.log(`\nOctober 2025 records: ${octCount}`);
}

checkRecords().catch(console.error);
