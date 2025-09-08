/**
 * Retry Policy Implementation
 * Phase 4, Task 4.3: Configurable retry strategies
 */

import { logger } from '@/lib/logging';
import { tracer } from '@/lib/tracing';

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors?: string[] | ((error: Error) => boolean);
  onRetry?: (attempt: number, error: Error, delay: number) => void;
  timeout?: number;
  jitter?: boolean;
}

/**
 * Default retry configurations
 */
export const RetryPolicies = {
  /**
   * No retry
   */
  none: (): RetryConfig => ({
    maxAttempts: 1,
    initialDelay: 0,
    maxDelay: 0,
    backoffMultiplier: 1
  }),

  /**
   * Fixed delay between retries
   */
  fixed: (attempts = 3, delay = 1000): RetryConfig => ({
    maxAttempts: attempts,
    initialDelay: delay,
    maxDelay: delay,
    backoffMultiplier: 1
  }),

  /**
   * Exponential backoff
   */
  exponential: (attempts = 5, initialDelay = 100, maxDelay = 30000): RetryConfig => ({
    maxAttempts: attempts,
    initialDelay,
    maxDelay,
    backoffMultiplier: 2,
    jitter: true
  }),

  /**
   * Linear backoff
   */
  linear: (attempts = 4, initialDelay = 500, increment = 500): RetryConfig => ({
    maxAttempts: attempts,
    initialDelay,
    maxDelay: initialDelay + (increment * attempts),
    backoffMultiplier: 1 + (increment / initialDelay)
  }),

  /**
   * API rate limit policy
   */
  apiRateLimit: (): RetryConfig => ({
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 60000,
    backoffMultiplier: 2,
    jitter: true,
    retryableErrors: ['RATE_LIMIT', 'TOO_MANY_REQUESTS', '429']
  }),

  /**
   * Network error policy
   */
  network: (): RetryConfig => ({
    maxAttempts: 5,
    initialDelay: 500,
    maxDelay: 10000,
    backoffMultiplier: 1.5,
    jitter: true,
    retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'ECONNREFUSED', 'ENOTFOUND']
  })
};

/**
 * Retry executor
 */
export class RetryExecutor {
  private config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = config;
  }

  /**
   * Execute function with retry policy
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: { operation?: string; metadata?: Record<string, any> }
  ): Promise<T> {
    return tracer.startActiveSpan(
      `retry.${context?.operation || 'execute'}`,
      async (span) => {
        span.setAttribute('retry.max_attempts', this.config.maxAttempts);
        span.setAttribute('retry.policy', this.getBackoffType());

        let lastError: Error | undefined;
        let delay = this.config.initialDelay;

        for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
          try {
            span.setAttribute('retry.attempt', attempt);

            // Add timeout if configured
            const operation = this.config.timeout
              ? this.withTimeout(fn(), this.config.timeout)
              : fn();

            const result = await operation;

            if (attempt > 1) {
              logger.info('Retry succeeded', {
                operation: context?.operation,
                attempt,
                totalAttempts: attempt,
                ...context?.metadata
              });

              span.addEvent('retry_succeeded', {
                attempt,
                total_delay: delay
              });
            }

            return result;

          } catch (error) {
            lastError = error as Error;

            span.recordException(lastError);
            span.addEvent('retry_attempt_failed', {
              attempt,
              error: lastError.message,
              error_code: (lastError as any).code
            });

            // Check if error is retryable
            if (!this.isRetryable(lastError)) {
              logger.warn('Error is not retryable', {
                operation: context?.operation,
                error: lastError.message,
                errorCode: (lastError as any).code,
                attempt
              });

              span.setAttribute('retry.retryable', false);
              break;
            }

            // Check if we have more attempts
            if (attempt >= this.config.maxAttempts) {
              logger.error('Retry policy exhausted', lastError, {
                operation: context?.operation,
                attempts: attempt,
                ...context?.metadata
              });

              span.setAttribute('retry.exhausted', true);
              break;
            }

            // Calculate next delay
            delay = this.calculateDelay(attempt, delay);

            // Call retry callback if provided
            if (this.config.onRetry) {
              this.config.onRetry(attempt, lastError, delay);
            }

            logger.warn('Retrying after error', {
              operation: context?.operation,
              attempt,
              nextAttempt: attempt + 1,
              delay,
              error: lastError.message,
              ...context?.metadata
            });

            span.addEvent('retry_scheduled', {
              attempt: attempt + 1,
              delay
            });

            // Wait before retry
            await this.sleep(delay);
          }
        }

        // All retries exhausted
        span.setAttribute('retry.final_error', lastError?.message || 'Unknown error');
        throw lastError || new Error('Retry failed with unknown error');
      }
    );
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: Error): boolean {
    if (!this.config.retryableErrors) {
      // Default: retry on common transient errors
      const code = (error as any).code;
      const message = error.message.toLowerCase();
      
      return (
        code === 'ETIMEDOUT' ||
        code === 'ECONNRESET' ||
        code === 'ENOTFOUND' ||
        code === 'ECONNREFUSED' ||
        message.includes('timeout') ||
        message.includes('rate limit') ||
        message.includes('temporarily')
      );
    }

    if (typeof this.config.retryableErrors === 'function') {
      return this.config.retryableErrors(error);
    }

    const errorCode = (error as any).code || '';
    const errorMessage = error.message;

    return this.config.retryableErrors.some(retryable => 
      errorCode === retryable ||
      errorMessage.includes(retryable)
    );
  }

  /**
   * Calculate delay for next retry
   */
  private calculateDelay(attempt: number, currentDelay: number): number {
    let delay = currentDelay * this.config.backoffMultiplier;

    // Apply max delay cap
    delay = Math.min(delay, this.config.maxDelay);

    // Apply jitter if enabled
    if (this.config.jitter) {
      const jitter = delay * 0.2 * Math.random(); // 20% jitter
      delay = delay + jitter;
    }

    return Math.floor(delay);
  }

  /**
   * Get backoff type for logging
   */
  private getBackoffType(): string {
    if (this.config.backoffMultiplier === 1) {
      return 'fixed';
    } else if (this.config.backoffMultiplier === 2) {
      return 'exponential';
    } else {
      return 'custom';
    }
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add timeout to a promise
   */
  private withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          const error = new Error(`Operation timed out after ${timeout}ms`);
          (error as any).code = 'TIMEOUT';
          reject(error);
        }, timeout);
      })
    ]);
  }
}

/**
 * Execute with retry using a specific policy
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig,
  context?: { operation?: string; metadata?: Record<string, any> }
): Promise<T> {
  const executor = new RetryExecutor(config);
  return executor.execute(fn, context);
}

/**
 * Decorator for retry policy
 */
export function WithRetry(config: RetryConfig | (() => RetryConfig)) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const retryConfig = typeof config === 'function' ? config() : config;
      
      return executeWithRetry(
        () => originalMethod.apply(this, args),
        retryConfig,
        {
          operation: `${target.constructor.name}.${propertyKey}`
        }
      );
    };

    return descriptor;
  };
}

/**
 * Create a retryable function
 */
export function makeRetryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  config: RetryConfig
): T {
  return (async (...args: Parameters<T>) => {
    return executeWithRetry(
      () => fn(...args),
      config,
      {
        operation: fn.name || 'anonymous'
      }
    );
  }) as T;
}