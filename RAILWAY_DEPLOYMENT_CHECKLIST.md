# 🚂 Railway Deployment Checklist
## Agent Worker - Quick Start Guide

**Date:** October 30, 2025
**Service:** Blipee AI Agent Worker + Prophet Forecasting
**Estimated Time:** 15-30 minutes

---

## ✅ Pre-Deployment Checklist

### 1. Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### 2. Prepare Environment Variables

**Option A: Use template (recommended)**
```bash
# Copy template
cp .env.railway.template .env.production

# Edit .env.production with your values
# Required variables:
# - NEXT_PUBLIC_SUPABASE_URL=https://nxylqbsymujjwegmucwz.supabase.co
# - SUPABASE_SERVICE_ROLE_KEY=<from-supabase>
# - OPENAI_API_KEY=<your-key>
```

**Option B: Get from .env.local**
```bash
# Copy current local environment
cp .env.local .env.production

# Verify production values are correct
# (no localhost URLs, use production Supabase URL)
```

### 3. Verify Required Files

Check that these files exist:
- [x] `railway.json` - Railway config
- [x] `Dockerfile.worker` - Multi-stage Docker build
- [x] `supervisord.conf` - Process manager
- [x] `src/workers/agent-worker.ts` - Agent entry point
- [x] `services/forecast-service/` - Prophet API

### 4. Test Locally (Optional but Recommended)

```bash
# Build and test Docker image locally
docker build -f Dockerfile.worker -t blipee-agent-worker .

# Run locally to test
docker run -p 8080:8080 -p 8001:8001 \
  --env-file .env.production \
  blipee-agent-worker

# Check health
curl http://localhost:8080/health

# Stop container
docker ps  # Get container ID
docker stop <container-id>
```

---

## 🚀 Deployment Steps

### Method 1: Automated Script (Easiest)

```bash
# Run deployment script
./scripts/deploy-railway.sh

# The script will:
# 1. Check Railway CLI installation
# 2. Verify you're logged in
# 3. Check required files exist
# 4. Verify environment variables (optional)
# 5. Deploy to Railway
# 6. Open logs for monitoring
```

### Method 2: Manual Deployment

```bash
# 1. Link or create Railway project
railway link  # Link to existing project
# OR
railway init  # Create new project

# 2. Set environment variables
railway variables set --file .env.production

# OR set individually
railway variables set NEXT_PUBLIC_SUPABASE_URL="https://nxylqbsymujjwegmucwz.supabase.co"
railway variables set SUPABASE_SERVICE_ROLE_KEY="your-key"
railway variables set OPENAI_API_KEY="your-key"
railway variables set NODE_ENV="production"
railway variables set PORT="8080"
railway variables set FORECAST_SERVICE_URL="http://localhost:8001"

# 3. Deploy
railway up

# 4. Monitor deployment
railway logs --follow
```

---

## 📊 Post-Deployment Validation

### 1. Check Deployment Status
```bash
# View service status
railway status

# Should show:
# ✓ Service: Deployed
# ✓ Health: Healthy
```

### 2. Verify Health Endpoint
```bash
# Get service URL
railway domain

# Check health
curl https://your-service.railway.app/health

# Should return 200 OK with JSON:
# {
#   "status": "healthy",
#   "uptime": 123,
#   "agents": { "totalAgents": 8, ... },
#   ...
# }
```

### 3. Monitor Logs

```bash
# Watch for successful startup
railway logs --follow

# Look for these messages:
# ✅ Global workforce initialized successfully
# ✅ Subscribed to global task results
# ✅ Global agent worker fully operational
# 🏥 Health check server listening on port 8080
# ✅ Proactive Agent Scheduler started
```

### 4. Check Both Services Running

```bash
# Check supervisord status (from Railway shell)
railway run supervisorctl status

# Expected output:
# agent-worker     RUNNING   pid 123, uptime 0:05:00
# prophet-service  RUNNING   pid 124, uptime 0:04:55
```

### 5. Verify Database Activity

Wait 1-2 hours, then check:

```sql
-- Check recent agent events (should have entries)
SELECT COUNT(*) FROM agent_events
WHERE created_at > NOW() - INTERVAL '2 hours';

-- Check ML predictions (forecasts should be generated)
SELECT COUNT(*) FROM ml_predictions
WHERE created_at > NOW() - INTERVAL '5 hours';

-- Check proactive messages (may be empty if no triggers)
SELECT COUNT(*) FROM messages
WHERE role = 'agent'
  AND created_at > NOW() - INTERVAL '2 hours';
```

---

## ⏰ Scheduled Jobs Verification

Wait for these jobs to execute and check logs:

### Hourly (Every :00)
- **Proactive Agent Scheduler**
  ```
  🤖 [Proactive Scheduler] Starting hourly check...
  📊 Checking N organizations
  ```

- **Weather Data Polling**
  ```
  🌤️ [Weather Service] Fetching weather data...
  ```

### Every 4 Hours (00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC)
- **Prophet Forecasting**
  ```
  🔮 [Forecast Service] Starting forecast generation...
  📊 Generating forecasts for X metrics
  ```

### Daily (02:00 AM UTC)
- **Metrics Pre-Computation**
  ```
  📊 [Metrics Service] Pre-computing metrics...
  ```

### Daily (03:00 AM UTC)
- **Data Cleanup**
  ```
  🧹 [Cleanup Service] Running data cleanup...
  ```

---

## 🔧 Troubleshooting

### Issue: "railway: command not found"
```bash
npm install -g @railway/cli
```

### Issue: "Not logged in"
```bash
railway login
```

### Issue: Health check failing
```bash
# Check logs for errors
railway logs | grep ERROR

# Check if services started
railway run supervisorctl status

# Restart service if needed
railway restart
```

### Issue: Environment variables not set
```bash
# List current variables
railway variables

# Set missing variables
railway variables set VAR_NAME="value"

# Or import from file
railway variables set --file .env.production
```

### Issue: Deployment builds but crashes
```bash
# Check build logs
railway logs --deployment

# Check runtime logs
railway logs --filter "ERROR"

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Python dependencies not installed
```

---

## 📈 Monitoring Setup

### 1. Railway Dashboard
- Go to: https://railway.app
- Select your project → Agent Worker service
- Monitor:
  - CPU usage
  - Memory usage
  - Network traffic
  - Deployment history

### 2. Logs
```bash
# Real-time logs
railway logs --follow

# Search logs
railway logs | grep "Proactive"
railway logs | grep "ERROR"
railway logs | grep "ML Training"

# Export logs
railway logs > deployment-logs.txt
```

### 3. Alerts (Optional)
Set up in Railway Dashboard:
- Settings → Notifications
- Enable alerts for:
  - Deployment failures
  - Service crashes
  - Resource limits exceeded

---

## 🔄 Updating the Deployment

When you make changes:

```bash
# 1. Commit changes
git add .
git commit -m "feat: Update agent worker configuration"
git push origin main

# 2. Redeploy
railway up

# 3. Monitor deployment
railway logs --follow
```

Railway will:
- Pull latest code from GitHub
- Rebuild Docker image
- Deploy new version
- Run health checks
- Switch traffic to new version

---

## 📝 Environment Variables Quick Reference

### Required
| Variable | Example Value | Purpose |
|----------|--------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbG...` | Service role key |
| `OPENAI_API_KEY` | `sk-proj-...` | OpenAI API |
| `NODE_ENV` | `production` | Environment |
| `PORT` | `8080` | HTTP port |
| `FORECAST_SERVICE_URL` | `http://localhost:8001` | Prophet service |

### Optional
| Variable | Default | Purpose |
|----------|---------|---------|
| `RUN_INITIAL_ANALYSIS` | `false` | Bootstrap mode |
| `LOG_LEVEL` | `info` | Logging level |

---

## 🎯 Success Criteria

Your deployment is successful when:

- [x] Health endpoint returns 200 OK
- [x] Both services (agent-worker + prophet-service) show RUNNING in supervisorctl
- [x] Logs show successful initialization messages
- [x] No ERROR messages in logs (first 5 minutes)
- [x] Database shows recent agent activity (after 1 hour)
- [x] Prophet forecasts are generated (after 4 hours)
- [x] ML models exist in database (70+ models)

---

## 📞 Support

### Railway Issues
- Dashboard: https://railway.app
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app

### Application Issues
- Check logs: `railway logs`
- Review: `docs/RAILWAY_DEPLOYMENT_GUIDE.md`
- Review: `docs/FASE_1_TEST_REPORT.md`

---

## 🚀 Quick Deploy Command

For experienced users:

```bash
# One-line deploy (after setup)
railway link && \
railway variables set --file .env.production && \
railway up && \
railway logs --follow
```

---

**Ready to deploy?** Run:
```bash
./scripts/deploy-railway.sh
```

**Estimated deployment time:** 5-10 minutes
**Total setup + deploy time:** 15-30 minutes

---

**Last Updated:** October 30, 2025
**Version:** 1.0.0
**Status:** ✅ Ready for deployment
