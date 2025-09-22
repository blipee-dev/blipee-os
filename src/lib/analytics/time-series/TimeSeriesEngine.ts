import * as tf from '@tensorflow/tfjs';
import * as ss from 'simple-statistics';
import { Matrix } from 'ml-matrix';

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface Forecast {
  timestamp: Date;
  predicted: number;
  lower: number;
  upper: number;
  confidence: number;
}

export interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: number;
  changeRate: number;
  seasonality: SeasonalPattern[];
  outliers: TimeSeriesData[];
}

export interface SeasonalPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  strength: number;
  peakPeriods: string[];
  troughPeriods: string[];
}

export interface ARIMAParams {
  p: number; // Autoregressive order
  d: number; // Differencing order
  q: number; // Moving average order
  seasonalP?: number;
  seasonalD?: number;
  seasonalQ?: number;
  seasonalPeriod?: number;
}

export class TimeSeriesEngine {
  private model: tf.LayersModel | null = null;
  private modelId: string = '';
  private scalerMean: number = 0;
  private scalerStd: number = 1;

  /**
   * Perform ARIMA-like time series forecasting using LSTM
   */
  async forecast(
    data: TimeSeriesData[],
    periods: number,
    params?: ARIMAParams
  ): Promise<Forecast[]> {
    if (data.length < 10) {
      throw new Error('Insufficient data for forecasting (minimum 10 points)');
    }

    // Extract values and normalize
    const values = data.map(d => d.value);
    const normalized = this.normalize(values);

    // Create sequences for LSTM
    const sequenceLength = Math.min(params?.p || 10, Math.floor(values.length / 2));
    const { inputs, outputs } = this.createSequences(normalized, sequenceLength);

    // Build or reuse LSTM model (with cleanup)
    const newModelId = `lstm-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    if (this.model && this.modelId !== newModelId) {
      // Dispose old model to prevent variable registration conflicts
      this.model.dispose();
      this.model = null;
    }

    if (!this.model) {
      this.modelId = newModelId;
      this.model = await this.buildLSTMModel(sequenceLength, newModelId);
    }

    // Train model
    // Ensure inputs is properly shaped for tensor3d
    const reshapedInputs = inputs.map(seq => seq.map(val => [val]));
    const inputTensor = tf.tensor3d(reshapedInputs);
    const outputTensor = tf.tensor2d(outputs, [outputs.length, 1]);

    await this.model.fit(inputTensor, outputTensor, {
      epochs: 50,
      batchSize: 32,
      verbose: 0,
      callbacks: {
        onEpochEnd: async (epoch, logs) => {
          // Silent training
        }
      }
    });

    // Generate forecasts
    const forecasts: Forecast[] = [];
    let lastSequence = inputs[inputs.length - 1];
    const lastDate = data[data.length - 1].timestamp;

    for (let i = 0; i < periods; i++) {
      const reshapedSeq = lastSequence.map(val => [val]);
      const input = tf.tensor3d([reshapedSeq]);
      const prediction = this.model.predict(input) as tf.Tensor;
      const predictedValue = (await prediction.data())[0];

      // Denormalize
      const actualValue = this.denormalize([predictedValue])[0];

      // Calculate confidence intervals (using standard deviation)
      const std = ss.standardDeviation(values) * (1 + i * 0.05); // Wider intervals for further predictions
      const confidence = Math.max(0.95 - i * 0.02, 0.7); // Decreasing confidence

      // Add forecast
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i + 1);

      forecasts.push({
        timestamp: forecastDate,
        predicted: actualValue,
        lower: actualValue - 1.96 * std,
        upper: actualValue + 1.96 * std,
        confidence
      });

      // Update sequence for next prediction
      lastSequence = [...lastSequence.slice(1), predictedValue];

      // Clean up tensors
      input.dispose();
      prediction.dispose();
    }

    // Clean up
    inputTensor.dispose();
    outputTensor.dispose();

    return forecasts;
  }

  /**
   * Analyze trend in time series data
   */
  analyzeTrend(data: TimeSeriesData[]): TrendAnalysis {
    const values = data.map(d => d.value);

    // Linear regression for trend
    const indices = Array.from({ length: values.length }, (_, i) => i);
    const regression = ss.linearRegression([indices, values]);
    const slope = regression.m;

    // Determine trend direction
    let direction: 'increasing' | 'decreasing' | 'stable';
    if (Math.abs(slope) < 0.01 * ss.mean(values)) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'increasing';
    } else {
      direction = 'decreasing';
    }

    // Calculate strength (R-squared)
    const predicted = indices.map(x => regression.m * x + regression.b);
    const strength = this.calculateRSquared(values, predicted);

    // Detect seasonality
    const seasonality = this.detectSeasonality(data);

    // Find outliers
    const outliers = this.detectOutliers(data);

    return {
      direction,
      strength,
      changeRate: slope,
      seasonality,
      outliers
    };
  }

  /**
   * Seasonal decomposition (simplified STL decomposition)
   */
  decomposeTimeSeries(data: TimeSeriesData[]): {
    trend: number[];
    seasonal: number[];
    residual: number[];
  } {
    const values = data.map(d => d.value);
    const n = values.length;

    // Moving average for trend (window = 7 for weekly pattern)
    const windowSize = Math.min(7, Math.floor(n / 2));
    const trend = this.movingAverage(values, windowSize);

    // Detrended values
    const detrended = values.map((v, i) => v - trend[i]);

    // Seasonal component (average by period)
    const period = this.findOptimalPeriod(detrended);
    const seasonal = this.extractSeasonalComponent(detrended, period);

    // Residual
    const residual = values.map((v, i) => v - trend[i] - seasonal[i]);

    return { trend, seasonal, residual };
  }

  /**
   * Perform autocorrelation analysis
   */
  autocorrelation(data: number[], maxLag: number = 40): number[] {
    const mean = ss.mean(data);
    const variance = ss.variance(data);
    const n = data.length;
    const acf: number[] = [];

    for (let lag = 0; lag <= maxLag && lag < n; lag++) {
      let sum = 0;
      for (let i = 0; i < n - lag; i++) {
        sum += (data[i] - mean) * (data[i + lag] - mean);
      }
      acf.push(sum / ((n - lag) * variance));
    }

    return acf;
  }

  /**
   * Perform Augmented Dickey-Fuller test for stationarity
   */
  isStationary(data: number[], significance: number = 0.05): boolean {
    // Simplified stationarity test using variance ratio
    const n = data.length;
    const halfN = Math.floor(n / 2);

    const firstHalf = data.slice(0, halfN);
    const secondHalf = data.slice(halfN);

    const var1 = ss.variance(firstHalf);
    const var2 = ss.variance(secondHalf);

    const mean1 = ss.mean(firstHalf);
    const mean2 = ss.mean(secondHalf);

    // Check if variance and mean are relatively stable
    const varianceRatio = Math.max(var1, var2) / Math.min(var1, var2);
    const meanDiff = Math.abs(mean1 - mean2) / ss.mean(data);

    return varianceRatio < 2 && meanDiff < 0.1;
  }

  /**
   * Differencing to achieve stationarity
   */
  difference(data: number[], order: number = 1): number[] {
    let result = [...data];

    for (let i = 0; i < order; i++) {
      const diffed: number[] = [];
      for (let j = 1; j < result.length; j++) {
        diffed.push(result[j] - result[j - 1]);
      }
      result = diffed;
    }

    return result;
  }

  /**
   * Moving average smoothing
   */
  movingAverage(data: number[], window: number): number[] {
    const result: number[] = [];

    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(window / 2));
      const end = Math.min(data.length, i + Math.floor(window / 2) + 1);
      const subset = data.slice(start, end);
      result.push(ss.mean(subset));
    }

    return result;
  }

  /**
   * Exponential smoothing (Holt-Winters)
   */
  exponentialSmoothing(
    data: number[],
    alpha: number = 0.3,
    beta: number = 0.1,
    gamma: number = 0.1,
    seasonalPeriod: number = 12
  ): number[] {
    const n = data.length;
    const result: number[] = [];

    // Initialize
    let level = data[0];
    let trend = (data[1] - data[0]) || 0;
    const seasonal = new Array(seasonalPeriod).fill(0);

    // Initial seasonal factors
    if (n >= seasonalPeriod) {
      const firstPeriodMean = ss.mean(data.slice(0, seasonalPeriod));
      for (let i = 0; i < seasonalPeriod; i++) {
        seasonal[i] = data[i] / firstPeriodMean;
      }
    }

    // Apply Holt-Winters
    for (let i = 0; i < n; i++) {
      const seasonalIdx = i % seasonalPeriod;
      const previousSeasonal = seasonal[seasonalIdx];

      // Update components
      const newLevel = alpha * (data[i] / previousSeasonal) + (1 - alpha) * (level + trend);
      const newTrend = beta * (newLevel - level) + (1 - beta) * trend;
      seasonal[seasonalIdx] = gamma * (data[i] / newLevel) + (1 - gamma) * previousSeasonal;

      result.push(newLevel * previousSeasonal);

      level = newLevel;
      trend = newTrend;
    }

    return result;
  }

  /**
   * Detect anomalies using statistical methods
   */
  detectAnomalies(data: TimeSeriesData[], threshold: number = 3): TimeSeriesData[] {
    const values = data.map(d => d.value);
    const mean = ss.mean(values);
    const std = ss.standardDeviation(values);

    const anomalies: TimeSeriesData[] = [];

    // Z-score method
    data.forEach((point, i) => {
      const zScore = Math.abs((point.value - mean) / std);
      if (zScore > threshold) {
        anomalies.push(point);
      }
    });

    // Also check for sudden changes
    for (let i = 1; i < data.length; i++) {
      const change = Math.abs(data[i].value - data[i - 1].value);
      const avgChange = std;
      if (change > threshold * avgChange) {
        if (!anomalies.includes(data[i])) {
          anomalies.push(data[i]);
        }
      }
    }

    return anomalies;
  }

  /**
   * Private helper methods
   */
  private normalize(data: number[]): number[] {
    this.scalerMean = ss.mean(data);
    this.scalerStd = ss.standardDeviation(data) || 1;
    return data.map(v => (v - this.scalerMean) / this.scalerStd);
  }

  private denormalize(data: number[]): number[] {
    return data.map(v => v * this.scalerStd + this.scalerMean);
  }

  private createSequences(data: number[], sequenceLength: number): {
    inputs: number[][];
    outputs: number[];
  } {
    const inputs: number[][] = [];
    const outputs: number[] = [];

    for (let i = 0; i < data.length - sequenceLength; i++) {
      inputs.push(data.slice(i, i + sequenceLength));
      outputs.push(data[i + sequenceLength]);
    }

    return { inputs, outputs };
  }

  private async buildLSTMModel(sequenceLength: number, modelId: string): Promise<tf.LayersModel> {
    const model = tf.sequential({
      name: modelId,
      layers: [
        tf.layers.lstm({
          units: 50,
          returnSequences: true,
          inputShape: [sequenceLength, 1],
          name: `${modelId}_lstm1`
        }),
        tf.layers.dropout({ rate: 0.2, name: `${modelId}_dropout1` }),
        tf.layers.lstm({
          units: 50,
          returnSequences: false,
          name: `${modelId}_lstm2`
        }),
        tf.layers.dropout({ rate: 0.2, name: `${modelId}_dropout2` }),
        tf.layers.dense({ units: 25, activation: 'relu', name: `${modelId}_dense1` }),
        tf.layers.dense({ units: 1, name: `${modelId}_output` })
      ]
    });

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mse']
    });

    return model;
  }

  private calculateRSquared(actual: number[], predicted: number[]): number {
    const mean = ss.mean(actual);
    const ssRes = ss.sum(actual.map((y, i) => Math.pow(y - predicted[i], 2)));
    const ssTot = ss.sum(actual.map(y => Math.pow(y - mean, 2)));
    return 1 - (ssRes / ssTot);
  }

  private detectSeasonality(data: TimeSeriesData[]): SeasonalPattern[] {
    const patterns: SeasonalPattern[] = [];
    const values = data.map(d => d.value);

    // Check for different seasonal patterns
    const periods = {
      daily: 24,
      weekly: 7,
      monthly: 30,
      quarterly: 90,
      yearly: 365
    };

    for (const [type, period] of Object.entries(periods)) {
      if (values.length >= period * 2) {
        const strength = this.calculateSeasonalStrength(values, period);
        if (strength > 0.3) {
          patterns.push({
            type: type as any,
            strength,
            peakPeriods: this.findPeakPeriods(values, period),
            troughPeriods: this.findTroughPeriods(values, period)
          });
        }
      }
    }

    return patterns;
  }

  private calculateSeasonalStrength(data: number[], period: number): number {
    // Simplified seasonal strength calculation
    const acf = this.autocorrelation(data, period);
    return Math.abs(acf[period] || 0);
  }

  private findPeakPeriods(data: number[], period: number): string[] {
    // Simplified peak detection
    const peaks: string[] = [];
    const threshold = ss.mean(data) + ss.standardDeviation(data);

    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > threshold && data[i] > data[i - 1] && data[i] > data[i + 1]) {
        peaks.push(`Period ${i % period}`);
      }
    }

    return [...new Set(peaks)];
  }

  private findTroughPeriods(data: number[], period: number): string[] {
    // Simplified trough detection
    const troughs: string[] = [];
    const threshold = ss.mean(data) - ss.standardDeviation(data);

    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] < threshold && data[i] < data[i - 1] && data[i] < data[i + 1]) {
        troughs.push(`Period ${i % period}`);
      }
    }

    return [...new Set(troughs)];
  }

  private detectOutliers(data: TimeSeriesData[]): TimeSeriesData[] {
    const values = data.map(d => d.value);
    const q1 = ss.quantile(values, 0.25);
    const q3 = ss.quantile(values, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return data.filter(d => d.value < lowerBound || d.value > upperBound);
  }

  private findOptimalPeriod(data: number[]): number {
    // Find the period with strongest autocorrelation
    const maxLag = Math.min(Math.floor(data.length / 2), 365);
    const acf = this.autocorrelation(data, maxLag);

    let maxCorr = 0;
    let optimalPeriod = 1;

    for (let lag = 1; lag < acf.length; lag++) {
      if (Math.abs(acf[lag]) > maxCorr) {
        maxCorr = Math.abs(acf[lag]);
        optimalPeriod = lag;
      }
    }

    return optimalPeriod;
  }

  private extractSeasonalComponent(data: number[], period: number): number[] {
    const seasonal: number[] = new Array(data.length).fill(0);

    // Calculate average for each position in the period
    const periodAverages: number[] = new Array(period).fill(0);
    const periodCounts: number[] = new Array(period).fill(0);

    for (let i = 0; i < data.length; i++) {
      const idx = i % period;
      periodAverages[idx] += data[i];
      periodCounts[idx]++;
    }

    for (let i = 0; i < period; i++) {
      if (periodCounts[i] > 0) {
        periodAverages[i] /= periodCounts[i];
      }
    }

    // Apply seasonal pattern
    for (let i = 0; i < data.length; i++) {
      seasonal[i] = periodAverages[i % period];
    }

    return seasonal;
  }
}

export default TimeSeriesEngine;