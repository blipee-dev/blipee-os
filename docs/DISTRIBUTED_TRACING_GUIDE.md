# Distributed Tracing Guide

## Phase 4, Task 4.2: OpenTelemetry Integration

This guide covers the distributed tracing implementation using OpenTelemetry for comprehensive observability across the blipee-os platform.

## Overview

The distributed tracing system provides:
- End-to-end request tracing across services
- Automatic instrumentation for HTTP, database, and AI operations
- W3C Trace Context propagation
- Custom spans for business-specific operations
- Integration with popular observability platforms

## Quick Start

### 1. Environment Setup

```bash
# Required environment variables
OTEL_SERVICE_NAME=blipee-os
OTEL_SERVICE_VERSION=1.0.0
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SAMPLING_RATE=1.0

# Optional: Authentication for cloud providers
OTEL_EXPORTER_OTLP_HEADERS='{"Authorization":"Bearer YOUR_TOKEN"}'

# Disable tracing (for testing)
OTEL_ENABLED=false
```

### 2. Basic Usage

#### Automatic Tracing for API Routes

```typescript
import { withTracing } from '@/middleware/tracing';

// Automatically traced
export const GET = withTracing(async (request: NextRequest) => {
  const data = await fetchData();
  return NextResponse.json(data);
});
```

#### Manual Tracing

```typescript
import { tracer, traceAsync } from '@/lib/tracing';

// Trace a specific operation
const result = await traceAsync('process_data', async () => {
  return await complexOperation();
}, {
  userId: 'user-123',
  operationType: 'batch_processing'
});

// Create custom spans
await tracer.startActiveSpan('custom_operation', async (span) => {
  span.setAttribute('custom.attribute', 'value');
  
  // Your code here
  
  span.addEvent('milestone_reached', {
    progress: 50
  });
});
```

## AI Operations Tracing

### Chat Completions

```typescript
import { traceAIChatCompletion } from '@/lib/tracing/ai-tracing';

const response = await traceAIChatCompletion(
  'openai',
  'gpt-4',
  async () => {
    return await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages
    });
  },
  {
    messages: messages.length,
    maxTokens: 1000,
    temperature: 0.7,
    userId: 'user-123',
    organizationId: 'org-456'
  }
);
```

### Semantic Cache

```typescript
import { traceSemanticCache } from '@/lib/tracing/ai-tracing';

// Cache lookup
const cached = await traceSemanticCache(
  'lookup',
  cacheKey,
  async () => {
    return await cache.get(cacheKey);
  }
);

// Cache store
await traceSemanticCache(
  'store',
  cacheKey,
  async () => {
    await cache.set(cacheKey, value, ttl);
  }
);
```

### ML Operations

```typescript
import { traceMLOperation } from '@/lib/tracing/ai-tracing';

const model = await traceMLOperation(
  'train',
  'energy_prediction',
  async () => {
    return await trainModel(data);
  },
  {
    datasetSize: 10000,
    features: 50,
    epochs: 10,
    batchSize: 32
  }
);
```

## Database Tracing

### SQL Queries

```typescript
import { traceDatabaseQuery } from '@/lib/tracing/database-tracing';

const result = await traceDatabaseQuery(
  'SELECT',
  'SELECT * FROM users WHERE organization_id = $1',
  async () => {
    return await db.query(query, params);
  },
  {
    table: 'users',
    params: [orgId],
    organizationId: orgId
  }
);
```

### Transactions

```typescript
import { traceDatabaseTransaction } from '@/lib/tracing/database-tracing';

const result = await traceDatabaseTransaction(
  transactionId,
  async () => {
    await db.query('BEGIN');
    try {
      // Your transactional operations
      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  },
  {
    isolationLevel: 'READ COMMITTED',
    readOnly: false
  }
);
```

### Prisma Integration

```typescript
import { tracePrismaOperation } from '@/lib/tracing/database-tracing';

const users = await tracePrismaOperation(
  'User',
  'findMany',
  async () => {
    return await prisma.user.findMany({
      where: { organizationId },
      include: { profile: true }
    });
  },
  {
    where: { organizationId },
    include: { profile: true }
  }
);
```

## HTTP Tracing

### Outgoing Requests

```typescript
import { traceOutgoingRequest, traceFetch } from '@/lib/tracing/http-tracing';

// Using fetch with automatic tracing
const response = await traceFetch('https://api.example.com/data', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// Custom HTTP client
const data = await traceOutgoingRequest(
  'GET',
  'https://api.example.com/resource',
  async () => {
    return await customHttpClient.get(url);
  }
);
```

### API Client Tracing

```typescript
import { traceApiClient } from '@/lib/tracing/http-tracing';

const weatherData = await traceApiClient(
  'weather-service',
  'get-forecast',
  async () => {
    return await weatherAPI.getForecast(location);
  },
  {
    method: 'GET',
    endpoint: '/forecast',
    params: { lat, lon }
  }
);
```

## Context Propagation

### W3C Trace Context

The system automatically propagates trace context using W3C standards:

```typescript
// Headers are automatically added
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
tracestate: congo=t61rcWkgMzE

// Extract trace context from incoming requests
import { extractTraceContext } from '@/lib/tracing/propagation';

const traceContext = extractTraceContext(request);
```

### Baggage Propagation

```typescript
import { baggage } from '@/lib/tracing/propagation';

// Set baggage
baggage.set('user.id', 'user-123');
baggage.set('tenant.id', 'tenant-456');

// Get baggage
const userId = baggage.get('user.id');

// Get all baggage
const allBaggage = baggage.getAll();
```

## Custom Instrumentation

### Class Decorator

```typescript
import { Trace } from '@/lib/tracing';

class MyService {
  @Trace('MyService.processData')
  async processData(input: string): Promise<string> {
    // Automatically traced
    return await transform(input);
  }

  @Trace('MyService.complexOperation', {
    kind: SpanKind.INTERNAL,
    attributes: { 
      service: 'data-processor',
      version: '1.0' 
    }
  })
  async complexOperation(): Promise<void> {
    // Method is wrapped in a span with custom attributes
  }
}
```

### Manual Span Management

```typescript
import { tracer } from '@/lib/tracing';

const span = tracer.startSpan('manual_operation', {
  kind: SpanKind.INTERNAL,
  attributes: {
    'operation.type': 'batch',
    'operation.size': 1000
  }
});

try {
  // Set attributes during execution
  span.setAttribute('progress', 0);
  
  for (let i = 0; i < items.length; i++) {
    await processItem(items[i]);
    
    // Update progress
    if (i % 100 === 0) {
      span.setAttribute('progress', (i / items.length) * 100);
      span.addEvent('progress_update', { 
        processed: i,
        total: items.length 
      });
    }
  }
  
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.recordException(error);
  span.setStatus({ 
    code: SpanStatusCode.ERROR,
    message: error.message 
  });
  throw error;
} finally {
  span.end();
}
```

## Integration with Observability Platforms

### Jaeger

```bash
# docker-compose.yml
services:
  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686"  # Jaeger UI
      - "4318:4318"    # OTLP HTTP

# Environment
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

### Datadog

```bash
# Environment variables
OTEL_EXPORTER_OTLP_ENDPOINT=https://trace.agent.datadoghq.com
OTEL_EXPORTER_OTLP_HEADERS='{"DD-API-KEY":"your-api-key"}'
DD_ENV=production
DD_SERVICE=blipee-os
DD_VERSION=1.0.0
```

### AWS X-Ray

```bash
# Environment variables
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-region.amazonaws.com/v1/traces
AWS_REGION=us-west-2
# Authentication via IAM role or credentials
```

### Grafana Tempo

```bash
# Environment variables
OTEL_EXPORTER_OTLP_ENDPOINT=http://tempo:4318
OTEL_EXPORTER_OTLP_HEADERS='{"X-Scope-OrgID":"your-org"}'
```

## Performance Considerations

### Sampling

Configure sampling to reduce overhead:

```bash
# Sample 10% of requests
OTEL_SAMPLING_RATE=0.1

# Or use custom sampler
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';

const sampler = new TraceIdRatioBasedSampler(0.1);
```

### Batch Processing

Spans are batched by default with these settings:
- Max queue size: 100 spans
- Max export batch size: 10 spans
- Export interval: 500ms
- Export timeout: 5s

### Overhead

Typical overhead:
- ~0.1-0.5ms per span creation
- ~2-5% CPU overhead with 100% sampling
- ~1-2KB per span in memory

## Troubleshooting

### Enable Debug Logging

```typescript
// In development
if (process.env.NODE_ENV === 'development') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
}
```

### Common Issues

1. **No traces appearing**
   - Check OTEL_ENABLED is not set to 'false'
   - Verify OTEL_EXPORTER_OTLP_ENDPOINT is correct
   - Check network connectivity to the collector

2. **Missing spans**
   - Ensure async operations are properly awaited
   - Check sampling rate (might be sampling out requests)
   - Verify instrumentation is loaded before your code

3. **High memory usage**
   - Reduce sampling rate
   - Check for span leaks (not calling span.end())
   - Reduce batch size and queue size

### Health Check

```typescript
// Check if tracing is working
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('health-check');
const span = tracer.startSpan('test');
span.setAttribute('test', true);
span.end();
console.log('Trace ID:', span.spanContext().traceId);
```

## Best Practices

1. **Use semantic conventions**
   ```typescript
   span.setAttribute('http.method', 'GET');
   span.setAttribute('http.status_code', 200);
   span.setAttribute('db.system', 'postgresql');
   ```

2. **Add meaningful events**
   ```typescript
   span.addEvent('payment_processed', {
     amount: 99.99,
     currency: 'USD',
     method: 'credit_card'
   });
   ```

3. **Set appropriate span status**
   ```typescript
   if (response.status >= 400) {
     span.setStatus({
       code: SpanStatusCode.ERROR,
       message: `HTTP ${response.status}`
     });
   }
   ```

4. **Use span links for relationships**
   ```typescript
   const span = tracer.startSpan('batch_process', {
     links: items.map(item => ({
       context: item.spanContext
     }))
   });
   ```

5. **Avoid high-cardinality attributes**
   ```typescript
   // Bad: unique values
   span.setAttribute('user.email', email);
   
   // Good: categorical
   span.setAttribute('user.type', 'premium');
   ```

## Security Considerations

1. **Never trace sensitive data**
   - Passwords, API keys, tokens
   - PII (personally identifiable information)
   - Credit card numbers

2. **Sanitize SQL queries**
   ```typescript
   // Automatically sanitized in our implementation
   SELECT * FROM users WHERE email = '?' // not the actual email
   ```

3. **Use secure transport**
   ```bash
   # For production
   OTEL_EXPORTER_OTLP_ENDPOINT=https://collector.example.com
   OTEL_EXPORTER_OTLP_HEADERS='{"Authorization":"Bearer token"}'
   ```

4. **Implement access controls**
   - Limit who can view traces
   - Use role-based access in your observability platform
   - Audit trace access

## Monitoring the Monitoring

Track the health of your tracing system:

```typescript
// Monitor export failures
const exportFailures = meter.createCounter('otel.exporter.failures');

// Monitor span creation rate
const spanRate = meter.createCounter('otel.spans.created');

// Monitor sampling decisions
const samplingDecisions = meter.createCounter('otel.sampling.decisions');
```