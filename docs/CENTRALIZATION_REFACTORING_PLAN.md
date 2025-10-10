# Complete Centralization Refactoring Plan

## Current Problem

Right now, **every page calculates its own data**:

### Overview Dashboard (`OverviewDashboard.tsx`)
```typescript
// ❌ Manual calculation in component (Line 193)
const currentTotal = s1Current + s2Current + s3Current;

// ❌ Manual YoY calculation (Line 202)
const totalYoY = ((currentTotal - previousTotal) / previousTotal) * 100;

// ❌ Manual intensity calculation (Line 242)
const currentIntensity = employees > 0 ? currentTotal / employees : 0;
```

### Emissions Dashboard (`EmissionsDashboard.tsx`)
```typescript
// ❌ Manual calculation in component (Line 391)
const currentTotal = s1Current + s2Current + s3Current;

// ❌ Manual YoY calculation (Line 407)
const totalYoY = ((currentTotal - previousTotal) / previousTotal) * 100;

// ❌ Manual intensity calculations (Line 421-429)
const intensityEmployee = employees > 0 ? currentTotal / employees : 0;
const intensityRev = revenue > 0 ? (currentTotal * 1000000) / revenue : 0;
const intensitySqm = totalArea > 0 ? (currentTotal * 1000) / totalArea : 0;
```

### Targets Dashboard (`TargetsDashboard.tsx`)
```typescript
// ❌ Uses API but API has manual calculations
// API at /api/sustainability/targets/route.ts does its own summing
```

### Result
- 🔴 **Inconsistent values** (303.5 vs 303.6 tCO2e)
- 🔴 **Duplicate code** everywhere
- 🔴 **Hard to maintain** (change logic in 10 places)
- 🔴 **No single source of truth**

---

## ✅ Solution: Single Calculator for Everything

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│     /src/lib/sustainability/baseline-calculator.ts          │
│                                                              │
│  THE ONLY PLACE WHERE ANY CALCULATION HAPPENS               │
│                                                              │
│  • Emissions (all scopes)                                   │
│  • Energy, Water, Waste                                     │
│  • Intensities (employee, revenue, area)                    │
│  • YoY changes                                              │
│  • Category breakdowns                                      │
│  • Monthly trends                                           │
│  • Projections & forecasts                                  │
│  • Target progress                                          │
│  • Top sources ranking                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Import functions
                          │
         ┌────────────────┼────────────────┬────────────────┐
         │                │                │                │
         ▼                ▼                ▼                ▼
    ┌────────┐       ┌────────┐      ┌────────┐      ┌────────┐
    │ API 1  │       │ API 2  │      │ API 3  │      │ API 4  │
    │Dashboard│       │ Scope  │      │Targets │      │Forecast│
    └────────┘       └────────┘      └────────┘      └────────┘
         │                │                │                │
         └────────────────┼────────────────┴────────────────┘
                          │ Return consistent data
                          │
         ┌────────────────┼────────────────┬────────────────┐
         │                │                │                │
         ▼                ▼                ▼                ▼
    ┌─────────┐      ┌─────────┐     ┌─────────┐     ┌─────────┐
    │Overview │      │Emissions│     │ Targets │     │  Energy │
    │Dashboard│      │Dashboard│     │Dashboard│     │Dashboard│
    └─────────┘      └─────────┘     └─────────┘     └─────────┘

    ALL SHOW THE SAME VALUES: 303.6 tCO2e ✅
```

---

## Step 1: Expand the Calculator

The calculator already has emissions functions. Let's add ALL other calculations:

### Current Functions ✅
```typescript
// Already implemented:
- getBaselineEmissions(orgId, year?)
- getYearEmissions(orgId, year)
- getPeriodEmissions(orgId, startDate, endDate)
- getScopeBreakdown(orgId, startDate, endDate)
- getCategoryBreakdown(orgId, startDate, endDate)
- getEnergyTotal(orgId, startDate, endDate)
- getWaterTotal(orgId, startDate, endDate)
- getWasteTotal(orgId, startDate, endDate)
- getMonthlyEmissions(orgId, startDate, endDate)
```

### New Functions Needed ⚡

#### 1. **Intensity Calculations**
```typescript
// /src/lib/sustainability/baseline-calculator.ts

export interface IntensityMetrics {
  perEmployee: number;      // tCO2e/FTE
  perRevenue: number;       // tCO2e/M€
  perSqm: number;          // kgCO2e/m²
  perEmployeeYoY: number;
  perRevenueYoY: number;
  perSqmYoY: number;
}

/**
 * Calculate all intensity metrics for a period
 */
export async function getIntensityMetrics(
  organizationId: string,
  startDate: string,
  endDate: string,
  employees: number,
  revenue: number,      // in euros
  totalAreaSqm: number
): Promise<IntensityMetrics> {
  // Get emissions using centralized function
  const emissions = await getPeriodEmissions(organizationId, startDate, endDate);

  // Calculate intensities
  const perEmployee = employees > 0 ? Math.round(emissions.total / employees * 100) / 100 : 0;
  const perRevenue = revenue > 0 ? Math.round((emissions.total * 1000000) / revenue * 100) / 100 : 0;
  const perSqm = totalAreaSqm > 0 ? Math.round((emissions.total * 1000) / totalAreaSqm * 10) / 10 : 0;

  // Get previous year for YoY
  const prevYear = new Date(startDate);
  prevYear.setFullYear(prevYear.getFullYear() - 1);
  const prevEndDate = new Date(endDate);
  prevEndDate.setFullYear(prevEndDate.getFullYear() - 1);

  const prevEmissions = await getPeriodEmissions(
    organizationId,
    prevYear.toISOString().split('T')[0],
    prevEndDate.toISOString().split('T')[0]
  );

  const prevPerEmployee = employees > 0 ? prevEmissions.total / employees : 0;
  const prevPerRevenue = revenue > 0 ? (prevEmissions.total * 1000000) / revenue : 0;
  const prevPerSqm = totalAreaSqm > 0 ? (prevEmissions.total * 1000) / totalAreaSqm : 0;

  // Calculate YoY
  const perEmployeeYoY = prevPerEmployee > 0 ? ((perEmployee - prevPerEmployee) / prevPerEmployee) * 100 : 0;
  const perRevenueYoY = prevPerRevenue > 0 ? ((perRevenue - prevPerRevenue) / prevPerRevenue) * 100 : 0;
  const perSqmYoY = prevPerSqm > 0 ? ((perSqm - prevPerSqm) / prevPerSqm) * 100 : 0;

  return {
    perEmployee: Math.round(perEmployee * 100) / 100,
    perRevenue: Math.round(perRevenue * 100) / 100,
    perSqm: Math.round(perSqm * 10) / 10,
    perEmployeeYoY: Math.round(perEmployeeYoY * 10) / 10,
    perRevenueYoY: Math.round(perRevenueYoY * 10) / 10,
    perSqmYoY: Math.round(perSqmYoY * 10) / 10
  };
}
```

#### 2. **Year-over-Year (YoY) Calculations**
```typescript
export interface YoYComparison {
  current: number;
  previous: number;
  change: number;        // Absolute change
  changePercent: number; // Percentage change
  trend: 'up' | 'down' | 'stable';
}

/**
 * Calculate YoY comparison for any metric
 */
export async function getYoYComparison(
  organizationId: string,
  startDate: string,
  endDate: string
): Promise<{
  total: YoYComparison;
  scope_1: YoYComparison;
  scope_2: YoYComparison;
  scope_3: YoYComparison;
}> {
  // Current period
  const current = await getPeriodEmissions(organizationId, startDate, endDate);

  // Previous period (same dates, previous year)
  const prevStart = new Date(startDate);
  prevStart.setFullYear(prevStart.getFullYear() - 1);
  const prevEnd = new Date(endDate);
  prevEnd.setFullYear(prevEnd.getFullYear() - 1);

  const previous = await getPeriodEmissions(
    organizationId,
    prevStart.toISOString().split('T')[0],
    prevEnd.toISOString().split('T')[0]
  );

  // Helper to calculate comparison
  const calculateComparison = (curr: number, prev: number): YoYComparison => {
    const change = Math.round((curr - prev) * 10) / 10;
    const changePercent = prev > 0 ? Math.round(((curr - prev) / prev) * 1000) / 10 : 0;
    const trend = change < -0.1 ? 'down' : change > 0.1 ? 'up' : 'stable';

    return { current: curr, previous: prev, change, changePercent, trend };
  };

  return {
    total: calculateComparison(current.total, previous.total),
    scope_1: calculateComparison(current.scope_1, previous.scope_1),
    scope_2: calculateComparison(current.scope_2, previous.scope_2),
    scope_3: calculateComparison(current.scope_3, previous.scope_3)
  };
}
```

#### 3. **Top Emission Sources**
```typescript
export interface EmissionSource {
  name: string;
  scope: 'scope_1' | 'scope_2' | 'scope_3';
  emissions: number;
  percentage: number;
  rank: number;
  recommendation: string;
}

/**
 * Get top emission sources ranked by total emissions
 */
export async function getTopEmissionSources(
  organizationId: string,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<EmissionSource[]> {
  const categories = await getCategoryBreakdown(organizationId, startDate, endDate);

  // Flatten all categories with their scopes
  const allSources: EmissionSource[] = [];
  const total = categories.reduce((sum, cat) => sum + cat.total, 0);

  categories.forEach(cat => {
    // Add scope 1 sources
    if (cat.scope_1 > 0) {
      allSources.push({
        name: cat.category,
        scope: 'scope_1',
        emissions: cat.scope_1,
        percentage: total > 0 ? (cat.scope_1 / total) * 100 : 0,
        rank: 0, // Will set after sorting
        recommendation: getActionRecommendation(cat.category)
      });
    }

    // Add scope 2 sources
    if (cat.scope_2 > 0) {
      allSources.push({
        name: cat.category,
        scope: 'scope_2',
        emissions: cat.scope_2,
        percentage: total > 0 ? (cat.scope_2 / total) * 100 : 0,
        rank: 0,
        recommendation: getActionRecommendation(cat.category)
      });
    }

    // Add scope 3 sources
    if (cat.scope_3 > 0) {
      allSources.push({
        name: cat.category,
        scope: 'scope_3',
        emissions: cat.scope_3,
        percentage: total > 0 ? (cat.scope_3 / total) * 100 : 0,
        rank: 0,
        recommendation: getActionRecommendation(cat.category)
      });
    }
  });

  // Sort by emissions (highest first) and assign ranks
  allSources.sort((a, b) => b.emissions - a.emissions);
  allSources.forEach((source, index) => {
    source.rank = index + 1;
  });

  return allSources.slice(0, limit);
}

function getActionRecommendation(categoryName: string): string {
  const nameLower = categoryName.toLowerCase();

  if (nameLower.includes('electricity')) return '💡 Switch to renewable energy contracts';
  if (nameLower.includes('heating')) return '🔥 Install heat pump or upgrade boilers';
  if (nameLower.includes('travel')) return '✈️ Implement virtual meetings policy';
  if (nameLower.includes('vehicle')) return '🚗 Transition to electric vehicles';
  if (nameLower.includes('waste')) return '♻️ Increase recycling & composting';

  return '📊 Review and optimize this source';
}
```

#### 4. **Projected Annual Emissions**
```typescript
export interface ProjectedEmissions {
  actualYTD: number;
  forecastedRemaining: number;
  projectedTotal: number;
  confidence: number;
  method: string;
}

/**
 * Calculate projected annual emissions (actual + forecast)
 */
export async function getProjectedAnnualEmissions(
  organizationId: string,
  year: number
): Promise<ProjectedEmissions> {
  // Get actual data for current year so far
  const now = new Date();
  const yearStart = `${year}-01-01`;
  const currentDate = now.toISOString().split('T')[0];

  const monthlyData = await getMonthlyEmissions(organizationId, yearStart, currentDate);
  const actualYTD = monthlyData.reduce((sum, m) => sum + m.emissions, 0);

  // Calculate forecast for remaining months
  // This would use the forecast API or ML model
  // For now, use simple average
  const monthsCovered = monthlyData.length;
  const monthsRemaining = 12 - monthsCovered;

  const monthlyAverage = monthsCovered > 0 ? actualYTD / monthsCovered : 0;
  const forecastedRemaining = monthlyAverage * monthsRemaining;

  return {
    actualYTD: Math.round(actualYTD * 10) / 10,
    forecastedRemaining: Math.round(forecastedRemaining * 10) / 10,
    projectedTotal: Math.round((actualYTD + forecastedRemaining) * 10) / 10,
    confidence: monthsCovered >= 6 ? 0.85 : 0.65,
    method: 'moving_average'
  };
}
```

#### 5. **Complete Dashboard Data**
```typescript
export interface DashboardData {
  period: {
    startDate: string;
    endDate: string;
  };
  emissions: {
    total: number;
    scope_1: number;
    scope_2: number;
    scope_3: number;
  };
  yoy: {
    total: YoYComparison;
    scope_1: YoYComparison;
    scope_2: YoYComparison;
    scope_3: YoYComparison;
  };
  intensity: IntensityMetrics;
  topSources: EmissionSource[];
  monthlyTrends: MonthlyData[];
  projected?: ProjectedEmissions;
}

/**
 * Get ALL dashboard data in one call
 * Single source of truth for any dashboard
 */
export async function getCompleteDashboardData(
  organizationId: string,
  startDate: string,
  endDate: string,
  orgData: {
    employees: number;
    revenue: number;
    totalAreaSqm: number;
  }
): Promise<DashboardData> {
  // Run all calculations in parallel
  const [emissions, yoy, intensity, topSources, monthlyTrends] = await Promise.all([
    getPeriodEmissions(organizationId, startDate, endDate),
    getYoYComparison(organizationId, startDate, endDate),
    getIntensityMetrics(organizationId, startDate, endDate, orgData.employees, orgData.revenue, orgData.totalAreaSqm),
    getTopEmissionSources(organizationId, startDate, endDate, 10),
    getMonthlyEmissions(organizationId, startDate, endDate)
  ]);

  // Get projected if current year
  const currentYear = new Date().getFullYear();
  const periodYear = new Date(startDate).getFullYear();
  const projected = periodYear === currentYear
    ? await getProjectedAnnualEmissions(organizationId, currentYear)
    : undefined;

  return {
    period: { startDate, endDate },
    emissions,
    yoy,
    intensity,
    topSources,
    monthlyTrends,
    projected
  };
}
```

---

## Step 2: Update APIs to Use Calculator

### Before (API does calculations):
```typescript
// ❌ /api/sustainability/dashboard/route.ts
const totalEmissions = Math.round(data.reduce(...) / 1000 * 10) / 10;
```

### After (API uses calculator):
```typescript
// ✅ /api/sustainability/dashboard/route.ts
import { getCompleteDashboardData } from '@/lib/sustainability/baseline-calculator';

export async function GET(request: NextRequest) {
  // ... auth & params ...

  // Get organization data
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('employee_count, annual_revenue, total_area_sqm')
    .eq('id', organizationId)
    .single();

  // Use calculator - ONE FUNCTION CALL
  const dashboardData = await getCompleteDashboardData(
    organizationId,
    startDate,
    endDate,
    {
      employees: org.employee_count || 200,
      revenue: org.annual_revenue || 0,
      totalAreaSqm: org.total_area_sqm || 0
    }
  );

  return NextResponse.json(dashboardData);
}
```

---

## Step 3: Update Components to Use API Data Directly

### Before (Component does calculations):
```typescript
// ❌ OverviewDashboard.tsx
const currentTotal = s1Current + s2Current + s3Current;
const totalYoY = ((currentTotal - previousTotal) / previousTotal) * 100;
const intensityEmployee = currentTotal / employees;
```

### After (Component uses API data):
```typescript
// ✅ OverviewDashboard.tsx
const dashboardResponse = await fetch(`/api/sustainability/dashboard?${params}`);
const data = await dashboardResponse.json();

// Use data directly - NO CALCULATIONS
setTotalEmissions(data.emissions.total);           // 303.6
setTotalEmissionsYoY(data.yoy.total.changePercent); // -25.6%
setIntensityMetric(data.intensity.perEmployee);     // 1.52
setTopSources(data.topSources);                     // Top 10
setMonthlyTrends(data.monthlyTrends);               // Chart data
```

---

## Step 4: Implementation Checklist

### Phase 1: Expand Calculator ⚡
- [ ] Add `getIntensityMetrics()` function
- [ ] Add `getYoYComparison()` function
- [ ] Add `getTopEmissionSources()` function
- [ ] Add `getProjectedAnnualEmissions()` function
- [ ] Add `getCompleteDashboardData()` function
- [ ] Add unit tests for all new functions

### Phase 2: Update APIs 🔧
- [ ] Update `/api/sustainability/dashboard` to use `getCompleteDashboardData()`
- [ ] Update `/api/sustainability/scope-analysis` to use calculator functions
- [ ] Update `/api/sustainability/targets` to use calculator functions
- [ ] Remove all manual calculations from APIs
- [ ] Test all API endpoints return consistent values

### Phase 3: Update Components 🎨
- [ ] Update `OverviewDashboard.tsx` to use API data directly
- [ ] Update `EmissionsDashboard.tsx` to use API data directly
- [ ] Update `TargetsDashboard.tsx` to use API data directly
- [ ] Update `EnergyDashboard.tsx` to use calculator
- [ ] Remove all calculation code from components
- [ ] Test all dashboards show same values

### Phase 4: Testing & Validation ✅
- [ ] Verify Overview shows 303.6 tCO2e (not 303.5)
- [ ] Verify Emissions shows 303.6 tCO2e
- [ ] Verify Targets shows 303.6 tCO2e baseline
- [ ] Verify YoY percentages match across all pages
- [ ] Verify intensity metrics match across all pages
- [ ] Test with different date ranges
- [ ] Test with different sites
- [ ] Load test with parallel requests

---

## Benefits of This Approach

### ✅ Consistency
- **Same value everywhere**: 303.6 tCO2e on every page
- **Same YoY%**: -25.6% displayed consistently
- **Same intensity**: 1.52 tCO2e/employee everywhere

### ✅ Maintainability
- **Change once, update everywhere**: Update rounding logic in one place
- **Easy to add features**: New calculation? Add to calculator, all pages get it
- **Clear ownership**: Calculator owns all calculations

### ✅ Performance
- **Parallel calculations**: Use `Promise.all()` in calculator
- **Caching**: Cache calculator results (rarely change within same period)
- **Fewer API calls**: 1 API call instead of 4-6

### ✅ Testability
- **Unit test calculations**: Test calculator functions in isolation
- **Mock-friendly**: Components just display data, easy to mock
- **Regression prevention**: Tests catch calculation changes

---

## File Structure After Refactoring

```
/src/lib/sustainability/
├── baseline-calculator.ts        (800+ lines)
│   ├── Emissions Functions
│   ├── Intensity Functions        ⚡ NEW
│   ├── YoY Functions              ⚡ NEW
│   ├── Top Sources Functions      ⚡ NEW
│   ├── Projection Functions       ⚡ NEW
│   ├── Complete Dashboard         ⚡ NEW
│   └── Helper Functions
│
/src/app/api/sustainability/
├── dashboard/route.ts             (100 lines) - Uses calculator
├── scope-analysis/route.ts        (150 lines) - Uses calculator
├── targets/route.ts               (200 lines) - Uses calculator
└── baseline/route.ts              (50 lines) - Thin wrapper

/src/components/dashboard/
├── OverviewDashboard.tsx          (500 lines) - Display only
├── EmissionsDashboard.tsx         (1000 lines) - Display only
└── TargetsDashboard.tsx           (300 lines) - Display only
```

---

## Migration Strategy

### Option A: Big Bang (Risky)
1. Update calculator
2. Update all APIs at once
3. Update all components at once
4. Test everything
5. Deploy

**Risk**: High - Everything breaks if something is wrong

### Option B: Incremental (Safe) ✅ RECOMMENDED
1. **Week 1**: Expand calculator with new functions
2. **Week 2**: Create new API endpoint `/api/sustainability/dashboard-v2` using calculator
3. **Week 3**: Update Overview Dashboard to use v2 endpoint, test thoroughly
4. **Week 4**: Update Emissions Dashboard to use v2 endpoint, test thoroughly
5. **Week 5**: Update remaining dashboards
6. **Week 6**: Deprecate old APIs, remove calculation code from components

**Risk**: Low - Each step is isolated, can rollback easily

---

## Example: Before vs After

### Before (Inconsistent)
```
Overview Page:    303.5 tCO2e  ❌
Emissions Page:   303.5 tCO2e  ❌
Targets Page:     303.6 tCO2e  ✅
API Response:     303.545... tCO2e

Why different? Each calculates independently!
```

### After (Consistent)
```
Overview Page:    303.6 tCO2e  ✅
Emissions Page:   303.6 tCO2e  ✅
Targets Page:     303.6 tCO2e  ✅
API Response:     303.6 tCO2e  ✅

Why same? All use baseline-calculator.ts!
```

---

## Summary

🎯 **One Calculator, One Truth**

Instead of:
- ❌ 5 APIs doing their own calculations
- ❌ 10 components doing their own calculations
- ❌ 50+ lines of duplicate calculation code
- ❌ Inconsistent values everywhere

We have:
- ✅ 1 calculator doing ALL calculations
- ✅ APIs import calculator functions
- ✅ Components display data from APIs
- ✅ Consistent values everywhere

**Result**: 303.6 tCO2e displayed consistently across the entire platform! 🚀
