const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== FIXING UNIT VALUES IN METRICS_DATA ===\n');

  // Get all metrics
  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, unit');

  console.log('Found', metrics.length, 'metrics in catalog\n');

  // Get all data records with wrong units
  const { data: wrongUnits } = await supabase
    .from('metrics_data')
    .select('id, metric_id, unit')
    .neq('unit', 'km')  // Get records where unit is NOT what we expect
    .in('metric_id', metrics.filter(m => m.unit === 'km').map(m => m.id));

  console.log('Found', wrongUnits?.length || 0, 'records with incorrect unit values\n');

  if (!wrongUnits || wrongUnits.length === 0) {
    console.log('✅ No records to fix!');
    return;
  }

  // Fix each record
  let fixed = 0;
  let errors = 0;

  for (const record of wrongUnits) {
    const metric = metrics.find(m => m.id === record.metric_id);
    if (!metric) continue;

    const { error } = await supabase
      .from('metrics_data')
      .update({ unit: metric.unit })
      .eq('id', record.id);

    if (error) {
      console.log('❌ Error fixing record', record.id, ':', error.message);
      errors++;
    } else {
      fixed++;
      if (fixed % 10 === 0) {
        console.log('  Fixed', fixed, 'records...');
      }
    }
  }

  console.log('\n📊 RESULTS:');
  console.log('  ✅ Fixed:', fixed, 'records');
  console.log('  ❌ Errors:', errors, 'records');

  // Verify the fix
  const { data: verification } = await supabase
    .from('metrics_data')
    .select('id, metric_id, unit')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .in('metric_id', metrics.filter(m => m.code.includes('business_travel') || m.code.includes('hotel')).map(m => m.id));

  const stillWrong = verification.filter(d => {
    const metric = metrics.find(m => m.id === d.metric_id);
    return metric && d.unit !== metric.unit;
  });

  console.log('\n🔍 VERIFICATION:');
  console.log('  Total PLMJ transportation records:', verification.length);
  console.log('  Records still with wrong unit:', stillWrong.length);

  if (stillWrong.length === 0) {
    console.log('  ✅ All units are now correct!');
  }
})();
