export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum AlertChannel {
  EMAIL = 'email',
  SMS = 'sms',
  SLACK = 'slack',
  PAGERDUTY = 'pagerduty',
  WEBHOOK = 'webhook',
}

export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp?: Date;
}

export interface Alert {
  id: string;
  name: string;
  severity: AlertSeverity;
  message: string;
  details?: Record<string, any>;
  metric?: string;
  threshold?: number;
  currentValue?: number;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  metric: string;
  condition: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  threshold: number;
  duration?: number; // seconds
  severity: AlertSeverity;
  channels: AlertChannel[];
  enabled: boolean;
  metadata?: Record<string, any>;
}

export interface SecurityEvent {
  id: string;
  type: string;
  severity: AlertSeverity;
  source: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details: Record<string, any>;
  timestamp: Date;
  handled: boolean;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: Date;
  details?: Record<string, any>;
}

export interface MonitoringDashboard {
  metrics: {
    requests: {
      total: number;
      success: number;
      failure: number;
      rate: number; // per minute
    };
    security: {
      loginAttempts: number;
      failedLogins: number;
      mfaVerifications: number;
      suspiciousActivities: number;
    };
    performance: {
      avgResponseTime: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
      errorRate: number;
    };
    system: {
      cpuUsage: number;
      memoryUsage: number;
      diskUsage: number;
      activeConnections: number;
    };
  };
  alerts: Alert[];
  healthChecks: HealthCheck[];
  recentEvents: SecurityEvent[];
}

export interface NotificationConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    smtpConfig?: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  sms?: {
    enabled: boolean;
    recipients: string[];
    provider: 'twilio' | 'aws-sns';
    config: Record<string, string>;
  };
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel?: string;
    username?: string;
  };
  pagerduty?: {
    enabled: boolean;
    integrationKey: string;
    serviceId: string;
  };
  webhook?: {
    enabled: boolean;
    url: string;
    headers?: Record<string, string>;
    secret?: string;
  };
}