/**
 * Enhanced Anomaly Detection System for Phase 5
 * Combines Isolation Forest, AutoEncoder, and ensemble methods
 */

import * as tf from '@tensorflow/tfjs-node';
import { MetricData } from './types';

interface AnomalyResult {
  timestamp: Date;
  anomalyScore: number;
  isAnomaly: boolean;
  method: string;
  features: number[];
  explanation?: AnomalyExplanation;
}

interface AnomalyExplanation {
  mainFactors: Array<{ feature: string; contribution: number }>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  similarHistoricalEvents: Array<{ timestamp: Date; similarity: number }>;
  recommendedActions: string[];
}

interface AnomalyConfig {
  methods?: ('isolation_forest' | 'autoencoder' | 'ensemble')[];
  threshold?: number;
  isolationForest?: {
    nEstimators: number;
    maxSamples: number;
    contamination: number;
  };
  autoencoder?: {
    encoderUnits: number[];
    decoderUnits: number[];
    latentDim: number;
    epochs: number;
  };
}

class IsolationForest {
  private nEstimators: number;
  private maxSamples: number;
  private contamination: number;
  private trees: any[] = [];
  private trained: boolean = false;

  constructor(config: { nEstimators: number; maxSamples: number; contamination: number }) {
    this.nEstimators = config.nEstimators;
    this.maxSamples = config.maxSamples;
    this.contamination = config.contamination;
  }

  async fit(data: number[][]): Promise<void> {
    console.log('🌲 Training Isolation Forest...');
    
    this.trees = [];
    const sampleSize = Math.min(this.maxSamples, data.length);
    
    for (let i = 0; i < this.nEstimators; i++) {
      // Sample data for this tree
      const sampledData = this.sampleData(data, sampleSize);
      const tree = this.buildTree(sampledData, 0, Math.ceil(Math.log2(sampleSize)));
      this.trees.push(tree);
    }
    
    this.trained = true;
    console.log(`✅ Isolation Forest trained with ${this.nEstimators} trees`);
  }

  async detect(data: number[][]): Promise<AnomalyResult[]> {
    if (!this.trained) {
      throw new Error('Isolation Forest not trained');
    }

    const results: AnomalyResult[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      const anomalyScore = this.calculateAnomalyScore(point);
      const isAnomaly = anomalyScore > this.contamination;
      
      results.push({
        timestamp: new Date(),
        anomalyScore,
        isAnomaly,
        method: 'isolation_forest',
        features: point
      });
    }
    
    return results;
  }

  async scoreAll(data: number[][]): Promise<number[]> {
    return data.map(point => this.calculateAnomalyScore(point));
  }

  private sampleData(data: number[][], sampleSize: number): number[][] {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, sampleSize);
  }

  private buildTree(data: number[][], depth: number, maxDepth: number): any {
    if (data.length <= 1 || depth >= maxDepth) {
      return { type: 'leaf', size: data.length };
    }

    // Random feature selection
    const featureIndex = Math.floor(Math.random() * data[0].length);
    const featureValues = data.map(point => point[featureIndex]);
    const minValue = Math.min(...featureValues);
    const maxValue = Math.max(...featureValues);
    
    if (minValue === maxValue) {
      return { type: 'leaf', size: data.length };
    }

    const splitValue = minValue + Math.random() * (maxValue - minValue);
    
    const leftData = data.filter(point => point[featureIndex] < splitValue);
    const rightData = data.filter(point => point[featureIndex] >= splitValue);
    
    return {
      type: 'node',
      featureIndex,
      splitValue,
      left: this.buildTree(leftData, depth + 1, maxDepth),
      right: this.buildTree(rightData, depth + 1, maxDepth)
    };
  }

  private calculateAnomalyScore(point: number[]): number {
    let totalPathLength = 0;
    
    for (const tree of this.trees) {
      totalPathLength += this.getPathLength(point, tree, 0);
    }
    
    const avgPathLength = totalPathLength / this.trees.length;
    const expectedPathLength = 2 * (Math.log(this.maxSamples - 1) + 0.5772156649) - (2 * (this.maxSamples - 1) / this.maxSamples);
    
    return Math.pow(2, -avgPathLength / expectedPathLength);
  }

  private getPathLength(point: number[], tree: any, depth: number): number {
    if (tree.type === 'leaf') {
      return depth + this.averagePathLength(tree.size);
    }
    
    if (point[tree.featureIndex] < tree.splitValue) {
      return this.getPathLength(point, tree.left, depth + 1);
    } else {
      return this.getPathLength(point, tree.right, depth + 1);
    }
  }

  private averagePathLength(n: number): number {
    if (n <= 1) return 0;
    return 2 * (Math.log(n - 1) + 0.5772156649) - 2 * (n - 1) / n;
  }
}

class AutoEncoder {
  private encoder: tf.LayersModel | null = null;
  private decoder: tf.LayersModel | null = null;
  private autoencoder: tf.LayersModel | null = null;
  private trained: boolean = false;
  private threshold: number = 0;
  private config: AnomalyConfig['autoencoder'];

  constructor(config: AnomalyConfig['autoencoder'] = {
    encoderUnits: [64, 32, 16],
    decoderUnits: [16, 32, 64],
    latentDim: 8,
    epochs: 100
  }) {
    this.config = config;
  }

  async build(inputDim: number): Promise<void> {
    console.log('🧠 Building AutoEncoder architecture...');
    
    // Input layer
    const input = tf.input({ shape: [inputDim] });
    
    // Encoder
    let encoded = input;
    for (const units of this.config.encoderUnits) {
      encoded = tf.layers.dense({ units, activation: 'relu' }).apply(encoded) as tf.SymbolicTensor;
    }
    
    // Latent space
    const latent = tf.layers.dense({ units: this.config.latentDim, activation: 'relu' }).apply(encoded) as tf.SymbolicTensor;
    
    // Decoder
    let decoded = latent;
    for (const units of this.config.decoderUnits) {
      decoded = tf.layers.dense({ units, activation: 'relu' }).apply(decoded) as tf.SymbolicTensor;
    }
    
    // Output layer
    const output = tf.layers.dense({ units: inputDim }).apply(decoded) as tf.SymbolicTensor;
    
    // Create models
    this.encoder = tf.model({ inputs: input, outputs: latent });
    this.autoencoder = tf.model({ inputs: input, outputs: output });
    
    // Compile autoencoder
    this.autoencoder.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    
    console.log('✅ AutoEncoder architecture built');
  }

  async fit(data: number[][]): Promise<void> {
    if (!this.autoencoder) {
      await this.build(data[0].length);
    }

    console.log('🧠 Training AutoEncoder...');
    
    const xTrain = tf.tensor2d(data);
    
    // Train to reconstruct input
    const history = await this.autoencoder!.fit(xTrain, xTrain, {
      epochs: this.config.epochs,
      batchSize: 32,
      validationSplit: 0.2,
      shuffle: true,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 20 === 0) {
            console.log(`Epoch ${epoch}: loss=${logs?.loss?.toFixed(4)}, val_loss=${logs?.val_loss?.toFixed(4)}`);
          }
        }
      }
    });
    
    // Calculate reconstruction errors for threshold
    const predictions = this.autoencoder!.predict(xTrain) as tf.Tensor;
    const reconstructionErrors = tf.losses.meanSquaredError(xTrain, predictions);
    const errors = await reconstructionErrors.data();
    
    // Set threshold at 95th percentile
    const sortedErrors = Array.from(errors).sort((a, b) => a - b);
    this.threshold = sortedErrors[Math.floor(sortedErrors.length * 0.95)];
    
    // Cleanup
    xTrain.dispose();
    predictions.dispose();
    reconstructionErrors.dispose();
    
    this.trained = true;
    console.log(`✅ AutoEncoder trained with threshold: ${this.threshold.toFixed(4)}`);
  }

  async detect(data: number[][]): Promise<AnomalyResult[]> {
    if (!this.trained || !this.autoencoder) {
      throw new Error('AutoEncoder not trained');
    }

    const xTest = tf.tensor2d(data);
    const predictions = this.autoencoder.predict(xTest) as tf.Tensor;
    const reconstructionErrors = tf.losses.meanSquaredError(xTest, predictions);
    const errors = await reconstructionErrors.data();
    
    const results: AnomalyResult[] = [];
    
    for (let i = 0; i < data.length; i++) {
      const error = errors[i];
      const anomalyScore = Math.min(error / this.threshold, 1);
      const isAnomaly = error > this.threshold;
      
      results.push({
        timestamp: new Date(),
        anomalyScore,
        isAnomaly,
        method: 'autoencoder',
        features: data[i]
      });
    }
    
    // Cleanup
    xTest.dispose();
    predictions.dispose();
    reconstructionErrors.dispose();
    
    return results;
  }
}

export class AnomalyDetectionModel {
  private isolationForest: IsolationForest;
  private autoEncoder: AutoEncoder;
  private config: AnomalyConfig;
  private trained: boolean = false;
  private featureNames: string[] = [];

  constructor(config: AnomalyConfig = {}) {
    this.config = {
      methods: ['ensemble'],
      threshold: 0.95,
      isolationForest: {
        nEstimators: 100,
        maxSamples: 256,
        contamination: 0.1
      },
      autoencoder: {
        encoderUnits: [64, 32, 16],
        decoderUnits: [16, 32, 64],
        latentDim: 8,
        epochs: 100
      },
      ...config
    };
    
    this.isolationForest = new IsolationForest(this.config.isolationForest!);
    this.autoEncoder = new AutoEncoder(this.config.autoencoder!);
  }

  /**
   * Train all anomaly detection models
   */
  async trainModels(data: MetricData[]): Promise<{ trained: boolean; threshold: number }> {
    console.log('🔍 Training anomaly detection models...');
    
    // Convert metric data to feature matrix
    const features = this.convertMetricDataToFeatures(data);
    
    // Train Isolation Forest
    if (this.config.methods!.includes('isolation_forest') || this.config.methods!.includes('ensemble')) {
      await this.isolationForest.fit(features);
    }
    
    // Train AutoEncoder
    if (this.config.methods!.includes('autoencoder') || this.config.methods!.includes('ensemble')) {
      await this.autoEncoder.fit(features);
    }
    
    this.trained = true;
    console.log('✅ Anomaly detection models trained successfully');
    
    return {
      trained: true,
      threshold: this.config.threshold!
    };
  }

  /**
   * Detect anomalies in new data
   */
  async detectAnomalies(
    data: MetricData[],
    method: 'isolation_forest' | 'autoencoder' | 'ensemble' = 'ensemble'
  ): Promise<AnomalyResult[]> {
    if (!this.trained) {
      throw new Error('Models not trained. Call trainModels() first.');
    }

    const features = this.convertMetricDataToFeatures(data);
    let results: AnomalyResult[] = [];
    
    if (method === 'isolation_forest') {
      results = await this.isolationForest.detect(features);
    } else if (method === 'autoencoder') {
      results = await this.autoEncoder.detect(features);
    } else if (method === 'ensemble') {
      // Get results from both methods
      const ifResults = await this.isolationForest.detect(features);
      const aeResults = await this.autoEncoder.detect(features);
      
      // Ensemble results
      results = this.ensembleResults(ifResults, aeResults);
    }
    
    // Add explanations to high-confidence anomalies
    for (const result of results) {
      if (result.isAnomaly && result.anomalyScore > 0.7) {
        result.explanation = await this.explainAnomaly(result, data);
      }
    }
    
    return results;
  }

  /**
   * Get model performance metrics
   */
  getMetrics(): {
    trained: boolean;
    methods: string[];
    threshold: number;
  } {
    return {
      trained: this.trained,
      methods: this.config.methods!,
      threshold: this.config.threshold!
    };
  }

  /**
   * Check if model is trained
   */
  isTrained(): boolean {
    return this.trained;
  }

  // Private helper methods
  
  private convertMetricDataToFeatures(data: MetricData[]): number[][] {
    // Group by timestamp and create feature vectors
    const timestampGroups = new Map<string, MetricData[]>();
    
    for (const metric of data) {
      const timestamp = metric.timestamp.toISOString();
      if (!timestampGroups.has(timestamp)) {
        timestampGroups.set(timestamp, []);
      }
      timestampGroups.get(timestamp)!.push(metric);
    }
    
    const features: number[][] = [];
    this.featureNames = [];
    
    for (const [timestamp, metrics] of Array.from(timestampGroups.entries())) {
      const featureVector: number[] = [];
      
      // Create features from metrics
      for (const metric of metrics) {
        featureVector.push(metric.value);
        if (features.length === 0) {
          this.featureNames.push(`${metric.metricName}_${metric.dimensions.source || 'default'}`);
        }
      }
      
      // Add time-based features
      const date = new Date(timestamp);
      featureVector.push(
        date.getHours(),
        date.getDay(),
        date.getDate(),
        date.getMonth()
      );
      
      if (features.length === 0) {
        this.featureNames.push('hour', 'day_of_week', 'day_of_month', 'month');
      }
      
      features.push(featureVector);
    }
    
    return features;
  }

  private ensembleResults(ifResults: AnomalyResult[], aeResults: AnomalyResult[]): AnomalyResult[] {
    const ensembleResults: AnomalyResult[] = [];
    
    for (let i = 0; i < ifResults.length; i++) {
      const ifResult = ifResults[i];
      const aeResult = aeResults[i];
      
      // Weighted average of anomaly scores
      const ensembleScore = (ifResult.anomalyScore * 0.6) + (aeResult.anomalyScore * 0.4);
      const isAnomaly = ensembleScore > this.config.threshold!;
      
      ensembleResults.push({
        timestamp: ifResult.timestamp,
        anomalyScore: ensembleScore,
        isAnomaly,
        method: 'ensemble',
        features: ifResult.features
      });
    }
    
    return ensembleResults;
  }

  private async explainAnomaly(anomaly: AnomalyResult, originalData: MetricData[]): Promise<AnomalyExplanation> {
    // Calculate feature contributions (simplified SHAP-like approach)
    const contributions = anomaly.features.map((value, i) => {
      const featureName = this.featureNames[i] || `feature_${i}`;
      // Simplified contribution calculation
      const avgValue = this.calculateFeatureAverage(i, originalData);
      const deviation = Math.abs(value - avgValue) / (avgValue || 1);
      
      return {
        feature: featureName,
        contribution: deviation
      };
    });
    
    // Sort by contribution and take top factors
    const mainFactors = contributions
      .sort((a, b) => b.contribution - a.contribution)
      .slice(0, 3);
    
    // Determine severity
    const severity = this.calculateSeverity(anomaly.anomalyScore);
    
    // Generate recommendations
    const recommendedActions = this.generateRecommendations(anomaly, mainFactors);
    
    return {
      mainFactors,
      severity,
      similarHistoricalEvents: [], // Could be implemented with historical data
      recommendedActions
    };
  }

  private calculateFeatureAverage(featureIndex: number, data: MetricData[]): number {
    // Simplified average calculation
    const values = data.map(d => d.value);
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateSeverity(anomalyScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (anomalyScore >= 0.9) return 'critical';
    if (anomalyScore >= 0.7) return 'high';
    if (anomalyScore >= 0.5) return 'medium';
    return 'low';
  }

  private generateRecommendations(anomaly: AnomalyResult, factors: Array<{ feature: string; contribution: number }>): string[] {
    const recommendations: string[] = [];
    
    // Generate recommendations based on top factors
    for (const factor of factors.slice(0, 2)) {
      if (factor.feature.includes('emissions')) {
        recommendations.push('Review emissions sources and implement reduction measures');
      } else if (factor.feature.includes('energy')) {
        recommendations.push('Investigate energy consumption patterns and optimize usage');
      } else if (factor.feature.includes('temperature') || factor.feature.includes('weather')) {
        recommendations.push('Consider weather-related impacts on operations');
      } else {
        recommendations.push(`Monitor and investigate ${factor.feature} variations`);
      }
    }
    
    // General recommendations based on severity
    if (anomaly.anomalyScore >= 0.8) {
      recommendations.push('Immediate investigation required - potential system issue');
      recommendations.push('Alert relevant stakeholders and prepare contingency plans');
    } else if (anomaly.anomalyScore >= 0.6) {
      recommendations.push('Schedule detailed analysis within 24 hours');
    }
    
    return recommendations;
  }

  /**
   * Dispose of model resources
   */
  dispose(): void {
    if (this.autoEncoder && (this.autoEncoder as any).autoencoder) {
      (this.autoEncoder as any).autoencoder.dispose();
    }
    if (this.autoEncoder && (this.autoEncoder as any).encoder) {
      (this.autoEncoder as any).encoder.dispose();
    }
  }
}
