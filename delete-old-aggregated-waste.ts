import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function deleteOldAggregatedWaste() {
  console.log('🗑️  Deleting old aggregated waste records to prevent double-counting...\n');

  // Get metric IDs for old aggregated metrics that have been split
  const { data: oldMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name')
    .in('code', [
      'scope3_waste_recycling',     // Split into paper, plastic, metal, glass, mixed
      'scope3_waste_composting'     // Split into food, garden
    ]);

  console.log('📋 Old metrics to delete data for:');
  oldMetrics?.forEach(m => {
    console.log(`  - ${m.code}: ${m.name}`);
  });

  // Count records before deletion
  const { count: beforeCount } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact', head: true })
    .in('metric_id', oldMetrics?.map(m => m.id) || []);

  console.log(`\n📊 Found ${beforeCount} records to delete\n`);

  // Delete the records
  const { error, count } = await supabase
    .from('metrics_data')
    .delete({ count: 'exact' })
    .in('metric_id', oldMetrics?.map(m => m.id) || []);

  if (error) {
    console.error('❌ Error deleting records:', error);
  } else {
    console.log(`✅ Deleted ${count} old aggregated waste records\n`);
  }

  console.log('💡 Benefits:');
  console.log('  - No more double-counting in totals');
  console.log('  - Diversion rate will now calculate correctly');
  console.log('  - All waste data is now at material-level granularity');
  console.log('  - Old metrics (scope3_waste_recycling, scope3_waste_composting) are preserved in catalog');
  console.log('  - Future data can use either granular or aggregated metrics\n');
}

deleteOldAggregatedWaste();
