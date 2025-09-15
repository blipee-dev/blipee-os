const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://quovvwrwyfkzhgqdeham.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1b3Z2d3J3eWZremhncWRlaGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTgyOTIyMiwiZXhwIjoyMDY3NDA1MjIyfQ.3Tua91dJQ9obteac_y9aSD6IEGMO04rkg7Z8sM88yOI'
);

async function checkData() {
  console.log('🔍 Checking Metrics Data in Detail...\n');

  try {
    // Check metrics_data with actual data
    const { data: metricsData, error: dataError, count } = await supabase
      .from('metrics_data')
      .select('*', { count: 'exact' });

    console.log(`📈 metrics_data: ${count} total records`);

    if (metricsData && metricsData.length > 0) {
      // Group by organization
      const byOrg = {};
      metricsData.forEach(d => {
        if (!byOrg[d.organization_id]) {
          byOrg[d.organization_id] = [];
        }
        byOrg[d.organization_id].push(d);
      });

      console.log(`\n🏢 Data by Organization:`);
      for (const [orgId, data] of Object.entries(byOrg)) {
        console.log(`  Organization ${orgId.slice(0, 8)}...: ${data.length} records`);

        // Group by site
        const bySite = {};
        data.forEach(d => {
          if (!bySite[d.site_id]) {
            bySite[d.site_id] = [];
          }
          bySite[d.site_id].push(d);
        });

        console.log(`  Sites: ${Object.keys(bySite).length}`);
        for (const [siteId, siteData] of Object.entries(bySite)) {
          console.log(`    - Site ${siteId.slice(0, 8)}...: ${siteData.length} records`);
        }
      }

      // Show date range
      const dates = metricsData.map(d => new Date(d.period_start));
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      console.log(`\n📅 Date Range: ${minDate.toISOString().split('T')[0]} to ${maxDate.toISOString().split('T')[0]}`);

      // Check CO2e emissions
      const withEmissions = metricsData.filter(d => d.co2e_emissions != null);
      console.log(`\n💨 Records with CO2e emissions: ${withEmissions.length}`);

      if (withEmissions.length > 0) {
        const totalEmissions = withEmissions.reduce((sum, d) => sum + (d.co2e_emissions || 0), 0);
        console.log(`   Total CO2e: ${totalEmissions.toFixed(2)} tons`);
      }

      // Sample records
      console.log(`\n📊 Sample records (first 3):`);
      metricsData.slice(0, 3).forEach(d => {
        console.log(`  - Metric: ${d.metric_id?.slice(0, 8)}...`);
        console.log(`    Value: ${d.value} ${d.unit}`);
        console.log(`    CO2e: ${d.co2e_emissions || 'not calculated'}`);
        console.log(`    Period: ${d.period_start} to ${d.period_end}`);
      });
    }

    // Check organizations
    const { data: orgs } = await supabase
      .from('organizations')
      .select('*');

    console.log(`\n🏢 Organizations: ${orgs?.length || 0}`);
    if (orgs && orgs.length > 0) {
      orgs.forEach(o => {
        console.log(`  - ${o.name} (${o.id.slice(0, 8)}...)`);
      });
    }

    // Check sites
    const { data: sites } = await supabase
      .from('sites')
      .select('*');

    console.log(`\n🏭 Sites: ${sites?.length || 0}`);
    if (sites && sites.length > 0) {
      sites.forEach(s => {
        console.log(`  - ${s.name} (${s.type}) - Org: ${s.organization_id?.slice(0, 8)}...`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

checkData();