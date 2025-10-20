# Quick Reference: Dashboard Calculations

## At a Glance Comparison

### 📊 Your Example (Energy Dashboard)
```
Base de Referência: 168.7 tCO2e  ← Sum of 2023 emissions from database
Meta 2025:         150.7 tCO2e  ← 168.7 × (1 - 5.33% × 2 years)
Projetado:         225.0 tCO2e  ← YTD actual + ML forecast for Nov-Dec
Progress:          0% (off-track) ← projected > baseline = exceeded-baseline
Exceedance:        +49.3%         ← 33% higher than 2023!
```

---

## Calculation Formulas by Dashboard

### 🔋 **ENERGY DASHBOARD**

| Value | Formula | Source |
|-------|---------|--------|
| **Baseline** | `SUM(2023 emissions) / 1000` | `metrics_data` table → kg to tCO2e |
| **Target** | `baseline × (1 - category_rate × 2)` | `category_targets` table (e.g., 5.33%) |
| **Projected** | `YTD_actual + ML_forecast(Nov-Dec)` | ML model with renewable/fossil mix |
| **Progress** | `(baseline - projected) / (baseline - target) × 100` | `calculateProgress()` utility |

**Emission Factors:**
- Renewable: 0.02 kgCO2e/kWh
- Fossil: 0.4 kgCO2e/kWh

---

### 💧 **WATER DASHBOARD**

| Value | Formula | Source |
|-------|---------|--------|
| **Baseline** | `SUM(2023 consumption in m³)` | `metrics_data` table → m³ to ML |
| **Target** | `baseline × (1 - 0.025)^2` | CDP benchmark: 2.5% compound |
| **Projected** | `YTD_actual + EnterpriseForecast(Nov-Dec)` | Seasonal decomposition model |
| **Progress** | Same as Energy | `calculateProgress()` utility |

**Example:**
```
Baseline: 0.76 ML
Target:   0.76 × 0.950625 = 0.72 ML
Projected: 0.93 ML
Progress: 0% (exceeded baseline by 22%)
```

---

### 🌍 **EMISSIONS DASHBOARD**

| Value | Formula | Source |
|-------|---------|--------|
| **Baseline** | `SUM(baseline_year emissions by scope)` | `sustainability_targets` OR metrics_data |
| **Target** | Pre-calculated OR `baseline × (1 - 4.2% × years)` | `sustainability_targets` table |
| **Projected** | `Replanning trajectory OR YTD + forecast` | Priority: replanning > ML > linear |
| **Progress** | Same as Energy + YoY comparison | `calculateProgress()` + delta |

**Special Feature:** Target path visualization (linear trajectory on chart)

---

### 🗑️ **WASTE DASHBOARD**

| Value | Formula | Source |
|-------|---------|--------|
| **Baseline** | `SUM(2023 waste in kg)` | `metrics_data` table → kg to tonnes |
| **Target** | `baseline × (1 - 0.03)^2` | Circular economy: 3% compound |
| **Projected** | `YTD_actual + EnterpriseForecast(Nov-Dec)` | Seasonal decomposition model |
| **Progress** | Same as Energy | `calculateProgress()` utility |

---

## Progress Status Logic (All Dashboards)

```typescript
if (projected > baseline) {
  status = 'exceeded-baseline'  // 🔴 Worse than starting point
  progress = 0%
  exceedance = +X%
}
else if (projected > target) {
  progress = (baseline - projected) / (baseline - target) × 100
  if (progress >= 80) status = 'at-risk'      // 🟡 Close but risky
  else                status = 'off-track'    // 🟠 Likely to miss
}
else {  // projected <= target
  status = 'on-track'  // 🟢 Will meet or exceed target
  progress = 100%
}
```

---

## Forecast Methods Comparison

| Dashboard | Primary Method | Fallback | Accuracy |
|-----------|----------------|----------|----------|
| **Energy** | ML renewable/fossil mix | Linear | ⭐⭐⭐⭐⭐ Best (considers grid mix) |
| **Water** | EnterpriseForecast (seasonal) | Linear | ⭐⭐⭐⭐ Good (seasonal patterns) |
| **Emissions** | Replanning trajectory | ML > Linear | ⭐⭐⭐⭐⭐ Best (planned actions) |
| **Waste** | EnterpriseForecast (seasonal) | Linear | ⭐⭐⭐⭐ Good (seasonal patterns) |

---

## Reduction Rate Benchmarks

| Dashboard | Rate | Source | Rationale |
|-----------|------|--------|-----------|
| **Energy** | 4.2-5.5% | SBTi | Science-based targets for 1.5°C pathway |
| **Water** | 2.5% | CDP | Water security best practice |
| **Emissions** | 4.2% | SBTi | Linear 1.5°C pathway (default) |
| **Waste** | 3% | Circular Economy | Zero waste by 2050 trajectory |

---

## API Endpoints Summary

```
GET /api/sustainability/targets/by-category-dynamic
→ Energy Dashboard (metric-level targets)
→ Dynamically calculates from category_targets + metrics_data
→ Returns: baseline, target, projected, progress per metric

GET /api/sustainability/targets/by-category
→ Water/Waste Dashboards (uses metric_targets table)
→ Pre-calculated targets with client-side progress
→ Returns: same structure as above

GET /api/sustainability/targets
→ Emissions Dashboard (overall targets)
→ Uses sustainability_targets table
→ Returns: organization-level targets

GET /api/energy/forecast
→ ML-based energy forecast (renewable/fossil breakdown)
→ Returns: monthly projections for remaining months

GET /api/water/forecast
→ EnterpriseForecast for water consumption
→ Returns: monthly projections with confidence intervals
```

---

## Database Tables

```
metrics_data
├─ period_start, period_end
├─ metric_id (FK to metrics_catalog)
├─ value (consumption/waste quantity)
├─ co2e_emissions (in kg)
└─ organization_id

category_targets
├─ category (e.g., "Electricity", "Natural Gas")
├─ baseline_year (2023)
├─ baseline_target_percent (e.g., 5.33)
└─ organization_id

sustainability_targets
├─ baseline_year, baseline_emissions
├─ target_year, target_emissions
├─ current_emissions
└─ organization_id

metric_targets (legacy - being phased out)
├─ metric_catalog_id
├─ baseline_emissions, target_emissions
└─ organization_id
```

---

## Rounding Rules

All values rounded to **1 decimal place** for display:

```typescript
Math.round(value * 10) / 10
```

**Why?**
- Prevents floating-point errors
- Consistent precision across dashboards
- Easier to read and compare

**Order of Operations:**
1. Round each scope individually
2. Sum the rounded values
3. Round the total again

---

## Common Questions

### Q: Why is my Projected > Baseline?

**A:** Your 2025 consumption/emissions are higher than 2023. Possible causes:
- Business growth (more activity, more facilities)
- Efficiency decline (older equipment, less maintenance)
- Energy mix shift (more fossil, less renewable)
- Weather extremes (more heating/cooling needed)
- Operational changes (new processes, extended hours)

**To investigate:**
```sql
-- Compare 2023 vs 2025 month-by-month
SELECT
  EXTRACT(YEAR FROM period_start) as year,
  EXTRACT(MONTH FROM period_start) as month,
  SUM(value) as consumption,
  SUM(co2e_emissions) / 1000 as emissions_tco2e
FROM metrics_data
WHERE organization_id = 'YOUR_ORG'
  AND metric_id = 'YOUR_METRIC'
  AND EXTRACT(YEAR FROM period_start) IN (2023, 2025)
GROUP BY year, month
ORDER BY year, month;
```

### Q: How accurate is the ML forecast?

**A:** Varies by data quality:
- **High accuracy** (80-90%): 36+ months of clean data, clear seasonal patterns
- **Medium accuracy** (70-80%): 12-36 months of data, some missing values
- **Low accuracy** (60-70%): <12 months of data, irregular patterns

**Confidence intervals** are provided with each forecast.

### Q: Can I change the reduction rate?

**A:** Yes! Update the `category_targets` table:

```sql
UPDATE category_targets
SET baseline_target_percent = 6.0  -- Change from 5.33% to 6%
WHERE organization_id = 'YOUR_ORG'
  AND category = 'Electricity'
  AND baseline_year = 2023;
```

This will immediately update targets across all dashboards.

### Q: Why different rates for different dashboards?

**A:** Each domain has industry-specific benchmarks:
- **Energy:** SBTi (science-based for climate)
- **Water:** CDP (water security best practice)
- **Emissions:** SBTi (1.5°C pathway)
- **Waste:** Circular Economy (zero waste trajectory)

You can override with custom rates in `category_targets` table.

---

## File Locations

**Core Logic:**
- `/src/lib/utils/progress-calculation.ts` - Universal formulas
- `/src/lib/sustainability/baseline-calculator.ts` - Aggregation functions
- `/src/lib/forecasting/get-energy-forecast.ts` - ML forecast
- `/src/lib/forecasting/enterprise-forecaster.ts` - Seasonal model

**API Routes:**
- `/src/app/api/sustainability/targets/by-category-dynamic/route.ts`
- `/src/app/api/sustainability/targets/by-category/route.ts`
- `/src/app/api/sustainability/targets/route.ts`

**Dashboards:**
- `/src/components/dashboard/EnergyDashboard.tsx`
- `/src/components/dashboard/WaterDashboard.tsx`
- `/src/components/dashboard/EmissionsDashboard.tsx`

**Hooks:**
- `/src/hooks/useDashboardData.ts` - All data fetching logic

---

## Testing Your Calculations

```bash
# 1. Check baseline (2023 data)
curl "http://localhost:3001/api/sustainability/baseline?org=YOUR_ORG&year=2023"

# 2. Check targets
curl "http://localhost:3001/api/sustainability/targets/by-category-dynamic?\
organizationId=YOUR_ORG&\
categories=Electricity&\
baselineYear=2023&\
targetYear=2025"

# 3. Check forecast
curl "http://localhost:3001/api/energy/forecast?\
organizationId=YOUR_ORG&\
start_date=2025-01-01&\
end_date=2025-12-31"
```

---

## Next Steps

1. **Validate your data**: Check 2023 baseline is accurate
2. **Review reduction rates**: Ensure category targets are set correctly
3. **Analyze exceedances**: Investigate why projected > baseline
4. **Set action plans**: Create initiatives to get back on track
5. **Monitor monthly**: Track progress and adjust forecasts
