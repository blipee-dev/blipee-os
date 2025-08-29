import { NextRequest, NextResponse } from 'next/server';
import { readReplicaManager } from '@/lib/database/read-replica';
import { queryRouter } from '@/lib/database/query-router';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(_request: NextRequest) {
  try {
    // Get read replica statistics
    const replicaStats = readReplicaManager.getStatistics();
    
    // Test query performance on primary vs replicas
    const testQuery = 'SELECT COUNT(*) as count FROM organizations';
    let primaryLatency = 0;
    let replicaLatencies: Record<string, number> = {};
    
    // Test primary
    try {
      const start = Date.now();
      const supabase = await createServerSupabaseClient();
      await supabase.from('organizations').select('id', { count: 'exact', head: true });
      primaryLatency = Date.now() - start;
    } catch (error) {
      console.error('Primary test query failed:', error);
    }
    
    // Test each replica
    for (const replica of replicaStats.replicas) {
      if (replica.healthy) {
        try {
          const start = Date.now();
          await queryRouter.execute(testQuery, [], {
            forceReplica: true,
            preferredRegion: replica.region,
          });
          replicaLatencies[replica.region || replica.url] = Date.now() - start;
        } catch (error) {
          console.error(`Replica test query failed (${replica.region}):`, error);
        }
      }
    }
    
    // Calculate health score
    const healthScore = calculateHealthScore(replicaStats);
    
    // Generate recommendations
    const recommendations = generateRecommendations(replicaStats, primaryLatency, replicaLatencies);
    
    const report = {
      status: replicaStats.healthy > 0 ? 'operational' : 'degraded',
      timestamp: new Date().toISOString(),
      
      summary: {
        totalReplicas: replicaStats.total,
        healthyReplicas: replicaStats.healthy,
        unhealthyReplicas: replicaStats.unhealthy,
        healthScore: `${Math.round(healthScore * 100)}%`,
      },
      
      replicas: replicaStats.replicas.map(replica => ({
        region: replica.region || 'unknown',
        status: replica.healthy ? 'healthy' : 'unhealthy',
        metrics: {
          requestCount: replica.requestCount,
          errorCount: replica.errorCount,
          errorRate: replica.requestCount > 0 
            ? `${Math.round((replica.errorCount / replica.requestCount) * 100)}%` 
            : '0%',
          averageLatencyMs: replica.averageLatencyMs,
          lastHealthCheck: replica.lastHealthCheck,
        },
        testLatencyMs: replicaLatencies[replica.region || replica.url] || null,
      })),
      
      performance: {
        primaryLatencyMs: primaryLatency,
        replicaLatencies: replicaLatencies,
        latencyImprovement: calculateLatencyImprovement(primaryLatency, replicaLatencies),
      },
      
      loadDistribution: calculateLoadDistribution(replicaStats.replicas),
      
      recommendations,
      
      configuration: {
        enabled: replicaStats.total > 0,
        regions: [...new Set(replicaStats.replicas.map(r => r.region).filter(Boolean))],
        totalCapacity: replicaStats.replicas.reduce((sum, r) => sum + (r.healthy ? 1 : 0), 0),
      },
    };
    
    const statusCode = replicaStats.healthy === 0 && replicaStats.total > 0 ? 503 : 200;
    
    return NextResponse.json(report, { status: statusCode });
    
  } catch (error) {
    console.error('Read replica monitoring _error:', error);
    return NextResponse.json(
      {
        status: 'error',
        _error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

function calculateHealthScore(stats: any): number {
  if (stats.total === 0) return 0;
  
  const healthyRatio = stats.healthy / stats.total;
  const errorRates = stats.replicas.map((r: any) => 
    r.requestCount > 0 ? r.errorCount / r.requestCount : 0
  );
  const avgErrorRate = errorRates.reduce((a: number, b: number) => a + b, 0) / errorRates.length;
  
  // Health score based on availability and error rate
  const availabilityScore = healthyRatio * 0.7;
  const reliabilityScore = (1 - avgErrorRate) * 0.3;
  
  return availabilityScore + reliabilityScore;
}

function calculateLatencyImprovement(
  primaryLatency: number, 
  replicaLatencies: Record<string, number>
): string {
  const replicaLatencyValues = Object.values(replicaLatencies);
  if (replicaLatencyValues.length === 0 || primaryLatency === 0) {
    return '0%';
  }
  
  const avgReplicaLatency = replicaLatencyValues.reduce((a, b) => a + b, 0) / replicaLatencyValues.length;
  const improvement = ((primaryLatency - avgReplicaLatency) / primaryLatency) * 100;
  
  return `${Math.round(improvement)}%`;
}

function calculateLoadDistribution(replicas: any[]): {
  distribution: 'even' | 'uneven' | 'skewed';
  variance: number;
  details: Array<{ region: string; load: string }>;
} {
  if (replicas.length === 0) {
    return { distribution: 'even', variance: 0, details: [] };
  }
  
  const totalRequests = replicas.reduce((sum, r) => sum + r.requestCount, 0);
  const avgRequests = totalRequests / replicas.length;
  
  const variance = replicas.reduce((sum, r) => {
    return sum + Math.pow(r.requestCount - avgRequests, 2);
  }, 0) / replicas.length;
  
  const distribution = variance < avgRequests * 0.1 ? 'even' :
                      variance < avgRequests * 0.5 ? 'uneven' : 'skewed';
  
  const details = replicas.map(r => ({
    region: r.region || 'unknown',
    load: totalRequests > 0 ? `${Math.round((r.requestCount / totalRequests) * 100)}%` : '0%',
  }));
  
  return { distribution, variance: Math.round(variance), details };
}

function generateRecommendations(
  stats: any,
  primaryLatency: number,
  replicaLatencies: Record<string, number>
): string[] {
  const recommendations: string[] = [];
  
  // No replicas configured
  if (stats.total === 0) {
    recommendations.push(
      'No read replicas configured. Add SUPABASE_READ_REPLICA_URLS to enable read scaling.'
    );
    return recommendations;
  }
  
  // All replicas unhealthy
  if (stats.healthy === 0) {
    recommendations.push(
      'All read replicas are unhealthy. Check network connectivity and database credentials.'
    );
  }
  
  // High error rates
  const highErrorReplicas = stats.replicas.filter((r: any) => 
    r.requestCount > 10 && r.errorCount / r.requestCount > 0.05
  );
  
  if (highErrorReplicas.length > 0) {
    recommendations.push(
      `${highErrorReplicas.length} replica(s) have error rates above 5%. Consider investigating connection issues.`
    );
  }
  
  // Uneven load distribution
  const loadDist = calculateLoadDistribution(stats.replicas);
  if (loadDist.distribution === 'skewed') {
    recommendations.push(
      'Load distribution is heavily skewed. Consider adjusting replica weights or load balancing strategy.'
    );
  }
  
  // Latency not improved
  const replicaLatencyValues = Object.values(replicaLatencies);
  if (replicaLatencyValues.length > 0) {
    const avgReplicaLatency = replicaLatencyValues.reduce((a, b) => a + b, 0) / replicaLatencyValues.length;
    if (avgReplicaLatency >= primaryLatency) {
      recommendations.push(
        'Read replicas are not providing latency improvement. Consider replica placement or network optimization.'
      );
    }
  }
  
  // Regional coverage
  const regions = new Set(stats.replicas.map((r: any) => r.region).filter(Boolean));
  if (regions.size < 2 && stats.total > 2) {
    recommendations.push(
      'Consider distributing replicas across multiple regions for better geographic coverage.'
    );
  }
  
  // Capacity recommendations
  const healthyCount = stats.healthy;
  if (healthyCount === 1) {
    recommendations.push(
      'Only one healthy replica available. Add more replicas for redundancy.'
    );
  }
  
  return recommendations;
}