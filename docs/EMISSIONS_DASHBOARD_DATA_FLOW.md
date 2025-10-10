# Emissions Dashboard - Complete Data Flow Analysis

## Component Location
`/src/components/dashboard/EmissionsDashboard.tsx` (2,622 lines)

## API Endpoints Used

The Emissions Dashboard makes **6 main API calls** in the `useEffect` hook:

### 1. 📊 **Scope Analysis API** (Current Period)
**Endpoint**: `/api/sustainability/scope-analysis`

**Parameters**:
- `start_date`: Selected period start (e.g., "2023-01-01")
- `end_date`: Selected period end (e.g., "2023-12-31")
- `site_id`: (optional) Specific site filter

**What It Returns**:
```javascript
{
  scopeData: {
    scope_1: {
      total: 0.0,
      percentage: 0,
      categories: {
        'Stationary Combustion': { value: 0, percentage: 0 },
        'Mobile Combustion': { value: 0, percentage: 0 },
        'Fugitive Emissions': { value: 0, percentage: 0 }
      }
    },
    scope_2: {
      total: 177.9,
      percentage: 58.6,
      locationBased: 177.9,
      marketBased: 177.9,
      renewablePercentage: 0,
      categories: {
        'Purchased Electricity': { value: 44.6, percentage: 25.1 },
        'Purchased Heating': { value: 133.3, percentage: 74.9 }
      }
    },
    scope_3: {
      total: 125.7,
      percentage: 41.4,
      categories: {
        'Business Travel': { value: 123.6, percentage: 98.3 },
        'Purchased Goods & Services': { value: 2.1, percentage: 1.7 }
      }
    }
  },
  intensityMetrics: {
    perEmployee: 1.52,
    perRevenue: 30.4,  // tCO2e per M€
    perSqm: 15.2       // kgCO2e/m²
  },
  organizationEmployees: 200,
  annualRevenue: 10000000,
  totalAreaSqm: 20000
}
```

**Used For**:
- ✅ Total Emissions Summary card
- ✅ Scope 1/2/3 breakdown cards
- ✅ Intensity metrics (per employee, revenue, sqm)
- ✅ Category breakdowns for each scope
- ✅ Scope 2 dual reporting (location vs market-based)
- ✅ Scope 3 coverage tracking

**Code Location**: Line 344
```typescript
const scopeResponse = await fetch(`/api/sustainability/scope-analysis?${params}`);
```

---

### 2. 📈 **Dashboard API** (Current Period)
**Endpoint**: `/api/sustainability/dashboard`

**Parameters**:
- `start_date`: Selected period start
- `end_date`: Selected period end
- `site_id`: (optional) Site filter

**What It Returns**:
```javascript
{
  metrics: {
    totalEmissions: { value: 303.6, unit: 'tCO2e', change: -25.6, trend: 'down' }
  },
  trendData: [
    { month: 'Jan', emissions: 25.3, scope1: 0, scope2: 14.8, scope3: 10.5 },
    { month: 'Feb', emissions: 24.1, scope1: 0, scope2: 14.2, scope3: 9.9 },
    { month: 'Mar', emissions: 26.7, scope1: 0, scope2: 15.6, scope3: 11.1 },
    // ... up to current month
  ]
}
```

**Used For**:
- ✅ Monthly Emissions Trend chart (line chart)
- ✅ Actual YTD emissions calculation
- ✅ Month-by-month breakdown

**Code Location**: Line 348
```typescript
const dashboardResponse = await fetch(`/api/sustainability/dashboard?${params}`);
```

---

### 3. 🎯 **Targets API**
**Endpoint**: `/api/sustainability/targets`

**Parameters**: None (uses organization from session)

**What It Returns**:
```javascript
{
  targets: [
    {
      id: 'd4a00170...',
      target_type: 'near-term',
      target_name: 'PLMJ 1.5C Target',
      baseline_year: 2023,
      baseline_emissions: 303.6,
      target_year: 2030,
      target_emissions: 176.1,
      target_reduction_percent: 42,
      current_emissions: 289.4,
      performance_status: 'on-track',
      progress_percentage: 13.5
    }
  ],
  baselineData: {
    year: 2023,
    scope_1: 0.0,
    scope_2: 177.9,
    scope_3: 125.7,
    total: 303.6
  }
}
```

**Used For**:
- ✅ SBTi Target Progress section
- ✅ Progress vs target visualization
- ✅ Baseline comparison

**Code Location**: Line 352
```typescript
const targetsResponse = await fetch('/api/sustainability/targets');
```

---

### 4. 📊 **Scope Analysis API** (Previous Year)
**Endpoint**: `/api/sustainability/scope-analysis` (with previous year dates)

**Parameters**:
- `start_date`: Previous year start (e.g., "2022-01-01")
- `end_date`: Previous year end (e.g., "2022-12-31")
- `site_id`: (optional) Same site filter

**What It Returns**: Same structure as current period scope analysis

**Used For**:
- ✅ Year-over-Year (YoY) percentage calculations
- ✅ Trend indicators (up/down arrows)
- ✅ Growth/reduction metrics

**Code Location**: Line 373
```typescript
const prevScopeResponse = await fetch(`/api/sustainability/scope-analysis?${prevParams}`);
```

**Calculation Example**:
```typescript
const currentTotal = s1Current + s2Current + s3Current; // 303.6
const previousTotal = s1Previous + s2Previous + s3Previous; // 408.2
const totalYoY = ((currentTotal - previousTotal) / previousTotal) * 100; // -25.6%
```

---

### 5. 🔮 **Forecast API**
**Endpoint**: `/api/sustainability/forecast`

**Parameters**: Same as dashboard API

**What It Returns**:
```javascript
{
  forecast: [
    { month: 'Nov', total: 24.5, scope1: 0, scope2: 14.3, scope3: 10.2, forecast: true },
    { month: 'Dec', total: 24.8, scope1: 0, scope2: 14.5, scope3: 10.3, forecast: true }
  ],
  model: 'LSTM',
  confidence: 0.87,
  r2: 0.92,
  metadata: {
    method: 'LSTM',
    trendSlope: -0.15
  }
}
```

**Used For**:
- ✅ Projected annual emissions
- ✅ Forecast line on charts (dashed line)
- ✅ Year-end projections
- ✅ SBTi progress forecast

**Code Location**: Line 503
```typescript
const forecastRes = await fetch(`/api/sustainability/forecast?${params}`);
```

**Projected Annual Calculation**:
```typescript
const actualEmissions = trends.reduce((sum, t) => sum + t.total, 0);        // YTD: 240.5
const forecastedEmissions = forecastMonths.reduce((sum, f) => sum + f.total, 0); // Nov+Dec: 49.3
const projectedTotal = actualEmissions + forecastedEmissions;                // 289.8
```

---

### 6. 📈 **Dashboard API** (Previous Year Monthly)
**Endpoint**: `/api/sustainability/dashboard` (with previous year dates)

**Parameters**:
- `start_date`: Previous year start
- `end_date`: Previous year end (adjusted to last available data month)
- `site_id`: (optional) Site filter

**What It Returns**: Same structure as current dashboard, but for previous year

**Used For**:
- ✅ Month-over-month YoY comparison chart
- ✅ Comparative trend visualization
- ✅ Growth trends per month

**Code Location**: Line 593
```typescript
const prevDashboardRes = await fetch(`/api/sustainability/dashboard?${prevYearParams}`);
```

---

## Dashboard Sections Breakdown

### 🎯 Section 1: Summary Cards (Top Row)

#### Card 1: Total Emissions Summary
- **Data Source**: Scope Analysis API (current + previous year)
- **Calculation**: `scope_1.total + scope_2.total + scope_3.total`
- **Display**:
  - Current: `303.6 tCO2e`
  - YoY: `-25.6%` with down arrow
  - Visual: Sparkline/mini trend
- **State**: `totalEmissions`, `totalEmissionsYoY`
- **Line**: 391-397, 407-412

#### Card 2: Intensity Metrics (Multiple)
- **Data Source**: Scope Analysis API → `intensityMetrics`
- **Calculations**:
  - Per Employee: `totalEmissions / employees` = `1.52 tCO2e/FTE`
  - Per Revenue: `(totalEmissions * 1,000,000) / revenue` = `30.4 tCO2e/M€`
  - Per Area: `(totalEmissions * 1000) / totalAreaSqm` = `15.2 kgCO2e/m²`
- **Display**: Tabbed view with 3 intensity types
- **State**: `intensityMetrics`, `intensityPerEmployee`, `intensityPerRevenue`, `intensityPerSqm`
- **Line**: 416-445

#### Card 3: Projected Annual Emissions
- **Data Source**: Dashboard API (actual) + Forecast API
- **Calculation**: `actualYTD + forecastedRemaining`
- **Display**:
  - Projected: `289.8 tCO2e`
  - Breakdown: `240.5 actual + 49.3 forecasted`
  - Confidence: `87%`
- **State**: `projectedAnnualEmissions`, `actualEmissionsYTD`, `forecastedEmissions`
- **Line**: 523-536

---

### 📊 Section 2: Detailed Scope Cards

#### Scope 1 Card: Direct Emissions
- **Data Source**: Scope Analysis API → `scopeData.scope_1`
- **Shows**:
  - Total: `0.0 tCO2e`
  - Percentage of total: `0%`
  - YoY: `0%`
  - **Category Breakdown**:
    - Stationary Combustion: `0.0 tCO2e` (boilers, heaters)
    - Mobile Combustion: `0.0 tCO2e` (company vehicles)
    - Fugitive Emissions: `0.0 tCO2e` (refrigerants, AC)
  - Action recommendations per category
- **State**: `scope1Total`, `scopeYoY.scope1`
- **Line**: 394, 408

#### Scope 2 Card: Indirect Energy Emissions
- **Data Source**: Scope Analysis API → `scopeData.scope_2`
- **Shows**:
  - Total: `177.9 tCO2e`
  - Percentage of total: `58.6%`
  - YoY: `-15.2%`
  - **Dual Reporting**:
    - Location-based: `177.9 tCO2e`
    - Market-based: `177.9 tCO2e`
    - Renewable %: `0%`
  - **Category Breakdown**:
    - Purchased Electricity: `44.6 tCO2e` (25.1%)
    - Purchased Heating: `133.3 tCO2e` (74.9%)
  - Action: "Switch to renewable energy contracts"
- **State**: `scope2Total`, `scope2LocationBased`, `scope2MarketBased`, `renewablePercentage`, `scope2CategoriesData`
- **Line**: 395, 448-455

#### Scope 3 Card: Value Chain Emissions
- **Data Source**: Scope Analysis API → `scopeData.scope_3`
- **Shows**:
  - Total: `125.7 tCO2e`
  - Percentage of total: `41.4%`
  - YoY: `-35.8%`
  - **Coverage**: `3 of 15 categories tracked (20%)`
  - **Category Breakdown** (15 GHG Protocol categories):
    1. Purchased Goods & Services: `2.1 tCO2e`
    2. Capital Goods: `0.0 tCO2e` ❌ Not tracked
    3. Fuel & Energy: `0.0 tCO2e` ❌ Not tracked
    4. Upstream Transportation: `0.0 tCO2e` ❌ Not tracked
    5. Waste: `0.5 tCO2e`
    6. Business Travel: `123.6 tCO2e` ✅ Largest source
    7. Employee Commuting: `0.0 tCO2e` ❌ Not tracked
    8. Upstream Leased Assets: `0.0 tCO2e` ❌ Not tracked
    9-15: All untracked ❌
  - Missing categories highlighted
- **State**: `scope3Total`, `scope3Coverage`, `scope3CategoriesData`
- **Line**: 396, 458-485

---

### 📈 Section 3: Charts & Visualizations

#### Chart 1: Monthly Emissions Trend
- **Type**: Multi-line chart
- **Data Source**: Dashboard API (actual) + Forecast API (projected)
- **X-Axis**: Months (Jan, Feb, Mar, ...)
- **Y-Axis**: Emissions (tCO2e)
- **Lines**:
  - Total (bold black)
  - Scope 1 (red solid → dashed for forecast)
  - Scope 2 (orange solid → dashed for forecast)
  - Scope 3 (yellow solid → dashed for forecast)
- **Features**:
  - Vertical line separating actual vs forecast
  - Tooltips showing all scopes
  - Legend with totals
- **State**: `monthlyTrends`
- **Line**: 488-550

**Data Structure**:
```typescript
[
  { month: 'Jan', total: 25.3, scope1: 0, scope2: 14.8, scope3: 10.5, forecast: false },
  { month: 'Feb', total: 24.1, scope1: 0, scope2: 14.2, scope3: 9.9, forecast: false },
  // ...
  { month: 'Nov', total: 24.5, scope1: 0, scope2: 14.3, scope3: 10.2, forecast: true },
  { month: 'Dec', total: 24.8, scope1: 0, scope2: 14.5, scope3: 10.3, forecast: true }
]
```

#### Chart 2: Year-over-Year Comparison
- **Type**: Grouped bar chart
- **Data Source**: Dashboard API (current) vs Dashboard API (previous year)
- **X-Axis**: Months
- **Y-Axis**: Emissions (tCO2e)
- **Bars**:
  - Current year (blue)
  - Previous year (gray)
- **Shows**: Month-by-month comparison to see reduction trends
- **State**: `monthlyTrends`, `prevYearMonthlyTrends`
- **Line**: 552-620

#### Chart 3: Scope Breakdown Pie Chart
- **Type**: Donut/Pie chart
- **Data Source**: Scope Analysis API
- **Segments**:
  - Scope 1: `0.0 tCO2e` (0%) - Red
  - Scope 2: `177.9 tCO2e` (58.6%) - Orange
  - Scope 3: `125.7 tCO2e` (41.4%) - Yellow
- **Center**: Total emissions `303.6 tCO2e`
- **Hover**: Shows percentage and absolute value

---

### 🎯 Section 4: Top Emission Sources

- **Data Source**: Scope Analysis API → All scope categories combined
- **Processing**:
  ```typescript
  // Combines all categories from scope 1, 2, 3
  const allCategories = [
    ...scope1.categories,
    ...scope2.categories,
    ...scope3.categories
  ];

  // Sort by emissions (highest first)
  allCategories.sort((a, b) => b.value - a.value);

  // Top 10
  const topSources = allCategories.slice(0, 10);
  ```
- **Display**: Ranked list with:
  - Rank number
  - Category name
  - Emissions value
  - Percentage of total
  - Scope badge (1, 2, or 3)
  - Action recommendation
  - Visual bar showing relative size
- **State**: `topEmissionSources`
- **Line**: 622-665

**Example**:
```
1. Business Travel         123.6 tCO2e  40.7%  [Scope 3]
   ✈️ Implement virtual meetings policy

2. Purchased Heating       133.3 tCO2e  43.9%  [Scope 2]
   🔥 Install heat pump or upgrade boilers

3. Purchased Electricity    44.6 tCO2e  14.7%  [Scope 2]
   💡 Switch to renewable energy contracts
```

---

### 🎯 Section 5: SBTi Target Progress (Conditional)

- **Data Source**: Targets API
- **Display**: Only if `targets.length > 0`
- **Shows**:
  - Target card with:
    - Name: "PLMJ 1.5C Target"
    - Type: "Near-term (2030)"
    - Baseline: `303.6 tCO2e` (2023)
    - Current: `289.4 tCO2e` (2025 projected)
    - Target: `176.1 tCO2e` (2030)
    - Progress: `13.5%` achieved
    - Status: "On Track" (green badge)
  - Progress bar visualization
  - Linear trajectory line
  - Years remaining
- **State**: `targetData`
- **Line**: 352-354

**Progress Calculation**:
```typescript
const reduction = baseline - current;        // 303.6 - 289.4 = 14.2
const requiredReduction = baseline - target; // 303.6 - 176.1 = 127.5
const progress = (reduction / requiredReduction) * 100; // 11.1%
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│         EmissionsDashboard Component (useEffect)        │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┬──────────┬──────────┐
        │                 │                 │          │          │
        ▼                 ▼                 ▼          ▼          ▼
   ┌─────────┐      ┌─────────┐      ┌─────────┐ ┌────────┐ ┌────────┐
   │ Scope   │      │ Scope   │      │Dashboard│ │Targets │ │Forecast│
   │Analysis │      │Analysis │      │   API   │ │  API   │ │  API   │
   │(current)│      │  (prev) │      │(current)│ │        │ │        │
   └─────────┘      └─────────┘      └─────────┘ └────────┘ └────────┘
        │                 │                 │          │          │
        │                 │                 └──────────┼──────────┘
        │                 │                            │
        ▼                 ▼                            ▼
   ┌────────────────────────────────────────────────────────┐
   │              State Updates (useState)                  │
   ├────────────────────────────────────────────────────────┤
   │ • totalEmissions         • monthlyTrends               │
   │ • scope1/2/3Total        • prevYearMonthlyTrends       │
   │ • scopeYoY               • topEmissionSources          │
   │ • intensityMetrics       • targetData                  │
   │ • scope2CategoriesData   • projectedAnnualEmissions    │
   │ • scope3CategoriesData   • actualEmissionsYTD          │
   │ • scope3Coverage         • forecastedEmissions         │
   └────────────────────────────────────────────────────────┘
                          │
                          ▼
   ┌────────────────────────────────────────────────────────┐
   │                 UI Rendering (JSX)                     │
   ├────────────────────────────────────────────────────────┤
   │ • Summary Cards (3)      • Monthly Trend Chart         │
   │ • Scope 1/2/3 Cards      • YoY Comparison Chart        │
   │ • Top Sources List       • Scope Breakdown Pie         │
   │ • SBTi Progress          • Category Breakdowns         │
   └────────────────────────────────────────────────────────┘
```

---

## State Variables Summary

| State Variable | Data Source | Purpose |
|---------------|-------------|---------|
| `totalEmissions` | Scope Analysis (sum scopes) | Total emissions display |
| `scope1Total` | Scope Analysis → scope_1.total | Scope 1 card |
| `scope2Total` | Scope Analysis → scope_2.total | Scope 2 card |
| `scope3Total` | Scope Analysis → scope_3.total | Scope 3 card |
| `totalEmissionsYoY` | Scope Analysis (current vs prev) | YoY percentage |
| `scopeYoY` | Scope Analysis (current vs prev) | Per-scope YoY |
| `intensityMetrics` | Scope Analysis API or calculated | All intensity metrics |
| `intensityPerEmployee` | totalEmissions / employees | Per employee metric |
| `intensityPerRevenue` | totalEmissions / revenue | Per revenue metric |
| `intensityPerSqm` | totalEmissions / area | Per area metric |
| `scope2LocationBased` | Scope Analysis → scope_2 | Location-based reporting |
| `scope2MarketBased` | Scope Analysis → scope_2 | Market-based reporting |
| `renewablePercentage` | Scope Analysis → scope_2 | Renewable energy % |
| `scope2CategoriesData` | Scope Analysis → scope_2.categories | Scope 2 breakdown |
| `scope3CategoriesData` | Scope Analysis → scope_3.categories | Scope 3 breakdown |
| `scope3Coverage` | Calculated from scope_3.categories | Coverage tracking |
| `monthlyTrends` | Dashboard API + Forecast API | Monthly chart data |
| `prevYearMonthlyTrends` | Dashboard API (previous year) | YoY comparison chart |
| `topEmissionSources` | Scope Analysis (all categories) | Top sources list |
| `targetData` | Targets API | SBTi progress |
| `projectedAnnualEmissions` | Dashboard + Forecast | Year-end projection |
| `actualEmissionsYTD` | Dashboard API (sum) | YTD actual |
| `forecastedEmissions` | Forecast API (sum) | Remaining forecast |

---

## Important Notes

### ⚠️ Current Calculation Issues

1. **Manual Scope Summing** (Line 391):
   ```typescript
   const currentTotal = s1Current + s2Current + s3Current;
   ```
   Should use `getPeriodEmissions()` from baseline calculator!

2. **Component-Level YoY Calculations** (Line 407-413):
   ```typescript
   const totalYoY = ((currentTotal - previousTotal) / previousTotal) * 100;
   ```
   Should be calculated in the API!

3. **Intensity Calculations** (Line 421-429):
   ```typescript
   const intensityEmployee = currentTotal / employees;
   ```
   Better if done in API with proper error handling

### ✅ Recommended Improvements

1. **Use Baseline Calculator**:
   - Import `getPeriodEmissions()` for all emission calculations
   - Use `getCategoryBreakdown()` for top sources
   - Use `getMonthlyEmissions()` for trends

2. **Consolidate APIs**:
   - Combine scope-analysis + dashboard into one comprehensive endpoint
   - Include YoY calculations in API response
   - Return intensity metrics from API

3. **Reduce API Calls**:
   - Current: 6 separate calls
   - Ideal: 2-3 calls (current data + targets + forecast)

4. **Add Caching**:
   - Use React Query or SWR
   - Cache forecast data (rarely changes)
   - Deduplicate identical requests

---

## Comparison: Emissions vs Overview Dashboard

| Feature | Overview | Emissions | Notes |
|---------|----------|-----------|-------|
| API Calls | 4-5 | 6 | Emissions makes more calls |
| Scope Detail | Basic | Detailed | Emissions shows categories |
| Charts | 1 main | 3 charts | Emissions more visual |
| Intensity | 1 type | 3 types | Emissions comprehensive |
| Target Progress | 1 card | 1 section | Similar |
| Category Detail | Limited | Full | Emissions shows all 15 |
| YoY Comparison | Summary | Chart | Emissions visualizes |
| Forecast | Included | Separate | Both use forecast API |

---

## Summary

The Emissions Dashboard is more **comprehensive** than Overview:
- **6 API calls** vs 4-5 in Overview
- **Detailed category breakdowns** for all 3 scopes
- **Multiple intensity metrics** (employee, revenue, area)
- **More visualizations** (3 charts vs 1)
- **Top emission sources** ranked list
- **Scope 3 coverage tracking** (15 GHG categories)
- **Year-over-year comparison chart**

However, it also has the same issues:
- ❌ Manual calculation of totals (not using baseline calculator)
- ❌ Component-level YoY calculations
- ❌ Multiple redundant API calls

**Next Step**: Refactor to use centralized baseline calculator for all emissions calculations!
