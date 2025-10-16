-- Universal Energy Metric Targets Population Script
--
-- This script automatically creates metric-level targets for ALL energy metrics
-- for ANY organization based on their 2023 baseline data
--
-- It uses Scope 1 & 2 categories to determine energy-related metrics automatically
-- and applies appropriate SBTi 1.5°C reduction rates
--
-- Usage:
-- 1. Replace @ORGANIZATION_ID with your organization ID
-- 2. Replace @TARGET_ID with your sustainability target ID
-- 3. Adjust @BASELINE_YEAR and @TARGET_YEAR as needed
-- 4. Run in Supabase SQL Editor

-- ============================================================================
-- CONFIGURATION - UPDATE THESE VALUES FOR YOUR ORGANIZATION
-- ============================================================================
-- Current values are set for demo organization
-- To use for a different organization, update these:

DO $$
DECLARE
  v_organization_id uuid := '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  v_target_id uuid := 'd4a00170-7964-41e2-a61e-3d7b0059cfe5';
  v_baseline_year int := 2023;
  v_target_year int := 2025;
  v_years_to_target int;
  v_electricity_reduction numeric;
  v_other_reduction numeric;
BEGIN
  -- Calculate years to target and reduction percentages
  v_years_to_target := v_target_year - v_baseline_year;
  v_electricity_reduction := 0.052 * v_years_to_target; -- 5.2% annual
  v_other_reduction := 0.042 * v_years_to_target; -- 4.2% annual

  RAISE NOTICE 'Configuration:';
  RAISE NOTICE '  Organization ID: %', v_organization_id;
  RAISE NOTICE '  Target ID: %', v_target_id;
  RAISE NOTICE '  Baseline Year: %', v_baseline_year;
  RAISE NOTICE '  Target Year: %', v_target_year;
  RAISE NOTICE '  Years to Target: %', v_years_to_target;
  RAISE NOTICE '  Electricity Reduction: %% (%.1f%% annual)', v_electricity_reduction * 100, 5.2;
  RAISE NOTICE '  Other Categories Reduction: %% (%.1f%% annual)', v_other_reduction * 100, 4.2;
  RAISE NOTICE '';

  -- Insert metric targets

-- ============================================================================
-- INSERT ALL ENERGY METRIC TARGETS
-- ============================================================================
-- This single query handles ALL energy categories automatically by:
-- 1. Finding all metrics with Scope 1 or Scope 2 emissions
-- 2. Aggregating 2023 baseline data
-- 3. Applying appropriate reduction rates based on category
-- 4. Creating metric targets

INSERT INTO metric_targets (
  organization_id,
  target_id,
  metric_catalog_id,
  baseline_year,
  baseline_value,
  baseline_emissions,
  target_year,
  target_value,
  target_emissions,
  status,
  created_at,
  updated_at
)
SELECT
  '@ORGANIZATION_ID'::uuid as organization_id,
  '@TARGET_ID'::uuid as target_id,
  mc.id as metric_catalog_id,
  @BASELINE_YEAR as baseline_year,
  SUM(md.value) as baseline_value,
  SUM(md.co2e_emissions) as baseline_emissions,
  @TARGET_YEAR as target_year,
  -- Calculate target value based on reduction rate
  SUM(md.value) * (1 -
    CASE
      -- Electricity gets higher reduction rate (5.2% annual = 10.4% for 2 years)
      WHEN mc.category = 'Electricity' THEN 0.104
      -- All other energy categories get standard rate (4.2% annual = 8.4% for 2 years)
      ELSE 0.084
    END
  ) as target_value,
  -- Calculate target emissions based on reduction rate
  SUM(md.co2e_emissions) * (1 -
    CASE
      -- Electricity gets higher reduction rate (5.2% annual = 10.4% for 2 years)
      WHEN mc.category = 'Electricity' THEN 0.104
      -- All other energy categories get standard rate (4.2% annual = 8.4% for 2 years)
      ELSE 0.084
    END
  ) as target_emissions,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM metrics_catalog mc
JOIN metrics_data md ON mc.id = md.metric_id
WHERE
  -- Only include Scope 1 and Scope 2 metrics (energy-related)
  mc.scope IN ('scope_1', 'scope_2')
  -- Filter by organization
  AND md.organization_id = '@ORGANIZATION_ID'::uuid
  -- Filter by baseline year
  AND md.period_start >= '@BASELINE_YEAR-01-01'::date
  AND md.period_start < ('@BASELINE_YEAR'::int + 1)::text || '-01-01'::date
GROUP BY mc.id, mc.name, mc.category, mc.scope, mc.unit
-- Only create targets for metrics with actual emissions
HAVING SUM(md.co2e_emissions) > 0
-- Don't duplicate existing targets
ON CONFLICT (organization_id, target_id, metric_catalog_id) DO NOTHING;

-- ============================================================================
-- VERIFY RESULTS
-- ============================================================================
SELECT
  mc.category,
  mc.name,
  mc.scope,
  mt.baseline_emissions / 1000 as baseline_tco2e,
  mt.target_emissions / 1000 as target_tco2e,
  ROUND(((mt.baseline_emissions - mt.target_emissions) / mt.baseline_emissions * 100)::numeric, 1) as reduction_percent,
  mt.status
FROM metric_targets mt
JOIN metrics_catalog mc ON mt.metric_catalog_id = mc.id
WHERE mt.organization_id = '@ORGANIZATION_ID'::uuid
  AND mt.target_id = '@TARGET_ID'::uuid
  AND mc.scope IN ('scope_1', 'scope_2')
ORDER BY mc.category, mt.baseline_emissions DESC;

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================
SELECT
  mc.category,
  mc.scope,
  COUNT(*) as metric_count,
  ROUND((SUM(mt.baseline_emissions) / 1000)::numeric, 2) as total_baseline_tco2e,
  ROUND((SUM(mt.target_emissions) / 1000)::numeric, 2) as total_target_tco2e,
  ROUND((SUM(mt.baseline_emissions - mt.target_emissions) / 1000)::numeric, 2) as total_reduction_tco2e,
  ROUND(((SUM(mt.baseline_emissions) - SUM(mt.target_emissions)) / SUM(mt.baseline_emissions) * 100)::numeric, 1) as avg_reduction_percent
FROM metric_targets mt
JOIN metrics_catalog mc ON mt.metric_catalog_id = mc.id
WHERE mt.organization_id = '@ORGANIZATION_ID'::uuid
  AND mt.target_id = '@TARGET_ID'::uuid
  AND mc.scope IN ('scope_1', 'scope_2')
GROUP BY mc.category, mc.scope
ORDER BY total_baseline_tco2e DESC;
