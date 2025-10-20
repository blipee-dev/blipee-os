import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkScope3Timestamps() {
  console.log('🕐 Checking Scope 3 Data Creation Timestamps\n');
  console.log('='.repeat(80));

  // Fetch Scope 3 data with timestamps
  const { data, error } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      id,
      period_start,
      created_at,
      co2e_emissions,
      metrics_catalog!inner(
        name,
        category,
        scope
      )
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.scope', 'scope_3')
    .gte('period_start', '2025-01-01')
    .lt('period_start', '2025-10-01')
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`\n📊 Total Scope 3 Records Retrieved: ${data.length}`);

  // Group by creation date
  const creationDates = new Map<string, number>();
  data.forEach(d => {
    const createdDate = d.created_at?.substring(0, 10) || 'Unknown';
    creationDates.set(createdDate, (creationDates.get(createdDate) || 0) + 1);
  });

  console.log('\n📅 Records Created By Date:');
  console.log('─'.repeat(80));
  const sortedDates = Array.from(creationDates.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  sortedDates.forEach(([date, count]) => {
    console.log(`   ${date}: ${count} records`);
  });

  // Check if all records were created on the same day
  if (creationDates.size === 1) {
    console.log('\n⚠️  WARNING: All Scope 3 records were created on THE SAME DAY!');
    console.log('   This suggests the data was bulk-uploaded or auto-generated.');
  } else if (creationDates.size < 5) {
    console.log('\n⚠️  WARNING: All Scope 3 records were created on just a few days.');
    console.log('   This suggests the data may be bulk-uploaded or auto-generated.');
  }

  // Show first 20 records with timestamps
  console.log('\n🔬 First 20 Scope 3 Records (sorted by creation time):');
  console.log('─'.repeat(80));
  data.slice(0, 20).forEach(d => {
    const catalog = d.metrics_catalog as any;
    console.log(`   Created: ${d.created_at?.substring(0, 19)} | Period: ${d.period_start} | ${catalog?.category}`);
  });

  // Check monthly pattern
  console.log('\n📈 Monthly Emissions Pattern:');
  console.log('─'.repeat(80));

  const monthlyEmissions = new Map<string, number>();
  data.forEach(d => {
    const month = d.period_start?.substring(0, 7);
    if (!month) return;
    monthlyEmissions.set(month, (monthlyEmissions.get(month) || 0) + ((d.co2e_emissions || 0) / 1000));
  });

  const sortedMonths = Array.from(monthlyEmissions.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  const emissionValues = sortedMonths.map(([_, emissions]) => emissions);

  // Calculate if it's linear
  if (emissionValues.length >= 3) {
    const differences: number[] = [];
    for (let i = 1; i < emissionValues.length; i++) {
      differences.push(emissionValues[i] - emissionValues[i-1]);
    }

    const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    const maxDeviation = Math.max(...differences.map(d => Math.abs(d - avgDiff)));

    sortedMonths.forEach(([month, emissions]) => {
      console.log(`   ${month}: ${emissions.toFixed(2)} tCO2e`);
    });

    console.log(`\n   Average monthly increase: ${avgDiff.toFixed(2)} tCO2e`);
    console.log(`   Max deviation from average: ${maxDeviation.toFixed(2)} tCO2e`);

    if (maxDeviation < avgDiff * 0.1) {
      console.log(`\n   ⚠️  HIGHLY LINEAR: The data increases almost perfectly linearly!`);
      console.log(`   This is unusual for real-world Scope 3 data, which typically varies.`);
    }
  }

  console.log('\n' + '='.repeat(80));
}

checkScope3Timestamps().catch(console.error);
