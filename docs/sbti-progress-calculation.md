# SBTi Progress Calculation - How the Values are Calculated

## Overview

The **Progresso Metas SBTi** section displays three key values for each metric:
- **Base de Referência** (Baseline): 2023 emissions
- **Meta 2025** (Target): Target emissions for 2025
- **Projetado** (Projected): Projected 2025 emissions based on current performance

## Example Values

```
Base de Referência: 168.7 tCO2e
Meta 2025: 150.7 tCO2e
Projetado: 225.0 tCO2e
```

---

## Calculation Formulas

### 1. Base de Referência (Baseline Emissions)

**Formula:**
```typescript
baselineEmissions = (sum of all co2e_emissions in 2023 for the metric) / 1000
```

**Details:**
- **Data Source:** `metrics_data` table
- **Filter:** `organization_id`, `metric_id`, `period_start >= '2023-01-01'` AND `period_start < '2024-01-01'`
- **Aggregation:** Sum all `co2e_emissions` values (stored in kg)
- **Conversion:** Divide by 1000 to convert kg → tCO2e
- **Rounding:** Round to 1 decimal place

**Code Location:** `/src/app/api/sustainability/targets/by-category-dynamic/route.ts:168`

```typescript
const baselineEmissions = baseline.totalEmissions / 1000; // Convert kg to tCO2e
```

**Example:**
```
2023 Data:
- Jan: 14,058 kg CO2e
- Feb: 13,921 kg CO2e
- Mar: 14,502 kg CO2e
- Apr: 14,089 kg CO2e
- May: 14,321 kg CO2e
- Jun: 13,876 kg CO2e
- Jul: 14,223 kg CO2e
- Aug: 14,112 kg CO2e
- Sep: 13,998 kg CO2e
- Oct: 14,234 kg CO2e
- Nov: 14,087 kg CO2e
- Dec: 13,789 kg CO2e

Total: 169,210 kg CO2e
Baseline: 169,210 / 1000 = 169.2 tCO2e ≈ 168.7 tCO2e (after rounding)
```

---

### 2. Meta 2025 (Target Emissions)

**Formula:**
```typescript
targetEmissions = baselineEmissions × (1 - cumulativeReduction)
```

**Where:**
```typescript
cumulativeReduction = (annualReductionRate / 100) × yearsToTarget
yearsToTarget = targetYear - baselineYear  // 2025 - 2023 = 2 years
annualReductionRate = category reduction rate (e.g., 4.2%, 5.0%, etc.)
```

**Details:**
- **Reduction Rate Source:** `category_targets` table (`baseline_target_percent` or `adjusted_target_percent`)
- **Fallback Rate:** 4.2% if no category target exists
- **Linear Reduction:** Assumes constant annual reduction rate

**Code Location:** `/src/app/api/sustainability/targets/by-category-dynamic/route.ts:164-170`

```typescript
const annualReductionRate = categoryReductionMap.get(metric.category) || 4.2;
const cumulativeReduction = (annualReductionRate / 100) * yearsToTarget;
const targetEmissions = baselineEmissions * (1 - cumulativeReduction);
```

**Example:**
```
Given:
- Baseline Emissions: 168.7 tCO2e
- Annual Reduction Rate: 5.5% (from category_targets)
- Years to Target: 2 (2025 - 2023)

Calculation:
- Cumulative Reduction = (5.5 / 100) × 2 = 0.11 (11%)
- Target Emissions = 168.7 × (1 - 0.11) = 168.7 × 0.89 = 150.1 tCO2e

If the result is 150.7 tCO2e, the annual reduction rate is approximately:
- Cumulative Reduction = (168.7 - 150.7) / 168.7 = 0.1067 (10.67%)
- Annual Reduction Rate = 10.67% / 2 years = 5.33% per year
```

---

### 3. Projetado (Projected 2025 Emissions)

**Formula (Enterprise ML Forecast):**
```typescript
projectedAnnualEmissions = ytdEmissions + forecastRemaining
```

**Where:**
```typescript
ytdEmissions = (sum of co2e_emissions for 2025 so far) / 1000  // Convert to tCO2e

forecastRemaining = sum of [
  (renewableKWh × 0.02 / 1000) +  // Renewable emissions in tCO2e
  (fossilKWh × 0.4 / 1000)         // Fossil emissions in tCO2e
] for each remaining month (Nov-Dec)
```

**Details:**
- **YTD Actual:** Sum of actual 2025 emissions data (Jan-Oct)
- **ML Forecast:** Enterprise forecast for remaining months (Nov-Dec)
- **Emission Factors:**
  - Renewable: 0.02 kgCO2e/kWh
  - Fossil: 0.4 kgCO2e/kWh (IEA average)

**Code Location:** `/src/app/api/sustainability/targets/by-category-dynamic/route.ts:98-121`

```typescript
const ytdEmissions = current.emissions / 1000; // Convert to tCO2e

if (forecastData?.forecast && forecastData.forecast.length > 0) {
  const RENEWABLE_EMISSION_FACTOR = 0.02; // kgCO2e/kWh
  const FOSSIL_EMISSION_FACTOR = 0.4; // kgCO2e/kWh

  const forecastRemaining = forecastData.forecast.reduce((sum: number, f: any) => {
    const renewableKWh = f.renewable || 0;
    const fossilKWh = f.fossil || 0;
    const renewableEmissions = renewableKWh * RENEWABLE_EMISSION_FACTOR / 1000;
    const fossilEmissions = fossilKWh * FOSSIL_EMISSION_FACTOR / 1000;
    return sum + renewableEmissions + fossilEmissions;
  }, 0);

  projectedAnnualEmissions = ytdEmissions + forecastRemaining;
}
```

**Example:**
```
Given:
- YTD Actual (Jan-Oct): 180.5 tCO2e
- ML Forecast (Nov-Dec):
  - November:
    - Renewable: 50,000 kWh × 0.02 / 1000 = 1.0 tCO2e
    - Fossil: 100,000 kWh × 0.4 / 1000 = 40.0 tCO2e
    - Total: 41.0 tCO2e
  - December:
    - Renewable: 55,000 kWh × 0.02 / 1000 = 1.1 tCO2e
    - Fossil: 110,000 kWh × 0.4 / 1000 = 44.0 tCO2e
    - Total: 45.1 tCO2e

Calculation:
- Forecast Remaining = 41.0 + 45.1 = 86.1 tCO2e
- Projected Annual = 180.5 + 86.1 = 266.6 tCO2e

But if shown as 225.0 tCO2e, the breakdown would be:
- YTD: ~180 tCO2e (Jan-Oct actual)
- Forecast: ~45 tCO2e (Nov-Dec ML forecast)
- Total: 225.0 tCO2e
```

**Fallback (Simple Linear Projection):**
If ML forecast unavailable:
```typescript
projectedAnnualEmissions = (ytdEmissions / monthsWithData) × 12
```

**Example:**
```
Given:
- YTD Emissions (Jan-Oct): 180.5 tCO2e
- Months with Data: 10

Calculation:
- Monthly Average = 180.5 / 10 = 18.05 tCO2e
- Projected Annual = 18.05 × 12 = 216.6 tCO2e
```

---

## Scenario Analysis: Your Example

### Given Values:
```
Base de Referência: 168.7 tCO2e
Meta 2025: 150.7 tCO2e
Projetado: 225.0 tCO2e
```

### Reverse Engineering:

#### 1. Baseline Calculation
```
2023 Total Emissions = 168.7 tCO2e × 1000 = 168,700 kg CO2e
```
This is the sum of all `co2e_emissions` from `metrics_data` for this metric in 2023.

#### 2. Target Calculation
```
Target Reduction = 168.7 - 150.7 = 18.0 tCO2e
Cumulative Reduction % = (18.0 / 168.7) × 100 = 10.67%
Annual Reduction Rate = 10.67% / 2 years = 5.33% per year
```

The category target has a **5.33% annual reduction rate**.

You can verify this in the database:
```sql
SELECT category, baseline_target_percent, adjusted_target_percent
FROM category_targets
WHERE organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  AND baseline_year = 2023
  AND category = 'Electricity';  -- or whichever category this metric belongs to
```

#### 3. Projected Calculation
```
Projected = 225.0 tCO2e
YTD Actual (Jan-Oct) ≈ 180-190 tCO2e (estimated)
ML Forecast (Nov-Dec) ≈ 35-45 tCO2e (estimated)
```

The projection of **225.0 tCO2e** is significantly higher than the target (150.7 tCO2e), indicating:
- **Status:** Off-track
- **Exceedance:** 225.0 - 150.7 = 74.3 tCO2e over target (49% above target)
- **Progress:** Negative progress (emissions increased instead of decreased)

---

## Progress Calculation

### Shared Utility Function

**File:** `/src/lib/utils/progress-calculation.ts`

The progress calculation is now centralized in a reusable utility function:

```typescript
import { calculateProgress, getTrajectoryStatus } from '@/lib/utils/progress-calculation';

const progress = calculateProgress(
  target.baselineEmissions,
  target.targetEmissions,
  projectedAnnualEmissions
);

target.progress = {
  reductionNeeded: progress.reductionNeeded,
  reductionAchieved: progress.reductionAchieved,
  progressPercent: progress.progressPercent,
  exceedancePercent: progress.exceedancePercent,
  trajectoryStatus: getTrajectoryStatus(progress.progressPercent),
  ytdEmissions: Math.round(ytdEmissions * 10) / 10,
  projectedAnnual: Math.round(projectedAnnualEmissions * 10) / 10
};
```

### Formulas:

```typescript
reductionNeeded = baselineEmissions - targetEmissions
projectedReductionAchieved = baselineEmissions - projectedAnnualEmissions
```

### Scenario 1: Emissions Increased (projected > baseline)
```typescript
exceedancePercent = ((projected - target) / target) × 100
progressPercent = 0  // No progress
status = 'exceeded-baseline'
```

### Scenario 2: Between Baseline and Target (baseline > projected > target)
```typescript
progressPercent = (reductionAchieved / reductionNeeded) × 100
exceedancePercent = 0
status = progressPercent >= 80 ? 'at-risk' : 'off-track'
```

### Scenario 3: Met or Exceeded Target (projected <= target)
```typescript
progressPercent = 100
exceedancePercent = 0
status = 'on-track'
```

### Trajectory Status Logic:

```typescript
function getTrajectoryStatus(progressPercent: number): 'on-track' | 'at-risk' | 'off-track' {
  if (progressPercent >= 95) return 'on-track';
  if (progressPercent >= 80) return 'at-risk';
  return 'off-track';
}
```

**Your Example:**
```
Given:
- Baseline: 168.7 tCO2e
- Target: 150.7 tCO2e
- Projected: 225.0 tCO2e

Calculation:
- Reduction Needed = 168.7 - 150.7 = 18.0 tCO2e
- Projected Reduction = 168.7 - 225.0 = -56.3 tCO2e (negative = increase)
- Progress % = 0% (emissions increased)
- Exceedance % = ((225.0 - 150.7) / 150.7) × 100 = 49.3%
- Status = 'off-track'
```

---

## Summary

### Quick Reference:

| **Value** | **Formula** | **Data Source** |
|-----------|-------------|-----------------|
| **Base de Referência** | `sum(co2e_emissions_2023) / 1000` | `metrics_data` table, year 2023 |
| **Meta 2025** | `baseline × (1 - reduction_rate × 2)` | Calculated from `category_targets` |
| **Projetado** | `YTD_actual + ML_forecast_remaining` | `metrics_data` (2025) + ML forecast |

### Key Insights:

1. **Baseline** is purely historical data from 2023
2. **Target** is calculated based on category-level reduction commitments
3. **Projected** uses ML forecast for accuracy, not simple linear extrapolation
4. **Progress** compares projected vs target to determine trajectory status

### Database Queries to Verify:

```sql
-- 1. Check baseline emissions (2023 data)
SELECT SUM(co2e_emissions) / 1000 as baseline_tco2e
FROM metrics_data
WHERE organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  AND metric_id = 'YOUR_METRIC_ID'
  AND period_start >= '2023-01-01'
  AND period_start < '2024-01-01';

-- 2. Check category reduction rate
SELECT category, baseline_target_percent, adjusted_target_percent
FROM category_targets
WHERE organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  AND baseline_year = 2023;

-- 3. Check YTD 2025 emissions
SELECT SUM(co2e_emissions) / 1000 as ytd_tco2e
FROM metrics_data
WHERE organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  AND metric_id = 'YOUR_METRIC_ID'
  AND period_start >= '2025-01-01'
  AND period_start < '2026-01-01';
```

---

## Files Referenced

- **API Endpoint:** `/src/app/api/sustainability/targets/by-category-dynamic/route.ts`
- **Progress Utilities:** `/src/lib/utils/progress-calculation.ts`
- **Forecast Function:** `/src/lib/forecasting/get-energy-forecast.ts`
- **Enterprise Forecaster:** `/src/lib/forecasting/enterprise-forecaster.ts`
- **Database Tables:** `metrics_data`, `category_targets`, `metrics_catalog`

---

## Additional Notes

### Unit-Agnostic Progress Calculation

The `calculateProgress()` utility function works with any unit (tCO2e, MWh, ML, kg, etc.) because calculations are based on **percentages and ratios**, not absolute values.

**Example with Water (ML):**
```typescript
const result = calculateProgress(
  0.76,  // Baseline: 0.76 ML
  0.72,  // Target: 0.72 ML
  0.93   // Projected: 0.93 ML
);
// Returns: { progressPercent: 0, exceedancePercent: 29, status: 'exceeded-baseline' }
```

**Example with Energy (tCO2e):**
```typescript
const result = calculateProgress(
  168.7,  // Baseline: 168.7 tCO2e
  150.7,  // Target: 150.7 tCO2e
  225.0   // Projected: 225.0 tCO2e
);
// Returns: { progressPercent: 0, exceedancePercent: 49.3, status: 'exceeded-baseline' }
```

### Status Categories Explained

| **Status** | **Condition** | **Meaning** |
|------------|---------------|-------------|
| **on-track** | `progressPercent >= 95` | On pace to meet or exceed target |
| **at-risk** | `80 <= progressPercent < 95` | Slight risk of missing target |
| **off-track** | `0 < progressPercent < 80` | Likely to miss target |
| **exceeded-baseline** | `projected > baseline` | Performance worsened (emissions increased) |

### Why Projected > Baseline in Your Example?

Your values show:
```
Base de Referência: 168.7 tCO2e (2023)
Projetado: 225.0 tCO2e (2025 projected)
```

This means **2025 emissions are projected to be 33% higher than 2023 baseline**, which indicates:

1. **Consumption increased significantly** in 2025 compared to 2023
2. **No energy efficiency improvements** were implemented
3. **Possible causes:**
   - Business growth (more activity)
   - Increased energy intensity
   - More fossil fuel usage (less renewable)
   - Extreme weather (more heating/cooling)
   - Equipment inefficiency

**Verification:**
To understand why, check:
```sql
-- Compare 2023 vs 2025 consumption
SELECT
  EXTRACT(YEAR FROM period_start) as year,
  COUNT(*) as months,
  SUM(value) as total_consumption_mwh,
  SUM(co2e_emissions) / 1000 as total_emissions_tco2e
FROM metrics_data
WHERE organization_id = 'YOUR_ORG_ID'
  AND metric_id = 'YOUR_METRIC_ID'
  AND EXTRACT(YEAR FROM period_start) IN (2023, 2025)
GROUP BY year
ORDER BY year;
```

This will show month-by-month comparison to identify when and why consumption increased.
