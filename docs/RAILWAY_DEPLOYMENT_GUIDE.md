# Railway Deployment Guide - Agent Worker
## Blipee AI Autonomous Agents + ML Models + Prophet Forecasting

**Service:** Agent Worker (Multi-process container)
**Date:** October 30, 2025
**Status:** ✅ Ready for deployment

---

## Overview

This deployment runs **2 services in one container**:
1. **Node.js Agent Worker** (Port 8080)
   - 8 Autonomous AI Agents
   - ML Model Training Service
   - Proactive Agent Scheduler
   - Background job processing

2. **Python Prophet Service** (Port 8001)
   - Time series forecasting API
   - Prophet model inference
   - Historical data analysis

Both services communicate via HTTP (`localhost:8001`) and are managed by **supervisord**.

---

## Prerequisites

### 1. Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login
```

### 2. Create Railway Project
```bash
# Link to existing project or create new
railway link

# Or create new project
railway init
```

---

## Configuration Files

### ✅ Already Configured

| File | Purpose | Status |
|------|---------|--------|
| `railway.json` | Railway deployment config | ✅ Ready |
| `Dockerfile.worker` | Multi-stage Docker build | ✅ Ready |
| `supervisord.conf` | Process manager config | ✅ Ready |
| `services/forecast-service/` | Prophet API service | ✅ Ready |
| `src/workers/agent-worker.ts` | Agent worker entry point | ✅ Ready |

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.worker"
  },
  "deploy": {
    "numReplicas": 1,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10,
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300
  }
}
```

---

## Environment Variables

### Required Variables (Set in Railway Dashboard)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://nxylqbsymujjwegmucwz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Database Configuration (from Supabase)
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres

# OpenAI Configuration
OPENAI_API_KEY=<your-openai-key>

# Environment
NODE_ENV=production
PORT=8080

# Prophet Service (Internal communication)
FORECAST_SERVICE_URL=http://localhost:8001

# Optional: Bootstrap mode
RUN_INITIAL_ANALYSIS=false
```

### How to Set Environment Variables

#### Option A: Railway Dashboard
1. Go to your Railway project
2. Select the Agent Worker service
3. Click "Variables" tab
4. Add each variable manually

#### Option B: Railway CLI
```bash
# Set individual variables
railway variables set NEXT_PUBLIC_SUPABASE_URL="https://nxylqbsymujjwegmucwz.supabase.co"
railway variables set SUPABASE_SERVICE_ROLE_KEY="your-key"
railway variables set OPENAI_API_KEY="your-key"
railway variables set NODE_ENV="production"
railway variables set PORT="8080"
railway variables set FORECAST_SERVICE_URL="http://localhost:8001"

# Or use a .env file (secure way)
railway variables set --file .env.production
```

#### Option C: Import from .env.local
```bash
# Copy .env.local to .env.production (exclude local URLs)
cp .env.local .env.production

# Edit .env.production to ensure production values
# Then import
railway variables set --file .env.production

# Don't commit .env.production!
echo ".env.production" >> .gitignore
```

---

## Deployment Steps

### Step 1: Prepare Repository

```bash
# Ensure you're in the project root
cd /Users/pedro/Documents/blipee/blipee-os/blipee-os

# Check that required files exist
ls -la railway.json
ls -la Dockerfile.worker
ls -la supervisord.conf

# Verify services directory
ls -la services/forecast-service/

# Check git status
git status
```

### Step 2: Commit Changes (if needed)

```bash
# Add deployment files
git add railway.json Dockerfile.worker supervisord.conf
git add services/ src/workers/

# Commit
git commit -m "feat: Add Railway deployment configuration for agent worker"

# Push to main
git push origin main
```

### Step 3: Deploy to Railway

#### Option A: Via CLI (Recommended)
```bash
# Deploy current directory
railway up

# Follow deployment logs
railway logs

# The deployment will:
# 1. Build multi-stage Docker image
# 2. Install Node.js dependencies
# 3. Install Python dependencies + Prophet
# 4. Install cmdstan for Prophet
# 5. Start supervisord
# 6. Launch agent-worker (port 8080)
# 7. Launch prophet-service (port 8001)
```

#### Option B: Via Dashboard
1. Go to Railway dashboard
2. Select your project
3. Click "New Service"
4. Choose "GitHub Repo"
5. Select `blipee-os` repository
6. Railway will auto-detect `railway.json`
7. Click "Deploy"

### Step 4: Monitor Deployment

```bash
# Watch logs in real-time
railway logs --follow

# Check service health
railway run curl http://localhost:8080/health

# Or from Railway dashboard
# Services → Agent Worker → Logs
```

---

## Health Check Endpoint

The agent worker exposes a `/health` endpoint:

```bash
# Health check response
GET http://your-service.railway.app/health

# Expected Response (200 OK):
{
  "status": "healthy",
  "uptime": 3600,
  "agents": {
    "mode": "global",
    "totalAgents": 8,
    "organizations": 1,
    "crossOrgBenchmarking": true
  },
  "promptOptimization": {
    "patternsAnalyzed": 5,
    "variantsGenerated": 3,
    "experimentsCreated": 1,
    "experimentsCompleted": 0,
    "lastAnalysisAt": "2025-10-30T21:00:00.000Z",
    "lastExperimentCheckAt": "2025-10-30T21:15:00.000Z"
  },
  "phase1Services": {
    "metrics": { "status": "healthy", "lastRun": "2025-10-30T02:00:00Z" },
    "cleanup": { "status": "healthy", "lastRun": "2025-10-30T03:00:00Z" },
    "notifications": { "status": "healthy", "lastRun": "2025-10-30T21:20:00Z" }
  },
  "phase2Services": {
    "optimization": { "status": "healthy", "lastRun": "2025-10-30T04:00:00Z" },
    "databaseOpt": { "status": "healthy", "lastRun": "2025-10-27T01:00:00Z" },
    "weather": { "status": "healthy", "lastRun": "2025-10-30T21:00:00Z" }
  },
  "phase3Services": {
    "reports": { "status": "healthy", "lastRun": "2025-10-01T06:00:00Z" },
    "mlTraining": { "status": "healthy", "lastRun": "2025-10-15T02:00:00Z" },
    "forecasting": { "status": "healthy", "lastRun": "2025-10-30T20:00:00Z" }
  },
  "timestamp": "2025-10-30T21:30:00.000Z"
}
```

---

## Scheduled Jobs

Once deployed, these jobs run automatically:

### Hourly
- **Proactive Agent Scheduler** (every hour at :00)
  - Checks triggers for all 8 agents
  - Sends proactive messages when conditions met

- **Weather Data Polling** (every hour at :00)
  - Fetches weather data for correlation analysis

### Every 4 Hours (6x/day)
- **Prophet Forecasting** (00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
  - Generates time series forecasts
  - Updates predictions for all metrics

### Every 5 Minutes
- **Notification Queue** (continuous processing)
  - Processes async notifications
  - Sends alerts to users

### Daily
- **Metrics Pre-Computation** (02:00 AM UTC)
  - Pre-aggregates sustainability metrics
  - Improves dashboard performance

- **Data Cleanup** (03:00 AM UTC)
  - GDPR-compliant data retention
  - Archive old conversations

- **Optimization Opportunities** (04:00 AM UTC)
  - Analyzes cost-saving potential
  - Identifies efficiency improvements

### Weekly
- **Database Optimization** (Sundays, 01:00 AM UTC)
  - VACUUM, ANALYZE tables
  - Rebuild indexes if needed

### Monthly
- **Report Generation** (1st day, 06:00 AM UTC)
  - Auto-generates sustainability reports
  - Sends to stakeholders

- **ML Model Training** (15th day, 02:00 AM UTC)
  - Retrains all ML models
  - Improves prediction accuracy

---

## Monitoring & Logs

### View Logs
```bash
# All logs
railway logs

# Follow live logs
railway logs --follow

# Filter by service
railway logs --filter "agent-worker"
railway logs --filter "prophet-service"

# Search logs
railway logs | grep "ERROR"
railway logs | grep "Proactive Scheduler"
```

### Key Log Patterns

#### Successful Startup
```
🚀 Starting Blipee AI Global Agent Worker...
✅ Global workforce initialized successfully
   • 8 agents active globally
✅ Subscribed to global task results (all organizations)
✅ Global agent worker fully operational
🏥 Health check server listening on port 8080
```

#### Proactive Messages
```
🤖 [Proactive Scheduler] Starting hourly check...
📊 Checking 1 organizations
🔍 Checking triggers for PLMJ
✅ Sent 2 proactive messages for PLMJ
```

#### ML Training
```
🤖 [ML Training] Starting model training cycle...
📚 Training models for 121 metrics from catalog
✅ Model trained successfully
📊 Stored 70 models in database
```

#### Prophet Forecasting
```
🔮 [Forecast Service] Starting forecast generation...
📊 Generating forecasts for 41 metrics
✅ Generated 365 forecast points
```

---

## Scaling Considerations

### Current Configuration
- **Replicas**: 1 (single instance)
- **Resources**: Railway default (512MB RAM, shared CPU)

### Recommended for Production
```bash
# Increase resources (Railway Dashboard → Settings)
Memory: 1GB - 2GB
CPU: Shared (default) or Dedicated

# Keep replicas at 1 for now
# (Agent scheduler needs coordination for multiple replicas)
```

### Future Scaling
For multiple replicas:
1. Implement Redis-based job queue
2. Add distributed locks (Redis)
3. Use Railway cron jobs instead of in-process cron
4. Separate Prophet service to dedicated instance

---

## Troubleshooting

### Issue: Health check failing

**Solution:**
```bash
# Check if services are running
railway run supervisorctl status

# Expected output:
# agent-worker     RUNNING   pid 123, uptime 0:05:00
# prophet-service  RUNNING   pid 124, uptime 0:04:55

# Check logs
railway logs --filter "health"
```

### Issue: Prophet service not starting

**Solution:**
```bash
# Check cmdstan installation
railway run ls -la /root/.cmdstan

# Check Python dependencies
railway run pip3 list | grep prophet

# Manually test Prophet service
railway run curl http://localhost:8001/health
```

### Issue: Database connection errors

**Solution:**
```bash
# Verify environment variables
railway variables

# Test database connection
railway run node -e "const { createClient } = require('@supabase/supabase-js'); const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); s.from('organizations').select('count').then(console.log)"
```

### Issue: Out of memory

**Solution:**
1. Increase memory allocation in Railway dashboard
2. Check for memory leaks in logs
3. Reduce ML model training frequency
4. Implement model caching

### Issue: Agent not sending messages

**Solution:**
```bash
# Check agent task queue
railway run node -e "const { createClient } = require('@supabase/supabase-js'); const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); s.from('agent_task_results').select('*').limit(5).then(console.log)"

# Check conversations table
railway run node -e "const { createClient } = require('@supabase/supabase-js'); const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); s.from('conversations').select('*').eq('type', 'agent_proactive').then(console.log)"
```

---

## Post-Deployment Validation

### 1. Health Check
```bash
# From your machine
curl https://your-service.railway.app/health

# Should return 200 OK with JSON
```

### 2. Check Database
```sql
-- Verify agent activity (should show recent entries)
SELECT agent_name, activity_type, created_at
FROM agent_events
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC
LIMIT 10;

-- Check ML predictions (should increase over time)
SELECT COUNT(*) as total_predictions
FROM ml_predictions
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check proactive messages
SELECT COUNT(*) as total_messages
FROM messages
WHERE role = 'agent'
  AND created_at > NOW() - INTERVAL '24 hours';
```

### 3. Monitor Cron Jobs
Wait for scheduled jobs to run:
- Next hour: Proactive Scheduler, Weather Data
- Next 4 hours: Prophet Forecasting
- Tomorrow 02:00 UTC: Metrics Pre-Computation
- Tomorrow 03:00 UTC: Data Cleanup

Check logs to confirm execution.

---

## Rollback Plan

If deployment fails or has issues:

```bash
# Rollback to previous deployment
railway rollback

# Or redeploy from specific commit
git checkout <previous-commit>
railway up

# Or disable service temporarily
railway down
```

---

## Maintenance Windows

Recommended maintenance schedule:

- **Weekly**: Review logs, check for errors
- **Monthly**: Review performance metrics, optimize queries
- **Quarterly**: Review ML model performance, retrain if needed

---

## Cost Estimation (Railway)

**Agent Worker Service:**
- Starter Plan: $5/month (512MB RAM, shared CPU)
- Developer Plan: $20/month (2GB RAM, priority builds)
- Team Plan: $20/user/month (4GB RAM, dedicated CPU)

**Estimated Monthly Cost:**
- Development: $5-20
- Production: $20-50 (depending on usage)

**Database (Supabase):**
- Already configured and running
- No additional cost for Railway

---

## Security Checklist

- [x] Environment variables stored securely in Railway
- [x] Service role key not committed to git
- [x] Database credentials encrypted
- [x] HTTPS enabled by Railway (automatic)
- [x] Health check endpoint public (no sensitive data)
- [x] Logs don't expose secrets
- [x] RLS policies enabled on Supabase
- [x] Non-root user in Docker container

---

## Next Steps After Deployment

1. ✅ **Monitor first 24 hours**
   - Watch logs for errors
   - Verify scheduled jobs execute
   - Check health endpoint periodically

2. ✅ **Verify proactive messages**
   - Wait for hourly scheduler
   - Check user conversations for agent messages
   - Verify message content is relevant

3. ✅ **Test Prophet forecasts**
   - Wait 4 hours for first forecast run
   - Check `ml_predictions` table
   - Verify forecast quality in dashboard

4. ✅ **Monitor ML training** (Nov 15)
   - First automatic training on 15th
   - Review training logs
   - Check model performance metrics

5. ✅ **Set up alerts**
   - Configure Railway notifications
   - Set up Sentry (optional)
   - Monitor health check failures

---

## Support & Contact

**Railway Support:**
- Dashboard: https://railway.app
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app

**Blipee Team:**
- Issues: GitHub Issues
- Questions: Team Slack

---

**Deployment Status:** ✅ Ready to deploy
**Last Updated:** October 30, 2025
**Version:** 1.0.0
