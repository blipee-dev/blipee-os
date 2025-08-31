# Observability Training Guide

## Phase 4, Task 4.5: Team Training on Monitoring and Observability

This guide provides hands-on training for the observability stack implemented in blipee-os.

## Module 1: Structured Logging

### Overview

Our structured logging system provides:
- JSON-formatted logs for easy parsing
- Automatic correlation ID tracking
- Sensitive data redaction
- Context propagation

### Hands-on Exercise 1: Basic Logging

```typescript
import { logger } from '@/lib/logging';

// Exercise: Add logging to a function
export async function processOrder(orderId: string) {
  // 1. Log the start of processing
  logger.info('Starting order processing', { orderId });
  
  try {
    // 2. Add debug logging
    logger.debug('Fetching order details', { orderId });
    const order = await fetchOrder(orderId);
    
    // 3. Log business event
    logger.info('Order processed successfully', {
      orderId,
      amount: order.total,
      items: order.items.length
    });
    
    return order;
  } catch (error) {
    // 4. Log errors with context
    logger.error('Order processing failed', error as Error, {
      orderId,
      step: 'fetch'
    });
    throw error;
  }
}
```

### Exercise 2: Using Correlation IDs

```typescript
// Exercise: Track related operations
export async function handleRequest(req: Request) {
  const correlationId = req.headers.get('x-correlation-id') || uuidv4();
  
  return logger.runWithContext({ correlationId }, async () => {
    logger.info('Request received', {
      method: req.method,
      path: req.url
    });
    
    // All logs within this context will have the same correlationId
    await processOrder(orderId);
    await sendNotification(orderId);
    
    logger.info('Request completed');
  });
}
```

### Exercise 3: Querying Logs

```bash
# Find all logs for a specific correlation ID
npm run logs:search -- --correlation-id="abc-123"

# Find all errors in the last hour
npm run logs:errors -- --since="1 hour ago"

# Find logs for a specific user
npm run logs:search -- --user-id="user-456"

# Stream logs in real-time
npm run logs:tail -- --level=error
```

### Best Practices Checklist

- [ ] Always include relevant context (IDs, amounts, etc.)
- [ ] Use appropriate log levels
- [ ] Never log sensitive data (passwords, tokens)
- [ ] Include error stacks for debugging
- [ ] Use correlation IDs for related operations

## Module 2: Distributed Tracing

### Overview

Our tracing system helps you:
- Track requests across services
- Identify performance bottlenecks
- Understand system dependencies
- Debug complex issues

### Exercise 1: Creating Basic Spans

```typescript
import { tracer } from '@/lib/tracing';

// Exercise: Add tracing to a function
export async function searchProducts(query: string) {
  return tracer.startActiveSpan('search-products', async (span) => {
    // 1. Add span attributes
    span.setAttribute('search.query', query);
    span.setAttribute('search.type', 'full-text');
    
    try {
      // 2. Create child spans for sub-operations
      const results = await tracer.startActiveSpan('database-query', async (dbSpan) => {
        dbSpan.setAttribute('db.operation', 'select');
        dbSpan.setAttribute('db.table', 'products');
        
        return await db.products.search(query);
      });
      
      // 3. Add result information
      span.setAttribute('search.results', results.length);
      
      return results;
    } catch (error) {
      // 4. Record exceptions
      span.recordException(error as Error);
      throw error;
    }
  });
}
```

### Exercise 2: Tracing HTTP Requests

```typescript
// Exercise: Trace external API calls
export async function fetchWeatherData(city: string) {
  return tracer.startActiveSpan('fetch-weather', async (span) => {
    span.setAttribute('weather.city', city);
    span.setAttribute('weather.provider', 'openweathermap');
    
    // Propagate trace context
    const headers = {
      ...tracer.getTraceHeaders(),
      'Content-Type': 'application/json'
    };
    
    const response = await fetch(`/api/weather/${city}`, { headers });
    
    span.setAttribute('http.status_code', response.status);
    
    if (!response.ok) {
      span.setStatus({ code: SpanStatusCode.ERROR });
    }
    
    return response.json();
  });
}
```

### Exercise 3: Analyzing Traces

1. **Finding Slow Operations**
   ```typescript
   // Look for spans with duration > 1s
   tracer.startActiveSpan('slow-operation', async (span) => {
     span.setAttribute('operation.threshold', 1000);
     // Your code here
   });
   ```

2. **Tracing Parallel Operations**
   ```typescript
   const results = await Promise.all([
     tracer.startActiveSpan('fetch-user', fetchUser),
     tracer.startActiveSpan('fetch-orders', fetchOrders),
     tracer.startActiveSpan('fetch-preferences', fetchPreferences)
   ]);
   ```

### Trace Analysis Questions

When analyzing traces, ask:
1. Which operation takes the longest?
2. Are there sequential operations that could be parallel?
3. Are there repeated operations that could be cached?
4. Where are the network boundaries?
5. Are there any failed spans?

## Module 3: Circuit Breakers and Resilience

### Overview

Circuit breakers protect your system by:
- Preventing cascading failures
- Providing fast failure feedback
- Allowing systems to recover
- Reducing resource consumption

### Exercise 1: Using Circuit Breakers

```typescript
import { circuitBreaker } from '@/lib/resilience';

// Exercise: Protect an external API call
const weatherBreaker = circuitBreaker({
  name: 'weather-api',
  failureThreshold: 5,
  resetTimeout: 30000 // 30 seconds
});

export async function getWeather(city: string) {
  return weatherBreaker.execute(async () => {
    const response = await fetch(`/api/weather/${city}`);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    return response.json();
  });
}

// Monitor circuit breaker events
weatherBreaker.on('open', () => {
  logger.warn('Weather API circuit breaker opened');
});

weatherBreaker.on('half-open', () => {
  logger.info('Weather API circuit breaker testing recovery');
});
```

### Exercise 2: Implementing Retry Logic

```typescript
import { retryPolicy } from '@/lib/resilience';

// Exercise: Add retry logic with backoff
const apiRetry = retryPolicy({
  maxAttempts: 3,
  strategy: 'exponential',
  baseDelay: 1000,
  maxDelay: 10000
});

export async function reliableApiCall() {
  return apiRetry.execute(async (attempt) => {
    logger.debug('API call attempt', { attempt });
    
    const response = await fetch('/api/data');
    
    // Retry on 5xx errors
    if (response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }
    
    // Don't retry on 4xx errors
    if (response.status >= 400) {
      throw new Error(`Client error: ${response.status}`);
    }
    
    return response.json();
  });
}
```

### Exercise 3: Bulkhead Pattern

```typescript
import { bulkhead } from '@/lib/resilience';

// Exercise: Limit concurrent operations
const imageBulkhead = bulkhead({
  name: 'image-processing',
  maxConcurrent: 5,
  maxQueue: 10
});

export async function processImage(imageUrl: string) {
  return imageBulkhead.execute(async () => {
    logger.info('Processing image', { imageUrl });
    
    // Simulate heavy processing
    const image = await downloadImage(imageUrl);
    const processed = await applyFilters(image);
    
    return processed;
  });
}
```

### Resilience Testing

```typescript
// Test circuit breaker behavior
describe('Circuit Breaker Tests', () => {
  it('should open after threshold failures', async () => {
    const breaker = circuitBreaker({ failureThreshold: 3 });
    
    // Simulate failures
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.execute(() => Promise.reject('Failed'));
      } catch {}
    }
    
    // Circuit should be open
    await expect(breaker.execute(() => Promise.resolve())).rejects.toThrow('Circuit breaker is OPEN');
  });
});
```

## Module 4: Runbook Automation

### Overview

Runbooks automate operational procedures:
- Standardize responses
- Reduce human error
- Speed up resolution
- Provide audit trails

### Exercise 1: Creating a Simple Runbook

```typescript
import { runbook } from '@/lib/runbooks';

// Exercise: Create a cache clearing runbook
const clearCacheRunbook = runbook()
  .withMetadata({
    id: 'clear-cache',
    name: 'Clear Application Cache',
    description: 'Clears all application caches'
  })
  
  // Step 1: Check cache status
  .check('check-cache', 'Check cache status', async () => {
    const stats = await cache.stats();
    logger.info('Cache stats', stats);
    return stats.size > 0;
  })
  .onSuccess('clear-redis')
  .onFailure('complete')
  
  // Step 2: Clear Redis cache
  .action('clear-redis', 'Clear Redis cache', async () => {
    await cache.clear();
    logger.info('Redis cache cleared');
  })
  .onSuccess('clear-memory')
  
  // Step 3: Clear memory cache
  .action('clear-memory', 'Clear in-memory cache', async () => {
    memoryCache.clear();
    logger.info('Memory cache cleared');
  })
  .onSuccess('verify')
  
  // Step 4: Verify caches are empty
  .check('verify', 'Verify caches cleared', async () => {
    const stats = await cache.stats();
    return stats.size === 0;
  })
  .onSuccess('complete')
  .onFailure('alert')
  
  // Step 5: Send notification
  .notify('complete', 'Cache clearing complete', 'All caches have been cleared')
  .notify('alert', 'Cache clearing failed', 'Manual intervention required')
  
  .startWith('check-cache')
  .register();
```

### Exercise 2: Running Runbooks

```typescript
// Exercise: Execute runbook programmatically
import { runbookEngine } from '@/lib/runbooks';

export async function handleCacheIssue() {
  try {
    // Run synchronously
    const result = await runbookEngine.execute('clear-cache', {
      triggeredBy: 'high-memory-alert',
      timestamp: new Date()
    });
    
    logger.info('Runbook completed', {
      executionId: result.executionId,
      duration: result.endTime - result.startTime
    });
    
  } catch (error) {
    logger.error('Runbook failed', error as Error);
    
    // Escalate to on-call
    await notifyOnCall('Cache clearing runbook failed', error);
  }
}

// Run asynchronously
export async function scheduledMaintenance() {
  const execution = await runbookEngine.execute('maintenance', {}, { async: true });
  
  logger.info('Maintenance started', {
    executionId: execution.executionId
  });
  
  // Check status later
  const status = runbookEngine.getExecution(execution.executionId);
  logger.info('Maintenance status', status);
}
```

### Exercise 3: Complex Runbook Patterns

```typescript
// Exercise: Create a runbook with decision trees
const diagnosticsRunbook = runbook()
  .withMetadata({
    id: 'system-diagnostics',
    name: 'System Diagnostics',
    description: 'Diagnose system issues'
  })
  
  // Check system load
  .decision('check-load', 'Evaluate system load', (context) => {
    const load = os.loadavg()[0];
    if (load > 4) return 'critical';
    if (load > 2) return 'high';
    return 'normal';
  })
  .branch('critical', 'emergency-response')
  .branch('high', 'scale-up')
  .branch('normal', 'check-memory')
  
  // Parallel health checks
  .parallel('health-checks', 'Run health checks',
    'check-database',
    'check-redis',
    'check-ai-services'
  )
  .onSuccess('analyze-results')
  
  // Loop through services
  .loop('check-services', 'Check all services',
    ['api', 'worker', 'scheduler'],
    'check-single-service'
  )
  
  .startWith('check-load')
  .register();
```

## Module 5: Practical Scenarios

### Scenario 1: API Latency Investigation

**Problem**: Users report slow API responses

**Investigation Steps**:

1. **Check Traces**
   ```typescript
   // Look for slow spans
   const slowRequests = traces.filter(trace => 
     trace.duration > 1000 && 
     trace.name.includes('api')
   );
   ```

2. **Analyze Logs**
   ```bash
   # Find slow API calls
   npm run logs:search -- --path="/api/*" --duration=">1000ms"
   ```

3. **Check Circuit Breakers**
   ```typescript
   const status = circuitBreakerManager.getStatus();
   const openBreakers = status.filter(cb => cb.state === 'OPEN');
   ```

4. **Run Diagnostics Runbook**
   ```bash
   curl -X POST /api/runbooks/execute \
     -d '{"runbookId": "api-performance-diagnostics"}'
   ```

### Scenario 2: Memory Leak Detection

**Problem**: Application memory usage growing over time

**Investigation Steps**:

1. **Monitor Memory Metrics**
   ```typescript
   setInterval(() => {
     const usage = process.memoryUsage();
     logger.info('Memory usage', {
       rss: usage.rss / 1024 / 1024,
       heapUsed: usage.heapUsed / 1024 / 1024
     });
   }, 60000);
   ```

2. **Take Heap Snapshots**
   ```bash
   # Take initial snapshot
   npm run debug:heap-snapshot -- --name=baseline
   
   # Wait 30 minutes
   
   # Take comparison snapshot
   npm run debug:heap-snapshot -- --name=after-load
   
   # Compare snapshots
   npm run debug:heap-compare -- baseline after-load
   ```

3. **Trace Object Allocation**
   ```typescript
   tracer.startActiveSpan('memory-intensive-operation', (span) => {
     span.setAttribute('memory.before', process.memoryUsage().heapUsed);
     
     // Your operation
     
     span.setAttribute('memory.after', process.memoryUsage().heapUsed);
     span.setAttribute('memory.delta', 
       process.memoryUsage().heapUsed - span.attributes['memory.before']
     );
   });
   ```

### Scenario 3: Cascading Failure Prevention

**Problem**: Database overload causing system-wide failures

**Solution Implementation**:

1. **Configure Circuit Breakers**
   ```typescript
   const dbBreaker = circuitBreaker({
     name: 'database',
     failureThreshold: 10,
     resetTimeout: 60000,
     timeout: 5000
   });
   ```

2. **Implement Bulkheads**
   ```typescript
   const dbBulkhead = bulkhead({
     name: 'database-connections',
     maxConcurrent: 20,
     maxQueue: 50
   });
   ```

3. **Add Caching Layer**
   ```typescript
   async function getUser(id: string) {
     // Check cache first
     const cached = await cache.get(`user:${id}`);
     if (cached) return cached;
     
     // Use circuit breaker for DB call
     const user = await dbBreaker.execute(() => 
       dbBulkhead.execute(() => 
         db.users.findById(id)
       )
     );
     
     // Cache result
     await cache.set(`user:${id}`, user, 300);
     
     return user;
   }
   ```

## Assessment Questions

### Logging
1. When should you use each log level?
2. How do you track related operations across services?
3. What information should never be logged?

### Tracing
1. How do you identify the slowest operation in a trace?
2. When should you create a new span vs use an existing one?
3. How do you propagate trace context across HTTP calls?

### Resilience
1. When does a circuit breaker transition from CLOSED to OPEN?
2. What's the difference between retry and circuit breaker patterns?
3. How do you test resilience patterns?

### Runbooks
1. When should you use automated runbooks vs manual procedures?
2. How do you handle runbook failures?
3. What makes a good runbook step?

## Additional Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Structured Logging Best Practices](https://www.honeycomb.io/blog/structured-logging-best-practices)
- [Distributed Tracing Guide](https://www.datadoghq.com/knowledge-center/distributed-tracing/)

## Next Steps

1. Complete all exercises
2. Shadow an on-call shift
3. Create your first runbook
4. Set up personal monitoring dashboard
5. Join #observability channel

---

*Training Version: 1.0.0*  
*Last Updated: [DATE]*