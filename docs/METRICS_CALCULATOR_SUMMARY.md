# Metrics Calculator - Complete Single Source of Truth

## Overview

**ALL metric calculations in the platform now use ONE calculator:**

`/src/lib/sustainability/baseline-calculator.ts`

## What This Calculator Handles

### ✅ Emissions
- Total emissions (scope-by-scope rounding)
- Baseline emissions (default: 2 years ago)
- Year emissions
- Period emissions (custom date range)
- Monthly emissions trends

### ✅ Scope Breakdowns
- Scope 1, 2, 3 breakdown
- Category breakdown with scope details
- Percentage calculations

### ✅ Other Metrics
- Energy consumption (MWh)
- Water usage (m³)
- Waste generated (kg)

### ✅ Trend Data
- Monthly emissions by scope
- Time series data

## Key Functions

### Core Emissions Functions
| Function | Use Case | Returns |
|----------|----------|---------|
| `getBaselineEmissions(orgId, year?)` | Baseline year (default: current - 2) | Full baseline object with scopes |
| `getYearEmissions(orgId, year)` | Full year total | Single number (tCO2e) |
| `getPeriodEmissions(orgId, start, end)` | Custom date range | Object with scope breakdown |

### Breakdown Functions
| Function | Use Case | Returns |
|----------|----------|---------|
| `getScopeBreakdown(orgId, start, end)` | Scope breakdown | Scope 1/2/3 + total |
| `getCategoryBreakdown(orgId, start, end)` | Category emissions | Array sorted by total |

### Other Metrics Functions
| Function | Use Case | Returns |
|----------|----------|---------|
| `getEnergyTotal(orgId, start, end)` | Energy consumption | Value in MWh |
| `getWaterTotal(orgId, start, end)` | Water usage | Value in m³ |
| `getWasteTotal(orgId, start, end)` | Waste generated | Value in kg |

### Trend & Monthly Functions
| Function | Use Case | Returns |
|----------|----------|---------|
| `getMonthlyEmissions(orgId, start, end)` | Monthly trend | Array of monthly data |

### NEW: Advanced Analytics Functions
| Function | Use Case | Returns |
|----------|----------|---------|
| `getIntensityMetrics(orgId, start, end, employees, revenue, sqm)` | All intensity metrics with YoY | Per employee, revenue, sqm with YoY |
| `getYoYComparison(orgId, start, end, metricType)` | Standardized YoY for any metric | Current, previous, change, trend |
| `getTopEmissionSources(orgId, start, end, limit?)` | Top sources with recommendations | Ranked categories with trends |
| `getProjectedAnnualEmissions(orgId, year)` | Year-end projections | Actual + forecast + confidence |

### NEW: Individual Category Functions
| Function | Use Case | Returns |
|----------|----------|---------|
| `getCategoryEmissions(orgId, category, start, end)` | Specific category emissions | Emissions + percentage for one category |
| `getScopeCategoryBreakdown(orgId, scope, start, end)` | All categories in a scope | Array of categories sorted by emissions |

### NEW: Individual Metric Functions
| Function | Use Case | Returns |
|----------|----------|---------|
| `getMetricValue(orgId, metricName, start, end)` | Specific metric value + emissions | Value in native unit + tCO2e generated |
| `getCategoryMetrics(orgId, category, start, end)` | All metrics in a category | Array of metrics sorted by emissions |
| `getTopMetrics(orgId, start, end, limit?)` | Top emission-generating metrics | Ranked metrics across all categories |

## Calculation Method

### Why Scope-by-Scope Rounding?

All emissions are calculated using this method:

1. **Query** metrics_data joined with metrics_catalog
2. **Group** by scope (scope_1, scope_2, scope_3)
3. **Convert** each scope from kg to tonnes (÷ 1000)
4. **Round** each scope to 1 decimal place
5. **Sum** the rounded scope values
6. **Round** the total to 1 decimal place

**Example:**
```
Raw data (kg CO2e):
- Scope 1: 0 kg
- Scope 2: 177,880 kg
- Scope 3: 125,665 kg
Total: 303,545 kg

❌ Direct: 303,545 / 1000 = 303.545 → 303.5 tCO2e
✅ Scope-by-scope:
  - S1: 0 / 1000 = 0.0 → 0.0
  - S2: 177,880 / 1000 = 177.88 → 177.9
  - S3: 125,665 / 1000 = 125.665 → 125.7
  Total: 0.0 + 177.9 + 125.7 = 303.6 tCO2e ✓
```

This matches how organizations report in GHG inventories.

## APIs Updated

All APIs now use the calculator:

- ✅ `/api/sustainability/baseline` - Direct baseline endpoint
- ✅ `/api/sustainability/targets` - SBTi targets (uses `getBaselineEmissions`)
- ✅ `/api/sustainability/dashboard` - Overview (uses scope-by-scope logic)

## Rules for Developers

### ❌ NEVER Do This:
```typescript
// DON'T calculate directly
const total = data.reduce((sum, d) => sum + d.co2e_emissions, 0) / 1000;

// DON'T query without scope
const { data } = await supabase
  .from('metrics_data')
  .select('co2e_emissions')
  .eq('organization_id', orgId);

// DON'T create your own calculator
function myCalculateEmissions(data) { ... }
```

### ✅ ALWAYS Do This:
```typescript
// DO use the shared calculator
import { getPeriodEmissions } from '@/lib/sustainability/baseline-calculator';

const emissions = await getPeriodEmissions(orgId, startDate, endDate);
console.log(emissions.total); // 303.6 tCO2e
```

## Testing Consistency

All APIs should return the same values for the same period:

```bash
# 2023 baseline
GET /api/sustainability/baseline?year=2023
# Returns: { total: 303.6, scope_1: 0.0, scope_2: 177.9, scope_3: 125.7 }

# Dashboard for 2023
GET /api/sustainability/dashboard?range=2023
# Should show: 303.6 tCO2e

# Targets page
GET /api/sustainability/targets
# Baseline should be: 303.6 tCO2e
```

If values don't match, you're calculating incorrectly!

## Migration Complete

✅ **Calculator created** with all metric functions
✅ **APIs updated** to use calculator
✅ **Database updated** with correct baseline values
✅ **Documentation complete** with usage examples
✅ **Consistency achieved** - 303.6 tCO2e everywhere

## Files

- **Calculator**: `/src/lib/sustainability/baseline-calculator.ts` (500 lines)
- **Usage Guide**: `/docs/EMISSIONS_CALCULATOR_USAGE.md`
- **Architecture**: `/docs/BASELINE_EMISSIONS_ARCHITECTURE.md`
- **This Summary**: `/docs/METRICS_CALCULATOR_SUMMARY.md`

## Benefits

1. **Consistency**: Same values across all pages
2. **Maintainability**: Update logic in one place
3. **Accuracy**: Proper rounding matching GHG standards
4. **Testability**: One source to test
5. **Type Safety**: TypeScript interfaces for all returns
6. **Performance**: Optimized queries with proper indexes

## Next Steps

When adding new features that need metrics:

1. ✅ Check if calculator has the function you need
2. ✅ If not, ADD it to the calculator (don't create your own)
3. ✅ Import from calculator in your API
4. ✅ Test that values match baseline API
5. ✅ Update documentation

**Remember: One calculator, one truth! 🎯**
