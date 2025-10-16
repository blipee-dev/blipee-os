-- ============================================================================
-- Check All Target Data in Database
-- ============================================================================
-- Run this in Supabase SQL Editor to understand what target data exists
-- ============================================================================

\set ORGANIZATION_ID '22647141-2ee4-4d8d-8b47-16b0cbd830b2'

\echo '================================================================================'
\echo '1. SUSTAINABILITY TARGETS (Main/Parent Targets)'
\echo '================================================================================'

SELECT
  id,
  name,
  target_type,
  baseline_year,
  target_year,
  ROUND((baseline_value / 1000)::numeric, 2) as baseline_tco2e,
  ROUND((target_value / 1000)::numeric, 2) as target_tco2e,
  ROUND((((baseline_value - target_value) / baseline_value) * 100)::numeric, 1) as reduction_percent,
  status,
  created_at::date
FROM sustainability_targets
WHERE organization_id = :'ORGANIZATION_ID'::uuid
ORDER BY created_at DESC;

\echo ''
\echo '================================================================================'
\echo '2. CATEGORY TARGETS (Category-Level Allocations from Weighted Allocation)'
\echo '================================================================================'

SELECT
  category,
  baseline_year,
  ROUND((baseline_emissions / 1000)::numeric, 2) as baseline_tco2e,
  ROUND((target_emissions / 1000)::numeric, 2) as target_tco2e,
  baseline_target_percent as annual_reduction_percent,
  adjusted_target_percent,
  effort_factor,
  allocation_reason,
  feasibility,
  is_active,
  created_at::date
FROM category_targets
WHERE organization_id = :'ORGANIZATION_ID'::uuid
ORDER BY baseline_emissions DESC;

\echo ''
\echo '================================================================================'
\echo '3. METRIC TARGETS (Metric-Level Targets - What We Need for Expandable View)'
\echo '================================================================================'

SELECT
  mc.category,
  mc.name as metric_name,
  mc.scope,
  mt.baseline_year,
  mt.target_year,
  ROUND((mt.baseline_emissions / 1000)::numeric, 2) as baseline_tco2e,
  ROUND((mt.target_emissions / 1000)::numeric, 2) as target_tco2e,
  ROUND((((mt.baseline_emissions - mt.target_emissions) / mt.baseline_emissions) * 100)::numeric, 1) as reduction_percent,
  mt.status,
  mt.created_at::date
FROM metric_targets mt
JOIN metrics_catalog mc ON mt.metric_catalog_id = mc.id
WHERE mt.organization_id = :'ORGANIZATION_ID'::uuid
  AND mc.scope IN ('scope_1', 'scope_2')
ORDER BY mc.category, mt.baseline_emissions DESC;

\echo ''
\echo '================================================================================'
\echo 'SUMMARY'
\echo '================================================================================'

SELECT
  'Sustainability Targets' as level,
  COUNT(*) as count
FROM sustainability_targets
WHERE organization_id = :'ORGANIZATION_ID'::uuid

UNION ALL

SELECT
  'Category Targets' as level,
  COUNT(*) as count
FROM category_targets
WHERE organization_id = :'ORGANIZATION_ID'::uuid

UNION ALL

SELECT
  'Metric Targets' as level,
  COUNT(*) as count
FROM metric_targets
WHERE organization_id = :'ORGANIZATION_ID'::uuid;

\echo ''
\echo '================================================================================'
\echo 'DIAGNOSTIC: What needs to be created?'
\echo '================================================================================'

DO $$
DECLARE
  v_org_id uuid := '22647141-2ee4-4d8d-8b47-16b0cbd830b2';
  v_sustainability_count int;
  v_category_count int;
  v_metric_count int;
BEGIN
  SELECT COUNT(*) INTO v_sustainability_count FROM sustainability_targets WHERE organization_id = v_org_id;
  SELECT COUNT(*) INTO v_category_count FROM category_targets WHERE organization_id = v_org_id;
  SELECT COUNT(*) INTO v_metric_count FROM metric_targets WHERE organization_id = v_org_id;

  RAISE NOTICE '';
  RAISE NOTICE '🔍 Current State:';
  RAISE NOTICE '  Sustainability Targets: %', v_sustainability_count;
  RAISE NOTICE '  Category Targets: %', v_category_count;
  RAISE NOTICE '  Metric Targets: %', v_metric_count;
  RAISE NOTICE '';

  IF v_sustainability_count = 0 THEN
    RAISE NOTICE '❌ NO SUSTAINABILITY TARGETS';
    RAISE NOTICE '   Action: Create sustainability targets first (main SBTi targets)';
    RAISE NOTICE '   Use the UI or POST to /api/sustainability/targets';
  ELSE
    RAISE NOTICE '✅ Sustainability targets exist';
  END IF;

  RAISE NOTICE '';

  IF v_category_count = 0 THEN
    RAISE NOTICE '❌ NO CATEGORY TARGETS';
    RAISE NOTICE '   Action: Run weighted allocation API to create category targets';
    RAISE NOTICE '   GET /api/sustainability/targets/weighted-allocation?baseline_year=2023';
  ELSE
    RAISE NOTICE '✅ Category targets exist (% categories)', v_category_count;
  END IF;

  RAISE NOTICE '';

  IF v_metric_count = 0 THEN
    RAISE NOTICE '❌ NO METRIC TARGETS - This is why expandable section is empty!';
    RAISE NOTICE '   Action: Run SQL script to create metric targets from category allocations';
    RAISE NOTICE '   Use: scripts/populate-energy-metric-targets-from-allocation.sql';
  ELSE
    RAISE NOTICE '✅ Metric targets exist (% metrics)', v_metric_count;
    RAISE NOTICE '   The expandable SBTi section should work now!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '===============================================================================';

END $$;
