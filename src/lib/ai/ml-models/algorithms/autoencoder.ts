/**
 * AutoEncoder for Anomaly Detection
 * Deep learning approach for detecting anomalies in ESG data
 */

import * as tf from '@tensorflow/tfjs-node';

export interface AutoEncoderConfig {
  inputDim?: number;
  encoderLayers?: number[];
  decoderLayers?: number[];
  activation?: string;
  learningRate?: number;
  batchSize?: number;
  epochs?: number;
  threshold?: number;
}

export class AutoEncoder {
  private encoder?: tf.LayersModel;
  private decoder?: tf.LayersModel;
  private autoencoder?: tf.LayersModel;
  private config: AutoEncoderConfig;
  private threshold: number = 0;
  private inputScaler?: { mean: number[]; std: number[] };

  constructor(config: AutoEncoderConfig = {}) {
    this.config = {
      inputDim: config.inputDim || 10,
      encoderLayers: config.encoderLayers || [64, 32, 16],
      decoderLayers: config.decoderLayers || [16, 32, 64],
      activation: config.activation || 'relu',
      learningRate: config.learningRate || 0.001,
      batchSize: config.batchSize || 32,
      epochs: config.epochs || 50,
      threshold: config.threshold
    };
  }

  /**
   * Build the autoencoder architecture
   */
  private buildModel(): void {
    const inputLayer = tf.input({ shape: [this.config.inputDim!] });
    
    // Build encoder
    let encoded = inputLayer;
    const encoderLayerObjects: tf.layers.Layer[] = [];
    
    for (const units of this.config.encoderLayers!) {
      const layer = tf.layers.dense({
        units,
        activation: this.config.activation as any
      });
      encoded = layer.apply(encoded) as tf.SymbolicTensor;
      encoderLayerObjects.push(layer);
    }
    
    // Build decoder
    let decoded = encoded;
    const decoderLayerObjects: tf.layers.Layer[] = [];
    
    for (const units of this.config.decoderLayers!) {
      const layer = tf.layers.dense({
        units,
        activation: this.config.activation as any
      });
      decoded = layer.apply(decoded) as tf.SymbolicTensor;
      decoderLayerObjects.push(layer);
    }
    
    // Output layer
    const outputLayer = tf.layers.dense({
      units: this.config.inputDim!,
      activation: 'linear'
    });
    decoded = outputLayer.apply(decoded) as tf.SymbolicTensor;
    
    // Create models
    this.encoder = tf.model({
      inputs: inputLayer,
      outputs: encoded,
      name: 'encoder'
    });
    
    this.autoencoder = tf.model({
      inputs: inputLayer,
      outputs: decoded,
      name: 'autoencoder'
    });
    
    // Compile autoencoder
    this.autoencoder.compile({
      optimizer: tf.train.adam(this.config.learningRate!),
      loss: 'meanSquaredError'
    });
  }

  /**
   * Fit the autoencoder on normal data
   */
  async fit(data: any[]): Promise<void> {
    // Extract and normalize features
    const features = this.extractFeatures(data);
    const { normalized, scaler } = this.normalizeData(features);
    this.inputScaler = scaler;
    
    // Build model if not already built
    if (!this.autoencoder) {
      this.config.inputDim = features[0].length;
      this.buildModel();
    }
    
    // Convert to tensors
    const xTrain = tf.tensor2d(normalized);
    
    // Train autoencoder
    const history = await this.autoencoder!.fit(xTrain, xTrain, {
      epochs: this.config.epochs!,
      batchSize: this.config.batchSize!,
      validationSplit: 0.1,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 10 === 0) {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss?.toFixed(4)}`);
          }
        }
      }
    });
    
    // Calculate threshold if not provided
    if (!this.config.threshold) {
      await this.calculateThreshold(normalized);
    } else {
      this.threshold = this.config.threshold;
    }
    
    // Clean up
    xTrain.dispose();
  }

  /**
   * Detect anomalies in new data
   */
  async detect(data: any[]): Promise<Array<{
    index: number;
    score: number;
    isAnomaly: boolean;
    reconstructionError: number;
    data: any;
  }>> {
    if (!this.autoencoder) {
      throw new Error('Model not trained');
    }
    
    const results = [];
    const features = this.extractFeatures(data);
    const { normalized } = this.normalizeData(features, this.inputScaler);
    
    for (let i = 0; i < normalized.length; i++) {
      const input = tf.tensor2d([normalized[i]]);
      const reconstructed = this.autoencoder.predict(input) as tf.Tensor;
      
      // Calculate reconstruction error
      const error = await this.calculateReconstructionError(
        normalized[i],
        await reconstructed.array() as number[][]
      );
      
      // Anomaly score (normalized error)
      const score = error / this.threshold;
      
      results.push({
        index: i,
        score,
        isAnomaly: score > 1,
        reconstructionError: error,
        data: data[i]
      });
      
      // Clean up
      input.dispose();
      reconstructed.dispose();
    }
    
    return results;
  }

  /**
   * Get latent representation of data
   */
  async encode(data: any[]): Promise<number[][]> {
    if (!this.encoder) {
      throw new Error('Model not trained');
    }
    
    const features = this.extractFeatures(data);
    const { normalized } = this.normalizeData(features, this.inputScaler);
    
    const input = tf.tensor2d(normalized);
    const encoded = this.encoder.predict(input) as tf.Tensor;
    const result = await encoded.array() as number[][];
    
    // Clean up
    input.dispose();
    encoded.dispose();
    
    return result;
  }

  /**
   * Calculate reconstruction error
   */
  private async calculateReconstructionError(
    original: number[],
    reconstructed: number[][]
  ): Promise<number> {
    const reconstructedFlat = reconstructed[0];
    let error = 0;
    
    for (let i = 0; i < original.length; i++) {
      error += Math.pow(original[i] - reconstructedFlat[i], 2);
    }
    
    return Math.sqrt(error / original.length); // RMSE
  }

  /**
   * Calculate threshold based on training data reconstruction errors
   */
  private async calculateThreshold(normalizedData: number[][]): Promise<void> {
    const errors: number[] = [];
    
    for (const sample of normalizedData) {
      const input = tf.tensor2d([sample]);
      const reconstructed = this.autoencoder!.predict(input) as tf.Tensor;
      
      const error = await this.calculateReconstructionError(
        sample,
        await reconstructed.array() as number[][]
      );
      
      errors.push(error);
      
      // Clean up
      input.dispose();
      reconstructed.dispose();
    }
    
    // Set threshold as 95th percentile of errors
    errors.sort((a, b) => a - b);
    const percentileIndex = Math.floor(errors.length * 0.95);
    this.threshold = errors[percentileIndex];
  }

  /**
   * Extract features from data
   */
  private extractFeatures(data: any[]): number[][] {
    return data.map(d => {
      const features: number[] = [];
      
      if (typeof d === 'number') {
        features.push(d);
      } else if (Array.isArray(d)) {
        features.push(...d.filter(v => typeof v === 'number'));
      } else if (typeof d === 'object') {
        // Extract numeric features
        const numericKeys = [
          'value', 'emissions', 'scope1', 'scope2', 'scope3',
          'energyConsumption', 'waterUsage', 'wasteGenerated',
          'temperature', 'humidity', 'pressure', 'flow',
          'productionVolume', 'efficiency', 'utilization'
        ];
        
        for (const key of numericKeys) {
          if (key in d && typeof d[key] === 'number') {
            features.push(d[key]);
          }
        }
        
        // If no specific features found, extract all numeric values
        if (features.length === 0) {
          for (const value of Object.values(d)) {
            if (typeof value === 'number') {
              features.push(value);
            }
          }
        }
      }
      
      return features;
    });
  }

  /**
   * Normalize data using z-score normalization
   */
  private normalizeData(
    data: number[][],
    scaler?: { mean: number[]; std: number[] }
  ): { normalized: number[][]; scaler: { mean: number[]; std: number[] } } {
    const numFeatures = data[0].length;
    
    if (!scaler) {
      // Calculate mean and std for each feature
      const mean: number[] = new Array(numFeatures).fill(0);
      const std: number[] = new Array(numFeatures).fill(0);
      
      // Calculate means
      for (const sample of data) {
        for (let i = 0; i < numFeatures; i++) {
          mean[i] += sample[i];
        }
      }
      for (let i = 0; i < numFeatures; i++) {
        mean[i] /= data.length;
      }
      
      // Calculate standard deviations
      for (const sample of data) {
        for (let i = 0; i < numFeatures; i++) {
          std[i] += Math.pow(sample[i] - mean[i], 2);
        }
      }
      for (let i = 0; i < numFeatures; i++) {
        std[i] = Math.sqrt(std[i] / data.length) || 1; // Avoid division by zero
      }
      
      scaler = { mean, std };
    }
    
    // Normalize data
    const normalized = data.map(sample =>
      sample.map((value, i) => (value - scaler!.mean[i]) / scaler!.std[i])
    );
    
    return { normalized, scaler };
  }

  /**
   * Get model summary
   */
  getSummary(): void {
    if (this.autoencoder) {
      console.log('AutoEncoder Architecture:');
      this.autoencoder.summary();
    }
    if (this.encoder) {
      console.log('\nEncoder Architecture:');
      this.encoder.summary();
    }
  }

  /**
   * Save model
   */
  async save(path: string): Promise<void> {
    if (!this.autoencoder) {
      throw new Error('Model not trained');
    }
    
    await this.autoencoder.save(`file://${path}/autoencoder`);
    await this.encoder!.save(`file://${path}/encoder`);
    
    // Save configuration and threshold
    const fs = require('fs').promises;
    await fs.writeFile(
      `${path}/config.json`,
      JSON.stringify({
        config: this.config,
        threshold: this.threshold,
        inputScaler: this.inputScaler
      }, null, 2)
    );
  }

  /**
   * Load model
   */
  async load(path: string): Promise<void> {
    this.autoencoder = await tf.loadLayersModel(`file://${path}/autoencoder/model.json`);
    this.encoder = await tf.loadLayersModel(`file://${path}/encoder/model.json`);
    
    // Load configuration
    const fs = require('fs').promises;
    const configStr = await fs.readFile(`${path}/config.json`, 'utf-8');
    const saved = JSON.parse(configStr);
    
    this.config = saved.config;
    this.threshold = saved.threshold;
    this.inputScaler = saved.inputScaler;
  }
}