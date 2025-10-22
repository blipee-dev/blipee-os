# 🛡️ Safe Deployment Guide - Vercel AI Integration

## Problem Statement

You have a **separate team** working on the Vercel AI SDK integration, sharing the git repository. Any push to `main` goes **directly to production**. You need a safe way to:

1. ✅ Let the team develop and test
2. ✅ Share code via git
3. ✅ Prevent accidental production deployments
4. ✅ Test thoroughly before going live

---

## 🎯 **Recommended Solution: Feature Branch + Feature Flags**

### Strategy Overview

```
┌─────────────────────────────────────────────────────────────┐
│ Development Team (Feature Branch)                           │
│  ↓                                                          │
│ git push origin feature/vercel-ai-integration              │
│  ↓                                                          │
│ Vercel Preview Deployment                                   │
│ https://blipee-os-git-feature-*.vercel.app                 │
│  ↓                                                          │
│ Test with real data, monitor costs                         │
│  ↓                                                          │
│ Create Pull Request → Code Review                          │
│  ↓                                                          │
│ Merge to main with FEATURE FLAG DISABLED                   │
│  ↓                                                          │
│ Production (Vercel AI disabled by default)                 │
│  ↓                                                          │
│ Enable feature flag when ready                             │
│  ↓                                                          │
│ Gradual rollout: 1% → 10% → 50% → 100%                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 **Implementation Steps**

### Step 1: Create Feature Branch

```bash
# Main branch is protected
git checkout main
git pull origin main

# Create feature branch for AI integration
git checkout -b feature/vercel-ai-integration

# Push to remote
git push -u origin feature/vercel-ai-integration
```

**Result**: Vercel automatically creates a preview deployment at:
`https://blipee-os-git-feature-vercel-ai-integration-yourteam.vercel.app`

---

### Step 2: Add Feature Flag System

Create a feature flag to control when Vercel AI is active:

**File: `src/lib/feature-flags.ts`**

```typescript
/**
 * Feature Flags for Safe Deployment
 *
 * Allows features to be deployed to production but disabled by default
 */

// Environment-based feature flags
export const FEATURE_FLAGS = {
  // Vercel AI SDK Integration
  ENABLE_VERCEL_AI: process.env.NEXT_PUBLIC_ENABLE_VERCEL_AI === 'true',

  // Rollout percentage (0-100)
  VERCEL_AI_ROLLOUT_PERCENTAGE: parseInt(
    process.env.NEXT_PUBLIC_VERCEL_AI_ROLLOUT_PERCENTAGE || '0',
    10
  ),

  // Organizations to enable for (beta testing)
  VERCEL_AI_BETA_ORGS: process.env.NEXT_PUBLIC_VERCEL_AI_BETA_ORGS?.split(',') || [],
};

/**
 * Check if Vercel AI should be enabled for this user
 */
export function shouldUseVercelAI(
  organizationId?: string,
  userId?: string
): boolean {
  // Feature completely disabled
  if (!FEATURE_FLAGS.ENABLE_VERCEL_AI) {
    return false;
  }

  // Beta organizations get early access
  if (organizationId && FEATURE_FLAGS.VERCEL_AI_BETA_ORGS.includes(organizationId)) {
    return true;
  }

  // Gradual rollout based on user ID
  if (userId && FEATURE_FLAGS.VERCEL_AI_ROLLOUT_PERCENTAGE > 0) {
    const hash = hashString(userId);
    const percentage = hash % 100;
    return percentage < FEATURE_FLAGS.VERCEL_AI_ROLLOUT_PERCENTAGE;
  }

  return false;
}

// Simple hash function for consistent rollout
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
```

---

### Step 3: Update AI Service to Use Feature Flag

**File: `src/lib/ai/service-router.ts`** (new file)

```typescript
import { aiService } from './service'; // Old service
import { vercelAIService } from './vercel-ai-service'; // New service
import { shouldUseVercelAI } from '@/lib/feature-flags';

/**
 * Smart router that switches between old and new AI service
 * based on feature flag
 */
export class AIServiceRouter {
  async complete(
    prompt: string,
    options: any,
    context?: { organizationId?: string; userId?: string }
  ): Promise<string> {
    // Check if Vercel AI should be used
    if (shouldUseVercelAI(context?.organizationId, context?.userId)) {
      console.log('🎯 Using Vercel AI Service (new)');
      return vercelAIService.complete(prompt, options);
    }

    // Fallback to old service
    console.log('📦 Using legacy AI Service');
    return aiService.complete(prompt, options);
  }

  async *stream(
    prompt: string,
    options: any,
    context?: { organizationId?: string; userId?: string }
  ) {
    if (shouldUseVercelAI(context?.organizationId, context?.userId)) {
      console.log('🎯 Streaming with Vercel AI Service (new)');
      yield* vercelAIService.stream(prompt, options);
    } else {
      console.log('📦 Streaming with legacy AI Service');
      yield* aiService.stream(prompt, options);
    }
  }

  async processTargetSettingQuery(query: string, organizationId: string) {
    if (shouldUseVercelAI(organizationId)) {
      return vercelAIService.processTargetSettingQuery(query, organizationId);
    }
    return aiService.processTargetSettingQuery(query, organizationId);
  }
}

// Singleton
export const aiServiceRouter = new AIServiceRouter();
```

---

### Step 4: Configure Vercel Environment Variables

**In Vercel Dashboard** (or `.env.local` for testing):

#### Production Environment
```bash
# Feature disabled by default
NEXT_PUBLIC_ENABLE_VERCEL_AI=false
NEXT_PUBLIC_VERCEL_AI_ROLLOUT_PERCENTAGE=0
NEXT_PUBLIC_VERCEL_AI_BETA_ORGS=

# AI Provider keys (keep existing)
DEEPSEEK_API_KEY=your_key
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
```

#### Preview/Feature Branch Environment
```bash
# Feature enabled for testing
NEXT_PUBLIC_ENABLE_VERCEL_AI=true
NEXT_PUBLIC_VERCEL_AI_ROLLOUT_PERCENTAGE=100

# All AI keys
DEEPSEEK_API_KEY=your_key
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
```

**Configure in Vercel:**
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add variables with different values for:
   - **Production** (main branch)
   - **Preview** (all other branches)

---

### Step 5: Update Existing Code to Use Router

**File: `src/app/api/ai/chat/route.ts`** (update import)

```typescript
// Old:
// import { aiService } from "@/lib/ai/service";

// New:
import { aiServiceRouter as aiService } from "@/lib/ai/service-router";

// Rest of code stays the same!
// The router automatically switches between old and new service
```

---

## 🚀 **Deployment Workflow**

### For Development Team

```bash
# 1. Create feature branch
git checkout -b feature/vercel-ai-integration

# 2. Make changes
# Edit files, test locally

# 3. Push to feature branch
git add .
git commit -m "feat: add Vercel AI SDK integration"
git push origin feature/vercel-ai-integration

# 4. Test on preview deployment
# Visit: https://blipee-os-git-feature-*.vercel.app
# Feature flag is enabled automatically for preview

# 5. Monitor costs and performance
# Check /api/ai/monitoring endpoint

# 6. When ready, create Pull Request
gh pr create --title "Add Vercel AI SDK Integration" \
  --body "Adds smart provider routing with 65% cost savings"

# 7. After approval, merge to main
# Code is in production but DISABLED by feature flag
```

### For Production Team (You)

```bash
# 1. Review PR
gh pr review --approve

# 2. Merge to main
gh pr merge --squash

# 3. Code is deployed but DISABLED
# NEXT_PUBLIC_ENABLE_VERCEL_AI=false in production

# 4. Enable for beta testing (optional)
# In Vercel: Set NEXT_PUBLIC_VERCEL_AI_BETA_ORGS=org_test_123

# 5. Test with beta org
# Only org_test_123 uses new service

# 6. Gradual rollout
# Day 1: Set VERCEL_AI_ROLLOUT_PERCENTAGE=1  (1% of users)
# Day 3: Set VERCEL_AI_ROLLOUT_PERCENTAGE=10 (10% of users)
# Day 7: Set VERCEL_AI_ROLLOUT_PERCENTAGE=50 (50% of users)
# Day 14: Set VERCEL_AI_ROLLOUT_PERCENTAGE=100 (all users)

# 7. Monitor during rollout
# Check /api/ai/monitoring for costs and errors

# 8. Full rollout when stable
# Set NEXT_PUBLIC_ENABLE_VERCEL_AI=true
# Set VERCEL_AI_ROLLOUT_PERCENTAGE=100
```

---

## 🔒 **Safety Guarantees**

### ✅ What This Prevents

1. **Accidental Production Deployment**: Code can be merged to `main` without affecting users
2. **All-or-Nothing Risk**: Gradual rollout lets you test with 1% before 100%
3. **Rollback Complexity**: Just set feature flag to `false` - instant rollback
4. **Monitoring Blindness**: Track costs and errors before full rollout
5. **Team Conflicts**: Separate team works on feature branch, you control production

### ✅ What You Get

1. **Preview Deployments**: Each branch gets its own URL for testing
2. **Feature Flags**: Code in production but disabled until ready
3. **Gradual Rollout**: Test with 1%, 10%, 50%, then 100% of users
4. **Beta Testing**: Enable for specific organizations first
5. **Instant Rollback**: Set flag to `false` if issues arise
6. **Cost Monitoring**: Track spending during rollout

---

## 📊 **Monitoring During Rollout**

### Check AI Service Usage

```typescript
// In admin dashboard or monitoring tool
import { vercelAIService } from '@/lib/ai/vercel-ai-service';

const stats = vercelAIService.getUsageStats();

console.log('Rollout Metrics:');
console.log(`Total Requests: ${stats.totalRequests}`);
console.log(`Cost: $${stats.estimatedCost.toFixed(2)}`);
console.log(`By Provider:`, stats.byProvider);
console.log(`By Task Type:`, stats.byTaskType);

// Alert if costs spike
if (stats.averageCostPerRequest > 0.02) {
  console.warn('⚠️ Cost per request higher than expected!');
  // Consider reducing rollout percentage
}
```

### API Endpoint for Monitoring

```bash
# Check rollout status
curl https://your-domain.com/api/ai/monitoring

# Response includes:
# - Total requests
# - Cost breakdown by provider
# - Rollout percentage
# - Recommendations
```

---

## 🎯 **Rollout Checklist**

### Phase 1: Preview Testing
- [ ] Feature branch created
- [ ] Preview deployment working
- [ ] Feature flag enabled in preview
- [ ] Tests passing on preview
- [ ] Costs monitored on preview

### Phase 2: Merge to Production (Disabled)
- [ ] PR created and reviewed
- [ ] Tests passing in CI/CD
- [ ] Merged to main
- [ ] Feature flag DISABLED in production
- [ ] Production build successful
- [ ] No user impact (feature disabled)

### Phase 3: Beta Testing
- [ ] Beta orgs added to allowlist
- [ ] Beta users testing successfully
- [ ] No errors in logs
- [ ] Costs within expected range
- [ ] Performance acceptable

### Phase 4: Gradual Rollout
- [ ] Day 1: 1% rollout → Monitor 24h
- [ ] Day 3: 10% rollout → Monitor 48h
- [ ] Day 7: 50% rollout → Monitor 72h
- [ ] Day 14: 100% rollout → Monitor 1 week

### Phase 5: Full Release
- [ ] Feature flag set to 100%
- [ ] All users on new service
- [ ] Costs stable and optimized
- [ ] No errors or regressions
- [ ] Team trained on new system

---

## 🚨 **Emergency Rollback**

If issues arise during rollout:

```bash
# Option 1: Disable feature completely
# In Vercel Dashboard:
NEXT_PUBLIC_ENABLE_VERCEL_AI=false

# Option 2: Reduce rollout percentage
NEXT_PUBLIC_VERCEL_AI_ROLLOUT_PERCENTAGE=0

# Option 3: Revert to specific orgs only
NEXT_PUBLIC_VERCEL_AI_BETA_ORGS=org_safe_123

# Changes take effect in ~1 minute (Vercel redeploy)
```

---

## 📁 **Files to Create**

1. **`src/lib/feature-flags.ts`** - Feature flag system
2. **`src/lib/ai/service-router.ts`** - Smart router between old/new AI
3. **`SAFE_DEPLOYMENT_GUIDE.md`** - This document
4. **`.env.example`** - Update with new variables

---

## 💡 **Best Practices**

### DO ✅
- Use feature branches for development
- Test on preview deployments
- Use feature flags for production
- Monitor costs during rollout
- Gradual rollout (1% → 100%)
- Document rollout plan

### DON'T ❌
- Push directly to main
- Enable features at 100% immediately
- Skip monitoring during rollout
- Deploy without feature flags
- Forget to set preview environment variables

---

## 🎉 **Summary**

**Your Team Can Now:**
1. Work safely on `feature/vercel-ai-integration` branch
2. Test on automatic preview deployments
3. Merge to `main` without affecting production
4. Enable gradually with feature flags
5. Rollback instantly if needed

**You Maintain Control:**
1. Feature disabled in production by default
2. Enable for beta orgs first
3. Gradual rollout (1% → 100%)
4. Monitor costs before full release
5. Instant rollback capability

**Result:**
- ✅ Zero risk to production
- ✅ Full testing capability
- ✅ Team collaboration enabled
- ✅ Cost monitoring before rollout
- ✅ Gradual, safe deployment

---

## 📞 **Quick Reference**

### Environment Variables

| Variable | Production | Preview | Description |
|----------|-----------|---------|-------------|
| `NEXT_PUBLIC_ENABLE_VERCEL_AI` | `false` | `true` | Master switch |
| `NEXT_PUBLIC_VERCEL_AI_ROLLOUT_PERCENTAGE` | `0` → `100` | `100` | Gradual rollout |
| `NEXT_PUBLIC_VERCEL_AI_BETA_ORGS` | `org_id1,org_id2` | `` | Beta testing |

### Git Workflow

```bash
# Development team
git checkout -b feature/vercel-ai-integration
git push origin feature/vercel-ai-integration
# → Preview deployment created

# Production team (when ready)
gh pr merge
# → Merged but disabled in production

# Enable gradually
# Set VERCEL_AI_ROLLOUT_PERCENTAGE: 1 → 10 → 50 → 100
```

---

**🛡️ Safe deployment, happy team, zero production risk!**
