const { createClient } = require('@supabase/supabase-js');
const tf = require('@tensorflow/tfjs-node');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Models directory
const MODELS_DIR = path.join(__dirname, 'ml-models');

class EmissionsForecastModel {
  constructor() {
    this.model = null;
    this.scaler = { mean: 0, std: 1 };
    this.sequenceLength = 6; // Use 6 months of history to predict next month
  }

  async prepareData(organizationId) {
    console.log('📊 Loading emissions data...');

    // Fetch all metrics data
    const { data: metricsData, error } = await supabase
      .from('metrics_data')
      .select('period_start, co2e_emissions')
      .eq('organization_id', organizationId)
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

    // Convert to sorted array
    const sortedMonths = Object.keys(monthlyData).sort();
    const values = sortedMonths.map(month => monthlyData[month]);

    console.log(`   ✅ Loaded ${values.length} months of data`);
    console.log(`   Range: ${Math.min(...values).toFixed(2)} - ${Math.max(...values).toFixed(2)} tCO2e`);

    return { months: sortedMonths, values };
  }

  normalizeData(data) {
    // Calculate mean and standard deviation
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const std = Math.sqrt(variance);

    this.scaler = { mean, std: std || 1 };

    // Normalize
    return data.map(val => (val - mean) / (std || 1));
  }

  denormalize(value) {
    return value * this.scaler.std + this.scaler.mean;
  }

  createSequences(data, sequenceLength) {
    const sequences = [];
    const targets = [];

    for (let i = 0; i < data.length - sequenceLength; i++) {
      sequences.push(data.slice(i, i + sequenceLength));
      targets.push(data[i + sequenceLength]);
    }

    return { sequences, targets };
  }

  buildModel() {
    console.log('🏗️  Building LSTM model...');

    const model = tf.sequential();

    // Add LSTM layers with proper configuration
    model.add(tf.layers.lstm({
      units: 32,
      returnSequences: true,
      inputShape: [this.sequenceLength, 1],
      kernelInitializer: 'glorotUniform',
      recurrentInitializer: 'glorotUniform'
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.lstm({
      units: 16,
      returnSequences: false,
      kernelInitializer: 'glorotUniform',
      recurrentInitializer: 'glorotUniform'
    }));

    model.add(tf.layers.dropout({ rate: 0.2 }));

    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu',
      kernelInitializer: 'glorotUniform'
    }));

    model.add(tf.layers.dense({
      units: 1,
      kernelInitializer: 'glorotUniform'
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    console.log('   ✅ Model architecture created');

    try {
      model.summary();
    } catch (e) {
      console.log('   Model layers:', model.layers.length);
    }

    this.model = model;
    return model;
  }

  async train(organizationId) {
    console.log('\n🤖 Training Emissions Forecast Model\n');

    try {
      // Prepare data
      const { months, values } = await this.prepareData(organizationId);

      // Normalize data
      const normalizedData = this.normalizeData(values);

      // Create sequences
      const { sequences, targets } = this.createSequences(normalizedData, this.sequenceLength);

      if (sequences.length < 10) {
        console.log('   ⚠️  Not enough sequences for training');
        return false;
      }

      // Convert to tensors
      const xTrain = tf.tensor3d(sequences.map(seq => seq.map(val => [val])));
      const yTrain = tf.tensor2d(targets.map(val => [val]));

      // Build model
      this.buildModel();

      // Train model
      console.log('\n📈 Training model...');
      console.log(`   Training with ${sequences.length} sequences`);

      // Create custom callback
      const epochCallback = new tf.CustomCallback({
        onEpochEnd: async (epoch, logs) => {
          if (epoch % 10 === 0 || epoch === 49) {
            const loss = logs ? logs.loss : null;
            const valLoss = logs ? logs.val_loss : null;
            console.log(`   Epoch ${epoch + 1}: loss = ${loss ? loss.toFixed(4) : 'N/A'}, val_loss = ${valLoss ? valLoss.toFixed(4) : 'N/A'}`);
          }
        }
      });

      const history = await this.model.fit(xTrain, yTrain, {
        epochs: 50,
        batchSize: Math.min(16, sequences.length),
        validationSplit: 0.2,
        verbose: 0,
        shuffle: true,
        callbacks: [epochCallback]
      });

      // Clean up tensors
      xTrain.dispose();
      yTrain.dispose();

      console.log('   ✅ Model trained successfully!');

      // Save model
      await this.saveModel();

      // Test prediction
      await this.testPrediction(months, values);

      return true;

    } catch (error) {
      console.error('   ❌ Training error:', error.message);
      return false;
    }
  }

  async saveModel() {
    try {
      // Create models directory
      await fs.mkdir(MODELS_DIR, { recursive: true });

      // Save model
      const modelPath = path.join(MODELS_DIR, 'emissions-forecast-lstm');
      await this.model.save(`file://${modelPath}`);

      // Save scaler parameters
      const scalerPath = path.join(MODELS_DIR, 'emissions-forecast-lstm-scaler.json');
      await fs.writeFile(scalerPath, JSON.stringify(this.scaler, null, 2));

      console.log(`   ✅ Model saved to ${modelPath}`);
    } catch (error) {
      console.error('   ❌ Error saving model:', error.message);
    }
  }

  async testPrediction(months, values) {
    console.log('\n🔮 Testing prediction for next month...');

    // Use last 6 months to predict next
    const lastSequence = values.slice(-this.sequenceLength);
    const normalizedSequence = lastSequence.map(val =>
      (val - this.scaler.mean) / this.scaler.std
    );

    // Prepare input tensor
    const input = tf.tensor3d([normalizedSequence.map(val => [val])]);

    // Predict
    const prediction = this.model.predict(input);
    const normalizedValue = await prediction.data();
    const predictedValue = this.denormalize(normalizedValue[0]);

    // Clean up
    input.dispose();
    prediction.dispose();

    // Display results
    const lastMonth = months[months.length - 1];
    const [year, month] = lastMonth.split('-').map(Number);
    const nextMonth = month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;

    console.log(`   Last 3 months:`);
    for (let i = 3; i > 0; i--) {
      const idx = values.length - i;
      console.log(`      ${months[idx]}: ${values[idx].toFixed(2)} tCO2e`);
    }
    console.log(`   📊 Predicted for ${nextMonth}: ${predictedValue.toFixed(2)} tCO2e`);

    // Calculate trend
    const recentAvg = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const trend = ((predictedValue - recentAvg) / recentAvg) * 100;
    console.log(`   📈 Trend: ${trend > 0 ? '+' : ''}${trend.toFixed(1)}% vs 3-month average`);
  }

  async loadModel() {
    try {
      const modelPath = path.join(MODELS_DIR, 'emissions-forecast-lstm');
      this.model = await tf.loadLayersModel(`file://${modelPath}/model.json`);

      const scalerPath = path.join(MODELS_DIR, 'emissions-forecast-lstm-scaler.json');
      const scalerData = await fs.readFile(scalerPath, 'utf8');
      this.scaler = JSON.parse(scalerData);

      console.log('   ✅ Model loaded successfully');
      return true;
    } catch (error) {
      console.log('   ℹ️  No existing model found, will train new one');
      return false;
    }
  }
}

class AnomalyDetectionModel {
  constructor() {
    this.threshold = 2; // Z-score threshold for anomalies
    this.statistics = {};
  }

  async train(organizationId) {
    console.log('\n🔍 Training Anomaly Detection Model\n');

    try {
      // Fetch metrics data with categories
      const { data: metricsData, error } = await supabase
        .from('metrics_data')
        .select(`
          *,
          metrics_catalog!inner(
            name,
            category,
            scope
          )
        `)
        .eq('organization_id', organizationId)
        .not('co2e_emissions', 'is', null)
        .order('period_start', { ascending: true });

      if (error) throw error;

      // Group by metric category
      const categoryStats = {};

      metricsData.forEach(record => {
        const category = record.metrics_catalog?.category || 'Other';

        if (!categoryStats[category]) {
          categoryStats[category] = {
            values: [],
            mean: 0,
            std: 0,
            min: Infinity,
            max: -Infinity
          };
        }

        const value = record.co2e_emissions || 0;
        categoryStats[category].values.push(value);
        categoryStats[category].min = Math.min(categoryStats[category].min, value);
        categoryStats[category].max = Math.max(categoryStats[category].max, value);
      });

      // Calculate statistics for each category
      Object.keys(categoryStats).forEach(category => {
        const stats = categoryStats[category];
        const values = stats.values;

        // Calculate mean
        stats.mean = values.reduce((sum, val) => sum + val, 0) / values.length;

        // Calculate standard deviation
        const variance = values.reduce((sum, val) =>
          sum + Math.pow(val - stats.mean, 2), 0
        ) / values.length;
        stats.std = Math.sqrt(variance);

        // Remove values array to save space
        delete stats.values;

        console.log(`   ${category}:`);
        console.log(`      Mean: ${stats.mean.toFixed(2)} tCO2e`);
        console.log(`      Std Dev: ${stats.std.toFixed(2)}`);
        console.log(`      Range: ${stats.min.toFixed(2)} - ${stats.max.toFixed(2)}`);
      });

      this.statistics = categoryStats;

      // Save model
      await this.saveModel();

      console.log('\n   ✅ Anomaly detection model trained!');
      return true;

    } catch (error) {
      console.error('   ❌ Training error:', error.message);
      return false;
    }
  }

  async saveModel() {
    try {
      await fs.mkdir(MODELS_DIR, { recursive: true });
      const modelPath = path.join(MODELS_DIR, 'anomaly-detection.json');

      const modelData = {
        threshold: this.threshold,
        statistics: this.statistics,
        trainedAt: new Date().toISOString()
      };

      await fs.writeFile(modelPath, JSON.stringify(modelData, null, 2));
      console.log(`   ✅ Anomaly model saved`);
    } catch (error) {
      console.error('   ❌ Error saving model:', error.message);
    }
  }

  detectAnomalies(data) {
    const anomalies = [];

    data.forEach(record => {
      const category = record.category || 'Other';
      const stats = this.statistics[category];

      if (stats && stats.std > 0) {
        const zScore = Math.abs((record.value - stats.mean) / stats.std);

        if (zScore > this.threshold) {
          anomalies.push({
            ...record,
            zScore,
            expectedRange: {
              min: stats.mean - this.threshold * stats.std,
              max: stats.mean + this.threshold * stats.std
            },
            severity: zScore > 3 ? 'high' : 'medium'
          });
        }
      }
    });

    return anomalies;
  }
}

async function trainAllModels() {
  console.log('🚀 Starting ML Model Training\n');
  console.log('Organization: PLMJ');
  console.log('Organization ID: 22647141-2ee4-4d8d-8b47-16b0cbd830b2');
  console.log('=' .repeat(60));

  const organizationId = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';

  // Train emissions forecast model
  const forecastModel = new EmissionsForecastModel();
  const forecastSuccess = await forecastModel.train(organizationId);

  // Train anomaly detection model
  const anomalyModel = new AnomalyDetectionModel();
  const anomalySuccess = await anomalyModel.train(organizationId);

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Training Summary:\n');
  console.log(`   Emissions Forecast (LSTM): ${forecastSuccess ? '✅ Success' : '❌ Failed'}`);
  console.log(`   Anomaly Detection: ${anomalySuccess ? '✅ Success' : '❌ Failed'}`);

  if (forecastSuccess && anomalySuccess) {
    console.log('\n🎉 All models trained successfully!');
    console.log('   The ML prediction API should now work correctly.');
    console.log('\n📁 Models saved in:', MODELS_DIR);
  }
}

// Check if TensorFlow is installed
try {
  require.resolve('@tensorflow/tfjs-node');
  trainAllModels().catch(console.error);
} catch (error) {
  console.log('📦 Installing TensorFlow.js...');
  console.log('   Run: npm install @tensorflow/tfjs-node');
  console.log('   Then run this script again');
}