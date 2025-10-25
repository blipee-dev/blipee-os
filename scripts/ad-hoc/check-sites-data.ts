import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkSites() {
  console.log('🏢 Checking Sites Data...\n');

  // 1. Check sites table
  console.log('1️⃣ All Sites in Database:');
  const { data: allSites, error: sitesError } = await supabase
    .from('sites')
    .select('*')
    .order('name');

  if (sitesError) {
    console.error('❌ Error fetching sites:', sitesError);
  } else {
    console.log(`✅ Found ${allSites?.length || 0} total sites\n`);
    if (allSites && allSites.length > 0) {
      allSites.forEach(site => {
        console.log(`📍 ${site.name}`);
        console.log(`   ID: ${site.id}`);
        console.log(`   Organization: ${site.organization_id}`);
        console.log(`   Address: ${site.address || 'Not set'}`);
        console.log(`   Area: ${site.area} ${site.area_unit || 'm²'}`);
        console.log(`   Employees: ${site.number_of_employees || 'Not set'}`);
        console.log('');
      });
    }
  }

  // 2. Check PLMJ's sites specifically
  const plmjOrgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  console.log(`\n2️⃣ PLMJ Sites (Org: ${plmjOrgId}):`);

  const { data: plmjSites, error: plmjError } = await supabase
    .from('sites')
    .select('*')
    .eq('organization_id', plmjOrgId);

  if (plmjError) {
    console.error('❌ Error fetching PLMJ sites:', plmjError);
  } else {
    console.log(`✅ PLMJ has ${plmjSites?.length || 0} sites:\n`);
    if (plmjSites && plmjSites.length > 0) {
      plmjSites.forEach(site => {
        console.log(`📍 ${site.name}`);
        console.log(`   Area: ${site.area} m²`);
        console.log(`   Location: ${site.address || 'Not specified'}`);
      });
    }
  }

  // 3. Check if metrics_data has site associations
  console.log('\n3️⃣ Metrics Data with Site Associations:');
  const { data: siteMetrics, error: metricsError } = await supabase
    .from('metrics_data')
    .select(`
      id,
      site_id,
      value,
      unit,
      period_end,
      sites (name),
      metrics_catalog (name)
    `)
    .not('site_id', 'is', null)
    .limit(10);

  if (metricsError) {
    console.error('❌ Error fetching site metrics:', metricsError);
  } else {
    console.log(`✅ Found ${siteMetrics?.length || 0} metrics with site data\n`);
    if (siteMetrics && siteMetrics.length > 0) {
      const uniqueSites = new Set();
      siteMetrics.forEach(m => {
        if (m.sites?.name) {
          uniqueSites.add(m.sites.name);
        }
      });
      console.log('Sites with data:', Array.from(uniqueSites).join(', '));

      console.log('\nSample site-specific metrics:');
      siteMetrics.slice(0, 3).forEach(m => {
        console.log(`  - ${m.sites?.name}: ${m.metrics_catalog?.name} = ${m.value} ${m.unit} (${m.period_end})`);
      });
    } else {
      console.log('⚠️  No metrics are currently associated with specific sites');
    }
  }

  // 4. Check organization-site relationship
  console.log('\n4️⃣ Organization-Site Summary:');
  const { data: orgSummary } = await supabase
    .from('organizations')
    .select(`
      name,
      sites (count)
    `);

  if (orgSummary) {
    orgSummary.forEach(org => {
      const siteCount = Array.isArray(org.sites) ? org.sites.length : 0;
      if (siteCount > 0) {
        console.log(`  ${org.name}: ${siteCount} sites`);
      }
    });
  }

  // 5. Check if site_id is used in data entry
  console.log('\n5️⃣ Data Entry Site Usage:');
  const { count: totalMetrics } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact', head: true });

  const { count: metricsWithSite } = await supabase
    .from('metrics_data')
    .select('*', { count: 'exact', head: true })
    .not('site_id', 'is', null);

  console.log(`  Total metrics: ${totalMetrics || 0}`);
  console.log(`  Metrics with site: ${metricsWithSite || 0}`);
  console.log(`  Percentage with site: ${totalMetrics ? ((metricsWithSite || 0) / totalMetrics * 100).toFixed(1) : 0}%`);
}

checkSites().catch(console.error);