import { supabaseAdmin } from './src/lib/supabase/admin.js';

async function checkEmissionsData() {
  // Get organization ID for jose.pinto@plmj.pt
  const { data: userData } = await supabaseAdmin
    .from('app_users')
    .select('organization_id')
    .eq('email', 'jose.pinto@plmj.pt')
    .single();

  if (!userData) {
    console.log('User not found');
    return;
  }

  const orgId = userData.organization_id;
  console.log('Organization ID:', orgId);

  // Get metrics data
  const { data: metricsData, error } = await supabaseAdmin
    .from('metrics_data')
    .select('*, metrics_catalog!inner(name, category, scope, unit, emission_factor)')
    .eq('organization_id', orgId)
    .order('period_start', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Total records found:', metricsData?.length || 0);

  // Group by month
  const monthlyEmissions = new Map();
  let totalAllTime = 0;

  metricsData?.forEach(record => {
    const date = new Date(record.period_start);
    const monthKey = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0');

    if (!monthlyEmissions.has(monthKey)) {
      monthlyEmissions.set(monthKey, {
        month: monthKey,
        total: 0,
        scope1: 0,
        scope2: 0,
        scope3: 0,
        count: 0
      });
    }

    const month = monthlyEmissions.get(monthKey);
    const emissions = record.co2e_emissions || 0;
    month.total += emissions;
    month.count++;
    totalAllTime += emissions;

    const scope = record.metrics_catalog?.scope;
    if (scope === 1 || scope === 'scope_1') month.scope1 += emissions;
    else if (scope === 2 || scope === 'scope_2') month.scope2 += emissions;
    else month.scope3 += emissions;
  });

  console.log('\n📊 Monthly Emissions Summary:');
  const sortedMonths = Array.from(monthlyEmissions.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 12);

  sortedMonths.forEach(([month, data]) => {
    console.log(`${month}: ${data.total.toFixed(2)} tCO2e (${data.count} records)`);
  });

  // Get most recent month
  const [mostRecentMonth, mostRecentData] = sortedMonths[0] || [];
  console.log('\n🎯 Most Recent Month:', mostRecentMonth);
  console.log('Total Emissions:', mostRecentData?.total.toFixed(2), 'tCO2e');
  console.log('Breakdown:');
  console.log('  Scope 1:', mostRecentData?.scope1.toFixed(2), 'tCO2e');
  console.log('  Scope 2:', mostRecentData?.scope2.toFixed(2), 'tCO2e');
  console.log('  Scope 3:', mostRecentData?.scope3.toFixed(2), 'tCO2e');

  console.log('\n📈 Total All Time:', totalAllTime.toFixed(2), 'tCO2e');

  // Calculate intensity (assuming 1000 m2 area)
  const intensity = mostRecentData ? mostRecentData.total / 1000 : 0;
  console.log('Intensity:', intensity.toFixed(2), 'tCO2e/m²');

  process.exit(0);
}

checkEmissionsData();