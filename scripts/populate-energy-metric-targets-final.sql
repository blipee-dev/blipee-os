-- ============================================================================
-- Universal Energy Metric Targets Population Script
-- ============================================================================
-- This script automatically creates metric-level targets for ALL energy metrics
-- based on 2023 baseline data and SBTi 1.5°C reduction rates.
--
-- Works for ANY organization - just update the configuration section below.
--
-- The script:
-- 1. Finds all Scope 1 & 2 metrics (energy-related)
-- 2. Aggregates 2023 baseline emissions
-- 3. Applies SBTi reduction rates (5.2% for Electricity, 4.2% for others)
-- 4. Creates metric targets in the database
-- ============================================================================

-- ============================================================================
-- CONFIGURATION - Update these for your organization
-- ============================================================================
\set ORGANIZATION_ID '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
\set TARGET_ID 'd4a00170-7964-41e2-a61e-3d7b0059cfe5'
\set BASELINE_YEAR 2023
\set TARGET_YEAR 2025

-- ============================================================================
-- INSERT ALL ENERGY METRIC TARGETS (Scope 1 & 2)
-- ============================================================================
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
  :'ORGANIZATION_ID'::uuid as organization_id,
  :'TARGET_ID'::uuid as target_id,
  mc.id as metric_catalog_id,
  :BASELINE_YEAR as baseline_year,
  SUM(md.value) as baseline_value,
  SUM(md.co2e_emissions) as baseline_emissions,
  :TARGET_YEAR as target_year,
  -- Target value with appropriate reduction rate
  SUM(md.value) * (1 -
    CASE
      WHEN mc.category = 'Electricity' THEN 0.104  -- 5.2% annual × 2 years
      ELSE 0.084                                     -- 4.2% annual × 2 years
    END
  ) as target_value,
  -- Target emissions with appropriate reduction rate
  SUM(md.co2e_emissions) * (1 -
    CASE
      WHEN mc.category = 'Electricity' THEN 0.104  -- 5.2% annual × 2 years
      ELSE 0.084                                     -- 4.2% annual × 2 years
    END
  ) as target_emissions,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM metrics_catalog mc
JOIN metrics_data md ON mc.id = md.metric_id
WHERE
  -- Only Scope 1 & 2 (energy-related emissions)
  mc.scope IN ('scope_1', 'scope_2')
  -- Filter by organization
  AND md.organization_id = :'ORGANIZATION_ID'::uuid
  -- Filter by baseline year (2023)
  AND md.period_start >= (:BASELINE_YEAR || '-01-01')::date
  AND md.period_start < ((:BASELINE_YEAR + 1) || '-01-01')::date
GROUP BY mc.id, mc.name, mc.category, mc.scope, mc.unit
-- Only create targets for metrics with actual emissions
HAVING SUM(md.co2e_emissions) > 0
-- Avoid duplicates
ON CONFLICT (organization_id, target_id, metric_catalog_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY - Shows all created targets
-- ============================================================================
SELECT
  mc.category,
  mc.name,
  mc.scope,
  mc.unit,
  ROUND((mt.baseline_emissions / 1000)::numeric, 2) as baseline_tco2e,
  ROUND((mt.target_emissions / 1000)::numeric, 2) as target_tco2e,
  ROUND(((mt.baseline_emissions - mt.target_emissions) / mt.baseline_emissions * 100)::numeric, 1) as reduction_percent,
  mt.baseline_value::numeric as baseline_consumption,
  mt.target_value::numeric as target_consumption,
  mt.status
FROM metric_targets mt
JOIN metrics_catalog mc ON mt.metric_catalog_id = mc.id
WHERE mt.organization_id = :'ORGANIZATION_ID'::uuid
  AND mt.target_id = :'TARGET_ID'::uuid
  AND mc.scope IN ('scope_1', 'scope_2')
ORDER BY mc.category, mt.baseline_emissions DESC;

-- ============================================================================
-- SUMMARY BY CATEGORY
-- ============================================================================
SELECT
  mc.category,
  mc.scope,
  COUNT(*) as metric_count,
  ROUND((SUM(mt.baseline_emissions) / 1000)::numeric, 2) as category_baseline_tco2e,
  ROUND((SUM(mt.target_emissions) / 1000)::numeric, 2) as category_target_tco2e,
  ROUND((SUM(mt.baseline_emissions - mt.target_emissions) / 1000)::numeric, 2) as category_reduction_tco2e,
  ROUND(((SUM(mt.baseline_emissions) - SUM(mt.target_emissions)) / SUM(mt.baseline_emissions) * 100)::numeric, 1) as avg_reduction_percent
FROM metric_targets mt
JOIN metrics_catalog mc ON mt.metric_catalog_id = mc.id
WHERE mt.organization_id = :'ORGANIZATION_ID'::uuid
  AND mt.target_id = :'TARGET_ID'::uuid
  AND mc.scope IN ('scope_1', 'scope_2')
GROUP BY mc.category, mc.scope
ORDER BY category_baseline_tco2e DESC;

-- ============================================================================
-- INSTRUCTIONS FOR OTHER ORGANIZATIONS
-- ============================================================================
-- To use this script for a different organization:
-- 1. Update the ORGANIZATION_ID variable (line 19)
-- 2. Update the TARGET_ID variable (line 20)
-- 3. Adjust BASELINE_YEAR if needed (line 21)
-- 4. Adjust TARGET_YEAR if needed (line 22)
-- 5. Run the entire script in Supabase SQL Editor
--
-- The script automatically handles ALL Scope 1 & 2 metrics for any organization!
-- ============================================================================
