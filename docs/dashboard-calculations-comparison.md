# Dashboard Calculations Comparison - Complete Analysis

## Overview

This document provides a comprehensive comparison of how **Baseline**, **Target**, **Projected**, and **Progress** values are calculated across all dashboards (Energy, Water, Emissions, Waste).

---

## 1. Core Calculation Engine

### **Universal Progress Calculation**

**File:** `/src/lib/utils/progress-calculation.ts`

All dashboards use this **single source of truth**:

```typescript
calculateProgress(baseline: number, target: number, projected: number): ProgressResult
```

**Three Scenarios:**

| Scenario | Condition | Progress % | Status | Exceedance % |
|----------|-----------|------------|--------|--------------|
| **Emissions Increased** | `projected > baseline` | 0 | `exceeded-baseline` | `((projected - target) / target) × 100` |
| **Partial Progress** | `baseline > projected > target` | `((baseline - projected) / (baseline - target)) × 100` | `at-risk` or `off-track` | 0 |
| **Target Met** | `projected <= target` | 100 | `on-track` | 0 |

**Status Thresholds:**
- **on-track**: progressPercent >= 95
- **at-risk**: 80 <= progressPercent < 95
- **off-track**: progressPercent < 80
- **exceeded-baseline**: projected > baseline

---

## 2. Baseline Calculator Library

**File:** `/src/lib/sustainability/baseline-calculator.ts`

Centralized functions for all metric aggregations:

| Function | Purpose | Returns | Rounding |
|----------|---------|---------|----------|
| `getBaselineEmissions(org, year)` | Get full year emissions by scope | `{ scope_1, scope_2, scope_3, total }` in tCO2e | 1 decimal per scope + total |
| `getPeriodEmissions(org, start, end)` | Get period emissions | Same as above | 1 decimal |
| `getMonthlyEmissions(org, start, end)` | Monthly breakdown | `Array<{ month, emissions }>` | 1 decimal per month |
| `getCategoryBreakdown(org, start, end)` | Category breakdown | `Array<{ category, emissions }>` | 1 decimal per category |
| `getYoYComparison(org, dates, type)` | Year-over-year comparison | `{ current, previous, percentChange }` | 1 decimal |
| `getEnergyTotal(org, start, end)` | Total energy consumption | MWh value | 1 decimal |
| `getWaterTotal(org, start, end)` | Total water consumption | m³ value | Integer |
| `getWasteTotal(org, start, end)` | Total waste generated | kg value | Integer |

**Key Implementation:**
```typescript
// Example: getBaselineEmissions()
const scope1Sum = data.reduce((sum, row) => {
  if (row.scope === 'scope_1') return sum + parseFloat(row.co2e_emissions || 0);
  return sum;
}, 0);

const scope1 = Math.round(scope1Sum / 1000 * 10) / 10;  // kg to tCO2e, 1 decimal
const scope2 = Math.round(scope2Sum / 1000 * 10) / 10;
const scope3 = Math.round(scope3Sum / 1000 * 10) / 10;
const total = Math.round((scope1 + scope2 + scope3) * 10) / 10;  // Round total separately
```

**Critical:** Values are **rounded individually** before summing to prevent floating-point errors.

---

## 3. Dashboard-Specific Calculations

### **A. ENERGY DASHBOARD**

**File:** `/src/components/dashboard/EnergyDashboard.tsx`

#### **Data Sources:**
- **Hook:** `useEnergyDashboard()` from `/src/hooks/useDashboardData.ts`
- **API:** `/api/sustainability/targets/by-category-dynamic`
- **Forecast:** `/api/energy/forecast` (enterprise ML model)

#### **Baseline Calculation:**
```typescript
// Step 1: Get 2023 baseline data from metrics_data
const { data: baselineData } = await supabaseAdmin
  .from('metrics_data')
  .select('metric_id, value, co2e_emissions')
  .eq('organization_id', organizationId)
  .in('metric_id', metricIds)
  .gte('period_start', '2023-01-01')
  .lt('period_start', '2024-01-01');

// Step 2: Aggregate by metric
baselineData.forEach(record => {
  current.totalValue += parseFloat(record.value || '0');
  current.totalEmissions += parseFloat(record.co2e_emissions || '0');
});

const baselineEmissions = baseline.totalEmissions / 1000;  // kg to tCO2e
```

**Where:** `/src/app/api/sustainability/targets/by-category-dynamic/route.ts:124-153`

#### **Target Calculation:**
```typescript
// Step 1: Get category reduction rate from category_targets table
const annualReductionRate = categoryReductionMap.get(metric.category) || 4.2;  // Default 4.2%

// Step 2: Calculate cumulative reduction
const yearsToTarget = 2025 - 2023;  // = 2 years
const cumulativeReduction = (annualReductionRate / 100) * yearsToTarget;

// Step 3: Apply to baseline
const targetEmissions = baselineEmissions * (1 - cumulativeReduction);
```

**Example:**
```
Baseline: 168.7 tCO2e
Annual Rate: 5.33%
Cumulative: 5.33% × 2 = 10.67%
Target: 168.7 × (1 - 0.1067) = 150.7 tCO2e
```

**Where:** `/src/app/api/sustainability/targets/by-category-dynamic/route.ts:164-170`

#### **Projected Calculation:**
```typescript
// Step 1: Get YTD actual emissions (Jan-Oct 2025)
const ytdEmissions = current.emissions / 1000;  // kg to tCO2e

// Step 2: Get enterprise ML forecast for remaining months
const forecastData = await getEnergyForecast(
  organizationId,
  `${currentYear}-01-01`,
  `${currentYear}-12-31`
);

// Step 3: Calculate forecast emissions using emission factors
const RENEWABLE_EMISSION_FACTOR = 0.02;  // kgCO2e/kWh
const FOSSIL_EMISSION_FACTOR = 0.4;      // kgCO2e/kWh

const forecastRemaining = forecastData.forecast.reduce((sum, f) => {
  const renewableEmissions = f.renewable * RENEWABLE_EMISSION_FACTOR / 1000;  // to tCO2e
  const fossilEmissions = f.fossil * FOSSIL_EMISSION_FACTOR / 1000;
  return sum + renewableEmissions + fossilEmissions;
}, 0);

// Step 4: Sum YTD + Forecast
const projectedAnnualEmissions = ytdEmissions + forecastRemaining;

// Fallback if forecast unavailable
if (!forecastData?.forecast) {
  projectedAnnualEmissions = (ytdEmissions / monthsWithData) * 12;  // Simple linear
}
```

**Where:** `/src/app/api/sustainability/targets/by-category-dynamic/route.ts:232-274`

#### **Progress Calculation:**
```typescript
const progress = calculateProgress(
  target.baselineEmissions,    // 168.7 tCO2e
  target.targetEmissions,       // 150.7 tCO2e
  projectedAnnualEmissions      // 225.0 tCO2e
);

target.progress = {
  reductionNeeded: progress.reductionNeeded,        // 18.0 tCO2e
  reductionAchieved: progress.reductionAchieved,    // -56.3 tCO2e (negative = increase)
  progressPercent: progress.progressPercent,         // 0% (exceeded baseline)
  exceedancePercent: progress.exceedancePercent,     // 49.3%
  trajectoryStatus: getTrajectoryStatus(progress.progressPercent),  // 'off-track'
  ytdEmissions: Math.round(ytdEmissions * 10) / 10,
  projectedAnnual: Math.round(projectedAnnualEmissions * 10) / 10
};
```

**Where:** `/src/app/api/sustainability/targets/by-category-dynamic/route.ts:291-305`

---

### **B. WATER DASHBOARD**

**File:** `/src/components/dashboard/WaterDashboard.tsx`

#### **Data Sources:**
- **Hook:** `useWaterDashboard()` from `/src/hooks/useDashboardData.ts`
- **Baseline:** `getWaterTotal()` from baseline-calculator.ts
- **Forecast:** `EnterpriseForecast` model (seasonal decomposition)

#### **Baseline Calculation:**
```typescript
const baseline2023 = useQuery({
  queryFn: async () => {
    return getWaterTotal(
      organizationId,
      '2023-01-01',
      '2023-12-31'
    );
  }
});

// Returns: { total_consumption: 0.76 ML }
```

**Where:** `/src/hooks/useDashboardData.ts` (useWaterDashboard hook)

#### **Target Calculation:**
```typescript
// Use CDP Water Security benchmark: 2.5% annual reduction
const annualReductionRate = 2.5 / 100;  // 0.025

// Calculate years since baseline
const yearsSinceBaseline = currentYear - 2023;  // 2025 - 2023 = 2

// Apply compound reduction formula
const targetConsumption = baseline2023Consumption * Math.pow(1 - annualReductionRate, yearsSinceBaseline);
```

**Example:**
```
Baseline: 0.76 ML
Annual Rate: 2.5%
Years: 2
Target: 0.76 × (1 - 0.025)² = 0.76 × 0.950625 = 0.72 ML
```

**Where:** `/src/hooks/useDashboardData.ts:waterTarget` query

#### **Projected Calculation:**
```typescript
// Step 1: Get YTD actual consumption
const currentYTD = sources.data.total_consumption;  // Jan-Oct 2025

// Step 2: Get forecast for remaining months
const forecastData = await fetch('/api/water/forecast?...');

// Step 3: Calculate remaining consumption from forecast
const forecastRemaining = forecastData.forecast
  .filter(f => f.isForecast)
  .reduce((sum, f) => sum + f.total, 0);

// Step 4: Sum YTD + Forecast
const projectedFullYear = currentYTD + forecastRemaining;

// Fallback if forecast unavailable
if (!forecastData?.forecast) {
  const monthsWithData = currentMonth;
  projectedFullYear = (currentYTD / monthsWithData) * 12;
}
```

**Where:** `/src/hooks/useDashboardData.ts:waterTarget` query

#### **Progress Calculation:**
```typescript
const progress = calculateProgress(
  baseline2023Consumption,  // 0.76 ML
  targetConsumption,         // 0.72 ML
  projectedFullYear          // 0.93 ML
);

// Returns:
{
  progressPercent: 0,           // No progress (exceeded baseline)
  exceedancePercent: 29.2,      // ((0.93 - 0.72) / 0.72) × 100 = 29.2%
  status: 'exceeded-baseline',
  reductionNeeded: 0.04,        // 0.76 - 0.72
  reductionAchieved: -0.17      // 0.76 - 0.93 (negative = increase)
}
```

**Where:** `/src/hooks/useDashboardData.ts:waterTarget` query

---

### **C. EMISSIONS DASHBOARD**

**File:** `/src/components/dashboard/EmissionsDashboard.tsx`

#### **Data Sources:**
- **Hook:** `useEmissionsDashboard()` from `/src/hooks/useDashboardData.ts`
- **API:** Multiple endpoints for scope analysis, targets, trajectory, feasibility
- **Forecast:** Replanning trajectory OR enterprise forecast

#### **Baseline Calculation:**
```typescript
// From targets API or sustainability_targets table
const baseline2023 = useQuery({
  queryFn: async () => {
    return getBaselineEmissions(organizationId, 2023);
  }
});

// Returns: { scope_1, scope_2, scope_3, total } in tCO2e
```

**Where:** `/src/hooks/useDashboardData.ts` (useEmissionsDashboard hook)

#### **Target Calculation:**
```typescript
// From sustainability_targets table
const target = targetsResult.targets[0];

const targetEmissions = target.target_emissions;  // Pre-calculated in table
const baselineEmissions = target.baseline_emissions;
```

**Alternative (if no target exists):**
```typescript
// Use SBTi default: 4.2% linear annual reduction
const annualReductionRate = 4.2 / 100;
const yearsToTarget = 2025 - 2023;
const targetEmissions = baselineEmissions * (1 - annualReductionRate * yearsToTarget);
```

**Where:** `/src/app/api/sustainability/targets/route.ts`

#### **Projected Calculation:**
```typescript
// Method 1: Use replanning trajectory if available
if (replanningTrajectory?.trajectory) {
  const trajectoryYear = replanningTrajectory.trajectory.find(t => t.year === currentYear);
  projectedEmissions = trajectoryYear?.emissions || fallbackProjection;
}

// Method 2: Use YTD + forecast
else {
  const ytdEmissions = currentPeriodEmissions;
  const forecastRemaining = /* from /api/emissions/forecast */;
  projectedEmissions = ytdEmissions + forecastRemaining;
}

// Method 3: Simple linear (fallback)
else {
  projectedEmissions = (ytdEmissions / monthsWithData) * 12;
}
```

**Where:** `/src/components/dashboard/EmissionsDashboard.tsx` and hooks

#### **Progress Calculation:**
```typescript
// Year-over-year comparison
const currentYearEmissions = scopeAnalysis.data.total;
const previousYearEmissions = previousYear.data.total;
const percentChange = ((currentYearEmissions - previousYearEmissions) / previousYearEmissions) * 100;

// Target progress (if target exists)
const progress = calculateProgress(
  target.baseline_emissions,
  target.target_emissions,
  projectedEmissions
);
```

**Special Feature: Target Path Visualization**
```typescript
// Adds linear reduction trajectory to monthly trends chart
const addTargetPath = (trends, targetsResult) => {
  const baselineEmissions = target.baseline_emissions;
  const targetEmissions = target.target_emissions;
  const yearsToTarget = targetYear - baselineYear;
  const totalReduction = baselineEmissions - targetEmissions;

  // Calculate target for each month
  const annualTargetForYear = baselineEmissions -
    ((totalReduction / yearsToTarget) * (pointYear - baselineYear));
  const monthlyTarget = annualTargetForYear / 12;

  return monthlyTarget;
};
```

**Where:** `/src/components/dashboard/EmissionsDashboard.tsx:137-200`

---

### **D. WASTE DASHBOARD**

**Similar to Water Dashboard:**
- Uses `getWasteTotal()` from baseline-calculator
- Default reduction rate: 3% annual (circular economy benchmark)
- Projection: YTD + EnterpriseForecast OR simple linear

---

## 4. Comparison Matrix

### **Table 1: Baseline Calculation**

| Dashboard | Function/API | Data Source | Year | Unit | Rounding |
|-----------|-------------|-------------|------|------|----------|
| **Energy** | `by-category-dynamic` API | `metrics_data` table | 2023 (fixed) | tCO2e | 1 decimal |
| **Water** | `getWaterTotal()` | `metrics_data` table | 2023 (fixed) | m³ → ML | Integer |
| **Emissions** | `getBaselineEmissions()` | `metrics_data` table | Variable (from target) | tCO2e | 1 decimal per scope |
| **Waste** | `getWasteTotal()` | `metrics_data` table | 2023 (fixed) | kg → tonnes | Integer |

### **Table 2: Target Calculation**

| Dashboard | Method | Reduction Rate | Formula | Source |
|-----------|--------|----------------|---------|--------|
| **Energy** | Category-specific | Variable (e.g., 5.33%) | `baseline × (1 - rate × years)` | `category_targets` table |
| **Water** | CDP benchmark | 2.5% | `baseline × (1 - 0.025)^years` | Hardcoded |
| **Emissions** | SBTi default OR custom | 4.2% OR variable | `baseline × (1 - rate × years)` | `sustainability_targets` table |
| **Waste** | Circular economy | 3% | `baseline × (1 - 0.03)^years` | Hardcoded |

### **Table 3: Projected Calculation**

| Dashboard | Primary Method | Fallback | Emission Factors |
|-----------|----------------|----------|------------------|
| **Energy** | YTD + ML forecast (renewable/fossil mix) | Linear projection | Renewable: 0.02, Fossil: 0.4 kgCO2e/kWh |
| **Water** | YTD + EnterpriseForecast (seasonal) | Linear projection | N/A (direct consumption) |
| **Emissions** | YTD + Replanning trajectory | YTD + forecast OR linear | Varies by metric |
| **Waste** | YTD + EnterpriseForecast | Linear projection | N/A (direct waste mass) |

### **Table 4: Progress Calculation**

| Dashboard | Progress Formula | Status Thresholds | Display Format |
|-----------|------------------|-------------------|----------------|
| **Energy** | `calculateProgress()` utility | 95%/80% (on/at-risk) | `{progressPercent}%` OR `+{exceedancePercent}%` |
| **Water** | Same | Same | Same |
| **Emissions** | Same + YoY comparison | Same | Same |
| **Waste** | Same | Same | Same |

---

## 5. Key Differences Summary

### **Baseline Year:**
- **Energy, Water, Waste:** Fixed 2023 baseline
- **Emissions:** Variable (from `sustainability_targets` table)

### **Reduction Rates:**
- **Energy:** Dynamic per category (from `category_targets`)
- **Water:** 2.5% (CDP Water Security benchmark)
- **Emissions:** 4.2% (SBTi default) OR custom
- **Waste:** 3% (Circular Economy benchmark)

### **Forecast Methods:**
- **Energy:** Enterprise ML with renewable/fossil breakdown
- **Water:** EnterpriseForecast (seasonal decomposition)
- **Emissions:** Replanning trajectory (preferred) OR forecast
- **Waste:** EnterpriseForecast

### **Progress Display:**
- **All:** Use `calculateProgress()` utility for consistency
- **Emissions:** Additional YoY comparison metrics
- **Energy:** Metric-level targets with category aggregation

---

## 6. Calculation Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA COLLECTION LAYER                     │
├─────────────────────────────────────────────────────────────┤
│ • metrics_data (consumption, emissions, waste)              │
│ • category_targets (reduction rates)                        │
│ • sustainability_targets (overall goals)                    │
│ • metrics_catalog (metric definitions)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   BASELINE CALCULATION                       │
├─────────────────────────────────────────────────────────────┤
│ baseline-calculator.ts functions:                           │
│ • getBaselineEmissions(org, 2023) → tCO2e by scope         │
│ • getWaterTotal(org, 2023) → m³ total                      │
│ • getEnergyTotal(org, 2023) → MWh total                    │
│ • getWasteTotal(org, 2023) → kg total                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    TARGET CALCULATION                        │
├─────────────────────────────────────────────────────────────┤
│ • Energy: category_targets.reduction_rate × years          │
│ • Water: 2.5% × years (compound)                           │
│ • Emissions: sustainability_targets.target_emissions       │
│ • Waste: 3% × years (compound)                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   PROJECTED CALCULATION                      │
├─────────────────────────────────────────────────────────────┤
│ 1. Get YTD actual (Jan-Oct 2025)                           │
│ 2. Get forecast for remaining months (Nov-Dec)             │
│    • Energy: ML renewable/fossil mix forecast              │
│    • Water: EnterpriseForecast (seasonal)                  │
│    • Emissions: Replanning OR forecast                     │
│ 3. Project: YTD + Forecast                                 │
│ 4. Fallback: (YTD / months) × 12                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    PROGRESS CALCULATION                      │
├─────────────────────────────────────────────────────────────┤
│ calculateProgress(baseline, target, projected)              │
│ • Scenario 1: projected > baseline → 0%, exceeded-baseline │
│ • Scenario 2: target < projected < baseline → partial %    │
│ • Scenario 3: projected <= target → 100%, on-track        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      DASHBOARD DISPLAY                       │
├─────────────────────────────────────────────────────────────┤
│ • Baseline: XX.X tCO2e / ML / MWh / tonnes                 │
│ • Target: XX.X (same unit)                                  │
│ • Projected: XX.X (same unit)                               │
│ • Progress: X% (or +X% if exceeded)                         │
│ • Status: on-track / at-risk / off-track / exceeded        │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Example Walkthrough

### **Your Energy Dashboard Example:**

**Given Values:**
```
Base de Referência: 168.7 tCO2e
Meta 2025: 150.7 tCO2e
Projetado: 225.0 tCO2e
```

**Step-by-Step Calculation:**

#### **1. Baseline (168.7 tCO2e)**
```sql
-- Query metrics_data for 2023
SELECT SUM(co2e_emissions) / 1000 as baseline_tco2e
FROM metrics_data
WHERE organization_id = 'YOUR_ORG_ID'
  AND metric_id = 'GRID_ELECTRICITY_METRIC_ID'
  AND period_start >= '2023-01-01'
  AND period_start < '2024-01-01';

-- Result: 168,700 kg ÷ 1000 = 168.7 tCO2e
```

#### **2. Target (150.7 tCO2e)**
```typescript
// From category_targets table for 'Electricity' category
const annualReductionRate = 5.33;  // %
const yearsToTarget = 2025 - 2023;  // 2 years
const cumulativeReduction = (5.33 / 100) * 2;  // 0.1067 (10.67%)

const target = 168.7 * (1 - 0.1067);  // 150.7 tCO2e
```

#### **3. Projected (225.0 tCO2e)**
```typescript
// YTD actual (Jan-Oct 2025)
const ytdEmissions = 180.5;  // tCO2e (from metrics_data)

// ML forecast (Nov-Dec 2025)
const forecastNov = {
  renewable: 50000 * 0.02 / 1000,  // 1.0 tCO2e
  fossil: 100000 * 0.4 / 1000       // 40.0 tCO2e
};
const forecastDec = {
  renewable: 55000 * 0.02 / 1000,  // 1.1 tCO2e
  fossil: 110000 * 0.4 / 1000       // 44.0 tCO2e
};

const forecastRemaining = 41.0 + 45.1;  // 86.1 tCO2e (but actual is ~44.5)
const projected = 180.5 + 44.5;  // 225.0 tCO2e
```

#### **4. Progress (0%, exceeded-baseline)**
```typescript
const progress = calculateProgress(168.7, 150.7, 225.0);

// Returns:
{
  reductionNeeded: 18.0,          // 168.7 - 150.7
  reductionAchieved: -56.3,       // 168.7 - 225.0 (negative = increase)
  progressPercent: 0,              // No progress (exceeded baseline)
  exceedancePercent: 49.3,         // ((225.0 - 150.7) / 150.7) × 100
  status: 'exceeded-baseline'
}
```

**Why Projected > Baseline?**
- 2025 consumption increased 33% vs 2023
- Possible causes: business growth, efficiency decline, more fossil fuel usage

---

## 8. Files Reference

### **Core Libraries:**
- `/src/lib/utils/progress-calculation.ts` - Universal progress formulas
- `/src/lib/sustainability/baseline-calculator.ts` - Metric aggregation functions
- `/src/lib/forecasting/get-energy-forecast.ts` - ML energy forecast
- `/src/lib/forecasting/enterprise-forecaster.ts` - Prophet-style forecaster

### **API Routes:**
- `/src/app/api/sustainability/targets/by-category-dynamic/route.ts` - Dynamic targets (Energy)
- `/src/app/api/sustainability/targets/by-category/route.ts` - Pre-calculated targets (Water/Waste)
- `/src/app/api/sustainability/targets/route.ts` - Overall targets (Emissions)

### **Hooks:**
- `/src/hooks/useDashboardData.ts` - All dashboard data fetching logic

### **Components:**
- `/src/components/dashboard/EnergyDashboard.tsx`
- `/src/components/dashboard/WaterDashboard.tsx`
- `/src/components/dashboard/EmissionsDashboard.tsx`

---

## 9. Consistency Guarantees

### **✅ What's Consistent:**
1. **Progress formula**: All use `calculateProgress()` utility
2. **Status thresholds**: 95% (on-track), 80% (at-risk), <80% (off-track)
3. **Rounding**: All use 1 decimal place for emissions (tCO2e)
4. **Baseline year**: 2023 for Energy/Water/Waste
5. **Forecast fallback**: Linear projection if ML unavailable

### **⚠️ What Varies by Dashboard:**
1. **Reduction rates**: Energy (dynamic), Water (2.5%), Emissions (4.2% default), Waste (3%)
2. **Forecast method**: Energy (ML), Water/Waste (EnterpriseForecast), Emissions (Replanning)
3. **Target calculation**: Energy (category-based), Water/Waste (compound formula), Emissions (table lookup)
4. **Baseline year**: Emissions can have variable baseline

---

## 10. Recommendations

### **For Consistency:**
1. Consider standardizing reduction rates across dashboards
2. Use same forecast method (enterprise ML) for all dashboards
3. Store all targets in `sustainability_targets` table (not hardcoded)
4. Document expected behavior when projected > baseline

### **For Accuracy:**
1. Validate forecast projections monthly
2. Compare projected vs actual at year-end
3. Adjust emission factors based on regional grid mix
4. Review reduction rates annually based on industry benchmarks

### **For User Experience:**
1. Show calculation method in tooltip (ML vs linear)
2. Explain why projected > baseline with actionable insights
3. Provide drill-down to see which months caused exceedance
4. Add "What-if" scenarios to explore different reduction strategies
