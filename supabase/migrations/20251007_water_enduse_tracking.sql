-- Migration: Water End-Use Tracking with Consumption/Discharge
-- Date: 2025-10-07
-- Purpose: Add detailed water metrics by end-use to track consumption vs discharge properly

-- ============================================================================
-- PART 1: Add Water Withdrawal Metrics by End-Use
-- ============================================================================

-- Toilet and sanitary facilities (47.5% of total, 100% discharged)
INSERT INTO metrics_catalog (code, name, category, subcategory, unit, scope, emission_factor, description)
VALUES (
  'scope3_water_toilet',
  'Water - Toilets & Sanitary',
  'Purchased Goods & Services',
  'Water',
  'm³',
  'scope_3',
  0.70,
  'Water used for toilets, urinals, and sanitary facilities. GRI 303-3: Water withdrawal.'
) ON CONFLICT (code) DO NOTHING;

-- Kitchen and cafeteria (17.5% of total, 75% discharged)
INSERT INTO metrics_catalog (code, name, category, subcategory, unit, scope, emission_factor, description)
VALUES (
  'scope3_water_kitchen',
  'Water - Kitchen & Cafeteria',
  'Purchased Goods & Services',
  'Water',
  'm³',
  'scope_3',
  0.70,
  'Water used for dishwashing, drinking fountains, and food preparation. GRI 303-3: Water withdrawal.'
) ON CONFLICT (code) DO NOTHING;

-- Cleaning and maintenance (12.5% of total, 50% discharged)
INSERT INTO metrics_catalog (code, name, category, subcategory, unit, scope, emission_factor, description)
VALUES (
  'scope3_water_cleaning',
  'Water - Cleaning & Maintenance',
  'Purchased Goods & Services',
  'Water',
  'm³',
  'scope_3',
  0.70,
  'Water used for cleaning floors, windows, and general maintenance. GRI 303-3: Water withdrawal.'
) ON CONFLICT (code) DO NOTHING;

-- Landscaping and irrigation (12.5% of total, 0% discharged - all consumed)
INSERT INTO metrics_catalog (code, name, category, subcategory, unit, scope, emission_factor, description)
VALUES (
  'scope3_water_irrigation',
  'Water - Landscaping & Irrigation',
  'Purchased Goods & Services',
  'Water',
  'm³',
  'scope_3',
  0.70,
  'Water used for outdoor irrigation and landscaping. GRI 303-3: Water withdrawal. 100% consumed (not discharged).'
) ON CONFLICT (code) DO NOTHING;

-- Other miscellaneous uses (10% of total, 80% discharged)
INSERT INTO metrics_catalog (code, name, category, subcategory, unit, scope, emission_factor, description)
VALUES (
  'scope3_water_other',
  'Water - Other Uses',
  'Purchased Goods & Services',
  'Water',
  'm³',
  'scope_3',
  0.70,
  'Water used for other miscellaneous purposes. GRI 303-3: Water withdrawal.'
) ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PART 2: Add Wastewater Discharge Metrics by End-Use
-- ============================================================================

-- Toilet wastewater (100% of toilet withdrawal)
INSERT INTO metrics_catalog (code, name, category, subcategory, unit, scope, emission_factor, description)
VALUES (
  'scope3_wastewater_toilet',
  'Wastewater - Toilets & Sanitary',
  'Purchased Goods & Services',
  'Water',
  'm³',
  'scope_3',
  0.70,
  'Wastewater from toilets, urinals, and sanitary facilities. GRI 303-4: Water discharge. 100% of withdrawal.'
) ON CONFLICT (code) DO NOTHING;

-- Kitchen wastewater (75% of kitchen withdrawal)
INSERT INTO metrics_catalog (code, name, category, subcategory, unit, scope, emission_factor, description)
VALUES (
  'scope3_wastewater_kitchen',
  'Wastewater - Kitchen & Cafeteria',
  'Purchased Goods & Services',
  'Water',
  'm³',
  'scope_3',
  0.70,
  'Wastewater from dishwashing and food preparation. GRI 303-4: Water discharge. 75% of withdrawal (25% consumed).'
) ON CONFLICT (code) DO NOTHING;

-- Cleaning wastewater (50% of cleaning withdrawal)
INSERT INTO metrics_catalog (code, name, category, subcategory, unit, scope, emission_factor, description)
VALUES (
  'scope3_wastewater_cleaning',
  'Wastewater - Cleaning & Maintenance',
  'Purchased Goods & Services',
  'Water',
  'm³',
  'scope_3',
  0.70,
  'Wastewater from cleaning operations. GRI 303-4: Water discharge. 50% of withdrawal (50% evaporates).'
) ON CONFLICT (code) DO NOTHING;

-- No irrigation wastewater (0% - all consumed by plants/soil)

-- Other wastewater (80% of other withdrawal)
INSERT INTO metrics_catalog (code, name, category, subcategory, unit, scope, emission_factor, description)
VALUES (
  'scope3_wastewater_other',
  'Wastewater - Other Uses',
  'Purchased Goods & Services',
  'Water',
  'm³',
  'scope_3',
  0.70,
  'Wastewater from other miscellaneous uses. GRI 303-4: Water discharge. 80% of withdrawal.'
) ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PART 3: Add Metadata for Consumption Tracking
-- ============================================================================

-- Add consumption_rate column to metrics_catalog (optional, for reference)
ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS consumption_rate DECIMAL(5,2) DEFAULT 0.00;

COMMENT ON COLUMN metrics_catalog.consumption_rate IS 'Percentage of withdrawal that is consumed (not discharged). For GRI 303-5 calculation.';

-- Update consumption rates for water metrics
UPDATE metrics_catalog SET consumption_rate = 0.00 WHERE code = 'scope3_water_toilet';      -- 0% consumed (100% discharged)
UPDATE metrics_catalog SET consumption_rate = 0.25 WHERE code = 'scope3_water_kitchen';     -- 25% consumed
UPDATE metrics_catalog SET consumption_rate = 0.50 WHERE code = 'scope3_water_cleaning';    -- 50% consumed
UPDATE metrics_catalog SET consumption_rate = 1.00 WHERE code = 'scope3_water_irrigation';  -- 100% consumed
UPDATE metrics_catalog SET consumption_rate = 0.20 WHERE code = 'scope3_water_other';       -- 20% consumed

-- ============================================================================
-- PART 4: Create View for Easy Consumption Calculation
-- ============================================================================

CREATE OR REPLACE VIEW water_consumption_summary AS
SELECT
  md.organization_id,
  md.site_id,
  md.period_start,
  md.period_end,
  mc.code as metric_code,
  mc.name as metric_name,
  md.value as withdrawal_m3,
  md.value * (1 - COALESCE(mc.consumption_rate, 0)) as discharge_m3,
  md.value * COALESCE(mc.consumption_rate, 0) as consumption_m3,
  mc.consumption_rate * 100 as consumption_rate_percent,
  md.co2e_emissions
FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
WHERE mc.code LIKE 'scope3_water_%'
  AND mc.code != 'scope3_water_supply'  -- Exclude old aggregate metric
ORDER BY md.period_start DESC, mc.code;

COMMENT ON VIEW water_consumption_summary IS 'GRI 303 compliant water consumption summary showing withdrawal, discharge, and consumption by end-use.';

-- ============================================================================
-- PART 5: Update Existing Generic Metrics (Optional)
-- ============================================================================

-- Mark old generic water_supply metric as deprecated
UPDATE metrics_catalog
SET description = description || ' [DEPRECATED: Use specific end-use metrics instead]'
WHERE code = 'scope3_water_supply'
  AND description NOT LIKE '%DEPRECATED%';

UPDATE metrics_catalog
SET description = description || ' [DEPRECATED: Use specific end-use metrics instead]'
WHERE code = 'scope3_wastewater'
  AND description NOT LIKE '%DEPRECATED%';
