import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function debugScope3Trends() {
  console.log('🔍 Debugging Scope 3 Monthly Trends\n');
  console.log('='.repeat(80));

  // Fetch all 2025 metrics_data with scope_3
  const { data, error } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      id,
      period_start,
      value,
      co2e_emissions,
      metrics_catalog!inner(
        name,
        category,
        scope
      )
    `)
    .eq('organization_id', organizationId)
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  // Group by scope
  const scope1Data: any[] = [];
  const scope2Data: any[] = [];
  const scope3Data: any[] = [];

  data.forEach(d => {
    const scope = (d.metrics_catalog as any)?.scope;
    if (scope === 'scope_1') scope1Data.push(d);
    else if (scope === 'scope_2') scope2Data.push(d);
    else if (scope === 'scope_3') scope3Data.push(d);
  });

  console.log(`\n📊 Total Records: ${data.length}`);
  console.log(`   Scope 1: ${scope1Data.length} records`);
  console.log(`   Scope 2: ${scope2Data.length} records`);
  console.log(`   Scope 3: ${scope3Data.length} records`);

  // Analyze Scope 3 by month
  console.log('\n📅 Scope 3 Monthly Breakdown:');
  console.log('─'.repeat(80));

  const monthlyScope3 = new Map<string, { records: number; totalEmissions: number; categories: Set<string> }>();

  scope3Data.forEach(d => {
    const month = d.period_start?.substring(0, 7);
    if (!month) return;

    if (!monthlyScope3.has(month)) {
      monthlyScope3.set(month, { records: 0, totalEmissions: 0, categories: new Set() });
    }

    const monthData = monthlyScope3.get(month)!;
    monthData.records++;
    monthData.totalEmissions += (d.co2e_emissions || 0) / 1000; // Convert to tCO2e
    monthData.categories.add((d.metrics_catalog as any)?.category || 'Unknown');
  });

  // Sort and display
  const sortedMonths = Array.from(monthlyScope3.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  sortedMonths.forEach(([month, data]) => {
    console.log(`\n${month}:`);
    console.log(`   Records: ${data.records}`);
    console.log(`   Total Emissions: ${data.totalEmissions.toFixed(2)} tCO2e`);
    console.log(`   Categories: ${Array.from(data.categories).join(', ')}`);
  });

  // Check for duplicate data (same value every month)
  console.log('\n⚠️  Checking for Duplicate/Linear Patterns:');
  console.log('─'.repeat(80));

  const monthlyValues = sortedMonths.map(([_, data]) => data.totalEmissions);
  const uniqueValues = new Set(monthlyValues);

  if (uniqueValues.size === 1 && monthlyValues.length > 1) {
    console.log(`❌ PROBLEM FOUND: All months have the SAME Scope 3 value: ${monthlyValues[0].toFixed(2)} tCO2e`);
    console.log('   This indicates the data is being duplicated or incorrectly aggregated.');
  } else if (uniqueValues.size < monthlyValues.length / 2) {
    console.log(`⚠️  WARNING: Only ${uniqueValues.size} unique values across ${monthlyValues.length} months`);
    console.log(`   Values: ${Array.from(uniqueValues).map(v => v.toFixed(2)).join(', ')}`);
  } else {
    console.log(`✅ OK: ${uniqueValues.size} unique values across ${monthlyValues.length} months`);
  }

  // Show detailed Scope 3 categories
  console.log('\n📋 Scope 3 Categories (with data):');
  console.log('─'.repeat(80));

  const categoryCounts = new Map<string, number>();
  scope3Data.forEach(d => {
    const category = (d.metrics_catalog as any)?.category || 'Unknown';
    categoryCounts.set(category, (categoryCounts.get(category) || 0) + 1);
  });

  const sortedCategories = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);
  sortedCategories.forEach(([category, count]) => {
    console.log(`   ${category}: ${count} records`);
  });

  // Sample some Scope 3 records to check if they're actually monthly or just duplicated
  console.log('\n🔬 Sample Scope 3 Records:');
  console.log('─'.repeat(80));

  const sampleRecords = scope3Data.slice(0, 10);
  sampleRecords.forEach(d => {
    const catalog = d.metrics_catalog as any;
    console.log(`   ${d.period_start} | ${catalog?.category} | ${catalog?.name} | ${(d.co2e_emissions || 0) / 1000} tCO2e`);
  });

  console.log('\n' + '='.repeat(80));
}

debugScope3Trends().catch(console.error);
