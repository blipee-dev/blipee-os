# "Baseline 2023 Fixed" - Quick Explanation

## What Does "Fixed" Mean?

**"Fixed" = Hardcoded in the source code**

It means the baseline year is **not configurable** - it's permanently set to **2023** in the code.

---

## Visual Comparison

### 🔒 **FIXED BASELINE (Energy/Water/Waste)**

```
Code Location: /src/hooks/useDashboardData.ts

Line 186-187:
const baseline2023Params = new URLSearchParams({
  start_date: '2023-01-01',  ← HARDCODED
  end_date: '2023-12-31',    ← HARDCODED
});
```

**Timeline:**
```
   2022         2023         2024         2025
                 ↑                         ↑
              BASELINE                  TARGET
           (always 2023)            (always 2025)
```

**Cannot be changed without modifying code!**

---

### 🔓 **VARIABLE BASELINE (Emissions)**

```
Database Table: sustainability_targets

baseline_year | target_year | organization_id
------------- | ----------- | ---------------
2022          | 2030        | org-123
2020          | 2025        | org-456
2023          | 2027        | org-789
```

**Timeline (flexible):**
```
Org 1:  2022 ────────────────────────► 2030
        BASELINE                       TARGET

Org 2:  2020 ───────────► 2025
        BASELINE          TARGET

Org 3:  2023 ───────────────► 2027
        BASELINE              TARGET
```

**Can be different per organization!**

---

## Why "Fixed" for Energy/Water/Waste?

### ✅ **Advantages:**

1. **Simplicity**
   - No database lookup needed
   - No configuration required
   - Always consistent

2. **SBTi Compliance**
   - Meets Science Based Targets initiative requirements
   - Recent baseline year (last 3-5 years)
   - Aligns with CDP reporting cycles

3. **Consistency**
   - All dashboards use same reference point
   - Easy to compare across organizations
   - No confusion about "which baseline"

4. **Performance**
   - One less API call
   - Faster page loads
   - Simpler caching

### ⚠️ **Disadvantages:**

1. **Inflexibility**
   - Can't use 2020 or 2021 as baseline
   - Can't recalibrate if 2023 data is bad
   - Stuck with 2023 forever (without code change)

2. **Edge Cases**
   - New company started tracking in 2024? Too bad.
   - 2023 data incomplete? Can't use 2022 instead.
   - Want to align with fiscal year (e.g., April 2023-March 2024)? Not possible.

---

## Real Code Example

### Energy Dashboard Hook (useDashboardData.ts)

```typescript
export function useEnergyDashboard(period: TimePeriod, selectedSite?: Building | null, organizationId?: string) {
  // ... other queries ...

  // 🔒 FIXED BASELINE YEAR
  const baseline2023Params = new URLSearchParams({
    start_date: '2023-01-01',  // ← This is hardcoded
    end_date: '2023-12-31',    // ← Cannot change without editing code
  });

  if (selectedSite) {
    baseline2023Params.append('site_id', selectedSite.id);
  }

  // Fetch 2023 data
  const baseline2023 = useQuery({
    queryKey: [...dashboardKeys.energy(period, selectedSite?.id), 'baseline2023'],
    queryFn: async () => {
      const response = await fetch(`/api/energy/sources?${baseline2023Params}`);
      if (!response.ok) throw new Error('Failed to fetch baseline data');
      return response.json();
    },
    enabled: !!organizationId && selectedYear === currentYear,
    staleTime: 10 * 60 * 1000,
  });

  // Use 2023 baseline in target calculation
  const baseline2023Consumption = baseline2023.data?.total_consumption || 0;
  const targetYear = 2025;  // ← Also hardcoded
  const yearsToTarget = 2025 - 2023;  // ← Always 2 years
}
```

---

## How Targets Are Calculated

### Energy Dashboard:

```typescript
Baseline (2023): 1000 MWh        ← From database (2023 data)
Reduction Rate:  5%               ← From category_targets table
Years to Target: 2                ← Fixed: 2025 - 2023
Target (2025):   1000 × (1 - 0.05 × 2) = 900 MWh
```

### If Baseline Was Variable (like Emissions):

```typescript
Baseline Year:   2022             ← From organization_settings table
Baseline Value:  1000 MWh         ← From database (2022 data)
Target Year:     2026             ← From organization_settings table
Years to Target: 4                ← Variable: 2026 - 2022
Target (2026):   1000 × (1 - 0.05 × 4) = 800 MWh
```

---

## Impact on Your Dashboard

### What You See Now:

```
📊 Energy Target Progress

Base de Referência (2023): 168.7 tCO2e   ← Always 2023
Meta 2025:                 150.7 tCO2e   ← Always 2025
Projetado:                 225.0 tCO2e
```

### If You Had Variable Baseline:

```
📊 Energy Target Progress

Base de Referência (2022): 180.2 tCO2e   ← Could be any year
Meta 2027:                 140.5 tCO2e   ← Could be any year
Projetado:                 225.0 tCO2e
```

---

## Where "2023" Appears in Code

### 1. **useDashboardData.ts** (3 places)

**Energy Dashboard:**
```typescript
// Line 186
start_date: '2023-01-01',  // ← HARDCODED
```

**Water Dashboard:**
```typescript
// Line 363
start_date: '2023-01-01',  // ← HARDCODED
```

**Waste Dashboard:**
```typescript
// Line 554
start_date: '2023-01-01',  // ← HARDCODED
```

### 2. **API Endpoints**

**by-category-dynamic API:**
```typescript
// Line 224 (already accepts baselineYear as parameter)
baselineYear=2023  // ← Passed from frontend (could be variable)
```

**Water Target Calculation:**
```typescript
// Line 387
const baselineYear = 2023;  // ← HARDCODED
```

---

## Should You Keep It Fixed?

### ✅ **Keep Fixed If:**
- You have complete 2023 data
- You want simplicity
- You're following SBTi standard timeline
- All organizations in your system started tracking in 2023 or earlier

### ⚠️ **Make Variable If:**
- Different organizations need different baseline years
- You started tracking before 2023 and want to use older baseline
- Your fiscal year doesn't align with calendar year
- You want flexibility for future baseline updates

---

## Quick Test

To see if your baseline is truly fixed:

```bash
# 1. Check the code
grep -r "2023-01-01" src/hooks/useDashboardData.ts

# Should show:
# src/hooks/useDashboardData.ts:186:    start_date: '2023-01-01',
# src/hooks/useDashboardData.ts:363:    start_date: '2023-01-01',
# src/hooks/useDashboardData.ts:554:    start_date: '2023-01-01',

# 2. Try changing the year in the database
# (This won't work because code is hardcoded!)

UPDATE organization_settings
SET baseline_year = 2022;  -- ← This will be IGNORED by Energy/Water/Waste dashboards

# 3. The dashboards will still show "Base de Referência (2023)"
```

---

## Next Steps

### If You Want to Keep It Fixed:
✅ Nothing to do - it's working as designed

### If You Want Variable Baseline:
📖 Read: `/docs/how-to-make-baseline-variable.md`

**Summary of changes:**
1. Add `baseline_year` column to database
2. Create API endpoint to fetch baseline year
3. Update hooks to use dynamic baseline year
4. Update components to display dynamic year
5. (Optional) Add settings UI to configure baseline

**Estimated effort:** 2-4 hours

---

## Related Documentation

- `/docs/sbti-progress-calculation.md` - How baseline, target, and projected are calculated
- `/docs/dashboard-calculations-comparison.md` - Complete comparison across all dashboards
- `/docs/calculations-quick-reference.md` - Quick lookup for formulas
- `/docs/how-to-make-baseline-variable.md` - Step-by-step guide to make baseline configurable
- `/docs/enterprise-forecast-integration.md` - How projected values use ML forecast
