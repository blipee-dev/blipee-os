import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { getPooledClient, getPooledAdminClient } from './pooled-client';
import { createReadReplicaClient, queryReadReplica, readReplicaManager } from './read-replica';
import { query as primaryQuery, transaction } from './connection-pool';

export interface QueryRouterOptions {
  preferReplica?: boolean;
  forceReplica?: boolean;
  forcePrimary?: boolean;
  preferredRegion?: string;
  consistency?: 'strong' | 'eventual';
  maxStaleness?: number; // milliseconds
}

export interface QueryPlan {
  target: 'primary' | 'replica';
  region?: string;
  reason: string;
}

/**
 * Smart query router that determines the best target for queries
 */
export class QueryRouter {
  private lastWriteTime = new Map<string, number>(); // Track last write time per table
  private readonly defaultMaxStaleness = 1000; // 1 second default

  /**
   * Analyze SQL query to determine if it's read-only
   */
  private isReadOnlyQuery(sql: string): boolean {
    const normalizedSql = sql.trim().toUpperCase();
    const readOnlyPrefixes = ['SELECT', 'WITH', 'SHOW', 'DESCRIBE', 'EXPLAIN'];
    
    return readOnlyPrefixes.some(prefix => normalizedSql.startsWith(prefix));
  }

  /**
   * Extract table names from SQL query
   */
  private extractTableNames(sql: string): string[] {
    const tableRegex = /FROM\s+["']?(\w+)["']?/gi;
    const joinRegex = /JOIN\s+["']?(\w+)["']?/gi;
    
    const tables: string[] = [];
    let match;
    
    while ((match = tableRegex.exec(sql)) !== null) {
      tables.push(match[1].toLowerCase());
    }
    
    while ((match = joinRegex.exec(sql)) !== null) {
      tables.push(match[1].toLowerCase());
    }
    
    return [...new Set(tables)];
  }

  /**
   * Check if data might be stale based on recent writes
   */
  private isDataFresh(tables: string[], maxStaleness: number): boolean {
    const now = Date.now();
    
    for (const table of tables) {
      const lastWrite = this.lastWriteTime.get(table);
      if (lastWrite && (now - lastWrite) < maxStaleness) {
        return false; // Data might be stale
      }
    }
    
    return true;
  }

  /**
   * Record a write operation
   */
  recordWrite(tables: string[]): void {
    const now = Date.now();
    tables.forEach(table => {
      this.lastWriteTime.set(table.toLowerCase(), now);
    });
  }

  /**
   * Plan query execution
   */
  planQuery(sql: string, options?: QueryRouterOptions): QueryPlan {
    // Force primary if specified
    if (options?.forcePrimary) {
      return { target: 'primary', reason: 'Forced to primary' };
    }

    // Check if query is read-only
    if (!this.isReadOnlyQuery(sql)) {
      return { target: 'primary', reason: 'Write operation' };
    }

    // Force replica if specified
    if (options?.forceReplica) {
      return { 
        target: 'replica', 
        region: options.preferredRegion,
        reason: 'Forced to replica' 
      };
    }

    // Check replica availability
    const stats = readReplicaManager.getStatistics();
    if (stats.healthy === 0) {
      return { target: 'primary', reason: 'No healthy replicas' };
    }

    // Strong consistency required
    if (options?.consistency === 'strong') {
      return { target: 'primary', reason: 'Strong consistency required' };
    }

    // Check data freshness
    const tables = this.extractTableNames(sql);
    const maxStaleness = options?.maxStaleness || this.defaultMaxStaleness;
    
    if (!this.isDataFresh(tables, maxStaleness)) {
      return { target: 'primary', reason: 'Recent write detected' };
    }

    // Use replica
    return { 
      target: 'replica', 
      region: options?.preferredRegion,
      reason: 'Read query with acceptable staleness' 
    };
  }

  /**
   * Execute a query with smart routing
   */
  async execute<T = any>(
    sql: string,
    params?: any[],
    options?: QueryRouterOptions
  ): Promise<T[]> {
    const plan = this.planQuery(sql, options);
    
    console.log(`Query routing: ${plan.target} (${plan.reason})`);
    
    if (plan.target === 'replica') {
      try {
        return await queryReadReplica<T>(sql, params, {
          preferredRegion: plan.region,
          fallbackToPrimary: !options?.forceReplica,
        });
      } catch (error) {
        if (!options?.forceReplica) {
          console.warn('Replica query failed, falling back to primary');
          return primaryQuery<T>(sql, params);
        }
        throw error;
      }
    }
    
    // Execute on primary
    const result = await primaryQuery<T>(sql, params);
    
    // Record write if it's not a SELECT
    if (!this.isReadOnlyQuery(sql)) {
      const tables = this.extractTableNames(sql);
      this.recordWrite(tables);
    }
    
    return result;
  }
}

// Global query router instance
export const queryRouter = new QueryRouter();

/**
 * Create a Supabase client with automatic read/write splitting
 */
export function createSmartSupabaseClient(): SupabaseClient<Database> {
  const primaryClient = getPooledClient();
  
  // Create a proxy that intercepts queries
  return new Proxy(primaryClient, {
    get(target, prop) {
      if (prop === 'from') {
        return (table: string) => {
          const queryBuilder = target.from(table);
          
          // Intercept select to use replicas
          const originalSelect = queryBuilder.select.bind(queryBuilder);
          queryBuilder.select = function(...args: any[]) {
            // Check if a read replica is available
            const replicaClient = createReadReplicaClient();
            if (replicaClient) {
              console.log(`Routing SELECT on ${table} to read replica`);
              return replicaClient.from(table).select(...args);
            }
            
            // Fall back to primary
            return originalSelect(...args);
          };
          
          // Record writes for insert, update, upsert, delete
          const wrapWriteMethod = (methodName: string) => {
            const original = queryBuilder[methodName].bind(queryBuilder);
            queryBuilder[methodName] = function(...args: any[]) {
              queryRouter.recordWrite([table]);
              return original(...args);
            };
          };
          
          ['insert', 'update', 'upsert', 'delete'].forEach(wrapWriteMethod);
          
          return queryBuilder;
        };
      }
      
      return target[prop as keyof typeof target];
    },
  });
}

/**
 * Middleware to add query routing hints to Supabase requests
 */
export function addQueryRoutingHeaders(
  headers: Record<string, string>,
  options?: QueryRouterOptions
): Record<string, string> {
  const routingHeaders = { ...headers };
  
  if (options?.preferReplica) {
    routingHeaders['x-prefer-replica'] = 'true';
  }
  
  if (options?.preferredRegion) {
    routingHeaders['x-preferred-region'] = options.preferredRegion;
  }
  
  if (options?.consistency) {
    routingHeaders['x-consistency'] = options.consistency;
  }
  
  if (options?.maxStaleness) {
    routingHeaders['x-max-staleness'] = options.maxStaleness.toString();
  }
  
  return routingHeaders;
}

/**
 * Helper to execute queries with routing
 */
export const smartQuery = {
  /**
   * Execute a read query (automatically uses replicas when possible)
   */
  async select<T = any>(
    sql: string,
    params?: any[],
    options?: QueryRouterOptions
  ): Promise<T[]> {
    return queryRouter.execute<T>(sql, params, {
      ...options,
      preferReplica: true,
    });
  },

  /**
   * Execute a write query (always uses primary)
   */
  async mutate<T = any>(
    sql: string,
    params?: any[],
    options?: Omit<QueryRouterOptions, 'preferReplica' | 'forceReplica'>
  ): Promise<T[]> {
    return queryRouter.execute<T>(sql, params, {
      ...options,
      forcePrimary: true,
    });
  },

  /**
   * Execute a transaction (always uses primary)
   */
  async transaction<T>(
    callback: (client: any) => Promise<T>
  ): Promise<T> {
    return transaction(callback);
  },

  /**
   * Get current replica statistics
   */
  getStats() {
    return readReplicaManager.getStatistics();
  },
};