/**
 * Circuit Breaker Implementation
 * Phase 4, Task 4.3: Fault tolerance and resilience
 */

import { EventEmitter } from 'events';
import { logger } from '@/lib/logging';
import { tracer } from '@/lib/tracing';

/**
 * Circuit breaker states
 */
export enum CircuitState {
  CLOSED = 'CLOSED',      // Normal operation
  OPEN = 'OPEN',          // Failing, reject all calls
  HALF_OPEN = 'HALF_OPEN' // Testing if service recovered
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;      // Number of failures before opening
  failureRateThreshold: number;  // Failure rate (0-1) before opening
  successThreshold: number;      // Successes needed to close from half-open
  timeout: number;               // Timeout for each call (ms)
  resetTimeout: number;          // Time before trying half-open (ms)
  volumeThreshold: number;       // Min requests before checking thresholds
  slowCallDurationThreshold?: number; // Slow call threshold (ms)
  slowCallRateThreshold?: number;     // Slow call rate (0-1) before opening
}

/**
 * Call metrics for circuit breaker
 */
interface CallMetrics {
  successes: number;
  failures: number;
  timeouts: number;
  slowCalls: number;
  totalCalls: number;
  lastFailureTime?: Date;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker extends EventEmitter {
  private config: CircuitBreakerConfig;
  private state: CircuitState = CircuitState.CLOSED;
  private metrics: CallMetrics;
  private stateChangeTimer?: NodeJS.Timeout;
  private rollingWindow: { timestamp: number; success: boolean; duration: number }[] = [];
  private readonly windowSize = 60000; // 1 minute rolling window

  constructor(config: CircuitBreakerConfig) {
    super();
    this.config = config;
    this.metrics = this.resetMetrics();
    
    logger.info('Circuit breaker initialized', {
      name: config.name,
      failureThreshold: config.failureThreshold,
      resetTimeout: config.resetTimeout
    });
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    return tracer.startActiveSpan(
      `circuit_breaker.${this.config.name}`,
      async (span) => {
        span.setAttribute('circuit.name', this.config.name);
        span.setAttribute('circuit.state', this.state);

        // Check if circuit is open
        if (this.state === CircuitState.OPEN) {
          span.setAttribute('circuit.rejected', true);
          span.addEvent('circuit_open_rejection');
          
          const error = new Error(`Circuit breaker is OPEN for ${this.config.name}`);
          (error as any).code = 'CIRCUIT_OPEN';
          throw error;
        }

        const startTime = Date.now();

        try {
          // Set timeout
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              const error = new Error(`Circuit breaker timeout for ${this.config.name}`);
              (error as any).code = 'CIRCUIT_TIMEOUT';
              reject(error);
            }, this.config.timeout);
          });

          // Race between function execution and timeout
          const result = await Promise.race([
            fn(),
            timeoutPromise
          ]);

          const duration = Date.now() - startTime;
          
          // Record success
          this.recordSuccess(duration);
          
          span.setAttribute('circuit.call.success', true);
          span.setAttribute('circuit.call.duration', duration);
          
          // Log recovery if moving from half-open to closed
          if (this.state === CircuitState.HALF_OPEN && 
              this.metrics.consecutiveSuccesses >= this.config.successThreshold) {
            logger.info('Circuit breaker recovered', {
              name: this.config.name,
              previousState: this.state,
              newState: CircuitState.CLOSED
            });
          }

          return result;

        } catch (error) {
          const duration = Date.now() - startTime;
          
          // Record failure
          this.recordFailure(error as Error, duration);
          
          span.setAttribute('circuit.call.success', false);
          span.setAttribute('circuit.call.duration', duration);
          span.setAttribute('circuit.call.error', (error as Error).message);
          span.recordException(error as Error);

          // Check if we should open the circuit
          if (this.shouldOpen()) {
            this.open();
            span.addEvent('circuit_opened', {
              failures: this.metrics.failures,
              failureRate: this.getFailureRate()
            });
          }

          throw error;
        }
      }
    );
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get current metrics
   */
  getMetrics(): Readonly<CallMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get health status
   */
  getHealth(): {
    state: CircuitState;
    metrics: CallMetrics;
    failureRate: number;
    slowCallRate: number;
    isHealthy: boolean;
  } {
    const failureRate = this.getFailureRate();
    const slowCallRate = this.getSlowCallRate();
    
    return {
      state: this.state,
      metrics: { ...this.metrics },
      failureRate,
      slowCallRate,
      isHealthy: this.state === CircuitState.CLOSED && 
                 failureRate < this.config.failureRateThreshold
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    logger.info('Circuit breaker manually reset', {
      name: this.config.name,
      previousState: this.state
    });

    this.close();
    this.metrics = this.resetMetrics();
    this.rollingWindow = [];
    
    if (this.stateChangeTimer) {
      clearTimeout(this.stateChangeTimer);
      this.stateChangeTimer = undefined;
    }

    this.emit('reset', { name: this.config.name });
  }

  /**
   * Force circuit to open
   */
  forceOpen(): void {
    logger.warn('Circuit breaker forced open', {
      name: this.config.name,
      previousState: this.state
    });

    this.open();
  }

  /**
   * Force circuit to close
   */
  forceClose(): void {
    logger.warn('Circuit breaker forced closed', {
      name: this.config.name,
      previousState: this.state
    });

    this.close();
  }

  private recordSuccess(duration: number): void {
    this.metrics.successes++;
    this.metrics.totalCalls++;
    this.metrics.consecutiveSuccesses++;
    this.metrics.consecutiveFailures = 0;

    // Check for slow calls
    if (this.config.slowCallDurationThreshold && 
        duration > this.config.slowCallDurationThreshold) {
      this.metrics.slowCalls++;
    }

    // Add to rolling window
    this.addToRollingWindow(true, duration);

    // Emit metrics event
    this.emit('call', {
      name: this.config.name,
      success: true,
      duration,
      state: this.state
    });

    // Check state transitions
    if (this.state === CircuitState.HALF_OPEN) {
      if (this.metrics.consecutiveSuccesses >= this.config.successThreshold) {
        this.close();
      }
    }
  }

  private recordFailure(error: Error, duration: number): void {
    const isTimeout = (error as any).code === 'CIRCUIT_TIMEOUT';
    
    this.metrics.failures++;
    this.metrics.totalCalls++;
    this.metrics.consecutiveFailures++;
    this.metrics.consecutiveSuccesses = 0;
    this.metrics.lastFailureTime = new Date();

    if (isTimeout) {
      this.metrics.timeouts++;
    }

    // Add to rolling window
    this.addToRollingWindow(false, duration);

    // Emit metrics event
    this.emit('call', {
      name: this.config.name,
      success: false,
      duration,
      error: error.message,
      isTimeout,
      state: this.state
    });

    // Log significant failures
    if (this.metrics.consecutiveFailures % 10 === 0) {
      logger.warn('Circuit breaker experiencing consecutive failures', {
        name: this.config.name,
        consecutiveFailures: this.metrics.consecutiveFailures,
        totalFailures: this.metrics.failures,
        state: this.state
      });
    }
  }

  private shouldOpen(): boolean {
    // Not enough volume to make decision
    if (this.metrics.totalCalls < this.config.volumeThreshold) {
      return false;
    }

    // Already open or half-open
    if (this.state !== CircuitState.CLOSED) {
      return false;
    }

    // Check failure threshold
    if (this.metrics.consecutiveFailures >= this.config.failureThreshold) {
      return true;
    }

    // Check failure rate
    const failureRate = this.getFailureRate();
    if (failureRate >= this.config.failureRateThreshold) {
      return true;
    }

    // Check slow call rate if configured
    if (this.config.slowCallRateThreshold) {
      const slowCallRate = this.getSlowCallRate();
      if (slowCallRate >= this.config.slowCallRateThreshold) {
        return true;
      }
    }

    return false;
  }

  private open(): void {
    if (this.state === CircuitState.OPEN) {
      return;
    }

    const previousState = this.state;
    this.state = CircuitState.OPEN;

    logger.error('Circuit breaker opened', null as any, {
      name: this.config.name,
      previousState,
      failures: this.metrics.failures,
      failureRate: this.getFailureRate(),
      consecutiveFailures: this.metrics.consecutiveFailures
    });

    this.emit('stateChange', {
      name: this.config.name,
      previousState,
      currentState: this.state,
      metrics: { ...this.metrics }
    });

    // Schedule transition to half-open
    this.stateChangeTimer = setTimeout(() => {
      this.halfOpen();
    }, this.config.resetTimeout);
  }

  private halfOpen(): void {
    const previousState = this.state;
    this.state = CircuitState.HALF_OPEN;
    this.metrics.consecutiveSuccesses = 0;
    this.metrics.consecutiveFailures = 0;

    logger.info('Circuit breaker half-open', {
      name: this.config.name,
      previousState
    });

    this.emit('stateChange', {
      name: this.config.name,
      previousState,
      currentState: this.state,
      metrics: { ...this.metrics }
    });
  }

  private close(): void {
    if (this.state === CircuitState.CLOSED) {
      return;
    }

    const previousState = this.state;
    this.state = CircuitState.CLOSED;

    logger.info('Circuit breaker closed', {
      name: this.config.name,
      previousState,
      successes: this.metrics.successes,
      consecutiveSuccesses: this.metrics.consecutiveSuccesses
    });

    this.emit('stateChange', {
      name: this.config.name,
      previousState,
      currentState: this.state,
      metrics: { ...this.metrics }
    });

    if (this.stateChangeTimer) {
      clearTimeout(this.stateChangeTimer);
      this.stateChangeTimer = undefined;
    }
  }

  private getFailureRate(): number {
    const recentCalls = this.getRecentCalls();
    if (recentCalls.length === 0) {
      return 0;
    }

    const failures = recentCalls.filter(call => !call.success).length;
    return failures / recentCalls.length;
  }

  private getSlowCallRate(): number {
    if (!this.config.slowCallDurationThreshold) {
      return 0;
    }

    const recentCalls = this.getRecentCalls();
    if (recentCalls.length === 0) {
      return 0;
    }

    const slowCalls = recentCalls.filter(
      call => call.duration > this.config.slowCallDurationThreshold!
    ).length;

    return slowCalls / recentCalls.length;
  }

  private getRecentCalls() {
    const now = Date.now();
    const cutoff = now - this.windowSize;
    
    // Clean old entries
    this.rollingWindow = this.rollingWindow.filter(
      call => call.timestamp > cutoff
    );

    return this.rollingWindow;
  }

  private addToRollingWindow(success: boolean, duration: number): void {
    this.rollingWindow.push({
      timestamp: Date.now(),
      success,
      duration
    });

    // Keep window size reasonable
    if (this.rollingWindow.length > 1000) {
      this.rollingWindow = this.rollingWindow.slice(-1000);
    }
  }

  private resetMetrics(): CallMetrics {
    return {
      successes: 0,
      failures: 0,
      timeouts: 0,
      slowCalls: 0,
      totalCalls: 0,
      consecutiveSuccesses: 0,
      consecutiveFailures: 0
    };
  }
}

/**
 * Create a circuit breaker with default config
 */
export function createCircuitBreaker(
  name: string,
  overrides?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  const defaultConfig: CircuitBreakerConfig = {
    name,
    failureThreshold: 5,
    failureRateThreshold: 0.5,
    successThreshold: 5,
    timeout: 3000,
    resetTimeout: 60000,
    volumeThreshold: 10,
    slowCallDurationThreshold: 1000,
    slowCallRateThreshold: 0.5
  };

  return new CircuitBreaker({
    ...defaultConfig,
    ...overrides
  });
}