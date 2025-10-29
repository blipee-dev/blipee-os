-- Import missing PLMJ travel data (Air Travel and Rail Travel)
-- This data was in the raw data but never imported

DO $$
DECLARE
  v_org_id UUID;
  v_lisboa_id UUID;
  v_air_travel_id UUID;
  v_rail_travel_id UUID;
BEGIN
  -- Get PLMJ organization
  SELECT id INTO v_org_id FROM organizations WHERE name = 'PLMJ' LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'PLMJ organization not found';
    RETURN;
  END IF;

  -- Get Lisboa site
  SELECT id INTO v_lisboa_id FROM sites 
  WHERE organization_id = v_org_id AND name = 'Lisboa - FPM41' LIMIT 1;

  -- Get metric IDs (using correct codes from database)
  SELECT id INTO v_air_travel_id FROM metrics_catalog WHERE code = 'scope3_business_travel_air';
  SELECT id INTO v_rail_travel_id FROM metrics_catalog WHERE code = 'scope3_business_travel_rail';

  IF v_air_travel_id IS NULL OR v_rail_travel_id IS NULL THEN
    RAISE NOTICE 'Travel metrics not found in catalog';
    RETURN;
  END IF;

  RAISE NOTICE 'Importing travel data for Lisboa';
  RAISE NOTICE 'Air Travel metric: %', v_air_travel_id;
  RAISE NOTICE 'Rail Travel metric: %', v_rail_travel_id;

  -- Delete existing 2024 Air Travel data for Lisboa (if any)
  DELETE FROM metrics_data
  WHERE organization_id = v_org_id
    AND site_id = v_lisboa_id
    AND metric_id = v_air_travel_id
    AND period_start >= '2024-01-01'
    AND period_start <= '2024-12-31';

  -- Import 2024 Air Travel data for Lisboa
  INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
  VALUES
  (v_org_id, v_lisboa_id, v_air_travel_id, '2024-01-01', '2024-01-31', 49862, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2024-02-01', '2024-02-29', 104723, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2024-03-01', '2024-03-31', 212473, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2024-04-01', '2024-04-30', 168211, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2024-05-01', '2024-05-31', 343110, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2024-06-01', '2024-06-30', 114616, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2024-07-01', '2024-07-31', 12204, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2024-08-01', '2024-08-31', 21041, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2024-09-01', '2024-09-30', 417804, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2024-10-01', '2024-10-31', 371677, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2024-11-01', '2024-11-30', 252137, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2024-12-01', '2024-12-31', 174263, 'km', 'measured', auth.uid());

  -- Delete existing 2024 Rail Travel data for Lisboa (if any)
  DELETE FROM metrics_data
  WHERE organization_id = v_org_id
    AND site_id = v_lisboa_id
    AND metric_id = v_rail_travel_id
    AND period_start >= '2024-01-01'
    AND period_start <= '2024-12-31';

  -- Import 2024 Rail Travel data for Lisboa
  INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
  VALUES
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2024-01-01', '2024-01-31', 1917, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2024-02-01', '2024-02-29', 4645, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2024-03-01', '2024-03-31', 5957, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2024-04-01', '2024-04-30', 998, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2024-05-01', '2024-05-31', 7213, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2024-06-01', '2024-06-30', 3732, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2024-07-01', '2024-07-31', 7455, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2024-08-01', '2024-08-31', 0, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2024-09-01', '2024-09-30', 3743, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2024-10-01', '2024-10-31', 5299, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2024-11-01', '2024-11-30', 3448, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2024-12-01', '2024-12-31', 6829, 'km', 'measured', auth.uid());

  -- Delete existing 2023 Air Travel data for Lisboa (if any)
  DELETE FROM metrics_data
  WHERE organization_id = v_org_id
    AND site_id = v_lisboa_id
    AND metric_id = v_air_travel_id
    AND period_start >= '2023-01-01'
    AND period_start <= '2023-12-31';

  -- Import 2023 Air Travel data
  INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
  VALUES
  (v_org_id, v_lisboa_id, v_air_travel_id, '2023-01-01', '2023-01-31', 16301, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2023-02-01', '2023-02-28', 72743, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2023-03-01', '2023-03-31', 17728, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2023-04-01', '2023-04-30', 15554, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2023-05-01', '2023-05-31', 127790, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2023-06-01', '2023-06-30', 82093, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2023-07-01', '2023-07-31', 72972, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2023-08-01', '2023-08-31', 2520, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2023-09-01', '2023-09-30', 96228, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2023-10-01', '2023-10-31', 84456, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2023-11-01', '2023-11-30', 109725, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_air_travel_id, '2023-12-01', '2023-12-31', 116077, 'km', 'measured', auth.uid());

  -- Delete existing 2023 Rail Travel data for Lisboa (if any)
  DELETE FROM metrics_data
  WHERE organization_id = v_org_id
    AND site_id = v_lisboa_id
    AND metric_id = v_rail_travel_id
    AND period_start >= '2023-01-01'
    AND period_start <= '2023-12-31';

  -- Import 2023 Rail Travel data
  INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
  VALUES
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2023-01-01', '2023-01-31', 3606, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2023-02-01', '2023-02-28', 1276, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2023-03-01', '2023-03-31', 1930, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2023-04-01', '2023-04-30', 550, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2023-05-01', '2023-05-31', 0, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2023-06-01', '2023-06-30', 3095, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2023-07-01', '2023-07-31', 3095, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2023-08-01', '2023-08-31', 1075, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2023-09-01', '2023-09-30', 5095, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2023-10-01', '2023-10-31', 3402, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2023-11-01', '2023-11-30', 8774, 'km', 'measured', auth.uid()),
  (v_org_id, v_lisboa_id, v_rail_travel_id, '2023-12-01', '2023-12-31', 3987, 'km', 'measured', auth.uid());

  RAISE NOTICE 'Travel data import complete';
END $$;