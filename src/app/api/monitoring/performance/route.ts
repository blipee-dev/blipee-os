import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth-new';
import { withErrorHandler } from '@/lib/api/error-handler';
import { getPerformanceMonitor } from '@/lib/monitoring/performance';
import { getCacheService } from '@/lib/cache/cache-service';
import { getConnectionPool } from '@/lib/db/connection-pool';
import { getRedisClient } from '@/lib/cache/redis';

export const GET = withAuth(withErrorHandler(async (_request: NextRequest, _userId: string) => {
  const { searchParams } = new URL(request.url);
  const timeRange = searchParams.get('range') || '1h';
  const detailed = searchParams.get('detailed') === 'true';

  // Get performance metrics from various sources
  const [
    performanceStats,
    cacheStats,
    dbPoolStats,
    redisStats,
  ] = await Promise.all([
    getPerformanceMonitor().then(m => m.getPerformanceStats()),
    getCacheService().then(c => c.getCacheStats()),
    getConnectionPool().then(p => p.getStats()),
    getRedisInfo(),
  ]);

  // Calculate additional metrics
  const metrics = {
    timestamp: new Date().toISOString(),
    timeRange,
    
    // Response time metrics
    responseTime: {
      average: performanceStats?.avgResponseTime || 0,
      p95: performanceStats?.p95ResponseTime || 0,
      p99: performanceStats?.p99ResponseTime || 0,
      slowRequests: performanceStats?.slowRequests || 0,
    },
    
    // Request metrics
    requests: {
      total: performanceStats?.totalRequests || 0,
      errorRate: performanceStats?.errorRate || 0,
      rpm: calculateRPM(performanceStats?.totalRequests || 0, timeRange),
    },
    
    // Cache performance
    cache: {
      hitRate: cacheStats?.hitRate || 0,
      hits: cacheStats?.hits || 0,
      misses: cacheStats?.misses || 0,
      memoryUsage: redisStats?.memoryUsage || 0,
      evictions: redisStats?.evictions || 0,
    },
    
    // Database performance
    database: {
      connectionPool: dbPoolStats,
      activeConnections: dbPoolStats?.totalConnections || 0,
      readReplicas: dbPoolStats?.readReplicas || 0,
    },
    
    // System health
    health: {
      status: calculateHealthStatus(performanceStats, cacheStats, dbPoolStats),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    },
  };

  // Add detailed metrics if requested
  if (detailed) {
    (metrics as any).detailed = await getDetailedMetrics();
  }

  return NextResponse.json(metrics);
}));

// Helper functions
async function getRedisInfo() {
  try {
    const redis = await getRedisClient();
    const client = redis.getClient();
    
    if (!client) return null;

    const info = await client.info('memory');
    const stats = await client.info('stats');
    
    // Parse Redis info format
    const memoryUsed = parseInt(info.match(/used_memory:(\d+)/)?.[1] || '0');
    const evictions = parseInt(stats.match(/evicted_keys:(\d+)/)?.[1] || '0');
    
    return {
      memoryUsage: memoryUsed,
      evictions,
    };
  } catch (error) {
    console.error('Error getting Redis info:', error);
    return null;
  }
}

function calculateRPM(totalRequests: number, timeRange: string): number {
  const minutes = {
    '1m': 1,
    '5m': 5,
    '15m': 15,
    '1h': 60,
    '24h': 1440,
  }[timeRange] || 60;
  
  return Math.round(totalRequests / minutes);
}

function calculateHealthStatus(
  performanceStats: any,
  cacheStats: any,
  _dbPoolStats: any
): 'healthy' | 'degraded' | 'critical' {
  const errorRate = performanceStats?.errorRate || 0;
  const avgResponseTime = performanceStats?.avgResponseTime || 0;
  const cacheHitRate = cacheStats?.hitRate || 0;
  
  if (errorRate > 10 || avgResponseTime > 5000) {
    return 'critical';
  }
  
  if (errorRate > 5 || avgResponseTime > 2000 || cacheHitRate < 50) {
    return 'degraded';
  }
  
  return 'healthy';
}

async function getDetailedMetrics() {
  // This would fetch more detailed metrics from various sources
  return {
    topEndpoints: await getTopEndpoints(),
    slowQueries: await getSlowQueries(),
    errorDetails: await getErrorDetails(),
  };
}

async function getTopEndpoints() {
  try {
    const redis = await getRedisClient();
    const pattern = 'metrics:endpoint:*';
    const endpoints = await redis.getPattern(pattern);
    
    // Sort by request count and return top 10
    const sorted = Object.entries(endpoints)
      .sort(([, a]: any, [, b]: any) => b.requests - a.requests)
      .slice(0, 10)
      .map(([endpoint, data]: any) => ({
        endpoint: endpoint.replace('metrics:endpoint:', ''),
        ...data,
      }));
    
    return sorted;
  } catch (error) {
    console.error('Error getting top endpoints:', error);
    return [];
  }
}

async function getSlowQueries() {
  // This would fetch slow query data from the database
  return [];
}

async function getErrorDetails() {
  // This would fetch error details from logs
  return {
    last24h: 0,
    topErrors: [],
  };
}

// POST endpoint to manually trigger performance optimization
export const POST = withAuth(withErrorHandler(async (_request: NextRequest, _userId: string) => {
  const { action } = await request.json();
  
  switch (action) {
    case 'clear_cache':
      const cache = await getCacheService();
      await cache.flush();
      return NextResponse.json({ success: true, message: 'Cache cleared' });
      
    case 'analyze_performance':
      // Trigger performance analysis
      const analysis = await analyzePerformance();
      return NextResponse.json({ success: true, analysis });
      
    case 'optimize_queries':
      // Run query optimization
      const optimization = await optimizeQueries();
      return NextResponse.json({ success: true, optimization });
      
    default:
      return NextResponse.json(
        { _error: 'Invalid action' },
        { status: 400 }
      );
  }
}));

async function analyzePerformance() {
  // This would run various performance analysis tasks
  return {
    recommendations: [
      'Consider adding index on messages.conversation_id',
      'Cache hit rate is below optimal (< 80%)',
      'Database connection pool could be increased',
    ],
    metrics: {
      slowEndpoints: 3,
      cacheableQueries: 12,
      indexOpportunities: 5,
    },
  };
}

async function optimizeQueries() {
  // This would run query optimization tasks
  return {
    optimized: 0,
    message: 'Query optimization requires manual review',
  };
}