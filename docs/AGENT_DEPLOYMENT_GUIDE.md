# 🤖 Blipee AI Autonomous Agents - Deployment Guide

## 📋 Overview

Blipee OS includes **8 autonomous AI agents** that work 24/7 analyzing sustainability data and sending proactive messages to users. This guide covers deploying the agent worker separately from the main Next.js application.

### Architecture

```
┌─────────────────┐         ┌──────────────────────┐
│   Vercel        │         │  Railway/Render      │
│   (Next.js App) │         │  (Agent Worker)      │
│                 │         │                      │
│   - Web UI      │         │  - 8 AI Agents       │
│   - API Routes  │         │  - Task Scheduler    │
│   - Chat        │         │  - Message Generator │
└────────┬────────┘         └──────────┬───────────┘
         │                             │
         │         ┌───────────────────┘
         │         │
         └─────────▼
       ┌─────────────────────┐
       │   Supabase          │
       │   (Database)        │
       │                     │
       │   - Messages        │
       │   - Agent Tasks     │
       │   - Notifications   │
       └─────────────────────┘
```

## 🎯 The 8 Autonomous Agents

| Agent | Schedule | Purpose |
|-------|----------|---------|
| 🔍 Carbon Hunter | Bi-weekly (1st & 15th) | Emissions monitoring, anomaly detection |
| ⚖️ Compliance Guardian | Bi-weekly (5th & 20th) | GRI, TCFD, CDP, SASB compliance |
| 💰 Cost Saving Finder | Bi-weekly (3rd & 18th) | Energy cost optimization |
| 🔧 Predictive Maintenance | Every 4 hours | Equipment failure prediction |
| ⚡ Autonomous Optimizer | Every 2 hours | Operations optimization (HVAC, lighting) |
| 🔗 Supply Chain Investigator | Weekly (Wednesday) | Supplier risk assessment |
| 📋 Regulatory Foresight | Daily | Regulatory monitoring |
| 👔 ESG Chief of Staff | Weekly (Monday) | Strategic oversight |

## 🚀 Deployment Options

### Option 1: Railway (Recommended)

**Pros:** Simple deployment, automatic restarts, affordable
**Cost:** ~$5/month for starter plan

#### Steps:

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login to Railway**
```bash
railway login
```

3. **Create New Project**
```bash
railway init
```

4. **Set Environment Variables**
```bash
railway variables set NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
railway variables set SUPABASE_SERVICE_KEY=your-service-key
railway variables set OPENAI_API_KEY=your-openai-key
```

5. **Deploy**
```bash
railway up
```

The `railway.toml` and `railway.json` configs are already set up!

### Option 2: Render.com

**Pros:** Great free tier, easy setup
**Cost:** Free tier available, $7/month for paid

#### Steps:

1. **Connect GitHub Repo** to Render dashboard

2. **Create Background Worker** service

3. **Configure:**
   - **Build Command:** `npm install`
   - **Start Command:** `npm run agents:start`
   - **Plan:** Starter or Free

4. **Set Environment Variables** in Render dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `OPENAI_API_KEY`
   - `DEEPSEEK_API_KEY` (optional)

5. **Deploy** - Render auto-deploys on git push!

The `render.yaml` config is already set up!

### Option 3: Heroku

**Pros:** Established platform, good docs
**Cost:** ~$7/month for Eco dynos

#### Steps:

1. **Install Heroku CLI**
```bash
npm install -g heroku
```

2. **Login**
```bash
heroku login
```

3. **Create App**
```bash
heroku create blipee-agent-worker
```

4. **Set Config Vars**
```bash
heroku config:set NEXT_PUBLIC_SUPABASE_URL=your-url
heroku config:set SUPABASE_SERVICE_KEY=your-key
heroku config:set OPENAI_API_KEY=your-key
```

5. **Deploy**
```bash
git push heroku main
```

6. **Scale Worker**
```bash
heroku ps:scale worker=1
```

The `Procfile` is already set up!

### Option 4: Docker + Any Cloud

**Pros:** Maximum flexibility, works anywhere
**Cost:** Varies by provider

1. **Build Docker Image**
```bash
docker build -t blipee-agent-worker .
```

2. **Run Locally (Test)**
```bash
docker run -e NEXT_PUBLIC_SUPABASE_URL=your-url \
           -e SUPABASE_SERVICE_KEY=your-key \
           -e OPENAI_API_KEY=your-key \
           blipee-agent-worker
```

3. **Deploy to:** AWS ECS, Google Cloud Run, Azure Container Instances, DigitalOcean App Platform, etc.

## 🔧 Local Development

### Run Everything Locally

```bash
# Terminal 1: Start Next.js app
npm run dev

# Terminal 2: Start agent worker
npm run agents:dev
```

Or use concurrently to run both:
```bash
npm run dev:with-agents
```

### Test Agent Worker

```bash
# Start worker
npm run agents:start

# Check status
npm run agents:status
```

## 📊 Database Migration

Before deploying, run the database migration:

```bash
# Run migration
psql YOUR_SUPABASE_URL -f supabase/migrations/20251026040000_agent_proactive_messaging.sql
```

Or use Supabase CLI:
```bash
supabase db push
```

This creates:
- `notifications` table for agent alerts
- `agent_scheduled_tasks` table for task scheduling
- Updates `messages` table to support agent role
- Updates `conversations` table for agent_proactive type

## 🔐 Environment Variables

Required for agent worker:

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Service role key (sensitive!) | `eyJhbGciOiJI...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` |
| `DEEPSEEK_API_KEY` | DeepSeek key (optional) | `sk-...` |
| `NODE_ENV` | Environment | `production` |

**⚠️ Security Note:** Never commit `SUPABASE_SERVICE_KEY` to git!

## 🎛️ Agent Configuration

### Adjusting Schedules

Edit `src/app/api/ai/agents/initialize/route.ts`:

```typescript
{
  agentId: 'carbon-hunter',
  type: 'emissions_scan',
  schedule: '0 9 1,15 * *', // Cron format: min hour day month dayOfWeek
  payload: { ... }
}
```

**Cron Examples:**
- `0 9 * * *` - Every day at 9 AM
- `0 9 * * MON` - Every Monday at 9 AM
- `0 */2 * * *` - Every 2 hours
- `0 9 1,15 * *` - 1st and 15th of month at 9 AM

### Notification Thresholds

Edit `src/lib/ai/autonomous-agents/message-generator.ts`:

```typescript
const notificationRules = {
  'carbon-hunter': (r: any) => {
    return r?.emissionsIncrease > 10 || // Threshold: 10%
           r?.anomaliesDetected > 0 ||
           r?.savingsOpportunities?.length > 0;
  },
  // ... other agents
};
```

## 📈 Monitoring

### Health Checks

The agent worker performs self-health checks every 5 minutes:
```
💚 Health check at 2025-01-26T15:30:00Z
   • Org abc-123: excellent - 8/8 agents active
```

### Logs

**Railway:**
```bash
railway logs
```

**Render:**
```bash
# View in Render dashboard > Logs tab
```

**Heroku:**
```bash
heroku logs --tail
```

### Key Metrics

Monitor these:
- ✅ All 8 agents active (systemHealth: 'excellent')
- ✅ Task completion rate > 95%
- ✅ Message generation success
- ⚠️ Error rate < 5%
- ⚠️ Response time < 30s per task

## 🔍 Troubleshooting

### Agent Worker Not Starting

**Check:**
1. Environment variables set correctly
2. Supabase connection working
3. Database migration ran successfully

**Fix:**
```bash
# Test connection
curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/

# Restart worker
railway restart
# or
heroku restart worker
```

### Agents Not Sending Messages

**Check:**
1. Organizations exist in database
2. Agent schedules configured
3. Task results being written to `agent_task_results`

**Debug:**
```sql
-- Check agent tasks
SELECT * FROM agent_task_results
ORDER BY created_at DESC
LIMIT 10;

-- Check notifications
SELECT * FROM notifications
WHERE type = 'agent_message'
ORDER BY created_at DESC;
```

### High Memory Usage

**Fix:** Reduce concurrent agent operations

Edit `src/lib/ai/autonomous-agents/base/AgentOrchestrator.ts`:
```typescript
private readonly maxTasksPerAgent = 5; // Reduced from 10
```

### Database Connection Issues

**Fix:** Check connection pooling

```typescript
// In agent-worker.ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: { persistSession: false },
    db: { schema: 'public' },
    global: {
      headers: { 'x-application-name': 'blipee-agent-worker' }
    }
  }
);
```

## 🎉 Verification

After deployment, verify agents are working:

### 1. Check Worker Logs

Look for:
```
✅ Agent worker fully operational
🤖 8 autonomous agents working 24/7
👂 Listening for agent task results (org: xxx)
```

### 2. Test Proactive Message

Manually trigger a task:
```bash
curl -X POST your-worker-url/test-agent \
  -H "Content-Type: application/json" \
  -d '{"agentId": "carbon-hunter", "organizationId": "xxx"}'
```

### 3. Check Chat UI

1. Open chat in Blipee OS
2. Look for agent messages (blue bordered boxes)
3. Verify they show agent name, priority, timestamp

### 4. Check Notifications

```sql
SELECT * FROM notifications
WHERE user_id = 'your-user-id'
AND type = 'agent_message'
ORDER BY created_at DESC;
```

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app/)
- [Render Docs](https://render.com/docs)
- [Heroku Docs](https://devcenter.heroku.com/)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Vercel AI SDK](https://sdk.vercel.ai/)

## 💡 Tips

1. **Start small:** Deploy to Railway free tier first, scale up as needed
2. **Monitor costs:** OpenAI API calls can add up, set usage limits
3. **Use caching:** Implement caching for repeated analyses
4. **Rate limiting:** Don't overwhelm your database with too many agents running concurrently
5. **Graceful degradation:** If one agent fails, others should continue working

## 🆘 Support

If you encounter issues:

1. **Check logs** for error messages
2. **Verify environment** variables are set
3. **Test database** connectivity
4. **Review agent** schedules and thresholds
5. **Contact support** if problems persist

---

**Ready to deploy? 🚀**

The infrastructure is built, tested, and ready for production. Your AI workforce awaits!
