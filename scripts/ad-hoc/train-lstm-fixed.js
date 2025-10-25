// Patch TensorFlow.js for Node.js v24 compatibility
require('./patch-tensorflow');

const { createClient } = require('@supabase/supabase-js');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const MODELS_DIR = path.join(__dirname, 'ml-models');
const ORG_ID = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

async function trainLSTM() {
  console.log('🚀 LSTM Training - Fixed Version\n');

  try {
    // 1. Load and prepare data
    console.log('📊 Loading emissions data...');
    const { data: metricsData, error } = await supabase
      .from('metrics_data')
      .select('period_start, co2e_emissions')
      .eq('organization_id', ORG_ID)
      .not('co2e_emissions', 'is', null)
      .order('period_start', { ascending: true });

    if (error) throw error;

    // Aggregate by month
    const monthlyData = {};
    metricsData.forEach(record => {
      const date = new Date(record.period_start);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += record.co2e_emissions || 0;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const values = sortedMonths.map(month => monthlyData[month]);

    console.log(`   ✅ Loaded ${values.length} months of data`);

    // 2. Normalize data
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance) || 1;

    const normalizedValues = values.map(val => (val - mean) / std);

    // 3. Create sequences
    const sequenceLength = 6;
    const sequences = [];
    const targets = [];

    for (let i = 0; i < normalizedValues.length - sequenceLength; i++) {
      sequences.push(normalizedValues.slice(i, i + sequenceLength));
      targets.push(normalizedValues[i + sequenceLength]);
    }

    console.log(`   Created ${sequences.length} training sequences`);

    // 4. Convert to tensors
    const xTrain = tf.tensor3d(sequences.map(seq => seq.map(val => [val])));
    const yTrain = tf.tensor2d(targets.map(val => [val]));

    console.log(`   Tensor shapes - X: [${xTrain.shape}], Y: [${yTrain.shape}]`);

    // 5. Build simple LSTM model
    console.log('\n🏗️  Building LSTM model...');

    const model = tf.sequential();

    // Single LSTM layer
    model.add(tf.layers.lstm({
      units: 20,
      inputShape: [sequenceLength, 1],
      returnSequences: false
    }));

    // Output layer
    model.add(tf.layers.dense({
      units: 1
    }));

    // Compile
    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });

    console.log('   ✅ Model created');

    // 6. Train without callbacks to avoid the bug
    console.log('\n📈 Training model (50 epochs)...');

    const history = await model.fit(xTrain, yTrain, {
      epochs: 50,
      batchSize: 8,
      validationSplit: 0.2,
      verbose: 1  // Show progress
    });

    console.log('   ✅ Training complete!');

    // 7. Save model and parameters
    await fs.mkdir(MODELS_DIR, { recursive: true });

    const modelPath = path.join(MODELS_DIR, 'emissions-forecast-lstm');
    await model.save(`file://${modelPath}`);

    const scalerPath = path.join(MODELS_DIR, 'emissions-forecast-lstm-scaler.json');
    await fs.writeFile(scalerPath, JSON.stringify({ mean, std }, null, 2));

    console.log(`\n✅ Model saved to ${modelPath}`);

    // 8. Test prediction
    console.log('\n🔮 Testing prediction...');

    const lastSequence = normalizedValues.slice(-sequenceLength);
    const testInput = tf.tensor3d([lastSequence.map(val => [val])]);
    const prediction = model.predict(testInput);
    const normalizedPred = await prediction.data();
    const predictedValue = normalizedPred[0] * std + mean;

    console.log(`   Last value: ${values[values.length - 1].toFixed(2)} tCO2e`);
    console.log(`   Predicted next: ${predictedValue.toFixed(2)} tCO2e`);

    // Clean up
    xTrain.dispose();
    yTrain.dispose();
    testInput.dispose();
    prediction.dispose();

    console.log('\n🎉 LSTM model successfully trained and saved!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

trainLSTM();