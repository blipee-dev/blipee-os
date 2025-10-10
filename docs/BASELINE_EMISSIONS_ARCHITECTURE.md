# Baseline Emissions Architecture - Single Source of Truth

## Problem
Previously, baseline emissions were calculated inconsistently across different parts of the application:
- Dashboard API calculated emissions without rounding
- Targets API had its own calculation logic
- Overview page used different methods
- This led to different values (303.5 vs 303.6 tCO2e) being displayed across pages

## Solution
We've centralized baseline emission calculations into a single shared module that all APIs use.

## Architecture

### Core Module
**`/src/lib/sustainability/baseline-calculator.ts`**

This module provides the **ONLY** functions for calculating emissions across the platform:

- `getBaselineEmissions(organizationId, year?)` - Calculate baseline for a specific year (default: 2 years ago)
- `getYearEmissions(organizationId, year)` - Calculate total for any full year
- `getPeriodEmissions(organizationId, startDate, endDate)` - Calculate for any custom date range

**All calculations follow the same process:**
1. Query metrics_data joined with metrics_catalog to get scope information
2. Calculate **each scope separately** (scope 1, 2, 3)
3. Convert each scope from kg CO2e to tonnes CO2e (divide by 1000)
4. **Round each scope to 1 decimal place**
5. **Sum the rounded scope values**
6. **Round the total to 1 decimal place** (prevents floating point errors)
7. Return structured data with scope breakdown

**Why scope-by-scope rounding matters:**
- Direct sum: 303,545.48 kg / 1000 = 303.545 → rounds to **303.5 tCO2e**
- Scope-by-scope: (0.0 + 177.9 + 125.7) = **303.6 tCO2e**

This 0.1 tCO2e difference ensures consistency with how organizations report emissions by scope.

### APIs Using This Module

**ALL APIs must use these functions. No API should calculate emissions directly.**

1. **`/api/sustainability/baseline`** - Direct baseline endpoint
2. **`/api/sustainability/targets`** - SBTi targets calculation (uses `getBaselineEmissions`)
3. **`/api/sustainability/dashboard`** - Overview dashboard (uses same scope-by-scope logic)
4. **Future APIs** - Any new API that needs emissions MUST import from baseline-calculator

### Data Flow

```
metrics_data (kg CO2e, raw values)
    ↓
baseline-calculator.ts
    ↓ (divide by 1000, round to 1 decimal)
    ↓
All APIs get consistent values
    ↓
UI displays: 303.6 tCO2e everywhere
```

## Current Baseline Values (2023)

From actual PLMJ data:
- **Scope 1**: 0.0 tCO2e (no direct emissions)
- **Scope 2**: 177.9 tCO2e (purchased energy + electricity)
- **Scope 3**: 125.7 tCO2e (business travel, goods, waste)
- **Total**: **303.6 tCO2e**

## Database Updates

The `sustainability_targets` table now stores:
- `baseline_value`: 303.6 tCO2e
- `baseline_scope_1`: 0.0 tCO2e
- `baseline_scope_2`: 177.9 tCO2e
- `baseline_scope_3`: 125.7 tCO2e

All values rounded to 1 decimal place.

## Usage Examples

### In an API Route
```typescript
import { getBaselineEmissions } from '@/lib/sustainability/baseline-calculator';

const baseline = await getBaselineEmissions(organizationId, 2023);
// Returns: { year: 2023, scope_1: 0.0, scope_2: 177.9, scope_3: 125.7, total: 303.6, ... }
```

### For Current Year Totals
```typescript
import { getYearEmissions } from '@/lib/sustainability/baseline-calculator';

const currentTotal = await getYearEmissions(organizationId, 2025);
// Returns: 289.4 (rounded to 1 decimal)
```

## Testing

Run the baseline calculation:
```bash
node -c "
const { getBaselineEmissions } = require('./src/lib/sustainability/baseline-calculator');
const baseline = await getBaselineEmissions('22647141-2ee4-4d8d-8b47-16b0cbd830b2', 2023);
console.log(baseline);
"
```

Expected output: `{ total: 303.6, scope_1: 0.0, scope_2: 177.9, scope_3: 125.7, ... }`

## Migration

To update existing targets with correct baseline values:
```bash
node update-target-baseline.js
```

This script:
1. Calculates baseline using the shared calculator
2. Updates the sustainability_targets table
3. Populates scope breakdown fields
4. Sets coverage percentages

## Benefits

✅ **Consistency**: Same value (303.6 tCO2e) across all pages
✅ **Maintainability**: Update logic in one place
✅ **Accuracy**: Proper rounding to 1 decimal
✅ **Traceability**: Single source of truth for audits
✅ **Type Safety**: TypeScript interfaces ensure correct usage

## Future Enhancements

- [ ] Cache baseline calculations (rarely change)
- [ ] Add validation that all APIs use the shared module
- [ ] Create admin endpoint to recalculate all baselines
- [ ] Add unit tests for baseline calculations
