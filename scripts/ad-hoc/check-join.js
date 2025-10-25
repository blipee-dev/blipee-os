require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkJoin() {
  console.log('🔍 Testing the join query that replanning uses...\n');

  const currentYear = 2025;
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  const { data: metricsWithData, error } = await supabase
    .from('metrics_data')
    .select(`
      metric_id,
      metrics_catalog (
        id,
        name,
        code,
        unit,
        scope,
        category,
        subcategory
      )
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', `${currentYear}-01-01`)
    .lte('period_start', `${currentYear}-12-31`)
    .limit(5);

  if (error) {
    console.log('❌ Error:', error);
    return;
  }

  console.log(`✅ Found ${metricsWithData.length} rows`);
  console.log('\n📊 Sample data:');
  metricsWithData.forEach((item, i) => {
    console.log(`\nRow ${i + 1}:`);
    console.log('  metric_id from metrics_data:', item.metric_id);
    console.log('  metrics_catalog:', item.metrics_catalog);
  });

  // Now check what metric IDs are unique
  const uniqueIds = new Set();
  metricsWithData.forEach(item => {
    uniqueIds.add(item.metric_id);
  });

  console.log('\n\n🔑 Unique metric_id values:', Array.from(uniqueIds));

  // Now test querying with one of these IDs
  if (uniqueIds.size > 0) {
    const testId = Array.from(uniqueIds)[0];
    console.log(`\n\n🧪 Testing query with metric_id = ${testId}...`);

    const { data: testData, error: testError } = await supabase
      .from('metrics_data')
      .select('value, co2e_emissions')
      .eq('organization_id', organizationId)
      .eq('metric_id', testId)
      .gte('period_start', `${currentYear}-01-01`)
      .lte('period_start', `${currentYear}-12-31`);

    if (testError) {
      console.log('❌ Test query error:', testError);
    } else {
      console.log(`✅ Test query returned ${testData?.length || 0} rows`);
      if (testData && testData.length > 0) {
        console.log('Sample rows:', testData.slice(0, 3));
      }
    }
  }
}

checkJoin().catch(console.error);
