-- Verify PLMJ Import Success

-- Check organization
SELECT
  'Organization' as check_type,
  name,
  slug,
  industry,
  size,
  country,
  status
FROM organizations
WHERE name = 'PLMJ';

-- Check sites
SELECT
  'Sites' as check_type,
  s.name,
  s.location,
  s.type,
  s.status
FROM sites s
JOIN organizations o ON o.id = s.organization_id
WHERE o.name = 'PLMJ'
ORDER BY s.name;

-- Summary by metric
SELECT
  mc.scope,
  mc.name as metric,
  COUNT(*) as data_points,
  MIN(md.period_start) as earliest_date,
  MAX(md.period_end) as latest_date,
  ROUND(SUM(md.value)::numeric, 2) as total_value,
  md.unit,
  ROUND(SUM(md.co2e_emissions)::numeric, 2) as total_co2e_tons
FROM metrics_data md
JOIN metrics_catalog mc ON mc.id = md.metric_id
JOIN organizations o ON o.id = md.organization_id
WHERE o.name = 'PLMJ'
GROUP BY mc.scope, mc.name, md.unit
ORDER BY mc.scope, mc.name;

-- Total records count
SELECT
  'Total Records' as summary,
  COUNT(*) as total_data_points,
  COUNT(DISTINCT metric_id) as unique_metrics,
  COUNT(DISTINCT site_id) as unique_sites,
  ROUND(SUM(co2e_emissions)::numeric, 2) as total_co2e_tons
FROM metrics_data md
JOIN organizations o ON o.id = md.organization_id
WHERE o.name = 'PLMJ';

-- 2024 Monthly CO2e trend
SELECT
  TO_CHAR(period_start, 'Mon YYYY') as month,
  ROUND(SUM(CASE WHEN mc.scope = 'scope_1' THEN md.co2e_emissions ELSE 0 END)::numeric, 2) as scope_1_co2e,
  ROUND(SUM(CASE WHEN mc.scope = 'scope_2' THEN md.co2e_emissions ELSE 0 END)::numeric, 2) as scope_2_co2e,
  ROUND(SUM(CASE WHEN mc.scope = 'scope_3' THEN md.co2e_emissions ELSE 0 END)::numeric, 2) as scope_3_co2e,
  ROUND(SUM(md.co2e_emissions)::numeric, 2) as total_co2e
FROM metrics_data md
JOIN metrics_catalog mc ON mc.id = md.metric_id
JOIN organizations o ON o.id = md.organization_id
WHERE o.name = 'PLMJ'
AND period_start >= '2024-01-01'
GROUP BY TO_CHAR(period_start, 'Mon YYYY'), TO_CHAR(period_start, 'YYYY-MM')
ORDER BY TO_CHAR(period_start, 'YYYY-MM');