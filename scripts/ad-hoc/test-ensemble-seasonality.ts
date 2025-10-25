#!/usr/bin/env npx tsx

import { advancedForecastEngine } from './src/lib/ai/ml-models/advanced-forecast-engine';

async function test() {
  const testData = [
    26.3, 29.0, 35.1, 32.2, 21.3, 23.5, 25.7, 28.1,  // 2022
    30.4, 33.2, 36.1, 39.0, 42.1, 45.3, 48.7, 52.2,  // 2023
    55.8, 59.5, 63.4, 67.4, 71.5, 75.8, 80.2, 84.7,  // 2024
    89.3, 38.0, 116.6, 85.5, 51.7, 35.8, 36.9        // 2025 (7 months)
  ];

  // Add strong seasonality pattern
  const seasonalData = testData.map((val, i) => {
    const month = i % 12;
    // Strong seasonal pattern: low in summer, high in winter
    const seasonal = Math.cos(2 * Math.PI * month / 12) * 15;
    return Math.max(5, val + seasonal);
  });

  console.log('🧪 Testing Advanced Forecast Engine with Seasonal Data');
  console.log('=' .repeat(60));
  console.log('📊 Input data:');
  console.log(`  Months: ${seasonalData.length}`);
  console.log(`  Mean: ${(seasonalData.reduce((a, b) => a + b) / seasonalData.length).toFixed(1)} tons`);
  console.log(`  Min: ${Math.min(...seasonalData).toFixed(1)} tons`);
  console.log(`  Max: ${Math.max(...seasonalData).toFixed(1)} tons`);

  // Show last 12 months to see pattern
  console.log('\n📅 Last 12 months (to see seasonality):');
  const last12 = seasonalData.slice(-12);
  const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  last12.forEach((val, i) => {
    if (i < 7) { // Only have 7 months in 2025
      console.log(`  ${months[i + 5]} 2025: ${val.toFixed(1)} tons`);
    }
  });

  try {
    console.log('\n🔮 Running ensemble prediction...');
    const result = await advancedForecastEngine.predict(
      seasonalData,
      {},
      12,
      new Date('2025-08-01')
    );

    console.log('\n✅ Success!');
    console.log(`  Models used: ${Object.keys(result.model_weights).join(', ')}`);
    console.log(`  Best model: ${result.best_model}`);
    console.log(`  Trend: ${result.trend.direction} (${result.trend.rate.toFixed(1)}%/year)`);

    console.log('\n🎯 Predictions for next 12 months:');
    result.predictions.forEach(p => {
      console.log(`  ${p.month} ${p.year}: ${p.predicted.toFixed(1)} tons`);
    });

    // Check for seasonality in predictions
    const predValues = result.predictions.map(p => p.predicted);
    const maxPred = Math.max(...predValues);
    const minPred = Math.min(...predValues);
    const variation = ((maxPred - minPred) / minPred) * 100;

    console.log('\n📊 Prediction Analysis:');
    console.log(`  Max: ${maxPred.toFixed(1)} tons`);
    console.log(`  Min: ${minPred.toFixed(1)} tons`);
    console.log(`  Variation: ${variation.toFixed(1)}%`);

    if (variation < 10) {
      console.log('  ⚠️ Warning: Predictions appear too linear (< 10% variation)');
    } else {
      console.log('  ✅ Good: Predictions show seasonal variation');
    }

  } catch (error) {
    console.error('\n❌ Ensemble failed:', error);
    console.log('\nThis means the system would fall back to simple LSTM');
    console.log('which produces linear predictions without seasonality.');
  }
}

test().catch(console.error);