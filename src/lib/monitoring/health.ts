import { HealthCheck } from './types';
import { monitoringService } from './service';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sessionStore } from '@/lib/auth/session-store';
import { checkPoolHealth } from '@/lib/database/connection-pool';
import { dbMonitor } from '@/lib/database/monitoring';
import { isConnectionPoolingEnabled } from '@/lib/supabase/server-pooled';

/**
 * Health check service for monitoring system components
 */
export class HealthCheckService {
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();
  private interval: NodeJS.Timeout | null = null;

  constructor() {
    this.registerDefaultChecks();
  }

  /**
   * Register default health checks
   */
  private registerDefaultChecks(): void {
    // Database health check
    this.register('database', async () => {
      const startTime = Date.now();
      try {
        const { data, error } = await supabaseAdmin
          .from('health_check')
          .select('status')
          .single();
        
        const responseTime = Date.now() - startTime;
        
        if (error && error.code !== 'PGRST116') { // Table doesn't exist is ok
          return {
            service: 'database',
            status: 'unhealthy',
            responseTime,
            lastCheck: new Date(),
            details: { error: error.message },
          };
        }
        
        return {
          service: 'database',
          status: responseTime < 1000 ? 'healthy' : 'degraded',
          responseTime,
          lastCheck: new Date(),
        };
      } catch (error) {
        return {
          service: 'database',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          lastCheck: new Date(),
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
      }
    });

    // Connection pool health check
    if (isConnectionPoolingEnabled()) {
      this.register('connection-pool', async () => {
        const startTime = Date.now();
        try {
          const poolHealth = await checkPoolHealth();
          const performanceMetrics = dbMonitor.getPerformanceMetrics();
          const responseTime = Date.now() - startTime;
          
          let status: 'healthy' | 'degraded' | 'unhealthy';
          if (!poolHealth.healthy) {
            status = 'unhealthy';
          } else if (poolHealth.waitingClients > 0 || performanceMetrics.connectionUtilization > 0.8) {
            status = 'degraded';
          } else {
            status = 'healthy';
          }
          
          return {
            service: 'connection-pool',
            status,
            responseTime,
            lastCheck: new Date(),
            details: {
              ...poolHealth,
              utilizationPercent: Math.round(performanceMetrics.connectionUtilization * 100),
              avgQueryTimeMs: Math.round(performanceMetrics.averageQueryTime),
              slowQueries: performanceMetrics.slowQueries,
              errorRate: Math.round(performanceMetrics.errorRate * 100),
            },
          };
        } catch (error) {
          return {
            service: 'connection-pool',
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            lastCheck: new Date(),
            details: { error: error instanceof Error ? error.message : 'Unknown error' },
          };
        }
      });
    }

    // Redis/Session store health check
    this.register('session-store', async () => {
      const startTime = Date.now();
      try {
        // Test set and get
        const testKey = 'health-check-test';
        const testValue = { test: true, timestamp: Date.now() };
        
        await sessionStore.set(testKey, testValue, 10); // 10 second TTL
        const retrieved = await sessionStore.get(testKey);
        await sessionStore.delete(testKey);
        
        const responseTime = Date.now() - startTime;
        
        if (!retrieved || retrieved.timestamp !== testValue.timestamp) {
          return {
            service: 'session-store',
            status: 'unhealthy',
            responseTime,
            lastCheck: new Date(),
            details: { error: 'Data integrity check failed' },
          };
        }
        
        return {
          service: 'session-store',
          status: responseTime < 100 ? 'healthy' : 'degraded',
          responseTime,
          lastCheck: new Date(),
        };
      } catch (error) {
        return {
          service: 'session-store',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          lastCheck: new Date(),
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
      }
    });

    // API health check
    this.register('api', async () => {
      const startTime = Date.now();
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        
        const responseTime = Date.now() - startTime;
        
        if (!response.ok) {
          return {
            service: 'api',
            status: 'unhealthy',
            responseTime,
            lastCheck: new Date(),
            details: { statusCode: response.status },
          };
        }
        
        return {
          service: 'api',
          status: responseTime < 500 ? 'healthy' : 'degraded',
          responseTime,
          lastCheck: new Date(),
        };
      } catch (error) {
        return {
          service: 'api',
          status: 'unhealthy',
          responseTime: Date.now() - startTime,
          lastCheck: new Date(),
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
        };
      }
    });

    // Memory health check
    this.register('memory', async () => {
      const memoryUsage = process.memoryUsage();
      const heapUsedPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (heapUsedPercent < 70) {
        status = 'healthy';
      } else if (heapUsedPercent < 85) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }
      
      return {
        service: 'memory',
        status,
        lastCheck: new Date(),
        details: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
          heapUsedPercent: Math.round(heapUsedPercent),
          rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        },
      };
    });
  }

  /**
   * Register a health check
   */
  register(name: string, check: () => Promise<HealthCheck>): void {
    this.checks.set(name, check);
  }

  /**
   * Unregister a health check
   */
  unregister(name: string): void {
    this.checks.delete(name);
  }

  /**
   * Run all health checks
   */
  async runAll(): Promise<HealthCheck[]> {
    const results: HealthCheck[] = [];
    
    const entries = Array.from(this.checks.entries());
    for (const [name, check] of entries) {
      try {
        const result = await check();
        results.push(result);
        
        // Update monitoring service
        await monitoringService.updateHealthCheck(result);
      } catch (error) {
        const errorResult: HealthCheck = {
          service: name,
          status: 'unhealthy',
          lastCheck: new Date(),
          details: {
            error: error instanceof Error ? error.message : 'Health check failed',
          },
        };
        results.push(errorResult);
        await monitoringService.updateHealthCheck(errorResult);
      }
    }
    
    return results;
  }

  /**
   * Run a specific health check
   */
  async run(name: string): Promise<HealthCheck | null> {
    const check = this.checks.get(name);
    if (!check) return null;
    
    try {
      const result = await check();
      await monitoringService.updateHealthCheck(result);
      return result;
    } catch (error) {
      const errorResult: HealthCheck = {
        service: name,
        status: 'unhealthy',
        lastCheck: new Date(),
        details: {
          error: error instanceof Error ? error.message : 'Health check failed',
        },
      };
      await monitoringService.updateHealthCheck(errorResult);
      return errorResult;
    }
  }

  /**
   * Get overall system health
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    checks: HealthCheck[];
    summary: {
      total: number;
      healthy: number;
      degraded: number;
      unhealthy: number;
    };
  }> {
    const checks = await this.runAll();
    
    const summary = {
      total: checks.length,
      healthy: checks.filter(c => c.status === 'healthy').length,
      degraded: checks.filter(c => c.status === 'degraded').length,
      unhealthy: checks.filter(c => c.status === 'unhealthy').length,
    };
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (summary.unhealthy > 0) {
      status = 'unhealthy';
    } else if (summary.degraded > 0) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }
    
    return {
      status,
      checks,
      summary,
    };
  }

  /**
   * Start periodic health checks
   */
  startPeriodicChecks(intervalMs: number = 60000): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    
    // Run immediately
    this.runAll().catch(console.error);
    
    // Then run periodically
    this.interval = setInterval(() => {
      this.runAll().catch(console.error);
    }, intervalMs);
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Check if a service is healthy
   */
  async isHealthy(service: string): Promise<boolean> {
    const result = await this.run(service);
    return result?.status === 'healthy';
  }

  /**
   * Wait for all services to be healthy
   */
  async waitForHealth(
    timeoutMs: number = 30000,
    checkIntervalMs: number = 1000
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      const health = await this.getSystemHealth();
      
      if (health.status === 'healthy') {
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, checkIntervalMs));
    }
    
    return false;
  }
}

// Export singleton instance
export const healthCheckService = new HealthCheckService();

// Export convenience functions
export const {
  register: registerHealthCheck,
  unregister: unregisterHealthCheck,
  runAll: runAllHealthChecks,
  run: runHealthCheck,
  getSystemHealth,
  isHealthy: isServiceHealthy,
  waitForHealth,
} = healthCheckService;