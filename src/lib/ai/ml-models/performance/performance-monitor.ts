/**
 * Performance Monitoring System
 * Real-time monitoring and alerting for ML models in production
 */

import { EventEmitter } from 'events';
import { ModelMetrics } from '../types';

export interface PerformanceAlert {
  id: string;
  modelName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'latency' | 'accuracy' | 'throughput' | 'error_rate' | 'memory' | 'drift';
  message: string;
  timestamp: Date;
  currentValue: number;
  threshold: number;
  metadata: any;
}

export interface PerformanceThresholds {
  maxLatency: number; // ms
  minAccuracy: number; // 0-1
  minThroughput: number; // requests/sec
  maxErrorRate: number; // 0-1
  maxMemoryUsage: number; // MB
  driftThreshold: number; // 0-1
}

export interface MonitoringConfig {
  sampleRate: number; // 0-1, what fraction of requests to monitor
  alertCooldown: number; // ms between same-type alerts
  thresholds: PerformanceThresholds;
  enablePredictionLogging: boolean;
  enableDriftDetection: boolean;
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: Map<string, ModelMetrics[]> = new Map();
  private recentAlerts: Map<string, Date> = new Map();
  private monitoringConfig: MonitoringConfig;
  private driftDetectors: Map<string, DriftDetector> = new Map();
  private isMonitoring: boolean = false;

  constructor(config: MonitoringConfig) {
    super();
    this.monitoringConfig = config;
    this.startMonitoring();
  }

  /**
   * Record prediction and performance metrics
   */
  async recordPrediction(
    modelName: string,
    input: any,
    prediction: any,
    metadata: {
      latency: number;
      timestamp: Date;
      userId?: string;
      sessionId?: string;
    }
  ): Promise<void> {
    // Sample requests based on config
    if (Math.random() > this.monitoringConfig.sampleRate) {
      return;
    }

    const metrics: ModelMetrics = {
      modelName,
      timestamp: metadata.timestamp,
      latency: metadata.latency,
      prediction,
      input: this.monitoringConfig.enablePredictionLogging ? input : null,
      userId: metadata.userId,
      sessionId: metadata.sessionId
    };

    // Store metrics
    if (!this.metrics.has(modelName)) {
      this.metrics.set(modelName, []);
    }
    
    const modelMetrics = this.metrics.get(modelName)!;
    modelMetrics.push(metrics);

    // Keep only recent metrics (last hour)
    const cutoff = new Date(Date.now() - 60 * 60 * 1000);
    this.metrics.set(modelName, modelMetrics.filter(m => m.timestamp > cutoff));

    // Check for performance issues
    await this.checkPerformanceThresholds(modelName, metrics);

    // Update drift detection
    if (this.monitoringConfig.enableDriftDetection) {
      await this.updateDriftDetection(modelName, input, prediction);
    }

    // Emit metric recorded event
    this.emit('metricRecorded', {
      modelName,
      metrics,
      totalMetrics: modelMetrics.length
    });
  }

  /**
   * Get current performance statistics
   */
  getPerformanceStats(modelName: string): {
    avgLatency: number;
    p95Latency: number;
    throughput: number;
    errorRate: number;
    totalPredictions: number;
    timeWindow: string;
  } | null {
    const modelMetrics = this.metrics.get(modelName);
    if (!modelMetrics || modelMetrics.length === 0) {
      return null;
    }

    const latencies = modelMetrics.map(m => m.latency).sort((a, b) => a - b);
    const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Index];

    const timeSpan = (Date.now() - modelMetrics[0].timestamp.getTime()) / 1000; // seconds
    const throughput = modelMetrics.length / timeSpan;

    const errors = modelMetrics.filter(m => m.error).length;
    const errorRate = errors / modelMetrics.length;

    return {
      avgLatency,
      p95Latency,
      throughput,
      errorRate,
      totalPredictions: modelMetrics.length,
      timeWindow: `${Math.round(timeSpan / 60)} minutes`
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(modelName?: string, maxAge: number = 3600000): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const cutoff = new Date(Date.now() - maxAge);

    // This would typically come from a persistent store
    // For now, return simulated recent alerts based on current metrics
    const models = modelName ? [modelName] : Array.from(this.metrics.keys());
    
    for (const model of models) {
      const stats = this.getPerformanceStats(model);
      if (stats) {
        // Check current status against thresholds
        if (stats.avgLatency > this.monitoringConfig.thresholds.maxLatency) {
          alerts.push(this.createAlert(
            model,
            'high',
            'latency',
            `Average latency ${stats.avgLatency.toFixed(1)}ms exceeds threshold`,
            stats.avgLatency,
            this.monitoringConfig.thresholds.maxLatency
          ));
        }

        if (stats.errorRate > this.monitoringConfig.thresholds.maxErrorRate) {
          alerts.push(this.createAlert(
            model,
            'critical',
            'error_rate',
            `Error rate ${(stats.errorRate * 100).toFixed(1)}% exceeds threshold`,
            stats.errorRate,
            this.monitoringConfig.thresholds.maxErrorRate
          ));
        }

        if (stats.throughput < this.monitoringConfig.thresholds.minThroughput) {
          alerts.push(this.createAlert(
            model,
            'medium',
            'throughput',
            `Throughput ${stats.throughput.toFixed(1)} req/s below threshold`,
            stats.throughput,
            this.monitoringConfig.thresholds.minThroughput
          ));
        }
      }
    }

    return alerts.filter(a => a.timestamp > cutoff);
  }

  /**
   * Get model health summary
   */
  getModelHealth(modelName: string): {
    status: 'healthy' | 'warning' | 'critical';
    score: number; // 0-100
    issues: string[];
    uptime: number; // percentage
    lastPrediction: Date | null;
  } {
    const stats = this.getPerformanceStats(modelName);
    const alerts = this.getRecentAlerts(modelName, 1800000); // Last 30 minutes
    
    if (!stats) {
      return {
        status: 'critical',
        score: 0,
        issues: ['No recent predictions recorded'],
        uptime: 0,
        lastPrediction: null
      };
    }

    let score = 100;
    const issues: string[] = [];

    // Latency check
    if (stats.avgLatency > this.monitoringConfig.thresholds.maxLatency) {
      score -= 20;
      issues.push(`High latency: ${stats.avgLatency.toFixed(1)}ms`);
    }

    // Error rate check
    if (stats.errorRate > this.monitoringConfig.thresholds.maxErrorRate) {
      score -= 30;
      issues.push(`High error rate: ${(stats.errorRate * 100).toFixed(1)}%`);
    }

    // Throughput check
    if (stats.throughput < this.monitoringConfig.thresholds.minThroughput) {
      score -= 15;
      issues.push(`Low throughput: ${stats.throughput.toFixed(1)} req/s`);
    }

    // Alert severity impact
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const highAlerts = alerts.filter(a => a.severity === 'high').length;
    
    score -= criticalAlerts * 25;
    score -= highAlerts * 15;

    score = Math.max(0, score);

    // Determine status
    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 80) status = 'healthy';
    else if (score >= 50) status = 'warning';
    else status = 'critical';

    const modelMetrics = this.metrics.get(modelName) || [];
    const lastPrediction = modelMetrics.length > 0 
      ? modelMetrics[modelMetrics.length - 1].timestamp 
      : null;

    return {
      status,
      score,
      issues,
      uptime: (1 - stats.errorRate) * 100,
      lastPrediction
    };
  }

  /**
   * Export metrics for external systems
   */
  exportMetrics(format: 'prometheus' | 'json' | 'csv' = 'json'): string {
    const data: any = {};
    
    for (const [modelName, metrics] of this.metrics.entries()) {
      data[modelName] = {
        totalPredictions: metrics.length,
        stats: this.getPerformanceStats(modelName),
        health: this.getModelHealth(modelName),
        recentAlerts: this.getRecentAlerts(modelName)
      };
    }

    switch (format) {
      case 'prometheus':
        return this.formatPrometheus(data);
      case 'csv':
        return this.formatCSV(data);
      default:
        return JSON.stringify(data, null, 2);
    }
  }

  /**
   * Start monitoring background tasks
   */
  private startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Periodic cleanup of old metrics
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 300000); // Every 5 minutes

    // Periodic drift detection
    if (this.monitoringConfig.enableDriftDetection) {
      setInterval(() => {
        this.runDriftDetection();
      }, 600000); // Every 10 minutes
    }

    console.log('Performance monitoring started');
  }

  /**
   * Check if metrics violate thresholds
   */
  private async checkPerformanceThresholds(
    modelName: string, 
    metrics: ModelMetrics
  ): Promise<void> {
    const thresholds = this.monitoringConfig.thresholds;
    
    // Latency check
    if (metrics.latency > thresholds.maxLatency) {
      await this.triggerAlert(
        modelName,
        'high',
        'latency',
        `Prediction latency ${metrics.latency}ms exceeds threshold ${thresholds.maxLatency}ms`,
        metrics.latency,
        thresholds.maxLatency,
        { predictionId: metrics.timestamp.getTime() }
      );
    }

    // Error check
    if (metrics.error) {
      await this.triggerAlert(
        modelName,
        'critical',
        'error_rate',
        `Prediction error: ${metrics.error}`,
        1,
        thresholds.maxErrorRate,
        { error: metrics.error }
      );
    }
  }

  /**
   * Update drift detection
   */
  private async updateDriftDetection(
    modelName: string,
    input: any,
    prediction: any
  ): Promise<void> {
    if (!this.driftDetectors.has(modelName)) {
      this.driftDetectors.set(modelName, new DriftDetector());
    }

    const detector = this.driftDetectors.get(modelName)!;
    const driftScore = await detector.updateAndCheck(input, prediction);

    if (driftScore > this.monitoringConfig.thresholds.driftThreshold) {
      await this.triggerAlert(
        modelName,
        'high',
        'drift',
        `Model drift detected with score ${driftScore.toFixed(3)}`,
        driftScore,
        this.monitoringConfig.thresholds.driftThreshold,
        { driftType: 'input_distribution' }
      );
    }
  }

  /**
   * Trigger performance alert
   */
  private async triggerAlert(
    modelName: string,
    severity: PerformanceAlert['severity'],
    type: PerformanceAlert['type'],
    message: string,
    currentValue: number,
    threshold: number,
    metadata: any = {}
  ): Promise<void> {
    const alertKey = `${modelName}-${type}`;
    const lastAlert = this.recentAlerts.get(alertKey);
    
    // Respect cooldown period
    if (lastAlert && Date.now() - lastAlert.getTime() < this.monitoringConfig.alertCooldown) {
      return;
    }

    const alert: PerformanceAlert = {
      id: `${alertKey}-${Date.now()}`,
      modelName,
      severity,
      type,
      message,
      timestamp: new Date(),
      currentValue,
      threshold,
      metadata
    };

    this.recentAlerts.set(alertKey, alert.timestamp);

    // Emit alert event
    this.emit('alert', alert);

    console.warn(`🚨 Performance Alert [${severity.toUpperCase()}]: ${message}`);
  }

  /**
   * Create alert object
   */
  private createAlert(
    modelName: string,
    severity: PerformanceAlert['severity'],
    type: PerformanceAlert['type'],
    message: string,
    currentValue: number,
    threshold: number
  ): PerformanceAlert {
    return {
      id: `${modelName}-${type}-${Date.now()}`,
      modelName,
      severity,
      type,
      message,
      timestamp: new Date(),
      currentValue,
      threshold,
      metadata: {}
    };
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    
    for (const [modelName, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(m => m.timestamp > cutoff);
      this.metrics.set(modelName, filteredMetrics);
    }

    // Clean up old alerts
    const alertCutoff = new Date(Date.now() - this.monitoringConfig.alertCooldown * 10);
    for (const [key, timestamp] of this.recentAlerts.entries()) {
      if (timestamp < alertCutoff) {
        this.recentAlerts.delete(key);
      }
    }
  }

  /**
   * Run periodic drift detection
   */
  private async runDriftDetection(): Promise<void> {
    for (const [modelName, detector] of this.driftDetectors.entries()) {
      const driftReport = await detector.generateReport();
      
      if (driftReport.overallDrift > this.monitoringConfig.thresholds.driftThreshold) {
        await this.triggerAlert(
          modelName,
          'medium',
          'drift',
          `Periodic drift check: ${driftReport.summary}`,
          driftReport.overallDrift,
          this.monitoringConfig.thresholds.driftThreshold,
          driftReport
        );
      }
    }
  }

  /**
   * Format metrics for Prometheus
   */
  private formatPrometheus(data: any): string {
    let output = '';
    
    for (const [modelName, modelData] of Object.entries(data as any)) {
      const stats = modelData.stats;
      if (stats) {
        output += `# HELP model_latency_avg Average prediction latency in milliseconds\n`;
        output += `# TYPE model_latency_avg gauge\n`;
        output += `model_latency_avg{model="${modelName}"} ${stats.avgLatency}\n\n`;
        
        output += `# HELP model_throughput Predictions per second\n`;
        output += `# TYPE model_throughput gauge\n`;
        output += `model_throughput{model="${modelName}"} ${stats.throughput}\n\n`;
        
        output += `# HELP model_error_rate Error rate (0-1)\n`;
        output += `# TYPE model_error_rate gauge\n`;
        output += `model_error_rate{model="${modelName}"} ${stats.errorRate}\n\n`;
      }
    }
    
    return output;
  }

  /**
   * Format metrics for CSV
   */
  private formatCSV(data: any): string {
    let csv = 'model,avg_latency,p95_latency,throughput,error_rate,total_predictions,health_score,status\n';
    
    for (const [modelName, modelData] of Object.entries(data as any)) {
      const stats = modelData.stats;
      const health = modelData.health;
      
      if (stats && health) {
        csv += `${modelName},${stats.avgLatency},${stats.p95Latency},${stats.throughput},${stats.errorRate},${stats.totalPredictions},${health.score},${health.status}\n`;
      }
    }
    
    return csv;
  }
}

/**
 * Simple drift detector implementation
 */
class DriftDetector {
  private inputHistory: any[] = [];
  private predictionHistory: any[] = [];
  private maxHistorySize = 1000;

  async updateAndCheck(input: any, prediction: any): Promise<number> {
    // Add to history
    this.inputHistory.push(input);
    this.predictionHistory.push(prediction);

    // Maintain size limit
    if (this.inputHistory.length > this.maxHistorySize) {
      this.inputHistory = this.inputHistory.slice(-this.maxHistorySize);
      this.predictionHistory = this.predictionHistory.slice(-this.maxHistorySize);
    }

    // Calculate drift (simplified)
    if (this.inputHistory.length < 50) return 0; // Need minimum samples

    const recentInputs = this.inputHistory.slice(-25);
    const historicalInputs = this.inputHistory.slice(0, 25);

    return this.calculateDistributionDrift(recentInputs, historicalInputs);
  }

  async generateReport(): Promise<{
    overallDrift: number;
    inputDrift: number;
    predictionDrift: number;
    summary: string;
  }> {
    if (this.inputHistory.length < 100) {
      return {
        overallDrift: 0,
        inputDrift: 0,
        predictionDrift: 0,
        summary: 'Insufficient data for drift analysis'
      };
    }

    const midpoint = Math.floor(this.inputHistory.length / 2);
    const oldInputs = this.inputHistory.slice(0, midpoint);
    const newInputs = this.inputHistory.slice(midpoint);
    const oldPredictions = this.predictionHistory.slice(0, midpoint);
    const newPredictions = this.predictionHistory.slice(midpoint);

    const inputDrift = this.calculateDistributionDrift(oldInputs, newInputs);
    const predictionDrift = this.calculateDistributionDrift(oldPredictions, newPredictions);
    const overallDrift = Math.max(inputDrift, predictionDrift);

    return {
      overallDrift,
      inputDrift,
      predictionDrift,
      summary: `Input drift: ${inputDrift.toFixed(3)}, Prediction drift: ${predictionDrift.toFixed(3)}`
    };
  }

  private calculateDistributionDrift(sample1: any[], sample2: any[]): number {
    // Simplified drift calculation using statistical differences
    if (sample1.length === 0 || sample2.length === 0) return 0;

    // For numeric inputs, calculate mean difference
    const nums1 = this.extractNumbers(sample1);
    const nums2 = this.extractNumbers(sample2);

    if (nums1.length > 0 && nums2.length > 0) {
      const mean1 = nums1.reduce((a, b) => a + b, 0) / nums1.length;
      const mean2 = nums2.reduce((a, b) => a + b, 0) / nums2.length;
      const var1 = nums1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / nums1.length;
      const var2 = nums2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / nums2.length;

      const meanDiff = Math.abs(mean1 - mean2) / (Math.sqrt(var1) + Math.sqrt(var2) + 1e-6);
      const varDiff = Math.abs(var1 - var2) / (var1 + var2 + 1e-6);

      return Math.min(1, (meanDiff + varDiff) / 2);
    }

    return 0;
  }

  private extractNumbers(samples: any[]): number[] {
    const numbers: number[] = [];
    
    for (const sample of samples) {
      if (typeof sample === 'number') {
        numbers.push(sample);
      } else if (typeof sample === 'object' && sample !== null) {
        for (const value of Object.values(sample)) {
          if (typeof value === 'number') {
            numbers.push(value);
          }
        }
      }
    }
    
    return numbers;
  }
}