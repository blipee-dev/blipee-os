const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkMetricTargets() {
  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const targetId = 'd4a00170-7964-41e2-a61e-3d7b0059cfe5'; // SBTi target

  console.log('🔍 Checking metric_targets table...\n');

  // Get all metric targets for this sustainability target
  const { data: metricTargets, error } = await supabase
    .from('metric_targets')
    .select(`
      id,
      metric_catalog_id,
      baseline_value,
      baseline_emissions,
      target_value,
      target_emissions,
      current_emissions,
      status,
      metrics_catalog (
        id,
        code,
        name,
        category,
        scope
      )
    `)
    .eq('organization_id', organizationId)
    .eq('target_id', targetId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`✅ Found ${metricTargets.length} metric targets in the database\n`);

  // Check which ones have actual data
  const metricsWithData = new Set();

  for (const mt of metricTargets) {
    const { data: hasData } = await supabase
      .from('metrics_data')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('metric_id', mt.metric_catalog_id)
      .or('value.gt.0,co2e_emissions.gt.0')
      .limit(1);

    if (hasData && hasData.length > 0) {
      metricsWithData.add(mt.metric_catalog_id);
    }
  }

  console.log('📊 Breakdown:\n');

  const withData = metricTargets.filter(mt => metricsWithData.has(mt.metric_catalog_id));
  const withoutData = metricTargets.filter(mt => !metricsWithData.has(mt.metric_catalog_id));

  console.log(`✅ Metrics WITH actual data: ${withData.length}`);
  withData.forEach(mt => {
    console.log(`   - ${mt.metrics_catalog.name} (${mt.metrics_catalog.category})`);
  });

  console.log(`\n❌ Metrics WITHOUT actual data: ${withoutData.length}`);
  withoutData.forEach(mt => {
    console.log(`   - ${mt.metrics_catalog.name} (${mt.metrics_catalog.category}) - Target: ${mt.target_emissions?.toFixed(1) || 0} tCO2e`);
  });

  console.log('\n💡 The filtering is working on dashboards, but the Replanning view shows ALL metric targets from the replanning process, regardless of whether there\'s actual data.');
}

checkMetricTargets().catch(console.error);
