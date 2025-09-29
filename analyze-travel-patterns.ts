import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function analyzeTravel() {
  console.log('=== BUSINESS TRAVEL ANALYSIS ===\n');

  // Get all plane travel data
  const planeId = '2fe49bc3-0f26-4597-a13d-54d89b1e08d9';
  const { data: planeData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('metric_id', planeId)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .order('period_start');

  // Group by year and month
  const yearlyData: any = {};
  const monthlyPattern: any = {};

  planeData?.forEach(d => {
    const date = new Date(d.period_start);
    const year = date.getFullYear();
    const month = date.getMonth();

    if (!yearlyData[year]) {
      yearlyData[year] = {
        total: 0,
        months: {},
        records: 0
      };
    }

    const emissions = (d.co2e_emissions || 0) / 1000;
    yearlyData[year].total += emissions;
    yearlyData[year].records++;

    if (!yearlyData[year].months[month]) {
      yearlyData[year].months[month] = 0;
    }
    yearlyData[year].months[month] += emissions;

    // Track monthly patterns across years
    if (year <= 2024) {
      if (!monthlyPattern[month]) monthlyPattern[month] = [];
      monthlyPattern[month].push(emissions);
    }
  });

  console.log('YEARLY TRENDS:');
  Object.entries(yearlyData).forEach(([year, data]: any) => {
    if (parseInt(year) <= 2024) {
      console.log(`${year}: ${data.total.toFixed(1)} tCO2e (${data.records} months)`);
      console.log(`  Monthly avg: ${(data.total / data.records).toFixed(2)} tCO2e`);
      console.log(`  Growth from prev year: ${
        yearlyData[parseInt(year) - 1]
          ? ((data.total - yearlyData[parseInt(year) - 1].total) / yearlyData[parseInt(year) - 1].total * 100).toFixed(1) + '%'
          : 'N/A'
      }`);
    }
  });

  console.log('\n2025 CURRENT PREDICTIONS:');
  console.log(`  Total: ${yearlyData[2025]?.total.toFixed(1)} tCO2e`);
  console.log(`  Monthly avg: ${(yearlyData[2025]?.total / 8).toFixed(2)} tCO2e`);
  console.log(`  Implied annual: ${(yearlyData[2025]?.total / 8 * 12).toFixed(1)} tCO2e`);

  console.log('\n=== RECOMMENDED ADJUSTMENTS ===\n');

  // Calculate more reasonable 2025 projection
  const growth2023to2024 = (yearlyData[2024].total - yearlyData[2023].total) / yearlyData[2023].total;
  console.log(`2023→2024 growth: ${(growth2023to2024 * 100).toFixed(1)}%`);

  // Scenarios for 2025
  console.log('\nSCENARIO ANALYSIS:');

  // Scenario 1: Steady state (same as 2024)
  const scenario1Annual = yearlyData[2024].total;
  console.log(`1. Steady State (0% growth): ${scenario1Annual.toFixed(1)} tCO2e annually`);
  console.log(`   Jan-Aug: ${(scenario1Annual * 8/12).toFixed(1)} tCO2e`);

  // Scenario 2: Modest growth (10%)
  const scenario2Annual = yearlyData[2024].total * 1.10;
  console.log(`2. Modest Growth (10%): ${scenario2Annual.toFixed(1)} tCO2e annually`);
  console.log(`   Jan-Aug: ${(scenario2Annual * 8/12).toFixed(1)} tCO2e`);

  // Scenario 3: Pre-2024 trend (avg of 2022-2023 growth)
  const growth2022to2023 = (yearlyData[2023].total - yearlyData[2022].total) / yearlyData[2022].total;
  const historicalGrowth = growth2022to2023; // ~14.5%
  const scenario3Annual = yearlyData[2024].total * (1 + historicalGrowth);
  console.log(`3. Historical Trend (${(historicalGrowth * 100).toFixed(1)}%): ${scenario3Annual.toFixed(1)} tCO2e annually`);
  console.log(`   Jan-Aug: ${(scenario3Annual * 8/12).toFixed(1)} tCO2e`);

  console.log('\n=== MONTHLY SEASONALITY ===\n');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Calculate average monthly pattern
  const monthlyAvg: any = {};
  Object.entries(monthlyPattern).forEach(([month, values]: any) => {
    monthlyAvg[month] = values.reduce((a: number, b: number) => a + b, 0) / values.length;
  });

  // Find seasonal index
  const overallAvg = Object.values(monthlyAvg).reduce((a: any, b: any) => a + b, 0) / Object.keys(monthlyAvg).length;

  console.log('Seasonal Index (1.0 = average):');
  Object.entries(monthlyAvg)
    .sort((a: any, b: any) => parseInt(a[0]) - parseInt(b[0]))
    .forEach(([month, avg]: any) => {
      const index = avg / overallAvg;
      console.log(`  ${monthNames[parseInt(month)]}: ${index.toFixed(2)} ${index > 1.2 ? '⬆️' : index < 0.8 ? '⬇️' : ''}`);
    });

  console.log('\n=== RECOMMENDATION ===\n');
  console.log('The 2024 spike (175% growth) appears to be an outlier, likely due to:');
  console.log('- Post-pandemic travel recovery');
  console.log('- Pent-up demand for conferences/meetings');
  console.log('- Special projects or events');
  console.log('');
  console.log('For 2025, recommend Scenario 2 (10% growth):');
  console.log(`- Annual target: ${scenario2Annual.toFixed(1)} tCO2e`);
  console.log(`- Jan-Aug target: ${(scenario2Annual * 8/12).toFixed(1)} tCO2e`);
  console.log(`- Current prediction: ${yearlyData[2025]?.total.toFixed(1)} tCO2e`);
  console.log(`- Overestimated by: ${(yearlyData[2025]?.total - scenario2Annual * 8/12).toFixed(1)} tCO2e`);

  // Check train travel too
  const trainId = 'c6558575-c628-4506-85a0-fb39ca68aba5';
  const { data: trainData } = await supabase
    .from('metrics_data')
    .select('period_start, co2e_emissions')
    .eq('metric_id', trainId)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .order('period_start');

  const trainByYear: any = {};
  trainData?.forEach(d => {
    const year = new Date(d.period_start).getFullYear();
    if (!trainByYear[year]) trainByYear[year] = 0;
    trainByYear[year] += (d.co2e_emissions || 0) / 1000;
  });

  console.log('\n=== TRAIN TRAVEL (for comparison) ===\n');
  Object.entries(trainByYear).forEach(([year, total]: any) => {
    console.log(`${year}: ${total.toFixed(2)} tCO2e`);
  });
}

analyzeTravel();