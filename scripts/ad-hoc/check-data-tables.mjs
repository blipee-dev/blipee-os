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

async function checkDataPeriods() {
  console.log('🔍 Checking data time periods...\n');

  // Get organization
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);

  if (!orgs || orgs.length === 0) {
    console.error('❌ No organizations found');
    return;
  }

  const org = orgs[0];
  console.log(`Organization: ${org.name}\n`);

  // Get sites
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', org.id);

  if (!sites || sites.length === 0) {
    console.log('⚠️  No sites found');
    return;
  }

  // Check data for first site
  const site = sites[0];
  console.log(`📊 Analyzing data for: ${site.name}\n`);
  console.log('=' .repeat(80));

  // Get energy metrics
  const { data: energyMetrics } = await supabase
    .from('metrics_catalog')
    .select('id')
    .eq('category', 'Electricity');

  if (energyMetrics && energyMetrics.length > 0) {
    const metricIds = energyMetrics.map(m => m.id);

    const { data: energyData } = await supabase
      .from('metrics_data')
      .select('value, co2e_emissions, period_start, period_end')
      .eq('site_id', site.id)
      .in('metric_id', metricIds)
      .order('period_start', { ascending: true });

    console.log('\n⚡ ELECTRICITY DATA:');
    console.log(`   Total records: ${energyData?.length || 0}`);

    if (energyData && energyData.length > 0) {
      const firstRecord = energyData[0];
      const lastRecord = energyData[energyData.length - 1];

      console.log(`   First record: ${firstRecord.period_start} to ${firstRecord.period_end}`);
      console.log(`   Last record: ${lastRecord.period_start} to ${lastRecord.period_end}`);
      console.log(`   Value range: ${Math.min(...energyData.map(r => r.value))} - ${Math.max(...energyData.map(r => r.value))} kWh`);

      const totalValue = energyData.reduce((sum, r) => sum + (r.value || 0), 0);
      console.log(`   Total summed: ${totalValue.toFixed(2)} kWh`);

      // Group by month
      const byMonth = energyData.reduce((acc, r) => {
        const month = r.period_start.substring(0, 7); // YYYY-MM
        if (!acc[month]) acc[month] = [];
        acc[month].push(r);
        return acc;
      }, {});

      console.log(`\n   📅 Data by Month:`);
      Object.entries(byMonth).sort().forEach(([month, records]) => {
        const monthTotal = records.reduce((sum, r) => sum + (r.value || 0), 0);
        console.log(`      ${month}: ${records.length} records, ${monthTotal.toFixed(2)} kWh total`);
      });

      // Show sample records
      console.log(`\n   📋 Sample Records (first 5):`);
      energyData.slice(0, 5).forEach((r, i) => {
        console.log(`      ${i + 1}. ${r.period_start} → ${r.period_end}: ${r.value} kWh, ${r.co2e_emissions} kg CO2e`);
      });
    }
  }

  // Check water metrics
  const { data: waterMetrics } = await supabase
    .from('metrics_catalog')
    .select('id, name')
    .in('category', ['Water Consumption', 'Purchased Goods & Services']);

  const filteredWaterMetrics = waterMetrics?.filter(m =>
    m.name.toLowerCase().includes('water') && !m.name.toLowerCase().includes('wastewater')
  ) || [];

  if (filteredWaterMetrics.length > 0) {
    const metricIds = filteredWaterMetrics.map(m => m.id);

    const { data: waterData } = await supabase
      .from('metrics_data')
      .select('value, period_start, period_end')
      .eq('site_id', site.id)
      .in('metric_id', metricIds)
      .order('period_start', { ascending: true });

    console.log('\n\n💧 WATER DATA:');
    console.log(`   Total records: ${waterData?.length || 0}`);

    if (waterData && waterData.length > 0) {
      const firstRecord = waterData[0];
      const lastRecord = waterData[waterData.length - 1];

      console.log(`   First record: ${firstRecord.period_start} to ${firstRecord.period_end}`);
      console.log(`   Last record: ${lastRecord.period_start} to ${lastRecord.period_end}`);

      const totalValue = waterData.reduce((sum, r) => sum + (r.value || 0), 0);
      console.log(`   Total summed: ${totalValue.toFixed(2)} m³`);

      // Group by month
      const byMonth = waterData.reduce((acc, r) => {
        const month = r.period_start.substring(0, 7); // YYYY-MM
        if (!acc[month]) acc[month] = [];
        acc[month].push(r);
        return acc;
      }, {});

      console.log(`\n   📅 Data by Month:`);
      Object.entries(byMonth).sort().forEach(([month, records]) => {
        const monthTotal = records.reduce((sum, r) => sum + (r.value || 0), 0);
        console.log(`      ${month}: ${records.length} records, ${monthTotal.toFixed(2)} m³ total`);
      });
    }
  }

  console.log('\n' + '=' .repeat(80));
  console.log('\n💡 RECOMMENDATION:');
  console.log('   For accurate intensity calculations, we should:');
  console.log('   1. Filter to a specific time period (e.g., last 365 days)');
  console.log('   2. Or calculate based on most recent complete year');
  console.log('   3. Or annualize partial year data\n');
}

checkDataPeriods();
