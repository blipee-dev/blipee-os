/**
 * Resilience Module Exports
 * Phase 4, Task 4.3: Centralized resilience patterns
 */

// Circuit Breaker
export * from './circuit-breaker';
export { circuitBreakerRegistry, WithCircuitBreaker, withCircuitBreaker } from './circuit-breaker-registry';

// Retry Policy
export * from './retry-policy';

// Timeout Manager
export * from './timeout-manager';

// Bulkhead
export * from './bulkhead';

// Resilience Manager
export * from './resilience-manager';

// Quick access to common functions
export { 
  createCircuitBreaker,
  CircuitBreaker,
  CircuitState
} from './circuit-breaker';

export {
  RetryPolicies,
  executeWithRetry,
  WithRetry,
  makeRetryable
} from './retry-policy';

export {
  withTimeout,
  timeoutManager,
  WithTimeout,
  makeTimeoutProtected,
  TimeoutError
} from './timeout-manager';

export {
  createBulkhead,
  Bulkhead
} from './bulkhead';

export {
  resilienceManager,
  ResiliencePolicies,
  WithResilience,
  makeResilient
} from './resilience-manager';