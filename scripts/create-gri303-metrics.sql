-- ============================================================================
-- GRI 303: Water and Effluents (2018) - Complete Metrics Catalog
-- ============================================================================
-- This script creates ALL GRI 303 metrics to support any type of organization
-- From offices (municipal water) to heavy industry (surface/groundwater)
-- ============================================================================

-- ============================================================================
-- GRI 303-3: WATER WITHDRAWAL
-- ============================================================================

-- 303-3a(i): Surface Water Withdrawal
INSERT INTO metrics_catalog (
  code, name, category, subcategory, unit,
  gri_standard, gri_disclosure, scope,
  description, calculation_method, data_quality_notes, is_active
) VALUES
(
  'gri_303_3_surface_freshwater',
  'Surface Water Withdrawal - Freshwater',
  'Water & Effluents',
  'Withdrawal',
  'm³',
  'GRI 303',
  '303-3a(i)',
  'environmental',
  'Freshwater withdrawn from surface sources (rivers, lakes, wetlands). Freshwater = ≤1,000 mg/L Total Dissolved Solids',
  'Direct measurement from intake meters or estimated from pump capacity × operating hours',
  'Measure TDS to confirm freshwater classification. Monthly or quarterly monitoring recommended.',
  true
),
(
  'gri_303_3_surface_other',
  'Surface Water Withdrawal - Other Water',
  'Water & Effluents',
  'Withdrawal',
  'm³',
  'GRI 303',
  '303-3a(i)',
  'environmental',
  'Non-freshwater withdrawn from surface sources. Other water = >1,000 mg/L Total Dissolved Solids',
  'Direct measurement from intake meters',
  'Common for coastal/brackish water sources',
  true
),

-- 303-3a(ii): Groundwater Withdrawal
(
  'gri_303_3_groundwater_freshwater',
  'Groundwater Withdrawal - Freshwater',
  'Water & Effluents',
  'Withdrawal',
  'm³',
  'GRI 303',
  '303-3a(ii)',
  'environmental',
  'Freshwater withdrawn from groundwater sources (wells, boreholes, springs)',
  'Well meter readings or estimated from pump logs',
  'Monitor water table levels. Check TDS to confirm freshwater status.',
  true
),
(
  'gri_303_3_groundwater_other',
  'Groundwater Withdrawal - Other Water',
  'Water & Effluents',
  'Withdrawal',
  'm³',
  'GRI 303',
  '303-3a(ii)',
  'environmental',
  'Non-freshwater withdrawn from groundwater (brackish wells, saline aquifers)',
  'Direct measurement from well meters',
  'Common in coastal or arid regions',
  true
),

-- 303-3a(iii): Seawater Withdrawal
(
  'gri_303_3_seawater_freshwater',
  'Seawater Withdrawal - Freshwater',
  'Water & Effluents',
  'Withdrawal',
  'm³',
  'GRI 303',
  '303-3a(iii)',
  'environmental',
  'Freshwater produced from seawater (desalination output)',
  'Desalination plant output meters (post-treatment freshwater)',
  'Report desalinated water output, not seawater intake. Very energy-intensive.',
  true
),
(
  'gri_303_3_seawater_other',
  'Seawater Withdrawal - Other Water (Seawater)',
  'Water & Effluents',
  'Withdrawal',
  'm³',
  'GRI 303',
  '303-3a(iii)',
  'environmental',
  'Seawater withdrawn and used directly (cooling water, process water)',
  'Seawater intake meters',
  'Common for coastal power plants, industrial cooling systems',
  true
),

-- 303-3a(iv): Produced Water Withdrawal
(
  'gri_303_3_produced_freshwater',
  'Produced Water - Freshwater',
  'Water & Effluents',
  'Withdrawal',
  'm³',
  'GRI 303',
  '303-3a(iv)',
  'environmental',
  'Freshwater extracted as byproduct of oil/gas/mining operations',
  'Production separator measurements',
  'Only applicable to extractive industries (oil, gas, mining)',
  true
),
(
  'gri_303_3_produced_other',
  'Produced Water - Other Water',
  'Water & Effluents',
  'Withdrawal',
  'm³',
  'GRI 303',
  '303-3a(iv)',
  'environmental',
  'Non-freshwater extracted with oil/gas/minerals (formation water, brine)',
  'Production separator measurements',
  'Often requires treatment before discharge or reinjection',
  true
),

-- 303-3a(v): Third-party Water (Municipal, Other Organizations)
(
  'gri_303_3_municipal_freshwater',
  'Municipal Water Supply - Freshwater',
  'Water & Effluents',
  'Withdrawal',
  'm³',
  'GRI 303',
  '303-3a(v)',
  'environmental',
  'Freshwater purchased from municipal utilities or other third parties',
  'Water bills, utility meter readings',
  'Most common for offices, retail, services. Check if municipal source is surface or groundwater.',
  true
),
(
  'gri_303_3_municipal_other',
  'Municipal Water Supply - Other Water',
  'Water & Effluents',
  'Withdrawal',
  'm³',
  'GRI 303',
  '303-3a(v)',
  'environmental',
  'Non-freshwater purchased from third parties (recycled water utilities)',
  'Water bills from recycled/reclaimed water suppliers',
  'Increasingly common for irrigation, industrial cooling in water-scarce regions',
  true
),

-- 303-3b: Total Withdrawal
(
  'gri_303_3_withdrawal_total',
  'Total Water Withdrawal',
  'Water & Effluents',
  'Withdrawal',
  'm³',
  'GRI 303',
  '303-3b',
  'environmental',
  'Total water withdrawn from all sources (sum of all withdrawal categories)',
  'Sum of all 303-3a metrics',
  'KEY METRIC: Must equal sum of surface + groundwater + seawater + produced + third-party',
  true
),

-- 303-3c: Water Stress
(
  'gri_303_3_withdrawal_stressed_areas',
  'Water Withdrawal from Water-Stressed Areas',
  'Water & Effluents',
  'Withdrawal',
  'm³',
  'GRI 303',
  '303-3c',
  'environmental',
  'Total withdrawal from facilities located in water-stressed areas',
  'Use WRI Aqueduct or WWF Water Risk Filter to identify stressed areas (≥40% baseline water stress)',
  'Critical for organizations in arid regions, Middle East, parts of Asia, Southern Europe',
  true
),
(
  'gri_303_3_withdrawal_stressed_percent',
  'Percentage from Water-Stressed Areas',
  'Water & Effluents',
  'Withdrawal',
  '%',
  'GRI 303',
  '303-3c',
  'environmental',
  'Percentage of total withdrawal from water-stressed areas',
  '(Stressed withdrawal / Total withdrawal) × 100',
  'Helps investors assess water-related financial risk',
  true
),

-- 303-3d: Change in Storage
(
  'gri_303_3_storage_change',
  'Change in Water Storage',
  'Water & Effluents',
  'Withdrawal',
  'm³',
  'GRI 303',
  '303-3d',
  'environmental',
  'Net change in stored water (tanks, reservoirs, ponds) if significant',
  'Beginning storage - Ending storage',
  'Only report if material (>5% of total withdrawal). Can be positive or negative.',
  true
),

-- ============================================================================
-- GRI 303-4: WATER DISCHARGE
-- ============================================================================

-- 303-4a(i): Discharge to Surface Water
(
  'gri_303_4_discharge_surface',
  'Discharge to Surface Water',
  'Water & Effluents',
  'Discharge',
  'm³',
  'GRI 303',
  '303-4a(i)',
  'environmental',
  'Wastewater discharged directly to rivers, lakes, oceans, wetlands',
  'Effluent meters, discharge permits, flow measurements',
  'Requires discharge permit. Monitor quality parameters (BOD, COD, nutrients, temp)',
  true
),

-- 303-4a(ii): Discharge to Groundwater
(
  'gri_303_4_discharge_groundwater',
  'Discharge to Groundwater',
  'Water & Effluents',
  'Discharge',
  'm³',
  'GRI 303',
  '303-4a(ii)',
  'environmental',
  'Wastewater discharged to groundwater (injection wells, infiltration)',
  'Injection well meters, infiltration basin measurements',
  'Strictly regulated. Common for treated wastewater recharge. Monitor groundwater quality.',
  true
),

-- 303-4a(iii): Discharge to Seawater
(
  'gri_303_4_discharge_seawater',
  'Discharge to Seawater',
  'Water & Effluents',
  'Discharge',
  'm³',
  'GRI 303',
  '303-4a(iii)',
  'environmental',
  'Wastewater discharged directly to oceans or seas',
  'Ocean outfall meters, marine discharge permits',
  'Common for coastal industries, desalination plants. Monitor marine impact.',
  true
),

-- 303-4a(iv): Third-party Discharge (Sewers, Treatment Plants)
(
  'gri_303_4_discharge_sewer',
  'Discharge to Sewer/Wastewater Treatment Plant',
  'Water & Effluents',
  'Discharge',
  'm³',
  'GRI 303',
  '303-4a(iv)',
  'environmental',
  'Wastewater sent to municipal sewers or third-party treatment facilities',
  'Sewer bills, effluent meters, water balance calculations',
  'Most common for offices, retail, light industry. Specify treatment level at receiving WWTP.',
  true
),

-- 303-4a(v): Total Discharge
(
  'gri_303_4_discharge_total',
  'Total Water Discharge',
  'Water & Effluents',
  'Discharge',
  'm³',
  'GRI 303',
  '303-4a(v)',
  'environmental',
  'Total wastewater discharged to all destinations',
  'Sum of all discharge categories',
  'KEY METRIC: Should equal Withdrawal - Consumption (check water balance)',
  true
),

-- 303-4b: Discharge to Stressed Areas
(
  'gri_303_4_discharge_stressed_areas',
  'Discharge to Water-Stressed Areas',
  'Water & Effluents',
  'Discharge',
  'm³',
  'GRI 303',
  '303-4b',
  'environmental',
  'Wastewater discharged in water-stressed regions',
  'Discharge from facilities in areas with ≥40% baseline water stress',
  'Important for assessing impact on stressed watersheds',
  true
),

-- 303-4c: Discharge by Treatment Level
(
  'gri_303_4_discharge_no_treatment',
  'Discharge - No Treatment',
  'Water & Effluents',
  'Discharge',
  'm³',
  'GRI 303',
  '303-4c',
  'environmental',
  'Untreated wastewater discharged directly',
  'Measure at discharge point before any treatment',
  'HIGH RISK: Regulatory violations, environmental damage. Should be zero in most jurisdictions.',
  true
),
(
  'gri_303_4_discharge_primary',
  'Discharge - Primary Treatment Only',
  'Water & Effluents',
  'Discharge',
  'm³',
  'GRI 303',
  '303-4c',
  'environmental',
  'Wastewater receiving only physical treatment (screening, settling)',
  'Post-primary treatment flow meters',
  'Removes solids, oils. Not sufficient for most pollutants. Rare in developed countries.',
  true
),
(
  'gri_303_4_discharge_secondary',
  'Discharge - Secondary Treatment',
  'Water & Effluents',
  'Discharge',
  'm³',
  'GRI 303',
  '303-4c',
  'environmental',
  'Wastewater receiving biological treatment (activated sludge, biofilters)',
  'Post-secondary treatment flow meters',
  'Removes organics (BOD/COD), nutrients. Standard for municipal WWTPs.',
  true
),
(
  'gri_303_4_discharge_tertiary',
  'Discharge - Tertiary/Advanced Treatment',
  'Water & Effluents',
  'Discharge',
  'm³',
  'GRI 303',
  '303-4c',
  'environmental',
  'Wastewater receiving advanced treatment (UV, filtration, nutrient removal)',
  'Post-tertiary treatment flow meters',
  'Highest quality. Suitable for reuse or sensitive receiving waters. Common in EU, developed regions.',
  true
),

-- 303-4d: Priority Substances (Qualitative - stored in metadata)
-- Not a quantitative metric, but track in metadata:
-- - Nutrients (N, P, K)
-- - Heavy metals (Hg, Pb, Cd, etc.)
-- - Oils & fats
-- - Persistent organic pollutants
-- - Pharmaceuticals
-- - Microplastics
-- - Pathogens

-- ============================================================================
-- GRI 303-5: WATER CONSUMPTION
-- ============================================================================

-- 303-5a: Total Consumption
(
  'gri_303_5_consumption_total',
  'Total Water Consumption',
  'Water & Effluents',
  'Consumption',
  'm³',
  'GRI 303',
  '303-5a',
  'environmental',
  'Water consumed (not returned to source). Consumption = Withdrawal - Discharge',
  'Withdrawal - Discharge, or sum of evaporation + products + waste + human use',
  'KEY METRIC: Water permanently removed from watershed. For offices typically 1-3%.',
  true
),

-- 303-5a: Consumption Breakdown (recommended detail)
(
  'gri_303_5_consumption_evaporation',
  'Water Consumed - Evaporation',
  'Water & Effluents',
  'Consumption',
  'm³',
  'GRI 303',
  '303-5a',
  'environmental',
  'Water lost to evaporation (cooling towers, irrigation, cleaning)',
  'Cooling tower calculations, irrigation ET models, process mass balance',
  'Significant for power plants, agriculture, data centers with cooling systems',
  true
),
(
  'gri_303_5_consumption_products',
  'Water Consumed - Incorporated in Products',
  'Water & Effluents',
  'Consumption',
  'm³',
  'GRI 303',
  '303-5a',
  'environmental',
  'Water incorporated into manufactured products (beverages, food, chemicals)',
  'Production formulations × output volume',
  'Common for beverage, food processing, chemical industries',
  true
),
(
  'gri_303_5_consumption_human',
  'Water Consumed - Human Use',
  'Water & Effluents',
  'Consumption',
  'm³',
  'GRI 303',
  '303-5a',
  'environmental',
  'Water consumed by employees (drinking, cooking, hygiene)',
  'Employee count × consumption rate (typically 2-5 L/person/day for offices)',
  'Small for offices (~1-2% of total). Higher for hotels, restaurants.',
  true
),
(
  'gri_303_5_consumption_irrigation',
  'Water Consumed - Irrigation/Landscaping',
  'Water & Effluents',
  'Consumption',
  'm³',
  'GRI 303',
  '303-5a',
  'environmental',
  'Water consumed by plants/evapotranspiration from landscaping',
  'Irrigation volume × ET rate (typically 70-90% consumed)',
  'Significant for campuses with extensive landscaping, golf courses, agriculture',
  true
),

-- 303-5b: Consumption from Stressed Areas
(
  'gri_303_5_consumption_stressed_areas',
  'Consumption from Water-Stressed Areas',
  'Water & Effluents',
  'Consumption',
  'm³',
  'GRI 303',
  '303-5b',
  'environmental',
  'Water consumed in water-stressed regions',
  'Consumption from facilities in areas with ≥40% baseline water stress',
  'CRITICAL METRIC: Direct impact on stressed watersheds. Priority for reduction.',
  true
),

-- 303-5c: Change in Storage (duplicate from withdrawal if material)
(
  'gri_303_5_storage_change',
  'Change in Water Storage (Consumption)',
  'Water & Effluents',
  'Consumption',
  'm³',
  'GRI 303',
  '303-5c',
  'environmental',
  'Change in stored water affecting consumption calculation',
  'Same as 303-3d if material',
  'Usually same value as withdrawal storage change',
  true
),

-- ============================================================================
-- ADDITIONAL WATER METRICS (Best Practice - Not GRI 303 but recommended)
-- ============================================================================

-- Circular Economy Metrics
(
  'water_recycled_total',
  'Total Water Recycled & Reused',
  'Circular Economy',
  'Water Reuse',
  'm³',
  'CDP Water',
  'W1.2h',
  'environmental',
  'Total volume of water recycled or reused internally (any treatment level)',
  'Sum of all internal water reuse (grey water, process water recycling, rainwater)',
  'BEST PRACTICE: Shows circular economy efforts. Key for water efficiency.',
  true
),
(
  'water_recycled_grey_water',
  'Grey Water Reused',
  'Circular Economy',
  'Water Reuse',
  'm³',
  'CDP Water',
  'W1.2h',
  'environmental',
  'Grey water from sinks/showers reused for toilets or irrigation',
  'Grey water tank output meters or system capacity',
  'Common in green buildings, offices. Lisboa PLMJ uses this! Saves 10-15%.',
  true
),
(
  'water_recycled_process',
  'Process Water Recycled',
  'Circular Economy',
  'Water Reuse',
  'm³',
  'CDP Water',
  'W1.2h',
  'environmental',
  'Industrial process water treated and reused in production',
  'Process recycling system meters',
  'Common in manufacturing, textiles, chemical industries. Can exceed 50% recycling.',
  true
),
(
  'water_recycled_cooling',
  'Cooling Water Recycled',
  'Circular Economy',
  'Water Reuse',
  'm³',
  'CDP Water',
  'W1.2h',
  'environmental',
  'Cooling tower water circulated/reused (closed-loop systems)',
  'Cooling tower circulation × cycles',
  'Power plants, data centers. Closed-loop can save 90%+ vs once-through.',
  true
),
(
  'water_rainwater_harvested',
  'Rainwater Harvested',
  'Circular Economy',
  'Alternative Sources',
  'm³',
  'Best Practice',
  'N/A',
  'environmental',
  'Rainwater collected from roofs/surfaces for non-potable use',
  'Rainwater tank inflow meters or catchment area × rainfall',
  'Free water source. Common for irrigation, toilet flushing, cooling. Reduces municipal demand.',
  true
),

-- Water Efficiency / Intensity Metrics
(
  'water_intensity_revenue',
  'Water Intensity per Revenue',
  'Efficiency',
  'Water Intensity',
  'm³/M€',
  'CDP Water',
  'W1.2b',
  'environmental',
  'Water withdrawal per million € revenue',
  'Total withdrawal / Revenue (M€)',
  'Normalizes water use by business size. Good for cross-company comparison.',
  true
),
(
  'water_intensity_production',
  'Water Intensity per Unit Production',
  'Efficiency',
  'Water Intensity',
  'm³/unit',
  'ISO 46001',
  'N/A',
  'environmental',
  'Water withdrawal per unit of production (tonnes, liters, pieces)',
  'Total withdrawal / Production volume',
  'Industry-specific. Example: m³/tonne steel, L/L beverage, m³/vehicle',
  true
),
(
  'water_intensity_employee',
  'Water Intensity per Employee',
  'Efficiency',
  'Water Intensity',
  'm³/FTE',
  'Best Practice',
  'N/A',
  'environmental',
  'Water withdrawal per full-time equivalent employee',
  'Total withdrawal / FTE count',
  'Useful for offices, services. Typical: 15-30 m³/FTE/year',
  true
),
(
  'water_intensity_floor_area',
  'Water Intensity per Floor Area',
  'Efficiency',
  'Water Intensity',
  'm³/m²',
  'LEED/BREEAM',
  'N/A',
  'environmental',
  'Water withdrawal per square meter of building floor area',
  'Total withdrawal / Floor area (m²)',
  'LEED/BREEAM benchmark. Typical offices: 0.5-1.0 m³/m²/year',
  true
),

-- Water Quality Metrics
(
  'water_return_rate',
  'Water Return Rate',
  'Efficiency',
  'Water Balance',
  '%',
  'Best Practice',
  'N/A',
  'environmental',
  'Percentage of withdrawn water returned to source',
  '(Discharge / Withdrawal) × 100',
  'High return rate (>95%) good for offices. Low (<50%) for irrigation, beverages.',
  true
),
(
  'water_reuse_rate',
  'Water Reuse Rate',
  'Efficiency',
  'Circular Economy',
  '%',
  'CDP Water',
  'W1.2h',
  'environmental',
  'Percentage of water recycled/reused vs total use',
  '(Recycled / (Withdrawal + Recycled)) × 100',
  'Circular economy KPI. Lisboa = 11.2%. Industry leaders >30%.',
  true
),

-- Water Risk Metrics
(
  'water_stressed_facilities_count',
  'Facilities in Water-Stressed Areas',
  'Risk',
  'Water Stress',
  'count',
  'CDP Water',
  'W1.2d',
  'environmental',
  'Number of facilities located in water-stressed regions',
  'Count facilities in areas with WRI Aqueduct stress ≥40%',
  'Financial risk indicator. Affects CAPEX, OPEX, license to operate.',
  true
),
(
  'water_stressed_withdrawal_percent',
  'Withdrawal from Stressed Areas (%)',
  'Risk',
  'Water Stress',
  '%',
  'CDP Water',
  'W1.2d',
  'environmental',
  'Percentage of total withdrawal from stressed areas',
  '(Stressed withdrawal / Total withdrawal) × 100',
  'Investment community tracks this. Target: <10% for low risk.',
  true
),

-- Water Cost Metrics
(
  'water_total_cost',
  'Total Water & Wastewater Cost',
  'Financial',
  'Operating Cost',
  '€',
  'Best Practice',
  'N/A',
  'environmental',
  'Total annual cost for water supply and wastewater treatment',
  'Water bills + Wastewater bills + Treatment costs',
  'Includes municipal fees, permits, testing, treatment chemicals',
  true
),
(
  'water_unit_cost',
  'Water Unit Cost',
  'Financial',
  'Operating Cost',
  '€/m³',
  'Best Practice',
  'N/A',
  'environmental',
  'Average cost per cubic meter of water',
  'Total water cost / Total withdrawal',
  'Varies by region. EU average: €2-4/m³. Water-scarce: €5-15/m³',
  true
);

-- ============================================================================
-- CREATE INDEXES for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_metrics_catalog_gri_standard
  ON metrics_catalog(gri_standard)
  WHERE gri_standard IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_metrics_catalog_category
  ON metrics_catalog(category);

CREATE INDEX IF NOT EXISTS idx_metrics_catalog_code_active
  ON metrics_catalog(code)
  WHERE is_active = true;

-- ============================================================================
-- DOCUMENTATION NOTES
-- ============================================================================

COMMENT ON TABLE metrics_catalog IS 'Complete GRI 303:2018 Water and Effluents metrics plus CDP Water Security and best practice KPIs. Supports any organization from offices to heavy industry.';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count metrics by GRI disclosure
SELECT
  gri_disclosure,
  COUNT(*) as metric_count,
  string_agg(name, ', ' ORDER BY code) as metrics
FROM metrics_catalog
WHERE gri_standard = 'GRI 303'
GROUP BY gri_disclosure
ORDER BY gri_disclosure;

-- Show all withdrawal metrics
SELECT code, name, unit, description
FROM metrics_catalog
WHERE category = 'Water & Effluents'
  AND subcategory = 'Withdrawal'
ORDER BY code;

-- Show all discharge metrics
SELECT code, name, unit, description
FROM metrics_catalog
WHERE category = 'Water & Effluents'
  AND subcategory = 'Discharge'
ORDER BY code;

-- Show all consumption metrics
SELECT code, name, unit, description
FROM metrics_catalog
WHERE category = 'Water & Effluents'
  AND subcategory = 'Consumption'
ORDER BY code;

-- Show circular economy metrics
SELECT code, name, unit, description
FROM metrics_catalog
WHERE category = 'Circular Economy'
ORDER BY code;
