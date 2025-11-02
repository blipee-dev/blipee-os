# V2 Separation Strategy - Keep V1 and V2 Isolated

**Goal**: Run V1 (production) and V2 (new) simultaneously with zero conflicts

---

## 🎯 Recommended Approach: Separate Vercel Projects

### Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   DNS Layer                         │
│  blipee.com → Vercel Project 1 (V1)                │
│  v2.blipee.com → Vercel Project 2 (V2)             │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│              Shared Supabase Backend                │
│  - Same database                                    │
│  - Same auth users                                  │
│  - Same storage                                     │
└─────────────────────────────────────────────────────┘
```

**Key Principle**: Separate deployments, shared data

---

## 📁 Option 1: Monorepo (RECOMMENDED)

### Why Monorepo?
✅ Share types and utilities
✅ Atomic commits across both versions
✅ Easier to keep dependencies in sync
✅ Single CI/CD pipeline
✅ Better for gradual migration

### Directory Structure

```
blipee-mono/
├── apps/
│   ├── v1/                         # Current production (blipee.com)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── lib/
│   │   │   │   ├── auth/          # Custom session handling
│   │   │   │   └── supabase/      # V1 Supabase clients
│   │   │   └── components/
│   │   ├── middleware.ts           # V1 middleware
│   │   ├── next.config.js
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vercel.json
│   │
│   └── v2/                         # New implementation (v2.blipee.com)
│       ├── src/
│       │   ├── app/
│       │   │   ├── (marketing)/
│       │   │   ├── (auth)/
│       │   │   ├── (dashboard)/
│       │   │   └── actions/       # Server Actions
│       │   ├── lib/
│       │   │   └── supabase/      # V2 Supabase SSR clients
│       │   └── components/
│       ├── middleware.ts           # V2 middleware (token refresh)
│       ├── next.config.js
│       ├── package.json
│       ├── tsconfig.json
│       └── vercel.json
│
├── packages/                       # Shared packages (optional)
│   ├── shared-types/
│   │   ├── supabase.ts            # Shared Supabase types
│   │   └── index.ts
│   ├── shared-utils/
│   │   ├── constants.ts
│   │   └── helpers.ts
│   └── ui/                         # Shared UI components
│       └── index.ts
│
├── package.json                    # Root package.json
├── turbo.json                      # Turborepo config
├── .gitignore
└── README.md
```

### Setup Steps

#### 1. Create Monorepo Structure

```bash
# Create monorepo
mkdir blipee-mono
cd blipee-mono

# Initialize npm workspace
npm init -y

# Create directories
mkdir -p apps/v1 apps/v2 packages/shared-types packages/shared-utils
```

#### 2. Root package.json

```json
{
  "name": "blipee-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "dev:v1": "turbo run dev --filter=v1",
    "dev:v2": "turbo run dev --filter=v2",
    "build:v1": "turbo run build --filter=v1",
    "build:v2": "turbo run build --filter=v2",
    "deploy:v1": "cd apps/v1 && vercel --prod",
    "deploy:v2": "cd apps/v2 && vercel --prod"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "typescript": "^5.3.0"
  }
}
```

#### 3. Turborepo Config (turbo.json)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    }
  }
}
```

#### 4. Move V1 Code

```bash
# Copy current blipee-os to apps/v1
cp -r /path/to/blipee-os/* apps/v1/

# Update V1 package.json name
cd apps/v1
# Edit package.json: "name": "v1"
```

#### 5. Create V2 Project

```bash
cd apps/v2
npx create-next-app@latest . --typescript --tailwind --app --import-alias "@/*"

# Copy V2 utilities from V1
cp -r ../v1/src/lib/supabase/v2 src/lib/supabase/
cp ../v1/middleware.v2.ts src/middleware.ts
cp -r ../v1/src/app/actions/v2 src/app/actions/
cp ../v1/next.config.v2.js next.config.js

# Update V2 package.json name
# Edit package.json: "name": "v2"
```

#### 6. Shared Types Package (Optional)

```bash
cd packages/shared-types

# package.json
cat > package.json << 'EOF'
{
  "name": "shared-types",
  "version": "1.0.0",
  "main": "index.ts",
  "types": "index.ts"
}
EOF

# Export shared types
cat > index.ts << 'EOF'
export type { Database } from './supabase'
export * from './types'
EOF
```

#### 7. Vercel Configuration

**apps/v1/vercel.json:**
```json
{
  "version": 2,
  "name": "blipee-v1",
  "alias": ["blipee.com", "www.blipee.com"],
  "buildCommand": "npm run build --filter=v1",
  "env": {
    "APP_VERSION": "v1",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key"
  }
}
```

**apps/v2/vercel.json:**
```json
{
  "version": 2,
  "name": "blipee-v2",
  "alias": ["v2.blipee.com"],
  "buildCommand": "npm run build --filter=v2",
  "env": {
    "APP_VERSION": "v2",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase-service-key"
  }
}
```

#### 8. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Link V1
cd apps/v1
vercel link
vercel --prod
# Domain: blipee.com

# Link V2
cd ../v2
vercel link
vercel --prod
# Domain: v2.blipee.com
```

---

## 📁 Option 2: Separate Repositories (SIMPLE)

### Why Separate Repos?
✅ Complete isolation
✅ Simpler deployment
✅ Independent versioning
✅ Easier for new team members

### Setup

```bash
# Keep current repo as V1
cd blipee-os
# Continue development as normal

# Create new repo for V2
cd ..
mkdir blipee-v2
cd blipee-v2
git init
npx create-next-app@latest . --typescript --tailwind --app

# Copy V2 files
cp -r ../blipee-os/src/lib/supabase/v2 src/lib/supabase/
cp ../blipee-os/middleware.v2.ts src/middleware.ts
cp -r ../blipee-os/src/app/actions/v2 src/app/actions/

# Create remote
git remote add origin https://github.com/your-org/blipee-v2.git
git push -u origin main

# Deploy separately
vercel --prod
```

---

## 🔐 Shared Resources

### 1. Supabase Backend (Shared)

Both V1 and V2 use the **SAME** Supabase project:

```bash
# .env.local (SAME for both V1 and V2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Why this works:**
- V1 uses custom sessions → Supabase auth users
- V2 uses JWT tokens → Same Supabase auth users
- Both can authenticate same users
- Both access same database with RLS

### 2. Database Schema (Shared)

```sql
-- V1 and V2 share same tables
-- V2 adds new columns as NULLABLE for compatibility

-- Example: Add V2 columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS v2_metadata jsonb;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS v2_settings jsonb;

-- V1 queries ignore new columns
-- V2 queries use new columns
```

### 3. Authentication (Compatible)

**V1 Session Flow:**
```
User → Sign In → Custom Session Token → blipee-session cookie
```

**V2 JWT Flow:**
```
User → Sign In → Supabase JWT → sb-access-token, sb-refresh-token cookies
```

**Bridge During Migration:**
```typescript
// V2 can read V1 sessions during transition
export async function getUser(request: NextRequest) {
  // Try V2 JWT first
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()
  if (user) return user

  // Fallback to V1 session (during migration)
  const v1Session = request.cookies.get('blipee-session')?.value
  if (v1Session) {
    const session = await validateV1Session(v1Session)
    return session?.user
  }

  return null
}
```

---

## 🔀 Gradual Migration with Edge Routing

### Stage 1: Side-by-side (Current)

```
blipee.com (V1)      →  All traffic
v2.blipee.com (V2)   →  Testing only
```

### Stage 2: Feature-based routing (FASE 1-5)

**V1 Middleware** routes specific paths to V2:

```typescript
// apps/v1/middleware.ts
import { NextResponse } from 'next/server'
import { get } from '@vercel/edge-config'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get V2-enabled routes from Edge Config
  const v2Routes = await get<string[]>('v2_enabled_routes') || []

  // Check if this route should use V2
  const shouldUseV2 = v2Routes.some(route => pathname.startsWith(route))

  if (shouldUseV2) {
    // Rewrite to V2 deployment
    const url = request.nextUrl.clone()
    url.hostname = 'v2.blipee.com'
    return NextResponse.rewrite(url)
  }

  // Continue with V1
  return NextResponse.next()
}
```

**Edge Config (Vercel Dashboard):**
```json
{
  "v2_enabled_routes": ["/about", "/careers"]  // Start small
}
```

**Gradual rollout:**
```bash
# Week 1: Marketing pages
vercel edge-config set v2_enabled_routes '["/about", "/careers", "/company"]'

# Week 2: Auth pages
vercel edge-config set v2_enabled_routes '["/about", "/careers", "/signin", "/signup"]'

# Week 3: Dashboard
vercel edge-config set v2_enabled_routes '["/about", "/careers", "/signin", "/dashboard"]'

# Week 4: Everything
vercel edge-config set v2_enabled_routes '["/"]'
```

### Stage 3: DNS cutover (FASE 6)

```bash
# Point blipee.com to V2 deployment
vercel domains add blipee.com --project=blipee-v2

# Point v1.blipee.com to V1 (for rollback)
vercel domains add v1.blipee.com --project=blipee-v1
```

---

## 🔄 Development Workflow

### Monorepo

```bash
# Start both
npm run dev

# Or individually
npm run dev:v1  # http://localhost:3000
npm run dev:v2  # http://localhost:3001

# Build both
npm run build

# Deploy
npm run deploy:v1
npm run deploy:v2
```

### Separate Repos

```bash
# Terminal 1: V1
cd blipee-os
npm run dev  # http://localhost:3000

# Terminal 2: V2
cd blipee-v2
npm run dev  # http://localhost:3001
```

---

## 🚀 Deployment Matrix

| Environment | V1 URL | V2 URL | Supabase |
|-------------|--------|--------|----------|
| **Production** | blipee.com | v2.blipee.com | Shared (prod) |
| **Staging** | staging-v1.blipee.com | staging-v2.blipee.com | Shared (staging) |
| **Development** | localhost:3000 | localhost:3001 | Shared (local) |

---

## ✅ Isolation Checklist

### Code Isolation
- [x] Separate directories (apps/v1 vs apps/v2)
- [x] Separate package.json files
- [x] Separate dependencies
- [x] Separate Vercel projects

### Deployment Isolation
- [x] Different domains (blipee.com vs v2.blipee.com)
- [x] Different deployments
- [x] Independent scaling
- [x] Independent rollbacks

### Shared Resources
- [x] Same Supabase project
- [x] Same database
- [x] Same auth users
- [x] Same storage buckets

### Migration Path
- [x] Can run simultaneously
- [x] Can route between them
- [x] Can share sessions (during transition)
- [x] Can rollback instantly

---

## 🎯 Recommended: Monorepo + Separate Vercel Projects

**Why?**
1. **Easy to share types** between V1 and V2
2. **Atomic commits** when changing database schema
3. **Single source of truth** for configuration
4. **Easier refactoring** during migration
5. **Complete deployment isolation** (separate Vercel projects)

**Example:**
```bash
# Create monorepo
npx create-turbo@latest blipee-mono

# Directory structure
blipee-mono/
├── apps/
│   ├── v1/  → deploys to blipee.com
│   └── v2/  → deploys to v2.blipee.com
└── packages/
    └── shared-types/  → shared by both

# Deploy independently
cd apps/v1 && vercel --prod     # blipee.com
cd apps/v2 && vercel --prod     # v2.blipee.com
```

---

## 📚 Next Steps

1. **Choose structure**: Monorepo (recommended) or Separate repos
2. **Setup repositories**: Follow steps above
3. **Deploy V2 to staging**: v2.blipee.com
4. **Test independently**: Verify no conflicts
5. **Setup Edge routing**: For gradual migration
6. **Begin FASE 1**: Migrate marketing pages

---

## 🆘 FAQ

### Q: Will V1 and V2 interfere with each other?
**A**: No. Different domains, different deployments. Shared Supabase works because both use same auth.

### Q: Can users switch between V1 and V2?
**A**: Yes. Same Supabase auth means same login works on both.

### Q: What if V2 breaks?
**A**: Edge Config instant rollback. Just set `v2_enabled_routes = []`.

### Q: How do we share code?
**A**: Monorepo with `packages/shared-*` or copy files between repos.

### Q: When do we deprecate V1?
**A**: After 100% traffic on V2 for 2+ weeks with no issues (FASE 6).

---

**Recommended approach**: Monorepo + Separate Vercel Projects

**Next**: Follow setup steps above to create structure.
