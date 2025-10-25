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

async function checkTransportationData() {
  console.log('🔍 Checking Transportation Data...\n');

  // Get organization
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);

  const org = orgs[0];
  console.log(`Organization: ${org.name}\n`);

  // Get sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name, total_employees, total_area_sqm')
    .eq('organization_id', org.id);

  console.log('Sites:');
  sites.forEach(site => {
    console.log(`  • ${site.name}: ${site.total_employees} employees, ${site.total_area_sqm} sqm`);
  });

  // Check transportation metrics
  const { data: transportMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, name, category')
    .in('category', ['Mobile Combustion', 'Business Travel', 'Employee Commuting']);

  console.log(`\n📊 Transportation Metrics in Catalog: ${transportMetrics?.length || 0}`);

  for (const site of sites) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`📍 ${site.name}`);
    console.log(`${'─'.repeat(80)}`);

    if (transportMetrics && transportMetrics.length > 0) {
      const metricIds = transportMetrics.map(m => m.id);

      // Get last 365 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);

      // Get ALL transportation data (no time filter first)
      const { data: allTransportData } = await supabase
        .from('metrics_data')
        .select('value, co2e_emissions, period_start, period_end')
        .eq('site_id', site.id)
        .in('metric_id', metricIds)
        .order('period_start', { ascending: false });

      console.log(`\n📊 All-time transportation records: ${allTransportData?.length || 0}`);

      if (allTransportData && allTransportData.length > 0) {
        const allTimeEmissions = allTransportData.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
        console.log(`   Total emissions (all time): ${allTimeEmissions.toFixed(2)} kg CO2e`);
        console.log(`   Date range: ${allTransportData[allTransportData.length - 1].period_start} to ${allTransportData[0].period_start}`);
      }

      // Get last 365 days
      const { data: recentTransportData } = await supabase
        .from('metrics_data')
        .select('value, co2e_emissions, period_start, period_end')
        .eq('site_id', site.id)
        .in('metric_id', metricIds)
        .gte('period_start', startDate.toISOString())
        .order('period_start', { ascending: false });

      console.log(`\n📊 Last 365 days transportation records: ${recentTransportData?.length || 0}`);

      if (recentTransportData && recentTransportData.length > 0) {
        const totalEmissions = recentTransportData.reduce((sum, r) => sum + (r.co2e_emissions || 0), 0);
        const emissionsPerEmployee = totalEmissions / (site.total_employees || 1);

        console.log(`   Total emissions (365d): ${totalEmissions.toFixed(2)} kg CO2e`);
        console.log(`   Employees: ${site.total_employees}`);
        console.log(`   Emissions per employee: ${emissionsPerEmployee.toFixed(2)} kg CO2e/employee`);

        // Calculate score
        const rawScore = Math.max(0, Math.min(100, 100 - (emissionsPerEmployee / 3000) * 100));
        console.log(`   📊 Expected Score: ${rawScore.toFixed(0)}/100`);

        // Show breakdown
        console.log(`\n   📅 Sample Records:`);
        recentTransportData.slice(0, 5).forEach(r => {
          console.log(`      ${r.period_start}: ${r.co2e_emissions.toFixed(2)} kg CO2e`);
        });
      } else {
        console.log('   ❌ No data in last 365 days');
      }
    }
  }

  console.log(`\n${'='.repeat(80)}\n`);
}

checkTransportationData();
