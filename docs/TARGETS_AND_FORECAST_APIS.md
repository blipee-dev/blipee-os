# Targets & Forecast API Reference

This document describes the sustainability targets and forecasting endpoints, their data model dependencies, and how to validate the outputs consumed by dashboards and autonomous agents.

---

## 1. Scope

- Targets: baseline calculations, progress tracking, and Science Based Targets initiative (SBTi) projections.  
- Category-level target allocation and dynamic metric generation.  
- Forecasting: emissions, energy, and waste projections powered by the enterprise forecasting utilities.

---

## 2. Key Components

| Path | Summary |
| --- | --- |
| `src/app/api/sustainability/targets/route.ts` | Main target summary combining database records with recalculated baseline/current emissions. |
| `src/app/api/sustainability/targets/by-category/route.ts` | Retrieves stored metric targets filtered by category, including monthly actuals. |
| `src/app/api/sustainability/targets/by-category-dynamic/route.ts` | Generates metric targets on the fly from category reduction rates and baseline data. |
| `src/app/api/sustainability/targets/weighted-allocation/route.ts` | Allocates organization-level reductions across categories using effort factors. |
| `src/app/api/sustainability/targets/unified-emissions/route.ts` | Produces a combined view of targets, actuals, and forecasted emissions per scope/category. |
| `src/app/api/sustainability/forecast/route.ts` | ML-enhanced emissions forecast (seasonality + Prophet-style additive model). |
| `src/app/api/waste/forecast/route.ts` | Water/waste specific forecast endpoint (seasonal patterns, fill forward for missing months). |

Auxiliary libraries:

- `src/lib/sustainability/baseline-calculator.ts` – Baseline, period emissions, category breakdown utilities.  
- `src/lib/forecasting/enterprise-forecaster.ts` – Shared forecasting engine for emissions, energy, waste.  
- `src/lib/utils/progress-calculation.ts` – Progress, trajectory, and attainment status helpers.

---

## 3. Endpoint Details

### 3.1 `GET /api/sustainability/targets`

Parameters:

- `site_id` (optional) – When present, baseline/current emissions are recalculated for the site while targets remain organization-level.

Highlights:

- Authenticates the request, resolves the organization via `organization_members`, and fetches all `sustainability_targets`.  
- Calculates SBTi-aligned target recommendations when a baseline exists (`calculateSBTiTargets`).  
- Determines `progress_percentage`, `performance_status`, and emission totals using fresh calculations rather than persisted values.  
- Fetches year-to-date metrics with pagination to avoid Supabase’s 1,000 row limit and fills incomplete years with forecasts (`EnterpriseForecast.generateForecast`).

### 3.2 `GET /api/sustainability/targets/by-category`

Parameters:

- `organizationId` (required)  
- `targetId` (required) – `sustainability_targets.id`  
- `categories` (required) – comma-separated category names

Behaviour:

- Confirms access using the standard Supabase client (RLS-protected).  
- Pulls `metric_targets` + `metric_targets_monthly` for the requested categories.  
- Returns raw targets together with their associated metric catalog metadata for client-side filtering and visualisation.  
- When categories represent water metrics, additional aggregation logic collects year-to-date withdrawal vs discharge totals.

### 3.3 `GET /api/sustainability/targets/by-category-dynamic`

Parameters:

- `organizationId` (required)  
- `categories` (required) – comma-separated list  
- `baselineYear` (optional, default `2023`)  
- `targetYear` (optional, default `2025`)

Behaviour:

- Reads `category_targets` for the organization to determine reduction rates.  
- Fetches the relevant metrics from `metrics_catalog` and historical baselines from `metrics_data`.  
- Calculates metric-level targets dynamically:
  - Baseline value and emissions per metric  
  - Annual reduction rate inherited from the category  
  - Target value/emissions, projected reductions, and trajectory status via `calculateProgress` / `getTrajectoryStatus`.  
- Returns an empty dataset with a helpful message if category targets are missing (users should run the weighted allocation step first).

### 3.4 `GET /api/sustainability/targets/weighted-allocation`

Parameters:

- `organizationId` (required)  
- `baselineYear` (optional, default `2023`)  
- `targetYear` (optional, default `2030`)

Behaviour:

- Uses `getCategoryBreakdown` to compute category-level emissions.  
- Applies category effort factors (hard-coded mapping) to prioritise reductions where abatement potential is highest.  
- Returns a ranked list of categories with recommended reduction percentages and qualitative rationale (`reason` field).  
- Results can be persisted by the client (often prior to running dynamic metric target generation).

### 3.5 `GET /api/sustainability/targets/unified-emissions`

- Consolidates actual emissions, baselines, targets, and forecasted trajectories by scope and category.  
- Designed for the unified emissions dashboard tab and for agent consumption.  
- Includes metadata for chart colouring (scope colours) and normalised units (tCO2e).

### 3.6 `GET /api/sustainability/forecast`

Parameters:

- `start_date`, `end_date` (required)  
- `site_id` (optional)

Behaviour:

- Fetches all historical metrics from 2022 onwards with pagination and filters out future months.  
- Uses `EnterpriseForecast` to fill the remaining months in the current year when data is incomplete.  
- Returns actual vs forecasted emissions, plus metadata (`currentYearIsForecast`, `actualYearToDate`, `forecastedRemaining`).

### 3.7 `GET /api/waste/forecast`

- Mirrors the emissions forecast pattern but tailored for water/waste categories (withdrawal, discharge, consumption).  
- Builds monthly aggregates and applies smoothing when data is sparse.

---

## 4. Data Model Dependencies

- **Supabase Tables**
  - `sustainability_targets`, `category_targets`, `metric_targets`, `metric_targets_monthly`  
  - `metrics_catalog`, `metrics_data`, `organization_members`, `sites`
- **Calculated Inputs**
  - Baselines (`getBaselineEmissions`) and period emissions (`getPeriodEmissions`)  
  - Category breakdown (`getCategoryBreakdown`) for allocations  
  - Forecasts (`EnterpriseForecast.generateForecast`, `getEnergyForecast`)

---

## 5. Error Handling & Performance

- All endpoints require authentication (`getAPIUser`); unauthorized users receive `401`.  
- Organization membership is checked via Supabase RLS queries; failures return `403`.  
- Long-running queries paginate through 1,000-row chunks to avoid Supabase limits.  
- Forecast fallbacks:
  - If forecasting fails, the API returns partial actuals with warning logs (no hard crash).  
  - Category target endpoints return descriptive messages when prerequisite data is missing.

---

## 6. Verification Steps

1. **Targets Summary**
   ```bash
   curl -X GET "http://localhost:3000/api/sustainability/targets?site_id=<SITE>" \
     -H "Authorization: Bearer <TOKEN>"
   ```
   - Confirm `targets` array contains recalculated `baseline_emissions`, `current_emissions`, and `progress_percentage`.

2. **Weighted Allocation**
   ```bash
   curl -X GET "http://localhost:3000/api/sustainability/targets/weighted-allocation?organizationId=<ORG>" \
     -H "Authorization: Bearer <TOKEN>"
   ```
   - Verify categories include `effortFactor` and `recommendedReductionPercent`.

3. **Dynamic Metrics**
   ```bash
   curl -X GET "http://localhost:3000/api/sustainability/targets/by-category-dynamic?organizationId=<ORG>&categories=Electricity,Purchased%20Energy" \
     -H "Authorization: Bearer <TOKEN>"
   ```
   - Response should list metric targets with `baseline`, `target`, `annualReductionRate`, and `trajectory`.

4. **Emissions Forecast**
   ```bash
   curl -X GET "http://localhost:3000/api/sustainability/forecast?start_date=2024-01-01&end_date=2024-12-31" \
     -H "Authorization: Bearer <TOKEN>"
   ```
   - Confirm `currentYearIsForecast` toggles when months are missing and `forecastedRemaining` fills the balance.

---

## 7. Related Documentation

- `docs/SUSTAINABILITY_INTELLIGENCE.md` – Shows how the intelligence layer consumes these endpoints.  
- `docs/DASHBOARD_DATA_PIPELINE.md` – Explains how dashboards combine API responses via React Query.  
- `docs/DOCUMENTATION_INDEX.md` – Ownership and review cadence.

