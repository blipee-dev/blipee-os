/**
 * Circuit Breaker Registry
 * Phase 4, Task 4.3: Centralized management of circuit breakers
 */

import { CircuitBreaker, CircuitBreakerConfig, CircuitState } from './circuit-breaker';
import { logger } from '@/lib/logging';
import { EventEmitter } from 'events';

/**
 * Registry for managing multiple circuit breakers
 */
export class CircuitBreakerRegistry extends EventEmitter {
  private static instance: CircuitBreakerRegistry;
  private breakers: Map<string, CircuitBreaker> = new Map();

  private constructor() {
    super();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  /**
   * Register a circuit breaker
   */
  register(config: CircuitBreakerConfig): CircuitBreaker {
    if (this.breakers.has(config.name)) {
      logger.warn('Circuit breaker already registered, returning existing instance', {
        name: config.name
      });
      return this.breakers.get(config.name)!;
    }

    const breaker = new CircuitBreaker(config);

    // Forward events from individual breakers
    breaker.on('stateChange', (data) => {
      this.emit('stateChange', data);
      
      // Log state changes
      logger.info('Circuit breaker state changed', data);
    });

    breaker.on('call', (data) => {
      this.emit('call', data);
    });

    breaker.on('reset', (data) => {
      this.emit('reset', data);
    });

    this.breakers.set(config.name, breaker);

    logger.info('Circuit breaker registered', {
      name: config.name,
      totalBreakers: this.breakers.size
    });

    return breaker;
  }

  /**
   * Get a circuit breaker by name
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Get or create a circuit breaker
   */
  getOrCreate(
    name: string,
    configFactory: () => Partial<CircuitBreakerConfig>
  ): CircuitBreaker {
    const existing = this.breakers.get(name);
    if (existing) {
      return existing;
    }

    const config: CircuitBreakerConfig = {
      name,
      failureThreshold: 5,
      failureRateThreshold: 0.5,
      successThreshold: 5,
      timeout: 3000,
      resetTimeout: 60000,
      volumeThreshold: 10,
      ...configFactory()
    };

    return this.register(config);
  }

  /**
   * Remove a circuit breaker
   */
  remove(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (!breaker) {
      return false;
    }

    breaker.removeAllListeners();
    this.breakers.delete(name);

    logger.info('Circuit breaker removed', {
      name,
      totalBreakers: this.breakers.size
    });

    return true;
  }

  /**
   * Get all circuit breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get health status of all breakers
   */
  getHealthStatus(): {
    healthy: number;
    unhealthy: number;
    total: number;
    breakers: Array<{
      name: string;
      state: CircuitState;
      health: ReturnType<CircuitBreaker['getHealth']>;
    }>;
  } {
    const breakers = Array.from(this.breakers.entries()).map(([name, breaker]) => ({
      name,
      state: breaker.getState(),
      health: breaker.getHealth()
    }));

    const healthy = breakers.filter(b => b.health.isHealthy).length;
    const unhealthy = breakers.length - healthy;

    return {
      healthy,
      unhealthy,
      total: breakers.length,
      breakers
    };
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    logger.warn('Resetting all circuit breakers', {
      count: this.breakers.size
    });

    this.breakers.forEach((breaker, name) => {
      breaker.reset();
    });

    this.emit('resetAll', {
      count: this.breakers.size
    });
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.breakers.forEach(breaker => {
      breaker.removeAllListeners();
    });
    this.breakers.clear();

    logger.info('Circuit breaker registry cleared');
  }

  /**
   * Get metrics for monitoring
   */
  getMetrics(): {
    total: number;
    byState: Record<CircuitState, number>;
    failureRates: Array<{ name: string; rate: number }>;
    unhealthyBreakers: string[];
  } {
    const byState: Record<CircuitState, number> = {
      [CircuitState.CLOSED]: 0,
      [CircuitState.OPEN]: 0,
      [CircuitState.HALF_OPEN]: 0
    };

    const failureRates: Array<{ name: string; rate: number }> = [];
    const unhealthyBreakers: string[] = [];

    this.breakers.forEach((breaker, name) => {
      const state = breaker.getState();
      const health = breaker.getHealth();

      byState[state]++;
      
      failureRates.push({
        name,
        rate: health.failureRate
      });

      if (!health.isHealthy) {
        unhealthyBreakers.push(name);
      }
    });

    // Sort by failure rate descending
    failureRates.sort((a, b) => b.rate - a.rate);

    return {
      total: this.breakers.size,
      byState,
      failureRates: failureRates.slice(0, 10), // Top 10
      unhealthyBreakers
    };
  }
}

/**
 * Global circuit breaker registry instance
 */
export const circuitBreakerRegistry = CircuitBreakerRegistry.getInstance();

/**
 * Decorator for applying circuit breaker to methods
 */
export function WithCircuitBreaker(
  name: string,
  config?: Partial<CircuitBreakerConfig>
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const breaker = circuitBreakerRegistry.getOrCreate(name, () => ({
        ...config,
        name: `${target.constructor.name}.${propertyKey}`
      }));

      return breaker.execute(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Create a protected function with circuit breaker
 */
export function withCircuitBreaker<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string,
  config?: Partial<CircuitBreakerConfig>
): T {
  const breaker = circuitBreakerRegistry.getOrCreate(name, () => config || {});

  return (async (...args: Parameters<T>) => {
    return breaker.execute(() => fn(...args));
  }) as T;
}