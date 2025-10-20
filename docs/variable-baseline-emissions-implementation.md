# How Emissions Dashboard Implements Variable Baseline

## Overview

The Emissions Dashboard uses a **variable baseline** - the baseline year comes from the `sustainability_targets` database table, not hardcoded in the source code.

---

## Architecture Comparison

### 🔒 **FIXED BASELINE (Energy/Water/Waste)**

```typescript
// File: /src/hooks/useDashboardData.ts

// ❌ HARDCODED in code
const baseline2023Params = new URLSearchParams({
  start_date: '2023-01-01',  // ← Cannot change without editing code
  end_date: '2023-12-31',
});

const baseline2023 = useQuery({
  queryFn: async () => {
    const response = await fetch(`/api/energy/sources?${baseline2023Params}`);
    return response.json();
  }
});
```

**Flow:**
```
Code (hardcoded 2023)
  ↓
Fetch 2023 data from database
  ↓
Use in calculations
```

---

### 🔓 **VARIABLE BASELINE (Emissions)**

```typescript
// File: /src/app/api/sustainability/targets/route.ts

// ✅ VARIABLE - stored in database
const { data: targets } = await supabaseAdmin
  .from('sustainability_targets')  // ← Database table
  .select('*')
  .eq('organization_id', organizationId);

// Extract baseline_year from target
const baselineYear = targets[0]?.baseline_year || 2023;  // ← Dynamic!
const targetYear = targets[0]?.target_year || 2030;

// Use variable baseline_year in calculations
const yearsElapsed = currentYear - baselineYear;
const totalYears = targetYear - baselineYear;
```

**Flow:**
```
Database (sustainability_targets table)
  ↓
Fetch baseline_year for organization
  ↓
Use dynamic baseline_year in calculations
```

---

## Database Schema

### **sustainability_targets Table**

```sql
CREATE TABLE sustainability_targets (
  id UUID PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id),

  -- ✅ VARIABLE FIELDS
  baseline_year INTEGER NOT NULL,       -- e.g., 2020, 2022, 2023
  baseline_value NUMERIC NOT NULL,      -- Baseline emissions (tCO2e)
  target_year INTEGER NOT NULL,         -- e.g., 2025, 2030, 2050
  target_value NUMERIC NOT NULL,        -- Target emissions (tCO2e)

  name TEXT,
  target_type TEXT,  -- 'near-term', 'long-term', 'net-zero'
  current_emissions NUMERIC,
  scopes TEXT[],  -- ['scope_1', 'scope_2', 'scope_3']

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### **Example Data:**

```sql
SELECT
  organization_id,
  name,
  baseline_year,
  baseline_value,
  target_year,
  target_value
FROM sustainability_targets
WHERE organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
```

**Result:**
```
organization_id                      | name              | baseline_year | baseline_value | target_year | target_value
-------------------------------------|-------------------|---------------|----------------|-------------|-------------
22647141-2ee4-4d8d-8b47-16b0cbd830b2 | Near-Term Target  | 2022          | 500.0          | 2030        | 290.0
22647141-2ee4-4d8d-8b47-16b0cbd830b2 | Long-Term Target  | 2022          | 500.0          | 2050        | 50.0
22647141-2ee4-4d8d-8b47-16b0cbd830b2 | Net-Zero Target   | 2022          | 500.0          | 2050        | 0.0
```

---

## Code Implementation

### **Step 1: Fetch Targets from Database**

**File:** `/src/app/api/sustainability/targets/route.ts:32-44`

```typescript
// Fetch targets with VARIABLE baseline_year
const [targetsResult, baselineData, scopeBreakdown] = await Promise.all([
  supabaseAdmin
    .from('sustainability_targets')  // ← Database query
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false }),

  getBaselineEmissions(organizationId),  // Gets current year baseline

  getPeriodEmissions(
    organizationId,
    `${new Date().getFullYear()}-01-01`,
    new Date().toISOString().split('T')[0]
  )
]);

const targets = targetsResult.data;
```

### **Step 2: Extract Baseline Year from Target**

**File:** `/src/app/api/sustainability/targets/route.ts:67-116`

```typescript
// Transform targets - baseline_year comes from database!
let transformedTargets = targets?.map(target => {
  // ✅ baseline_year is from database, not hardcoded
  const baselineYear = target.baseline_year;  // e.g., 2020, 2022, 2023
  const targetYear = target.target_year;      // e.g., 2025, 2030, 2050

  // Calculate years dynamically
  const yearsToTarget = targetYear - baselineYear;  // Variable!

  // Calculate reduction rate
  const reductionPercent = target.baseline_value > 0
    ? ((target.baseline_value - target.target_value) / target.baseline_value) * 100
    : 0;

  const annualRate = yearsToTarget > 0 ? reductionPercent / yearsToTarget : 0;

  return {
    id: target.id,
    name: target.name,
    baseline_year: baselineYear,           // ← From database
    baseline_emissions: target.baseline_value,
    target_year: targetYear,                // ← From database
    target_emissions: target.target_value,
    annual_reduction_rate: annualRate,
    // ... other fields
  };
});
```

### **Step 3: Use Variable Baseline in Calculations**

**File:** `/src/app/api/sustainability/targets/route.ts:615-636`

```typescript
function calculatePerformanceStatus(
  baseline: number,
  current: number,
  target: number,
  baselineYear: number,     // ← Variable (from database)
  targetYear: number,       // ← Variable (from database)
  currentYear: number
): string {
  // Calculate years elapsed (dynamic based on baseline_year!)
  const yearsElapsed = currentYear - baselineYear;
  const totalYears = targetYear - baselineYear;

  if (totalYears <= 0) return 'pending';

  // Calculate expected progress
  const expectedProgress = (baseline - target) * (yearsElapsed / totalYears);
  const actualProgress = baseline - current;
  const progressRatio = actualProgress / expectedProgress;

  // Determine status
  if (progressRatio >= 1.05) return 'exceeding';
  if (progressRatio >= 0.95) return 'on-track';
  if (progressRatio >= 0.85) return 'at-risk';
  return 'off-track';
}
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  1. USER CREATES TARGET (via UI or API)                │
├─────────────────────────────────────────────────────────┤
│  POST /api/sustainability/targets                       │
│  Body: {                                                 │
│    baseline_year: 2022,  ← User selects                │
│    baseline_emissions: 500,                             │
│    target_year: 2030,                                    │
│    target_emissions: 290                                 │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  2. STORE IN DATABASE                                   │
├─────────────────────────────────────────────────────────┤
│  INSERT INTO sustainability_targets (                   │
│    organization_id,                                      │
│    baseline_year,  ← 2022                              │
│    baseline_value, ← 500                                │
│    target_year,    ← 2030                              │
│    target_value    ← 290                                │
│  ) VALUES (...)                                          │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  3. FETCH TARGETS (Emissions Dashboard loads)          │
├─────────────────────────────────────────────────────────┤
│  GET /api/sustainability/targets                        │
│  ↓                                                       │
│  SELECT * FROM sustainability_targets                   │
│  WHERE organization_id = '...'                          │
│  ↓                                                       │
│  Returns: {                                              │
│    baseline_year: 2022,  ← From database               │
│    baseline_value: 500,                                 │
│    target_year: 2030,                                    │
│    target_value: 290                                     │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  4. CALCULATE PROGRESS DYNAMICALLY                      │
├─────────────────────────────────────────────────────────┤
│  baselineYear = 2022  ← From database                  │
│  targetYear = 2030    ← From database                  │
│  currentYear = 2025                                      │
│  ↓                                                       │
│  yearsElapsed = 2025 - 2022 = 3 years                  │
│  totalYears = 2030 - 2022 = 8 years                    │
│  ↓                                                       │
│  expectedProgress = (500 - 290) × (3/8) = 78.75 tCO2e  │
│  actualProgress = 500 - currentEmissions                │
│  ↓                                                       │
│  progressRatio = actualProgress / expectedProgress      │
│  status = progressRatio >= 0.95 ? 'on-track' : ...    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│  5. DISPLAY ON DASHBOARD                                │
├─────────────────────────────────────────────────────────┤
│  📊 Target Progress                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  Baseline (2022): 500.0 tCO2e  ← Variable year!        │
│  Target (2030): 290.0 tCO2e    ← Variable year!        │
│  Current (2025): 420.0 tCO2e                            │
│  Progress: 38% (on-track)                                │
└─────────────────────────────────────────────────────────┘
```

---

## Key Differences vs Fixed Baseline

| Aspect | Fixed (Energy/Water/Waste) | Variable (Emissions) |
|--------|----------------------------|----------------------|
| **Storage** | Hardcoded in code | Stored in database |
| **Source** | `start_date: '2023-01-01'` | `SELECT baseline_year FROM sustainability_targets` |
| **Flexibility** | Cannot change (need code edit) | Can change per organization |
| **Configuration** | None needed | User sets when creating target |
| **Different orgs** | All use 2023 | Each can have different baseline |
| **Update** | Requires code deployment | Simple database UPDATE |
| **Timeline** | Fixed: 2023 → 2025 | Dynamic: baseline_year → target_year |

---

## Example Scenarios

### **Scenario 1: Organization A (Started tracking in 2020)**

```sql
INSERT INTO sustainability_targets (
  organization_id,
  baseline_year,
  baseline_value,
  target_year,
  target_value
) VALUES (
  'org-a-uuid',
  2020,        -- ✅ Can use 2020
  600.0,
  2030,
  348.0
);
```

**Dashboard shows:**
```
Baseline (2020): 600.0 tCO2e
Target (2030): 348.0 tCO2e
Years to target: 10
Annual reduction: 4.2% per year
```

### **Scenario 2: Organization B (Started tracking in 2023)**

```sql
INSERT INTO sustainability_targets (
  organization_id,
  baseline_year,
  baseline_value,
  target_year,
  target_value
) VALUES (
  'org-b-uuid',
  2023,        -- ✅ Can use 2023
  500.0,
  2025,
  458.0
);
```

**Dashboard shows:**
```
Baseline (2023): 500.0 tCO2e
Target (2025): 458.0 tCO2e
Years to target: 2
Annual reduction: 4.2% per year
```

### **Scenario 3: Organization C (Fiscal year baseline)**

```sql
INSERT INTO sustainability_targets (
  organization_id,
  baseline_year,
  baseline_value,
  target_year,
  target_value
) VALUES (
  'org-c-uuid',
  2022,        -- ✅ Fiscal year 2022 (April 2022 - March 2023)
  450.0,
  2027,
  360.0
);
```

**Dashboard shows:**
```
Baseline (2022): 450.0 tCO2e
Target (2027): 360.0 tCO2e
Years to target: 5
Annual reduction: 4% per year
```

---

## How to Create/Update Variable Baseline

### **Method 1: Via API (POST)**

```bash
curl -X POST http://localhost:3001/api/sustainability/targets \
  -H "Content-Type: application/json" \
  -d '{
    "target_name": "Near-Term SBTi Target",
    "target_type": "near-term",
    "baseline_year": 2022,
    "baseline_emissions": 500.0,
    "target_year": 2030,
    "target_reduction_percent": 42,
    "target_emissions": 290.0
  }'
```

### **Method 2: Direct Database INSERT**

```sql
INSERT INTO sustainability_targets (
  id,
  organization_id,
  name,
  target_type,
  baseline_year,
  baseline_value,
  target_year,
  target_value,
  scopes
) VALUES (
  gen_random_uuid(),
  '22647141-2ee4-4d8d-8b47-16b0cbd830b2',
  'Near-Term Target',
  'near-term',
  2022,     -- ← Your baseline year
  500.0,    -- ← Your baseline emissions
  2030,     -- ← Your target year
  290.0,    -- ← Your target emissions
  ARRAY['scope_1', 'scope_2', 'scope_3']
);
```

### **Method 3: Update Existing Target**

```sql
UPDATE sustainability_targets
SET
  baseline_year = 2021,       -- Change baseline year
  baseline_value = 550.0,     -- Update baseline emissions
  target_year = 2028,         -- Change target year
  target_value = 330.0,       -- Update target emissions
  updated_at = NOW()
WHERE organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  AND target_type = 'near-term';
```

---

## Auto-Calculation of SBTi Targets

**File:** `/src/app/api/sustainability/targets/route.ts:641-719`

If no targets exist, the API automatically calculates recommended SBTi targets:

```typescript
function calculateSBTiTargets(baselineData: any) {
  const currentYear = new Date().getFullYear();

  return {
    'near-term': {
      baseline_year: baselineData.year,  // ← Uses detected baseline year
      baseline_emissions: baselineData.total,
      target_year: 2030,
      target_reduction_percent: 42,      // SBTi 1.5°C requirement
      target_emissions: baselineData.total * 0.58,  // 42% reduction
      annual_reduction_rate: 42 / (2030 - baselineData.year)
    },
    'long-term': {
      baseline_year: baselineData.year,
      baseline_emissions: baselineData.total,
      target_year: 2050,
      target_reduction_percent: 90,      // SBTi requirement
      target_emissions: baselineData.total * 0.10
    },
    'net-zero': {
      baseline_year: baselineData.year,
      baseline_emissions: baselineData.total,
      target_year: 2050,
      target_emissions: 0                 // Net-zero
    }
  };
}
```

---

## Advantages of Variable Baseline

### ✅ **Flexibility**
- Each organization can use their own baseline year
- Can align with fiscal year or reporting period
- Can use historical data (e.g., 2020) if better than 2023

### ✅ **SBTi Compliance**
- SBTi requires baseline within last 5 years of target submission
- Variable baseline allows updating when submitting to SBTi

### ✅ **Data Quality**
- If 2023 data is incomplete, can use 2022 or 2021
- If organization started tracking in 2024, can update when full year available

### ✅ **Multi-Org Support**
- Platform can support organizations with different baseline years
- Enterprise features benefit from flexibility

### ✅ **Easy Updates**
- Change baseline year with simple database UPDATE
- No code deployment needed
- Immediate effect on all calculations

---

## Why Energy/Water/Waste Don't Use Variable Baseline

### 🤔 **Reasons for Fixed:**

1. **Simplicity**: No need to manage baseline year configuration
2. **Consistency**: All organizations use same reference year
3. **Performance**: No extra database lookups needed
4. **CDP Alignment**: CDP requires recent baseline (usually 2-3 years)
5. **Less Configuration**: Users don't need to set baseline year

### ⚠️ **Trade-offs:**

1. **Less Flexible**: Can't adapt to different scenarios
2. **Data Dependency**: Requires good 2023 data for all organizations
3. **Locked In**: Difficult to change without code deployment

---

## Converting Energy/Water/Waste to Variable Baseline

If you want Energy/Water/Waste to work like Emissions (variable baseline), see:

📖 **`/docs/how-to-make-baseline-variable.md`**

Key steps:
1. Add `baseline_year` column to database
2. Create API endpoint to fetch baseline year
3. Update hooks to use dynamic baseline year instead of hardcoded 2023
4. Update components to display dynamic year
5. Add settings UI to configure baseline

**Estimated effort:** 2-4 hours

---

## Summary

### **Emissions Dashboard (Variable Baseline):**

```typescript
// ✅ DYNAMIC
baseline_year  ← From database (sustainability_targets table)
target_year    ← From database
yearsToTarget  ← Calculated: target_year - baseline_year
```

### **Energy/Water/Waste Dashboards (Fixed Baseline):**

```typescript
// ❌ HARDCODED
baseline_year  ← Always 2023 (in code)
target_year    ← Always 2025 (in code)
yearsToTarget  ← Always 2 (2025 - 2023)
```

---

## Related Documentation

- `/docs/baseline-2023-fixed-explained.md` - What "fixed baseline" means
- `/docs/how-to-make-baseline-variable.md` - Convert Energy/Water/Waste to variable
- `/docs/sbti-progress-calculation.md` - How targets are calculated
- `/docs/dashboard-calculations-comparison.md` - Complete comparison
