import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { MonitoringService } from '../service';
import { MetricsCollector } from '../collector';
import { AlertManager } from '../alerts';
import { HealthChecker } from '../health';
import { PerformanceMonitor } from '../performance';

jest.mock('@/lib/cache/redis');
jest.mock('@/lib/supabase/server');

describe('Complete Monitoring System', () => {
  let monitoringService: MonitoringService;
  let metricsCollector: MetricsCollector;
  let alertManager: AlertManager;
  let healthChecker: HealthChecker;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    monitoringService = new MonitoringService();
    metricsCollector = new MetricsCollector();
    alertManager = new AlertManager();
    healthChecker = new HealthChecker();
    performanceMonitor = new PerformanceMonitor();
  });

  describe('Metrics Collection and Aggregation', () => {
    it('should collect and aggregate system metrics', async () => {
      // 1. Record various metrics
      await metricsCollector.recordMetric({
        name: 'api.requests',
        value: 1,
        tags: { endpoint: '/api/health', method: 'GET', status: 200 }
      });

      await metricsCollector.recordMetric({
        name: 'api.latency',
        value: 125.5,
        tags: { endpoint: '/api/health', method: 'GET' }
      });

      await metricsCollector.recordMetric({
        name: 'db.queries',
        value: 1,
        tags: { table: 'users', operation: 'select' }
      });

      // 2. Get aggregated metrics
      const metrics = await metricsCollector.getMetrics({
        timeRange: '1h',
        groupBy: 'endpoint'
      });

      expect(metrics['api.requests'].total).toBeGreaterThan(0);
      expect(metrics['api.latency'].avg).toBeDefined();
      expect(metrics['api.latency'].p95).toBeDefined();
    });

    it('should track custom business metrics', async () => {
      // Track business events
      await monitoringService.trackEvent('user.signup', {
        userId: 'user123',
        plan: 'premium'
      });

      await monitoringService.trackEvent('subscription.created', {
        userId: 'user123',
        amount: 99.99,
        currency: 'USD'
      });

      // Query business metrics
      const businessMetrics = await monitoringService.getBusinessMetrics({
        metrics: ['signups', 'revenue'],
        period: 'day'
      });

      expect(businessMetrics.signups.count).toBe(1);
      expect(businessMetrics.revenue.total).toBe(99.99);
    });
  });

  describe('Alert System', () => {
    it('should trigger alerts based on thresholds', async () => {
      // 1. Configure alert
      const alert = await alertManager.createAlert({
        name: 'High API Latency',
        metric: 'api.latency',
        condition: 'avg > 500',
        window: '5m',
        severity: 'warning',
        channels: ['email', 'slack']
      });

      // 2. Record high latency
      for (let i = 0; i < 10; i++) {
        await metricsCollector.recordMetric({
          name: 'api.latency',
          value: 600 + i * 10,
          tags: { endpoint: '/api/slow' }
        });
      }

      // 3. Check alerts
      const triggered = await alertManager.checkAlerts();
      expect(triggered).toContainEqual(
        expect.objectContaining({
          alertId: alert.id,
          severity: 'warning'
        })
      );
    });

    it('should handle alert escalation', async () => {
      // Create escalation policy
      const policy = await alertManager.createEscalationPolicy({
        name: 'Critical Issues',
        levels: [
          { delay: 0, contacts: ['oncall@example.com'] },
          { delay: 15, contacts: ['manager@example.com'] },
          { delay: 30, contacts: ['director@example.com'] }
        ]
      });

      // Trigger critical alert
      const alert = await alertManager.triggerAlert({
        name: 'Database Down',
        severity: 'critical',
        policy: policy.id
      });

      // Check escalation
      const escalations = await alertManager.getEscalations(alert.id);
      expect(escalations[0].level).toBe(0);
      expect(escalations[0].notified).toContain('oncall@example.com');
    });
  });

  describe('Health Monitoring', () => {
    it('should perform comprehensive health checks', async () => {
      const health = await healthChecker.checkAll();

      expect(health.status).toBeDefined();
      expect(health.checks).toHaveProperty('database');
      expect(health.checks).toHaveProperty('redis');
      expect(health.checks).toHaveProperty('api');
      expect(health.checks).toHaveProperty('storage');
      expect(health.checks).toHaveProperty('external_services');
    });

    it('should detect service degradation', async () => {
      // Simulate slow database
      jest.spyOn(healthChecker, 'checkDatabase').mockResolvedValue({
        status: 'degraded',
        latency: 2500,
        message: 'High query latency detected'
      });

      const health = await healthChecker.checkAll();
      
      expect(health.status).toBe('degraded');
      expect(health.checks.database.status).toBe('degraded');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track API performance', async () => {
      // Record API calls
      const trace = performanceMonitor.startTrace('api.request', {
        endpoint: '/api/users',
        method: 'GET'
      });

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 100));

      trace.end({ status: 200 });

      // Get performance data
      const perf = await performanceMonitor.getPerformanceData({
        service: 'api',
        period: '1h'
      });

      expect(perf.avgResponseTime).toBeGreaterThan(0);
      expect(perf.requestCount).toBeGreaterThan(0);
      expect(perf.errorRate).toBeDefined();
    });

    it('should identify performance bottlenecks', async () => {
      // Track various operations
      await performanceMonitor.trackOperation('db.query', 150, {
        query: 'SELECT * FROM users'
      });

      await performanceMonitor.trackOperation('redis.get', 5, {
        key: 'user:123'
      });

      await performanceMonitor.trackOperation('external.api', 850, {
        service: 'weather'
      });

      // Analyze bottlenecks
      const bottlenecks = await performanceMonitor.identifyBottlenecks({
        threshold: 100
      });

      expect(bottlenecks).toContainEqual(
        expect.objectContaining({
          operation: 'external.api',
          avgDuration: 850
        })
      );
    });
  });

  describe('Real-time Monitoring Dashboard', () => {
    it('should provide real-time metrics stream', async () => {
      const stream = monitoringService.getMetricsStream({
        metrics: ['cpu', 'memory', 'requests'],
        interval: 1000
      });

      const data = [];
      stream.on('data', (metric) => data.push(metric));

      // Wait for data
      await new Promise(resolve => setTimeout(resolve, 3000));

      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('timestamp');
      expect(data[0]).toHaveProperty('metrics');
    });

    it('should aggregate data for dashboard widgets', async () => {
      const dashboardData = await monitoringService.getDashboardData({
        widgets: [
          { type: 'gauge', metric: 'cpu.usage' },
          { type: 'timeseries', metric: 'api.requests', period: '1h' },
          { type: 'heatmap', metric: 'api.latency', groupBy: 'endpoint' },
          { type: 'counter', metric: 'errors.total', period: '24h' }
        ]
      });

      expect(dashboardData.widgets).toHaveLength(4);
      expect(dashboardData.widgets[0].type).toBe('gauge');
      expect(dashboardData.widgets[1].data).toBeDefined();
    });
  });

  describe('Monitoring Integration', () => {
    it('should export metrics to external systems', async () => {
      const exported = await monitoringService.exportMetrics({
        format: 'prometheus',
        metrics: ['api.*', 'db.*']
      });

      expect(exported).toContain('# TYPE api_requests_total counter');
      expect(exported).toContain('# TYPE db_queries_total counter');
    });

    it('should integrate with OpenTelemetry', async () => {
      const trace = monitoringService.startSpan('process.order', {
        orderId: 'order123',
        userId: 'user456'
      });

      // Child spans
      const dbSpan = trace.startSpan('db.query');
      dbSpan.end();

      const paymentSpan = trace.startSpan('payment.process');
      paymentSpan.end();

      trace.end();

      // Verify trace
      const traces = await monitoringService.getTraces({
        service: 'process.order'
      });

      expect(traces[0].spans).toHaveLength(3);
      expect(traces[0].duration).toBeGreaterThan(0);
    });
  });
});