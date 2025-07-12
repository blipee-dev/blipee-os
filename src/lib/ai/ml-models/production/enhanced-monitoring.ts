/**
 * Enhanced Model Monitoring & Drift Detection System
 * Comprehensive monitoring for ML models in production with advanced drift detection
 */

import { BaseModel } from '../base/base-model';
import { TrainingData, EvaluationMetrics } from '../types';

export interface MonitoringConfig {
  modelName: string;
  monitoringInterval: number; // milliseconds
  driftDetectionEnabled: boolean;
  performanceThresholds: PerformanceThresholds;
  alertingEnabled: boolean;
  alertChannels: AlertChannel[];
  retentionPeriod: number; // days
  samplingRate: number; // 0-1
}

export interface PerformanceThresholds {
  maxLatency: number; // milliseconds
  minAccuracy: number; // 0-1
  maxErrorRate: number; // 0-1
  minThroughput: number; // requests per second
  maxDriftScore: number; // 0-1
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'console';
  target: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MonitoringMetrics {
  timestamp: Date;
  requestId: string;
  modelName: string;
  latency: number;
  prediction: any;
  confidence?: number;
  inputFeatures: Record<string, any>;
  actualOutcome?: any;
  errorCode?: string;
  userId?: string;
  sessionId?: string;
}

export interface DriftMetrics {
  timestamp: Date;
  modelName: string;
  driftType: 'feature' | 'prediction' | 'concept';
  driftScore: number; // 0-1, higher = more drift
  affectedFeatures: string[];
  statisticalTest: string;
  pValue: number;
  threshold: number;
  samples: number;
}

export interface ModelHealthStatus {
  modelName: string;
  status: 'healthy' | 'warning' | 'critical' | 'degraded';
  lastUpdate: Date;
  currentMetrics: CurrentPerformanceMetrics;
  driftStatus: DriftStatus;
  alerts: Alert[];
  recommendations: string[];
}

export interface CurrentPerformanceMetrics {
  averageLatency: number;
  throughput: number;
  errorRate: number;
  accuracy?: number;
  requestCount: number;
  timeWindow: string; // e.g., "last_24h"
}

export interface DriftStatus {
  overallDriftScore: number;
  featureDrift: { [feature: string]: number };
  predictionDrift: number;
  conceptDrift: number;
  lastDriftDetection: Date;
  driftTrend: 'stable' | 'increasing' | 'decreasing';
}

export interface Alert {
  id: string;
  type: 'performance' | 'drift' | 'error' | 'throughput';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: Record<string, any>;
}

export interface DriftDetectionResult {
  isDrift: boolean;
  driftScore: number;
  driftType: 'feature' | 'prediction' | 'concept';
  affectedFeatures: string[];
  recommendation: string;
  confidence: number;
}

export class EnhancedModelMonitoring {
  private config: MonitoringConfig;
  private metricsBuffer: MonitoringMetrics[] = [];
  private baselineData: Map<string, any[]> = new Map();
  private alerts: Alert[] = [];
  private monitoringInterval?: NodeJS.Timeout;
  private driftDetectors: Map<string, DriftDetector> = new Map();

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.initializeDriftDetectors();
    
    if (this.config.driftDetectionEnabled) {
      this.startMonitoring();
    }
  }

  /**
   * Start monitoring a model
   */
  async startMonitoring(): Promise<void> {
    console.log(`📊 Starting enhanced monitoring for: ${this.config.modelName}`);
    console.log(`   🔍 Drift detection: ${this.config.driftDetectionEnabled ? 'enabled' : 'disabled'}`);
    console.log(`   ⏱️ Monitoring interval: ${this.config.monitoringInterval / 1000}s`);
    console.log(`   📈 Sampling rate: ${(this.config.samplingRate * 100).toFixed(1)}%`);
    
    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoringCheck();
    }, this.config.monitoringInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    console.log(`⏹️ Stopped monitoring for: ${this.config.modelName}`);
  }

  /**
   * Record a prediction and its metrics
   */
  async recordPrediction(
    requestId: string,
    prediction: any,
    inputFeatures: Record<string, any>,
    latency: number,
    confidence?: number,
    userId?: string,
    sessionId?: string
  ): Promise<void> {
    // Apply sampling
    if (Math.random() > this.config.samplingRate) {
      return;
    }

    const metrics: MonitoringMetrics = {
      timestamp: new Date(),
      requestId,
      modelName: this.config.modelName,
      latency,
      prediction,
      confidence,
      inputFeatures,
      userId,
      sessionId
    };

    this.metricsBuffer.push(metrics);
    
    // Perform real-time checks
    await this.checkRealTimeMetrics(metrics);
    
    // Maintain buffer size (keep last 10,000 records)
    if (this.metricsBuffer.length > 10000) {
      this.metricsBuffer = this.metricsBuffer.slice(-10000);
    }
  }

  /**
   * Record actual outcome for a prediction
   */
  async recordOutcome(requestId: string, actualOutcome: any): Promise<void> {
    const metrics = this.metricsBuffer.find(m => m.requestId === requestId);
    if (metrics) {
      metrics.actualOutcome = actualOutcome;
      
      // Trigger concept drift detection if we have enough samples
      const metricsWithOutcomes = this.metricsBuffer.filter(m => m.actualOutcome !== undefined);
      if (metricsWithOutcomes.length >= 100) {
        await this.detectConceptDrift(metricsWithOutcomes.slice(-100));
      }
    }
  }

  /**
   * Set baseline data for drift detection
   */
  setBaseline(baselineData: TrainingData): void {
    console.log(`📊 Setting baseline data for drift detection...`);
    console.log(`   📈 Baseline samples: ${baselineData.features.length}`);
    
    // Store feature distributions
    for (const sample of baselineData.features) {
      for (const [feature, value] of Object.entries(sample)) {
        if (!this.baselineData.has(feature)) {
          this.baselineData.set(feature, []);
        }
        this.baselineData.get(feature)!.push(value);
      }
    }
    
    // Initialize drift detectors with baseline
    for (const [feature, values] of this.baselineData) {
      if (!this.driftDetectors.has(feature)) {
        this.driftDetectors.set(feature, new DriftDetector(feature));
      }
      const detector = this.driftDetectors.get(feature)!;
      detector.setBaseline(values);
    }
  }

  /**
   * Get current model health status
   */
  async getModelHealth(): Promise<ModelHealthStatus> {
    const recentMetrics = this.getRecentMetrics(24 * 60 * 60 * 1000); // Last 24 hours
    const currentMetrics = this.calculateCurrentMetrics(recentMetrics);
    const driftStatus = await this.calculateDriftStatus();
    const activeAlerts = this.alerts.filter(a => !a.resolved);
    
    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' | 'degraded' = 'healthy';
    
    if (activeAlerts.some(a => a.severity === 'critical')) {
      status = 'critical';
    } else if (activeAlerts.some(a => a.severity === 'high')) {
      status = 'degraded';
    } else if (activeAlerts.length > 0 || driftStatus.overallDriftScore > 0.5) {
      status = 'warning';
    }
    
    const recommendations = this.generateRecommendations(currentMetrics, driftStatus, activeAlerts);
    
    return {
      modelName: this.config.modelName,
      status,
      lastUpdate: new Date(),
      currentMetrics,
      driftStatus,
      alerts: activeAlerts,
      recommendations
    };
  }

  /**
   * Detect various types of drift
   */
  async detectDrift(recentData: Record<string, any>[]): Promise<DriftDetectionResult[]> {
    const results: DriftDetectionResult[] = [];
    
    // Feature drift detection
    for (const [feature, detector] of this.driftDetectors) {
      const recentValues = recentData.map(d => d[feature]).filter(v => v !== undefined);
      
      if (recentValues.length > 10) {
        const driftResult = await detector.detectDrift(recentValues);
        
        if (driftResult.isDrift) {
          results.push({
            isDrift: true,
            driftScore: driftResult.score,
            driftType: 'feature',
            affectedFeatures: [feature],
            recommendation: `Feature '${feature}' shows significant drift (score: ${driftResult.score.toFixed(3)}). Consider retraining or feature engineering.`,
            confidence: 1 - driftResult.pValue
          });
        }
      }
    }
    
    // Prediction drift detection
    const predictionDrift = await this.detectPredictionDrift(recentData);
    if (predictionDrift.isDrift) {
      results.push(predictionDrift);
    }
    
    return results;
  }

  /**
   * Generate alerts based on metrics and thresholds
   */
  private async checkRealTimeMetrics(metrics: MonitoringMetrics): Promise<void> {
    const alerts: Alert[] = [];
    
    // Latency alert
    if (metrics.latency > this.config.performanceThresholds.maxLatency) {
      alerts.push({
        id: `latency_${Date.now()}`,
        type: 'performance',
        severity: metrics.latency > this.config.performanceThresholds.maxLatency * 2 ? 'critical' : 'high',
        message: `High latency detected: ${metrics.latency}ms (threshold: ${this.config.performanceThresholds.maxLatency}ms)`,
        timestamp: new Date(),
        resolved: false,
        metadata: { requestId: metrics.requestId, latency: metrics.latency }
      });
    }
    
    // Confidence alert
    if (metrics.confidence !== undefined && metrics.confidence < 0.5) {
      alerts.push({
        id: `confidence_${Date.now()}`,
        type: 'performance',
        severity: metrics.confidence < 0.3 ? 'high' : 'medium',
        message: `Low prediction confidence: ${(metrics.confidence * 100).toFixed(1)}%`,
        timestamp: new Date(),
        resolved: false,
        metadata: { requestId: metrics.requestId, confidence: metrics.confidence }
      });
    }
    
    // Add alerts to the system
    for (const alert of alerts) {
      this.alerts.push(alert);
      if (this.config.alertingEnabled) {
        await this.sendAlert(alert);
      }
    }
  }

  /**
   * Perform periodic monitoring checks
   */
  private async performMonitoringCheck(): Promise<void> {
    const recentMetrics = this.getRecentMetrics(this.config.monitoringInterval);
    
    if (recentMetrics.length === 0) {
      return;
    }
    
    // Check performance metrics
    await this.checkPerformanceMetrics(recentMetrics);
    
    // Check for drift if enabled
    if (this.config.driftDetectionEnabled && this.baselineData.size > 0) {
      const recentFeatures = recentMetrics.map(m => m.inputFeatures);
      const driftResults = await this.detectDrift(recentFeatures);
      
      for (const drift of driftResults) {
        if (drift.isDrift && drift.driftScore > this.config.performanceThresholds.maxDriftScore) {
          const alert: Alert = {
            id: `drift_${Date.now()}`,
            type: 'drift',
            severity: drift.driftScore > 0.8 ? 'critical' : 'high',
            message: drift.recommendation,
            timestamp: new Date(),
            resolved: false,
            metadata: { 
              driftScore: drift.driftScore,
              driftType: drift.driftType,
              affectedFeatures: drift.affectedFeatures
            }
          };
          
          this.alerts.push(alert);
          if (this.config.alertingEnabled) {
            await this.sendAlert(alert);
          }
        }
      }
    }
  }

  /**
   * Check performance metrics against thresholds
   */
  private async checkPerformanceMetrics(metrics: MonitoringMetrics[]): Promise<void> {
    const currentMetrics = this.calculateCurrentMetrics(metrics);
    const alerts: Alert[] = [];
    
    // Error rate check
    if (currentMetrics.errorRate > this.config.performanceThresholds.maxErrorRate) {
      alerts.push({
        id: `error_rate_${Date.now()}`,
        type: 'error',
        severity: currentMetrics.errorRate > this.config.performanceThresholds.maxErrorRate * 2 ? 'critical' : 'high',
        message: `High error rate: ${(currentMetrics.errorRate * 100).toFixed(2)}% (threshold: ${(this.config.performanceThresholds.maxErrorRate * 100).toFixed(2)}%)`,
        timestamp: new Date(),
        resolved: false,
        metadata: { errorRate: currentMetrics.errorRate }
      });
    }
    
    // Throughput check
    if (currentMetrics.throughput < this.config.performanceThresholds.minThroughput) {
      alerts.push({
        id: `throughput_${Date.now()}`,
        type: 'throughput',
        severity: 'medium',
        message: `Low throughput: ${currentMetrics.throughput.toFixed(2)} req/s (threshold: ${this.config.performanceThresholds.minThroughput} req/s)`,
        timestamp: new Date(),
        resolved: false,
        metadata: { throughput: currentMetrics.throughput }
      });
    }
    
    // Send alerts
    for (const alert of alerts) {
      this.alerts.push(alert);
      if (this.config.alertingEnabled) {
        await this.sendAlert(alert);
      }
    }
  }

  /**
   * Detect concept drift based on actual outcomes
   */
  private async detectConceptDrift(metricsWithOutcomes: MonitoringMetrics[]): Promise<void> {
    if (metricsWithOutcomes.length < 50) {
      return;
    }
    
    // Simple concept drift detection based on prediction accuracy over time
    const recentAccuracy = this.calculateAccuracy(metricsWithOutcomes.slice(-25));
    const olderAccuracy = this.calculateAccuracy(metricsWithOutcomes.slice(-50, -25));
    
    const accuracyDrop = olderAccuracy - recentAccuracy;
    
    if (accuracyDrop > 0.1) { // 10% accuracy drop
      const driftMetrics: DriftMetrics = {
        timestamp: new Date(),
        modelName: this.config.modelName,
        driftType: 'concept',
        driftScore: accuracyDrop,
        affectedFeatures: [],
        statisticalTest: 'accuracy_comparison',
        pValue: 0.05, // Simplified
        threshold: 0.1,
        samples: metricsWithOutcomes.length
      };
      
      const alert: Alert = {
        id: `concept_drift_${Date.now()}`,
        type: 'drift',
        severity: accuracyDrop > 0.2 ? 'critical' : 'high',
        message: `Concept drift detected: ${(accuracyDrop * 100).toFixed(1)}% accuracy drop`,
        timestamp: new Date(),
        resolved: false,
        metadata: { driftMetrics }
      };
      
      this.alerts.push(alert);
      if (this.config.alertingEnabled) {
        await this.sendAlert(alert);
      }
    }
  }

  /**
   * Detect prediction drift
   */
  private async detectPredictionDrift(recentData: Record<string, any>[]): Promise<DriftDetectionResult> {
    // Simplified prediction drift detection
    // In practice, this would compare prediction distributions
    const recentPredictions = this.metricsBuffer
      .filter(m => m.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000))
      .map(m => m.prediction);
    
    if (recentPredictions.length < 100) {
      return {
        isDrift: false,
        driftScore: 0,
        driftType: 'prediction',
        affectedFeatures: [],
        recommendation: 'Insufficient data for prediction drift detection',
        confidence: 0
      };
    }
    
    // Simple variance-based drift detection
    const predictionVariance = this.calculateVariance(recentPredictions.map(p => 
      typeof p === 'number' ? p : (p.confidence || 0.5)
    ));
    
    const isDrift = predictionVariance > 0.3; // Threshold
    
    return {
      isDrift,
      driftScore: predictionVariance,
      driftType: 'prediction',
      affectedFeatures: [],
      recommendation: isDrift ? 
        'Prediction distribution has changed significantly. Consider model retraining.' :
        'Prediction distribution is stable.',
      confidence: isDrift ? 0.8 : 0.2
    };
  }

  /**
   * Initialize drift detectors for each feature
   */
  private initializeDriftDetectors(): void {
    // We'll create detectors when we have baseline data
    // For now, just log that drift detection is ready
    console.log(`🔍 Drift detection system initialized for: ${this.config.modelName}`);
  }

  /**
   * Get recent metrics within time window
   */
  private getRecentMetrics(timeWindowMs: number): MonitoringMetrics[] {
    const cutoff = new Date(Date.now() - timeWindowMs);
    return this.metricsBuffer.filter(m => m.timestamp > cutoff);
  }

  /**
   * Calculate current performance metrics
   */
  private calculateCurrentMetrics(metrics: MonitoringMetrics[]): CurrentPerformanceMetrics {
    if (metrics.length === 0) {
      return {
        averageLatency: 0,
        throughput: 0,
        errorRate: 0,
        requestCount: 0,
        timeWindow: 'last_24h'
      };
    }
    
    const totalLatency = metrics.reduce((sum, m) => sum + m.latency, 0);
    const errorCount = metrics.filter(m => m.errorCode).length;
    const timeSpan = Math.max(1, (Date.now() - metrics[0].timestamp.getTime()) / 1000); // seconds
    
    const metricsWithOutcomes = metrics.filter(m => m.actualOutcome !== undefined);
    const accuracy = metricsWithOutcomes.length > 0 ? 
      this.calculateAccuracy(metricsWithOutcomes) : undefined;
    
    return {
      averageLatency: totalLatency / metrics.length,
      throughput: metrics.length / timeSpan,
      errorRate: errorCount / metrics.length,
      accuracy,
      requestCount: metrics.length,
      timeWindow: 'last_24h'
    };
  }

  /**
   * Calculate drift status
   */
  private async calculateDriftStatus(): Promise<DriftStatus> {
    const recentMetrics = this.getRecentMetrics(24 * 60 * 60 * 1000);
    const recentFeatures = recentMetrics.map(m => m.inputFeatures);
    
    let overallDriftScore = 0;
    const featureDrift: { [feature: string]: number } = {};
    
    if (this.baselineData.size > 0 && recentFeatures.length > 0) {
      const driftResults = await this.detectDrift(recentFeatures);
      overallDriftScore = driftResults.length > 0 ? 
        Math.max(...driftResults.map(r => r.driftScore)) : 0;
      
      for (const result of driftResults) {
        for (const feature of result.affectedFeatures) {
          featureDrift[feature] = result.driftScore;
        }
      }
    }
    
    return {
      overallDriftScore,
      featureDrift,
      predictionDrift: 0, // Simplified
      conceptDrift: 0, // Simplified
      lastDriftDetection: new Date(),
      driftTrend: overallDriftScore > 0.5 ? 'increasing' : 'stable'
    };
  }

  /**
   * Generate recommendations based on current state
   */
  private generateRecommendations(
    currentMetrics: CurrentPerformanceMetrics,
    driftStatus: DriftStatus,
    alerts: Alert[]
  ): string[] {
    const recommendations: string[] = [];
    
    if (currentMetrics.averageLatency > this.config.performanceThresholds.maxLatency) {
      recommendations.push('Consider optimizing model inference pipeline to reduce latency');
    }
    
    if (currentMetrics.errorRate > this.config.performanceThresholds.maxErrorRate) {
      recommendations.push('Investigate and fix high error rate - check input validation and model stability');
    }
    
    if (driftStatus.overallDriftScore > 0.5) {
      recommendations.push('Model drift detected - consider retraining with recent data');
    }
    
    if (alerts.some(a => a.type === 'drift' && a.severity === 'critical')) {
      recommendations.push('Critical drift detected - urgent model retraining recommended');
    }
    
    if (currentMetrics.requestCount < 100) {
      recommendations.push('Low request volume - ensure monitoring has sufficient data');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Model is performing well - continue monitoring');
    }
    
    return recommendations;
  }

  /**
   * Calculate accuracy from metrics with outcomes
   */
  private calculateAccuracy(metrics: MonitoringMetrics[]): number {
    if (metrics.length === 0) return 0;
    
    let correctPredictions = 0;
    for (const metric of metrics) {
      // Extract actual prediction value from prediction object or use directly
      let predicted = metric.prediction;
      if (typeof predicted === 'object' && predicted !== null) {
        predicted = predicted.prediction || predicted.value || predicted;
      }
      
      const actual = metric.actualOutcome;
      
      if (typeof predicted === 'boolean' && typeof actual === 'boolean') {
        if (predicted === actual) correctPredictions++;
      } else if (typeof predicted === 'string' && typeof actual === 'string') {
        if (predicted === actual) correctPredictions++;
      } else if (typeof predicted === 'string' && typeof actual === 'boolean') {
        // Convert string predictions to boolean for comparison
        const predBool = predicted.toLowerCase() === 'positive' || predicted.toLowerCase() === 'true';
        if (predBool === actual) correctPredictions++;
      } else if (typeof actual === 'string' && typeof predicted === 'boolean') {
        // Convert string actual to boolean for comparison
        const actualBool = actual.toLowerCase() === 'positive' || actual.toLowerCase() === 'true';
        if (predicted === actualBool) correctPredictions++;
      } else {
        // For numerical predictions, consider within 10% as correct
        const predVal = typeof predicted === 'number' ? predicted : parseFloat(String(predicted));
        const actVal = typeof actual === 'number' ? actual : parseFloat(String(actual));
        if (!isNaN(predVal) && !isNaN(actVal)) {
          if (Math.abs(predVal - actVal) / Math.abs(actVal) < 0.1) correctPredictions++;
        }
      }
    }
    
    return correctPredictions / metrics.length;
  }

  /**
   * Calculate variance of numerical values
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Send alert through configured channels
   */
  private async sendAlert(alert: Alert): Promise<void> {
    console.log(`🚨 Alert: [${alert.severity.toUpperCase()}] ${alert.message}`);
    
    for (const channel of this.config.alertChannels) {
      if (this.shouldSendToChannel(alert, channel)) {
        await this.sendToChannel(alert, channel);
      }
    }
  }

  /**
   * Check if alert should be sent to specific channel
   */
  private shouldSendToChannel(alert: Alert, channel: AlertChannel): boolean {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    return severityLevels[alert.severity] >= severityLevels[channel.severity];
  }

  /**
   * Send alert to specific channel
   */
  private async sendToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
    switch (channel.type) {
      case 'console':
        console.log(`📡 [${channel.type}] ${alert.message}`);
        break;
      case 'webhook':
        // In practice, would send HTTP request
        console.log(`📡 [${channel.type}] Would send to: ${channel.target}`);
        break;
      case 'email':
      case 'slack':
        // In practice, would integrate with respective APIs
        console.log(`📡 [${channel.type}] Would send to: ${channel.target}`);
        break;
    }
  }
}

/**
 * Individual drift detector for a specific feature
 */
class DriftDetector {
  private baseline: number[] = [];
  private readonly feature: string;

  constructor(feature: string) {
    this.feature = feature;
  }

  setBaseline(values: any[]): void {
    // Convert values to numbers for statistical analysis
    this.baseline = values
      .map(v => typeof v === 'number' ? v : parseFloat(String(v)))
      .filter(v => !isNaN(v));
  }

  async detectDrift(recentValues: any[]): Promise<{ isDrift: boolean; score: number; pValue: number }> {
    const recentNumerical = recentValues
      .map(v => typeof v === 'number' ? v : parseFloat(String(v)))
      .filter(v => !isNaN(v));

    if (this.baseline.length === 0 || recentNumerical.length === 0) {
      return { isDrift: false, score: 0, pValue: 1 };
    }

    // Kolmogorov-Smirnov test approximation
    const ksStatistic = this.calculateKSStatistic(this.baseline, recentNumerical);
    const pValue = this.calculateKSPValue(ksStatistic, this.baseline.length, recentNumerical.length);
    
    const isDrift = pValue < 0.05; // 5% significance level
    
    return {
      isDrift,
      score: ksStatistic,
      pValue
    };
  }

  /**
   * Calculate Kolmogorov-Smirnov statistic
   */
  private calculateKSStatistic(sample1: number[], sample2: number[]): number {
    const combined = [...sample1, ...sample2].sort((a, b) => a - b);
    let maxDiff = 0;

    for (const value of combined) {
      const cdf1 = sample1.filter(x => x <= value).length / sample1.length;
      const cdf2 = sample2.filter(x => x <= value).length / sample2.length;
      const diff = Math.abs(cdf1 - cdf2);
      maxDiff = Math.max(maxDiff, diff);
    }

    return maxDiff;
  }

  /**
   * Calculate approximate p-value for KS test
   */
  private calculateKSPValue(ksStatistic: number, n1: number, n2: number): number {
    const effectiveN = Math.sqrt((n1 * n2) / (n1 + n2));
    const lambda = effectiveN * ksStatistic;
    
    // Approximation for p-value
    if (lambda < 0.5) return 1;
    if (lambda > 3) return 0;
    
    return 2 * Math.exp(-2 * lambda * lambda);
  }
}