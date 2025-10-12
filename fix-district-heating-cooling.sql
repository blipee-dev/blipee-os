-- Fix: Remove District Heating/Cooling from professional_services materiality
-- Since orgs track "Purchased Heating/Cooling" which is the same thing

-- Remove District Heating from materiality (it's redundant with Purchased Heating)
DELETE FROM industry_materiality
WHERE industry = 'professional_services'
  AND metric_catalog_id IN (
    SELECT id FROM metrics_catalog
    WHERE code IN ('scope2_district_heating', 'scope2_district_cooling')
  );

-- Verify removal
SELECT
  mc.name,
  mc.code,
  im.materiality_level
FROM industry_materiality im
JOIN metrics_catalog mc ON im.metric_catalog_id = mc.id
WHERE im.industry = 'professional_services'
  AND mc.category = 'Purchased Energy'
ORDER BY im.materiality_level, mc.name;

-- Expected result: Should only show the ones we keep, not district_heating/cooling
