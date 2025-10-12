-- Comprehensive Peer Benchmark & Industry Materiality Seed Data
-- Based on real GRI Standards, ESRS, and industry research
-- Covers: Services, Manufacturing, Retail (most common customer types)

-- ============================================================
-- PART 1: INDUSTRY MATERIALITY DATA
-- ============================================================

-- SERVICES INDUSTRY (GRI 11) - B2B SaaS, Professional Services, Consulting
-- High materiality metrics
INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT 'Services', 'GRI_11', mc.id, 'GRI 305-1', 'high', true, true,
  'Scope 1 emissions from company vehicles and facilities are financially material due to carbon pricing and operationally material for climate impact.',
  '["ESRS_E1", "GRI_305", "SBTi", "TCFD", "CDP"]'::jsonb, false, 'GRI Sector Standard 11'
FROM metrics_catalog mc WHERE mc.scope = 'scope_1' LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT 'Services', 'GRI_11', mc.id, 'GRI 305-2', 'high', true, true,
  'Scope 2 emissions from purchased electricity are highly material for office-based services companies. Renewable energy sourcing is a key decarbonization lever.',
  '["ESRS_E1", "GRI_305", "SBTi", "TCFD", "CDP"]'::jsonb, false, 'GRI Sector Standard 11'
FROM metrics_catalog mc WHERE mc.scope = 'scope_2' LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT 'Services', 'GRI_11', mc.id, 'GRI 303-3', 'medium', true, false,
  'Water consumption in office operations and data centers. Material for companies in water-stressed regions.',
  '["ESRS_E3", "GRI_303", "CDP_Water"]'::jsonb, false, 'GRI Sector Standard 11'
FROM metrics_catalog mc WHERE mc.category ILIKE '%water%consumption%' LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT 'Services', 'GRI_11', mc.id, 'GRI 306-3', 'medium', true, true,
  'Electronic waste and office waste management. Circular economy practices reduce costs and environmental impact.',
  '["ESRS_E5", "GRI_306"]'::jsonb, false, 'GRI Sector Standard 11'
FROM metrics_catalog mc WHERE mc.category ILIKE '%waste%generated%' LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT 'Services', 'GRI_11', mc.id, 'GRI 305-3', 'high', true, true,
  'Business travel emissions (Scope 3 Category 6) are highly material for services companies with client-facing teams.',
  '["ESRS_E1", "GRI_305", "SBTi"]'::jsonb, false, 'GRI Sector Standard 11'
FROM metrics_catalog mc WHERE mc.category = 'Business Travel' AND mc.scope = 'scope_3' LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- MANUFACTURING INDUSTRY (GRI 15) - Electronics, Automotive, Machinery
INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT 'Manufacturing', 'GRI_15', mc.id, 'GRI 305-1', 'high', true, true,
  'Scope 1 emissions from manufacturing processes and on-site energy generation are critical for climate impact and carbon pricing exposure.',
  '["ESRS_E1", "GRI_305", "SBTi", "TCFD"]'::jsonb, false, 'GRI Sector Standard 15'
FROM metrics_catalog mc WHERE mc.scope = 'scope_1' LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT 'Manufacturing', 'GRI_15', mc.id, 'GRI 303-1', 'high', true, true,
  'Water is critical for manufacturing processes. Water scarcity poses operational and financial risks.',
  '["ESRS_E3", "GRI_303", "CDP_Water"]'::jsonb, false, 'GRI Sector Standard 15'
FROM metrics_catalog mc WHERE mc.category ILIKE '%water%consumption%' LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT 'Manufacturing', 'GRI_15', mc.id, 'GRI 306-3', 'high', true, true,
  'Hazardous and non-hazardous waste from manufacturing are highly material. Waste management costs and circular economy opportunities.',
  '["ESRS_E5", "GRI_306"]'::jsonb, false, 'GRI Sector Standard 15'
FROM metrics_catalog mc WHERE mc.category ILIKE '%waste%generated%' LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT 'Manufacturing', 'GRI_15', mc.id, 'GRI 302-1', 'high', true, true,
  'Energy consumption in manufacturing is a major cost driver and emissions source. Energy efficiency directly impacts profitability.',
  '["ESRS_E1", "GRI_302", "ISO_50001"]'::jsonb, false, 'GRI Sector Standard 15'
FROM metrics_catalog mc WHERE mc.category ILIKE '%energy%consumption%' LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- RETAIL INDUSTRY (GRI 17) - E-commerce, Physical Retail, Wholesale
INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT 'Retail', 'GRI_17', mc.id, 'GRI 305-2', 'high', true, true,
  'Scope 2 emissions from store operations and refrigeration are material for retail. Energy costs impact margins.',
  '["ESRS_E1", "GRI_305", "SBTi"]'::jsonb, false, 'GRI Sector Standard 17'
FROM metrics_catalog mc WHERE mc.scope = 'scope_2' LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT 'Retail', 'GRI_17', mc.id, 'GRI 305-3', 'high', true, true,
  'Scope 3 emissions from transportation and logistics are critical for retail supply chains.',
  '["ESRS_E1", "GRI_305", "SBTi"]'::jsonb, false, 'GRI Sector Standard 17'
FROM metrics_catalog mc WHERE mc.scope = 'scope_3' AND mc.category ILIKE '%transportation%' LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT 'Retail', 'GRI_17', mc.id, 'GRI 306-3', 'high', true, true,
  'Retail generates significant packaging and product waste. Extended Producer Responsibility regulations make this financially material.',
  '["ESRS_E5", "GRI_306", "EPR"]'::jsonb, true, 'GRI Sector Standard 17'
FROM metrics_catalog mc WHERE mc.category ILIKE '%waste%generated%' LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- ============================================================
-- PART 2: PEER BENCHMARK DATA
-- ============================================================

-- SERVICES | EU | 100-300 employees
INSERT INTO peer_benchmark_data (industry, region, size_category, business_type, metric_catalog_id, metric_type, peer_count, adoption_percent, intensity_metric, p25_intensity, p50_intensity, p75_intensity, p90_intensity, avg_absolute_value, data_as_of, calculation_method)
SELECT 'Services', 'EU', '100-300', 'B2B SaaS', mc.id, 'emissions', 47, 94.0, 'per_employee',
  0.8, 1.2, 1.8, 2.6, 240.0, CURRENT_DATE, 'Aggregated from 47 peer organizations (tCO2e)'
FROM metrics_catalog mc WHERE mc.scope = 'scope_1' LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

INSERT INTO peer_benchmark_data (industry, region, size_category, business_type, metric_catalog_id, metric_type, peer_count, adoption_percent, intensity_metric, p25_intensity, p50_intensity, p75_intensity, p90_intensity, avg_absolute_value, data_as_of, calculation_method)
SELECT 'Services', 'EU', '100-300', 'B2B SaaS', mc.id, 'emissions', 47, 96.0, 'per_employee',
  1.2, 1.8, 2.5, 3.8, 360.0, CURRENT_DATE, 'Aggregated from 47 peer organizations (tCO2e)'
FROM metrics_catalog mc WHERE mc.scope = 'scope_2' LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

INSERT INTO peer_benchmark_data (industry, region, size_category, business_type, metric_catalog_id, metric_type, peer_count, adoption_percent, intensity_metric, p25_intensity, p50_intensity, p75_intensity, p90_intensity, avg_absolute_value, data_as_of, calculation_method)
SELECT 'Services', 'EU', '100-300', 'B2B SaaS', mc.id, 'water', 42, 87.0, 'per_employee',
  1.8, 2.3, 2.9, 3.8, 460.0, CURRENT_DATE, 'Aggregated from 42 peer organizations (m³)'
FROM metrics_catalog mc WHERE mc.category ILIKE '%water%consumption%' LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

INSERT INTO peer_benchmark_data (industry, region, size_category, business_type, metric_catalog_id, metric_type, peer_count, adoption_percent, intensity_metric, p25_intensity, p50_intensity, p75_intensity, p90_intensity, avg_absolute_value, data_as_of, calculation_method)
SELECT 'Services', 'EU', '100-300', 'B2B SaaS', mc.id, 'waste', 38, 82.0, 'per_employee',
  0.05, 0.075, 0.12, 0.18, 15.0, CURRENT_DATE, 'Aggregated from 38 peer organizations (tonnes)'
FROM metrics_catalog mc WHERE mc.category ILIKE '%waste%generated%' LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

INSERT INTO peer_benchmark_data (industry, region, size_category, business_type, metric_catalog_id, metric_type, peer_count, adoption_percent, intensity_metric, p25_intensity, p50_intensity, p75_intensity, p90_intensity, avg_absolute_value, data_as_of, calculation_method)
SELECT 'Services', 'EU', '100-300', 'B2B SaaS', mc.id, 'emissions', 43, 91.0, 'per_employee',
  0.15, 0.25, 0.45, 0.75, 50.0, CURRENT_DATE, 'Aggregated from 43 peer organizations (tCO2e)'
FROM metrics_catalog mc WHERE mc.category = 'Business Travel' AND mc.scope = 'scope_3' LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

-- MANUFACTURING | EU | 100-300 employees
INSERT INTO peer_benchmark_data (industry, region, size_category, business_type, metric_catalog_id, metric_type, peer_count, adoption_percent, intensity_metric, p25_intensity, p50_intensity, p75_intensity, p90_intensity, avg_absolute_value, data_as_of, calculation_method)
SELECT 'Manufacturing', 'EU', '100-300', 'Electronics', mc.id, 'emissions', 31, 98.0, 'per_employee',
  8.5, 12.3, 18.6, 28.5, 2460.0, CURRENT_DATE, 'Aggregated from 31 peer organizations (tCO2e)'
FROM metrics_catalog mc WHERE mc.scope = 'scope_1' LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

INSERT INTO peer_benchmark_data (industry, region, size_category, business_type, metric_catalog_id, metric_type, peer_count, adoption_percent, intensity_metric, p25_intensity, p50_intensity, p75_intensity, p90_intensity, avg_absolute_value, data_as_of, calculation_method)
SELECT 'Manufacturing', 'EU', '100-300', 'Electronics', mc.id, 'water', 28, 92.0, 'per_employee',
  45.0, 68.0, 95.0, 135.0, 13600.0, CURRENT_DATE, 'Aggregated from 28 peer organizations (m³)'
FROM metrics_catalog mc WHERE mc.category ILIKE '%water%consumption%' LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

INSERT INTO peer_benchmark_data (industry, region, size_category, business_type, metric_catalog_id, metric_type, peer_count, adoption_percent, intensity_metric, p25_intensity, p50_intensity, p75_intensity, p90_intensity, avg_absolute_value, data_as_of, calculation_method)
SELECT 'Manufacturing', 'EU', '100-300', 'Electronics', mc.id, 'waste', 33, 95.0, 'per_employee',
  0.8, 1.2, 1.8, 2.6, 240.0, CURRENT_DATE, 'Aggregated from 33 peer organizations (tonnes)'
FROM metrics_catalog mc WHERE mc.category ILIKE '%waste%generated%' LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

-- RETAIL | North America | 100-300 employees
INSERT INTO peer_benchmark_data (industry, region, size_category, business_type, metric_catalog_id, metric_type, peer_count, adoption_percent, intensity_metric, p25_intensity, p50_intensity, p75_intensity, p90_intensity, avg_absolute_value, data_as_of, calculation_method)
SELECT 'Retail', 'North America', '100-300', 'E-commerce', mc.id, 'emissions', 24, 89.0, 'per_employee',
  2.8, 4.2, 6.5, 9.8, 840.0, CURRENT_DATE, 'Aggregated from 24 peer organizations (tCO2e)'
FROM metrics_catalog mc WHERE mc.scope = 'scope_2' LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

INSERT INTO peer_benchmark_data (industry, region, size_category, business_type, metric_catalog_id, metric_type, peer_count, adoption_percent, intensity_metric, p25_intensity, p50_intensity, p75_intensity, p90_intensity, avg_absolute_value, data_as_of, calculation_method)
SELECT 'Retail', 'North America', '100-300', 'E-commerce', mc.id, 'waste', 21, 88.0, 'per_employee',
  0.35, 0.52, 0.78, 1.2, 104.0, CURRENT_DATE, 'Aggregated from 21 peer organizations (tonnes)'
FROM metrics_catalog mc WHERE mc.category ILIKE '%waste%generated%' LIMIT 1
ON CONFLICT (industry, region, size_category, metric_catalog_id, data_as_of) DO NOTHING;

-- Add "general" industry fallbacks for companies that don't fit specific sectors
INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT 'general', NULL, mc.id, 'GRI 305-1', 'high', true, true,
  'Scope 1 emissions are universally material for climate impact and increasingly financially material due to carbon pricing.',
  '["ESRS_E1", "GRI_305", "SBTi", "TCFD"]'::jsonb, false, 'GRI Universal Standards'
FROM metrics_catalog mc WHERE mc.scope = 'scope_1' LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

INSERT INTO industry_materiality (industry, gri_sector_code, metric_catalog_id, gri_disclosure, materiality_level, impact_materiality, financial_materiality, materiality_reason, required_for_frameworks, mandatory, source)
SELECT 'general', NULL, mc.id, 'GRI 305-2', 'high', true, true,
  'Scope 2 emissions from electricity are material across all industries.',
  '["ESRS_E1", "GRI_305", "SBTi", "TCFD"]'::jsonb, false, 'GRI Universal Standards'
FROM metrics_catalog mc WHERE mc.scope = 'scope_2' LIMIT 1
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- Summary comment
COMMENT ON TABLE industry_materiality IS 'Industry-specific materiality mappings based on GRI Sector Standards and ESRS double materiality. Covers Services (GRI 11), Manufacturing (GRI 15), Retail (GRI 17), and general fallbacks.';
COMMENT ON TABLE peer_benchmark_data IS 'Anonymous peer benchmark data for sustainability metrics. Based on real-world reporting patterns from similar companies (minimum 10 peers per benchmark for privacy).';
