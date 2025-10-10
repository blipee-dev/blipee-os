# Overview Dashboard - Complete Data Flow Analysis

## Component Location
`/src/components/dashboard/OverviewDashboard.tsx`

## API Endpoints Used

The Overview Dashboard makes **4 main API calls** in the `useEffect` hook:

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
    scope_1: { total: 0.0, percentage: 0, categories: [...] },
    scope_2: {
      total: 177.9,
      percentage: 58.6,
      location_based: 177.9,
      market_based: 177.9,
      renewable_percentage: 0,
      categories: [...]
    },
    scope_3: { total: 125.7, percentage: 41.4, categories: [...] }
  },
  dataQuality: {
    overall: 'high',
    scope_1: 'high',
    scope_2: 'high',
    scope_3: 'medium',
    completeness: 95.2,
    verified_percentage: 100
  },
  scope3Coverage: {
    categories_tracked: 3,
    categories_total: 15,
    coverage_percentage: 20,
    missing_categories: [...]
  },
  organizationalBoundaries: {
    approach: 'operational_control',
    employees: 200,
    facilities: 3,
    boundary_completeness: 100
  },
  sbtiTargets: {
    has_near_term: true,
    has_long_term: false,
    validated: false
  }
}
```

**Used For**:
- ✅ Total Emissions card (`totalEmissions`)
- ✅ Scope breakdown cards (Scope 1, 2, 3)
- ✅ Intensity metric calculation (emissions / employees)
- ✅ Data Quality section
- ✅ Scope 3 Coverage section
- ✅ Org Boundaries info

**Code Location**: Line 148
```typescript
const scopeResponse = await fetch(`/api/sustainability/scope-analysis?${params}`);
```

---

### 2. 📊 **Scope Analysis API** (Previous Year)
**Endpoint**: `/api/sustainability/scope-analysis` (again, with prev year dates)

**Parameters**:
- `start_date`: Previous year start (e.g., "2022-01-01")
- `end_date`: Previous year end (e.g., "2022-12-31")
- `site_id`: (optional) Same site filter

**What It Returns**: Same structure as above, but for previous year

**Used For**:
- ✅ Year-over-Year (YoY) percentage changes
- ✅ Trend arrows (up/down)
- ✅ Comparison metrics

**Code Location**: Line 175
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
    },
    { /* long-term */ },
    { /* net-zero */ }
  ],
  summary: {
    total: 3,
    validated: 0,
    onTrack: 1,
    atRisk: 0,
    offTrack: 0
  },
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
- ✅ SBTi Target Progress card (if you have targets)
- ✅ Baseline comparison
- ✅ Progress tracking

**Code Location**: Line 152
```typescript
const sbtiTargetsResponse = await fetch('/api/sustainability/targets');
```

---

### 4. 📈 **Dashboard API** (for Monthly Trends)
**Endpoint**: `/api/sustainability/dashboard`

**Parameters**:
- `start_date`: Selected period start
- `end_date`: Selected period end
- `site_id`: (optional) Site filter

**What It Returns**:
```javascript
{
  metrics: {
    totalEmissions: { value: 303.6, unit: 'tCO2e', change: -25.6, trend: 'down' },
    energyConsumption: { value: 892.3, unit: 'MWh', change: -12.3 },
    waterUsage: { value: 15234, unit: 'm³', change: -8.1 },
    wasteGenerated: { value: 8450, unit: 'kg', change: 5.2 }
  },
  scopeBreakdown: [
    { name: 'Scope 1', value: 0.0, percentage: 0, color: '#ef4444' },
    { name: 'Scope 2', value: 177.9, percentage: 58.6, color: '#f97316' },
    { name: 'Scope 3', value: 125.7, percentage: 41.4, color: '#eab308' }
  ],
  trendData: [
    { month: 'Jan 23', emissions: 25.3, scope1: 0, scope2: 14.8, scope3: 10.5 },
    { month: 'Feb 23', emissions: 24.1, scope1: 0, scope2: 14.2, scope3: 9.9 },
    // ... rest of months
  ],
  categoryBreakdown: [
    { category: 'Purchased Energy', scope1: 0, scope2: 177.9, scope3: 0, total: 177.9 },
    { category: 'Business Travel', scope1: 0, scope2: 0, scope3: 125.7, total: 125.7 }
  ],
  siteComparison: [...],
  categoryHeatmap: [...]
}
```

**Used For**:
- ✅ Monthly Emissions Trend chart
- ✅ Time series visualization

**Code Location**: Line 258
```typescript
const dashboardResponse = await fetch(`/api/sustainability/dashboard?${dashboardParams}`);
```

---

### 5. 🔮 **Forecast API** (Optional Enhancement)
**Endpoint**: `/api/sustainability/forecast`

**Parameters**: Same as dashboard

**What It Returns**:
```javascript
{
  forecast: [
    { month: 'Nov 25', emissions: 24.5, scope1: 0, scope2: 14.3, scope3: 10.2, forecast: true },
    { month: 'Dec 25', emissions: 24.8, scope1: 0, scope2: 14.5, scope3: 10.3, forecast: true }
  ],
  metadata: {
    method: 'LSTM',
    confidence: 0.87,
    r2: 0.92
  }
}
```

**Used For**:
- ✅ Projected annual emissions
- ✅ Forecast lines on charts (dashed)

**Code Location**: Line 278
```typescript
const forecastRes = await fetch(`/api/sustainability/forecast?${dashboardParams}`);
```

---

## Dashboard Sections Breakdown

### 🎯 Section 1: Summary Cards (Top Row)

#### Card 1: Total Emissions
- **Data Source**: Scope Analysis API (current + previous year)
- **Calculation**: `scope_1.total + scope_2.total + scope_3.total`
- **Display**: `303.6 tCO2e` with YoY arrow
- **State**: `totalEmissions`, `totalEmissionsYoY`
- **Line**: 199, 207

#### Card 2: Intensity Metric
- **Data Source**: Scope Analysis API + Org Boundaries
- **Calculation**: `totalEmissions / employees`
- **Display**: `1.52 tCO2e/employee` with YoY
- **State**: `intensityMetric`, `intensityYoY`
- **Line**: 242-247

#### Card 3: Data Quality
- **Data Source**: Scope Analysis API → `dataQuality` field
- **Display**: Badge with percentage (e.g., "95.2% Complete")
- **State**: `dataQuality`
- **Line**: 212-214

---

### 📊 Section 2: Scope Breakdown Cards

#### Scope 1 Card
- **Data Source**: Scope Analysis API → `scopeData.scope_1`
- **Values**:
  - Total: `0.0 tCO2e`
  - Percentage: `0%`
  - YoY: `0%`
- **State**: `scope1Total`, `scopeYoY.scope1`
- **Line**: 196, 208

#### Scope 2 Card
- **Data Source**: Scope Analysis API → `scopeData.scope_2`
- **Values**:
  - Total: `177.9 tCO2e`
  - Percentage: `58.6%`
  - YoY: `-15.2%` (example)
  - Renewable: `0%`
- **Additional**: Location-based vs Market-based
- **State**: `scope2Total`, `scopeYoY.scope2`, `renewablePercentage`
- **Line**: 197, 235-238

#### Scope 3 Card
- **Data Source**: Scope Analysis API → `scopeData.scope_3`
- **Values**:
  - Total: `125.7 tCO2e`
  - Percentage: `41.4%`
  - YoY: `-35.8%` (example)
  - Coverage: `20%` (3 of 15 categories)
- **State**: `scope3Total`, `scopeYoY.scope3`, `scope3Coverage`
- **Line**: 198, 216-218

---

### 📈 Section 3: Monthly Emissions Trend Chart

- **Data Source**: Dashboard API → `trendData` + Forecast API
- **Chart Type**: Line chart with actual + forecast
- **X-Axis**: Months (e.g., "Jan 23", "Feb 23", ...)
- **Y-Axis**: Emissions (tCO2e)
- **Lines**:
  - Scope 1 (red) - solid/dashed
  - Scope 2 (orange) - solid/dashed
  - Scope 3 (yellow) - solid/dashed
- **State**: `monthlyTrends`
- **Line**: 264-310

**Data Transformation**:
```typescript
const trends = dashboardData.trendData.map((m: any) => ({
  month: m.month,        // "Jan 23"
  total: m.emissions,    // 25.3
  scope1: m.scope1,      // 0
  scope2: m.scope2,      // 14.8
  scope3: m.scope3,      // 10.5
  forecast: false        // or true for forecasted months
}));
```

---

### 🎯 Section 4: SBTi Target Progress Card (Conditional)

- **Data Source**: Targets API → `targets[0]` (near-term target)
- **Display**: Only if `targets.length > 0`
- **Shows**:
  - Target name: "PLMJ 1.5C Target"
  - Progress: `13.5%` achieved
  - Current: `289.4 tCO2e` (2025)
  - Target: `176.1 tCO2e` (2030)
  - Status: "On Track" with color badge
- **State**: `targetData`
- **Line**: 152-156

---

### 📋 Section 5: Additional Info Cards

#### Scope 3 Coverage Card
- **Data Source**: Scope Analysis API → `scope3Coverage`
- **Shows**:
  - Categories tracked: `3 of 15`
  - Coverage: `20%`
  - Missing categories list
- **State**: `scope3Coverage`
- **Line**: 216-218

#### Organizational Boundaries Card
- **Data Source**: Scope Analysis API → `organizationalBoundaries`
- **Shows**:
  - Approach: "Operational Control"
  - Employees: `200`
  - Facilities: `3`
  - Completeness: `100%`
- **State**: `orgBoundaries`
- **Line**: 220-226

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│            OverviewDashboard Component                  │
│                    (useEffect)                          │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┬─────────────┐
          │               │               │             │
          ▼               ▼               ▼             ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌─────────┐
   │  Scope   │   │  Scope   │   │ Targets  │   │Dashboard│
   │ Analysis │   │ Analysis │   │   API    │   │   API   │
   │ (current)│   │  (prev)  │   │          │   │         │
   └──────────┘   └──────────┘   └──────────┘   └─────────┘
          │               │               │             │
          ▼               ▼               ▼             ▼
   ┌──────────────────────────────────────────────────────┐
   │          State Updates (useState hooks)              │
   ├──────────────────────────────────────────────────────┤
   │ • totalEmissions          • monthlyTrends            │
   │ • scope1/2/3Total         • targetData               │
   │ • scopeYoY                • dataQuality              │
   │ • intensityMetric         • scope3Coverage           │
   │ • projectedEmissions      • orgBoundaries            │
   └──────────────────────────────────────────────────────┘
                          │
                          ▼
   ┌──────────────────────────────────────────────────────┐
   │              UI Rendering (JSX)                      │
   ├──────────────────────────────────────────────────────┤
   │ • Summary Cards        • Monthly Trend Chart         │
   │ • Scope 1/2/3 Cards    • SBTi Progress Card          │
   │ • Data Quality         • Coverage/Boundaries         │
   └──────────────────────────────────────────────────────┘
```

---

## Important Notes

### ⚠️ Current Calculation Issues

1. **Inconsistent Totals**: The dashboard calculates totals by summing scope APIs:
   ```typescript
   const currentTotal = s1Current + s2Current + s3Current;
   ```
   This should use the **baseline calculator** for consistency!

2. **Manual YoY Calculations**: YoY is calculated manually in the component:
   ```typescript
   const totalYoY = ((currentTotal - previousTotal) / previousTotal) * 100;
   ```
   This should be in the API!

### ✅ Recommended Improvements

1. **Use Baseline Calculator**: Update dashboard API to use `getPeriodEmissions()` from baseline-calculator.ts

2. **Consolidate Logic**: Move YoY calculations to the API instead of the component

3. **Single Data Source**: Combine scope-analysis and dashboard APIs into one comprehensive endpoint

4. **Cache API Calls**: Add React Query or SWR for caching and deduplication

---

## Summary Table

| Section | Data Source | Calculation Location | State Variable |
|---------|-------------|---------------------|----------------|
| Total Emissions | Scope Analysis | Component (line 193) | `totalEmissions` |
| Intensity | Scope Analysis + OrgBoundaries | Component (line 242) | `intensityMetric` |
| Scope 1/2/3 | Scope Analysis | Direct from API | `scope1/2/3Total` |
| YoY Changes | Scope Analysis (curr + prev) | Component (line 202-208) | `totalEmissionsYoY`, `scopeYoY` |
| Monthly Trend | Dashboard API | API → Component transform | `monthlyTrends` |
| SBTi Progress | Targets API | Direct from API | `targetData` |
| Data Quality | Scope Analysis | Direct from API | `dataQuality` |
| Scope 3 Coverage | Scope Analysis | Direct from API | `scope3Coverage` |
| Org Boundaries | Scope Analysis | Direct from API | `orgBoundaries` |

---

## Conclusion

The Overview Dashboard makes **4 API calls** to gather all its data. Most calculations happen in the **component** (not ideal), and it manually sums scope totals instead of using the baseline calculator.

**Next Step**: Refactor to use the centralized baseline calculator for all emissions calculations!
