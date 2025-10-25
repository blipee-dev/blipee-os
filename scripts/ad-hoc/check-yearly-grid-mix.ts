/**
 * Check if grid mix data is properly separated by year
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkYearlyGridMix() {
  console.log('🔍 Checking grid mix data by year...\n');

  // Get all electricity records with grid mix
  const { data: records, error } = await supabase
    .from('metrics_data')
    .select('id, period_start, value, metadata')
    .not('metadata->grid_mix->carbon_intensity_lifecycle', 'is', null)
    .order('period_start', { ascending: true });

  if (error) {
    console.error('❌ Error fetching records:', error);
    return;
  }

  console.log(`Found ${records.length} records with emission factors\n`);

  // Group by year
  const byYear: { [year: string]: any[] } = {};

  records.forEach(record => {
    const date = new Date(record.period_start);
    const year = date.getFullYear();

    if (!byYear[year]) {
      byYear[year] = [];
    }

    byYear[year].push(record);
  });

  // Analyze each year
  console.log('📊 Grid Mix Data by Year:\n');

  Object.keys(byYear).sort().forEach(year => {
    const yearRecords = byYear[year];

    const lifecycleFactors = yearRecords
      .map(r => r.metadata?.grid_mix?.carbon_intensity_lifecycle)
      .filter(f => f !== null && f !== undefined);

    const scope2Factors = yearRecords
      .map(r => r.metadata?.grid_mix?.carbon_intensity_scope2)
      .filter(f => f !== null && f !== undefined);

    const renewablePercentages = yearRecords
      .map(r => r.metadata?.grid_mix?.renewable_percentage)
      .filter(p => p !== null && p !== undefined);

    const avgLifecycle = lifecycleFactors.length > 0
      ? lifecycleFactors.reduce((a, b) => a + b, 0) / lifecycleFactors.length
      : 0;

    const avgScope2 = scope2Factors.length > 0
      ? scope2Factors.reduce((a, b) => a + b, 0) / scope2Factors.length
      : 0;

    const avgRenewable = renewablePercentages.length > 0
      ? renewablePercentages.reduce((a, b) => a + b, 0) / renewablePercentages.length
      : 0;

    // Get unique emission factors for this year
    const uniqueLifecycleFactors = [...new Set(lifecycleFactors.map(f => f.toFixed(2)))];

    console.log(`Year ${year}:`);
    console.log(`  Records: ${yearRecords.length}`);
    console.log(`  Avg Lifecycle Factor: ${avgLifecycle.toFixed(2)} gCO2/kWh`);
    console.log(`  Avg Scope 2 Factor: ${avgScope2.toFixed(2)} gCO2/kWh`);
    console.log(`  Avg Renewable %: ${avgRenewable.toFixed(1)}%`);
    console.log(`  Unique Lifecycle Factors: ${uniqueLifecycleFactors.length}`);
    console.log(`  Range: ${uniqueLifecycleFactors.slice(0, 5).join(', ')}${uniqueLifecycleFactors.length > 5 ? '...' : ''}`);
    console.log('');
  });

  // Check if factors vary by month within a year
  console.log('\n📅 Monthly Variation (2023):');

  const year2023 = byYear['2023'] || [];
  const byMonth: { [month: string]: any[] } = {};

  year2023.forEach(record => {
    const date = new Date(record.period_start);
    const month = date.getMonth() + 1;
    const key = `2023-${String(month).padStart(2, '0')}`;

    if (!byMonth[key]) {
      byMonth[key] = [];
    }

    byMonth[key].push(record);
  });

  Object.keys(byMonth).sort().forEach(month => {
    const monthRecords = byMonth[month];

    const lifecycleFactors = monthRecords
      .map(r => r.metadata?.grid_mix?.carbon_intensity_lifecycle)
      .filter(f => f !== null && f !== undefined);

    const avgLifecycle = lifecycleFactors.length > 0
      ? lifecycleFactors.reduce((a, b) => a + b, 0) / lifecycleFactors.length
      : 0;

    const renewablePercentages = monthRecords
      .map(r => r.metadata?.grid_mix?.renewable_percentage)
      .filter(p => p !== null && p !== undefined);

    const avgRenewable = renewablePercentages.length > 0
      ? renewablePercentages.reduce((a, b) => a + b, 0) / renewablePercentages.length
      : 0;

    console.log(`  ${month}: ${avgLifecycle.toFixed(2)} gCO2/kWh (${avgRenewable.toFixed(1)}% renewable) - ${monthRecords.length} records`);
  });

  // Check dashboard API aggregation
  console.log('\n\n🔬 Testing Dashboard API Aggregation:');
  console.log('Testing with date range: 2023-01-01 to 2023-12-31\n');

  // Simulate what the API does - group by energy type and average
  const electricityRecords = records.filter(r => {
    const date = new Date(r.period_start);
    return date.getFullYear() === 2023;
  });

  if (electricityRecords.length > 0) {
    const lifecycleFactors = electricityRecords
      .map(r => r.metadata?.grid_mix?.carbon_intensity_lifecycle)
      .filter(f => f !== null && f !== undefined);

    const scope2Factors = electricityRecords
      .map(r => r.metadata?.grid_mix?.carbon_intensity_scope2)
      .filter(f => f !== null && f !== undefined);

    const scope3Factors = electricityRecords
      .map(r => r.metadata?.grid_mix?.carbon_intensity_scope3_cat3)
      .filter(f => f !== null && f !== undefined);

    const avgLifecycle = lifecycleFactors.reduce((a, b) => a + b, 0) / lifecycleFactors.length;
    const avgScope2 = scope2Factors.reduce((a, b) => a + b, 0) / scope2Factors.length;
    const avgScope3 = scope3Factors.reduce((a, b) => a + b, 0) / scope3Factors.length;

    console.log('Dashboard would show for 2023:');
    console.log(`  Lifecycle: ${avgLifecycle.toFixed(0)} gCO2/kWh`);
    console.log(`  Scope 2: ${avgScope2.toFixed(0)} gCO2/kWh`);
    console.log(`  Scope 3.3: ${avgScope3.toFixed(0)} gCO2/kWh`);
    console.log(`  Based on ${electricityRecords.length} records`);
  }
}

checkYearlyGridMix();
