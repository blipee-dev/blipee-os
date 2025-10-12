require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl ? '✅ Found' : '❌ Missing');
console.log('Service Key:', supabaseServiceKey ? '✅ Found' : '❌ Missing');
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('🔍 Checking organization_metrics table...\n');

  // Check if organization_metrics exists
  const { data: orgMetrics, error: orgError } = await supabase
    .from('organization_metrics')
    .select('*')
    .limit(1);

  if (orgError) {
    console.log('❌ organization_metrics error:', orgError);
  } else {
    console.log('✅ organization_metrics exists');
    console.log('Sample row:', orgMetrics);
  }

  console.log('\n🔍 Checking metrics_catalog table...\n');

  // Check metrics_catalog
  const { data: catalog, error: catalogError } = await supabase
    .from('metrics_catalog')
    .select('*')
    .limit(1);

  if (catalogError) {
    console.log('❌ metrics_catalog error:', catalogError);
  } else {
    console.log('✅ metrics_catalog exists');
    console.log('Sample row:', catalog);
  }

  console.log('\n🔍 Checking metrics_data table...\n');

  // Check metrics_data
  const { data: metricsData, error: dataError } = await supabase
    .from('metrics_data')
    .select('metric_id, organization_id, period_start, value, co2e_emissions')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .order('period_start', { ascending: false })
    .limit(3);

  if (dataError) {
    console.log('❌ metrics_data error:', dataError);
  } else {
    console.log('✅ metrics_data exists');
    console.log(`Found ${metricsData.length} rows for organization`);
    console.log('Sample rows:', metricsData);
  }

  console.log('\n🔍 Checking organization_metrics for this org...\n');

  // Check organization_metrics for specific org
  const { data: orgMetricsForOrg, error: orgMetricsError } = await supabase
    .from('organization_metrics')
    .select('*')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .limit(5);

  if (orgMetricsError) {
    console.log('❌ Error:', orgMetricsError);
  } else {
    console.log(`✅ Found ${orgMetricsForOrg.length} metrics for organization`);
    console.log('Rows:', JSON.stringify(orgMetricsForOrg, null, 2));
  }

  console.log('\n🔍 Checking sustainability target...\n');

  // Check the target that's being replanned
  const { data: target, error: targetError } = await supabase
    .from('sustainability_targets')
    .select('*')
    .eq('id', 'd4a00170-7964-41e2-a61e-3d7b0059cfe5')
    .single();

  if (targetError) {
    console.log('❌ Error:', targetError);
  } else {
    console.log('✅ Target found:');
    console.log(JSON.stringify(target, null, 2));
    console.log('\n📊 Key values:');
    console.log(`  Baseline (${target.baseline_year}): ${target.baseline_emissions} tCO2e`);
    console.log(`  Target (${target.target_year}): ${target.target_emissions} tCO2e`);
    console.log(`  Current emissions: ${target.current_emissions} tCO2e`);
    console.log(`  Gap to close: ${(target.current_emissions || 0) - target.target_emissions} tCO2e`);
  }
}

checkTables().catch(console.error);
