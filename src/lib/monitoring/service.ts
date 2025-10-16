import { EventEmitter } from 'events';
import {
  Metric,
  MetricType,
  Alert,
  AlertRule,
  AlertSeverity,
  AlertChannel,
  SecurityEvent,
  HealthCheck,
  MonitoringDashboard,
  NotificationConfig,
} from './types';
import { auditService } from '@/lib/audit/service';
import { AuditEventType, AuditEventSeverity } from '@/lib/audit/types';
import { supabaseAdmin } from '@/lib/supabase/admin';

export class MonitoringService extends EventEmitter {
  private metrics: Map<string, Metric[]> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private securityEvents: SecurityEvent[] = [];
  private notificationConfig: NotificationConfig = {};
  private metricsRetentionMs = 24 * 60 * 60 * 1000; // 24 hours
  private evaluationInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initialize();
  }

  private async initialize() {
    // Load configuration from database
    await this.loadConfiguration();
    
    // Start metric evaluation
    this.startEvaluation();
    
    // Clean up old metrics periodically
    setInterval(() => this.cleanupOldMetrics(), 60 * 60 * 1000); // Every hour
  }

  /**
   * Record a metric
   */
  async recordMetric(metric: Metric): Promise<void> {
    const key = this.getMetricKey(metric.name, metric.labels);
    
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }
    
    const metrics = this.metrics.get(key)!;
    metrics.push({
      ...metric,
      timestamp: metric.timestamp || new Date(),
    });
    
    // Emit metric event
    this.emit('metric', metric);
    
    // Check if this is a security-related metric
    if (this.isSecurityMetric(metric.name)) {
      await this.handleSecurityMetric(metric);
    }
  }

  /**
   * Record multiple metrics in batch
   */
  async recordMetrics(metrics: Metric[]): Promise<void> {
    await Promise.all(metrics.map(metric => this.recordMetric(metric)));
  }

  /**
   * Get metrics for a specific name and time range
   */
  getMetrics(
    name: string,
    labels?: Record<string, string>,
    startTime?: Date,
    endTime?: Date
  ): Metric[] {
    const key = this.getMetricKey(name, labels);
    const metrics = this.metrics.get(key) || [];
    
    if (!startTime && !endTime) {
      return metrics;
    }
    
    const start = startTime?.getTime() || 0;
    const end = endTime?.getTime() || Date.now();
    
    return metrics.filter(m => {
      const time = m.timestamp!.getTime();
      return time >= start && time <= end;
    });
  }

  /**
   * Create or update an alert rule
   */
  async setAlertRule(rule: AlertRule): Promise<void> {
    this.alertRules.set(rule.id, rule);
    
    // Store in database
    const { error } = await supabaseAdmin
      .from('alert_rules')
      .upsert({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        metric: rule.metric,
        condition: rule.condition,
        threshold: rule.threshold,
        duration: rule.duration,
        severity: rule.severity,
        channels: rule.channels,
        enabled: rule.enabled,
        metadata: rule.metadata,
      });
    
    if (error) {
      console.error('Failed to save alert rule:', error);
    }
    
    // Audit log
    await auditService.log({
      type: AuditEventType.SYSTEM_CONFIG_CHANGED,
      severity: AuditEventSeverity.INFO,
      actor: { type: 'system', id: 'monitoring-service' },
      context: {},
      metadata: {
        action: 'alert_rule_updated',
        ruleId: rule.id,
        ruleName: rule.name,
      },
      result: 'success',
    });
  }

  /**
   * Delete an alert rule
   */
  async deleteAlertRule(ruleId: string): Promise<void> {
    this.alertRules.delete(ruleId);
    
    const { error } = await supabaseAdmin
      .from('alert_rules')
      .delete()
      .eq('id', ruleId);
    
    if (error) {
      console.error('Failed to delete alert rule:', error);
    }
  }

  /**
   * Record a security event
   */
  async recordSecurityEvent(event: SecurityEvent): Promise<void> {
    this.securityEvents.push(event);
    
    // Keep only recent events (last 1000)
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
    
    // Store in database
    const { error } = await supabaseAdmin
      .from('security_events')
      .insert({
        id: event.id,
        type: event.type,
        severity: event.severity,
        source: event.source,
        user_id: event.userId,
        ip: event.ip,
        user_agent: event.userAgent,
        details: event.details,
        timestamp: event.timestamp,
        handled: event.handled,
      });
    
    if (error) {
      console.error('Failed to store security event:', error);
    }
    
    // Emit security event
    this.emit('security-event', event);
    
    // Check if alert should be triggered
    if (event.severity === AlertSeverity.CRITICAL && !event.handled) {
      await this.createSecurityAlert(event);
    }
  }

  /**
   * Update health check status
   */
  async updateHealthCheck(check: HealthCheck): Promise<void> {
    this.healthChecks.set(check.service, check);
    
    // Check if service is unhealthy
    if (check.status === 'unhealthy') {
      await this.createHealthAlert(check);
    }
  }

  /**
   * Get monitoring dashboard data
   */
  async getDashboard(): Promise<MonitoringDashboard> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Calculate request metrics
    const requestMetrics = this.getMetrics('http_requests_total', undefined, oneHourAgo);
    const successMetrics = this.getMetrics('http_requests_total', { status: 'success' }, oneHourAgo);
    const failureMetrics = this.getMetrics('http_requests_total', { status: 'failure' }, oneHourAgo);
    
    const totalRequests = requestMetrics.reduce((sum, m) => sum + m.value, 0);
    const successRequests = successMetrics.reduce((sum, m) => sum + m.value, 0);
    const failureRequests = failureMetrics.reduce((sum, m) => sum + m.value, 0);
    const requestRate = totalRequests / 60; // per minute
    
    // Calculate security metrics
    const loginAttempts = this.getMetrics('login_attempts_total', undefined, oneHourAgo)
      .reduce((sum, m) => sum + m.value, 0);
    const failedLogins = this.getMetrics('failed_logins_total', undefined, oneHourAgo)
      .reduce((sum, m) => sum + m.value, 0);
    const mfaVerifications = this.getMetrics('mfa_verifications_total', undefined, oneHourAgo)
      .reduce((sum, m) => sum + m.value, 0);
    const suspiciousActivities = this.securityEvents
      .filter(e => e.timestamp > oneHourAgo && e.severity === AlertSeverity.WARNING)
      .length;
    
    // Calculate performance metrics
    const responseTimeMetrics = this.getMetrics('http_response_time_ms', undefined, oneHourAgo);
    const responseTimes = responseTimeMetrics.map(m => m.value).sort((a, b) => a - b);
    
    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length
      : 0;
    const p95ResponseTime = responseTimes.length > 0
      ? responseTimes[Math.floor(responseTimes.length * 0.95)]
      : 0;
    const p99ResponseTime = responseTimes.length > 0
      ? responseTimes[Math.floor(responseTimes.length * 0.99)]
      : 0;
    const errorRate = totalRequests > 0 ? (failureRequests / totalRequests) * 100 : 0;
    
    // Get system metrics (would typically come from system monitoring)
    const cpuUsage = this.getLatestMetricValue('system_cpu_usage_percent') || 0;
    const memoryUsage = this.getLatestMetricValue('system_memory_usage_percent') || 0;
    const diskUsage = this.getLatestMetricValue('system_disk_usage_percent') || 0;
    const activeConnections = this.getLatestMetricValue('active_connections') || 0;
    
    return {
      metrics: {
        requests: {
          total: totalRequests,
          success: successRequests,
          failure: failureRequests,
          rate: requestRate,
        },
        security: {
          loginAttempts,
          failedLogins,
          mfaVerifications,
          suspiciousActivities,
        },
        performance: {
          avgResponseTime,
          p95ResponseTime,
          p99ResponseTime,
          errorRate,
        },
        system: {
          cpuUsage,
          memoryUsage,
          diskUsage,
          activeConnections,
        },
      },
      alerts: Array.from(this.alerts.values()).filter(a => !a.resolved),
      healthChecks: Array.from(this.healthChecks.values()),
      recentEvents: this.securityEvents.slice(-10),
    };
  }

  /**
   * Get all alerts with optional filters
   */
  async getAlerts(filters?: {
    severity?: AlertSeverity;
    limit?: number;
    resolved?: boolean;
  }): Promise<Alert[]> {
    let alerts = Array.from(this.alerts.values());
    
    // Apply filters
    if (filters?.severity) {
      alerts = alerts.filter(a => a.severity === filters.severity);
    }
    
    if (filters?.resolved !== undefined) {
      alerts = alerts.filter(a => a.resolved === filters.resolved);
    }
    
    // Sort by timestamp (newest first)
    alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply limit
    if (filters?.limit) {
      alerts = alerts.slice(0, filters.limit);
    }
    
    return alerts;
  }

  /**
   * Get all alert rules
   */
  async getAlertRules(): Promise<AlertRule[]> {
    return Array.from(this.alertRules.values());
  }

  /**
   * Manually trigger an alert
   */
  async triggerAlert(alert: {
    id: string;
    name: string;
    severity: AlertSeverity;
    message: string;
    details?: any;
    timestamp: Date;
  }): Promise<Alert> {
    const alertObj: Alert = {
      ...alert,
      resolved: false,
    };
    
    this.alerts.set(alert.id, alertObj);
    
    // Store in database
    await supabaseAdmin
      .from('alerts')
      .insert({
        id: alertObj.id,
        name: alertObj.name,
        severity: alertObj.severity,
        message: alertObj.message,
        details: alertObj.details,
        timestamp: alertObj.timestamp,
        resolved: alertObj.resolved,
      });
    
    // Emit alert event
    this.emit('alert', alertObj);
    
    return alertObj;
  }

  /**
   * Configure notifications
   */
  async setNotificationConfig(config: NotificationConfig): Promise<void> {
    this.notificationConfig = config;
    
    // Store in database
    const { error } = await supabaseAdmin
      .from('notification_configs')
      .upsert({
        id: 'default',
        config,
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Failed to save notification config:', error);
    }
  }

  /**
   * Start metric evaluation loop
   */
  private startEvaluation(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
    }
    
    // Evaluate metrics every 30 seconds
    this.evaluationInterval = setInterval(() => {
      this.evaluateAlertRules();
    }, 30 * 1000);
  }

  /**
   * Evaluate all alert rules
   */
  private async evaluateAlertRules(): Promise<void> {
    const entries = Array.from(this.alertRules.entries());
    for (const [ruleId, rule] of entries) {
      if (!rule.enabled) continue;
      
      try {
        await this.evaluateRule(rule);
      } catch (error) {
        console.error(`Failed to evaluate rule ${ruleId}:`, error);
      }
    }
  }

  /**
   * Evaluate a single alert rule
   */
  private async evaluateRule(rule: AlertRule): Promise<void> {
    const now = new Date();
    const duration = rule.duration || 0;
    const startTime = new Date(now.getTime() - duration * 1000);
    
    const metrics = this.getMetrics(rule.metric, undefined, startTime);
    if (metrics.length === 0) return;
    
    // Calculate the current value based on the metrics
    const currentValue = this.calculateMetricValue(metrics);
    
    // Check if condition is met
    const conditionMet = this.checkCondition(currentValue, rule.condition, rule.threshold);
    
    const existingAlert = Array.from(this.alerts.values())
      .find(a => a.name === rule.name && !a.resolved);
    
    if (conditionMet && !existingAlert) {
      // Create new alert
      await this.createAlert(rule, currentValue);
    } else if (!conditionMet && existingAlert) {
      // Resolve existing alert
      await this.resolveAlert(existingAlert.id);
    }
  }

  /**
   * Calculate metric value from multiple data points
   */
  private calculateMetricValue(metrics: Metric[]): number {
    if (metrics.length === 0) return 0;
    
    const values = metrics.map(m => m.value);
    const type = metrics[0].type;
    
    switch (type) {
      case MetricType.COUNTER:
      case MetricType.GAUGE:
        // Use the latest value
        return values[values.length - 1];
      
      case MetricType.HISTOGRAM:
      case MetricType.SUMMARY:
        // Use average
        return values.reduce((sum, v) => sum + v, 0) / values.length;
      
      default:
        return values[values.length - 1];
    }
  }

  /**
   * Check if condition is met
   */
  private checkCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'neq': return value !== threshold;
      default: return false;
    }
  }

  /**
   * Create a new alert
   */
  private async createAlert(rule: AlertRule, currentValue: number): Promise<void> {
    const alert: Alert = {
      id: crypto.randomUUID(),
      name: rule.name,
      severity: rule.severity,
      message: `Alert: ${rule.name} - Current value (${currentValue}) ${rule.condition} threshold (${rule.threshold})`,
      details: {
        rule: rule.id,
        currentValue,
        threshold: rule.threshold,
        condition: rule.condition,
      },
      metric: rule.metric,
      threshold: rule.threshold,
      currentValue,
      timestamp: new Date(),
      resolved: false,
    };
    
    this.alerts.set(alert.id, alert);
    
    // Store in database
    await supabaseAdmin
      .from('alerts')
      .insert({
        id: alert.id,
        name: alert.name,
        severity: alert.severity,
        message: alert.message,
        details: alert.details,
        metric: alert.metric,
        threshold: alert.threshold,
        current_value: alert.currentValue,
        timestamp: alert.timestamp,
        resolved: alert.resolved,
      });
    
    // Send notifications
    await this.sendAlertNotifications(alert, rule.channels);
    
    // Emit alert event
    this.emit('alert', alert);
    
    // Audit log
    await auditService.log({
      type: AuditEventType.SYSTEM_ERROR,
      severity: this.mapAlertSeverityToAudit(alert.severity),
      actor: { type: 'system', id: 'monitoring-service' },
      context: {},
      metadata: {
        action: 'alert_triggered',
        alertId: alert.id,
        alertName: alert.name,
        severity: alert.severity,
        currentValue,
        threshold: rule.threshold,
      },
      result: 'success',
    });
  }

  /**
   * Resolve an alert
   */
  private async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (!alert) return;
    
    alert.resolved = true;
    alert.resolvedAt = new Date();
    
    // Update in database
    await supabaseAdmin
      .from('alerts')
      .update({
        resolved: true,
        resolved_at: alert.resolvedAt,
      })
      .eq('id', alertId);
    
    // Emit resolved event
    this.emit('alert-resolved', alert);
  }

  /**
   * Create security alert
   */
  private async createSecurityAlert(event: SecurityEvent): Promise<void> {
    const alert: Alert = {
      id: crypto.randomUUID(),
      name: 'Security Alert',
      severity: event.severity,
      message: `Security event: ${event.type} from ${event.source}`,
      details: {
        eventId: event.id,
        eventType: event.type,
        source: event.source,
        userId: event.userId,
        ip: event.ip,
        details: event.details,
      },
      timestamp: new Date(),
      resolved: false,
    };
    
    this.alerts.set(alert.id, alert);
    
    // Send notifications for critical security alerts
    await this.sendAlertNotifications(alert, [
      AlertChannel.EMAIL,
      AlertChannel.SMS,
      AlertChannel.SLACK,
    ]);
  }

  /**
   * Create health alert
   */
  private async createHealthAlert(check: HealthCheck): Promise<void> {
    const alert: Alert = {
      id: crypto.randomUUID(),
      name: 'Service Health Alert',
      severity: AlertSeverity.ERROR,
      message: `Service ${check.service} is ${check.status}`,
      details: {
        service: check.service,
        status: check.status,
        responseTime: check.responseTime,
        lastCheck: check.lastCheck,
        details: check.details,
      },
      timestamp: new Date(),
      resolved: false,
    };
    
    this.alerts.set(alert.id, alert);
    
    // Send notifications
    await this.sendAlertNotifications(alert, [
      AlertChannel.EMAIL,
      AlertChannel.SLACK,
      AlertChannel.PAGERDUTY,
    ]);
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotifications(
    alert: Alert,
    channels: AlertChannel[]
  ): Promise<void> {
    for (const channel of channels) {
      try {
        await this.sendNotification(channel, alert);
      } catch (error) {
        console.error(`Failed to send ${channel} notification:`, error);
      }
    }
  }

  /**
   * Send notification through specific channel
   */
  private async sendNotification(
    channel: AlertChannel,
    alert: Alert
  ): Promise<void> {
    switch (channel) {
      case AlertChannel.EMAIL:
        await this.sendEmailNotification(alert);
        break;
      
      case AlertChannel.SMS:
        await this.sendSMSNotification(alert);
        break;
      
      case AlertChannel.SLACK:
        await this.sendSlackNotification(alert);
        break;
      
      case AlertChannel.PAGERDUTY:
        await this.sendPagerDutyNotification(alert);
        break;
      
      case AlertChannel.WEBHOOK:
        await this.sendWebhookNotification(alert);
        break;
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert): Promise<void> {
    if (!this.notificationConfig.email?.enabled) return;
    
    const { emailMFAService } = await import('@/lib/auth/mfa/email');

    for (const recipient of this.notificationConfig.email.recipients) {
      // Reuse email service for sending alerts
      // TODO: Implement email notification with proper template
      console.log(`Sending alert email to ${recipient}:`, alert.name);
    }
  }

  /**
   * Send SMS notification
   */
  private async sendSMSNotification(alert: Alert): Promise<void> {
    if (!this.notificationConfig.sms?.enabled) return;

    const { smsMFAService } = await import('@/lib/auth/mfa/sms');

    for (const recipient of this.notificationConfig.sms.recipients) {
      // Reuse SMS service for sending alerts
      // TODO: Implement SMS notification with proper formatting
      console.log(`Sending alert SMS to ${recipient}:`, `${alert.name}: ${alert.message}`);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert): Promise<void> {
    if (!this.notificationConfig.slack?.enabled) return;
    
    const payload = {
      channel: this.notificationConfig.slack.channel,
      username: this.notificationConfig.slack.username || 'blipee OS Monitoring',
      icon_emoji: ':warning:',
      attachments: [{
        color: this.getAlertColor(alert.severity),
        title: alert.name,
        text: alert.message,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true,
          },
          {
            title: 'Time',
            value: alert.timestamp.toISOString(),
            short: true,
          },
        ],
        footer: 'blipee OS Monitoring',
        ts: Math.floor(alert.timestamp.getTime() / 1000),
      }],
    };
    
    // Send to Slack webhook
  }

  /**
   * Send PagerDuty notification
   */
  private async sendPagerDutyNotification(alert: Alert): Promise<void> {
    if (!this.notificationConfig.pagerduty?.enabled) return;
    
    const event = {
      routing_key: this.notificationConfig.pagerduty.integrationKey,
      event_action: 'trigger',
      dedup_key: alert.id,
      payload: {
        summary: alert.message,
        severity: this.mapAlertSeverityToPagerDuty(alert.severity),
        source: 'blipee-os',
        component: 'monitoring',
        group: alert.name,
        custom_details: alert.details,
      },
    };
    
    // Send to PagerDuty
  }

  /**
   * Send webhook notification
   */
  private async sendWebhookNotification(alert: Alert): Promise<void> {
    if (!this.notificationConfig.webhook?.enabled) return;
    
    const payload = {
      alert,
      timestamp: new Date().toISOString(),
      source: 'blipee-os-monitoring',
    };
    
    // Sign payload if secret is configured
    if (this.notificationConfig.webhook.secret) {
      const crypto = await import('crypto');
      const signature = crypto
        .createHmac('sha256', this.notificationConfig.webhook.secret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      // Add signature to headers
    }
  }

  /**
   * Get metric key for storage
   */
  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name;
    
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    
    return `${name}{${labelStr}}`;
  }

  /**
   * Check if metric is security-related
   */
  private isSecurityMetric(name: string): boolean {
    const securityMetrics = [
      'login_attempts',
      'failed_logins',
      'mfa_verifications',
      'suspicious_activity',
      'rate_limit_exceeded',
      'unauthorized_access',
    ];
    
    return securityMetrics.some(m => name.includes(m));
  }

  /**
   * Handle security metric
   */
  private async handleSecurityMetric(metric: Metric): Promise<void> {
    // Check for anomalies
    const recentMetrics = this.getMetrics(
      metric.name,
      metric.labels,
      new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );
    
    if (recentMetrics.length < 2) return;
    
    const values = recentMetrics.map(m => m.value);
    const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
    );
    
    // Check if current value is an anomaly (3 standard deviations)
    if (Math.abs(metric.value - avg) > 3 * stdDev) {
      await this.recordSecurityEvent({
        id: crypto.randomUUID(),
        type: 'metric_anomaly',
        severity: AlertSeverity.WARNING,
        source: 'monitoring-service',
        details: {
          metric: metric.name,
          value: metric.value,
          average: avg,
          stdDev,
          labels: metric.labels,
        },
        timestamp: new Date(),
        handled: false,
      });
    }
  }

  /**
   * Get latest value for a metric
   */
  private getLatestMetricValue(name: string, labels?: Record<string, string>): number | null {
    const metrics = this.getMetrics(name, labels);
    return metrics.length > 0 ? metrics[metrics.length - 1].value : null;
  }

  /**
   * Clean up old metrics
   */
  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.metricsRetentionMs;
    
    const entries = Array.from(this.metrics.entries());
    for (const [key, metrics] of entries) {
      const filtered = metrics.filter(m => m.timestamp!.getTime() > cutoff);
      
      if (filtered.length === 0) {
        this.metrics.delete(key);
      } else if (filtered.length < metrics.length) {
        this.metrics.set(key, filtered);
      }
    }
  }

  /**
   * Load configuration from database
   */
  private async loadConfiguration(): Promise<void> {
    // Load alert rules
    const { data: rules } = await supabaseAdmin
      .from('alert_rules')
      .select('*')
      .eq('enabled', true);
    
    if (rules) {
      for (const rule of rules) {
        this.alertRules.set(rule.id, {
          id: rule.id,
          name: rule.name,
          description: rule.description,
          metric: rule.metric,
          condition: rule.condition,
          threshold: rule.threshold,
          duration: rule.duration,
          severity: rule.severity,
          channels: rule.channels,
          enabled: rule.enabled,
          metadata: rule.metadata,
        });
      }
    }
    
    // Load notification config
    const { data: config } = await supabaseAdmin
      .from('notification_configs')
      .select('*')
      .eq('id', 'default')
      .single();
    
    if (config) {
      this.notificationConfig = config.config;
    }
  }

  /**
   * Get alert color for Slack
   */
  private getAlertColor(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO: return '#36a64f';
      case AlertSeverity.WARNING: return '#ff9900';
      case AlertSeverity.ERROR: return '#ff0000';
      case AlertSeverity.CRITICAL: return '#8b0000';
    }
  }

  /**
   * Map alert severity to PagerDuty severity
   */
  private mapAlertSeverityToPagerDuty(severity: AlertSeverity): string {
    switch (severity) {
      case AlertSeverity.INFO: return 'info';
      case AlertSeverity.WARNING: return 'warning';
      case AlertSeverity.ERROR: return 'error';
      case AlertSeverity.CRITICAL: return 'critical';
    }
  }

  /**
   * Map alert severity to audit severity
   */
  private mapAlertSeverityToAudit(severity: AlertSeverity): AuditEventSeverity {
    switch (severity) {
      case AlertSeverity.INFO: return AuditEventSeverity.INFO;
      case AlertSeverity.WARNING: return AuditEventSeverity.WARNING;
      case AlertSeverity.ERROR: return AuditEventSeverity.ERROR;
      case AlertSeverity.CRITICAL: return AuditEventSeverity.CRITICAL;
    }
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();