/**
 * Base Model Abstract Class
 * Foundation for all ML models in the pipeline
 */

import * as tf from '@tensorflow/tfjs-node';
import { 
  TrainingData, 
  TrainingResult, 
  Prediction, 
  TestData
} from '../types';

export interface ModelConfig {
  name: string;
  type: string;
  version?: string;
  hyperparameters?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface EvaluationMetrics {
  accuracy?: number;
  loss?: number;
  mae?: number;
  mse?: number;
  rmse?: number;
  r2?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  improvement?: number;
  confusionMatrix?: number[][];
  [key: string]: number | number[][] | undefined; // Allow any numeric metric
}

export abstract class BaseModel {
  protected model: tf.LayersModel | null = null;
  protected config: ModelConfig;
  protected metrics: EvaluationMetrics = {};
  protected isTraining: boolean = false;
  protected modelPath?: string;

  constructor(config: ModelConfig) {
    this.config = config;
  }

  /**
   * Build model architecture
   */
  abstract buildModel(): Promise<void>;

  /**
   * Train the model
   */
  abstract train(data: TrainingData): Promise<TrainingResult>;

  /**
   * Make predictions
   */
  abstract predict(input: any): Promise<Prediction>;

  /**
   * Evaluate model performance
   */
  abstract evaluate(testData: TestData): Promise<EvaluationMetrics>;

  /**
   * Preprocess input data
   */
  abstract preprocessInput(input: any): Promise<tf.Tensor>;

  /**
   * Postprocess model output
   */
  abstract postprocessOutput(output: tf.Tensor): Promise<any>;

  /**
   * Save model to file system
   */
  async save(path: string): Promise<void> {
    if (!this.model) {
      throw new Error('No model to save');
    }
    
    try {
      await this.model.save(`file://${path}`);
      this.modelPath = path;
      
      // Save metadata
      const metadata = {
        config: this.config,
        metrics: this.metrics,
        savedAt: new Date().toISOString()
      };
      
      const fs = require('fs').promises;
      await fs.writeFile(
        `${path}/metadata.json`, 
        JSON.stringify(metadata, null, 2)
      );
      
      console.log(`Model saved to ${path}`);
    } catch (error) {
      throw new Error(`Failed to save model: ${error.message}`);
    }
  }

  /**
   * Load model from file system
   */
  async load(path: string): Promise<void> {
    try {
      this.model = await tf.loadLayersModel(`file://${path}/model.json`);
      this.modelPath = path;
      
      // Load metadata
      const fs = require('fs').promises;
      const metadataStr = await fs.readFile(`${path}/metadata.json`, 'utf-8');
      const metadata = JSON.parse(metadataStr);
      
      this.config = metadata.config;
      this.metrics = metadata.metrics;
      
      console.log(`Model loaded from ${path}`);
    } catch (error) {
      throw new Error(`Failed to load model: ${error.message}`);
    }
  }

  /**
   * Get model summary
   */
  getSummary(): string {
    if (!this.model) {
      return 'Model not built';
    }
    
    let summary = '';
    this.model.summary(undefined, undefined, (line) => {
      summary += line + '\n';
    });
    return summary;
  }

  /**
   * Get model metrics
   */
  getMetrics(): EvaluationMetrics {
    return { ...this.metrics };
  }

  /**
   * Set model parameters
   */
  setParameters(params: Record<string, any>): void {
    this.config.hyperparameters = {
      ...this.config.hyperparameters,
      ...params
    };
  }

  /**
   * Get model configuration
   */
  getConfig(): ModelConfig {
    return { ...this.config };
  }

  /**
   * Get model name
   */
  getModelName(): string {
    return this.config.name;
  }

  /**
   * Dispose of model resources
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }

  /**
   * Check if model is trained
   */
  isTrained(): boolean {
    return this.model !== null && Object.keys(this.metrics).length > 0;
  }

  /**
   * Get model size in bytes
   */
  async getModelSize(): Promise<number> {
    if (!this.model) {
      return 0;
    }
    
    let totalSize = 0;
    for (const weight of this.model.getWeights()) {
      totalSize += weight.size * 4; // 4 bytes per float32
    }
    
    return totalSize;
  }

  /**
   * Validate input shape
   */
  protected validateInputShape(input: tf.Tensor, expectedShape: number[]): void {
    const inputShape = input.shape;
    
    // Check number of dimensions
    if (inputShape.length !== expectedShape.length) {
      throw new Error(
        `Invalid input shape: expected ${expectedShape.length} dimensions, ` +
        `got ${inputShape.length}`
      );
    }
    
    // Check each dimension (skip batch dimension)
    for (let i = 1; i < expectedShape.length; i++) {
      if (expectedShape[i] !== -1 && inputShape[i] !== expectedShape[i]) {
        throw new Error(
          `Invalid input shape at dimension ${i}: expected ${expectedShape[i]}, ` +
          `got ${inputShape[i]}`
        );
      }
    }
  }

  /**
   * Calculate standard metrics
   */
  protected calculateMetrics(
    predictions: number[], 
    actuals: number[]
  ): EvaluationMetrics {
    const n = predictions.length;
    
    // MAE
    const mae = predictions.reduce((sum, pred, i) => 
      sum + Math.abs(pred - actuals[i]), 0) / n;
    
    // MSE
    const mse = predictions.reduce((sum, pred, i) => 
      sum + Math.pow(pred - actuals[i], 2), 0) / n;
    
    // RMSE
    const rmse = Math.sqrt(mse);
    
    // R2
    const actualMean = actuals.reduce((sum, val) => sum + val, 0) / n;
    const totalSS = actuals.reduce((sum, val) => 
      sum + Math.pow(val - actualMean, 2), 0);
    const residualSS = predictions.reduce((sum, pred, i) => 
      sum + Math.pow(actuals[i] - pred, 2), 0);
    const r2 = 1 - (residualSS / totalSS);
    
    return { mae, mse, rmse, r2 };
  }

  /**
   * Create train/validation split
   */
  protected splitData(
    data: TrainingData, 
    validationSplit: number = 0.2
  ): { train: TrainingData; validation: TrainingData } {
    const totalSamples = data.features.length;
    const trainSize = Math.floor(totalSamples * (1 - validationSplit));
    
    return {
      train: {
        features: data.features.slice(0, trainSize),
        labels: data.labels.slice(0, trainSize),
        metadata: data.metadata
      },
      validation: {
        features: data.features.slice(trainSize),
        labels: data.labels.slice(trainSize),
        metadata: data.metadata
      }
    };
  }
}