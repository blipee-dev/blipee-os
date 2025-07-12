import type { 
  Metric, 
  Alert, 
  HealthCheck,
  PerformanceMetric,
  MonitoringConfig 
} from '../types';

describe('Monitoring types', () => {
  it('should create valid Metric objects', () => {
    const metric: Metric = {
      name: 'api.latency',
      value: 150,
      unit: 'ms',
      timestamp: Date.now(),
      tags: {
        endpoint: '/api/users',
        method: 'GET'
      }
    };
    expect(metric.name).toBe('api.latency');
    expect(metric.value).toBe(150);
    expect(metric.unit).toBe('ms');
  });

  it('should create valid Alert objects', () => {
    const alert: Alert = {
      id: 'alert-1',
      type: 'performance',
      severity: 'critical',
      message: 'High API latency detected',
      timestamp: Date.now(),
      resolved: false
    };
    expect(alert.severity).toBe('critical');
    expect(alert.resolved).toBe(false);
  });

  it('should create valid HealthCheck objects', () => {
    const healthCheck: HealthCheck = {
      service: 'database',
      status: 'healthy',
      latency: 10,
      timestamp: Date.now(),
      details: {
        connections: 5,
        maxConnections: 100
      }
    };
    expect(healthCheck.status).toBe('healthy');
    expect(healthCheck.latency).toBe(10);
  });

  it('should create valid PerformanceMetric objects', () => {
    const perfMetric: PerformanceMetric = {
      route: '/api/buildings',
      method: 'GET',
      duration: 234,
      statusCode: 200,
      timestamp: Date.now()
    };
    expect(perfMetric.duration).toBe(234);
    expect(perfMetric.statusCode).toBe(200);
  });

  it('should create valid MonitoringConfig objects', () => {
    const config: MonitoringConfig = {
      enabled: true,
      sampleRate: 0.1,
      alertThresholds: {
        latency: 1000,
        errorRate: 0.05
      }
    };
    expect(config.enabled).toBe(true);
    expect(config.sampleRate).toBe(0.1);
  });
});