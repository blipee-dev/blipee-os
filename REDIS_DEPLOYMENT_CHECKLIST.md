# Redis Production Deployment Checklist

## ✅ Completed
- [x] Installed @upstash/redis package
- [x] Updated session manager to enable Redis auto-detection
- [x] Added `setex` method to Upstash wrapper
- [x] Created comprehensive setup guide (UPSTASH_REDIS_SETUP.md)
- [x] Committed and pushed all changes to GitHub
- [x] Vercel deployment triggered automatically

## 🚨 Action Required (You Need to Do These)

### 1. Create/Verify Upstash Redis Database

**Option A: Create New Database**
1. Go to https://console.upstash.com
2. Click "Create Database"
3. Configure:
   - Name: `blipee-sessions-prod`
   - Region: `us-east-1` (or closest to your Vercel region)
   - Type: Regional (cheaper) or Global (faster worldwide)
   - Eviction: `allkeys-lru`
4. Click "Create"

**Option B: Verify Existing Database**
1. Go to https://console.upstash.com
2. Check if `sweeping-eagle-11450` exists
3. If it doesn't exist, create a new one (Option A)

### 2. Get Fresh Credentials

After creating/finding your database:
1. Click on the database name
2. Scroll to **REST API** section
3. Copy these two values:
   ```
   UPSTASH_REDIS_REST_URL=https://your-redis-id.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AX...your-token
   ```

### 3. Update Local Environment

Edit `.env.local`:
```bash
# Replace with your actual values
UPSTASH_REDIS_REST_URL=https://your-actual-redis-id.upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...your-actual-token
```

### 4. Add to Vercel (CRITICAL for Production)

**Via Vercel Dashboard:**
1. Go to https://vercel.com/blipee-dev/blipee-os (or your project URL)
2. Click **Settings** → **Environment Variables**
3. Add TWO variables:

   **Variable 1:**
   - Key: `UPSTASH_REDIS_REST_URL`
   - Value: `https://your-actual-redis-id.upstash.io`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

   **Variable 2:**
   - Key: `UPSTASH_REDIS_REST_TOKEN`
   - Value: `AX...your-actual-token`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

### 5. Redeploy (or Wait for Auto-Deploy)

**Option A: Automatic**
- The git push already triggered a deployment
- Wait for it to complete (~2-3 minutes)

**Option B: Manual Trigger**
1. Go to Vercel Dashboard → Deployments
2. Click the 3-dot menu on the latest deployment
3. Click "Redeploy"

### 6. Verify Production Works

After deployment completes:

1. **Open Production Site**:
   - Go to https://www.blipee.io

2. **Check Vercel Logs**:
   - Vercel Dashboard → Deployments → Latest → "View Function Logs"
   - Look for: `✅ Upstash Redis session store connected`
   - Should NOT see: `Failed to connect to Redis`

3. **Test Login**:
   - Log in to your account
   - Navigate between pages
   - Refresh the page
   - Session should persist (no 401 errors)

4. **Check Browser Console**:
   - Press F12 → Console tab
   - Should NOT see: `GET /api/auth/session 401 (Unauthorized)`
   - Should see successful session requests

5. **Monitor Upstash**:
   - Go to Upstash Console → Your Database
   - Check "Commands" graph - should show activity
   - Check "Data Size" - will increase as users log in

## 🐛 Troubleshooting

### Still seeing 401 errors?

**Check 1: Environment variables in Vercel**
```bash
# Run this command to list all Vercel env vars:
vercel env ls
```
Both variables should be listed for production.

**Check 2: Vercel function logs**
- Look for "Failed to connect to Redis" errors
- If you see `ENOTFOUND`, the URL is wrong
- If you see `401`, the token is wrong

**Check 3: Redeploy after adding env vars**
- Environment variables only take effect after deployment
- Trigger a redeploy if you just added them

### Redis connection timeout?

- Make sure Redis database exists and is active
- Check that URL includes `https://` prefix
- Verify region matches your Vercel deployment region

### Sessions still not persisting?

1. Clear browser cookies and try again
2. Check that the `blipee-session` cookie is being set:
   - F12 → Application → Cookies → https://www.blipee.io
   - Should see `blipee-session` cookie with a long hex value

## 📊 Success Criteria

You'll know it's working when:
- ✅ No 401 errors in browser console
- ✅ Login state persists across page refreshes
- ✅ Can navigate entire site without being logged out
- ✅ Vercel logs show: `✅ Upstash Redis session store connected`
- ✅ Upstash dashboard shows active commands

## 🎯 Expected Timeline

- **Step 1-3**: 5 minutes (Create database, get credentials)
- **Step 4**: 2 minutes (Add to Vercel)
- **Step 5**: 2-3 minutes (Automatic deployment)
- **Step 6**: 2 minutes (Verification)

**Total: ~10-15 minutes to full production readiness**

## 📚 Additional Resources

- Full setup guide: `UPSTASH_REDIS_SETUP.md`
- Upstash docs: https://docs.upstash.com/redis
- Vercel env vars: https://vercel.com/docs/environment-variables

## 🆘 Need Help?

If you encounter issues:
1. Check Vercel function logs first
2. Check Upstash dashboard for connection attempts
3. Verify environment variables are set correctly
4. Try redeploying after env var changes
