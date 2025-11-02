# Vercel V2 Deployment Guide

## Overview

This guide documents how to deploy both V1 (production) and V2 (monorepo) applications on Vercel as separate projects.

## Current Architecture

```
blipee-os/                           # Git repository root
├── package.json                     # V1 dependencies
├── vercel.json                      # V1 Vercel config
├── src/                             # V1 source code (Pages Router)
│   ├── app/
│   │   └── api/                     # 68 API routes (production)
│   ├── components/
│   └── lib/
└── blipee-v2/                       # V2 Monorepo (separate from V1)
    ├── package.json                 # Monorepo root
    ├── apps/
    │   └── blipee-v2/               # V2 Next.js app
    │       ├── package.json         # V2 app config
    │       ├── next.config.js
    │       └── src/                 # V2 source (App Router + Server Components)
    └── packages/
        └── shared/                  # Shared utilities
```

## V1 (Production) - Current Deployment

### Configuration

**Vercel Project**: `blipee-os` (already deployed)

**Root Directory**: `.` (repository root)

**Build Settings**:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

**Environment Variables** (already configured):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NODE_ENV=production`
- Database credentials

**Framework**: Next.js (Pages Router)

**Status**: ✅ Currently in production

---

## V2 (Monorepo) - New Deployment Setup

### Step 1: Create New Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Select the same GitHub repository: `blipee/blipee-os`
4. Name the project: **`blipee-v2`** (or `blipee-os-v2`)

### Step 2: Configure Root Directory

**CRITICAL**: Set the **Root Directory** to point to V2 app:

```
Root Directory: blipee-v2/apps/blipee-v2
```

This tells Vercel to:
- Treat `blipee-v2/apps/blipee-v2/` as the project root
- Look for `package.json` there
- Build only V2 code

### Step 3: Build Configuration

**Framework Preset**: Next.js

**Build & Development Settings**:
```
Build Command:        npm run build
                      (or leave blank to use default)

Output Directory:     .next
                      (or leave blank)

Install Command:      npm install
                      (or leave blank)

Development Command:  npm run dev -- --port 3005
```

### Step 4: Node.js Version

**Important**: Set Node.js version in V2's `package.json`:

```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

Vercel will automatically detect and use Node.js 18+.

### Step 5: Environment Variables

Configure in Vercel Dashboard → Settings → Environment Variables:

#### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://quovvwrwyfkzhgqdeham.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Service Role (for admin operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Node Environment
NODE_ENV=production

# Database (if needed for direct connections)
DATABASE_URL=postgresql://postgres.quovvwrwyfkzhgqdeham:password@aws-0-eu-west-3.pooler.supabase.com:6543/postgres
```

#### Optional Variables

```bash
# Monitoring (if using Sentry)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=auto

# Custom Domain (after deployment)
NEXT_PUBLIC_APP_URL=https://v2.blipee.com
```

**Scope**: Set all variables for:
- ✅ Production
- ✅ Preview
- ✅ Development

### Step 6: Ignore Build Commands

To prevent accidental builds of V1 when deploying V2, add to V2's `package.json`:

```json
{
  "scripts": {
    "vercel-build": "cd apps/blipee-v2 && npm run build"
  }
}
```

Or use `.vercelignore` in repository root to exclude V1:

```
# V1 files (excluded from V2 builds)
/src
/pages
/public
/styles
/package-lock.json
vercel.json

# Only include V2
!/blipee-v2
```

### Step 7: Git Branch Configuration

**Production Branch**: `main`
- Deploys to: `blipee-v2.vercel.app` (or custom domain)

**Preview Branches**: Any branch
- Automatically creates preview deployments

**Recommended**: Use branch prefixes:
- `v1/*` → triggers V1 deployment
- `v2/*` → triggers V2 deployment
- Configure in Vercel → Settings → Git → Ignored Build Step

### Step 8: Domains

#### V1 Production
- Primary: `blipee.com`
- Already configured

#### V2 Production (when ready)
- Option A: Subdomain → `v2.blipee.com` or `app.blipee.com`
- Option B: Path-based → Keep V1 at root, migrate routes gradually
- Option C: New domain → `blipee-v2.com`

**Recommendation**: Start with subdomain (`v2.blipee.com`) for parallel testing.

---

## Deployment Workflow

### V1 (Current Production)

```bash
# Deploy V1 changes
git checkout main
git add src/ package.json  # Only V1 files
git commit -m "feat(v1): Add new feature"
git push origin main

# Vercel automatically deploys V1 (root directory)
```

### V2 (New Monorepo)

```bash
# Deploy V2 changes
git checkout main
git add blipee-v2/  # Only V2 files
git commit -m "feat(v2): Add new dashboard"
git push origin main

# Vercel automatically deploys V2 (blipee-v2/apps/blipee-v2/)
```

### Independent Deployments

Both projects can deploy from the same commit:
- **V1 Project**: Watches root directory, ignores `blipee-v2/`
- **V2 Project**: Watches `blipee-v2/apps/blipee-v2/`, ignores root

Changes to one don't affect the other.

---

## Ignored Build Step (Advanced)

To optimize deployments and prevent unnecessary builds:

### V1 Project - Ignore when only V2 changes

In Vercel → Settings → Git → Ignored Build Step:

```bash
# Only build if V1 files changed
git diff HEAD^ HEAD --quiet -- ':!blipee-v2' ':!docs' ':!scripts'
```

This returns exit code 1 (build) if V1 files changed, 0 (skip) if only V2 changed.

### V2 Project - Ignore when only V1 changes

```bash
# Only build if V2 files changed
git diff HEAD^ HEAD --quiet -- blipee-v2/
```

This returns exit code 1 (build) if V2 files changed, 0 (skip) if only V1 changed.

---

## Migration Strategy

### Phase 1: Parallel Deployment (Current)
- V1 serves production at `blipee.com`
- V2 deploys to staging at `blipee-v2.vercel.app`
- Both run independently

### Phase 2: Gradual Migration
- Deploy V2 to subdomain: `v2.blipee.com` or `app.blipee.com`
- Migrate users gradually
- Keep V1 as fallback

### Phase 3: Full Migration
- Point `blipee.com` to V2
- Redirect V1 traffic to V2
- Archive V1 project (keep for rollback)

---

## Troubleshooting

### Build fails: "Cannot find module '@blipee/shared'"

**Cause**: Monorepo workspace not resolving correctly.

**Fix**: Ensure `blipee-v2/package.json` has workspaces configured:

```json
{
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

And run `npm install` at monorepo root before building.

### V2 builds but V1 code appears

**Cause**: Root Directory not set correctly.

**Fix**: In Vercel → Settings → General → Root Directory:
- Set to: `blipee-v2/apps/blipee-v2`
- Click "Save"
- Redeploy

### Environment variables not working

**Cause**: Variables not set for correct environment.

**Fix**: Check Vercel → Settings → Environment Variables:
- Ensure variables have checkmarks for Production, Preview, Development
- Redeploy after saving changes

### Both V1 and V2 deploy on every push

**Cause**: No ignored build step configured.

**Fix**: Add ignored build step (see "Ignored Build Step" section above).

---

## Verification Checklist

After deploying V2:

- [ ] V2 app builds successfully
- [ ] Environment variables loaded (check logs)
- [ ] Database connection works (test API routes)
- [ ] Authentication flows correctly (Supabase SSR)
- [ ] No V1 code imported accidentally
- [ ] V1 production still works (not affected by V2)
- [ ] Preview deployments work for both projects

---

## Quick Reference

| Aspect | V1 (Production) | V2 (Monorepo) |
|--------|----------------|---------------|
| **Project Name** | `blipee-os` | `blipee-v2` |
| **Root Directory** | `.` (root) | `blipee-v2/apps/blipee-v2` |
| **Framework** | Next.js Pages Router | Next.js App Router |
| **Auth** | Custom session | Supabase SSR |
| **Domain** | `blipee.com` | `v2.blipee.com` (planned) |
| **Status** | ✅ Production | 🚧 Development |

---

## Next Steps

1. **Create V2 Vercel project** (10 min)
   - Follow Step 1-4 above

2. **Configure environment variables** (5 min)
   - Copy from V1 project
   - Adjust if needed for V2

3. **Deploy and test** (15 min)
   - Push a commit touching `blipee-v2/`
   - Verify deployment succeeds
   - Test basic functionality

4. **Set up custom domain** (when ready)
   - Add `v2.blipee.com` in DNS
   - Configure in Vercel

5. **Configure ignored build steps** (optional)
   - Optimize CI/CD
   - Prevent unnecessary builds

---

## Support

For issues with:
- **V1 Deployment**: Check current `vercel.json` and root `package.json`
- **V2 Deployment**: Check `blipee-v2/apps/blipee-v2/package.json` and Vercel root directory setting
- **Supabase**: Verify environment variables and database connection
- **Vercel**: Contact Vercel support or check [Vercel Monorepo Docs](https://vercel.com/docs/monorepos)

---

**Last Updated**: 2025-11-02
**V1 Version**: 1.0.0 (Production)
**V2 Version**: 2.0.0 (Development)
