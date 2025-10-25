# Dashboard Data Pipeline

This document describes how sustainability dashboards retrieve, cache, and transform data in the Next.js application. It covers the React Query layer, backend routes, and verification steps teams should follow after making data changes.

---

## 1. High-Level Architecture

```
Supabase (metrics_data, targets, category tables)
        │
        ▼
Next.js API Routes (energy, water, waste, emissions, targets, dashboard)
        │
        ▼
React Query Hooks (`src/hooks/useDashboardData.ts`)
        │
        ▼
Dashboard Components (`src/components/dashboard/*`)
```

Key goals:

- Normalise access to Supabase through API routes (admin client for server-side aggregation, RLS-aware client for user-scoped data).  
- Provide consistent query keys and caching via React Query, with localStorage persistence to improve dashboard load time.  
- Support organization + site-scoped filters and multiple historical comparisons (YoY, full previous year, forecasts).

---

## 2. React Query Configuration

- Provider: `src/providers/ReactQueryProvider.tsx` wraps the app with `PersistQueryClientProvider`.  
- Defaults:
  - `staleTime`: 5 minutes (most dashboard data accepts short-lived staleness).  
  - `gcTime`: 10 minutes.  
  - `retry`: 2 attempts for transient failures.  
  - `refetchOnWindowFocus`, `refetchOnMount`, `refetchOnReconnect`: disabled to avoid spamming the APIs.
- Persistence: `createCachePersister()` stores successful queries in localStorage (`blipee-dashboard-cache-v1`). Dev mode logs when cache is restored.

---

## 3. Time Period Handling

- `TimePeriod` objects (from `TimePeriodSelector`) provide `start` and `end` in `YYYY-MM-DD`.  
- Hooks derive previous year comparisons by shifting the period start/end dates minus one year.  
- For current-year forecasts, the end date is forced to December 31 of the current year to ensure full-year projections.

---

## 4. Hook Overview (`src/hooks/useDashboardData.ts`)

### 4.1 Energy

- Endpoints:  
  - `/api/energy/sources`  
  - `/api/energy/intensity`  
  - `/api/energy/forecast`
- Features:  
  - Parallel fetch of sources + intensity + forecast.  
  - Previous-year and full-year baseline pull for YoY comparisons.  
  - Forecast request extends to end-of-year when viewing the current year.

### 4.2 Water

- Endpoints: `/api/water/sources`, `/api/water/forecast`.  
- Similar pattern to energy with YoY and full-prev-year fetches.  
- Forecast logic handles withdrawal/discharge breakout when the API returns detailed categories.

### 4.3 Waste

- Endpoints: `/api/waste/streams`, `/api/waste/forecast`.  
- Additional hook fetches baseline data using `baselineYear` to compute reduction progress.

### 4.4 Emissions & Overview

- Combined endpoints:  
  - `/api/sustainability/dashboard` (large aggregation of `metrics_data`).  
  - `/api/sustainability/scope-analysis`  
  - `/api/sustainability/targets` + `targets/unified-emissions`  
  - `/api/sustainability/forecast`
- Query keys include suffixes (`'forecast','v2'`) to force cache busting when data contracts change.

### 4.5 Transportation

- Endpoints: `/api/transportation/fleet`, `/business-travel`, `/commute`, `/logistics`, plus `/target-allocation`.  
- Hook coordinates multiple sub-sections for the transportation dashboard view.

### 4.6 Compliance

- Endpoints: `/api/compliance/status`, `/ghg-protocol`, `/gri-###`, `/reduction-initiatives`, etc.  
- Query keys are site-aware and include selected year; data powers scorecards and checklists.

---

## 5. Aggregation API (`/api/sustainability/dashboard`)

Purpose:

- Fetch metrics for emissions + overview dashboards with built-in pagination to avoid Supabase’s 1,000 row limit.  
- Filters out future months to prevent mixing forecasted data into historical series.  
- Returns site metadata, aggregated totals, and scope colour mapping (`SCOPE_COLORS`).  
- Accepts:
  - `range` (month, quarter, year, 2025, all, etc.) OR explicit `start_date`,`end_date`.  
  - `site`/`site_id` for site-specific dashboards.  
- Authentication: uses `getAPIUser` and checks for super admin overrides (PLMJ org fallback).

---

## 6. Caching & Performance Considerations

- React Query handles client-side caching; the API routes often layer additional caching:
  - Energy/forecast routes may memoize expensive computations or reuse `EnterpriseForecast`.  
  - Sustainability Intelligence (separate endpoint) adds a 5-minute cache for agent results.  
- Pagination loops in API routes ensure large organizations do not hit record limits.  
- When you change the shape of a response, bump the relevant query key suffix (e.g., `'forecast','v2'`) to invalidate persisted cache.

---

## 7. Verification Checklist

1. **API Health**
   ```bash
   curl -H "Authorization: Bearer <TOKEN>" \
     "http://localhost:3000/api/sustainability/dashboard?range=year"
   ```
   - Confirm response includes `metrics`, `sites`, and time-series arrays without future-dated records.

2. **React Query Cache**
   - Load dashboards in the browser.  
   - Check DevTools → Application → Local Storage for `blipee-dashboard-cache-v1`.  
   - Reload the page; ensure cached queries hydrate instantly before refetch.

3. **Site Filters**
   - Switch sites in the UI and verify network calls include `site_id`.  
   - Data should update without cross-contaminating organization totals.

4. **YoY / Full Prev-Year**
   - Inspect React Query Devtools (dev mode) to confirm queries with `'prevYear'` and `'fullPrevYear'` suffixes resolve successfully.

5. **Forecast Validation**
   - For the current year, check that the forecast response exposes `currentYearIsForecast` and `forecastedRemaining`.  
   - When viewing a completed year, the forecast should disable additional fetches.

---

## 8. Related Documentation

- `docs/SUSTAINABILITY_INTELLIGENCE.md` – AI overlay that consumes the same datasets.  
- `docs/TARGETS_AND_FORECAST_APIS.md` – Detailed reference for target & forecast endpoints used by the hooks.  
- `docs/DOCUMENTATION_INDEX.md` – Review cadence and ownership.

