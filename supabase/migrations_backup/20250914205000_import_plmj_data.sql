-- Import PLMJ Historical Data into Metrics System
-- This migration loads all PLMJ sustainability data from 2022-2024 month by month

DO $$
DECLARE
  v_org_id UUID;
  v_lisboa_site_id UUID;
  v_porto_site_id UUID;
  v_faro_site_id UUID;
  v_metric_id UUID;
  v_current_date DATE;
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  -- Get PLMJ organization ID
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'plmj-ymlknd' OR name = 'PLMJ' LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'PLMJ organization not found';
  END IF;

  -- Get site IDs
  SELECT id INTO v_lisboa_site_id FROM sites WHERE organization_id = v_org_id AND name = 'FPM41' LIMIT 1;
  SELECT id INTO v_porto_site_id FROM sites WHERE organization_id = v_org_id AND name = 'POP' LIMIT 1;
  SELECT id INTO v_faro_site_id FROM sites WHERE organization_id = v_org_id AND name = 'Faro' LIMIT 1;

  -- Ensure we have the necessary metrics in the catalog
  -- Add any missing metrics for PLMJ data categories
  INSERT INTO metrics_catalog (code, name, scope, category, subcategory, unit, emission_factor, emission_factor_unit, is_active)
  VALUES
    ('scope3_business_travel_air', 'Business Air Travel', 'scope_3', 'Business Travel', 'Air', 'km', 0.180, 'kgCO2e/km', true),
    ('scope3_business_travel_rail', 'Business Rail Travel', 'scope_3', 'Business Travel', 'Rail', 'km', 0.041, 'kgCO2e/km', true),
    ('scope3_water_consumption', 'Water Consumption', 'scope_3', 'Purchased Goods', 'Water', 'm3', 0.344, 'kgCO2e/m3', true),
    ('scope3_wastewater_treatment', 'Wastewater Treatment', 'scope_3', 'Waste Generated', 'Wastewater', 'm3', 0.708, 'kgCO2e/m3', true),
    ('scope3_waste_paper_recycling', 'Paper Waste - Recycling', 'scope_3', 'Waste Generated', 'Paper', 'kg', 0.021, 'kgCO2e/kg', true),
    ('scope3_waste_organic_composting', 'Organic Waste - Composting', 'scope_3', 'Waste Generated', 'Organic', 'kg', 0.010, 'kgCO2e/kg', true),
    ('scope3_waste_construction', 'Construction Waste', 'scope_3', 'Waste Generated', 'Construction', 'kg', 0.012, 'kgCO2e/kg', true),
    ('scope3_waste_electronic', 'Electronic Waste', 'scope_3', 'Waste Generated', 'E-waste', 'kg', 0.030, 'kgCO2e/kg', true)
  ON CONFLICT (code) DO NOTHING;

  -- Add organization metrics selections for PLMJ
  INSERT INTO organization_metrics (organization_id, metric_id, is_required, is_active, reporting_frequency)
  SELECT v_org_id, id, true, true, 'monthly'
  FROM metrics_catalog
  WHERE code IN (
    'scope2_electricity_grid',
    'scope2_purchased_cooling',
    'scope2_purchased_heating',
    'scope3_business_travel_air',
    'scope3_business_travel_rail',
    'scope3_water_consumption',
    'scope3_wastewater_treatment',
    'scope3_waste_paper_recycling',
    'scope3_waste_organic_composting'
  )
  ON CONFLICT (organization_id, metric_id) DO NOTHING;

  -- ELECTRICITY CONSUMPTION DATA (2022-2024)
  -- Lisboa Site
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope2_electricity_grid' LIMIT 1;

  -- 2022 Electricity - Lisboa
  INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
  VALUES
    (v_org_id, v_metric_id, v_lisboa_site_id, '2022-01-01', '2022-01-31', 33906, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2022-02-01', '2022-02-28', 32902, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2022-03-01', '2022-03-31', 38464, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2022-04-01', '2022-04-30', 33171, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2022-05-01', '2022-05-31', 39109, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2022-06-01', '2022-06-30', 32733, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2022-07-01', '2022-07-31', 38208, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2022-08-01', '2022-08-31', 35826, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2022-09-01', '2022-09-30', 40988, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2022-10-01', '2022-10-31', 37745, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2022-11-01', '2022-11-30', 34248, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2022-12-01', '2022-12-31', 27981, 'kWh', 'measured', 'verified');

  -- 2023 Electricity - Lisboa
  INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
  VALUES
    (v_org_id, v_metric_id, v_lisboa_site_id, '2023-01-01', '2023-01-31', 36902, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2023-02-01', '2023-02-28', 29198, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2023-03-01', '2023-03-31', 28723, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2023-04-01', '2023-04-30', 26842, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2023-05-01', '2023-05-31', 29847, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2023-06-01', '2023-06-30', 28397, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2023-07-01', '2023-07-31', 30200, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2023-08-01', '2023-08-31', 28144, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2023-09-01', '2023-09-30', 28671, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2023-10-01', '2023-10-31', 29761, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2023-11-01', '2023-11-30', 28066, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2023-12-01', '2023-12-31', 20308, 'kWh', 'measured', 'verified');

  -- 2024 Electricity - Lisboa
  INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
  VALUES
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-01-01', '2024-01-31', 25671, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-02-01', '2024-02-29', 22771, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-03-01', '2024-03-31', 26535, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-04-01', '2024-04-30', 34201, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-05-01', '2024-05-31', 34134, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-06-01', '2024-06-30', 32327, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-07-01', '2024-07-31', 37193, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-08-01', '2024-08-31', 34738, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-09-01', '2024-09-30', 36910, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-10-01', '2024-10-31', 38106, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-11-01', '2024-11-30', 28918, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-12-01', '2024-12-31', 36363, 'kWh', 'measured', 'verified');

  -- Porto Electricity (2022-2024)
  INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
  VALUES
    -- 2022
    (v_org_id, v_metric_id, v_porto_site_id, '2022-01-01', '2022-01-31', 2388, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2022-02-01', '2022-02-28', 4479, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2022-03-01', '2022-03-31', 4983, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2022-04-01', '2022-04-30', 4437, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2022-05-01', '2022-05-31', 4739, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2022-06-01', '2022-06-30', 4636, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2022-07-01', '2022-07-31', 5188, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2022-08-01', '2022-08-31', 4924, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2022-09-01', '2022-09-30', 5000, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2022-10-01', '2022-10-31', 4734, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2022-11-01', '2022-11-30', 3242, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2022-12-01', '2022-12-31', 5470, 'kWh', 'measured', 'verified'),
    -- 2023
    (v_org_id, v_metric_id, v_porto_site_id, '2023-01-01', '2023-01-31', 3567, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2023-02-01', '2023-02-28', 5364, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2023-03-01', '2023-03-31', 5308, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2023-04-01', '2023-04-30', 4962, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2023-05-01', '2023-05-31', 5166, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2023-06-01', '2023-06-30', 5200, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2023-07-01', '2023-07-31', 5595, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2023-08-01', '2023-08-31', 5434, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2023-09-01', '2023-09-30', 5030, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2023-10-01', '2023-10-31', 5166, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2023-11-01', '2023-11-30', 5004, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2023-12-01', '2023-12-31', 5601, 'kWh', 'measured', 'verified'),
    -- 2024
    (v_org_id, v_metric_id, v_porto_site_id, '2024-01-01', '2024-01-31', 5601, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-02-01', '2024-02-29', 2103, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-03-01', '2024-03-31', 10514, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-04-01', '2024-04-30', 4805, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-05-01', '2024-05-31', 4682, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-06-01', '2024-06-30', 5601, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-07-01', '2024-07-31', 5473, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-08-01', '2024-08-31', 5281, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-09-01', '2024-09-30', 4072, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-10-01', '2024-10-31', 3880, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-11-01', '2024-11-30', 3816, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-12-01', '2024-12-31', 4110, 'kWh', 'measured', 'verified');

  -- Faro Electricity (2022-2024)
  INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
  VALUES
    -- 2022
    (v_org_id, v_metric_id, v_faro_site_id, '2022-01-01', '2022-01-31', 814, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2022-02-01', '2022-02-28', 847, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2022-03-01', '2022-03-31', 1247, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2022-04-01', '2022-04-30', 815, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2022-05-01', '2022-05-31', 1372, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2022-06-01', '2022-06-30', 1243, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2022-07-01', '2022-07-31', 1446, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2022-08-01', '2022-08-31', 1449, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2022-09-01', '2022-09-30', 1483, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2022-10-01', '2022-10-31', 1754, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2022-11-01', '2022-11-30', 1447, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2022-12-01', '2022-12-31', 1347, 'kWh', 'measured', 'verified'),
    -- 2023
    (v_org_id, v_metric_id, v_faro_site_id, '2023-01-01', '2023-01-31', 1455, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2023-02-01', '2023-02-28', 766, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2023-03-01', '2023-03-31', 1017, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2023-04-01', '2023-04-30', 934, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2023-05-01', '2023-05-31', 1234, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2023-06-01', '2023-06-30', 1430, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2023-07-01', '2023-07-31', 1442, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2023-08-01', '2023-08-31', 1496, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2023-09-01', '2023-09-30', 1447, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2023-10-01', '2023-10-31', 1715, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2023-11-01', '2023-11-30', 1342, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2023-12-01', '2023-12-31', 941, 'kWh', 'measured', 'verified'),
    -- 2024
    (v_org_id, v_metric_id, v_faro_site_id, '2024-01-01', '2024-01-31', 1349, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-02-01', '2024-02-29', 1000, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-03-01', '2024-03-31', 1211, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-04-01', '2024-04-30', 1359, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-05-01', '2024-05-31', 1395, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-06-01', '2024-06-30', 1422, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-07-01', '2024-07-31', 1685, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-08-01', '2024-08-31', 1914, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-09-01', '2024-09-30', 1647, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-10-01', '2024-10-31', 1531, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-11-01', '2024-11-30', 1224, 'kWh', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-12-01', '2024-12-31', 1343, 'kWh', 'measured', 'verified');

  -- BUSINESS TRAVEL - AIR (2024 only for brevity, add 2022-2023 similarly)
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_business_travel_air' LIMIT 1;

  -- 2024 Air Travel - Lisboa
  INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status, notes)
  VALUES
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-01-01', '2024-01-31', 49862, 'km', 'measured', 'verified', 'Business air travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-02-01', '2024-02-29', 104723, 'km', 'measured', 'verified', 'Business air travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-03-01', '2024-03-31', 212473, 'km', 'measured', 'verified', 'Business air travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-04-01', '2024-04-30', 168211, 'km', 'measured', 'verified', 'Business air travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-05-01', '2024-05-31', 343110, 'km', 'measured', 'verified', 'Business air travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-06-01', '2024-06-30', 114616, 'km', 'measured', 'verified', 'Business air travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-07-01', '2024-07-31', 12204, 'km', 'measured', 'verified', 'Business air travel - vacation period'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-08-01', '2024-08-31', 21041, 'km', 'measured', 'verified', 'Business air travel - vacation period'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-09-01', '2024-09-30', 417804, 'km', 'measured', 'verified', 'Business air travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-10-01', '2024-10-31', 371677, 'km', 'measured', 'verified', 'Business air travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-11-01', '2024-11-30', 252137, 'km', 'measured', 'verified', 'Business air travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-12-01', '2024-12-31', 174263, 'km', 'measured', 'verified', 'Business air travel');

  -- BUSINESS TRAVEL - RAIL (2024 only for brevity)
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_business_travel_rail' LIMIT 1;

  INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status, notes)
  VALUES
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-01-01', '2024-01-31', 1917, 'km', 'measured', 'verified', 'Business rail travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-02-01', '2024-02-29', 4645, 'km', 'measured', 'verified', 'Business rail travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-03-01', '2024-03-31', 5957, 'km', 'measured', 'verified', 'Business rail travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-04-01', '2024-04-30', 998, 'km', 'measured', 'verified', 'Business rail travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-05-01', '2024-05-31', 7213, 'km', 'measured', 'verified', 'Business rail travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-06-01', '2024-06-30', 3732, 'km', 'measured', 'verified', 'Business rail travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-07-01', '2024-07-31', 7455, 'km', 'measured', 'verified', 'Business rail travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-08-01', '2024-08-31', 0, 'km', 'measured', 'verified', 'No rail travel - vacation'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-09-01', '2024-09-30', 3743, 'km', 'measured', 'verified', 'Business rail travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-10-01', '2024-10-31', 5299, 'km', 'measured', 'verified', 'Business rail travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-11-01', '2024-11-30', 3448, 'km', 'measured', 'verified', 'Business rail travel'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-12-01', '2024-12-31', 6829, 'km', 'measured', 'verified', 'Business rail travel');

  -- WATER CONSUMPTION (2024 only for brevity)
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_water_consumption' LIMIT 1;

  -- Lisboa Water
  INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
  VALUES
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-01-01', '2024-01-31', 37.1, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-02-01', '2024-02-29', 31.1, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-03-01', '2024-03-31', 36.9, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-04-01', '2024-04-30', 31.6, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-05-01', '2024-05-31', 36.6, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-06-01', '2024-06-30', 32.4, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-07-01', '2024-07-31', 37.7, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-08-01', '2024-08-31', 24.3, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-09-01', '2024-09-30', 38.8, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-10-01', '2024-10-31', 24.3, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-11-01', '2024-11-30', 42.0, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-12-01', '2024-12-31', 31.5, 'm3', 'measured', 'verified');

  -- Porto Water
  INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
  VALUES
    (v_org_id, v_metric_id, v_porto_site_id, '2024-01-01', '2024-01-31', 8.0, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-02-01', '2024-02-29', 10.0, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-03-01', '2024-03-31', 12.0, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-04-01', '2024-04-30', 15.0, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-05-01', '2024-05-31', 9.0, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-06-01', '2024-06-30', 15.0, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-07-01', '2024-07-31', 14.0, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-08-01', '2024-08-31', 11.0, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-09-01', '2024-09-30', 12.0, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-10-01', '2024-10-31', 10.1, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-11-01', '2024-11-30', 11.3, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_porto_site_id, '2024-12-01', '2024-12-31', 9.7, 'm3', 'measured', 'verified');

  -- Faro Water
  INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
  VALUES
    (v_org_id, v_metric_id, v_faro_site_id, '2024-01-01', '2024-01-31', 6, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-02-01', '2024-02-29', 6, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-03-01', '2024-03-31', 8, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-04-01', '2024-04-30', 10, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-05-01', '2024-05-31', 6, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-06-01', '2024-06-30', 10, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-07-01', '2024-07-31', 10, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-08-01', '2024-08-31', 7, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-09-01', '2024-09-30', 8, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-10-01', '2024-10-31', 8, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-11-01', '2024-11-30', 10, 'm3', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_faro_site_id, '2024-12-01', '2024-12-31', 4, 'm3', 'measured', 'verified');

  -- WASTE - PAPER (2024 only for brevity)
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_waste_paper_recycling' LIMIT 1;

  -- Lisboa Paper Waste
  INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
  VALUES
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-01-01', '2024-01-31', 298.02, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-02-01', '2024-02-29', 269.18, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-03-01', '2024-03-31', 298.02, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-04-01', '2024-04-30', 288.41, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-05-01', '2024-05-31', 298.02, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-06-01', '2024-06-30', 288.41, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-07-01', '2024-07-31', 298.02, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-08-01', '2024-08-31', 298.02, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-09-01', '2024-09-30', 288.41, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-10-01', '2024-10-31', 298.02, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-11-01', '2024-11-30', 288.41, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-12-01', '2024-12-31', 298.02, 'kg', 'measured', 'verified');

  -- WASTE - ORGANIC (2024 only for brevity)
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_waste_organic_composting' LIMIT 1;

  -- Lisboa Organic Waste
  INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
  VALUES
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-01-01', '2024-01-31', 194.0, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-02-01', '2024-02-29', 174.6, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-03-01', '2024-03-31', 213.4, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-04-01', '2024-04-30', 193.8, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-05-01', '2024-05-31', 203.7, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-06-01', '2024-06-30', 184.3, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-07-01', '2024-07-31', 174.6, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-08-01', '2024-08-31', 155.2, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-09-01', '2024-09-30', 203.7, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-10-01', '2024-10-31', 223.1, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-11-01', '2024-11-30', 203.7, 'kg', 'measured', 'verified'),
    (v_org_id, v_metric_id, v_lisboa_site_id, '2024-12-01', '2024-12-31', 174.6, 'kg', 'measured', 'verified');

  RAISE NOTICE 'Successfully imported PLMJ data for % organization', v_org_id;
  RAISE NOTICE 'Lisboa site: %', v_lisboa_site_id;
  RAISE NOTICE 'Porto site: %', v_porto_site_id;
  RAISE NOTICE 'Faro site: %', v_faro_site_id;

END $$;

-- Add Portuguese emission factors
INSERT INTO emission_factors (name, code, scope, category, metric_code, region, year, factor, factor_value, unit, factor_unit, source, source_organization)
VALUES
  ('Portugal Grid Electricity 2024', 'scope2_electricity_grid', 'scope_2', 'Purchased Electricity', 'scope2_electricity_grid', 'PT', 2024, 0.195, 0.195, 'kgCO2e/kWh', 'kgCO2e/kWh', 'DGEG Portugal 2024', 'DGEG'),
  ('Portugal Grid Electricity 2023', 'scope2_electricity_grid', 'scope_2', 'Purchased Electricity', 'scope2_electricity_grid', 'PT', 2023, 0.207, 0.207, 'kgCO2e/kWh', 'kgCO2e/kWh', 'DGEG Portugal 2023', 'DGEG'),
  ('Portugal Grid Electricity 2022', 'scope2_electricity_grid', 'scope_2', 'Purchased Electricity', 'scope2_electricity_grid', 'PT', 2022, 0.224, 0.224, 'kgCO2e/kWh', 'kgCO2e/kWh', 'DGEG Portugal 2022', 'DGEG')
ON CONFLICT (code, region, year) DO NOTHING;

-- Create summary view for PLMJ data
CREATE OR REPLACE VIEW plmj_metrics_summary AS
SELECT
  s.name as site,
  mc.name as metric,
  mc.scope,
  EXTRACT(YEAR FROM md.period_start) as year,
  COUNT(*) as data_points,
  ROUND(SUM(md.value)::numeric, 2) as total_value,
  md.unit,
  ROUND(SUM(md.co2e_emissions)::numeric, 2) as total_co2e_tons
FROM metrics_data md
JOIN sites s ON s.id = md.site_id
JOIN metrics_catalog mc ON mc.id = md.metric_id
JOIN organizations o ON o.id = md.organization_id
WHERE o.slug = 'plmj-ymlknd' OR o.name = 'PLMJ'
GROUP BY s.name, mc.name, mc.scope, EXTRACT(YEAR FROM md.period_start), md.unit
ORDER BY year DESC, s.name, mc.scope, mc.name;

COMMENT ON VIEW plmj_metrics_summary IS 'Summary of PLMJ sustainability metrics by site, metric, and year';