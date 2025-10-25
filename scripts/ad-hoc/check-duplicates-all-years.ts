import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkDuplicatesByYear() {
  console.log('🔍 Checking duplicates by year...\n');

  for (const year of [2022, 2023, 2024, 2025]) {
    const { data, error } = await supabase
      .from('metrics_data')
      .select('metric_id, period_start, site_id')
      .eq('organization_id', organizationId)
      .gte('period_start', `${year}-01-01`)
      .lte('period_start', `${year}-12-31`);

    if (error) {
      console.error(`❌ Error fetching ${year}:`, error);
      continue;
    }

    const groups = new Map<string, number>();
    data.forEach(record => {
      const key = `${record.metric_id}|${record.period_start}|${record.site_id || 'null'}`;
      groups.set(key, (groups.get(key) || 0) + 1);
    });

    const duplicates = Array.from(groups.values()).filter(count => count > 1);
    const totalRecords = data.length;
    const uniqueRecords = groups.size;
    const duplicateRecords = totalRecords - uniqueRecords;

    console.log(`${year}:`);
    console.log(`  Total records: ${totalRecords}`);
    console.log(`  Unique records: ${uniqueRecords}`);
    console.log(`  Duplicate records: ${duplicateRecords}`);
    console.log(`  Duplicate sets: ${duplicates.length}`);
    console.log(`  Impact: ${duplicateRecords > 0 ? '⚠️  DATA BEING DOUBLE-COUNTED' : '✅ No duplicates'}`);
    console.log('');
  }
}

checkDuplicatesByYear().catch(console.error);
