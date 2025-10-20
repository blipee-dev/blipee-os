import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function deleteAll2025Forecasts() {
  console.log('🗑️  Deleting ALL 2025 ML Forecasts (to regenerate without All Sites aggregation)\n');
  console.log('='.repeat(80));

  try {
    // Count existing ML forecast records
    const { data: existingRecords, error: countError } = await supabase
      .from('metrics_data')
      .select('id, metric_id, site_id, period_start')
      .eq('organization_id', organizationId)
      .gte('period_start', '2025-01-01')
      .lte('period_start', '2025-12-31');

    if (countError) {
      console.error('❌ Error counting records:', countError);
      return;
    }

    const mlForecasts = (existingRecords || []).filter(r =>
      r.metadata && r.metadata.is_forecast === true
    );

    console.log(`\n📊 Found ${mlForecasts.length} ML forecast records for 2025\n`);

    if (mlForecasts.length === 0) {
      console.log('✅ No ML forecast records to delete');
      return;
    }

    // Delete all ML forecast records for 2025
    const deletePromises = mlForecasts.map(record =>
      supabase
        .from('metrics_data')
        .delete()
        .eq('id', record.id)
    );

    await Promise.all(deletePromises);

    console.log('='.repeat(80));
    console.log('✅ DELETION COMPLETE');
    console.log('='.repeat(80));
    console.log(`Deleted: ${mlForecasts.length} ML forecast records`);
    console.log(`Period: Jan-Dec 2025`);
    console.log(`Reason: Regenerate forecasts without pre-aggregated "All Sites" records`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

(async () => {
  await deleteAll2025Forecasts();
  process.exit(0);
})();
