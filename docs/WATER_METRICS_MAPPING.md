# Water Metrics Mapping Guide
## GRI 303 Implementation for PLMJ and Future Organizations

---

## 📊 Overview

This document maps PLMJ's calculated water data to the complete GRI 303 metrics catalog, and provides guidance for other organization types.

---

## 🏢 PLMJ Lisboa - Metrics Mapping (Office with Grey Water System)

### **Original Data (from JS arrays)**
```javascript
{
  HUMAN: 28.8 m³,          // Drinking, kitchen, handwashing
  SANITARY: 8.3 m³,        // Toilets (50% fresh + 50% grey)
  Total: 37.1 m³
}
```

### **Calculated Metrics**
```javascript
{
  fresh_withdrawal: 32.95 m³,
  grey_reused: 4.15 m³,
  consumed: 0.56 m³,
  discharged: 32.39 m³
}
```

---

## 🗂️ Database Insertion Mapping

### **LEVEL 1: GRI 303 Core Metrics** (Required for Compliance)

| GRI Code | Metric Code | PLMJ Lisboa Value | Porto/Faro | Notes |
|----------|-------------|-------------------|------------|-------|
| **303-3a(v)** | `gri_303_3_municipal_freshwater` | **32.95 m³** | Variable | From water bill |
| **303-3b** | `gri_303_3_withdrawal_total` | **32.95 m³** | Variable | = Municipal (only source) |
| **303-3c** | `gri_303_3_withdrawal_stressed_areas` | **0 m³** | 0 | Lisbon/Porto/Faro not stressed |
| **303-4a(iv)** | `gri_303_4_discharge_sewer` | **32.39 m³** | Variable | To ETAR (municipal WWTP) |
| **303-4a(v)** | `gri_303_4_discharge_total` | **32.39 m³** | Variable | All to sewer |
| **303-4c** | `gri_303_4_discharge_tertiary` | **32.39 m³** | Variable | ETAR Lisboa = tertiary |
| **303-5a** | `gri_303_5_consumption_total` | **0.56 m³** | Variable | = Withdrawal - Discharge |

**SQL Insert Example:**
```sql
-- Lisboa January 2024
INSERT INTO metrics_data
  (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, verification_status)
SELECT
  o.id,
  s.id,
  mc.id,
  '2024-01-01',
  '2024-01-31',
  CASE mc.code
    WHEN 'gri_303_3_municipal_freshwater' THEN 32.95
    WHEN 'gri_303_3_withdrawal_total' THEN 32.95
    WHEN 'gri_303_4_discharge_sewer' THEN 32.39
    WHEN 'gri_303_4_discharge_total' THEN 32.39
    WHEN 'gri_303_4_discharge_tertiary' THEN 32.39
    WHEN 'gri_303_5_consumption_total' THEN 0.56
  END,
  'm³',
  'calculated',
  'internal'
FROM organizations o
CROSS JOIN sites s
CROSS JOIN metrics_catalog mc
WHERE o.name = 'PLMJ'
  AND s.name = 'Lisboa - FPM41'
  AND mc.code IN (
    'gri_303_3_municipal_freshwater',
    'gri_303_3_withdrawal_total',
    'gri_303_4_discharge_sewer',
    'gri_303_4_discharge_total',
    'gri_303_4_discharge_tertiary',
    'gri_303_5_consumption_total'
  );
```

---

### **LEVEL 2: Breakdown Metrics** (Recommended for Transparency)

| Metric Code | Lisboa Value | Calculation | Notes |
|-------------|--------------|-------------|-------|
| `scope3_water_kitchen` | 23.99 m³ | fresh × 0.728 | Drinking/coffee/kitchen |
| `scope3_water_toilet` | 8.3 m³ | sanitary total | Toilet flushing |
| `scope3_water_cleaning` | 0.66 m³ | fresh × 0.020 | Cleaning/janitorial |
| `scope3_water_irrigation` | 0 m³ | - | No irrigation currently |
| `scope3_water_recycled_toilet` | **4.15 m³** | grey_reused | ⭐ Grey water! |
| `gri_303_5_consumption_human` | 0.49 m³ | fresh × 0.015 | Actually drunk |
| `gri_303_5_consumption_evaporation` | 0.07 m³ | fresh × 0.002 | Cleaning evaporation |

**SQL Insert:**
```sql
INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit)
SELECT o.id, s.id, mc.id, '2024-01-01', '2024-01-31',
  CASE mc.code
    WHEN 'scope3_water_kitchen' THEN 23.99
    WHEN 'scope3_water_toilet' THEN 8.3
    WHEN 'scope3_water_cleaning' THEN 0.66
    WHEN 'scope3_water_recycled_toilet' THEN 4.15
    WHEN 'gri_303_5_consumption_human' THEN 0.49
    WHEN 'gri_303_5_consumption_evaporation' THEN 0.07
  END,
  'm³'
FROM organizations o, sites s, metrics_catalog mc
WHERE o.name = 'PLMJ' AND s.name = 'Lisboa - FPM41'
  AND mc.code IN ('scope3_water_kitchen', 'scope3_water_toilet', ...);
```

---

### **LEVEL 3: Best Practice / KPIs** (For Dashboard & Reporting)

| Metric Code | Lisboa Value | Calculation | Dashboard Display |
|-------------|--------------|-------------|-------------------|
| `water_recycled_grey_water` | 4.15 m³ | measured | "💧 4.15 m³ saved through grey water" |
| `water_reuse_rate` | 11.2% | (reused / throughput) × 100 | "♻️ 11.2% water reuse rate" |
| `water_return_rate` | 98.3% | (discharged / withdrawal) × 100 | "✅ 98.3% return rate" |
| `water_intensity_employee` | 0.52 m³/FTE | withdrawal / employees | "0.52 m³ per employee" |
| `water_intensity_floor_area` | ~0.015 m³/m² | withdrawal / floor area | "LEED Gold benchmark" |

**Store in metadata or calculate on-the-fly:**
```sql
-- Option A: Store as metrics
INSERT INTO metrics_data (metric_id, value, unit, metadata)
VALUES (
  (SELECT id FROM metrics_catalog WHERE code = 'water_reuse_rate'),
  11.2,
  '%',
  '{"grey_water_system": true, "source": "handwashing_sinks"}'
);

-- Option B: Calculate in API/Frontend
SELECT
  (SUM(CASE WHEN mc.code = 'water_recycled_grey_water' THEN md.value ELSE 0 END) /
   SUM(CASE WHEN mc.code = 'gri_303_3_withdrawal_total' THEN md.value ELSE 0 END)) * 100
  as reuse_rate_percent
FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
WHERE md.site_id = 'lisboa_site_id'
  AND md.period_start >= '2024-01-01';
```

---

## 🏭 Example: Manufacturing Plant (Different Profile)

### **Scenario: Textile Factory with Multiple Water Sources**

```javascript
{
  // Withdrawal
  surface_water_freshwater: 15000,      // River intake
  groundwater_freshwater: 5000,         // Wells for backup
  municipal_freshwater: 2000,           // Municipal supply
  total_withdrawal: 22000,              // m³/month

  // Discharge
  discharge_surface: 12000,             // Treated effluent to river
  discharge_sewer: 1500,                // Sanitary to municipal
  total_discharge: 13500,               // m³/month

  // Consumption
  consumption_evaporation: 7000,        // Cooling towers
  consumption_products: 1000,           // Incorporated in textiles
  consumption_other: 500,               // Human use
  total_consumption: 8500,              // m³/month

  // Reuse
  water_recycled_process: 5000,         // Dye bath recycling
  reuse_rate: 18.5%                     // Good for industry!
}
```

**Metrics Mapping:**
- `gri_303_3_surface_freshwater` = 15,000
- `gri_303_3_groundwater_freshwater` = 5,000
- `gri_303_3_municipal_freshwater` = 2,000
- `gri_303_4_discharge_surface` = 12,000
- `gri_303_5_consumption_evaporation` = 7,000
- `water_recycled_process` = 5,000

---

## 🏨 Example: Hotel with Rainwater Harvesting

```javascript
{
  // Withdrawal
  municipal_freshwater: 8000,           // Potable water
  rainwater_harvested: 1200,            // Roof catchment
  total_withdrawal: 8000,               // Don't count rainwater as "withdrawal"

  // Total Use (including rainwater)
  total_water_use: 9200,                // Including rainwater

  // Discharge
  discharge_sewer: 7500,

  // Consumption
  consumption_total: 1700,              // Evaporation + human + laundry

  // Reuse
  water_recycled_grey_water: 1000,      // Showers → toilets
  rainwater_for_irrigation: 1200,       // Free water!
  reuse_rate: 23.9%                     // (1000 + 1200) / 9200
}
```

**Key Difference:**
- Rainwater is NOT counted in GRI 303-3 withdrawal (it's not from a "source")
- Report separately as `water_rainwater_harvested`
- Include in reuse rate calculation for efficiency metrics

---

## 🌍 Example: Facility in Water-Stressed Area (Middle East)

```javascript
{
  // Location
  water_stress_score: 4.8,              // WRI Aqueduct: "Extremely High"

  // Withdrawal
  municipal_other: 10000,               // Desalinated seawater from utility
  total_withdrawal: 10000,
  withdrawal_stressed: 10000,           // 100% from stressed area!

  // Discharge
  discharge_seawater: 8000,             // Brine discharge
  total_discharge: 8000,
  discharge_stressed: 8000,

  // Consumption
  consumption_total: 2000,              // 20% consumption (HIGH)
  consumption_stressed: 2000,

  // Risk Metrics
  water_stressed_withdrawal_percent: 100,  // ⚠️ HIGH RISK
  consumption_in_stressed_percent: 100,    // ⚠️ CRITICAL

  // Mitigation
  water_recycled_total: 3000,           // 23% recycling to offset
  target_reduction_2030: 30             // % reduction target
}
```

**Investor Focus:**
- High exposure to water-stressed areas = financial risk
- Desalination = high energy cost = carbon footprint
- Strong recycling program = risk mitigation
- Need aggressive reduction targets

---

## 📐 Standard Calculation Formulas

### **Water Balance Equation**
```
Withdrawal = Discharge + Consumption + Storage Change

32.95 = 32.39 + 0.56 + 0 ✓
```

### **Reuse Rate**
```
Reuse Rate = (Recycled / (Withdrawal + Recycled)) × 100

Lisboa: (4.15 / (32.95 + 4.15)) × 100 = 11.2%
```

### **Return Rate**
```
Return Rate = (Discharge / Withdrawal) × 100

Lisboa: (32.39 / 32.95) × 100 = 98.3%
```

### **Consumption Rate**
```
Consumption Rate = (Consumption / Withdrawal) × 100

Lisboa: (0.56 / 32.95) × 100 = 1.7%
```

---

## 🎯 Recommendations by Organization Type

### **Offices (like PLMJ)**
**Must-have metrics:**
- ✅ `gri_303_3_municipal_freshwater`
- ✅ `gri_303_4_discharge_sewer`
- ✅ `gri_303_5_consumption_total`
- ✅ `water_recycled_grey_water` (if system exists)
- ✅ `water_intensity_employee`

**Nice-to-have:**
- `water_rainwater_harvested`
- `water_intensity_floor_area`
- Breakdown by use (kitchen, sanitary, etc.)

### **Manufacturing**
**Must-have metrics:**
- ✅ All withdrawal sources (surface, ground, municipal)
- ✅ All discharge destinations (surface, sewer)
- ✅ Consumption breakdown (evaporation, products)
- ✅ `water_recycled_process`
- ✅ `water_intensity_production`

### **Hotels/Hospitality**
**Must-have metrics:**
- ✅ `gri_303_3_municipal_freshwater`
- ✅ `water_recycled_grey_water`
- ✅ `water_rainwater_harvested`
- ✅ `water_intensity_guest_night` (custom)
- ✅ Laundry water separately

### **Agriculture**
**Must-have metrics:**
- ✅ `gri_303_3_surface_freshwater`
- ✅ `gri_303_3_groundwater_freshwater`
- ✅ `gri_303_5_consumption_irrigation`
- ✅ Water stress metrics (critical!)
- ✅ `water_intensity_hectare` or per crop

---

## 🔗 API Response Structure

### **Recommended JSON Structure for Dashboard:**

```json
{
  "site": "Lisboa - FPM41",
  "period": "2024-01",

  "gri_303_summary": {
    "withdrawal_total_m3": 32.95,
    "discharge_total_m3": 32.39,
    "consumption_total_m3": 0.56
  },

  "withdrawal_sources": {
    "municipal_freshwater": 32.95,
    "surface_water": 0,
    "groundwater": 0,
    "other": 0
  },

  "discharge_destinations": {
    "sewer_wwtp": 32.39,
    "treatment_level": "tertiary",
    "surface_water": 0,
    "other": 0
  },

  "consumption_breakdown": {
    "human": 0.49,
    "evaporation": 0.07,
    "irrigation": 0,
    "products": 0
  },

  "circular_economy": {
    "grey_water_reused_m3": 4.15,
    "reuse_rate_percent": 11.2,
    "system_installed": true,
    "source": "handwashing_sinks",
    "destination": "toilet_flushing"
  },

  "efficiency_kpis": {
    "return_rate_percent": 98.3,
    "consumption_rate_percent": 1.7,
    "intensity_per_employee": 0.52,
    "intensity_per_sqm": 0.015
  },

  "water_stress": {
    "facility_in_stressed_area": false,
    "withdrawal_from_stressed_m3": 0,
    "stress_level": "Low (<10%)"
  },

  "use_breakdown": {
    "drinking_kitchen_m3": 23.99,
    "sanitary_total_m3": 8.3,
    "sanitary_fresh_m3": 4.15,
    "sanitary_grey_m3": 4.15,
    "cleaning_m3": 0.66,
    "irrigation_m3": 0
  }
}
```

---

## ✅ Next Steps

1. **Run SQL script** to create all metrics in catalog
2. **Map PLMJ calculated data** to GRI 303 metrics
3. **Insert historical data** (2022-2024) for all 3 sites
4. **Update Water Dashboard** to show GRI 303 metrics
5. **Add metadata** for grey water system details
6. **Create reporting template** for GRI 303 compliance

**Script ready to run:** `scripts/create-gri303-metrics.sql` ✅
