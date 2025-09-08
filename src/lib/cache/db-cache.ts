import { cache } from './service';
import { cacheConfig, cacheKeys } from './config';

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
  cached?: boolean;
}

/**
 * Database query caching
 */
export class DBCache {
  /**
   * Cache query results
   */
  async cacheQuery<T>(
    sql: string,
    params: any[] | undefined,
    result: T[],
    ttl?: number
  ): Promise<boolean> {
    const key = cacheKeys.db.query(sql, params);
    
    return cache.set(
      key,
      { rows: result, rowCount: result.length },
      {
        ttl: ttl || cacheConfig.ttl.dbQuery,
        compress: result.length > 10,
        tags: ['db-query'],
      }
    );
  }

  /**
   * Get cached query results
   */
  async getCachedQuery<T>(
    sql: string,
    params?: any[]
  ): Promise<QueryResult<T> | null> {
    const key = cacheKeys.db.query(sql, params);
    const cached = await cache.get<QueryResult<T>>(key);
    
    if (cached) {
      cached.cached = true;
      console.log(`✅ DB Cache hit for query: ${sql.substring(0, 50)}...`);
    }
    
    return cached;
  }

  /**
   * Cache or get query results
   */
  async queryWithCache<T>(
    sql: string,
    params: any[] | undefined,
    executor: () => Promise<T[]>,
    ttl?: number
  ): Promise<QueryResult<T>> {
    // Check cache first
    const cached = await this.getCachedQuery<T>(sql, params);
    if (cached) {
      return cached;
    }

    // Execute query
    const rows = await executor();
    
    // Cache the result
    await this.cacheQuery(sql, params, rows, ttl);
    
    return { rows, rowCount: rows.length };
  }

  /**
   * Cache entity by ID
   */
  async cacheEntity<T>(
    tableName: string,
    id: string,
    entity: T,
    ttl?: number
  ): Promise<boolean> {
    const key = cacheKeys.db.table(tableName, id);
    
    return cache.set(key, entity, {
      ttl: ttl || cacheConfig.ttl.dbQuery,
      tags: ['db-entity', `table:${tableName}`],
    });
  }

  /**
   * Get cached entity
   */
  async getCachedEntity<T>(
    tableName: string,
    id: string
  ): Promise<T | null> {
    const key = cacheKeys.db.table(tableName, id);
    return cache.get<T>(key);
  }

  /**
   * Cache aggregated data
   */
  async cacheAggregate<T>(
    name: string,
    params: Record<string, any>,
    data: T,
    ttl?: number
  ): Promise<boolean> {
    const key = cacheKeys.db.aggregate(name, params);
    
    return cache.set(key, data, {
      ttl: ttl || cacheConfig.ttl.dbAggregate,
      compress: true,
      tags: ['db-aggregate', `aggregate:${name}`],
    });
  }

  /**
   * Get cached aggregate
   */
  async getCachedAggregate<T>(
    name: string,
    params: Record<string, any>
  ): Promise<T | null> {
    const key = cacheKeys.db.aggregate(name, params);
    return cache.get<T>(key);
  }

  /**
   * Invalidate all queries for a table
   */
  async invalidateTable(tableName: string): Promise<number> {
    return cache.invalidateByTags([`table:${tableName}`]);
  }

  /**
   * Invalidate specific aggregate
   */
  async invalidateAggregate(name: string): Promise<number> {
    return cache.invalidateByTags([`aggregate:${name}`]);
  }

  /**
   * Clear all database cache
   */
  async clearAll(): Promise<number> {
    return cache.invalidateByTags(['db-query', 'db-entity', 'db-aggregate']);
  }

  /**
   * Invalidate related cache based on write operations
   */
  async invalidateOnWrite(tableName: string, operation: 'insert' | 'update' | 'delete'): Promise<void> {
    const patterns = cacheConfig.invalidation.patterns[tableName];
    
    if (patterns && cacheConfig.invalidation.onWrite) {
      for (const pattern of patterns) {
        await cache.deletePattern(pattern);
      }
    }
    
    // Always invalidate table-specific cache
    await this.invalidateTable(tableName);
  }
}

// Export singleton instance
export const dbCache = new DBCache();