# Forecast Data Fix - Complete Summary

## Issue
The dashboards were including Nov-Dec 2025 forecast data (stored in the database) in "actual" consumption and emissions totals, causing inflated values and double-counting.

## Root Cause
Multiple API endpoints were using `.lte('period_start', endDate)` or `.lte('period_end', endDate)` without checking if the end date extended into future months that have stored forecast data.

## All Fixes Applied

### 1. Date Filtering Pattern
Applied consistent date filtering across all endpoints to exclude future months:

```typescript
// Filter out future months - only include data through current month
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;
const maxHistoricalDate = new Date(currentYear, currentMonth, 0);
const requestedEndDate = new Date(endDate);

// Use the earlier of: requested end date OR current month end
const effectiveEndDate = requestedEndDate <= maxHistoricalDate
  ? endDate
  : maxHistoricalDate.toISOString().split('T')[0];

query = query.lte('period_start', effectiveEndDate);
```

### 2. Fixed API Endpoints

#### Energy Dashboard
- ✅ `/api/energy/sources/route.ts` (lines 177-193)
- ✅ `/api/energy/forecast/route.ts` (variable naming conflict fixed)

#### Water Dashboard
- ✅ `/api/water/sources/route.ts` (lines 177-193)
- ✅ `/api/water/forecast/route.ts` (variable naming conflict fixed)

#### Waste Dashboard
- ✅ `/api/waste/streams/route.ts` (lines 94-110)
- ✅ `/api/waste/forecast/route.ts` (variable naming conflict fixed)

#### Emissions & Overview Dashboards
- ✅ `/api/sustainability/data/route.ts` (lines 205-217)
- ✅ `/api/sustainability/dashboard/route.ts` (fetchAllMetricsData function)
- ✅ `/api/sustainability/scope-analysis/route.ts` (lines 137-156) **[FINAL FIX]**
- ✅ `/api/sustainability/forecast/route.ts` (variable naming conflict fixed)

#### Core Library
- ✅ `/lib/sustainability/baseline-calculator.ts` (fetchAllMetricsWithPagination, lines 48-64)
- ✅ `/lib/sustainability/baseline-calculator.ts` (getMonthlyEmissions, lines 547-569)

### 3. Cache Version Updates
Bumped cache version from v7 → v12 to force fresh API calls:
- ✅ `/lib/cache-persister.ts` (CACHE_VERSION = 12)

## Verified Database Values (as of Oct 18, 2025)

### Energy Data
- **Jan-Oct 2025 (Actual)**: 994,833 kWh
- **Nov-Dec 2025 (Forecast)**: 144,933 kWh
- **Projected Annual**: 1,139,766 kWh

### Emissions Data
- **Jan-Oct 2025 (Actual)**: 488.0 tCO2e
  - Scope 1: 0.0 tCO2e
  - Scope 2: 277.3 tCO2e
  - Scope 3: 210.7 tCO2e
- **Nov-Dec 2025 (Forecast)**: 114.3 tCO2e
- **Projected Annual**: 602.3 tCO2e

## Expected Dashboard Values After Refresh

### Energy Dashboard
- **Total Energy (Jan-Oct)**: 994,833 kWh
- **Forecasted Energy (Nov-Dec)**: 162,735 kWh (ML forecast)
- **Projected Annual**: 1,157,568 kWh

### Emissions Dashboard & Overview Dashboard
- **YTD Emissions**: 488.0 tCO2e
- **Forecasted Emissions (Nov-Dec)**: 114.3 tCO2e
- **Projected Annual**: 602.3 tCO2e

### SBTi Target Progress Section
- **Current (2025)**: 488.0 + 114.3 = 602.3 tCO2e (Actual + Forecast)
- **Progress bar** should show actual vs. baseline comparison
- **Values should match** the YTD and Projected Annual shown elsewhere

## What Changed in This Final Fix

The last issue was in the **SBTi Target Progress** section showing:
- ❌ Old: 427.7 tCO2e (60.3 tCO2e too low)
- ✅ New: 488.0 tCO2e (correct)

This was caused by `/api/sustainability/scope-analysis` endpoint still including Nov-Dec forecast data when calculating actuals. The fix applied the same date filtering pattern at lines 137-156.

## Next Steps

1. **Hard refresh the browser** (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows) to clear the cache
2. **Verify the following pages show correct values**:
   - Energy Dashboard: 994,833 kWh (Jan-Oct actual)
   - Water Dashboard: Correct actual values without Nov-Dec forecast
   - Waste Dashboard: Correct actual values without Nov-Dec forecast
   - Emissions Dashboard: 488.0 tCO2e (YTD), 602.3 tCO2e (Projected)
   - Overview Dashboard: 488.0 tCO2e (YTD), 602.3 tCO2e (Projected)
   - SBTi Target Progress: 488.0 + 114.3 tCO2e

## Technical Notes

- All endpoints now consistently filter out future months' stored forecast data
- Forecast data is still stored in the database (Nov-Dec 2025) but excluded from "actual" calculations
- ML-generated forecasts are fetched separately via `/api/[domain]/forecast` endpoints
- Cache persistence ensures changes require a hard refresh or cache version bump
- The baseline-calculator is the core library used by ALL dashboards for emissions calculations

## Files Modified Summary

### API Routes (9 files)
1. `/src/app/api/energy/sources/route.ts`
2. `/src/app/api/energy/forecast/route.ts`
3. `/src/app/api/water/sources/route.ts`
4. `/src/app/api/water/forecast/route.ts`
5. `/src/app/api/waste/streams/route.ts`
6. `/src/app/api/waste/forecast/route.ts`
7. `/src/app/api/sustainability/data/route.ts`
8. `/src/app/api/sustainability/dashboard/route.ts`
9. `/src/app/api/sustainability/scope-analysis/route.ts`

### Core Libraries (2 files)
10. `/src/lib/sustainability/baseline-calculator.ts`
11. `/src/lib/cache-persister.ts`

### Dashboard Components (debugging only, no functional changes)
12. `/src/components/dashboard/EnergyDashboard.tsx`
13. `/src/hooks/useDashboardData.ts`

Total: **13 files modified**

---

**Status**: ✅ All fixes applied, ready for testing after browser refresh
**Cache Version**: v12
**Date**: October 18, 2025
