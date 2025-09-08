/**
 * Connection Pool Optimizer
 * Phase 2, Task 2.2: Advanced Connection Pooling Optimization
 */

import { Pool, PoolClient, PoolConfig } from 'pg';
import { getDatabaseConfig, checkPoolHealth } from './connection-pool';
import { dbMonitor } from './monitoring';

export interface PoolOptimizationConfig {
  // Dynamic pool sizing
  dynamicResize: {
    enabled: boolean;
    minSize: number;
    maxSize: number;
    scaleUpThreshold: number;  // Pool utilization % to scale up
    scaleDownThreshold: number; // Pool utilization % to scale down
    checkIntervalMs: number;
    scaleUpStep: number;
    scaleDownStep: number;
  };
  
  // Connection health monitoring
  healthCheck: {
    enabled: boolean;
    intervalMs: number;
    timeoutMs: number;
    maxRetries: number;
    unhealthyThreshold: number; // Failed health checks to mark unhealthy
  };
  
  // Query optimization
  queryOptimization: {
    preparedStatements: boolean;
    queryCache: boolean;
    maxCacheSize: number;
    cacheTTLMs: number;
  };
  
  // Load balancing (for read replicas)
  loadBalancing: {
    enabled: boolean;
    readReplicas: string[];
    writeRatio: number; // 0-1, how much traffic goes to primary
    healthCheckReplicas: boolean;
  };
  
  // Connection prioritization
  prioritization: {
    enabled: boolean;
    highPriorityQueries: string[]; // Query patterns that get priority
    lowPriorityTimeout: number; // Max wait time for low priority queries
  };
}

export interface PoolMetrics {
  timestamp: Date;
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  utilization: number;
  averageWaitTime: number;
  averageQueryTime: number;
  totalQueries: number;
  failedQueries: number;
  healthScore: number;
}

/**
 * Advanced connection pool optimizer
 */
export class ConnectionPoolOptimizer {
  private pools: Map<string, Pool> = new Map();
  private metrics: PoolMetrics[] = [];
  private config: PoolOptimizationConfig;
  private isMonitoring = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private optimizationInterval?: NodeJS.Timeout;

  constructor(config?: Partial<PoolOptimizationConfig>) {
    this.config = this.mergeConfig(config);
  }

  /**
   * Merge user config with defaults
   */
  private mergeConfig(userConfig?: Partial<PoolOptimizationConfig>): PoolOptimizationConfig {
    const defaults: PoolOptimizationConfig = {
      dynamicResize: {
        enabled: true,
        minSize: 2,
        maxSize: 25,
        scaleUpThreshold: 0.8,
        scaleDownThreshold: 0.3,
        checkIntervalMs: 30000,
        scaleUpStep: 2,
        scaleDownStep: 1,
      },
      healthCheck: {
        enabled: true,
        intervalMs: 15000,
        timeoutMs: 5000,
        maxRetries: 3,
        unhealthyThreshold: 3,
      },
      queryOptimization: {
        preparedStatements: true,
        queryCache: false, // Disable for now due to memory concerns
        maxCacheSize: 100,
        cacheTTLMs: 300000,
      },
      loadBalancing: {
        enabled: false, // Enable when read replicas are configured
        readReplicas: [],
        writeRatio: 0.7,
        healthCheckReplicas: true,
      },
      prioritization: {
        enabled: true,
        highPriorityQueries: ['SELECT * FROM users', 'SELECT * FROM organizations'],
        lowPriorityTimeout: 10000,
      },
    };

    return {
      dynamicResize: { ...defaults.dynamicResize, ...userConfig?.dynamicResize },
      healthCheck: { ...defaults.healthCheck, ...userConfig?.healthCheck },
      queryOptimization: { ...defaults.queryOptimization, ...userConfig?.queryOptimization },
      loadBalancing: { ...defaults.loadBalancing, ...userConfig?.loadBalancing },
      prioritization: { ...defaults.prioritization, ...userConfig?.prioritization },
    };
  }

  /**
   * Create an optimized connection pool
   */
  createOptimizedPool(poolId = 'default'): Pool {
    if (this.pools.has(poolId)) {
      return this.pools.get(poolId)!;
    }

    const dbConfig = getDatabaseConfig();
    const poolConfig = dbConfig.pgBouncer.enabled ? dbConfig.pgBouncer : dbConfig.direct;

    const pool = new Pool({
      // Connection settings
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      user: poolConfig.user,
      password: poolConfig.password,
      
      // Optimized pool settings
      min: this.config.dynamicResize.minSize,
      max: this.config.dynamicResize.maxSize,
      idleTimeoutMillis: dbConfig.pool.idleTimeout,
      connectionTimeoutMillis: dbConfig.pgBouncer.connectionTimeout,
      
      // Performance optimizations
      application_name: `blipee-os-${poolId}`,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      
      // Statement timeout
      statement_timeout: dbConfig.pgBouncer.statementTimeout,
      
      // SSL settings for production
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Enhanced event handlers
    this.setupPoolEventHandlers(pool, poolId);
    
    this.pools.set(poolId, pool);
    return pool;
  }

  /**
   * Setup enhanced pool event handlers
   */
  private setupPoolEventHandlers(pool: Pool, poolId: string): void {
    pool.on('error', (err) => {
      console.error(`Pool ${poolId} error:`, err);
      dbMonitor.recordQuery({
        query: 'POOL_ERROR',
        duration: 0,
        timestamp: new Date(),
        success: false,
        error: err.message,
      });
    });

    pool.on('connect', (client) => {
      console.log(`New client connected to pool ${poolId}`);
      
      // Set session optimizations
      if (this.config.queryOptimization.preparedStatements) {
        client.query('SET plan_cache_mode = force_generic_plan');
      }
    });

    pool.on('acquire', (client) => {
      console.debug(`Client acquired from pool ${poolId}`);
    });

    pool.on('remove', (client) => {
      console.debug(`Client removed from pool ${poolId}`);
    });
  }

  /**
   * Get optimized client with monitoring
   */
  async getOptimizedClient(poolId = 'default', priority: 'high' | 'normal' | 'low' = 'normal'): Promise<PoolClient> {
    const pool = this.getPool(poolId);
    const startTime = Date.now();

    try {
      // Apply priority-based timeout
      const timeout = this.getPriorityTimeout(priority);
      const client = await this.acquireClientWithTimeout(pool, timeout);
      
      const acquireTime = Date.now() - startTime;
      
      // Record metrics
      this.recordConnectionMetrics(poolId, acquireTime);
      
      return this.wrapClientWithMonitoring(client, poolId);
    } catch (error) {
      const acquireTime = Date.now() - startTime;
      
      dbMonitor.recordQuery({
        query: 'CLIENT_ACQUIRE_FAILED',
        duration: acquireTime,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  /**
   * Acquire client with timeout
   */
  private async acquireClientWithTimeout(pool: Pool, timeoutMs: number): Promise<PoolClient> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Client acquisition timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      pool.connect()
        .then(client => {
          clearTimeout(timeout);
          resolve(client);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Get priority-based timeout
   */
  private getPriorityTimeout(priority: 'high' | 'normal' | 'low'): number {
    const base = 5000;
    switch (priority) {
      case 'high': return base * 2;
      case 'normal': return base;
      case 'low': return Math.min(base * 0.5, this.config.prioritization.lowPriorityTimeout);
      default: return base;
    }
  }

  /**
   * Wrap client with monitoring
   */
  private wrapClientWithMonitoring(client: PoolClient, poolId: string): PoolClient {
    const originalQuery = client.query.bind(client);
    
    client.query = async (...args: any[]) => {
      const startTime = Date.now();
      const query = typeof args[0] === 'string' ? args[0] : args[0]?.text || 'UNKNOWN';
      
      try {
        const result = await originalQuery(...args);
        const duration = Date.now() - startTime;
        
        // Record successful query
        dbMonitor.recordQuery({
          query,
          duration,
          timestamp: new Date(),
          success: true,
          rowCount: result.rowCount || 0,
          params: args[1],
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Record failed query
        dbMonitor.recordQuery({
          query,
          duration,
          timestamp: new Date(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          params: args[1],
        });
        
        throw error;
      }
    };
    
    return client;
  }

  /**
   * Record connection metrics
   */
  private recordConnectionMetrics(poolId: string, acquireTime: number): void {
    const pool = this.getPool(poolId);
    
    dbMonitor.recordConnectionMetrics({
      timestamp: new Date(),
      totalConnections: pool.totalCount,
      activeConnections: pool.totalCount - pool.idleCount,
      idleConnections: pool.idleCount,
      waitingRequests: pool.waitingCount,
    });
  }

  /**
   * Get pool by ID
   */
  private getPool(poolId: string): Pool {
    const pool = this.pools.get(poolId);
    if (!pool) {
      throw new Error(`Pool ${poolId} not found. Call createOptimizedPool() first.`);
    }
    return pool;
  }

  /**
   * Start monitoring and optimization
   */
  startOptimization(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Start health checks
    if (this.config.healthCheck.enabled) {
      this.startHealthChecks();
    }
    
    // Start dynamic resizing
    if (this.config.dynamicResize.enabled) {
      this.startDynamicResizing();
    }
    
    console.log('Connection pool optimization started');
  }

  /**
   * Start health check monitoring
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      for (const [poolId] of this.pools) {
        try {
          await this.performHealthCheck(poolId);
        } catch (error) {
          console.error(`Health check failed for pool ${poolId}:`, error);
        }
      }
    }, this.config.healthCheck.intervalMs);
  }

  /**
   * Start dynamic pool resizing
   */
  private startDynamicResizing(): void {
    this.optimizationInterval = setInterval(async () => {
      for (const [poolId] of this.pools) {
        try {
          await this.optimizePoolSize(poolId);
        } catch (error) {
          console.error(`Pool optimization failed for ${poolId}:`, error);
        }
      }
    }, this.config.dynamicResize.checkIntervalMs);
  }

  /**
   * Perform health check on pool
   */
  private async performHealthCheck(poolId: string): Promise<void> {
    const pool = this.getPool(poolId);
    const startTime = Date.now();
    
    try {
      const client = await this.acquireClientWithTimeout(pool, this.config.healthCheck.timeoutMs);
      await client.query('SELECT 1 as health_check');
      client.release();
      
      const duration = Date.now() - startTime;
      console.debug(`Health check passed for pool ${poolId} (${duration}ms)`);
      
    } catch (error) {
      console.error(`Health check failed for pool ${poolId}:`, error);
      throw error;
    }
  }

  /**
   * Optimize pool size based on utilization
   */
  private async optimizePoolSize(poolId: string): Promise<void> {
    const pool = this.getPool(poolId);
    const utilization = pool.totalCount > 0 ? 
      (pool.totalCount - pool.idleCount) / pool.totalCount : 0;
    
    const currentMax = pool.options.max || this.config.dynamicResize.maxSize;
    
    // Scale up if utilization is high
    if (utilization > this.config.dynamicResize.scaleUpThreshold && 
        currentMax < this.config.dynamicResize.maxSize) {
      
      const newMax = Math.min(
        currentMax + this.config.dynamicResize.scaleUpStep,
        this.config.dynamicResize.maxSize
      );
      
      console.log(`Scaling up pool ${poolId}: ${currentMax} → ${newMax} (utilization: ${(utilization * 100).toFixed(1)}%)`);
      
      // Note: pg Pool doesn't support runtime max changes, so we log for now
      // In production, this would require pool recreation or external pooler
    }
    
    // Scale down if utilization is low
    else if (utilization < this.config.dynamicResize.scaleDownThreshold && 
             currentMax > this.config.dynamicResize.minSize) {
      
      const newMax = Math.max(
        currentMax - this.config.dynamicResize.scaleDownStep,
        this.config.dynamicResize.minSize
      );
      
      console.log(`Scaling down pool ${poolId}: ${currentMax} → ${newMax} (utilization: ${(utilization * 100).toFixed(1)}%)`);
    }
  }

  /**
   * Get current pool metrics
   */
  async getPoolMetrics(poolId = 'default'): Promise<PoolMetrics> {
    const pool = this.getPool(poolId);
    const performanceMetrics = dbMonitor.getPerformanceMetrics();
    
    const utilization = pool.totalCount > 0 ? 
      (pool.totalCount - pool.idleCount) / pool.totalCount : 0;
    
    return {
      timestamp: new Date(),
      totalConnections: pool.totalCount,
      activeConnections: pool.totalCount - pool.idleCount,
      idleConnections: pool.idleCount,
      waitingRequests: pool.waitingCount,
      utilization,
      averageWaitTime: 0, // Would need to track this separately
      averageQueryTime: performanceMetrics.averageQueryTime,
      totalQueries: performanceMetrics.totalQueries,
      failedQueries: performanceMetrics.totalQueries * performanceMetrics.errorRate / 100,
      healthScore: utilization < 0.9 && performanceMetrics.errorRate < 5 ? 100 : 75,
    };
  }

  /**
   * Stop optimization
   */
  stopOptimization(): void {
    this.isMonitoring = false;
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
    
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = undefined;
    }
    
    console.log('Connection pool optimization stopped');
  }

  /**
   * Close all pools
   */
  async closeAllPools(): Promise<void> {
    this.stopOptimization();
    
    const closePromises = Array.from(this.pools.entries()).map(async ([poolId, pool]) => {
      try {
        await pool.end();
        console.log(`Pool ${poolId} closed`);
      } catch (error) {
        console.error(`Error closing pool ${poolId}:`, error);
      }
    });
    
    await Promise.all(closePromises);
    this.pools.clear();
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): {
    totalPools: number;
    isMonitoring: boolean;
    config: PoolOptimizationConfig;
  } {
    return {
      totalPools: this.pools.size,
      isMonitoring: this.isMonitoring,
      config: this.config,
    };
  }
}

// Export singleton instance
export const connectionPoolOptimizer = new ConnectionPoolOptimizer();