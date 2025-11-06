# 🗄️ GRI Data Structure - Using Existing Tables

## ✅ **Using metrics_catalog + metrics_data**

We already have the perfect structure! No need for new tables.

---

## 📊 **How Each GRI Standard Maps to Existing Tables**

### **GRI 302: Energy** ⚡

#### metrics_catalog entries (already created in migration):
```sql
-- These already exist from our 20250105_add_all_gri_metrics.sql migration
gri_302_1_energy_consumption
gri_302_1_fuel_non_renewable
gri_302_1_fuel_renewable
gri_302_1_electricity_purchased
gri_302_1_heating_cooling_steam
gri_302_2_energy_outside_org
gri_302_3_energy_intensity
gri_302_4_energy_reduction
gri_302_5_product_energy_reduction
```

#### metrics_data entries:
```typescript
// Example: Recording electricity consumption
{
  metric_id: 'uuid-of-gri_302_1_electricity_purchased',
  organization_id: 'org-uuid',
  site_id: 'site-uuid',
  period_start: '2024-01-01',
  period_end: '2024-01-31',
  value: 50000, // 50,000 kWh
  unit: 'kWh',
  co2e_emissions: 5750, // Automatically calculated: 50000 * 0.115 kg/kWh (PT grid)
  metadata: {
    // GRI 302 specific data
    source: 'utility_bill',
    supplier: 'EDP',
    renewable_percentage: 35,
    grid_location: 'PT',
    emission_factor_id: 'cached-factor-uuid',
    carbon_intensity: 0.115, // kg CO2e/kWh
    bill_reference: 'BILL-2024-01-123'
  },
  data_quality: 'measured',
  verification_status: 'verified'
}
```

---

### **GRI 303: Water** 💧

#### metrics_catalog entries (already exist):
```sql
gri_303_3_water_withdrawal
gri_303_3_surface_water
gri_303_3_groundwater
gri_303_3_third_party_water
gri_303_4_water_discharge
gri_303_5_water_consumption
```

#### metrics_data entries:
```typescript
// Example: Recording water withdrawal
{
  metric_id: 'uuid-of-gri_303_3_water_withdrawal',
  organization_id: 'org-uuid',
  site_id: 'site-uuid',
  period_start: '2024-01-01',
  period_end: '2024-01-31',
  value: 15000, // 15,000 m³
  unit: 'm3',
  co2e_emissions: 0, // Water doesn't have direct emissions
  metadata: {
    // GRI 303 specific data
    source_type: 'surface_water', // or 'groundwater', 'third_party'
    water_stress_area: true,
    water_quality: 'freshwater', // TDS ≤1000 mg/L
    tds_level: 450, // mg/L
    location_coordinates: { lat: 38.7223, lon: -9.1393 },
    withdrawal_purpose: 'cooling_system',
    // WRI Aqueduct data
    baseline_water_stress: 'high',
    aqueduct_score: 3.5
  },
  data_quality: 'measured',
  verification_status: 'pending'
}
```

---

### **GRI 305: Emissions** 🏭

#### metrics_catalog entries (already exist):
```sql
gri_305_1_direct_emissions              -- Scope 1 total
gri_305_1_stationary_combustion         -- Boilers, generators
gri_305_1_mobile_combustion             -- Company vehicles
gri_305_1_process_emissions             -- Industrial processes
gri_305_1_fugitive_emissions            -- Refrigerants, leaks
gri_305_2_location_based                -- Scope 2 (grid average)
gri_305_2_market_based                  -- Scope 2 (supplier-specific)
gri_305_3_business_travel               -- Scope 3 - Travel
gri_305_3_employee_commuting            -- Scope 3 - Commuting
gri_305_3_upstream_transport            -- Scope 3 - Transport
gri_305_3_waste_disposal                -- Scope 3 - Waste
gri_305_4_emission_intensity
gri_305_5_emission_reduction
```

#### metrics_data entries:
```typescript
// Example 1: Stationary combustion (natural gas boiler)
{
  metric_id: 'uuid-of-gri_305_1_stationary_combustion',
  organization_id: 'org-uuid',
  site_id: 'site-uuid',
  period_start: '2024-01-01',
  period_end: '2024-01-31',
  value: 10000, // 10,000 kWh of natural gas
  unit: 'kWh',
  co2e_emissions: 2050, // Automatically calculated via Climatiq
  metadata: {
    // GRI 305 specific data
    fuel_type: 'natural_gas',
    equipment: 'boiler_main',
    emission_factor_id: 'climatiq-factor-uuid',
    emission_factor_value: 0.205, // kg CO2e/kWh
    emission_factor_source: 'IPCC 2024',
    scope: 'scope_1',
    activity_id: 'fuel_type_natural_gas-fuel_use_na',
    // Gas breakdown
    co2_kg: 1800,
    ch4_kg: 200,
    n2o_kg: 50
  },
  data_quality: 'measured',
  verification_status: 'verified'
}

// Example 2: Scope 2 - Electricity (location-based)
{
  metric_id: 'uuid-of-gri_305_2_location_based',
  organization_id: 'org-uuid',
  site_id: 'site-uuid',
  period_start: '2024-01-01',
  period_end: '2024-01-31',
  value: 50000, // 50,000 kWh
  unit: 'kWh',
  co2e_emissions: 5750, // 50000 * 0.115 (PT grid factor)
  metadata: {
    scope: 'scope_2',
    method: 'location_based',
    grid_region: 'PT',
    emission_factor_id: 'cached-pt-grid-uuid',
    emission_factor_value: 0.115, // kg CO2e/kWh
    emission_factor_source: 'EEA 2023',
    electricity_source: 'grid',
    renewable_attribute_certificates: false
  },
  data_quality: 'measured',
  verification_status: 'verified'
}

// Example 3: Business travel (flight)
{
  metric_id: 'uuid-of-gri_305_3_business_travel',
  organization_id: 'org-uuid',
  site_id: null, // Cross-site activity
  period_start: '2024-01-15',
  period_end: '2024-01-15',
  value: 2500, // 2,500 km
  unit: 'km',
  co2e_emissions: 425, // Calculated via Climatiq
  metadata: {
    scope: 'scope_3',
    travel_type: 'flight',
    flight_class: 'economy',
    route: 'LIS-LON',
    passengers: 2,
    emission_factor_id: 'climatiq-flight-uuid',
    emission_factor_value: 0.17, // kg CO2e/passenger-km
    activity_id: 'passenger_flight-route_type_domestic-aircraft_type_jet-distance_lt_3700km-class_economy',
    booking_reference: 'TAP-ABC123'
  },
  data_quality: 'calculated',
  verification_status: 'pending'
}
```

---

### **GRI 306: Waste** 🗑️

#### metrics_catalog entries (already exist):
```sql
gri_306_3_waste_generated
gri_306_3_hazardous_waste
gri_306_3_non_hazardous_waste
gri_306_4_waste_diverted           -- Recycling, reuse
gri_306_4_recycling
gri_306_4_composting
gri_306_5_waste_disposal           -- Landfill, incineration
gri_306_5_landfill
gri_306_5_incineration
```

#### metrics_data entries:
```typescript
// Example 1: Waste sent to landfill
{
  metric_id: 'uuid-of-gri_306_5_landfill',
  organization_id: 'org-uuid',
  site_id: 'site-uuid',
  period_start: '2024-01-01',
  period_end: '2024-01-31',
  value: 5000, // 5,000 kg (5 tonnes)
  unit: 'kg',
  co2e_emissions: 750, // Calculated via Climatiq for waste disposal
  metadata: {
    waste_type: 'non_hazardous',
    waste_composition: 'mixed_municipal_waste',
    disposal_method: 'landfill',
    disposal_facility: 'Valorsul',
    emission_factor_id: 'climatiq-waste-uuid',
    emission_factor_value: 0.15, // kg CO2e/kg waste
    activity_id: 'waste_type_mixed_municipal_waste-disposal_method_landfill',
    hauler: 'Waste Solutions Ltd',
    collection_date: '2024-01-30',
    waste_audit_date: '2024-01-15'
  },
  data_quality: 'measured',
  verification_status: 'verified'
}

// Example 2: Waste recycled (avoided emissions)
{
  metric_id: 'uuid-of-gri_306_4_recycling',
  organization_id: 'org-uuid',
  site_id: 'site-uuid',
  period_start: '2024-01-01',
  period_end: '2024-01-31',
  value: 3000, // 3,000 kg (3 tonnes) of paper recycled
  unit: 'kg',
  co2e_emissions: -450, // NEGATIVE = avoided emissions!
  metadata: {
    waste_type: 'non_hazardous',
    waste_composition: 'paper_cardboard',
    diversion_method: 'recycling',
    recycling_facility: 'Paper Recycling Co',
    emission_factor_id: 'climatiq-recycling-uuid',
    emission_factor_value: -0.15, // kg CO2e avoided per kg
    activity_id: 'waste_type_paper-recovery_method_recycling',
    avoided_emissions: true,
    circular_economy_benefit: 450 // kg CO2e avoided
  },
  data_quality: 'measured',
  verification_status: 'verified'
}
```

---

## 🎯 **Key Benefits of Using Existing Structure**

### 1. **Unified Data Model**
- All GRI metrics in one place
- Consistent querying across all standards
- Easy to add new GRI standards later

### 2. **Flexible metadata field (JSONB)**
- Store ANY GRI-specific data without schema changes
- Query specific metadata fields with PostgreSQL JSON operators
- Future-proof for new requirements

### 3. **Built-in Features**
- ✅ Multi-year support (via yearly views we created)
- ✅ YoY comparison functions
- ✅ Automatic CO2e calculation
- ✅ Data quality tracking
- ✅ Verification workflow
- ✅ Site-level and organization-level aggregation

### 4. **Emission Factor Integration**
- `co2e_emissions` automatically calculated
- Reference to `emission_factors_cache` via metadata
- Local calculations (no API calls after initial cache)

---

## 📝 **Example Queries**

### Get all GRI 302 (Energy) data for 2024
```sql
SELECT
  mc.code,
  mc.name,
  md.value,
  md.unit,
  md.co2e_emissions,
  md.period_start,
  md.metadata->>'source' as data_source
FROM metrics_data md
JOIN metrics_catalog mc ON mc.id = md.metric_id
WHERE mc.code LIKE 'gri_302%'
  AND md.organization_id = 'org-uuid'
  AND EXTRACT(YEAR FROM md.period_start) = 2024
ORDER BY md.period_start, mc.code;
```

### Calculate total Scope 1 emissions for 2024
```sql
SELECT
  SUM(md.co2e_emissions) as total_scope1_tco2e
FROM metrics_data md
JOIN metrics_catalog mc ON mc.id = md.metric_id
WHERE mc.code LIKE 'gri_305_1%'
  AND md.organization_id = 'org-uuid'
  AND EXTRACT(YEAR FROM md.period_start) = 2024;
```

### Get water consumption in high water-stress areas
```sql
SELECT
  s.name as site_name,
  SUM(md.value) as total_water_m3,
  md.metadata->>'baseline_water_stress' as stress_level
FROM metrics_data md
JOIN metrics_catalog mc ON mc.id = md.metric_id
JOIN sites s ON s.id = md.site_id
WHERE mc.code = 'gri_303_5_water_consumption'
  AND md.organization_id = 'org-uuid'
  AND (md.metadata->>'water_stress_area')::boolean = true
  AND EXTRACT(YEAR FROM md.period_start) = 2024
GROUP BY s.name, md.metadata->>'baseline_water_stress';
```

### Calculate waste diversion rate (circular economy)
```sql
WITH waste_stats AS (
  SELECT
    SUM(CASE WHEN mc.code LIKE 'gri_306_4%' THEN md.value ELSE 0 END) as diverted,
    SUM(CASE WHEN mc.code LIKE 'gri_306_5%' THEN md.value ELSE 0 END) as disposed,
    SUM(md.value) as total
  FROM metrics_data md
  JOIN metrics_catalog mc ON mc.id = md.metric_id
  WHERE mc.code LIKE 'gri_306%'
    AND md.organization_id = 'org-uuid'
    AND EXTRACT(YEAR FROM md.period_start) = 2024
)
SELECT
  diverted,
  disposed,
  total,
  ROUND((diverted / NULLIF(total, 0) * 100)::numeric, 2) as diversion_rate_pct
FROM waste_stats;
```

---

## 🚀 **Next Steps: Service Layer Implementation**

Now we just need to create service functions that:

1. **INSERT data** into `metrics_data` with proper metadata
2. **CALCULATE emissions** using cached Climatiq factors
3. **QUERY and aggregate** data for reporting
4. **VALIDATE** data quality and completeness

No new tables needed! 🎉
