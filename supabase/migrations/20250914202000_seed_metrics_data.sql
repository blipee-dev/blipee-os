-- Seed Fresh Data for Metrics System
-- This creates realistic sustainability metrics data for testing and demonstration

-- First, let's select an organization to work with (using PLMJ as example)
DO $$
DECLARE
  v_org_id UUID;
  v_site_id UUID;
  v_metric_id UUID;
  v_start_date DATE := '2024-01-01';
  v_end_date DATE := '2024-12-31';
  v_current_date DATE;
BEGIN
  -- Get PLMJ organization or use the first available
  SELECT id INTO v_org_id FROM organizations
  WHERE slug = 'plmj-ymlknd' OR name = 'PLMJ'
  LIMIT 1;

  -- If no PLMJ, use any organization
  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
  END IF;

  -- Get or create a site for this organization
  SELECT id INTO v_site_id FROM sites
  WHERE organization_id = v_org_id
  LIMIT 1;

  IF v_site_id IS NULL THEN
    INSERT INTO sites (organization_id, name, address, city, country, status)
    VALUES (v_org_id, 'Headquarters', 'Main Street 100', 'Lisbon', 'PT', 'active')
    RETURNING id INTO v_site_id;
  END IF;

  -- Add organization metrics selections for key metrics
  INSERT INTO organization_metrics (organization_id, metric_id, is_required, is_active, reporting_frequency)
  SELECT
    v_org_id,
    id,
    true,
    true,
    'monthly'
  FROM metrics_catalog
  WHERE code IN (
    'scope1_stationary_combustion',
    'scope1_mobile_combustion',
    'scope2_electricity',
    'scope2_heating',
    'scope3_business_travel',
    'scope3_employee_commute',
    'scope3_waste',
    'scope3_water'
  )
  ON CONFLICT (organization_id, metric_id) DO NOTHING;

  -- Generate monthly data for 2024
  v_current_date := v_start_date;

  WHILE v_current_date <= v_end_date LOOP
    -- Scope 1: Stationary Combustion (Natural Gas for heating)
    SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope1_stationary_combustion' LIMIT 1;
    IF v_metric_id IS NOT NULL THEN
      INSERT INTO metrics_data (
        organization_id, metric_id, site_id, period_start, period_end,
        value, unit, data_quality, verification_status, notes
      ) VALUES (
        v_org_id, v_metric_id, v_site_id, v_current_date,
        (v_current_date + INTERVAL '1 month - 1 day')::DATE,
        -- Higher gas usage in winter months
        CASE
          WHEN EXTRACT(MONTH FROM v_current_date) IN (12, 1, 2) THEN 8000 + (random() * 1000)
          WHEN EXTRACT(MONTH FROM v_current_date) IN (6, 7, 8) THEN 2000 + (random() * 500)
          ELSE 4000 + (random() * 1000)
        END,
        'kWh',
        'measured',
        'verified',
        'Monthly natural gas consumption for heating'
      );
    END IF;

    -- Scope 1: Mobile Combustion (Fleet vehicles)
    SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope1_mobile_combustion' LIMIT 1;
    IF v_metric_id IS NOT NULL THEN
      INSERT INTO metrics_data (
        organization_id, metric_id, site_id, period_start, period_end,
        value, unit, data_quality, verification_status, notes
      ) VALUES (
        v_org_id, v_metric_id, v_site_id, v_current_date,
        (v_current_date + INTERVAL '1 month - 1 day')::DATE,
        1500 + (random() * 500), -- 1500-2000 liters of fuel
        'liters',
        'measured',
        'verified',
        'Fleet vehicle fuel consumption'
      );
    END IF;

    -- Scope 2: Electricity
    SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope2_electricity' LIMIT 1;
    IF v_metric_id IS NOT NULL THEN
      INSERT INTO metrics_data (
        organization_id, metric_id, site_id, period_start, period_end,
        value, unit, data_quality, verification_status, notes
      ) VALUES (
        v_org_id, v_metric_id, v_site_id, v_current_date,
        (v_current_date + INTERVAL '1 month - 1 day')::DATE,
        -- Higher electricity in summer (cooling) and winter (lighting)
        CASE
          WHEN EXTRACT(MONTH FROM v_current_date) IN (7, 8, 12, 1) THEN 45000 + (random() * 5000)
          ELSE 35000 + (random() * 5000)
        END,
        'kWh',
        'measured',
        'verified',
        'Monthly electricity consumption from grid'
      );
    END IF;

    -- Scope 3: Business Travel
    SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_business_travel' LIMIT 1;
    IF v_metric_id IS NOT NULL THEN
      INSERT INTO metrics_data (
        organization_id, metric_id, site_id, period_start, period_end,
        value, unit, data_quality, verification_status, notes
      ) VALUES (
        v_org_id, v_metric_id, v_site_id, v_current_date,
        (v_current_date + INTERVAL '1 month - 1 day')::DATE,
        -- Less travel in August (vacation) and December (holidays)
        CASE
          WHEN EXTRACT(MONTH FROM v_current_date) IN (8, 12) THEN 5000 + (random() * 2000)
          ELSE 15000 + (random() * 5000)
        END,
        'km',
        'calculated',
        'unverified',
        'Air and rail travel for business'
      );
    END IF;

    -- Scope 3: Employee Commute
    SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_employee_commute' LIMIT 1;
    IF v_metric_id IS NOT NULL THEN
      INSERT INTO metrics_data (
        organization_id, metric_id, site_id, period_start, period_end,
        value, unit, data_quality, verification_status, notes
      ) VALUES (
        v_org_id, v_metric_id, v_site_id, v_current_date,
        (v_current_date + INTERVAL '1 month - 1 day')::DATE,
        -- Assuming 200 employees, 20 working days, average 15km round trip
        CASE
          WHEN EXTRACT(MONTH FROM v_current_date) = 8 THEN 30000 + (random() * 5000) -- August vacation
          ELSE 60000 + (random() * 10000)
        END,
        'km',
        'estimated',
        'unverified',
        'Employee commuting estimates based on survey'
      );
    END IF;

    -- Scope 3: Waste
    SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_waste' LIMIT 1;
    IF v_metric_id IS NOT NULL THEN
      INSERT INTO metrics_data (
        organization_id, metric_id, site_id, period_start, period_end,
        value, unit, data_quality, verification_status, notes
      ) VALUES (
        v_org_id, v_metric_id, v_site_id, v_current_date,
        (v_current_date + INTERVAL '1 month - 1 day')::DATE,
        2000 + (random() * 500), -- 2-2.5 tons of waste
        'kg',
        'measured',
        'verified',
        'Total waste generated including recycling'
      );
    END IF;

    -- Scope 3: Water
    SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_water' LIMIT 1;
    IF v_metric_id IS NOT NULL THEN
      INSERT INTO metrics_data (
        organization_id, metric_id, site_id, period_start, period_end,
        value, unit, data_quality, verification_status, notes
      ) VALUES (
        v_org_id, v_metric_id, v_site_id, v_current_date,
        (v_current_date + INTERVAL '1 month - 1 day')::DATE,
        -- Higher water usage in summer
        CASE
          WHEN EXTRACT(MONTH FROM v_current_date) IN (6, 7, 8) THEN 800 + (random() * 200)
          ELSE 600 + (random() * 100)
        END,
        'm3',
        'measured',
        'verified',
        'Monthly water consumption'
      );
    END IF;

    -- Move to next month
    v_current_date := v_current_date + INTERVAL '1 month';
  END LOOP;

  -- Add some 2025 data (Q1 only)
  v_current_date := '2025-01-01';
  WHILE v_current_date <= '2025-03-31' LOOP
    -- Add electricity data for Q1 2025
    SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope2_electricity' LIMIT 1;
    IF v_metric_id IS NOT NULL THEN
      INSERT INTO metrics_data (
        organization_id, metric_id, site_id, period_start, period_end,
        value, unit, data_quality, verification_status, notes
      ) VALUES (
        v_org_id, v_metric_id, v_site_id, v_current_date,
        (v_current_date + INTERVAL '1 month - 1 day')::DATE,
        38000 + (random() * 5000),
        'kWh',
        'measured',
        'unverified',
        'Q1 2025 electricity consumption'
      );
    END IF;

    v_current_date := v_current_date + INTERVAL '1 month';
  END LOOP;

  RAISE NOTICE 'Successfully seeded metrics data for organization %', v_org_id;
END $$;

-- Create a summary view to verify the seeded data
CREATE OR REPLACE VIEW metrics_data_summary AS
SELECT
  o.name as organization,
  mc.name as metric,
  mc.scope,
  COUNT(*) as data_points,
  MIN(md.period_start) as earliest_date,
  MAX(md.period_end) as latest_date,
  ROUND(SUM(md.value)::numeric, 2) as total_value,
  md.unit,
  ROUND(SUM(md.co2e_emissions)::numeric, 2) as total_co2e_tons
FROM metrics_data md
JOIN organizations o ON o.id = md.organization_id
JOIN metrics_catalog mc ON mc.id = md.metric_id
GROUP BY o.name, mc.name, mc.scope, md.unit
ORDER BY o.name, mc.scope, mc.name;

-- Add comment
COMMENT ON VIEW metrics_data_summary IS 'Summary view of metrics data for easy verification and reporting';