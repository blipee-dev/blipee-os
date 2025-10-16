import { Pool, PoolClient } from 'pg';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { getDatabaseConfig } from './connection-pool';
import { dbMonitor } from './monitoring';

export interface ReadReplicaConfig {
  url: string;
  region?: string;
  weight?: number;  // For weighted load balancing
  maxConnections?: number;
  priority?: number; // For fallback ordering
}

export interface ReadReplicaPool {
  url: string;
  pool: Pool;
  healthy: boolean;
  lastHealthCheck: Date;
  region?: string;
  weight: number;
  requestCount: number;
  errorCount: number;
  averageLatency: number;
}

class ReadReplicaManager {
  private replicas: ReadReplicaPool[] = [];
  private currentIndex = 0;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private readonly healthCheckIntervalMs = 30000; // 30 seconds

  constructor() {
    this.initializeReplicas();
  }

  /**
   * Initialize read replicas from environment configuration
   */
  private initializeReplicas() {
    const replicaUrls = process.env.SUPABASE_READ_REPLICA_URLS?.split(',').filter(Boolean) || [];
    const replicaRegions = process.env.SUPABASE_READ_REPLICA_REGIONS?.split(',') || [];
    const replicaWeights = process.env.SUPABASE_READ_REPLICA_WEIGHTS?.split(',').map(w => parseInt(w, 10)) || [];

    replicaUrls.forEach((url, index) => {
      this.addReplica({
        url: url.trim(),
        region: replicaRegions[index]?.trim(),
        weight: replicaWeights[index] || 1,
        maxConnections: 10,
      });
    });

    // Start health checks if we have replicas
    if (this.replicas.length > 0) {
      this.startHealthChecks();
    }
  }

  /**
   * Add a read replica to the pool
   */
  addReplica(config: ReadReplicaConfig): void {
    // Parse connection string to get database config
    const url = new URL(config.url);
    
    const pool = new Pool({
      host: url.hostname,
      port: parseInt(url.port || '5432', 10),
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
      max: config.maxConnections || 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      statement_timeout: 30000,
      application_name: 'blipee-os-read-replica',
    });

    // Set up pool event handlers
    pool.on('error', (err) => {
      console.error(`Read replica pool error (${config.url}):`, err);
      this.markUnhealthy(config.url);
    });

    pool.on('connect', () => {
    });

    const replicaPool: ReadReplicaPool = {
      url: config.url,
      pool,
      healthy: true,
      lastHealthCheck: new Date(),
      region: config.region,
      weight: config.weight || 1,
      requestCount: 0,
      errorCount: 0,
      averageLatency: 0,
    };

    this.replicas.push(replicaPool);
    
    // Perform initial health check
    this.checkReplicaHealth(replicaPool);
  }

  /**
   * Get a healthy read replica using weighted round-robin
   */
  getReadReplica(): ReadReplicaPool | null {
    const healthyReplicas = this.replicas.filter(r => r.healthy);
    
    if (healthyReplicas.length === 0) {
      console.warn('No healthy read replicas available');
      return null;
    }

    // Weighted round-robin selection
    const totalWeight = healthyReplicas.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const replica of healthyReplicas) {
      random -= replica.weight;
      if (random <= 0) {
        replica.requestCount++;
        return replica;
      }
    }

    // Fallback to first healthy replica
    healthyReplicas[0].requestCount++;
    return healthyReplicas[0];
  }

  /**
   * Get a read replica for a specific region
   */
  getRegionalReplica(region: string): ReadReplicaPool | null {
    const regionalReplicas = this.replicas.filter(
      r => r.healthy && r.region === region
    );

    if (regionalReplicas.length > 0) {
      // Return the one with lowest load
      const replica = regionalReplicas.reduce((prev, curr) => 
        prev.averageLatency < curr.averageLatency ? prev : curr
      );
      replica.requestCount++;
      return replica;
    }

    // Fallback to any healthy replica
    return this.getReadReplica();
  }

  /**
   * Execute a read query on a replica
   */
  async query<T = any>(
    sql: string,
    params?: any[],
    preferredRegion?: string
  ): Promise<T[]> {
    const replica = preferredRegion 
      ? this.getRegionalReplica(preferredRegion) 
      : this.getReadReplica();

    if (!replica) {
      throw new Error('No healthy read replicas available');
    }

    const startTime = Date.now();
    let client: PoolClient | null = null;

    try {
      client = await replica.pool.connect();
      const result = await client.query(sql, params);
      
      const duration = Date.now() - startTime;
      this.updateReplicaMetrics(replica, duration, true);
      
      // Record query metrics
      dbMonitor.recordQuery({
        query: sql,
        duration,
        timestamp: new Date(),
        success: true,
        rowCount: result.rowCount || 0,
        params,
      });

      return result.rows;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateReplicaMetrics(replica, duration, false);
      
      // Record error
      dbMonitor.recordQuery({
        query: sql,
        duration,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        params,
      });

      // Mark replica as unhealthy if too many errors
      if (replica.errorCount > 10) {
        this.markUnhealthy(replica.url);
      }

      throw error;
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  /**
   * Update replica performance metrics
   */
  private updateReplicaMetrics(
    replica: ReadReplicaPool,
    latency: number,
    success: boolean
  ): void {
    if (!success) {
      replica.errorCount++;
    }

    // Update average latency (exponential moving average)
    const alpha = 0.3; // Smoothing factor
    replica.averageLatency = replica.averageLatency * (1 - alpha) + latency * alpha;
  }

  /**
   * Check health of a specific replica
   */
  private async checkReplicaHealth(replica: ReadReplicaPool): Promise<void> {
    const startTime = Date.now();
    
    try {
      const client = await replica.pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      const latency = Date.now() - startTime;
      
      replica.healthy = true;
      replica.lastHealthCheck = new Date();
      replica.errorCount = 0; // Reset error count on successful check
      
      // Update latency metric
      this.updateReplicaMetrics(replica, latency, true);
      
    } catch (error) {
      replica.healthy = false;
      replica.lastHealthCheck = new Date();
      replica.errorCount++;
      
      console.error(`Read replica health check failed: ${replica.region || replica.url}`, error);
    }
  }

  /**
   * Mark a replica as unhealthy
   */
  private markUnhealthy(url: string): void {
    const replica = this.replicas.find(r => r.url === url);
    if (replica) {
      replica.healthy = false;
      console.warn(`Read replica marked as unhealthy: ${replica.region || url}`);
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    // Initial health check
    this.checkAllReplicas();

    // Periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.checkAllReplicas();
    }, this.healthCheckIntervalMs);
  }

  /**
   * Check health of all replicas
   */
  private async checkAllReplicas(): Promise<void> {
    await Promise.all(
      this.replicas.map(replica => this.checkReplicaHealth(replica))
    );
  }

  /**
   * Get replica statistics
   */
  getStatistics(): {
    total: number;
    healthy: number;
    unhealthy: number;
    replicas: Array<{
      url: string;
      region?: string;
      healthy: boolean;
      requestCount: number;
      errorCount: number;
      averageLatencyMs: number;
      lastHealthCheck: Date;
    }>;
  } {
    const healthy = this.replicas.filter(r => r.healthy).length;
    
    return {
      total: this.replicas.length,
      healthy,
      unhealthy: this.replicas.length - healthy,
      replicas: this.replicas.map(r => ({
        url: r.url,
        region: r.region,
        healthy: r.healthy,
        requestCount: r.requestCount,
        errorCount: r.errorCount,
        averageLatencyMs: Math.round(r.averageLatency),
        lastHealthCheck: r.lastHealthCheck,
      })),
    };
  }

  /**
   * Close all replica connections
   */
  async close(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }

    await Promise.all(
      this.replicas.map(replica => replica.pool.end())
    );
    
    this.replicas = [];
  }
}

// Singleton instance
export const readReplicaManager = new ReadReplicaManager();

/**
 * Execute a read-only query using read replicas
 */
export async function queryReadReplica<T = any>(
  sql: string,
  params?: any[],
  options?: {
    preferredRegion?: string;
    fallbackToPrimary?: boolean;
  }
): Promise<T[]> {
  try {
    return await readReplicaManager.query<T>(sql, params, options?.preferredRegion);
  } catch (error) {
    if (options?.fallbackToPrimary) {
      console.warn('Read replica failed, falling back to primary database');
      // Fall back to primary database using the main connection pool
      const { query } = await import('./connection-pool');
      return query<T>(sql, params);
    }
    throw error;
  }
}

/**
 * Create a Supabase client that uses read replicas for queries
 */
export function createReadReplicaClient(): SupabaseClient<Database> | null {
  const replica = readReplicaManager.getReadReplica();
  if (!replica) {
    return null;
  }

  // Create a Supabase client with the replica URL
  // Note: This requires the replica to have proper Supabase/PostgREST setup
  return createClient<Database>(
    replica.url.replace('postgresql://', 'https://').replace(':5432', ''),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          'x-read-replica': 'true',
          'x-replica-region': replica.region || 'unknown',
        },
      },
    }
  );
}

// Graceful shutdown
if (typeof process !== 'undefined') {
  process.on('SIGTERM', async () => {
    await readReplicaManager.close();
  });
  
  process.on('SIGINT', async () => {
    await readReplicaManager.close();
  });
}