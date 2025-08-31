# Structured Logging Migration Guide

## Phase 4, Task 4.1: Migrating to Structured Logging

This guide helps you migrate existing code to use the new structured logging system implemented in Phase 4.

## Overview

The structured logging system provides:
- JSON-formatted logs with consistent structure
- Correlation ID tracking across requests
- Automatic request/response logging
- Performance monitoring
- Sensitive data redaction
- Context propagation

## Quick Start

### 1. Replace Console Logs

**Before:**
```typescript
console.log('Processing user request', userId);
console.error('Failed to process request:', error);
```

**After:**
```typescript
import { logger } from '@/lib/logging';

logger.info('Processing user request', { userId });
logger.error('Failed to process request', error, { userId });
```

### 2. Use Child Loggers for Services

**Before:**
```typescript
class UserService {
  async createUser(data: any) {
    console.log('Creating user...');
    // ...
  }
}
```

**After:**
```typescript
import { logger } from '@/lib/logging';

class UserService {
  private logger = logger.child({ 
    service: 'user-service',
    component: 'users' 
  });

  async createUser(data: any) {
    this.logger.info('Creating user', { 
      email: data.email,
      // password will be auto-redacted
      password: data.password 
    });
    // ...
  }
}
```

### 3. API Route Logging

**Before:**
```typescript
export async function GET(request: NextRequest) {
  try {
    const data = await fetchData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

**After:**
```typescript
import { withLogging } from '@/lib/logging/http-logger';

export const GET = withLogging(async (request: NextRequest) => {
  const data = await fetchData();
  return NextResponse.json(data);
});
```

### 4. Database Query Logging

**Before:**
```typescript
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
```

**After:**
```typescript
import { databaseLogger } from '@/lib/logging/database-logger';

const startTime = Date.now();
try {
  const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
  databaseLogger.logQuery(
    'SELECT * FROM users WHERE id = $1',
    [userId],
    Date.now() - startTime,
    result.rowCount
  );
  return result;
} catch (error) {
  databaseLogger.logQuery(
    'SELECT * FROM users WHERE id = $1',
    [userId],
    Date.now() - startTime,
    0,
    error
  );
  throw error;
}
```

### 5. AI Operations Logging

**Before:**
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4',
  messages: [{ role: 'user', content: prompt }]
});
```

**After:**
```typescript
import { aiLogger } from '@/lib/logging/ai-logger';

aiLogger.logRequest('chat_completion', 'openai', 'gpt-4');

try {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  });
  
  aiLogger.logResponse('chat_completion', 'openai', 'gpt-4', true, {
    tokens: response.usage,
    cost: calculateCost(response.usage)
  });
  
  return response;
} catch (error) {
  aiLogger.logError('chat_completion', error, {
    provider: 'openai',
    model: 'gpt-4'
  });
  throw error;
}
```

### 6. Performance Monitoring

**Before:**
```typescript
const startTime = Date.now();
await processData();
console.log(`Processing took ${Date.now() - startTime}ms`);
```

**After:**
```typescript
import { performanceLogger } from '@/lib/logging/performance-logger';

const endMeasure = performanceLogger.startMeasure('process_data', {
  duration: 5000, // Alert if takes > 5s
  action: 'log'
});

await processData();

const { duration } = endMeasure();
// Automatically logs if threshold exceeded
```

## Environment Variables

Add these to your `.env.local`:

```bash
# Logging Configuration
LOG_LEVEL=info                    # debug, info, warn, error
LOG_PRETTY=false                  # Pretty print in development
LOG_SERVICE_NAME=blipee-os        # Service identifier

# HTTP Logging
LOG_HTTP_ENABLED=true
LOG_HTTP_EXCLUDE_PATHS=/_next,/favicon.ico,/health

# Database Logging  
LOG_DATABASE_ENABLED=true
LOG_DATABASE_SLOW_THRESHOLD=3000  # ms
LOG_DATABASE_ALL=false           # Log all queries (verbose)

# AI Logging
LOG_AI_ENABLED=true
LOG_AI_TOKENS=true               # Log token usage
LOG_AI_COSTS=true                # Log cost tracking
LOG_AI_CACHE=false               # Log cache operations (verbose)

# Performance Logging
LOG_PERFORMANCE_ENABLED=true
LOG_PERFORMANCE_MEMORY_INTERVAL=300000    # 5 minutes
LOG_PERFORMANCE_STATS_INTERVAL=600000     # 10 minutes
```

## Best Practices

### 1. Use Structured Data

```typescript
// ❌ Don't do this
logger.info(`User ${userId} logged in from ${ip}`);

// ✅ Do this
logger.info('User logged in', { userId, ip });
```

### 2. Add Context Early

```typescript
// In middleware or route handlers
logger.runWithContext({ userId, organizationId }, async () => {
  // All logs within this scope will include userId and organizationId
  await processUserRequest();
});
```

### 3. Use Appropriate Log Levels

- **DEBUG**: Detailed information for debugging
- **INFO**: General information about application flow
- **WARN**: Warning conditions that might need attention
- **ERROR**: Error conditions that need immediate attention

### 4. Include Relevant Context

```typescript
logger.error('Payment processing failed', error, {
  userId,
  orderId,
  amount,
  provider: 'stripe',
  attemptNumber: 3
});
```

### 5. Use Decorators for Cross-Cutting Concerns

```typescript
import { MeasurePerformance } from '@/lib/logging/performance-logger';
import { LogAIOperation } from '@/lib/logging/ai-logger';

class AIService {
  @LogAIOperation('generate_summary')
  @MeasurePerformance('ai_generate_summary', { duration: 5000 })
  async generateSummary(text: string): Promise<string> {
    // Method is automatically logged and measured
    return await this.callAI(text);
  }
}
```

## Common Patterns

### Request Tracing

```typescript
// Correlation ID is automatically propagated
export const GET = withLogging(async (request: NextRequest) => {
  const service = new SomeService();
  const data = await service.getData(); // Logs will include same correlation ID
  return NextResponse.json(data);
});
```

### Error Handling

```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', error, {
    operation: 'risky_operation',
    context: { /* relevant data */ },
    recovery: 'retrying in 5 seconds'
  });
  
  // Handle error...
}
```

### Batch Operations

```typescript
const results = await Promise.allSettled(items.map(async (item) => {
  const childLogger = logger.child({ itemId: item.id });
  
  try {
    childLogger.info('Processing item');
    const result = await processItem(item);
    childLogger.info('Item processed successfully');
    return result;
  } catch (error) {
    childLogger.error('Failed to process item', error);
    throw error;
  }
}));
```

## Testing

When testing, you can mock the logger:

```typescript
jest.mock('@/lib/logging', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn().mockReturnThis()
  }
}));
```

## Monitoring Integration

The structured logs are designed to work with monitoring services:

1. **Datadog**: Use JSON parsing to extract fields
2. **CloudWatch**: Create metric filters on structured fields
3. **Elasticsearch**: Direct JSON ingestion
4. **Grafana Loki**: Use LogQL to query structured data

Example CloudWatch Insights query:
```
fields @timestamp, correlationId, userId, duration, error.message
| filter service = "blipee-os"
| filter level = "ERROR"
| stats count() by error.message
```

## Rollback Plan

If you need to temporarily disable structured logging:

1. Set `LOG_LEVEL=ERROR` to reduce log volume
2. Disable specific loggers:
   - `LOG_HTTP_ENABLED=false`
   - `LOG_DATABASE_ENABLED=false`
   - `LOG_AI_ENABLED=false`

## Need Help?

- Check the example implementations in `/src/lib/logging/examples/`
- Review the test files for usage patterns
- Consult the API documentation in `/docs/API_ENDPOINTS_REFERENCE.md`