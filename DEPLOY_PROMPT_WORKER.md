# Deploy Prompt Optimization Worker to Railway

## The Problem

Railway's existing service `blipee-os` is configured for the agent worker (`Dockerfile.worker`). When we try to switch it to the prompt worker via `railway.json`, Railway's build cache continues using the old configuration.

## Solution: Create a Second Railway Service

You need to create a **separate Railway service** for the prompt optimization worker. Here's how:

---

## Step 1: Create New Service via Railway Dashboard

1. **Go to Railway Dashboard**
   - URL: https://railway.com/project/18ecc328-effd-4245-bc03-3022fb1040a9
   - Project: `awake-joy`

2. **Create New Service**
   - Click **"+ New"** button
   - Select **"GitHub Repo"**
   - Choose your `blipee-os` repository
   - Service name: `prompt-optimization-worker`

3. **Configure Build Settings**
   - Go to service **Settings** → **Build**
   - Builder: **Dockerfile**
   - Dockerfile Path: `Dockerfile.prompt-worker`
   - Save settings

4. **Configure Deploy Settings**
   - Go to service **Settings** → **Deploy**
   - Health Check Path: `/health`
   - Health Check Timeout: `300`
   - Restart Policy: **ON_FAILURE**
   - Restart Policy Max Retries: `10`
   - Save settings

5. **Set Environment Variables**
   - Go to service **Variables** tab
   - Add these variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
DEEPSEEK_API_KEY=your_deepseek_api_key
NODE_ENV=production
PORT=8081
```

6. **Deploy**
   - Railway will automatically trigger a deployment
   - Monitor the **Deployments** tab for build progress

---

## Step 2: Verify Deployment

Once deployed, verify the worker is running:

### Check Health Endpoint

```bash
# Get the Railway public URL from the service
# Then test the health endpoint
curl https://<your-railway-url>/health
```

Expected response:
```json
{
  "status": "healthy",
  "uptime": 123,
  "stats": {
    "jobsCompleted": 0,
    "jobsFailed": 0,
    "patternsAnalyzed": 0,
    "variantsGenerated": 0,
    "experimentsCreated": 0,
    "experimentsCompleted": 0,
    "lastJobAt": null,
    "lastAnalysisAt": null,
    "lastExperimentCheckAt": null
  },
  "timestamp": "2025-10-27T..."
}
```

### Check Logs

In the Railway dashboard:
- Go to the `prompt-optimization-worker` service
- Click on **Deployments** → Latest deployment
- View **Logs**
- You should see:

```
╔════════════════════════════════════════════════════╗
║  Blipee AI Prompt Optimization Worker             ║
║  Autonomous ML-Based Prompt Improvement           ║
╚════════════════════════════════════════════════════╝

🚀 Starting Prompt Optimization Worker...
📅 Current time: 2025-10-27T...
🏥 Health check server listening on port 8081
   Endpoint: http://localhost:8081/health

✅ Worker initialized and polling for jobs
   Job polling: Every 60s
   Pattern analysis: Every 60min
   Experiment checks: Every 15min

🔄 Worker running...
```

---

## Final Architecture

After setup, you'll have **two Railway services**:

```
┌─────────────────────────────────────┐
│  Railway Service 1: blipee-os       │
│  - 8 Autonomous Agents              │
│  - Dockerfile: Dockerfile.worker    │
│  - Port: 8080                       │
│  - CMD: npm run agents:start        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Railway Service 2:                 │
│    prompt-optimization-worker       │
│  - ML Prompt Optimization           │
│  - Dockerfile: Dockerfile.prompt-   │
│    worker                           │
│  - Port: 8081                       │
│  - CMD: npm run prompt-worker:start │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Supabase Database                  │
│  - optimization_jobs ✅              │
│  - ai_pattern_insights              │
│  - ai_prompt_versions               │
│  - ai_ab_experiments                │
└─────────────────────────────────────┘
```

---

## What's Already Done

✅ Worker code created: `src/workers/prompt-optimization-worker.ts`
✅ Database migration applied: `optimization_jobs` table
✅ Dockerfile created: `Dockerfile.prompt-worker`
✅ Railway config created: `railway.prompt-worker.json`
✅ npm scripts added: `prompt-worker:start`, `prompt-worker:dev`
✅ Environment variables identified
✅ Documentation created

**Only Missing:** Creating the second Railway service via dashboard (5-10 minutes)

---

## Troubleshooting

### Build Fails
- Check Dockerfile path is correct: `Dockerfile.prompt-worker`
- Verify repository branch is `main`
- Check build logs for npm errors

### Container Crashes
- Check environment variables are set correctly
- Verify SUPABASE_SERVICE_ROLE_KEY has proper permissions
- Check logs for error messages

### Health Check Fails
- Verify port 8081 is exposed
- Check that `npm run prompt-worker:start` runs successfully locally
- Review Railway service logs for startup errors

---

## Testing the Worker

Once deployed, create a test job:

```sql
-- Connect to Supabase and run:
SELECT create_optimization_job(
  'pattern_analysis',
  '{"days": 7}'::jsonb,
  0
);
```

Then check the worker picked it up:

```sql
-- Check job status
SELECT * FROM optimization_jobs ORDER BY created_at DESC LIMIT 5;
```

The worker should process it within 60 seconds and mark it as completed.

---

## Need Help?

- Railway Dashboard: https://railway.com/project/18ecc328-effd-4245-bc03-3022fb1040a9
- Worker Health: `https://<service-url>/health`
- Database: https://app.supabase.com/project/quovvwrwyfkzhgqdeham
