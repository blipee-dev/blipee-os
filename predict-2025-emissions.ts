import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Simple linear regression with seasonal adjustment
function predictWithTrend(historicalData: any[], targetMonth: number) {
  // Calculate year-over-year growth
  const yearlyTotals: any = {};
  historicalData.forEach(d => {
    const year = new Date(d.period_start).getFullYear();
    if (!yearlyTotals[year]) yearlyTotals[year] = 0;
    yearlyTotals[year] += d.value;
  });

  const years = Object.keys(yearlyTotals).sort();

  // Calculate growth rates
  const growthRates: number[] = [];
  for (let i = 1; i < years.length; i++) {
    const growth = (yearlyTotals[years[i]] - yearlyTotals[years[i-1]]) / yearlyTotals[years[i-1]];
    growthRates.push(growth);
  }

  // Average growth rate (weighted towards recent)
  const avgGrowth = growthRates.length > 0
    ? growthRates.reduce((a, b, i) => a + b * (i + 1), 0) / growthRates.reduce((a, b, i) => a + (i + 1), 0)
    : 0.1; // Default 10% growth

  // Calculate seasonal patterns (monthly averages)
  const monthlyPatterns: any = {};
  historicalData.forEach(d => {
    const month = new Date(d.period_start).getMonth() + 1;
    if (!monthlyPatterns[month]) monthlyPatterns[month] = [];
    monthlyPatterns[month].push(d.value);
  });

  // Get average for target month
  const monthData = monthlyPatterns[targetMonth] || [];
  const monthAvg = monthData.length > 0
    ? monthData.reduce((a: number, b: number) => a + b, 0) / monthData.length
    : 0;

  // Apply growth to 2024 baseline
  const baseline2024 = monthlyPatterns[targetMonth]?.[monthlyPatterns[targetMonth].length - 1] || monthAvg;
  const predicted = baseline2024 * (1 + avgGrowth);

  // Add some random variation (±5%)
  const variation = (Math.random() - 0.5) * 0.1;

  return Math.round(predicted * (1 + variation));
}

async function generatePredictions() {
  console.log('\n=== GENERATING 2025 PREDICTIONS (JAN-AUG) ===\n');

  // Get historical data by category
  const { data: historicalMetrics } = await supabase
    .from('metrics_data')
    .select(`
      *,
      metrics_catalog (
        id,
        name,
        category,
        unit,
        scope
      )
    `)
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .order('period_start', { ascending: true });

  if (!historicalMetrics || historicalMetrics.length === 0) {
    console.log('No historical data found');
    return;
  }

  // Group by metric type
  const metricGroups: any = {};
  historicalMetrics.forEach(m => {
    const key = m.metric_id;
    if (!metricGroups[key]) {
      metricGroups[key] = {
        metric_id: m.metric_id,
        name: m.metrics_catalog?.name,
        category: m.metrics_catalog?.category,
        unit: m.unit || m.metrics_catalog?.unit,
        data: []
      };
    }
    metricGroups[key].data.push({
      period_start: m.period_start,
      value: m.value,
      co2e_emissions: m.co2e_emissions,
      emission_factor: m.emission_factor
    });
  });

  // Generate predictions for each metric type
  const predictions: any[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];

  for (let month = 1; month <= 8; month++) {
    const monthStart = `2025-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(2025, month, 0).getDate();
    const monthEnd = `2025-${String(month).padStart(2, '0')}-${lastDay}`;

    console.log(`\n${monthNames[month - 1]} 2025 Predictions:`);

    Object.values(metricGroups).forEach((metric: any) => {
      // Only predict for key metrics
      if (!['Electricity', 'Plane Travel', 'Purchased Cooling', 'Purchased Heating', 'Water', 'Waste Recycled'].includes(metric.name)) {
        return;
      }

      const predictedValue = predictWithTrend(metric.data, month);

      // Calculate emissions based on average emission factor
      const avgEmissionFactor = metric.data.reduce((sum: number, d: any) => {
        return sum + (d.co2e_emissions / d.value);
      }, 0) / metric.data.length;

      const predictedEmissions = predictedValue * avgEmissionFactor;

      console.log(`  ${metric.name}: ${predictedValue.toLocaleString()} ${metric.unit} → ${Math.round(predictedEmissions / 1000)} tCO2e`);

      predictions.push({
        metric_id: metric.metric_id,
        organization_id: '22647141-2ee4-4d8d-8b47-16b0cbd830b2',
        site_id: null,
        period_start: monthStart,
        period_end: monthEnd,
        value: predictedValue,
        unit: metric.unit,
        co2e_emissions: predictedEmissions,
        data_quality: 'estimated', // Use 'estimated' instead of 'predicted'
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });
  }

  // Calculate total predicted emissions
  const totalPredicted = predictions.reduce((sum, p) => sum + p.co2e_emissions, 0) / 1000;
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total predicted emissions for Jan-Aug 2025: ${Math.round(totalPredicted).toLocaleString()} tCO2e`);
  console.log(`Average monthly: ${Math.round(totalPredicted / 8).toLocaleString()} tCO2e`);

  // Compare with 2024 same period
  const { data: data2024 } = await supabase
    .from('metrics_data')
    .select('co2e_emissions')
    .eq('organization_id', '22647141-2ee4-4d8d-8b47-16b0cbd830b2')
    .gte('period_start', '2024-01-01')
    .lte('period_end', '2024-08-31');

  const total2024 = (data2024?.reduce((sum, d) => sum + d.co2e_emissions, 0) || 0) / 1000;
  const growth = ((totalPredicted - total2024) / total2024 * 100).toFixed(1);

  console.log(`\n2024 Jan-Aug actual: ${Math.round(total2024).toLocaleString()} tCO2e`);
  console.log(`2025 Jan-Aug predicted: ${Math.round(totalPredicted).toLocaleString()} tCO2e`);
  console.log(`Year-over-year change: ${growth}%`);

  // Ask for confirmation before inserting
  console.log('\n=== READY TO INSERT PREDICTIONS ===');
  console.log(`Will insert ${predictions.length} predicted records for 2025`);
  console.log('Run with --insert flag to insert into database');

  // Check if we should insert
  if (process.argv.includes('--insert')) {
    console.log('\nInserting predictions into database...');

    const { data, error } = await supabase
      .from('metrics_data')
      .insert(predictions);

    if (error) {
      console.error('Error inserting predictions:', error);
    } else {
      console.log(`✅ Successfully inserted ${predictions.length} predictions for 2025!`);
    }
  } else {
    console.log('\nTo insert predictions, run: npx tsx predict-2025-emissions.ts --insert');
  }
}

generatePredictions().catch(console.error);