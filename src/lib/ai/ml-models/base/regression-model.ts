/**
 * Regression Model Base Class
 * Foundation for regression-based ML models
 */

import * as tf from '@tensorflow/tfjs-node';
import { BaseModel } from './base-model';
import { TrainingData, Prediction } from '../types';

export abstract class RegressionModel extends BaseModel {
  protected inputDim: number;
  protected outputDim: number;
  protected regularization: {
    l1?: number;
    l2?: number;
    dropout?: number;
  };

  constructor(config: any) {
    super(config);
    this.inputDim = config.inputDim || 10;
    this.outputDim = config.outputDim || 1;
    this.regularization = config.regularization || {};
  }

  /**
   * Create a dense layer with regularization
   */
  protected createDenseLayer(
    units: number,
    activation?: string,
    inputShape?: number[]
  ): tf.layers.Layer {
    const layerConfig: any = {
      units,
      activation
    };

    if (inputShape) {
      layerConfig.inputShape = inputShape;
    }

    // Add regularization
    if (this.regularization.l1 || this.regularization.l2) {
      layerConfig.kernelRegularizer = tf.regularizers.l1l2({
        l1: this.regularization.l1 || 0,
        l2: this.regularization.l2 || 0
      });
    }

    return tf.layers.dense(layerConfig);
  }

  /**
   * Add dropout layer if configured
   */
  protected addDropoutLayer(model: tf.Sequential, rate?: number): void {
    const dropoutRate = rate || this.regularization.dropout;
    if (dropoutRate) {
      model.add(tf.layers.dropout({ rate: dropoutRate }));
    }
  }

  /**
   * Calculate feature importance using permutation
   */
  async calculateFeatureImportance(
    testData: { features: number[][]; labels: number[] }
  ): Promise<Record<string, number>> {
    if (!this.model) {
      throw new Error('Model not trained');
    }

    const baseline = await this.evaluateInternal(testData);
    const importance: Record<string, number> = {};
    const numFeatures = testData.features[0].length;

    for (let featureIdx = 0; featureIdx < numFeatures; featureIdx++) {
      // Permute feature values
      const permutedData = {
        features: testData.features.map(row => {
          const newRow = [...row];
          const randomIdx = Math.floor(Math.random() * testData.features.length);
          newRow[featureIdx] = testData.features[randomIdx][featureIdx];
          return newRow;
        }),
        labels: testData.labels
      };

      // Evaluate with permuted feature
      const permutedMetrics = await this.evaluateInternal(permutedData);
      
      // Calculate importance as drop in performance
      const importanceScore = baseline.r2! - permutedMetrics.r2!;
      importance[`feature_${featureIdx}`] = Math.max(0, importanceScore);
    }

    return importance;
  }

  /**
   * Internal evaluation method
   */
  private async evaluateInternal(
    data: { features: number[][]; labels: number[] }
  ): Promise<{ r2: number }> {
    const predictions = await this.batchPredict(data.features);
    const actuals = data.labels;
    
    // Calculate R2
    const mean = actuals.reduce((sum, val) => sum + val, 0) / actuals.length;
    const totalSS = actuals.reduce((sum, val) => 
      sum + Math.pow(val - mean, 2), 0);
    const residualSS = predictions.reduce((sum, pred, i) => 
      sum + Math.pow(actuals[i] - pred, 2), 0);
    const r2 = 1 - (residualSS / totalSS);
    
    return { r2 };
  }

  /**
   * Batch predict for efficiency
   */
  protected async batchPredict(features: number[][]): Promise<number[]> {
    if (!this.model) {
      throw new Error('Model not trained');
    }

    const inputTensor = tf.tensor2d(features);
    const predictions = this.model.predict(inputTensor) as tf.Tensor;
    const values = await predictions.array() as number[][];
    
    inputTensor.dispose();
    predictions.dispose();
    
    return values.map(v => v[0]); // Assuming single output
  }

  /**
   * Apply polynomial features
   */
  protected createPolynomialFeatures(
    features: number[][],
    degree: number = 2
  ): number[][] {
    const polyFeatures: number[][] = [];
    
    for (const row of features) {
      const polyRow: number[] = [...row]; // Include original features
      
      // Add polynomial terms
      if (degree >= 2) {
        // Quadratic terms
        for (let i = 0; i < row.length; i++) {
          for (let j = i; j < row.length; j++) {
            polyRow.push(row[i] * row[j]);
          }
        }
      }
      
      if (degree >= 3) {
        // Cubic terms
        for (let i = 0; i < row.length; i++) {
          polyRow.push(Math.pow(row[i], 3));
        }
      }
      
      polyFeatures.push(polyRow);
    }
    
    return polyFeatures;
  }

  /**
   * Apply feature scaling
   */
  protected scaleFeatures(
    features: number[][],
    method: 'standard' | 'minmax' = 'standard'
  ): { scaled: number[][]; params: any } {
    const numFeatures = features[0].length;
    const params: any = {};
    const scaled: number[][] = [];
    
    if (method === 'standard') {
      // Z-score normalization
      for (let i = 0; i < numFeatures; i++) {
        const values = features.map(row => row[i]);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => 
          sum + Math.pow(val - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance) || 1;
        
        params[`feature_${i}`] = { mean, std };
      }
      
      for (const row of features) {
        const scaledRow = row.map((val, i) => {
          const { mean, std } = params[`feature_${i}`];
          return (val - mean) / std;
        });
        scaled.push(scaledRow);
      }
    } else {
      // Min-max normalization
      for (let i = 0; i < numFeatures; i++) {
        const values = features.map(row => row[i]);
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        params[`feature_${i}`] = { min, max };
      }
      
      for (const row of features) {
        const scaledRow = row.map((val, i) => {
          const { min, max } = params[`feature_${i}`];
          return max !== min ? (val - min) / (max - min) : 0;
        });
        scaled.push(scaledRow);
      }
    }
    
    return { scaled, params };
  }

  /**
   * Calculate residuals
   */
  protected calculateResiduals(
    predictions: number[],
    actuals: number[]
  ): number[] {
    return predictions.map((pred, i) => actuals[i] - pred);
  }

  /**
   * Check for heteroscedasticity
   */
  protected checkHeteroscedasticity(
    predictions: number[],
    residuals: number[]
  ): boolean {
    // Simple test: check if variance of residuals correlates with predictions
    const sortedByPred = predictions
      .map((pred, i) => ({ pred, residual: residuals[i] }))
      .sort((a, b) => a.pred - b.pred);
    
    const halfPoint = Math.floor(sortedByPred.length / 2);
    const firstHalf = sortedByPred.slice(0, halfPoint);
    const secondHalf = sortedByPred.slice(halfPoint);
    
    const var1 = this.variance(firstHalf.map(item => item.residual));
    const var2 = this.variance(secondHalf.map(item => item.residual));
    
    // If variance differs significantly, heteroscedasticity is present
    return Math.abs(var1 - var2) / Math.max(var1, var2) > 0.5;
  }

  /**
   * Calculate variance
   */
  private variance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return values.reduce((sum, val) => 
      sum + Math.pow(val - mean, 2), 0) / values.length;
  }
}