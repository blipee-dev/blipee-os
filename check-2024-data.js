const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkData() {
  console.log('Checking for 2024 data...\n');

  const { data, error } = await supabase
    .from('metrics_data')
    .select('period_start, co2e_emissions')
    .eq('organization_id', ORG_ID)
    .gte('period_start', '2024-01-01')
    .lt('period_start', '2025-01-01')
    .order('period_start', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ NO 2024 DATA FOUND');
    console.log('\nThis explains why YoY is broken - there is no 2024 data to compare against!');
  } else {
    console.log(`✅ Found ${data.length} records in 2024 (showing first 10):`);
    data.forEach(d => {
      console.log(`  ${d.period_start}: ${(d.co2e_emissions / 1000).toFixed(2)} tCO2e`);
    });
  }

  // Also check 2025 data
  console.log('\n\nChecking 2025 data...');
  const { data: data2025, error: error2025 } = await supabase
    .from('metrics_data')
    .select('period_start, co2e_emissions')
    .eq('organization_id', ORG_ID)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true })
    .limit(10);

  if (error2025) {
    console.error('Error:', error2025);
    return;
  }

  if (data2025 && data2025.length > 0) {
    console.log(`✅ Found ${data2025.length} records in 2025 (showing first 10):`);
    data2025.forEach(d => {
      console.log(`  ${d.period_start}: ${(d.co2e_emissions / 1000).toFixed(2)} tCO2e`);
    });
  }
}

checkData();
