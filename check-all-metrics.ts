import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function checkAllMetrics() {
  // Check all organizations and their metrics
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, slug');

  console.log('\n=== ORGANIZATIONS AND THEIR METRICS ===\n');

  for (const org of orgs || []) {
    const { count } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', org.id);

    if (count && count > 0) {
      console.log(`✅ ${org.name} (${org.slug}): ${count} metrics`);
      console.log(`   ID: ${org.id}`);
    } else {
      console.log(`❌ ${org.name} (${org.slug}): 0 metrics`);
    }
  }

  // Get all metrics with details
  const { data: allMetrics, count: totalCount } = await supabase
    .from('metrics_data')
    .select(`
      *,
      metrics_catalog (
        name,
        category,
        scope,
        subcategory
      ),
      organizations (
        name
      )
    `, { count: 'exact' })
    .order('co2e_emissions', { ascending: false })
    .limit(20);

  console.log(`\n=== TOTAL METRICS IN DATABASE: ${totalCount || 0} ===\n`);

  if (allMetrics && allMetrics.length > 0) {
    console.log('Top 20 emissions by value:\n');
    allMetrics.forEach(m => {
      console.log(`📊 ${m.organizations?.name || 'Unknown Org'}`);
      console.log(`   - ${m.metrics_catalog?.name || 'Unknown'} (${m.metrics_catalog?.category})`);
      console.log(`   - ${Math.round(m.co2e_emissions || 0).toLocaleString()} tCO2e`);
      console.log(`   - Scope: ${m.metrics_catalog?.scope}`);
      console.log('');
    });

    // Group by organization
    const byOrg: any = {};
    allMetrics.forEach(m => {
      const orgName = m.organizations?.name || 'Unknown';
      if (!byOrg[orgName]) byOrg[orgName] = 0;
      byOrg[orgName] += m.co2e_emissions || 0;
    });

    console.log('\n=== EMISSIONS BY ORGANIZATION ===\n');
    Object.entries(byOrg)
      .sort((a: any, b: any) => b[1] - a[1])
      .forEach(([org, emissions]: any) => {
        console.log(`${org}: ${Math.round(emissions).toLocaleString()} tCO2e`);
      });
  } else {
    console.log('No metrics data found in database!');

    // Check if metrics_catalog has data
    const { data: catalog, count: catalogCount } = await supabase
      .from('metrics_catalog')
      .select('*', { count: 'exact' })
      .limit(5);

    console.log(`\n=== METRICS CATALOG: ${catalogCount || 0} entries ===\n`);
    catalog?.forEach(c => {
      console.log(`- ${c.name} (${c.category}, Scope ${c.scope})`);
    });
  }
}

checkAllMetrics().catch(console.error);