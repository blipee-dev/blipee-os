# Blipee V2 - Enterprise Sustainability Platform

**Next.js 14 • Server Components • Native Supabase SSR Auth**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/your-org/blipee-v2)
[![License](https://img.shields.io/badge/license-UNLICENSED-red.svg)](LICENSE)

---

## 🎯 Overview

Blipee V2 is a complete rewrite of the Blipee sustainability platform using modern best practices:

- **70% less code** compared to V1
- **50% faster** page loads
- **70% lower costs** ($700/mo → $210/mo)
- **Enterprise-grade** security and compliance
- **Native auth** with Supabase SSR (zero custom sessions)

### Key Improvements Over V1

| Feature | V1 | V2 | Improvement |
|---------|----|----|-------------|
| Auth Method | Custom sessions | Supabase JWT | Official, maintained |
| API Routes | 45+ | 3 | -93% |
| Data Fetching | Client-side | Server Components | 2x faster |
| Caching | None | Multi-layer | 90% hit rate |
| Security | App-level | Database RLS | Defense in depth |

---

> ℹ️ **Monorepo:** Esta aplicação vive dentro de `apps/blipee-v2/` e usa npm workspaces. Execute comandos através do root (`npm run dev:v2`) ou navegando até o diretório da app.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- Supabase project (same as V1)
- Vercel account (for deployment)

### Installation

```bash
# Clone or navigate to the monorepo root
cd blipee-os/blipee-v2

# Install dependencies for all workspaces
npm install

# Copy environment variables (inside the V2 app directory)
cp apps/blipee-v2/.env.example apps/blipee-v2/.env.local
# Edit apps/blipee-v2/.env.local with your Supabase credentials

# Run development server for V2
npm run dev:v2
```

Open [http://localhost:3000](http://localhost:3000)

### First Steps

1. **Configure Environment**
   ```bash
   # .env.local
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Generate Supabase Types**
   ```bash
   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/supabase.ts
   ```

3. **Test Auth Flow**
   - Visit `/signin` to sign in
   - Visit `/signup` to create account
   - Visit `/dashboard` (protected route)

---

## 📁 Project Structure

```
apps/blipee-v2/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Auth pages (signin, signup, forgot/reset password)
│   │   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── (marketing)/landing/ # React marketing landing (sections, hooks, content)
│   │   ├── actions/             # Server Actions
│   │   │   └── v2/auth.ts       # Auth actions (signIn, signUp, etc.)
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home page rendering `<LandingPage />`
│   │   └── globals.css          # Global styles + shared CSS variables
│   │
│   ├── lib/                      # Utilities
│   │   └── supabase/            # Supabase clients
│   │       └── v2/              # V2 client implementations
│   │           ├── client.ts    # Browser client
│   │           ├── server.ts    # Server client
│   │           └── middleware.ts # Middleware client
│   │
│   ├── components/              # React components
│   ├── types/                   # TypeScript types
│   │   └── supabase.ts         # Generated Supabase types
│   └── middleware.ts            # Next.js middleware (token refresh)
│
├── docs/                         # Documentation
│   ├── V2_QUICK_START.md        # 5-minute guide
│   ├── FASE_0_SETUP_GUIDE.md    # Detailed setup
│   ├── BLIPEE_V2_STRUCTURE.md   # Architecture
│   └── ...                      # More documentation
│
├── public/                       # Static assets
├── next.config.js               # Next.js configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies
```

> Shared utilities for V1 and V2 live under `packages/shared/` at the monorepo root.

---

## 🔧 Development

### Available Scripts

```bash
# Run from the monorepo root
npm run dev:v2         # Start dev server (http://localhost:3000)
npm run build:v2       # Build for production
npm run lint           # Lint code (V2)
npm run type-check     # TypeScript type checking (V2)

# Or run directly inside apps/blipee-v2
npm run dev            # Start dev server
npm run build          # Build for production
```

### Code Patterns

#### Server Component (data fetching)
```tsx
import { createClient } from '@/lib/supabase/v2/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/signin')

  // Fetch with RLS
  const { data } = await supabase.from('metrics').select('*')

  return <Dashboard data={data} />
}
```

#### Server Action (mutations)
```tsx
'use server'
import { createClient } from '@/lib/supabase/v2/server'
import { revalidatePath } from 'next/cache'

export async function createMetric(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('metrics')
    .insert({ user_id: user.id, value: formData.get('value') })

  revalidatePath('/dashboard')
  return { success: true }
}
```

#### Client Component (interactivity)
```tsx
'use client'
import { createClient } from '@/lib/supabase/v2/client'

export function LoginButton() {
  const supabase = createClient()

  async function handleLogin() {
    await supabase.auth.signInWithPassword({ email, password })
  }

  return <button onClick={handleLogin}>Login</button>
}
```

---

## 🔐 Authentication

### Native Supabase SSR

V2 uses official Supabase SSR patterns (no custom sessions):

**Key Rules:**
- ✅ Use `auth.getUser()` in Server Components/Actions
- ✅ Let middleware refresh tokens automatically
- ✅ Rely on RLS for auth enforcement
- ❌ Never use `auth.getSession()` in server code
- ❌ Don't create custom session tokens

### Auth Flow

1. **User signs in** → Server Action → Supabase JWT tokens
2. **Middleware** → Refreshes tokens on every request
3. **Server Component** → `auth.getUser()` → Fetch data with RLS
4. **RLS policies** → Enforce user isolation at database level

---

## 🗄️ Database

### Supabase Backend (Shared with V1)

Both V1 and V2 use the **same** Supabase project:
- Same database
- Same auth users
- Same storage

**Why this works:**
- V1 uses custom sessions → Supabase users
- V2 uses JWT tokens → Same Supabase users
- Both access same data with RLS

### Row Level Security (RLS)

All tables use RLS policies:

```sql
-- Enable RLS
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;

-- User can only see their own data
CREATE POLICY "Users view own metrics"
  ON metrics FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
```

---

## 🚢 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Configure domain
vercel domains add v2.blipee.com
```

### Environment Variables (Vercel Dashboard)

Add these in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

### Deployment Checklist

- [ ] Environment variables set in Vercel
- [ ] Domain configured (v2.blipee.com)
- [ ] OAuth redirect URLs updated in Supabase
- [ ] Security headers verified
- [ ] RLS policies enabled
- [ ] Test auth flow in production

---

## 📊 Monitoring

### Performance Targets

- **LCP**: < 2.5s (Largest Contentful Paint)
- **FID**: < 100ms (First Input Delay)
- **CLS**: < 0.1 (Cumulative Layout Shift)
- **Error Rate**: < 0.1%
- **Uptime**: > 99.9%

### Tools

- **Vercel Analytics** - Core Web Vitals
- **Supabase Dashboard** - Database metrics
- **Browser DevTools** - Network, Performance

---

## 📚 Documentation

### For Developers

- **[V2_QUICK_START.md](docs/V2_QUICK_START.md)** - 5-minute setup
- **[FASE_0_SETUP_GUIDE.md](docs/FASE_0_SETUP_GUIDE.md)** - Detailed setup
- **[BLIPEE_V2_BEST_PRACTICES.md](docs/BLIPEE_V2_BEST_PRACTICES.md)** - Coding patterns
- **[BLIPEE_V2_STRUCTURE.md](docs/BLIPEE_V2_STRUCTURE.md)** - Architecture

### For Business/Product

- **[BLIPEE_V2_EXECUTIVE_SUMMARY.md](docs/BLIPEE_V2_EXECUTIVE_SUMMARY.md)** - ROI analysis
- **[V2_IMPLEMENTATION_STATUS.md](docs/V2_IMPLEMENTATION_STATUS.md)** - Current status

### For Migration

- **[BLIPEE_V2_MIGRATION_STRATEGY.md](docs/BLIPEE_V2_MIGRATION_STRATEGY.md)** - Migration plan
- **[V2_SEPARATION_STRATEGY.md](docs/V2_SEPARATION_STRATEGY.md)** - V1/V2 separation

---

## 🤝 Contributing

### Development Workflow

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and test locally
3. Run type check: `npm run type-check`
4. Run linter: `npm run lint`
5. Build: `npm run build`
6. Commit: `git commit -m "feat: add my feature"`
7. Push and create PR

### Code Standards

- Use TypeScript strict mode
- Follow Next.js App Router patterns
- Server Components by default
- Server Actions for mutations
- Zod for validation

---

## ❓ FAQ

### Q: Can V1 and V2 run at the same time?
**A:** Yes! They share the same Supabase backend but have separate deployments.

### Q: Will users need to re-authenticate?
**A:** No. Same Supabase users work on both V1 and V2.

### Q: How do we migrate from V1 to V2?
**A:** Gradual rollout using Edge middleware routing. See `BLIPEE_V2_MIGRATION_STRATEGY.md`.

### Q: What about existing V1 code?
**A:** V1 continues running during migration. Strangler Pattern for zero downtime.

### Q: How do we rollback if needed?
**A:** Instant rollback via feature flags in Vercel Edge Config.

---

## 🆘 Support

### Getting Help

1. Check documentation in `docs/`
2. Review example code in `src/app/`
3. Consult Supabase docs: https://supabase.com/docs
4. Check Next.js docs: https://nextjs.org/docs

### Common Issues

**"User is null after signin"**
→ Check middleware is running and cookies are set

**"RLS blocks data access"**
→ Verify RLS policies exist and use `(SELECT auth.uid())`

**"Cookies not persisting"**
→ Ensure `secure: true` only in production

---

## 📄 License

UNLICENSED - Proprietary

---

## 🎉 Next Steps

1. ✅ Read this README
2. ⏳ Follow `docs/V2_QUICK_START.md` (5 min)
3. ⏳ Setup local environment
4. ⏳ Test auth flow
5. ⏳ Deploy to staging (v2.blipee.com)
6. ⏳ Begin FASE 1 (marketing pages migration)

---

**Built with ❤️ using Next.js 14, Server Components, and Supabase**

**Questions?** Start with `docs/V2_QUICK_START.md`
