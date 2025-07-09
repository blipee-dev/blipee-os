// Use compatible performance API
const performance = globalThis.performance || {
  now: () => Date.now(),
};

// Application metrics collection
export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Map<string, any> = new Map();
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private gauges: Map<string, number> = new Map();

  private constructor() {
    // Initialize system metrics collection
    this.startSystemMetricsCollection();
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  // Counter metrics (incrementing values)
  incrementCounter(name: string, value: number = 1, labels?: Record<string, string>) {
    const key = this.getKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  // Gauge metrics (point-in-time values)
  setGauge(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getKey(name, labels);
    this.gauges.set(key, value);
  }

  // Histogram metrics (distribution of values)
  recordHistogram(name: string, value: number, labels?: Record<string, string>) {
    const key = this.getKey(name, labels);
    if (!this.histograms.has(key)) {
      this.histograms.set(key, []);
    }
    this.histograms.get(key)!.push(value);
  }

  // Measure execution time
  measureTime<T>(name: string, fn: () => T, labels?: Record<string, string>): T {
    const start = performance.now();
    try {
      const result = fn();
      if (result instanceof Promise) {
        return result.then((res) => {
          this.recordHistogram(`${name}_duration_ms`, performance.now() - start, labels);
          return res;
        }) as T;
      } else {
        this.recordHistogram(`${name}_duration_ms`, performance.now() - start, labels);
        return result;
      }
    } catch (error) {
      this.incrementCounter(`${name}_errors_total`, 1, labels);
      throw error;
    }
  }

  // Measure async execution time
  async measureAsyncTime<T>(
    name: string, 
    fn: () => Promise<T>, 
    labels?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      this.recordHistogram(`${name}_duration_ms`, performance.now() - start, labels);
      this.incrementCounter(`${name}_success_total`, 1, labels);
      return result;
    } catch (error) {
      this.recordHistogram(`${name}_duration_ms`, performance.now() - start, labels);
      this.incrementCounter(`${name}_errors_total`, 1, labels);
      throw error;
    }
  }

  // Get all metrics
  getAllMetrics() {
    const countersObj: Record<string, number> = {};
    const gaugesObj: Record<string, number> = {};
    const histogramsObj: Record<string, any> = {};

    // Counters
    this.counters.forEach((value, key) => {
      countersObj[key] = value;
    });

    // Gauges
    this.gauges.forEach((value, key) => {
      gaugesObj[key] = value;
    });

    // Histograms with statistical calculations
    this.histograms.forEach((values, key) => {
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        histogramsObj[key] = {
          count: values.length,
          sum: values.reduce((a, b) => a + b, 0),
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          p50: this.percentile(sorted, 0.5),
          p95: this.percentile(sorted, 0.95),
          p99: this.percentile(sorted, 0.99),
        };
      }
    });

    return {
      counters: countersObj,
      gauges: gaugesObj,
      histograms: histogramsObj,
      timestamp: new Date().toISOString(),
    };
  }

  // Get metrics in Prometheus format
  getPrometheusMetrics(): string {
    let output = '';
    const timestamp = Date.now();

    // Counters
    this.counters.forEach((value, key) => {
      const { name, labels } = this.parseKey(key);
      const labelsStr = this.formatPrometheusLabels(labels);
      output += `# TYPE ${name} counter\n`;
      output += `${name}${labelsStr} ${value} ${timestamp}\n`;
    });

    // Gauges
    this.gauges.forEach((value, key) => {
      const { name, labels } = this.parseKey(key);
      const labelsStr = this.formatPrometheusLabels(labels);
      output += `# TYPE ${name} gauge\n`;
      output += `${name}${labelsStr} ${value} ${timestamp}\n`;
    });

    // Histograms
    this.histograms.forEach((values, key) => {
      if (values.length > 0) {
        const { name, labels } = this.parseKey(key);
        const labelsStr = this.formatPrometheusLabels(labels);
        const sum = values.reduce((a, b) => a + b, 0);
        const count = values.length;

        output += `# TYPE ${name} histogram\n`;
        output += `${name}_bucket{le="+Inf"${labels ? ',' + Object.entries(labels).map(([k, v]) => `${k}="${v}"`).join(',') : ''}} ${count} ${timestamp}\n`;
        output += `${name}_sum${labelsStr} ${sum} ${timestamp}\n`;
        output += `${name}_count${labelsStr} ${count} ${timestamp}\n`;
      }
    });

    return output;
  }

  // Clear old histogram data to prevent memory leaks
  clearOldHistogramData(maxAge: number = 300000) { // 5 minutes
    const cutoff = Date.now() - maxAge;
    this.histograms.forEach((values, key) => {
      // Keep only recent values (in a real implementation, you'd track timestamps)
      if (values.length > 1000) {
        this.histograms.set(key, values.slice(-500));
      }
    });
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  private parseKey(key: string): { name: string; labels?: Record<string, string> } {
    const braceIndex = key.indexOf('{');
    if (braceIndex === -1) {
      return { name: key };
    }

    const name = key.substring(0, braceIndex);
    const labelsStr = key.substring(braceIndex + 1, key.length - 1);
    const labels: Record<string, string> = {};

    if (labelsStr) {
      const pairs = labelsStr.split(',');
      for (const pair of pairs) {
        const [k, v] = pair.split('=');
        labels[k] = v.replace(/"/g, '');
      }
    }

    return { name, labels };
  }

  private formatPrometheusLabels(labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `{${labelStr}}`;
  }

  private percentile(sortedArray: number[], p: number): number {
    const index = (sortedArray.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) return sortedArray[lower];
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  private startSystemMetricsCollection() {
    // Only collect system metrics if running in Node.js environment
    if (typeof process !== 'undefined' && process.memoryUsage) {
      // Collect system metrics every 15 seconds
      setInterval(() => {
        try {
          const memUsage = process.memoryUsage();
          const cpuUsage = process.cpuUsage();

          // Memory metrics
          this.setGauge('nodejs_memory_heap_used_bytes', memUsage.heapUsed);
          this.setGauge('nodejs_memory_heap_total_bytes', memUsage.heapTotal);
          this.setGauge('nodejs_memory_external_bytes', memUsage.external);
          this.setGauge('nodejs_memory_rss_bytes', memUsage.rss);

          // CPU metrics (in microseconds)
          this.setGauge('nodejs_cpu_user_seconds', cpuUsage.user / 1000000);
          this.setGauge('nodejs_cpu_system_seconds', cpuUsage.system / 1000000);

          // Process metrics
          this.setGauge('nodejs_process_uptime_seconds', process.uptime());
          this.setGauge('nodejs_process_start_time_seconds', Date.now() / 1000 - process.uptime());

          // Event loop lag (simplified) - only in Node.js
          if (process.hrtime?.bigint && typeof setImmediate !== 'undefined') {
            const start = process.hrtime.bigint();
            setImmediate(() => {
              const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
              this.setGauge('nodejs_eventloop_lag_ms', lag);
            });
          }

        } catch (error) {
          console.error('Error collecting system metrics:', error);
        }
      }, 15000);
    }
  }
}

// Singleton instance
export const metrics = MetricsCollector.getInstance();

// Decorator for measuring function execution time
export function Measure(metricName: string, labels?: Record<string, string>) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return metrics.measureAsyncTime(
        metricName || `${target.constructor.name}_${propertyName}`,
        () => method.apply(this, args),
        labels
      );
    };
  };
}

// Application-specific metrics
export const AppMetrics = {
  // API metrics
  recordAPIRequest: (method: string, endpoint: string, status: number, duration: number) => {
    metrics.incrementCounter('http_requests_total', 1, { method, endpoint, status: status.toString() });
    metrics.recordHistogram('http_request_duration_ms', duration, { method, endpoint });
    
    if (status >= 400) {
      metrics.incrementCounter('http_errors_total', 1, { method, endpoint, status: status.toString() });
    }
  },

  // Database metrics
  recordDatabaseQuery: (operation: string, table: string, duration: number, success: boolean) => {
    metrics.incrementCounter('database_queries_total', 1, { operation, table });
    metrics.recordHistogram('database_query_duration_ms', duration, { operation, table });
    
    if (!success) {
      metrics.incrementCounter('database_errors_total', 1, { operation, table });
    }
  },

  // Authentication metrics
  recordAuthEvent: (event: string, method: string, success: boolean) => {
    metrics.incrementCounter('auth_events_total', 1, { event, method, success: success.toString() });
  },

  // AI/ML metrics
  recordAIRequest: (provider: string, model: string, duration: number, tokens: number, success: boolean) => {
    metrics.incrementCounter('ai_requests_total', 1, { provider, model, success: success.toString() });
    metrics.recordHistogram('ai_request_duration_ms', duration, { provider, model });
    metrics.recordHistogram('ai_tokens_used', tokens, { provider, model });
  },

  // Business metrics
  recordEmissionCalculation: (scope: string, source: string, co2_kg: number) => {
    metrics.incrementCounter('emission_calculations_total', 1, { scope, source });
    metrics.recordHistogram('emission_co2_kg', co2_kg, { scope, source });
  },

  // WebSocket metrics
  recordWebSocketEvent: (event: string, room?: string) => {
    metrics.incrementCounter('websocket_events_total', 1, { event, room: room || 'global' });
  },

  // Active connections
  setActiveConnections: (count: number, type: string = 'http') => {
    metrics.setGauge('active_connections', count, { type });
  },

  // Cache metrics
  recordCacheOperation: (operation: string, hit: boolean, duration: number) => {
    metrics.incrementCounter('cache_operations_total', 1, { operation, hit: hit.toString() });
    metrics.recordHistogram('cache_operation_duration_ms', duration, { operation });
  },
};