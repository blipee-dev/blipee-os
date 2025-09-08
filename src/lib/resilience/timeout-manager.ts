/**
 * Timeout Manager
 * Phase 4, Task 4.3: Configurable timeout handling
 */

import { logger } from '@/lib/logging';
import { tracer } from '@/lib/tracing';

/**
 * Timeout configuration
 */
export interface TimeoutConfig {
  timeout: number;
  fallback?: () => any;
  onTimeout?: (duration: number) => void;
}

/**
 * Timeout error class
 */
export class TimeoutError extends Error {
  public readonly code = 'TIMEOUT';
  public readonly duration: number;

  constructor(message: string, duration: number) {
    super(message);
    this.name = 'TimeoutError';
    this.duration = duration;
  }
}

/**
 * Execute with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  config: TimeoutConfig | number,
  operation?: string
): Promise<T> {
  const timeoutConfig: TimeoutConfig = typeof config === 'number' 
    ? { timeout: config } 
    : config;

  return tracer.startActiveSpan(
    `timeout.${operation || 'execute'}`,
    async (span) => {
      span.setAttribute('timeout.limit', timeoutConfig.timeout);

      const startTime = Date.now();
      let timeoutId: NodeJS.Timeout;

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          const duration = Date.now() - startTime;
          const error = new TimeoutError(
            `Operation timed out after ${timeoutConfig.timeout}ms`,
            duration
          );

          span.recordException(error);
          span.setAttribute('timeout.exceeded', true);
          span.setAttribute('timeout.duration', duration);
          span.addEvent('timeout_exceeded', {
            limit: timeoutConfig.timeout,
            actual: duration
          });

          // Call timeout callback if provided
          if (timeoutConfig.onTimeout) {
            timeoutConfig.onTimeout(duration);
          }

          logger.warn('Operation timed out', {
            operation,
            timeout: timeoutConfig.timeout,
            duration
          });

          reject(error);
        }, timeoutConfig.timeout);
      });

      try {
        const result = await Promise.race([
          fn(),
          timeoutPromise
        ]);

        const duration = Date.now() - startTime;
        span.setAttribute('timeout.duration', duration);
        span.setAttribute('timeout.exceeded', false);

        clearTimeout(timeoutId!);
        return result;

      } catch (error) {
        clearTimeout(timeoutId!);

        // If timeout error and fallback is provided
        if (error instanceof TimeoutError && timeoutConfig.fallback) {
          logger.info('Using timeout fallback', {
            operation,
            timeout: timeoutConfig.timeout
          });

          span.addEvent('timeout_fallback_used');
          return timeoutConfig.fallback() as T;
        }

        throw error;
      }
    }
  );
}

/**
 * Timeout manager for different operation types
 */
export class TimeoutManager {
  private static instance: TimeoutManager;
  private timeouts: Map<string, TimeoutConfig> = new Map();

  private constructor() {
    // Initialize default timeouts
    this.setDefaults();
  }

  static getInstance(): TimeoutManager {
    if (!TimeoutManager.instance) {
      TimeoutManager.instance = new TimeoutManager();
    }
    return TimeoutManager.instance;
  }

  /**
   * Set default timeouts
   */
  private setDefaults(): void {
    // API timeouts
    this.register('api.default', { timeout: 30000 });
    this.register('api.ai', { timeout: 120000 }); // 2 minutes for AI
    this.register('api.upload', { timeout: 300000 }); // 5 minutes for uploads
    
    // Database timeouts
    this.register('db.query', { timeout: 30000 });
    this.register('db.transaction', { timeout: 60000 });
    this.register('db.migration', { timeout: 300000 });
    
    // External service timeouts
    this.register('external.weather', { timeout: 10000 });
    this.register('external.carbon', { timeout: 15000 });
    this.register('external.regulatory', { timeout: 20000 });
    
    // Internal operations
    this.register('cache.get', { timeout: 1000 });
    this.register('cache.set', { timeout: 2000 });
    this.register('queue.enqueue', { timeout: 5000 });
    this.register('queue.process', { timeout: 60000 });
  }

  /**
   * Register a timeout configuration
   */
  register(name: string, config: TimeoutConfig): void {
    this.timeouts.set(name, config);
    
    logger.debug('Timeout registered', {
      name,
      timeout: config.timeout
    });
  }

  /**
   * Get timeout configuration
   */
  get(name: string): TimeoutConfig | undefined {
    return this.timeouts.get(name);
  }

  /**
   * Get or create timeout configuration
   */
  getOrDefault(name: string, defaultTimeout = 30000): TimeoutConfig {
    return this.timeouts.get(name) || { timeout: defaultTimeout };
  }

  /**
   * Execute with managed timeout
   */
  async execute<T>(
    name: string,
    fn: () => Promise<T>,
    overrides?: Partial<TimeoutConfig>
  ): Promise<T> {
    const config = this.getOrDefault(name);
    const finalConfig = { ...config, ...overrides };

    return withTimeout(fn, finalConfig, name);
  }

  /**
   * Update timeout configuration
   */
  update(name: string, config: Partial<TimeoutConfig>): void {
    const existing = this.timeouts.get(name) || { timeout: 30000 };
    this.timeouts.set(name, { ...existing, ...config });

    logger.info('Timeout updated', {
      name,
      timeout: this.timeouts.get(name)!.timeout
    });
  }

  /**
   * Get all timeout configurations
   */
  getAll(): Map<string, TimeoutConfig> {
    return new Map(this.timeouts);
  }

  /**
   * Clear all custom timeouts (keep defaults)
   */
  reset(): void {
    this.timeouts.clear();
    this.setDefaults();
    
    logger.info('Timeout manager reset to defaults');
  }
}

/**
 * Global timeout manager instance
 */
export const timeoutManager = TimeoutManager.getInstance();

/**
 * Decorator for timeout
 */
export function WithTimeout(
  timeout: number | string,
  fallback?: () => any
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const operation = `${target.constructor.name}.${propertyKey}`;
      
      if (typeof timeout === 'string') {
        // Use managed timeout
        return timeoutManager.execute(
          timeout,
          () => originalMethod.apply(this, args),
          { fallback }
        );
      } else {
        // Use direct timeout
        return withTimeout(
          () => originalMethod.apply(this, args),
          { timeout, fallback },
          operation
        );
      }
    };

    return descriptor;
  };
}

/**
 * Create a timeout-protected function
 */
export function makeTimeoutProtected<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  timeout: number,
  fallback?: () => ReturnType<T>
): T {
  return (async (...args: Parameters<T>) => {
    return withTimeout(
      () => fn(...args),
      { timeout, fallback },
      fn.name || 'anonymous'
    );
  }) as T;
}

/**
 * Race multiple promises with individual timeouts
 */
export async function raceWithTimeouts<T>(
  operations: Array<{
    name: string;
    fn: () => Promise<T>;
    timeout: number;
  }>
): Promise<{ winner: string; result: T }> {
  const promises = operations.map(op => 
    withTimeout(op.fn, op.timeout, op.name)
      .then(result => ({ winner: op.name, result }))
  );

  return Promise.race(promises);
}