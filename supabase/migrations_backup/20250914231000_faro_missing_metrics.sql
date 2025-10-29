-- Import missing metrics for Faro site
-- Adds: Wastewater, Waste Recycled, Waste Composted

DO $$
DECLARE
  v_org_id UUID;
  v_faro_id UUID;
  v_wastewater_id UUID;
  v_waste_recycled_id UUID;
  v_waste_composted_id UUID;
BEGIN
  -- Get PLMJ organization
  SELECT id INTO v_org_id FROM organizations WHERE name = 'PLMJ' LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'PLMJ organization not found';
    RETURN;
  END IF;

  -- Get Faro site
  SELECT id INTO v_faro_id FROM sites
  WHERE organization_id = v_org_id AND name = 'Faro' LIMIT 1;

  IF v_faro_id IS NULL THEN
    RAISE NOTICE 'Faro site not found';
    RETURN;
  END IF;

  -- Get metric IDs
  SELECT id INTO v_wastewater_id FROM metrics_catalog WHERE code = 'scope3_wastewater';
  SELECT id INTO v_waste_recycled_id FROM metrics_catalog WHERE code = 'scope3_waste_recycling';
  SELECT id INTO v_waste_composted_id FROM metrics_catalog WHERE code = 'scope3_waste_composting';

  RAISE NOTICE 'Importing missing metrics for Faro';

  -- Import Wastewater for Faro (2024)
  IF v_wastewater_id IS NOT NULL THEN
    DELETE FROM metrics_data
    WHERE organization_id = v_org_id
      AND site_id = v_faro_id
      AND metric_id = v_wastewater_id
      AND period_start >= '2024-01-01'
      AND period_start <= '2024-12-31';

    INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
    VALUES
    (v_org_id, v_faro_id, v_wastewater_id, '2024-01-01', '2024-01-31', 3.2, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_wastewater_id, '2024-02-01', '2024-02-29', 3.5, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_wastewater_id, '2024-03-01', '2024-03-31', 3.3, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_wastewater_id, '2024-04-01', '2024-04-30', 3.8, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_wastewater_id, '2024-05-01', '2024-05-31', 3.6, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_wastewater_id, '2024-06-01', '2024-06-30', 3.4, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_wastewater_id, '2024-07-01', '2024-07-31', 3.1, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_wastewater_id, '2024-08-01', '2024-08-31', 2.8, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_wastewater_id, '2024-09-01', '2024-09-30', 3.5, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_wastewater_id, '2024-10-01', '2024-10-31', 3.7, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_wastewater_id, '2024-11-01', '2024-11-30', 3.4, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_wastewater_id, '2024-12-01', '2024-12-31', 3.2, 'm3', 'measured', auth.uid());
  END IF;

  -- Import Waste Recycled for Faro (2024)
  IF v_waste_recycled_id IS NOT NULL THEN
    DELETE FROM metrics_data
    WHERE organization_id = v_org_id
      AND site_id = v_faro_id
      AND metric_id = v_waste_recycled_id
      AND period_start >= '2024-01-01'
      AND period_start <= '2024-12-31';

    INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
    VALUES
    (v_org_id, v_faro_id, v_waste_recycled_id, '2024-01-01', '2024-01-31', 42, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_recycled_id, '2024-02-01', '2024-02-29', 48, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_recycled_id, '2024-03-01', '2024-03-31', 45, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_recycled_id, '2024-04-01', '2024-04-30', 51, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_recycled_id, '2024-05-01', '2024-05-31', 47, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_recycled_id, '2024-06-01', '2024-06-30', 44, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_recycled_id, '2024-07-01', '2024-07-31', 40, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_recycled_id, '2024-08-01', '2024-08-31', 35, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_recycled_id, '2024-09-01', '2024-09-30', 46, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_recycled_id, '2024-10-01', '2024-10-31', 52, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_recycled_id, '2024-11-01', '2024-11-30', 49, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_recycled_id, '2024-12-01', '2024-12-31', 43, 'kg', 'measured', auth.uid());
  END IF;

  -- Import Waste Composted for Faro (2024)
  IF v_waste_composted_id IS NOT NULL THEN
    DELETE FROM metrics_data
    WHERE organization_id = v_org_id
      AND site_id = v_faro_id
      AND metric_id = v_waste_composted_id
      AND period_start >= '2024-01-01'
      AND period_start <= '2024-12-31';

    INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
    VALUES
    (v_org_id, v_faro_id, v_waste_composted_id, '2024-01-01', '2024-01-31', 15, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_composted_id, '2024-02-01', '2024-02-29', 18, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_composted_id, '2024-03-01', '2024-03-31', 16, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_composted_id, '2024-04-01', '2024-04-30', 20, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_composted_id, '2024-05-01', '2024-05-31', 17, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_composted_id, '2024-06-01', '2024-06-30', 16, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_composted_id, '2024-07-01', '2024-07-31', 14, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_composted_id, '2024-08-01', '2024-08-31', 12, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_composted_id, '2024-09-01', '2024-09-30', 17, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_composted_id, '2024-10-01', '2024-10-31', 19, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_composted_id, '2024-11-01', '2024-11-30', 18, 'kg', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_waste_composted_id, '2024-12-01', '2024-12-31', 15, 'kg', 'measured', auth.uid());
  END IF;

  RAISE NOTICE 'Faro missing metrics import complete';
END $$;