# Resilience Patterns Guide

## Phase 4, Task 4.3: Circuit Breakers and Fault Tolerance

This guide covers the resilience patterns implemented in blipee-os for building fault-tolerant systems.

## Overview

The resilience system provides:
- **Circuit Breakers** - Prevent cascading failures
- **Retry Policies** - Handle transient failures
- **Timeouts** - Prevent hanging operations
- **Bulkheads** - Isolate resources and limit concurrency
- **Fallbacks** - Graceful degradation

## Quick Start

### Using the Resilience Manager

```typescript
import { resilienceManager, ResiliencePolicies } from '@/lib/resilience';

// Execute with pre-configured policy
const result = await resilienceManager.execute(
  'my-operation',
  async () => {
    // Your operation here
    return await riskyOperation();
  },
  ResiliencePolicies.api()
);
```

### Using Decorators

```typescript
import { WithResilience, ResiliencePolicies } from '@/lib/resilience';

class MyService {
  @WithResilience('fetch-data', ResiliencePolicies.database())
  async fetchData(id: string) {
    return await database.query(`SELECT * FROM data WHERE id = ?`, [id]);
  }
}
```

## Circuit Breakers

Circuit breakers prevent cascading failures by stopping calls to failing services.

### States

1. **CLOSED** - Normal operation, requests pass through
2. **OPEN** - Failure threshold exceeded, requests are rejected
3. **HALF_OPEN** - Testing if service has recovered

### Basic Usage

```typescript
import { createCircuitBreaker } from '@/lib/resilience';

const breaker = createCircuitBreaker('external-api', {
  failureThreshold: 5,        // Open after 5 consecutive failures
  failureRateThreshold: 0.5,  // Open if 50% of requests fail
  resetTimeout: 60000,        // Try half-open after 1 minute
  timeout: 3000,              // Individual call timeout
  volumeThreshold: 10         // Min calls before checking thresholds
});

try {
  const result = await breaker.execute(async () => {
    return await externalApi.call();
  });
} catch (error) {
  if (error.code === 'CIRCUIT_OPEN') {
    // Circuit is open, use fallback
  }
}
```

### Advanced Configuration

```typescript
const breaker = createCircuitBreaker('ai-service', {
  failureThreshold: 3,
  failureRateThreshold: 0.5,
  successThreshold: 5,              // Successes needed to close
  timeout: 120000,                  // 2 minute timeout for AI
  resetTimeout: 120000,             // 2 minutes before retry
  volumeThreshold: 5,
  slowCallDurationThreshold: 5000,  // Calls > 5s are "slow"
  slowCallRateThreshold: 0.3        // Open if 30% calls are slow
});

// Monitor state changes
breaker.on('stateChange', ({ previousState, currentState }) => {
  console.log(`Circuit ${previousState} -> ${currentState}`);
});

// Monitor calls
breaker.on('call', ({ success, duration, error }) => {
  console.log(`Call completed: ${success ? 'success' : 'failure'} in ${duration}ms`);
});
```

### Circuit Breaker Registry

```typescript
import { circuitBreakerRegistry } from '@/lib/resilience';

// Get or create breakers
const breaker = circuitBreakerRegistry.getOrCreate('my-service', () => ({
  failureThreshold: 5,
  resetTimeout: 60000
}));

// Get health status
const health = circuitBreakerRegistry.getHealthStatus();
console.log(`Healthy: ${health.healthy}, Unhealthy: ${health.unhealthy}`);

// Reset all breakers
circuitBreakerRegistry.resetAll();
```

## Retry Policies

Handle transient failures with configurable retry strategies.

### Pre-defined Policies

```typescript
import { RetryPolicies, executeWithRetry } from '@/lib/resilience';

// Fixed delay
await executeWithRetry(
  () => apiCall(),
  RetryPolicies.fixed(3, 1000)  // 3 attempts, 1s delay
);

// Exponential backoff
await executeWithRetry(
  () => apiCall(),
  RetryPolicies.exponential(5, 100, 30000)  // 5 attempts, 100ms initial, 30s max
);

// API rate limit handling
await executeWithRetry(
  () => apiCall(),
  RetryPolicies.apiRateLimit()  // Smart retry for rate limits
);

// Network errors
await executeWithRetry(
  () => networkCall(),
  RetryPolicies.network()  // Retry network errors
);
```

### Custom Retry Configuration

```typescript
const retryConfig = {
  maxAttempts: 5,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,  // Add randomness to prevent thundering herd
  retryableErrors: ['TIMEOUT', 'NETWORK_ERROR', '503'],
  onRetry: (attempt, error, delay) => {
    console.log(`Retry attempt ${attempt} after ${delay}ms due to: ${error.message}`);
  }
};

await executeWithRetry(() => operation(), retryConfig);
```

### Conditional Retry

```typescript
const retryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  retryableErrors: (error) => {
    // Custom logic
    return error.code === 'RATE_LIMIT' || 
           error.message.includes('temporarily unavailable');
  }
};
```

## Timeouts

Prevent operations from hanging indefinitely.

### Basic Timeout

```typescript
import { withTimeout, TimeoutError } from '@/lib/resilience';

try {
  const result = await withTimeout(
    () => slowOperation(),
    5000  // 5 second timeout
  );
} catch (error) {
  if (error instanceof TimeoutError) {
    console.log(`Operation timed out after ${error.duration}ms`);
  }
}
```

### Timeout with Fallback

```typescript
const result = await withTimeout(
  () => slowOperation(),
  {
    timeout: 5000,
    fallback: () => 'Default value',
    onTimeout: (duration) => {
      console.log(`Timed out after ${duration}ms, using fallback`);
    }
  }
);
```

### Managed Timeouts

```typescript
import { timeoutManager } from '@/lib/resilience';

// Register timeout configurations
timeoutManager.register('api.weather', { timeout: 10000 });
timeoutManager.register('api.ai', { timeout: 120000 });

// Use managed timeout
await timeoutManager.execute('api.weather', async () => {
  return await fetchWeatherData();
});
```

## Bulkheads

Isolate resources and limit concurrent executions.

### Basic Usage

```typescript
import { createBulkhead } from '@/lib/resilience';

const bulkhead = createBulkhead('api-calls', 10, 50);  // 10 concurrent, 50 queued

try {
  const result = await bulkhead.execute(async () => {
    return await apiCall();
  });
} catch (error) {
  if (error.code === 'BULKHEAD_QUEUE_FULL') {
    // Too many requests, reject
  }
}
```

### Advanced Configuration

```typescript
const bulkhead = new Bulkhead({
  name: 'database-queries',
  maxConcurrent: 20,
  maxQueueSize: 100,
  timeout: 30000,  // Queue timeout
  onReject: (reason) => {
    console.log(`Bulkhead rejected: ${reason}`);
  }
});

// Monitor state
bulkhead.on('executionStarted', ({ active, queued }) => {
  console.log(`Active: ${active}, Queued: ${queued}`);
});

// Get metrics
const metrics = bulkhead.getMetrics();
console.log(`Completed: ${metrics.completed}, Rejected: ${metrics.rejected}`);
```

## Resilience Policies

Pre-configured policies for common scenarios.

### Available Policies

```typescript
import { ResiliencePolicies } from '@/lib/resilience';

// API calls
ResiliencePolicies.api()
// - Circuit breaker: 5 failures, 1 min reset
// - Retry: Exponential, 3 attempts
// - Timeout: 30 seconds
// - Bulkhead: 50 concurrent, 100 queued

// AI operations
ResiliencePolicies.ai()
// - Circuit breaker: 3 failures, 2 min reset
// - Retry: Rate limit aware, 3 attempts
// - Timeout: 2 minutes
// - Bulkhead: 10 concurrent, 50 queued

// Database operations
ResiliencePolicies.database()
// - Circuit breaker: 10 failures, 30s reset
// - Retry: Exponential, 3 attempts
// - Timeout: 30 seconds
// - Bulkhead: 100 concurrent, 200 queued

// External services
ResiliencePolicies.external()
// - Circuit breaker: 5 failures, 1 min reset
// - Retry: Network aware
// - Timeout: 15 seconds
// - Bulkhead: 20 concurrent, 50 queued

// Critical operations (no circuit breaker)
ResiliencePolicies.critical()
// - No circuit breaker
// - Retry: Exponential, 5 attempts
// - Timeout: 1 minute
// - Bulkhead: 5 concurrent, 10 queued
```

### Custom Policies

```typescript
const customPolicy = {
  circuitBreaker: {
    failureThreshold: 10,
    resetTimeout: 300000  // 5 minutes
  },
  retry: {
    maxAttempts: 5,
    initialDelay: 2000,
    maxDelay: 60000,
    backoffMultiplier: 3
  },
  timeout: 120000,  // 2 minutes
  bulkhead: {
    maxConcurrent: 3,
    maxQueueSize: 10
  },
  fallback: () => ({
    success: false,
    data: 'Service unavailable'
  })
};

await resilienceManager.execute('custom-op', operation, customPolicy);
```

## Patterns in Practice

### API Route Example

```typescript
export const POST = async (request: NextRequest) => {
  const body = await request.json();

  return resilienceManager.execute(
    'api.process',
    async () => {
      // External API call
      const external = await fetchExternalData(body.id);
      
      // AI processing
      const analysis = await processWithAI(external);
      
      // Store results
      const stored = await storeInDatabase(analysis);
      
      return NextResponse.json({ success: true, data: stored });
    },
    {
      ...ResiliencePolicies.api(),
      fallback: () => NextResponse.json(
        { success: false, message: 'Service temporarily unavailable' },
        { status: 503 }
      )
    }
  );
};
```

### Service Class Example

```typescript
class DataService {
  @WithCircuitBreaker('data-fetch', { failureThreshold: 5 })
  @WithRetry(RetryPolicies.exponential())
  @WithTimeout(30000)
  async fetchData(id: string) {
    return await externalApi.getData(id);
  }

  @WithResilience('process-batch', {
    bulkhead: { maxConcurrent: 5 },
    retry: { maxAttempts: 2 },
    timeout: 60000
  })
  async processBatch(items: any[]) {
    return await Promise.all(
      items.map(item => this.processItem(item))
    );
  }
}
```

### Health Monitoring

```typescript
// Health check endpoint
export const GET = async () => {
  const health = resilienceManager.getHealthStatus();
  
  return NextResponse.json({
    status: health.summary.healthy ? 'healthy' : 'degraded',
    circuitBreakers: {
      total: health.circuitBreakers.total,
      open: health.circuitBreakers.byState.OPEN,
      halfOpen: health.circuitBreakers.byState.HALF_OPEN
    },
    bulkheads: health.bulkheads.map(b => ({
      name: b.name,
      utilization: (b.state.active / (b.state.active + b.state.available)) * 100
    })),
    issues: health.summary.issues
  }, {
    status: health.summary.healthy ? 200 : 503
  });
};
```

## Best Practices

### 1. Choose Appropriate Thresholds

```typescript
// Fast, critical service
createCircuitBreaker('critical-api', {
  failureThreshold: 3,      // Open quickly
  resetTimeout: 30000,      // Reset quickly
  timeout: 5000             // Fail fast
});

// Slow, less critical service
createCircuitBreaker('reporting-api', {
  failureThreshold: 10,     // More tolerant
  resetTimeout: 300000,     // Longer reset
  timeout: 60000            // Allow more time
});
```

### 2. Use Fallbacks Wisely

```typescript
// Good: Cached or default data
fallback: () => getCachedData() || getDefaultResponse()

// Bad: Hiding errors
fallback: () => ({ success: true, data: null })  // Don't lie!
```

### 3. Monitor and Alert

```typescript
circuitBreakerRegistry.on('stateChange', ({ name, currentState }) => {
  if (currentState === CircuitState.OPEN) {
    alertingService.send({
      severity: 'high',
      message: `Circuit breaker ${name} is OPEN`
    });
  }
});
```

### 4. Test Failure Scenarios

```typescript
// Force circuit open for testing
if (process.env.NODE_ENV === 'test') {
  circuitBreakerRegistry.get('external-api')?.forceOpen();
}
```

### 5. Combine Patterns

```typescript
// Retry handles transient failures
// Circuit breaker prevents cascading failures
// Timeout prevents hanging
// Bulkhead prevents resource exhaustion
const policy = {
  retry: RetryPolicies.exponential(3),
  circuitBreaker: { failureThreshold: 5 },
  timeout: 10000,
  bulkhead: { maxConcurrent: 20 }
};
```

## Troubleshooting

### Circuit Breaker Won't Close

1. Check if service is actually healthy
2. Verify `successThreshold` is achievable
3. Look for slow calls triggering `slowCallRateThreshold`
4. Manually reset if needed: `breaker.reset()`

### Too Many Timeouts

1. Increase timeout threshold
2. Check network latency
3. Consider async patterns for long operations
4. Add progress tracking for visibility

### Bulkhead Always Full

1. Increase `maxConcurrent` limit
2. Reduce operation duration
3. Add caching to reduce load
4. Consider horizontal scaling

### Retry Storm

1. Add jitter to retry delays
2. Implement exponential backoff
3. Set reasonable max attempts
4. Use circuit breakers to stop retries

## Monitoring Integration

The resilience patterns integrate with monitoring:

```typescript
// Metrics exported
- circuit_breaker_state_changes_total
- circuit_breaker_calls_total{result="success|failure"}
- retry_attempts_total
- timeout_operations_total
- bulkhead_executions_total{state="active|queued|rejected"}

// Traces include
- resilience.operation
- circuit.state
- retry.attempt
- timeout.exceeded
- bulkhead.queue_position
```