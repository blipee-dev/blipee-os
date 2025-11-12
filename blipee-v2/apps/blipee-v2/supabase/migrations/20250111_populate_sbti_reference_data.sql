-- ============================================================================
-- POPULATE SBTI REFERENCE DATA
-- ============================================================================
-- This migration populates reference data for the SBTi system:
-- 1. Pathway data (IEA scenarios for sectors)
-- 2. Validation criteria (C1-C28)
-- 3. Sector thresholds
-- ============================================================================

-- ============================================================================
-- 1. SECTOR THRESHOLDS
-- ============================================================================

INSERT INTO sbti_sector_thresholds (sector, threshold_type, threshold_value, threshold_unit, requirement_description, applies_to)
VALUES
  ('flag', 'emissions_percentage', 20, '%', 'Must disaggregate FLAG target (C11)', 'both'),
  ('buildings', 'emissions_percentage', 20, '%', 'Must use SDA or physical intensity method', 'both'),
  ('power_generation', 'revenue_percentage', 5, '%', 'Can use intensity (tCO2e/MWh) or RE method; long-term target ≤2040', 'both'),
  ('financial_institutions', 'revenue_percentage', 5, '%', 'Must use SBTi Financial Institutions guidance', 'both'),
  ('transport', 'emissions_percentage', 50, '%', 'Can use intensity metric (tCO2e/tkm or pkm)', 'both')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. SBT VALIDATION CRITERIA (Near-Term V5.3 and Net-Zero V1.3)
-- ============================================================================

-- Near-Term Criteria (V5.3)
INSERT INTO sbti_criteria (version, criteria_type, criterion_code, criterion_name, criterion_description, validation_rule, is_mandatory, effective_date)
VALUES
  ('5.3', 'near_term', 'C1', 'Organizational boundary', 'Target must cover all entities within organizational boundary per GHG Protocol', '{"check": "organizational_boundary"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C2', 'GHG Protocol alignment', 'Emissions accounting must align with GHG Protocol Corporate Standard', '{"check": "ghg_protocol_compliance"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C3', 'Scope 1 inclusion', 'Scope 1 emissions must be included if material', '{"check": "scope1_included"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C4', 'Scope 2 inclusion', 'Scope 2 emissions must be included if material', '{"check": "scope2_included"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C5', 'Scope 3 inclusion', 'Scope 3 emissions must be included if material', '{"check": "scope3_included"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C6', 'Coverage thresholds', 'Minimum 95% Scope 1+2, 67% Scope 3 coverage', '{"scope1_2_min": 95, "scope3_min": 67}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C7', 'Exclusions justification', 'Any exclusions must be justified and documented', '{"check": "exclusions_justified"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C8', 'Emissions sources', 'All material emissions sources must be included', '{"check": "material_sources"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C9', 'GWP values', 'Use AR5 or later IPCC GWP values', '{"minimum_ar": "AR5"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C10', 'Biogenic accounting', 'Include NET CO₂ emissions from biogenic sources', '{"require_net_co2": true}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C11', 'FLAG disaggregation', 'Disaggregate FLAG if ≥20% emissions OR specific sectors + ≥5%', '{"threshold": 20, "specific_sectors_threshold": 5}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C12', 'Scope 3 categories', 'Report relevant Scope 3 categories (15 total)', '{"check": "scope3_categories_reported"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C13', 'Timeframe', '5-10 years from submission, base year ≥2015', '{"min_years": 5, "max_years": 10, "min_base_year": 2015}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C14', 'Target formulation', 'Target must be clearly formulated and measurable', '{"check": "clear_formulation"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C15', 'Scope 1+2 ambition', 'Minimum 1.5°C alignment for Scope 1+2', '{"min_ambition": "1.5C"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C16', 'Scope 1+2 calculation', 'Correctly calculated using approved methods', '{"check": "calculation_valid"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C17', 'Intensity denominator', 'Appropriate denominator for intensity targets', '{"check": "appropriate_denominator"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C18', 'Scope 3 ambition', 'Minimum well-below 2°C alignment for Scope 3', '{"min_ambition": "well_below_2C"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C19', 'Scope 3 calculation', 'Correctly calculated using approved methods', '{"check": "calculation_valid"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C20', 'Supplier engagement', 'Supplier engagement target if applicable', '{"check": "supplier_engagement"}', false, '2025-09-01'),
  ('5.3', 'near_term', 'C21', 'Customer engagement', 'Customer use of products target if applicable', '{"check": "customer_engagement"}', false, '2025-09-01'),
  ('5.3', 'near_term', 'C22', 'Fossil fuel sector', 'Distributors must set 1.5°C target for Category 11', '{"sector": "oil_gas", "category_11_ambition": "1.5C"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C23', 'Financial institutions', 'FIs must use SBTi FI guidance', '{"check": "fi_guidance"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C24', 'SBT communication', 'Publicly communicate commitment and targets', '{"check": "public_communication"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C25', 'Public disclosure', 'Disclose emissions annually (CDP, reports)', '{"check": "annual_disclosure"}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C26', 'Recalculation policy', 'Recalculate if significant changes (>5%)', '{"significance_threshold": 5}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C27', 'Review and update', 'Review target every 5 years minimum', '{"review_frequency_years": 5}', true, '2025-09-01'),
  ('5.3', 'near_term', 'C28', 'Verification', 'Third-party verification encouraged', '{"check": "verification"}', false, '2025-09-01')
ON CONFLICT DO NOTHING;

-- Net-Zero Criteria (V1.3) - Key differences from near-term
INSERT INTO sbti_criteria (version, criteria_type, criterion_code, criterion_name, criterion_description, validation_rule, is_mandatory, effective_date)
VALUES
  ('1.3', 'long_term', 'C7', 'Coverage thresholds', 'Minimum 95% Scope 1+2, 90% Scope 3 coverage (stricter)', '{"scope1_2_min": 95, "scope3_min": 90}', true, '2025-09-01'),
  ('1.3', 'long_term', 'C13', 'Timeframe', 'Target year ≤2050 (Power/Maritime ≤2040)', '{"max_year": 2050, "power_maritime_max": 2040}', true, '2025-09-01'),
  ('1.3', 'long_term', 'C14', 'Net-zero definition', 'Deep reduction to residual level + neutralization', '{"require_deep_reduction": true, "require_neutralization": true}', true, '2025-09-01'),
  ('1.3', 'long_term', 'C17', 'Power/Maritime deadline', 'Power and maritime sectors must reach net-zero by 2040', '{"sectors": ["power_generation"], "max_year": 2040}', true, '2025-09-01'),
  ('1.3', 'long_term', 'C22', 'Scope 3 ambition', 'Scope 3 must be 1.5°C aligned (stricter than near-term)', '{"min_ambition": "1.5C"}', true, '2025-09-01'),
  ('1.3', 'long_term', 'C28', 'Neutralization', 'Neutralization plan required for residual emissions', '{"require_plan": true, "min_permanence": ">100_years", "acceptable_methods": ["DACCS", "BECCS", "enhanced_weathering"]}', true, '2025-09-01')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. PATHWAY DATA (Sample - Iron & Steel and Power sectors)
-- ============================================================================
-- Note: This is a subset. Full dataset should be imported from IEA data

-- Iron & Steel - SBTi 1.5C Pathway (2015-2030)
INSERT INTO sbti_pathways (scenario, sector, region, metric_type, unit, year, value, data_source)
VALUES
  ('SBTi_1.5C', 'iron_steel', 'World', 'Emissions', 'MtCO2', 2015, 2260.96, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'iron_steel', 'World', 'Emissions', 'MtCO2', 2016, 2183.51, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'iron_steel', 'World', 'Emissions', 'MtCO2', 2017, 2106.06, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'iron_steel', 'World', 'Emissions', 'MtCO2', 2018, 2028.61, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'iron_steel', 'World', 'Emissions', 'MtCO2', 2019, 1951.16, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'iron_steel', 'World', 'Emissions', 'MtCO2', 2020, 1873.70, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'iron_steel', 'World', 'Emissions', 'MtCO2', 2025, 1565.25, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'iron_steel', 'World', 'Emissions', 'MtCO2', 2030, 1256.80, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'iron_steel', 'World', 'Emissions', 'MtCO2', 2040, 640.00, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'iron_steel', 'World', 'Emissions', 'MtCO2', 2050, 100.00, 'IEA ETP 2020')
ON CONFLICT DO NOTHING;

-- Cement - SBTi 1.5C Pathway (2015-2030)
INSERT INTO sbti_pathways (scenario, sector, region, metric_type, unit, year, value, data_source)
VALUES
  ('SBTi_1.5C', 'cement', 'World', 'Emissions', 'MtCO2', 2015, 2220.61, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cement', 'World', 'Emissions', 'MtCO2', 2016, 2211.13, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cement', 'World', 'Emissions', 'MtCO2', 2017, 2201.64, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cement', 'World', 'Emissions', 'MtCO2', 2018, 2192.15, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cement', 'World', 'Emissions', 'MtCO2', 2019, 2182.66, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cement', 'World', 'Emissions', 'MtCO2', 2020, 2173.17, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cement', 'World', 'Emissions', 'MtCO2', 2025, 2125.87, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cement', 'World', 'Emissions', 'MtCO2', 2030, 2078.57, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cement', 'World', 'Emissions', 'MtCO2', 2040, 1750.00, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cement', 'World', 'Emissions', 'MtCO2', 2050, 1200.00, 'IEA ETP 2020')
ON CONFLICT DO NOTHING;

-- Power Generation - SBTi 1.5C Pathway (2015-2040)
INSERT INTO sbti_pathways (scenario, sector, region, metric_type, unit, year, value, data_source)
VALUES
  ('SBTi_1.5C', 'power_generation', 'World', 'Emissions', 'MtCO2', 2015, 11575.23, 'IEA NZE 2021'),
  ('SBTi_1.5C', 'power_generation', 'World', 'Emissions', 'MtCO2', 2016, 11551.84, 'IEA NZE 2021'),
  ('SBTi_1.5C', 'power_generation', 'World', 'Emissions', 'MtCO2', 2017, 11528.45, 'IEA NZE 2021'),
  ('SBTi_1.5C', 'power_generation', 'World', 'Emissions', 'MtCO2', 2018, 11505.06, 'IEA NZE 2021'),
  ('SBTi_1.5C', 'power_generation', 'World', 'Emissions', 'MtCO2', 2019, 11481.67, 'IEA NZE 2021'),
  ('SBTi_1.5C', 'power_generation', 'World', 'Emissions', 'MtCO2', 2020, 11458.28, 'IEA NZE 2021'),
  ('SBTi_1.5C', 'power_generation', 'World', 'Emissions', 'MtCO2', 2025, 9250.00, 'IEA NZE 2021'),
  ('SBTi_1.5C', 'power_generation', 'World', 'Emissions', 'MtCO2', 2030, 7000.00, 'IEA NZE 2021'),
  ('SBTi_1.5C', 'power_generation', 'World', 'Emissions', 'MtCO2', 2035, 3500.00, 'IEA NZE 2021'),
  ('SBTi_1.5C', 'power_generation', 'World', 'Emissions', 'MtCO2', 2040, 500.00, 'IEA NZE 2021'),
  ('SBTi_1.5C', 'power_generation', 'World', 'Emissions', 'MtCO2', 2050, 0.00, 'IEA NZE 2021')
ON CONFLICT DO NOTHING;

-- Cross-sector - SBTi 1.5C Pathway (for companies without specific sector)
INSERT INTO sbti_pathways (scenario, sector, region, metric_type, unit, year, value, data_source)
VALUES
  ('SBTi_1.5C', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2015, 33608.68, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2016, 32963.45, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2017, 32318.23, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2018, 31673.00, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2019, 31027.77, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2020, 30382.55, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2025, 25500.00, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2030, 20600.00, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2040, 10300.00, 'IEA ETP 2020'),
  ('SBTi_1.5C', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2050, 5000.00, 'IEA ETP 2020')
ON CONFLICT DO NOTHING;

-- Well-below 2C pathway (ETP B2DS) - Cross-sector
INSERT INTO sbti_pathways (scenario, sector, region, metric_type, unit, year, value, data_source)
VALUES
  ('ETP_B2DS', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2015, 34253.90, 'IEA ETP 2017'),
  ('ETP_B2DS', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2016, 33608.68, 'IEA ETP 2017'),
  ('ETP_B2DS', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2017, 32963.45, 'IEA ETP 2017'),
  ('ETP_B2DS', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2018, 32318.23, 'IEA ETP 2017'),
  ('ETP_B2DS', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2019, 31673.00, 'IEA ETP 2017'),
  ('ETP_B2DS', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2020, 31027.77, 'IEA ETP 2017'),
  ('ETP_B2DS', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2025, 27000.00, 'IEA ETP 2017'),
  ('ETP_B2DS', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2030, 23000.00, 'IEA ETP 2017'),
  ('ETP_B2DS', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2040, 15000.00, 'IEA ETP 2017'),
  ('ETP_B2DS', 'cross_sector', 'World', 'Emissions', 'MtCO2', 2050, 8000.00, 'IEA ETP 2017')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show counts
DO $$
DECLARE
  v_pathways_count INTEGER;
  v_criteria_count INTEGER;
  v_thresholds_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_pathways_count FROM sbti_pathways;
  SELECT COUNT(*) INTO v_criteria_count FROM sbti_criteria;
  SELECT COUNT(*) INTO v_thresholds_count FROM sbti_sector_thresholds;

  RAISE NOTICE 'SBTi reference data populated successfully:';
  RAISE NOTICE '  - Pathways: % rows', v_pathways_count;
  RAISE NOTICE '  - Criteria: % rows', v_criteria_count;
  RAISE NOTICE '  - Sector thresholds: % rows', v_thresholds_count;
END $$;
