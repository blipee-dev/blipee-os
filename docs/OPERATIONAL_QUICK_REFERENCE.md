# Operational Quick Reference Card

## Phase 4, Task 4.5: Quick Reference for Daily Operations

### 🚨 Emergency Procedures

#### System Down
```bash
# 1. Check status
curl https://app.blipee.com/health

# 2. Run recovery
npm run runbook:emergency-recovery

# 3. Monitor recovery
npm run monitor:recovery
```

#### High Error Rate
```bash
# 1. Check errors
npm run logs:errors -- --last=100

# 2. Check circuit breakers
curl http://localhost:3000/api/monitoring/circuit-breakers

# 3. Run diagnostics
npm run runbook:error-diagnostics
```

### 📊 Key Metrics to Monitor

| Metric | Normal | Warning | Critical | Action |
|--------|--------|---------|----------|---------|
| Error Rate | <1% | 1-5% | >5% | Run error diagnostics |
| Response Time (P95) | <200ms | 200-500ms | >500ms | Check slow operations |
| CPU Usage | <60% | 60-80% | >80% | Scale up |
| Memory Usage | <70% | 70-85% | >85% | Check for leaks |
| DB Connections | <50% | 50-80% | >80% | Optimize queries |

### 🔍 Common Debugging Commands

#### Logs
```bash
# Tail all logs
npm run logs:tail

# Search by correlation ID
npm run logs:search -- --correlation-id="abc-123"

# Get error summary
npm run logs:errors -- --summary

# Search by user
npm run logs:search -- --user-id="user-123"
```

#### Tracing
```bash
# Find slow traces
npm run traces:slow -- --threshold=1000

# Get trace by ID
npm run traces:get -- --trace-id="xyz-789"

# Trace summary
npm run traces:summary -- --last-hour
```

#### Database
```bash
# Check slow queries
npm run db:slow-queries

# Connection pool status
npm run db:connections

# Kill query
npm run db:kill -- --pid=12345
```

### 🛠️ Runbook Commands

#### List Available Runbooks
```bash
curl http://localhost:3000/api/runbooks
```

#### Execute Runbook
```bash
# AI Service Recovery
curl -X POST http://localhost:3000/api/runbooks/execute \
  -H "Content-Type: application/json" \
  -d '{"runbookId": "ai-service-recovery"}'

# Database Performance
curl -X POST http://localhost:3000/api/runbooks/execute \
  -H "Content-Type: application/json" \
  -d '{"runbookId": "database-performance"}'

# High Memory Usage
curl -X POST http://localhost:3000/api/runbooks/execute \
  -H "Content-Type: application/json" \
  -d '{"runbookId": "high-memory-usage"}'
```

#### Check Execution Status
```bash
curl http://localhost:3000/api/runbooks?executionId=exec-123
```

### 🔧 Circuit Breaker Management

#### Check Status
```typescript
// In code
const status = circuitBreakerManager.getStatus();

// Via API
curl http://localhost:3000/api/monitoring/circuit-breakers
```

#### Force Reset
```typescript
// Emergency reset
circuitBreakerManager.reset('ai-service');
```

### 📈 Performance Optimization

#### Quick Wins
1. **Enable Caching**
   ```typescript
   cache.enable('api-responses', { ttl: 300 });
   ```

2. **Increase Concurrency**
   ```typescript
   bulkhead.updateConfig({ maxConcurrent: 10 });
   ```

3. **Adjust Timeouts**
   ```typescript
   circuitBreaker.updateConfig({ timeout: 5000 });
   ```

### 🚦 Health Check Endpoints

| Endpoint | Description | Expected |
|----------|-------------|----------|
| `/health` | Basic health | 200 OK |
| `/health/ready` | Readiness check | 200 OK |
| `/health/live` | Liveness check | 200 OK |
| `/api/monitoring/status` | Detailed status | JSON |

### 🎯 Troubleshooting Decision Tree

```
High Error Rate?
├─ Yes → Check Circuit Breakers
│   ├─ Open → Check root cause
│   │   ├─ External API → Switch provider
│   │   └─ Database → Run DB diagnostics
│   └─ Closed → Check logs for patterns
└─ No → Check Response Times
    ├─ Slow → Run performance diagnostics
    │   ├─ DB queries → Optimize queries
    │   └─ AI calls → Check cache hit rate
    └─ Normal → Check resource usage
```

### 📱 On-Call Contacts

| Issue | Primary | Backup | Escalation |
|-------|---------|--------|------------|
| Infrastructure | DevOps on-call | Platform lead | CTO |
| API/Backend | Backend on-call | Tech lead | Eng Manager |
| AI Services | AI on-call | AI lead | CTO |
| Database | DBA on-call | Platform lead | CTO |

### 🔑 Essential URLs

- **Production**: https://app.blipee.com
- **Monitoring**: https://monitoring.blipee.com
- **Logs**: https://logs.blipee.com
- **Traces**: https://traces.blipee.com
- **Status Page**: https://status.blipee.com

### 💡 Pro Tips

1. **Always check correlation IDs** - They link all related operations
2. **Monitor circuit breaker events** - They indicate system stress
3. **Use runbooks first** - They handle common issues automatically
4. **Check traces for bottlenecks** - Often reveals easy optimizations
5. **Cache aggressively** - Most issues are from repeated operations

### 🔄 Daily Checklist

- [ ] Check overnight alerts
- [ ] Review error rates
- [ ] Monitor circuit breakers
- [ ] Check slow queries
- [ ] Verify backups completed
- [ ] Review resource usage

### 📝 Incident Template

```markdown
## Incident Report

**Time**: [timestamp]
**Severity**: SEV[1-4]
**Impact**: [user impact]

### Summary
[What happened]

### Timeline
- [time]: Initial detection
- [time]: Investigation started
- [time]: Root cause identified
- [time]: Fix deployed
- [time]: Incident resolved

### Root Cause
[Technical explanation]

### Resolution
[What fixed it]

### Action Items
- [ ] Update runbook
- [ ] Add monitoring
- [ ] Fix root cause
```

---

*Keep this card handy during on-call shifts!*