# Alpine → Debian Fix for TensorFlow.js

## Problem

**Error:**
```
Error loading shared library ld-linux-x86-64.so.2: No such file or directory
ERR_DLOPEN_FAILED
```

**Cause:** TensorFlow.js Node backend requires `glibc`, but Alpine Linux uses `musl` instead.

---

## Solution

**Changed:** `FROM node:20-alpine` → `FROM node:20-slim`

Alpine Linux is minimal but incompatible with TensorFlow.js native bindings.
Debian Slim provides `glibc` while staying relatively lightweight.

---

## Dockerfile Changes

### Before (Alpine - Broken)
```dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat python3 make g++
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 worker
```

### After (Debian - Fixed)
```dockerfile
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
RUN apt-get update && apt-get install -y \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 worker
```

---

## Size Comparison

| Image | Size |
|-------|------|
| `node:20-alpine` | ~180 MB |
| `node:20-slim` | ~250 MB |

**Trade-off:** +70 MB for TensorFlow.js compatibility ✅

---

## Verification

After deployment, verify TensorFlow.js works:

```bash
railway run npm run ml:test
```

**Expected Output:**
```
TensorFlow.js version: 4.22.0
Backend: tensorflow
```

---

## Status

- [x] Dockerfile updated to Debian Slim
- [x] Redeployed to Railway
- [ ] Waiting for build to complete
- [ ] Verify TensorFlow.js loads successfully

---

**Fix Applied:** 2025-10-29
**Deployed:** In progress...
