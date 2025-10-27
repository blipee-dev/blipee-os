# AI Prompt Optimization Worker - Railway Deployment

## Overview
The prompt optimization worker is a 24/7 autonomous service that continuously optimizes AI prompts through ML-based analysis.

## What's Been Set Up

### 1. Worker Service
- **File**: `src/workers/prompt-optimization-worker.ts`
- **Port**: 8081
- **Health Check**: `http://localhost:8081/health`
- **Functions**:
  - Pattern analysis (every hour)
  - Variant generation
  - A/B experiment creation and monitoring
  - Auto-promotion of winning variants

### 2. Database Migration
- **File**: `supabase/migrations/20251027000000_optimization_jobs.sql`
- **Status**: ✅ Applied to Supabase
- **Tables**: `optimization_jobs`
- **Features**: Job queue, RLS policies, helper functions

### 3. Docker Configuration
- **File**: `Dockerfile.prompt-worker`
- **Base**: Node 20 Alpine
- **User**: Non-root (worker:nodejs)
- **Health Check**: Automatic every 30s
- **Command**: `npm run prompt-worker:start`

### 4. npm Scripts Added
```json
"prompt-worker:start": "tsx src/workers/prompt-optimization-worker.ts",
"prompt-worker:dev": "tsx watch src/workers/prompt-optimization-worker.ts"
```

## Deployment to Railway

### Option 1: Create New Service via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Select Project**: "awake-joy"
3. **Click "New Service"** → "Empty Service"
4. **Configure Service**:
   - Name: `prompt-optimization-worker`
   - Source: Connect to same GitHub repository
   - Build:
     - Builder: Dockerfile
     - Dockerfile Path: `Dockerfile.prompt-worker`
   - Deploy:
     - Health Check Path: `/health`
     - Health Check Timeout: 300s
     - Restart Policy: ON_FAILURE
     - Max Retries: 10

5. **Set Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<same as agent worker>
   SUPABASE_SERVICE_ROLE_KEY=<same as agent worker>
   ADMIN_USER_ID=<your admin user ID>
   PORT=8081
   ```

6. **Deploy**: Railway will automatically build and deploy

### Option 2: Using Railway CLI

```bash
# Create new service (if Railway CLI supports it)
railway service create prompt-optimization-worker

# Link to the service
railway service link

# Deploy
railway up
```

## Verification

Once deployed, verify the worker is running:

```bash
# Check health endpoint
curl https://<railway-service-url>/health

# Expected response:
{
  "status": "healthy",
  "uptime": 123,
  "stats": {
    "jobsCompleted": 0,
    "jobsFailed": 0,
    "patternsAnalyzed": 0,
    "variantsGenerated": 0,
    "experimentsCreated": 0,
    "experimentsCompleted": 0
  },
  "timestamp": "2025-10-27T..."
}
```

## Architecture

```
┌─────────────────────────────────────┐
│  Railway Service 1: Agent Worker    │
│  - 8 Autonomous Agents              │
│  - Port: 8080                       │
│  - Health: /health                  │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Railway Service 2: Prompt Worker   │
│  - ML Prompt Optimization           │
│  - Port: 8081                       │
│  - Health: /health                  │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│  Supabase Database                  │
│  - optimization_jobs                │
│  - ai_pattern_insights              │
│  - ai_prompt_versions               │
│  - ai_ab_experiments                │
└─────────────────────────────────────┘
```

## How It Works

### Job Flow
1. **Job Creation**: Admin creates job via API or scheduled automatically
2. **Job Queue**: Job stored in `optimization_jobs` table with status='pending'
3. **Worker Polling**: Worker checks for pending jobs every 60 seconds
4. **Execution**: Worker processes job based on type:
   - `pattern_analysis`: Analyzes conversation patterns
   - `variant_generation`: Generates prompt variants
   - `experiment_creation`: Creates A/B tests
   - `experiment_monitoring`: Monitors active experiments
   - `full_cycle`: Runs all steps sequentially
5. **Completion**: Job marked as completed with results

### Automatic Scheduling
- **Pattern Analysis**: Every hour
- **Experiment Monitoring**: Every 15 minutes
- **Auto-Promotion**: When confidence > 90% and conversations > 100

## Monitoring

### Worker Stats
Check worker stats via health endpoint:
```bash
curl https://<worker-url>/health
```

### Database Queries
```sql
-- Check pending jobs
SELECT * FROM optimization_jobs WHERE status = 'pending' ORDER BY created_at;

-- Check active experiments
SELECT * FROM ai_ab_experiments WHERE status = 'running';

-- Check recent patterns
SELECT * FROM ai_pattern_insights WHERE is_actionable = true ORDER BY created_at DESC;
```

## Next Steps

After deployment:
1. ✅ Verify health endpoint responds
2. ✅ Check Railway logs for startup messages
3. ✅ Create a test optimization job
4. ✅ Monitor job execution in database
5. ✅ Verify patterns are being analyzed
6. ✅ Check A/B experiments are created

## Troubleshooting

### Worker Not Starting
- Check environment variables are set correctly
- Verify SUPABASE_SERVICE_ROLE_KEY has proper permissions
- Check Railway build logs for errors

### No Jobs Processing
- Verify `optimization_jobs` table exists
- Check RLS policies allow service_role access
- Ensure worker can connect to Supabase

### Health Check Failing
- Verify port 8081 is exposed
- Check worker process is running
- Review Railway service logs
