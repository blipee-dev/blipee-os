#!/usr/bin/env npx tsx

/**
 * Simple Model Training Script
 * Train ML models and keep them in memory
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { modelManager } from './src/lib/ai/ml-models/model-manager';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function trainModels() {
  console.log('🚀 TRAINING ML MODELS');
  console.log('=' .repeat(50));

  try {
    // Check current model state
    const currentState = modelManager.getModelState();
    if (currentState.trained) {
      console.log('⚠️  Models already trained!');
      console.log(`  Last training: ${currentState.lastTrainingDate}`);
      console.log(`  Data points: ${currentState.dataPoints}`);
      console.log(`  Mean: ${currentState.meanValue.toFixed(1)} tCO2e`);
      console.log();
      console.log('To retrain, run: npm run train:force');
      return;
    }

    // Fetch historical data
    console.log('\n📊 Fetching historical data...');
    const { data: metricsData, error } = await supabase
      .from('metrics_data')
      .select('*')
      .gte('period_start', '2022-01-01')
      .order('period_start', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch data: ${error.message}`);
    }

    // Aggregate by month
    const monthlyEmissions = new Map<string, number>();

    metricsData?.forEach(record => {
      const date = new Date(record.period_start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyEmissions.set(monthKey, (monthlyEmissions.get(monthKey) || 0) + (record.co2e_emissions || 0));
    });

    const months = Array.from(monthlyEmissions.keys()).sort();
    const emissions = months.map(m => monthlyEmissions.get(m) || 0);

    console.log(`✅ Loaded ${emissions.length} months of data`);
    console.log(`  Period: ${months[0]} to ${months[months.length - 1]}`);
    console.log(`  Total records: ${metricsData?.length}`);

    // Train models
    console.log('\n🧠 Training models...');
    await modelManager.trainModels(emissions);

    // Verify training
    const newState = modelManager.getModelState();
    console.log('\n✅ TRAINING COMPLETE!');
    console.log('=' .repeat(50));
    console.log('📊 Model Statistics:');
    console.log(`  Data points: ${newState.dataPoints}`);
    console.log(`  Mean emissions: ${newState.meanValue.toFixed(1)} tCO2e`);
    console.log(`  Std deviation: ${newState.stdValue.toFixed(1)} tCO2e`);
    console.log(`  Trained at: ${newState.lastTrainingDate?.toISOString()}`);
    console.log();
    console.log('🎯 Models are now ready for predictions!');

  } catch (error) {
    console.error('\n❌ Training failed:', error);
    process.exit(1);
  }
}

// Add force retrain option
const forceRetrain = process.argv.includes('--force');
if (forceRetrain) {
  console.log('🔄 Force retraining enabled - clearing existing models...');
  modelManager.clearModels();
}

// Run training
trainModels().catch(console.error);