-- Clean up duplicate PLMJ sites
-- Keep the original sites (FPM41, POP, Faro created on 2025-09-09) and remove duplicates

DO $$
DECLARE
  v_org_id UUID;
  v_original_fpm41 UUID;
  v_original_pop UUID;
  v_duplicate_lisboa UUID;
  v_duplicate_porto UUID;
BEGIN
  -- Get PLMJ organization
  SELECT id INTO v_org_id FROM organizations WHERE name = 'PLMJ' LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'PLMJ organization not found';
    RETURN;
  END IF;

  -- Find the ORIGINAL sites (created on 2025-09-09)
  SELECT id INTO v_original_fpm41
  FROM sites
  WHERE organization_id = v_org_id
    AND name = 'FPM41'
  LIMIT 1;

  SELECT id INTO v_original_pop
  FROM sites
  WHERE organization_id = v_org_id
    AND name = 'POP'
  LIMIT 1;

  -- Find the DUPLICATE sites (with longer names)
  SELECT id INTO v_duplicate_lisboa
  FROM sites
  WHERE organization_id = v_org_id
    AND name = 'Lisboa - FPM41'
  LIMIT 1;

  SELECT id INTO v_duplicate_porto
  FROM sites
  WHERE organization_id = v_org_id
    AND name = 'Porto - POP'
  LIMIT 1;

  -- Move any data from duplicate sites to original sites
  IF v_duplicate_lisboa IS NOT NULL AND v_original_fpm41 IS NOT NULL THEN
    -- Update metrics_data
    UPDATE metrics_data
    SET site_id = v_original_fpm41
    WHERE site_id = v_duplicate_lisboa;

    -- Update site_metrics
    UPDATE site_metrics
    SET site_id = v_original_fpm41
    WHERE site_id = v_duplicate_lisboa;

    -- Delete duplicate
    DELETE FROM sites WHERE id = v_duplicate_lisboa;
    RAISE NOTICE 'Merged Lisboa - FPM41 into FPM41';
  END IF;

  IF v_duplicate_porto IS NOT NULL AND v_original_pop IS NOT NULL THEN
    -- Update metrics_data
    UPDATE metrics_data
    SET site_id = v_original_pop
    WHERE site_id = v_duplicate_porto;

    -- Update site_metrics
    UPDATE site_metrics
    SET site_id = v_original_pop
    WHERE site_id = v_duplicate_porto;

    -- Delete duplicate
    DELETE FROM sites WHERE id = v_duplicate_porto;
    RAISE NOTICE 'Merged Porto - POP into POP';
  END IF;

  -- Remove duplicate site_metrics entries (keep only unique site_id + metric_id combinations)
  DELETE FROM site_metrics a
  WHERE a.ctid <> (
    SELECT min(b.ctid)
    FROM site_metrics b
    WHERE b.site_id = a.site_id
      AND b.metric_id = a.metric_id
  );

  RAISE NOTICE 'Site cleanup complete';
END $$;

-- Verify the results
SELECT 
  s.name as site_name,
  COUNT(DISTINCT sm.metric_id) as metric_count,
  s.created_at::date as created_date
FROM sites s
LEFT JOIN site_metrics sm ON sm.site_id = s.id
WHERE s.organization_id = (SELECT id FROM organizations WHERE name = 'PLMJ' LIMIT 1)
GROUP BY s.id, s.name, s.created_at
ORDER BY s.name;