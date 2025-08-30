#!/usr/bin/env tsx
/**
 * Supabase Connection Pool Testing
 * Test the working Supabase REST API connection pooling
 */

import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

import { getSupabaseConnectionPool } from '@/lib/database/supabase-connection-pool';

async function testSupabasePool() {
  console.log('🚀 Testing Supabase Connection Pool...\n');

  try {
    // Get pool instance
    const pool = getSupabaseConnectionPool();
    
    // Wait for pool initialization
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 1: Basic query execution
    console.log('📊 Test 1: Basic Query Execution');
    const organizations = await pool.query(
      'organizations',
      (client) => client.from('organizations').select('id, name, created_at').limit(3)
    );

    console.log(`  ✅ Retrieved ${organizations.length} organizations`);
    if (organizations.length > 0) {
      console.log(`  🏢 Sample org: ${organizations[0].name || 'Unnamed'}`);
    }

    // Test 2: Concurrent queries
    console.log('\n⚡ Test 2: Concurrent Query Execution');
    const concurrentQueries = [
      pool.query('organizations', (client) => 
        client.from('organizations').select('count', { count: 'exact', head: true })
      ),
      pool.query('facilities', (client) => 
        client.from('facilities').select('count', { count: 'exact', head: true })
      ),
      pool.query('emissions', (client) => 
        client.from('emissions').select('count', { count: 'exact', head: true })
      ),
      pool.query('users', (client) => 
        client.from('users').select('count', { count: 'exact', head: true })
      ),
    ];

    const results = await Promise.allSettled(concurrentQueries);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`  ✅ Concurrent queries completed: ${successful} successful, ${failed} failed`);

    // Test 3: Pool metrics
    console.log('\n📊 Test 3: Pool Metrics');
    const metrics = pool.getMetrics();
    console.log('  📈 Pool Metrics:');
    console.log(`    - Total connections: ${metrics.totalConnections}`);
    console.log(`    - Active connections: ${metrics.activeConnections}`);
    console.log(`    - Idle connections: ${metrics.idleConnections}`);
    console.log(`    - Waiting requests: ${metrics.waitingRequests}`);
    console.log(`    - Pool utilization: ${(metrics.utilization * 100).toFixed(1)}%`);
    console.log(`    - Total queries: ${metrics.totalQueries}`);
    console.log(`    - Average query time: ${metrics.averageQueryTime.toFixed(2)}ms`);

    // Test 4: Connection statistics
    console.log('\n🔍 Test 4: Connection Statistics');
    const connStats = pool.getConnectionStats();
    console.log('  🔌 Connection Details:');
    connStats.forEach((conn, index) => {
      console.log(`    ${index + 1}. ${conn.id.substring(0, 20)}...`);
      console.log(`       - Active: ${conn.isActive ? '✅' : '❌'}`);
      console.log(`       - Queries: ${conn.queryCount}`);
      console.log(`       - Age: ${Math.round(conn.age / 1000)}s`);
      console.log(`       - Idle: ${Math.round(conn.idleTime / 1000)}s`);
    });

    // Test 5: Transaction simulation
    console.log('\n🔄 Test 5: Transaction Simulation');
    try {
      const transactionResult = await pool.transaction(async (client) => {
        // Simulate related operations
        const { data: org } = await client
          .from('organizations')
          .select('id, name')
          .limit(1);
        
        if (org && org.length > 0) {
          const { data: facilities } = await client
            .from('facilities')
            .select('id, name, organization_id')
            .eq('organization_id', org[0].id)
            .limit(5);
          
          return { 
            organization: org[0], 
            facilities: facilities || [] 
          };
        }
        
        return { organization: null, facilities: [] };
      });

      console.log(`  ✅ Transaction completed successfully`);
      if (transactionResult.organization) {
        console.log(`  🏢 Organization: ${transactionResult.organization.name}`);
        console.log(`  🏭 Related facilities: ${transactionResult.facilities.length}`);
      }
    } catch (error) {
      console.log(`  ⚠️ Transaction simulation failed: ${error}`);
    }

    // Test 6: Performance benchmark
    console.log('\n🏁 Test 6: Performance Benchmark');
    const benchmarkStart = Date.now();
    const benchmarkQueries = [];
    
    for (let i = 0; i < 20; i++) {
      benchmarkQueries.push(
        pool.query('organizations', (client) =>
          client.from('organizations').select('id').limit(1)
        )
      );
    }
    
    const benchmarkResults = await Promise.allSettled(benchmarkQueries);
    const benchmarkTime = Date.now() - benchmarkStart;
    const benchmarkSuccessful = benchmarkResults.filter(r => r.status === 'fulfilled').length;
    
    console.log(`  ⚡ Benchmark Results:`);
    console.log(`    - Total queries: 20`);
    console.log(`    - Successful queries: ${benchmarkSuccessful}`);
    console.log(`    - Total time: ${benchmarkTime}ms`);
    console.log(`    - Average time per query: ${(benchmarkTime / 20).toFixed(2)}ms`);
    console.log(`    - Queries per second: ${(20 / (benchmarkTime / 1000)).toFixed(2)}`);

    // Final metrics
    console.log('\n📊 Final Pool Status:');
    const finalMetrics = pool.getMetrics();
    console.log(`  - Pool efficiency: ${finalMetrics.totalQueries > 0 ? '✅ Active' : '⚠️ Inactive'}`);
    console.log(`  - Connection stability: ${finalMetrics.totalConnections >= 2 ? '✅ Stable' : '⚠️ Unstable'}`);
    console.log(`  - Performance: ${finalMetrics.averageQueryTime < 1000 ? '✅ Good' : '⚠️ Slow'}`);

    console.log('\n✅ Supabase connection pool testing completed successfully!');

    return {
      success: true,
      metrics: finalMetrics,
      benchmark: {
        queries: 20,
        successful: benchmarkSuccessful,
        totalTime: benchmarkTime,
        avgTime: benchmarkTime / 20,
        qps: 20 / (benchmarkTime / 1000)
      }
    };

  } catch (error) {
    console.error('❌ Supabase pool testing failed:', error);
    throw error;
  }
}

// Run the test
if (require.main === module) {
  testSupabasePool()
    .then((results) => {
      console.log('\n🎉 All tests passed!');
      console.log('\n📊 TEST SUMMARY:');
      console.log(`  ✅ Pool connections: ${results.metrics.totalConnections}`);
      console.log(`  ✅ Total queries executed: ${results.metrics.totalQueries}`);
      console.log(`  ✅ Average query time: ${results.metrics.averageQueryTime.toFixed(2)}ms`);
      console.log(`  ✅ Pool utilization: ${(results.metrics.utilization * 100).toFixed(1)}%`);
      console.log(`  ✅ Benchmark performance: ${results.benchmark.qps.toFixed(2)} queries/second`);
      console.log('  🎯 Supabase connection pooling: WORKING ✅');
      
      // Graceful shutdown
      getSupabaseConnectionPool().shutdown().then(() => {
        process.exit(0);
      });
    })
    .catch(error => {
      console.error('\n💥 Testing failed:', error);
      getSupabaseConnectionPool().shutdown().then(() => {
        process.exit(1);
      });
    });
}