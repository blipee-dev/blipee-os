-- Add specific water end-use metrics for office building (no cooling)
-- NOTE: This file is deprecated. Use supabase/migrations/20251007_water_enduse_tracking.sql instead

-- Toilet and sanitary facilities (45-50% of total)
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

-- Kitchen and cafeteria (15-20% of total)
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

-- Cleaning and maintenance (10-15% of total)
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

-- Landscaping and irrigation (10-15% of total)
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

-- Other miscellaneous uses (10-15% of total)
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

-- Update consumption rates
UPDATE metrics_catalog SET consumption_rate = 0.00 WHERE code = 'scope3_water_toilet';      -- 0% consumed (100% discharged)
UPDATE metrics_catalog SET consumption_rate = 0.25 WHERE code = 'scope3_water_kitchen';     -- 25% consumed
UPDATE metrics_catalog SET consumption_rate = 0.50 WHERE code = 'scope3_water_cleaning';    -- 50% consumed
UPDATE metrics_catalog SET consumption_rate = 1.00 WHERE code = 'scope3_water_irrigation';  -- 100% consumed
UPDATE metrics_catalog SET consumption_rate = 0.20 WHERE code = 'scope3_water_other';       -- 20% consumed
