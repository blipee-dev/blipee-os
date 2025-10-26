# Railway Deployment Guide - AI Agent Worker

**Deploy the autonomous AI prompt optimization worker to Railway**

This guide will help you deploy the background AI agent worker service to Railway, completely separate from your Next.js app on Vercel.

---

## 📋 Architecture Overview

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Vercel         │         │   Supabase       │         │  Railway        │
│  (Next.js App)  │ ◄─────► │   (PostgreSQL)   │ ◄─────► │  (AI Worker)    │
│  - Frontend     │         │   - Shared DB    │         │  - Autonomous   │
│  - API Routes   │         │   - Job Queue    │         │  - 24/7 Running │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

The AI worker:
- Runs 24/7 independently
- Polls database for jobs every minute
- Executes AI optimization tasks
- No connection to Vercel app required

---

## 🚀 Quick Deployment

### Prerequisites

1. **Railway Account**
   ```bash
   # Sign up at https://railway.app
   # No credit card required for $5/month credit
   ```

2. **Supabase Credentials**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **GitHub Repository**
   - Your code must be in a GitHub repo
   - Railway will deploy from there

---

## 📦 Step-by-Step Deployment

### **Step 1: Install Railway CLI** (Optional but Recommended)

```bash
npm install -g @railway/cli

# Or use brew
brew install railway
```

### **Step 2: Login to Railway**

```bash
railway login
```

This opens a browser window to authenticate.

### **Step 3: Initialize Railway Project**

Two options:

#### **Option A: Deploy from GitHub (Recommended)**

1. Go to [railway.app/new](https://railway.app/new)
2. Click "Deploy from GitHub repo"
3. Select your `blipee-os` repository
4. Railway will auto-detect the `railway.json` config

#### **Option B: Deploy via CLI**

```bash
cd /path/to/blipee-os

# Create new project
railway init

# Link to GitHub (optional)
railway link
```

### **Step 4: Configure Environment Variables**

In the Railway dashboard or via CLI:

```bash
# Via CLI
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Customize polling interval
railway variables set AGENT_POLL_INTERVAL_MS=60000
railway variables set AGENT_HEARTBEAT_INTERVAL_MS=30000
```

**Via Dashboard:**
1. Go to your Railway project
2. Click on your service
3. Go to "Variables" tab
4. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AGENT_POLL_INTERVAL_MS` (optional, default: 60000)
   - `AGENT_HEARTBEAT_INTERVAL_MS` (optional, default: 30000)

### **Step 5: Deploy**

Railway will automatically deploy when you push to GitHub.

**Manual deployment via CLI:**
```bash
railway up
```

**Or trigger from dashboard:**
1. Go to "Deployments" tab
2. Click "Deploy"

### **Step 6: Verify Deployment**

1. **Check Logs**
   ```bash
   railway logs
   ```

   You should see:
   ```
   [INFO] Starting AI Agent Orchestrator Service...
   [INFO] Instance ID: abc123...
   [INFO] Process ID: 42
   [INFO] Health check server listening on port 8080
   [INFO] Service started successfully
   [INFO] Polling for jobs every 60000ms
   ```

2. **Check Health Endpoint**
   ```bash
   # Get your Railway URL
   railway domain

   # Test health endpoint
   curl https://your-service.up.railway.app/health
   ```

   Expected response:
   ```json
   {
     "status": "healthy",
     "uptime": 123456,
     "instanceId": "abc123...",
     "jobsCompleted": 0,
     "jobsFailed": 0,
     "isRunning": true,
     "timestamp": "2025-10-26T12:00:00.000Z"
   }
   ```

---

## 🔧 Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | - | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Yes | - | Supabase service role key |
| `AGENT_POLL_INTERVAL_MS` | ❌ No | 60000 | Job polling interval (1 min) |
| `AGENT_HEARTBEAT_INTERVAL_MS` | ❌ No | 30000 | Health check interval (30 sec) |
| `PORT` | ❌ No | 8080 | Health check server port |

### Railway Settings

**Recommended configuration** (set in Railway dashboard):

1. **Resources**
   - CPU: Shared (sufficient for this workload)
   - RAM: 512MB-1GB recommended
   - Disk: Not needed (stateless service)

2. **Restart Policy**
   - Already configured in `railway.json`
   - Type: ON_FAILURE
   - Max Retries: 10

3. **Health Checks**
   - Already configured in `railway.json`
   - Path: `/health`
   - Timeout: 300s

---

## 📊 Monitoring

### View Logs

**Via Dashboard:**
1. Go to your Railway project
2. Click on service
3. Go to "Deployments" → Click active deployment → "View Logs"

**Via CLI:**
```bash
railway logs

# Follow logs in real-time
railway logs --follow
```

### Health Check

```bash
# Check service health
curl https://your-service.up.railway.app/health

# Expected output
{
  "status": "healthy",
  "uptime": 3600000,  # 1 hour in ms
  "instanceId": "xyz123",
  "jobsCompleted": 5,
  "jobsFailed": 0,
  "isRunning": true,
  "timestamp": "2025-10-26T12:00:00.000Z"
}
```

### Database Monitoring

Check the service state in Supabase:

```sql
-- View active service instances
SELECT *
FROM public.ai_agent_service_state
WHERE status = 'running'
ORDER BY last_heartbeat DESC;

-- View recent jobs
SELECT *
FROM public.ai_agent_jobs
ORDER BY created_at DESC
LIMIT 10;

-- View execution logs
SELECT *
FROM public.ai_agent_execution_logs
ORDER BY logged_at DESC
LIMIT 50;
```

---

## 🐛 Troubleshooting

### Service Won't Start

**Check logs for error:**
```bash
railway logs
```

**Common issues:**

1. **Missing environment variables**
   ```
   Error: SUPABASE_SERVICE_ROLE_KEY is not defined
   ```
   **Fix:** Add environment variables in Railway dashboard

2. **Database connection failed**
   ```
   Error: Failed to connect to Supabase
   ```
   **Fix:** Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

3. **Port already in use**
   ```
   Error: EADDRINUSE: address already in use :::8080
   ```
   **Fix:** Railway handles this automatically, shouldn't happen

### Health Check Failing

```bash
# Test locally first
curl http://localhost:8080/health

# If local works, test Railway
curl https://your-service.up.railway.app/health
```

If health check fails:
- Check Railway logs for errors
- Verify service is running (check dashboard)
- Check if PORT environment variable is set correctly

### No Jobs Executing

1. **Check if jobs exist:**
   ```sql
   SELECT * FROM public.ai_agent_jobs
   WHERE status = 'pending'
   AND (next_run_at IS NULL OR next_run_at <= NOW());
   ```

2. **Check service logs:**
   ```bash
   railway logs --follow
   ```

   Look for:
   ```
   [INFO] Found pending job: ...
   [INFO] Executing job: ...
   ```

3. **Manually trigger a job:**
   ```sql
   -- Create a test job
   INSERT INTO public.ai_agent_jobs (
     job_type,
     job_name,
     status,
     config
   ) VALUES (
     'pattern_analysis',
     'Test Analysis',
     'pending',
     '{"daysToAnalyze": 7}'::jsonb
   );
   ```

---

## 💰 Cost Estimation

### Railway Pricing

**Starter Plan** (recommended):
- **$5/month** minimum spend
- Includes **$5 credit**
- Pay-as-you-go for resources used

**Expected monthly cost for this worker:**
- CPU: ~$2-3/month (mostly idle)
- RAM: ~$2-3/month (512MB-1GB)
- Network: ~$0-1/month (minimal)
- **Total: ~$5-7/month**

**Pro tip:** The $5 monthly credit usually covers this worker entirely!

### Cost Optimization

1. **Reduce polling frequency** (if acceptable):
   ```bash
   # Poll every 5 minutes instead of 1
   railway variables set AGENT_POLL_INTERVAL_MS=300000
   ```

2. **Optimize job schedules**:
   ```sql
   -- Change weekly jobs to bi-weekly
   UPDATE public.ai_agent_jobs
   SET cron_expression = '0 9 * * 1,15'  -- 1st and 15th of month
   WHERE schedule_type = 'recurring';
   ```

---

## 🔄 Updates and Redeployments

### Automatic Deployments

Railway auto-deploys when you push to GitHub:

```bash
git add .
git commit -m "Update worker service"
git push origin main
```

Railway will:
1. Detect the push
2. Build new Docker image
3. Deploy with zero-downtime
4. Health check before switching traffic

### Manual Redeploy

**Via Dashboard:**
1. Go to "Deployments"
2. Click "Deploy" on latest commit

**Via CLI:**
```bash
railway up
```

### Rollback

**Via Dashboard:**
1. Go to "Deployments"
2. Find previous successful deployment
3. Click "Redeploy"

**Via CLI:**
```bash
railway rollback
```

---

## 📖 Next Steps

1. **✅ Deploy the worker to Railway** (you're here!)
2. **✅ Verify it's running** (check logs and health endpoint)
3. **✅ Monitor first week** (watch for errors)
4. **📊 View results in dashboard** (upcoming: super admin UI)
5. **⚙️ Adjust polling frequency** (based on usage patterns)

---

## 🆘 Support

**Railway Issues:**
- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

**Blipee Worker Issues:**
- Check logs: `railway logs`
- Check health: `curl https://your-service.up.railway.app/health`
- Check database: Query `ai_agent_service_state` table
- Review `/docs/AI_PROMPT_OPTIMIZATION.md`

---

## 🎉 Success Checklist

- [ ] Railway project created
- [ ] Environment variables configured
- [ ] Service deployed successfully
- [ ] Health check returns 200 OK
- [ ] Logs show "Service started successfully"
- [ ] Service state shows "running" in database
- [ ] First job executes within 1 minute (if jobs exist)
- [ ] Cost tracking set up in Railway dashboard

**Once all checked, your AI worker is live and autonomous!** 🚀

---

**Estimated time to deploy:** 15-30 minutes

**Monthly cost:** $5-7

**Maintenance:** ~5 minutes/month (checking logs)

