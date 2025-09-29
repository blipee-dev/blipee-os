import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function verifyPredictions() {
  console.log('=== PREDICTION VERIFICATION ===\n');

  // Get historical data
  const { data: historicalData } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .lte('period_end', '2024-12-31')
    .order('period_start');

  // Get predictions
  const { data: predictions } = await supabase
    .from('metrics_data')
    .select('*')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2025-01-01')
    .order('period_start');

  // Group historical by metric and calculate averages
  const metricStats: any = {};

  historicalData?.forEach(record => {
    const metricId = record.metric_id;
    const year = new Date(record.period_start).getFullYear();
    const month = new Date(record.period_start).getMonth();

    if (!metricStats[metricId]) {
      metricStats[metricId] = {
        name: '',
        historicalValues: [],
        historicalEmissions: [],
        monthlyAverages: {},
        yearlyGrowth: []
      };
    }

    metricStats[metricId].historicalValues.push(record.value || 0);
    metricStats[metricId].historicalEmissions.push((record.co2e_emissions || 0) / 1000);

    // Track monthly averages
    const monthKey = month;
    if (!metricStats[metricId].monthlyAverages[monthKey]) {
      metricStats[metricId].monthlyAverages[monthKey] = {
        values: [],
        emissions: []
      };
    }
    metricStats[metricId].monthlyAverages[monthKey].values.push(record.value || 0);
    metricStats[metricId].monthlyAverages[monthKey].emissions.push((record.co2e_emissions || 0) / 1000);
  });

  // Get metric names
  const { data: metrics } = await supabase
    .from('metrics')
    .select('id, name, category');

  metrics?.forEach(m => {
    if (metricStats[m.id]) {
      metricStats[m.id].name = `${m.name} [${m.category}]`;
    }
  });

  // Analyze predictions vs historical
  console.log('=== PREDICTION ANALYSIS BY METRIC ===\n');

  const predictionsByMetric: any = {};
  predictions?.forEach(p => {
    if (!predictionsByMetric[p.metric_id]) {
      predictionsByMetric[p.metric_id] = [];
    }
    predictionsByMetric[p.metric_id].push(p);
  });

  let totalHistoricalEmissions = 0;
  let totalPredictedEmissions = 0;

  Object.entries(metricStats).forEach(([metricId, stats]: any) => {
    if (!predictionsByMetric[metricId]) return;

    const historicalAvg = stats.historicalEmissions.reduce((a: number, b: number) => a + b, 0) / stats.historicalEmissions.length;
    const predictedValues = predictionsByMetric[metricId];
    const predictedAvg = predictedValues.reduce((a: number, b: any) => a + (b.co2e_emissions || 0) / 1000, 0) / predictedValues.length;

    // Calculate year-over-year growth
    const yearlyTotals: any = {};
    historicalData?.filter(d => d.metric_id === metricId).forEach(d => {
      const year = new Date(d.period_start).getFullYear();
      if (!yearlyTotals[year]) yearlyTotals[year] = 0;
      yearlyTotals[year] += (d.co2e_emissions || 0) / 1000;
    });

    const years = Object.keys(yearlyTotals).sort();
    let growthRate = 0;
    if (years.length >= 2) {
      const firstYear = parseFloat(yearlyTotals[years[0]]);
      const lastYear = parseFloat(yearlyTotals[years[years.length - 1]]);
      if (firstYear > 0) {
        growthRate = ((lastYear - firstYear) / firstYear) * 100 / (years.length - 1);
      }
    }

    console.log(`${stats.name || metricId}:`);
    console.log(`  Historical avg: ${historicalAvg.toFixed(3)} tCO2e/month`);
    console.log(`  Predicted avg: ${predictedAvg.toFixed(3)} tCO2e/month`);
    console.log(`  Difference: ${((predictedAvg - historicalAvg) / historicalAvg * 100).toFixed(1)}%`);
    console.log(`  YoY Growth Rate: ${growthRate.toFixed(1)}%`);

    // Check for anomalies
    const maxHistorical = Math.max(...stats.historicalEmissions);
    const minHistorical = Math.min(...stats.historicalEmissions.filter((v: number) => v > 0));
    const predictedMax = Math.max(...predictedValues.map((p: any) => (p.co2e_emissions || 0) / 1000));
    const predictedMin = Math.min(...predictedValues.map((p: any) => (p.co2e_emissions || 0) / 1000).filter((v: number) => v > 0));

    if (predictedMax > maxHistorical * 2) {
      console.log(`  ⚠️ WARNING: Predicted max (${predictedMax.toFixed(3)}) is >2x historical max (${maxHistorical.toFixed(3)})`);
    }
    if (predictedMin < minHistorical * 0.5 && minHistorical > 0) {
      console.log(`  ⚠️ WARNING: Predicted min (${predictedMin.toFixed(3)}) is <50% of historical min (${minHistorical.toFixed(3)})`);
    }

    console.log('');

    totalHistoricalEmissions += stats.historicalEmissions.reduce((a: number, b: number) => a + b, 0);
    totalPredictedEmissions += predictedValues.reduce((a: number, b: any) => a + (b.co2e_emissions || 0) / 1000, 0);
  });

  // Compare totals
  console.log('=== OVERALL COMPARISON ===\n');

  // Get actual totals by year
  const yearlyActuals: any = {};
  historicalData?.forEach(d => {
    const year = new Date(d.period_start).getFullYear();
    if (!yearlyActuals[year]) yearlyActuals[year] = 0;
    yearlyActuals[year] += (d.co2e_emissions || 0) / 1000;
  });

  const predicted2025: any = {};
  predictions?.forEach(p => {
    const month = new Date(p.period_start).getMonth() + 1;
    if (!predicted2025[month]) predicted2025[month] = 0;
    predicted2025[month] += (p.co2e_emissions || 0) / 1000;
  });

  console.log('Historical Yearly Totals:');
  Object.entries(yearlyActuals).sort().forEach(([year, total]: any) => {
    console.log(`  ${year}: ${total.toFixed(1)} tCO2e`);
  });

  console.log('\n2025 Predictions (Jan-Aug):');
  const total2025 = Object.values(predicted2025).reduce((a: any, b: any) => a + b, 0);
  console.log(`  Total: ${total2025.toFixed(1)} tCO2e`);
  console.log(`  Monthly avg: ${(total2025 / 8).toFixed(1)} tCO2e`);

  // Calculate expected 2025 based on growth trend
  const years = Object.keys(yearlyActuals).sort();
  if (years.length >= 2) {
    const recentYears = years.slice(-2);
    const year1Total = yearlyActuals[recentYears[0]];
    const year2Total = yearlyActuals[recentYears[1]];
    const growthRate = (year2Total - year1Total) / year1Total;
    const expected2025 = year2Total * (1 + growthRate);
    const expected8Months = expected2025 * (8/12);

    console.log(`\nExpected 2025 (based on ${recentYears[0]}-${recentYears[1]} growth):`);
    console.log(`  Full year projection: ${expected2025.toFixed(1)} tCO2e`);
    console.log(`  8 months projection: ${expected8Months.toFixed(1)} tCO2e`);
    console.log(`  Actual prediction: ${total2025.toFixed(1)} tCO2e`);
    console.log(`  Variance: ${((total2025 - expected8Months) / expected8Months * 100).toFixed(1)}%`);
  }

  // Check monthly distribution
  console.log('\n=== MONTHLY DISTRIBUTION CHECK ===\n');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  Object.entries(predicted2025).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([month, total]: any) => {
    console.log(`  ${monthNames[parseInt(month) - 1]}: ${total.toFixed(1)} tCO2e`);
  });

  // Check for suspicious patterns
  console.log('\n=== VALIDATION CHECKS ===\n');

  const monthlyValues = Object.values(predicted2025);
  const avgMonthly = monthlyValues.reduce((a: any, b: any) => a + b, 0) / monthlyValues.length;
  const stdDev = Math.sqrt(monthlyValues.reduce((sq: any, n: any) => sq + Math.pow(n - avgMonthly, 2), 0) / monthlyValues.length);

  console.log(`Monthly average: ${avgMonthly.toFixed(1)} tCO2e`);
  console.log(`Standard deviation: ${stdDev.toFixed(1)} tCO2e`);
  console.log(`Coefficient of variation: ${(stdDev / avgMonthly * 100).toFixed(1)}%`);

  if (stdDev / avgMonthly < 0.05) {
    console.log('⚠️ WARNING: Monthly values have very low variation - might be too uniform');
  }

  // Check if any predictions are exactly the same
  const uniqueValues = new Set(predictions?.map(p => p.co2e_emissions));
  if (uniqueValues.size < predictions?.length * 0.8) {
    console.log('⚠️ WARNING: Many duplicate prediction values detected');
  }
}

verifyPredictions();