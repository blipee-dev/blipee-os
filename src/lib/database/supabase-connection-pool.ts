/**
 * Supabase-Compatible Connection Pool
 * Works with Supabase REST API instead of direct PostgreSQL
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { dbMonitor } from './monitoring';

export interface SupabasePoolConfig {
  minConnections: number;
  maxConnections: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
  healthCheckIntervalMs: number;
  maxRetries: number;
}

export interface SupabaseConnection {
  id: string;
  client: SupabaseClient<Database>;
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
  queryCount: number;
}

export interface PoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  utilization: number;
  totalQueries: number;
  averageQueryTime: number;
}

/**
 * Connection pool for Supabase clients
 * Manages multiple Supabase client instances for optimal performance
 */
export class SupabaseConnectionPool {
  private connections: SupabaseConnection[] = [];
  private waitingQueue: Array<{ resolve: (conn: SupabaseConnection) => void; reject: (error: Error) => void; timeout: NodeJS.Timeout }> = [];
  private config: SupabasePoolConfig;
  private isShutdown = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private connectionIdCounter = 0;

  constructor(config?: Partial<SupabasePoolConfig>) {
    this.config = {
      minConnections: 2,
      maxConnections: 10,
      acquireTimeoutMs: 10000,
      idleTimeoutMs: 300000, // 5 minutes
      healthCheckIntervalMs: 30000, // 30 seconds
      maxRetries: 3,
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize the connection pool
   */
  private async initialize(): Promise<void> {
    // Create minimum connections
    for (let i = 0; i < this.config.minConnections; i++) {
      await this.createConnection();
    }

    // Start health check interval
    this.startHealthCheck();

  }

  /**
   * Create a new Supabase connection
   */
  private async createConnection(): Promise<SupabaseConnection> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const client = createClient<Database>(supabaseUrl, serviceRoleKey, {
      db: {
        schema: 'public',
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const connection: SupabaseConnection = {
      id: `supabase-conn-${++this.connectionIdCounter}`,
      client,
      createdAt: new Date(),
      lastUsed: new Date(),
      isActive: false,
      queryCount: 0,
    };

    // Test the connection
    try {
      const { error } = await client.from('organizations').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is ok for testing
        console.warn(`⚠️ Connection ${connection.id} test warning:`, error.message);
      }
    } catch (error) {
      console.error(`❌ Failed to test connection ${connection.id}:`, error);
      throw error;
    }

    this.connections.push(connection);
    
    return connection;
  }

  /**
   * Acquire a connection from the pool
   */
  async acquire(): Promise<SupabaseConnection> {
    if (this.isShutdown) {
      throw new Error('Connection pool is shutdown');
    }

    // Try to find an idle connection
    const idleConnection = this.connections.find(conn => !conn.isActive);
    if (idleConnection) {
      idleConnection.isActive = true;
      idleConnection.lastUsed = new Date();
      return idleConnection;
    }

    // Try to create a new connection if under max limit
    if (this.connections.length < this.config.maxConnections) {
      const newConnection = await this.createConnection();
      newConnection.isActive = true;
      return newConnection;
    }

    // Wait for an available connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitingQueue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new Error(`Connection acquisition timeout after ${this.config.acquireTimeoutMs}ms`));
      }, this.config.acquireTimeoutMs);

      this.waitingQueue.push({ resolve, reject, timeout });
    });
  }

  /**
   * Release a connection back to the pool
   */
  release(connection: SupabaseConnection): void {
    connection.isActive = false;
    connection.lastUsed = new Date();

    // If there are waiting requests, fulfill the first one
    if (this.waitingQueue.length > 0) {
      const waiting = this.waitingQueue.shift()!;
      clearTimeout(waiting.timeout);
      connection.isActive = true;
      waiting.resolve(connection);
    }
  }

  /**
   * Execute a query with automatic connection management
   */
  async query<T = any>(
    table: string,
    operation: (client: SupabaseClient<Database>) => Promise<{ data: T[] | null; error: any }>
  ): Promise<T[]> {
    const startTime = Date.now();
    const connection = await this.acquire();

    try {
      const result = await operation(connection.client);
      const duration = Date.now() - startTime;
      
      connection.queryCount++;

      // Record metrics
      dbMonitor.recordQuery({
        query: `Supabase query on ${table}`,
        duration,
        timestamp: new Date(),
        success: !result.error,
        rowCount: result.data?.length || 0,
        error: result.error?.message,
      });

      if (result.error) {
        throw new Error(`Supabase query failed: ${result.error.message}`);
      }

      return result.data || [];
    } finally {
      this.release(connection);
    }
  }

  /**
   * Execute a transaction (best effort with Supabase)
   */
  async transaction<T>(
    operations: (client: SupabaseClient<Database>) => Promise<T>
  ): Promise<T> {
    const connection = await this.acquire();
    
    try {
      // Note: Supabase doesn't support traditional transactions via REST API
      // This is a best-effort approach for related operations
      return await operations(connection.client);
    } finally {
      this.release(connection);
    }
  }

  /**
   * Get pool metrics
   */
  getMetrics(): PoolMetrics {
    const activeCount = this.connections.filter(conn => conn.isActive).length;
    const totalQueries = this.connections.reduce((sum, conn) => sum + conn.queryCount, 0);
    
    const performanceMetrics = dbMonitor.getPerformanceMetrics();

    return {
      totalConnections: this.connections.length,
      activeConnections: activeCount,
      idleConnections: this.connections.length - activeCount,
      waitingRequests: this.waitingQueue.length,
      utilization: this.connections.length > 0 ? activeCount / this.connections.length : 0,
      totalQueries,
      averageQueryTime: performanceMetrics.averageQueryTime,
    };
  }

  /**
   * Health check for connections
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      if (this.isShutdown) return;

      const healthCheckPromises = this.connections.map(async (connection) => {
        if (connection.isActive) return; // Skip active connections

        try {
          const { error } = await connection.client
            .from('organizations')
            .select('count', { count: 'exact', head: true });
            
          if (error && error.code !== 'PGRST116') {
            console.warn(`⚠️ Health check warning for ${connection.id}:`, error.message);
          }
        } catch (error) {
          console.error(`❌ Health check failed for ${connection.id}:`, error);
          // Remove unhealthy connection
          this.removeConnection(connection);
        }
      });

      await Promise.all(healthCheckPromises);

      // Clean up old idle connections
      const now = new Date();
      const idleConnections = this.connections.filter(
        conn => !conn.isActive && 
        now.getTime() - conn.lastUsed.getTime() > this.config.idleTimeoutMs
      );

      for (const idleConnection of idleConnections) {
        if (this.connections.length > this.config.minConnections) {
          this.removeConnection(idleConnection);
        }
      }

      // Ensure minimum connections
      while (this.connections.length < this.config.minConnections && !this.isShutdown) {
        try {
          await this.createConnection();
        } catch (error) {
          console.error('Failed to create minimum connection:', error);
          break;
        }
      }

    }, this.config.healthCheckIntervalMs);
  }

  /**
   * Remove a connection from the pool
   */
  private removeConnection(connection: SupabaseConnection): void {
    const index = this.connections.indexOf(connection);
    if (index !== -1) {
      this.connections.splice(index, 1);
    }
  }

  /**
   * Shutdown the pool
   */
  async shutdown(): Promise<void> {
    this.isShutdown = true;

    // Clear health check interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Reject all waiting requests
    this.waitingQueue.forEach(waiting => {
      clearTimeout(waiting.timeout);
      waiting.reject(new Error('Connection pool is shutting down'));
    });
    this.waitingQueue.length = 0;

    // Wait for active connections to finish
    const maxWaitTime = 5000; // 5 seconds
    const startTime = Date.now();
    
    while (this.connections.some(conn => conn.isActive) && 
           (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Clear all connections
    this.connections.length = 0;

  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): Array<{
    id: string;
    isActive: boolean;
    queryCount: number;
    age: number;
    idleTime: number;
  }> {
    const now = new Date();
    
    return this.connections.map(conn => ({
      id: conn.id,
      isActive: conn.isActive,
      queryCount: conn.queryCount,
      age: now.getTime() - conn.createdAt.getTime(),
      idleTime: now.getTime() - conn.lastUsed.getTime(),
    }));
  }
}

// Singleton instance - lazy initialization
let _supabaseConnectionPool: SupabaseConnectionPool | null = null;

export function getSupabaseConnectionPool(): SupabaseConnectionPool {
  if (!_supabaseConnectionPool) {
    _supabaseConnectionPool = new SupabaseConnectionPool();
  }
  return _supabaseConnectionPool;
}

// Export singleton getter
export const supabaseConnectionPool = {
  get instance() {
    return getSupabaseConnectionPool();
  }
};