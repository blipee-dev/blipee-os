import { EventEmitter } from 'events';
import { checkPoolHealth } from './connection-pool';

export interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
  rowCount?: number;
  params?: any[];
}

export interface ConnectionMetrics {
  timestamp: Date;
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
}

export interface PerformanceMetrics {
  averageQueryTime: number;
  slowQueries: number;
  totalQueries: number;
  errorRate: number;
  connectionUtilization: number;
}

class DatabaseMonitor extends EventEmitter {
  private queryMetrics: QueryMetrics[] = [];
  private connectionMetrics: ConnectionMetrics[] = [];
  private metricsRetentionMs = 300000; // 5 minutes
  private slowQueryThresholdMs = 100;
  
  // Record a query execution
  recordQuery(metrics: QueryMetrics) {
    this.queryMetrics.push(metrics);
    this.emit('query', metrics);
    
    // Alert on slow queries
    if (metrics.duration > this.slowQueryThresholdMs) {
      this.emit('slow-query', metrics);
    }
    
    // Alert on errors
    if (!metrics.success) {
      this.emit('query-error', metrics);
    }
    
    this.cleanOldMetrics();
  }
  
  // Record connection pool metrics
  recordConnectionMetrics(metrics: ConnectionMetrics) {
    this.connectionMetrics.push(metrics);
    this.emit('connection-metrics', metrics);
    
    // Alert on high connection usage
    const utilization = metrics.activeConnections / metrics.totalConnections;
    if (utilization > 0.8) {
      this.emit('high-connection-usage', { utilization, metrics });
    }
    
    // Alert on waiting requests
    if (metrics.waitingRequests > 0) {
      this.emit('connection-queue', { 
        waiting: metrics.waitingRequests,
        metrics 
      });
    }
    
    this.cleanOldMetrics();
  }
  
  // Get performance summary
  getPerformanceMetrics(): PerformanceMetrics {
    const recentQueries = this.queryMetrics.filter(
      q => Date.now() - q.timestamp.getTime() < this.metricsRetentionMs
    );
    
    const totalQueries = recentQueries.length;
    const failedQueries = recentQueries.filter(q => !q.success).length;
    const slowQueries = recentQueries.filter(
      q => q.duration > this.slowQueryThresholdMs
    ).length;
    
    const averageQueryTime = totalQueries > 0
      ? recentQueries.reduce((sum, q) => sum + q.duration, 0) / totalQueries
      : 0;
    
    const latestConnection = this.connectionMetrics[this.connectionMetrics.length - 1];
    const connectionUtilization = latestConnection
      ? latestConnection.activeConnections / latestConnection.totalConnections
      : 0;
    
    return {
      averageQueryTime,
      slowQueries,
      totalQueries,
      errorRate: totalQueries > 0 ? failedQueries / totalQueries : 0,
      connectionUtilization,
    };
  }
  
  // Get slow queries
  getSlowQueries(limit = 10): QueryMetrics[] {
    return this.queryMetrics
      .filter(q => q.duration > this.slowQueryThresholdMs)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }
  
  // Get query statistics by pattern
  getQueryStatistics(): Map<string, {
    count: number;
    avgDuration: number;
    errors: number;
  }> {
    const stats = new Map();
    
    this.queryMetrics.forEach(metric => {
      // Normalize query for grouping (remove specific values)
      const pattern = metric.query
        .replace(/\$\d+/g, '$?')  // Replace param placeholders
        .replace(/'\w+'/, "'?'")   // Replace string literals
        .replace(/\d+/, '?');      // Replace numbers
      
      const existing = stats.get(pattern) || { 
        count: 0, 
        totalDuration: 0, 
        errors: 0 
      };
      
      existing.count++;
      existing.totalDuration += metric.duration;
      if (!metric.success) existing.errors++;
      
      stats.set(pattern, existing);
    });
    
    // Calculate averages
    const result = new Map();
    stats.forEach((value, key) => {
      result.set(key, {
        count: value.count,
        avgDuration: value.totalDuration / value.count,
        errors: value.errors,
      });
    });
    
    return result;
  }
  
  // Clean old metrics
  private cleanOldMetrics() {
    const cutoff = Date.now() - this.metricsRetentionMs;
    
    this.queryMetrics = this.queryMetrics.filter(
      m => m.timestamp.getTime() > cutoff
    );
    
    this.connectionMetrics = this.connectionMetrics.filter(
      m => m.timestamp.getTime() > cutoff
    );
  }
  
  // Start periodic health checks
  startHealthChecks(intervalMs = 30000) {
    setInterval(async () => {
      const health = await checkPoolHealth();
      
      this.recordConnectionMetrics({
        timestamp: new Date(),
        totalConnections: health.maxClients,
        activeConnections: health.totalClients - health.idleClients,
        idleConnections: health.idleClients,
        waitingRequests: health.waitingClients,
      });
      
      if (!health.healthy) {
        this.emit('connection-unhealthy', health);
      }
    }, intervalMs);
  }
  
  // Export metrics for monitoring systems
  exportMetrics() {
    return {
      performance: this.getPerformanceMetrics(),
      slowQueries: this.getSlowQueries(),
      queryStats: Array.from(this.getQueryStatistics().entries()).map(
        ([pattern, stats]) => ({ pattern, ...stats })
      ),
      connectionHistory: this.connectionMetrics.slice(-20),
    };
  }
}

// Global monitor instance
export const dbMonitor = new DatabaseMonitor();

// Middleware to monitor database queries
export function monitorQuery(
  queryFn: (...args: any[]) => Promise<any>
): (...args: any[]) => Promise<any> {
  return async (...args: any[]) => {
    const startTime = Date.now();
    const query = args[0];
    const params = args[1];
    
    try {
      const result = await queryFn(...args);
      const duration = Date.now() - startTime;
      
      dbMonitor.recordQuery({
        query,
        duration,
        timestamp: new Date(),
        success: true,
        rowCount: result.rowCount || result.rows?.length || 0,
        params,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      dbMonitor.recordQuery({
        query,
        duration,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        params,
      });
      
      throw error;
    }
  };
}