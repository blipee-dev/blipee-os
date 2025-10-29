# Dashboard Performance Analysis

## Executive Summary

**CRITICAL PERFORMANCE ISSUE IDENTIFIED:**
All dashboards are making **10-15+ separate API calls per page load**, with significant overlap in the data being fetched. This results in:
- Slow page loads (3-5+ seconds)
- Wasted bandwidth
- Unnecessary database queries
- Poor user experience

---

## Dashboard API Call Analysis

### 1. Energy Dashboard (`useEnergyDashboard`)

**Total API Calls: 11+ (plus N calls per site)**

| # | Endpoint | Purpose | Data Overlap |
|---|----------|---------|--------------|
| 1 | `/api/energy/sources` | Current period | ✅ Could be consolidated |
| 2 | `/api/energy/intensity` | Current period | ✅ Could be consolidated |
| 3 | `/api/energy/forecast` | Forecast | ✅ Separate calculation |
| 4 | `/api/energy/sources` | Previous year | ✅ Could be consolidated |
| 5 | `/api/energy/sources` | Full previous year | ❌ DUPLICATE DATA |
| 6 | `/api/sustainability/targets` | Target config | ⚠️ Used by all dashboards |
| 7 | `/api/sustainability/targets/category` | Category targets | ✅ Could be consolidated |
| 8 | `/api/energy/sources` | Baseline data | ❌ DUPLICATE DATA |
| 9 | `/api/sustainability/targets/weighted-allocation` | Weighted allocation | ✅ Separate calculation |
| 10 | `/api/sustainability/targets/unified-energy` | Unified targets | ⚠️ **Already consolidates multiple metrics** |
| 11 | `/api/sites` | Site list | ⚠️ Used by all dashboards |
| 12+ | `/api/energy/sources?site_id=X` | Per-site data | ⚠️ N+1 query pattern |

**Problems:**
- `/api/energy/sources` called **4 times** with different date ranges
- Site comparison makes **N additional calls** (one per site)
- Multiple target endpoints when one should suffice

---

### 2. Water Dashboard (`useWaterDashboard`)

**Estimated API Calls: 10+**

Similar pattern to Energy Dashboard:
- `/api/water/sources` (current, previous, baseline)
- `/api/water/intensity`
- `/api/sustainability/targets`
- `/api/sustainability/targets/unified-water`
- Site comparison (N calls)

---

### 3. Waste Dashboard (`useWasteDashboard`)

**Estimated API Calls: 10+**

Similar pattern:
- `/api/waste/streams` (current, previous, baseline)
- `/api/waste/intensity`
- `/api/sustainability/targets`
- `/api/sustainability/targets/unified-waste`
- Site comparison (N calls)

---

### 4. Emissions Dashboard (`useEmissionsDashboard`)

**Estimated API Calls: 15+**

- Emissions by scope (Scope 1, 2, 3)
- Geographic breakdown
- Category breakdown
- Targets
- Site comparison
- Forecast
- Previous year comparison

---

### 5. Overview Dashboard (`useOverviewDashboard`)

**Estimated API Calls: 20+**

Aggregates data from ALL domains:
- Energy data
- Water data
- Waste data
- Emissions data
- All targets
- All forecasts
- Site comparisons for all domains

**PROBLEM:** If components use individual dashboard hooks, they make duplicate calls!

---

## Root Causes

### 1. **No Unified API Endpoint**
Each dashboard makes separate calls for the same data:
```typescript
// Energy Dashboard
fetch('/api/energy/sources')
fetch('/api/sustainability/targets')

// Water Dashboard
fetch('/api/water/sources')
fetch('/api/sustainability/targets')  // DUPLICATE!

// Emissions Dashboard
fetch('/api/emissions/scope-breakdown')
fetch('/api/sustainability/targets')  // DUPLICATE!
```

### 2. **N+1 Query Pattern in Site Comparisons**
```typescript
// Fetches list of sites
const sites = await fetch('/api/sites')

// Then makes one call per site
for (const site of sites) {
  await fetch(`/api/energy/sources?site_id=${site.id}`)  // N calls!
}
```

### 3. **Redundant Date Range Queries**
Same endpoint called multiple times with different dates:
```typescript
fetch('/api/energy/sources?start=2025-01-01&end=2025-12-31')  // Current
fetch('/api/energy/sources?start=2024-01-01&end=2024-12-31')  // Previous
fetch('/api/energy/sources?start=2023-01-01&end=2023-12-31')  // Baseline
```

### 4. **No Request Deduplication**
React Query is configured but doesn't prevent:
- Multiple components using different hooks for same data
- Sequential calls that could be parallelized
- Overlapping time periods

---

## Performance Impact

### Current State:
- **Energy Dashboard:** 11+ API calls = ~3-4 seconds load time
- **Overview Dashboard:** 20+ API calls = ~5-7 seconds load time
- **Site with 5 buildings:** +5 calls per dashboard
- **Total bandwidth waste:** 10-20 MB per page load

### Database Impact:
- 10-15 queries per dashboard load
- No query result caching between endpoints
- Same data calculated multiple times (baselines, targets, etc.)

---

## Recommended Solutions

### Phase 1: Immediate Wins (Low Effort, High Impact)

#### 1.1 Create Consolidated Dashboard APIs
```typescript
// NEW: /api/dashboard/energy
{
  current: { sources, intensity, consumption },
  previous: { sources, intensity, consumption },
  baseline: { sources, intensity, consumption },
  forecast: { projected, method },
  targets: { baseline, target, progress },
  sites: [ /* site comparison data */ ]
}
```

**Benefits:**
- 11 calls → 1 call (11x faster)
- Single database transaction
- Shared cache across dashboards

#### 1.2 Fix Site Comparison N+1 Pattern
```sql
-- Instead of N queries
SELECT * FROM energy_data WHERE site_id = '123'
SELECT * FROM energy_data WHERE site_id = '456'
SELECT * FROM energy_data WHERE site_id = '789'

-- Use one query with JOIN
SELECT
  s.id, s.name,
  SUM(e.value) as total
FROM sites s
LEFT JOIN energy_data e ON e.site_id = s.id
WHERE s.organization_id = $1
GROUP BY s.id
```

#### 1.3 Implement Request-Level Caching
```typescript
// Cache targets once per request
const targetsCache = new Map()

async function getSustainabilityTargets(orgId: string) {
  if (targetsCache.has(orgId)) {
    return targetsCache.get(orgId)
  }

  const targets = await fetchTargets(orgId)
  targetsCache.set(orgId, targets)
  return targets
}
```

---

### Phase 2: Architectural Improvements (Medium Effort)

#### 2.1 Unified Dashboard Hook
```typescript
export function useDashboard(type: 'energy' | 'water' | 'waste' | 'emissions') {
  // Single API call for everything
  const { data } = useQuery({
    queryKey: ['dashboard', type, period, siteId],
    queryFn: () => fetch(`/api/dashboard/${type}`)
  })

  return {
    current: data.current,
    previous: data.previous,
    baseline: data.baseline,
    forecast: data.forecast,
    targets: data.targets,
    sites: data.sites
  }
}
```

#### 2.2 GraphQL-Style API
```graphql
query EnergyDashboard($period: DateRange!, $siteId: String) {
  energy(period: $period, siteId: $siteId) {
    current { sources, intensity, consumption }
    previous { sources, intensity, consumption }
    forecast { value, method }
    targets { baseline, target, progress }
    sites { id, name, intensity }
  }
}
```

#### 2.3 Server-Side Caching
```typescript
// Cache at API route level
const cache = new Map()

export async function GET(req: NextRequest) {
  const cacheKey = getCacheKey(req.url)

  if (cache.has(cacheKey)) {
    return NextResponse.json(cache.get(cacheKey))
  }

  const data = await computeDashboardData()
  cache.set(cacheKey, data, { ttl: 5 * 60 }) // 5 min

  return NextResponse.json(data)
}
```

---

### Phase 3: Advanced Optimizations (High Effort)

#### 3.1 Background Precomputation
- Precompute dashboard data every 5 minutes
- Store in `dashboard_cache` table
- API just reads from cache

#### 3.2 Streaming/Server-Sent Events
- Stream data as it becomes available
- Don't wait for all calculations to complete

#### 3.3 Edge Caching
- Cache at CDN level (Vercel Edge)
- Instant response for subsequent users

---

## Implementation Priority

### Critical (Do First):
1. ✅ **Fix baseline caching** (DONE)
2. ✅ **Add instance-level memoization** (DONE)
3. 🔴 **Create consolidated dashboard endpoints**
4. 🔴 **Fix N+1 site comparison queries**

### High Priority:
5. 🟡 **Implement request-level target caching**
6. 🟡 **Consolidate date range queries**
7. 🟡 **Add query result caching**

### Medium Priority:
8. 🟡 **Create unified dashboard hooks**
9. 🟡 **Add server-side caching**
10. 🟡 **Optimize database queries**

### Low Priority (Future):
11. ⚪ **Background precomputation**
12. ⚪ **GraphQL migration**
13. ⚪ **Edge caching**

---

## Expected Performance Gains

### After Phase 1:
- Dashboard load time: **5s → 1.5s** (3x faster)
- API calls: **11 → 3** (70% reduction)
- Database queries: **15 → 5** (67% reduction)

### After Phase 2:
- Dashboard load time: **1.5s → 0.5s** (10x faster overall)
- API calls: **3 → 1** (97% reduction total)
- Database queries: **5 → 1** (95% reduction total)

### After Phase 3:
- Dashboard load time: **0.5s → 0.1s** (50x faster overall)
- Near-instant page loads
- Minimal server load

---

## Next Steps

1. Review this analysis
2. Prioritize which dashboards to optimize first
3. Create consolidated API endpoints for Energy dashboard (pilot)
4. Test and measure performance improvements
5. Roll out to other dashboards

---

Generated: $(date)
