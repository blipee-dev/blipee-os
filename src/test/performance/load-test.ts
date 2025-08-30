/**
 * Performance and Load Testing Framework
 * Simulates real-world load patterns and measures system performance
 */

import { performance } from 'perf_hooks';

interface LoadTestConfig {
  name: string;
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  rampUp: {
    duration: number; // seconds
    targetUsers: number;
  };
  sustain: {
    duration: number; // seconds
    users: number;
  };
  rampDown: {
    duration: number; // seconds
  };
  thresholds: {
    errorRate: number; // percentage
    p95ResponseTime: number; // milliseconds
    p99ResponseTime: number; // milliseconds
  };
}

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errors: Record<string, number>;
}

export class LoadTester {
  private results: number[] = [];
  private errors: Record<string, number> = {};
  private startTime: number = 0;
  private endTime: number = 0;

  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log(`Starting load test: ${config.name}`);
    
    this.results = [];
    this.errors = {};
    this.startTime = performance.now();

    // Ramp up phase
    await this.rampUp(config);

    // Sustain phase
    await this.sustain(config);

    // Ramp down phase
    await this.rampDown(config);

    this.endTime = performance.now();

    const result = this.calculateResults();
    this.validateThresholds(result, config.thresholds);

    return result;
  }

  private async rampUp(config: LoadTestConfig): Promise<void> {
    const steps = config.rampUp.duration;
    const usersPerStep = config.rampUp.targetUsers / steps;

    for (let i = 1; i <= steps; i++) {
      const currentUsers = Math.floor(usersPerStep * i);
      await this.executeRequests(config, currentUsers, 1000);
    }
  }

  private async sustain(config: LoadTestConfig): Promise<void> {
    for (let i = 0; i < config.sustain.duration; i++) {
      await this.executeRequests(config, config.sustain.users, 1000);
    }
  }

  private async rampDown(config: LoadTestConfig): Promise<void> {
    const steps = config.rampDown.duration;
    const usersPerStep = config.sustain.users / steps;

    for (let i = steps; i >= 1; i--) {
      const currentUsers = Math.floor(usersPerStep * i);
      await this.executeRequests(config, currentUsers, 1000);
    }
  }

  private async executeRequests(
    config: LoadTestConfig,
    users: number,
    duration: number
  ): Promise<void> {
    const requests = [];
    const requestsPerUser = Math.max(1, Math.floor(duration / 100)); // Requests per user per second

    for (let user = 0; user < users; user++) {
      for (let req = 0; req < requestsPerUser; req++) {
        requests.push(this.makeRequest(config));
      }
    }

    await Promise.all(_request);
  }

  private async makeRequest(config: LoadTestConfig): Promise<void> {
    const start = performance.now();
    
    try {
      const response = await fetch(config.endpoint, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
        body: config.body ? JSON.stringify(config.body) : undefined,
      });

      const duration = performance.now() - start;
      this.results.push(duration);

      if (!response.ok) {
        const errorKey = `${response.status}`;
        this.errors[errorKey] = (this.errors[errorKey] || 0) + 1;
      }
    } catch (error) {
      const duration = performance.now() - start;
      this.results.push(duration);
      
      const errorKey = error instanceof Error ? error.message : 'Unknown error';
      this.errors[errorKey] = (this.errors[errorKey] || 0) + 1;
    }
  }

  private calculateResults(): LoadTestResult {
    const sorted = [...this.results].sort((a, b) => a - b);
    const totalRequests = this.results.length;
    const failedRequests = Object.values(this.errors).reduce((sum, count) => sum + count, 0);
    const successfulRequests = totalRequests - failedRequests;
    const totalDuration = (this.endTime - this.startTime) / 1000; // Convert to seconds

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      errorRate: (failedRequests / totalRequests) * 100,
      avgResponseTime: this.average(this.results),
      minResponseTime: Math.min(...this.results),
      maxResponseTime: Math.max(...this.results),
      p50ResponseTime: this.percentile(sorted, 50),
      p95ResponseTime: this.percentile(sorted, 95),
      p99ResponseTime: this.percentile(sorted, 99),
      requestsPerSecond: totalRequests / totalDuration,
      errors: this.errors,
    };
  }

  private average(numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  private validateThresholds(result: LoadTestResult, thresholds: any): void {
    const failures = [];

    if (result.errorRate > thresholds.errorRate) {
      failures.push(`Error rate ${result.errorRate.toFixed(2)}% exceeds threshold ${thresholds.errorRate}%`);
    }

    if (result.p95ResponseTime > thresholds.p95ResponseTime) {
      failures.push(`P95 response time ${result.p95ResponseTime.toFixed(2)}ms exceeds threshold ${thresholds.p95ResponseTime}ms`);
    }

    if (result.p99ResponseTime > thresholds.p99ResponseTime) {
      failures.push(`P99 response time ${result.p99ResponseTime.toFixed(2)}ms exceeds threshold ${thresholds.p99ResponseTime}ms`);
    }

    if (failures.length > 0) {
      console.error('Load test failed thresholds:');
      failures.forEach(f => console.error(`  - ${f}`));
      throw new Error('Load test failed performance thresholds');
    }
  }
}

// Predefined load test scenarios
export const loadTestScenarios = {
  // Normal daily traffic pattern
  normalTraffic: {
    name: 'Normal Traffic Pattern',
    endpoint: 'http://localhost:3000/api/ai/chat',
    method: 'POST',
    body: { message: 'What is our carbon footprint?' },
    rampUp: { duration: 60, targetUsers: 100 },
    sustain: { duration: 300, users: 100 },
    rampDown: { duration: 30 },
    thresholds: {
      errorRate: 0.1,
      p95ResponseTime: 1000,
      p99ResponseTime: 2000,
    },
  },

  // Peak traffic (e.g., after marketing campaign)
  peakTraffic: {
    name: 'Peak Traffic Pattern',
    endpoint: 'http://localhost:3000/api/ai/chat',
    method: 'POST',
    body: { message: 'Analyze my sustainability report' },
    rampUp: { duration: 30, targetUsers: 500 },
    sustain: { duration: 600, users: 500 },
    rampDown: { duration: 60 },
    thresholds: {
      errorRate: 1,
      p95ResponseTime: 2000,
      p99ResponseTime: 5000,
    },
  },

  // Spike test (sudden traffic surge)
  spikeTest: {
    name: 'Spike Test',
    endpoint: 'http://localhost:3000/api/ai/chat',
    method: 'POST',
    body: { message: 'Quick question' },
    rampUp: { duration: 10, targetUsers: 1000 },
    sustain: { duration: 60, users: 1000 },
    rampDown: { duration: 10 },
    thresholds: {
      errorRate: 5,
      p95ResponseTime: 3000,
      p99ResponseTime: 10000,
    },
  },

  // Stress test (find breaking point)
  stressTest: {
    name: 'Stress Test',
    endpoint: 'http://localhost:3000/api/ai/chat',
    method: 'POST',
    body: { message: 'Complex analysis request' },
    rampUp: { duration: 300, targetUsers: 2000 },
    sustain: { duration: 600, users: 2000 },
    rampDown: { duration: 120 },
    thresholds: {
      errorRate: 10,
      p95ResponseTime: 5000,
      p99ResponseTime: 15000,
    },
  },

  // Soak test (extended duration)
  soakTest: {
    name: 'Soak Test',
    endpoint: 'http://localhost:3000/api/ai/chat',
    method: 'POST',
    body: { message: 'Regular query' },
    rampUp: { duration: 120, targetUsers: 200 },
    sustain: { duration: 7200, users: 200 }, // 2 hours
    rampDown: { duration: 60 },
    thresholds: {
      errorRate: 0.5,
      p95ResponseTime: 1500,
      p99ResponseTime: 3000,
    },
  },
};

// Performance monitoring
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  getMetricSummary(name: string): any {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
    };
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [name, _] of this.metrics) {
      result[name] = this.getMetricSummary(name);
    }
    return result;
  }

  reset(): void {
    this.metrics.clear();
  }
}

// Database connection pool testing
export async function testDatabaseConnectionPool(
  maxConnections: number,
  testDuration: number
): Promise<void> {
  const connections = [];
  const errors = [];

  const startTime = Date.now();
  
  while (Date.now() - startTime < testDuration) {
    try {
      // Simulate database connection
      const connection = await createDatabaseConnection();
      connections.push(connection);

      // If we exceed max connections, we should get an error
      if (connections.length > maxConnections) {
        throw new Error(`Connection pool exceeded: ${connections.length}/${maxConnections}`);
      }

      // Randomly close connections
      if (Math.random() > 0.7 && connections.length > 0) {
        const index = Math.floor(Math.random() * connections.length);
        await closeDatabaseConnection(connections[index]);
        connections.splice(index, 1);
      }

      // Small delay to simulate realistic usage
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    } catch (error) {
      errors.push(error);
    }
  }

  // Clean up remaining connections
  await Promise.all(connections.map(conn => closeDatabaseConnection(conn)));

  console.log(`Database pool test completed:
    - Max connections: ${maxConnections}
    - Test duration: ${testDuration}ms
    - Peak connections: ${Math.max(...connections.map((_, i) => i + 1))}
    - Errors: ${errors.length}
  `);

  if (errors.length > 0) {
    throw new Error(`Database pool test failed with ${errors.length} errors`);
  }
}

// Memory leak detection
export class MemoryLeakDetector {
  private samples: { timestamp: number; heapUsed: number }[] = [];
  private interval: NodeJS.Timeout | null = null;

  start(sampleInterval: number = 1000): void {
    this.samples = [];
    this.interval = setInterval(() => {
      const memUsage = process.memoryUsage();
      this.samples.push({
        timestamp: Date.now(),
        heapUsed: memUsage.heapUsed,
      });
    }, sampleInterval);
  }

  stop(): { leaked: boolean; trend: number; samples: any[] } {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    if (this.samples.length < 10) {
      return { leaked: false, trend: 0, samples: this.samples };
    }

    // Calculate linear regression to detect memory growth trend
    const n = this.samples.length;
    const sumX = this.samples.reduce((sum, s, i) => sum + i, 0);
    const sumY = this.samples.reduce((sum, s) => sum + s.heapUsed, 0);
    const sumXY = this.samples.reduce((sum, s, i) => sum + i * s.heapUsed, 0);
    const sumX2 = this.samples.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    // Convert slope to MB per minute
    const mbPerMinute = (slope * 60 * 1000) / (1024 * 1024);

    // Consider it a leak if memory grows more than 10MB per minute
    const leaked = mbPerMinute > 10;

    return {
      leaked,
      trend: mbPerMinute,
      samples: this.samples,
    };
  }
}

// Helper functions (would be actual implementations in real code)
async function createDatabaseConnection(): Promise<any> {
  // Simulate database connection
  return { id: Math.random().toString(36) };
}

async function closeDatabaseConnection(connection: any): Promise<void> {
  // Simulate closing connection
  await new Promise(resolve => setTimeout(resolve, 10));
}