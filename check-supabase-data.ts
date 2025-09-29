import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables');
  console.error('SUPABASE_URL:', !!supabaseUrl);
  console.error('SERVICE_ROLE_KEY:', !!supabaseKey);
  process.exit(1);
}

console.log('Connecting to Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function checkAllData() {
  console.log('\n=== CHECKING ALL TABLES ===\n');

  // 1. Check organizations
  console.log('1. ORGANIZATIONS TABLE:');
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, created_at')
    .order('created_at', { ascending: false });

  if (orgsError) {
    console.error('Error fetching organizations:', orgsError);
  } else {
    console.log(`Found ${orgs?.length || 0} organizations:`);
    orgs?.forEach(org => {
      console.log(`  - ${org.name} (ID: ${org.id})`);
    });
  }

  // 2. Check sites
  console.log('\n2. SITES TABLE:');
  const { data: sites, error: sitesError } = await supabase
    .from('sites')
    .select('id, name, organization_id, area_m2, employee_count, site_type')
    .order('created_at', { ascending: false });

  if (sitesError) {
    console.error('Error fetching sites:', sitesError);
  } else {
    console.log(`Found ${sites?.length || 0} sites:`);
    sites?.forEach(site => {
      const org = orgs?.find(o => o.id === site.organization_id);
      console.log(`  - ${site.name} (Org: ${org?.name || 'Unknown'}, Area: ${site.area_m2}m², Employees: ${site.employee_count})`);
    });
  }

  // 3. Check metrics_data
  console.log('\n3. METRICS_DATA TABLE:');
  const { data: metricsCount, error: metricsCountError } = await supabase
    .from('metrics_data')
    .select('organization_id', { count: 'exact', head: true });

  if (metricsCountError) {
    console.error('Error counting metrics:', metricsCountError);
  } else {
    console.log(`Total metrics_data entries: ${metricsCount || 0}`);
  }

  // Check metrics by organization
  for (const org of orgs || []) {
    const { count } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);

    const { count: withSiteId } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id)
      .not('site_id', 'is', null);

    console.log(`  - ${org.name}: ${count || 0} total metrics (${withSiteId || 0} with site_id)`);
  }

  // 4. Sample metrics_data with site_id
  console.log('\n4. SAMPLE METRICS WITH SITE_ID:');
  const { data: metricsWithSite, error: metricsWithSiteError } = await supabase
    .from('metrics_data')
    .select('id, organization_id, site_id, metric_type, value, date')
    .not('site_id', 'is', null)
    .limit(5);

  if (metricsWithSiteError) {
    console.error('Error fetching metrics with site_id:', metricsWithSiteError);
  } else {
    console.log(`Found ${metricsWithSite?.length || 0} metrics with site_id:`);
    metricsWithSite?.forEach(metric => {
      const site = sites?.find(s => s.id === metric.site_id);
      console.log(`  - ${metric.metric_type}: ${metric.value} (Site: ${site?.name || 'Unknown'}, Date: ${metric.date})`);
    });
  }

  // 5. Check if PLMJ has data
  console.log('\n5. PLMJ ORGANIZATION DATA:');
  const plmjOrg = orgs?.find(o => o.name === 'PLMJ');
  if (plmjOrg) {
    console.log(`PLMJ Organization ID: ${plmjOrg.id}`);

    // PLMJ sites
    const plmjSites = sites?.filter(s => s.organization_id === plmjOrg.id);
    console.log(`PLMJ Sites: ${plmjSites?.length || 0}`);
    plmjSites?.forEach(site => {
      console.log(`  - ${site.name} (ID: ${site.id})`);
    });

    // PLMJ metrics
    const { count: plmjMetrics } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', plmjOrg.id);

    const { count: plmjMetricsWithSite } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', plmjOrg.id)
      .not('site_id', 'is', null);

    console.log(`PLMJ Metrics: ${plmjMetrics || 0} total (${plmjMetricsWithSite || 0} with site_id)`);
  } else {
    console.log('PLMJ organization not found');
  }
}

checkAllData().catch(console.error);