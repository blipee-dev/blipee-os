# Enterprise Forecast Integration - 2025 Projected Consumption

## Overview

The `by-category-dynamic` API now uses the same **enterprise ML-based forecast** that powers the Energy Dashboard, providing accurate 2025 projections.

## Calculation Method

### Before (Simple Linear Projection)
```
Projected Annual 2025 = (YTD Consumption / Months with Data) × 12
```

**Example:**
- YTD (Jan-Oct) = 1,500 MWh
- Projected = (1,500 / 10) × 12 = 1,800 MWh

**Limitation:** Assumes linear consumption, ignores seasonality and trends.

---

### After (Enterprise ML Forecast)
```
Projected Annual 2025 = YTD Actual + ML Forecast for Remaining Months
```

**Components:**
1. **YTD Actual (Jan-Oct 2025):** Real consumption data
2. **ML Forecast (Nov-Dec 2025):** Enterprise forecaster prediction using:
   - Seasonal decomposition (Prophet-style)
   - Historical patterns (36 months)
   - Trend analysis
   - Confidence intervals

**Example:**
- YTD (Jan-Oct) actual = 1,500 MWh
- ML forecast (Nov-Dec) = 280 MWh
- Projected = 1,500 + 280 = 1,780 MWh ✅ More accurate

---

## Implementation Details

### API Endpoint
**File:** `/src/app/api/sustainability/targets/by-category-dynamic/route.ts`

**Key Changes:**

1. **Import Shared Forecast Function**
```typescript
import { getEnergyForecast } from '@/lib/forecasting/get-energy-forecast';
```

2. **Fetch Enterprise Forecast** (lines 228-245)
```typescript
if (selectedYear === currentYear) {
  try {
    console.log('📈 [by-category-dynamic] Fetching enterprise forecast for organization:', organizationId);
    // Call shared forecast function to get ML-based projection for remaining months
    forecastData = await getEnergyForecast(
      organizationId,
      `${currentYear}-01-01`,
      `${currentYear}-12-31`
    );
    console.log('✅ [by-category-dynamic] Enterprise forecast received:', {
      forecastMonths: forecastData?.forecast?.length,
      hasData: !!forecastData?.forecast
    });
  } catch (error) {
    console.error('❌ [by-category-dynamic] Error fetching forecast data:', error);
    // Fall back to simple projection if forecast fails
  }
}
```

3. **Calculate Projected Emissions** (lines 257-281)
```typescript
if (forecastData?.forecast && forecastData.forecast.length > 0) {
  // Use enterprise forecast: YTD actual + ML forecast for remaining months
  const RENEWABLE_EMISSION_FACTOR = 0.02; // kgCO2e/kWh
  const FOSSIL_EMISSION_FACTOR = 0.4; // kgCO2e/kWh (IEA average)

  const forecastRemaining = forecastData.forecast.reduce((sum: number, f: any) => {
    const renewableKWh = f.renewable || 0;
    const fossilKWh = f.fossil || 0;
    const renewableEmissions = renewableKWh * RENEWABLE_EMISSION_FACTOR / 1000; // Convert to tCO2e
    const fossilEmissions = fossilKWh * FOSSIL_EMISSION_FACTOR / 1000; // Convert to tCO2e
    return sum + renewableEmissions + fossilEmissions;
  }, 0);

  projectedAnnualEmissions = ytdEmissions + forecastRemaining;
} else if (monthsWithData > 0 && monthsWithData < 12) {
  // Fall back to simple projection if forecast not available
  projectedAnnualEmissions = (ytdEmissions / monthsWithData) * 12;
}

target.currentValue = Math.round(current.value * 10) / 10;
target.currentEmissions = Math.round(ytdEmissions * 10) / 10; // YTD actual
target.projectedAnnualEmissions = Math.round(projectedAnnualEmissions * 10) / 10; // Projected full year
target.monthsWithData = monthsWithData;
target.forecastMethod = forecastData ? 'enterprise-ml' : 'simple-linear';
```

4. **Response Includes Forecast Method**
```typescript
target.forecastMethod = forecastData ? 'enterprise-ml' : 'simple-linear';
```

---

## Shared Forecast Function

### File: `/src/lib/forecasting/get-energy-forecast.ts`

**Purpose:** Provides reusable forecast logic that can be called internally without HTTP authentication issues.

**Key Features:**
- ✅ Direct database access via `supabaseAdmin`
- ✅ No authentication required (server-side only)
- ✅ Fetches 36 months of historical data
- ✅ Handles pagination for large datasets
- ✅ Groups data by month
- ✅ Separates renewable vs. fossil energy
- ✅ Uses EnterpriseForecast ML model
- ✅ Returns confidence intervals

**Function Signature:**
```typescript
export async function getEnergyForecast(
  organizationId: string,
  startDate: string,      // e.g., "2025-01-01"
  endDate: string,        // e.g., "2025-12-31"
  siteId?: string         // Optional: filter by site
): Promise<{
  forecast: Array<{
    monthKey: string;
    month: string;
    total: number;
    renewable: number;
    fossil: number;
    isForecast: boolean;
    confidence: {
      totalLower: number;
      totalUpper: number;
      renewableLower: number;
      renewableUpper: number;
    };
  }>;
  lastActualMonth: string;
  model: string;
  confidence: number;
  metadata: {
    totalTrend: number;
    renewableTrend: number;
    fossilTrend: number;
    r2: number;
    volatility: number;
  };
}>
```

---

## Emission Factors

### Renewable Energy
- **Factor:** 0.02 kgCO2e/kWh
- **Sources:** Solar, Wind, Hydro from grid mix
- **Note:** Includes upstream emissions (manufacturing, installation)

### Fossil Energy
- **Factor:** 0.4 kgCO2e/kWh
- **Source:** IEA average for fossil fuel electricity
- **Includes:** Coal, Natural Gas, Oil

---

## Response Format

### API Response
```json
{
  "success": true,
  "data": [
    {
      "id": "dynamic-<metric_id>",
      "metricName": "Grid Electricity",
      "category": "Electricity",
      "scope": "scope_2",
      "unit": "MWh",
      "baselineYear": 2023,
      "targetYear": 2025,
      "baselineValue": 1750.0,
      "baselineEmissions": 168.7,
      "targetValue": 1676.5,
      "targetEmissions": 161.5,
      "currentValue": 1250.0,
      "currentEmissions": 112.5,
      "projectedAnnualEmissions": 135.0,
      "monthsWithData": 10,
      "forecastMethod": "enterprise-ml",
      "progress": {
        "reductionNeeded": 7.2,
        "reductionAchieved": 33.7,
        "progressPercent": 468.1,
        "exceedancePercent": 0,
        "trajectoryStatus": "on-track",
        "ytdEmissions": 112.5,
        "projectedAnnual": 135.0
      }
    }
  ],
  "meta": {
    "baselineYear": 2023,
    "targetYear": 2025,
    "categoriesQueried": ["Electricity", "Purchased Energy", "Natural Gas"],
    "metricsFound": 15,
    "calculatedDynamically": true
  }
}
```

---

## Enterprise Forecaster Details

**File:** `/src/lib/forecasting/enterprise-forecaster.ts`

**Method:** Seasonal decomposition (additive model)
```
Forecast = Trend + Seasonality + Residuals
```

**Features:**
- ✅ Handles seasonality (monthly patterns)
- ✅ Trend detection (increasing/decreasing over time)
- ✅ Confidence intervals (upper/lower bounds)
- ✅ R² goodness-of-fit metric
- ✅ Volatility calculation
- ✅ Automatic fallback to moving average if needed

**Training Data:**
- **Period:** Last 36 months
- **Granularity:** Monthly aggregation
- **Minimum:** 12 months required

---

## Benefits

### 1. **Accuracy**
- Accounts for seasonal patterns (e.g., higher heating in winter)
- Uses actual historical trends
- Better than simple linear extrapolation

### 2. **Consistency**
- Same forecast used across all dashboards
- Energy Dashboard and SBTi targets show identical projections
- Single source of truth

### 3. **Reliability**
- ML model trained on 3 years of data
- Confidence intervals provided
- Automatic fallback if ML unavailable

### 4. **Transparency**
- `forecastMethod` field shows which method was used
- Can compare ML vs simple projection
- Debugging and validation easier

---

## Fallback Behavior

If enterprise forecast fails or is unavailable:

1. **Primary:** Try to fetch ML forecast
2. **Secondary:** Fall back to simple linear projection
3. **Tertiary:** Use YTD as-is if < 12 months

**Example:**
```typescript
if (forecastData?.forecast) {
  // Use ML forecast ✅
  projectedAnnualEmissions = ytdEmissions + forecastRemaining;
} else if (monthsWithData > 0 && monthsWithData < 12) {
  // Use simple projection ⚠️
  projectedAnnualEmissions = (ytdEmissions / monthsWithData) * 12;
} else {
  // Use YTD only 🚨
  projectedAnnualEmissions = ytdEmissions;
}
```

---

## Testing

### Manual Test
```bash
# Start dev server
npm run dev

# Call API
curl "http://localhost:3001/api/sustainability/targets/by-category-dynamic?\
organizationId=22647141-2ee4-4d8d-8b47-16b0cbd830b2&\
categories=Electricity,Purchased%20Energy,Natural%20Gas&\
baselineYear=2023&\
targetYear=2025"
```

### Check Response
```json
{
  "forecastMethod": "enterprise-ml",  // ✅ Should be 'enterprise-ml'
  "projectedAnnualEmissions": 135.0,   // ✅ Should match Energy Dashboard
  "monthsWithData": 10,                 // ✅ Jan-Oct 2025
  "progress": {
    "trajectoryStatus": "on-track"     // ✅ Accurate status
  }
}
```

---

## EmissionsDashboard Fix

### Issue
**Error:** `ReferenceError: formatScope is not defined` at line 3018

**File:** `/src/components/dashboard/EmissionsDashboard.tsx`

**Root Cause:** The `formatScope()` helper function was missing from EmissionsDashboard but was already being used to display metric scope labels (e.g., "Scope 1", "Scope 2").

### Solution
Added the missing helper function at lines 110-115:

```typescript
// Helper function to format scope labels (scope_1 -> Scope 1)
const formatScope = (scope: string): string => {
  if (!scope) return '';
  // Convert scope_1 -> Scope 1, scope_2 -> Scope 2, scope_3 -> Scope 3
  return scope.replace(/scope_(\d+)/i, 'Scope $1').replace(/scope(\d+)/i, 'Scope $1');
};
```

**Usage:** Line 3018 - Displays scope badge in SBTi metric targets section
```typescript
<span className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
  {formatScope(metric.scope)}
</span>
```

---

## Impact on Energy Dashboard

### Before Integration
- Simple linear projection: `(YTD / 10) × 12`
- No seasonality consideration
- Less accurate for winter/summer peaks

### After Integration
- Enterprise ML forecast used everywhere
- Consistent projections across all views
- **SBTi expandable section** now shows accurate 2025 projections
- Progress tracking more reliable

---

## Next Steps

✅ **Completed:**
- Integrated enterprise forecast into by-category-dynamic API
- Created shared getEnergyForecast() function
- Added forecastMethod field to response
- Fallback to simple projection if ML unavailable
- Unit conversion (kg → tCO2e)
- Progress calculation with trajectory status
- Fixed EmissionsDashboard formatScope error

🎯 **Ready for Use:**
- Energy Dashboard SBTi section
- Emissions Dashboard SBTi section
- Metric-level target tracking
- Replanning calculations
- Feasibility assessments

📊 **Data Available:**
- YTD actual consumption (Jan-Oct 2025)
- ML-forecasted consumption (Nov-Dec 2025)
- Projected annual 2025 total
- Comparison with 2023 baseline and 2025 targets
- On-track/at-risk/off-track status

---

## Troubleshooting

### 401 Unauthorized Error

**Symptom:** API returns 401 when called from browser

**Causes:**
1. User session expired
2. Cookies not being sent properly
3. CORS issues
4. Missing authentication headers

**Solutions:**
1. **Refresh the page** - Restart the session
2. **Check browser cookies** - Ensure Supabase auth cookies exist
3. **Re-login** - Clear session and login again
4. **Check network tab** - Verify cookies are being sent with request

**Note:** The shared `getEnergyForecast()` function avoids this issue for internal API calls by using `supabaseAdmin` directly, but the API endpoint itself still requires authentication.

---

## Files Modified

1. `/src/lib/forecasting/get-energy-forecast.ts` - **Created** (shared forecast function)
2. `/src/app/api/sustainability/targets/by-category-dynamic/route.ts` - **Modified** (integrated enterprise forecast)
3. `/src/components/dashboard/EmissionsDashboard.tsx` - **Modified** (added formatScope function)
4. `/docs/enterprise-forecast-integration.md` - **Created** (this documentation)
