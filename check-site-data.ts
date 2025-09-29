import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function checkSiteData() {
  const orgId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Get sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', orgId);

  console.log('SITES:', sites?.map(s => s.name).join(', '));

  // Check if metrics_data has site_id
  const { data: sample } = await supabase
    .from('metrics_data')
    .select('id, site_id, organization_id, value, co2e_emissions')
    .eq('organization_id', orgId)
    .limit(5);

  console.log('\nSample metrics data:');
  sample?.forEach(m => {
    console.log(`  Site ID: ${m.site_id || 'NULL'}, Value: ${m.value}, Emissions: ${m.co2e_emissions}`);
  });

  // Count metrics by site for 2024
  if (sites) {
    console.log('\n2024 Emissions by site (if site_id exists):');
    for (const site of sites) {
      const { data } = await supabase
        .from('metrics_data')
        .select('co2e_emissions')
        .eq('organization_id', orgId)
        .eq('site_id', site.id)
        .gte('period_start', '2024-01-01')
        .lte('period_end', '2024-12-31');
      
      const total = data?.reduce((sum, d) => sum + (d.co2e_emissions || 0) / 1000, 0) || 0;
      console.log(`  ${site.name}: ${total.toFixed(1)} tCO2e`);
    }
  }

  // Check total without site filter
  const { data: allData } = await supabase
    .from('metrics_data')
    .select('co2e_emissions')
    .eq('organization_id', orgId)
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-12-31');
  
  const total = allData?.reduce((sum, d) => sum + (d.co2e_emissions || 0) / 1000, 0) || 0;
  console.log(`\nTotal for organization (all sites): ${total.toFixed(1)} tCO2e`);
}

checkSiteData();
