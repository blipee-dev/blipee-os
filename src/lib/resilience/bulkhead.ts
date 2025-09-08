/**
 * Bulkhead Pattern Implementation
 * Phase 4, Task 4.3: Resource isolation and concurrent request limiting
 */

import { EventEmitter } from 'events';
import { logger } from '@/lib/logging';
import { tracer } from '@/lib/tracing';

/**
 * Bulkhead configuration
 */
export interface BulkheadConfig {
  name: string;
  maxConcurrent: number;      // Max concurrent executions
  maxQueueSize: number;       // Max queued requests
  timeout?: number;           // Queue timeout (ms)
  onReject?: (reason: string) => void;
}

/**
 * Queued execution request
 */
interface QueuedExecution<T> {
  id: string;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
  timestamp: number;
  timeout?: NodeJS.Timeout;
}

/**
 * Bulkhead metrics
 */
export interface BulkheadMetrics {
  active: number;
  queued: number;
  completed: number;
  rejected: number;
  timeouts: number;
  errors: number;
  avgExecutionTime: number;
}

/**
 * Bulkhead implementation for resource isolation
 */
export class Bulkhead extends EventEmitter {
  private config: BulkheadConfig;
  private activeCount = 0;
  private queue: QueuedExecution<any>[] = [];
  private metrics: BulkheadMetrics = {
    active: 0,
    queued: 0,
    completed: 0,
    rejected: 0,
    timeouts: 0,
    errors: 0,
    avgExecutionTime: 0
  };
  private executionTimes: number[] = [];

  constructor(config: BulkheadConfig) {
    super();
    this.config = config;

    logger.info('Bulkhead initialized', {
      name: config.name,
      maxConcurrent: config.maxConcurrent,
      maxQueueSize: config.maxQueueSize
    });
  }

  /**
   * Execute function with bulkhead protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return tracer.startActiveSpan(
      `bulkhead.${this.config.name}`,
      async (span) => {
        span.setAttribute('bulkhead.name', this.config.name);
        span.setAttribute('bulkhead.active', this.activeCount);
        span.setAttribute('bulkhead.queued', this.queue.length);

        // Check if we can execute immediately
        if (this.activeCount < this.config.maxConcurrent) {
          return this.executeNow(fn, span);
        }

        // Check if queue is full
        if (this.queue.length >= this.config.maxQueueSize) {
          this.metrics.rejected++;
          
          span.setAttribute('bulkhead.rejected', true);
          span.setAttribute('bulkhead.reject_reason', 'queue_full');
          span.addEvent('bulkhead_rejected', {
            reason: 'queue_full',
            queue_size: this.queue.length
          });

          const error = new Error(`Bulkhead queue full for ${this.config.name}`);
          (error as any).code = 'BULKHEAD_QUEUE_FULL';

          if (this.config.onReject) {
            this.config.onReject('queue_full');
          }

          this.emit('rejected', {
            name: this.config.name,
            reason: 'queue_full',
            queueSize: this.queue.length
          });

          logger.warn('Bulkhead rejected execution - queue full', {
            name: this.config.name,
            queueSize: this.queue.length,
            maxQueueSize: this.config.maxQueueSize
          });

          throw error;
        }

        // Queue the execution
        return this.queueExecution(fn, span);
      }
    );
  }

  /**
   * Execute immediately
   */
  private async executeNow<T>(
    fn: () => Promise<T>,
    span: any
  ): Promise<T> {
    this.activeCount++;
    this.metrics.active = this.activeCount;
    
    span.setAttribute('bulkhead.execution', 'immediate');
    span.addEvent('bulkhead_execution_started', {
      active: this.activeCount
    });

    this.emit('executionStarted', {
      name: this.config.name,
      active: this.activeCount,
      queued: this.queue.length
    });

    const startTime = Date.now();

    try {
      const result = await fn();
      
      const duration = Date.now() - startTime;
      this.recordExecutionTime(duration);
      this.metrics.completed++;

      span.setAttribute('bulkhead.execution_time', duration);
      span.addEvent('bulkhead_execution_completed', {
        duration,
        active: this.activeCount - 1
      });

      return result;

    } catch (error) {
      this.metrics.errors++;
      
      span.recordException(error as Error);
      span.addEvent('bulkhead_execution_failed', {
        error: (error as Error).message
      });

      throw error;

    } finally {
      this.activeCount--;
      this.metrics.active = this.activeCount;

      this.emit('executionCompleted', {
        name: this.config.name,
        active: this.activeCount,
        queued: this.queue.length
      });

      // Process next in queue
      this.processQueue();
    }
  }

  /**
   * Queue execution for later
   */
  private queueExecution<T>(
    fn: () => Promise<T>,
    span: any
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const execution: QueuedExecution<T> = {
        id: crypto.randomUUID(),
        fn,
        resolve,
        reject,
        timestamp: Date.now()
      };

      // Set timeout if configured
      if (this.config.timeout) {
        execution.timeout = setTimeout(() => {
          this.handleQueueTimeout(execution);
        }, this.config.timeout);
      }

      this.queue.push(execution);
      this.metrics.queued = this.queue.length;

      span.setAttribute('bulkhead.execution', 'queued');
      span.setAttribute('bulkhead.queue_position', this.queue.length);
      span.addEvent('bulkhead_queued', {
        queue_size: this.queue.length,
        position: this.queue.length
      });

      this.emit('queued', {
        name: this.config.name,
        queueSize: this.queue.length,
        executionId: execution.id
      });

      logger.debug('Bulkhead queued execution', {
        name: this.config.name,
        queueSize: this.queue.length,
        executionId: execution.id
      });
    });
  }

  /**
   * Process queued executions
   */
  private processQueue(): void {
    if (this.queue.length === 0 || this.activeCount >= this.config.maxConcurrent) {
      return;
    }

    const execution = this.queue.shift();
    if (!execution) {
      return;
    }

    this.metrics.queued = this.queue.length;

    // Clear timeout
    if (execution.timeout) {
      clearTimeout(execution.timeout);
    }

    // Calculate queue time
    const queueTime = Date.now() - execution.timestamp;

    logger.debug('Processing queued execution', {
      name: this.config.name,
      executionId: execution.id,
      queueTime
    });

    // Execute with new span
    tracer.startActiveSpan(
      `bulkhead.${this.config.name}.queued`,
      async (span) => {
        span.setAttribute('bulkhead.queue_time', queueTime);
        
        try {
          const result = await this.executeNow(execution.fn, span);
          execution.resolve(result);
        } catch (error) {
          execution.reject(error as Error);
        }
      }
    );
  }

  /**
   * Handle queue timeout
   */
  private handleQueueTimeout<T>(execution: QueuedExecution<T>): void {
    // Remove from queue
    const index = this.queue.findIndex(e => e.id === execution.id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.metrics.queued = this.queue.length;
      this.metrics.timeouts++;

      const error = new Error(`Bulkhead queue timeout for ${this.config.name}`);
      (error as any).code = 'BULKHEAD_QUEUE_TIMEOUT';

      execution.reject(error);

      this.emit('timeout', {
        name: this.config.name,
        executionId: execution.id,
        queueTime: Date.now() - execution.timestamp
      });

      logger.warn('Bulkhead queue timeout', {
        name: this.config.name,
        executionId: execution.id,
        timeout: this.config.timeout
      });
    }
  }

  /**
   * Record execution time for metrics
   */
  private recordExecutionTime(duration: number): void {
    this.executionTimes.push(duration);
    
    // Keep last 100 execution times
    if (this.executionTimes.length > 100) {
      this.executionTimes = this.executionTimes.slice(-100);
    }

    // Calculate average
    const sum = this.executionTimes.reduce((acc, time) => acc + time, 0);
    this.metrics.avgExecutionTime = Math.round(sum / this.executionTimes.length);
  }

  /**
   * Get current metrics
   */
  getMetrics(): Readonly<BulkheadMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get current state
   */
  getState(): {
    active: number;
    queued: number;
    available: number;
    queueAvailable: number;
  } {
    return {
      active: this.activeCount,
      queued: this.queue.length,
      available: this.config.maxConcurrent - this.activeCount,
      queueAvailable: this.config.maxQueueSize - this.queue.length
    };
  }

  /**
   * Check if bulkhead can accept more executions
   */
  canExecute(): boolean {
    return this.activeCount < this.config.maxConcurrent || 
           this.queue.length < this.config.maxQueueSize;
  }

  /**
   * Clear the queue
   */
  clearQueue(): void {
    const queueSize = this.queue.length;
    
    // Reject all queued executions
    this.queue.forEach(execution => {
      if (execution.timeout) {
        clearTimeout(execution.timeout);
      }

      const error = new Error(`Bulkhead queue cleared for ${this.config.name}`);
      (error as any).code = 'BULKHEAD_QUEUE_CLEARED';
      execution.reject(error);
    });

    this.queue = [];
    this.metrics.queued = 0;

    logger.warn('Bulkhead queue cleared', {
      name: this.config.name,
      clearedCount: queueSize
    });

    this.emit('queueCleared', {
      name: this.config.name,
      clearedCount: queueSize
    });
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      active: this.activeCount,
      queued: this.queue.length,
      completed: 0,
      rejected: 0,
      timeouts: 0,
      errors: 0,
      avgExecutionTime: 0
    };
    this.executionTimes = [];

    logger.info('Bulkhead metrics reset', {
      name: this.config.name
    });
  }
}

/**
 * Create a bulkhead with default config
 */
export function createBulkhead(
  name: string,
  maxConcurrent = 10,
  maxQueueSize = 100
): Bulkhead {
  return new Bulkhead({
    name,
    maxConcurrent,
    maxQueueSize,
    timeout: 30000 // 30 second default timeout
  });
}