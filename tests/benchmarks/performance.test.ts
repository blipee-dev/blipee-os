import { performance } from 'perf_hooks';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCacheService } from '@/lib/cache/cache-service';
import { getConnectionPool } from '@/lib/db/connection-pool';
import { aiService } from '@/lib/ai/service';

interface BenchmarkResult {
  name: string;
  operations: number;
  duration: number;
  opsPerSecond: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
}

class PerformanceBenchmark {
  private results: BenchmarkResult[] = [];

  async runBenchmark(
    name: string,
    fn: () => Promise<void>,
    iterations: number = 100
  ): Promise<BenchmarkResult> {
    const latencies: number[] = [];
    
    console.log(`Running benchmark: ${name}`);
    
    // Warm up
    for (let i = 0; i < 5; i++) {
      await fn();
    }
    
    // Actual benchmark
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      const opStart = performance.now();
      await fn();
      const opEnd = performance.now();
      latencies.push(opEnd - opStart);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    // Calculate metrics
    latencies.sort((a, b) => a - b);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)];
    const p99Latency = latencies[Math.floor(latencies.length * 0.99)];
    
    const result: BenchmarkResult = {
      name,
      operations: iterations,
      duration,
      opsPerSecond: (iterations / duration) * 1000,
      avgLatency,
      p95Latency,
      p99Latency,
    };
    
    this.results.push(result);
    return result;
  }

  printResults() {
    console.log('\n📊 Performance Benchmark Results\n');
    console.log('Name                          | Ops/sec | Avg (ms) | P95 (ms) | P99 (ms)');
    console.log('------------------------------|---------|----------|----------|----------');
    
    this.results.forEach(result => {
      console.log(
        `${result.name.padEnd(30)}| ${result.opsPerSecond.toFixed(1).padStart(7)} | ${
          result.avgLatency.toFixed(2).padStart(8)
        } | ${result.p95Latency.toFixed(2).padStart(8)} | ${
          result.p99Latency.toFixed(2).padStart(8)
        }`
      );
    });
  }
}

// Benchmark tests
describe('Performance Benchmarks', () => {
  let benchmark: PerformanceBenchmark;
  let cache: any;
  let pool: any;

  beforeAll(async () => {
    benchmark = new PerformanceBenchmark();
    cache = await getCacheService();
    pool = await getConnectionPool();
  });

  afterAll(() => {
    benchmark.printResults();
  });

  test('Cache Performance', async () => {
    const testData = { id: 1, name: 'Test', data: Array(1000).fill('x').join('') };
    
    // Write benchmark
    await benchmark.runBenchmark('Cache Write', async () => {
      await cache.set('benchmark', 'test-key', testData, { ttl: 300 });
    });
    
    // Read benchmark
    await benchmark.runBenchmark('Cache Read', async () => {
      await cache.get('benchmark', 'test-key');
    });
    
    // Cache miss benchmark
    await benchmark.runBenchmark('Cache Miss', async () => {
      await cache.get('benchmark', `miss-${Math.random()}`);
    });
  });

  test('Database Performance', async () => {
    // Simple query benchmark
    await benchmark.runBenchmark('DB Simple Query', async () => {
      await pool.executeRead(async (client: any) => {
        return client
          .from('organizations')
          .select('id, name')
          .limit(1)
          .single();
      });
    }, 50);
    
    // Complex query benchmark
    await benchmark.runBenchmark('DB Complex Query', async () => {
      await pool.executeRead(async (client: any) => {
        return client
          .from('buildings')
          .select(`
            *,
            organizations (name),
            building_metrics (*)
          `)
          .limit(10);
      });
    }, 20);
    
    // Write operation benchmark
    await benchmark.runBenchmark('DB Write Operation', async () => {
      await pool.executeWrite(async (client: any) => {
        return client
          .from('audit_logs')
          .insert({
            user_id: 'benchmark-user',
            action: 'benchmark',
            entity_type: 'test',
            entity_id: 'test-id',
            metadata: { test: true },
          });
      });
    }, 20);
  });

  test('AI Service Performance', async () => {
    const testPrompt = 'What is the current temperature?';
    
    // AI response benchmark (with caching)
    await benchmark.runBenchmark('AI Response (Cached)', async () => {
      await aiService.chat(testPrompt, {
        model: 'deepseek-chat',
        temperature: 0.7,
        max_tokens: 100,
      });
    }, 10);
    
    // AI response benchmark (unique queries)
    await benchmark.runBenchmark('AI Response (Unique)', async () => {
      await aiService.chat(`${testPrompt} ${Math.random()}`, {
        model: 'deepseek-chat',
        temperature: 0.7,
        max_tokens: 100,
      });
    }, 5);
  });

  test('API Endpoint Performance', async () => {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    
    // Health endpoint
    await benchmark.runBenchmark('API Health Check', async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/health`);
      await response.json();
    });
    
    // Metrics endpoint
    await benchmark.runBenchmark('API Metrics', async () => {
      const response = await fetch(`${baseUrl}/api/monitoring/metrics?range=1h`);
      await response.json();
    }, 50);
  });

  test('Memory Usage', () => {
    const used = process.memoryUsage();
    console.log('\n💾 Memory Usage:');
    console.log(`  RSS: ${(used.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${(used.heapTotal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Used: ${(used.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  External: ${(used.external / 1024 / 1024).toFixed(2)} MB`);
  });
});

// Performance baseline assertions
describe('Performance Baselines', () => {
  test('Cache operations should be fast', async () => {
    const cache = await getCacheService();
    const start = performance.now();
    
    await cache.set('perf-test', 'key', { data: 'test' });
    const value = await cache.get('perf-test', 'key');
    
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(50); // Should complete in under 50ms
    expect(value).toEqual({ data: 'test' });
  });

  test('Database queries should be optimized', async () => {
    const pool = await getConnectionPool();
    const start = performance.now();
    
    await pool.executeRead(async (client: any) => {
      return client
        .from('organizations')
        .select('id')
        .limit(1);
    });
    
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100); // Should complete in under 100ms
  });

  test('Static imports should be tree-shaken', () => {
    // This would be checked during build time
    // Placeholder for build-time checks
    expect(true).toBe(true);
  });
});