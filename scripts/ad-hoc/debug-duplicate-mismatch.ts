import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function debugMismatch() {
  console.log('🔍 Debugging Duplicate Detection Mismatch\n');

  // Query 1: Same as check script
  const { data: data1 } = await supabase
    .from('metrics_data')
    .select('id, metric_id, site_id, period_start')
    .eq('organization_id', organizationId)
    .order('period_start', { ascending: true });

  // Query 2: Same as cleanup script
  const { data: data2 } = await supabase
    .from('metrics_data')
    .select('id, metric_id, site_id, period_start')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: true });

  console.log(`Query 1 (order by period_start): ${data1?.length || 0} records`);
  console.log(`Query 2 (order by created_at): ${data2?.length || 0} records\n`);

  if (!data1 || !data2) {
    console.error('Error fetching data');
    return;
  }

  // Check if they return the same records
  const ids1 = new Set(data1.map(r => r.id));
  const ids2 = new Set(data2.map(r => r.id));

  console.log(`Unique IDs in Query 1: ${ids1.size}`);
  console.log(`Unique IDs in Query 2: ${ids2.size}\n`);

  // Find first duplicate in data1
  const seen = new Set<string>();
  let firstDup = null;

  for (const record of data1) {
    const key = `${record.metric_id}|${record.period_start}|${record.site_id || 'null'}`;
    if (seen.has(key)) {
      firstDup = { key, record };
      break;
    }
    seen.add(key);
  }

  if (firstDup) {
    console.log('First duplicate found:');
    console.log(`  Key: ${firstDup.key}`);
    console.log(`  Record ID: ${firstDup.record.id}`);
    console.log(`  Period: ${firstDup.record.period_start}`);

    // Find all records with this key
    const matchingRecords = data1.filter(r => {
      const k = `${r.metric_id}|${r.period_start}|${r.site_id || 'null'}`;
      return k === firstDup.key;
    });

    console.log(`\n  All records with this key (${matchingRecords.length} total):`);
    matchingRecords.forEach((r, i) => {
      console.log(`    [${i + 1}] ID: ${r.id}`);
    });
  } else {
    console.log('No duplicates found in first pass');
  }

  // Count unique combinations
  const groups = new Map<string, number>();
  data1.forEach(record => {
    const key = `${record.metric_id}|${record.period_start}|${record.site_id || 'null'}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  });

  const duplicateKeys = Array.from(groups.entries()).filter(([_, count]) => count > 1);

  console.log(`\n📊 Summary:`);
  console.log(`  Total records: ${data1.length}`);
  console.log(`  Unique combinations: ${groups.size}`);
  console.log(`  Combinations with duplicates: ${duplicateKeys.length}`);
  console.log(`  Total duplicate records: ${data1.length - groups.size}`);
}

debugMismatch().catch(console.error);
