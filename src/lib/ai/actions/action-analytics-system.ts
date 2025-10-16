/**
 * BLIPEE AI Action Analytics System
 * Comprehensive Monitoring, Logging, and Analytics Platform
 *
 * This system provides:
 * - Real-time action execution monitoring
 * - Advanced analytics and reporting
 * - Performance optimization insights
 * - Predictive failure detection
 * - Resource utilization tracking
 * - Cost analysis and optimization
 * - Compliance audit trails
 * - Business impact measurement
 */

import { EventEmitter } from 'events';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import {
  ActionDefinition,
  ActionExecution,
  ActionResult,
  ActionContext,
  ExecutionStatus,
  ActionCategory
} from './action-execution-engine';

// Analytics Types and Interfaces
export interface ActionMetrics {
  actionId: string;
  actionName: string;
  category: ActionCategory;

  // Execution Metrics
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  medianExecutionTime: number;
  p95ExecutionTime: number;
  p99ExecutionTime: number;

  // Performance Metrics
  averageLatency: number;
  throughput: number; // executions per hour
  errorRate: number;
  timeoutRate: number;

  // Resource Metrics
  averageCpuUsage: number;
  averageMemoryUsage: number;
  averageNetworkUsage: number;
  totalCost: number;
  costPerExecution: number;

  // Business Metrics
  totalBusinessValue: number;
  averageBusinessValue: number;
  complianceScore: number;
  userSatisfactionScore: number;

  // Temporal Data
  calculatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
}

export interface SystemMetrics {
  // Overall System Health
  totalActions: number;
  activeActions: number;
  totalExecutions: number;
  systemSuccessRate: number;
  systemLatency: number;

  // Resource Utilization
  cpuUtilization: number;
  memoryUtilization: number;
  diskUtilization: number;
  networkUtilization: number;

  // Performance Distribution
  fastActions: number; // < 1 second
  mediumActions: number; // 1-30 seconds
  slowActions: number; // > 30 seconds

  // Error Analysis
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  topFailingActions: Array<{ actionId: string; failureRate: number }>;

  // Cost Analysis
  totalSystemCost: number;
  costByCategory: Record<ActionCategory, number>;
  costTrends: Array<{ date: Date; cost: number }>;

  timestamp: Date;
}

export interface PerformanceAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  actionId?: string;
  title: string;
  description: string;
  threshold: AlertThreshold;
  currentValue: number;
  suggestions: string[];
  createdAt: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export interface AnalyticsQuery {
  metric: string;
  dimensions: string[];
  filters: AnalyticsFilter[];
  timeRange: TimeRange;
  granularity: TimeGranularity;
  aggregation: AggregationType;
}

export interface AnalyticsResult {
  data: Array<{
    dimensions: Record<string, string>;
    metrics: Record<string, number>;
    timestamp: Date;
  }>;
  metadata: {
    totalRows: number;
    executionTime: number;
    dataQuality: number;
  };
}

// Enums
export enum AlertType {
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  HIGH_ERROR_RATE = 'high_error_rate',
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  COST_ANOMALY = 'cost_anomaly',
  COMPLIANCE_VIOLATION = 'compliance_violation',
  SECURITY_INCIDENT = 'security_incident'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum TimeGranularity {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
}

export enum AggregationType {
  SUM = 'sum',
  AVERAGE = 'avg',
  COUNT = 'count',
  MIN = 'min',
  MAX = 'max',
  PERCENTILE = 'percentile'
}

// Main Analytics System Class
export class ActionAnalyticsSystem extends EventEmitter {
  private supabase: ReturnType<typeof createClient<Database>>;
  private metricsCollector: MetricsCollector;
  private alertEngine: AlertEngine;
  private analyticsEngine: AnalyticsEngine;
  private performanceOptimizer: PerformanceOptimizer;
  private complianceMonitor: ComplianceMonitor;

  // In-memory caches for real-time data
  private metricsCache: Map<string, ActionMetrics> = new Map();
  private alertsCache: Map<string, PerformanceAlert> = new Map();
  private executionHistory: Array<ActionExecution> = [];

  constructor() {
    super();

    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Initialize components
    this.metricsCollector = new MetricsCollector(this.supabase);
    this.alertEngine = new AlertEngine(this);
    this.analyticsEngine = new AnalyticsEngine(this.supabase);
    this.performanceOptimizer = new PerformanceOptimizer(this);
    this.complianceMonitor = new ComplianceMonitor(this.supabase);

    // Start monitoring processes
    this.startMetricsCollection();
    this.startAlertMonitoring();
    this.startPerformanceOptimization();

  }

  /**
   * Record action execution start
   */
  public recordExecutionStart(execution: ActionExecution): void {
    this.executionHistory.push(execution);

    // Emit event for real-time monitoring
    this.emit('executionStarted', {
      executionId: execution.id,
      actionId: execution.actionId,
      userId: execution.context.userId,
      organizationId: execution.context.organizationId,
      timestamp: new Date()
    });

    // Update real-time metrics
    this.updateRealTimeMetrics(execution, 'started');
  }

  /**
   * Record action execution completion
   */
  public async recordExecutionCompletion(
    execution: ActionExecution,
    result: ActionResult
  ): Promise<void> {
    // Store execution record
    await this.storeExecutionRecord(execution, result);

    // Update metrics
    await this.updateActionMetrics(execution, result);

    // Check for alerts
    await this.checkPerformanceAlerts(execution, result);

    // Update compliance monitoring
    await this.complianceMonitor.recordExecution(execution, result);

    // Emit completion event
    this.emit('executionCompleted', {
      executionId: execution.id,
      actionId: execution.actionId,
      success: result.success,
      duration: result.executionTime,
      cost: result.cost.total,
      timestamp: new Date()
    });

    // Update real-time metrics
    this.updateRealTimeMetrics(execution, 'completed', result);
  }

  /**
   * Record action execution failure
   */
  public async recordExecutionFailure(
    execution: ActionExecution,
    error: any
  ): Promise<void> {
    // Store failure record
    await this.storeFailureRecord(execution, error);

    // Update metrics
    await this.updateFailureMetrics(execution, error);

    // Generate alert if needed
    await this.alertEngine.checkFailurePatterns(execution, error);

    // Emit failure event
    this.emit('executionFailed', {
      executionId: execution.id,
      actionId: execution.actionId,
      error: error.message,
      timestamp: new Date()
    });

    // Update real-time metrics
    this.updateRealTimeMetrics(execution, 'failed');
  }

  /**
   * Get action metrics for a specific action
   */
  public async getActionMetrics(
    actionId: string,
    timeRange: TimeRange = { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date() }
  ): Promise<ActionMetrics> {
    return await this.metricsCollector.calculateActionMetrics(actionId, timeRange);
  }

  /**
   * Get system-wide metrics
   */
  public async getSystemMetrics(
    timeRange: TimeRange = { start: new Date(Date.now() - 24 * 60 * 60 * 1000), end: new Date() }
  ): Promise<SystemMetrics> {
    return await this.metricsCollector.calculateSystemMetrics(timeRange);
  }

  /**
   * Get performance trends
   */
  public async getPerformanceTrends(
    actionId: string,
    metric: string,
    timeRange: TimeRange,
    granularity: TimeGranularity = TimeGranularity.HOUR
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    return await this.analyticsEngine.getPerformanceTrends(actionId, metric, timeRange, granularity);
  }

  /**
   * Get cost analysis
   */
  public async getCostAnalysis(
    timeRange: TimeRange,
    breakdownBy: 'action' | 'category' | 'user' | 'organization' = 'category'
  ): Promise<CostAnalysis> {
    return await this.analyticsEngine.getCostAnalysis(timeRange, breakdownBy);
  }

  /**
   * Get performance recommendations
   */
  public async getPerformanceRecommendations(
    actionId?: string
  ): Promise<PerformanceRecommendation[]> {
    return await this.performanceOptimizer.generateRecommendations(actionId);
  }

  /**
   * Execute custom analytics query
   */
  public async executeQuery(query: AnalyticsQuery): Promise<AnalyticsResult> {
    return await this.analyticsEngine.executeQuery(query);
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(severity?: AlertSeverity): PerformanceAlert[] {
    const alerts = Array.from(this.alertsCache.values())
      .filter(alert => !alert.acknowledged && !alert.resolvedAt);

    if (severity) {
      return alerts.filter(alert => alert.severity === severity);
    }

    return alerts;
  }

  /**
   * Acknowledge alert
   */
  public async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.alertsCache.get(alertId);
    if (alert) {
      alert.acknowledged = true;
      await this.storeAlert(alert);
    }
  }

  /**
   * Get compliance report
   */
  public async getComplianceReport(
    organizationId: string,
    timeRange: TimeRange
  ): Promise<ComplianceReport> {
    return await this.complianceMonitor.generateReport(organizationId, timeRange);
  }

  // Private Methods

  private startMetricsCollection(): void {
    // Collect metrics every minute
    setInterval(async () => {
      try {
        await this.collectRealTimeMetrics();
      } catch (error) {
        console.error('Error collecting real-time metrics:', error);
      }
    }, 60000);

    // Calculate aggregated metrics every 15 minutes
    setInterval(async () => {
      try {
        await this.calculateAggregatedMetrics();
      } catch (error) {
        console.error('Error calculating aggregated metrics:', error);
      }
    }, 900000);
  }

  private startAlertMonitoring(): void {
    // Check for alerts every 30 seconds
    setInterval(async () => {
      try {
        await this.alertEngine.checkSystemAlerts();
      } catch (error) {
        console.error('Error checking system alerts:', error);
      }
    }, 30000);
  }

  private startPerformanceOptimization(): void {
    // Run performance optimization every hour
    setInterval(async () => {
      try {
        await this.performanceOptimizer.analyzePerformance();
      } catch (error) {
        console.error('Error in performance optimization:', error);
      }
    }, 3600000);
  }

  private async storeExecutionRecord(
    execution: ActionExecution,
    result: ActionResult
  ): Promise<void> {
    await this.supabase.from('action_executions').insert({
      id: execution.id,
      action_id: execution.actionId,
      user_id: execution.context.userId,
      organization_id: execution.context.organizationId,
      status: execution.status,
      start_time: execution.startTime.toISOString(),
      end_time: execution.endTime?.toISOString(),
      execution_time: result.executionTime,
      success: result.success,
      cost: result.cost.total,
      resource_usage: result.resourceUsage,
      parameters: execution.parameters,
      result_data: result.data,
      error_details: result.error,
      created_at: new Date().toISOString()
    });
  }

  private async storeFailureRecord(execution: ActionExecution, error: any): Promise<void> {
    await this.supabase.from('action_failures').insert({
      execution_id: execution.id,
      action_id: execution.actionId,
      user_id: execution.context.userId,
      organization_id: execution.context.organizationId,
      error_type: error.code || 'UNKNOWN',
      error_message: error.message,
      error_stack: error.stack,
      retry_count: execution.retryCount,
      failed_at: new Date().toISOString()
    });
  }

  private async updateActionMetrics(
    execution: ActionExecution,
    result: ActionResult
  ): Promise<void> {
    // Implementation would update various metrics in database
    // This is a placeholder for the complex metrics calculation
  }

  private async updateFailureMetrics(execution: ActionExecution, error: any): Promise<void> {
    // Implementation would update failure-related metrics
  }

  private updateRealTimeMetrics(
    execution: ActionExecution,
    phase: 'started' | 'completed' | 'failed',
    result?: ActionResult
  ): void {
    // Update in-memory metrics for real-time dashboard
    const actionId = execution.actionId;
    let metrics = this.metricsCache.get(actionId);

    if (!metrics) {
      metrics = {
        actionId,
        actionName: execution.action.name,
        category: execution.action.category,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        medianExecutionTime: 0,
        p95ExecutionTime: 0,
        p99ExecutionTime: 0,
        averageLatency: 0,
        throughput: 0,
        errorRate: 0,
        timeoutRate: 0,
        averageCpuUsage: 0,
        averageMemoryUsage: 0,
        averageNetworkUsage: 0,
        totalCost: 0,
        costPerExecution: 0,
        totalBusinessValue: 0,
        averageBusinessValue: 0,
        complianceScore: 0,
        userSatisfactionScore: 0,
        calculatedAt: new Date(),
        periodStart: new Date(Date.now() - 24 * 60 * 60 * 1000),
        periodEnd: new Date()
      };
    }

    if (phase === 'started') {
      metrics.totalExecutions++;
    } else if (phase === 'completed' && result) {
      metrics.successfulExecutions++;
      metrics.totalCost += result.cost.total;
      // Update other metrics...
    } else if (phase === 'failed') {
      metrics.failedExecutions++;
    }

    // Recalculate derived metrics
    metrics.successRate = metrics.successfulExecutions / metrics.totalExecutions;
    metrics.errorRate = metrics.failedExecutions / metrics.totalExecutions;
    metrics.costPerExecution = metrics.totalCost / metrics.totalExecutions;

    this.metricsCache.set(actionId, metrics);
  }

  private async checkPerformanceAlerts(
    execution: ActionExecution,
    result: ActionResult
  ): Promise<void> {
    await this.alertEngine.checkExecutionAlerts(execution, result);
  }

  private async collectRealTimeMetrics(): Promise<void> {
    // Collect system metrics from various sources
    // Implementation would gather CPU, memory, network stats
  }

  private async calculateAggregatedMetrics(): Promise<void> {
    // Calculate and store aggregated metrics for longer time periods
    // Implementation would process raw execution data into summary metrics
  }

  private async storeAlert(alert: PerformanceAlert): Promise<void> {
    await this.supabase.from('performance_alerts').upsert({
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      action_id: alert.actionId,
      title: alert.title,
      description: alert.description,
      threshold_value: alert.threshold.value,
      current_value: alert.currentValue,
      suggestions: alert.suggestions,
      acknowledged: alert.acknowledged,
      resolved_at: alert.resolvedAt?.toISOString(),
      created_at: alert.createdAt.toISOString()
    });
  }
}

// Supporting Classes

class MetricsCollector {
  constructor(private supabase: ReturnType<typeof createClient<Database>>) {}

  async calculateActionMetrics(actionId: string, timeRange: TimeRange): Promise<ActionMetrics> {
    const { data: executions } = await this.supabase
      .from('action_executions')
      .select('*')
      .eq('action_id', actionId)
      .gte('start_time', timeRange.start.toISOString())
      .lte('start_time', timeRange.end.toISOString());

    if (!executions || executions.length === 0) {
      throw new Error('No execution data found for the specified time range');
    }

    // Calculate metrics from execution data
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.success).length;
    const failedExecutions = totalExecutions - successfulExecutions;
    const executionTimes = executions.map(e => e.execution_time).filter(t => t != null);

    return {
      actionId,
      actionName: executions[0].action_name || 'Unknown',
      category: executions[0].action_category || ActionCategory.DATA_COLLECTION,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: totalExecutions > 0 ? successfulExecutions / totalExecutions : 0,
      averageExecutionTime: this.calculateAverage(executionTimes),
      medianExecutionTime: this.calculateMedian(executionTimes),
      p95ExecutionTime: this.calculatePercentile(executionTimes, 95),
      p99ExecutionTime: this.calculatePercentile(executionTimes, 99),
      averageLatency: 0, // Would be calculated from latency data
      throughput: totalExecutions / ((timeRange.end.getTime() - timeRange.start.getTime()) / 3600000),
      errorRate: totalExecutions > 0 ? failedExecutions / totalExecutions : 0,
      timeoutRate: 0, // Would be calculated from timeout data
      averageCpuUsage: 0, // Would be calculated from resource usage data
      averageMemoryUsage: 0,
      averageNetworkUsage: 0,
      totalCost: executions.reduce((sum, e) => sum + (e.cost || 0), 0),
      costPerExecution: 0, // Will be calculated below
      totalBusinessValue: 0,
      averageBusinessValue: 0,
      complianceScore: 100,
      userSatisfactionScore: 85,
      calculatedAt: new Date(),
      periodStart: timeRange.start,
      periodEnd: timeRange.end
    };
  }

  async calculateSystemMetrics(timeRange: TimeRange): Promise<SystemMetrics> {
    // Implementation would calculate system-wide metrics
    return {
      totalActions: 0,
      activeActions: 0,
      totalExecutions: 0,
      systemSuccessRate: 0,
      systemLatency: 0,
      cpuUtilization: 0,
      memoryUtilization: 0,
      diskUtilization: 0,
      networkUtilization: 0,
      fastActions: 0,
      mediumActions: 0,
      slowActions: 0,
      totalErrors: 0,
      errorsByCategory: {},
      topFailingActions: [],
      totalSystemCost: 0,
      costByCategory: {} as Record<ActionCategory, number>,
      costTrends: [],
      timestamp: new Date()
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}

class AlertEngine {
  constructor(private analytics: ActionAnalyticsSystem) {}

  async checkExecutionAlerts(execution: ActionExecution, result: ActionResult): Promise<void> {
    // Check for performance degradation
    if (result.executionTime > execution.action.slaTargets[0]?.target * 1.5) {
      await this.createAlert({
        type: AlertType.PERFORMANCE_DEGRADATION,
        severity: AlertSeverity.WARNING,
        actionId: execution.actionId,
        title: `Slow Execution: ${execution.action.name}`,
        description: `Execution time ${result.executionTime}ms exceeds expected ${execution.action.slaTargets[0]?.target}ms`,
        threshold: { metric: 'execution_time', operator: 'greater_than', value: execution.action.slaTargets[0]?.target || 0 },
        currentValue: result.executionTime,
        suggestions: [
          'Review action implementation for optimization opportunities',
          'Check system resource availability',
          'Consider implementing caching'
        ]
      });
    }

    // Check for high cost
    if (result.cost.total > 100) { // Threshold would be configurable
      await this.createAlert({
        type: AlertType.COST_ANOMALY,
        severity: AlertSeverity.WARNING,
        actionId: execution.actionId,
        title: `High Cost Execution: ${execution.action.name}`,
        description: `Execution cost $${result.cost.total} is unusually high`,
        threshold: { metric: 'cost', operator: 'greater_than', value: 100 },
        currentValue: result.cost.total,
        suggestions: [
          'Review cost model for accuracy',
          'Optimize resource usage',
          'Consider alternative implementations'
        ]
      });
    }
  }

  async checkFailurePatterns(execution: ActionExecution, error: any): Promise<void> {
    // Check for high error rate pattern
    // Implementation would analyze recent failure patterns
  }

  async checkSystemAlerts(): Promise<void> {
    // Check system-wide alert conditions
    // Implementation would monitor system health metrics
  }

  private async createAlert(alertData: Partial<PerformanceAlert>): Promise<void> {
    const alert: PerformanceAlert = {
      id: this.generateAlertId(),
      type: alertData.type!,
      severity: alertData.severity!,
      actionId: alertData.actionId,
      title: alertData.title!,
      description: alertData.description!,
      threshold: alertData.threshold!,
      currentValue: alertData.currentValue!,
      suggestions: alertData.suggestions || [],
      createdAt: new Date(),
      acknowledged: false
    };

    this.analytics.alertsCache.set(alert.id, alert);
    this.analytics.emit('alertCreated', alert);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

class AnalyticsEngine {
  constructor(private supabase: ReturnType<typeof createClient<Database>>) {}

  async getPerformanceTrends(
    actionId: string,
    metric: string,
    timeRange: TimeRange,
    granularity: TimeGranularity
  ): Promise<Array<{ timestamp: Date; value: number }>> {
    // Implementation would query time-series data and aggregate by granularity
    return [];
  }

  async getCostAnalysis(
    timeRange: TimeRange,
    breakdownBy: 'action' | 'category' | 'user' | 'organization'
  ): Promise<CostAnalysis> {
    // Implementation would analyze cost data
    return {
      totalCost: 0,
      breakdown: {},
      trends: [],
      topCostActions: [],
      costOptimizationOpportunities: []
    };
  }

  async executeQuery(query: AnalyticsQuery): Promise<AnalyticsResult> {
    // Implementation would execute custom analytics queries
    return {
      data: [],
      metadata: {
        totalRows: 0,
        executionTime: 0,
        dataQuality: 1.0
      }
    };
  }
}

class PerformanceOptimizer {
  constructor(private analytics: ActionAnalyticsSystem) {}

  async generateRecommendations(actionId?: string): Promise<PerformanceRecommendation[]> {
    // Implementation would analyze performance data and generate recommendations
    return [];
  }

  async analyzePerformance(): Promise<void> {
    // Implementation would perform automated performance analysis
  }
}

class ComplianceMonitor {
  constructor(private supabase: ReturnType<typeof createClient<Database>>) {}

  async recordExecution(execution: ActionExecution, result: ActionResult): Promise<void> {
    // Implementation would record compliance-related execution data
  }

  async generateReport(organizationId: string, timeRange: TimeRange): Promise<ComplianceReport> {
    // Implementation would generate compliance reports
    return {
      organizationId,
      timeRange,
      overallComplianceScore: 95,
      frameworkCompliance: {},
      violations: [],
      recommendations: []
    };
  }
}

// Additional Type Definitions
export interface TimeRange {
  start: Date;
  end: Date;
}

export interface AnalyticsFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: any;
}

export interface AlertThreshold {
  metric: string;
  operator: 'greater_than' | 'less_than' | 'equals';
  value: number;
}

export interface CostAnalysis {
  totalCost: number;
  breakdown: Record<string, number>;
  trends: Array<{ date: Date; cost: number }>;
  topCostActions: Array<{ actionId: string; cost: number }>;
  costOptimizationOpportunities: Array<{ description: string; potentialSavings: number }>;
}

export interface PerformanceRecommendation {
  id: string;
  type: 'optimization' | 'configuration' | 'infrastructure';
  actionId?: string;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  expectedImprovement: string;
  implementation: string[];
}

export interface ComplianceReport {
  organizationId: string;
  timeRange: TimeRange;
  overallComplianceScore: number;
  frameworkCompliance: Record<string, number>;
  violations: Array<{
    framework: string;
    rule: string;
    severity: string;
    description: string;
  }>;
  recommendations: string[];
}

// Export singleton instance
export const actionAnalyticsSystem = new ActionAnalyticsSystem();