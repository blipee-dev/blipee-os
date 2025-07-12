# Retail Intelligence Module - Staging Deployment Guide

## Overview

This guide covers the deployment of the Retail Intelligence Module to a staging environment, ensuring the Telegram bot continues to function while we add the web interface.

## Pre-Deployment Checklist

### 1. Environment Variables
Before deploying, ensure all variables in `.env.staging` are properly configured:

- [ ] **Supabase Staging Instance**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **ViewSonic Sensor API**
  - `VIEWSONIC_API_KEY`
  - `VIEWSONIC_STORE_MAPPING`

- [ ] **Sales API**
  - `SALES_API_TOKEN`
  - `SALES_API_URL`

- [ ] **Telegram Bot** (Critical - must match existing bot)
  - `TELEGRAM_BOT_TOKEN`
  - `TELEGRAM_WEBHOOK_URL`

### 2. Database Setup
Ensure your staging Supabase instance has:
- Retail module tables
- RLS policies configured
- Test user accounts with proper roles

### 3. External Services
Verify connections to:
- ViewSonic API endpoints
- Sales system API
- Telegram Bot API

## Deployment Process

### Step 1: Run Pre-Deployment Script
```bash
./scripts/deploy-staging.sh
```

This script will:
- Run all tests (94.4% coverage requirement)
- Check TypeScript compilation
- Verify linting
- Build the application
- Deploy to Vercel staging

### Step 2: Configure Vercel Project

1. Link to Vercel project:
```bash
vercel link
```

2. Set up staging alias:
```bash
vercel alias staging-retail.blipee.dev
```

### Step 3: Update Telegram Webhook

After deployment, update the Telegram bot webhook:

```bash
curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://staging-retail.blipee.dev/api/retail/v1/telegram/webhook"}'
```

## Testing Staging Deployment

### 1. Web Interface Tests
- Navigate to: `https://staging-retail.blipee.dev/retail`
- Login with test credentials
- Verify all dashboards load
- Test real-time updates
- Check conversational AI

### 2. API Endpoint Tests
```bash
# Health check
curl https://staging-retail.blipee.dev/api/retail/v1/health

# Get stores (with auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://staging-retail.blipee.dev/api/retail/v1/stores

# Test analytics
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "https://staging-retail.blipee.dev/api/retail/v1/analytics?loja=OML01&start_date=2025-07-12&end_date=2025-07-12"
```

### 3. Telegram Bot Tests
Send these commands to your Telegram bot:
- `/start` - Should show welcome message
- `/sales OML01` - Should return sales data
- `/traffic OML01` - Should show people counting data
- `/help` - Should list available commands

### 4. Data Synchronization Tests
Verify that:
- ViewSonic sensor data updates every 20 minutes
- Sales data refreshes properly
- Both web and Telegram show same data

## Monitoring

### Vercel Dashboard
- Function logs: `vercel logs --follow`
- Performance metrics: Vercel dashboard
- Error tracking: Check configured Sentry

### Health Checks
Set up monitoring for:
```bash
# Uptime monitoring
https://staging-retail.blipee.dev/api/retail/v1/health

# Module status
https://staging-retail.blipee.dev/api/monitoring/health
```

## Troubleshooting

### Common Issues

1. **Telegram bot not responding**
   - Check webhook URL is correct
   - Verify bot token in env vars
   - Check Vercel function logs

2. **ViewSonic data not updating**
   - Verify API key is valid
   - Check sensor mapping configuration
   - Monitor scheduled job logs

3. **Authentication failures**
   - Ensure Supabase URLs are correct
   - Check JWT secret configuration
   - Verify RLS policies

### Debug Commands

```bash
# Check deployment status
vercel ls

# View recent logs
vercel logs --num 100

# Check environment variables
vercel env ls

# Redeploy if needed
vercel --prod --force
```

## Rollback Process

If issues arise:

1. **Quick rollback**:
```bash
vercel rollback
```

2. **Revert Telegram webhook** to previous URL:
```bash
curl -X POST https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-previous-url.com/webhook"}'
```

## Next Steps

After successful staging deployment:

1. **Run full integration tests** (2-3 days)
2. **Gather user feedback** from beta testers
3. **Monitor performance metrics**
4. **Plan production deployment**
5. **Prepare mobile app development**

## Support

For issues or questions:
- Check logs: `vercel logs`
- Review this guide
- Contact DevOps team

---

*Last updated: July 12, 2025*
*Module version: 1.0.0*