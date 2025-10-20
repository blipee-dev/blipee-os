# Unified Sustainability System - Implementation Guide

## 🎯 Overview

This document describes the new **Unified Sustainability System** that provides consistent baseline, target, and forecast calculations across all dashboards (Energy, Water, Waste, Emissions).

## ✅ What's Been Implemented

### 1. Database Migration
**File:** `/supabase/migrations/20251016_domain_specific_reduction_rates.sql`

**Changes:**
- ✅ Added `energy_reduction_percent` (default: 4.2%)
- ✅ Added `water_reduction_percent` (default: 2.5%)
- ✅ Added `waste_reduction_percent` (default: 3.0%)
- ✅ Added `emissions_reduction_percent` (migrated from `target_reduction_percent`)
- ✅ Added constraints and indexes
- ✅ Updated existing targets with defaults

**Schema:**
```sql
sustainability_targets
├── organization_id
├── baseline_year                  ← Dynamic per org
├── target_year                    ← Always current year (calculated in code)
├── baseline_emissions
├── target_emissions
├── energy_reduction_percent       ← NEW: Org-specific
├── water_reduction_percent        ← NEW: Org-specific
├── waste_reduction_percent        ← NEW: Org-specific
├── emissions_reduction_percent    ← NEW: Renamed from target_reduction_percent
└── ...
```

### 2. Unified Calculator Class
**File:** `/src/lib/sustainability/unified-calculator.ts`

**Key Features:**
- Single source of truth for all calculations
- Dynamic baseline years from database
- Linear reduction formula (SBTi-compliant)
- Domain-specific reduction rates
- Consistent progress calculations

**Main Methods:**
```typescript
class UnifiedSustainabilityCalculator {
  // Get sustainability target for organization
  getSustainabilityTarget(): Promise<SustainabilityTarget>

  // Get baseline value for specific domain and year
  getBaseline(domain: Domain, year?: number): Promise<BaselineResult>

  // Calculate target using linear reduction
  getTarget(domain: Domain): Promise<TargetResult>

  // Get YTD actual value
  getYTDActual(domain: Domain): Promise<number>

  // Get projected value using ML forecast
  getProjected(domain: Domain): Promise<ProjectedResult>

  // Calculate progress toward target
  calculateProgressToTarget(domain: Domain): Promise<ProgressResult>
}
```

### 3. Unified Forecast System
**File:** `/src/lib/sustainability/unified-forecast.ts`

**Fallback Hierarchy:**
1. **Replanning Trajectory** (if exists - Emissions only)
2. **ML Forecast** (EnterpriseForecast with seasonal decomposition)
3. **Simple Linear** (YTD / months × 12)

**Key Features:**
- Uses 36 months of historical data for seasonality detection
- Automatic renewable/fossil emission factors for energy
- Consistent forecasting across all domains
- Graceful fallbacks if data insufficient

## 🔄 How It Works

### Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  1. Organization has sustainability_targets record           │
│     - baseline_year: 2023                                     │
│     - energy_reduction_percent: 5.0%                         │
│     - water_reduction_percent: 2.5%                          │
│     - waste_reduction_percent: 3.0%                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  2. UnifiedSustainabilityCalculator fetches target           │
│     calculator = new UnifiedSustainabilityCalculator(orgId)  │
│     target = await calculator.getSustainabilityTarget()      │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  3. Get Baseline (from baseline_year in database)            │
│     baseline = await calculator.getBaseline('energy')        │
│     → Queries metrics_data for 2023-01-01 to 2023-12-31     │
│     → Sums all energy-related emissions                      │
│     → Returns: { value: 168.7, unit: 'tCO2e', year: 2023 }  │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  4. Calculate Target (linear formula)                         │
│     target = await calculator.getTarget('energy')            │
│                                                               │
│     reductionRate = 5.0%  (from energy_reduction_percent)   │
│     years = 2025 - 2023 = 2                                  │
│     target = 168.7 × (1 - 0.05 × 2) = 151.8 tCO2e          │
│                                                               │
│     → Returns: { value: 151.8, unit: 'tCO2e', year: 2025 }  │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  5. Get Projected (YTD + ML Forecast)                        │
│     projected = await calculator.getProjected('energy')      │
│                                                               │
│     ytd = 180.5 tCO2e (Jan-Oct 2025)                        │
│     forecast = 44.5 tCO2e (Nov-Dec ML prediction)           │
│     projected = 180.5 + 44.5 = 225.0 tCO2e                  │
│                                                               │
│     → Returns: {                                             │
│         value: 225.0,                                        │
│         unit: 'tCO2e',                                       │
│         method: 'ml_forecast',                               │
│         ytd: 180.5,                                          │
│         forecast: 44.5                                       │
│       }                                                       │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  6. Calculate Progress                                        │
│     progress = await calculator.calculateProgressToTarget()  │
│                                                               │
│     calculateProgress(168.7, 151.8, 225.0)                  │
│                                                               │
│     → Returns: {                                             │
│         baseline: 168.7,                                     │
│         target: 151.8,                                       │
│         projected: 225.0,                                    │
│         progressPercent: 0,        (exceeded baseline)      │
│         exceedancePercent: 48.2,                            │
│         status: 'exceeded-baseline',                        │
│         reductionNeeded: 16.9,                              │
│         reductionAchieved: -56.3   (negative = increase)   │
│       }                                                       │
└──────────────────────────────────────────────────────────────┘
```

## 📊 Calculation Examples

### Example 1: Energy Dashboard

**Given:**
- Organization baseline year: 2023
- Energy reduction target: 5.0% per year
- Current year: 2025

**Calculations:**

#### Baseline (2023)
```typescript
const baseline = await calculator.getBaseline('energy', 2023);
// Queries: SUM(co2e_emissions) WHERE year = 2023 AND category IN energy categories
// Result: 168.7 tCO2e
```

#### Target (2025)
```typescript
const target = await calculator.getTarget('energy');
// Formula: baseline × (1 - rate × years)
// Calculation: 168.7 × (1 - 0.05 × 2) = 168.7 × 0.90 = 151.8 tCO2e
// Result: 151.8 tCO2e
```

#### Projected (2025)
```typescript
const projected = await calculator.getProjected('energy');
// YTD (Jan-Oct): 180.5 tCO2e
// ML Forecast (Nov-Dec): 44.5 tCO2e
// Result: 225.0 tCO2e
```

#### Progress
```typescript
const progress = await calculator.calculateProgressToTarget('energy');
// Status: exceeded-baseline (225.0 > 168.7)
// Progress: 0%
// Exceedance: 48.2% above target
```

---

### Example 2: Water Dashboard

**Given:**
- Organization baseline year: 2022
- Water reduction target: 2.5% per year
- Current year: 2025

**Calculations:**

#### Baseline (2022)
```typescript
const baseline = await calculator.getBaseline('water', 2022);
// Result: 0.85 ML
```

#### Target (2025)
```typescript
const target = await calculator.getTarget('water');
// Formula: baseline × (1 - rate × years)
// Years: 2025 - 2022 = 3
// Calculation: 0.85 × (1 - 0.025 × 3) = 0.85 × 0.925 = 0.79 ML
// Result: 0.79 ML
```

#### Projected (2025)
```typescript
const projected = await calculator.getProjected('water');
// YTD: 0.65 ML
// ML Forecast: 0.28 ML
// Result: 0.93 ML
```

#### Progress
```typescript
const progress = await calculator.calculateProgressToTarget('water');
// Status: exceeded-baseline (0.93 > 0.85)
// Progress: 0%
// Exceedance: 17.7% above target
```

---

## 🔧 How to Use

### In API Routes

```typescript
import { UnifiedSustainabilityCalculator } from '@/lib/sustainability/unified-calculator';

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get('organizationId');

  // Create calculator instance
  const calculator = new UnifiedSustainabilityCalculator(organizationId);

  // Get all values
  const baseline = await calculator.getBaseline('energy');
  const target = await calculator.getTarget('energy');
  const projected = await calculator.getProjected('energy');
  const progress = await calculator.calculateProgressToTarget('energy');

  return NextResponse.json({
    baseline: baseline?.value,
    target: target?.value,
    projected: projected?.value,
    progress,
  });
}
```

### In React Hooks

```typescript
import { UnifiedSustainabilityCalculator } from '@/lib/sustainability/unified-calculator';

export function useEnergyTarget(organizationId: string) {
  return useQuery({
    queryKey: ['energy-target', organizationId],
    queryFn: async () => {
      const calculator = new UnifiedSustainabilityCalculator(organizationId);
      return await calculator.calculateProgressToTarget('energy');
    },
    enabled: !!organizationId,
  });
}
```

---

## 🎨 Benefits

### 1. **Single Source of Truth**
- All dashboards use same calculator
- No discrepancies between dashboards
- Consistent formulas across domains

### 2. **Fully Dynamic**
- No hardcoded baseline years
- No hardcoded reduction rates
- Org-specific configuration

### 3. **SBTi-Compliant**
- Linear reduction formula
- Industry-standard defaults
- Easy to explain to stakeholders

### 4. **Flexible**
- Easy to change reduction rates per org
- Easy to change baseline year per org
- Easy to add new domains

### 5. **Intelligent Forecasting**
- ML-based predictions with seasonality
- Automatic fallbacks
- Consistent across all domains

---

## 📋 Next Steps

### To Complete Implementation:

1. ✅ **Apply Migration**
   ```bash
   PGPASSWORD="..." psql -h ... -f supabase/migrations/20251016_domain_specific_reduction_rates.sql
   ```

2. **Update Dashboard Hooks**
   - Energy Dashboard: Use `UnifiedSustainabilityCalculator`
   - Water Dashboard: Use `UnifiedSustainabilityCalculator`
   - Waste Dashboard: Use `UnifiedSustainabilityCalculator`

3. **Update Components**
   - Replace hardcoded baseline references
   - Use dynamic `baselineYear` from calculator
   - Display reduction rates from `sustainability_targets`

4. **Test**
   - Verify baseline values match old system
   - Verify targets calculated correctly
   - Verify forecasts working
   - Test with different baseline years

---

## 🔍 Troubleshooting

### Issue: "Baseline is 0"
**Cause:** No data in metrics_data for baseline year
**Solution:** Check organization has data for the baseline year in database

### Issue: "Target seems wrong"
**Cause:** Wrong reduction rate or formula
**Solution:** Verify `energy_reduction_percent` in sustainability_targets table

### Issue: "Forecast returns null"
**Cause:** Insufficient historical data (<12 months)
**Solution:** System will automatically use linear fallback

### Issue: "Different results than old system"
**Cause:** Old system used compound formula, new uses linear
**Solution:** Linear is correct and SBTi-compliant

---

## 📚 Related Files

### Core Library
- `/src/lib/sustainability/unified-calculator.ts` - Main calculator
- `/src/lib/sustainability/unified-forecast.ts` - Forecast system
- `/src/lib/utils/progress-calculation.ts` - Progress formulas

### Migration
- `/supabase/migrations/20251016_domain_specific_reduction_rates.sql`

### Hooks (to be updated)
- `/src/hooks/useDashboardData.ts`

### Components (to be updated)
- `/src/components/dashboard/EnergyDashboard.tsx`
- `/src/components/dashboard/WaterDashboard.tsx`
- `/src/components/dashboard/WasteDashboard.tsx`

---

## 🎯 Summary

The Unified Sustainability System provides:
- ✅ Single calculator for all domains
- ✅ Dynamic baseline years (no hardcoding)
- ✅ Org-specific reduction rates
- ✅ Linear reduction formula (SBTi)
- ✅ ML forecast with fallbacks
- ✅ Consistent progress tracking

**Result:** Fully dynamic, org-customizable sustainability tracking that scales across any number of organizations with different configurations.
