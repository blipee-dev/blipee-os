# Blipee V2 - Enterprise-Grade Architecture

**Production-ready, scalable, secure, and compliant**

---

## 🏢 Enterprise Requirements

### Compliance & Security
- ✅ **SOC 2 Type II** compliant
- ✅ **GDPR** compliant (EU data protection)
- ✅ **HIPAA** ready (healthcare data)
- ✅ **ISO 27001** security standards
- ✅ **PCI-DSS** (if handling payments)

### Reliability & Scale
- ✅ **99.9% uptime** SLA
- ✅ **Auto-scaling** (horizontal)
- ✅ **Multi-region** deployment
- ✅ **Zero-downtime** deployments
- ✅ **Disaster recovery** (backup/restore)

### Observability
- ✅ **Real-time monitoring**
- ✅ **Distributed tracing**
- ✅ **Structured logging**
- ✅ **Error tracking**
- ✅ **Performance metrics**

---

## 🔒 Security - Enterprise Level

### 1. Multi-Tenancy Isolation

#### Database Schema (RLS + Policies)

```sql
-- Organization-based isolation
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS on ALL tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_metrics ENABLE ROW LEVEL SECURITY;

-- Organization-scoped policies
CREATE POLICY "Users view own organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Metrics isolation per organization
CREATE POLICY "Users view org metrics"
  ON carbon_metrics FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- Role-based access control
CREATE POLICY "Admins can manage members"
  ON organization_members FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

#### Indexes for Performance

```sql
-- Critical indexes for RLS policies
CREATE INDEX org_members_user_id_idx ON organization_members(user_id);
CREATE INDEX org_members_org_id_idx ON organization_members(organization_id);
CREATE INDEX carbon_metrics_org_id_idx ON carbon_metrics(organization_id);
CREATE INDEX carbon_metrics_user_id_idx ON carbon_metrics(user_id);
CREATE INDEX carbon_metrics_created_at_idx ON carbon_metrics(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX carbon_metrics_org_date_idx ON carbon_metrics(organization_id, created_at DESC);
CREATE INDEX org_members_user_role_idx ON organization_members(user_id, role);
```

### 2. Rate Limiting (Multi-Layer)

#### Middleware Rate Limiting

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

// Tier-based rate limits
const rateLimits = {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 req/min
    analytics: true,
  }),
  pro: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, '1 m'), // 1000 req/min
    analytics: true,
  }),
  enterprise: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10000, '1 m'), // 10k req/min
    analytics: true,
  }),
}

export async function middleware(request: NextRequest) {
  // Get user tier from database or JWT
  const tier = request.cookies.get('tier')?.value || 'free'
  const ratelimit = rateLimits[tier as keyof typeof rateLimits]

  const identifier = request.ip ?? 'anonymous'
  const { success, limit, remaining, reset } = await ratelimit.limit(identifier)

  if (!success) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    })
  }

  // Continue with auth refresh
  return await updateSession(request)
}
```

#### Database-Level Rate Limiting

```sql
-- Function to check rate limit
CREATE OR REPLACE FUNCTION check_rate_limit(
  user_uuid uuid,
  action_type text,
  max_requests integer,
  window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_count integer;
BEGIN
  SELECT COUNT(*) INTO request_count
  FROM rate_limit_log
  WHERE user_id = user_uuid
    AND action = action_type
    AND created_at > NOW() - (window_seconds || ' seconds')::interval;

  IF request_count >= max_requests THEN
    RETURN false;
  END IF;

  INSERT INTO rate_limit_log (user_id, action, created_at)
  VALUES (user_uuid, action_type, NOW());

  RETURN true;
END;
$$;

-- Policy with rate limiting
CREATE POLICY "Rate limited data entry"
  ON carbon_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    check_rate_limit(auth.uid(), 'carbon_entry', 100, 3600) -- 100/hour
    AND organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );
```

### 3. Security Headers (Next.js Config)

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' *.vercel-scripts.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self' data:;
      connect-src 'self' *.supabase.co wss://*.supabase.co;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim(),
  },
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

### 4. Audit Logging (Compliance)

```sql
-- Audit log table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  organization_id uuid REFERENCES organizations(id),
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  metadata jsonb DEFAULT '{}',
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for audit queries
CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_org_id_idx ON audit_logs(organization_id);
CREATE INDEX audit_logs_created_at_idx ON audit_logs(created_at DESC);
CREATE INDEX audit_logs_action_idx ON audit_logs(action);

-- Function to log actions
CREATE OR REPLACE FUNCTION log_audit(
  p_action text,
  p_resource_type text,
  p_resource_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    organization_id,
    action,
    resource_type,
    resource_id,
    metadata,
    ip_address,
    created_at
  ) VALUES (
    auth.uid(),
    current_setting('app.current_org_id', true)::uuid,
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata,
    inet_client_addr(),
    NOW()
  );
END;
$$;

-- Trigger to auto-log sensitive operations
CREATE OR REPLACE FUNCTION auto_log_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM log_audit(
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );
  RETURN NEW;
END;
$$;

-- Apply to sensitive tables
CREATE TRIGGER audit_carbon_metrics
  AFTER INSERT OR UPDATE OR DELETE ON carbon_metrics
  FOR EACH ROW EXECUTE FUNCTION auto_log_changes();
```

#### Server Action with Audit

```typescript
// app/actions/carbon.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { logAudit } from '@/lib/audit'

export async function createCarbonEntry(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const value = formData.get('value')
  const orgId = formData.get('organization_id')

  try {
    const { data, error } = await supabase
      .from('carbon_metrics')
      .insert({
        user_id: user.id,
        organization_id: orgId,
        value,
      })
      .select()
      .single()

    if (error) throw error

    // Audit log
    await logAudit({
      userId: user.id,
      organizationId: orgId,
      action: 'carbon_entry.created',
      resourceType: 'carbon_metrics',
      resourceId: data.id,
      metadata: { value },
    })

    revalidatePath('/dashboard/carbon')
    return { success: true, data }
  } catch (error) {
    // Error tracking
    console.error('Failed to create carbon entry:', error)
    throw error
  }
}
```

---

## 📊 Observability - Production Monitoring

### 1. Structured Logging (Pino)

```typescript
// lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(process.env.NODE_ENV === 'production' && {
    // Production: JSON structured logs
    serializers: pino.stdSerializers,
  }),
  ...(process.env.NODE_ENV !== 'production' && {
    // Development: pretty logs
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
      },
    },
  }),
})

// Usage
logger.info({ userId: user.id, action: 'login' }, 'User logged in')
logger.error({ error, userId }, 'Failed to create entry')
```

### 2. Error Tracking (Sentry)

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || 'development',
  tracesSampleRate: 1.0,

  // Capture 100% of errors in production
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request?.headers) {
      delete event.request.headers['Authorization']
      delete event.request.headers['Cookie']
    }
    return event
  },

  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ['localhost', /^https:\/\/.*\.vercel\.app/],
    }),
  ],
})

// Global error handler
export function captureException(error: Error, context?: Record<string, any>) {
  console.error('Error captured:', error, context)

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value)
      })
    }
    Sentry.captureException(error)
  })
}
```

### 3. Performance Monitoring (Custom + Vercel Analytics)

```typescript
// lib/metrics.ts
import { analytics } from '@vercel/analytics'

export class PerformanceMonitor {
  private static measurements = new Map<string, number>()

  static start(label: string) {
    this.measurements.set(label, Date.now())
  }

  static end(label: string, metadata?: Record<string, any>) {
    const startTime = this.measurements.get(label)
    if (!startTime) return

    const duration = Date.now() - startTime
    this.measurements.delete(label)

    // Log to console in dev
    if (process.env.NODE_ENV !== 'production') {
      console.log(`⏱️ ${label}: ${duration}ms`, metadata)
    }

    // Send to Vercel Analytics
    analytics.track(label, {
      duration,
      ...metadata,
    })

    // Alert if slow
    if (duration > 1000) {
      logger.warn({ label, duration, metadata }, 'Slow operation detected')
    }
  }
}

// Usage in Server Component
export default async function DashboardPage() {
  PerformanceMonitor.start('dashboard.fetch')

  const data = await getDashboardData(userId)

  PerformanceMonitor.end('dashboard.fetch', {
    userId,
    dataPoints: data.length,
  })

  return <Dashboard data={data} />
}
```

### 4. Health Checks

```typescript
// app/api/health/route.ts
import { createClient } from '@/utils/supabase/server'

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {},
  }

  try {
    // Database check
    const supabase = await createClient()
    const { error: dbError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1)

    checks.checks.database = dbError ? 'unhealthy' : 'healthy'

    // Redis check (if using)
    if (process.env.UPSTASH_REDIS_REST_URL) {
      try {
        const redis = Redis.fromEnv()
        await redis.ping()
        checks.checks.redis = 'healthy'
      } catch {
        checks.checks.redis = 'unhealthy'
      }
    }

    // Overall status
    const allHealthy = Object.values(checks.checks).every(s => s === 'healthy')
    checks.status = allHealthy ? 'healthy' : 'degraded'

    return Response.json(checks, {
      status: allHealthy ? 200 : 503,
    })
  } catch (error) {
    return Response.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error.message,
      },
      { status: 503 }
    )
  }
}
```

---

## ⚡ Performance - Enterprise Scale

### 1. Caching Strategy (Multi-Layer)

```typescript
// lib/cache/redis.ts
import { Redis } from '@upstash/redis'
import { cache } from 'react'

const redis = Redis.fromEnv()

export class CacheManager {
  // L1: React cache (request-level deduplication)
  // L2: Redis (shared across requests)
  // L3: Database (with RLS)

  static async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get<T>(key)
      return cached
    } catch (error) {
      logger.error({ error, key }, 'Cache get failed')
      return null
    }
  }

  static async set(key: string, value: any, ttl: number = 3600) {
    try {
      await redis.setex(key, ttl, value)
    } catch (error) {
      logger.error({ error, key }, 'Cache set failed')
    }
  }

  static async invalidate(pattern: string) {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      logger.error({ error, pattern }, 'Cache invalidation failed')
    }
  }
}

// Usage with React cache()
export const getCachedDashboardData = cache(async (
  userId: string,
  orgId: string
) => {
  const cacheKey = `dashboard:${orgId}:${userId}`

  // Try L2 cache
  const cached = await CacheManager.get(cacheKey)
  if (cached) return cached

  // Fetch from DB (L3)
  const supabase = await createClient()
  const { data } = await supabase
    .from('carbon_metrics')
    .select('*')
    .eq('organization_id', orgId)
    .eq('user_id', userId)

  // Set L2 cache
  await CacheManager.set(cacheKey, data, 300) // 5 min

  return data
})
```

### 2. Database Connection Pooling

```typescript
// lib/db/pool.ts
import { createClient } from '@supabase/supabase-js'

// Supabase Pooler connection for serverless
const supabasePooler = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        'x-connection-string': process.env.SUPABASE_DB_POOLER_URL!,
      },
    },
  }
)

// Use for high-throughput operations
export async function bulkInsert(data: any[]) {
  const { error } = await supabasePooler
    .from('carbon_metrics')
    .insert(data)

  if (error) throw error
}
```

### 3. Background Jobs (Inngest)

```typescript
// lib/jobs/inngest.ts
import { Inngest } from 'inngest'

export const inngest = new Inngest({ name: 'Blipee' })

// Daily aggregation job
export const dailyAggregation = inngest.createFunction(
  { name: 'Daily Metrics Aggregation' },
  { cron: '0 0 * * *' }, // Every day at midnight
  async ({ event, step }) => {
    // Step 1: Get all organizations
    const orgs = await step.run('fetch-organizations', async () => {
      const supabase = await createClient()
      const { data } = await supabase.from('organizations').select('id')
      return data
    })

    // Step 2: Aggregate metrics for each org (parallel)
    await step.run('aggregate-metrics', async () => {
      await Promise.all(
        orgs.map(org => aggregateOrgMetrics(org.id))
      )
    })

    // Step 3: Send reports
    await step.run('send-reports', async () => {
      await sendDailyReports(orgs)
    })
  }
)

// Event-driven job
export const processLargeUpload = inngest.createFunction(
  { name: 'Process Large File Upload' },
  { event: 'file/uploaded' },
  async ({ event, step }) => {
    const { fileId, userId, organizationId } = event.data

    // Step 1: Download file
    const file = await step.run('download', async () => {
      return await downloadFile(fileId)
    })

    // Step 2: Parse CSV
    const rows = await step.run('parse', async () => {
      return await parseCSV(file)
    })

    // Step 3: Bulk insert (chunked)
    await step.run('insert', async () => {
      const chunkSize = 1000
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize)
        await bulkInsert(chunk)
      }
    })
  }
)
```

---

## 🚀 Deployment - Zero Downtime

### 1. Feature Flags (Vercel Flags)

```typescript
// lib/flags.ts
import { unstable_flag as flag } from '@vercel/flags/next'

export const showNewDashboard = flag({
  key: 'new-dashboard',
  decide: async () => {
    // Roll out to 10% of users
    return Math.random() < 0.1
  },
})

export const enableAIChat = flag({
  key: 'ai-chat',
  decide: async ({ user }) => {
    // Only for enterprise tier
    return user?.tier === 'enterprise'
  },
})

// Usage in component
export default async function DashboardPage() {
  const newDashboard = await showNewDashboard()

  if (newDashboard) {
    return <NewDashboard />
  }

  return <LegacyDashboard />
}
```

### 2. Database Migrations (Safe)

```sql
-- migrations/004_add_column_safe.sql

-- Step 1: Add column as nullable
ALTER TABLE carbon_metrics
ADD COLUMN IF NOT EXISTS category text;

-- Step 2: Backfill data (in chunks)
DO $$
DECLARE
  batch_size INTEGER := 1000;
  offset_val INTEGER := 0;
  rows_updated INTEGER;
BEGIN
  LOOP
    WITH batch AS (
      SELECT id FROM carbon_metrics
      WHERE category IS NULL
      LIMIT batch_size
      OFFSET offset_val
    )
    UPDATE carbon_metrics
    SET category = 'scope1' -- default value
    WHERE id IN (SELECT id FROM batch);

    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    EXIT WHEN rows_updated = 0;

    offset_val := offset_val + batch_size;
    PERFORM pg_sleep(0.1); -- Avoid overwhelming DB
  END LOOP;
END $$;

-- Step 3: Add NOT NULL constraint
ALTER TABLE carbon_metrics
ALTER COLUMN category SET NOT NULL;

-- Step 4: Add index
CREATE INDEX CONCURRENTLY IF NOT EXISTS
  carbon_metrics_category_idx ON carbon_metrics(category);
```

### 3. Rollback Strategy

```typescript
// lib/deployment/rollback.ts

export async function checkDeploymentHealth() {
  const checks = {
    errorRate: await getErrorRate(),
    latency: await getAverageLatency(),
    activeUsers: await getActiveUsers(),
  }

  // Trigger rollback if any threshold exceeded
  if (checks.errorRate > 0.05) { // 5% error rate
    await triggerRollback('High error rate detected')
  }

  if (checks.latency > 2000) { // 2s latency
    await triggerRollback('High latency detected')
  }

  return checks
}

async function triggerRollback(reason: string) {
  logger.error({ reason }, 'Triggering automatic rollback')

  // Call Vercel API to rollback
  await fetch(`https://api.vercel.com/v6/deployments/${deploymentId}/rollback`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
    },
  })

  // Alert team
  await sendAlert({
    type: 'ROLLBACK',
    reason,
    timestamp: new Date().toISOString(),
  })
}
```

---

## 📋 Checklist Enterprise-Ready

### Security ✅
- [ ] Multi-tenancy com RLS
- [ ] RBAC (Role-Based Access Control)
- [ ] Rate limiting (multi-tier)
- [ ] Security headers (CSP, HSTS, etc)
- [ ] Audit logging (todas operações sensitivas)
- [ ] Encryption at rest (Supabase nativo)
- [ ] MFA enforcement para admins
- [ ] IP whitelisting (enterprise tier)
- [ ] CORS policies configuradas

### Observability ✅
- [ ] Structured logging (Pino)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Health checks (/api/health)
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Custom metrics (dashboards)
- [ ] Alert routing (PagerDuty/Slack)

### Performance ✅
- [ ] Multi-layer caching (Redis + React cache)
- [ ] Database indexes otimizados
- [ ] Connection pooling (Supabase Pooler)
- [ ] CDN para assets estáticos
- [ ] Image optimization (next/image)
- [ ] Code splitting automático
- [ ] Edge Functions onde aplicável

### Reliability ✅
- [ ] 99.9% uptime SLA
- [ ] Health checks automatizados
- [ ] Database backups (daily)
- [ ] Point-in-time recovery
- [ ] Multi-region replication
- [ ] Zero-downtime deployments
- [ ] Automatic rollback
- [ ] Circuit breakers

### Compliance ✅
- [ ] GDPR compliance (data export/delete)
- [ ] SOC 2 audit trail
- [ ] Data retention policies
- [ ] Privacy policy enforcement
- [ ] Cookie consent
- [ ] Terms of service acceptance
- [ ] Legal document versioning

### DevOps ✅
- [ ] CI/CD pipelines (GitHub Actions)
- [ ] Automated testing (unit + integration + e2e)
- [ ] Preview deployments
- [ ] Feature flags
- [ ] Database migrations (safe + rollback)
- [ ] Infrastructure as Code
- [ ] Secrets management (Vercel Env)

---

## 🎯 Stack Completo Enterprise

```
┌─────────────────────────────────────┐
│         User / Client               │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│     Vercel Edge Network (CDN)       │
│  - DDoS protection                  │
│  - Rate limiting (Upstash)          │
│  - Security headers                 │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│    Next.js 14 App Router            │
│  - Server Components (default)      │
│  - Server Actions (mutations)       │
│  - Middleware (auth refresh)        │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        ↓             ↓
┌──────────────┐ ┌──────────────┐
│ Redis Cache  │ │  Supabase    │
│ (Upstash)    │ │  - Postgres  │
│ - L2 cache   │ │  - Auth      │
│ - Sessions   │ │  - Storage   │
│ - Rate limit │ │  - RLS       │
└──────────────┘ └──────┬───────┘
                        │
                        ↓
              ┌─────────────────────┐
              │  Background Jobs    │
              │  (Inngest)          │
              │  - Aggregations     │
              │  - Reports          │
              │  - Bulk operations  │
              └─────────────────────┘

        Monitoring & Observability
┌─────────────────────────────────────┐
│ Sentry (errors) + Vercel Analytics  │
│ + Custom metrics + Health checks    │
└─────────────────────────────────────┘
```

---

## 💰 Cost Optimization

### 1. Database Query Optimization

```typescript
// ❌ BEFORE: N+1 queries
for (const org of organizations) {
  const metrics = await getMetrics(org.id) // N queries
}

// ✅ AFTER: Single query with join
const data = await supabase
  .from('organizations')
  .select(`
    *,
    metrics:carbon_metrics(*)
  `)
```

### 2. Caching ROI

```
Without cache:
- 1M requests/month × $0.0001/request = $100
- Database queries: 1M × $0.0002 = $200
Total: $300/month

With Redis cache (90% hit rate):
- Cache hits: 900k (free from cache)
- Cache misses: 100k × $0.0001 = $10
- Redis cost: $30/month
- DB queries: 100k × $0.0002 = $20
Total: $60/month

Savings: $240/month (80% reduction)
```

### 3. Edge Function Usage

```typescript
// Use Edge runtime para operações simples
export const runtime = 'edge'

// Reduce cold starts
// Reduce compute costs
// Closer to users (lower latency)
```

---

Pronto para começar a implementação enterprise-grade? 🚀
