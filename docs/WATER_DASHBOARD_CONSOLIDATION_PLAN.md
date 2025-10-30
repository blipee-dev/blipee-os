# Water Dashboard Consolidation Plan

**Status:** Planning Phase
**Date:** 2025-10-29
**Goal:** Consolidate 8+ Water API calls into 1 unified endpoint

---

## 📊 CURRENT STATE ANALYSIS

### Current API Calls (8+ total)
```typescript
// In useWaterDashboard hook:
1. /api/water/sources (current period)
2. /api/water/sources (previous year - same period)
3. /api/water/sources (previous year - full year Jan-Dec)
4. /api/water/sources (baseline year)
5. /api/water/forecast
6. /api/sustainability/targets
7. /api/sustainability/targets/unified-water
8. + N calls for site comparison (useWaterSiteComparison)
```

### Data Dependencies
```
waterTarget depends on:
  ├── sources.data (current)
  ├── baselineData.data (baseline year)
  └── forecast.data (projected consumption)

metricTargets depends on:
  ├── organizationId
  ├── sustainabilityTargets.data (baseline_year)
  └── waterCategories (10 categories)
```

### Current Dashboard Metrics Used
```typescript
{
  // From sources.data (current period)
  waterSources: [],           // Array of water sources
  totalWithdrawal: number,    // Total water withdrawn
  totalConsumption: number,   // Total water consumed
  totalDischarge: number,     // Total water discharged
  totalRecycled: number,      // Total recycled water
  totalCost: number,          // Total water cost
  recyclingRate: number,      // % of water recycled
  monthlyTrends: [],          // Monthly breakdown
  waterIntensity: number,     // Consumption per area
  endUseBreakdown: [],        // Water use by type

  // From prevYearSources.data
  prevYearMonthlyTrends: [],

  // YoY Calculations
  yoyWithdrawalChange: number | null,
  yoyConsumptionChange: number | null,
  yoyDischargeChange: number | null,
  yoyRecyclingChange: number | null,

  // From forecast.data
  forecastData: {
    forecast: [],             // Monthly forecast
    lastActualMonth: string,
    model: string,
    confidence: number,
  } | null,

  // Derived
  projectedAnnualWithdrawal: number,
  forecastedWithdrawal: number,
  previousYearTotalWithdrawal: number,
}
```

---

## 🎯 TARGET STATE

### New Consolidated API: `/api/dashboard/water`

**Single API call returns:**
```typescript
{
  success: true,
  data: {
    current: {
      totalWithdrawal: number,
      totalConsumption: number,
      totalDischarge: number,
      totalRecycled: number,
      totalCost: number,
      recyclingRate: number,
      waterIntensity: number,
      sources: Array<{
        name: string,
        type: string,
        withdrawal: number,
        discharge: number,
        cost: number,
        isRecycled: boolean,
      }>,
      monthlyTrends: Array<{
        monthKey: string,
        month: string,
        withdrawal: number,
        consumption: number,
        discharge: number,
        recycled: number,
      }>,
      endUseBreakdown: Array<{
        name: string,
        consumption: number,
      }>,
      unit: string,
    },
    previous: {
      totalWithdrawal: number,
      totalConsumption: number,
      totalDischarge: number,
      totalRecycled: number,
      recyclingRate: number,
      sources: [...],
      monthlyTrends: [...],
      endUseBreakdown: [...],
      unit: string,
    },
    baseline: {
      totalWithdrawal: number,
      totalConsumption: number,
      sources: [...],
      monthlyTrends: [...],
      unit: string,
    },
    forecast: {
      value: number,              // Full year projection
      ytd: number,                // Year-to-date actual
      projected: number,          // Remaining forecast
      method: string,             // Forecast model used
      breakdown: Array<{
        month: string,
        withdrawal: number,
        consumption: number,
        discharge: number,
      }>,
    },
    targets: {
      baseline: number,
      target: number,
      projected: number,
      baselineYear: number,
      targetYear: number,
      progress: {
        progressPercent: number,
        status: string,
        reductionNeeded: number,
        reductionAchieved: number,
      },
    },
    sites: Array<{
      id: string,
      name: string,
      withdrawal: number,
      consumption: number,
      intensity: number,
      area: number,
      unit: string,
    }>,
  },
  meta: {
    period: { start: string, end: string },
    siteId: string,
    apiCalls: 1,
    cached: {
      targets: boolean,
      baseline: boolean,
      forecast: boolean,
    }
  }
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Backend API (1-2h)
- [ ] Create `/src/app/api/dashboard/water/route.ts`
- [ ] Implement `getWaterData()` helper function
  - [ ] Query metrics_data for water categories
  - [ ] Aggregate: withdrawal, consumption, discharge, recycled
  - [ ] Calculate recycling rate
  - [ ] Group by source type
  - [ ] Generate monthly trends
  - [ ] Generate end-use breakdown
- [ ] Implement `getPreviousYearWaterData()` helper
- [ ] Implement `getWaterSiteComparison()` helper
  - [ ] Fetch all sites in ONE query (no N+1!)
  - [ ] Calculate intensity per site
- [ ] Integrate with UnifiedSustainabilityCalculator
  - [ ] getBaseline('water', baselineYear)
  - [ ] getTarget('water')
  - [ ] getProjected('water')
  - [ ] calculateProgressToTarget('water')
- [ ] Implement parallel data fetching with Promise.all
- [ ] Add error handling and logging
- [ ] Test API manually

### Phase 2: Frontend Hooks (30min)
- [ ] Update `useConsolidatedDashboard.ts`
  - [ ] Define `ConsolidatedWaterData` interface
  - [ ] Implement `useConsolidatedWaterDashboard` hook
  - [ ] Implement `useWaterDashboardAdapter`
  - [ ] Implement `useWaterSiteComparisonAdapter`
- [ ] Test hooks with console logging

### Phase 3: Component Integration (10min)
- [ ] Update WaterDashboard.tsx imports
  - [ ] Change from `useDashboardData` to `useConsolidatedDashboard`
  - [ ] Alias: `useWaterDashboardAdapter as useWaterDashboard`
  - [ ] Alias: `useWaterSiteComparisonAdapter as useWaterSiteComparison`
- [ ] No other component changes needed (adapter pattern!)

### Phase 4: Testing (30min)
- [ ] Test API endpoint directly
- [ ] Test with different periods (YTD, full year, historical)
- [ ] Test with site filter
- [ ] Test without site filter (all sites)
- [ ] Verify all dashboard metrics display correctly
- [ ] Verify YoY comparisons
- [ ] Verify forecast data
- [ ] Verify target progress
- [ ] Verify site comparison chart
- [ ] Check browser console for errors
- [ ] Measure performance improvement
  - [ ] Network tab: API calls count
  - [ ] Network tab: Total loading time
  - [ ] Console: API timing logs

### Phase 5: Cleanup (10min)
- [ ] Remove old hook functions from useDashboardData.ts (optional)
- [ ] Update documentation
- [ ] Create performance comparison report

---

## 🚨 CRITICAL FEATURES TO PRESERVE

### Must-Have Data Fields
✅ Current period:
  - totalWithdrawal
  - totalConsumption
  - totalDischarge
  - totalRecycled
  - totalCost
  - recyclingRate
  - waterIntensity
  - sources[] (hierarchical)
  - monthlyTrends[]
  - endUseBreakdown[]

✅ Previous year (YoY):
  - Same structure as current
  - Full year data for projected YoY comparison

✅ Baseline year:
  - Same structure as current
  - Dynamic baseline year from sustainability_targets

✅ Forecast:
  - Monthly breakdown
  - YTD vs Projected
  - Full year projection

✅ Targets:
  - Baseline value
  - Target value
  - Projected value
  - Progress calculation
  - Status (on track, at risk, off track)

✅ Sites comparison:
  - All sites in one query
  - withdrawal, consumption, intensity per site
  - No N+1 queries!

### Database Tables Used
- `metrics_data` (main data source)
- `metrics_catalog` (metric definitions)
- `sustainability_targets` (baseline/target years)
- `sites` (site information)

### Water Categories (from metrics_catalog)
```typescript
const waterCategories = [
  'Water Consumption',
  'Water Withdrawal',
  'Water Discharge',
  'Water Recycling',
  'Water Reuse',
  'Rainwater Harvesting',
  'Groundwater',
  'Surface Water',
  'Municipal Water',
  'Wastewater',
];
```

---

## 📐 REFERENCE: Energy API Structure

Use `/src/app/api/dashboard/energy/route.ts` as template:
- Similar structure for water
- Parallel data fetching with Promise.all
- Cached targets
- Unified calculator integration
- Site comparison in single query

Key differences for Water:
- Different metric categories (water vs energy)
- Withdrawal/Discharge/Recycling vs Consumption only
- Different intensity calculation (m³/m² vs kWh/m²)
- Recycling rate specific to water

---

## ⏱️ ESTIMATED TIME

| Phase | Task | Time |
|-------|------|------|
| 1 | Backend API | 1-2h |
| 2 | Frontend Hooks | 30min |
| 3 | Component Integration | 10min |
| 4 | Testing | 30min |
| 5 | Cleanup | 10min |
| **TOTAL** | | **~3h** |

---

## ✅ SUCCESS CRITERIA

1. ✅ Single API call replaces 8+ calls
2. ✅ All dashboard metrics display correctly
3. ✅ YoY comparisons work
4. ✅ Forecast displays correctly
5. ✅ Target progress calculates correctly
6. ✅ Site comparison works (no N+1)
7. ✅ Loading time < 1 second
8. ✅ No console errors
9. ✅ No visual regressions

---

## 🔄 ROLLBACK PLAN

If issues arise:
1. Revert WaterDashboard.tsx import changes
2. Change back to original hooks
3. Keep new API for future use
4. Investigate and fix issues
5. Re-deploy when ready

---

**Ready to proceed with implementation?**
