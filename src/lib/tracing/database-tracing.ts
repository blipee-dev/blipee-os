/**
 * Database-specific Tracing
 * Phase 4, Task 4.2: Specialized tracing for database operations
 */

import { SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { tracer } from './tracer';
import type { Span } from '@opentelemetry/api';

/**
 * Trace database query
 */
export async function traceDatabaseQuery<T>(
  operation: string,
  query: string,
  fn: () => Promise<T>,
  options?: {
    table?: string;
    params?: any[];
    userId?: string;
    organizationId?: string;
  }
): Promise<T> {
  return tracer.startActiveSpan(
    `db.${operation.toLowerCase()}`,
    async (span) => {
      // Set standard database attributes
      span.setAttribute('db.system', 'postgresql');
      span.setAttribute('db.operation', operation.toUpperCase());
      span.setAttribute('db.statement', sanitizeQuery(query));
      
      // Set optional attributes
      if (options?.table) {
        span.setAttribute('db.sql.table', options.table);
      }
      if (options?.params && options.params.length > 0) {
        span.setAttribute('db.params.count', options.params.length);
      }
      if (options?.userId) {
        span.setAttribute('user.id', options.userId);
      }
      if (options?.organizationId) {
        span.setAttribute('organization.id', options.organizationId);
      }

      const startTime = Date.now();

      try {
        const result = await fn();
        
        const duration = Date.now() - startTime;
        span.setAttribute('db.duration_ms', duration);

        // Record row count if available
        if (result && typeof result === 'object') {
          if ('rowCount' in result) {
            span.setAttribute('db.rows_affected', (result as any).rowCount);
          }
          if ('rows' in result && Array.isArray((result as any).rows)) {
            span.setAttribute('db.rows_returned', (result as any).rows.length);
          }
        }

        // Flag slow queries
        if (duration > 1000) {
          span.addEvent('slow_query_detected', {
            duration,
            threshold: 1000,
            query: operation
          });
        }

        return result;
      } catch (error) {
        recordDatabaseError(span, error as Error, operation);
        throw error;
      }
    },
    { kind: SpanKind.CLIENT }
  );
}

/**
 * Trace database transaction
 */
export async function traceDatabaseTransaction<T>(
  transactionId: string,
  fn: () => Promise<T>,
  options?: {
    isolationLevel?: string;
    readOnly?: boolean;
  }
): Promise<T> {
  return tracer.startActiveSpan(
    'db.transaction',
    async (span) => {
      span.setAttribute('db.transaction.id', transactionId);
      
      if (options?.isolationLevel) {
        span.setAttribute('db.transaction.isolation_level', options.isolationLevel);
      }
      if (options?.readOnly !== undefined) {
        span.setAttribute('db.transaction.read_only', options.readOnly);
      }

      const startTime = Date.now();
      span.addEvent('transaction_started', { transaction_id: transactionId });

      try {
        const result = await fn();
        
        const duration = Date.now() - startTime;
        span.setAttribute('db.transaction.duration_ms', duration);
        span.addEvent('transaction_committed', {
          transaction_id: transactionId,
          duration
        });

        // Flag long-running transactions
        if (duration > 5000) {
          span.addEvent('long_transaction_detected', {
            duration,
            threshold: 5000,
            transaction_id: transactionId
          });
        }

        return result;
      } catch (error) {
        span.addEvent('transaction_rolled_back', {
          transaction_id: transactionId,
          error: (error as Error).message
        });
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: 'Transaction failed'
        });
        throw error;
      }
    },
    { kind: SpanKind.CLIENT }
  );
}

/**
 * Trace database connection pool
 */
export async function traceDatabasePool<T>(
  operation: 'acquire' | 'release' | 'create' | 'destroy',
  fn: () => Promise<T>,
  poolStats?: {
    total?: number;
    active?: number;
    idle?: number;
    waiting?: number;
  }
): Promise<T> {
  return tracer.startActiveSpan(
    `db.pool.${operation}`,
    async (span) => {
      span.setAttribute('db.pool.operation', operation);
      
      // Add pool statistics if available
      if (poolStats) {
        if (poolStats.total !== undefined) {
          span.setAttribute('db.pool.size', poolStats.total);
        }
        if (poolStats.active !== undefined) {
          span.setAttribute('db.pool.active', poolStats.active);
        }
        if (poolStats.idle !== undefined) {
          span.setAttribute('db.pool.idle', poolStats.idle);
        }
        if (poolStats.waiting !== undefined) {
          span.setAttribute('db.pool.waiting', poolStats.waiting);
        }
        
        // Calculate utilization
        if (poolStats.total && poolStats.active !== undefined) {
          const utilization = poolStats.active / poolStats.total;
          span.setAttribute('db.pool.utilization', utilization);
          
          // Flag high utilization
          if (utilization > 0.8) {
            span.addEvent('high_pool_utilization', {
              utilization,
              active: poolStats.active,
              total: poolStats.total
            });
          }
        }
      }

      try {
        const result = await fn();
        
        if (operation === 'acquire') {
          span.addEvent('connection_acquired');
        } else if (operation === 'release') {
          span.addEvent('connection_released');
        }

        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `Pool ${operation} failed`
        });
        throw error;
      }
    },
    { kind: SpanKind.CLIENT }
  );
}

/**
 * Trace Prisma operations
 */
export async function tracePrismaOperation<T>(
  model: string,
  operation: string,
  fn: () => Promise<T>,
  options?: {
    where?: any;
    data?: any;
    include?: any;
    select?: any;
  }
): Promise<T> {
  return tracer.startActiveSpan(
    `prisma.${model}.${operation}`,
    async (span) => {
      span.setAttribute('db.system', 'prisma');
      span.setAttribute('db.prisma.model', model);
      span.setAttribute('db.prisma.operation', operation);
      
      // Add query complexity indicators
      if (options?.include) {
        const includeKeys = Object.keys(options.include);
        span.setAttribute('db.prisma.include_count', includeKeys.length);
        span.setAttribute('db.prisma.includes', includeKeys.join(','));
      }
      
      if (options?.select) {
        const selectKeys = Object.keys(options.select);
        span.setAttribute('db.prisma.select_count', selectKeys.length);
      }

      const startTime = Date.now();

      try {
        const result = await fn();
        
        const duration = Date.now() - startTime;
        span.setAttribute('db.duration_ms', duration);

        // Record result count
        if (Array.isArray(result)) {
          span.setAttribute('db.result_count', result.length);
        }

        return result;
      } catch (error) {
        recordDatabaseError(span, error as Error, `${model}.${operation}`);
        throw error;
      }
    },
    { kind: SpanKind.CLIENT }
  );
}

/**
 * Trace batch database operations
 */
export async function traceBatchOperation<T>(
  operation: string,
  batchSize: number,
  fn: () => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(
    `db.batch.${operation}`,
    async (span) => {
      span.setAttribute('db.batch.operation', operation);
      span.setAttribute('db.batch.size', batchSize);

      const startTime = Date.now();

      try {
        const result = await fn();
        
        const duration = Date.now() - startTime;
        span.setAttribute('db.batch.duration_ms', duration);
        span.setAttribute('db.batch.throughput', batchSize / (duration / 1000));

        span.addEvent('batch_completed', {
          operation,
          batch_size: batchSize,
          duration
        });

        return result;
      } catch (error) {
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `Batch ${operation} failed`
        });
        throw error;
      }
    },
    { kind: SpanKind.CLIENT }
  );
}

/**
 * Record database-specific errors
 */
function recordDatabaseError(span: Span, error: Error, operation: string): void {
  span.recordException(error);
  
  // Determine error type based on error code or message
  let errorType = 'unknown';
  let isRetryable = false;
  
  const errorMessage = error.message.toLowerCase();
  const errorCode = (error as any).code;
  
  // PostgreSQL error codes
  if (errorCode) {
    switch (errorCode) {
      case '23505': // unique_violation
        errorType = 'unique_constraint_violation';
        isRetryable = false;
        break;
      case '23503': // foreign_key_violation
        errorType = 'foreign_key_violation';
        isRetryable = false;
        break;
      case '40001': // serialization_failure
        errorType = 'serialization_failure';
        isRetryable = true;
        break;
      case '40P01': // deadlock_detected
        errorType = 'deadlock';
        isRetryable = true;
        break;
      case '53300': // too_many_connections
        errorType = 'connection_limit_exceeded';
        isRetryable = true;
        break;
      case '57014': // query_canceled
        errorType = 'query_timeout';
        isRetryable = true;
        break;
    }
  } else if (errorMessage.includes('timeout')) {
    errorType = 'timeout';
    isRetryable = true;
  } else if (errorMessage.includes('connection')) {
    errorType = 'connection_error';
    isRetryable = true;
  }

  span.setAttribute('db.error.type', errorType);
  span.setAttribute('db.error.retryable', isRetryable);
  span.setAttribute('db.error.operation', operation);
  
  if (errorCode) {
    span.setAttribute('db.error.code', errorCode);
  }
  
  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: error.message
  });

  span.addEvent('database_error', {
    error_type: errorType,
    operation,
    retryable: isRetryable,
    message: error.message,
    code: errorCode
  });
}

/**
 * Sanitize query for tracing
 */
function sanitizeQuery(query: string): string {
  // Remove sensitive data patterns
  let sanitized = query;
  
  // Replace string literals
  sanitized = sanitized.replace(/'[^']*'/g, "'?'");
  
  // Replace numeric literals in common patterns
  sanitized = sanitized.replace(/=\s*\d+/g, '= ?');
  sanitized = sanitized.replace(/IN\s*\([^)]+\)/gi, 'IN (?)');
  
  // Truncate very long queries
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000) + '...';
  }
  
  return sanitized;
}