-- Populate site_metrics table for PLMJ sites
-- This links metrics to sites based on existing data in metrics_data table

DO $$
DECLARE
  v_org_id UUID;
  v_site_record RECORD;
  v_metric_record RECORD;
BEGIN
  -- Get PLMJ organization
  SELECT id INTO v_org_id FROM organizations WHERE name = 'PLMJ' LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'PLMJ organization not found';
    RETURN;
  END IF;

  RAISE NOTICE 'Found PLMJ organization: %', v_org_id;

  -- For each PLMJ site
  FOR v_site_record IN 
    SELECT id, name 
    FROM sites 
    WHERE organization_id = v_org_id
  LOOP
    RAISE NOTICE 'Processing site: % (%)', v_site_record.name, v_site_record.id;
    
    -- Find all metrics that have data for this site
    FOR v_metric_record IN
      SELECT DISTINCT metric_id
      FROM metrics_data
      WHERE site_id = v_site_record.id
        AND organization_id = v_org_id
    LOOP
      -- Insert or update site_metrics record
      INSERT INTO site_metrics (
        site_id,
        metric_id,
        organization_id,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        v_site_record.id,
        v_metric_record.metric_id,
        v_org_id,
        true,
        NOW(),
        NOW()
      )
      ON CONFLICT (site_id, metric_id) 
      DO UPDATE SET
        is_active = true,
        updated_at = NOW();
        
      RAISE NOTICE '  Added metric % to site %', v_metric_record.metric_id, v_site_record.name;
    END LOOP;
  END LOOP;
  
  -- Also ensure these metrics are in organization_metrics
  INSERT INTO organization_metrics (
    organization_id,
    metric_id,
    is_active,
    created_at
  )
  SELECT DISTINCT
    v_org_id,
    metric_id,
    true,
    NOW()
  FROM metrics_data
  WHERE organization_id = v_org_id
  ON CONFLICT (organization_id, metric_id) DO NOTHING;
  
  RAISE NOTICE 'Site metrics population complete';
END $$;

-- Verify the results
SELECT 
  s.name as site_name,
  COUNT(DISTINCT sm.metric_id) as metric_count
FROM sites s
LEFT JOIN site_metrics sm ON sm.site_id = s.id
WHERE s.organization_id = (SELECT id FROM organizations WHERE name = 'PLMJ' LIMIT 1)
GROUP BY s.id, s.name
ORDER BY s.name;