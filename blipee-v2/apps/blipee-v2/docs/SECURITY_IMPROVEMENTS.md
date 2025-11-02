# Security & Quality Improvements Implementation Guide

## ✅ Completed Improvements

### 1. **Dashboard Authentication Protection** ✅
**Priority: HIGH**

**What was done:**
- Removed `/dashboard` from public routes in `middleware.ts`
- All dashboard routes now require authentication
- No more "demo mode" bypass

**File Changed:**
- `src/middleware.ts` - Removed line 53 (`'/dashboard'` from publicPaths)

**Impact:**
- ✅ Improved security - no unauthorized dashboard access
- ✅ Prevents data exposure
- ✅ Enforces proper auth flow

---

### 2. **Server-Side Toast Notification System** ✅
**Priority: HIGH**

**What was done:**
- Created secure toast notification system using HTTP-only cookies
- Replaced URL-based error messages (prevents information leakage)
- Prevents sensitive error details in logs/analytics
- Better UX with visual notifications

**Files Created:**
- `src/lib/toast/index.ts` - Server-side toast utilities
- `src/components/shared/ToastNotification/index.tsx` - Client component
- `src/components/shared/ToastNotification/ToastNotification.module.css` - Styles

**Files Updated:**
- `src/app/actions/v2/auth.ts` - Updated `signIn` action to use toasts

**Usage Example:**
```typescript
// In Server Actions
import { toast } from '@/lib/toast'

export async function myAction() {
  try {
    // ... your logic
    await toast.success('Operation completed successfully!')
    redirect('/success-page')
  } catch (error) {
    await toast.error('Something went wrong')
    redirect('/error-page')
  }
}
```

**In Layout/Page:**
```tsx
import { getToast } from '@/lib/toast'
import { ToastNotification } from '@/components/shared/ToastNotification'

export default async function Layout({ children }) {
  const toast = await getToast()
  
  return (
    <>
      <ToastNotification toast={toast} />
      {children}
    </>
  )
}
```

**Benefits:**
- ✅ No sensitive data in URLs
- ✅ HTTP-only cookies prevent XSS
- ✅ Auto-expiring (60 second max)
- ✅ Better i18n support
- ✅ Professional UX

---

### 3. **API Routes Cleanup** ✅
**Priority: MEDIUM**

**Status:**
- ✅ Dashboard API routes already removed
- ✅ Only public API routes remain:
  - `/api/consent` - Cookie consent
  - `/api/contact` - Contact form
  - `/api/newsletter` - Newsletter subscription
  - `/api/support` - Support requests

**Next Step:** These public routes should have:
- Rate limiting (see section below)
- CSRF protection
- Input sanitization

---

## 🚧 Recommended Next Steps

### 4. **Rate Limiting** 
**Priority: HIGH**

**Recommended Solution: Upstash Redis**

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Rate limit for auth actions
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
  analytics: true,
})

// Rate limit for public API routes
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
})

// Usage in Server Actions
export async function signIn(formData: FormData) {
  const ip = headers().get('x-forwarded-for') || 'anonymous'
  const { success } = await authRateLimit.limit(ip)
  
  if (!success) {
    await toast.error('Too many login attempts. Please try again later.')
    redirect('/signin')
  }
  
  // ... rest of logic
}
```

**Setup:**
1. Install: `npm install @upstash/ratelimit @upstash/redis`
2. Create Upstash Redis database: https://upstash.com
3. Add to `.env.local`:
   ```
   UPSTASH_REDIS_REST_URL=your_url
   UPSTASH_REDIS_REST_TOKEN=your_token
   ```

---

### 5. **Error Tracking (Sentry)**
**Priority: HIGH**

**Setup Sentry:**

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Configuration:**
```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Filter sensitive data
  beforeSend(event) {
    // Don't send passwords, tokens, etc.
    if (event.request) {
      delete event.request.cookies
      delete event.request.headers?.authorization
    }
    return event
  },
})
```

**Benefits:**
- ✅ Real-time error alerts
- ✅ Stack traces
- ✅ User context
- ✅ Performance monitoring
- ✅ Release tracking

---

### 6. **Testing Infrastructure**
**Priority: HIGH**

**Unit Tests (Vitest):**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    coverage: {
      reporter: ['text', 'json', 'html'],
      threshold: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**E2E Tests (Playwright):**
```bash
npm init playwright@latest
```

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('user can sign in', async ({ page }) => {
  await page.goto('/signin')
  
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/dashboard')
  await expect(page.locator('text=Welcome back!')).toBeVisible()
})
```

**Test Coverage Goals:**
- ✅ 70%+ code coverage
- ✅ All critical paths tested
- ✅ Auth flows covered
- ✅ Dashboard components tested

---

### 7. **Input Sanitization**
**Priority: MEDIUM**

```typescript
// lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify'

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  })
}

export function sanitizeInput(input: string): string {
  // Remove potential SQL injection attempts
  return input.replace(/['"\\;]/g, '')
}
```

---

### 8. **Structured Logging**
**Priority: MEDIUM**

```typescript
// lib/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: ['password', 'token', 'authorization'],
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      // Don't log cookies or auth headers
    }),
  },
})

// Usage
logger.info({ userId: user.id }, 'User logged in')
logger.error({ error: err }, 'Database connection failed')
```

---

### 9. **Component Organization**
**Priority: LOW**

**Proposed Structure:**
```
components/
├── dashboard/
│   ├── carbon/
│   │   ├── CarbonChart.tsx
│   │   ├── CarbonMetrics.tsx
│   │   └── CarbonTargets.tsx
│   ├── energy/
│   │   ├── EnergyChart.tsx
│   │   ├── EnergyMetrics.tsx
│   │   └── ConsumptionTable.tsx
│   └── water/
│       ├── WaterChart.tsx
│       └── WaterMetrics.tsx
├── auth/
│   ├── SignInForm.tsx
│   ├── SignUpForm.tsx
│   └── PasswordReset.tsx
└── shared/
    ├── ui/
    │   ├── Button.tsx
    │   ├── Card.tsx
    │   └── Input.tsx
    └── ToastNotification/
```

---

### 10. **CSRF Protection for Public APIs**
**Priority: MEDIUM**

```typescript
// lib/csrf.ts
import { cookies } from 'next/headers'
import crypto from 'crypto'

export async function generateCSRFToken(): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const cookieStore = await cookies()
  
  cookieStore.set('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 3600, // 1 hour
  })
  
  return token
}

export async function validateCSRFToken(token: string): Promise<boolean> {
  const cookieStore = await cookies()
  const storedToken = cookieStore.get('csrf_token')
  
  return storedToken?.value === token
}
```

---

## 📊 Implementation Checklist

### Completed ✅
- [x] Remove dashboard auth bypass
- [x] Create toast notification system
- [x] Update auth Server Actions to use toasts
- [x] Verify API routes are minimal

### High Priority 🔴
- [ ] Implement rate limiting (Upstash)
- [ ] Setup error tracking (Sentry)
- [ ] Add testing infrastructure (Vitest + Playwright)
- [ ] Complete remaining Server Actions toast migration

### Medium Priority 🟡
- [ ] Add input sanitization
- [ ] Implement structured logging
- [ ] Add CSRF protection to public APIs
- [ ] Add performance monitoring

### Low Priority 🟢
- [ ] Reorganize component structure
- [ ] Add Storybook
- [ ] Add API documentation (if keeping public APIs)
- [ ] Consider tRPC for type-safe calls

---

## 🔒 Security Best Practices

### Current State ✅
- ✅ Native JWT auth (Supabase)
- ✅ RLS policies enforce data isolation
- ✅ Security headers configured
- ✅ Environment variables properly separated
- ✅ Service role key separate from anon key
- ✅ No sensitive data in URLs (toast system)
- ✅ Dashboard requires authentication

### Needs Attention ⚠️
- ⚠️ Rate limiting not implemented
- ⚠️ Error tracking not configured
- ⚠️ No automated testing
- ⚠️ Input sanitization missing
- ⚠️ CSRF protection missing for public APIs

---

## 📈 Performance Optimizations

### Already Implemented ✅
- ✅ Server Components reduce bundle size
- ✅ Proper use of `dynamic = 'force-dynamic'`
- ✅ Image optimization configured
- ✅ Vercel Analytics included

### Recommended Additions
```typescript
// Add React cache for deduplication
import { cache } from 'react'

export const getUserProfile = cache(async (userId: string) => {
  // This will deduplicate across multiple component calls
  const supabase = await createClient()
  return supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
})

// Add Next.js unstable_cache for dashboard metrics
import { unstable_cache } from 'next/cache'

export const getCarbonMetrics = unstable_cache(
  async (orgId: string) => {
    const supabase = await createClient()
    return supabase
      .from('carbon_metrics')
      .select('*')
      .eq('organization_id', orgId)
  },
  ['carbon-metrics'],
  {
    revalidate: 300, // 5 minutes
    tags: ['carbon'],
  }
)
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All environment variables set in Vercel
- [ ] Rate limiting configured
- [ ] Error tracking active
- [ ] Tests passing (>70% coverage)
- [ ] Security headers verified
- [ ] CSRF protection enabled
- [ ] Input sanitization active
- [ ] Logging configured
- [ ] Monitoring dashboards setup
- [ ] Backup strategy defined
- [ ] Incident response plan ready

---

## 📚 Additional Resources

- [Next.js Security Best Practices](https://nextjs.org/docs/going-to-production#security)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Upstash Rate Limiting](https://github.com/upstash/ratelimit)
- [Sentry Next.js Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Playwright Testing](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
