import { metrics } from '@opentelemetry/api';
import type { Meter, Counter, Histogram, UpDownCounter } from '@opentelemetry/api';
import { AppMetrics } from './metrics';

// Get meter
const meter: Meter = metrics.getMeter('blipee-os', '1.0.0');

// HTTP metrics
export const httpRequestCount = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
  unit: '1'
});

export const httpRequestDuration = meter.createHistogram('http_request_duration', {
  description: 'HTTP request duration in milliseconds',
  unit: 'ms'
});

export const httpActiveRequests = meter.createUpDownCounter('http_active_requests', {
  description: 'Number of active HTTP requests',
  unit: '1'
});

// Database metrics
export const dbQueryCount = meter.createCounter('db_queries_total', {
  description: 'Total number of database queries',
  unit: '1'
});

export const dbQueryDuration = meter.createHistogram('db_query_duration', {
  description: 'Database query duration in milliseconds',
  unit: 'ms'
});

export const dbConnectionPool = meter.createUpDownCounter('db_connection_pool_size', {
  description: 'Number of connections in the pool',
  unit: '1'
});

// AI metrics
export const aiRequestCount = meter.createCounter('ai_requests_total', {
  description: 'Total number of AI provider requests',
  unit: '1'
});

export const aiRequestDuration = meter.createHistogram('ai_request_duration', {
  description: 'AI provider request duration in milliseconds',
  unit: 'ms'
});

export const aiTokensUsed = meter.createCounter('ai_tokens_used', {
  description: 'Total number of AI tokens consumed',
  unit: '1'
});

// Cache metrics
export const cacheHits = meter.createCounter('cache_hits_total', {
  description: 'Total number of cache hits',
  unit: '1'
});

export const cacheMisses = meter.createCounter('cache_misses_total', {
  description: 'Total number of cache misses',
  unit: '1'
});

export const cacheSize = meter.createUpDownCounter('cache_size_bytes', {
  description: 'Current cache size in bytes',
  unit: 'By'
});

// Business metrics
export const conversationCount = meter.createCounter('conversations_total', {
  description: 'Total number of conversations created',
  unit: '1'
});

export const messageCount = meter.createCounter('messages_total', {
  description: 'Total number of messages sent',
  unit: '1'
});

export const emissionsDataPoints = meter.createCounter('emissions_data_points', {
  description: 'Total number of emissions data points recorded',
  unit: '1'
});

// Performance metrics
export const memoryUsage = meter.createObservableGauge('memory_usage_bytes', {
  description: 'Current memory usage in bytes',
  unit: 'By'
});

export const cpuUsage = meter.createObservableGauge('cpu_usage_percent', {
  description: 'Current CPU usage percentage',
  unit: '%'
});

// Error metrics
export const errorCount = meter.createCounter('errors_total', {
  description: 'Total number of errors',
  unit: '1'
});

// Initialize observable metrics
memoryUsage.addCallback((result) => {
  const usage = process.memoryUsage();
  result.observe(usage.heapUsed, { type: 'heap_used' });
  result.observe(usage.heapTotal, { type: 'heap_total' });
  result.observe(usage.rss, { type: 'rss' });
  result.observe(usage.external, { type: 'external' });
});

cpuUsage.addCallback((result) => {
  const usage = process.cpuUsage();
  const total = usage.user + usage.system;
  const seconds = total / 1000000; // Convert to seconds
  const percentage = (seconds / process.uptime()) * 100;
  result.observe(percentage);
});

/**
 * Record HTTP request metrics
 */
export function recordHttpMetrics(
  method: string,
  route: string,
  statusCode: number,
  duration: number
): void {
  const labels = {
    method,
    route,
    status_code: statusCode.toString(),
    status_class: `${Math.floor(statusCode / 100)}xx`
  };
  
  httpRequestCount.add(1, labels);
  httpRequestDuration.record(duration, labels);
  
  // Also record in our existing metrics
  AppMetrics.recordAPIRequest(method, route, statusCode, duration);
}

/**
 * Record database query metrics
 */
export function recordDbMetrics(
  operation: string,
  table: string,
  duration: number,
  success: boolean
): void {
  const labels = {
    operation,
    table,
    status: success ? 'success' : 'error'
  };
  
  dbQueryCount.add(1, labels);
  dbQueryDuration.record(duration, labels);
  
  // Also record in our existing metrics
  AppMetrics.recordDatabaseQuery(operation, table, duration, success);
}

/**
 * Record AI provider metrics
 */
export function recordAiMetrics(
  provider: string,
  model: string,
  duration: number,
  tokensUsed: number,
  success: boolean
): void {
  const labels = {
    provider,
    model,
    status: success ? 'success' : 'error'
  };
  
  aiRequestCount.add(1, labels);
  aiRequestDuration.record(duration, labels);
  
  if (tokensUsed > 0) {
    aiTokensUsed.add(tokensUsed, { provider, model });
  }
  
  // Also record in our existing metrics
  AppMetrics.recordAIRequest(provider, model, duration, tokensUsed, success);
}

/**
 * Record cache metrics
 */
export function recordCacheMetrics(
  operation: 'get' | 'set' | 'delete',
  hit: boolean,
  duration: number
): void {
  if (operation === 'get') {
    if (hit) {
      cacheHits.add(1);
    } else {
      cacheMisses.add(1);
    }
  }
  
  // Also record in our existing metrics
  AppMetrics.recordCacheOperation(operation, hit, duration);
}

/**
 * Record error metrics
 */
export function recordError(
  type: string,
  component: string,
  severity: 'warning' | 'error' | 'critical'
): void {
  errorCount.add(1, {
    type,
    component,
    severity
  });
}

/**
 * Update active request count
 */
export function updateActiveRequests(delta: number): void {
  httpActiveRequests.add(delta);
}

/**
 * Update database connection pool size
 */
export function updateConnectionPool(size: number): void {
  dbConnectionPool.add(size);
}

/**
 * Update cache size
 */
export function updateCacheSize(bytes: number): void {
  cacheSize.add(bytes);
}

/**
 * Record business metrics
 */
export function recordBusinessMetrics(type: 'conversation' | 'message' | 'emissions', metadata?: any): void {
  switch (type) {
    case 'conversation':
      conversationCount.add(1);
      break;
    case 'message':
      messageCount.add(1, metadata);
      break;
    case 'emissions':
      emissionsDataPoints.add(1, metadata);
      if (metadata?.co2_kg) {
        AppMetrics.recordEmissionCalculation(
          metadata.scope || 'unknown',
          metadata.source || 'unknown',
          metadata.co2_kg
        );
      }
      break;
  }
}