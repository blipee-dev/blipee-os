const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkData() {
  // Check if PLMJ organization exists
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('name', 'PLMJ')
    .single();

  if (!org) {
    console.log('❌ PLMJ organization not found in database');
    console.log('You need to run the PLMJ data migrations first:');
    console.log('  - 20250914216000_complete_plmj_data.sql');
    console.log('  - 20250914217000_plmj_historical_2022_2023.sql');
    console.log('  - 20250914218000_plmj_nov_dec_2024.sql');
    return;
  }

  console.log('✓ PLMJ organization found:', org.id);

  // Check sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', org.id);

  console.log('\nPLMJ Sites:', sites?.length || 0);
  sites?.forEach(s => console.log('  -', s.name, '(' + s.id + ')'));

  // Check site_metrics
  const { data: siteMetrics } = await supabase
    .from('site_metrics')
    .select(`
      site_id,
      metric_id,
      sites!inner(name),
      metrics_catalog!inner(name, code)
    `)
    .eq('organization_id', org.id);

  console.log('\nSite metrics configured:', siteMetrics?.length || 0);

  if (siteMetrics?.length > 0) {
    // Group by site
    const bySite = {};
    siteMetrics.forEach(sm => {
      const siteName = sm.sites?.name || 'Unknown';
      if (!bySite[siteName]) bySite[siteName] = [];
      bySite[siteName].push(sm.metrics_catalog?.name || sm.metric_id);
    });

    Object.entries(bySite).forEach(([site, metrics]) => {
      console.log(`  ${site}: ${metrics.length} metrics`);
      metrics.slice(0, 3).forEach(m => console.log(`    - ${m}`));
      if (metrics.length > 3) console.log(`    ... and ${metrics.length - 3} more`);
    });
  }

  // Check metrics_data
  const { data: metricsData } = await supabase
    .from('metrics_data')
    .select('site_id, metric_id')
    .eq('organization_id', org.id)
    .limit(5);

  console.log('\nMetrics data entries:', metricsData?.length || 0, '(showing first 5)');

  if (metricsData?.length > 0 && !siteMetrics?.length) {
    console.log('\n⚠️  You have metrics data but no site_metrics configured.');
    console.log('Run the migration 20250914220000_populate_site_metrics.sql to fix this.');
  }

  // Check organization_metrics
  const { data: orgMetrics } = await supabase
    .from('organization_metrics')
    .select('metric_id')
    .eq('organization_id', org.id);

  console.log('\nOrganization metrics:', orgMetrics?.length || 0);

  if (!siteMetrics?.length && !orgMetrics?.length) {
    console.log('\n📋 Next step: Run the migration to populate site_metrics table');
    console.log('Migration file: /supabase/migrations/20250914220000_populate_site_metrics.sql');
  }
}

checkData().catch(console.error);