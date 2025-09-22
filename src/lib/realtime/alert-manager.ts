/**
 * Alert Manager for Real-time Notifications
 * Handles critical alerts, warnings, and notifications
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { websocketServer } from './websocket-server';
import { EventEmitter } from 'events';

export interface Alert {
  id: string;
  type: 'agent' | 'ml' | 'system' | 'compliance' | 'sustainability';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  source: string;
  organizationId: string;
  metadata?: Record<string, any>;
  actionRequired: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  type: string;
  condition: {
    metric: string;
    operator: '>' | '<' | '==' | '!=' | '>=' | '<=';
    threshold: number;
    duration?: number; // seconds
  };
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  organizationId: string;
}

export interface AlertStats {
  total: number;
  bySeverity: {
    info: number;
    warning: number;
    error: number;
    critical: number;
  };
  unacknowledged: number;
  unresolved: number;
  recentAlerts: Alert[];
}

class AlertManager extends EventEmitter {
  private alertRules: Map<string, AlertRule[]> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertThresholds: Map<string, { value: number; startTime: Date }> = new Map();

  constructor() {
    super();
    this.loadAlertRules();
  }

  /**
   * Load alert rules from database
   */
  private async loadAlertRules(): Promise<void> {
    try {
      const { data: rules } = await supabaseAdmin
        .from('alert_rules')
        .select('*')
        .eq('enabled', true);

      if (rules) {
        rules.forEach(rule => {
          if (!this.alertRules.has(rule.organization_id)) {
            this.alertRules.set(rule.organization_id, []);
          }
          this.alertRules.get(rule.organization_id)!.push(rule as AlertRule);
        });
      }
    } catch (error) {
      console.error('Error loading alert rules:', error);
    }
  }

  /**
   * Create a new alert
   */
  async createAlert(alert: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
    const newAlert: Alert = {
      ...alert,
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      actionRequired: alert.actionRequired || false
    };

    // Store in database
    await this.storeAlert(newAlert);

    // Store in memory
    this.activeAlerts.set(newAlert.id, newAlert);

    // Broadcast via WebSocket
    websocketServer.broadcastAlert(alert.organizationId, {
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      source: alert.source,
      actionRequired: alert.actionRequired
    });

    // Emit event
    this.emit('alert_created', newAlert);

    // Check if critical alert needs escalation
    if (alert.severity === 'critical') {
      await this.escalateAlert(newAlert);
    }

    return newAlert;
  }

  /**
   * Check metrics against alert rules
   */
  async checkMetrics(organizationId: string, metrics: Record<string, number>): Promise<void> {
    const rules = this.alertRules.get(organizationId) || [];

    for (const rule of rules) {
      const value = metrics[rule.condition.metric];
      if (value === undefined) continue;

      const triggered = this.evaluateCondition(value, rule.condition);

      if (triggered) {
        // Check duration requirement
        if (rule.condition.duration) {
          const key = `${organizationId}-${rule.id}`;
          const threshold = this.alertThresholds.get(key);

          if (!threshold) {
            // Start tracking
            this.alertThresholds.set(key, { value, startTime: new Date() });
            continue;
          }

          // Check if duration met
          const duration = (new Date().getTime() - threshold.startTime.getTime()) / 1000;
          if (duration < rule.condition.duration) {
            continue;
          }
        }

        // Create alert
        await this.createAlert({
          type: 'system',
          severity: rule.severity,
          title: rule.name,
          message: `${rule.condition.metric} ${rule.condition.operator} ${rule.condition.threshold} (current: ${value})`,
          source: 'alert-manager',
          organizationId,
          metadata: { rule, value },
          actionRequired: rule.severity === 'critical' || rule.severity === 'error'
        });

        // Clear threshold tracking
        this.alertThresholds.delete(`${organizationId}-${rule.id}`);
      } else {
        // Clear threshold tracking if condition no longer met
        this.alertThresholds.delete(`${organizationId}-${rule.id}`);
      }
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(value: number, condition: AlertRule['condition']): boolean {
    switch (condition.operator) {
      case '>': return value > condition.threshold;
      case '<': return value < condition.threshold;
      case '>=': return value >= condition.threshold;
      case '<=': return value <= condition.threshold;
      case '==': return value === condition.threshold;
      case '!=': return value !== condition.threshold;
      default: return false;
    }
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    // Update database
    await supabaseAdmin
      .from('agent_alerts')
      .update({
        acknowledged_by: userId,
        acknowledged_at: alert.acknowledgedAt.toISOString()
      })
      .eq('id', alertId);

    // Emit event
    this.emit('alert_acknowledged', alert);
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string, userId: string, resolution?: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.resolvedBy = userId;
    alert.resolvedAt = new Date();

    // Update database
    await supabaseAdmin
      .from('agent_alerts')
      .update({
        resolved_by: userId,
        resolved_at: alert.resolvedAt.toISOString(),
        resolution
      })
      .eq('id', alertId);

    // Remove from active alerts
    this.activeAlerts.delete(alertId);

    // Emit event
    this.emit('alert_resolved', alert);
  }

  /**
   * Escalate critical alert
   */
  private async escalateAlert(alert: Alert): Promise<void> {
    console.log(`🚨 ESCALATING CRITICAL ALERT: ${alert.title}`);

    // Send notifications to all admins
    const { data: admins } = await supabaseAdmin
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', alert.organizationId)
      .in('role', ['account_owner', 'sustainability_manager']);

    if (admins) {
      for (const admin of admins) {
        // In production, this would send emails, SMS, etc.
        console.log(`Notifying admin ${admin.user_id}: ${alert.message}`);
      }
    }

    // Create escalation record
    await supabaseAdmin
      .from('alert_escalations')
      .insert({
        alert_id: alert.id,
        organization_id: alert.organizationId,
        escalated_at: new Date().toISOString(),
        notified_users: admins?.map(a => a.user_id) || []
      });
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: Alert): Promise<void> {
    try {
      await supabaseAdmin
        .from('agent_alerts')
        .insert({
          id: alert.id,
          organization_id: alert.organizationId,
          agent_id: alert.source,
          type: alert.title,
          severity: alert.severity,
          message: alert.message,
          metadata: alert.metadata,
          created_at: alert.createdAt.toISOString()
        });
    } catch (error) {
      console.error('Error storing alert:', error);
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStats(organizationId: string): Promise<AlertStats> {
    const { data: alerts } = await supabaseAdmin
      .from('agent_alerts')
      .select('*')
      .eq('organization_id', organizationId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const stats: AlertStats = {
      total: alerts?.length || 0,
      bySeverity: {
        info: 0,
        warning: 0,
        error: 0,
        critical: 0
      },
      unacknowledged: 0,
      unresolved: 0,
      recentAlerts: []
    };

    if (alerts) {
      alerts.forEach(alert => {
        stats.bySeverity[alert.severity as keyof typeof stats.bySeverity]++;
        if (!alert.acknowledged_at) stats.unacknowledged++;
        if (!alert.resolved_at) stats.unresolved++;
      });

      stats.recentAlerts = alerts.slice(0, 5).map(a => ({
        id: a.id,
        type: 'system' as const,
        severity: a.severity,
        title: a.type,
        message: a.message,
        source: a.agent_id,
        organizationId: a.organization_id,
        metadata: a.metadata,
        actionRequired: a.severity === 'critical' || a.severity === 'error',
        acknowledgedBy: a.acknowledged_by,
        acknowledgedAt: a.acknowledged_at ? new Date(a.acknowledged_at) : undefined,
        resolvedBy: a.resolved_by,
        resolvedAt: a.resolved_at ? new Date(a.resolved_at) : undefined,
        createdAt: new Date(a.created_at)
      }));
    }

    return stats;
  }

  /**
   * Create alert from agent
   */
  async createAgentAlert(
    agentId: string,
    organizationId: string,
    severity: Alert['severity'],
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): Promise<Alert> {
    return this.createAlert({
      type: 'agent',
      severity,
      title,
      message,
      source: agentId,
      organizationId,
      metadata,
      actionRequired: severity === 'critical' || severity === 'error'
    });
  }

  /**
   * Create ML model alert
   */
  async createMLAlert(
    modelType: string,
    organizationId: string,
    severity: Alert['severity'],
    title: string,
    message: string,
    predictions?: any
  ): Promise<Alert> {
    return this.createAlert({
      type: 'ml',
      severity,
      title,
      message,
      source: `ml-${modelType}`,
      organizationId,
      metadata: { modelType, predictions },
      actionRequired: severity === 'critical'
    });
  }

  /**
   * Create compliance alert
   */
  async createComplianceAlert(
    framework: string,
    organizationId: string,
    severity: Alert['severity'],
    title: string,
    message: string,
    gaps?: string[]
  ): Promise<Alert> {
    return this.createAlert({
      type: 'compliance',
      severity,
      title,
      message,
      source: `compliance-${framework}`,
      organizationId,
      metadata: { framework, gaps },
      actionRequired: true
    });
  }

  /**
   * Create sustainability alert
   */
  async createSustainabilityAlert(
    metric: string,
    organizationId: string,
    severity: Alert['severity'],
    title: string,
    message: string,
    currentValue?: number,
    target?: number
  ): Promise<Alert> {
    return this.createAlert({
      type: 'sustainability',
      severity,
      title,
      message,
      source: `sustainability-${metric}`,
      organizationId,
      metadata: { metric, currentValue, target },
      actionRequired: severity === 'error' || severity === 'critical'
    });
  }

  /**
   * Get active alerts for organization
   */
  getActiveAlerts(organizationId: string): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.organizationId === organizationId && !alert.resolvedAt);
  }

  /**
   * Clear all alerts for organization (for testing)
   */
  async clearAlerts(organizationId: string): Promise<void> {
    const alerts = this.getActiveAlerts(organizationId);
    for (const alert of alerts) {
      this.activeAlerts.delete(alert.id);
    }

    await supabaseAdmin
      .from('agent_alerts')
      .delete()
      .eq('organization_id', organizationId);
  }
}

// Create singleton instance
export const alertManager = new AlertManager();

// Export for use in components
export { AlertManager };