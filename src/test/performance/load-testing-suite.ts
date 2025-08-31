/**
 * Load Testing Suite
 * Phase 5, Task 5.4: Comprehensive load testing and stress testing
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';

export interface LoadTestScenario {
  name: string;
  description: string;
  duration: number; // seconds
  rampUpTime: number; // seconds
  maxVirtualUsers: number;
  requestsPerSecond: number;
  endpoints: Array<{
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    weight: number; // percentage of requests
    headers?: Record<string, string>;
    body?: any;
  }>;
  acceptableCriteria: {
    maxResponseTime: number; // ms
    maxErrorRate: number; // percentage
    minThroughput: number; // requests/second
  };
}

export interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  throughput: number;
  memoryUsage: {
    start: number;
    peak: number;
    end: number;
  };
  cpuUsage: number[];
}

export interface LoadTestResult {
  scenario: LoadTestScenario;
  metrics: LoadTestMetrics;
  passed: boolean;
  startTime: Date;
  endTime: Date;
  duration: number;
  errors: Array<{
    endpoint: string;
    error: string;
    count: number;
  }>;
  responseTimeDistribution: Array<{
    timeRange: string;
    count: number;
    percentage: number;
  }>;
}

export interface LoadTestReport {
  timestamp: string;
  summary: {
    totalScenarios: number;
    passedScenarios: number;
    failedScenarios: number;
    overallScore: number;
    maxThroughput: number;
    averageErrorRate: number;
  };
  results: LoadTestResult[];
  systemResources: {
    peakMemoryUsage: number;
    averageCpuUsage: number;
    diskUsage: number;
  };
  recommendations: string[];
}

export class LoadTestingSuite extends EventEmitter {
  private scenarios: LoadTestScenario[] = [];
  private results: LoadTestResult[] = [];
  private baseURL: string;

  constructor(baseURL: string = process.env.TEST_BASE_URL || 'http://localhost:3000') {
    super();
    this.baseURL = baseURL;
    this.initializeScenarios();
  }

  private initializeScenarios(): void {
    // Light Load Scenario
    this.scenarios.push({
      name: 'Light Load Test',
      description: 'Basic load with minimal concurrent users',
      duration: 60,
      rampUpTime: 10,
      maxVirtualUsers: 10,
      requestsPerSecond: 5,
      endpoints: [
        { path: '/api/health', method: 'GET', weight: 40 },
        { path: '/api/organizations', method: 'GET', weight: 30 },
        { path: '/api/emissions', method: 'GET', weight: 20 },
        { path: '/', method: 'GET', weight: 10 }
      ],
      acceptableCriteria: {
        maxResponseTime: 500,
        maxErrorRate: 1,
        minThroughput: 4
      }
    });

    // Normal Load Scenario
    this.scenarios.push({
      name: 'Normal Load Test',
      description: 'Typical production load simulation',
      duration: 120,
      rampUpTime: 20,
      maxVirtualUsers: 50,
      requestsPerSecond: 25,
      endpoints: [
        { path: '/api/health', method: 'GET', weight: 20 },
        { path: '/api/organizations', method: 'GET', weight: 25 },
        { path: '/api/emissions', method: 'GET', weight: 20 },
        { path: '/api/auth/session', method: 'GET', weight: 15 },
        { path: '/dashboard', method: 'GET', weight: 10 },
        { path: '/api/monitoring/health', method: 'GET', weight: 10 }
      ],
      acceptableCriteria: {
        maxResponseTime: 1000,
        maxErrorRate: 3,
        minThroughput: 20
      }
    });

    // Heavy Load Scenario
    this.scenarios.push({
      name: 'Heavy Load Test',
      description: 'High load stress testing',
      duration: 180,
      rampUpTime: 30,
      maxVirtualUsers: 100,
      requestsPerSecond: 50,
      endpoints: [
        { path: '/api/health', method: 'GET', weight: 15 },
        { path: '/api/organizations', method: 'GET', weight: 20 },
        { path: '/api/emissions', method: 'GET', weight: 20 },
        { path: '/api/auth/session', method: 'GET', weight: 15 },
        { path: '/api/monitoring/metrics', method: 'GET', weight: 10 },
        { path: '/api/ai/chat', method: 'POST', weight: 10, body: { message: 'Test load' } },
        { path: '/dashboard', method: 'GET', weight: 10 }
      ],
      acceptableCriteria: {
        maxResponseTime: 2000,
        maxErrorRate: 5,
        minThroughput: 40
      }
    });

    // Spike Load Scenario
    this.scenarios.push({
      name: 'Spike Load Test',
      description: 'Sudden traffic spike simulation',
      duration: 90,
      rampUpTime: 5, // Very fast ramp-up
      maxVirtualUsers: 200,
      requestsPerSecond: 100,
      endpoints: [
        { path: '/api/health', method: 'GET', weight: 30 },
        { path: '/api/organizations', method: 'GET', weight: 25 },
        { path: '/api/emissions', method: 'GET', weight: 20 },
        { path: '/api/auth/session', method: 'GET', weight: 15 },
        { path: '/dashboard', method: 'GET', weight: 10 }
      ],
      acceptableCriteria: {
        maxResponseTime: 3000,
        maxErrorRate: 10,
        minThroughput: 75
      }
    });

    // Stress Test Scenario
    this.scenarios.push({
      name: 'Stress Test',
      description: 'System breaking point identification',
      duration: 300,
      rampUpTime: 60,
      maxVirtualUsers: 500,
      requestsPerSecond: 200,
      endpoints: [
        { path: '/api/health', method: 'GET', weight: 40 },
        { path: '/api/organizations', method: 'GET', weight: 30 },
        { path: '/api/emissions', method: 'GET', weight: 20 },
        { path: '/api/monitoring/health', method: 'GET', weight: 10 }
      ],
      acceptableCriteria: {
        maxResponseTime: 5000,
        maxErrorRate: 20,
        minThroughput: 100
      }
    });

    // Endurance Test Scenario
    this.scenarios.push({
      name: 'Endurance Test',
      description: 'Long-term stability and memory leak detection',
      duration: 1800, // 30 minutes
      rampUpTime: 60,
      maxVirtualUsers: 30,
      requestsPerSecond: 15,
      endpoints: [
        { path: '/api/health', method: 'GET', weight: 25 },
        { path: '/api/organizations', method: 'GET', weight: 25 },
        { path: '/api/emissions', method: 'GET', weight: 25 },
        { path: '/api/monitoring/health', method: 'GET', weight: 25 }
      ],
      acceptableCriteria: {
        maxResponseTime: 1500,
        maxErrorRate: 2,
        minThroughput: 12
      }
    });
  }

  async runAllScenarios(): Promise<LoadTestReport> {
    console.log('🚀 Starting Load Testing Suite...\n');
    console.log(`Testing against: ${this.baseURL}\n`);

    this.results = [];

    for (const scenario of this.scenarios) {
      console.log(`📊 Running scenario: ${scenario.name}`);
      console.log(`   ${scenario.description}`);
      console.log(`   Duration: ${scenario.duration}s | Max Users: ${scenario.maxVirtualUsers} | RPS: ${scenario.requestsPerSecond}`);

      try {
        const result = await this.runScenario(scenario);
        this.results.push(result);

        const status = result.passed ? '✅ PASS' : '❌ FAIL';
        console.log(`   Result: ${status}`);
        console.log(`   Avg Response Time: ${result.metrics.averageResponseTime.toFixed(2)}ms`);
        console.log(`   Error Rate: ${result.metrics.errorRate.toFixed(2)}%`);
        console.log(`   Throughput: ${result.metrics.throughput.toFixed(2)} RPS`);

      } catch (error) {
        console.error(`   ❌ Scenario failed: ${(error as Error).message}`);
        
        // Create a failed result
        const failedResult: LoadTestResult = {
          scenario,
          metrics: this.createEmptyMetrics(),
          passed: false,
          startTime: new Date(),
          endTime: new Date(),
          duration: 0,
          errors: [{ endpoint: 'N/A', error: (error as Error).message, count: 1 }],
          responseTimeDistribution: []
        };
        this.results.push(failedResult);
      }

      console.log(''); // Empty line for readability
      
      // Wait between scenarios to let system recover
      if (scenario !== this.scenarios[this.scenarios.length - 1]) {
        console.log('⏳ Waiting 30 seconds for system recovery...\n');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    return this.generateReport();
  }

  private async runScenario(scenario: LoadTestScenario): Promise<LoadTestResult> {
    const startTime = new Date();
    const startMemory = process.memoryUsage().heapUsed;
    
    const metrics: LoadTestMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: Infinity,
      requestsPerSecond: 0,
      errorRate: 0,
      throughput: 0,
      memoryUsage: {
        start: startMemory,
        peak: startMemory,
        end: startMemory
      },
      cpuUsage: []
    };

    const responseTimes: number[] = [];
    const errors: Map<string, { error: string; count: number }> = new Map();
    const requestCounts: number[] = [];

    let activeRequests = 0;
    let currentVirtualUsers = 0;
    
    // Calculate ramp-up rate
    const rampUpRate = scenario.maxVirtualUsers / scenario.rampUpTime;
    const requestInterval = 1000 / scenario.requestsPerSecond; // ms between requests

    // Start performance monitoring
    const monitoringInterval = setInterval(() => {
      const currentMemory = process.memoryUsage().heapUsed;
      metrics.memoryUsage.peak = Math.max(metrics.memoryUsage.peak, currentMemory);
    }, 1000);

    // Load test execution
    return new Promise<LoadTestResult>((resolve) => {
      const testDuration = scenario.duration * 1000; // Convert to ms
      const startTime = Date.now();

      const executeRequest = async (): Promise<void> => {
        if (activeRequests >= currentVirtualUsers) return;

        activeRequests++;
        metrics.totalRequests++;

        // Select endpoint based on weight
        const endpoint = this.selectEndpoint(scenario.endpoints);
        
        try {
          const requestStart = Date.now();
          
          const response = await this.makeRequest(endpoint);
          
          const responseTime = Date.now() - requestStart;
          responseTimes.push(responseTime);
          
          metrics.successfulRequests++;
          metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);
          metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);

        } catch (error) {
          metrics.failedRequests++;
          const errorKey = `${endpoint.path}:${(error as Error).message}`;
          
          if (errors.has(errorKey)) {
            errors.get(errorKey)!.count++;
          } else {
            errors.set(errorKey, {
              error: (error as Error).message,
              count: 1
            });
          }
        }

        activeRequests--;
      };

      // Ramp-up virtual users
      const rampUpInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        
        if (elapsed <= scenario.rampUpTime) {
          currentVirtualUsers = Math.min(
            Math.floor(elapsed * rampUpRate),
            scenario.maxVirtualUsers
          );
        } else {
          currentVirtualUsers = scenario.maxVirtualUsers;
        }

        if (elapsed >= scenario.duration) {
          clearInterval(rampUpInterval);
          clearInterval(requestIntervalId);
        }
      }, 1000);

      // Send requests at specified rate
      const requestIntervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        
        if (elapsed >= testDuration) {
          clearInterval(requestIntervalId);
          clearInterval(rampUpInterval);
          clearInterval(monitoringInterval);
          
          // Calculate final metrics
          this.calculateFinalMetrics(metrics, responseTimes);
          
          const endTime = new Date();
          metrics.memoryUsage.end = process.memoryUsage().heapUsed;

          const result: LoadTestResult = {
            scenario,
            metrics,
            passed: this.evaluateScenario(metrics, scenario.acceptableCriteria),
            startTime: new Date(startTime),
            endTime,
            duration: (endTime.getTime() - startTime) / 1000,
            errors: Array.from(errors.entries()).map(([endpoint, error]) => ({
              endpoint: endpoint.split(':')[0],
              error: error.error,
              count: error.count
            })),
            responseTimeDistribution: this.calculateResponseTimeDistribution(responseTimes)
          };

          resolve(result);
          return;
        }

        // Execute requests based on current virtual users
        const requestsToSend = Math.min(
          currentVirtualUsers,
          Math.floor(scenario.requestsPerSecond * (100 / 1000))
        );

        for (let i = 0; i < requestsToSend; i++) {
          executeRequest().catch(() => {}); // Handle errors in executeRequest
        }
      }, Math.max(100, 100)); // Minimum 100ms interval
    });
  }

  private selectEndpoint(endpoints: LoadTestScenario['endpoints']) {
    const random = Math.random() * 100;
    let weightSum = 0;
    
    for (const endpoint of endpoints) {
      weightSum += endpoint.weight;
      if (random <= weightSum) {
        return endpoint;
      }
    }
    
    return endpoints[0]; // Fallback
  }

  private async makeRequest(endpoint: LoadTestScenario['endpoints'][0]): Promise<Response> {
    const url = `${this.baseURL}${endpoint.path}`;
    const options: RequestInit = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        ...endpoint.headers
      }
    };

    if (endpoint.body && (endpoint.method === 'POST' || endpoint.method === 'PUT')) {
      options.body = JSON.stringify(endpoint.body);
    }

    const response = await fetch(url, options);
    
    // Don't throw on HTTP errors for load testing
    return response;
  }

  private calculateFinalMetrics(metrics: LoadTestMetrics, responseTimes: number[]): void {
    if (responseTimes.length === 0) return;

    const sortedTimes = responseTimes.sort((a, b) => a - b);
    const total = responseTimes.reduce((sum, time) => sum + time, 0);

    metrics.averageResponseTime = total / responseTimes.length;
    metrics.p50ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
    metrics.p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    metrics.p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    metrics.errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;
    metrics.throughput = metrics.successfulRequests / (Date.now() / 1000); // Rough calculation
    metrics.requestsPerSecond = metrics.totalRequests / (Date.now() / 1000);
  }

  private calculateResponseTimeDistribution(responseTimes: number[]) {
    const ranges = [
      { min: 0, max: 100, label: '0-100ms' },
      { min: 100, max: 500, label: '100-500ms' },
      { min: 500, max: 1000, label: '500ms-1s' },
      { min: 1000, max: 2000, label: '1-2s' },
      { min: 2000, max: 5000, label: '2-5s' },
      { min: 5000, max: Infinity, label: '5s+' }
    ];

    return ranges.map(range => {
      const count = responseTimes.filter(time => time >= range.min && time < range.max).length;
      const percentage = (count / responseTimes.length) * 100;
      
      return {
        timeRange: range.label,
        count,
        percentage
      };
    });
  }

  private evaluateScenario(metrics: LoadTestMetrics, criteria: LoadTestScenario['acceptableCriteria']): boolean {
    return metrics.averageResponseTime <= criteria.maxResponseTime &&
           metrics.errorRate <= criteria.maxErrorRate &&
           metrics.throughput >= criteria.minThroughput;
  }

  private createEmptyMetrics(): LoadTestMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      maxResponseTime: 0,
      minResponseTime: 0,
      requestsPerSecond: 0,
      errorRate: 100,
      throughput: 0,
      memoryUsage: { start: 0, peak: 0, end: 0 },
      cpuUsage: []
    };
  }

  private generateReport(): LoadTestReport {
    const passedScenarios = this.results.filter(r => r.passed).length;
    const failedScenarios = this.results.length - passedScenarios;

    // Calculate overall score
    const scoreWeights = { passed: 40, responseTime: 30, errorRate: 20, throughput: 10 };
    let score = 0;

    if (this.results.length > 0) {
      const passedScore = (passedScenarios / this.results.length) * scoreWeights.passed;
      
      const avgResponseTime = this.results.reduce((sum, r) => sum + r.metrics.averageResponseTime, 0) / this.results.length;
      const responseTimeScore = Math.max(0, scoreWeights.responseTime - (avgResponseTime / 100));
      
      const avgErrorRate = this.results.reduce((sum, r) => sum + r.metrics.errorRate, 0) / this.results.length;
      const errorRateScore = Math.max(0, scoreWeights.errorRate - avgErrorRate);
      
      const avgThroughput = this.results.reduce((sum, r) => sum + r.metrics.throughput, 0) / this.results.length;
      const throughputScore = Math.min(scoreWeights.throughput, avgThroughput / 10);

      score = passedScore + responseTimeScore + errorRateScore + throughputScore;
    }

    const systemResources = {
      peakMemoryUsage: Math.max(...this.results.map(r => r.metrics.memoryUsage.peak)) / 1024 / 1024, // MB
      averageCpuUsage: 0, // Would need actual CPU monitoring
      diskUsage: 0 // Would need disk monitoring
    };

    const recommendations = this.generateRecommendations();

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalScenarios: this.results.length,
        passedScenarios,
        failedScenarios,
        overallScore: Math.round(score),
        maxThroughput: Math.max(...this.results.map(r => r.metrics.throughput)),
        averageErrorRate: this.results.reduce((sum, r) => sum + r.metrics.errorRate, 0) / this.results.length
      },
      results: this.results,
      systemResources,
      recommendations
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    const highErrorRateResults = this.results.filter(r => r.metrics.errorRate > 5);
    if (highErrorRateResults.length > 0) {
      recommendations.push(`🔴 ${highErrorRateResults.length} scenarios have high error rates (>5%)`);
    }

    const slowResponseResults = this.results.filter(r => r.metrics.averageResponseTime > 2000);
    if (slowResponseResults.length > 0) {
      recommendations.push(`🐌 ${slowResponseResults.length} scenarios have slow response times (>2s)`);
    }

    const lowThroughputResults = this.results.filter(r => r.metrics.throughput < 10);
    if (lowThroughputResults.length > 0) {
      recommendations.push(`📉 ${lowThroughputResults.length} scenarios have low throughput (<10 RPS)`);
    }

    const memoryGrowth = this.results.some(r => 
      (r.metrics.memoryUsage.end - r.metrics.memoryUsage.start) > 100 * 1024 * 1024 // 100MB
    );
    if (memoryGrowth) {
      recommendations.push('💾 Potential memory leaks detected - investigate memory usage patterns');
    }

    const failedScenarios = this.results.filter(r => !r.passed);
    if (failedScenarios.length > 0) {
      recommendations.push('⚡ Consider implementing caching, connection pooling, and database optimization');
    }

    if (recommendations.length === 0) {
      recommendations.push('🎉 All load tests passed - system performing well under load');
    }

    return recommendations;
  }

  async saveResults(outputDir: string = 'test-results/load-testing'): Promise<void> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const report = this.generateReport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Save JSON report
    const jsonPath = path.join(outputDir, `load-test-report-${timestamp}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Save HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = path.join(outputDir, `load-test-report-${timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlReport);

    console.log(`\n📄 Load test reports saved:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   HTML: ${htmlPath}`);
  }

  private generateHTMLReport(report: LoadTestReport): string {
    const scoreColor = report.summary.overallScore >= 80 ? '#28a745' :
                      report.summary.overallScore >= 60 ? '#ffc107' : '#dc3545';

    return `<!DOCTYPE html>
<html>
<head>
    <title>Load Test Report - blipee-os</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f8f9fa; }
        .header { background: linear-gradient(135deg, #e83e8c 0%, #fd7e14 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .score { font-size: 3em; font-weight: bold; color: ${scoreColor}; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .pass { color: #28a745; font-weight: bold; }
        .fail { color: #dc3545; font-weight: bold; }
        .metric-good { color: #28a745; }
        .metric-warning { color: #ffc107; }
        .metric-poor { color: #dc3545; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📈 Load Test Report</h1>
        <p>blipee-os Load Testing Results - ${new Date(report.timestamp).toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="card">
            <h3>Overall Score</h3>
            <div class="score">${report.summary.overallScore}</div>
        </div>
        <div class="card">
            <h3>Scenarios</h3>
            <h2>${report.summary.totalScenarios}</h2>
            <p>${report.summary.passedScenarios} passed, ${report.summary.failedScenarios} failed</p>
        </div>
        <div class="card">
            <h3>Max Throughput</h3>
            <h2>${report.summary.maxThroughput.toFixed(1)}</h2>
            <p>requests/second</p>
        </div>
        <div class="card">
            <h3>Average Error Rate</h3>
            <h2 class="${report.summary.averageErrorRate < 5 ? 'metric-good' : report.summary.averageErrorRate < 10 ? 'metric-warning' : 'metric-poor'}">${report.summary.averageErrorRate.toFixed(2)}%</h2>
        </div>
        <div class="card">
            <h3>Peak Memory</h3>
            <h2>${report.systemResources.peakMemoryUsage.toFixed(1)}</h2>
            <p>MB</p>
        </div>
    </div>
    
    <div class="card">
        <h2>📊 Load Test Results</h2>
        <table>
            <thead>
                <tr>
                    <th>Scenario</th>
                    <th>Duration</th>
                    <th>Max Users</th>
                    <th>Total Requests</th>
                    <th>Avg Response Time</th>
                    <th>P95 Response Time</th>
                    <th>Error Rate</th>
                    <th>Throughput</th>
                    <th>Result</th>
                </tr>
            </thead>
            <tbody>
                ${report.results.map(result => `
                    <tr>
                        <td>${result.scenario.name}</td>
                        <td>${result.scenario.duration}s</td>
                        <td>${result.scenario.maxVirtualUsers}</td>
                        <td>${result.metrics.totalRequests}</td>
                        <td>${result.metrics.averageResponseTime.toFixed(2)}ms</td>
                        <td>${result.metrics.p95ResponseTime.toFixed(2)}ms</td>
                        <td class="${result.metrics.errorRate < 5 ? 'metric-good' : result.metrics.errorRate < 10 ? 'metric-warning' : 'metric-poor'}">${result.metrics.errorRate.toFixed(2)}%</td>
                        <td>${result.metrics.throughput.toFixed(2)} RPS</td>
                        <td class="${result.passed ? 'pass' : 'fail'}">${result.passed ? '✅ PASS' : '❌ FAIL'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <div class="card">
        <h2>💡 Recommendations</h2>
        <ul>
            ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
    </div>
</body>
</html>`;
  }
}

// CLI Usage
if (require.main === module) {
  const suite = new LoadTestingSuite();
  
  suite.runAllScenarios()
    .then(async (report) => {
      console.log('\n📊 Load Testing Summary:');
      console.log(`Overall Score: ${report.summary.overallScore}/100`);
      console.log(`Passed: ${report.summary.passedScenarios}/${report.summary.totalScenarios}`);
      console.log(`Max Throughput: ${report.summary.maxThroughput.toFixed(2)} RPS`);
      console.log(`Average Error Rate: ${report.summary.averageErrorRate.toFixed(2)}%`);

      await suite.saveResults();
      
      console.log('\n🎉 Load testing completed!');
      
      const hasFailures = report.summary.failedScenarios > 0;
      process.exit(hasFailures ? 1 : 0);
    })
    .catch(error => {
      console.error('❌ Load testing failed:', error);
      process.exit(1);
    });
}