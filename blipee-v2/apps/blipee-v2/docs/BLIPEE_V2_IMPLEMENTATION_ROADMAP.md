# Blipee V2 - Implementation Roadmap

**Status**: Ready to start FASE 0
**Timeline**: 12 weeks total
**Current Phase**: Pre-implementation checklist

---

## 🎯 Quick Reference

| Phase | Duration | Focus | Status |
|-------|----------|-------|--------|
| FASE 0 | Week 1-2 | Setup & Foundation | 🔄 Ready |
| FASE 1 | Week 3-4 | Marketing Pages | ⏸️ Pending |
| FASE 2 | Week 5-6 | Auth Pages | ⏸️ Pending |
| FASE 3 | Week 7-8 | Dashboard Overview | ⏸️ Pending |
| FASE 4 | Week 9-10 | Detailed Dashboards | ⏸️ Pending |
| FASE 5 | Week 11 | Settings & Admin | ⏸️ Pending |
| FASE 6 | Week 12 | Full Migration | ⏸️ Pending |

---

## 📋 FASE 0: Setup & Foundation (Week 1-2)

### Goal
Setup V2 project structure with Supabase SSR auth and deploy to staging

### Pre-requisites
- ✅ V1 in production at blipee.com
- ✅ Supabase project (shared with V1)
- ✅ Vercel account
- ✅ Documentation complete

### Tasks

#### 1. Project Initialization
```bash
# Create V2 project directory
mkdir blipee-v2
cd blipee-v2

# Initialize Next.js 14
npx create-next-app@latest . --typescript --tailwind --app --import-alias "@/*"

# Install core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @upstash/redis @upstash/ratelimit
npm install zod
npm install pino pino-pretty
npm install -D @types/node
```

#### 2. Environment Setup
Create `.env.local`:
```bash
# Supabase (same as V1)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://v2.blipee.com
NODE_ENV=development
```

#### 3. Create Supabase Clients
Files to create:
- [ ] `src/utils/supabase/client.ts` (Browser client)
- [ ] `src/utils/supabase/server.ts` (Server Component client)
- [ ] `src/utils/supabase/middleware.ts` (Middleware client)

Copy implementations from `BLIPEE_V2_BEST_PRACTICES.md` sections 2.1-2.3

#### 4. Setup Middleware
- [ ] `src/middleware.ts` (Token refresh + auth checks)

Copy implementation from `BLIPEE_V2_BEST_PRACTICES.md` section 2.4

#### 5. Project Structure
Create folder structure:
```bash
mkdir -p src/app/{(marketing),(auth),(dashboard)}/
mkdir -p src/app/actions
mkdir -p src/components/{ui,marketing,dashboard}
mkdir -p src/lib/{api,cache,utils}
mkdir -p src/types
```

#### 6. Base Configuration

##### `next.config.js`
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

##### `tsconfig.json` (verify paths)
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 7. Test Auth Flow
Create minimal auth pages to test:
- [ ] `src/app/(auth)/signin/page.tsx`
- [ ] `src/app/(auth)/signup/page.tsx`
- [ ] `src/app/(dashboard)/page.tsx` (protected)

#### 8. Deploy to Staging
```bash
# Deploy to Vercel
vercel --prod

# Configure domains
# - Production: v2.blipee.com
# - Preview: v2-preview.blipee.com
```

#### 9. Setup Vercel Edge Config (Feature Flags)
```bash
# Create Edge Config
vercel edge-config create blipee-feature-flags

# Add initial flags
vercel edge-config set v2_enabled false
vercel edge-config set v2_enabled_routes []
```

#### 10. Verification Checklist
- [ ] V2 deploys successfully to v2.blipee.com
- [ ] Sign up creates user in Supabase (same as V1)
- [ ] Sign in works and sets auth cookies
- [ ] Protected routes redirect to signin
- [ ] Middleware refreshes tokens correctly
- [ ] Shared database access (can see V1 data)

### Success Criteria
✅ V2 project structure complete
✅ Supabase SSR auth working
✅ Deployed to staging (v2.blipee.com)
✅ Feature flags configured
✅ Can authenticate users (shared with V1)

---

## 📋 FASE 1: Marketing Pages (Week 3-4)

### Goal
Migrate static marketing pages from HTML to Next.js with Server Components

### HTML Pages to Migrate
From `docs/`:
- [ ] `index.html` → `app/(marketing)/page.tsx`
- [ ] `about.html` → `app/(marketing)/about/page.tsx`
- [ ] `careers.html` → `app/(marketing)/careers/page.tsx`
- [ ] `company.html` → `app/(marketing)/company/page.tsx`
- [ ] `contact.html` → `app/(marketing)/contact/page.tsx`
- [ ] `privacy.html` → `app/(marketing)/privacy/page.tsx`
- [ ] `terms.html` → `app/(marketing)/terms/page.tsx`
- [ ] `status.html` → `app/(marketing)/status/page.tsx`

### Tasks

#### 1. Create Marketing Layout
- [ ] `src/app/(marketing)/layout.tsx`
  - Header with navigation
  - Footer
  - No auth required

#### 2. Extract Reusable Components
From `docs/components/`:
- [ ] `src/components/marketing/Hero.tsx`
- [ ] `src/components/marketing/FeatureGrid.tsx`
- [ ] `src/components/marketing/Testimonials.tsx`
- [ ] `src/components/marketing/Pricing.tsx`
- [ ] `src/components/marketing/CTA.tsx`
- [ ] `src/components/marketing/Header.tsx`
- [ ] `src/components/marketing/Footer.tsx`

#### 3. Migrate Static Pages
Convert HTML to React Server Components:
- Use semantic HTML
- Add TypeScript types
- Optimize images (next/image)
- Add metadata for SEO

#### 4. Performance Optimization
- [ ] Setup static generation (`export const revalidate = 3600`)
- [ ] Optimize images
- [ ] Add loading states
- [ ] Measure Core Web Vitals

#### 5. Deploy & Test
```bash
# Deploy to staging
vercel --prod

# Test checklist
- [ ] All pages load correctly
- [ ] Images optimized
- [ ] SEO metadata present
- [ ] Forms work (contact)
- [ ] Links work
- [ ] Mobile responsive
```

#### 6. Gradual Rollout (10% Traffic)
Update Edge Config in V1:
```typescript
// V1 middleware.ts
const v2Routes = ['/about', '/careers', '/company', '/contact']
const shouldUseV2 = v2Routes.includes(path) && Math.random() < 0.1 // 10%

if (shouldUseV2) {
  url.hostname = 'v2.blipee.com'
  return NextResponse.rewrite(url)
}
```

#### 7. Monitor for 1 Week
- [ ] Error rate < 0.1%
- [ ] Latency < 2s (p95)
- [ ] No user complaints
- [ ] Core Web Vitals green

### Success Criteria
✅ All marketing pages migrated
✅ Performance improved (LCP < 2.5s)
✅ 10% traffic to V2 with no issues
✅ Ready to increase rollout

---

## 📋 FASE 2: Auth Pages (Week 5-6)

### Goal
Migrate authentication pages with Supabase SSR

### HTML Pages to Migrate
- [ ] `signin.html` → `app/(auth)/signin/page.tsx`
- [ ] `signup.html` → `app/(auth)/signup/page.tsx`
- [ ] `forgot-password.html` → `app/(auth)/forgot-password/page.tsx`
- [ ] `reset-password.html` → `app/(auth)/reset-password/page.tsx`

### Tasks

#### 1. Create Auth Layout
- [ ] `src/app/(auth)/layout.tsx`
  - Centered form layout
  - No header/footer
  - Redirect if already authenticated

#### 2. Create Server Actions
- [ ] `src/app/actions/auth.ts`
  - `signIn(email, password)`
  - `signUp(email, password, metadata)`
  - `signOut()`
  - `resetPassword(email)`
  - `updatePassword(newPassword)`

#### 3. Migrate Auth Pages
Convert HTML forms to React with Server Actions:

**Sign In Example**:
```typescript
// app/(auth)/signin/page.tsx
import { signIn } from '@/app/actions/auth'

export default function SignInPage() {
  return (
    <form action={signIn}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Sign In</button>
    </form>
  )
}
```

#### 4. Add OAuth Providers
- [ ] Google OAuth
- [ ] GitHub OAuth
- [ ] Configure in Supabase dashboard

#### 5. Error Handling
- [ ] Form validation (Zod)
- [ ] Error messages
- [ ] Loading states
- [ ] Success redirects

#### 6. Deploy & Test
```bash
# Test checklist
- [ ] Sign up creates user
- [ ] Sign in authenticates
- [ ] Sign out clears session
- [ ] Password reset sends email
- [ ] OAuth providers work
- [ ] Form validation works
- [ ] Error handling works
```

#### 7. Gradual Rollout (20% Traffic)
Update Edge Config:
```typescript
const v2Routes = [
  '/about', '/careers', '/company', '/contact',
  '/signin', '/signup', '/forgot-password', '/reset-password'
]
const shouldUseV2 = v2Routes.includes(path) && Math.random() < 0.2 // 20%
```

### Success Criteria
✅ All auth pages migrated
✅ Supabase SSR auth working
✅ 20% traffic to V2
✅ No auth issues

---

## 📋 FASE 3: Dashboard Overview (Week 7-8)

### Goal
Migrate main dashboard with Server Components and caching

### Pages to Migrate
- [ ] `app/(dashboard)/page.tsx` (overview)
- [ ] `app/(dashboard)/layout.tsx` (sidebar, header)

### Tasks

#### 1. Create Dashboard Layout
- [ ] Sidebar navigation
- [ ] Top header with user menu
- [ ] Protected route (auth check)

#### 2. Data Fetching Layer
- [ ] `src/lib/api/dashboard.ts`
  - `getKPISummary(userId)` with cache
  - `getRecentActivity(userId)` with cache
  - Use React `cache()` for deduplication

#### 3. Server Components
- [ ] `src/components/dashboard/KPICard.tsx`
- [ ] `src/components/dashboard/TrendChart.tsx`
- [ ] `src/components/dashboard/ActivityFeed.tsx`

#### 4. Caching Strategy
```typescript
// lib/cache/dashboard.ts
import { cache } from 'react'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

export const getKPISummary = cache(async (userId: string) => {
  // L1: Redis cache (5 min)
  const cached = await redis.get(`kpi:${userId}`)
  if (cached) return cached

  // L2: Database (with RLS)
  const data = await fetchFromDB(userId)

  // Cache in Redis
  await redis.setex(`kpi:${userId}`, 300, JSON.stringify(data))

  return data
})
```

#### 5. RLS Policies
Verify database policies are set:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Should all show rowsecurity = true
```

#### 6. Deploy & Test
```bash
# Test checklist
- [ ] Dashboard loads with auth
- [ ] KPIs display correctly
- [ ] Charts render
- [ ] Data is user-scoped (RLS)
- [ ] Cache works (fast reload)
- [ ] Logout works
```

#### 7. Gradual Rollout (30% Traffic)
```typescript
const shouldUseV2 = (
  isV2Route &&
  (tier === 'enterprise' || Math.random() < 0.3) // Enterprise + 30% others
)
```

### Success Criteria
✅ Dashboard overview working
✅ Server Components + caching
✅ 30% traffic to V2
✅ Performance improved (< 2s load)

---

## 📋 FASE 4: Detailed Dashboards (Week 9-10)

### Goal
Migrate category-specific dashboards (Carbon, Energy, Water, Waste)

### Pages to Migrate
- [ ] `app/(dashboard)/carbon/page.tsx`
- [ ] `app/(dashboard)/energy/page.tsx`
- [ ] `app/(dashboard)/water/page.tsx`
- [ ] `app/(dashboard)/waste/page.tsx`

### Tasks

#### 1. Unified Data Fetching
Reuse existing calculators:
- [ ] `src/lib/sustainability/unified-calculator.ts`
- [ ] `src/lib/sustainability/unified-forecast.ts`
- [ ] Add caching layer

#### 2. Server Components for Each Category
- [ ] Carbon: Emissions tracking, Scope 1/2/3
- [ ] Energy: Consumption, renewable %
- [ ] Water: Usage, stress areas
- [ ] Waste: Generated, recycled %

#### 3. Server Actions for Data Entry
- [ ] `src/app/actions/metrics.ts`
  - `createMetric(type, value, metadata)`
  - `updateMetric(id, value)`
  - `deleteMetric(id)`
  - All with RLS enforcement

#### 4. Real-time Updates (Optional)
Use Supabase Realtime:
```typescript
// Client Component for real-time
'use client'
export function RealtimeMetrics({ initialData }) {
  const supabase = createClient()
  const [data, setData] = useState(initialData)

  useEffect(() => {
    const channel = supabase
      .channel('metrics-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'metrics',
      }, payload => {
        setData(current => [...current, payload.new])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return <MetricsTable data={data} />
}
```

#### 5. Deploy & Test
```bash
# Test checklist
- [ ] All dashboards load
- [ ] Data fetching works
- [ ] Charts display correctly
- [ ] CRUD operations work
- [ ] Real-time updates work (if enabled)
- [ ] Cache invalidation works
```

#### 6. Gradual Rollout (60% Traffic)
```typescript
const shouldUseV2 = (
  isV2Route &&
  (tier !== 'free' || Math.random() < 0.6) // Pro/Enterprise + 60% free
)
```

### Success Criteria
✅ All dashboards migrated
✅ CRUD operations working
✅ 60% traffic to V2
✅ Cache hit rate > 80%

---

## 📋 FASE 5: Settings & Admin (Week 11)

### Goal
Migrate settings, user management, and admin features

### Pages to Migrate
- [ ] `app/(dashboard)/settings/page.tsx`
- [ ] `app/(dashboard)/settings/profile/page.tsx`
- [ ] `app/(dashboard)/settings/organization/page.tsx`
- [ ] `app/(dashboard)/settings/team/page.tsx`
- [ ] `app/(dashboard)/settings/billing/page.tsx`
- [ ] `app/(dashboard)/settings/integrations/page.tsx`

### Tasks

#### 1. Settings Layout
- [ ] Nested layout with sidebar
- [ ] Tab navigation

#### 2. Server Actions
- [ ] `src/app/actions/settings.ts`
  - `updateProfile(data)`
  - `updateOrganization(data)`
  - `inviteTeamMember(email, role)`
  - `removeTeamMember(userId)`
  - `updateBilling(data)`

#### 3. RBAC Implementation
- [ ] Check user role before mutations
- [ ] RLS policies for organization data

```typescript
// app/actions/settings.ts
'use server'
export async function inviteTeamMember(email: string, role: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is admin/owner
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!['admin', 'owner'].includes(member.role)) {
    return { error: 'Unauthorized' }
  }

  // Invite member...
}
```

#### 4. Deploy & Test
```bash
# Test checklist
- [ ] Profile updates work
- [ ] Organization settings work
- [ ] Team invitations work
- [ ] Role-based access works
- [ ] Billing integration works
```

#### 5. Gradual Rollout (90% Traffic)
```typescript
const shouldUseV2 = (
  isV2Route &&
  Math.random() < 0.9 // 90% all users
)
```

### Success Criteria
✅ Settings pages migrated
✅ RBAC working
✅ 90% traffic to V2
✅ Ready for full migration

---

## 📋 FASE 6: Full Migration (Week 12)

### Goal
Complete migration to V2, deprecate V1

### Tasks

#### 1. Final Testing
- [ ] E2E tests pass
- [ ] Load testing (artillery/k6)
- [ ] Security audit
- [ ] Accessibility audit (WCAG 2.1 AA)

#### 2. Data Migration (if needed)
- [ ] Migrate any V1-specific data
- [ ] Run data validation scripts
- [ ] Backup V1 database

#### 3. DNS & Routing
- [ ] Update V1 middleware to route 100% to V2
- [ ] Monitor for 24 hours
- [ ] Update DNS (blipee.com → V2)

#### 4. Deprecate V1
- [ ] Set V1 to read-only mode
- [ ] Display deprecation notice
- [ ] Archive V1 codebase

#### 5. Post-Migration Monitoring
- [ ] Monitor error rates (< 0.1%)
- [ ] Monitor latency (p95 < 2s)
- [ ] Monitor costs
- [ ] User feedback

### Success Criteria
✅ 100% traffic on V2
✅ V1 deprecated
✅ All metrics green
✅ Zero downtime migration

---

## 📊 Monitoring Dashboard

### Key Metrics to Track

#### Performance
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 600ms

#### Reliability
- **Uptime**: > 99.9%
- **Error rate**: < 0.1%
- **API success rate**: > 99.9%

#### Business
- **Daily Active Users (DAU)**
- **Conversion rate**: Sign up → paid
- **Retention**: Day 1, Day 7, Day 30
- **Churn rate**: < 5%

#### Cost
- **Cost per user**: < $0.03
- **Compute cost**: < $150/month
- **Database cost**: < $60/month

---

## 🚨 Rollback Plan

### Automatic Rollback Triggers
1. **Error rate > 5%** for 5 minutes
2. **Latency p95 > 3s** for 5 minutes
3. **Database connection failures** > 10%

### Manual Rollback Steps
```bash
# 1. Update Edge Config (instant)
vercel edge-config set v2_enabled false

# 2. Update DNS (if needed, ~5 min propagation)
# Point blipee.com back to V1

# 3. Notify team
# Slack alert + incident post-mortem

# 4. Investigate root cause
# Check Sentry, logs, database
```

### Post-Rollback
- [ ] Root cause analysis
- [ ] Fix issue in V2
- [ ] Deploy fix to staging
- [ ] Test thoroughly
- [ ] Retry migration

---

## 📝 Documentation Checklist

### Developer Docs
- [x] BLIPEE_V2_STRUCTURE.md
- [x] BLIPEE_V2_BEST_PRACTICES.md
- [x] BLIPEE_V2_ENTERPRISE.md
- [x] BLIPEE_V2_MIGRATION_STRATEGY.md
- [x] BLIPEE_V2_EXECUTIVE_SUMMARY.md
- [x] BLIPEE_V2_IMPLEMENTATION_ROADMAP.md (this file)
- [ ] API_REFERENCE.md (to create during implementation)
- [ ] DEPLOYMENT_GUIDE.md (to create)
- [ ] TROUBLESHOOTING_GUIDE.md (to create)

### User Docs
- [ ] Getting Started Guide
- [ ] Features Overview
- [ ] API Documentation
- [ ] Changelog
- [ ] Migration Guide (for existing users)

---

## 🎯 Next Immediate Actions

### Right Now
1. **Review this roadmap** with team
2. **Confirm timeline** and resources
3. **Setup development environment**
4. **Start FASE 0** tasks

### This Week
- [ ] Create V2 repository
- [ ] Setup Supabase clients
- [ ] Deploy to staging
- [ ] Configure feature flags

### Next Week
- [ ] Begin marketing page migration
- [ ] Setup monitoring
- [ ] Start gradual rollout

---

## 📞 Support & Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs

### Team Contacts
- **Tech Lead**: [Contact]
- **DevOps**: [Contact]
- **Product**: [Contact]

### Tools
- **Error Tracking**: Sentry
- **Performance**: Vercel Analytics
- **Database**: Supabase Dashboard
- **Caching**: Upstash Console

---

**Ready to build? Let's start FASE 0! 🚀**
