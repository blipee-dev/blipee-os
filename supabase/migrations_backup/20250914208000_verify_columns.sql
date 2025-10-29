-- Verify exact column structure before PLMJ data import
-- This migration checks all columns to ensure compatibility

-- 1. Check organizations table structure
DO $$
DECLARE
  v_columns TEXT[];
BEGIN
  SELECT array_agg(column_name::TEXT ORDER BY ordinal_position)
  INTO v_columns
  FROM information_schema.columns
  WHERE table_name = 'organizations'
  AND table_schema = 'public';

  RAISE NOTICE 'Organizations columns: %', v_columns;
END $$;

-- 2. Check sites table structure
DO $$
DECLARE
  v_columns TEXT[];
  v_required_cols TEXT[] := ARRAY['organization_id', 'name', 'address', 'city', 'country', 'status'];
  v_missing TEXT[];
BEGIN
  SELECT array_agg(column_name::TEXT ORDER BY ordinal_position)
  INTO v_columns
  FROM information_schema.columns
  WHERE table_name = 'sites'
  AND table_schema = 'public';

  RAISE NOTICE 'Sites columns: %', v_columns;

  -- Check for required columns
  SELECT array_agg(col)
  INTO v_missing
  FROM unnest(v_required_cols) AS col
  WHERE col NOT IN (SELECT unnest(v_columns));

  IF v_missing IS NOT NULL THEN
    RAISE WARNING 'Missing columns in sites: %', v_missing;
  ELSE
    RAISE NOTICE 'All required columns exist in sites table';
  END IF;
END $$;

-- 3. Check metrics_catalog table structure
DO $$
DECLARE
  v_columns TEXT[];
  v_sample RECORD;
BEGIN
  SELECT array_agg(column_name::TEXT ORDER BY ordinal_position)
  INTO v_columns
  FROM information_schema.columns
  WHERE table_name = 'metrics_catalog'
  AND table_schema = 'public';

  RAISE NOTICE 'Metrics catalog columns: %', v_columns;

  -- Get a sample electricity metric
  SELECT * INTO v_sample
  FROM metrics_catalog
  WHERE code LIKE '%electricity%'
  LIMIT 1;

  IF v_sample IS NOT NULL THEN
    RAISE NOTICE 'Sample electricity metric - code: %, id: %', v_sample.code, v_sample.id;
  END IF;
END $$;

-- 4. Check metrics_data table structure
DO $$
DECLARE
  v_columns TEXT[];
  v_required_cols TEXT[] := ARRAY['organization_id', 'metric_id', 'site_id', 'period_start', 'period_end', 'value', 'unit', 'data_quality', 'verification_status'];
  v_missing TEXT[];
BEGIN
  SELECT array_agg(column_name::TEXT ORDER BY ordinal_position)
  INTO v_columns
  FROM information_schema.columns
  WHERE table_name = 'metrics_data'
  AND table_schema = 'public';

  RAISE NOTICE 'Metrics data columns: %', v_columns;

  -- Check for required columns
  SELECT array_agg(col)
  INTO v_missing
  FROM unnest(v_required_cols) AS col
  WHERE col NOT IN (SELECT unnest(v_columns));

  IF v_missing IS NOT NULL THEN
    RAISE WARNING 'Missing columns in metrics_data: %', v_missing;
  ELSE
    RAISE NOTICE 'All required columns exist in metrics_data table';
  END IF;
END $$;

-- 5. Check organization_metrics table structure
DO $$
DECLARE
  v_columns TEXT[];
  v_required_cols TEXT[] := ARRAY['organization_id', 'metric_id', 'is_required', 'is_active', 'reporting_frequency'];
  v_missing TEXT[];
BEGIN
  SELECT array_agg(column_name::TEXT ORDER BY ordinal_position)
  INTO v_columns
  FROM information_schema.columns
  WHERE table_name = 'organization_metrics'
  AND table_schema = 'public';

  RAISE NOTICE 'Organization metrics columns: %', v_columns;

  -- Check for required columns
  SELECT array_agg(col)
  INTO v_missing
  FROM unnest(v_required_cols) AS col
  WHERE col NOT IN (SELECT unnest(v_columns));

  IF v_missing IS NOT NULL THEN
    RAISE WARNING 'Missing columns in organization_metrics: %', v_missing;
  ELSE
    RAISE NOTICE 'All required columns exist in organization_metrics table';
  END IF;
END $$;

-- 6. Check emission_factors table (for reference)
DO $$
DECLARE
  v_columns TEXT[];
BEGIN
  SELECT array_agg(column_name::TEXT ORDER BY ordinal_position)
  INTO v_columns
  FROM information_schema.columns
  WHERE table_name = 'emission_factors'
  AND table_schema = 'public';

  RAISE NOTICE 'Emission factors columns: %', v_columns;
END $$;

-- 7. Verify metrics exist in catalog
DO $$
DECLARE
  v_metric_codes TEXT[] := ARRAY[
    'scope2_electricity',
    'scope2_cooling',
    'scope2_heating',
    'scope3_business_travel_air',
    'scope3_business_travel_rail',
    'scope3_water',
    'scope3_wastewater',
    'scope3_waste_non_hazardous',
    'scope3_waste_hazardous'
  ];
  v_missing TEXT[];
  v_existing TEXT[];
BEGIN
  -- Check which metrics exist
  SELECT array_agg(code)
  INTO v_existing
  FROM metrics_catalog
  WHERE code = ANY(v_metric_codes);

  -- Find missing metrics
  SELECT array_agg(code)
  INTO v_missing
  FROM unnest(v_metric_codes) AS code
  WHERE code NOT IN (SELECT unnest(v_existing));

  IF v_existing IS NOT NULL THEN
    RAISE NOTICE 'Existing metrics in catalog: %', v_existing;
  END IF;

  IF v_missing IS NOT NULL THEN
    RAISE WARNING 'Missing metrics in catalog: %', v_missing;
    RAISE NOTICE 'These metrics need to be added before importing PLMJ data';
  ELSE
    RAISE NOTICE 'All required metrics exist in catalog';
  END IF;
END $$;

-- 8. Final compatibility check
DO $$
DECLARE
  v_ready BOOLEAN := true;
  v_message TEXT := '';
BEGIN
  -- Check if we have the necessary tables
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
    v_ready := false;
    v_message := v_message || 'Missing organizations table. ';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sites') THEN
    v_ready := false;
    v_message := v_message || 'Missing sites table. ';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metrics_catalog') THEN
    v_ready := false;
    v_message := v_message || 'Missing metrics_catalog table. ';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metrics_data') THEN
    v_ready := false;
    v_message := v_message || 'Missing metrics_data table. ';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_metrics') THEN
    v_ready := false;
    v_message := v_message || 'Missing organization_metrics table. ';
  END IF;

  IF v_ready THEN
    RAISE NOTICE '✅ DATABASE IS READY FOR PLMJ DATA IMPORT';
    RAISE NOTICE 'All required tables and columns exist';
  ELSE
    RAISE WARNING '❌ DATABASE NOT READY: %', v_message;
  END IF;
END $$;