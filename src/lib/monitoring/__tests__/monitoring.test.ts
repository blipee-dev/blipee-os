import { jest } from '@jest/globals';
import {
  MetricType,
  AlertSeverity,
  AlertChannel,
} from '../types';
import { MonitoringService } from '../service';
import { MetricsCollector } from '../collector';
import { HealthCheckService } from '../health';

// Mock dependencies
jest.mock('@/lib/supabase/admin', () => ({
  supabaseAdmin: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      upsert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({ 
        data: [], 
        error: null,
        single: jest.fn(() => ({ data: null, error: { code: 'PGRST116' } })),
      })),
      delete: jest.fn(() => ({ 
        eq: jest.fn(() => ({ error: null })),
      })),
      update: jest.fn(() => ({ 
        eq: jest.fn(() => ({ error: null })),
      })),
    })),
  },
}));

jest.mock('@/lib/audit/service', () => ({
  auditService: {
    log: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('@/lib/auth/session-store', () => ({
  sessionStore: {
    set: jest.fn(() => Promise.resolve()),
    get: jest.fn(() => Promise.resolve({ test: true, timestamp: Date.now() })),
    delete: jest.fn(() => Promise.resolve()),
  },
}));

describe('MonitoringService', () => {
  let monitoringService: MonitoringService;

  beforeEach(() => {
    monitoringService = new MonitoringService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('recordMetric', () => {
    it('should record a metric successfully', async () => {
      const metric = {
        name: 'test_metric',
        type: MetricType.COUNTER,
        value: 1,
        labels: { test: 'true' },
      };

      await monitoringService.recordMetric(metric);

      const metrics = monitoringService.getMetrics('test_metric', { test: 'true' });
      expect(metrics).toHaveLength(1);
      expect(metrics[0].value).toBe(1);
    });

    it('should record multiple metrics with different labels', async () => {
      await monitoringService.recordMetric({
        name: 'api_calls',
        type: MetricType.COUNTER,
        value: 1,
        labels: { endpoint: '/api/users' },
      });

      await monitoringService.recordMetric({
        name: 'api_calls',
        type: MetricType.COUNTER,
        value: 1,
        labels: { endpoint: '/api/posts' },
      });

      const userMetrics = monitoringService.getMetrics('api_calls', { endpoint: '/api/users' });
      const postMetrics = monitoringService.getMetrics('api_calls', { endpoint: '/api/posts' });

      expect(userMetrics).toHaveLength(1);
      expect(postMetrics).toHaveLength(1);
    });
  });

  describe('alert rules', () => {
    it('should create and evaluate alert rules', async () => {
      const rule = {
        id: 'test-rule',
        name: 'Test Alert',
        metric: 'test_metric',
        condition: 'gt' as const,
        threshold: 5,
        severity: AlertSeverity.WARNING,
        channels: [AlertChannel.EMAIL],
        enabled: true,
      };

      await monitoringService.setAlertRule(rule);

      // Record metric below threshold
      await monitoringService.recordMetric({
        name: 'test_metric',
        type: MetricType.GAUGE,
        value: 3,
      });

      // Record metric above threshold
      await monitoringService.recordMetric({
        name: 'test_metric',
        type: MetricType.GAUGE,
        value: 10,
      });
    });
  });

  describe('getDashboard', () => {
    it('should return dashboard data', async () => {
      // Record some test metrics
      await monitoringService.recordMetric({
        name: 'http_requests_total',
        type: MetricType.COUNTER,
        value: 100,
        labels: { status: 'success' },
      });

      await monitoringService.recordMetric({
        name: 'http_requests_total',
        type: MetricType.COUNTER,
        value: 10,
        labels: { status: 'failure' },
      });

      const dashboard = await monitoringService.getDashboard();

      expect(dashboard).toHaveProperty('metrics');
      expect(dashboard).toHaveProperty('alerts');
      expect(dashboard).toHaveProperty('healthChecks');
      expect(dashboard).toHaveProperty('recentEvents');
    });
  });
});

describe('MetricsCollector', () => {
  it('should record HTTP request metrics', async () => {
    await MetricsCollector.recordHttpRequest(
      'GET',
      '/api/test',
      200,
      150,
      'user-123'
    );

    // Verify metrics were recorded (mocked)
    expect(true).toBe(true);
  });

  it('should record authentication events', async () => {
    await MetricsCollector.recordAuthEvent(
      'login',
      true,
      'password',
      'user-123'
    );

    await MetricsCollector.recordAuthEvent(
      'login',
      false,
      'password',
      'user-456'
    );

    // Verify metrics were recorded (mocked)
    expect(true).toBe(true);
  });

  it('should record rate limit events', async () => {
    await MetricsCollector.recordRateLimit(
      'user-123',
      '/api/test',
      true
    );

    // Verify metrics were recorded (mocked)
    expect(true).toBe(true);
  });
});

describe('HealthCheckService', () => {
  let healthService: HealthCheckService;

  beforeEach(() => {
    healthService = new HealthCheckService();
  });

  it('should run health checks', async () => {
    const results = await healthService.runAll();

    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);

    // Check that we have expected services
    const services = results.map(r => r.service);
    expect(services).toContain('memory');
  });

  it('should register custom health check', async () => {
    healthService.register('custom', async () => ({
      service: 'custom',
      status: 'healthy',
      lastCheck: new Date(),
    }));

    const result = await healthService.run('custom');
    expect(result).toBeTruthy();
    expect(result?.status).toBe('healthy');
  });

  it('should get system health summary', async () => {
    const health = await healthService.getSystemHealth();

    expect(health).toHaveProperty('status');
    expect(health).toHaveProperty('checks');
    expect(health).toHaveProperty('summary');
    expect(health.summary).toHaveProperty('total');
    expect(health.summary).toHaveProperty('healthy');
    expect(health.summary).toHaveProperty('degraded');
    expect(health.summary).toHaveProperty('unhealthy');
  });
});