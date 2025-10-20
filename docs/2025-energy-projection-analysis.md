# 2025 Energy Consumption Projection Analysis

## Overview

This analysis calculates the **projected annual 2025 consumption** for each energy category and metric based on year-to-date (YTD) actual data.

## Methodology

**Projection Formula:**
```
Projected Annual 2025 = (YTD Consumption / Months with Data) × 12
```

**Data Period:**
- YTD: January 2025 - October 2025 (10 months)
- Projection: Full year 2025 (12 months)

---

## Energy Categories & Metrics

### 1. **ELECTRICITY (Scope 2)**

#### Grid Electricity
- **Unit:** MWh (or kWh)
- **Calculation Method:**
  - Get all `metrics_data` records for metric category = 'Electricity'
  - Filter by `organization_id` and year 2025
  - Aggregate by unique months
  - Project: `(YTD_value / months_with_data) × 12`

**Expected Metrics:**
- Grid Electricity (Non-renewable)
- Renewable Electricity (from grid)
- Solar Power (100% renewable)
- Wind Power (100% renewable)
- EV Charging

**Key Questions:**
1. How many months of 2025 data exist? (e.g., Jan-Oct = 10 months)
2. What is the total YTD consumption in MWh?
3. Projected annual = (YTD / 10) × 12

**Example Calculation:**
```
If YTD (Jan-Oct) = 1,500 MWh
Projected Annual 2025 = (1,500 / 10) × 12 = 1,800 MWh
```

---

### 2. **PURCHASED ENERGY (Scope 2)**

#### Purchased Heating
- **Unit:** MWh or kWh
- **Calculation:** Same as electricity
- **Includes:** District heating, purchased heating from third parties

#### Purchased Cooling
- **Unit:** MWh or kWh
- **Includes:** District cooling, purchased chilled water

#### Purchased Steam
- **Unit:** Tonnes or MWh
- **Includes:** Industrial steam from external sources

---

### 3. **NATURAL GAS (Scope 1)**

- **Unit:** m³ (cubic meters) or MWh
- **Category:** Stationary Combustion
- **Scope:** Scope 1
- **Calculation:** Same projection formula

**Key Metrics:**
- Natural Gas consumption for heating
- Natural Gas for process heat
- Natural Gas for power generation (if applicable)

---

### 4. **OTHER FUELS (Scope 1)**

#### Heating Oil
- **Unit:** Liters or MWh
- **Scope:** Scope 1

#### Diesel
- **Unit:** Liters
- **Scope:** Scope 1 (if stationary) or Scope 3 (if mobile)
- **Includes:** Emergency generators, forklifts, stationary equipment

#### Gasoline
- **Unit:** Liters
- **Scope:** Scope 1 (fleet) or Scope 3 (business travel)

#### Propane/LPG
- **Unit:** kg or Liters
- **Scope:** Scope 1
- **Includes:** Forklifts, heating, cooking

---

## Expected Output Format

For **each metric**, the analysis should show:

```
Category: ELECTRICITY
Metric: Grid Electricity (scope_2)
  Months with data: 10
  YTD (Jan-Oct 2025): 1,500.00 MWh
  Projected Annual 2025: 1,800.00 MWh
  Baseline 2023: 1,750.00 MWh
  Target 2025: 1,676.50 MWh (4.2% reduction)
  Status: ⚠️ OFF TRACK (projected exceeds target by 123.5 MWh)
```

---

## SQL Query to Get This Data

```sql
SELECT
  mc.category,
  mc.name as metric_name,
  mc.scope,
  mc.unit,
  COUNT(DISTINCT TO_CHAR(md.period_start, 'YYYY-MM')) as months_with_data,
  SUM(md.value) as ytd_consumption,
  ROUND(SUM(md.value) / COUNT(DISTINCT TO_CHAR(md.period_start, 'YYYY-MM')) * 12, 2) as projected_annual_consumption,
  ROUND(SUM(md.co2e_emissions) / 1000, 1) as ytd_emissions_tco2e,
  ROUND((SUM(md.co2e_emissions) / 1000) / COUNT(DISTINCT TO_CHAR(md.period_start, 'YYYY-MM')) * 12, 1) as projected_annual_emissions_tco2e
FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
WHERE md.organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  AND EXTRACT(YEAR FROM md.period_start) = 2025
  AND mc.category IN (
    'Electricity', 'Purchased Energy', 'Purchased Heating', 'Purchased Cooling', 'Purchased Steam',
    'Natural Gas', 'Heating Oil', 'Diesel', 'Gasoline', 'Propane',
    'District Heating', 'District Cooling', 'Steam'
  )
  AND mc.scope IN ('scope_1', 'scope_2')
GROUP BY mc.category, mc.name, mc.scope, mc.unit
ORDER BY mc.category, projected_annual_consumption DESC;
```

---

## API Endpoint

The `/api/sustainability/targets/by-category-dynamic` endpoint now includes this projection logic:

**GET Request:**
```
/api/sustainability/targets/by-category-dynamic?
  organizationId=22647141-2ee4-4d8d-8b47-16b0cbd830b2&
  categories=Electricity,Purchased Energy,Natural Gas&
  baselineYear=2023&
  targetYear=2025
```

**Response includes:**
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
      "progress": {
        "reductionNeeded": 7.2,
        "reductionAchieved": 33.7,
        "progressPercent": 468.1,
        "trajectoryStatus": "on-track",
        "ytdEmissions": 112.5,
        "projectedAnnual": 135.0
      }
    }
  ]
}
```

---

## Key Insights to Extract

1. **Which categories are consuming the most energy?**
   - Rank by projected annual consumption

2. **Are we on track to meet 2025 targets?**
   - Compare projected vs target for each metric
   - Show trajectory status

3. **What is the YoY change?**
   - Compare 2025 projected vs 2023 baseline
   - Calculate % change

4. **Where should we focus reduction efforts?**
   - Identify metrics that are off-track
   - Prioritize high-consumption categories

---

## Next Steps

To get the actual data, you need to either:

1. **Start the development server** and call the API:
   ```bash
   npm run dev
   curl "http://localhost:3001/api/sustainability/targets/by-category-dynamic?..."
   ```

2. **Run the SQL query directly** against the Supabase database

3. **Check the Energy Dashboard** in the UI - the SBTi Target Progress section now shows this data automatically

---

## Implementation Status

✅ **Completed:**
- Projection calculation logic in by-category-dynamic API
- Month tracking for accurate projection
- Unit conversion (kg → tCO2e)
- Trajectory status calculation
- Progress percentage vs targets

✅ **Auto-generation:**
- Category targets are auto-created if missing
- React Query hook fetches fresh data on mount
- No manual weighted allocation needed

🎯 **Ready for Use:**
- Energy Dashboard shows projected consumption
- SBTi expandable section displays all metrics
- On-track/at-risk/off-track status visible
