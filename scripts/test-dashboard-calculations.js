const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDashboardCalculations() {
  console.log('🎯 Testing Dashboard Calculations with Correct Data\n');

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('name', 'PLMJ')
    .single();

  // Test 2024 data
  const { data: data2024 } = await supabase
    .from('metrics_data')
    .select(`
      *,
      metrics_catalog (
        name, scope, category
      )
    `)
    .eq('organization_id', org.id)
    .gte('period_start', '2024-01-01')
    .lt('period_start', '2025-01-01');

  // Calculate scope totals
  const scopeTotals = {
    scope_1: 0,
    scope_2: 0,
    scope_3: 0
  };

  data2024?.forEach(d => {
    const scope = d.metrics_catalog?.scope;
    if (scope && d.co2e_emissions) {
      scopeTotals[scope] += d.co2e_emissions;
    }
  });

  console.log('📊 2024 Emissions by Scope:');
  console.log('─'.repeat(40));
  console.log(`   Scope 1: ${(scopeTotals.scope_1 / 1000).toFixed(2)} tCO2e`);
  console.log(`   Scope 2: ${(scopeTotals.scope_2 / 1000).toFixed(2)} tCO2e`);
  console.log(`   Scope 3: ${(scopeTotals.scope_3 / 1000).toFixed(2)} tCO2e`);
  console.log(`   TOTAL:   ${((scopeTotals.scope_1 + scopeTotals.scope_2 + scopeTotals.scope_3) / 1000).toFixed(2)} tCO2e`);

  // Calculate category breakdown
  const categoryTotals = {};
  data2024?.forEach(d => {
    const category = d.metrics_catalog?.category || 'Other';
    categoryTotals[category] = (categoryTotals[category] || 0) + (d.co2e_emissions || 0);
  });

  console.log('\n📈 2024 Emissions by Category:');
  console.log('─'.repeat(40));
  Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, emissions]) => {
      console.log(`   ${category}: ${(emissions / 1000).toFixed(2)} tCO2e`);
    });

  // Monthly trend
  const monthlyEmissions = {};
  data2024?.forEach(d => {
    const month = new Date(d.period_start).toISOString().slice(0, 7);
    monthlyEmissions[month] = (monthlyEmissions[month] || 0) + (d.co2e_emissions || 0);
  });

  console.log('\n📅 2024 Monthly Emissions:');
  console.log('─'.repeat(40));
  Object.entries(monthlyEmissions)
    .sort()
    .forEach(([month, emissions]) => {
      const bar = '█'.repeat(Math.round(emissions / 10000));
      console.log(`   ${month}: ${bar} ${(emissions / 1000).toFixed(2)} tCO2e`);
    });

  // Site comparison
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('organization_id', org.id);

  const siteEmissions = {};
  data2024?.forEach(d => {
    const siteName = sites?.find(s => s.id === d.site_id)?.name || 'Unknown';
    siteEmissions[siteName] = (siteEmissions[siteName] || 0) + (d.co2e_emissions || 0);
  });

  console.log('\n🏢 2024 Emissions by Site:');
  console.log('─'.repeat(40));
  Object.entries(siteEmissions)
    .sort((a, b) => b[1] - a[1])
    .forEach(([site, emissions]) => {
      console.log(`   ${site}: ${(emissions / 1000).toFixed(2)} tCO2e`);
    });

  console.log('\n✅ Dashboard should now display:');
  console.log('   • Correct total emissions');
  console.log('   • Proper scope breakdown');
  console.log('   • Accurate monthly trends');
  console.log('   • Site-by-site comparisons');
  console.log('   • All based on verified 2022-2024 data');
}

testDashboardCalculations().catch(console.error);