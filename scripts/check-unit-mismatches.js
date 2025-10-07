const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('=== CHECKING UNIT FIELD IN TRANSPORTATION DATA ===\n');

  const { data: metrics } = await supabase
    .from('metrics_catalog')
    .select('id, code, name, unit')
    .or('code.like.scope3_business_travel_%,code.eq.scope3_hotel_nights');

  console.log('Metrics Catalog Units:');
  metrics.forEach(m => {
    console.log('  ', m.code, '- unit in catalog:', m.unit);
  });

  const { data: travelData } = await supabase
    .from('metrics_data')
    .select('id, metric_id, value, unit, period_start')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .in('metric_id', metrics.map(m => m.id))
    .order('period_start', { ascending: false })
    .limit(20);

  console.log('\nSample Data Records:');
  travelData.forEach(d => {
    const metric = metrics.find(m => m.id === d.metric_id);
    const mismatch = d.unit !== metric.unit;
    console.log('  Period:', d.period_start.substring(0, 7), '|', metric.code, '| Data unit:', d.unit, '| Catalog unit:', metric.unit, '|', mismatch ? '❌ MISMATCH' : '✅');
  });

  // Count mismatches
  const { data: allData } = await supabase
    .from('metrics_data')
    .select('id, metric_id, unit')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .in('metric_id', metrics.map(m => m.id));

  const mismatches = allData.filter(d => {
    const metric = metrics.find(m => m.id === d.metric_id);
    return d.unit !== metric.unit;
  });

  console.log('\n📊 SUMMARY:');
  console.log('  Total records:', allData.length);
  console.log('  Records with wrong unit:', mismatches.length);
  console.log('  Records with correct unit:', allData.length - mismatches.length);

  if (mismatches.length > 0) {
    console.log('\n🔧 FIX NEEDED:');
    console.log('  Run SQL to fix unit field in metrics_data table');
    console.log('  UPDATE metrics_data SET unit = (SELECT unit FROM metrics_catalog WHERE id = metric_id)');
    console.log('  WHERE organization_id = \'22647141-2ee4-4d8d-8b47-16b0cbd830b2\'');
  }
})();
