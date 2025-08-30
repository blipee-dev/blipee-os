import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  cache, 
  aiCache, 
  dbCache, 
  apiCache, 
  redisClient 
} from '@/lib/cache';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!member || !['account_owner', 'sustainability_manager'].includes(member.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get cache statistics
    const cacheStats = cache.getStats();
    const aiStats = await aiCache.getStats();
    
    // Check Redis connection
    const isConnected = redisClient.isReady();
    let redisInfo = null;
    
    if (isConnected) {
      try {
        const client = await redisClient.getClient();
        const info = await client.info('stats');
        const memory = await client.info('memory');
        
        // Parse Redis info
        const parseInfo = (info: string) => {
          const lines = info.split('\r\n');
          const result: Record<string, string> = {};
          lines.forEach(line => {
            if (line && !line.startsWith('#')) {
              const [key, value] = line.split(':');
              if (key && value) result[key] = value;
            }
          });
          return result;
        };
        
        const statsInfo = parseInfo(info);
        const memoryInfo = parseInfo(memory);
        
        redisInfo = {
          connected: true,
          totalConnectionsReceived: parseInt(statsInfo['total_connections_received'] || '0'),
          totalCommandsProcessed: parseInt(statsInfo['total_commands_processed'] || '0'),
          instantaneousOpsPerSec: parseInt(statsInfo['instantaneous_ops_per_sec'] || '0'),
          usedMemoryHuman: memoryInfo['used_memory_human'] || 'N/A',
          usedMemoryPeak: memoryInfo['used_memory_peak_human'] || 'N/A',
          memoryFragmentationRatio: parseFloat(memoryInfo['mem_fragmentation_ratio'] || '1'),
        };
      } catch (error) {
        console.error('Error getting Redis info:', error);
      }
    }

    const response = {
      status: isConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      cache: {
        enabled: isConnected,
        stats: cacheStats,
        hitRate: `${(cacheStats.hitRate * 100).toFixed(2)}%`,
        avgResponseTime: `${cacheStats.avgResponseTime.toFixed(2)}ms`,
      },
      ai: {
        totalResponses: aiStats.totalResponses,
        cacheHitRate: `${(aiStats.cacheHitRate * 100).toFixed(2)}%`,
        avgResponseTime: `${aiStats.avgResponseTime.toFixed(2)}ms`,
      },
      redis: redisInfo || { connected: false },
      recommendations: getRecommendations(cacheStats, isConnected),
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to get cache status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin role
    const { data: member } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!member || member.role !== 'account_owner') {
      return NextResponse.json({ error: 'Only account owners can manage cache' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    let result;

    switch (action) {
      case 'clear-all':
        result = await cache.clear();
        break;
        
      case 'clear-ai':
        result = await cache.invalidateByTags(['ai-response', 'ai-context']);
        break;
        
      case 'clear-db':
        result = await dbCache.clearAll();
        break;
        
      case 'clear-api':
        result = await apiCache.clearAll();
        break;
        
      case 'reset-stats':
        cache.resetStats();
        result = true;
        break;
        
      case 'warm-up':
        await cache.warmUp();
        result = true;
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to perform cache operation' },
      { status: 500 }
    );
  }
}

function getRecommendations(stats: any, isConnected: boolean): string[] {
  const recommendations: string[] = [];

  if (!isConnected) {
    recommendations.push('Redis is not connected. Cache is disabled, which will impact performance.');
  }

  if (stats.hitRate < 0.5) {
    recommendations.push('Low cache hit rate. Consider adjusting TTL values or warming up cache.');
  }

  if (stats.avgResponseTime > 100) {
    recommendations.push('High average response time. Consider optimizing cache keys or using compression.');
  }

  if (stats.errors > 100) {
    recommendations.push('High error count. Check Redis connection and configuration.');
  }

  if (recommendations.length === 0) {
    recommendations.push('Cache is performing well. No issues detected.');
  }

  return recommendations;
}