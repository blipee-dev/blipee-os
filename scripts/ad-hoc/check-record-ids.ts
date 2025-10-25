import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkRecordIds() {
  console.log('Checking which records are in each query\n');

  // The specific duplicate key we found
  const targetKey = '2ce48f4e-3ae7-4856-9607-c4958d371075|2022-01-01|433ea3a5-c9a5-443d-a6c3-83340ec1f21d';
  const [metricId, periodStart, siteId] = targetKey.split('|');

  // Get ALL records matching this key
  const { data: allMatching } = await supabase
    .from('metrics_data')
    .select('id, metric_id, site_id, period_start, created_at')
    .eq('organization_id', organizationId)
    .eq('metric_id', metricId)
    .eq('period_start', periodStart)
    .eq('site_id', siteId);

  console.log(`All records matching key:`);
  console.log(`  Metric: ${metricId.substring(0, 8)}...`);
  console.log(`  Period: ${periodStart}`);
  console.log(`  Site: ${siteId.substring(0, 8)}...`);
  console.log(`  Total found: ${allMatching?.length || 0}\n`);

  allMatching?.forEach((r, i) => {
    console.log(`  [${i + 1}] ID: ${r.id}`);
    console.log(`      Created: ${r.created_at}`);
  });

  // Now check cleanup query for these specific IDs
  console.log('\n\nChecking if these IDs appear in cleanup query...\n');

  const { data: cleanupData } = await supabase
    .from('metrics_data')
    .select('id')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  const cleanupIds = new Set(cleanupData?.map(r => r.id) || []);

  allMatching?.forEach((r, i) => {
    const inCleanup = cleanupIds.has(r.id);
    console.log(`  [${i + 1}] ${r.id}: ${inCleanup ? '✅ IN cleanup query' : '❌ NOT in cleanup query'}`);
  });

  // Check total count with no order
  const { count: totalCount } = await supabase
    .from('metrics_data')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  console.log(`\n\nTotal record count (no order): ${totalCount}`);
  console.log(`Cleanup query returned: ${cleanupData?.length || 0}`);

  if (totalCount && cleanupData && totalCount > cleanupData.length) {
    console.log(`\n⚠️  MISMATCH! Cleanup query is missing ${totalCount - cleanupData.length} records!`);
  }
}

checkRecordIds().catch(console.error);
