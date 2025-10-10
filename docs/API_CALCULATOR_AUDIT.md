# API Calculator Usage Audit

## Problem

We created a comprehensive calculator with 22 functions covering:
- Emissions (total, baseline, period, yearly)
- Scopes (1, 2, 3 breakdown)
- Categories (21 GHG categories)
- Individual metrics (95 metrics)
- Energy, water, waste totals
- Intensity metrics
- YoY comparisons
- Top sources
- Projections

**BUT**: Only 3 out of 30 APIs are using it!

## APIs Using Calculator ✅

1. `/api/sustainability/baseline` - Uses `getBaselineEmissions()`
2. `/api/sustainability/targets` - Uses `getBaselineEmissions()`
3. `/api/sustainability/dashboard` - Uses some calculator functions (partial)

## APIs NOT Using Calculator ❌

These APIs are doing MANUAL calculations and will give INCONSISTENT values:

### Critical APIs (High Priority)

1. **`/api/sustainability/scope-analysis`** ⚠️ CRITICAL
   - Manually calculates emissions: `(record.co2e_emissions || 0) / 1000`
   - Does NOT use scope-by-scope rounding
   - Returns 303.5 instead of 303.6
   - **Status**: Being updated now

2. **`/api/sustainability/emissions`**
   - Likely doing manual calculations
   - Need to check and update

3. **`/api/sustainability/emissions-detailed`**
   - Detailed emissions breakdown
   - Need to check and update

4. **`/api/sustainability/forecast`**
   - Forecast calculations
   - Should use `getProjectedAnnualEmissions()`

### Data APIs (Medium Priority)

5. `/api/sustainability/metrics/data`
6. `/api/sustainability/data`
7. `/api/sustainability/metrics/all`
8. `/api/sustainability/metrics/organization`
9. `/api/sustainability/metrics/sites`
10. `/api/sustainability/metrics/realtime`

### Target APIs (Already partially fixed)

11. `/api/sustainability/targets/current-emissions` - Should use calculator
12. `/api/sustainability/targets/pending-targets`
13. `/api/sustainability/targets/category`
14. `/api/sustainability/targets/weighted-allocation`

### Utility APIs (Low Priority)

15. `/api/sustainability/metrics/catalog` - Just catalog, no calculations
16. `/api/sustainability/data-comparison`
17. `/api/sustainability/extract-document`
18. `/api/sustainability/fix-month-shift`
19. `/api/sustainability/metrics-investigation`
20. `/api/sustainability/scenarios/simulate`
21. `/api/sustainability/scenarios/simulate-metrics`
22. `/api/sustainability/metrics/pending`
23. `/api/sustainability/metrics/energy-baseline` - Should use `getEnergyTotal()`
24. `/api/sustainability/targets/available-metrics`
25. `/api/sustainability/targets/settings`
26. `/api/sustainability/targets/auto-initialize`
27. `/api/sustainability/targets/cleanup-duplicates`
28. `/api/sustainability/tracked-categories`
29. `/api/sustainability/gri-sector-topics`

## What Needs to Happen

### Phase 1: Critical APIs ⚠️ URGENT

Update these 4 APIs immediately:

1. ✅ **scope-analysis** - Use calculator for ALL scope/category calculations
2. ❌ **emissions** - Use `getPeriodEmissions()`, `getScopeBreakdown()`, `getCategoryBreakdown()`
3. ❌ **emissions-detailed** - Use `getScopeCategoryBreakdown()`, `getCategoryMetrics()`
4. ❌ **forecast** - Use `getProjectedAnnualEmissions()`

### Phase 2: Data APIs

Update all data APIs to use:
- `getMetricValue()` for individual metrics
- `getCategoryMetrics()` for category data
- `getTopMetrics()` for rankings
- `getEnergyTotal()`, `getWaterTotal()`, `getWasteTotal()` for totals

### Phase 3: Dashboard API Enhancement

Current dashboard API uses calculator partially. Expand to use:
- `getIntensityMetrics()` for intensity calculations
- `getYoYComparison()` for all YoY comparisons
- `getTopEmissionSources()` for top sources section
- `getProjectedAnnualEmissions()` for projections

### Phase 4: Target APIs

Update target APIs to use calculator for:
- Current emissions calculations
- Category-specific targets
- Weighted allocation based on emissions

## Expected Outcome

After updating ALL APIs:

✅ **Consistency**: 303.6 tCO2e everywhere (not 303.5)
✅ **Single Source**: All calculations in one place
✅ **Maintainability**: Update logic once, applies everywhere
✅ **Accuracy**: Scope-by-scope rounding at every level
✅ **Type Safety**: TypeScript interfaces for all calculations

## Implementation Plan

### Step 1: Audit Each API
For each API, check:
- [ ] Does it calculate emissions? → Use `getPeriodEmissions()`
- [ ] Does it calculate scopes? → Use `getScopeBreakdown()`
- [ ] Does it calculate categories? → Use `getCategoryBreakdown()` or `getScopeCategoryBreakdown()`
- [ ] Does it calculate individual metrics? → Use `getMetricValue()` or `getCategoryMetrics()`
- [ ] Does it calculate energy/water/waste? → Use `getEnergyTotal()`, `getWaterTotal()`, `getWasteTotal()`
- [ ] Does it calculate intensity? → Use `getIntensityMetrics()`
- [ ] Does it calculate YoY? → Use `getYoYComparison()`
- [ ] Does it do projections? → Use `getProjectedAnnualEmissions()`

### Step 2: Replace Manual Calculations

❌ **NEVER DO THIS:**
```typescript
// BAD: Manual calculation
const total = data.reduce((sum, d) => sum + d.co2e_emissions, 0) / 1000;
```

✅ **ALWAYS DO THIS:**
```typescript
// GOOD: Use calculator
import { getPeriodEmissions } from '@/lib/sustainability/baseline-calculator';
const emissions = await getPeriodEmissions(organizationId, startDate, endDate);
const total = emissions.total; // 303.6 tCO2e
```

### Step 3: Remove Duplicate Code

Many APIs probably have duplicate calculation logic. Replace ALL of it with calculator functions.

### Step 4: Test Consistency

After updating, verify:
```bash
# All APIs should return 303.6 for 2023 baseline
curl /api/sustainability/baseline?year=2023
curl /api/sustainability/scope-analysis?year=2023
curl /api/sustainability/dashboard?year=2023
curl /api/sustainability/emissions?year=2023
```

All should show: `total: 303.6 tCO2e`

## Success Criteria

- [ ] All 30 APIs audited
- [ ] All manual calculations replaced with calculator functions
- [ ] All APIs return consistent values
- [ ] TypeScript compiles with no errors
- [ ] All dashboards show 303.6 tCO2e for 2023
- [ ] No more `/ 1000` or `.reduce()` for emissions in API code

## Current Status

- ✅ Calculator complete (22 functions)
- ✅ Documentation complete
- ⏳ API migration in progress
- ❌ Testing pending
- ❌ Component updates pending

## Next Actions

1. Complete scope-analysis API update (in progress)
2. Update emissions API
3. Update emissions-detailed API
4. Update forecast API
5. Update dashboard API (enhance with new functions)
6. Update all data APIs
7. Test all dashboards for consistency
8. Remove deprecated manual calculation functions
