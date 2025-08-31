# Operational Knowledge Assessment

## Phase 4, Task 4.5: Team Knowledge Validation

This assessment validates understanding of operational excellence practices.

## Instructions

- Time limit: 90 minutes
- Open book: You may reference documentation
- Focus on practical application, not memorization

## Section 1: Logging (20 points)

### Question 1.1 (5 points)
Given the following code, identify issues and provide the corrected version:

```typescript
async function transferFunds(from: string, to: string, amount: number) {
  console.log(`Transferring ${amount} from ${from} to ${to}`);
  
  try {
    const result = await db.transfer(from, to, amount);
    console.log('Success!');
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
}
```

**Issues to identify:**
- [ ] Not using structured logger
- [ ] Missing correlation ID
- [ ] Insufficient context in logs
- [ ] Poor error logging

**Your corrected version:**
```typescript
// Write your answer here
```

### Question 1.2 (5 points)
Write a log query to find all failed payment transactions over $1000 in the last 24 hours for user "user-123".

```bash
# Your query:
```

### Question 1.3 (10 points)
Design a logging strategy for a multi-step order processing system. Include:
- What to log at each step
- Appropriate log levels
- Context to include
- How to track the flow

## Section 2: Distributed Tracing (20 points)

### Question 2.1 (10 points)
Create a trace for the following operation, ensuring proper span hierarchy:

```typescript
async function fulfillOrder(orderId: string) {
  // 1. Validate order
  const order = await validateOrder(orderId);
  
  // 2. Check inventory (parallel)
  // 3. Charge payment (parallel)
  const [inventory, payment] = await Promise.all([
    checkInventory(order.items),
    chargePayment(order.payment)
  ]);
  
  // 4. Ship order
  const shipping = await createShipment(order, inventory);
  
  // 5. Send confirmation
  await sendConfirmation(order.email, shipping);
  
  return { orderId, shippingId: shipping.id };
}

// Add tracing:
```

### Question 2.2 (5 points)
You notice a trace shows the following timings:
- Total request: 5.2s
- Database query: 0.3s
- External API call: 4.5s
- Processing: 0.4s

What optimizations would you recommend? Explain your reasoning.

### Question 2.3 (5 points)
How would you propagate trace context from a Node.js service to a Python service via HTTP?

**Node.js side:**
```typescript
// Your code
```

**Python side:**
```python
# Your code
```

## Section 3: Resilience Patterns (20 points)

### Question 3.1 (10 points)
Implement a resilient email service that:
- Uses circuit breaker (opens after 5 failures)
- Retries with exponential backoff (max 3 attempts)
- Falls back to secondary provider
- Logs all attempts

```typescript
class EmailService {
  // Your implementation
}
```

### Question 3.2 (5 points)
Explain when you would use each pattern:

1. **Circuit Breaker**:
2. **Retry Policy**:
3. **Bulkhead**:
4. **Timeout**:

### Question 3.3 (5 points)
A circuit breaker for a payment service has the following metrics:
- Failure rate: 15%
- Reset timeout: 30s
- Current state: OPEN
- Time in OPEN state: 25s

What happens in the next 10 seconds? Draw a state diagram.

## Section 4: Runbook Automation (20 points)

### Question 4.1 (15 points)
Create a runbook for handling a "Database Connection Pool Exhausted" alert that:
1. Checks current connections
2. Identifies long-running queries
3. Kills queries running > 5 minutes
4. Increases pool size if needed
5. Alerts DBA if problem persists

```typescript
const dbPoolRunbook = runbook()
  // Your implementation
  .register();
```

### Question 4.2 (5 points)
List 5 characteristics of a good runbook and explain why each is important.

1. 
2. 
3. 
4. 
5. 

## Section 5: Practical Scenarios (20 points)

### Scenario 5.1 (10 points)
You receive an alert: "Error rate spike: 25% of requests failing"

Describe your investigation process step-by-step, including:
- Commands you would run
- What you would look for
- Decision points
- Potential remediation steps

### Scenario 5.2 (10 points)
Design a monitoring strategy for a new AI-powered feature that:
- Calls multiple AI providers
- Caches responses
- Has strict latency requirements (<2s)
- Costs $0.01 per uncached request

Include:
- Key metrics to track
- Alert thresholds
- Cost optimization approach
- Performance monitoring

## Bonus Section: System Design (10 points)

Design an observability architecture for a microservices system with:
- 10 services
- 1M requests/day
- 99.9% uptime SLA
- 15-day log retention requirement

Include:
- Technology choices
- Data flow
- Cost considerations
- Scaling approach

## Answer Key Highlights

### Expected Competencies

**Logging**
- Structured logging with appropriate context
- Correlation ID usage
- Sensitive data handling
- Log level selection

**Tracing**
- Span creation and hierarchy
- Attribute selection
- Context propagation
- Performance analysis

**Resilience**
- Pattern selection
- Configuration tuning
- Fallback strategies
- Error handling

**Runbooks**
- Logical flow design
- Error handling
- Idempotency
- Clear documentation

**Troubleshooting**
- Systematic approach
- Tool utilization
- Root cause analysis
- Communication

### Scoring Guide

- 90-100: Expert - Ready for on-call rotation lead
- 80-89: Proficient - Ready for on-call rotation
- 70-79: Competent - Ready with supervision
- 60-69: Developing - Needs additional training
- <60: Beginner - Requires workshop attendance

### Follow-up Actions

Based on score:
1. **Expert**: Lead training sessions
2. **Proficient**: Join on-call rotation
3. **Competent**: Shadow on-call shifts
4. **Developing**: Attend workshop + mentoring
5. **Beginner**: Complete online training first

---

*Assessment Version: 1.0.0*  
*Passing Score: 70%*