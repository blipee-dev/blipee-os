import { NextRequest, NextResponse } from 'next/server';
import { getRateLimitStats, getIdentifier } from '@/lib/performance/rate-limiter';
import { getRedisClient } from '@/lib/cache/redis-client';

export async function GET(request: NextRequest) {
  try {
    const redis = getRedisClient();
    const identifier = getIdentifier(request);

    // Get current rate limit status for different endpoints
    const stats = await Promise.allSettled([
      getRateLimitStats(identifier, 'api_normal'),
      getRateLimitStats(identifier, 'api_strict'),
      getRateLimitStats(identifier, 'auth'),
      getRateLimitStats(identifier, 'ai'),
      getRateLimitStats(identifier, 'analytics')
    ]);

    // Get global rate limit metrics from Redis
    let globalMetrics = null;
    if (redis.isReady()) {
      try {
        globalMetrics = await redis.execute(async (client) => {
          const keys = await client.keys('rate_limit:*');
          const blocked = await client.keys('rate_limit:*:blocked');

          // Get some sample rate limit data
          const samples = await Promise.all(
            keys.slice(0, 10).map(async (key) => {
              const value = await client.get(key);
              return { key, value: parseInt(value || '0') };
            })
          );

          return {
            totalKeys: keys.length,
            blockedCount: blocked.length,
            samples: samples.filter(s => s.value > 0)
          };
        });
      } catch (error) {
        console.warn('Failed to get Redis metrics:', error);
      }
    }

    // Calculate health metrics
    const healthMetrics = {
      rateLimitingActive: redis.isReady(),
      currentIdentifier: identifier,
      endpointStats: {
        api_normal: stats[0].status === 'fulfilled' ? stats[0].value : null,
        api_strict: stats[1].status === 'fulfilled' ? stats[1].value : null,
        auth: stats[2].status === 'fulfilled' ? stats[2].value : null,
        ai: stats[3].status === 'fulfilled' ? stats[3].value : null,
        analytics: stats[4].status === 'fulfilled' ? stats[4].value : null
      },
      globalMetrics,
      recommendations: generateRateLimitRecommendations(globalMetrics, stats)
    };

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      rateLimiting: healthMetrics
    });

  } catch (error) {
    console.error('Rate limit monitoring error:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      rateLimiting: null
    }, { status: 500 });
  }
}

function generateRateLimitRecommendations(
  globalMetrics: any,
  stats: PromiseSettledResult<any>[]
): string[] {
  const recommendations: string[] = [];

  // Check if Redis is available
  if (!globalMetrics) {
    recommendations.push('Redis is not available. Rate limiting is using fallback in-memory storage which is not suitable for production.');
  }

  // Check for high blocking rates
  if (globalMetrics && globalMetrics.blockedCount > globalMetrics.totalKeys * 0.1) {
    recommendations.push(`High blocking rate detected: ${globalMetrics.blockedCount} blocked out of ${globalMetrics.totalKeys} total keys. Consider adjusting rate limits.`);
  }

  // Check individual endpoint stats
  const failedStats = stats.filter(s => s.status === 'rejected').length;
  if (failedStats > 0) {
    recommendations.push(`${failedStats} endpoint statistics failed to load. Check rate limiting system health.`);
  }

  // Check for suspicious patterns
  if (globalMetrics && globalMetrics.samples) {
    const highTrafficSamples = globalMetrics.samples.filter((s: any) => s.value > 50);
    if (highTrafficSamples.length > 0) {
      recommendations.push(`${highTrafficSamples.length} high-traffic patterns detected. Monitor for potential abuse.`);
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Rate limiting system is operating normally.');
  }

  return recommendations;
}