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

async function testSiteComparison() {
  console.log('🔍 Direct Site Comparison Test...\n');

  // 1. Get PLMJ organization
  const { data: plmj } = await supabase
    .from('organizations')
    .select('*')
    .eq('name', 'PLMJ')
    .single();

  console.log('Organization:', plmj?.id, plmj?.name);

  // 2. Get sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, total_area_sqm, total_employees, type')
    .eq('organization_id', plmj!.id);

  console.log('\n📍 Sites:', sites?.length);
  sites?.forEach(s => console.log(`  - ${s.id}: ${s.name}`));

  // 3. Get metrics data for year 2024
  const { data: metricsData } = await supabase
    .from('metrics_data')
    .select(`
      *,
      metrics_catalog (
        id, name, code, unit, scope, category, subcategory
      )
    `)
    .eq('organization_id', plmj!.id)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31')
    .limit(100);

  console.log('\n📊 Metrics data:', metricsData?.length);

  // 4. Check site_ids in metrics
  const uniqueSiteIds = [...new Set(metricsData?.map(d => d.site_id).filter(Boolean))];
  console.log('\n🔗 Unique site_ids in metrics:', uniqueSiteIds);

  // 5. Build sites map
  const sitesMap = new Map(sites?.map(s => [s.id, {
    ...s,
    area_m2: s.total_area_sqm,
    employee_count: s.total_employees,
    site_type: s.type
  }]) || []);

  console.log('\n🗺️ Sites map keys:', Array.from(sitesMap.keys()));

  // 6. Process site comparison
  const siteData: any = {};

  metricsData?.forEach(d => {
    const siteInfo = sitesMap.get(d.site_id);
    if (!siteInfo) {
      return;
    }

    const siteName = siteInfo.name;

    if (!siteData[siteName]) {
      siteData[siteName] = {
        site: siteName,
        emissions: 0,
        energy: 0,
        count: 0
      };
    }

    siteData[siteName].emissions += d.co2e_emissions || 0;
    siteData[siteName].count++;

    const category = d.metrics_catalog?.category;
    if (category === 'Electricity' || category === 'Purchased Energy') {
      siteData[siteName].energy += d.value || 0;
    }
  });

  console.log('\n✅ Site comparison data:');
  Object.entries(siteData).forEach(([name, data]: [string, any]) => {
    console.log(`  ${name}: ${data.emissions.toFixed(2)} kg CO2e (${data.count} records), ${data.energy.toFixed(2)} kWh`);
  });

  // 7. Check for mismatched IDs
  const metricsOnlySiteIds = uniqueSiteIds.filter(id => !Array.from(sitesMap.keys()).includes(id));
  if (metricsOnlySiteIds.length > 0) {
    console.log('\n⚠️ Site IDs in metrics but not in sites table:', metricsOnlySiteIds);

    // Try to find these sites
    for (const siteId of metricsOnlySiteIds.slice(0, 3)) {
      const { data: site } = await supabase
        .from('sites')
        .select('*')
        .eq('id', siteId)
        .single();

      console.log(`  Site ${siteId}:`, site ? `${site.name} (org: ${site.organization_id})` : 'NOT FOUND');
    }
  }

  process.exit(0);
}

testSiteComparison().catch(console.error);