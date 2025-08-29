# OpenTelemetry Performance Monitoring

## Overview

The Blipee OS platform includes comprehensive performance monitoring using OpenTelemetry, providing distributed tracing, metrics collection, and performance insights across all application components.

## Features

- **Distributed Tracing**: Track requests across services and components
- **Automatic Instrumentation**: HTTP, database, and framework instrumentation
- **Custom Instrumentation**: Trace specific functions and operations
- **Metrics Collection**: Performance metrics, business metrics, and system metrics
- **Multiple Exporters**: Console, OTLP, and custom exporters
- **Prometheus Compatibility**: Export metrics in Prometheus format

## Configuration

### Environment Variables

```bash
# Enable OpenTelemetry (default: false)
OTEL_ENABLED=true

# OTLP Endpoint for traces and metrics
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-collector.example.com

# API Key for authentication (if required)
OTEL_API_KEY=your-api-key

# Service configuration
OTEL_SERVICE_NAME=blipee-os
OTEL_SERVICE_VERSION=1.0.0
OTEL_DEPLOYMENT_ENVIRONMENT=production
```

### Initialization

OpenTelemetry is automatically initialized when the application starts via the `instrumentation.ts` file:

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeTelemetry } = await import('@/lib/monitoring/telemetry');
    
    initializeTelemetry({
      enabled: process.env.OTEL_ENABLED === 'true',
      serviceName: 'blipee-os',
      environment: process.env.NODE_ENV || 'development',
      otlpEndpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
    });
  }
}
```

## Usage

### Automatic Instrumentation

The following are automatically instrumented:
- HTTP requests and responses
- Database queries (PostgreSQL)
- Express/Next.js routes
- External HTTP calls

### Custom Tracing

#### Function Tracing

```typescript
import { traceFunction } from '@/lib/monitoring/instrumentation';

// Wrap a function
const tracedFunction = traceFunction('myOperation', async (param: string) => {
  // Your code here
  return result;
});

// Use decorator
class MyService {
  @Trace('MyService.processData')
  async processData(data: any) {
    // Your code here
  }
}
```

#### Async Operations

```typescript
import { traceAsync } from '@/lib/monitoring/instrumentation';

const result = await traceAsync('fetchUserData', async () => {
  return await fetchUser(userId);
}, {
  userId,
  source: 'api'
});
```

#### Database Queries

```typescript
import { traceDbQuery } from '@/lib/monitoring/instrumentation';

const users = await traceDbQuery('select', 'users', async () => {
  return await supabase.from('users').select('*');
});
```

#### AI Provider Calls

```typescript
import { traceAiCall } from '@/lib/monitoring/instrumentation';

const response = await traceAiCall('openai', 'chat.completion', async () => {
  return await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello' }]
  });
}, {
  model: 'gpt-4',
  tokens: 150
});
```

### Custom Metrics

#### Recording Metrics

```typescript
import { 
  recordHttpMetrics, 
  recordDbMetrics, 
  recordAiMetrics,
  recordBusinessMetrics 
} from '@/lib/monitoring/otel-metrics';

// HTTP metrics
recordHttpMetrics('GET', '/api/users', 200, 45.2);

// Database metrics
recordDbMetrics('select', 'users', 12.5, true);

// AI metrics
recordAiMetrics('openai', 'gpt-4', 1250, 500, true);

// Business metrics
recordBusinessMetrics('emissions', {
  scope: '1',
  source: 'electricity',
  co2_kg: 125.5
});
```

#### Custom Spans

```typescript
import { createSpan, addSpanAttributes } from '@/lib/monitoring/instrumentation';

const span = createSpan('customOperation');
try {
  // Your code here
  
  // Add attributes
  addSpanAttributes({
    'custom.attribute': 'value',
    'operation.type': 'batch'
  });
  
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
  throw error;
} finally {
  span.end();
}
```

## Metrics Endpoint

Access metrics via the API:

### JSON Format
```bash
curl https://your-app.com/api/metrics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "counters": {
    "http_requests_total": 12500,
    "database_queries_total": 45000
  },
  "gauges": {
    "active_connections": 25,
    "memory_usage_bytes": 134217728
  },
  "histograms": {
    "http_request_duration_ms": {
      "count": 12500,
      "sum": 625000,
      "min": 10,
      "max": 2500,
      "avg": 50,
      "p50": 45,
      "p95": 125,
      "p99": 450
    }
  },
  "timestamp": "2025-08-28T12:00:00Z"
}
```

### Prometheus Format
```bash
curl https://your-app.com/api/metrics?format=prometheus \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/users",status="200"} 5000 1693224000000
# TYPE http_request_duration histogram
http_request_duration_bucket{le="+Inf",method="GET",route="/api/users"} 5000 1693224000000
http_request_duration_sum{method="GET",route="/api/users"} 250000 1693224000000
http_request_duration_count{method="GET",route="/api/users"} 5000 1693224000000
```

## Middleware

The telemetry middleware automatically instruments all HTTP requests:

```typescript
// Applied automatically to all routes
export async function middleware(request: NextRequest) {
  return telemetryMiddleware(request, async () => {
    // Your middleware logic
    return NextResponse.next();
  });
}
```

## Performance Best Practices

1. **Sampling**: Configure sampling to reduce overhead in production
2. **Batch Processing**: Traces are batched before export
3. **Async Export**: Metrics and traces are exported asynchronously
4. **Resource Limits**: Configure max queue size and export timeouts

## Integration with Monitoring Services

### Grafana Cloud
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-central-0.grafana.net/otlp
OTEL_API_KEY=your-grafana-cloud-api-key
```

### New Relic
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp.nr-data.net
OTEL_API_KEY=your-new-relic-license-key
```

### Datadog
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://http-intake.logs.datadoghq.com/v1/input
OTEL_API_KEY=your-datadog-api-key
```

### Honeycomb
```bash
OTEL_EXPORTER_OTLP_ENDPOINT=https://api.honeycomb.io
OTEL_API_KEY=your-honeycomb-api-key
```

## Troubleshooting

### Traces Not Appearing
1. Check `OTEL_ENABLED=true` is set
2. Verify OTLP endpoint is correct
3. Check API key/authentication
4. Look for errors in logs

### High Memory Usage
1. Reduce batch size in configuration
2. Enable sampling
3. Clear old histogram data more frequently
4. Reduce trace retention

### Missing Metrics
1. Ensure metrics endpoint is accessible
2. Check authentication/authorization
3. Verify metrics are being recorded
4. Check for errors in metric callbacks

## Security Considerations

- Metrics endpoint requires admin authentication
- Sensitive data should not be included in traces
- Use environment variables for configuration
- Sanitize user input in span attributes
- Limit access to monitoring dashboards

## Future Enhancements

- Log integration with OpenTelemetry
- Exemplar support for metrics
- Trace-based testing
- Synthetic monitoring
- SLO/SLA tracking
- Cost tracking per trace