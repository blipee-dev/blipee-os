# How to Check Vercel Function Logs

## Step-by-Step Instructions

### 1. Go to Vercel Dashboard
- Open: https://vercel.com
- Log in if needed
- Select your project (blipee-os)

### 2. Navigate to Deployments
- Click the **"Deployments"** tab at the top
- You'll see a list of recent deployments

### 3. Find the Current Production Deployment
- Look for the deployment with a "Production" badge
- The deployment ID ends with: `d397bfd7450d`
- Click on this deployment

### 4. View Function Logs
- Click the **"View Function Logs"** button
- This opens the real-time logs from your serverless functions

### 5. Search for Redis
- In the logs search box (top right), type: `Redis`
- OR type: `Upstash`
- OR type: `session store`

## What to Look For

### ✅ SUCCESS - You'll see:
```
✅ Upstash Redis session store connected
```
**This means Redis is working! The 401 errors should stop.**

### ❌ PROBLEM - You'll see one of these:
```
Failed to connect to Redis, falling back to in-memory sessions
```
**This means environment variables are missing or wrong.**

OR

```
ℹ️ No Redis configured, using in-memory sessions
```
**This means environment variables aren't set in Vercel.**

OR

```
Error: getaddrinfo ENOTFOUND
```
**This means the Redis URL is wrong or database doesn't exist.**

## If You See a Problem

### Problem: "No Redis configured"
**Fix:** Add environment variables to Vercel
1. Settings → Environment Variables
2. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
3. Redeploy

### Problem: "Failed to connect"
**Fix:** Check credentials are correct
1. Go to Upstash Console
2. Verify database is Active
3. Copy credentials again
4. Update in Vercel
5. Redeploy

### Problem: No Redis logs at all
**Fix:** Trigger a function call to initialize Redis
1. Visit https://www.blipee.io
2. Try to log in (even if it fails)
3. Check logs again - should see Redis initialization

## Need the Exact Logs?

If you're unsure what you're seeing, copy the entire log output and share it.
Look for lines containing:
- "Redis"
- "Upstash"
- "session"
- "Failed"
- "connected"
- "✅"
- "❌"
