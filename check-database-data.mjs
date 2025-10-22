import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
  console.log('🔍 Checking database data...\n');

  // Check organizations
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name');

  console.log('📊 Organizations:');
  if (orgsError) {
    console.error('   ❌ Error:', orgsError);
  } else if (!orgs || orgs.length === 0) {
    console.log('   ⚠️  No organizations found');
  } else {
    orgs.forEach(org => console.log(`   • ${org.name} (${org.id})`));
  }

  if (orgs && orgs.length > 0) {
    const org = orgs[0];
    console.log(`\n📍 Sites for ${org.name}:`);

    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select('id, name, type, total_area_sqm')
      .eq('organization_id', org.id);

    if (sitesError) {
      console.error('   ❌ Error:', sitesError);
    } else if (!sites || sites.length === 0) {
      console.log('   ⚠️  No sites found for this organization');
    } else {
      sites.forEach(site => {
        console.log(`   • ${site.name}`);
        console.log(`     ID: ${site.id}`);
        console.log(`     Type: ${site.type || 'N/A'}`);
        console.log(`     Area: ${site.total_area_sqm || 'N/A'} sqm`);
        console.log('');
      });

      // Check metrics data for first site
      if (sites.length > 0) {
        const site = sites[0];
        console.log(`\n📊 Checking metrics data for ${site.name}...\n`);

        // Check each category
        const categories = [
          { name: 'Electricity', emoji: '⚡' },
          { name: 'Stationary Combustion', emoji: '🔥' },
          { name: 'Water Consumption', emoji: '💧' },
          { name: 'Waste', emoji: '♻️' },
          { name: 'Mobile Combustion', emoji: '🚗' },
          { name: 'Business Travel', emoji: '✈️' },
        ];

        for (const { name, emoji } of categories) {
          const { data: metrics } = await supabase
            .from('metrics_catalog')
            .select('id, name')
            .eq('category', name);

          if (metrics && metrics.length > 0) {
            const metricIds = metrics.map(m => m.id);
            const { data: metricsData } = await supabase
              .from('metrics_data')
              .select('id, value, co2e_emissions, period_start')
              .eq('site_id', site.id)
              .in('metric_id', metricIds)
              .order('period_start', { ascending: false })
              .limit(5);

            console.log(`${emoji} ${name}:`);
            console.log(`   Metrics in catalog: ${metrics.length}`);
            console.log(`   Data records: ${metricsData?.length || 0}`);

            if (metricsData && metricsData.length > 0) {
              const totalValue = metricsData.reduce((sum, r) => sum + (r.value || 0), 0);
              const totalEmissions = metricsData.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
              console.log(`   Total value: ${totalValue.toFixed(2)}`);
              console.log(`   Total emissions: ${totalEmissions.toFixed(2)} kg CO2e`);
              console.log(`   Latest: ${metricsData[0].period_start}`);
            }
            console.log('');
          }
        }
      }
    }
  }
}

checkData();
