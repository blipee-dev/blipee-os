-- Rename PLMJ sites to shorter names
DO $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Get PLMJ organization
  SELECT id INTO v_org_id FROM organizations WHERE name = 'PLMJ' LIMIT 1;
  
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'PLMJ organization not found';
    RETURN;
  END IF;

  -- Rename Lisboa - FPM41 to Lisboa
  UPDATE sites 
  SET name = 'Lisboa'
  WHERE organization_id = v_org_id 
    AND name = 'Lisboa - FPM41';

  -- Rename Porto - POP to Porto
  UPDATE sites 
  SET name = 'Porto'
  WHERE organization_id = v_org_id 
    AND name = 'Porto - POP';

  RAISE NOTICE 'Sites renamed successfully';
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