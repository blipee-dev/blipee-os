import { config } from 'dotenv';
config({ path: '.env.local' });

import { supabaseAdmin } from './src/lib/supabase/admin';

const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function checkHistoricalData() {
  console.log('📅 Checking Historical Plane Travel Data Availability\n');
  console.log('='.repeat(80));

  // Fetch ALL plane travel data from 2022 onwards
  const { data, error } = await supabaseAdmin
    .from('metrics_data')
    .select(`
      period_start,
      value,
      co2e_emissions,
      created_at,
      metrics_catalog!inner(
        code,
        name
      )
    `)
    .eq('organization_id', organizationId)
    .eq('metrics_catalog.code', 'scope3_business_travel_air')
    .gte('period_start', '2022-01-01')
    .lt('period_start', '2026-01-01')
    .order('period_start', { ascending: true });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`\n📊 Total Records Found: ${data.length}\n`);

  // Group by year
  const byYear = new Map<string, any[]>();
  data.forEach(d => {
    const year = d.period_start?.substring(0, 4) || 'Unknown';
    if (!byYear.has(year)) {
      byYear.set(year, []);
    }
    byYear.get(year)!.push(d);
  });

  console.log('📋 Data Availability by Year:');
  console.log('─'.repeat(80));

  ['2022', '2023', '2024', '2025'].forEach(year => {
    const records = byYear.get(year) || [];
    if (records.length > 0) {
      const totalEmissions = records.reduce((sum, r) => sum + ((r.co2e_emissions || 0) / 1000), 0);
      const avgEmissions = totalEmissions / records.length;
      const minEmissions = Math.min(...records.map(r => (r.co2e_emissions || 0) / 1000));
      const maxEmissions = Math.max(...records.map(r => (r.co2e_emissions || 0) / 1000));

      console.log(`\n${year}:`);
      console.log(`   Months: ${records.length}/12`);
      console.log(`   Total: ${totalEmissions.toFixed(2)} tCO2e`);
      console.log(`   Average: ${avgEmissions.toFixed(2)} tCO2e/month`);
      console.log(`   Range: ${minEmissions.toFixed(2)} - ${maxEmissions.toFixed(2)} tCO2e`);
      console.log(`   Status: ${records.length === 12 ? '✅ Complete' : '⚠️  Incomplete (' + records.length + ' months)'}`);
    } else {
      console.log(`\n${year}:`);
      console.log(`   ❌ No data available`);
    }
  });

  // Check 2022 month-by-month
  const data2022 = byYear.get('2022') || [];
  if (data2022.length > 0) {
    console.log('\n\n📅 2022 Monthly Breakdown:');
    console.log('─'.repeat(80));
    console.log('Month       Distance (km)    Emissions (tCO2e)    Created At');
    console.log('─'.repeat(80));

    data2022.forEach(d => {
      const month = d.period_start?.substring(0, 7);
      const distance = d.value || 0;
      const emissions = (d.co2e_emissions || 0) / 1000;
      const createdAt = d.created_at?.substring(0, 10);
      console.log(`${month}   ${distance.toFixed(0).padStart(14)}   ${emissions.toFixed(4).padStart(16)}   ${createdAt}`);
    });
  }

  // Calculate total training data available
  const trainingData = data.filter(d => d.period_start && d.period_start < '2025-01-01');
  const totalMonths = trainingData.length;

  console.log('\n\n📊 TRAINING DATA SUMMARY:');
  console.log('='.repeat(80));
  console.log(`\nTotal months available for ML training (2022-2024): ${totalMonths} months`);

  if (totalMonths >= 36) {
    console.log(`\n✅ SUFFICIENT DATA for full seasonal decomposition`);
    console.log(`   • The Enterprise Forecast model will use: seasonal-decomposition`);
    console.log(`   • This method captures 36-month seasonal patterns`);
    console.log(`   • Provides best accuracy for long-term trends and seasonality`);
  } else if (totalMonths >= 12) {
    console.log(`\n⚠️  ADEQUATE DATA for exponential smoothing`);
    console.log(`   • The Enterprise Forecast model will use: exponential-smoothing`);
    console.log(`   • This method captures trends but not full seasonal patterns`);
    console.log(`   • Recommend collecting more historical data for better accuracy`);
  } else {
    console.log(`\n❌ INSUFFICIENT DATA for reliable forecasting`);
    console.log(`   • The Enterprise Forecast model needs at least 12 months`);
    console.log(`   • Currently have: ${totalMonths} months`);
    console.log(`   • Forecasts will have low confidence`);
  }

  // Show the actual decision logic
  console.log('\n\n🤖 ENTERPRISE FORECAST MODEL LOGIC:');
  console.log('─'.repeat(80));
  console.log(`\nCurrent training data: ${totalMonths} months`);
  console.log(`\nModel selection:`);
  if (totalMonths >= 36) {
    console.log(`   ✅ seasonalDecompositionForecast()`);
    console.log(`      - Uses full trend + seasonality + residual decomposition`);
    console.log(`      - Period: 36 months`);
    console.log(`      - Best for: Long-term patterns, seasonal businesses`);
  } else if (totalMonths >= 12) {
    console.log(`   ⚠️  exponentialSmoothingWithTrend()`);
    console.log(`      - Uses Holt's linear method (level + trend)`);
    console.log(`      - Limited seasonal awareness`);
    console.log(`      - Best for: Sparse data, trending series`);
  } else {
    console.log(`   ❌ Insufficient data - forecasts will be unreliable`);
  }

  // Compare to what we actually used
  console.log('\n\n📋 WHAT WE ACTUALLY USED IN PREVIOUS FORECAST:');
  console.log('─'.repeat(80));

  const data2023_2024 = data.filter(d => {
    const year = d.period_start?.substring(0, 4);
    return year === '2023' || year === '2024';
  });

  const data2025YTD = data.filter(d => {
    const period = d.period_start || '';
    return period >= '2025-01-01' && period < '2025-10-01';
  });

  console.log(`\n• Used: ${data2023_2024.length} months (2023-2024) + ${data2025YTD.length} months (2025 YTD)`);
  console.log(`• Total: ${data2023_2024.length + data2025YTD.length} months`);
  console.log(`\nWe SHOULD have used:`);
  console.log(`• All available data: ${trainingData.length} months (2022-2024)`);
  if (data2022.length > 0) {
    console.log(`• Including 2022: ${data2022.length} months that were IGNORED`);
  }

  console.log('\n' + '='.repeat(80));
}

checkHistoricalData().catch(console.error);
