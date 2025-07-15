export { telemetry, TelemetryService } from './telemetry';
export { healthCheck, HealthCheckService } from './health-check';
export { alerting, AlertingService } from './alerting';
export { initializeMonitoring, shutdownMonitoring } from './initialize';
export { MonitoringService } from './service';

// Create singleton instance for compatibility
import { MonitoringService } from './service';
export const monitoringService = new MonitoringService();

// Re-export types
export type { HealthStatus, CheckResult } from './health-check';
export type { Alert, AlertRule, AlertCondition, AlertChannel } from './alerting';