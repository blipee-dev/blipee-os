const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPLMJData() {
  console.log('Checking for PLMJ data in the database...\n');

  // Check if PLMJ organization exists
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', 'PLMJ');

  if (orgError) {
    console.error('Error checking organizations:', orgError);
    return;
  }

  if (!orgs || orgs.length === 0) {
    console.log('❌ PLMJ organization not found');
    console.log('→ Need to run the migration to import PLMJ data\n');
    return;
  }

  const orgId = orgs[0].id;
  console.log('✅ PLMJ organization found:', orgId);

  // Check sites
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .eq('organization_id', orgId);

  if (sitesError) {
    console.error('Error checking sites:', sitesError);
    return;
  }

  console.log(`✅ Found ${sites?.length || 0} sites for PLMJ:`);
  sites?.forEach(site => {
    console.log(`   - ${site.name} (${site.location})`);
  });

  // Check metrics data
  const { data: metricsData, error: metricsError } = await supabase
    .from('metrics_data')
    .select(`
      *,
      metrics_catalog (
        name,
        code
      )
    `)
    .eq('organization_id', orgId)
    .order('period_start', { ascending: false })
    .limit(10);

  if (metricsError) {
    console.error('Error checking metrics data:', metricsError);
    return;
  }

  console.log(`\n✅ Found ${metricsData?.length || 0} recent metrics data points:`);

  // Group by metric
  const metricsSummary = {};
  const { data: allMetrics } = await supabase
    .from('metrics_data')
    .select('metric_id, period_start')
    .eq('organization_id', orgId);

  allMetrics?.forEach(record => {
    if (!metricsSummary[record.metric_id]) {
      metricsSummary[record.metric_id] = {
        count: 0,
        minDate: record.period_start,
        maxDate: record.period_start
      };
    }
    metricsSummary[record.metric_id].count++;
    if (record.period_start < metricsSummary[record.metric_id].minDate) {
      metricsSummary[record.metric_id].minDate = record.period_start;
    }
    if (record.period_start > metricsSummary[record.metric_id].maxDate) {
      metricsSummary[record.metric_id].maxDate = record.period_start;
    }
  });

  // Get metric names
  const metricIds = Object.keys(metricsSummary);
  if (metricIds.length > 0) {
    const { data: metrics } = await supabase
      .from('metrics_catalog')
      .select('id, name, code')
      .in('id', metricIds);

    console.log('\nMetrics Summary:');
    metrics?.forEach(metric => {
      const summary = metricsSummary[metric.id];
      console.log(`   ${metric.name} (${metric.code}):`);
      console.log(`     - ${summary.count} data points`);
      console.log(`     - Date range: ${summary.minDate} to ${summary.maxDate}`);
    });
  }

  // Check total data points
  const { count } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  console.log(`\n📊 Total PLMJ metrics data points: ${count || 0}`);

  if (count < 100) {
    console.log('\n⚠️  Less than 100 data points found. The complete PLMJ data migration may not have been applied.');
    console.log('→ Consider running the complete migration: 20250914216000_complete_plmj_data.sql');
  } else {
    console.log('\n✅ PLMJ data appears to be fully imported!');
  }
}

checkPLMJData().catch(console.error);