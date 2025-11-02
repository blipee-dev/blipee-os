-- ================================================================
-- GRI 303:2018 Water Metrics Catalog - Corrected Version
-- ================================================================
-- Inserts complete GRI 303 water metrics into existing schema
-- Uses metrics_catalog + framework_mappings tables

BEGIN;

-- ================================================================
-- PART 1: GRI 303-3 WATER WITHDRAWAL METRICS
-- ================================================================

-- Surface Water - Freshwater
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_3_surface_freshwater',
  'Surface Water Withdrawal - Freshwater',
  'scope_3',
  'Water Withdrawal',
  'Source',
  'm³',
  'Freshwater withdrawal from surface sources (rivers, lakes, wetlands). TDS ≤1,000 mg/L. GRI 303-3-a-i.',
  'withdrawal'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Groundwater - Freshwater
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_3_groundwater_freshwater',
  'Groundwater Withdrawal - Freshwater',
  'scope_3',
  'Water Withdrawal',
  'Source',
  'm³',
  'Freshwater withdrawal from groundwater sources (wells, aquifers). TDS ≤1,000 mg/L. GRI 303-3-a-ii.',
  'withdrawal'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Seawater - Freshwater (Desalinated)
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_3_seawater_freshwater',
  'Desalinated Seawater Withdrawal',
  'scope_3',
  'Water Withdrawal',
  'Source',
  'm³',
  'Desalinated seawater used as freshwater source. Common in water-stressed coastal regions. GRI 303-3-a-iii.',
  'withdrawal'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Produced Water - Freshwater
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_3_produced_freshwater',
  'Produced Water Withdrawal - Freshwater',
  'scope_3',
  'Water Withdrawal',
  'Source',
  'm³',
  'Freshwater from produced/process water sources (typically oil & gas operations). GRI 303-3-a-iv.',
  'withdrawal'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Third-party Water - Municipal or Other Freshwater
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_3_municipal_freshwater',
  'Municipal Water Supply',
  'scope_3',
  'Water Withdrawal',
  'Source',
  'm³',
  'Freshwater from municipal water supplies or other water utilities. Most common for office buildings. GRI 303-3-a-v.',
  'withdrawal'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Other Water - Freshwater
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_3_other_freshwater',
  'Other Freshwater Sources',
  'scope_3',
  'Water Withdrawal',
  'Source',
  'm³',
  'Freshwater from other sources not categorized above (e.g., harvested rainwater, melted snow/ice). GRI 303-3-a-vi.',
  'withdrawal'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Total Withdrawal
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_3_withdrawal_total',
  'Total Water Withdrawal',
  'scope_3',
  'Water Withdrawal',
  'Total',
  'm³',
  'Total water withdrawn from all sources. Sum of all withdrawal sources. GRI 303-3-b.',
  'withdrawal'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Withdrawal from Water-Stressed Areas
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_3_withdrawal_stressed_areas',
  'Withdrawal from Water-Stressed Areas',
  'scope_3',
  'Water Withdrawal',
  'Risk',
  'm³',
  'Water withdrawn from areas with baseline water stress ≥40% (WRI Aqueduct High-Extremely High). Financial risk indicator. GRI 303-3-c.',
  'withdrawal'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- ================================================================
-- PART 2: GRI 303-4 WATER DISCHARGE METRICS
-- ================================================================

-- Discharge to Surface Water
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_4_discharge_surface',
  'Discharge to Surface Water',
  'scope_3',
  'Water Discharge',
  'Destination',
  'm³',
  'Water discharged to surface water bodies (rivers, lakes, oceans, wetlands). GRI 303-4-a-i.',
  'discharge'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Discharge to Groundwater
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_4_discharge_groundwater',
  'Discharge to Groundwater',
  'scope_3',
  'Water Discharge',
  'Destination',
  'm³',
  'Water discharged to groundwater (injection wells, infiltration). GRI 303-4-a-ii.',
  'discharge'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Discharge to Seawater
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_4_discharge_seawater',
  'Discharge to Seawater',
  'scope_3',
  'Water Discharge',
  'Destination',
  'm³',
  'Water discharged to seawater/oceans (coastal outfalls, brine discharge). GRI 303-4-a-iii.',
  'discharge'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Discharge to Third-party (Sewer/WWTP)
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_4_discharge_sewer',
  'Discharge to Municipal Sewer/WWTP',
  'scope_3',
  'Water Discharge',
  'Destination',
  'm³',
  'Water discharged to municipal sewer systems or wastewater treatment plants. Most common for office buildings. GRI 303-4-a-iv.',
  'discharge'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Total Discharge
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_4_discharge_total',
  'Total Water Discharge',
  'scope_3',
  'Water Discharge',
  'Total',
  'm³',
  'Total water discharged to all destinations. GRI 303-4-a-v.',
  'discharge'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Discharge - Primary Treatment
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_4_discharge_primary',
  'Discharge - Primary Treatment Level',
  'scope_3',
  'Water Discharge',
  'Treatment',
  'm³',
  'Water discharged after primary treatment (physical processes - settling, screening). GRI 303-4-c-i.',
  'discharge'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Discharge - Secondary Treatment
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_4_discharge_secondary',
  'Discharge - Secondary Treatment Level',
  'scope_3',
  'Water Discharge',
  'Treatment',
  'm³',
  'Water discharged after secondary treatment (biological processes). GRI 303-4-c-ii.',
  'discharge'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Discharge - Tertiary Treatment
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_4_discharge_tertiary',
  'Discharge - Tertiary Treatment Level',
  'scope_3',
  'Water Discharge',
  'Treatment',
  'm³',
  'Water discharged after tertiary/advanced treatment. Lisboa ETAR provides tertiary treatment. GRI 303-4-c-iii.',
  'discharge'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- ================================================================
-- PART 3: GRI 303-5 WATER CONSUMPTION METRICS
-- ================================================================

-- Total Consumption
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_5_consumption_total',
  'Total Water Consumption',
  'scope_3',
  'Water Consumption',
  'Total',
  'm³',
  'Water consumed = Withdrawal - Discharge. Water not returned to source. GRI 303-5-a.',
  NULL
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Consumption - Evaporation
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_5_consumption_evaporation',
  'Water Consumption - Evaporation',
  'scope_3',
  'Water Consumption',
  'Breakdown',
  'm³',
  'Water consumed through evaporation (cooling towers, cleaning, irrigation). ~0.2% for offices.',
  NULL
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Consumption - Incorporated into Products
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_5_consumption_products',
  'Water Consumption - Products',
  'scope_3',
  'Water Consumption',
  'Breakdown',
  'm³',
  'Water incorporated into products or crops (manufacturing, food processing, agriculture).',
  NULL
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Consumption - Human Consumption
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_5_consumption_human',
  'Water Consumption - Human Use',
  'scope_3',
  'Water Consumption',
  'Breakdown',
  'm³',
  'Water consumed by humans (drinking, cooking, absorbed). ~1.5% of drinking water for offices.',
  NULL
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Consumption - Irrigation
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_5_consumption_irrigation',
  'Water Consumption - Irrigation',
  'scope_3',
  'Water Consumption',
  'Breakdown',
  'm³',
  'Water consumed through irrigation (landscaping, agriculture). High consumption rate ~80-95%.',
  NULL
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Consumption in Water-Stressed Areas
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'gri_303_5_consumption_stressed_areas',
  'Consumption in Water-Stressed Areas',
  'scope_3',
  'Water Consumption',
  'Risk',
  'm³',
  'Water consumed in areas with baseline water stress ≥40%. Critical financial risk indicator. GRI 303-5-b.',
  NULL
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ================================================================
-- PART 4: CIRCULAR ECONOMY / RECYCLING METRICS
-- ================================================================

-- Grey Water Recycling
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'water_recycled_grey_water',
  'Grey Water Recycled and Reused',
  'scope_3',
  'Water Efficiency',
  'Circular Economy',
  'm³',
  'Water from handwashing/showers reused for toilet flushing. Lisboa: 4.15 m³/month = 11.2% reuse rate.',
  'recycled'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Process Water Recycling
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'water_recycled_process',
  'Process Water Recycled',
  'scope_3',
  'Water Efficiency',
  'Circular Economy',
  'm³',
  'Water recycled within industrial processes (dye baths, cooling loops, rinse water).',
  'recycled'
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  water_type = EXCLUDED.water_type;

-- Rainwater Harvesting
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'water_rainwater_harvested',
  'Rainwater Harvested',
  'scope_3',
  'Water Efficiency',
  'Circular Economy',
  'm³',
  'Rainwater collected from roofs/surfaces for irrigation or toilet flushing. Not counted in GRI 303-3 withdrawal.',
  NULL
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ================================================================
-- PART 5: EFFICIENCY & INTENSITY METRICS
-- ================================================================

-- Water Intensity - Per Employee
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'water_intensity_employee',
  'Water Intensity per Employee',
  'scope_3',
  'Water Efficiency',
  'Intensity',
  'm³/FTE',
  'Water withdrawal per full-time equivalent employee. Office benchmark: 0.4-0.6 m³/FTE/month.',
  NULL
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Water Intensity - Per Floor Area
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'water_intensity_floor_area',
  'Water Intensity per Floor Area',
  'scope_3',
  'Water Efficiency',
  'Intensity',
  'm³/m²',
  'Water withdrawal per square meter of building area. LEED Gold benchmark: 0.015 m³/m²/month.',
  NULL
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Water Intensity - Per Revenue
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'water_intensity_revenue',
  'Water Intensity per Revenue',
  'scope_3',
  'Water Efficiency',
  'Intensity',
  'm³/M€',
  'Water withdrawal per million euros of revenue. Useful for cross-industry comparison.',
  NULL
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Water Intensity - Per Production Unit
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'water_intensity_production',
  'Water Intensity per Production Unit',
  'scope_3',
  'Water Efficiency',
  'Intensity',
  'm³/unit',
  'Water withdrawal per unit produced. Unit varies by industry (kg, tonne, piece, etc.).',
  NULL
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Water Reuse Rate
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'water_reuse_rate',
  'Water Reuse Rate',
  'scope_3',
  'Water Efficiency',
  'KPI',
  '%',
  'Percentage of water reused = (Recycled / (Withdrawal + Recycled)) × 100. Lisboa: 11.2%.',
  NULL
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- Water Return Rate
INSERT INTO metrics_catalog (
  code, name, scope, category, subcategory, unit, description, water_type
) VALUES (
  'water_return_rate',
  'Water Return Rate',
  'scope_3',
  'Water Efficiency',
  'KPI',
  '%',
  'Percentage of withdrawal returned as discharge = (Discharge / Withdrawal) × 100. Office typical: 98-99%.',
  NULL
) ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ================================================================
-- PART 6: FRAMEWORK MAPPINGS (GRI 303 References)
-- ================================================================

-- Map withdrawal_total to GRI 303-3
INSERT INTO framework_mappings (metric_id, gri_codes, description, unit)
SELECT
  id,
  ARRAY['GRI 303-3-b'],
  'Total water withdrawal from all sources in megaliters',
  'm³'
FROM metrics_catalog
WHERE code = 'gri_303_3_withdrawal_total'
ON CONFLICT DO NOTHING;

-- Map discharge_total to GRI 303-4
INSERT INTO framework_mappings (metric_id, gri_codes, description, unit)
SELECT
  id,
  ARRAY['GRI 303-4-a-v'],
  'Total water discharge to all destinations in megaliters',
  'm³'
FROM metrics_catalog
WHERE code = 'gri_303_4_discharge_total'
ON CONFLICT DO NOTHING;

-- Map consumption_total to GRI 303-5
INSERT INTO framework_mappings (metric_id, gri_codes, description, unit)
SELECT
  id,
  ARRAY['GRI 303-5-a'],
  'Total water consumption in megaliters',
  'm³'
FROM metrics_catalog
WHERE code = 'gri_303_5_consumption_total'
ON CONFLICT DO NOTHING;

-- Map municipal_freshwater to GRI 303-3-a-v
INSERT INTO framework_mappings (metric_id, gri_codes, description, unit)
SELECT
  id,
  ARRAY['GRI 303-3-a-v'],
  'Freshwater from municipal supply or other water utilities',
  'm³'
FROM metrics_catalog
WHERE code = 'gri_303_3_municipal_freshwater'
ON CONFLICT DO NOTHING;

-- Map discharge_sewer to GRI 303-4-a-iv
INSERT INTO framework_mappings (metric_id, gri_codes, description, unit)
SELECT
  id,
  ARRAY['GRI 303-4-a-iv'],
  'Water discharged to municipal sewer or third-party WWTP',
  'm³'
FROM metrics_catalog
WHERE code = 'gri_303_4_discharge_sewer'
ON CONFLICT DO NOTHING;

COMMIT;

-- ================================================================
-- VERIFICATION QUERY
-- ================================================================
\echo ''
\echo '✅ GRI 303 Metrics Catalog Created Successfully!'
\echo ''
\echo '📊 Summary of Inserted Metrics:'
\echo ''

SELECT
  category,
  subcategory,
  COUNT(*) as metric_count
FROM metrics_catalog
WHERE code LIKE 'gri_303%' OR code LIKE 'water_%'
GROUP BY category, subcategory
ORDER BY category, subcategory;

\echo ''
\echo '🔍 Sample GRI 303 Core Metrics:'
\echo ''

SELECT
  code,
  name,
  water_type,
  unit
FROM metrics_catalog
WHERE code IN (
  'gri_303_3_withdrawal_total',
  'gri_303_4_discharge_total',
  'gri_303_5_consumption_total',
  'gri_303_3_municipal_freshwater',
  'water_recycled_grey_water'
)
ORDER BY code;
