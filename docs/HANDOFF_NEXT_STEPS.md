# Calculator Migration - Handoff & Next Steps

## 🎯 Current Status: 7/30 APIs Complete (23%)

### ✅ What We've Accomplished

Successfully migrated **7 critical APIs** to use the centralized baseline calculator:

1. **scope-analysis** - Main scope/category breakdown
2. **emissions** - Core emissions API
3. **emissions-detailed** - Comprehensive GHG reporting
4. **forecast** - Emissions forecasting
5. **dashboard** - Main dashboard (9 calculator functions!)
6. **energy-baseline** - Energy totals
7. **targets/current-emissions** - Target baseline emissions

**Impact**:
- ✅ **~790 lines** of manual calculations removed
- ✅ **10 functions** deprecated
- ✅ **Consistent 303.6 tCO2e** across all 7 APIs
- ✅ **Tested and verified** with comprehensive test suite

---

## 📋 Remaining Work: 23 APIs to Migrate

### High Priority (Next 5 APIs)

These APIs likely have manual calculations and should be updated next:

#### 1. `/api/sustainability/metrics/data`
- Check for manual aggregations
- Use `getCategoryMetrics()` or `getMetricValue()`

#### 2. `/api/sustainability/metrics/all`
- Check for emissions totals
- Use `getPeriodEmissions()`

#### 3. `/api/sustainability/targets/pending-targets`
- Check for target calculations
- Use `getPeriodEmissions()` for current emissions

#### 4. `/api/sustainability/targets/category`
- Check for category-specific emissions
- Use `getCategoryEmissions()` or `getScopeCategoryBreakdown()`

#### 5. `/api/sustainability/targets/weighted-allocation`
- Check for weighted calculations
- Use calculator for all emission values

### Medium Priority (Next 10 APIs)

#### Target APIs
- `/api/sustainability/targets/available-metrics`
- `/api/sustainability/targets/settings`
- `/api/sustainability/targets/auto-initialize`
- `/api/sustainability/targets/cleanup-duplicates`

#### Data/Metrics APIs
- `/api/sustainability/metrics/organization`
- `/api/sustainability/metrics/sites`
- `/api/sustainability/metrics/realtime`

#### Utility APIs
- `/api/sustainability/data-comparison`
- `/api/sustainability/metrics-investigation`
- `/api/sustainability/tracked-categories`

### Low Priority (Remaining 8 APIs)

These may not need calculations or are less critical:

- `/api/sustainability/scenarios/simulate`
- `/api/sustainability/scenarios/simulate-metrics`
- `/api/sustainability/extract-document`
- `/api/sustainability/fix-month-shift`
- `/api/sustainability/metrics/pending`
- `/api/sustainability/metrics/catalog` (no calculations)
- `/api/sustainability/gri-sector-topics`
- `/api/sustainability/data`

---

## 🔧 Migration Pattern (Copy-Paste Guide)

### Step 1: Search for Manual Calculations

```bash
# Find manual calculations in an API
grep -n "reduce(" src/app/api/sustainability/YOUR_API/route.ts
grep -n "/ 1000" src/app/api/sustainability/YOUR_API/route.ts
grep -n "co2e_emissions" src/app/api/sustainability/YOUR_API/route.ts
```

### Step 2: Import Calculator Functions

```typescript
// At the top of the file
import {
  getPeriodEmissions,
  getScopeBreakdown,
  getCategoryBreakdown,
  getMonthlyEmissions,
  getYoYComparison,
  getIntensityMetrics,
  getEnergyTotal,
  getWaterTotal,
  getWasteTotal
} from '@/lib/sustainability/baseline-calculator';
```

### Step 3: Replace Manual Calculations

**❌ WRONG (Manual)**:
```typescript
const total = data.reduce((sum, d) => sum + d.co2e_emissions, 0) / 1000;
// Gives 303.5 ❌
```

**✅ CORRECT (Calculator)**:
```typescript
const emissions = await getPeriodEmissions(orgId, startDate, endDate);
const total = emissions.total;
// Gives 303.6 ✅
```

### Step 4: Mark Deprecated Functions

```typescript
/**
 * @deprecated Use getPeriodEmissions() from calculator instead
 * This function does manual calculations and gives inconsistent results
 */
function oldCalculationFunction(data: any[]) {
  // Old code stays but is marked
}
```

### Step 5: Test the API

```bash
# Run the direct calculator test
./run-calculator-test.sh

# Or check the API manually for 2023
# Should return 303.6 tCO2e, not 303.5
```

### Step 6: Update Documentation

Update `docs/API_MIGRATION_PROGRESS.md`:
- Increment completed count
- Add API to completed section
- Update metrics (lines changed, functions deprecated)

---

## 🧪 Testing Strategy

### Quick Test (Per API)

```bash
# Test a specific API returns 303.6 for 2023
curl -X GET "http://localhost:3003/api/sustainability/YOUR_API?year=2023" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Should see: "total": 303.6 (not 303.5!)
```

### Comprehensive Test

```bash
# Run the full calculator test suite
./run-calculator-test.sh
```

Expected output:
```
✅ PASS: Got 303.6 tCO2e
✅ Scopes add up correctly: 303.6 = 303.6
✅ Categories total 303.6 tCO2e
```

---

## 📊 Calculator Functions Available

### Core Emissions
- `getPeriodEmissions(orgId, start, end)` → Total for period
- `getYearEmissions(orgId, year)` → Total for year
- `getBaselineEmissions(orgId, baselineYear)` → Baseline total

### Breakdowns
- `getScopeBreakdown(orgId, start, end)` → Scope 1/2/3
- `getCategoryBreakdown(orgId, start, end)` → All 21 categories
- `getScopeCategoryBreakdown(orgId, scope, start, end)` → Categories in one scope

### Individual Metrics
- `getMetricValue(orgId, metricName, start, end)` → One metric
- `getCategoryMetrics(orgId, category, start, end)` → All metrics in category
- `getTopMetrics(orgId, start, end, limit)` → Top emission sources

### Other Totals
- `getEnergyTotal(orgId, start, end)` → Total kWh
- `getWaterTotal(orgId, start, end)` → Total m³
- `getWasteTotal(orgId, start, end)` → Total kg

### Trends & Analytics
- `getMonthlyEmissions(orgId, start, end)` → Monthly breakdown
- `getYoYComparison(orgId, start, end, metric)` → Year-over-year
- `getIntensityMetrics(orgId, start, end, employees, revenue, area)` → Intensity metrics
- `getTopEmissionSources(orgId, start, end, limit)` → Top sources
- `getProjectedAnnualEmissions(orgId, year)` → Projected annual

---

## ⚠️ Common Gotchas

### 1. Return Types

Calculator returns objects, not raw numbers:

```typescript
// ❌ Wrong
const total = await getPeriodEmissions(...);
console.log(total); // [object Object]

// ✅ Correct
const emissions = await getPeriodEmissions(...);
console.log(emissions.total); // 303.6
console.log(emissions.scope_1); // 0.0
console.log(emissions.scope_2); // 177.9
console.log(emissions.scope_3); // 125.7
```

### 2. Units

Calculator returns tCO2e (tonnes), not kgCO2e:

```typescript
// Already in tonnes (tCO2e), no need to divide by 1000
const emissions = await getPeriodEmissions(...);
// emissions.total is already 303.6 tCO2e
```

### 3. Date Format

Use ISO date strings (YYYY-MM-DD):

```typescript
// ✅ Correct
const start = '2023-01-01';
const end = '2023-12-31';

// ❌ Wrong
const start = new Date('2023-01-01'); // Don't pass Date objects
```

### 4. Scope Format

Scopes returned with underscores:

```typescript
const scopes = await getScopeBreakdown(...);
// scopes[0].scope === 'scope_1' (not 'Scope 1')
// Access values: scopes[0].total, scopes[0].percentage
```

---

## 📁 Key Files

### Documentation
- `docs/API_MIGRATION_PROGRESS.md` - Track migration progress
- `docs/SESSION_SUMMARY.md` - Detailed session summary
- `docs/HANDOFF_NEXT_STEPS.md` - This file
- `docs/CALCULATOR_EXPANSION_COMPLETE.md` - All calculator functions
- `docs/EMISSIONS_CALCULATOR_USAGE.md` - Usage guide

### Code
- `src/lib/sustainability/baseline-calculator.ts` - THE calculator (22 functions)
- `test-calculator-direct.ts` - Direct test suite
- `run-calculator-test.sh` - Test runner

### APIs Updated (7)
- `src/app/api/sustainability/scope-analysis/route.ts`
- `src/app/api/sustainability/emissions/route.ts`
- `src/app/api/sustainability/emissions-detailed/route.ts`
- `src/app/api/sustainability/forecast/route.ts`
- `src/app/api/sustainability/dashboard/route.ts`
- `src/app/api/sustainability/metrics/energy-baseline/route.ts`
- `src/app/api/sustainability/targets/current-emissions/route.ts`

---

## 🎯 Success Criteria

### Per API
- ✅ No manual `reduce()` or `/1000` calculations
- ✅ Returns 303.6 tCO2e for 2023 (not 303.5)
- ✅ Scopes add up: 0.0 + 177.9 + 125.7 = 303.6
- ✅ Old functions marked `@deprecated`
- ✅ Console logs show calculator usage
- ✅ TypeScript compiles with no errors

### Overall Project
- 🎯 30/30 APIs using calculator (currently 7/30)
- 🎯 100% consistency across all APIs
- 🎯 Zero manual calculations in API code
- 🎯 All components updated (not done yet)
- 🎯 Comprehensive test coverage

---

## 💡 Tips for Success

1. **Start Small**: Update 1 API at a time, test immediately
2. **Copy Pattern**: Use the 7 completed APIs as templates
3. **Test First**: Run test before and after to see the difference
4. **Document**: Update progress doc after each API
5. **Mark Deprecated**: Don't delete old code, mark it
6. **Check Units**: Calculator returns tonnes (tCO2e), not kg
7. **Use TypeScript**: Let the types guide you
8. **Console Log**: Add logs to show calculator usage
9. **Commit Often**: Small commits per API update
10. **Ask Questions**: Better to ask than to guess

---

## 🚀 Quick Start Guide

Want to update the next API? Follow these steps:

```bash
# 1. Choose an API from the list above
API_NAME="metrics/data"

# 2. Check for manual calculations
grep -n "reduce(" src/app/api/sustainability/$API_NAME/route.ts

# 3. If found, update the file:
#    - Add calculator imports
#    - Replace manual calculations
#    - Mark old functions as deprecated
#    - Add console logs

# 4. Test it
./run-calculator-test.sh

# 5. Update docs
# Edit: docs/API_MIGRATION_PROGRESS.md
# - Increment count: 8/30
# - Add API to completed section

# 6. Commit
git add .
git commit -m "feat: Update $API_NAME API to use calculator

- Use getPeriodEmissions() for emissions
- Replace manual reduce() calculations
- Consistent 303.6 tCO2e for 2023
- Mark old functions as deprecated"
```

---

## 📈 Progress Tracking

Update this after each API:

- [x] scope-analysis (API 1/30)
- [x] emissions (API 2/30)
- [x] emissions-detailed (API 3/30)
- [x] forecast (API 4/30)
- [x] dashboard (API 5/30)
- [x] energy-baseline (API 6/30)
- [x] targets/current-emissions (API 7/30)
- [ ] Next API... (API 8/30)

**Current**: 7/30 (23%)
**Target**: 30/30 (100%)

---

## 🎉 Final Goal

**ONE calculator, ONE truth, EVERY API!**

When complete:
- ✅ All 30 APIs return consistent values
- ✅ 303.6 tCO2e everywhere for 2023 baseline
- ✅ Scope-by-scope rounding throughout
- ✅ Zero manual calculations
- ✅ Easy to maintain and extend
- ✅ GHG Protocol compliant

---

*Last Updated: 2025-10-10*
*APIs Complete: 7/30 (23%)*
*Status: Ready for next migration*
