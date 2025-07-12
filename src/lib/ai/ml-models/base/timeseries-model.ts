/**
 * Time Series Model Base Class
 * Foundation for time series prediction models
 */

import * as tf from '@tensorflow/tfjs-node';
import { BaseModel } from './base-model';
import { TrainingData, Prediction } from '../types';

export interface TimeSeriesConfig {
  sequenceLength: number;
  features: number;
  horizon: number;
  seasonality?: number;
}

export abstract class TimeSeriesModel extends BaseModel {
  protected sequenceLength: number;
  protected features: number;
  protected horizon: number;
  protected seasonality?: number;
  protected scalers: Map<string, { mean: number; std: number }> = new Map();

  constructor(config: any) {
    super(config);
    this.sequenceLength = config.sequenceLength || 30;
    this.features = config.features || 10;
    this.horizon = config.horizon || 7;
    this.seasonality = config.seasonality;
  }

  /**
   * Create sequences from time series data
   */
  protected createSequences(
    data: number[][], 
    sequenceLength: number
  ): number[][][] {
    const sequences: number[][][] = [];
    
    for (let i = 0; i <= data.length - sequenceLength; i++) {
      sequences.push(data.slice(i, i + sequenceLength));
    }
    
    return sequences;
  }

  /**
   * Normalize features using z-score normalization
   */
  protected normalizeFeatures(features: number[][]): number[][] {
    const normalized: number[][] = [];
    const numFeatures = features[0].length;
    
    // Calculate mean and std for each feature
    for (let featureIdx = 0; featureIdx < numFeatures; featureIdx++) {
      const values = features.map(row => row[featureIdx]);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => 
        sum + Math.pow(val - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance) || 1; // Avoid division by zero
      
      this.scalers.set(`feature_${featureIdx}`, { mean, std });
    }
    
    // Normalize data
    for (const row of features) {
      const normalizedRow: number[] = [];
      for (let i = 0; i < row.length; i++) {
        const scaler = this.scalers.get(`feature_${i}`)!;
        normalizedRow.push((row[i] - scaler.mean) / scaler.std);
      }
      normalized.push(normalizedRow);
    }
    
    return normalized;
  }

  /**
   * Denormalize predictions
   */
  protected denormalizePredictions(
    predictions: number[], 
    featureIdx: number = 0
  ): number[] {
    const scaler = this.scalers.get(`feature_${featureIdx}`);
    if (!scaler) return predictions;
    
    return predictions.map(pred => pred * scaler.std + scaler.mean);
  }

  /**
   * Apply exponential smoothing
   */
  protected exponentialSmoothing(
    data: number[], 
    alpha: number = 0.3
  ): number[] {
    const smoothed: number[] = [data[0]];
    
    for (let i = 1; i < data.length; i++) {
      smoothed.push(alpha * data[i] + (1 - alpha) * smoothed[i - 1]);
    }
    
    return smoothed;
  }

  /**
   * Detect seasonality using autocorrelation
   */
  protected detectSeasonality(data: number[]): number {
    const maxLag = Math.min(data.length / 2, 365); // Max 1 year
    let maxCorrelation = 0;
    let bestLag = 0;
    
    for (let lag = 1; lag < maxLag; lag++) {
      const correlation = this.autocorrelation(data, lag);
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestLag = lag;
      }
    }
    
    return bestLag;
  }

  /**
   * Calculate autocorrelation for a given lag
   */
  private autocorrelation(data: number[], lag: number): number {
    const n = data.length - lag;
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (data[i] - mean) * (data[i + lag] - mean);
    }
    
    for (let i = 0; i < data.length; i++) {
      denominator += Math.pow(data[i] - mean, 2);
    }
    
    return numerator / denominator;
  }

  /**
   * Add trend component to predictions
   */
  protected addTrend(
    predictions: number[], 
    historicalData: number[]
  ): number[] {
    // Calculate linear trend from historical data
    const n = historicalData.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    // Linear regression to find trend
    const sumX = indices.reduce((sum, x) => sum + x, 0);
    const sumY = historicalData.reduce((sum, y) => sum + y, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * historicalData[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Apply trend to predictions
    return predictions.map((pred, i) => pred + slope * (n + i));
  }

  /**
   * Calculate prediction intervals
   */
  protected calculatePredictionIntervals(
    predictions: number[], 
    confidence: number = 0.95
  ): Array<[number, number]> {
    // Calculate standard error (placeholder - should be from model)
    const stdError = 10; // This should come from model validation
    
    // Calculate z-score for confidence level
    const zScore = this.getZScore(confidence);
    
    return predictions.map(pred => [
      pred - zScore * stdError,
      pred + zScore * stdError
    ]);
  }

  /**
   * Get z-score for confidence level
   */
  private getZScore(confidence: number): number {
    const zScores: Record<number, number> = {
      0.90: 1.645,
      0.95: 1.96,
      0.99: 2.576
    };
    
    return zScores[confidence] || 1.96;
  }

  /**
   * Split data into train/validation/test sets
   */
  protected splitData(
    data: any[], 
    splits: number[] = [0.7, 0.15, 0.15]
  ): { train: any[]; validation: any[]; test: any[] } {
    const n = data.length;
    const trainEnd = Math.floor(n * splits[0]);
    const valEnd = trainEnd + Math.floor(n * splits[1]);
    
    return {
      train: data.slice(0, trainEnd),
      validation: data.slice(trainEnd, valEnd),
      test: data.slice(valEnd)
    };
  }

  /**
   * Apply data augmentation for time series
   */
  protected augmentData(sequences: number[][][]): number[][][] {
    const augmented: number[][][] = [...sequences];
    
    // Add noise
    for (const sequence of sequences) {
      const noisy = sequence.map(step => 
        step.map(val => val + (Math.random() - 0.5) * 0.1)
      );
      augmented.push(noisy);
    }
    
    // Time warping
    for (const sequence of sequences) {
      if (Math.random() > 0.5) {
        const warped = this.timeWarp(sequence);
        augmented.push(warped);
      }
    }
    
    return augmented;
  }

  /**
   * Apply time warping augmentation
   */
  private timeWarp(sequence: number[][]): number[][] {
    const warpFactor = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
    const newLength = Math.floor(sequence.length * warpFactor);
    const warped: number[][] = [];
    
    for (let i = 0; i < newLength; i++) {
      const oldIdx = Math.floor(i / warpFactor);
      if (oldIdx < sequence.length) {
        warped.push(sequence[oldIdx]);
      }
    }
    
    // Pad or trim to original length
    while (warped.length < sequence.length) {
      warped.push(warped[warped.length - 1]);
    }
    
    return warped.slice(0, sequence.length);
  }
}