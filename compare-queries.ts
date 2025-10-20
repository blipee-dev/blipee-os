import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function compareQueries() {
  console.log('Comparing data from both queries\n');

  // Cleanup script query
  const { data: cleanupData } = await supabase
    .from('metrics_data')
    .select('id, metric_id, site_id, period_start, value, co2e_emissions, created_at')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  // Check script query
  const { data: checkData } = await supabase
    .from('metrics_data')
    .select('id, metric_id, site_id, period_start, value, co2e_emissions, created_at')
    .eq('organization_id', organizationId)
    .order('period_start', { ascending: true });

  console.log(`Cleanup query: ${cleanupData?.length || 0} records`);
  console.log(`Check query: ${checkData?.length || 0} records\n`);

  if (!cleanupData || !checkData) {
    console.error('Error fetching data');
    return;
  }

  // Show first 3 records from each
  console.log('First 3 records from cleanup query:');
  cleanupData.slice(0, 3).forEach((r, i) => {
    const key = `${r.metric_id}|${r.period_start}|${r.site_id || 'null'}`;
    console.log(`  [${i + 1}] ${key.substring(0, 60)}...`);
    console.log(`      period_start type: ${typeof r.period_start}`);
    console.log(`      period_start value: ${r.period_start}`);
  });

  console.log('\nFirst 3 records from check query:');
  checkData.slice(0, 3).forEach((r, i) => {
    const key = `${r.metric_id}|${r.period_start}|${r.site_id || 'null'}`;
    console.log(`  [${i + 1}] ${key.substring(0, 60)}...`);
    console.log(`      period_start type: ${typeof r.period_start}`);
    console.log(`      period_start value: ${r.period_start}`);
  });

  // Group both with EXACT same logic
  const groupsCleanup = new Map<string, any[]>();
  cleanupData.forEach(record => {
    const key = `${record.metric_id}|${record.period_start}|${record.site_id || 'null'}`;
    if (!groupsCleanup.has(key)) {
      groupsCleanup.set(key, []);
    }
    groupsCleanup.get(key)!.push(record);
  });

  const groupsCheck = new Map<string, any[]>();
  checkData.forEach(record => {
    const key = `${record.metric_id}|${record.period_start}|${record.site_id || 'null'}`;
    if (!groupsCheck.has(key)) {
      groupsCheck.set(key, []);
    }
    groupsCheck.get(key)!.push(record);
  });

  console.log('\nGrouping results:');
  console.log(`  Cleanup groups: ${groupsCleanup.size}`);
  console.log(`  Check groups: ${groupsCheck.size}`);

  // Find first duplicate in check data
  const dupInCheck = Array.from(groupsCheck.entries()).find(([_, records]) => records.length > 1);
  if (dupInCheck) {
    const [key, records] = dupInCheck;
    console.log(`\nFirst duplicate in check data:`);
    console.log(`  Key: ${key}`);
    console.log(`  Count: ${records.length}`);

    // Check if this key exists in cleanup groups
    const cleanupGroup = groupsCleanup.get(key);
    console.log(`  In cleanup groups: ${cleanupGroup ? `YES (${cleanupGroup.length} records)` : 'NO'}`);
  }
}

compareQueries().catch(console.error);
