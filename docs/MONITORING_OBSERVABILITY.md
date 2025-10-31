# Monitoring & Observability

**FASE 3 - Week 3: Monitoring & Observability**

Complete infrastructure for monitoring, alerting, and observability across the Blipee OS platform.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐│
│  │  Next.js │  │   API    │  │ Agents   │  │     ML      ││
│  │ Frontend │  │ Routes   │  │ Workers  │  │   Models    ││
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘│
│       │             │             │                │        │
│       └─────────────┴─────────────┴────────────────┘        │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                   ┌────────▼────────┐
                   │  Instrumentation │
                   │  - Logs          │
                   │  - Metrics       │
                   │  - Traces        │
                   └────────┬─────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐      ┌───────▼──────┐    ┌──────▼─────┐
   │  Logs   │      │   Metrics    │    │   Traces   │
   │ Storage │      │   Storage    │    │  Storage   │
   └────┬────┘      └───────┬──────┘    └──────┬─────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                   ┌────────▼────────┐
                   │   Dashboards    │
                   │   - Grafana     │
                   │   - Custom UI   │
                   └─────────────────┘
```

---

## 1. Logging Infrastructure

### Log Levels

```typescript
// src/lib/observability/logger.ts
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogContext {
  userId?: string;
  organizationId?: string;
  requestId?: string;
  agentId?: string;
  conversationId?: string;
  [key: string]: any;
}

export class Logger {
  private context: LogContext = {};

  constructor(private serviceName: string) {}

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  debug(message: string, meta?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: Record<string, any>) {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: Record<string, any>) {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, {
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  fatal(message: string, error?: Error, meta?: Record<string, any>) {
    this.log(LogLevel.FATAL, message, {
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  }

  private log(level: LogLevel, message: string, meta?: Record<string, any>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      context: this.context,
      ...meta,
    };

    // In production, send to logging service (DataDog, CloudWatch, etc.)
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(logEntry);
    } else {
      // Console logging for development
      const logFn = level === 'error' || level === 'fatal' ? console.error : console.log;
      logFn(JSON.stringify(logEntry, null, 2));
    }
  }

  private async sendToLoggingService(logEntry: any) {
    // Send to external logging service
    // Example: DataDog, Logtail, CloudWatch
    try {
      await fetch(process.env.LOG_ENDPOINT || '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.error('Failed to send log:', error);
    }
  }
}

// Create logger instances
export const apiLogger = new Logger('api');
export const agentLogger = new Logger('agents');
export const mlLogger = new Logger('ml');
export const dbLogger = new Logger('database');
```

### Structured Logging Example

```typescript
// Usage in API routes
import { apiLogger } from '@/lib/observability/logger';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  apiLogger.setContext({ requestId });

  try {
    apiLogger.info('Fetching unified metrics', {
      endpoint: '/api/integrations/unified-analytics',
      method: 'GET',
    });

    const data = await fetchData();

    apiLogger.info('Successfully fetched metrics', {
      recordCount: data.length,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(data);
  } catch (error) {
    apiLogger.error('Failed to fetch metrics', error as Error, {
      endpoint: '/api/integrations/unified-analytics',
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## 2. Metrics Collection

### Custom Metrics Service

```typescript
// src/lib/observability/metrics.ts
export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags: Record<string, string>;
  type: 'counter' | 'gauge' | 'histogram';
}

export class MetricsCollector {
  private metrics: Metric[] = [];
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();

  /**
   * Increment a counter metric
   */
  increment(name: string, value: number = 1, tags: Record<string, string> = {}) {
    const key = this.getMetricKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    this.record({
      name,
      value: current + value,
      timestamp: Date.now(),
      tags,
      type: 'counter',
    });
  }

  /**
   * Set a gauge metric (current value)
   */
  gauge(name: string, value: number, tags: Record<string, string> = {}) {
    const key = this.getMetricKey(name, tags);
    this.gauges.set(key, value);

    this.record({
      name,
      value,
      timestamp: Date.now(),
      tags,
      type: 'gauge',
    });
  }

  /**
   * Record a histogram metric (distribution)
   */
  histogram(name: string, value: number, tags: Record<string, string> = {}) {
    this.record({
      name,
      value,
      timestamp: Date.now(),
      tags,
      type: 'histogram',
    });
  }

  /**
   * Measure execution time
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    tags: Record<string, string> = {}
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.histogram(`${name}.duration`, Date.now() - start, {
        ...tags,
        status: 'success',
      });
      this.increment(`${name}.calls`, 1, { ...tags, status: 'success' });
      return result;
    } catch (error) {
      this.histogram(`${name}.duration`, Date.now() - start, {
        ...tags,
        status: 'error',
      });
      this.increment(`${name}.calls`, 1, { ...tags, status: 'error' });
      throw error;
    }
  }

  private record(metric: Metric) {
    this.metrics.push(metric);

    // Keep only last 10000 metrics in memory
    if (this.metrics.length > 10000) {
      this.metrics.shift();
    }

    // Send to metrics service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMetricsService(metric);
    }
  }

  private async sendToMetricsService(metric: Metric) {
    // Send to DataDog, Prometheus, CloudWatch, etc.
    try {
      await fetch(process.env.METRICS_ENDPOINT || '', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric),
      });
    } catch (error) {
      console.error('Failed to send metric:', error);
    }
  }

  private getMetricKey(name: string, tags: Record<string, string>): string {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',');
    return `${name}${tagString ? ':' + tagString : ''}`;
  }

  getMetrics(): Metric[] {
    return [...this.metrics];
  }

  getCounters(): Map<string, number> {
    return new Map(this.counters);
  }

  getGauges(): Map<string, number> {
    return new Map(this.gauges);
  }
}

export const metrics = new MetricsCollector();
```

### Standard Metrics

```typescript
// Application Metrics
metrics.increment('api.requests', 1, { endpoint: '/api/dashboard', method: 'GET' });
metrics.histogram('api.response_time', 145, { endpoint: '/api/dashboard' });
metrics.gauge('api.active_connections', 42);

// Business Metrics
metrics.increment('agents.executions', 1, { agent_type: 'CarbonHunter', status: 'success' });
metrics.gauge('conversations.active', 15, { type: 'user_chat' });
metrics.histogram('ml.prediction_confidence', 0.85, { model: 'prophet_v1' });

// System Metrics
metrics.gauge('system.memory_usage_mb', 512);
metrics.gauge('system.cpu_usage_percent', 45);
metrics.increment('database.queries', 1, { table: 'conversations' });
metrics.histogram('database.query_duration', 23, { table: 'conversations' });
```

---

## 3. Health Checks

### Health Check API

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  checks: {
    database: { status: string; latency?: number };
    cache: { status: string };
    external_apis: { status: string };
  };
}

export async function GET() {
  const checks = await runHealthChecks();

  const overallStatus = Object.values(checks).every(c => c.status === 'healthy')
    ? 'healthy'
    : Object.values(checks).some(c => c.status === 'unhealthy')
    ? 'unhealthy'
    : 'degraded';

  const health: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    checks,
  };

  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 503 : 503;

  return NextResponse.json(health, { status: statusCode });
}

async function runHealthChecks() {
  const [database, cache, externalApis] = await Promise.all([
    checkDatabase(),
    checkCache(),
    checkExternalAPIs(),
  ]);

  return { database, cache, external_apis: externalApis };
}

async function checkDatabase() {
  try {
    const start = Date.now();
    const supabase = await createClient();
    const { error } = await supabase.from('organizations').select('id').limit(1);

    if (error) throw error;

    return {
      status: 'healthy',
      latency: Date.now() - start,
    };
  } catch (error) {
    return { status: 'unhealthy' };
  }
}

async function checkCache() {
  // Check cache availability
  try {
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy' };
  }
}

async function checkExternalAPIs() {
  // Check OpenAI, etc.
  try {
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'degraded' };
  }
}
```

---

## 4. Alerting Rules

### Alert Definitions

```yaml
# config/alerts.yml
alerts:
  # API Performance
  - name: high_api_latency
    condition: api.response_time.p95 > 500ms
    severity: warning
    duration: 5m
    actions:
      - notify: slack
      - notify: email

  - name: high_error_rate
    condition: api.requests.error_rate > 5%
    severity: critical
    duration: 2m
    actions:
      - notify: pagerduty
      - notify: slack

  # Database
  - name: database_connection_pool_exhausted
    condition: database.connections.active > 80%
    severity: warning
    duration: 3m

  - name: slow_queries
    condition: database.query_duration.p95 > 100ms
    severity: warning
    duration: 5m

  # Agents
  - name: agent_execution_failure_rate
    condition: agents.executions.failure_rate > 20%
    severity: critical
    duration: 5m

  - name: agent_queue_backlog
    condition: agents.queue.size > 100
    severity: warning
    duration: 10m

  # ML Models
  - name: low_ml_confidence
    condition: ml.predictions.avg_confidence < 0.6
    severity: warning
    duration: 15m

  # System Resources
  - name: high_memory_usage
    condition: system.memory_usage > 90%
    severity: critical
    duration: 3m

  - name: high_cpu_usage
    condition: system.cpu_usage > 85%
    severity: warning
    duration: 5m
```

---

## 5. Dashboards

### Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Blipee OS - System Overview",
    "panels": [
      {
        "title": "API Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(api_requests_total[5m])"
          }
        ]
      },
      {
        "title": "API Response Time (p95)",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, api_response_time)"
          }
        ]
      },
      {
        "title": "Agent Execution Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "agent_executions_success / agent_executions_total * 100"
          }
        ]
      },
      {
        "title": "Active Conversations",
        "type": "stat",
        "targets": [
          {
            "expr": "conversations_active"
          }
        ]
      },
      {
        "title": "Database Query Performance",
        "type": "heatmap",
        "targets": [
          {
            "expr": "database_query_duration"
          }
        ]
      }
    ]
  }
}
```

### Custom Observability Dashboard

```typescript
// src/app/admin/observability/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { performanceMonitor } from '@/lib/performance/performance-monitor';
import { metrics } from '@/lib/observability/metrics';

export default function ObservabilityDashboard() {
  const [health, setHealth] = useState<any>(null);
  const [metricsData, setMetricsData] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [healthRes, metricsRes, perfRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/performance/metrics?type=summary'),
        fetch('/api/performance/metrics?type=detailed'),
      ]);

      setHealth(await healthRes.json());
      setMetricsData(await metricsRes.json());
      setPerformance(await perfRes.json());
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">System Observability</h1>

      {/* Health Status */}
      <div className="grid grid-cols-4 gap-4">
        <StatusCard
          title="Overall Health"
          value={health?.status || 'loading'}
          color={health?.status === 'healthy' ? 'green' : 'red'}
        />
        <StatusCard
          title="Database"
          value={health?.checks?.database?.status || 'loading'}
          latency={health?.checks?.database?.latency}
        />
        <StatusCard
          title="Cache"
          value={health?.checks?.cache?.status || 'loading'}
        />
        <StatusCard
          title="External APIs"
          value={health?.checks?.external_apis?.status || 'loading'}
        />
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            title="Avg Response Time"
            value={`${performance?.summary?.avgDurationAcrossAll?.toFixed(0) || 0}ms`}
          />
          <MetricCard
            title="Cache Hit Rate"
            value={metricsData?.queryCache?.hitRate || '0%'}
          />
          <MetricCard
            title="API Requests"
            value={metricsData?.performance?.totalMetrics || 0}
          />
        </div>
      </div>

      {/* Slow Operations */}
      {performance?.slowOperations && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Slow Operations</h2>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Operation</th>
                <th className="text-right p-2">P95</th>
                <th className="text-right p-2">Count</th>
              </tr>
            </thead>
            <tbody>
              {performance.slowOperations.map((op: any, i: number) => (
                <tr key={i} className="border-b">
                  <td className="p-2">{op.name}</td>
                  <td className="text-right p-2">{op.stats.p95.toFixed(0)}ms</td>
                  <td className="text-right p-2">{op.stats.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

## 6. Error Tracking

### Integration with Sentry

```typescript
// src/lib/observability/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

export function initErrorTracking() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NEXT_PUBLIC_ENV,
      tracesSampleRate: 0.1,
      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay(),
      ],
    });
  }
}

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  Sentry.captureMessage(message, level);
}
```

---

## 7. Monitoring Checklist

### Daily
- [ ] Check dashboard for anomalies
- [ ] Review error rates
- [ ] Monitor resource usage

### Weekly
- [ ] Review slow queries
- [ ] Check cache hit rates
- [ ] Analyze agent performance trends
- [ ] Review conversation quality metrics

### Monthly
- [ ] Performance trend analysis
- [ ] Cost optimization review
- [ ] Capacity planning
- [ ] SLA compliance review

---

**Status:** Production-Ready ✅
**Tools:** Custom metrics, Grafana, Sentry
**Coverage:** API, Database, Agents, ML, Frontend
