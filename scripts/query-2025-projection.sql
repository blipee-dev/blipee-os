-- 2025 Energy Consumption Projection Analysis
-- Calculate YTD and projected annual consumption for each metric

WITH energy_metrics AS (
  SELECT id, name, category, scope, unit
  FROM metrics_catalog
  WHERE category IN (
    'Electricity', 'Purchased Energy', 'Purchased Heating', 'Purchased Cooling', 'Purchased Steam',
    'Natural Gas', 'Heating Oil', 'Diesel', 'Gasoline', 'Propane',
    'District Heating', 'District Cooling', 'Steam'
  )
  AND scope IN ('scope_1', 'scope_2')
),
ytd_2025 AS (
  SELECT
    md.metric_id,
    SUM(md.value) as ytd_consumption,
    SUM(md.co2e_emissions) as ytd_emissions_kg,
    COUNT(DISTINCT TO_CHAR(md.period_start, 'YYYY-MM')) as months_with_data
  FROM metrics_data md
  WHERE md.organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
    AND EXTRACT(YEAR FROM md.period_start) = 2025
    AND md.metric_id IN (SELECT id FROM energy_metrics)
  GROUP BY md.metric_id
)
SELECT
  em.category,
  em.name as metric_name,
  em.scope,
  em.unit,
  ytd.months_with_data,
  ROUND(ytd.ytd_consumption::numeric, 2) as ytd_consumption,
  ROUND((ytd.ytd_consumption / NULLIF(ytd.months_with_data, 0) * 12)::numeric, 2) as projected_annual_consumption,
  ROUND((ytd.ytd_emissions_kg / 1000)::numeric, 1) as ytd_emissions_tco2e,
  ROUND((ytd.ytd_emissions_kg / 1000 / NULLIF(ytd.months_with_data, 0) * 12)::numeric, 1) as projected_annual_emissions_tco2e
FROM energy_metrics em
INNER JOIN ytd_2025 ytd ON em.id = ytd.metric_id
WHERE ytd.ytd_consumption > 0
ORDER BY em.category, projected_annual_consumption DESC;
