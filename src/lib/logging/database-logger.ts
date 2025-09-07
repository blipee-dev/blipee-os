/**
 * Database Query Logger
 * Phase 4, Task 4.1: Structured logging for database operations
 */

import { logger } from './structured-logger';
import { SupabaseClient } from '@supabase/supabase-js';

export interface QueryLogContext {
  table?: string;
  operation?: 'select' | 'insert' | 'update' | 'delete' | 'rpc';
  filters?: Record<string, any>;
  data?: Record<string, any>;
  error?: any;
  duration?: number;
  rowCount?: number;
  query?: string;
}

/**
 * Redact sensitive data from queries
 */
function redactQueryData(data: any): any {
  if (!data) return data;
  
  const sensitiveFields = ['password', 'token', 'secret', 'api_key', 'private_key'];
  
  if (typeof data === 'object' && !Array.isArray(data)) {
    const redacted = { ...data };
    
    Object.keys(redacted).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object') {
        redacted[key] = redactQueryData(redacted[key]);
      }
    });
    
    return redacted;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => redactQueryData(item));
  }
  
  return data;
}

/**
 * Create a logged Supabase client wrapper
 */
export function createLoggedSupabaseClient(client: SupabaseClient): SupabaseClient {
  // Create a proxy to intercept all method calls
  return new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      
      // Only wrap the main query methods
      if (['from', 'rpc'].includes(String(prop))) {
        return function(...args: any[]) {
          const result = value.apply(target, args);
          return wrapQueryBuilder(result, String(prop), args[0]);
        };
      }
      
      return value;
    }
  });
}

/**
 * Wrap a query builder to add logging
 */
function wrapQueryBuilder(builder: any, method: string, tableOrFunction: string): any {
  const queryContext: QueryLogContext = {
    table: tableOrFunction,
    operation: method === 'rpc' ? 'rpc' : undefined
  };
  
  return new Proxy(builder, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      
      if (typeof value !== 'function') return value;
      
      // Track query building
      return function(...args: any[]) {
        // Update context based on method
        switch (String(prop)) {
          case 'select':
            queryContext.operation = 'select';
            queryContext.query = args[0] || '*';
            break;
          case 'insert':
            queryContext.operation = 'insert';
            queryContext.data = redactQueryData(args[0]);
            break;
          case 'update':
            queryContext.operation = 'update';
            queryContext.data = redactQueryData(args[0]);
            break;
          case 'delete':
            queryContext.operation = 'delete';
            break;
          case 'eq':
          case 'neq':
          case 'gt':
          case 'gte':
          case 'lt':
          case 'lte':
          case 'like':
          case 'ilike':
          case 'in':
            if (!queryContext.filters) queryContext.filters = {};
            queryContext.filters[`${args[0]}.${String(prop)}`] = args[1];
            break;
        }
        
        const result = value.apply(target, args);
        
        // If this returns a promise (terminal operation), log it
        if (result && typeof result.then === 'function') {
          return logDatabaseOperation(result, queryContext);
        }
        
        // Otherwise, continue building
        return wrapQueryBuilder(result, method, tableOrFunction);
      };
    }
  });
}

/**
 * Log a database operation
 */
async function logDatabaseOperation(
  promise: Promise<any>,
  context: QueryLogContext
): Promise<any> {
  const startTime = Date.now();
  const dbLogger = logger.child({
    component: 'database',
    table: context.table,
    operation: context.operation
  });
  
  try {
    dbLogger.debug(`Database ${context.operation} on ${context.table}`, {
      filters: context.filters,
      data: context.data,
      query: context.query
    });
    
    const result = await promise;
    const duration = Date.now() - startTime;
    
    // Extract row count
    let rowCount = 0;
    if (result.data) {
      rowCount = Array.isArray(result.data) ? result.data.length : 1;
    }
    
    dbLogger.info(`Database ${context.operation} completed`, {
      table: context.table,
      duration,
      rowCount,
      success: !result.error,
      error: result.error
    });
    
    // Log slow queries
    if (duration > 100) {
      dbLogger.warn(`Slow query detected on ${context.table}`, {
        operation: context.operation,
        duration,
        threshold: 100,
        filters: context.filters
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    dbLogger.error(
      `Database ${context.operation} failed on ${context.table}`,
      error as Error,
      {
        duration,
        filters: context.filters,
        data: context.data
      }
    );
    
    throw error;
  }
}

/**
 * Log a raw SQL query
 */
export async function logRawQuery(
  queryFn: () => Promise<any>,
  query: string,
  params?: any[]
): Promise<any> {
  const startTime = Date.now();
  const dbLogger = logger.child({
    component: 'database',
    operation: 'raw_query'
  });
  
  // Redact sensitive parameters
  const sanitizedQuery = query.replace(/password\s*=\s*'[^']*'/gi, "password='[REDACTED]'");
  const sanitizedParams = params ? redactQueryData(params) : undefined;
  
  try {
    dbLogger.debug('Executing raw SQL query', {
      query: sanitizedQuery,
      params: sanitizedParams
    });
    
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    dbLogger.info('Raw SQL query completed', {
      duration,
      rowCount: Array.isArray(result) ? result.length : undefined,
      success: true
    });
    
    if (duration > 200) {
      dbLogger.warn('Slow raw query detected', {
        duration,
        threshold: 200,
        query: sanitizedQuery
      });
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    dbLogger.error(
      'Raw SQL query failed',
      error as Error,
      {
        duration,
        query: sanitizedQuery,
        params: sanitizedParams
      }
    );
    
    throw error;
  }
}

/**
 * Database transaction logger
 */
export async function logTransaction<T>(
  transactionFn: () => Promise<T>,
  transactionName: string
): Promise<T> {
  const startTime = Date.now();
  const txLogger = logger.child({
    component: 'database',
    transaction: transactionName
  });
  
  try {
    txLogger.info(`Starting transaction: ${transactionName}`);
    
    const result = await transactionFn();
    const duration = Date.now() - startTime;
    
    txLogger.info(`Transaction completed: ${transactionName}`, {
      duration,
      success: true
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    txLogger.error(
      `Transaction failed: ${transactionName}`,
      error as Error,
      {
        duration,
        success: false
      }
    );
    
    throw error;
  }
}

/**
 * Connection pool monitoring
 */
export class ConnectionPoolLogger {
  private poolName: string;
  private poolLogger: any;
  
  constructor(poolName: string) {
    this.poolName = poolName;
    this.poolLogger = logger.child({
      component: 'database',
      pool: poolName
    });
  }
  
  logConnection(event: 'acquire' | 'release' | 'create' | 'destroy', metadata?: any): void {
    this.poolLogger.debug(`Connection pool ${event}: ${this.poolName}`, metadata);
  }
  
  logPoolStats(stats: {
    total: number;
    active: number;
    idle: number;
    waiting: number;
  }): void {
    this.poolLogger.info(`Connection pool stats: ${this.poolName}`, stats);
    
    // Warn if pool is exhausted
    if (stats.waiting > 0 && stats.idle === 0) {
      this.poolLogger.warn(`Connection pool exhausted: ${this.poolName}`, stats);
    }
  }
  
  logError(error: Error, context?: any): void {
    this.poolLogger.error(
      `Connection pool error: ${this.poolName}`,
      error,
      context
    );
  }
}