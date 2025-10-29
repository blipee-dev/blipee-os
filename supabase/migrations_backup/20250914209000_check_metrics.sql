-- Check which metrics exist in the catalog for PLMJ data import
SELECT
  'Checking metrics catalog for required codes...' as status;

-- List all metrics that contain electricity, cooling, heating, travel, water, or waste
SELECT
  code,
  name,
  scope,
  unit,
  CASE
    WHEN code IN (
      'scope2_electricity',
      'scope2_cooling',
      'scope2_heating',
      'scope3_business_travel_air',
      'scope3_business_travel_rail',
      'scope3_water',
      'scope3_wastewater',
      'scope3_waste_non_hazardous',
      'scope3_waste_hazardous'
    ) THEN '✅ Required for PLMJ'
    ELSE '➖ Other'
  END as status
FROM metrics_catalog
WHERE
  code LIKE '%electricity%' OR
  code LIKE '%cooling%' OR
  code LIKE '%heating%' OR
  code LIKE '%travel%' OR
  code LIKE '%water%' OR
  code LIKE '%waste%'
ORDER BY scope, code;

-- Count how many of the required metrics exist
SELECT
  COUNT(*) as found_metrics,
  '9' as required_metrics,
  CASE
    WHEN COUNT(*) >= 9 THEN '✅ All metrics available'
    ELSE '⚠️ Missing some metrics'
  END as status
FROM metrics_catalog
WHERE code IN (
  'scope2_electricity',
  'scope2_cooling',
  'scope2_heating',
  'scope3_business_travel_air',
  'scope3_business_travel_rail',
  'scope3_water',
  'scope3_wastewater',
  'scope3_waste_non_hazardous',
  'scope3_waste_hazardous'
);

-- Show any alternative metric codes that might work
SELECT
  'Alternative metrics that could be used:' as info;

SELECT
  code,
  name,
  scope,
  unit
FROM metrics_catalog
WHERE
  (name ILIKE '%electricity%' AND scope = 'scope_2') OR
  (name ILIKE '%cooling%' AND scope = 'scope_2') OR
  (name ILIKE '%heating%' AND scope = 'scope_2') OR
  (name ILIKE '%business travel%' AND scope = 'scope_3') OR
  (name ILIKE '%air travel%' AND scope = 'scope_3') OR
  (name ILIKE '%rail%' AND scope = 'scope_3') OR
  (name ILIKE '%water%' AND scope = 'scope_3') OR
  (name ILIKE '%waste%' AND scope = 'scope_3')
ORDER BY scope, name;