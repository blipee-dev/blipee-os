# 🚂 Railway Deployment Guide - Blipee AI Agent Worker

## 📋 Prerequisites

Before deploying to Railway, ensure you have:

1. ✅ Railway account (sign up at https://railway.app)
2. ✅ Railway CLI installed: `npm install -g @railway/cli`
3. ✅ Supabase project with database migration applied
4. ✅ OpenAI API key
5. ✅ GitHub repo (optional, for auto-deployment)

## 🗄️ Step 1: Run Database Migration

Before deploying the worker, apply the agent messaging migration:

```bash
# Using Supabase CLI
supabase db push

# Or using psql directly
psql YOUR_SUPABASE_URL -f supabase/migrations/20251026040000_agent_proactive_messaging.sql
```

Verify migration:
```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('notifications', 'agent_scheduled_tasks');
```

## 🚀 Step 2: Deploy to Railway

### Option A: Deploy via CLI (Recommended)

1. **Login to Railway:**
```bash
railway login
```

2. **Initialize project:**
```bash
railway init
```

3. **Link to existing project (if applicable):**
```bash
railway link
```

4. **Set environment variables:**
```bash
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_SERVICE_KEY=your-service-role-key
railway variables set OPENAI_API_KEY=sk-proj-your-key
railway variables set NODE_ENV=production
```

5. **Deploy:**
```bash
railway up
```

### Option B: Deploy via GitHub

1. **Connect GitHub repo to Railway:**
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure build settings:**
   - Railway will auto-detect `railway.json`
   - Build Command: Uses Dockerfile.worker
   - Start Command: `npm run agents:start`

3. **Set environment variables in Railway dashboard:**
   - Go to Variables tab
   - Add all required env vars (see list below)

4. **Deploy:**
   - Click "Deploy" or push to main branch

## 🔐 Required Environment Variables

Set these in Railway dashboard or via CLI:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` | ✅ |
| `SUPABASE_SERVICE_KEY` | Service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ |
| `OPENAI_API_KEY` | OpenAI API key | `sk-proj-...` | ✅ |
| `NODE_ENV` | Environment | `production` | ✅ |
| `DEEPSEEK_API_KEY` | DeepSeek key (optional) | `sk-...` | ❌ |
| `PORT` | Port for health checks | `8080` | Auto-set |

**⚠️ Security Warning:** Never commit `SUPABASE_SERVICE_KEY` to git! It has admin access to your database.

## 🔍 Step 3: Verify Deployment

### Check Logs

```bash
railway logs
```

Look for:
```
🚀 Starting Blipee AI Autonomous Agent Worker...
📊 Found 1 organization(s)
🏢 Initializing agents for: Your Org (org-id-123)
✅ Workforce initialized for Your Org
   • 8 AI employees active
   • Operating mode: 24/7
👂 Listening for agent task results...
💚 Health check: excellent - 8/8 agents active
```

### Test Health Endpoint

```bash
# Get your Railway URL
railway open

# Test health endpoint
curl https://your-app.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "agents": 8,
  "uptime": 12345
}
```

### Check Database

```sql
-- Verify agent schedules were initialized
SELECT agent_id, task_type, schedule_pattern, enabled
FROM agent_scheduled_tasks
WHERE organization_id = 'your-org-id';

-- Should show 8 agents with schedules like:
-- carbon-hunter | emissions_scan | 0 9 1,15 * * | true
-- compliance-guardian | compliance_check | 0 8 5,20 * * | true
-- etc.
```

## 📊 Step 4: Monitor Agent Activity

### View Real-time Logs

```bash
railway logs --tail
```

### Check Agent Task Results

```sql
SELECT
  agent_id,
  task_type,
  status,
  created_at,
  result->>'summary' as summary
FROM agent_task_results
ORDER BY created_at DESC
LIMIT 10;
```

### Check Proactive Messages

```sql
SELECT
  m.created_at,
  m.agent_id,
  m.priority,
  LEFT(m.content, 100) as preview
FROM messages m
WHERE m.role = 'agent'
ORDER BY m.created_at DESC
LIMIT 10;
```

### Check Notifications

```sql
SELECT
  user_id,
  title,
  priority,
  read,
  created_at
FROM notifications
WHERE type = 'agent_message'
ORDER BY created_at DESC
LIMIT 10;
```

## 🔧 Step 5: Configure Agent Schedules (Optional)

If you want to adjust agent schedules:

1. **Update schedule patterns in database:**
```sql
UPDATE agent_scheduled_tasks
SET schedule_pattern = '0 9 * * MON,WED,FRI' -- Every Mon, Wed, Fri at 9 AM
WHERE agent_id = 'carbon-hunter';
```

2. **Restart worker to pick up changes:**
```bash
railway restart
```

**Cron Pattern Examples:**
- `0 9 * * *` - Every day at 9 AM
- `0 9 1,15 * *` - 1st and 15th of month at 9 AM
- `0 */2 * * *` - Every 2 hours
- `0 9 * * MON` - Every Monday at 9 AM

## 📈 Performance Monitoring

### Railway Metrics

View in Railway dashboard:
- CPU usage (should be <50%)
- Memory usage (should be <500MB)
- Network traffic
- Deployment status

### Set Up Alerts

In Railway dashboard:
1. Go to Settings > Monitoring
2. Add alert for CPU > 80%
3. Add alert for Memory > 700MB
4. Add alert for deployment failures

## 💰 Cost Estimation

**Railway Costs:**
- Starter plan: ~$5/month (500 hours)
- Pro plan: ~$20/month (usage-based)

**OpenAI API Costs:**
- GPT-4o-mini: ~$0.15-0.60 per million tokens
- Estimated: ~$20-50/month for active usage

**Total: ~$25-70/month** for 24/7 AI workforce

## 🐛 Troubleshooting

### Worker Not Starting

**Check logs:**
```bash
railway logs
```

**Common issues:**
1. Missing environment variables → Set via `railway variables set`
2. Database connection failed → Verify `NEXT_PUBLIC_SUPABASE_URL`
3. Migration not applied → Run migration script

### Agents Not Sending Messages

**Check:**
1. Organizations exist in database
2. Agent schedules initialized
3. Task results being created

**Debug:**
```sql
-- Check if agents are writing task results
SELECT COUNT(*) FROM agent_task_results
WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check if message generator is running
SELECT COUNT(*) FROM messages
WHERE role = 'agent'
AND created_at > NOW() - INTERVAL '24 hours';
```

### High Memory Usage

**Fix:** Reduce concurrent operations

```typescript
// In src/workers/agent-worker.ts
private readonly healthCheckInterval = 10 * 60 * 1000; // Increase to 10 minutes
```

### Database Connection Timeout

**Fix:** Add connection pooling

```typescript
// In agent-worker.ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'x-application-name': 'blipee-agent-worker',
        'Connection': 'keep-alive'
      }
    }
  }
);
```

## 🔄 Updates and Redeployment

### Redeploy After Code Changes

**Via CLI:**
```bash
railway up
```

**Via GitHub:**
```bash
git add .
git commit -m "Update agent logic"
git push origin main
# Railway auto-deploys
```

### Zero-Downtime Updates

Railway supports rolling deployments. New version starts before old version stops.

### Rollback

```bash
railway rollback
```

## 🛡️ Security Best Practices

1. ✅ **Never commit secrets** - Use Railway environment variables
2. ✅ **Use service role key** - Not anon key for worker
3. ✅ **Enable RLS policies** - Database security
4. ✅ **Monitor logs** - Watch for suspicious activity
5. ✅ **Set OpenAI rate limits** - Prevent cost overruns
6. ✅ **Use non-root user** - Docker security (already configured)

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app/)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Cron Expression Generator](https://crontab.guru/)

## ✅ Deployment Checklist

Before going to production:

- [ ] Database migration applied
- [ ] All environment variables set
- [ ] Worker deployed and running
- [ ] Health check passing
- [ ] Agents initialized (check logs)
- [ ] Test proactive message received
- [ ] Monitoring configured
- [ ] Alerts set up
- [ ] Cost tracking enabled
- [ ] Documentation reviewed

## 🎉 You're Live!

Your AI workforce is now running 24/7 on Railway! The agents will:

✅ Monitor sustainability data continuously
✅ Detect anomalies and opportunities
✅ Send proactive messages to users
✅ Self-heal on errors
✅ Scale with your organization

**Next Steps:**
1. Open your app and check chat for agent messages
2. Monitor Railway dashboard for performance
3. Review OpenAI usage for cost optimization
4. Adjust agent schedules based on feedback

---

**Need help?** Check logs first, then refer to troubleshooting section above.

**Ready to scale?** Railway auto-scales based on demand. Upgrade plan as needed.
