# Top Emitters: Metric-Level Implementation

## Summary

Successfully implemented metric-level granularity for the "Top Emitters" (Top Fontes de Emissão) section in the Overview Dashboard. The system now displays individual metrics (like "Grid Electricity", "Business Travel - Flights", "District Heating") instead of aggregated categories (like "Purchased Electricity: 83.8 tCO2e").

## Problem Statement

**User Question:** "but what is on this? - purchased_electricity: 83.8"

The Top Emitters section was showing aggregated category-level data where "Purchased Electricity: 83.8 tCO2e" was the sum of ALL Scope 2 electricity-related metrics:
- Grid Electricity
- EV Chargers
- District Heating
- District Cooling
- etc.

This didn't provide enough granularity for actionable insights.

## Solution Implemented

### 1. Created New API Endpoint

**File:** `/src/app/api/sustainability/top-metrics/route.ts`

- **Purpose:** Fetch top emission-generating metrics at the individual metric level
- **Authentication:** Uses Supabase auth and organization membership validation
- **Parameters:**
  - `start_date` (required): Start date of the period (YYYY-MM-DD)
  - `end_date` (required): End date of the period (YYYY-MM-DD)
  - `limit` (optional): Number of metrics to return (default: 10)

**Response Format:**
```json
{
  "metrics": [
    {
      "name": "Business Travel - Flights",
      "value": 50000,
      "unit": "km",
      "category": "Business Travel",
      "scope": "scope_3",
      "emissions": 170.7,
      "recordCount": 12
    },
    {
      "name": "Grid Electricity",
      "value": 150000,
      "unit": "kWh",
      "category": "Electricity",
      "scope": "scope_2",
      "emissions": 45.2,
      "recordCount": 24
    }
    // ... more metrics
  ],
  "period": {
    "start": "2025-01-01",
    "end": "2025-12-31"
  },
  "metadata": {
    "totalMetrics": 5,
    "limit": 10
  }
}
```

### 2. Updated OverviewDashboard Component

**File:** `/src/components/dashboard/OverviewDashboard.tsx`

**Changes Made (lines 449-485):**

**BEFORE:** Collected categories from `scope_1.categories`, `scope_2.categories`, `scope_3.categories` and aggregated by category name.

**AFTER:** Fetches metric-level data from the new API endpoint:

```typescript
// Fetch Top Emitters at METRIC level (not category level)
const topMetricsParams = new URLSearchParams({
  start_date: selectedPeriod.start,
  end_date: selectedPeriod.end,
});
if (selectedSite) {
  topMetricsParams.append('site_id', selectedSite.id);
}

const topMetricsResponse = await fetch(`/api/sustainability/top-metrics?${topMetricsParams}`);
const topMetricsData = await topMetricsResponse.json();

if (topMetricsData.metrics && topMetricsData.metrics.length > 0) {
  const topFive = topMetricsData.metrics.slice(0, 5).map((metric: any) => ({
    name: metric.name,
    emissions: metric.emissions,
    percentage: currentTotal > 0 ? (metric.emissions / currentTotal) * 100 : 0
  }));
  setTopEmitters(topFive);
}
```

### 3. Leveraged Existing Calculator Function

**File:** `/src/lib/sustainability/baseline-calculator.ts`

**Function:** `getTopMetrics()` (lines 1226-1304)

This function:
1. Fetches all metrics data for the period
2. Groups by metric name (not category)
3. Sums emissions per metric name
4. Sorts by emissions (highest first)
5. Returns top N metrics

**Key Logic:**
```typescript
// Group by metric name
const metricMap = new Map<string, {
  value: number;
  emissions: number;
  count: number;
  unit: string;
  category: string;
  scope: string;
}>();

metricsData.forEach(d => {
  const catalog = (d.metrics_catalog as any);
  const name = catalog?.name || 'Unknown';

  if (!metricMap.has(name)) {
    metricMap.set(name, { value: 0, emissions: 0, count: 0, unit, category, scope });
  }

  const metric = metricMap.get(name)!;
  metric.value += d.value || 0;
  metric.emissions += (d.co2e_emissions || 0) / 1000; // Convert kgCO2e to tCO2e
  metric.count++;
});

// Sort by emissions (highest first) and limit
return metrics.sort((a, b) => b.emissions - a.emissions).slice(0, limit);
```

## Data Flow

```
1. User views Overview Dashboard
   ↓
2. OverviewDashboard.tsx fetches scope-analysis data (for total emissions)
   ↓
3. OverviewDashboard.tsx fetches top-metrics data (for individual metrics)
   ↓
4. API endpoint /api/sustainability/top-metrics validates auth
   ↓
5. API calls getTopMetrics() from baseline-calculator.ts
   ↓
6. getTopMetrics() fetches raw metrics_data records
   ↓
7. Groups by metric name and sums emissions
   ↓
8. Returns top N metrics sorted by emissions
   ↓
9. OverviewDashboard displays top 5 metrics in UI
```

## Expected Results

### Before (Category-Level)
```
Top Emitters:
1. Purchased Electricity: 83.8 tCO2e (35%)
2. Business Travel: 170.7 tCO2e (45%)
3. Stationary Combustion: 45.2 tCO2e (12%)
```

### After (Metric-Level)
```
Top Emitters:
1. Business Travel - Flights: 170.7 tCO2e (45%)
2. Grid Electricity: 45.2 tCO2e (12%)
3. EV Chargers: 20.3 tCO2e (5%)
4. District Heating: 15.8 tCO2e (4%)
5. Car Travel - Gasoline: 12.5 tCO2e (3%)
```

## Testing

**Test Script:** `test-top-metrics-api.js`

Run the test to verify the API endpoint works correctly:
```bash
node test-top-metrics-api.js
```

Expected output:
- API returns 200 OK
- Metrics array contains individual metric names
- Emissions are properly calculated in tCO2e
- Metrics are sorted by emissions (highest first)

## Benefits

1. **Actionable Insights:** Users can now see exactly which individual metrics are the biggest contributors to emissions
2. **Granular Targeting:** Enables more precise reduction initiatives (e.g., "reduce business travel flights" instead of "reduce business travel")
3. **Better Data Quality:** Shows individual metrics with their native units (kWh, km, m³) for validation
4. **Consistent Calculations:** Uses the centralized `getTopMetrics()` function from baseline-calculator.ts
5. **Scalable:** The API endpoint can be reused by other dashboards or components

## Files Modified

1. `/src/components/dashboard/OverviewDashboard.tsx` (lines 449-485)
   - Removed category-level aggregation logic
   - Added API call to `/api/sustainability/top-metrics`

## Files Created

1. `/src/app/api/sustainability/top-metrics/route.ts`
   - New API endpoint for fetching top emission-generating metrics

2. `/Users/pedro/Documents/blipee/blipee-os/blipee-os/test-top-metrics-api.js`
   - Test script to verify API functionality

3. `/Users/pedro/Documents/blipee/blipee-os/blipee-os/TOP_EMITTERS_METRIC_LEVEL_IMPLEMENTATION.md`
   - This documentation file

## Notes

- The `getTopMetrics()` function already existed in baseline-calculator.ts and was production-ready
- No database migrations required
- No breaking changes to existing functionality
- The scope-analysis API still returns category-level data for backward compatibility
- Individual metric names come from the `metrics_catalog.name` field in the database

## Future Enhancements

1. Add metric-level drill-down modal (click on a metric to see monthly breakdown)
2. Add comparison to previous period for each metric
3. Add filtering by scope (Scope 1, 2, or 3)
4. Add filtering by category
5. Add export functionality for top metrics report
