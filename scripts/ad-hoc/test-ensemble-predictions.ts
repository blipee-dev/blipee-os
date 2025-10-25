#!/usr/bin/env npx tsx

/**
 * Test script for validating ensemble ML predictions
 * Tests all 5 models: ARIMA, LSTM, Gradient Boosting, STL-ETS, Holt-Winters
 */

import { AdvancedForecastEngine } from './src/lib/ai/ml-models/advanced-forecast-engine';

async function testEnsemblePredictions() {
  console.log('🚀 Testing Advanced Ensemble ML Predictions\n');
  console.log('=' .repeat(60));

  const engine = new AdvancedForecastEngine();

  // Test Case 1: Seasonal Pattern with Upward Trend
  console.log('\n📊 Test 1: Seasonal Pattern with Upward Trend');
  console.log('-'.repeat(40));

  const seasonalData = generateSeasonalData(24, 100, 0.02, 20);
  console.log(`Input: 24 months of seasonal data`);
  console.log(`Base: 100 tCO2e, Growth: 2%/month, Amplitude: ±20%`);

  try {
    const result1 = await engine.predict(seasonalData, {
      energyConsumption: 1000,
      productionVolume: 100,
      temperature: 20,
      employeeCount: 50
    }, 12);

    displayResults('Seasonal Pattern', result1);
  } catch (error) {
    console.error('❌ Test 1 failed:', error);
  }

  // Test Case 2: Volatile Data with Sudden Changes
  console.log('\n📊 Test 2: Volatile Data with Sudden Changes');
  console.log('-'.repeat(40));

  const volatileData = generateVolatileData(36);
  console.log(`Input: 36 months of volatile data`);
  console.log(`Random fluctuations: ±50%`);

  try {
    const result2 = await engine.predict(volatileData, {
      energyConsumption: 800,
      productionVolume: 120,
      temperature: 25,
      employeeCount: 45
    }, 12);

    displayResults('Volatile Data', result2);
  } catch (error) {
    console.error('❌ Test 2 failed:', error);
  }

  // Test Case 3: Real-world Pattern (office building)
  console.log('\n📊 Test 3: Real-world Office Building Pattern');
  console.log('-'.repeat(40));

  const officeData = generateOfficePattern(24);
  console.log(`Input: 24 months of office emissions`);
  console.log(`Summer low (vacation), Winter high (heating)`);

  try {
    const result3 = await engine.predict(officeData, {
      energyConsumption: 1500,
      productionVolume: 100,
      temperature: 18,
      employeeCount: 75
    }, 12);

    displayResults('Office Building', result3);
  } catch (error) {
    console.error('❌ Test 3 failed:', error);
  }

  // Test Case 4: Manufacturing Pattern (with shutdowns)
  console.log('\n📊 Test 4: Manufacturing with Periodic Shutdowns');
  console.log('-'.repeat(40));

  const manufacturingData = generateManufacturingPattern(30);
  console.log(`Input: 30 months of manufacturing data`);
  console.log(`Quarterly maintenance shutdowns`);

  try {
    const result4 = await engine.predict(manufacturingData, {
      energyConsumption: 5000,
      productionVolume: 500,
      temperature: 22,
      employeeCount: 200
    }, 12);

    displayResults('Manufacturing', result4);
  } catch (error) {
    console.error('❌ Test 4 failed:', error);
  }

  // Test Case 5: Minimal Data (edge case)
  console.log('\n📊 Test 5: Minimal Data (Edge Case)');
  console.log('-'.repeat(40));

  const minimalData = [80, 85, 82, 88, 90, 87];
  console.log(`Input: Only 6 months of data`);

  try {
    const result5 = await engine.predict(minimalData, undefined, 12);
    displayResults('Minimal Data', result5);
  } catch (error) {
    console.error('❌ Test 5 failed:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Ensemble Prediction Testing Complete!\n');
}

function displayResults(testName: string, result: any) {
  console.log(`\n✨ ${testName} Results:`);

  // Show model performance
  console.log('\n📈 Model Performance:');
  if (result.model_weights) {
    Object.entries(result.model_weights).forEach(([model, weight]) => {
      const percentage = ((weight as number) * 100).toFixed(1);
      const bar = '█'.repeat(Math.floor((weight as number) * 20));
      console.log(`  ${model.padEnd(20)} ${bar} ${percentage}%`);
    });
  }

  // Show best model
  console.log(`\n🏆 Best Model: ${result.best_model || 'Unknown'}`);

  // Calculate overall confidence and agreement from predictions
  let avgConfidence = 0;
  let avgAgreement = 0;
  if (result.predictions && result.predictions.length > 0) {
    avgConfidence = result.predictions.reduce((sum: number, p: any) => sum + (p.confidence || 0), 0) / result.predictions.length;
    avgAgreement = result.predictions.filter((p: any) => p.models_agree).length / result.predictions.length;
  }

  console.log(`📊 Overall Confidence: ${(avgConfidence * 100).toFixed(1)}%`);
  console.log(`🤝 Model Agreement: ${(avgAgreement * 100).toFixed(1)}%`);

  // Show predictions summary
  if (result.predictions && result.predictions.length > 0) {
    console.log('\n📅 Forecast Summary:');
    console.log(`  Next Month: ${result.predictions[0].predicted.toFixed(1)} tCO2e`);
    console.log(`  3-Month Avg: ${calculateAverage(result.predictions.slice(0, 3))} tCO2e`);
    console.log(`  6-Month Avg: ${calculateAverage(result.predictions.slice(0, 6))} tCO2e`);
    console.log(`  12-Month Avg: ${calculateAverage(result.predictions)} tCO2e`);

    // Show trend
    const firstValue = result.predictions[0].predicted;
    const lastValue = result.predictions[result.predictions.length - 1].predicted;
    const change = ((lastValue - firstValue) / firstValue * 100).toFixed(1);
    console.log(`  12-Month Trend: ${change > 0 ? '+' : ''}${change}%`);
  }

  // Show recommendations
  if (result.recommendations && result.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    result.recommendations.slice(0, 3).forEach((rec: string) => {
      console.log(`  • ${rec}`);
    });
  }
}

function calculateAverage(predictions: any[]): string {
  const sum = predictions.reduce((acc, p) => acc + p.predicted, 0);
  return (sum / predictions.length).toFixed(1);
}

// Generate test data patterns
function generateSeasonalData(months: number, base: number, trend: number, seasonalAmplitude: number): number[] {
  const data: number[] = [];
  for (let i = 0; i < months; i++) {
    const trendComponent = base * Math.pow(1 + trend, i);
    const seasonalComponent = Math.sin(2 * Math.PI * i / 12) * seasonalAmplitude;
    const noise = (Math.random() - 0.5) * 10;
    data.push(trendComponent + seasonalComponent + noise);
  }
  return data;
}

function generateVolatileData(months: number): number[] {
  const data: number[] = [];
  let current = 100;
  for (let i = 0; i < months; i++) {
    const change = (Math.random() - 0.5) * 50;
    current = Math.max(50, Math.min(150, current + change));
    data.push(current);
  }
  return data;
}

function generateOfficePattern(months: number): number[] {
  const data: number[] = [];
  for (let i = 0; i < months; i++) {
    const month = i % 12;
    let base = 100;

    // Summer months (June, July, August) - lower due to vacation
    if (month >= 5 && month <= 7) {
      base *= 0.7;
    }
    // Winter months (December, January, February) - higher due to heating
    else if (month === 11 || month <= 1) {
      base *= 1.3;
    }

    const noise = (Math.random() - 0.5) * 15;
    data.push(base + noise);
  }
  return data;
}

function generateManufacturingPattern(months: number): number[] {
  const data: number[] = [];
  for (let i = 0; i < months; i++) {
    let base = 200;

    // Quarterly shutdowns (every 3rd month)
    if (i % 3 === 2) {
      base *= 0.3; // Production shutdown
    }

    // Gradual efficiency improvement over time
    base *= Math.pow(0.98, i / 12);

    const noise = (Math.random() - 0.5) * 20;
    data.push(base + noise);
  }
  return data;
}

// Run tests
testEnsemblePredictions().catch(console.error);