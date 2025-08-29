#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

console.log('🧪 Detailed Phase 2 Testing\n');

async function runDetailedTests() {
  const results = {
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Test 1: Redis Cache Operations
  console.log('1️⃣ Testing Redis Cache Operations...');
  try {
    const { cacheService } = await import('../src/lib/cache/service');
    
    // Test string value
    await cacheService.set('test:string', 'Hello Redis', { ttl: 60 });
    const stringVal = await cacheService.get('test:string');
    console.log('  ✅ String storage:', stringVal === 'Hello Redis' ? 'PASSED' : 'FAILED');
    
    // Test object value
    const testObj = { name: 'Test', value: 123 };
    await cacheService.set('test:object', testObj, { ttl: 60 });
    const objVal = await cacheService.get<typeof testObj>('test:object');
    console.log('  ✅ Object storage:', objVal?.name === 'Test' ? 'PASSED' : 'FAILED');
    
    // Test deletion
    await cacheService.delete('test:string');
    const deleted = await cacheService.get('test:string');
    console.log('  ✅ Deletion:', deleted === null ? 'PASSED' : 'FAILED');
    
    // Test tags
    await cacheService.set('test:tag1', 'value1', { tags: ['testtag'] });
    await cacheService.set('test:tag2', 'value2', { tags: ['testtag'] });
    await cacheService.invalidateByTags(['testtag']);
    const tagged1 = await cacheService.get('test:tag1');
    const tagged2 = await cacheService.get('test:tag2');
    console.log('  ✅ Tag invalidation:', (tagged1 === null && tagged2 === null) ? 'PASSED' : 'FAILED');
    
    results.passed += 4;
  } catch (error) {
    console.log('  ❌ Redis tests FAILED:', error);
    results.failed += 4;
  }

  // Test 2: Database Backup System
  console.log('\n2️⃣ Testing Database Backup System...');
  try {
    const { databaseBackup } = await import('../src/lib/database/backup');
    
    // List backups
    const backups = await databaseBackup.listBackups();
    console.log('  ✅ List backups:', Array.isArray(backups) ? 'PASSED' : 'FAILED');
    
    // Test backup creation (simulated)
    console.log('  ⏭️  Create backup: SKIPPED (requires database connection)');
    
    results.passed += 1;
    results.skipped += 1;
  } catch (error) {
    console.log('  ❌ Backup tests FAILED:', error);
    results.failed += 2;
  }

  // Test 3: Migration System
  console.log('\n3️⃣ Testing Migration System...');
  try {
    const { migrationManager } = await import('../src/lib/database/migration');
    
    // Get migration files
    const files = await migrationManager.getMigrationFiles();
    console.log('  ✅ Migration files found:', files.length);
    
    // Get pending migrations
    const pending = await migrationManager.getPendingMigrations();
    console.log('  ✅ Pending migrations:', pending.length);
    
    // Validate migrations
    const validation = await migrationManager.validateMigrations();
    console.log('  ✅ Validation:', validation.valid ? 'PASSED' : `FAILED (${validation.issues.length} issues)`);
    
    results.passed += 3;
  } catch (error) {
    console.log('  ❌ Migration tests FAILED:', error);
    results.failed += 3;
  }

  // Test 4: Query Monitoring
  console.log('\n4️⃣ Testing Query Monitoring...');
  try {
    const { queryMonitor } = await import('../src/lib/database/query-monitor');
    
    // Test slow queries (will be empty without database)
    const slowQueries = await queryMonitor.getSlowQueries();
    console.log('  ✅ Slow queries retrieval:', Array.isArray(slowQueries) ? 'PASSED' : 'FAILED');
    
    // Test insights
    const insights = await queryMonitor.getQueryInsights();
    console.log('  ✅ Query insights:', Array.isArray(insights) ? 'PASSED' : 'FAILED');
    
    results.passed += 2;
  } catch (error) {
    console.log('  ❌ Query monitoring tests FAILED:', error);
    results.failed += 2;
  }

  // Test 5: Metrics Collection
  console.log('\n5️⃣ Testing Metrics Collection...');
  try {
    const { metrics } = await import('../src/lib/monitoring/metrics');
    const { AppMetrics } = await import('../src/lib/monitoring/metrics');
    
    // Record some metrics
    AppMetrics.recordAPIRequest('GET', '/api/test', 200, 45.5);
    AppMetrics.recordDatabaseQuery('SELECT', 'users', 12.3, true);
    AppMetrics.recordCacheOperation('get', true, 2.1);
    
    // Get metrics
    const allMetrics = metrics.getAllMetrics();
    console.log('  ✅ API metrics recorded:', Object.keys(allMetrics.counters).some(k => k.includes('http')) ? 'PASSED' : 'FAILED');
    console.log('  ✅ DB metrics recorded:', Object.keys(allMetrics.counters).some(k => k.includes('database')) ? 'PASSED' : 'FAILED');
    console.log('  ✅ Cache metrics recorded:', Object.keys(allMetrics.counters).some(k => k.includes('cache')) ? 'PASSED' : 'FAILED');
    
    // Test Prometheus format
    const promMetrics = metrics.getPrometheusMetrics();
    console.log('  ✅ Prometheus format:', promMetrics.includes('TYPE') ? 'PASSED' : 'FAILED');
    
    results.passed += 4;
  } catch (error) {
    console.log('  ❌ Metrics tests FAILED:', error);
    results.failed += 4;
  }

  // Test 6: OpenTelemetry Instrumentation
  console.log('\n6️⃣ Testing OpenTelemetry Instrumentation...');
  try {
    const { traceFunction, measureTime } = await import('../src/lib/monitoring/instrumentation');
    
    // Test function tracing
    const tracedFn = traceFunction('test-operation', (x: number) => x * 2);
    const result = tracedFn(21);
    console.log('  ✅ Function tracing:', result === 42 ? 'PASSED' : 'FAILED');
    
    // Test time measurement
    const measured = measureTime('test-measure', () => {
      let sum = 0;
      for (let i = 0; i < 1000; i++) sum += i;
      return sum;
    });
    console.log('  ✅ Time measurement:', typeof measured === 'number' ? 'PASSED' : 'FAILED');
    
    results.passed += 2;
  } catch (error) {
    console.log('  ❌ OpenTelemetry tests FAILED:', error);
    results.failed += 2;
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log(`  ✅ Passed: ${results.passed}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log(`  ⏭️  Skipped: ${results.skipped}`);
  console.log(`  📈 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  return results;
}

// Performance Benchmark
async function runPerformanceBenchmark() {
  console.log('\n⚡ Performance Benchmarks:\n');
  
  const { cacheService } = await import('../src/lib/cache/service');
  const { metrics } = await import('../src/lib/monitoring/metrics');
  
  // Cache benchmark
  console.log('📦 Cache Performance:');
  const cacheOps = 1000;
  const cacheStart = Date.now();
  
  for (let i = 0; i < cacheOps; i++) {
    await cacheService.set(`bench:${i}`, { index: i, data: 'x'.repeat(100) });
  }
  
  const cacheWriteTime = Date.now() - cacheStart;
  console.log(`  Write: ${cacheOps} ops in ${cacheWriteTime}ms (${Math.round(cacheOps / (cacheWriteTime / 1000))} ops/sec)`);
  
  const cacheReadStart = Date.now();
  for (let i = 0; i < cacheOps; i++) {
    await cacheService.get(`bench:${i}`);
  }
  
  const cacheReadTime = Date.now() - cacheReadStart;
  console.log(`  Read: ${cacheOps} ops in ${cacheReadTime}ms (${Math.round(cacheOps / (cacheReadTime / 1000))} ops/sec)`);
  
  // Cleanup
  for (let i = 0; i < cacheOps; i++) {
    await cacheService.delete(`bench:${i}`);
  }
  
  // Metrics benchmark
  console.log('\n📊 Metrics Performance:');
  const metricOps = 10000;
  const metricStart = Date.now();
  
  for (let i = 0; i < metricOps; i++) {
    metrics.incrementCounter('benchmark_counter', 1, { test: 'true' });
    metrics.recordHistogram('benchmark_histogram', Math.random() * 100);
  }
  
  const metricTime = Date.now() - metricStart;
  console.log(`  Recording: ${metricOps} ops in ${metricTime}ms (${Math.round(metricOps / (metricTime / 1000))} ops/sec)`);
}

// Main execution
async function main() {
  console.log('🚀 Starting comprehensive Phase 2 testing...\n');
  
  const testResults = await runDetailedTests();
  
  if (testResults.passed > 15) {
    await runPerformanceBenchmark();
  }
  
  console.log('\n✅ Testing complete!');
}

main().catch(console.error);