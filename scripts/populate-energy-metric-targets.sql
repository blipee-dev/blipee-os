-- Populate Energy Metric Targets based on 2023 Baseline Data
-- This creates metric-level targets for ALL energy categories using:
-- - 2023 baseline emissions
-- - Category-level SBTi reduction rates
-- - 2025 as target year (2 years cumulative reduction)
--
-- This script is designed to work for ANY organization with energy metrics
--
-- Category Reduction Rates (SBTi 1.5°C pathway):
-- - Electricity: 5.2% annual = 10.4% cumulative (2 years)
-- - Purchased Energy: 4.2% annual = 8.4% cumulative
-- - Purchased Heating: 4.2% annual = 8.4% cumulative
-- - Purchased Cooling: 4.2% annual = 8.4% cumulative
-- - Purchased Steam: 4.2% annual = 8.4% cumulative
-- - Stationary Combustion (Natural Gas, Heating Oil, etc.): 4.2% annual = 8.4% cumulative
-- - Mobile Combustion (Diesel, Gasoline, etc.): 4.2% annual = 8.4% cumulative

-- Configuration
-- Organization: 22647141-2ee4-4d8d-8b47-16b0cbd830b2
-- Target: d4a00170-7964-41e2-a61e-3d7b0059cfe5 (Near-term SBTi target)
-- Baseline Year: 2023
-- Target Year: 2025

-- Insert metric targets for Electricity category (5.2% annual reduction = 10.4% cumulative)
INSERT INTO metric_targets (
  organization_id,
  target_id,
  metric_catalog_id,
  baseline_year,
  baseline_value,
  baseline_emissions,
  target_year,
  target_value,
  target_emissions,
  status,
  created_at,
  updated_at
)
SELECT
  '22647141-2ee4-4d8d-8b47-16b0cbd830b2' as organization_id,
  'd4a00170-7964-41e2-a61e-3d7b0059cfe5' as target_id,
  mc.id as metric_catalog_id,
  2023 as baseline_year,
  SUM(md.value) as baseline_value,
  SUM(md.co2e_emissions) as baseline_emissions,
  2025 as target_year,
  SUM(md.value) * (1 - 0.104) as target_value, -- 10.4% reduction
  SUM(md.co2e_emissions) * (1 - 0.104) as target_emissions, -- 10.4% reduction
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM metrics_catalog mc
JOIN metrics_data md ON mc.id = md.metric_id
WHERE mc.category = 'Electricity'
  AND md.organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  AND md.period_start >= '2023-01-01'
  AND md.period_start < '2024-01-01'
GROUP BY mc.id, mc.name, mc.category, mc.scope, mc.unit
HAVING SUM(md.co2e_emissions) > 0
ON CONFLICT (organization_id, target_id, metric_catalog_id) DO NOTHING;

-- Insert metric targets for ALL other energy categories (4.2% annual = 8.4% cumulative)
-- This covers: Purchased Energy, Heating, Cooling, Steam, Stationary Combustion, Mobile Combustion, etc.
INSERT INTO metric_targets (
  organization_id,
  target_id,
  metric_catalog_id,
  baseline_year,
  baseline_value,
  baseline_emissions,
  target_year,
  target_value,
  target_emissions,
  status,
  created_at,
  updated_at
)
SELECT
  '22647141-2ee4-4d8d-8b47-16b0cbd830b2' as organization_id,
  'd4a00170-7964-41e2-a61e-3d7b0059cfe5' as target_id,
  mc.id as metric_catalog_id,
  2023 as baseline_year,
  SUM(md.value) as baseline_value,
  SUM(md.co2e_emissions) as baseline_emissions,
  2025 as target_year,
  SUM(md.value) * (1 - 0.084) as target_value, -- 8.4% reduction
  SUM(md.co2e_emissions) * (1 - 0.084) as target_emissions, -- 8.4% reduction
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM metrics_catalog mc
JOIN metrics_data md ON mc.id = md.metric_id
WHERE mc.category IN (
    'Purchased Energy',
    'Purchased Heating',
    'Purchased Cooling',
    'Purchased Steam',
    'Heating',
    'Cooling',
    'Steam',
    'Natural Gas',
    'Heating Oil',
    'Diesel',
    'Gasoline',
    'Propane',
    'LPG',
    'Biofuel',
    'Coal',
    'Fuel Oil',
    'Jet Fuel',
    'Kerosene',
    'Stationary Combustion',
    'Mobile Combustion',
    'Fugitive Emissions'
  )
  AND md.organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  AND md.period_start >= '2023-01-01'
  AND md.period_start < '2024-01-01'
GROUP BY mc.id, mc.name, mc.category, mc.scope, mc.unit
HAVING SUM(md.co2e_emissions) > 0
ON CONFLICT (organization_id, target_id, metric_catalog_id) DO NOTHING;

-- Verify the results
SELECT
  mc.name,
  mc.category,
  mt.baseline_emissions / 1000 as baseline_tco2e,
  mt.target_emissions / 1000 as target_tco2e,
  ((mt.baseline_emissions - mt.target_emissions) / mt.baseline_emissions * 100) as reduction_percent,
  mt.status
FROM metric_targets mt
JOIN metrics_catalog mc ON mt.metric_catalog_id = mc.id
WHERE mt.organization_id = '22647141-2ee4-4d8d-8b47-16b0cbd830b2'
  AND mt.target_id = 'd4a00170-7964-41e2-a61e-3d7b0059cfe5'
  AND mc.category IN ('Electricity', 'Purchased Energy')
ORDER BY mc.category, mt.baseline_emissions DESC;
