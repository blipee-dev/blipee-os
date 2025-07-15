# 🚀 blipee OS Deployment Guide

## Overview

This guide covers deploying blipee OS to production on Vercel with Supabase as the backend. The deployment process takes approximately 30-60 minutes.

## Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [Supabase Account](https://supabase.com)
- [GitHub Account](https://github.com)
- Domain name (optional but recommended)
- Payment methods set up for production usage

## Step 1: Supabase Setup

### 1.1 Create Supabase Project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Configure:
   - **Name**: `blipee-os-production`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Pro recommended for production

### 1.2 Run Database Migrations

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link to your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Run migrations:
   ```bash
   supabase db push
   ```

### 1.3 Configure Row Level Security

1. Go to Authentication → Policies
2. Verify all tables have RLS enabled
3. Check policy configurations for multi-tenant isolation

### 1.4 Get Connection Details

From Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon/Public key
- `SUPABASE_SERVICE_KEY`: Service role key (keep secret!)

## Step 2: Vercel Deployment

### 2.1 Import Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2.2 Environment Variables

Add all environment variables from `.env.production`:

#### Required Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
OPENAI_API_KEY=sk-your-openai-key
```

#### Recommended Variables
```
ANTHROPIC_API_KEY=sk-ant-your-key
DEEPSEEK_API_KEY=your-deepseek-key
OPENWEATHERMAP_API_KEY=your-weather-key
ELECTRICITY_MAPS_API_KEY=your-carbon-key
```

### 2.3 Deploy

1. Click "Deploy"
2. Wait for build to complete (5-10 minutes)
3. Verify deployment at `your-app.vercel.app`

## Step 3: Custom Domain Setup

### 3.1 Add Domain to Vercel

1. Go to Project Settings → Domains
2. Add your domain (e.g., `app.blipee.com`)
3. Configure DNS:
   ```
   Type: A
   Name: app
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www.app
   Value: cname.vercel-dns.com
   ```

### 3.2 SSL Certificate

- Vercel automatically provisions SSL certificates
- Wait 10-30 minutes for propagation

## Step 4: Production Configuration

### 4.1 API Keys Setup

1. **OpenAI**: Create production key at [platform.openai.com](https://platform.openai.com)
   - Set usage limits
   - Configure allowed models
   - Monitor costs

2. **External APIs**:
   - Weather: [openweathermap.org/api](https://openweathermap.org/api)
   - Carbon: [electricitymaps.com](https://electricitymaps.com)

### 4.2 Security Configuration

1. **API Authentication**:
   ```bash
   # Generate secure API keys
   openssl rand -hex 32
   ```

2. **Update Middleware**:
   - Verify CORS origins include your domain
   - Check rate limits are appropriate
   - Ensure security headers are enabled

### 4.3 Monitoring Setup

1. **Vercel Analytics**:
   - Enable in project settings
   - Add Web Analytics snippet

2. **OpenTelemetry** (Optional):
   ```
   OTEL_EXPORTER_OTLP_ENDPOINT=https://your-collector.com
   OTEL_API_KEY=your-api-key
   ```

3. **Error Tracking** (Optional):
   ```
   SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
   ```

## Step 5: Initial Data Setup

### 5.1 Create First Organization

1. Sign up through the app
2. Complete onboarding flow
3. Verify agent activation

### 5.2 Test Core Features

- [ ] Send message to orchestrator
- [ ] Verify agent responses
- [ ] Test ML predictions
- [ ] Check network features
- [ ] Validate monitoring endpoints

## Step 6: Production Checklist

### Security
- [ ] All environment variables set
- [ ] API keys have appropriate permissions
- [ ] Database RLS policies active
- [ ] Security headers verified
- [ ] Rate limiting functional

### Performance
- [ ] CDN caching enabled
- [ ] Image optimization active
- [ ] API response times < 2s
- [ ] Database indexes created

### Monitoring
- [ ] Health check endpoint responsive
- [ ] Metrics collection working
- [ ] Alerts configured
- [ ] Error tracking enabled

### Backup & Recovery
- [ ] Database backups enabled
- [ ] Backup retention policy set
- [ ] Recovery procedure documented
- [ ] Monitoring backup success

## Step 7: Post-Deployment

### 7.1 DNS Propagation

- Wait 24-48 hours for full propagation
- Test from multiple locations
- Verify SSL certificate active

### 7.2 Performance Testing

```bash
# Load test the API
artillery quick --count 100 --num 10 https://api.blipee.com/v1/health
```

### 7.3 Security Scan

```bash
# Run security headers test
npm run security:headers https://app.blipee.com
```

## Troubleshooting

### Common Issues

1. **"Database connection failed"**
   - Check Supabase service key
   - Verify project is not paused
   - Check connection pooling settings

2. **"Agent not starting"**
   - Verify service key has correct permissions
   - Check agent table migrations
   - Review agent logs in Supabase

3. **"ML predictions timeout"**
   - Increase serverless function timeout
   - Check model initialization
   - Verify memory limits

4. **"Rate limit errors"**
   - Adjust rate limit thresholds
   - Check Redis connection (if using)
   - Verify IP detection logic

### Debug Commands

```bash
# Check health
curl https://app.blipee.com/api/health

# Test API authentication
curl -H "X-API-Key: your-key" https://app.blipee.com/api/v1/agents/status

# Verify metrics
curl https://app.blipee.com/api/metrics
```

## Scaling Considerations

### When to Scale

- API response time > 2s consistently
- Database CPU > 80%
- Concurrent users > 1000
- Agent queue depth > 100

### Scaling Options

1. **Vercel**: Enable auto-scaling
2. **Supabase**: Upgrade to larger instance
3. **Redis**: Add for distributed rate limiting
4. **CDN**: Enable Vercel Edge Network

## Maintenance

### Weekly Tasks
- Review error logs
- Check API costs
- Monitor agent performance
- Update dependencies

### Monthly Tasks
- Security audit
- Performance review
- Cost optimization
- Backup verification

### Quarterly Tasks
- Dependency updates
- Security patches
- Load testing
- Disaster recovery drill

## Support

- **Documentation**: [docs.blipee.com](https://docs.blipee.com)
- **Status Page**: [status.blipee.com](https://status.blipee.com)
- **Support Email**: support@blipee.com
- **Emergency**: +1-XXX-XXX-XXXX

---

*Deployment Guide Version 1.0*
*Last Updated: July 2025*