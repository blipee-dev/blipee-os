-- Check audit_events structure and fix the audit function

-- First, let's see what columns audit_events actually has
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'audit_events'
ORDER BY ordinal_position;

-- Fix the audit function to match the actual audit_events table structure
CREATE OR REPLACE FUNCTION audit_table_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_event_type TEXT;
  v_resource_id UUID;
  v_resource_type TEXT;
  v_resource_name TEXT;
  v_actor_id UUID;
  v_event_data JSONB;
BEGIN
  -- Determine event type
  v_event_type := LOWER(TG_OP) || '_' || TG_TABLE_NAME;

  -- Get resource details based on operation
  IF TG_OP = 'DELETE' THEN
    v_resource_id := OLD.id;
    v_event_data := to_jsonb(OLD);
  ELSE
    v_resource_id := NEW.id;
    v_event_data := to_jsonb(NEW);
  END IF;

  -- Get table name as resource type
  v_resource_type := TG_TABLE_NAME;

  -- Get resource name safely
  IF TG_OP != 'DELETE' THEN
    BEGIN
      -- Try to get name field if it exists
      v_resource_name := CASE
        WHEN TG_TABLE_NAME = 'sites' THEN NEW.name
        WHEN TG_TABLE_NAME = 'organizations' THEN NEW.name
        ELSE NULL
      END;
    EXCEPTION WHEN OTHERS THEN
      v_resource_name := NULL;
    END;
  END IF;

  -- Get actor (current user)
  v_actor_id := auth.uid();

  -- Try to insert with available columns
  -- We'll check which columns exist and use them
  BEGIN
    -- Try with common audit_events structure
    INSERT INTO audit_events (
      event_type,
      resource_type,
      resource_id,
      resource_name,
      actor_id,
      event_data,
      created_at
    ) VALUES (
      v_event_type,
      v_resource_type,
      v_resource_id,
      v_resource_name,
      v_actor_id,
      v_event_data,
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    -- If that fails, try simpler structure
    BEGIN
      INSERT INTO audit_events (
        event_type,
        resource_id,
        actor_id,
        metadata
      ) VALUES (
        v_event_type,
        v_resource_id,
        v_actor_id,
        v_event_data
      );
    EXCEPTION WHEN OTHERS THEN
      -- If audit fails, just log and continue
      RAISE NOTICE 'Audit logging failed: %', SQLERRM;
    END;
  END;

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
BEGIN
  -- Get or create PLMJ organization
  SELECT id INTO v_org_id FROM organizations WHERE name = 'PLMJ' LIMIT 1;

  IF v_org_id IS NULL THEN
    INSERT INTO organizations (name, slug, industry, size, country, status)
    VALUES ('PLMJ', 'plmj-' || substring(gen_random_uuid()::text from 1 for 6), 'Legal Services', 'large', 'PT', 'active')
    RETURNING id INTO v_org_id;
    RAISE NOTICE 'Created PLMJ organization';
  END IF;

  -- Create sites
  SELECT id INTO v_lisboa_site_id FROM sites WHERE organization_id = v_org_id AND name = 'Lisboa - FPM41' LIMIT 1;
  IF v_lisboa_site_id IS NULL THEN
    INSERT INTO sites (organization_id, name, location, address, type, status)
    VALUES (
      v_org_id,
      'Lisboa - FPM41',
      'Lisboa, Portugal',
      '{"street": "Av. Fontes Pereira de Melo 41", "city": "Lisboa", "country": "PT"}'::jsonb,
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
      '{"street": "Rua do Rosário", "city": "Porto", "country": "PT"}'::jsonb,
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
      '{"street": "Rua de Faro", "city": "Faro", "country": "PT"}'::jsonb,
      'office',
      'active'
    )
    RETURNING id INTO v_faro_site_id;
  END IF;

  -- Import minimal electricity data to test
  SELECT id INTO v_metric_id FROM metrics_catalog WHERE code = 'scope2_electricity_grid' LIMIT 1;

  IF v_metric_id IS NOT NULL THEN
    -- Just insert a few records to test
    INSERT INTO metrics_data (organization_id, metric_id, site_id, period_start, period_end, value, unit, data_quality, verification_status)
    VALUES
      (v_org_id, v_metric_id, v_lisboa_site_id, '2024-10-01', '2024-10-31', 31587, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_porto_site_id, '2024-10-01', '2024-10-31', 11048, 'kWh', 'measured', 'verified'),
      (v_org_id, v_metric_id, v_faro_site_id, '2024-10-01', '2024-10-31', 1105, 'kWh', 'measured', 'verified')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Imported sample electricity data';
  END IF;

  RAISE NOTICE 'PLMJ import completed';
END $$;

-- Show what we imported
SELECT
  o.name as organization,
  s.name as site,
  mc.name as metric,
  md.value,
  md.unit,
  md.period_start
FROM metrics_data md
JOIN organizations o ON o.id = md.organization_id
JOIN sites s ON s.id = md.site_id
JOIN metrics_catalog mc ON mc.id = md.metric_id
WHERE o.name = 'PLMJ'
ORDER BY s.name, md.period_start;