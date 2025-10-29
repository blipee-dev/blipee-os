# Energy Dashboard Consolidation - Next Steps

## What Was Fixed

### 1. Intensity Data Structure ✅
**Issue:** Adapter was returning wrong structure (`intensity_kwh_per_sqm` instead of `perSquareMeter` object)

**Fixed:** Now returns proper structure matching old API:
- `perSquareMeter`: Calculated from total consumption / total area
- `perEmployee`: Set to 0 (needs org metadata - TODO)
- `perRevenue`: Set to 0 (needs org metadata - TODO)
- `perProduction`: Set to 0

### 2. Forecast Data Structure ⚠️
**Issue:** Old API returns monthly forecast array, consolidated API only has annual totals

**Partial Fix:** Returns compatible structure with:
- Empty monthly array (component may handle gracefully)
- Annual `yearProjection` with full year totals
- Metadata fields populated

**Limitation:** Monthly forecast charts may not render. Annual summary should work.

### 3. Added Diagnostic Logging
**Added:** Comprehensive console logging to track:
- API fetch calls (`🚀 [CONSOLIDATED API]`)
- Successful responses (`✅ [CONSOLIDATED API]`)
- Data transformation (`📊 [ADAPTER]`)
- Hook lifecycle (`🔍 [CONSOLIDATED API]`)

---

## Verification Steps

### Step 1: Check Browser Console
Open the Energy Dashboard and check the browser console for:

```
🔍 [CONSOLIDATED API] Hook called, enabled: true, orgId: xxx
🚀 [CONSOLIDATED API] Fetching: /api/dashboard/energy?organizationId=xxx&start_date=2025-01-01&end_date=2025-12-31
✅ [CONSOLIDATED API] Success - API call completed
📊 [ADAPTER] Transforming consolidated data: {
  hasCurrentData: true,
  hasPreviousData: true,
  hasBaselineData: true,
  hasForecastData: true,
  hasTargetsData: true,
  siteCount: 3,
  currentConsumption: 123456,
  intensityCalculated: 45.6
}
```

### Step 2: Check Network Tab
1. Open DevTools → Network tab
2. Refresh the Energy Dashboard page
3. Filter by "dashboard"
4. You should see **only 1 call** to `/api/dashboard/energy`
5. Check the response to see the data structure

### Step 3: Verify Data Display
Check that the dashboard shows:
- ✅ Total consumption (current period)
- ✅ Year-over-year comparison
- ✅ Intensity (kWh/m²)
- ✅ Site comparison table
- ✅ Target progress
- ⚠️ Monthly forecast (may be empty/missing)
- ⚠️ Per-employee metrics (will show 0)

---

## Known Limitations (Current Implementation)

### 1. Monthly Forecast Not Available
**Impact:** Forecast charts may be empty or missing
**Workaround:** Annual projection is available in `forecast.data.yearProjection`
**Fix Required:** Update consolidated API to include monthly breakdown

### 2. Per-Employee Intensity = 0
**Impact:** kWh/FTE metric shows 0
**Reason:** Organization metadata (total_employees) not included in consolidated API
**Fix Required:** Add org metadata to API response

### 3. Per-Revenue Intensity = 0
**Impact:** MWh/$M metric shows 0
**Reason:** Organization metadata (annual_revenue) not included in consolidated API
**Fix Required:** Add org metadata to API response

### 4. Category-Level Targets Empty
**Impact:** Per-category target tracking may not work
**Reason:** Consolidated API doesn't fetch category targets
**Fix Required:** Add category targets to API response

---

## Quick Rollback (If Needed)

If the dashboard is broken, revert the import in `EnergyDashboard.tsx`:

```typescript
// Replace lines 5-8:
import {
  useEnergyDashboard,
  useEnergySiteComparison,
} from '@/hooks/useDashboardData';
```

This will switch back to the old 12+ API calls approach, but everything will work as before.

---

## Next Actions

### Option A: Production-Ready Release (Quick)
1. Document the limitations above
2. Set `staleTime: 5 * 60 * 1000` (5 min cache)
3. Remove temporary console logs
4. Deploy with current functionality
5. Address TODOs in Phase 2

**Pros:**
- ✅ 12x fewer API calls (huge win!)
- ✅ Core metrics working
- ✅ Can deploy today

**Cons:**
- ❌ Some metrics show 0
- ❌ Monthly forecasts missing

### Option B: Complete Implementation (Thorough)
1. Update consolidated API to include:
   - Organization metadata (employees, revenue)
   - Monthly forecast breakdown
   - Category-level targets
2. Update adapter to use new fields
3. Full testing of all metrics
4. Deploy

**Pros:**
- ✅ Feature parity with old implementation
- ✅ All metrics working

**Cons:**
- ⏱️ More development time
- ⏱️ More testing required

---

## Recommended: Option A + Phase 2

**Phase 1 (Now):**
- Deploy with current fixes
- 12x API call reduction is massive win
- Core functionality working
- Document known limitations

**Phase 2 (Next Sprint):**
- Add org metadata to API
- Add monthly forecast
- Add category targets
- Remove all TODOs

**Why:**
- Getting 90% of the benefit now
- Safer to deploy incrementally
- Can gather real-world feedback
- Reduces risk

---

## Performance Metrics

Expected improvements:
- **API Calls:** 12+ → 1 (12x fewer)
- **Load Time:** 3-5s → 0.3-0.5s (10x faster)
- **DB Queries:** ~15 → ~3 (5x fewer)
- **Network Overhead:** 95% reduction

To measure actual performance:
```bash
npx tsx scripts/test-consolidated-api.ts
```

---

**Status:** Core consolidation complete, some metrics incomplete
**Recommendation:** Deploy Phase 1, complete Phase 2 next sprint
**Date:** 2025-01-29
