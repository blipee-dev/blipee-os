import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSiteComparison() {
  console.log('🔍 Checking site comparison data...\n');

  // 1. Check PLMJ organization
  const { data: plmj } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', 'PLMJ')
    .single();

  if (!plmj) {
    console.log('❌ PLMJ organization not found');
    return;
  }

  console.log('✅ PLMJ organization found:', plmj.id, plmj.name);

  // 2. Check sites for PLMJ
  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('organization_id', plmj.id);

  console.log('\n📍 Sites for PLMJ:', sites?.length || 0);
  sites?.forEach(site => {
    console.log(`  - ${site.name}: ${site.total_area_sqm}m², ${site.total_employees} employees, type: ${site.type}`);
  });

  // 3. Check if there's metrics data for these sites
  const siteIds = sites?.map(s => s.id) || [];

  if (siteIds.length > 0) {
    const { data: metricsData, count } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact', head: false })
      .eq('organization_id', plmj.id)
      .in('site_id', siteIds)
      .limit(10);

    console.log(`\n📊 Metrics data for PLMJ sites: ${count || 0} records`);

    if (metricsData && metricsData.length > 0) {
      console.log('Sample metrics:');
      metricsData.slice(0, 3).forEach(m => {
        const site = sites?.find(s => s.id === m.site_id);
        console.log(`  - Site: ${site?.name || m.site_id}, Period: ${m.period_start} to ${m.period_end}, Emissions: ${m.co2e_emissions}`);
      });
    }

    // Check metrics without site_id
    const { count: noSiteCount } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', plmj.id)
      .is('site_id', null);

    console.log(`\n⚠️  Metrics without site_id: ${noSiteCount || 0} records`);
  }

  // 4. Test the site comparison generation logic
  if (sites && sites.length > 0) {
    const sitesMap = new Map(sites.map(s => [s.id, {
      ...s,
      area_m2: s.total_area_sqm,
      employee_count: s.total_employees,
      site_type: s.type
    }]));

    console.log('\n🗺️ SitesMap created with', sitesMap.size, 'sites');
    console.log('Site IDs in map:', Array.from(sitesMap.keys()));
  }

  process.exit(0);
}

checkSiteComparison().catch(console.error);