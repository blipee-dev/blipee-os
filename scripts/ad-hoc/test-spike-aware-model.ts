#!/usr/bin/env npx tsx

import { spikeAwareForecast } from './src/lib/ai/ml-models/spike-aware-forecast';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testSpikeAwareModel() {
  console.log('🎯 TESTING SPIKE-AWARE FORECASTING MODEL');
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

  console.log('\n📊 Historical Data Summary:');
  console.log(`  Data points: ${emissions.length}`);
  console.log(`  Range: ${Math.min(...emissions).toFixed(1)} - ${Math.max(...emissions).toFixed(1)} tCO2e`);

  // Calculate variance statistics
  const mean = emissions.reduce((sum, val) => sum + val, 0) / emissions.length;
  const variance = emissions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / emissions.length;
  const coefficientOfVariation = Math.sqrt(variance) / mean;

  console.log(`  Mean: ${mean.toFixed(1)} tCO2e`);
  console.log(`  Coefficient of Variation: ${(coefficientOfVariation * 100).toFixed(1)}%`);

  if (coefficientOfVariation > 0.4) {
    console.log('  ✅ High variance detected - perfect for spike-aware model!');
  } else {
    console.log('  ❌ Low variance - spike-aware model may not add value');
  }

  // Show recent high/low pattern
  console.log('\n📈 Recent Pattern (2024-2025):');
  const recentData = emissions.slice(-12);
  const recentMonths = months.slice(-12);

  recentData.forEach((val, i) => {
    const bar = '█'.repeat(Math.round(val / 8));
    const isHigh = val > mean + Math.sqrt(variance);
    const marker = isHigh ? ' 🚀' : '';
    console.log(`  ${recentMonths[i]}: ${bar} ${val.toFixed(1)} tCO2e${marker}`);
  });

  // Test the spike-aware model
  console.log('\n🤖 Testing Spike-Aware Model...');

  try {
    const startDate = new Date('2025-08-01');
    const result = await spikeAwareForecast.predict(emissions, 12, startDate);

    console.log('\n✅ Spike-Aware Results:');
    console.log(`  Model: ${result.best_model}`);
    console.log(`  Expected spikes: ${result.spike_info.expected_spikes}`);
    console.log(`  Spike months: ${result.spike_info.spike_months.join(', ')}`);
    console.log(`  Average spike magnitude: ${result.spike_info.avg_spike_magnitude.toFixed(1)} tCO2e`);
    console.log(`  Trend: ${result.trend.direction} (${result.trend.rate.toFixed(1)}% change)`);

    console.log('\n🔮 Spike-Aware Predictions:');
    result.predictions.slice(0, 6).forEach((p: any) => {
      const bar = '█'.repeat(Math.round(p.predicted / 8));
      const spikeMarker = p.spike_predicted ? ' 🚀' : '';
      const confidence = (p.confidence * 100).toFixed(0);
      console.log(`  ${p.month} ${p.year}: ${bar} ${p.predicted.toFixed(1)} tCO2e (${confidence}% conf)${spikeMarker}`);
    });

    // Compare with historical spikes
    const predictedValues = result.predictions.map((p: any) => p.predicted);
    const predMax = Math.max(...predictedValues);
    const predMin = Math.min(...predictedValues);
    const predRange = ((predMax - predMin) / predMin) * 100;

    const histMax = Math.max(...emissions);
    const histMin = Math.min(...emissions);
    const histRange = ((histMax - histMin) / histMin) * 100;

    console.log('\n📊 Range Comparison:');
    console.log(`  Historical range: ${histRange.toFixed(1)}% (${histMin.toFixed(1)} - ${histMax.toFixed(1)} tCO2e)`);
    console.log(`  Predicted range:  ${predRange.toFixed(1)}% (${predMin.toFixed(1)} - ${predMax.toFixed(1)} tCO2e)`);

    if (predRange > histRange * 0.5) {
      console.log('  ✅ Model captures significant variation!');
    } else {
      console.log('  ⚠️ Model predictions are too smooth');
    }

    // Check if spikes are in expected months (Apr, Sep, Oct based on history)
    const spikeMonths = result.predictions
      .filter((p: any) => p.spike_predicted)
      .map((p: any) => p.month);

    const expectedSpikeMonths = ['Apr', 'Sep', 'Oct'];
    const correctSpikes = spikeMonths.filter((month: string) => expectedSpikeMonths.includes(month));

    console.log('\n🎯 Spike Prediction Accuracy:');
    console.log(`  Predicted spike months: ${spikeMonths.join(', ')}`);
    console.log(`  Expected spike months: ${expectedSpikeMonths.join(', ')}`);
    console.log(`  Correct predictions: ${correctSpikes.length}/${expectedSpikeMonths.length}`);

  } catch (error) {
    console.error('❌ Spike-aware model failed:', error);
  }
}

testSpikeAwareModel().catch(console.error);