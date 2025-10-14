# Upstash Redis Setup Guide

This guide will help you set up Upstash Redis for production-ready session storage in blipee OS.

## Why Upstash Redis?

The current session system uses in-memory storage, which causes 401 authentication errors in production because:
- **Vercel serverless functions** don't share memory between instances
- Sessions created on one instance are not available on other instances
- Every deployment or function restart loses all sessions

Upstash Redis solves this by providing:
- ✅ **Serverless-first**: REST API works perfectly in Vercel Edge & Serverless
- ✅ **Global distribution**: Low latency worldwide
- ✅ **Free tier**: 10,000 commands/day, perfect for development
- ✅ **Automatic scaling**: No infrastructure management
- ✅ **Session persistence**: Survives deployments and instance restarts

## Step 1: Create Upstash Account

1. Go to [https://console.upstash.com](https://console.upstash.com)
2. Sign up with GitHub, Google, or email
3. Verify your email address

## Step 2: Create Redis Database

1. Click **"Create Database"** in the Upstash console
2. Configure your database:
   - **Name**: `blipee-sessions-prod` (or any name you prefer)
   - **Type**: Choose **Regional** for lower cost, or **Global** for better worldwide performance
   - **Region**: Select the region closest to your Vercel deployment (e.g., `us-east-1`, `eu-west-1`)
   - **TLS**: Keep enabled (recommended for security)
   - **Eviction**: Set to **allkeys-lru** (automatically removes least recently used keys when memory is full)

3. Click **"Create"**

## Step 3: Get Your Credentials

After creating the database, you'll see the database details page.

1. Look for the **REST API** section
2. Copy these two values:
   - `UPSTASH_REDIS_REST_URL` - looks like `https://your-redis-id.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` - a long string starting with `AX...`

## Step 4: Add to Local Environment

Update your `.env.local` file:

```bash
# Upstash Redis (Required for production session storage)
UPSTASH_REDIS_REST_URL=https://your-redis-id.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...your-token-here
```

## Step 5: Add to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to your project on [https://vercel.com](https://vercel.com)
2. Click **Settings** → **Environment Variables**
3. Add two new variables:
   - **Key**: `UPSTASH_REDIS_REST_URL`
     **Value**: `https://your-redis-id.upstash.io`
     **Environments**: Check Production, Preview, and Development

   - **Key**: `UPSTASH_REDIS_REST_TOKEN`
     **Value**: `AX...your-token-here`
     **Environments**: Check Production, Preview, and Development

4. Click **"Save"** for each variable

### Option B: Via Vercel CLI

```bash
# Add to production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production

# Add to preview
vercel env add UPSTASH_REDIS_REST_URL preview
vercel env add UPSTASH_REDIS_REST_TOKEN preview
```

## Step 6: Test Locally

1. Restart your development server:
```bash
npm run dev
```

2. Check the console output for:
```
✅ Upstash Redis session store connected
```

3. Try logging in - you should see sessions persisting across page refreshes

## Step 7: Deploy to Production

1. Commit the code changes:
```bash
git add .
git commit -m "feat: Enable Upstash Redis for production session storage"
git push origin main
```

2. Vercel will automatically deploy with the new environment variables

3. After deployment, test the production site:
   - Log in to `https://www.blipee.io`
   - Navigate between pages
   - You should NOT see any 401 errors
   - Sessions should persist across navigation

## Verification

### Check Redis Connection in Logs

In Vercel Dashboard:
1. Go to **Deployments** → select your latest deployment
2. Click **"View Function Logs"**
3. Look for:
   ```
   ✅ Upstash Redis session store connected
   ```

### Monitor Redis Usage

In Upstash Console:
1. Go to your database dashboard
2. You'll see:
   - **Commands/day**: Should show activity when users log in
   - **Data size**: Will show stored session data
   - **Connections**: Shows active connections from Vercel

### Test Session Persistence

1. Log in to production site
2. Open Developer Console → Application → Cookies
3. Find `blipee-session` cookie
4. Copy the cookie value
5. Close browser and reopen
6. The session should still be valid (if within 8-hour TTL)

## Troubleshooting

### Still seeing 401 errors?

1. **Check environment variables are set**:
   ```bash
   vercel env ls
   ```

2. **Verify Redis credentials are correct**:
   - Go to Upstash Console
   - Copy the REST URL and Token again
   - Make sure there are no extra spaces or quotes

3. **Check Vercel function logs**:
   - Look for "Failed to connect to Redis" errors
   - If you see this, double-check your credentials

### Redis connection timeout?

- Make sure your Redis database is in the same region as your Vercel deployment
- Check if TLS is enabled (it should be)
- Verify network connectivity

### Sessions still not persisting?

1. Check the session TTL setting:
   ```bash
   # In .env.local or Vercel environment variables
   SESSION_TTL=28800  # 8 hours in seconds
   ```

2. Verify the cookie is being set:
   - Open DevTools → Network
   - Look for `Set-Cookie` header in API responses
   - Should contain `blipee-session=...`

## Free Tier Limits

Upstash Free Tier includes:
- **10,000 commands/day** (requests to Redis)
- **256 MB storage**
- **1 GB bandwidth/month**

This is typically enough for:
- ~500 daily active users
- Thousands of page views per day
- Development and staging environments

If you exceed limits, Upstash will automatically throttle (not charge), and you can upgrade to a paid plan.

## Cost Optimization

To minimize Redis usage:

1. **Session TTL**: Currently set to 8 hours
   - Shorter TTL = less storage used
   - Longer TTL = better user experience

2. **Sliding Expiration**: Currently enabled
   - Sessions auto-extend on activity
   - Inactive sessions expire naturally

3. **Cleanup**: Automatic cleanup runs every hour
   - Removes expired sessions
   - Keeps storage usage low

## Next Steps

After setup is complete:
- ✅ Sessions work across all Vercel serverless instances
- ✅ No more 401 errors on production
- ✅ Users stay logged in across page refreshes
- ✅ Sessions persist through deployments

## Support

- **Upstash Documentation**: https://docs.upstash.com/redis
- **Upstash Discord**: https://discord.gg/upstash
- **Vercel Documentation**: https://vercel.com/docs/environment-variables
