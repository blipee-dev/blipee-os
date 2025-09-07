// Database query monitoring utility

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { cache } from '@/lib/cache/service';

interface SlowQuery {
  query_text: string;
  calls: number;
  total_time: number;
  mean_time: number;
  max_time: number;
  rows: number;
  query_type: string;
}

interface QueryInsight {
  insight_type: string;
  description: string;
  impact: string;
  recommendation: string;
  query_example: string;
}

interface QueryPattern {
  pattern_name: string;
  occurrence_count: number;
  avg_execution_time: number;
  total_time: number;
  example_query: string;
}

interface DatabaseHealth {
  metric_name: string;
  metric_value: number;
  unit: string;
  threshold_warning: number;
  threshold_critical: number;
  is_healthy: boolean;
  checked_at: string;
}

export class QueryMonitor {
  private static instance: QueryMonitor;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  private constructor() {}
  
  static getInstance(): QueryMonitor {
    if (!QueryMonitor.instance) {
      QueryMonitor.instance = new QueryMonitor();
    }
    return QueryMonitor.instance;
  }
  
  /**
   * Start automatic query monitoring
   */
  async startMonitoring(intervalMinutes: number = 5): Promise<void> {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }
    
    // Initial check
    await this.performMonitoring();
    
    // Set up interval
    this.monitoringInterval = setInterval(async () => {
      await this.performMonitoring();
    }, intervalMinutes * 60 * 1000);
    
    logger.info(`Query monitoring started with ${intervalMinutes} minute interval`);
  }
  
  /**
   * Stop automatic query monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('Query monitoring stopped');
    }
  }
  
  /**
   * Perform monitoring tasks
   */
  private async performMonitoring(): Promise<void> {
    try {
      const supabase = createClient();
      
      // Monitor slow queries
      const slowQueries = await this.getSlowQueries();
      
      // Log any critical slow queries
      for (const query of slowQueries) {
        if (query.mean_time > 1000) { // Over 1 second
          await this.logSlowQuery(
            query.query_text,
            query.mean_time,
            query.rows
          );
          
          logger.warn('Critical slow query detected', {
            query_type: query.query_type,
            mean_time: query.mean_time,
            calls: query.calls
          });
        }
      }
      
      // Check database health
      await this.checkDatabaseHealth();
      
      // Clear old cache entries
      await cache.invalidateByPattern('query-monitor:*');
      
    } catch (error) {
      logger.error('Error during query monitoring', error);
    }
  }
  
  /**
   * Get slow queries from database
   */
  async getSlowQueries(thresholdMs: number = 100): Promise<SlowQuery[]> {
    const cacheKey = `query-monitor:slow-queries:${thresholdMs}`;
    
    return cache.get(cacheKey, async () => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('monitor_query_performance', { threshold_ms: thresholdMs });
      
      if (error) {
        logger.error('Error getting slow queries', error);
        return [];
      }
      
      return data || [];
    }, {
      tags: ['query-monitor'],
      ttl: 300 // 5 minutes
    });
  }
  
  /**
   * Log a slow query
   */
  async logSlowQuery(
    queryText: string,
    executionTimeMs: number,
    rowsAffected?: number,
    userId?: string
  ): Promise<string | null> {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .rpc('log_slow_query', {
        p_query_text: queryText,
        p_execution_time_ms: executionTimeMs,
        p_rows_affected: rowsAffected,
        p_user_id: userId
      });
    
    if (error) {
      logger.error('Error logging slow query', error);
      return null;
    }
    
    return data;
  }
  
  /**
   * Get query insights
   */
  async getQueryInsights(hours: number = 24): Promise<QueryInsight[]> {
    const cacheKey = `query-monitor:insights:${hours}`;
    
    return cache.get(cacheKey, async () => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('get_query_insights', { p_hours: hours });
      
      if (error) {
        logger.error('Error getting query insights', error);
        return [];
      }
      
      return data || [];
    }, {
      tags: ['query-insights'],
      ttl: 600 // 10 minutes
    });
  }
  
  /**
   * Analyze query patterns
   */
  async analyzeQueryPatterns(days: number = 7): Promise<QueryPattern[]> {
    const cacheKey = `query-monitor:patterns:${days}`;
    
    return cache.get(cacheKey, async () => {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .rpc('analyze_query_patterns', { p_days: days });
      
      if (error) {
        logger.error('Error analyzing query patterns', error);
        return [];
      }
      
      return data || [];
    }, {
      tags: ['query-patterns'],
      ttl: 3600 // 1 hour
    });
  }
  
  /**
   * Check database health
   */
  async checkDatabaseHealth(): Promise<DatabaseHealth[]> {
    const supabase = createClient();
    
    // Perform health check
    const { error: checkError } = await supabase
      .rpc('check_database_health');
    
    if (checkError) {
      logger.error('Error checking database health', checkError);
    }
    
    // Get latest health metrics
    const { data, error } = await supabase
      .from('database_health_metrics')
      .select('*')
      .order('checked_at', { ascending: false })
      .limit(20);
    
    if (error) {
      logger.error('Error getting health metrics', error);
      return [];
    }
    
    // Log any unhealthy metrics
    const unhealthyMetrics = (data || []).filter(m => !m.is_healthy);
    for (const metric of unhealthyMetrics) {
      logger.warn('Unhealthy database metric', {
        metric: metric.metric_name,
        value: metric.metric_value,
        unit: metric.unit,
        threshold_warning: metric.threshold_warning
      });
    }
    
    return data || [];
  }
  
  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<any> {
    const cacheKey = 'query-monitor:database-stats';
    
    return cache.get(cacheKey, async () => {
      const supabase = createClient();
      
      // Get table sizes
      const tables = ['organizations', 'buildings', 'emissions_data', 'conversations', 'messages'];
      const tableStats = [];
      
      for (const table of tables) {
        const { data, error } = await supabase
          .rpc('get_table_stats', { target_table_name: table });
        
        if (!error && data) {
          tableStats.push({ table, ...data[0] });
        }
      }
      
      // Get slow query summary
      const { data: slowQueryData } = await supabase
        .from('slow_query_logs')
        .select('id')
        .gte('last_seen', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const slowQueriesLast24h = slowQueryData?.length || 0;
      
      // Get health metrics summary
      const healthMetrics = await this.checkDatabaseHealth();
      const healthySummary = {
        total: healthMetrics.length,
        healthy: healthMetrics.filter(m => m.is_healthy).length,
        warning: healthMetrics.filter(m => !m.is_healthy && m.metric_value < m.threshold_critical).length,
        critical: healthMetrics.filter(m => !m.is_healthy && m.metric_value >= m.threshold_critical).length
      };
      
      return {
        tables: tableStats,
        slowQueriesLast24h,
        health: healthySummary,
        timestamp: new Date().toISOString()
      };
    }, {
      tags: ['database-stats'],
      ttl: 300 // 5 minutes
    });
  }
  
  /**
   * Export query monitoring report
   */
  async exportReport(format: 'json' | 'csv' = 'json'): Promise<string> {
    const [slowQueries, insights, patterns, health] = await Promise.all([
      this.getSlowQueries(),
      this.getQueryInsights(),
      this.analyzeQueryPatterns(),
      this.checkDatabaseHealth()
    ]);
    
    const report = {
      generated_at: new Date().toISOString(),
      summary: {
        total_slow_queries: slowQueries.length,
        total_insights: insights.length,
        total_patterns: patterns.length,
        health_checks: health.length,
        unhealthy_metrics: health.filter(h => !h.is_healthy).length
      },
      slow_queries: slowQueries,
      insights,
      patterns,
      health_metrics: health
    };
    
    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }
    
    // CSV format
    const csvLines = [
      'Report Section,Metric,Value',
      `Summary,Generated At,${report.generated_at}`,
      `Summary,Total Slow Queries,${report.summary.total_slow_queries}`,
      `Summary,Total Insights,${report.summary.total_insights}`,
      `Summary,Total Patterns,${report.summary.total_patterns}`,
      `Summary,Health Checks,${report.summary.health_checks}`,
      `Summary,Unhealthy Metrics,${report.summary.unhealthy_metrics}`,
      '',
      'Slow Queries,Query Type,Mean Time (ms),Calls',
      ...slowQueries.map(q => `Slow Queries,${q.query_type},${q.mean_time},${q.calls}`),
      '',
      'Query Patterns,Pattern,Occurrences,Avg Time (ms)',
      ...patterns.map(p => `Query Patterns,${p.pattern_name},${p.occurrence_count},${p.avg_execution_time}`),
      '',
      'Health Metrics,Metric,Value,Healthy',
      ...health.map(h => `Health Metrics,${h.metric_name},${h.metric_value} ${h.unit},${h.is_healthy}`)
    ];
    
    return csvLines.join('\n');
  }
}

// Export singleton instance
export const queryMonitor = QueryMonitor.getInstance();