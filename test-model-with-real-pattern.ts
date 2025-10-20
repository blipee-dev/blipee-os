#!/usr/bin/env npx tsx

import { advancedForecastEngine } from './src/lib/ai/ml-models/advanced-forecast-engine';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testWithRealData() {
  console.log('🔬 TESTING ML MODEL WITH ACTUAL HISTORICAL DATA');
  console.log('=' .repeat(60));

  // Get actual monthly totals
  const { data } = await supabase
    .from('metrics_data')
    .select('period_start, co2e_emissions')
    .gte('period_start', '2022-01-01')
    .order('period_start', { ascending: true });

  // Aggregate by month
  const monthlyData = new Map<string, number>();
  data?.forEach(record => {
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + (record.co2e_emissions || 0));
  });

  const months = Array.from(monthlyData.keys()).sort();
  const emissions = months.map(m => (monthlyData.get(m) || 0) / 1000); // Convert to tons

  console.log('\n📊 Historical Data:');
  console.log(`  Months: ${emissions.length}`);
  console.log(`  Range: ${emissions[0].toFixed(1)} to ${Math.max(...emissions).toFixed(1)} tCO2e`);
  console.log(`  Mean: ${(emissions.reduce((a, b) => a + b) / emissions.length).toFixed(1)} tCO2e`);

  // Show the actual pattern
  console.log('\n📈 Actual Monthly Pattern:');
  const last12 = emissions.slice(-12);
  const last12Months = months.slice(-12);

  last12.forEach((val, i) => {
    if (i < 7) { // Only show available 2025 data
      const bar = '█'.repeat(Math.round(val / 5));
      console.log(`  ${last12Months[i]}: ${bar} ${val.toFixed(1)} tCO2e`);
    }
  });

  // Show the spike pattern
  const spikes = emissions.map((val, i) => ({ month: months[i], value: val }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  console.log('\n🔝 Historical Peaks (travel months):');
  spikes.forEach(s => {
    console.log(`  ${s.month}: ${s.value.toFixed(1)} tCO2e`);
  });

  // Test the model
  console.log('\n🤖 Running ML Prediction...');

  try {
    const result = await advancedForecastEngine.predict(
      emissions,
      {},
      12,
      new Date('2025-08-01')
    );

    console.log('\n✅ Prediction Results:');
    console.log(`  Models used: ${Object.keys(result.model_weights).join(', ')}`);
    console.log(`  Trend detected: ${result.trend.direction} (${result.trend.rate.toFixed(1)}%/year)`);

    console.log('\n📊 Predicted vs Historical Range:');
    const predictedValues = result.predictions.map(p => p.predicted);
    const predMin = Math.min(...predictedValues);
    const predMax = Math.max(...predictedValues);
    const predMean = predictedValues.reduce((a, b) => a + b) / predictedValues.length;

    console.log(`  Historical: ${Math.min(...emissions).toFixed(1)} - ${Math.max(...emissions).toFixed(1)} tCO2e`);
    console.log(`  Predicted:  ${predMin.toFixed(1)} - ${predMax.toFixed(1)} tCO2e`);
    console.log(`  Historical mean: ${(emissions.reduce((a, b) => a + b) / emissions.length).toFixed(1)} tCO2e`);
    console.log(`  Predicted mean:  ${predMean.toFixed(1)} tCO2e`);

    // Check if it's capturing the pattern
    const variation = ((predMax - predMin) / predMin) * 100;
    console.log(`\n  Prediction variation: ${variation.toFixed(1)}%`);

    if (variation < 50) {
      console.log('  ⚠️ Model is producing too smooth predictions');
      console.log('  ⚠️ Not capturing the 3x travel spikes seen in history');
    }

    // Show predictions
    console.log('\n🔮 Next 12 Months Forecast:');
    result.predictions.slice(0, 6).forEach(p => {
      const bar = '█'.repeat(Math.round(p.predicted / 5));
      console.log(`  ${p.month} ${p.year}: ${bar} ${p.predicted.toFixed(1)} tCO2e`);
    });

    // Analyze why it might not be learning the pattern
    console.log('\n🔍 Pattern Learning Analysis:');

    // Check if ARIMA is picking up seasonality
    const arimaWeight = result.model_weights['ARIMA'] || 0;
    console.log(`  ARIMA weight: ${(arimaWeight * 100).toFixed(0)}%`);

    // Check if we have enough peak months for pattern detection
    const highMonths = emissions.filter(e => e > 80).length;
    const lowMonths = emissions.filter(e => e < 40).length;
    console.log(`  High emission months (>80): ${highMonths}`);
    console.log(`  Low emission months (<40): ${lowMonths}`);

    if (highMonths < 3) {
      console.log('  ⚠️ Not enough high-emission months for robust pattern learning');
    }

    // Check variance in data
    const std = Math.sqrt(emissions.reduce((sum, e) => {
      const diff = e - (emissions.reduce((a, b) => a + b) / emissions.length);
      return sum + diff * diff;
    }, 0) / emissions.length);
    const cv = std / (emissions.reduce((a, b) => a + b) / emissions.length) * 100;
    console.log(`  Coefficient of variation: ${cv.toFixed(1)}%`);

    if (cv > 50) {
      console.log('  ⚠️ Very high variance - model may be smoothing to avoid overfitting');
    }

  } catch (error) {
    console.error('❌ Prediction failed:', error);
  }
}

testWithRealData().catch(console.error);