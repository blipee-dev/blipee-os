# 🚀 Team Quick Start - Vercel AI Integration

## For the Development Team

You can now safely work on the Vercel AI SDK integration without affecting production!

---

## ⚡ **Quick Setup (5 minutes)**

### 1. Create Your Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/vercel-ai-integration
git push -u origin feature/vercel-ai-integration
```

**What Happens:**
- ✅ Vercel automatically creates a preview deployment
- ✅ You get a unique URL: `https://blipee-os-git-feature-*.vercel.app`
- ✅ Production is NOT affected

### 2. Configure Environment (Vercel Dashboard)

Go to: **Vercel Dashboard → blipee-os → Settings → Environment Variables**

Add these for **Preview** environment only:

```bash
NEXT_PUBLIC_ENABLE_VERCEL_AI=true
NEXT_PUBLIC_VERCEL_AI_ROLLOUT_PERCENTAGE=100
```

### 3. Test Locally

```bash
# Copy example env
cp .env.example .env.local

# Add your keys
# Edit .env.local and set:
NEXT_PUBLIC_ENABLE_VERCEL_AI=true
NEXT_PUBLIC_VERCEL_AI_ROLLOUT_PERCENTAGE=100

DEEPSEEK_API_KEY=your_key
OPENAI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key

# Run tests
node test-vercel-ai-integration.mjs
node test-smart-routing.mjs

# Start dev server
npm run dev
```

---

## 🛠️ **Development Workflow**

### Daily Work

```bash
# 1. Make changes
vim src/lib/ai/vercel-ai-service.ts

# 2. Test locally
npm run dev
# Visit: http://localhost:3000

# 3. Push to feature branch
git add .
git commit -m "feat: improve routing logic"
git push origin feature/vercel-ai-integration

# 4. Test on preview deployment
# Visit your preview URL (Vercel will comment on PR with link)

# 5. Monitor costs
curl https://your-preview-url.vercel.app/api/ai/monitoring
```

### Creating a Pull Request

```bash
# When ready for review
gh pr create \
  --title "Add Vercel AI SDK Integration" \
  --body "Adds smart provider routing with 65% cost savings. See SMART_ROUTING_SUMMARY.md for details."

# Or use GitHub web interface
```

---

## 🎯 **What You Can Modify**

### Safe to Change
✅ `src/lib/ai/vercel-ai-service.ts` - Core routing logic
✅ `src/lib/ai/autonomous-agents/tools/agent-tools.ts` - Add more tools
✅ `src/lib/ai/autonomous-agents/enhanced-agent-executor.ts` - Agent improvements
✅ Test files (`test-*.mjs`)
✅ Documentation

### DON'T Modify (Production Impact)
❌ `src/lib/ai/service.ts` - Legacy service (still in use)
❌ `src/lib/feature-flags.ts` - Feature flag logic (needs review)
❌ Production environment variables
❌ Main branch directly

---

## 📊 **Testing Checklist**

Before creating PR, ensure:

- [ ] All tests pass locally
  ```bash
  node test-vercel-ai-integration.mjs
  node test-smart-routing.mjs
  npm run type-check
  ```

- [ ] Preview deployment works
  - [ ] Visit preview URL
  - [ ] Test AI queries
  - [ ] Check `/api/ai/monitoring` endpoint

- [ ] Costs are reasonable
  - [ ] Check monitoring API
  - [ ] Verify DeepSeek used for conversational
  - [ ] Verify OpenAI used for structured

- [ ] No errors in console
  - [ ] Check browser console
  - [ ] Check Vercel logs

---

## 🔍 **Monitoring Your Changes**

### Check Routing Status

```bash
# On preview deployment
curl https://your-preview-url.vercel.app/api/ai/monitoring
```

**Expected Response:**
```json
{
  "providers": {
    "routing": {
      "conversational": "DeepSeek",
      "structured": "OpenAI",
      "tool_calling": "OpenAI"
    }
  },
  "usage": {
    "totalRequests": 10,
    "estimatedCost": 0.15,
    "byProvider": {
      "DeepSeek": 6,
      "OpenAI": 4
    }
  }
}
```

### Test Smart Routing

```bash
# Test conversational (should use DeepSeek)
curl -X POST https://your-preview-url.vercel.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Analyze our emissions trends"}'
# Check logs: should say "Routing to DeepSeek"

# Test structured output (should use OpenAI)
curl -X POST https://your-preview-url.vercel.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Create a carbon reduction target", "structuredOutput": true}'
# Check logs: should say "Routing to OpenAI"
```

---

## 💡 **Tips & Best Practices**

### DO ✅
- Commit often with clear messages
- Test on preview before creating PR
- Monitor costs using `/api/ai/monitoring`
- Ask questions in team chat
- Document your changes
- Run type-check before pushing

### DON'T ❌
- Push directly to `main` branch
- Modify production environment variables
- Skip testing on preview
- Ignore TypeScript errors
- Forget to monitor costs

---

## 🚨 **If Something Goes Wrong**

### Preview Deployment Failed

```bash
# Check Vercel dashboard for build logs
# Common issues:
# - TypeScript errors → Run npm run type-check
# - Missing dependencies → Run npm install
# - Environment variables → Check Vercel settings
```

### Costs Too High

```bash
# Check which provider is being used
curl https://your-preview-url.vercel.app/api/ai/monitoring

# If seeing too much OpenAI:
# - Verify DeepSeek API key is set
# - Check routing logic in vercel-ai-service.ts
# - Ensure conversational queries don't have schemas
```

### Tests Failing

```bash
# Run tests with debug output
NODE_ENV=development node test-vercel-ai-integration.mjs

# Check:
# - API keys are set in .env.local
# - DeepSeek, OpenAI, or Anthropic is configured
# - No rate limiting (wait 1 min and retry)
```

---

## 📞 **Getting Help**

### Resources
1. **`VERCEL_AI_SDK_INTEGRATION.md`** - Full integration guide
2. **`SMART_ROUTING_SUMMARY.md`** - Architecture details
3. **`SAFE_DEPLOYMENT_GUIDE.md`** - Deployment workflow
4. **Test scripts** - Run to see expected behavior

### Team Contacts
- **Production Owner**: (Your name/contact)
- **AI Team Lead**: (Team lead contact)
- **DevOps**: (DevOps contact)

### Quick Commands

```bash
# See all available providers
curl https://your-preview-url.vercel.app/api/ai/monitoring | jq '.providers'

# Check routing decisions
# (Look for "Smart routing:" in Vercel logs)

# Reset usage stats
curl -X POST https://your-preview-url.vercel.app/api/ai/monitoring \
  -H "Content-Type: application/json" \
  -d '{"action": "reset"}'
```

---

## ✅ **Success Criteria**

Your PR will be approved when:

1. ✅ All tests pass on preview
2. ✅ TypeScript has no errors
3. ✅ Smart routing works correctly
   - Conversational → DeepSeek
   - Structured → OpenAI
4. ✅ Costs are within budget (~$0.016/request average)
5. ✅ No errors in production logs
6. ✅ Documentation is updated

---

## 🎉 **You're Ready!**

Everything is set up for safe, collaborative development:

- ✅ Feature branch created
- ✅ Preview deployments enabled
- ✅ Feature flags configured
- ✅ Monitoring in place
- ✅ Tests available

**Start coding and push without fear!** 🚀

Production is protected by:
- Feature flags (disabled by default)
- Separate branches (feature vs main)
- Preview deployments (test before merge)
- Gradual rollout (1% → 100%)

---

**Questions? Check the docs or ask the team!**
