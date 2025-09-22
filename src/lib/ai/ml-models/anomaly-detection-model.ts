/**
 * Anomaly Detection Model - REAL ML Implementation
 *
 * Input: Time series data
 * Output: Anomaly scores with real-time processing
 */

import { mlPipeline, MLModelConfig, MLTrainingData, MLPrediction } from './ml-pipeline';

export interface AnomalyDetectionInput {
  timeSeries: {
    timestamp: Date;
    value: number;
    metadata?: Record<string, any>;
  }[];
  context: {
    dataType: 'energy' | 'emissions' | 'production' | 'sensor' | 'financial';
    expectedRange: { min: number; max: number };
    seasonalPatterns: boolean;
    businessHours: boolean;
  };
}

export interface AnomalyDetectionResult extends MLPrediction {
  prediction: number[]; // Anomaly scores (0-1, where 1 is most anomalous)
  anomalies: {
    timestamp: Date;
    value: number;
    anomalyScore: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    explanation: string;
  }[];
  patterns: {
    periodicAnomalies: boolean;
    suddenSpikes: boolean;
    gradualDrift: boolean;
    outliers: number;
  };
  recommendations: string[];
}

export class AnomalyDetectionModel {
  private modelId = 'anomaly-detection-autoencoder';
  private isTraining = false;
  private reconstructionThreshold = 0.1;

  constructor() {
    console.log('🔍 Initializing Anomaly Detection Model...');
  }

  /**
   * Train the anomaly detection model
   */
  async train(data: AnomalyDetectionInput[]): Promise<void> {
    if (this.isTraining) {
      throw new Error('Model is already training');
    }

    console.log('🏃 Training Anomaly Detection Model with real data...');
    this.isTraining = true;

    try {
      // Prepare training data for autoencoder
      const trainingData = this.prepareTrainingData(data);

      // Model configuration for autoencoder anomaly detection
      const config: MLModelConfig = {
        modelType: 'anomalyDetection',
        inputShape: [trainingData.inputs[0].length],
        outputShape: [trainingData.inputs[0].length], // Autoencoder reconstructs input
        learningRate: 0.001,
        epochs: 200,
        batchSize: 64,
        validationSplit: 0.2
      };

      // Train the model
      const metrics = await mlPipeline.trainModel(this.modelId, config, trainingData);

      // Set threshold based on training reconstruction error
      this.reconstructionThreshold = (metrics.mae || 0.1) * 2; // 2x training MAE

      console.log(`✅ Anomaly model trained - Threshold: ${this.reconstructionThreshold.toFixed(4)}`);

    } finally {
      this.isTraining = false;
    }
  }

  /**
   * Detect anomalies in real-time
   */
  async detect(input: AnomalyDetectionInput): Promise<AnomalyDetectionResult> {
    console.log('🔍 Detecting anomalies in time series...');

    // Prepare features from time series
    const features = this.extractTimeSeriesFeatures(input);

    // Get reconstruction from autoencoder
    const prediction = await mlPipeline.predict(this.modelId, [features]);

    // Calculate reconstruction errors (anomaly scores)
    const anomalyScores = this.calculateAnomalyScores(features, prediction.prediction);

    // Identify specific anomalies
    const anomalies = this.identifyAnomalies(input, anomalyScores);

    // Analyze patterns
    const patterns = this.analyzeAnomalyPatterns(input, anomalies);

    // Generate recommendations
    const recommendations = this.generateRecommendations(anomalies, patterns, input.context);

    return {
      prediction: anomalyScores,
      confidence: prediction.confidence,
      timestamp: prediction.timestamp,
      anomalies,
      patterns,
      recommendations
    };
  }

  /**
   * Prepare training data for autoencoder
   */
  private prepareTrainingData(data: AnomalyDetectionInput[]): MLTrainingData {
    const inputs: number[][] = [];

    for (const sample of data) {
      const features = this.extractTimeSeriesFeatures(sample);
      inputs.push(features);
    }

    // For autoencoder, targets are the same as inputs (reconstruction task)
    return {
      inputs,
      targets: inputs.map(input => [...input]), // Copy inputs as targets
      features: [
        'mean', 'std', 'min', 'max', 'range', 'trend', 'seasonality',
        'autocorr_1', 'autocorr_7', 'rolling_mean', 'rolling_std'
      ],
      metadata: {
        modelType: 'anomaly-detection',
        samples: data.length,
        featureCount: 11
      }
    };
  }

  /**
   * Extract statistical features from time series
   */
  private extractTimeSeriesFeatures(input: AnomalyDetectionInput): number[] {
    const values = input.timeSeries.map(point => point.value);

    if (values.length === 0) {
      return new Array(11).fill(0);
    }

    // Basic statistics
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    // Trend calculation (simple linear regression slope)
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const xMean = (n - 1) / 2;
    const trend = x.reduce((sum, xi, i) => sum + (xi - xMean) * (values[i] - mean), 0) /
                  x.reduce((sum, xi) => sum + Math.pow(xi - xMean, 2), 0);

    // Seasonality (simplified - variance of differences)
    const diffs = values.slice(1).map((val, i) => val - values[i]);
    const seasonality = diffs.length > 0 ?
      Math.sqrt(diffs.reduce((sum, diff) => sum + diff * diff, 0) / diffs.length) : 0;

    // Autocorrelation at lag 1 and 7
    const autocorr1 = this.calculateAutocorrelation(values, 1);
    const autocorr7 = this.calculateAutocorrelation(values, 7);

    // Rolling statistics (last 10 points)
    const rollingWindow = values.slice(-10);
    const rollingMean = rollingWindow.reduce((sum, val) => sum + val, 0) / rollingWindow.length;
    const rollingStd = Math.sqrt(
      rollingWindow.reduce((sum, val) => sum + Math.pow(val - rollingMean, 2), 0) / rollingWindow.length
    );

    return [
      mean / 1000, // Normalize
      std / 1000,
      min / 1000,
      max / 1000,
      range / 1000,
      trend,
      seasonality / 1000,
      autocorr1,
      autocorr7,
      rollingMean / 1000,
      rollingStd / 1000
    ];
  }

  /**
   * Calculate autocorrelation at specific lag
   */
  private calculateAutocorrelation(values: number[], lag: number): number {
    if (values.length <= lag) return 0;

    const n = values.length - lag;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }

    for (let i = 0; i < values.length; i++) {
      denominator += Math.pow(values[i] - mean, 2);
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate anomaly scores from reconstruction errors
   */
  private calculateAnomalyScores(original: number[], reconstructed: number[]): number[] {
    const scores: number[] = [];

    for (let i = 0; i < original.length; i++) {
      const error = Math.abs(original[i] - reconstructed[i]);
      const normalizedError = error / this.reconstructionThreshold;
      scores.push(Math.min(1, normalizedError)); // Cap at 1
    }

    return scores;
  }

  /**
   * Identify specific anomalous points
   */
  private identifyAnomalies(input: AnomalyDetectionInput, scores: number[]): AnomalyDetectionResult['anomalies'] {
    const anomalies: AnomalyDetectionResult['anomalies'] = [];

    input.timeSeries.forEach((point, index) => {
      const score = scores[Math.min(index, scores.length - 1)];

      if (score > 0.5) { // Threshold for anomaly
        let severity: 'low' | 'medium' | 'high' | 'critical';
        if (score > 0.9) severity = 'critical';
        else if (score > 0.8) severity = 'high';
        else if (score > 0.65) severity = 'medium';
        else severity = 'low';

        let explanation = 'Statistical anomaly detected';
        if (point.value > input.context.expectedRange.max) {
          explanation = 'Value exceeds expected maximum';
        } else if (point.value < input.context.expectedRange.min) {
          explanation = 'Value below expected minimum';
        }

        anomalies.push({
          timestamp: point.timestamp,
          value: point.value,
          anomalyScore: score,
          severity,
          explanation
        });
      }
    });

    return anomalies;
  }

  /**
   * Analyze patterns in detected anomalies
   */
  private analyzeAnomalyPatterns(input: AnomalyDetectionInput, anomalies: AnomalyDetectionResult['anomalies']) {
    const periodicAnomalies = this.detectPeriodicAnomalies(anomalies);
    const suddenSpikes = anomalies.some(a => a.severity === 'critical');
    const gradualDrift = this.detectGradualDrift(input.timeSeries);
    const outliers = anomalies.filter(a => a.severity === 'high' || a.severity === 'critical').length;

    return {
      periodicAnomalies,
      suddenSpikes,
      gradualDrift,
      outliers
    };
  }

  /**
   * Detect if anomalies occur periodically
   */
  private detectPeriodicAnomalies(anomalies: AnomalyDetectionResult['anomalies']): boolean {
    if (anomalies.length < 3) return false;

    // Simple check: if anomalies occur at similar intervals
    const intervals: number[] = [];
    for (let i = 1; i < anomalies.length; i++) {
      const interval = anomalies[i].timestamp.getTime() - anomalies[i - 1].timestamp.getTime();
      intervals.push(interval);
    }

    // Check if intervals are similar (within 20% variance)
    const meanInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - meanInterval, 2), 0) / intervals.length;
    const cv = Math.sqrt(variance) / meanInterval; // Coefficient of variation

    return cv < 0.2; // Less than 20% variation suggests periodicity
  }

  /**
   * Detect gradual drift in the data
   */
  private detectGradualDrift(timeSeries: AnomalyDetectionInput['timeSeries']): boolean {
    if (timeSeries.length < 10) return false;

    const values = timeSeries.map(point => point.value);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstMean = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;

    const change = Math.abs(secondMean - firstMean) / firstMean;
    return change > 0.1; // 10% change suggests drift
  }

  /**
   * Generate recommendations based on anomalies
   */
  private generateRecommendations(anomalies: AnomalyDetectionResult['anomalies'], patterns: any, context: AnomalyDetectionInput['context']): string[] {
    const recommendations: string[] = [];

    if (anomalies.length === 0) {
      recommendations.push('No significant anomalies detected - system operating normally');
      return recommendations;
    }

    // High severity recommendations
    const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
    if (criticalAnomalies.length > 0) {
      recommendations.push(`${criticalAnomalies.length} critical anomalies detected - immediate investigation required`);
    }

    // Pattern-based recommendations
    if (patterns.periodicAnomalies) {
      recommendations.push('Periodic anomalies detected - check for recurring operational issues');
    }

    if (patterns.gradualDrift) {
      recommendations.push('Gradual drift detected - system calibration or maintenance may be needed');
    }

    if (patterns.suddenSpikes) {
      recommendations.push('Sudden spikes detected - investigate for equipment malfunctions or process changes');
    }

    // Context-specific recommendations
    if (context.dataType === 'energy' && anomalies.length > 5) {
      recommendations.push('Multiple energy anomalies - check HVAC systems and equipment efficiency');
    }

    if (context.dataType === 'emissions' && patterns.outliers > 2) {
      recommendations.push('Emissions outliers detected - verify measurement accuracy and process compliance');
    }

    return recommendations;
  }

  /**
   * Get model performance metrics
   */
  getPerformanceMetrics() {
    const metrics = mlPipeline.getModelMetrics(this.modelId);
    return {
      ...metrics,
      reconstructionThreshold: this.reconstructionThreshold,
      isTraining: this.isTraining
    };
  }

  /**
   * Get model status
   */
  getStatus() {
    return {
      modelId: this.modelId,
      isTraining: this.isTraining,
      threshold: this.reconstructionThreshold,
      lastTrained: mlPipeline.getModelMetrics(this.modelId)?.lastTrained
    };
  }
}

// Export singleton instance
export const anomalyDetectionModel = new AnomalyDetectionModel();