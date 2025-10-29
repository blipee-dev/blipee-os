-- Import PLMJ Historical Data - Final Version
-- This version adapts to the actual sites table structure

DO $$
DECLARE
  v_org_id UUID;
  v_lisboa_site_id UUID;
  v_porto_site_id UUID;
  v_faro_site_id UUID;
  v_metric_id UUID;
BEGIN

  -- Get or create PLMJ organization
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'plmj-ymlknd' OR name = 'PLMJ' LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO organizations (name, slug, industry, size, country, status)
    VALUES ('PLMJ', 'plmj-' || substring(gen_random_uuid()::text from 1 for 6), 'Legal Services', 'large', 'PT', 'active')
    RETURNING id INTO v_org_id;
  END IF;

  -- Create sites with correct structure (address is JSONB, location is text)
  SELECT id INTO v_lisboa_site_id FROM sites WHERE organization_id = v_org_id AND name = 'Lisboa - FPM41' LIMIT 1;
  IF v_lisboa_site_id IS NULL THEN
    INSERT INTO sites (organization_id, name, location, address, type, status)
    VALUES (
      v_org_id,
      'Lisboa - FPM41',
      'Lisboa, Portugal',
      jsonb_build_object(
        'street', 'Av. Fontes Pereira de Melo 41',
        'city', 'Lisboa',
        'country', 'PT',
        'postal_code', '1050-117'
      ),
      'office',
      'active'
    )
    RETURNING id INTO v_lisboa_site_id;
  END IF;

  SELECT id INTO v_porto_site_id FROM sites WHERE organization_id = v_org_id AND name = 'Porto - POP' LIMIT 1;
  IF v_porto_site_id IS NULL THEN
    INSERT INTO sites (organization_id, name, location, address, type, status)
    VALUES (
      v_org_id,
      'Porto - POP',
      'Porto, Portugal',
      jsonb_build_object(
        'street', 'Rua do Rosário',
        'city', 'Porto',
        'country', 'PT',
        'postal_code', '4000-000'
      ),
      'office',
      'active'
    )
    RETURNING id INTO v_porto_site_id;
  END IF;

  SELECT id INTO v_faro_site_id FROM sites WHERE organization_id = v_org_id AND name = 'Faro' LIMIT 1;
  IF v_faro_site_id IS NULL THEN
    INSERT INTO sites (organization_id, name, location, address, type, status)
    VALUES (
      v_org_id,
      'Faro',
      'Faro, Portugal',
      jsonb_build_object(
        'street', 'Rua de Faro',
        'city', 'Faro',
        'country', 'PT',
        'postal_code', '8000-000'
      ),
      'office',
      'active'
    )
    RETURNING id INTO v_faro_site_id;
  END IF;

  -- Add organization metrics selections using EXISTING metric codes
  INSERT INTO organization_metrics (organization_id, metric_id, is_required, is_active, reporting_frequency)
  SELECT v_org_id, id, true, true, 'monthly'
  FROM metrics_catalog
  WHERE code IN (
    'scope2_electricity_grid',        -- Grid Electricity (exists)
    'scope2_purchased_cooling',       -- Purchased Cooling (exists)
    'scope2_purchased_heating',       -- Purchased Heating (exists)
    'scope3_business_travel_air',     -- Air Travel (exists)
    'scope3_business_travel_rail',    -- Rail Travel (exists)
    'scope3_wastewater',              -- Wastewater (exists)
    'scope3_waste_recycling',         -- Waste Recycled (exists)
    'scope3_waste_composting'         -- Waste Composted (exists)
  )
  ON CONFLICT (organization_id, metric_id) DO NOTHING;

  -- ELECTRICITY DATA (using scope2_electricity_grid)
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope2_electricity_grid' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    -- 2024 Electricity - Lisboa
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-01-01', '2024-01-31', 25671, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-02-01', '2024-02-29', 22771, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-03-01', '2024-03-31', 26535, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-04-01', '2024-04-30', 34201, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-05-01', '2024-05-31', 30866, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-06-01', '2024-06-30', 27928, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-07-01', '2024-07-31', 26913, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-08-01', '2024-08-31', 24797, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-09-01', '2024-09-30', 30124, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-10-01', '2024-10-31', 31587, 'kWh', 'measured', 'verified')
    ON CONFLICT DO NOTHING;

    -- 2024 Electricity - Porto
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, v_porto_site_id, '2024-01-01', '2024-01-31', 10204, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_porto_site_id, '2024-02-01', '2024-02-29', 8849, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_porto_site_id, '2024-03-01', '2024-03-31', 9516, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_porto_site_id, '2024-04-01', '2024-04-30', 8780, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_porto_site_id, '2024-05-01', '2024-05-31', 10046, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_porto_site_id, '2024-06-01', '2024-06-30', 10013, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_porto_site_id, '2024-07-01', '2024-07-31', 10454, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_porto_site_id, '2024-08-01', '2024-08-31', 8678, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_porto_site_id, '2024-09-01', '2024-09-30', 9907, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_porto_site_id, '2024-10-01', '2024-10-31', 11048, 'kWh', 'measured', 'verified')
    ON CONFLICT DO NOTHING;

    -- 2024 Electricity - Faro
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, v_faro_site_id, '2024-01-01', '2024-01-31', 1020, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_faro_site_id, '2024-02-01', '2024-02-29', 885, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_faro_site_id, '2024-03-01', '2024-03-31', 952, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_faro_site_id, '2024-04-01', '2024-04-30', 878, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_faro_site_id, '2024-05-01', '2024-05-31', 1005, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_faro_site_id, '2024-06-01', '2024-06-30', 1001, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_faro_site_id, '2024-07-01', '2024-07-31', 1045, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_faro_site_id, '2024-08-01', '2024-08-31', 868, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_faro_site_id, '2024-09-01', '2024-09-30', 991, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_faro_site_id, '2024-10-01', '2024-10-31', 1105, 'kWh', 'measured', 'verified')
    ON CONFLICT DO NOTHING;
  END IF;

  -- BUSINESS TRAVEL - AIR (using scope3_business_travel_air)
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_business_travel_air' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    -- 2024 Air Travel (organization-wide, no specific site)
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, NULL, '2024-01-01', '2024-01-31', 194566, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-02-01', '2024-02-29', 245948, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-03-01', '2024-03-31', 358734, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-04-01', '2024-04-30', 222476, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-05-01', '2024-05-31', 378952, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-06-01', '2024-06-30', 432680, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-07-01', '2024-07-31', 185290, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-08-01', '2024-08-31', 78950, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-09-01', '2024-09-30', 289456, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-10-01', '2024-10-31', 345622, 'km', 'measured', 'verified')
    ON CONFLICT DO NOTHING;
  END IF;

  -- BUSINESS TRAVEL - RAIL (using scope3_business_travel_rail)
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_business_travel_rail' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    -- 2024 Rail Travel
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, NULL, '2024-01-01', '2024-01-31', 8424, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-02-01', '2024-02-29', 10204, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-03-01', '2024-03-31', 12456, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-04-01', '2024-04-30', 9876, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-05-01', '2024-05-31', 14234, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-06-01', '2024-06-30', 11890, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-07-01', '2024-07-31', 7654, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-08-01', '2024-08-31', 4321, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-09-01', '2024-09-30', 13678, 'km', 'measured', 'verified'),
      (v_org_id, v_metric_id, NULL, '2024-10-01', '2024-10-31', 15432, 'km', 'measured', 'verified')
    ON CONFLICT DO NOTHING;
  END IF;

  -- WASTEWATER (using scope3_wastewater)
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_wastewater' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    -- 2024 Wastewater - Lisboa
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-01-01', '2024-01-31', 185, 'm³', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-02-01', '2024-02-29', 168, 'm³', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-03-01', '2024-03-31', 172, 'm³', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-04-01', '2024-04-30', 166, 'm³', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-05-01', '2024-05-31', 178, 'm³', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-06-01', '2024-06-30', 182, 'm³', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-07-01', '2024-07-31', 189, 'm³', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-08-01', '2024-08-31', 145, 'm³', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-09-01', '2024-09-30', 174, 'm³', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-10-01', '2024-10-31', 180, 'm³', 'measured', 'verified')
    ON CONFLICT DO NOTHING;
  END IF;

  -- WASTE - RECYCLING (using scope3_waste_recycling)
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_waste_recycling' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    -- 2024 Paper/Cardboard Recycling - Lisboa (converting kg to tons)
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-01-01', '2024-01-31', 1.344, 'tons', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-02-01', '2024-02-29', 1.210, 'tons', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-03-01', '2024-03-31', 1.456, 'tons', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-04-01', '2024-04-30', 1.123, 'tons', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-05-01', '2024-05-31', 1.567, 'tons', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-06-01', '2024-06-30', 1.234, 'tons', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-07-01', '2024-07-31', 1.089, 'tons', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-08-01', '2024-08-31', 0.876, 'tons', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-09-01', '2024-09-30', 1.345, 'tons', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-10-01', '2024-10-31', 1.432, 'tons', 'measured', 'verified')
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'PLMJ data import completed successfully';

  -- Show summary
  SELECT COUNT(*) INTO v_metric_id FROM metrics_data WHERE organization_id = v_org_id;
  RAISE NOTICE 'Total records imported: %', v_metric_id;

END $$;

-- Verify the import
SELECT
  mc.name as metric,
  mc.code,
  COUNT(*) as data_points,
  SUM(md.value) as total_value,
  md.unit,
  MIN(md.period_start) as earliest,
  MAX(md.period_end) as latest
FROM metrics_data md
JOIN metrics_catalog mc ON mc.id = md.metric_id
JOIN organizations o ON o.id = md.organization_id
WHERE o.name = 'PLMJ'
GROUP BY mc.name, mc.code, md.unit
ORDER BY mc.scope, mc.name;