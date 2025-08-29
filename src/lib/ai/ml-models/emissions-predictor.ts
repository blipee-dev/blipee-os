/**
 * Emissions Prediction Model
 * LSTM-based time series model for predicting Scope 1, 2, and 3 emissions
 */

import * as tf from '@tensorflow/tfjs-node';
import { TimeSeriesModel } from './base/timeseries-model';
import { 
  EmissionsData, 
  ExternalFactors, 
  EmissionsForecast,
  KeyFactor,
  TrainingData,
  TrainingResult,
  Prediction,
  TestData,
  EvaluationMetrics
} from './types';

interface EmissionsPredictionConfig {
  sequenceLength?: number;
  features?: number;
  lstmUnits?: number[];
  dropout?: number;
  learningRate?: number;
  batchSize?: number;
  epochs?: number;
}

export class EmissionsPredictionModel extends TimeSeriesModel {
  private lstmUnits: number[];
  private dropout: number;
  private learningRate: number;

  constructor(config: EmissionsPredictionConfig = {}) {
    super({
      name: 'emissions_predictor',
      type: 'timeseries',
      sequenceLength: config.sequenceLength || 30,
      features: config.features || 10,
      horizon: 7,
      ...config
    });
    
    this.lstmUnits = config.lstmUnits || [128, 64];
    this.dropout = config.dropout || 0.2;
    this.learningRate = config.learningRate || 0.001;
    
    // Update features if provided in config
    if (config.features) {
      this.features = config.features;
    }
  }

  /**
   * Build LSTM model architecture
   */
  async buildModel(): Promise<void> {
    const model = tf.sequential();
    
    // First LSTM layer
    model.add(tf.layers.lstm({
      units: this.lstmUnits[0] || 128,
      returnSequences: this.lstmUnits.length > 1,
      inputShape: [this.sequenceLength, this.features]
    }));
    
    // Dropout
    if (this.dropout > 0) {
      model.add(tf.layers.dropout({ rate: this.dropout }));
    }
    
    // Additional LSTM layers
    for (let i = 1; i < this.lstmUnits.length; i++) {
      model.add(tf.layers.lstm({
        units: this.lstmUnits[i] || 64,
        returnSequences: i < this.lstmUnits.length - 1
      }));
      
      if (this.dropout > 0) {
        model.add(tf.layers.dropout({ rate: this.dropout }));
      }
    }
    
    // Dense layers
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
    model.add(tf.layers.dense({ units: 3 })); // Scope 1, 2, 3 predictions
    
    // Compile model
    model.compile({
      optimizer: tf.train.adam(this.learningRate),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    this.model = model;
    console.log('Emissions prediction model built successfully');
  }

  /**
   * Preprocess emissions data for training
   */
  async preprocessData(rawData: EmissionsData[]): Promise<tf.Tensor> {
    // Extract features from each data point
    const features = rawData.map(d => [
      d.scope1,
      d.scope2,
      d.scope3,
      d.energyConsumption,
      d.productionVolume,
      d.temperature,
      d.dayOfWeek,
      d.monthOfYear,
      d.isHoliday ? 1 : 0,
      d.economicIndex
    ]);
    
    // Normalize features
    const normalized = this.normalizeFeatures(features);
    
    // Create sequences
    const sequences = this.createSequences(normalized, this.sequenceLength);
    
    return tf.tensor3d(sequences);
  }

  /**
   * Train the model
   */
  async train(data: TrainingData): Promise<TrainingResult> {
    if (!this.model) {
      await this.buildModel();
    }

    // Convert training data to tensors
    const xTrain = tf.tensor3d(data.features);
    const yTrain = tf.tensor2d(data.labels);

    // Train model
    const history = await this.model!.fit(xTrain, yTrain, {
      epochs: this.config.hyperparameters?.epochs || 100,
      batchSize: this.config.hyperparameters?.batchSize || 32,
      validationSplit: 0.2,
      callbacks: [
        tf.callbacks.earlyStopping({
          monitor: 'val_loss',
          patience: 10,
          restoreBestWeights: true
        }),
        {
          onEpochEnd: async (epoch, logs) => {
            if (epoch % 10 === 0) {
              console.log(`Epoch ${epoch}: loss=${logs?.loss?.toFixed(4)}, val_loss=${logs?.val_loss?.toFixed(4)}`);
            }
          }
        }
      ]
    });

    // Calculate final metrics
    const finalLoss = history.history.loss[history.history.loss.length - 1];
    const finalValLoss = history.history.val_loss[history.history.val_loss.length - 1];

    // Clean up tensors
    xTrain.dispose();
    yTrain.dispose();

    this.metrics = {
      loss: finalLoss,
      mae: history.history.mae?.[history.history.mae.length - 1],
      mse: finalLoss // Loss is MSE in this case
    };

    return {
      model: this.model,
      metrics: this.metrics,
      history: history.history
    };
  }

  /**
   * Make emissions predictions
   */
  async predict(input: any): Promise<Prediction> {
    if (!this.model) {
      throw new Error('Model not trained');
    }

    const inputTensor = await this.preprocessInput(input);
    const outputTensor = this.model.predict(inputTensor) as tf.Tensor;
    const predictions = await this.postprocessOutput(outputTensor);

    // Clean up tensors
    inputTensor.dispose();
    outputTensor.dispose();

    return {
      value: predictions,
      confidence: 0.85, // Placeholder - should be calculated
      timestamp: new Date(),
      modelVersion: this.config.version || '1.0.0'
    };
  }

  /**
   * Predict emissions for a specific time horizon
   */
  async predictEmissions(
    historicalData: EmissionsData[],
    horizon: number,
    externalFactors?: ExternalFactors
  ): Promise<EmissionsForecast> {
    if (!this.model) {
      throw new Error('Model not trained');
    }
    
    const predictions: number[] = [];
    const confidenceIntervals: Array<[number, number]> = [];
    
    // Use last sequence for initial prediction
    let currentSequence = historicalData.slice(-this.sequenceLength);
    
    for (let i = 0; i < horizon; i++) {
      // Prepare input
      const input = await this.preprocessData(currentSequence);
      
      // Make prediction
      const prediction = this.model.predict(input) as tf.Tensor;
      const [scope1, scope2, scope3] = await prediction.data();
      const totalEmissions = scope1 + scope2 + scope3;
      
      // Calculate confidence interval using Monte Carlo dropout
      const samples = await this.monteCarloSamples(input, 100);
      const ci = this.calculateConfidenceInterval(samples, 0.95);
      
      predictions.push(totalEmissions);
      confidenceIntervals.push(ci);
      
      // Update sequence for next prediction
      const nextDataPoint: EmissionsData = {
        ...currentSequence[currentSequence.length - 1],
        timestamp: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
        scope1,
        scope2,
        scope3,
        totalEmissions,
        // Apply external factors if provided
        ...(externalFactors ? this.applyExternalFactors(externalFactors, i) : {})
      };
      
      currentSequence = [...currentSequence.slice(1), nextDataPoint];
      
      // Clean up
      input.dispose();
      prediction.dispose();
    }
    
    // Apply trend adjustment if detected
    const adjustedPredictions = this.addTrend(
      predictions,
      historicalData.map(d => d.totalEmissions)
    );
    
    return {
      predictions: adjustedPredictions,
      confidenceIntervals,
      horizon,
      factors: this.identifyKeyFactors(historicalData, adjustedPredictions)
    };
  }

  /**
   * Evaluate model performance
   */
  async evaluate(testData: TestData): Promise<EvaluationMetrics> {
    if (!this.model) {
      throw new Error('Model not trained');
    }

    const xTest = tf.tensor3d(testData.features);
    const yTest = testData.labels;
    
    // Get predictions
    const predictions = this.model.predict(xTest) as tf.Tensor;
    const predValues = await predictions.data();
    
    // Calculate metrics for each scope
    const metrics: EvaluationMetrics = {};
    const numSamples = yTest.length;
    const scopes = 3;
    
    // Reshape predictions and actuals
    const predArray: number[][] = [];
    const actualArray: number[][] = [];
    
    for (let i = 0; i < numSamples; i++) {
      predArray.push([
        predValues[i * scopes],
        predValues[i * scopes + 1],
        predValues[i * scopes + 2]
      ]);
      actualArray.push(yTest[i]);
    }
    
    // Calculate aggregate metrics
    const totalPred = predArray.map(p => p.reduce((a, b) => a + b, 0));
    const totalActual = actualArray.map(a => a.reduce((a, b) => a + b, 0));
    
    metrics.mae = totalPred.reduce((sum, pred, i) => 
      sum + Math.abs(pred - totalActual[i]), 0) / numSamples;
    
    metrics.mse = totalPred.reduce((sum, pred, i) => 
      sum + Math.pow(pred - totalActual[i], 2), 0) / numSamples;
    
    metrics.rmse = Math.sqrt(metrics.mse);
    
    // R-squared
    const meanActual = totalActual.reduce((a, b) => a + b, 0) / numSamples;
    const ssTot = totalActual.reduce((sum, val) => 
      sum + Math.pow(val - meanActual, 2), 0);
    const ssRes = totalPred.reduce((sum, pred, i) => 
      sum + Math.pow(totalActual[i] - pred, 2), 0);
    metrics.r2 = 1 - (ssRes / ssTot);
    
    // Clean up
    xTest.dispose();
    predictions.dispose();
    
    return metrics;
  }

  /**
   * Preprocess input for prediction
   */
  async preprocessInput(input: any): Promise<tf.Tensor> {
    if (Array.isArray(input)) {
      return this.preprocessData(input);
    } else {
      // Single data point - create sequence
      const emissionsData: EmissionsData = {
        timestamp: input.timestamp || new Date(),
        scope1: input.scope1 || 0,
        scope2: input.scope2 || 0,
        scope3: input.scope3 || 0,
        totalEmissions: (input.scope1 || 0) + (input.scope2 || 0) + (input.scope3 || 0),
        energyConsumption: input.energyConsumption || 0,
        productionVolume: input.productionVolume || 0,
        temperature: input.temperature || 20,
        dayOfWeek: input.dayOfWeek || new Date().getDay(),
        monthOfYear: input.monthOfYear || new Date().getMonth() + 1,
        isHoliday: input.isHoliday || false,
        economicIndex: input.economicIndex || 100
      };
      const sequence = Array(this.sequenceLength).fill(emissionsData);
      
      // Ensure we only use the number of features the model expects
      const processed = await this.preprocessData(sequence);
      const shape = processed.shape;
      if (shape[2] !== this.features) {
        // Slice or pad to match expected features
        const data = await processed.array() as number[][][];
        const adjustedData = data.map(seq => 
          seq.map(step => step.slice(0, this.features))
        );
        processed.dispose();
        return tf.tensor3d(adjustedData);
      }
      
      return processed;
    }
  }

  /**
   * Postprocess model output
   */
  async postprocessOutput(output: tf.Tensor): Promise<any> {
    const values = await output.data();
    
    // Denormalize if needed
    const scope1 = this.denormalizePredictions([values[0]], 0)[0];
    const scope2 = this.denormalizePredictions([values[1]], 1)[0];
    const scope3 = this.denormalizePredictions([values[2]], 2)[0];
    
    return {
      scope1: Math.max(0, scope1),
      scope2: Math.max(0, scope2),
      scope3: Math.max(0, scope3),
      total: Math.max(0, scope1 + scope2 + scope3)
    };
  }

  /**
   * Monte Carlo dropout sampling for uncertainty estimation
   */
  private async monteCarloSamples(input: tf.Tensor, n: number): Promise<number[]> {
    const samples: number[] = [];
    
    for (let i = 0; i < n; i++) {
      // Enable dropout during inference
      const prediction = this.model!.predict(input, { training: true }) as tf.Tensor;
      const values = await prediction.data();
      samples.push(values[0] + values[1] + values[2]); // Total emissions
      prediction.dispose();
    }
    
    return samples;
  }

  /**
   * Calculate confidence intervals from samples
   */
  private calculateConfidenceInterval(samples: number[], confidence: number): [number, number] {
    samples.sort((a, b) => a - b);
    const alpha = 1 - confidence;
    const lower = Math.floor((alpha / 2) * samples.length);
    const upper = Math.ceil((1 - alpha / 2) * samples.length) - 1;
    return [samples[lower], samples[upper]];
  }

  /**
   * Identify key factors affecting emissions
   */
  private identifyKeyFactors(
    historical: EmissionsData[], 
    predictions: number[]
  ): KeyFactor[] {
    // Analyze correlations and feature importance
    // This is a simplified version - in production would use SHAP or similar
    return [
      { name: 'Energy Consumption', impact: 0.35, direction: 'positive' },
      { name: 'Production Volume', impact: 0.28, direction: 'positive' },
      { name: 'Renewable Energy %', impact: 0.22, direction: 'negative' },
      { name: 'Temperature', impact: 0.15, direction: 'negative' }
    ];
  }

  /**
   * Apply external factors to predictions
   */
  private applyExternalFactors(factors: ExternalFactors, dayIndex: number): any {
    const updates: any = {};
    
    if (factors.weatherData) {
      updates.temperature = factors.weatherData["temperature"];
    }
    
    if (factors.economicIndicators) {
      updates.economicIndex = factors.economicIndicators.index;
    }
    
    return updates;
  }
}