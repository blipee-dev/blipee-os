import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function deleteAllSitesForecasts() {
  console.log('🗑️  Deleting Pre-Aggregated "All Sites" Forecasts\n');
  console.log('='.repeat(80));

  try {
    // Count existing site_id=null forecast records
    const { data: existingRecords, error: countError } = await supabase
      .from('metrics_data')
      .select('id, metric_id, period_start')
      .eq('organization_id', organizationId)
      .is('site_id', null)
      .gte('period_start', '2025-01-01');

    if (countError) {
      console.error('❌ Error counting records:', countError);
      return;
    }

    console.log(`\n📊 Found ${existingRecords?.length || 0} pre-aggregated "All Sites" forecast records\n`);

    if (!existingRecords || existingRecords.length === 0) {
      console.log('✅ No records to delete');
      return;
    }

    // Delete site_id=null forecast records
    const { error: deleteError } = await supabase
      .from('metrics_data')
      .delete()
      .eq('organization_id', organizationId)
      .is('site_id', null)
      .gte('period_start', '2025-01-01');

    if (deleteError) {
      console.error('❌ Error deleting records:', deleteError);
      return;
    }

    console.log('='.repeat(80));
    console.log('✅ DELETION COMPLETE');
    console.log('='.repeat(80));
    console.log(`Deleted: ${existingRecords.length} pre-aggregated records`);
    console.log(`Reason: "All Sites" data should be calculated dynamically by the API`);
    console.log(`Benefit: Avoids double counting when API aggregates all sites`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

(async () => {
  await deleteAllSitesForecasts();
  process.exit(0);
})();
