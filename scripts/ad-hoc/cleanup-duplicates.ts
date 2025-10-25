import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function cleanupDuplicates() {
  console.log('🧹 Cleaning Up Duplicate Records\n');
  console.log('=' + '='.repeat(79) + '\n');

  // Get all data - Supabase has a default 1000 record limit, so we need to fetch in batches
  console.log('📥 Fetching all records (may take a moment)...\n');

  let allData: any[] = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: batch, error } = await supabase
      .from('metrics_data')
      .select('id, metric_id, site_id, period_start, value, co2e_emissions, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
      .range(from, from + batchSize - 1);

    if (error) {
      console.error('❌ Error fetching data:', error);
      return;
    }

    if (batch && batch.length > 0) {
      allData = allData.concat(batch);
      from += batchSize;
      console.log(`   Fetched ${allData.length} records so far...`);

      if (batch.length < batchSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  console.log(`\n📊 Total records fetched: ${allData.length}\n`);

  // Group by unique key
  const groups = new Map<string, any[]>();
  allData.forEach(record => {
    const key = `${record.metric_id}|${record.period_start}|${record.site_id || 'null'}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  });

  // Find records to delete (keep first record in each group, delete the rest)
  const recordsToDelete: string[] = [];

  groups.forEach((records, key) => {
    if (records.length > 1) {
      // Sort by created_at (oldest first), then by id (deterministic)
      records.sort((a, b) => {
        if (a.created_at !== b.created_at) {
          return a.created_at.localeCompare(b.created_at);
        }
        return a.id.localeCompare(b.id);
      });

      // Keep the first record, mark the rest for deletion
      for (let i = 1; i < records.length; i++) {
        recordsToDelete.push(records[i].id);
      }
    }
  });

  // Debug: Show sample groups
  let duplicateCount = 0;
  groups.forEach((records) => {
    if (records.length > 1) duplicateCount++;
  });

  console.log(`🎯 Records Analysis:`);
  console.log(`   Total records: ${allData.length}`);
  console.log(`   Unique combinations: ${groups.size}`);
  console.log(`   Combinations with duplicates: ${duplicateCount}`);
  console.log(`   Duplicate records to delete: ${recordsToDelete.length}`);
  console.log(`   Records to keep: ${allData.length - recordsToDelete.length}\n`);

  if (recordsToDelete.length === 0) {
    console.log('✅ No duplicates to clean up!\n');
    return;
  }

  // Calculate impact
  const keptRecords = allData.filter(r => !recordsToDelete.includes(r.id));
  const deletedRecords = allData.filter(r => recordsToDelete.includes(r.id));

  const totalBefore = allData.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
  const totalAfter = keptRecords.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
  const totalDeleted = deletedRecords.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);

  console.log(`📈 Impact Analysis:`);
  console.log(`   Emissions before: ${(totalBefore / 1000).toFixed(2)} tCO2e`);
  console.log(`   Emissions after: ${(totalAfter / 1000).toFixed(2)} tCO2e`);
  console.log(`   Emissions from deleted records: ${(totalDeleted / 1000).toFixed(2)} tCO2e`);
  console.log(`   Change: ${((totalAfter - totalBefore) / 1000).toFixed(2)} tCO2e\n`);

  // Show sample of what will be deleted
  console.log(`📋 Sample Records to Delete (first 5):\n`);
  recordsToDelete.slice(0, 5).forEach((id, i) => {
    const record = allData.find(r => r.id === id);
    if (record) {
      console.log(
        `${i + 1}. ID: ${record.id.substring(0, 12)}... | ` +
        `Period: ${record.period_start} | ` +
        `CO2e: ${(record.co2e_emissions || 0).toFixed(2)} kg`
      );
    }
  });

  console.log('\n⚠️  READY TO DELETE\n');
  console.log(`This will delete ${recordsToDelete.length} duplicate records.`);
  console.log('The operation is IRREVERSIBLE.\n');

  // Delete in batches
  console.log('🗑️  Starting deletion...\n');

  const deleteBatchSize = 100;
  let deletedCount = 0;

  for (let i = 0; i < recordsToDelete.length; i += deleteBatchSize) {
    const batch = recordsToDelete.slice(i, i + deleteBatchSize);

    const { error: deleteError } = await supabase
      .from('metrics_data')
      .delete()
      .in('id', batch);

    if (deleteError) {
      console.error(`❌ Error deleting batch ${i / deleteBatchSize + 1}:`, deleteError);
    } else {
      deletedCount += batch.length;
      console.log(`✅ Deleted batch ${i / deleteBatchSize + 1} (${batch.length} records) - Total: ${deletedCount}/${recordsToDelete.length}`);
    }
  }

  console.log('\n🎉 Cleanup Complete!\n');
  console.log('Summary:');
  console.log(`   Records deleted: ${deletedCount}`);
  console.log(`   Records remaining: ${allData.length - deletedCount}`);
  console.log(`   Final emissions: ${(totalAfter / 1000).toFixed(2)} tCO2e`);
}

cleanupDuplicates().catch(console.error);
