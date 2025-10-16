-- ============================================================================
-- Populate Energy Metric Targets Based on Category-Level Target Allocation
-- ============================================================================
-- This script creates metric-level targets by:
-- 1. Reading the actual reduction rates from category_targets table
-- 2. Finding all metrics within each category
-- 3. Applying the category's specific reduction rate to each metric
--
-- This ensures metric targets align with the weighted allocation methodology
-- ============================================================================

-- Configuration
\set ORGANIZATION_ID '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
\set TARGET_ID 'd4a00170-7964-41e2-a61e-3d7b0059cfe5'
\set BASELINE_YEAR 2023
\set TARGET_YEAR 2025

-- ============================================================================
-- INSERT METRIC TARGETS BASED ON CATEGORY-LEVEL ALLOCATION
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
  -- Apply the category's specific reduction rate to calculate target value
  SUM(md.value) * (1 - (ct.baseline_target_percent / 100.0 * (:TARGET_YEAR - :BASELINE_YEAR))) as target_value,
  -- Apply the category's specific reduction rate to calculate target emissions
  SUM(md.co2e_emissions) * (1 - (ct.baseline_target_percent / 100.0 * (:TARGET_YEAR - :BASELINE_YEAR))) as target_emissions,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM metrics_catalog mc
JOIN metrics_data md ON mc.id = md.metric_id
-- Join with category_targets to get the actual reduction rates
LEFT JOIN category_targets ct ON
  ct.category = mc.category
  AND ct.organization_id = :'ORGANIZATION_ID'::uuid
  AND ct.baseline_year = :BASELINE_YEAR
WHERE
  -- Only Scope 1 & 2 (energy-related emissions)
  mc.scope IN ('scope_1', 'scope_2')
  -- Filter by organization
  AND md.organization_id = :'ORGANIZATION_ID'::uuid
  -- Filter by baseline year
  AND md.period_start >= (:BASELINE_YEAR || '-01-01')::date
  AND md.period_start < ((:BASELINE_YEAR + 1) || '-01-01')::date
  -- Only include metrics that have a category target defined
  AND ct.baseline_target_percent IS NOT NULL
GROUP BY mc.id, mc.name, mc.category, mc.scope, mc.unit, ct.baseline_target_percent
-- Only create targets for metrics with actual emissions
HAVING SUM(md.co2e_emissions) > 0
-- Avoid duplicates
ON CONFLICT (organization_id, target_id, metric_catalog_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERY - Shows all created targets with their reduction rates
-- ============================================================================
SELECT
  mc.category,
  ct.baseline_target_percent as category_annual_reduction_percent,
  mc.name as metric_name,
  mc.scope,
  mc.unit,
  ROUND((mt.baseline_emissions / 1000)::numeric, 2) as baseline_tco2e,
  ROUND((mt.target_emissions / 1000)::numeric, 2) as target_tco2e,
  ROUND(((mt.baseline_emissions - mt.target_emissions) / mt.baseline_emissions * 100)::numeric, 1) as actual_reduction_percent,
  ROUND((mt.baseline_value)::numeric, 2) as baseline_consumption,
  ROUND((mt.target_value)::numeric, 2) as target_consumption,
  mt.status
FROM metric_targets mt
JOIN metrics_catalog mc ON mt.metric_catalog_id = mc.id
LEFT JOIN category_targets ct ON
  ct.category = mc.category
  AND ct.organization_id = mt.organization_id
  AND ct.baseline_year = mt.baseline_year
WHERE mt.organization_id = :'ORGANIZATION_ID'::uuid
  AND mt.target_id = :'TARGET_ID'::uuid
  AND mc.scope IN ('scope_1', 'scope_2')
ORDER BY mc.category, mt.baseline_emissions DESC;

-- ============================================================================
-- SUMMARY BY CATEGORY - Shows alignment with category targets
-- ============================================================================
SELECT
  mc.category,
  ct.baseline_target_percent as category_target_percent,
  mc.scope,
  COUNT(*) as metric_count,
  ROUND((SUM(mt.baseline_emissions) / 1000)::numeric, 2) as category_baseline_tco2e,
  ROUND((SUM(mt.target_emissions) / 1000)::numeric, 2) as category_target_tco2e,
  ROUND((SUM(mt.baseline_emissions - mt.target_emissions) / 1000)::numeric, 2) as category_reduction_tco2e,
  ROUND(((SUM(mt.baseline_emissions) - SUM(mt.target_emissions)) / SUM(mt.baseline_emissions) * 100)::numeric, 1) as actual_reduction_percent,
  ct.allocation_reason
FROM metric_targets mt
JOIN metrics_catalog mc ON mt.metric_catalog_id = mc.id
LEFT JOIN category_targets ct ON
  ct.category = mc.category
  AND ct.organization_id = mt.organization_id
  AND ct.baseline_year = mt.baseline_year
WHERE mt.organization_id = :'ORGANIZATION_ID'::uuid
  AND mt.target_id = :'TARGET_ID'::uuid
  AND mc.scope IN ('scope_1', 'scope_2')
GROUP BY mc.category, mc.scope, ct.baseline_target_percent, ct.allocation_reason
ORDER BY category_baseline_tco2e DESC;

-- ============================================================================
-- CHECK IF CATEGORY TARGETS EXIST
-- ============================================================================
-- If this query returns no rows, you need to create category_targets first
SELECT
  category,
  baseline_year,
  baseline_emissions,
  target_emissions,
  baseline_target_percent as annual_reduction_percent,
  allocation_reason
FROM category_targets
WHERE organization_id = :'ORGANIZATION_ID'::uuid
  AND baseline_year = :BASELINE_YEAR
ORDER BY baseline_emissions DESC;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- IMPORTANT: This script requires that category_targets table is populated first!
--
-- If the last query returns no rows, you need to:
-- 1. Run the weighted allocation API or script to create category_targets
-- 2. Then run this script to create metric-level targets based on those allocations
--
-- This ensures that metric targets use the EXACT reduction rates calculated
-- by the weighted allocation methodology for each category.
-- ============================================================================
