# Vercel Setup Guide for Blipee OS

## 🚀 Quick Deploy (3 minutes)

### Option 1: Deploy via GitHub Integration (Recommended)

1. **Connect GitHub to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/in with GitHub
   - Click "Add New..." → "Project"

2. **Import Repository**
   - Select your `blipee-os` repository
   - Vercel auto-detects Next.js

3. **Configure Project**
   - **Project Name:** `blipee-os`
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as is)
   - **Build Command:** `npm run build` (auto-detected)

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   OPENAI_API_KEY=your-openai-key
   DEEPSEEK_API_KEY=your-deepseek-key
   ANTHROPIC_API_KEY=your-anthropic-key
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait ~2 minutes
   - Your app is live! 🎉

### Option 2: Deploy via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# In your project directory
vercel

# Follow prompts:
# - Link to existing project? No
# - What's your project name? blipee-os
# - Which directory? ./
# - Override settings? No

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_KEY
vercel env add OPENAI_API_KEY

# Deploy to production
vercel --prod
```

## 🔧 Configuration Details

### Environment Variables

Required variables for each environment:

```bash
# Development (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
OPENAI_API_KEY=sk-xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Preview (Vercel Preview Deployments)
# Same as production but with test keys

# Production (Vercel Production)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx
OPENAI_API_KEY=sk-xxx
NEXT_PUBLIC_APP_URL=https://blipee-os.vercel.app
```

### Domain Setup

1. **Default Domain**
   - Vercel provides: `blipee-os.vercel.app`
   - SSL included automatically

2. **Custom Domain**
   ```bash
   # Add custom domain
   vercel domains add app.blipee.com
   
   # Or via Dashboard:
   # Project Settings → Domains → Add
   ```

3. **DNS Configuration**
   ```
   Type: CNAME
   Name: app
   Value: cname.vercel-dns.com
   ```

### Function Configuration

Our `vercel.json` configures:
- **Streaming API:** 60s timeout for chat endpoint
- **Standard APIs:** 30s timeout
- **Regions:** US East (iad1) for low latency

### Edge Functions (Optional)

For global performance:

```typescript
// app/api/edge/route.ts
export const runtime = 'edge'
export const preferredRegion = 'iad1'

export async function GET() {
  return new Response('Hello from the edge!')
}
```

## 🛡️ Security Setup

### 1. Environment Variable Security

```bash
# Add sensitive variables as encrypted
vercel env add SUPABASE_SERVICE_KEY --sensitive
```

### 2. Preview Protection

```bash
# Password protect preview deployments
vercel env add VERCEL_PREVIEW_PROTECTION=1
```

### 3. Headers Configuration

Our `vercel.json` includes security headers:
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Referrer-Policy

## 📊 Monitoring & Analytics

### 1. Enable Vercel Analytics

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### 2. Speed Insights

```bash
npm install @vercel/speed-insights
```

```typescript
import { SpeedInsights } from '@vercel/speed-insights/next'

// Add to layout
<SpeedInsights />
```

### 3. Custom Monitoring

```typescript
// lib/monitoring.ts
export function trackEvent(name: string, properties?: any) {
  if (typeof window !== 'undefined') {
    // Vercel Analytics
    window.va?.('event', { name, ...properties })
    
    // Custom tracking
    console.log('[Analytics]', name, properties)
  }
}
```

## 🚀 Deployment Workflows

### Automatic Deployments

Every push to GitHub triggers:
- **main branch** → Production
- **other branches** → Preview deployments

### Manual Deployments

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Deploy specific branch
vercel --prod --scope your-team
```

### Rollback

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback

# Rollback to specific deployment
vercel rollback [deployment-url]
```

## 🔍 Debugging

### 1. Function Logs

```bash
# View function logs
vercel logs

# Tail logs in real-time
vercel logs --follow

# Filter by function
vercel logs --filter api/ai/chat
```

### 2. Build Logs

- Go to Vercel Dashboard
- Click on deployment
- View "Build Logs" tab

### 3. Runtime Logs

- Dashboard → Functions tab
- Click on function name
- View real-time logs

## ⚡ Performance Optimization

### 1. Image Optimization

```typescript
import Image from 'next/image'

<Image
  src="/building.jpg"
  alt="Building"
  width={800}
  height={600}
  priority
/>
```

### 2. API Route Caching

```typescript
// app/api/building/context/route.ts
export async function GET(request: Request) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate',
    },
  })
}
```

### 3. Static Generation

```typescript
// For marketing pages
export const revalidate = 3600 // Revalidate every hour
```

## 🎯 Production Checklist

### Pre-deployment
- [ ] Environment variables set
- [ ] Supabase URLs whitelisted
- [ ] API rate limits configured
- [ ] Error tracking setup
- [ ] Analytics enabled

### Post-deployment
- [ ] Test authentication flow
- [ ] Verify API endpoints
- [ ] Check WebSocket connections
- [ ] Monitor error rates
- [ ] Test on mobile devices

### Performance
- [ ] Lighthouse score > 90
- [ ] First paint < 1.5s
- [ ] API response < 200ms
- [ ] Zero console errors

## 🔗 Useful Commands

```bash
# Check deployment status
vercel

# View environment variables
vercel env ls

# Add secret
vercel secrets add my-secret value

# Link to existing project
vercel link

# Pull environment variables locally
vercel env pull
```

## 🚨 Common Issues

### "Module not found" errors
```bash
# Clear cache and rebuild
vercel --force
```

### Environment variables not working
- Ensure prefixed with `NEXT_PUBLIC_` for client-side
- Redeploy after adding variables
- Check variable scopes (preview/production)

### Function timeout
- Increase timeout in `vercel.json`
- Consider edge functions for simple operations
- Implement response streaming

### CORS errors
- Check `vercel.json` headers configuration
- Verify API routes include CORS headers
- Add domain to Supabase allowed list

## 📈 Scaling

### Traffic Handling
- Automatic scaling (no config needed)
- DDoS protection included
- Global CDN for assets

### Cost Optimization
- Monitor function invocations
- Use ISR for semi-static content
- Implement efficient caching

## 🎉 Success!

Your Blipee OS is now deployed on Vercel with:
- ✅ Automatic deployments
- ✅ Preview environments
- ✅ Global CDN
- ✅ SSL certificates
- ✅ Analytics ready
- ✅ Monitoring enabled

Visit your app at: `https://blipee-os.vercel.app`