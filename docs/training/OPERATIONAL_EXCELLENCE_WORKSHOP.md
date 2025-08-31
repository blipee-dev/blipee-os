# Operational Excellence Workshop

## Phase 4, Task 4.5: Hands-on Training Workshop

This workshop provides practical exercises to master the operational tools and practices in blipee-os.

## Workshop Overview

**Duration**: 2 days  
**Format**: Hands-on exercises with real scenarios  
**Prerequisites**: Access to development environment

### Day 1: Observability Fundamentals
- Morning: Logging and Log Analysis
- Afternoon: Distributed Tracing

### Day 2: Resilience and Automation
- Morning: Circuit Breakers and Resilience Patterns
- Afternoon: Runbook Automation

## Day 1, Session 1: Logging Workshop (2 hours)

### Setup (15 minutes)

1. **Verify Environment**
   ```bash
   # Check logging is working
   npm run logs:test
   
   # Verify log aggregation
   npm run logs:tail -- --test-mode
   ```

2. **Create Test Workspace**
   ```bash
   mkdir workshop
   cd workshop
   npm init -y
   ```

### Exercise 1: Structured Logging Implementation (30 minutes)

**Scenario**: You need to add comprehensive logging to a payment processing system.

```typescript
// workshop/payment-processor.ts
import { logger } from '@/lib/logging';

interface PaymentRequest {
  userId: string;
  amount: number;
  currency: string;
  method: 'card' | 'bank' | 'crypto';
}

// TODO: Add structured logging to this function
export async function processPayment(request: PaymentRequest): Promise<string> {
  // 1. Log payment initiation with context
  
  try {
    // 2. Log validation step
    validatePayment(request);
    
    // 3. Log external API call
    const transactionId = await callPaymentProvider(request);
    
    // 4. Log successful completion
    
    return transactionId;
  } catch (error) {
    // 5. Log error with full context
    throw error;
  }
}

// Solution discussion after exercise
```

### Exercise 2: Log Analysis Challenge (30 minutes)

**Scenario**: Production is experiencing intermittent payment failures. Analyze the logs to find the pattern.

```bash
# Sample log data provided in workshop/logs/payment-errors.json
```

Tasks:
1. Find all failed payments in the last hour
2. Identify the common pattern
3. Determine the root cause
4. Create a log query to monitor this issue

### Exercise 3: Correlation ID Tracking (30 minutes)

**Scenario**: Track a user's journey from login to purchase.

```typescript
// Implement correlation ID propagation
export class UserJourneyTracker {
  async trackUserFlow(userId: string) {
    const correlationId = uuidv4();
    
    return logger.runWithContext({ correlationId, userId }, async () => {
      // TODO: Implement these methods with proper logging
      await this.logLogin(userId);
      await this.logBrowsing(userId);
      await this.logAddToCart(userId);
      await this.logCheckout(userId);
      await this.logPayment(userId);
    });
  }
}
```

### Group Discussion (15 minutes)
- Share logging challenges
- Best practices discovered
- Common pitfalls to avoid

## Day 1, Session 2: Distributed Tracing Workshop (2 hours)

### Exercise 1: Trace Implementation (45 minutes)

**Scenario**: Add tracing to an e-commerce API that's experiencing performance issues.

```typescript
// workshop/ecommerce-api.ts
import { tracer } from '@/lib/tracing';

export class EcommerceAPI {
  // TODO: Add comprehensive tracing
  async getProductRecommendations(userId: string) {
    // 1. Create root span
    
    // 2. Trace user profile fetch
    const userProfile = await this.fetchUserProfile(userId);
    
    // 3. Trace parallel operations
    const [history, preferences, trending] = await Promise.all([
      this.fetchPurchaseHistory(userId),
      this.fetchPreferences(userId),
      this.fetchTrendingProducts()
    ]);
    
    // 4. Trace ML recommendation engine
    const recommendations = await this.mlRecommend({
      userProfile,
      history,
      preferences,
      trending
    });
    
    // 5. Add span attributes for analysis
    
    return recommendations;
  }
}
```

### Exercise 2: Performance Investigation (45 minutes)

**Scenario**: Users report the product search is slow. Use tracing to find bottlenecks.

Given traces showing:
- Search endpoint: 2.5s total
- Database query: 800ms
- Elasticsearch: 1.2s
- Post-processing: 500ms

Tasks:
1. Identify optimization opportunities
2. Determine if operations can be parallelized
3. Find caching opportunities
4. Create performance improvement plan

### Exercise 3: Cross-Service Tracing (30 minutes)

**Scenario**: Implement trace propagation across microservices.

```typescript
// Service A
export async function initiateOrder(orderId: string) {
  return tracer.startActiveSpan('initiate-order', async (span) => {
    // TODO: Propagate trace to Service B
    const headers = // ?
    
    const response = await fetch('http://service-b/process', {
      headers,
      body: JSON.stringify({ orderId })
    });
  });
}

// Service B
export async function processOrder(req: Request) {
  // TODO: Extract trace context and continue span
  const traceContext = // ?
  
  return tracer.startActiveSpan('process-order', async (span) => {
    // Processing logic
  }, { traceContext });
}
```

## Day 2, Session 1: Resilience Patterns Workshop (2 hours)

### Exercise 1: Circuit Breaker Implementation (45 minutes)

**Scenario**: Protect your application from a flaky third-party API.

```typescript
// workshop/weather-service.ts
import { circuitBreaker, retryPolicy } from '@/lib/resilience';

export class WeatherService {
  private breaker = circuitBreaker({
    name: 'weather-api',
    failureThreshold: 5,
    resetTimeout: 30000
  });
  
  private retry = retryPolicy({
    maxAttempts: 3,
    strategy: 'exponential'
  });
  
  // TODO: Implement resilient weather fetching
  async getWeather(city: string) {
    // 1. Use circuit breaker
    // 2. Add retry logic
    // 3. Implement fallback
    // 4. Add monitoring
  }
  
  // Bonus: Implement cache layer
}
```

### Exercise 2: Load Testing Resilience (45 minutes)

**Scenario**: Test system behavior under load with failing dependencies.

```bash
# Terminal 1: Start mock failing service
npm run workshop:mock-failing-service

# Terminal 2: Run load test
npm run workshop:load-test -- --users=100 --duration=300
```

Observe and document:
1. When circuit breakers open
2. System behavior during degradation
3. Recovery patterns
4. User experience impact

### Exercise 3: Bulkhead Pattern (30 minutes)

**Scenario**: Prevent resource exhaustion from heavy operations.

```typescript
// workshop/resource-manager.ts
export class ResourceManager {
  // TODO: Implement bulkheads for different operation types
  
  async processUserData(userId: string) {
    // Should be limited to 5 concurrent
  }
  
  async generateReport(reportId: string) {
    // Should be limited to 2 concurrent
  }
  
  async sendNotification(userId: string) {
    // Should be limited to 20 concurrent
  }
}

// Test with concurrent operations
```

## Day 2, Session 2: Runbook Automation Workshop (2 hours)

### Exercise 1: Create Custom Runbook (45 minutes)

**Scenario**: Automate the response to high memory usage alerts.

```typescript
// workshop/memory-runbook.ts
import { runbook } from '@/lib/runbooks';

// TODO: Create comprehensive memory management runbook
const memoryManagementRunbook = runbook()
  .withMetadata({
    id: 'workshop-memory-management',
    name: 'Memory Management Runbook',
    description: 'Handles high memory situations'
  })
  // Add steps:
  // 1. Check memory usage
  // 2. Identify top consumers
  // 3. Clear caches if safe
  // 4. Restart services if needed
  // 5. Alert if manual intervention required
  .register();
```

### Exercise 2: Incident Simulation (45 minutes)

**Scenario**: Production incident simulation with automated response.

```bash
# Start incident simulation
npm run workshop:simulate-incident -- --type=database-slowdown
```

Your tasks:
1. Identify the issue using logs and traces
2. Execute appropriate runbook
3. Monitor recovery
4. Document lessons learned

### Exercise 3: Runbook Testing (30 minutes)

**Scenario**: Create comprehensive tests for your runbook.

```typescript
// workshop/runbook-tests.ts
describe('Memory Management Runbook', () => {
  // TODO: Test each decision path
  // TODO: Test failure scenarios
  // TODO: Test notifications
  // TODO: Test idempotency
});
```

## Final Project: End-to-End Incident Response (1 hour)

### Scenario
You're on-call and receive an alert: "API response times degraded - P95 > 2s"

### Your Mission
1. **Investigate** using logging and tracing
2. **Diagnose** the root cause
3. **Execute** appropriate runbook
4. **Monitor** recovery
5. **Document** incident report

### Available Tools
- All logging commands
- Tracing UI at http://localhost:3000/traces
- Runbook execution API
- Circuit breaker dashboard
- Mock incident generator

### Success Criteria
- Root cause identified within 15 minutes
- Appropriate runbook executed
- Service recovered to normal
- Incident report completed

## Workshop Wrap-up

### Key Takeaways Checklist
- [ ] Can implement structured logging with context
- [ ] Can create and analyze distributed traces
- [ ] Can implement circuit breakers and retry logic
- [ ] Can create and execute runbooks
- [ ] Can investigate issues using observability tools
- [ ] Understand resilience patterns

### Next Steps
1. Shadow an on-call rotation
2. Create runbook for your team's service
3. Set up personal dashboards
4. Join daily standup for operational updates

### Resources
- Workshop code: `/workshop`
- Slides: `/docs/training/slides`
- Recording: Available in team drive
- Support: #operational-excellence

### Feedback Survey
Please complete: http://feedback.blipee.com/ops-workshop

---

*Workshop Version: 1.0.0*  
*Last Updated: [DATE]*