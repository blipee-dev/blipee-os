/**
 * Compliance Monitoring Engine
 *
 * Real-time monitoring of compliance status across all frameworks
 * with automated alerting and escalation capabilities.
 */

import {
  ComplianceFramework,
  ComplianceAlert,
  ComplianceDeadline,
  ComplianceFinding,
  AlertType,
  DeadlineStatus,
  ComplianceAssessment
} from '../types';
import { FrameworkFactory } from '../frameworks';

export interface MonitoringConfiguration {
  organizationId: string;
  enabledFrameworks: string[];
  alertThresholds: AlertThresholds;
  escalationRules: EscalationRule[];
  notifications: NotificationConfig;
  scheduledChecks: ScheduledCheck[];
}

export interface AlertThresholds {
  deadlineWarning: number; // days before deadline
  deadlineCritical: number; // days before deadline
  scoreDeclineThreshold: number; // percentage decline
  riskLevelThreshold: 'low' | 'medium' | 'high' | 'critical';
}

export interface EscalationRule {
  id: string;
  condition: EscalationCondition;
  action: EscalationAction;
  recipients: string[];
  delay: number; // minutes
}

export interface EscalationCondition {
  alertType: AlertType[];
  severity: ('info' | 'warning' | 'error' | 'critical')[];
  frameworkCodes?: string[];
  unacknowledgedMinutes?: number;
  repeatedOccurrences?: number;
}

export interface EscalationAction {
  type: 'email' | 'sms' | 'webhook' | 'ticket' | 'call';
  template: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  escalationLevel: number;
}

export interface NotificationConfig {
  email: {
    enabled: boolean;
    recipients: NotificationRecipient[];
    templates: Record<AlertType, string>;
  };
  sms: {
    enabled: boolean;
    recipients: string[];
    criticalOnly: boolean;
  };
  webhook: {
    enabled: boolean;
    endpoints: WebhookEndpoint[];
  };
  inApp: {
    enabled: boolean;
    roles: string[];
  };
}

export interface NotificationRecipient {
  email: string;
  name: string;
  role: string;
  frameworks: string[];
  alertTypes: AlertType[];
  scheduleOverride?: NotificationSchedule;
}

export interface WebhookEndpoint {
  url: string;
  headers: Record<string, string>;
  alertTypes: AlertType[];
  retryAttempts: number;
}

export interface NotificationSchedule {
  timezone: string;
  businessHours: {
    start: string; // HH:MM
    end: string; // HH:MM
    days: number[]; // 0-6, Sunday=0
  };
  immediateAlerts: AlertType[];
}

export interface ScheduledCheck {
  id: string;
  name: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  time?: string; // HH:MM for daily/weekly/monthly
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
  frameworks: string[];
  checkTypes: MonitoringCheckType[];
  enabled: boolean;
}

export type MonitoringCheckType =
  | 'deadline_check'
  | 'compliance_assessment'
  | 'data_quality_check'
  | 'regulatory_update_check'
  | 'score_calculation'
  | 'gap_analysis';

export interface MonitoringResult {
  checkId: string;
  executedAt: Date;
  frameworks: string[];
  alerts: ComplianceAlert[];
  findings: ComplianceFinding[];
  status: 'success' | 'partial' | 'failure';
  errors: string[];
  nextExecution: Date;
}

export class ComplianceMonitor {
  private config: MonitoringConfiguration;
  private isRunning: boolean = false;
  private scheduledTasks: Map<string, NodeJS.Timeout> = new Map();
  private alertHistory: ComplianceAlert[] = [];
  private escalationQueue: EscalationQueueItem[] = [];

  constructor(config: MonitoringConfiguration) {
    this.config = config;
  }

  /**
   * Start compliance monitoring
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Compliance monitor is already running');
    }


    this.isRunning = true;

    // Schedule all configured checks
    await this.scheduleAllChecks();

    // Start real-time monitoring
    await this.startRealTimeMonitoring();

    // Start escalation processor
    this.startEscalationProcessor();

  }

  /**
   * Stop compliance monitoring
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }


    this.isRunning = false;

    // Clear all scheduled tasks
    this.scheduledTasks.forEach(task => clearTimeout(task));
    this.scheduledTasks.clear();

  }

  /**
   * Execute immediate compliance check
   */
  public async executeImmediateCheck(
    frameworks: string[],
    checkTypes: MonitoringCheckType[]
  ): Promise<MonitoringResult> {
    const checkId = `immediate_${Date.now()}`;

    const result: MonitoringResult = {
      checkId,
      executedAt: new Date(),
      frameworks,
      alerts: [],
      findings: [],
      status: 'success',
      errors: [],
      nextExecution: new Date() // Not applicable for immediate checks
    };

    try {
      for (const frameworkCode of frameworks) {
        const frameworkResult = await this.executeFrameworkCheck(frameworkCode, checkTypes);
        result.alerts.push(...frameworkResult.alerts);
        result.findings.push(...frameworkResult.findings);
        result.errors.push(...frameworkResult.errors);
      }

      // Process generated alerts
      if (result.alerts.length > 0) {
        await this.processAlerts(result.alerts);
      }

      // Update status based on errors
      if (result.errors.length > 0) {
        result.status = result.alerts.length > 0 ? 'partial' : 'failure';
      }

    } catch (error) {
      result.status = 'failure';
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Get monitoring status and statistics
   */
  public getMonitoringStatus(): {
    isRunning: boolean;
    activeChecks: number;
    alertsLast24h: number;
    criticalAlerts: number;
    frameworksMonitored: string[];
    lastCheck: Date | null;
    nextCheck: Date | null;
  } {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentAlerts = this.alertHistory.filter(alert => alert.timestamp >= last24h);
    const criticalAlerts = recentAlerts.filter(alert => alert.severity === 'critical');

    const lastCheck = this.alertHistory.length > 0
      ? new Date(Math.max(...this.alertHistory.map(a => a.timestamp.getTime())))
      : null;

    // Calculate next check time (simplified)
    const nextCheck = new Date(Date.now() + 60 * 60 * 1000); // Next hour

    return {
      isRunning: this.isRunning,
      activeChecks: this.scheduledTasks.size,
      alertsLast24h: recentAlerts.length,
      criticalAlerts: criticalAlerts.length,
      frameworksMonitored: this.config.enabledFrameworks,
      lastCheck,
      nextCheck
    };
  }

  /**
   * Get alert history with filtering
   */
  public getAlertHistory(filters?: {
    frameworkId?: string;
    severity?: 'info' | 'warning' | 'error' | 'critical';
    alertType?: AlertType;
    startDate?: Date;
    endDate?: Date;
    acknowledged?: boolean;
    limit?: number;
  }): ComplianceAlert[] {
    let filteredAlerts = [...this.alertHistory];

    if (filters) {
      if (filters.frameworkId) {
        filteredAlerts = filteredAlerts.filter(alert => alert.frameworkId === filters.frameworkId);
      }

      if (filters.severity) {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === filters.severity);
      }

      if (filters.alertType) {
        filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.alertType);
      }

      if (filters.startDate) {
        filteredAlerts = filteredAlerts.filter(alert => alert.timestamp >= filters.startDate!);
      }

      if (filters.endDate) {
        filteredAlerts = filteredAlerts.filter(alert => alert.timestamp <= filters.endDate!);
      }

      if (filters.acknowledged !== undefined) {
        filteredAlerts = filteredAlerts.filter(alert => alert.acknowledged === filters.acknowledged);
      }

      if (filters.limit) {
        filteredAlerts = filteredAlerts.slice(0, filters.limit);
      }
    }

    return filteredAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Acknowledge alert
   */
  public async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<void> {
    const alert = this.alertHistory.find(a => a.id === alertId);

    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    if (alert.acknowledged) {
      throw new Error(`Alert ${alertId} is already acknowledged`);
    }

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    // Remove from escalation queue if present
    this.escalationQueue = this.escalationQueue.filter(item => item.alertId !== alertId);

  }

  /**
   * Update monitoring configuration
   */
  public async updateConfiguration(newConfig: Partial<MonitoringConfiguration>): Promise<void> {
    const wasRunning = this.isRunning;

    if (wasRunning) {
      await this.stop();
    }

    this.config = { ...this.config, ...newConfig };

    if (wasRunning) {
      await this.start();
    }

  }

  // Private methods

  private async scheduleAllChecks(): Promise<void> {
    for (const check of this.config.scheduledChecks) {
      if (check.enabled) {
        await this.scheduleCheck(check);
      }
    }
  }

  private async scheduleCheck(check: ScheduledCheck): Promise<void> {
    const delay = this.calculateCheckDelay(check);

    const timeoutId = setTimeout(async () => {
      if (this.isRunning) {
        await this.executeScheduledCheck(check);
        // Reschedule for next execution
        await this.scheduleCheck(check);
      }
    }, delay);

    this.scheduledTasks.set(check.id, timeoutId);

  }

  private calculateCheckDelay(check: ScheduledCheck): number {
    const now = new Date();
    let nextExecution = new Date();

    switch (check.frequency) {
      case 'hourly':
        nextExecution = new Date(now.getTime() + 60 * 60 * 1000);
        break;

      case 'daily':
        if (check.time) {
          const [hours, minutes] = check.time.split(':').map(Number);
          nextExecution.setHours(hours, minutes, 0, 0);
          if (nextExecution <= now) {
            nextExecution.setDate(nextExecution.getDate() + 1);
          }
        } else {
          nextExecution = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }
        break;

      case 'weekly':
        // Implementation for weekly scheduling
        nextExecution = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;

      case 'monthly':
        // Implementation for monthly scheduling
        nextExecution = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;

      default:
        nextExecution = new Date(now.getTime() + 60 * 60 * 1000);
    }

    return nextExecution.getTime() - now.getTime();
  }

  private async executeScheduledCheck(check: ScheduledCheck): Promise<void> {

    try {
      const result = await this.executeImmediateCheck(check.frameworks, check.checkTypes);

      // Log execution result
      if (result.alerts.length > 0) {
      }

    } catch (error) {
      console.error(`❌ Check "${check.name}" failed:`, error);
    }
  }

  private async executeFrameworkCheck(
    frameworkCode: string,
    checkTypes: MonitoringCheckType[]
  ): Promise<{ alerts: ComplianceAlert[]; findings: ComplianceFinding[]; errors: string[] }> {
    const alerts: ComplianceAlert[] = [];
    const findings: ComplianceFinding[] = [];
    const errors: string[] = [];

    try {
      const engine = FrameworkFactory.createEngine(frameworkCode, this.config.organizationId);

      for (const checkType of checkTypes) {
        try {
          switch (checkType) {
            case 'deadline_check':
              const deadlineAlerts = await engine.checkDeadlines();
              alerts.push(...deadlineAlerts);
              break;

            case 'compliance_assessment':
              const assessment = await engine.assessCompliance();
              findings.push(...assessment.findings);

              // Generate alerts for critical findings
              const criticalFindings = assessment.findings.filter(f => f.severity === 'critical');
              for (const finding of criticalFindings) {
                alerts.push({
                  id: `finding_alert_${finding.id}`,
                  type: 'compliance_gap',
                  severity: 'critical',
                  title: 'Critical Compliance Gap Identified',
                  message: finding.description,
                  frameworkId: frameworkCode,
                  requirementId: finding.requirementId,
                  source: 'compliance_monitor',
                  timestamp: new Date(),
                  acknowledged: false,
                  resolved: false,
                  actions: [{
                    id: 'view_finding',
                    title: 'View Finding Details',
                    description: 'Review the compliance gap details',
                    type: 'view',
                    priority: 1
                  }]
                });
              }
              break;

            case 'data_quality_check':
              // Implement data quality checking
              break;

            case 'score_calculation':
              // Check for significant score changes
              const score = await engine.calculateScore(assessment);
              if (this.isSignificantScoreDecline(frameworkCode, score.overall)) {
                alerts.push({
                  id: `score_decline_${frameworkCode}_${Date.now()}`,
                  type: 'score_decline',
                  severity: 'warning',
                  title: 'Compliance Score Decline',
                  message: `${frameworkCode} compliance score has declined significantly`,
                  frameworkId: frameworkCode,
                  source: 'compliance_monitor',
                  timestamp: new Date(),
                  acknowledged: false,
                  resolved: false,
                  actions: []
                });
              }
              break;

            default:
              // Handle other check types
              break;
          }
        } catch (checkError) {
          errors.push(`${checkType} failed: ${checkError instanceof Error ? checkError.message : 'Unknown error'}`);
        }
      }

    } catch (frameworkError) {
      errors.push(`Framework ${frameworkCode} error: ${frameworkError instanceof Error ? frameworkError.message : 'Unknown error'}`);
    }

    return { alerts, findings, errors };
  }

  private async processAlerts(alerts: ComplianceAlert[]): Promise<void> {
    for (const alert of alerts) {
      // Add to alert history
      this.alertHistory.push(alert);

      // Check if alert should be escalated
      await this.checkForEscalation(alert);

      // Send notifications
      await this.sendNotifications(alert);
    }

    // Keep only recent alerts in memory (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.alertHistory = this.alertHistory.filter(alert => alert.timestamp >= thirtyDaysAgo);
  }

  private async checkForEscalation(alert: ComplianceAlert): Promise<void> {
    for (const rule of this.config.escalationRules) {
      if (this.matchesEscalationCondition(alert, rule.condition)) {
        // Add to escalation queue
        this.escalationQueue.push({
          alertId: alert.id,
          ruleId: rule.id,
          scheduledTime: new Date(Date.now() + rule.delay * 60 * 1000),
          attempts: 0
        });
      }
    }
  }

  private matchesEscalationCondition(alert: ComplianceAlert, condition: EscalationCondition): boolean {
    // Check alert type
    if (!condition.alertType.includes(alert.type)) {
      return false;
    }

    // Check severity
    if (!condition.severity.includes(alert.severity)) {
      return false;
    }

    // Check framework codes
    if (condition.frameworkCodes && alert.frameworkId &&
        !condition.frameworkCodes.includes(alert.frameworkId)) {
      return false;
    }

    // Additional condition checks would go here

    return true;
  }

  private async sendNotifications(alert: ComplianceAlert): Promise<void> {
    // Email notifications
    if (this.config.notifications.email.enabled) {
      await this.sendEmailNotification(alert);
    }

    // SMS notifications
    if (this.config.notifications.sms.enabled) {
      await this.sendSMSNotification(alert);
    }

    // Webhook notifications
    if (this.config.notifications.webhook.enabled) {
      await this.sendWebhookNotification(alert);
    }
  }

  private async sendEmailNotification(alert: ComplianceAlert): Promise<void> {
    // Implementation would send actual emails
  }

  private async sendSMSNotification(alert: ComplianceAlert): Promise<void> {
    // Implementation would send actual SMS
    if (alert.severity === 'critical' || !this.config.notifications.sms.criticalOnly) {
    }
  }

  private async sendWebhookNotification(alert: ComplianceAlert): Promise<void> {
    // Implementation would send webhook requests
  }

  private async startRealTimeMonitoring(): Promise<void> {
    // Start real-time monitoring processes
  }

  private startEscalationProcessor(): void {
    const processEscalations = () => {
      if (!this.isRunning) return;

      const now = new Date();
      const readyToEscalate = this.escalationQueue.filter(item => item.scheduledTime <= now);

      for (const item of readyToEscalate) {
        this.processEscalation(item);
      }

      // Remove processed items
      this.escalationQueue = this.escalationQueue.filter(item => item.scheduledTime > now);

      // Schedule next check
      setTimeout(processEscalations, 60 * 1000); // Check every minute
    };

    processEscalations();
  }

  private async processEscalation(item: EscalationQueueItem): Promise<void> {
    const rule = this.config.escalationRules.find(r => r.id === item.ruleId);
    const alert = this.alertHistory.find(a => a.id === item.alertId);

    if (!rule || !alert || alert.acknowledged) {
      return;
    }


    // Execute escalation action
    await this.executeEscalationAction(alert, rule.action, rule.recipients);

    item.attempts++;
  }

  private async executeEscalationAction(
    alert: ComplianceAlert,
    action: EscalationAction,
    recipients: string[]
  ): Promise<void> {
    // Implementation would execute the specific escalation action
  }

  private isSignificantScoreDecline(frameworkCode: string, currentScore: number): boolean {
    // This would check against historical scores
    // Simplified implementation
    const threshold = this.config.alertThresholds.scoreDeclineThreshold;
    const historicalScore = 85; // Would be fetched from database

    const decline = ((historicalScore - currentScore) / historicalScore) * 100;
    return decline >= threshold;
  }
}

interface EscalationQueueItem {
  alertId: string;
  ruleId: string;
  scheduledTime: Date;
  attempts: number;
}