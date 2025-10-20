#!/usr/bin/env npx tsx

/**
 * Test Advanced Forecast Engine
 */

import { advancedForecastEngine } from './src/lib/ai/ml-models/advanced-forecast-engine';

async function testEngine() {
  console.log('🧪 Testing Advanced Forecast Engine');
  console.log('=' .repeat(50));

  // Sample data - 43 months of emissions (realistic values already in TONS not kg)
  const historicalData = [
    25, 27, 28, 26, 24, 23, 22, 24, 26, 28, 29, 30, // 2022
    28, 30, 31, 29, 27, 26, 25, 27, 29, 31, 32, 33, // 2023
    31, 33, 34, 32, 30, 29, 28, 30, 32, 34, 35, 36, // 2024
    34, 36, 37, 35, 33, 32, 31 // 2025 (partial)
  ];

  try {
    console.log('\n📊 Historical data:');
    console.log(`  Months: ${historicalData.length}`);
    console.log(`  Mean: ${(historicalData.reduce((a, b) => a + b) / historicalData.length).toFixed(1)} tCO2e`);
    console.log(`  Min: ${Math.min(...historicalData)} tCO2e`);
    console.log(`  Max: ${Math.max(...historicalData)} tCO2e`);

    console.log('\n🔮 Making prediction...');
    const prediction = await advancedForecastEngine.predict(historicalData, {}, 12);

    console.log('\n✅ Prediction successful!');
    console.log('\n📈 Results:');
    console.log(`  Models used: ${Object.keys(prediction.model_weights).join(', ')}`);
    console.log(`  Best model: ${prediction.best_model}`);
    console.log(`  Trend: ${prediction.trend.direction} (${prediction.trend.rate.toFixed(1)}%/year)`);

    console.log('\n🎯 Next 12 months forecast:');
    prediction.predictions.forEach(p => {
      console.log(`  ${p.month} ${p.year}: ${(p.predicted / 1000).toFixed(1)} tCO2e (conf: ${(p.confidence * 100).toFixed(0)}%)`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

testEngine().catch(console.error);