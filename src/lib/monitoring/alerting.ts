import { telemetry } from './telemetry';
import { healthCheck } from './health-check';

export interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  severity: 'critical' | 'warning' | 'info';
  channels: AlertChannel[];
  cooldown?: number; // Minutes before re-alerting
  enabled: boolean;
}

export interface AlertCondition {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold: number;
  duration?: number; // Seconds the condition must be true
  aggregation?: 'avg' | 'max' | 'min' | 'sum';
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty';
  config: any;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: string;
  title: string;
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

export class AlertingService {
  private static instance: AlertingService;
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private lastAlertTime: Map<string, Date> = new Map();
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeDefaultRules();
  }

  static getInstance(): AlertingService {
    if (!AlertingService.instance) {
      AlertingService.instance = new AlertingService();
    }
    return AlertingService.instance;
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultRules(): void {
    // Agent failure alerts
    this.addRule({
      id: 'agent-failures-high',
      name: 'High Agent Failure Rate',
      condition: {
        metric: 'agent_errors_total',
        operator: '>',
        threshold: 10,
        duration: 300, // 5 minutes
        aggregation: 'sum'
      },
      severity: 'critical',
      channels: [{ type: 'email', config: {} }],
      cooldown: 30,
      enabled: true
    });

    // API latency alerts
    this.addRule({
      id: 'api-latency-high',
      name: 'High API Latency',
      condition: {
        metric: 'api_request_duration_ms',
        operator: '>',
        threshold: 2000, // 2 seconds
        duration: 60,
        aggregation: 'avg'
      },
      severity: 'warning',
      channels: [{ type: 'slack', config: {} }],
      cooldown: 15,
      enabled: true
    });

    // ML model accuracy alerts
    this.addRule({
      id: 'ml-accuracy-low',
      name: 'Low ML Model Accuracy',
      condition: {
        metric: 'ml_model_accuracy',
        operator: '<',
        threshold: 0.8, // 80%
        duration: 600, // 10 minutes
        aggregation: 'avg'
      },
      severity: 'warning',
      channels: [{ type: 'email', config: {} }],
      cooldown: 60,
      enabled: true
    });

    // Database connection alerts
    this.addRule({
      id: 'database-unhealthy',
      name: 'Database Connection Issues',
      condition: {
        metric: 'health_check_database',
        operator: '==',
        threshold: 0, // 0 = unhealthy
        duration: 30
      },
      severity: 'critical',
      channels: [
        { type: 'email', config: {} },
        { type: 'pagerduty', config: {} }
      ],
      cooldown: 5,
      enabled: true
    });

    // Network size alerts
    this.addRule({
      id: 'network-growth-stalled',
      name: 'Network Growth Stalled',
      condition: {
        metric: 'network_connections_active',
        operator: '<',
        threshold: 100,
        duration: 86400, // 24 hours
        aggregation: 'max'
      },
      severity: 'info',
      channels: [{ type: 'slack', config: {} }],
      cooldown: 1440, // 24 hours
      enabled: true
    });

    // Error rate alerts
    this.addRule({
      id: 'error-rate-high',
      name: 'High Error Rate',
      condition: {
        metric: 'api_errors_total',
        operator: '>',
        threshold: 100,
        duration: 300,
        aggregation: 'sum'
      },
      severity: 'critical',
      channels: [
        { type: 'email', config: {} },
        { type: 'slack', config: {} }
      ],
      cooldown: 15,
      enabled: true
    });
  }

  /**
   * Start monitoring alerts
   */
  startMonitoring(intervalSeconds: number = 60): void {
    if (this.checkInterval) {
      console.log('⚠️ Alert monitoring already running');
      return;
    }

    console.log(`🚨 Starting alert monitoring (checking every ${intervalSeconds}s)`);

    this.checkInterval = setInterval(async () => {
      await this.checkAlerts();
    }, intervalSeconds * 1000);

    // Run initial check
    this.checkAlerts();
  }

  /**
   * Stop monitoring alerts
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Alert monitoring stopped');
    }
  }

  /**
   * Check all alert rules
   */
  private async checkAlerts(): Promise<void> {
    try {
      // Get current metrics
      const metrics = await telemetry.getMetricsSnapshot();
      const health = await healthCheck.checkHealth();

      // Add health check metrics
      metrics['health_check_database'] = health.checks.database.status === 'pass' ? 1 : 0;
      metrics['health_check_agents'] = health.checks.agents.status === 'pass' ? 1 : 0;
      metrics['health_check_ml'] = health.checks.mlModels.status === 'pass' ? 1 : 0;

      // Check each rule
      for (const [ruleId, rule] of this.rules) {
        if (!rule.enabled) continue;

        await this.evaluateRule(rule, metrics);
      }

      // Check for resolved alerts
      await this.checkResolvedAlerts(metrics);

    } catch (error) {
      console.error('Error checking alerts:', error);
    }
  }

  /**
   * Evaluate a single alert rule
   */
  private async evaluateRule(rule: AlertRule, metrics: any): Promise<void> {
    const { condition } = rule;
    const metricValue = metrics[condition.metric] || 0;

    // Check if condition is met
    const conditionMet = this.evaluateCondition(
      metricValue,
      condition.operator,
      condition.threshold
    );

    if (conditionMet) {
      // Check cooldown
      const lastAlert = this.lastAlertTime.get(rule.id);
      if (lastAlert) {
        const cooldownMs = (rule.cooldown || 0) * 60 * 1000;
        if (Date.now() - lastAlert.getTime() < cooldownMs) {
          return; // Still in cooldown
        }
      }

      // Create alert
      await this.createAlert(rule, metricValue, condition.threshold);
    }
  }

  /**
   * Evaluate condition
   */
  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case '>': return value > threshold;
      case '<': return value < threshold;
      case '>=': return value >= threshold;
      case '<=': return value <= threshold;
      case '==': return value === threshold;
      case '!=': return value !== threshold;
      default: return false;
    }
  }

  /**
   * Create and send alert
   */
  private async createAlert(rule: AlertRule, value: number, threshold: number): Promise<void> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${rule.id}`,
      ruleId: rule.id,
      severity: rule.severity,
      title: rule.name,
      message: this.formatAlertMessage(rule, value, threshold),
      value,
      threshold,
      timestamp: new Date(),
      resolved: false
    };

    // Store alert
    this.activeAlerts.set(alert.id, alert);
    this.lastAlertTime.set(rule.id, new Date());

    // Send to channels
    await this.sendAlert(alert, rule.channels);

    console.log(`🚨 Alert triggered: ${alert.title} (${alert.severity})`);
  }

  /**
   * Format alert message
   */
  private formatAlertMessage(rule: AlertRule, value: number, threshold: number): string {
    const comparison = `${value} ${rule.condition.operator} ${threshold}`;
    
    return `Alert: ${rule.name}
Severity: ${rule.severity.toUpperCase()}
Condition: ${rule.condition.metric} ${comparison}
Current Value: ${value}
Threshold: ${threshold}
Time: ${new Date().toISOString()}`;
  }

  /**
   * Send alert to channels
   */
  private async sendAlert(alert: Alert, channels: AlertChannel[]): Promise<void> {
    for (const channel of channels) {
      try {
        switch (channel.type) {
          case 'email':
            await this.sendEmailAlert(alert, channel.config);
            break;
          case 'slack':
            await this.sendSlackAlert(alert, channel.config);
            break;
          case 'webhook':
            await this.sendWebhookAlert(alert, channel.config);
            break;
          case 'pagerduty':
            await this.sendPagerDutyAlert(alert, channel.config);
            break;
        }
      } catch (error) {
        console.error(`Failed to send alert to ${channel.type}:`, error);
      }
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: Alert, config: any): Promise<void> {
    // In production, integrate with email service
    console.log(`📧 Email alert: ${alert.title}`);
    
    if (process.env.ALERT_EMAIL_ENDPOINT) {
      await fetch(process.env.ALERT_EMAIL_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: config.recipients || process.env.ALERT_EMAIL_DEFAULT,
          subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
          text: alert.message,
          alert
        })
      });
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: Alert, config: any): Promise<void> {
    console.log(`💬 Slack alert: ${alert.title}`);
    
    const webhook = config.webhook || process.env.SLACK_WEBHOOK_URL;
    if (!webhook) return;

    const color = alert.severity === 'critical' ? 'danger' : 
                  alert.severity === 'warning' ? 'warning' : 'good';

    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [{
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            { title: 'Severity', value: alert.severity, short: true },
            { title: 'Value', value: alert.value, short: true },
            { title: 'Threshold', value: alert.threshold, short: true },
            { title: 'Time', value: alert.timestamp, short: true }
          ],
          footer: 'blipee OS Monitoring',
          ts: Math.floor(alert.timestamp.getTime() / 1000)
        }]
      })
    });
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: Alert, config: any): Promise<void> {
    console.log(`🔗 Webhook alert: ${alert.title}`);
    
    if (!config.url) return;

    await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      },
      body: JSON.stringify({
        alert,
        timestamp: alert.timestamp.toISOString(),
        service: 'blipee-os'
      })
    });
  }

  /**
   * Send PagerDuty alert
   */
  private async sendPagerDutyAlert(alert: Alert, config: any): Promise<void> {
    console.log(`📟 PagerDuty alert: ${alert.title}`);
    
    const routingKey = config.routingKey || process.env.PAGERDUTY_ROUTING_KEY;
    if (!routingKey) return;

    await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: routingKey,
        event_action: 'trigger',
        dedup_key: alert.ruleId,
        payload: {
          summary: alert.title,
          severity: alert.severity === 'critical' ? 'critical' : 'warning',
          source: 'blipee-os',
          custom_details: {
            message: alert.message,
            value: alert.value,
            threshold: alert.threshold
          }
        }
      })
    });
  }

  /**
   * Check for resolved alerts
   */
  private async checkResolvedAlerts(metrics: any): Promise<void> {
    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.resolved) continue;

      const rule = this.rules.get(alert.ruleId);
      if (!rule) continue;

      const metricValue = metrics[rule.condition.metric] || 0;
      const conditionMet = this.evaluateCondition(
        metricValue,
        rule.condition.operator,
        rule.condition.threshold
      );

      if (!conditionMet) {
        // Alert resolved
        alert.resolved = true;
        alert.resolvedAt = new Date();
        
        console.log(`✅ Alert resolved: ${alert.title}`);
        
        // Send resolution notification
        await this.sendResolutionNotification(alert, rule.channels);
      }
    }
  }

  /**
   * Send resolution notification
   */
  private async sendResolutionNotification(alert: Alert, channels: AlertChannel[]): Promise<void> {
    const resolution = {
      ...alert,
      title: `RESOLVED: ${alert.title}`,
      message: `Alert resolved at ${alert.resolvedAt?.toISOString()}\nOriginal alert: ${alert.message}`
    };

    await this.sendAlert(resolution, channels);
  }

  /**
   * Add or update alert rule
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove alert rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(a => !a.resolved);
  }

  /**
   * Get alert history
   */
  getAlertHistory(hours: number = 24): Alert[] {
    const since = Date.now() - (hours * 60 * 60 * 1000);
    
    return Array.from(this.activeAlerts.values())
      .filter(a => a.timestamp.getTime() > since)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}

// Export singleton instance
export const alerting = AlertingService.getInstance();