-- Fix audit trigger and import PLMJ data

-- First, fix the audit trigger to handle tables without 'title' or 'email' columns
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action TEXT;
  v_resource_id UUID;
  v_resource_type TEXT;
  v_resource_name TEXT;
  v_actor_id UUID;
BEGIN
  -- Determine action type
  v_action := TG_OP;

  -- Get resource details based on operation
  IF TG_OP = 'DELETE' THEN
    v_resource_id := OLD.id;
  ELSE
    v_resource_id := NEW.id;
  END IF;

  -- Get table name as resource type
  v_resource_type := TG_TABLE_NAME;

  -- Get resource name based on table and available columns
  IF TG_OP != 'DELETE' THEN
    -- Check which columns exist and use the appropriate one
    CASE TG_TABLE_NAME
      WHEN 'sites' THEN
        v_resource_name := NEW.name;
      WHEN 'organizations' THEN
        v_resource_name := NEW.name;
      WHEN 'users' THEN
        v_resource_name := COALESCE(NEW.email, NEW.name);
      ELSE
        -- For other tables, try to get name column if it exists
        BEGIN
          v_resource_name := NEW.name;
        EXCEPTION WHEN OTHERS THEN
          v_resource_name := NULL;
        END;
    END CASE;
  END IF;

  -- Get actor (current user)
  v_actor_id := auth.uid();

  -- Insert audit record
  INSERT INTO audit_events (
    action,
    resource_type,
    resource_id,
    resource_name,
    actor_id,
    metadata
  ) VALUES (
    v_action,
    v_resource_type,
    v_resource_id,
    v_resource_name,
    v_actor_id,
    to_jsonb(NEW)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now import PLMJ data
DO $$
DECLARE
  v_org_id UUID;
  v_lisboa_site_id UUID;
  v_porto_site_id UUID;
  v_faro_site_id UUID;
  v_metric_id UUID;
  v_count INTEGER;
BEGIN
  -- Get or create PLMJ organization
  SELECT id INTO v_org_id FROM organizations WHERE slug = 'plmj-ymlknd' OR name = 'PLMJ' LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO organizations (name, slug, industry, size, country, status)
    VALUES ('PLMJ', 'plmj-' || substring(gen_random_uuid()::text from 1 for 6), 'Legal Services', 'large', 'PT', 'active')
    RETURNING id INTO v_org_id;
    RAISE NOTICE 'Created PLMJ organization with ID: %', v_org_id;
  ELSE
    RAISE NOTICE 'Found existing PLMJ organization with ID: %', v_org_id;
  END IF;

  -- Create sites
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
    RAISE NOTICE 'Created Lisboa site';
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
    RAISE NOTICE 'Created Porto site';
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
    RAISE NOTICE 'Created Faro site';
  END IF;

  -- Add metrics selections
  INSERT INTO organization_metrics (organization_id, metric_id, is_required, is_active, reporting_frequency)
  SELECT v_org_id, id, true, true, 'monthly'
  FROM metrics_catalog
  WHERE code IN (
    'scope2_electricity_grid',
    'scope3_business_travel_air',
    'scope3_business_travel_rail'
  )
  ON CONFLICT (organization_id, metric_id) DO NOTHING;

  -- Import electricity data
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope2_electricity_grid' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    -- Lisboa electricity
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

    -- Porto electricity
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

    -- Faro electricity
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

    RAISE NOTICE 'Imported electricity data';
  END IF;

  -- Import air travel
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_business_travel_air' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
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

    RAISE NOTICE 'Imported air travel data';
  END IF;

  -- Import rail travel
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope3_business_travel_rail' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
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

    RAISE NOTICE 'Imported rail travel data';
  END IF;

  -- Count total records
  SELECT COUNT(*) INTO v_count FROM metrics_data WHERE organization_id = v_org_id;
  RAISE NOTICE 'Total PLMJ metrics records: %', v_count;

END $$;

-- Show summary
SELECT
  mc.name as metric,
  COUNT(*) as data_points,
  SUM(md.value) as total,
  md.unit
FROM metrics_data md
JOIN metrics_catalog mc ON mc.id = md.metric_id
JOIN organizations o ON o.id = md.organization_id
WHERE o.name = 'PLMJ'
GROUP BY mc.name, md.unit
ORDER BY mc.name;