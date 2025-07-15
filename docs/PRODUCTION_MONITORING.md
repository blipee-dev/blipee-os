# 🔍 Production Monitoring & Observability

## Overview

blipee OS includes comprehensive production monitoring with OpenTelemetry, health checks, alerting, and metrics collection. The system provides full observability into all components including agents, ML models, API performance, and business metrics.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Orchestrator│  │   Agents    │  │  ML Models  │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         └─────────────────┴─────────────────┘           │
│                           │                              │
│                    ┌──────▼──────┐                      │
│                    │  Telemetry  │                      │
│                    │   Service   │                      │
│                    └──────┬──────┘                      │
└───────────────────────────┼─────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐      ┌──────▼──────┐    ┌────▼────┐
   │ Metrics │      │   Traces    │    │  Alerts │
   └─────────┘      └─────────────┘    └─────────┘
        │                  │                  │
   Prometheus         OTLP Export        Multi-channel
```

## Components

### 1. OpenTelemetry Integration

**Features:**
- Distributed tracing across all services
- Custom metrics for business KPIs
- Auto-instrumentation for HTTP, database, and async operations
- Prometheus metrics endpoint
- OTLP export for cloud providers

**Configuration:**
```env
# OpenTelemetry Configuration
OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector.example.com
OTEL_API_KEY=your-api-key
OTEL_SERVICE_NAME=blipee-os
OTEL_ENVIRONMENT=production
```

### 2. Health Check System

**Endpoints:**
- `/api/health` - Comprehensive health status
- `/api/health/ready` - Kubernetes readiness probe
- `/api/health/live` - Kubernetes liveness probe

**Health Checks:**
- **Database**: Connection and query performance
- **Agents**: Running status and recent errors
- **ML Models**: Deployment status and latency
- **External APIs**: Connection status
- **Network**: Peer connections and benchmarks

**Example Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-07-15T12:00:00Z",
  "version": "1.0.0",
  "checks": {
    "database": {
      "status": "pass",
      "message": "Database healthy",
      "latency": 45
    },
    "agents": {
      "status": "pass",
      "message": "All 4 agents healthy",
      "details": {
        "activeAgents": 4,
        "totalAgents": 4
      }
    },
    "mlModels": {
      "status": "pass",
      "message": "All 4 ML models healthy",
      "details": {
        "deployedModels": 4,
        "avgLatency": 125
      }
    }
  },
  "metrics": {
    "uptime": 86400,
    "requestsPerMinute": 150,
    "averageResponseTime": 250,
    "activeUsers": 42
  }
}
```

### 3. Metrics Collection

**Business Metrics:**
- User messages processed
- Emissions tracked (kg CO2e)
- Active organizations
- Network connections
- Benchmarks performed

**Technical Metrics:**
- API request latency
- Agent execution duration
- ML prediction latency
- Error rates by endpoint
- Database query performance

**Custom Metrics Example:**
```typescript
// Record agent execution
telemetry.recordAgentExecution(
  'esg-chief-of-staff',
  executionTime,
  success
);

// Record ML prediction
telemetry.recordMLPrediction(
  'emissions-predictor',
  latency,
  confidence
);

// Record business metric
telemetry.recordBusinessMetric(
  'emissions',
  1234.5,
  { organization: orgId, scope: 'scope1' }
);
```

### 4. Alerting System

**Default Alert Rules:**

1. **High Agent Failure Rate**
   - Threshold: >10 errors in 5 minutes
   - Severity: Critical
   - Channels: Email, Slack

2. **High API Latency**
   - Threshold: >2 seconds average
   - Severity: Warning
   - Channels: Slack

3. **Low ML Model Accuracy**
   - Threshold: <80% accuracy
   - Severity: Warning
   - Channels: Email

4. **Database Connection Issues**
   - Threshold: Any failure
   - Severity: Critical
   - Channels: Email, PagerDuty

5. **Network Growth Stalled**
   - Threshold: <100 connections in 24h
   - Severity: Info
   - Channels: Slack

**Alert Channels:**
- **Email**: Detailed alerts with context
- **Slack**: Real-time notifications with formatting
- **PagerDuty**: Critical incident management
- **Webhook**: Custom integrations

**Configuration:**
```env
# Alert Channels
ALERT_EMAIL_DEFAULT=ops@company.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx
PAGERDUTY_ROUTING_KEY=xxx
```

### 5. Prometheus Metrics

**Endpoint:** `http://localhost:9464/metrics`

**Available Metrics:**
```
# Agent Metrics
agent_executions_total{agent="esg-chief-of-staff",status="success"}
agent_errors_total{agent="carbon-hunter"}
agent_execution_duration_seconds{agent="compliance-guardian"}

# ML Metrics
ml_predictions_total{model="emissions-predictor"}
ml_prediction_latency_ms{model="energy-optimizer"}
ml_model_accuracy{model="compliance-risk"}

# API Metrics
api_requests_total{endpoint="/api/v1/orchestrator",method="POST",status="200"}
api_errors_total{endpoint="/api/agents/status",method="GET"}
api_request_duration_ms{endpoint="/api/ml/predict",method="POST"}

# Network Metrics
network_connections_active{organization="org-123"}
benchmarks_performed_total{organization="org-456"}

# Business Metrics
user_messages_total{intent="esg_analysis",organization="org-789"}
emissions_tracked_kg{organization="org-123",scope="scope1"}
organizations_active
```

## Deployment Configuration

### Kubernetes Integration

**Health Check Configuration:**
```yaml
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Docker Compose

```yaml
services:
  app:
    image: blipee-os:latest
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4318
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Monitoring Stack

**Recommended Setup:**
1. **Metrics**: Prometheus + Grafana
2. **Traces**: Jaeger or Tempo
3. **Logs**: Loki or ElasticSearch
4. **Alerts**: AlertManager + PagerDuty

## Usage

### Initialize Monitoring

```typescript
import { initializeMonitoring } from '@/lib/monitoring';

// In your app initialization
await initializeMonitoring();
```

### Add Custom Metrics

```typescript
import { telemetry } from '@/lib/monitoring';

// Create custom metric
const customMetric = meter.createCounter('custom_events_total', {
  description: 'Total custom events'
});

// Record metric
customMetric.add(1, { type: 'special_event' });
```

### Add Custom Alerts

```typescript
import { alerting } from '@/lib/monitoring';

// Add custom alert rule
alerting.addRule({
  id: 'custom-alert',
  name: 'Custom Alert',
  condition: {
    metric: 'custom_metric',
    operator: '>',
    threshold: 100,
    duration: 300
  },
  severity: 'warning',
  channels: [{ type: 'slack', config: {} }],
  enabled: true
});
```

### Trace Custom Operations

```typescript
import { telemetry } from '@/lib/monitoring';

// Trace async operation
const result = await telemetry.traceAsync(
  'custom.operation',
  async () => {
    // Your operation here
    return processData();
  },
  { customAttribute: 'value' }
);
```

## Dashboards

### Grafana Dashboard JSON

Create dashboards for:
1. **System Overview**: Health status, uptime, request rate
2. **Agent Performance**: Execution counts, errors, duration
3. **ML Models**: Predictions, accuracy, latency
4. **Business Metrics**: Messages, emissions, organizations
5. **Network Intelligence**: Connections, benchmarks, insights

### Key Metrics to Monitor

**SLIs (Service Level Indicators):**
- API latency p95 < 500ms
- Agent success rate > 99%
- ML prediction latency < 200ms
- Error rate < 1%
- Uptime > 99.9%

**Business KPIs:**
- Daily active organizations
- Messages processed per hour
- Emissions tracked (tCO2e)
- Network growth rate
- Benchmark participation

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Check agent task queues
   - Review ML model memory allocation
   - Monitor database connection pools

2. **Slow API Response**
   - Check database query performance
   - Review agent execution times
   - Monitor external API latency

3. **Agent Failures**
   - Check agent logs
   - Review error patterns
   - Verify external dependencies

### Debug Commands

```bash
# Check health status
curl http://localhost:3000/api/health

# View Prometheus metrics
curl http://localhost:9464/metrics

# Check agent status
curl http://localhost:3000/api/v1/agents/status

# Test alert webhook
curl -X POST http://localhost:3000/api/test-alert
```

## Best Practices

1. **Set Appropriate Thresholds**
   - Base on historical data
   - Consider peak vs normal hours
   - Use percentiles not averages

2. **Alert Fatigue Prevention**
   - Use cooldown periods
   - Group related alerts
   - Escalate by severity

3. **Metric Naming**
   - Follow Prometheus conventions
   - Use consistent labels
   - Document custom metrics

4. **Performance Impact**
   - Sample high-volume metrics
   - Use async metric recording
   - Batch metric exports

## Security Considerations

1. **Metrics Endpoint Security**
   - Use authentication for `/metrics`
   - Restrict access by IP
   - Encrypt metric exports

2. **Sensitive Data**
   - Don't include PII in metrics
   - Anonymize organization IDs
   - Redact sensitive values

3. **Alert Security**
   - Secure webhook endpoints
   - Rotate alert tokens
   - Audit alert access

## Conclusion

The production monitoring system provides comprehensive observability into blipee OS, enabling proactive issue detection, performance optimization, and business insight generation. With OpenTelemetry at its core, the system is vendor-agnostic and ready for any cloud deployment.