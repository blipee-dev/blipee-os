const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkData() {
  console.log('🔍 Checking Sustainability Data in Supabase...\n');

  try {
    // Check metrics_catalog
    const { data: metricsCount, error: metricsError } = await supabase
      .from('metrics_catalog')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 metrics_catalog: ${metricsCount || 0} records`);

    // Get sample metrics
    const { data: sampleMetrics } = await supabase
      .from('metrics_catalog')
      .select('id, code, name, scope, category')
      .limit(5);

    if (sampleMetrics && sampleMetrics.length > 0) {
      console.log('Sample metrics:');
      sampleMetrics.forEach(m => {
        console.log(`  - ${m.code}: ${m.name} (${m.scope}, ${m.category})`);
      });
    }

    // Check metrics_data
    const { data: dataCount, error: dataError } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact', head: true });

    console.log(`\n📈 metrics_data: ${dataCount || 0} records`);

    // Get sample data
    const { data: sampleData } = await supabase
      .from('metrics_data')
      .select(`
        *,
        metrics_catalog (
          name, code, scope, category
        )
      `)
      .limit(5);

    if (sampleData && sampleData.length > 0) {
      console.log('Sample data entries:');
      sampleData.forEach(d => {
        console.log(`  - ${d.metrics_catalog?.name}: ${d.value} ${d.unit} (${d.period_start} to ${d.period_end})`);
        console.log(`    CO2e: ${d.co2e_emissions || 'not calculated'}`);
      });
    }

    // Check organization_metrics
    const { data: orgMetricsCount } = await supabase
      .from('organization_metrics')
      .select('*', { count: 'exact', head: true });

    console.log(`\n🏢 organization_metrics: ${orgMetricsCount || 0} records`);

    // Check sites
    const { data: sites } = await supabase
      .from('sites')
      .select('id, name, type')
      .limit(5);

    console.log(`\n🏭 Sites (first 5):`);
    if (sites && sites.length > 0) {
      sites.forEach(s => {
        console.log(`  - ${s.name} (${s.type})`);
      });
    } else {
      console.log('  No sites found');
    }

    // Check organizations
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(5);

    console.log(`\n🏢 Organizations:`);
    if (orgs && orgs.length > 0) {
      orgs.forEach(o => {
        console.log(`  - ${o.name}`);
      });
    } else {
      console.log('  No organizations found');
    }

    // Check emission_factors
    const { data: factorsCount } = await supabase
      .from('emission_factors')
      .select('*', { count: 'exact', head: true });

    console.log(`\n⚡ emission_factors: ${factorsCount || 0} records`);

    // Check if there's any data for dashboard
    if (dataCount === 0) {
      console.log('\n⚠️  No metrics data found. The dashboard will be empty.');
      console.log('📝 To add data:');
      console.log('   1. Go to /settings/sustainability');
      console.log('   2. Click "Add Data" on a site');
      console.log('   3. Fill in the Data Entry Modal');
    } else {
      console.log('\n✅ Metrics data exists. Dashboard should display visualizations.');
    }

  } catch (error) {
    console.error('❌ Error checking data:', error);
  }

  process.exit(0);
}

checkData();