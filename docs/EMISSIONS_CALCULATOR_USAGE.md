# Metrics Calculator Usage Guide

## Single Source of Truth

**`/src/lib/sustainability/baseline-calculator.ts`** is the ONLY place where ALL metrics (emissions, energy, water, waste, scopes, categories) are calculated.

**NEVER calculate any metric directly in your API. Always use the calculator.**

## Rule: Never Calculate Emissions Directly

❌ **WRONG - Don't do this in your API:**
```typescript
// BAD: Direct calculation
const total = data.reduce((sum, d) => sum + d.co2e_emissions, 0) / 1000;
```

✅ **CORRECT - Use the shared calculator:**
```typescript
import { getPeriodEmissions } from '@/lib/sustainability/baseline-calculator';

const emissions = await getPeriodEmissions(organizationId, startDate, endDate);
console.log(emissions.total); // 303.6 tCO2e
```

## Available Functions

### EMISSIONS FUNCTIONS

#### 1. getBaselineEmissions - For baseline year
```typescript
import { getBaselineEmissions } from '@/lib/sustainability/baseline-calculator';

// Default: 2 years ago (2023 if current year is 2025)
const baseline = await getBaselineEmissions(organizationId);

// Specific year
const baseline2022 = await getBaselineEmissions(organizationId, 2022);

console.log(baseline);
// {
//   year: 2023,
//   scope_1: 0.0,
//   scope_2: 177.9,
//   scope_3: 125.7,
//   total: 303.6,
//   scope_3_percentage: 41.4,
//   recordCount: 1000,
//   unit: 'tCO2e'
// }
```

### 2. getYearEmissions - For any full year
```typescript
import { getYearEmissions } from '@/lib/sustainability/baseline-calculator';

const emissions2024 = await getYearEmissions(organizationId, 2024);
console.log(emissions2024); // 289.4 (just the number)
```

### 3. getPeriodEmissions - For custom date ranges
```typescript
import { getPeriodEmissions } from '@/lib/sustainability/baseline-calculator';

// Quarter
const q1 = await getPeriodEmissions(
  organizationId,
  '2024-01-01',
  '2024-03-31'
);

console.log(q1);
// {
//   total: 72.3,
//   scope_1: 0.0,
//   scope_2: 44.5,
//   scope_3: 27.8
// }

// Month
const january = await getPeriodEmissions(
  organizationId,
  '2024-01-01',
  '2024-01-31'
);
```

## Why Scope-by-Scope Rounding?

The calculator rounds each scope individually before summing:

```
Raw data (kg CO2e):
- Scope 1: 0 kg
- Scope 2: 177,880 kg
- Scope 3: 125,665 kg
Total: 303,545 kg

❌ Direct calculation:
303,545 / 1000 = 303.545 → rounds to 303.5 tCO2e

✅ Scope-by-scope (baseline-calculator):
- Scope 1: 0 / 1000 = 0.0 → 0.0
- Scope 2: 177,880 / 1000 = 177.88 → 177.9
- Scope 3: 125,665 / 1000 = 125.665 → 125.7
Total: 0.0 + 177.9 + 125.7 = 303.6 tCO2e
```

This matches how organizations report emissions in GHG inventories - by scope first, then total.

## Migration Checklist

When adding emissions to a new API:

- [ ] Import from `@/lib/sustainability/baseline-calculator`
- [ ] Use `getBaselineEmissions`, `getYearEmissions`, or `getPeriodEmissions`
- [ ] Never query metrics_data directly for emissions
- [ ] Never use `reduce()` to sum emissions
- [ ] Never divide by 1000 manually
- [ ] Test that your values match the baseline API

## Testing Consistency

To verify your API returns consistent values:

```bash
# Get baseline for 2023
curl http://localhost:3000/api/sustainability/baseline?year=2023

# Your API should return the same total: 303.6 tCO2e
curl http://localhost:3000/api/your-endpoint?year=2023
```

If the values don't match, you're calculating incorrectly. Use the shared calculator!

## Common Mistakes

### Mistake 1: Summing first, then rounding
```typescript
// ❌ WRONG
const total = data.reduce((sum, d) => sum + d.co2e_emissions, 0) / 1000;
return Math.round(total * 10) / 10; // Returns 303.5 instead of 303.6
```

### Mistake 2: Not joining with metrics_catalog
```typescript
// ❌ WRONG - Can't get scope breakdown
const { data } = await supabase
  .from('metrics_data')
  .select('co2e_emissions')
  .eq('organization_id', orgId);
```

### Mistake 3: Creating a duplicate calculator
```typescript
// ❌ WRONG - Don't create your own function
function calculateEmissions(data) {
  return data.reduce((sum, d) => sum + d.co2e_emissions, 0);
}

// ✅ CORRECT - Use the shared one
import { getPeriodEmissions } from '@/lib/sustainability/baseline-calculator';
```

## Summary

1. **Never calculate emissions directly in APIs**
2. **Always import from baseline-calculator.ts**
3. **Test that your values match /api/sustainability/baseline**
4. **When in doubt, ask: "Am I using the shared calculator?"**

One calculator, one truth, consistent values everywhere. 🎯

### SCOPE & CATEGORY FUNCTIONS

#### getScopeBreakdown - Get emissions by scope
```typescript
import { getScopeBreakdown } from '@/lib/sustainability/baseline-calculator';

const scopes = await getScopeBreakdown(organizationId, '2024-01-01', '2024-12-31');
// { scope_1: 0.0, scope_2: 177.9, scope_3: 125.7, total: 303.6 }
```

#### getCategoryBreakdown - Get emissions by category with scopes
```typescript
import { getCategoryBreakdown } from '@/lib/sustainability/baseline-calculator';

const categories = await getCategoryBreakdown(organizationId, '2024-01-01', '2024-12-31');
// [
//   { category: 'Business Travel', scope_1: 0, scope_2: 0, scope_3: 125.7, total: 125.7, percentage: 41.4 },
//   { category: 'Purchased Energy', scope_1: 0, scope_2: 177.9, scope_3: 0, total: 177.9, percentage: 58.6 }
// ]
```

### OTHER METRICS FUNCTIONS

#### getEnergyTotal - Total energy consumption
```typescript
import { getEnergyTotal } from '@/lib/sustainability/baseline-calculator';

const energy = await getEnergyTotal(organizationId, '2024-01-01', '2024-12-31');
// { value: 892.3, unit: 'MWh', recordCount: 240 }
```

#### getWaterTotal - Total water usage
```typescript
import { getWaterTotal } from '@/lib/sustainability/baseline-calculator';

const water = await getWaterTotal(organizationId, '2024-01-01', '2024-12-31');
// { value: 15234, unit: 'm³', recordCount: 120 }
```

#### getWasteTotal - Total waste generated
```typescript
import { getWasteTotal } from '@/lib/sustainability/baseline-calculator';

const waste = await getWasteTotal(organizationId, '2024-01-01', '2024-12-31');
// { value: 8450, unit: 'kg', recordCount: 48 }
```

### TREND/MONTHLY FUNCTIONS

#### getMonthlyEmissions - Monthly emissions trend
```typescript
import { getMonthlyEmissions } from '@/lib/sustainability/baseline-calculator';

const monthly = await getMonthlyEmissions(organizationId, '2024-01-01', '2024-12-31');
// [
//   { month: '2024-01', emissions: 25.3, scope_1: 0.0, scope_2: 14.8, scope_3: 10.5 },
//   { month: '2024-02', emissions: 24.1, scope_1: 0.0, scope_2: 14.2, scope_3: 9.9 },
//   ...
// ]
```

### INTENSITY METRICS FUNCTIONS

#### getIntensityMetrics - All intensity metrics with YoY
```typescript
import { getIntensityMetrics } from '@/lib/sustainability/baseline-calculator';

const intensities = await getIntensityMetrics(
  organizationId,
  '2024-01-01',
  '2024-12-31',
  200,      // employees
  5000000,  // revenue
  12000     // total area sqm
);
// {
//   perEmployee: 1.52,
//   perEmployeeYoY: -12.3,
//   perRevenue: 60.72,      // tCO2e per million revenue
//   perRevenueYoY: -15.2,
//   perSqm: 25.3,            // kg CO2e per sqm
//   perSqmYoY: -10.5,
//   unit: 'tCO2e'
// }
```

### YEAR-OVER-YEAR COMPARISON FUNCTIONS

#### getYoYComparison - Standardized YoY for any metric
```typescript
import { getYoYComparison } from '@/lib/sustainability/baseline-calculator';

const emissionsYoY = await getYoYComparison(
  organizationId,
  '2024-01-01',
  '2024-12-31',
  'emissions'
);
// {
//   current: 303.6,
//   previous: 408.2,
//   change: -104.6,
//   percentageChange: -25.6,
//   trend: 'down'
// }

const energyYoY = await getYoYComparison(
  organizationId,
  '2024-01-01',
  '2024-12-31',
  'energy'
);
// Same structure for energy, water, or waste
```

### TOP EMISSION SOURCES FUNCTIONS

#### getTopEmissionSources - Ranked sources with recommendations
```typescript
import { getTopEmissionSources } from '@/lib/sustainability/baseline-calculator';

const topSources = await getTopEmissionSources(
  organizationId,
  '2024-01-01',
  '2024-12-31',
  5  // limit to top 5
);
// [
//   {
//     category: 'Purchased Energy',
//     scope: 'Scope 2',
//     emissions: 177.9,
//     percentage: 58.6,
//     trend: 'down',
//     yoyChange: -15.2,
//     recommendation: 'Switch to renewable energy contracts and improve energy efficiency'
//   },
//   {
//     category: 'Business Travel',
//     scope: 'Scope 3',
//     emissions: 125.7,
//     percentage: 41.4,
//     trend: 'down',
//     yoyChange: -35.8,
//     recommendation: 'Implement virtual meeting policy and promote public transportation'
//   }
// ]
```

### PROJECTED EMISSIONS FUNCTIONS

#### getProjectedAnnualEmissions - Year-end projections
```typescript
import { getProjectedAnnualEmissions } from '@/lib/sustainability/baseline-calculator';

const projection = await getProjectedAnnualEmissions(organizationId, 2025);
// {
//   actualEmissions: 245.2,      // Actual to date
//   projectedTotal: 289.4,       // Projected full year
//   forecastEmissions: 44.2,     // Forecasted remaining
//   confidenceLevel: 85,         // % (based on data completeness)
//   method: 'linear-projection',
//   daysActual: 283,
//   daysRemaining: 82
// }
```

### INDIVIDUAL CATEGORY FUNCTIONS

#### getCategoryEmissions - Specific category emissions
```typescript
import { getCategoryEmissions } from '@/lib/sustainability/baseline-calculator';

const businessTravel = await getCategoryEmissions(
  organizationId,
  'Business Travel',
  '2024-01-01',
  '2024-12-31'
);
// {
//   category: 'Business Travel',
//   scope: 'scope_3',
//   emissions: 125.7,
//   percentage: 41.4,
//   recordCount: 450
// }

// Works for all 21 categories (4 Scope 1, 2 Scope 2, 15 Scope 3)
const electricity = await getCategoryEmissions(organizationId, 'Electricity', '2024-01-01', '2024-12-31');
const waste = await getCategoryEmissions(organizationId, 'Waste', '2024-01-01', '2024-12-31');
```

#### getScopeCategoryBreakdown - All categories in a scope
```typescript
import { getScopeCategoryBreakdown } from '@/lib/sustainability/baseline-calculator';

const scope3Categories = await getScopeCategoryBreakdown(
  organizationId,
  'scope_3',
  '2024-01-01',
  '2024-12-31'
);
// [
//   { category: 'Business Travel', scope: 'scope_3', emissions: 125.7, percentage: 100.0, recordCount: 450 },
//   { category: 'Employee Commuting', scope: 'scope_3', emissions: 0.0, percentage: 0.0, recordCount: 0 },
//   // ... all 15 Scope 3 categories sorted by emissions
// ]

// Works for all scopes
const scope1Categories = await getScopeCategoryBreakdown(organizationId, 'scope_1', '2024-01-01', '2024-12-31');
const scope2Categories = await getScopeCategoryBreakdown(organizationId, 'scope_2', '2024-01-01', '2024-12-31');
```

### INDIVIDUAL METRIC FUNCTIONS

#### getMetricValue - Specific metric value + emissions
```typescript
import { getMetricValue } from '@/lib/sustainability/baseline-calculator';

const electricity = await getMetricValue(
  organizationId,
  'Electricity',
  '2024-01-01',
  '2024-12-31'
);
// {
//   name: 'Electricity',
//   value: 892345.5,         // Actual consumption
//   unit: 'kWh',
//   category: 'Electricity',
//   scope: 'scope_2',
//   emissions: 177.9,        // tCO2e generated
//   recordCount: 240
// }

const carTravel = await getMetricValue(organizationId, 'Car Travel', '2024-01-01', '2024-12-31');
// {
//   name: 'Car Travel',
//   value: 125340,           // km
//   unit: 'km',
//   category: 'Business Travel',
//   scope: 'scope_3',
//   emissions: 82.5,
//   recordCount: 156
// }
```

#### getCategoryMetrics - All metrics in a category
```typescript
import { getCategoryMetrics } from '@/lib/sustainability/baseline-calculator';

const travelMetrics = await getCategoryMetrics(
  organizationId,
  'Business Travel',
  '2024-01-01',
  '2024-12-31'
);
// [
//   { name: 'Car Travel', value: 125340, unit: 'km', category: 'Business Travel', scope: 'scope_3', emissions: 82.5, recordCount: 156 },
//   { name: 'Flight Travel', value: 45230, unit: 'km', category: 'Business Travel', scope: 'scope_3', emissions: 38.2, recordCount: 89 },
//   { name: 'Train Travel', value: 12450, unit: 'km', category: 'Business Travel', scope: 'scope_3', emissions: 5.0, recordCount: 67 }
// ]
// Sorted by emissions (highest first)
```

#### getTopMetrics - Top emission-generating metrics
```typescript
import { getTopMetrics } from '@/lib/sustainability/baseline-calculator';

const topMetrics = await getTopMetrics(
  organizationId,
  '2024-01-01',
  '2024-12-31',
  10  // Top 10
);
// [
//   { name: 'Electricity', value: 892345.5, unit: 'kWh', category: 'Electricity', scope: 'scope_2', emissions: 177.9, recordCount: 240 },
//   { name: 'Car Travel', value: 125340, unit: 'km', category: 'Business Travel', scope: 'scope_3', emissions: 82.5, recordCount: 156 },
//   { name: 'Flight Travel', value: 45230, unit: 'km', category: 'Business Travel', scope: 'scope_3', emissions: 38.2, recordCount: 89 },
//   // ... top 10 metrics across ALL categories
// ]
```

