// Re-export all monitoring functionality
export * from './types';
export * from './service';
export * from './collector';
export * from './middleware';
export * from './health';

import { monitoringService } from './service';
import { healthCheckService } from './health';
import { recordSystemMetrics } from './collector';
import { AlertSeverity, AlertChannel } from './types';

// Initialize monitoring
export async function initializeMonitoring() {
  
  // Start health checks
  healthCheckService.startPeriodicChecks(60000); // Every minute
  
  // Start system metrics collection
  setInterval(() => {
    recordSystemMetrics().catch(console.error);
  }, 30000); // Every 30 seconds
  
  // Set up default alert rules
  await setupDefaultAlertRules();
  
}

async function setupDefaultAlertRules() {
  // High error rate alert
  await monitoringService.setAlertRule({
    id: 'high-error-rate',
    name: 'High Error Rate',
    description: 'Alert when error rate exceeds 5%',
    metric: 'http_errors_total',
    condition: 'gt',
    threshold: 5,
    duration: 300, // 5 minutes
    severity: AlertSeverity.ERROR,
    channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
    enabled: true,
  });
  
  // Failed login attempts alert
  await monitoringService.setAlertRule({
    id: 'failed-login-spike',
    name: 'Failed Login Spike',
    description: 'Alert on unusual number of failed login attempts',
    metric: 'failed_logins_total',
    condition: 'gt',
    threshold: 10,
    duration: 300, // 5 minutes
    severity: AlertSeverity.WARNING,
    channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
    enabled: true,
  });
  
  // High memory usage alert
  await monitoringService.setAlertRule({
    id: 'high-memory-usage',
    name: 'High Memory Usage',
    description: 'Alert when memory usage exceeds 85%',
    metric: 'system_memory_usage_percent',
    condition: 'gt',
    threshold: 85,
    duration: 180, // 3 minutes
    severity: AlertSeverity.WARNING,
    channels: [AlertChannel.EMAIL, AlertChannel.PAGERDUTY],
    enabled: true,
  });
  
  // Critical memory usage alert
  await monitoringService.setAlertRule({
    id: 'critical-memory-usage',
    name: 'Critical Memory Usage',
    description: 'Alert when memory usage exceeds 95%',
    metric: 'system_memory_usage_percent',
    condition: 'gt',
    threshold: 95,
    duration: 60, // 1 minute
    severity: AlertSeverity.CRITICAL,
    channels: [AlertChannel.EMAIL, AlertChannel.SMS, AlertChannel.PAGERDUTY],
    enabled: true,
  });
  
  // High response time alert
  await monitoringService.setAlertRule({
    id: 'high-response-time',
    name: 'High Response Time',
    description: 'Alert when average response time exceeds 1 second',
    metric: 'http_response_time_ms',
    condition: 'gt',
    threshold: 1000,
    duration: 300, // 5 minutes
    severity: AlertSeverity.WARNING,
    channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
    enabled: true,
  });
  
  // Rate limit exceeded alert
  await monitoringService.setAlertRule({
    id: 'rate-limit-spike',
    name: 'Rate Limit Spike',
    description: 'Alert on unusual number of rate limit violations',
    metric: 'rate_limit_exceeded_total',
    condition: 'gt',
    threshold: 50,
    duration: 300, // 5 minutes
    severity: AlertSeverity.WARNING,
    channels: [AlertChannel.EMAIL, AlertChannel.SLACK],
    enabled: true,
  });
}

// Export singleton instances
export { monitoringService, healthCheckService };