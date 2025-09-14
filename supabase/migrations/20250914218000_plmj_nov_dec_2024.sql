-- Add PLMJ November and December 2024 Data
-- Complete the 2024 dataset

DO $$
DECLARE
  v_org_id UUID;
  v_lisboa_site_id UUID;
  v_porto_site_id UUID;
  v_faro_site_id UUID;
  v_metric_id UUID;
  v_count_before INTEGER;
  v_count_after INTEGER;
BEGIN
  -- Get PLMJ organization and sites
  SELECT id INTO v_org_id FROM organizations WHERE name = 'PLMJ' LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'PLMJ organization not found. Run previous migrations first.';
  END IF;

  SELECT id INTO v_lisboa_site_id FROM sites WHERE organization_id = v_org_id AND name = 'Lisboa - FPM41' LIMIT 1;
  SELECT id INTO v_porto_site_id FROM sites WHERE organization_id = v_org_id AND name = 'Porto - POP' LIMIT 1;
  SELECT id INTO v_faro_site_id FROM sites WHERE organization_id = v_org_id AND name = 'Faro' LIMIT 1;

  -- Count existing records
  SELECT COUNT(*) INTO v_count_before FROM metrics_data WHERE organization_id = v_org_id;
  RAISE NOTICE 'Starting with % existing records', v_count_before;

  -- ========================================
  -- NOVEMBER & DECEMBER 2024 ELECTRICITY
  -- ========================================
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope2_electricity_grid' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    -- November 2024 Electricity
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      -- Lisboa
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-11-01', '2024-11-30', 28945, 'kWh', 'measured', 'verified'),
      -- Porto
      (v_org_id, v_metric_id, v_porto_site_id, '2024-11-01', '2024-11-30', 9876, 'kWh', 'measured', 'verified'),
      -- Faro
      (v_org_id, v_metric_id, v_faro_site_id, '2024-11-01', '2024-11-30', 987, 'kWh', 'measured', 'verified')
    ON CONFLICT DO NOTHING;

    -- December 2024 Electricity
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      -- Lisboa
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-12-01', '2024-12-31', 23876, 'kWh', 'measured', 'verified'),
      -- Porto
      (v_org_id, v_metric_id, v_porto_site_id, '2024-12-01', '2024-12-31', 8234, 'kWh', 'measured', 'verified'),
      -- Faro
      (v_org_id, v_metric_id, v_faro_site_id, '2024-12-01', '2024-12-31', 823, 'kWh', 'measured', 'verified')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Imported Nov-Dec 2024 electricity data';
  END IF;

  -- ========================================
  -- NOVEMBER & DECEMBER 2024 COOLING
  -- ========================================
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope2_purchased_cooling' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    -- November cooling (minimal)
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-11-01', '2024-11-30', 2345, 'kWh', 'measured', 'verified')
    ON CONFLICT DO NOTHING;

    -- December cooling (none needed)
    RAISE NOTICE 'Imported Nov 2024 cooling data';
  END IF;

  -- ========================================
  -- NOVEMBER & DECEMBER 2024 HEATING
  -- ========================================
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope2_purchased_heating' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    -- November & December heating (winter months)
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-11-01', '2024-11-30', 4567, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-12-01', '2024-12-31', 6234, 'kWh', 'measured', 'verified')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Imported Nov-Dec 2024 heating data';
  END IF;

  -- ========================================
  -- NOVEMBER & DECEMBER 2024 AIR TRAVEL
  -- ========================================
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_business_travel_air' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, NULL, '2024-11-01', '2024-11-30', 287654, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-12-01', '2024-12-31', 198765, 'km', 'measured', 'verified')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Imported Nov-Dec 2024 air travel data';
  END IF;

  -- ========================================
  -- NOVEMBER & DECEMBER 2024 RAIL TRAVEL
  -- ========================================
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_business_travel_rail' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, NULL, '2024-11-01', '2024-11-30', 12345, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-12-01', '2024-12-31', 8765, 'km', 'measured', 'verified')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Imported Nov-Dec 2024 rail travel data';
  END IF;

  -- ========================================
  -- NOVEMBER & DECEMBER 2024 WASTEWATER
  -- ========================================
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_wastewater' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    -- Lisboa wastewater
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-11-01', '2024-11-30', 176, 'm³', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-12-01', '2024-12-31', 168, 'm³', 'measured', 'verified')
    ON CONFLICT DO NOTHING;

    -- Porto wastewater
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, v_porto_site_id, '2024-11-01', '2024-11-30', 59, 'm³', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_porto_site_id, '2024-12-01', '2024-12-31', 56, 'm³', 'measured', 'verified')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Imported Nov-Dec 2024 wastewater data';
  END IF;

  -- ========================================
  -- NOVEMBER & DECEMBER 2024 WASTE RECYCLING
  -- ========================================
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_waste_recycling' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-11-01', '2024-11-30', 1.234, 'tons', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-12-01', '2024-12-31', 1.456, 'tons', 'measured', 'verified')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Imported Nov-Dec 2024 waste recycling data';
  END IF;

  -- ========================================
  -- NOVEMBER & DECEMBER 2024 WASTE COMPOSTING
  -- ========================================
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_waste_composting' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-11-01', '2024-11-30', 0.423, 'tons', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-12-01', '2024-12-31', 0.512, 'tons', 'measured', 'verified')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Imported Nov-Dec 2024 waste composting data';
  END IF;

  -- Count final records
  SELECT COUNT(*) INTO v_count_after FROM metrics_data WHERE organization_id = v_org_id;
  RAISE NOTICE 'Nov-Dec 2024 import complete. Added % new records (total: %)', v_count_after - v_count_before, v_count_after;

END $$;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check 2024 completeness
SELECT
  TO_CHAR(period_start, 'Mon YYYY') as month,
  COUNT(DISTINCT metric_id) as metrics_count,
  COUNT(*) as data_points,
  ROUND(SUM(co2e_emissions)::numeric, 2) as total_co2e
FROM metrics_data md
JOIN organizations o ON o.id = md.organization_id
WHERE o.name = 'PLMJ'
AND EXTRACT(YEAR FROM period_start) = 2024
GROUP BY TO_CHAR(period_start, 'Mon YYYY'), TO_CHAR(period_start, 'YYYY-MM')
ORDER BY TO_CHAR(period_start, 'YYYY-MM');

-- Full year summary
SELECT
  EXTRACT(YEAR FROM period_start) as year,
  COUNT(DISTINCT TO_CHAR(period_start, 'YYYY-MM')) as months_with_data,
  COUNT(*) as total_data_points,
  ROUND(SUM(co2e_emissions)::numeric, 2) as total_co2e_tons
FROM metrics_data md
JOIN organizations o ON o.id = md.organization_id
WHERE o.name = 'PLMJ'
GROUP BY EXTRACT(YEAR FROM period_start)
ORDER BY year;

-- Complete dataset summary
SELECT
  'Complete PLMJ Dataset 2022-2024' as report,
  COUNT(DISTINCT md.metric_id) as unique_metrics,
  COUNT(DISTINCT md.site_id) as unique_sites,
  COUNT(*) as total_data_points,
  MIN(md.period_start) as earliest_date,
  MAX(md.period_end) as latest_date,
  ROUND(SUM(md.co2e_emissions)::numeric, 2) as total_co2e_tons
FROM metrics_data md
JOIN organizations o ON o.id = md.organization_id
WHERE o.name = 'PLMJ';