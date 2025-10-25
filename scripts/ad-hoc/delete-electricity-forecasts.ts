import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://quovvwrwyfkzhgqdeham.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI';
const supabase = createClient(supabaseUrl, supabaseKey);

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function deleteElectricityForecasts() {
  console.log('🗑️  Deleting Electricity Forecasts (to regenerate with grid mix)\n');
  console.log('='.repeat(80));

  try {
    // Get electricity metric
    const { data: electricityMetrics } = await supabase
      .from('metrics_catalog')
      .select('id, name, code')
      .eq('energy_type', 'electricity');

    if (!electricityMetrics || electricityMetrics.length === 0) {
      console.log('❌ No electricity metrics found');
      return;
    }

    console.log(`\n📊 Found ${electricityMetrics.length} electricity metrics:\n`);
    electricityMetrics.forEach(m => console.log(`   - ${m.name} (${m.code})`));

    const metricIds = electricityMetrics.map(m => m.id);

    // Delete 2025 forecasts for electricity metrics
    const { data: deletedRecords, error } = await supabase
      .from('metrics_data')
      .delete()
      .eq('organization_id', organizationId)
      .in('metric_id', metricIds)
      .gte('period_start', '2025-01-01')
      .lte('period_start', '2025-12-31')
      .select();

    if (error) {
      console.error('❌ Error deleting records:', error);
      return;
    }

    console.log(`\n✅ Deleted ${deletedRecords?.length || 0} electricity forecast records`);
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

(async () => {
  await deleteElectricityForecasts();
  process.exit(0);
})();
