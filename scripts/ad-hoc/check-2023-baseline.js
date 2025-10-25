const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function check2023Baseline() {
  console.log('📊 Checking 2023 Baseline Emissions\n');

  // Get all 2023 emissions data
  const { data: metrics2023, error } = await supabase
    .from('metrics_data')
    .select('co2e_emissions, period_start')
    .eq('organization_id', ORG_ID)
    .gte('period_start', '2023-01-01')
    .lt('period_start', '2024-01-01');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${metrics2023.length} records for 2023`);

  // Calculate total emissions (convert from kgCO2e to tCO2e)
  const totalEmissions = metrics2023.reduce((sum, m) => {
    return sum + (m.co2e_emissions || 0);
  }, 0) / 1000;

  console.log(`\n✅ 2023 Total Emissions: ${totalEmissions.toFixed(2)} tCO2e`);

  // Check what's in the targets table
  console.log('\n📋 Current Target Baseline Values:');
  
  const { data: targets } = await supabase
    .from('sustainability_targets')
    .select('*')
    .eq('organization_id', ORG_ID)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  targets?.forEach(t => {
    console.log(`\n  Target: ${t.name || 'Unnamed'}`);
    console.log(`  Baseline Year: ${t.baseline_year}`);
    console.log(`  Baseline Value (stored): ${t.baseline_value} tCO2e`);
    console.log(`  Baseline Emissions (stored): ${t.baseline_emissions} tCO2e`);
    console.log(`  Difference: ${t.baseline_value ? (totalEmissions - t.baseline_value).toFixed(2) : 'N/A'} tCO2e`);
  });

  console.log(`\n💡 The baseline should be: ${totalEmissions.toFixed(2)} tCO2e`);
}

check2023Baseline().catch(console.error);
