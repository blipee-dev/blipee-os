-- Import missing EV Charging, Water Supply, and additional Waste data for PLMJ

DO $$
DECLARE
  v_org_id UUID;
  v_lisboa_id UUID;
  v_porto_id UUID;
  v_faro_id UUID;
  v_ev_charging_id UUID;
  v_water_supply_id UUID;
  v_waste_landfill_id UUID;
  v_waste_energy_id UUID;
  v_ewaste_id UUID;
BEGIN
  -- Get PLMJ organization
  SELECT id INTO v_org_id FROM organizations WHERE name = 'PLMJ' LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'PLMJ organization not found';
    RETURN;
  END IF;

  -- Get sites
  SELECT id INTO v_lisboa_id FROM sites WHERE organization_id = v_org_id AND name = 'Lisboa - FPM41' LIMIT 1;
  SELECT id INTO v_porto_id FROM sites WHERE organization_id = v_org_id AND name = 'Porto - POP' LIMIT 1;
  SELECT id INTO v_faro_id FROM sites WHERE organization_id = v_org_id AND name = 'Faro' LIMIT 1;

  -- Get metric IDs (using correct codes)
  SELECT id INTO v_ev_charging_id FROM metrics_catalog WHERE code = 'scope2_ev_charging';
  SELECT id INTO v_water_supply_id FROM metrics_catalog WHERE code = 'scope3_water_supply';
  SELECT id INTO v_waste_landfill_id FROM metrics_catalog WHERE code = 'scope3_waste_landfill';
  SELECT id INTO v_waste_energy_id FROM metrics_catalog WHERE code = 'scope3_waste_incineration';
  SELECT id INTO v_ewaste_id FROM metrics_catalog WHERE code = 'scope3_waste_ewaste';

  RAISE NOTICE 'Starting import of EV, Water and Waste data';

  -- Import EV Charging data for Lisboa (2024 only)
  IF v_ev_charging_id IS NOT NULL THEN
    -- Delete existing EV Charging data
    DELETE FROM metrics_data
    WHERE organization_id = v_org_id
      AND site_id = v_lisboa_id
      AND metric_id = v_ev_charging_id
      AND period_start >= '2024-01-01'
      AND period_start <= '2024-12-31';

    INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
    VALUES
    (v_org_id, v_lisboa_id, v_ev_charging_id, '2024-01-01', '2024-01-31', 2593.4, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ev_charging_id, '2024-02-01', '2024-02-29', 2139.3, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ev_charging_id, '2024-03-01', '2024-03-31', 2376.1, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ev_charging_id, '2024-04-01', '2024-04-30', 2611.2, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ev_charging_id, '2024-05-01', '2024-05-31', 2475.2, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ev_charging_id, '2024-06-01', '2024-06-30', 1944.1, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ev_charging_id, '2024-07-01', '2024-07-31', 2357.2, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ev_charging_id, '2024-08-01', '2024-08-31', 1806.2, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ev_charging_id, '2024-09-01', '2024-09-30', 3079.7, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ev_charging_id, '2024-10-01', '2024-10-31', 2063.6, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ev_charging_id, '2024-11-01', '2024-11-30', 1822.3, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ev_charging_id, '2024-12-01', '2024-12-31', 1785.6, 'kWh', 'measured', auth.uid())
;

    -- Delete existing EV Charging data for Porto
    DELETE FROM metrics_data
    WHERE organization_id = v_org_id
      AND site_id = v_porto_id
      AND metric_id = v_ev_charging_id
      AND period_start >= '2024-01-01'
      AND period_start <= '2024-12-31';

    -- Import EV Charging data for Porto (2024 only)
    INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
    VALUES
    (v_org_id, v_porto_id, v_ev_charging_id, '2024-01-01', '2024-01-31', 455.3, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_ev_charging_id, '2024-02-01', '2024-02-29', 361.7, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_ev_charging_id, '2024-03-01', '2024-03-31', 318.6, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_ev_charging_id, '2024-04-01', '2024-04-30', 341.0, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_ev_charging_id, '2024-05-01', '2024-05-31', 313.5, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_ev_charging_id, '2024-06-01', '2024-06-30', 372.9, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_ev_charging_id, '2024-07-01', '2024-07-31', 345.4, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_ev_charging_id, '2024-08-01', '2024-08-31', 146.8, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_ev_charging_id, '2024-09-01', '2024-09-30', 368.0, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_ev_charging_id, '2024-10-01', '2024-10-31', 489.8, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_ev_charging_id, '2024-11-01', '2024-11-30', 579.6, 'kWh', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_ev_charging_id, '2024-12-01', '2024-12-31', 450.9, 'kWh', 'measured', auth.uid())
;
  END IF;

  -- Import Water Supply data for Lisboa (combining human consumption + sanitary)
  IF v_water_supply_id IS NOT NULL THEN
    -- Delete existing Water Supply data
    DELETE FROM metrics_data
    WHERE organization_id = v_org_id
      AND site_id = v_lisboa_id
      AND metric_id = v_water_supply_id
      AND period_start >= '2024-01-01'
      AND period_start <= '2024-12-31';

    INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
    VALUES
    -- 2024 data
    (v_org_id, v_lisboa_id, v_water_supply_id, '2024-01-01', '2024-01-31', 37.1, 'm3', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_water_supply_id, '2024-02-01', '2024-02-29', 31.1, 'm3', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_water_supply_id, '2024-03-01', '2024-03-31', 36.9, 'm3', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_water_supply_id, '2024-04-01', '2024-04-30', 31.6, 'm3', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_water_supply_id, '2024-05-01', '2024-05-31', 36.6, 'm3', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_water_supply_id, '2024-06-01', '2024-06-30', 32.4, 'm3', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_water_supply_id, '2024-07-01', '2024-07-31', 37.7, 'm3', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_water_supply_id, '2024-08-01', '2024-08-31', 24.3, 'm3', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_water_supply_id, '2024-09-01', '2024-09-30', 38.8, 'm3', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_water_supply_id, '2024-10-01', '2024-10-31', 24.3, 'm3', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_water_supply_id, '2024-11-01', '2024-11-30', 42.0, 'm3', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_water_supply_id, '2024-12-01', '2024-12-31', 31.5, 'm3', 'measured', auth.uid())
;

    -- Delete existing Water Supply data for Porto
    DELETE FROM metrics_data
    WHERE organization_id = v_org_id
      AND site_id = v_porto_id
      AND metric_id = v_water_supply_id
      AND period_start >= '2024-01-01'
      AND period_start <= '2024-12-31';

    -- Water Supply for Porto
    INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
    VALUES
    (v_org_id, v_porto_id, v_water_supply_id, '2024-01-01', '2024-01-31', 8.0, 'm3', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_water_supply_id, '2024-02-01', '2024-02-29', 10.0, 'm3', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_water_supply_id, '2024-03-01', '2024-03-31', 12.0, 'm3', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_water_supply_id, '2024-04-01', '2024-04-30', 15.0, 'm3', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_water_supply_id, '2024-05-01', '2024-05-31', 9.0, 'm3', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_water_supply_id, '2024-06-01', '2024-06-30', 15.0, 'm3', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_water_supply_id, '2024-07-01', '2024-07-31', 14.0, 'm3', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_water_supply_id, '2024-08-01', '2024-08-31', 11.0, 'm3', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_water_supply_id, '2024-09-01', '2024-09-30', 12.0, 'm3', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_water_supply_id, '2024-10-01', '2024-10-31', 10.1, 'm3', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_water_supply_id, '2024-11-01', '2024-11-30', 11.3, 'm3', 'measured', auth.uid()),
    (v_org_id, v_porto_id, v_water_supply_id, '2024-12-01', '2024-12-31', 9.7, 'm3', 'measured', auth.uid())
;

    -- Delete existing Water Supply data for Faro
    DELETE FROM metrics_data
    WHERE organization_id = v_org_id
      AND site_id = v_faro_id
      AND metric_id = v_water_supply_id
      AND period_start >= '2024-01-01'
      AND period_start <= '2024-12-31';

    -- Water Supply for Faro
    INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
    VALUES
    (v_org_id, v_faro_id, v_water_supply_id, '2024-01-01', '2024-01-31', 6, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_water_supply_id, '2024-02-01', '2024-02-29', 6, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_water_supply_id, '2024-03-01', '2024-03-31', 8, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_water_supply_id, '2024-04-01', '2024-04-30', 10, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_water_supply_id, '2024-05-01', '2024-05-31', 6, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_water_supply_id, '2024-06-01', '2024-06-30', 10, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_water_supply_id, '2024-07-01', '2024-07-31', 10, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_water_supply_id, '2024-08-01', '2024-08-31', 7, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_water_supply_id, '2024-09-01', '2024-09-30', 8, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_water_supply_id, '2024-10-01', '2024-10-31', 8, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_water_supply_id, '2024-11-01', '2024-11-30', 10, 'm3', 'measured', auth.uid()),
    (v_org_id, v_faro_id, v_water_supply_id, '2024-12-01', '2024-12-31', 4, 'm3', 'measured', auth.uid())
;
  END IF;

  -- Import additional waste data for Lisboa (Construction/Landfill, Bulky/Energy, E-waste)
  IF v_waste_landfill_id IS NOT NULL THEN
    -- Delete existing Waste Landfill data
    DELETE FROM metrics_data
    WHERE organization_id = v_org_id
      AND site_id = v_lisboa_id
      AND metric_id = v_waste_landfill_id
      AND period_start >= '2024-01-01'
      AND period_start <= '2024-12-31';

    -- Construction waste (CON values from raw data)
    INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
    VALUES
    (v_org_id, v_lisboa_id, v_waste_landfill_id, '2024-01-01', '2024-01-31', 670.00, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_waste_landfill_id, '2024-02-01', '2024-02-29', 670.00, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_waste_landfill_id, '2024-03-01', '2024-03-31', 670.00, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_waste_landfill_id, '2024-04-01', '2024-04-30', 670.00, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_waste_landfill_id, '2024-05-01', '2024-05-31', 670.00, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_waste_landfill_id, '2024-06-01', '2024-06-30', 670.00, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_waste_landfill_id, '2024-07-01', '2024-07-31', 670.00, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_waste_landfill_id, '2024-08-01', '2024-08-31', 670.00, 'kg', 'measured', auth.uid())
;
  END IF;

  IF v_waste_energy_id IS NOT NULL THEN
    -- Delete existing Waste to Energy data
    DELETE FROM metrics_data
    WHERE organization_id = v_org_id
      AND site_id = v_lisboa_id
      AND metric_id = v_waste_energy_id
      AND period_start >= '2024-01-01'
      AND period_start <= '2024-12-31';

    -- Bulky waste (VOL values from raw data)
    INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
    VALUES
    (v_org_id, v_lisboa_id, v_waste_energy_id, '2024-01-01', '2024-01-31', 467.50, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_waste_energy_id, '2024-02-01', '2024-02-29', 467.50, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_waste_energy_id, '2024-03-01', '2024-03-31', 467.50, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_waste_energy_id, '2024-04-01', '2024-04-30', 467.50, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_waste_energy_id, '2024-05-01', '2024-05-31', 467.50, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_waste_energy_id, '2024-06-01', '2024-06-30', 467.50, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_waste_energy_id, '2024-07-01', '2024-07-31', 467.50, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_waste_energy_id, '2024-08-01', '2024-08-31', 467.50, 'kg', 'measured', auth.uid())
;
  END IF;

  IF v_ewaste_id IS NOT NULL THEN
    -- Delete existing E-Waste data
    DELETE FROM metrics_data
    WHERE organization_id = v_org_id
      AND site_id = v_lisboa_id
      AND metric_id = v_ewaste_id
      AND period_start >= '2024-01-01'
      AND period_start <= '2024-12-31';

    -- E-waste (ELE/DVD values from raw data)
    INSERT INTO metrics_data (organization_id, site_id, metric_id, period_start, period_end, value, unit, data_quality, created_by)
    VALUES
    (v_org_id, v_lisboa_id, v_ewaste_id, '2024-01-01', '2024-01-31', 10.91, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ewaste_id, '2024-02-01', '2024-02-29', 10.91, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ewaste_id, '2024-03-01', '2024-03-31', 10.91, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ewaste_id, '2024-04-01', '2024-04-30', 10.91, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ewaste_id, '2024-05-01', '2024-05-31', 10.91, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ewaste_id, '2024-06-01', '2024-06-30', 10.91, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ewaste_id, '2024-07-01', '2024-07-31', 10.91, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ewaste_id, '2024-08-01', '2024-08-31', 10.91, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ewaste_id, '2024-09-01', '2024-09-30', 9.83, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ewaste_id, '2024-10-01', '2024-10-31', 9.83, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ewaste_id, '2024-11-01', '2024-11-30', 9.83, 'kg', 'measured', auth.uid()),
    (v_org_id, v_lisboa_id, v_ewaste_id, '2024-12-01', '2024-12-31', 9.83, 'kg', 'measured', auth.uid())
;
  END IF;

  RAISE NOTICE 'EV, Water and Waste data import complete';
END $$;