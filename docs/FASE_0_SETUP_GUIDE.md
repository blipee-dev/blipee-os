# FASE 0: Setup Guide - Blipee V2

**Status**: ✅ Core utilities created
**Next Step**: Deploy to staging and test

---

## 📋 Overview

FASE 0 establishes the foundation for Blipee V2 with:
- Native Supabase SSR authentication
- Server Components architecture
- Enterprise-grade security headers
- Server Actions for mutations
- Zero custom session handling

---

## 🎯 What We've Created

### 1. Supabase Client Utilities ✅

**Location**: `src/lib/supabase/v2/`

#### Files Created:
```
src/lib/supabase/v2/
├── client.ts       # Browser client (Client Components)
├── server.ts       # Server client (Server Components + Actions)
└── middleware.ts   # Middleware client (token refresh)
```

**Key Features**:
- Uses `@supabase/ssr` (official SSR package)
- Native JWT auth (no custom session tokens)
- Proper cookie handling per environment
- Admin client for bypassing RLS

**Usage Examples**:

```typescript
// Browser (Client Component)
'use client'
import { createClient } from '@/lib/supabase/v2/client'

const supabase = createClient()
await supabase.auth.signInWithPassword({ email, password })
```

```typescript
// Server (Server Component)
import { createClient } from '@/lib/supabase/v2/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```

```typescript
// Middleware
import { updateSession } from '@/lib/supabase/v2/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
```

---

### 2. Middleware (V2) ✅

**Location**: `middleware.v2.ts` (rename to `middleware.ts` when ready)

**Key Features**:
- Refreshes Supabase auth tokens on every request
- Redirects unauthenticated users to signin
- Maintains security headers
- Integrates with telemetry

**Critical Pattern**:
```typescript
// ALWAYS call updateSession first
const supabaseResponse = await updateSession(request)

// Then check auth for protected routes
const { data: { user } } = await supabase.auth.getUser()

if (!user && !isPublicPath(pathname)) {
  return NextResponse.redirect('/signin')
}

return supabaseResponse
```

---

### 3. Server Actions (Auth) ✅

**Location**: `src/app/actions/v2/auth.ts`

**Actions Created**:
- `signIn(formData)` - Email/password signin
- `signUp(formData)` - Email/password signup
- `signOut()` - Sign out user
- `resetPassword(formData)` - Request password reset
- `updatePassword(formData)` - Update password
- `signInWithOAuth(provider)` - OAuth signin

**Key Features**:
- Form-friendly (works without JavaScript)
- Zod validation
- Automatic revalidation
- Type-safe returns

**Usage Example**:
```tsx
// Server Component
import { signIn } from '@/app/actions/v2/auth'

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

---

### 4. Next.js Configuration ✅

**Location**: `next.config.v2.js` (rename to `next.config.js` when ready)

**Features**:
- Enterprise security headers (CSP, HSTS, etc.)
- Server Actions configuration
- Image optimization
- Production source maps
- Remove console.log in production

**Security Headers Included**:
- Strict-Transport-Security (HSTS)
- X-Frame-Options (clickjacking protection)
- X-Content-Type-Options (MIME sniffing protection)
- Content-Security-Policy (XSS protection)
- Referrer-Policy
- Permissions-Policy

---

### 5. Example Pages ✅

**Location**: `src/app/v2-examples/`

#### Auth Pages:
```
src/app/v2-examples/(auth)/
├── layout.tsx              # Auth layout (centered form)
├── signin/page.tsx         # Sign in page
├── signup/page.tsx         # Sign up page
└── forgot-password/        # (to be added)
```

#### Dashboard Page:
```
src/app/v2-examples/(dashboard)/
└── page.tsx                # Protected dashboard example
```

**Key Patterns Demonstrated**:
- Server Components by default
- Server Actions for forms
- Authentication checks
- RLS queries
- React cache() for deduplication

---

## 🚀 Next Steps: Deployment

### Step 1: Create Separate V2 Project (Recommended)

```bash
# Option A: Separate repository
mkdir blipee-v2
cd blipee-v2
npx create-next-app@latest . --typescript --tailwind --app --import-alias "@/*"

# Option B: Monorepo with workspaces
mkdir apps/blipee-v2
cd apps/blipee-v2
```

### Step 2: Copy V2 Files

```bash
# Copy Supabase utilities
cp -r src/lib/supabase/v2/* apps/blipee-v2/src/lib/supabase/

# Copy middleware
cp middleware.v2.ts apps/blipee-v2/src/middleware.ts

# Copy Server Actions
cp -r src/app/actions/v2/* apps/blipee-v2/src/app/actions/

# Copy Next.js config
cp next.config.v2.js apps/blipee-v2/next.config.js

# Copy example pages (as templates)
cp -r src/app/v2-examples/* apps/blipee-v2/src/app/
```

### Step 3: Install Dependencies

```bash
cd apps/blipee-v2

# Core dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install zod
npm install -D @types/node

# Optional (for enterprise features)
npm install @upstash/redis @upstash/ratelimit
npm install pino pino-pretty
npm install @sentry/nextjs
```

### Step 4: Environment Variables

Create `.env.local`:
```bash
# Supabase (SAME as V1 - shared backend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://v2.blipee.com
NODE_ENV=development

# Optional: Redis (for caching)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional: Sentry (for error tracking)
SENTRY_DSN=
```

### Step 5: Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy to staging
vercel --prod

# Configure custom domain
vercel domains add v2.blipee.com
```

### Step 6: Setup Feature Flags

```bash
# Create Edge Config for feature flags
vercel edge-config create blipee-feature-flags

# Set initial values
vercel edge-config set v2_enabled false
vercel edge-config set v2_enabled_routes []
vercel edge-config set v2_rollout_percentage 0
```

---

## ✅ Verification Checklist

### Basic Functionality
- [ ] V2 deploys successfully to v2.blipee.com
- [ ] Landing page loads
- [ ] `/v2-examples/signin` page loads
- [ ] Sign up creates user in Supabase
- [ ] Sign in works and sets auth cookies
- [ ] Sign out clears session
- [ ] Protected routes redirect to signin
- [ ] Dashboard shows user data with RLS

### Authentication Flow
- [ ] Email/password signup works
- [ ] Email confirmation email sent
- [ ] Email/password signin works
- [ ] OAuth (Google) works
- [ ] OAuth (GitHub) works
- [ ] Password reset email sent
- [ ] Password update works
- [ ] Session persists across page reloads
- [ ] Token refresh in middleware works

### Security
- [ ] Security headers present (check browser DevTools)
- [ ] CSP header configured correctly
- [ ] HSTS header present
- [ ] Cookies are httpOnly and secure (in production)
- [ ] RLS policies enforced (can only see own data)
- [ ] Admin operations require service role key

### Performance
- [ ] Page load time < 2s (p95)
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] No unnecessary API calls
- [ ] React cache() working (check logs)

### Integration with V1
- [ ] Uses same Supabase project as V1
- [ ] Can authenticate with V1 credentials
- [ ] Sees same data as V1 (with RLS)
- [ ] No conflicts with V1 cookies

---

## 🔍 Testing Commands

### Development
```bash
# Start dev server
npm run dev

# Check TypeScript
npx tsc --noEmit

# Lint
npm run lint
```

### Authentication Testing
```bash
# Test signup flow
curl -X POST http://localhost:3000/v2-examples/signin \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@example.com&password=password123"

# Check auth cookies
curl -c cookies.txt http://localhost:3000/v2-examples/dashboard

# Verify token refresh
curl -b cookies.txt http://localhost:3000/api/auth/session
```

### Database Testing
```bash
# Check RLS policies
psql $DATABASE_URL -c "
  SELECT schemaname, tablename, policyname
  FROM pg_policies
  WHERE tablename IN ('metrics', 'organizations', 'organization_members');
"

# Test RLS enforcement
psql $DATABASE_URL -c "
  SET request.jwt.claim.sub = 'user-id-here';
  SELECT * FROM metrics;  -- Should only return user's data
"
```

---

## 📊 Key Differences: V1 vs V2

| Feature | V1 (Current) | V2 (New) | Why Better |
|---------|--------------|----------|------------|
| **Auth Method** | Custom session tokens | Supabase JWT | Official, secure, maintained |
| **Auth Storage** | `blipee-session` cookie | Supabase auth cookies | Automatic refresh, chunking |
| **Auth Validation** | `validateSession()` custom | `auth.getUser()` native | Defense in depth, simpler |
| **Token Refresh** | Manual in V1 | Automatic in middleware | No expired tokens |
| **API Routes** | 45+ routes | 3 (webhooks only) | -93% code, easier maintenance |
| **Mutations** | API calls | Server Actions | No API layer needed |
| **Data Fetching** | Client-side | Server Components | Faster, better SEO |
| **Caching** | None | Multi-layer | 90% hit rate |
| **Security** | App-level | Database RLS | Defense in depth |

---

## 🚨 Common Issues & Solutions

### Issue: "User is null after signin"
**Solution**: Check that middleware is calling `updateSession()` and cookies are being set.

### Issue: "RLS policy blocks data access"
**Solution**: Verify RLS policies exist and use `(SELECT auth.uid())` for user checks.

### Issue: "Cookies not persisting"
**Solution**: Ensure `secure: true` only in production, `httpOnly: false` for client access.

### Issue: "Token expired"
**Solution**: Middleware should refresh tokens automatically. Check middleware is running on all routes.

### Issue: "Can't set cookies in Server Component"
**Solution**: This is expected. Middleware handles cookie setting. Use `try/catch` around `setAll()`.

---

## 📚 Additional Resources

### Documentation
- [Supabase Auth SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)

### V2 Documentation (Internal)
- `BLIPEE_V2_STRUCTURE.md` - Complete architecture
- `BLIPEE_V2_BEST_PRACTICES.md` - Coding patterns
- `BLIPEE_V2_ENTERPRISE.md` - Enterprise features
- `BLIPEE_V2_MIGRATION_STRATEGY.md` - Migration plan
- `BLIPEE_V2_IMPLEMENTATION_ROADMAP.md` - Full roadmap

---

## 🎯 Success Criteria

FASE 0 is complete when:
- ✅ V2 utilities created (Supabase clients, middleware, actions)
- ✅ Example pages demonstrating patterns
- ✅ Documentation complete
- ⏳ Deployed to staging (v2.blipee.com)
- ⏳ Basic auth flow working
- ⏳ Feature flags configured

**Next**: Deploy to staging and begin FASE 1 (Marketing pages migration)

---

## 🤝 Getting Help

### Questions about V2?
1. Check `BLIPEE_V2_BEST_PRACTICES.md` for patterns
2. Review example pages in `src/app/v2-examples/`
3. Consult Supabase official docs
4. Ask in team Slack #blipee-v2

### Found a bug?
1. Check if issue exists in V1
2. Verify environment variables are correct
3. Check Supabase dashboard logs
4. Check browser console and network tab
5. File issue with full error trace

---

**Ready to deploy? 🚀**

```bash
# Deploy to staging
cd apps/blipee-v2
vercel --prod

# Watch logs
vercel logs
```

**Questions?** Refer to `BLIPEE_V2_IMPLEMENTATION_ROADMAP.md` for the complete 12-week plan.
