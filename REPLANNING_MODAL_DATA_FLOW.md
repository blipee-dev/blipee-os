# Replanning Modal Data Flow - Complete Audit

## ✅ CORRECT: All values now use exact same source from Targets API

### Data Source Chain:

```
Database (sustainability_targets)
  ↓
Targets API (/api/sustainability/targets/route.ts)
  ↓
TargetsDashboard.tsx (replanningTarget object)
  ↓
ReplanningModal.tsx (props)
  ↓
Display in UI
```

### Values & Units:

| Value | Source | Unit | Dashboard Line | Modal Line |
|-------|--------|------|----------------|------------|
| **Baseline Emissions** | `sustainability_targets.baseline_value` | tCO2e | 342 | 399 |
| **Current Emissions** | Calculated (YTD + ML forecast) | tCO2e | 350 | 412, 656 |
| **Target Emissions** | `sustainability_targets.target_value` | tCO2e | 362 | 392, 663 |
| **Annual Rate** | Calculated from baseline/target | % | 378 | 428 |

### Key Points:

1. **No Conversions**: Modal receives values already in tCO2e, uses them directly
2. **No Recalculations**: SuccessStep now uses `currentEmissions` prop instead of recalculating
3. **Consistent Display**: Same `.toFixed(1)` formatting everywhere

### Fixed Issues:

1. ❌ **Before**: Line 68 divided `currentEmissions` by 1000 (incorrect)
   - ✅ **After**: Uses value directly (already in tCO2e)

2. ❌ **Before**: SuccessStep recalculated current emissions from API response
   - ✅ **After**: Uses `currentEmissions` prop (same as dashboard)

3. ❌ **Before**: Replanning engine didn't convert kg to tCO2e when reading from database
   - ✅ **After**: Line 397 divides `co2e_emissions` by 1000

### Database Unit Flow:

```
metrics_data.co2e_emissions: kg (stored)
  ↓ (divide by 1000)
replanning-engine.ts: tCO2e (internal calculations)
  ↓ (multiply by 1000)
Replanning API response: kg (for consistency)
  ↓ (divide by 1000)
Modal display: tCO2e (shown to user)
```

### Verification:

Expected values in modal should match dashboard exactly:
- Baseline (2023): **429.3 tCO2e**
- Current (2025): **690.4 tCO2e**
- Target (2030): **249.0 tCO2e**
- Gap: **441.4 tCO2e** (690.4 - 249.0)
- Annual Rate: **88.3 tCO2e/yr** (441.4 / 5 years)
- Annual %: **12.8% per year** (88.3 / 690.4 * 100)
