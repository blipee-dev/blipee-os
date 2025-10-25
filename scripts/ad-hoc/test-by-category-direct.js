const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Simulate the API logic directly
async function testByCategoryLogic() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  const targetId = 'd4a00170-7964-41e2-a61e-3d7b0059cfe5';
  const categories = ['Water Consumption', 'Water Withdrawal', 'Water Discharge'];

  console.log('🧪 Testing by-category API logic directly\n');

  // Get all metric targets
  const { data: allMetricTargets } = await supabase
    .from('metric_targets')
    .select(`
      id,
      metric_catalog_id,
      baseline_value,
      baseline_emissions,
      target_value,
      target_emissions,
      status,
      metrics_catalog (
        id,
        code,
        name,
        category,
        scope,
        unit
      )
    `)
    .eq('organization_id', organizationId)
    .eq('target_id', targetId)
    .eq('status', 'active');

  console.log(`📊 All targets from DB: ${allMetricTargets?.length || 0}`);
  allMetricTargets?.forEach(mt => {
    console.log(`   - ${mt.metrics_catalog?.name} (${mt.metrics_catalog?.category})`);
  });

  // Filter by categories
  const metricTargets = (allMetricTargets || []).filter(mt =>
    categories.includes(mt.metrics_catalog?.category)
  );

  console.log(`\n✅ Filtered targets: ${metricTargets.length}`);
  metricTargets.forEach(mt => {
    console.log(`   - ${mt.metrics_catalog?.name} (${mt.metrics_catalog?.category})`);
  });

  // Get monthly data
  const metricTargetIds = metricTargets?.map(mt => mt.id) || [];
  const { data: monthlyData } = await supabase
    .from('metric_targets_monthly')
    .select('*')
    .in('metric_target_id', metricTargetIds)
    .order('year', { ascending: true })
    .order('month', { ascending: true });

  console.log(`\n📅 Monthly data records: ${monthlyData?.length || 0}`);

  // Calculate YTD for each target
  for (const mt of metricTargets) {
    const monthlyTargets = monthlyData?.filter(md => md.metric_target_id === mt.id) || [];

    const ytdValue = monthlyTargets.reduce((sum, m) => sum + (m.actual_value || 0), 0);

    console.log(`\n📊 ${mt.metrics_catalog.name}:`);
    console.log(`   Baseline: ${mt.baseline_value} m³`);
    console.log(`   Target: ${mt.target_value} m³`);
    console.log(`   YTD (from metric_targets_monthly): ${ytdValue.toFixed(2)} m³`);
    console.log(`   Monthly records: ${monthlyTargets.length}`);
  }

  console.log('\n✨ Test complete!\n');
}

testByCategoryLogic().catch(console.error);
