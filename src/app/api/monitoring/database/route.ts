import { NextRequest, NextResponse } from 'next/server';
import { checkPoolHealth } from '@/lib/database/connection-pool';
import { dbMonitor } from '@/lib/database/monitoring';
import { getConnectionPoolStats } from '@/lib/supabase/server-pooled';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    // Get connection pool health
    const poolHealth = await checkPoolHealth();
    
    // Get performance metrics
    const performanceMetrics = dbMonitor.getPerformanceMetrics();
    
    // Get slow queries
    const slowQueries = dbMonitor.getSlowQueries(5);
    
    // Get query statistics
    const queryStats = Array.from(dbMonitor.getQueryStatistics().entries())
      .map(([pattern, stats]) => ({ pattern, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Get PgBouncer stats if available
    const pgBouncerStats = await getConnectionPoolStats();
    
    // Test database connectivity
    let databaseConnectivity = { healthy: false, latency: 0 };
    try {
      const start = Date.now();
      const supabase = await createServerSupabaseClient();
      await supabase.from('organizations').select('id').limit(1);
      databaseConnectivity = {
        healthy: true,
        latency: Date.now() - start,
      };
    } catch (error) {
      databaseConnectivity = {
        healthy: false,
        latency: 0,
      };
    }
    
    // Compile health report
    const healthReport = {
      status: poolHealth.healthy && databaseConnectivity.healthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      
      connectionPool: {
        ...poolHealth,
        utilization: poolHealth.maxClients > 0 
          ? ((poolHealth.totalClients - poolHealth.idleClients) / poolHealth.maxClients) * 100
          : 0,
      },
      
      pgBouncer: pgBouncerStats,
      
      database: {
        ...databaseConnectivity,
        responseTimeMs: databaseConnectivity.latency,
      },
      
      performance: {
        ...performanceMetrics,
        averageQueryTimeMs: performanceMetrics.averageQueryTime,
        errorRatePercent: performanceMetrics.errorRate * 100,
        connectionUtilizationPercent: performanceMetrics.connectionUtilization * 100,
      },
      
      slowQueries: slowQueries.map(q => ({
        query: q.query.substring(0, 100) + (q.query.length > 100 ? '...' : ''),
        durationMs: q.duration,
        timestamp: q.timestamp,
      })),
      
      topQueries: queryStats.slice(0, 5),
      
      recommendations: generateRecommendations(
        poolHealth,
        performanceMetrics,
        pgBouncerStats
      ),
    };
    
    const statusCode = healthReport.status === 'healthy' ? 200 : 503;
    
    return NextResponse.json(healthReport, { status: statusCode });
    
  } catch (error) {
    console.error('Database monitoring error:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

// Generate recommendations based on metrics
function generateRecommendations(
  poolHealth: any,
  performanceMetrics: any,
  pgBouncerStats: any
): string[] {
  const recommendations: string[] = [];
  
  // Connection pool recommendations
  if (poolHealth.waitingClients > 0) {
    recommendations.push(
      `High connection demand detected. Consider increasing DB_POOL_MAX from ${poolHealth.maxClients}.`
    );
  }
  
  if (performanceMetrics.connectionUtilization > 0.8) {
    recommendations.push(
      'Connection pool utilization is high. Monitor for connection leaks.'
    );
  }
  
  // Query performance recommendations
  if (performanceMetrics.averageQueryTime > 50) {
    recommendations.push(
      'Average query time is high. Review slow queries and add appropriate indexes.'
    );
  }
  
  if (performanceMetrics.errorRate > 0.01) {
    recommendations.push(
      'Query error rate exceeds 1%. Investigate failing queries.'
    );
  }
  
  // PgBouncer recommendations
  if (!pgBouncerStats.enabled) {
    recommendations.push(
      'PgBouncer is not enabled. Consider enabling it for better connection management.'
    );
  }
  
  if (performanceMetrics.slowQueries > 10) {
    recommendations.push(
      `${performanceMetrics.slowQueries} slow queries detected. Run query analysis to identify optimization opportunities.`
    );
  }
  
  return recommendations;
}