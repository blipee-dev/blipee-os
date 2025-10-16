/**
 * LSTM Predictor for Time Series Analysis
 * Real machine learning implementation for predictions
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import * as tf from '@tensorflow/tfjs';

export interface PredictionResult {
  predictions: number[];
  confidence: number;
  model: string;
  timestamp: Date;
  metadata?: any;
}

export interface TrainingData {
  input: number[][];
  output: number[];
  timestamps: Date[];
}

export class LSTMPredictor {
  private model: tf.LayersModel | null = null;
  private readonly sequenceLength = 24; // 24 hours of data
  private readonly features = 5; // temperature, consumption, cost, demand, efficiency
  private readonly epochs = 50;
  private readonly batchSize = 32;
  private modelPath: string;

  constructor(private organizationId: string, private modelType: 'energy' | 'emissions' | 'maintenance') {
    this.modelPath = `/models/${organizationId}/${modelType}_lstm.json`;
  }

  /**
   * Build LSTM model architecture
   */
  private buildModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 64,
          returnSequences: true,
          inputShape: [this.sequenceLength, this.features]
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({
          units: 32,
          returnSequences: false
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: 1 })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });

    return model;
  }

  /**
   * Train the model with real data
   */
  async train(data: TrainingData): Promise<void> {
    try {
      // Prepare training data
      const { xTrain, yTrain, xVal, yVal } = await this.prepareData(data);

      // Build or load model
      if (!this.model) {
        this.model = this.buildModel();
      }

      // Train model
      const history = await this.model.fit(xTrain, yTrain, {
        epochs: this.epochs,
        batchSize: this.batchSize,
        validationData: [xVal, yVal],
        callbacks: {
          onEpochEnd: async (epoch, logs) => {

            // Store training metrics
            await supabaseAdmin
              .from('ml_training_logs')
              .insert({
                organization_id: this.organizationId,
                model_type: this.modelType,
                epoch,
                loss: logs?.loss,
                val_loss: logs?.val_loss,
                mae: logs?.mae,
                val_mae: logs?.val_mae,
                timestamp: new Date().toISOString()
              });
          }
        }
      });

      // Save model
      await this.saveModel();

      // Store model metadata
      await supabaseAdmin
        .from('ml_models')
        .insert({
          organization_id: this.organizationId,
          model_type: this.modelType,
          architecture: 'lstm',
          parameters: {
            sequenceLength: this.sequenceLength,
            features: this.features,
            epochs: this.epochs
          },
          performance: {
            finalLoss: history.history.loss[history.history.loss.length - 1],
            finalValLoss: history.history.val_loss[history.history.val_loss.length - 1]
          },
          trained_at: new Date().toISOString()
        });

      // Clean up tensors
      xTrain.dispose();
      yTrain.dispose();
      xVal.dispose();
      yVal.dispose();

    } catch (error) {
      console.error('Training error:', error);
      throw error;
    }
  }

  /**
   * Make predictions using the trained model
   */
  async predict(inputData: number[][], steps: number = 24): Promise<PredictionResult> {
    try {
      // Load model if not loaded
      if (!this.model) {
        await this.loadModel();
      }

      if (!this.model) {
        throw new Error('Model not available');
      }

      // Prepare input tensor
      const inputTensor = tf.tensor3d([inputData]);
      const predictions: number[] = [];
      let currentInput = inputData;

      // Generate predictions for each step
      for (let i = 0; i < steps; i++) {
        const stepInput = tf.tensor3d([currentInput]);
        const prediction = this.model.predict(stepInput) as tf.Tensor;
        const predValue = await prediction.data();

        predictions.push(predValue[0]);

        // Update input for next prediction (sliding window)
        currentInput = [...currentInput.slice(1), this.createFeatureVector(predValue[0])];

        stepInput.dispose();
        prediction.dispose();
      }

      inputTensor.dispose();

      // Calculate confidence based on recent model performance
      const confidence = await this.calculateConfidence();

      return {
        predictions,
        confidence,
        model: `${this.modelType}_lstm`,
        timestamp: new Date(),
        metadata: {
          steps,
          sequenceLength: this.sequenceLength
        }
      };

    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  }

  /**
   * Prepare data for training
   */
  private async prepareData(data: TrainingData): Promise<{
    xTrain: tf.Tensor3D;
    yTrain: tf.Tensor2D;
    xVal: tf.Tensor3D;
    yVal: tf.Tensor2D;
  }> {
    // Create sequences
    const sequences: number[][][] = [];
    const targets: number[] = [];

    for (let i = 0; i < data.input.length - this.sequenceLength - 1; i++) {
      sequences.push(data.input.slice(i, i + this.sequenceLength));
      targets.push(data.output[i + this.sequenceLength]);
    }

    // Split into train and validation
    const splitIndex = Math.floor(sequences.length * 0.8);

    const xTrainData = sequences.slice(0, splitIndex);
    const yTrainData = targets.slice(0, splitIndex);
    const xValData = sequences.slice(splitIndex);
    const yValData = targets.slice(splitIndex);

    // Create tensors
    const xTrain = tf.tensor3d(xTrainData);
    const yTrain = tf.tensor2d(yTrainData, [yTrainData.length, 1]);
    const xVal = tf.tensor3d(xValData);
    const yVal = tf.tensor2d(yValData, [yValData.length, 1]);

    return { xTrain, yTrain, xVal, yVal };
  }

  /**
   * Save model to storage
   */
  private async saveModel(): Promise<void> {
    if (!this.model) return;

    try {
      // Convert model to JSON
      const modelJson = await this.model.toJSON();

      // Store in database
      await supabaseAdmin
        .from('ml_model_storage')
        .upsert({
          organization_id: this.organizationId,
          model_type: this.modelType,
          model_data: modelJson,
          path: this.modelPath,
          updated_at: new Date().toISOString()
        });

    } catch (error) {
      console.error('Error saving model:', error);
    }
  }

  /**
   * Load model from storage
   */
  private async loadModel(): Promise<void> {
    try {
      const { data, error } = await supabaseAdmin
        .from('ml_model_storage')
        .select('model_data')
        .eq('organization_id', this.organizationId)
        .eq('model_type', this.modelType)
        .single();

      if (!error && data) {
        this.model = await tf.loadLayersModel({
          load: async () => data.model_data
        });
      } else {
        // Build new model if not found
        this.model = this.buildModel();
      }

    } catch (error) {
      console.error('Error loading model:', error);
      this.model = this.buildModel();
    }
  }

  /**
   * Calculate model confidence based on recent performance
   */
  private async calculateConfidence(): Promise<number> {
    const { data } = await supabaseAdmin
      .from('ml_training_logs')
      .select('val_loss, val_mae')
      .eq('organization_id', this.organizationId)
      .eq('model_type', this.modelType)
      .order('timestamp', { ascending: false })
      .limit(10);

    if (!data || data.length === 0) {
      return 0.5; // Default confidence
    }

    // Calculate confidence based on validation metrics
    const avgValLoss = data.reduce((sum, d) => sum + (d.val_loss || 0), 0) / data.length;
    const avgValMae = data.reduce((sum, d) => sum + (d.val_mae || 0), 0) / data.length;

    // Convert to confidence score (0-1)
    const lossConfidence = Math.exp(-avgValLoss);
    const maeConfidence = Math.exp(-avgValMae / 100);

    return Math.min(0.95, (lossConfidence + maeConfidence) / 2);
  }

  /**
   * Create feature vector from single value
   */
  private createFeatureVector(value: number): number[] {
    // Generate synthetic features for prediction
    // In production, this would use real feature engineering
    return [
      value,
      value * 0.9, // Simulated temperature
      value * 1.1, // Simulated cost
      value * 0.8, // Simulated demand
      value * 0.95 // Simulated efficiency
    ];
  }

  /**
   * Evaluate model performance
   */
  async evaluate(testData: TrainingData): Promise<{
    mae: number;
    mse: number;
    rmse: number;
    mape: number;
  }> {
    if (!this.model) {
      await this.loadModel();
    }

    if (!this.model) {
      throw new Error('Model not available');
    }

    const { xTrain, yTrain } = await this.prepareData(testData);

    const predictions = this.model.predict(xTrain) as tf.Tensor;
    const predData = await predictions.data();
    const actualData = await yTrain.data();

    let mae = 0;
    let mse = 0;
    let mape = 0;

    for (let i = 0; i < predData.length; i++) {
      const error = Math.abs(predData[i] - actualData[i]);
      mae += error;
      mse += error * error;
      mape += actualData[i] !== 0 ? error / Math.abs(actualData[i]) : 0;
    }

    mae /= predData.length;
    mse /= predData.length;
    mape = (mape / predData.length) * 100;
    const rmse = Math.sqrt(mse);

    // Clean up
    xTrain.dispose();
    yTrain.dispose();
    predictions.dispose();

    // Store evaluation metrics
    await supabaseAdmin
      .from('ml_evaluations')
      .insert({
        organization_id: this.organizationId,
        model_type: this.modelType,
        metrics: { mae, mse, rmse, mape },
        evaluated_at: new Date().toISOString()
      });

    return { mae, mse, rmse, mape };
  }

  /**
   * Perform hyperparameter tuning
   */
  async tune(data: TrainingData, trials: number = 10): Promise<any> {
    const results = [];

    for (let trial = 0; trial < trials; trial++) {
      // Generate random hyperparameters
      const units1 = [32, 64, 128][Math.floor(Math.random() * 3)];
      const units2 = [16, 32, 64][Math.floor(Math.random() * 3)];
      const dropoutRate = Math.random() * 0.5;
      const learningRate = Math.pow(10, -4 + Math.random() * 2);

      // Build model with new hyperparameters
      const testModel = tf.sequential({
        layers: [
          tf.layers.lstm({
            units: units1,
            returnSequences: true,
            inputShape: [this.sequenceLength, this.features]
          }),
          tf.layers.dropout({ rate: dropoutRate }),
          tf.layers.lstm({
            units: units2,
            returnSequences: false
          }),
          tf.layers.dropout({ rate: dropoutRate }),
          tf.layers.dense({ units: 16, activation: 'relu' }),
          tf.layers.dense({ units: 1 })
        ]
      });

      testModel.compile({
        optimizer: tf.train.adam(learningRate),
        loss: 'meanSquaredError',
        metrics: ['mae']
      });

      // Train with limited epochs for tuning
      const { xTrain, yTrain, xVal, yVal } = await this.prepareData(data);

      const history = await testModel.fit(xTrain, yTrain, {
        epochs: 10,
        batchSize: this.batchSize,
        validationData: [xVal, yVal],
        verbose: 0
      });

      const finalValLoss = history.history.val_loss[history.history.val_loss.length - 1];

      results.push({
        trial,
        hyperparameters: {
          units1,
          units2,
          dropoutRate,
          learningRate
        },
        valLoss: finalValLoss
      });

      // Clean up
      xTrain.dispose();
      yTrain.dispose();
      xVal.dispose();
      yVal.dispose();
      testModel.dispose();
    }

    // Sort by validation loss
    results.sort((a, b) => a.valLoss - b.valLoss);

    // Store best hyperparameters
    await supabaseAdmin
      .from('ml_hyperparameters')
      .insert({
        organization_id: this.organizationId,
        model_type: this.modelType,
        best_params: results[0].hyperparameters,
        all_results: results,
        tuned_at: new Date().toISOString()
      });

    return results[0];
  }
}

/**
 * ML Pipeline Manager
 */
export class MLPipeline {
  private predictors: Map<string, LSTMPredictor> = new Map();

  constructor(private organizationId: string) {}

  /**
   * Initialize all ML models
   */
  async initialize(): Promise<void> {
    // Create predictors for different types
    this.predictors.set('energy', new LSTMPredictor(this.organizationId, 'energy'));
    this.predictors.set('emissions', new LSTMPredictor(this.organizationId, 'emissions'));
    this.predictors.set('maintenance', new LSTMPredictor(this.organizationId, 'maintenance'));

    // Load existing models
    for (const [key, predictor] of this.predictors) {
      try {
        await predictor['loadModel']();
      } catch (error) {
      }
    }
  }

  /**
   * Train all models with fresh data
   */
  async trainAll(): Promise<void> {
    // Train energy predictor
    const energyData = await this.fetchEnergyData();
    if (energyData.input.length > 0) {
      await this.predictors.get('energy')!.train(energyData);
    }

    // Train emissions predictor
    const emissionsData = await this.fetchEmissionsData();
    if (emissionsData.input.length > 0) {
      await this.predictors.get('emissions')!.train(emissionsData);
    }

    // Train maintenance predictor
    const maintenanceData = await this.fetchMaintenanceData();
    if (maintenanceData.input.length > 0) {
      await this.predictors.get('maintenance')!.train(maintenanceData);
    }
  }

  /**
   * Get predictor for specific type
   */
  getPredictor(type: 'energy' | 'emissions' | 'maintenance'): LSTMPredictor | undefined {
    return this.predictors.get(type);
  }

  /**
   * Fetch energy training data
   */
  private async fetchEnergyData(): Promise<TrainingData> {
    const { data } = await supabaseAdmin
      .from('agent_energy_consumption')
      .select('*')
      .eq('organization_id', this.organizationId)
      .order('measured_at', { ascending: true });

    if (!data || data.length === 0) {
      return { input: [], output: [], timestamps: [] };
    }

    const input: number[][] = [];
    const output: number[] = [];
    const timestamps: Date[] = [];

    data.forEach(d => {
      input.push([
        d.consumption,
        d.cost || 0,
        d.peak_demand || 0,
        new Date(d.measured_at).getHours(), // Hour of day
        new Date(d.measured_at).getDay() // Day of week
      ]);
      output.push(d.consumption);
      timestamps.push(new Date(d.measured_at));
    });

    return { input, output, timestamps };
  }

  /**
   * Fetch emissions training data
   */
  private async fetchEmissionsData(): Promise<TrainingData> {
    const { data } = await supabaseAdmin
      .from('emissions')
      .select('*')
      .eq('organization_id', this.organizationId)
      .order('date', { ascending: true });

    if (!data || data.length === 0) {
      return { input: [], output: [], timestamps: [] };
    }

    const input: number[][] = [];
    const output: number[] = [];
    const timestamps: Date[] = [];

    data.forEach(d => {
      const totalEmissions = (d.scope1 || 0) + (d.scope2 || 0) + (d.scope3 || 0);
      input.push([
        d.scope1 || 0,
        d.scope2 || 0,
        d.scope3 || 0,
        totalEmissions,
        new Date(d.date).getMonth() // Month
      ]);
      output.push(totalEmissions);
      timestamps.push(new Date(d.date));
    });

    return { input, output, timestamps };
  }

  /**
   * Fetch maintenance training data
   */
  private async fetchMaintenanceData(): Promise<TrainingData> {
    const { data } = await supabaseAdmin
      .from('device_health_metrics')
      .select('*')
      .eq('organization_id', this.organizationId)
      .order('measured_at', { ascending: true });

    if (!data || data.length === 0) {
      return { input: [], output: [], timestamps: [] };
    }

    const input: number[][] = [];
    const output: number[] = [];
    const timestamps: Date[] = [];

    data.forEach(d => {
      input.push([
        d.health_score || 0,
        d.failure_probability || 0,
        d.anomaly_count || 0,
        d.critical_issues || 0,
        1 // Placeholder for device age
      ]);
      output.push(d.failure_probability || 0);
      timestamps.push(new Date(d.measured_at));
    });

    return { input, output, timestamps };
  }

  /**
   * Run continuous learning
   */
  async continuousLearning(): Promise<void> {
    // Retrain models periodically with new data
    const lastTraining = await this.getLastTrainingTime();
    const hoursSinceLastTraining = (Date.now() - lastTraining.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastTraining > 24) {
      await this.trainAll();

      // Evaluate models
      for (const [key, predictor] of this.predictors) {
        const testData = await this.fetchTestData(key as any);
        if (testData.input.length > 0) {
          const metrics = await predictor.evaluate(testData);
        }
      }

      // Update training timestamp
      await supabaseAdmin
        .from('ml_training_cycles')
        .insert({
          organization_id: this.organizationId,
          completed_at: new Date().toISOString()
        });
    }
  }

  /**
   * Get last training time
   */
  private async getLastTrainingTime(): Promise<Date> {
    const { data } = await supabaseAdmin
      .from('ml_training_cycles')
      .select('completed_at')
      .eq('organization_id', this.organizationId)
      .order('completed_at', { ascending: false })
      .limit(1);

    return data && data.length > 0
      ? new Date(data[0].completed_at)
      : new Date(0); // Return epoch if no training history
  }

  /**
   * Fetch test data for evaluation
   */
  private async fetchTestData(type: 'energy' | 'emissions' | 'maintenance'): Promise<TrainingData> {
    switch (type) {
      case 'energy':
        return this.fetchEnergyData();
      case 'emissions':
        return this.fetchEmissionsData();
      case 'maintenance':
        return this.fetchMaintenanceData();
      default:
        return { input: [], output: [], timestamps: [] };
    }
  }
}

// Export for use in agents
export { LSTMPredictor, MLPipeline };