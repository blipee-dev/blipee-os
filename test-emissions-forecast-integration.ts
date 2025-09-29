#!/usr/bin/env npx tsx

import { emissionsForecastModel } from './src/lib/ai/ml-models/emissions-forecast-model';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testEmissionsForecastIntegration() {
  console.log('🧪 TESTING EMISSIONS FORECAST MODEL INTEGRATION');
  console.log('=' .repeat(70));

  // Get actual monthly totals (same as the working test)
  const { data } = await supabase
    .from('metrics_data')
    .select('period_start, co2e_emissions')
    .gte('period_start', '2022-01-01')
    .order('period_start', { ascending: true });

  // Aggregate by month (total emissions)
  const monthlyData = new Map<string, number>();
  data?.forEach(record => {
    const date = new Date(record.period_start);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData.set(monthKey, (monthlyData.get(monthKey) || 0) + (record.co2e_emissions || 0));
  });

  const months = Array.from(monthlyData.keys()).sort();
  const totalEmissionsKg = months.map(m => monthlyData.get(m) || 0);

  // For the model, we need to split into scopes - use historical ratios
  // Based on the travel analysis: roughly 22% scope1, 16% scope2, 62% scope3
  const scope1Data = totalEmissionsKg.map(total => total * 0.22);
  const scope2Data = totalEmissionsKg.map(total => total * 0.16);
  const scope3Data = totalEmissionsKg.map(total => total * 0.62);

  console.log('\n📊 Data Summary:');
  console.log(`  Months: ${months.length}`);
  console.log(`  Latest month: ${months[months.length - 1]}`);

  console.log(`  Total range: ${(Math.min(...totalEmissionsKg) / 1000).toFixed(1)} - ${(Math.max(...totalEmissionsKg) / 1000).toFixed(1)} tCO2e`);

  // Calculate variance to predict model behavior
  const mean = totalEmissionsKg.reduce((sum, val) => sum + val, 0) / totalEmissionsKg.length;
  const variance = totalEmissionsKg.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / totalEmissionsKg.length;
  const coefficientOfVariation = Math.sqrt(variance) / mean;

  console.log(`  Mean: ${(mean / 1000).toFixed(1)} tCO2e`);
  console.log(`  Coefficient of Variation: ${(coefficientOfVariation * 100).toFixed(1)}%`);

  if (coefficientOfVariation > 0.4) {
    console.log('  ✅ High variance - should trigger spike-aware model');
  } else {
    console.log('  ❌ Low variance - will use regular ensemble');
  }

  // Prepare input for emissions forecast model
  const input = {
    historicalEmissions: {
      scope1: scope1Data, // in kg
      scope2: scope2Data, // in kg
      scope3: scope3Data  // in kg
    },
    activityData: {
      energyConsumption: 50000,
      fuelConsumption: 1000,
      productionVolume: 1000,
      transportationKm: 10000,
      employeeCount: 50
    },
    externalFactors: {
      gridEmissionFactor: 400,
      fuelEmissionFactor: 2500,
      seasonality: 'winter' as const,
      regulatoryChanges: false
    },
    metadata: {
      industry: 'Legal Services',
      region: 'EU',
      reportingPeriod: 'monthly' as const
    }
  };

  console.log('\n🤖 Running Emissions Forecast Model...');

  try {
    const prediction = await emissionsForecastModel.predict(input);

    console.log('\n✅ Prediction Results:');
    console.log(`  Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
    console.log(`  Trend: ${prediction.trends.direction} (${prediction.trends.rate.toFixed(1)}%/year)`);

    if (prediction.predictions && prediction.predictions.length > 0) {
      console.log(`  Model used: ${prediction.predictions[0].best_model || 'Unknown'}`);

      // Check if spike-aware was used
      const usedSpikeAware = prediction.trends.drivers.some(driver =>
        driver.includes('Spike-Aware') || driver.includes('spike')
      );

      if (usedSpikeAware) {
        console.log('  🎯 ✅ Spike-aware model was used!');
      } else {
        console.log('  ⚠️ Regular ensemble model was used');
      }
    }

    // Show first 6 predictions
    console.log('\n🔮 Next 6 Months Forecast:');
    const predictionArray = prediction.predictions || prediction.prediction;

    if (Array.isArray(predictionArray)) {
      predictionArray.slice(0, 6).forEach((p: any, i: number) => {
        const value = typeof p === 'object' ? p.predicted : p;
        const month = new Date(2025, 7 + i).toLocaleDateString('en', { month: 'short', year: 'numeric' });
        const bar = '█'.repeat(Math.round(value / 10));
        console.log(`  ${month}: ${bar} ${value.toFixed(1)} tCO2e`);
      });
    }

    // Analyze prediction variance
    const values = Array.isArray(predictionArray) ?
      predictionArray.map((p: any) => typeof p === 'object' ? p.predicted : p) :
      [predictionArray];

    if (values.length > 1) {
      const predMin = Math.min(...values);
      const predMax = Math.max(...values);
      const predVariation = ((predMax - predMin) / predMin) * 100;

      console.log('\n📊 Prediction Analysis:');
      console.log(`  Range: ${predMin.toFixed(1)} - ${predMax.toFixed(1)} tCO2e`);
      console.log(`  Variation: ${predVariation.toFixed(1)}%`);

      if (predVariation > 100) {
        console.log('  ✅ Model captures significant variation (likely spike-aware)');
      } else {
        console.log('  ⚠️ Model predictions are smooth (likely regular ensemble)');
      }
    }

  } catch (error) {
    console.error('❌ Prediction failed:', error);
  }
}

testEmissionsForecastIntegration().catch(console.error);