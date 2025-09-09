# Runbook Automation Guide

## Phase 4, Task 4.4: Automated Operational Procedures

This guide covers the runbook automation system for standardizing and automating operational procedures in blipee-os.

## Overview

The runbook system provides:
- **Automated Execution** - Step-by-step procedure automation
- **Decision Trees** - Conditional branching based on checks
- **Parallel Execution** - Run multiple steps concurrently
- **Error Handling** - Automatic retry and failure paths
- **Notifications** - Alert relevant teams at key points
- **Audit Trail** - Complete execution history

## Quick Start

### Using Pre-built Runbooks

```typescript
import { runbookEngine } from '@/lib/runbooks';

// Execute AI service recovery runbook
const execution = await runbookEngine.execute(
  'ai-service-recovery',
  { triggeredBy: 'monitoring-alert' },
  { async: true }
);

console.log(`Runbook executing: ${execution.executionId}`);
```

### Building Custom Runbooks

```typescript
import { runbook } from '@/lib/runbooks';

const customRunbook = runbook()
  .withMetadata({
    id: 'custom-recovery',
    name: 'Custom Service Recovery',
    description: 'Recover custom service',
    version: '1.0.0'
  })
  .check('health-check', 'Check service health', async () => {
    const response = await fetch('/api/health');
    return response.ok;
  })
  .onSuccess('notify-ok')
  .onFailure('restart-service')
  .action('restart-service', 'Restart the service', async () => {
    await restartService();
  })
  .onSuccess('verify-restart')
  .notify('notify-ok', 'Service is healthy', 'Service operating normally')
  .startWith('health-check')
  .register();
```

## Step Types

### 1. Check Steps

Perform checks and branch based on results:

```typescript
.check('database-check', 'Check database connection', async () => {
  try {
    await db.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
})
.onSuccess('continue-processing')
.onFailure('handle-db-error')
```

### 2. Action Steps

Execute operations that modify state:

```typescript
.action('clear-cache', 'Clear application cache', async () => {
  await cache.clear();
  logger.info('Cache cleared');
})
.withTimeout(30000)  // 30 second timeout
.retryable()         // Retry on failure
.onSuccess('verify-cache-cleared')
```

### 3. Decision Steps

Branch based on complex conditions:

```typescript
.decision('evaluate-load', 'Check system load', (context) => {
  const load = context.systemLoad;
  if (load > 0.9) return 'critical';
  if (load > 0.7) return 'high';
  return 'normal';
})
.branch('critical', 'emergency-scale')
.branch('high', 'gradual-scale')
.branch('normal', 'monitor')
```

### 4. Notification Steps

Send alerts and updates:

```typescript
.notify('alert-ops', 'Alert operations team',
  'Service degradation detected - runbook executing',
  ['slack', 'email', 'pagerduty']
)
```

### 5. Wait Steps

Pause execution for specified duration:

```typescript
.wait('cooldown', 'Wait for service to stabilize', 30000)  // 30 seconds
.onSuccess('verify-stability')
```

### 6. Parallel Steps

Execute multiple steps concurrently:

```typescript
.parallel('restart-all', 'Restart all services',
  'restart-api',
  'restart-workers',
  'restart-cache'
)
.onSuccess('verify-all-services')
```

### 7. Loop Steps

Iterate over items:

```typescript
.loop('process-queues', 'Process all queues',
  ['queue-1', 'queue-2', 'queue-3'],
  'process-single-queue'
)
```

## Pre-built Runbooks

### AI Service Recovery

Handles AI service failures with automatic recovery:

```typescript
// Triggered by AI service failure
await runbookEngine.execute('ai-service-recovery');

// Steps:
// 1. Health check
// 2. Check dependencies
// 3. Reset circuit breaker
// 4. Clear cache
// 5. Restart workers
// 6. Verify recovery
// 7. Escalate if needed
```

### Database Performance Recovery

Handles database performance degradation:

```typescript
// Triggered by slow query alerts
await runbookEngine.execute('database-performance', {
  slowQueryThreshold: 5000  // 5 seconds
});

// Steps:
// 1. Check connection pool
// 2. Identify slow queries
// 3. Kill long-running queries
// 4. Optimize indexes
// 5. Enable read replicas if needed
// 6. Verify performance
```

### High Memory Usage Mitigation

Handles memory pressure situations:

```typescript
// Triggered by memory alerts
await runbookEngine.execute('high-memory-usage', {
  memoryThreshold: 0.85  // 85% usage
});

// Steps:
// 1. Check memory usage
// 2. Force garbage collection
// 3. Clear caches
// 4. Analyze for leaks
// 5. Restart leaking services
// 6. Schedule maintenance if needed
```

## API Usage

### Execute Runbook

```bash
POST /api/runbooks/execute
{
  "runbookId": "ai-service-recovery",
  "context": {
    "triggeredBy": "alert-123",
    "severity": "high"
  },
  "async": true
}
```

### Get Execution Status

```bash
GET /api/runbooks?executionId=exec-123

Response:
{
  "executionId": "exec-123",
  "status": "running",
  "currentStep": "restart-service",
  "startTime": "2024-01-15T10:00:00Z",
  "context": {...},
  "history": [...]
}
```

### List Active Executions

```bash
GET /api/runbooks?status=active

Response:
{
  "executions": [...],
  "count": 2
}
```

### Cancel Execution

```bash
DELETE /api/runbooks?executionId=exec-123
```

## Building Complex Runbooks

### Error Recovery Patterns

```typescript
const runbook = runbook()
  .withMetadata({...})
  
  // Main flow
  .action('main-action', 'Primary action', mainAction)
  .onSuccess('verify')
  .onFailure('recovery-1')
  
  // Recovery attempt 1
  .action('recovery-1', 'First recovery attempt', recovery1)
  .retryable()
  .onSuccess('verify')
  .onFailure('recovery-2')
  
  // Recovery attempt 2
  .action('recovery-2', 'Second recovery attempt', recovery2)
  .onSuccess('verify')
  .onFailure('escalate')
  
  // Verification
  .check('verify', 'Verify recovery', verifyFn)
  .onSuccess('complete')
  .onFailure('escalate')
  
  // Escalation
  .notify('escalate', 'Escalate to on-call',
    'Automated recovery failed - manual intervention required',
    ['pagerduty']
  )
  
  .startWith('main-action')
  .register();
```

### Gradual Rollout Pattern

```typescript
const rolloutRunbook = runbook()
  .withMetadata({
    id: 'gradual-rollout',
    name: 'Gradual Feature Rollout',
    description: 'Safely roll out new features'
  })
  
  // Phase 1: 10% rollout
  .action('rollout-10', 'Enable for 10% of users', () => 
    enableFeature({ percentage: 10 })
  )
  .onSuccess('monitor-10')
  
  .wait('monitor-10', 'Monitor for 30 minutes', 1800000)
  .onSuccess('check-metrics-10')
  
  .check('check-metrics-10', 'Check error rates', async () => {
    const metrics = await getMetrics();
    return metrics.errorRate < 0.01;  // < 1% errors
  })
  .onSuccess('rollout-50')
  .onFailure('rollback')
  
  // Phase 2: 50% rollout
  .action('rollout-50', 'Enable for 50% of users', () =>
    enableFeature({ percentage: 50 })
  )
  .onSuccess('monitor-50')
  
  // ... continue pattern
  
  // Rollback
  .action('rollback', 'Rollback feature', () =>
    enableFeature({ percentage: 0 })
  )
  .onSuccess('notify-rollback')
  
  .startWith('rollout-10')
  .register();
```

## Context and State Management

### Using Context

```typescript
.action('collect-metrics', 'Collect system metrics', async function() {
  const metrics = await collectMetrics();
  // Store in context for later steps
  this.metrics = metrics;
  this.threshold = calculateThreshold(metrics);
})
.onSuccess('analyze')

.decision('analyze', 'Analyze metrics', (context) => {
  // Access previously stored data
  if (context.metrics.cpu > context.threshold) {
    return 'scale-up';
  }
  return 'normal';
})
```

### Step Results

```typescript
.action('fetch-data', 'Fetch configuration', async () => {
  return await fetchConfig();
})
.onSuccess('apply-config')

.action('apply-config', 'Apply configuration', async function() {
  // Access previous step result
  const config = this.fetch_data_result;
  await applyConfiguration(config);
})
```

## Event Handling

### Listening to Events

```typescript
runbookEngine.on('execution:started', ({ executionId, runbook }) => {
  console.log(`Started ${runbook.name} - ${executionId}`);
});

runbookEngine.on('step:failed', ({ executionId, step, error }) => {
  console.error(`Step ${step.name} failed in ${executionId}:`, error);
});

runbookEngine.on('execution:completed', ({ executionId, state }) => {
  console.log(`Completed ${executionId} in ${state.endTime - state.startTime}ms`);
});
```

### Custom Notifications

```typescript
runbookEngine.on('notification:send', ({ channel, message }) => {
  switch (channel) {
    case 'slack':
      sendSlackNotification(message);
      break;
    case 'pagerduty':
      createPagerDutyIncident(message);
      break;
    case 'email':
      sendEmail(message);
      break;
  }
});
```

## Best Practices

### 1. Idempotent Actions

Make actions safe to retry:

```typescript
.action('ensure-service-running', 'Ensure service is running', async () => {
  const status = await getServiceStatus();
  if (status !== 'running') {
    await startService();
  }
})
```

### 2. Meaningful Timeouts

Set appropriate timeouts for different operations:

```typescript
.check('quick-check', 'Quick health check', quickCheck)
.withTimeout(5000)  // 5 seconds

.action('database-migration', 'Run migration', migrate)
.withTimeout(300000)  // 5 minutes
```

### 3. Progressive Escalation

Start with automated recovery, escalate to humans:

```typescript
.onFailure('auto-recovery')    // Try automated recovery
.onFailure('alert-team')       // Alert the team
.onFailure('page-on-call')     // Page on-call engineer
```

### 4. Audit and Compliance

Add notification steps for audit trail:

```typescript
.notify('audit-start', 'Log runbook start',
  `Runbook ${runbook.name} started by ${context.triggeredBy}`,
  ['audit-log']
)

.notify('audit-complete', 'Log runbook completion',
  `Runbook ${runbook.name} completed successfully`,
  ['audit-log']
)
```

### 5. Test Your Runbooks

Create test scenarios:

```typescript
// Test mode that simulates failures
const testContext = {
  testMode: true,
  simulateFailures: ['health-check', 'restart-service']
};

const execution = await runbookEngine.execute(
  'ai-service-recovery',
  testContext
);
```

## Monitoring and Metrics

Track runbook effectiveness:

```typescript
// Success rate by runbook
const metrics = {
  'ai-service-recovery': {
    executions: 45,
    successful: 42,
    failed: 3,
    avgDuration: 125000  // 2 minutes
  },
  'database-performance': {
    executions: 12,
    successful: 11,
    failed: 1,
    avgDuration: 180000  // 3 minutes
  }
};

// Most common failure points
const failureAnalysis = {
  'restart-service': 8,
  'verify-recovery': 3,
  'check-dependencies': 2
};
```

## Integration with Incident Management

```typescript
// Automatically create incidents
runbookEngine.on('execution:started', async ({ runbook, context }) => {
  if (runbook.tags?.includes('critical')) {
    const incident = await createIncident({
      title: `${runbook.name} executing`,
      severity: context.severity || 'medium',
      runbookId: runbook.id,
      context
    });
    
    context.incidentId = incident.id;
  }
});

// Update incident on completion
runbookEngine.on('execution:completed', async ({ state }) => {
  if (state.context.incidentId) {
    await updateIncident(state.context.incidentId, {
      status: 'resolved',
      resolution: 'Automated runbook recovery'
    });
  }
});
```