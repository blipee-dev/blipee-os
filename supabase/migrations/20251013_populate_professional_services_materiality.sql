-- Populate Industry Materiality for Professional Services (Law Firms)
-- Based on GRI 11 (Services) and actual business operations

-- This defines which metrics are MATERIAL for professional services organizations
-- Materiality based on:
-- 1. GRI Sector Standard for Services (GRI 11)
-- 2. Typical law firm operations (office-based, knowledge work)
-- 3. ESRS double materiality (impact + financial)

-- ==================================================
-- HIGH MATERIALITY - Critical for professional services
-- ==================================================

-- Category: Employee Commuting (Scope 3-7) - HIGH for office work
INSERT INTO industry_materiality (
  industry, gri_sector_code, metric_catalog_id, gri_disclosure,
  materiality_level, impact_materiality, financial_materiality,
  materiality_reason, required_for_frameworks, mandatory
)
SELECT
  'professional_services', 'GRI_11', mc.id, 'GRI 305-3',
  'high', true, true,
  'Employee commuting is a major emissions source for office-based professional services. High impact on climate and financial materiality due to commuting policies.',
  '["ESRS_E1", "GRI_305", "CDP_Climate"]'::jsonb, false
FROM metrics_catalog mc
WHERE mc.code IN (
  'scope3_employee_commute_car',
  'scope3_employee_commute_public',
  'scope3_employee_commute_bike',
  'scope3_remote_work'
)
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- Category: Business Travel (Scope 3-6) - HIGH for client-facing services
INSERT INTO industry_materiality (
  industry, gri_sector_code, metric_catalog_id, gri_disclosure,
  materiality_level, impact_materiality, financial_materiality,
  materiality_reason, required_for_frameworks, mandatory
)
SELECT
  'professional_services', 'GRI_11', mc.id, 'GRI 305-3',
  'high', true, true,
  'Business travel for client meetings is essential to professional services. Significant environmental impact and controllable cost center.',
  '["ESRS_E1", "GRI_305", "CDP_Climate"]'::jsonb, false
FROM metrics_catalog mc
WHERE mc.code IN (
  'scope3_business_travel_road',
  'scope3_business_travel_air',
  'scope3_business_travel_rail',
  'scope3_hotel_nights'
)
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- Category: Electricity (Scope 2) - HIGH for office operations
INSERT INTO industry_materiality (
  industry, gri_sector_code, metric_catalog_id, gri_disclosure,
  materiality_level, impact_materiality, financial_materiality,
  materiality_reason, required_for_frameworks, mandatory
)
SELECT
  'professional_services', 'GRI_11', mc.id, 'GRI 305-2',
  'high', true, true,
  'Office electricity consumption is the primary Scope 2 emission source. Directly controllable and financially material.',
  '["ESRS_E1", "GRI_305", "CDP_Climate", "TCFD"]'::jsonb, true
FROM metrics_catalog mc
WHERE mc.code IN (
  'scope2_electricity',
  'scope2_renewable_electricity',
  'scope2_ev_charging'
)
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- Category: IT Equipment (Scope 3-2 Capital Goods) - HIGH for knowledge work
INSERT INTO industry_materiality (
  industry, gri_sector_code, metric_catalog_id, gri_disclosure,
  materiality_level, impact_materiality, financial_materiality,
  materiality_reason, required_for_frameworks, mandatory
)
SELECT
  'professional_services', 'GRI_11', mc.id, 'GRI 305-3',
  'high', true, false,
  'IT equipment (laptops, servers, devices) is essential infrastructure for professional services. Significant embodied emissions in production.',
  '["ESRS_E1", "GRI_305"]'::jsonb, false
FROM metrics_catalog mc
WHERE mc.code = 'scope3_it_equipment'
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- Category: Paper & Office Supplies (Scope 3-1) - HIGH for law firms
INSERT INTO industry_materiality (
  industry, gri_sector_code, metric_catalog_id, gri_disclosure,
  materiality_level, impact_materiality, financial_materiality,
  materiality_reason, required_for_frameworks, mandatory
)
SELECT
  'professional_services', 'GRI_11', mc.id, 'GRI 305-3',
  'high', true, false,
  'Paper consumption in legal and professional services remains significant despite digitalization. Tied to deforestation impacts.',
  '["ESRS_E1", "GRI_305"]'::jsonb, false
FROM metrics_catalog mc
WHERE mc.code IN ('scope3_waste_recycling_paper', 'scope3_purchased_goods')
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- ==================================================
-- MEDIUM MATERIALITY - Important but not critical
-- ==================================================

-- Category: Waste (Scope 3-5) - MEDIUM for offices
INSERT INTO industry_materiality (
  industry, gri_sector_code, metric_catalog_id, gri_disclosure,
  materiality_level, impact_materiality, financial_materiality,
  materiality_reason, required_for_frameworks, mandatory
)
SELECT
  'professional_services', 'GRI_11', mc.id, 'GRI 306-3',
  'medium', true, false,
  'Office waste generation (paper, plastic, e-waste) has moderate environmental impact. Recycling programs can improve circularity.',
  '["ESRS_E5", "GRI_306"]'::jsonb, false
FROM metrics_catalog mc
WHERE mc.code IN (
  'scope3_waste_recycling',
  'scope3_waste_composted',
  'scope3_waste_to_landfill',
  'scope3_waste_incinerated',
  'scope3_ewaste',
  'scope3_waste_ewaste_recycled',
  'scope3_waste_recycling_plastic',
  'scope3_waste_recycling_metal',
  'scope3_waste_recycling_glass',
  'scope3_waste_recycling_mixed'
)
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- Category: Water (Scope 3) - MEDIUM for office buildings
INSERT INTO industry_materiality (
  industry, gri_sector_code, metric_catalog_id, gri_disclosure,
  materiality_level, impact_materiality, financial_materiality,
  materiality_reason, required_for_frameworks, mandatory
)
SELECT
  'professional_services', 'GRI_11', mc.id, 'GRI 303-3',
  'medium', true, false,
  'Water consumption in office buildings is moderate. Important for sustainability disclosure but not primary environmental impact.',
  '["ESRS_E3", "GRI_303", "CDP_Water"]'::jsonb, false
FROM metrics_catalog mc
WHERE mc.code LIKE 'scope3_water%' OR mc.code LIKE 'scope3_wastewater%'
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- Category: Heating/Cooling (Scope 2) - MEDIUM climate dependent
INSERT INTO industry_materiality (
  industry, gri_sector_code, metric_catalog_id, gri_disclosure,
  materiality_level, impact_materiality, financial_materiality,
  materiality_reason, required_for_frameworks, mandatory
)
SELECT
  'professional_services', 'GRI_11', mc.id, 'GRI 305-2',
  'medium', true, true,
  'Heating and cooling for office comfort. Impact varies by climate zone. Financially material in extreme climates.',
  '["ESRS_E1", "GRI_305"]'::jsonb, false
FROM metrics_catalog mc
WHERE mc.code IN (
  'scope2_district_heating',
  'scope2_district_cooling',
  'scope2_purchased_heating',
  'scope2_purchased_cooling'
)
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- Category: Cloud Computing (Scope 3-1) - MEDIUM for digital services
INSERT INTO industry_materiality (
  industry, gri_sector_code, metric_catalog_id, gri_disclosure,
  materiality_level, impact_materiality, financial_materiality,
  materiality_reason, required_for_frameworks, mandatory
)
SELECT
  'professional_services', 'GRI_11', mc.id, 'GRI 305-3',
  'medium', true, false,
  'Cloud services and data centers power digital operations. Growing emissions source as services digitalize.',
  '["ESRS_E1", "GRI_305"]'::jsonb, false
FROM metrics_catalog mc
WHERE mc.code IN ('scope3_cloud_computing', 'scope3_software_licenses')
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- ==================================================
-- LOW MATERIALITY - Not typically material for professional services
-- ==================================================

-- Category: Scope 1 emissions - LOW for office-based services
INSERT INTO industry_materiality (
  industry, gri_sector_code, metric_catalog_id, gri_disclosure,
  materiality_level, impact_materiality, financial_materiality,
  materiality_reason, required_for_frameworks, mandatory
)
SELECT
  'professional_services', 'GRI_11', mc.id, 'GRI 305-1',
  'low', false, false,
  'Scope 1 emissions are typically minimal or zero for office-based professional services without company vehicles or on-site combustion.',
  '["ESRS_E1", "GRI_305"]'::jsonb, false
FROM metrics_catalog mc
WHERE mc.scope = 'scope_1'
ON CONFLICT (industry, gri_sector_code, metric_catalog_id) DO NOTHING;

-- ==================================================
-- Summary
-- ==================================================

DO $$
DECLARE
  high_count INTEGER;
  medium_count INTEGER;
  low_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO high_count FROM industry_materiality
    WHERE industry = 'professional_services' AND materiality_level = 'high';

  SELECT COUNT(*) INTO medium_count FROM industry_materiality
    WHERE industry = 'professional_services' AND materiality_level = 'medium';

  SELECT COUNT(*) INTO low_count FROM industry_materiality
    WHERE industry = 'professional_services' AND materiality_level = 'low';

  RAISE NOTICE '';
  RAISE NOTICE '====================================';
  RAISE NOTICE '✅ PROFESSIONAL SERVICES MATERIALITY POPULATED';
  RAISE NOTICE '====================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Industry: Professional Services (GRI 11)';
  RAISE NOTICE 'High Materiality Metrics: %', high_count;
  RAISE NOTICE 'Medium Materiality Metrics: %', medium_count;
  RAISE NOTICE 'Low Materiality Metrics: %', low_count;
  RAISE NOTICE 'Total: %', high_count + medium_count + low_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Recommendations will now prioritize:';
  RAISE NOTICE '  1. Employee commuting tracking';
  RAISE NOTICE '  2. Business travel monitoring';
  RAISE NOTICE '  3. IT equipment lifecycle';
  RAISE NOTICE '  4. Paper/office supplies';
  RAISE NOTICE '  5. Waste & recycling programs';
  RAISE NOTICE '';
  RAISE NOTICE '====================================';
END $$;
