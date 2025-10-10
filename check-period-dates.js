const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://quovvwrwyfkzhgqdeham.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkDates() {
  console.log('Checking period_start and period_end for 2025 Jan data...\n');

  const { data, error } = await supabase
    .from('metrics_data')
    .select('period_start, period_end')
    .eq('organization_id', ORG_ID)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2025-02-01')
    .order('period_start', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} records:`);
  data.forEach(d => {
    console.log(`  period_start: ${d.period_start}, period_end: ${d.period_end}`);
  });

  console.log('\n\nNow testing the query filter used in getMonthlyEmissions:');
  console.log('Query: period_start >= "2024-01-01" AND period_end <= "2024-12-31"\n');

  const { data: data2024, error: error2024 } = await supabase
    .from('metrics_data')
    .select('period_start, period_end')
    .eq('organization_id', ORG_ID)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31')
    .order('period_start', { ascending: true })
    .limit(10);

  if (error2024) {
    console.error('Error:', error2024);
    return;
  }

  console.log(`Found ${data2024.length} records:`);
  data2024.forEach(d => {
    console.log(`  period_start: ${d.period_start}, period_end: ${d.period_end}`);
  });
}

checkDates();
