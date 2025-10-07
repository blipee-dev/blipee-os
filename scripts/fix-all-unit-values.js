const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== FIXING ALL UNIT VALUES IN METRICS_DATA ===\n');

  // Get all metrics
  const { data: allMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, unit');

  console.log('Found', allMetrics.length, 'metrics in catalog\n');

  // Get all data records
  const { data: allData } = await supabase
    .from('metrics_data')
    .select('id, metric_id, unit');

  console.log('Found', allData.length, 'total data records\n');

  // Find mismatches
  const mismatches = allData.filter(d => {
    const metric = allMetrics.find(m => m.id === d.metric_id);
    return metric && d.unit !== metric.unit;
  });

  console.log('Found', mismatches.length, 'records with incorrect unit values\n');

  if (mismatches.length === 0) {
    console.log('✅ No records to fix!');
    return;
  }

  // Fix in batches to avoid overwhelming the database
  const BATCH_SIZE = 50;
  let fixed = 0;
  let errors = 0;

  console.log('Fixing in batches of', BATCH_SIZE, '...\n');

  for (let i = 0; i < mismatches.length; i += BATCH_SIZE) {
    const batch = mismatches.slice(i, i + BATCH_SIZE);

    // Process batch in parallel
    const promises = batch.map(async (record) => {
      const metric = allMetrics.find(m => m.id === record.metric_id);
      if (!metric) return { success: false };

      const { error } = await supabase
        .from('metrics_data')
        .update({ unit: metric.unit })
        .eq('id', record.id);

      return { success: !error, error };
    });

    const results = await Promise.all(promises);

    results.forEach(result => {
      if (result.success) {
        fixed++;
      } else {
        errors++;
        if (result.error) {
          console.log('❌ Error:', result.error.message);
        }
      }
    });

    console.log(`  Progress: ${Math.min(i + BATCH_SIZE, mismatches.length)}/${mismatches.length} (${((Math.min(i + BATCH_SIZE, mismatches.length) / mismatches.length) * 100).toFixed(1)}%)`);
  }

  console.log('\n📊 RESULTS:');
  console.log('  ✅ Fixed:', fixed, 'records');
  console.log('  ❌ Errors:', errors, 'records');

  // Verify the fix
  const { data: verificationData } = await supabase
    .from('metrics_data')
    .select('id, metric_id, unit');

  const stillWrong = verificationData.filter(d => {
    const metric = allMetrics.find(m => m.id === d.metric_id);
    return metric && d.unit !== metric.unit;
  });

  console.log('\n🔍 VERIFICATION:');
  console.log('  Total data records:', verificationData.length);
  console.log('  Records still with wrong unit:', stillWrong.length);
  console.log('  Percentage fixed:', (((mismatches.length - stillWrong.length) / mismatches.length) * 100).toFixed(1) + '%');

  if (stillWrong.length === 0) {
    console.log('\n  ✅ ALL UNITS ARE NOW CORRECT!');
  } else {
    console.log('\n  ⚠️  Some records still need fixing');
  }
})();
