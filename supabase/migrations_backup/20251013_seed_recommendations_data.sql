-- Seed data for metric recommendations system
-- Based on GRI Standards, ESRS, and industry best practices

-- First, ensure we have common metrics in metrics_catalog
-- (Water, Waste, Biodiversity, etc. - these may already exist)

-- Seed industry_materiality data
-- Services Industry (GRI 11) - Most common for B2B SaaS, Professional Services
INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT
  'Services', 'GRI_11', mc.id, 'GRI 303-3', 'high', true, true,
  'Water consumption is material for services sector due to office operations and data center usage. Required for ESRS E3.',
  '["ESRS_E3", "GRI_303", "CDP_Water"]'::jsonb, false, 'GRI Sector Standard 11'
FROM metrics_catalog mc
WHERE mc.name ILIKE '%water%consumption%' OR mc.code = 'water_consumption'
LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory)
SELECT
  'Services', 'GRI_11', mc.id, 'GRI 306-3', 'high', true, true,
  'Waste generation is material for services sector. Electronic waste and office waste management are key environmental impacts.',
  '["ESRS_E5", "GRI_306", "CDP"]'::jsonb, false
FROM metrics_catalog mc
WHERE mc.name ILIKE '%waste%generated%' OR mc.code = 'waste_generated'
LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory)
SELECT
  'Services', 'GRI_11', mc.id, 'GRI 302-1', 'high', true, true,
  'Energy consumption and renewable energy mix are highly material for climate impact and operational costs.',
  '["ESRS_E1", "GRI_302", "SBTi", "TCFD"]'::jsonb, false
FROM metrics_catalog mc
WHERE mc.category ILIKE '%renewable%energy%' OR mc.name ILIKE '%renewable%'
LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- General industry (fallback for all industries)
INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory)
SELECT
  'general', NULL, mc.id, 'GRI 303-3', 'medium', true, false,
  'Water consumption tracking recommended for all organizations.',
  '["ESRS_E3", "GRI_303"]'::jsonb, false
FROM metrics_catalog mc
WHERE mc.name ILIKE '%water%consumption%' OR mc.code = 'water_consumption'
LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory)
SELECT
  'general', NULL, mc.id, 'GRI 306-3', 'medium', true, false,
  'Waste tracking is recommended for environmental impact assessment.',
  '["ESRS_E5", "GRI_306"]'::jsonb, false
FROM metrics_catalog mc
WHERE mc.name ILIKE '%waste%generated%' OR mc.code = 'waste_generated'
LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- Seed peer_benchmark_data (anonymized aggregates)
-- Services Industry, EU, 100-300 FTE - Water Consumption
INSERT INTO peer_benchmark_data (
  industry, region, size_category, business_type, metric_catalog_id, metric_type,
  peer_count, adoption_percent, intensity_metric,
  p25_intensity, p50_intensity, p75_intensity, p90_intensity,
  avg_absolute_value, data_as_of, calculation_method
)
SELECT
  'Services', 'EU', '100-300', 'B2B SaaS', mc.id, 'water',
  47, 89.0, 'per_employee',
  1.8, 2.3, 2.9, 3.8,
  460.0, CURRENT_DATE, 'Aggregated from 47 anonymous peer organizations'
FROM metrics_catalog mc
WHERE mc.name ILIKE '%water%consumption%' OR mc.code = 'water_consumption'
LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

-- Waste Generation
INSERT INTO peer_benchmark_data (
  industry, region, size_category, business_type, metric_catalog_id, metric_type,
  peer_count, adoption_percent, intensity_metric,
  p25_intensity, p50_intensity, p75_intensity, p90_intensity,
  avg_absolute_value, data_as_of, calculation_method
)
SELECT
  'Services', 'EU', '100-300', 'B2B SaaS', mc.id, 'waste',
  38, 82.0, 'per_employee',
  0.05, 0.075, 0.12, 0.18,
  15.0, CURRENT_DATE, 'Aggregated from 38 anonymous peer organizations'
FROM metrics_catalog mc
WHERE mc.name ILIKE '%waste%generated%' OR mc.code = 'waste_generated'
LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

-- Renewable Energy Percentage
INSERT INTO peer_benchmark_data (
  industry, region, size_category, business_type, metric_catalog_id, metric_type,
  peer_count, adoption_percent, intensity_metric,
  p25_intensity, p50_intensity, p75_intensity, p90_intensity,
  avg_absolute_value, data_as_of, calculation_method
)
SELECT
  'Services', 'EU', '100-300', 'B2B SaaS', mc.id, 'energy',
  52, 94.0, 'per_employee',
  25.0, 38.0, 65.0, 100.0,
  38.0, CURRENT_DATE, 'Aggregated from 52 anonymous peer organizations'
FROM metrics_catalog mc
WHERE mc.category ILIKE '%renewable%' OR mc.name ILIKE '%renewable%energy%'
LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

-- Business Travel (Scope 3 Cat 6)
INSERT INTO peer_benchmark_data (
  industry, region, size_category, business_type, metric_catalog_id, metric_type,
  peer_count, adoption_percent, intensity_metric,
  p25_intensity, p50_intensity, p75_intensity, p90_intensity,
  avg_absolute_value, data_as_of, calculation_method
)
SELECT
  'Services', 'EU', '100-300', 'B2B SaaS', mc.id, 'emissions',
  43, 91.0, 'per_employee',
  0.15, 0.25, 0.45, 0.75,
  50.0, CURRENT_DATE, 'Aggregated from 43 anonymous peer organizations (tCO2e)'
FROM metrics_catalog mc
WHERE mc.category = 'Business Travel' AND mc.scope = 'scope_3'
LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

-- Employee Commuting (Scope 3 Cat 7)
INSERT INTO peer_benchmark_data (
  industry, region, size_category, business_type, metric_catalog_id, metric_type,
  peer_count, adoption_percent, intensity_metric,
  p25_intensity, p50_intensity, p75_intensity, p90_intensity,
  avg_absolute_value, data_as_of, calculation_method
)
SELECT
  'Services', 'EU', '100-300', 'B2B SaaS', mc.id, 'emissions',
  31, 76.0, 'per_employee',
  0.08, 0.12, 0.18, 0.28,
  24.0, CURRENT_DATE, 'Aggregated from 31 anonymous peer organizations (tCO2e)'
FROM metrics_catalog mc
WHERE mc.category = 'Employee Commuting' AND mc.scope = 'scope_3'
LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

-- Scope 3 Category 1: Purchased Goods & Services
INSERT INTO peer_benchmark_data (
  industry, region, size_category, business_type, metric_catalog_id, metric_type,
  peer_count, adoption_percent, intensity_metric,
  p25_intensity, p50_intensity, p75_intensity, p90_intensity,
  avg_absolute_value, data_as_of, calculation_method
)
SELECT
  'Services', 'EU', '100-300', 'B2B SaaS', mc.id, 'emissions',
  34, 71.0, 'per_employee',
  0.45, 0.62, 0.88, 1.25,
  124.0, CURRENT_DATE, 'Aggregated from 34 anonymous peer organizations (tCO2e)'
FROM metrics_catalog mc
WHERE mc.category = 'Purchased Goods and Services' AND mc.scope = 'scope_3'
LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

-- Additional size categories for better coverage
-- 300-1000 FTE bracket
INSERT INTO peer_benchmark_data (
  industry, region, size_category, business_type, metric_catalog_id, metric_type,
  peer_count, adoption_percent, intensity_metric,
  p25_intensity, p50_intensity, p75_intensity, p90_intensity,
  avg_absolute_value, data_as_of
)
SELECT
  'Services', 'EU', '300-1000', 'B2B SaaS', mc.id, 'water',
  23, 92.0, 'per_employee',
  1.6, 2.1, 2.7, 3.5,
  1050.0, CURRENT_DATE
FROM metrics_catalog mc
WHERE mc.name ILIKE '%water%consumption%'
LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

COMMENT ON TABLE industry_materiality IS 'Maps metrics to industry materiality (GRI sector standards + ESRS double materiality)';
COMMENT ON TABLE peer_benchmark_data IS 'Anonymized peer benchmark data for comparing performance across similar organizations';
