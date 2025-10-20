/**
 * Clean up duplicate metrics_data records
 *
 * WARNING: This script will DELETE duplicate records from the database.
 * It keeps the first record (by created_at) for each (metric_id, period_start, site_id) combination.
 *
 * Run with: npx tsx cleanup-duplicate-metrics.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
const DRY_RUN = true; // Set to false to actually delete records

async function cleanupDuplicates() {
  console.log('🧹 Starting duplicate cleanup...\n');
  console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN (no deletions)' : '⚠️  LIVE MODE (will delete duplicates)'}\n`);

  // Fetch all data
  const { data: allRecords, error } = await supabase
    .from('metrics_data')
    .select('id, metric_id, period_start, site_id, created_at, value, co2e_emissions')
    .eq('organization_id', organizationId)
    .gte('period_start', '2022-01-01')
    .order('created_at', { ascending: true }); // Oldest first

  if (error) {
    console.error('❌ Error fetching data:', error);
    return;
  }

  console.log(`📊 Fetched ${allRecords.length} total records\n`);

  // Group by unique key
  const groups = new Map<string, any[]>();
  allRecords.forEach(record => {
    const key = `${record.metric_id}|${record.period_start}|${record.site_id || 'null'}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(record);
  });

  // Find duplicates
  const duplicatesToDelete: string[] = [];
  let duplicateCount = 0;

  groups.forEach((records, key) => {
    if (records.length > 1) {
      duplicateCount++;
      // Keep the first record (oldest created_at), delete the rest
      const [keep, ...deleteRecords] = records;

      console.log(`Duplicate set ${duplicateCount}: ${key}`);
      console.log(`  Keep: ${keep.id} (created ${keep.created_at})`);
      console.log(`  Delete: ${deleteRecords.map(r => `${r.id} (created ${r.created_at})`).join(', ')}`);

      deleteRecords.forEach(record => {
        duplicatesToDelete.push(record.id);
      });
    }
  });

  console.log(`\n📈 Summary:`);
  console.log(`  Total records: ${allRecords.length}`);
  console.log(`  Unique groups: ${groups.size}`);
  console.log(`  Duplicate sets: ${duplicateCount}`);
  console.log(`  Records to delete: ${duplicatesToDelete.length}`);
  console.log(`  Records after cleanup: ${allRecords.length - duplicatesToDelete.length}\n`);

  if (duplicatesToDelete.length === 0) {
    console.log('✅ No duplicates to delete!\n');
    return;
  }

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE: No records were deleted.');
    console.log('   Set DRY_RUN = false to actually delete the duplicates.\n');

    // Show first 20 IDs that would be deleted
    console.log('First 20 record IDs that would be deleted:');
    duplicatesToDelete.slice(0, 20).forEach((id, i) => {
      console.log(`  ${i + 1}. ${id}`);
    });

    return;
  }

  // Actually delete duplicates (batch delete)
  console.log('⚠️  Deleting duplicates...\n');

  // Delete in batches of 100
  const batchSize = 100;
  for (let i = 0; i < duplicatesToDelete.length; i += batchSize) {
    const batch = duplicatesToDelete.slice(i, i + batchSize);
    const { error: deleteError } = await supabase
      .from('metrics_data')
      .delete()
      .in('id', batch);

    if (deleteError) {
      console.error(`❌ Error deleting batch ${i / batchSize + 1}:`, deleteError);
    } else {
      console.log(`✅ Deleted batch ${i / batchSize + 1} (${batch.length} records)`);
    }
  }

  console.log('\n✅ Cleanup complete!');
  console.log(`   Deleted ${duplicatesToDelete.length} duplicate records\n`);
}

cleanupDuplicates().catch(console.error);
