/**
 * Classification Model Base Class
 * Foundation for classification-based ML models
 */

import * as tf from '@tensorflow/tfjs-node';
import { BaseModel } from './base-model';
import { TrainingData, Prediction } from '../types';

export abstract class ClassificationModel extends BaseModel {
  protected numClasses: number;
  protected classNames?: string[];
  protected threshold: number;

  constructor(config: any) {
    super(config);
    this.numClasses = config.numClasses || 2;
    this.classNames = config.classNames;
    this.threshold = config.threshold || 0.5;
  }

  /**
   * Calculate classification metrics
   */
  protected calculateClassificationMetrics(
    predictions: number[],
    actuals: number[],
    threshold: number = this.threshold
  ): {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    confusionMatrix: number[][];
  } {
    // For binary classification
    const predictedClasses = predictions.map(p => p >= threshold ? 1 : 0);
    
    let truePositives = 0;
    let trueNegatives = 0;
    let falsePositives = 0;
    let falseNegatives = 0;
    
    for (let i = 0; i < predictedClasses.length; i++) {
      if (predictedClasses[i] === 1 && actuals[i] === 1) {
        truePositives++;
      } else if (predictedClasses[i] === 0 && actuals[i] === 0) {
        trueNegatives++;
      } else if (predictedClasses[i] === 1 && actuals[i] === 0) {
        falsePositives++;
      } else {
        falseNegatives++;
      }
    }
    
    const accuracy = (truePositives + trueNegatives) / predictions.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;
    
    const confusionMatrix = [
      [trueNegatives, falsePositives],
      [falseNegatives, truePositives]
    ];
    
    return { accuracy, precision, recall, f1Score, confusionMatrix };
  }

  /**
   * Calculate ROC curve points
   */
  protected calculateROCCurve(
    predictions: number[],
    actuals: number[]
  ): { fpr: number[]; tpr: number[]; auc: number } {
    const thresholds = Array.from({ length: 101 }, (_, i) => i / 100);
    const fpr: number[] = [];
    const tpr: number[] = [];
    
    for (const threshold of thresholds) {
      const metrics = this.calculateClassificationMetrics(
        predictions,
        actuals,
        threshold
      );
      
      const falsePositiveRate = 
        metrics.confusionMatrix[0][1] / 
        (metrics.confusionMatrix[0][0] + metrics.confusionMatrix[0][1]);
      
      const truePositiveRate = metrics.recall;
      
      fpr.push(falsePositiveRate);
      tpr.push(truePositiveRate);
    }
    
    // Calculate AUC using trapezoidal rule
    let auc = 0;
    for (let i = 1; i < fpr.length; i++) {
      auc += (fpr[i] - fpr[i - 1]) * (tpr[i] + tpr[i - 1]) / 2;
    }
    
    return { fpr, tpr, auc };
  }

  /**
   * Apply class weights for imbalanced datasets
   */
  protected calculateClassWeights(labels: number[]): Record<number, number> {
    const classCounts: Record<number, number> = {};
    
    // Count occurrences of each class
    for (const label of labels) {
      classCounts[label] = (classCounts[label] || 0) + 1;
    }
    
    const totalSamples = labels.length;
    const numClasses = Object.keys(classCounts).length;
    const weights: Record<number, number> = {};
    
    // Calculate balanced weights
    for (const [classLabel, count] of Object.entries(classCounts)) {
      weights[Number(classLabel)] = totalSamples / (numClasses * count);
    }
    
    return weights;
  }

  /**
   * Apply SMOTE (Synthetic Minority Over-sampling Technique)
   */
  protected applySMOTE(
    features: number[][],
    labels: number[],
    targetRatio: number = 1.0
  ): { features: number[][]; labels: number[] } {
    // Separate classes
    const classIndices: Record<number, number[]> = {};
    labels.forEach((label, idx) => {
      if (!classIndices[label]) {
        classIndices[label] = [];
      }
      classIndices[label].push(idx);
    });
    
    // Find minority and majority classes
    const classCounts = Object.entries(classIndices)
      .map(([label, indices]) => ({ label: Number(label), count: indices.length }))
      .sort((a, b) => a.count - b.count);
    
    const minorityClass = classCounts[0];
    const majorityClass = classCounts[classCounts.length - 1];
    
    // Calculate how many synthetic samples to generate
    const targetCount = Math.floor(majorityClass.count * targetRatio);
    const samplesToGenerate = targetCount - minorityClass.count;
    
    if (samplesToGenerate <= 0) {
      return { features, labels };
    }
    
    // Generate synthetic samples
    const newFeatures: number[][] = [...features];
    const newLabels: number[] = [...labels];
    
    const minorityFeatures = classIndices[minorityClass.label]
      .map(idx => features[idx]);
    
    for (let i = 0; i < samplesToGenerate; i++) {
      // Select random minority sample
      const idx1 = Math.floor(Math.random() * minorityFeatures.length);
      const sample1 = minorityFeatures[idx1];
      
      // Find k nearest neighbors (simplified: random selection)
      const idx2 = Math.floor(Math.random() * minorityFeatures.length);
      const sample2 = minorityFeatures[idx2];
      
      // Generate synthetic sample
      const alpha = Math.random();
      const synthetic = sample1.map((val, j) => 
        val + alpha * (sample2[j] - val)
      );
      
      newFeatures.push(synthetic);
      newLabels.push(minorityClass.label);
    }
    
    return { features: newFeatures, labels: newLabels };
  }

  /**
   * Calculate optimal threshold using validation data
   */
  protected findOptimalThreshold(
    predictions: number[],
    actuals: number[],
    metric: 'f1' | 'accuracy' | 'balanced' = 'f1'
  ): number {
    let bestThreshold = 0.5;
    let bestScore = 0;
    
    for (let threshold = 0.1; threshold <= 0.9; threshold += 0.05) {
      const metrics = this.calculateClassificationMetrics(
        predictions,
        actuals,
        threshold
      );
      
      let score: number;
      switch (metric) {
        case 'f1':
          score = metrics.f1Score;
          break;
        case 'accuracy':
          score = metrics.accuracy;
          break;
        case 'balanced':
          score = (metrics.precision + metrics.recall) / 2;
          break;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestThreshold = threshold;
      }
    }
    
    return bestThreshold;
  }

  /**
   * Apply calibration to improve probability estimates
   */
  protected calibrateProbabilities(
    probabilities: number[],
    actuals: number[],
    method: 'platt' | 'isotonic' = 'platt'
  ): number[] {
    if (method === 'platt') {
      // Platt scaling: fit sigmoid to probabilities
      // Simplified implementation
      const sorted = probabilities
        .map((p, i) => ({ prob: p, actual: actuals[i] }))
        .sort((a, b) => a.prob - b.prob);
      
      // Find parameters that best fit sigmoid
      const a = 1; // Simplified: should be optimized
      const b = 0; // Simplified: should be optimized
      
      return probabilities.map(p => 1 / (1 + Math.exp(a * p + b)));
    } else {
      // Isotonic regression
      // Simplified: just return original probabilities
      return probabilities;
    }
  }
}