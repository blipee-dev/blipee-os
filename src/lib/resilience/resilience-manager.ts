/**
 * Resilience Manager
 * Phase 4, Task 4.3: Unified resilience patterns management
 */

import { CircuitBreaker, CircuitBreakerConfig, createCircuitBreaker } from './circuit-breaker';
import { circuitBreakerRegistry } from './circuit-breaker-registry';
import { RetryConfig, RetryExecutor, RetryPolicies } from './retry-policy';
import { TimeoutConfig, timeoutManager } from './timeout-manager';
import { Bulkhead, BulkheadConfig, createBulkhead } from './bulkhead';
import { logger } from '@/lib/logging';
import { tracer } from '@/lib/tracing';

/**
 * Resilience configuration for an operation
 */
export interface ResilienceConfig {
  circuitBreaker?: Partial<CircuitBreakerConfig> | boolean;
  retry?: RetryConfig | boolean;
  timeout?: TimeoutConfig | number | boolean;
  bulkhead?: Partial<BulkheadConfig> | boolean;
  fallback?: () => any;
}

/**
 * Resilience policy presets
 */
export const ResiliencePolicies = {
  /**
   * Default policy for API calls
   */
  api: (): ResilienceConfig => ({
    circuitBreaker: {
      failureThreshold: 5,
      resetTimeout: 60000
    },
    retry: RetryPolicies.exponential(3, 1000),
    timeout: 30000,
    bulkhead: {
      maxConcurrent: 50,
      maxQueueSize: 100
    }
  }),

  /**
   * Policy for AI operations
   */
  ai: (): ResilienceConfig => ({
    circuitBreaker: {
      failureThreshold: 3,
      resetTimeout: 120000,
      timeout: 120000
    },
    retry: {
      maxAttempts: 3,
      initialDelay: 2000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      retryableErrors: ['RATE_LIMIT', 'TIMEOUT', '429', '503']
    },
    timeout: 120000,
    bulkhead: {
      maxConcurrent: 10,
      maxQueueSize: 50
    }
  }),

  /**
   * Policy for database operations
   */
  database: (): ResilienceConfig => ({
    circuitBreaker: {
      failureThreshold: 10,
      resetTimeout: 30000
    },
    retry: RetryPolicies.exponential(3, 500),
    timeout: 30000,
    bulkhead: {
      maxConcurrent: 100,
      maxQueueSize: 200
    }
  }),

  /**
   * Policy for external services
   */
  external: (): ResilienceConfig => ({
    circuitBreaker: {
      failureThreshold: 5,
      failureRateThreshold: 0.5,
      resetTimeout: 60000
    },
    retry: RetryPolicies.network(),
    timeout: 15000,
    bulkhead: {
      maxConcurrent: 20,
      maxQueueSize: 50
    }
  }),

  /**
   * Policy for critical operations (no circuit breaker)
   */
  critical: (): ResilienceConfig => ({
    retry: RetryPolicies.exponential(5, 1000),
    timeout: 60000,
    bulkhead: {
      maxConcurrent: 5,
      maxQueueSize: 10
    }
  })
};

/**
 * Unified resilience manager
 */
export class ResilienceManager {
  private static instance: ResilienceManager;
  private bulkheads: Map<string, Bulkhead> = new Map();

  private constructor() {}

  static getInstance(): ResilienceManager {
    if (!ResilienceManager.instance) {
      ResilienceManager.instance = new ResilienceManager();
    }
    return ResilienceManager.instance;
  }

  /**
   * Execute with full resilience protection
   */
  async execute<T>(
    name: string,
    fn: () => Promise<T>,
    config: ResilienceConfig
  ): Promise<T> {
    return tracer.startActiveSpan(
      `resilience.${name}`,
      async (span) => {
        span.setAttribute('resilience.operation', name);

        let operation = fn;

        // Apply timeout
        if (config.timeout) {
          const timeoutConfig = this.resolveTimeout(config.timeout);
          operation = this.wrapWithTimeout(operation, timeoutConfig, name);
          span.setAttribute('resilience.timeout', timeoutConfig.timeout);
        }

        // Apply bulkhead
        if (config.bulkhead) {
          const bulkheadConfig = this.resolveBulkhead(name, config.bulkhead);
          operation = this.wrapWithBulkhead(operation, bulkheadConfig);
          span.setAttribute('resilience.bulkhead', bulkheadConfig.name);
        }

        // Apply retry
        if (config.retry) {
          const retryConfig = this.resolveRetry(config.retry);
          operation = this.wrapWithRetry(operation, retryConfig, name);
          span.setAttribute('resilience.retry.enabled', true);
          span.setAttribute('resilience.retry.max_attempts', retryConfig.maxAttempts);
        }

        // Apply circuit breaker
        if (config.circuitBreaker) {
          const breakerConfig = this.resolveCircuitBreaker(name, config.circuitBreaker);
          operation = this.wrapWithCircuitBreaker(operation, breakerConfig);
          span.setAttribute('resilience.circuit_breaker', breakerConfig.name);
        }

        try {
          const result = await operation();
          
          span.addEvent('resilience_success', {
            operation: name
          });

          return result;

        } catch (error) {
          span.recordException(error as Error);
          
          // Use fallback if available
          if (config.fallback) {
            logger.info('Using resilience fallback', {
              operation: name,
              error: (error as Error).message
            });

            span.addEvent('resilience_fallback_used', {
              error: (error as Error).message
            });

            return config.fallback() as T;
          }

          throw error;
        }
      }
    );
  }

  /**
   * Wrap with timeout
   */
  private wrapWithTimeout<T>(
    fn: () => Promise<T>,
    config: TimeoutConfig,
    operation: string
  ): () => Promise<T> {
    return async () => {
      const { withTimeout } = await import('./timeout-manager');
      return withTimeout(fn, config, operation);
    };
  }

  /**
   * Wrap with bulkhead
   */
  private wrapWithBulkhead<T>(
    fn: () => Promise<T>,
    config: BulkheadConfig
  ): () => Promise<T> {
    const bulkhead = this.getOrCreateBulkhead(config);
    return () => bulkhead.execute(fn);
  }

  /**
   * Wrap with retry
   */
  private wrapWithRetry<T>(
    fn: () => Promise<T>,
    config: RetryConfig,
    operation: string
  ): () => Promise<T> {
    return async () => {
      const executor = new RetryExecutor(config);
      return executor.execute(fn, { operation });
    };
  }

  /**
   * Wrap with circuit breaker
   */
  private wrapWithCircuitBreaker<T>(
    fn: () => Promise<T>,
    config: CircuitBreakerConfig
  ): () => Promise<T> {
    const breaker = circuitBreakerRegistry.getOrCreate(
      config.name,
      () => config
    );
    return () => breaker.execute(fn);
  }

  /**
   * Resolve timeout configuration
   */
  private resolveTimeout(config: TimeoutConfig | number | boolean): TimeoutConfig {
    if (typeof config === 'boolean') {
      return { timeout: 30000 }; // Default 30s
    }
    if (typeof config === 'number') {
      return { timeout: config };
    }
    return config;
  }

  /**
   * Resolve bulkhead configuration
   */
  private resolveBulkhead(name: string, config: Partial<BulkheadConfig> | boolean): BulkheadConfig {
    if (typeof config === 'boolean') {
      return {
        name,
        maxConcurrent: 10,
        maxQueueSize: 100
      };
    }
    return {
      name: config.name || name,
      maxConcurrent: config.maxConcurrent || 10,
      maxQueueSize: config.maxQueueSize || 100,
      timeout: config.timeout,
      onReject: config.onReject
    };
  }

  /**
   * Resolve retry configuration
   */
  private resolveRetry(config: RetryConfig | boolean): RetryConfig {
    if (typeof config === 'boolean') {
      return RetryPolicies.exponential();
    }
    return config;
  }

  /**
   * Resolve circuit breaker configuration
   */
  private resolveCircuitBreaker(
    name: string,
    config: Partial<CircuitBreakerConfig> | boolean
  ): CircuitBreakerConfig {
    if (typeof config === 'boolean') {
      return {
        name,
        failureThreshold: 5,
        failureRateThreshold: 0.5,
        successThreshold: 5,
        timeout: 3000,
        resetTimeout: 60000,
        volumeThreshold: 10
      };
    }
    return {
      name: config.name || name,
      failureThreshold: config.failureThreshold || 5,
      failureRateThreshold: config.failureRateThreshold || 0.5,
      successThreshold: config.successThreshold || 5,
      timeout: config.timeout || 3000,
      resetTimeout: config.resetTimeout || 60000,
      volumeThreshold: config.volumeThreshold || 10,
      slowCallDurationThreshold: config.slowCallDurationThreshold,
      slowCallRateThreshold: config.slowCallRateThreshold
    };
  }

  /**
   * Get or create bulkhead
   */
  private getOrCreateBulkhead(config: BulkheadConfig): Bulkhead {
    const existing = this.bulkheads.get(config.name);
    if (existing) {
      return existing;
    }

    const bulkhead = new Bulkhead(config);
    this.bulkheads.set(config.name, bulkhead);
    return bulkhead;
  }

  /**
   * Get health status of all resilience components
   */
  getHealthStatus(): {
    circuitBreakers: ReturnType<typeof circuitBreakerRegistry.getHealthStatus>;
    bulkheads: Array<{
      name: string;
      state: ReturnType<Bulkhead['getState']>;
      metrics: ReturnType<Bulkhead['getMetrics']>;
    }>;
    summary: {
      healthy: boolean;
      issues: string[];
    };
  } {
    const cbHealth = circuitBreakerRegistry.getHealthStatus();
    
    const bulkheads = Array.from(this.bulkheads.entries()).map(([name, bulkhead]) => ({
      name,
      state: bulkhead.getState(),
      metrics: bulkhead.getMetrics()
    }));

    const issues: string[] = [];

    // Check circuit breakers
    if (cbHealth.unhealthy > 0) {
      issues.push(`${cbHealth.unhealthy} circuit breakers are open`);
    }

    // Check bulkheads
    const congestedBulkheads = bulkheads.filter(b => 
      b.state.queued > b.state.queueAvailable * 0.8
    );
    if (congestedBulkheads.length > 0) {
      issues.push(`${congestedBulkheads.length} bulkheads are congested`);
    }

    return {
      circuitBreakers: cbHealth,
      bulkheads,
      summary: {
        healthy: issues.length === 0,
        issues
      }
    };
  }

  /**
   * Reset all resilience components
   */
  resetAll(): void {
    logger.warn('Resetting all resilience components');

    // Reset circuit breakers
    circuitBreakerRegistry.resetAll();

    // Clear bulkhead queues
    this.bulkheads.forEach(bulkhead => {
      bulkhead.clearQueue();
      bulkhead.resetMetrics();
    });

    // Reset timeout manager
    timeoutManager.reset();
  }
}

/**
 * Global resilience manager instance
 */
export const resilienceManager = ResilienceManager.getInstance();

/**
 * Decorator for applying resilience policies
 */
export function WithResilience(
  name: string,
  config: ResilienceConfig | (() => ResilienceConfig)
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const resilienceConfig = typeof config === 'function' ? config() : config;
      const operationName = name || `${target.constructor.name}.${propertyKey}`;

      return resilienceManager.execute(
        operationName,
        () => originalMethod.apply(this, args),
        resilienceConfig
      );
    };

    return descriptor;
  };
}

/**
 * Create a resilient function
 */
export function makeResilient<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string,
  config: ResilienceConfig
): T {
  return (async (...args: Parameters<T>) => {
    return resilienceManager.execute(
      name,
      () => fn(...args),
      config
    );
  }) as T;
}