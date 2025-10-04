-- Framework Interoperability Mapping Seed Data
-- Maps metrics to GRI, ESRS, TCFD, and IFRS S2

-- This creates the cross-walk between different reporting frameworks
-- Based on official mapping documents:
-- - EFRAG/GRI Interoperability Index (2024)
-- - ESRS-ISSB Comparison (2024)
-- - TCFD Recommendations

INSERT INTO framework_mappings (datapoint_code, gri_codes, esrs_codes, tcfd_references, ifrs_s2_codes, description, unit) VALUES

-- SCOPE 1 EMISSIONS
('scope1_total', ARRAY['305-1'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.i'], 'Gross direct (Scope 1) GHG emissions', 'tCO2e'),
('scope1_biogenic', ARRAY['305-1'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iii'], 'Biogenic CO2 emissions from Scope 1', 'tCO2e'),

-- SCOPE 2 EMISSIONS (dual reporting)
('scope2_location_based', ARRAY['305-2'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.ii'], 'Gross Scope 2 emissions (location-based)', 'tCO2e'),
('scope2_market_based', ARRAY['305-2'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.ii'], 'Gross Scope 2 emissions (market-based)', 'tCO2e'),

-- SCOPE 3 EMISSIONS (by category)
('scope3_total', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Gross Scope 3 GHG emissions', 'tCO2e'),
('scope3_cat1', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 1: Purchased Goods & Services', 'tCO2e'),
('scope3_cat2', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 2: Capital Goods', 'tCO2e'),
('scope3_cat3', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 3: Fuel and Energy Related Activities', 'tCO2e'),
('scope3_cat4', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 4: Upstream Transportation', 'tCO2e'),
('scope3_cat5', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 5: Waste Generated in Operations', 'tCO2e'),
('scope3_cat6', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 6: Business Travel', 'tCO2e'),
('scope3_cat7', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 7: Employee Commuting', 'tCO2e'),
('scope3_cat8', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 8: Upstream Leased Assets', 'tCO2e'),
('scope3_cat9', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 9: Downstream Transportation', 'tCO2e'),
('scope3_cat10', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 10: Processing of Sold Products', 'tCO2e'),
('scope3_cat11', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 11: Use of Sold Products', 'tCO2e'),
('scope3_cat12', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 12: End-of-Life Treatment', 'tCO2e'),
('scope3_cat13', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 13: Downstream Leased Assets', 'tCO2e'),
('scope3_cat14', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 14: Franchises', 'tCO2e'),
('scope3_cat15', ARRAY['305-3'], ARRAY['E1-6'], ARRAY['Metrics a.i'], ARRAY['29.a.iv'], 'Scope 3 Category 15: Investments', 'tCO2e'),

-- INTENSITY METRICS
('intensity_revenue', ARRAY['305-4'], ARRAY['E1-6'], ARRAY['Metrics a.ii'], ARRAY['29.b'], 'GHG emissions intensity per revenue', 'tCO2e/€M'),
('intensity_area', ARRAY['305-4'], ARRAY['E1-6'], ARRAY['Metrics a.ii'], NULL, 'GHG emissions intensity per area', 'tCO2e/m²'),
('intensity_fte', ARRAY['305-4'], ARRAY['E1-6'], ARRAY['Metrics a.ii'], NULL, 'GHG emissions intensity per FTE', 'tCO2e/FTE'),

-- REMOVALS AND CREDITS (ESRS specific)
('removals_total', ARRAY['305-1', '305-2', '305-3'], ARRAY['E1-7'], NULL, NULL, 'Total GHG removals and storage', 'tCO2e'),
('credits_total', ARRAY['305-5'], ARRAY['E1-7'], NULL, NULL, 'GHG emissions reductions from climate change mitigation projects', 'tCO2e'),

-- ENERGY (GRI 302 / ESRS E1-5)
('energy_consumption_total', ARRAY['302-1'], ARRAY['E1-5'], NULL, ARRAY['6.a'], 'Total energy consumption', 'MWh'),
('energy_renewable', ARRAY['302-1'], ARRAY['E1-5'], NULL, ARRAY['6.b'], 'Renewable energy consumption', 'MWh'),
('energy_intensity', ARRAY['302-3'], ARRAY['E1-5'], NULL, NULL, 'Energy intensity', 'MWh/€M'),

-- WATER (GRI 303)
('water_withdrawal', ARRAY['303-3'], NULL, NULL, NULL, 'Total water withdrawal', 'm³'),
('water_consumption', ARRAY['303-5'], NULL, NULL, NULL, 'Total water consumption', 'm³'),
('water_discharge', ARRAY['303-4'], NULL, NULL, NULL, 'Total water discharge', 'm³'),

-- WASTE (GRI 306)
('waste_generated', ARRAY['306-3'], NULL, NULL, NULL, 'Total waste generated', 'tonnes'),
('waste_diverted', ARRAY['306-4'], NULL, NULL, NULL, 'Waste diverted from disposal', 'tonnes'),
('waste_to_disposal', ARRAY['306-5'], NULL, NULL, NULL, 'Waste directed to disposal', 'tonnes'),

-- TRANSITION PLAN (ESRS E1-1)
('transition_plan_targets', NULL, ARRAY['E1-1'], ARRAY['Strategy a'], NULL, 'GHG emission reduction targets', 'text'),
('transition_plan_decarbonization', NULL, ARRAY['E1-1'], ARRAY['Strategy b'], NULL, 'Decarbonisation levers', 'text'),

-- CAPEX/OPEX (ESRS E1-3)
('capex_climate', NULL, ARRAY['E1-3'], ARRAY['Strategy c'], NULL, 'CapEx plan for climate change mitigation', '€'),
('opex_climate', NULL, ARRAY['E1-3'], NULL, NULL, 'OpEx for climate change mitigation', '€'),

-- TARGETS (GRI 305-5 / ESRS E1-4 / TCFD)
('target_scope1_reduction', ARRAY['305-5'], ARRAY['E1-4'], ARRAY['Metrics b'], ARRAY['33'], 'Scope 1 emission reduction target', '%'),
('target_scope2_reduction', ARRAY['305-5'], ARRAY['E1-4'], ARRAY['Metrics b'], ARRAY['33'], 'Scope 2 emission reduction target', '%'),
('target_scope3_reduction', ARRAY['305-5'], ARRAY['E1-4'], ARRAY['Metrics b'], ARRAY['33'], 'Scope 3 emission reduction target', '%'),
('target_base_year', NULL, ARRAY['E1-4'], ARRAY['Metrics b'], ARRAY['33.a'], 'Target base year', 'year'),
('target_year', NULL, ARRAY['E1-4'], ARRAY['Metrics b'], ARRAY['33.b'], 'Target achievement year', 'year'),

-- GOVERNANCE (ESRS 2 / TCFD)
('board_climate_oversight', NULL, ARRAY['ESRS-2'], ARRAY['Governance a'], ARRAY['6'], 'Board oversight of climate-related issues', 'text'),
('management_climate_role', NULL, ARRAY['ESRS-2'], ARRAY['Governance b'], ARRAY['7'], 'Management role in climate-related issues', 'text'),

-- RISK MANAGEMENT (TCFD / IFRS S2)
('physical_risks', NULL, ARRAY['E1-9'], ARRAY['Risk a'], ARRAY['10'], 'Physical climate risks', 'text'),
('transition_risks', NULL, ARRAY['E1-9'], ARRAY['Risk a'], ARRAY['10'], 'Transition climate risks', 'text'),
('climate_opportunities', NULL, ARRAY['E1-9'], ARRAY['Strategy c'], ARRAY['13'], 'Climate-related opportunities', 'text'),

-- SCENARIO ANALYSIS (TCFD / ESRS E1-9)
('scenario_1.5c', NULL, ARRAY['E1-9'], ARRAY['Strategy c'], ARRAY['14'], 'Climate scenario analysis - 1.5°C pathway', 'text'),
('scenario_2c', NULL, ARRAY['E1-9'], ARRAY['Strategy c'], ARRAY['14'], 'Climate scenario analysis - 2°C pathway', 'text'),

-- INTERNAL CARBON PRICE (ESRS E1-8)
('carbon_price', NULL, ARRAY['E1-8'], ARRAY['Metrics c'], NULL, 'Internal carbon price', '€/tCO2e');

-- Add comments for documentation
COMMENT ON TABLE framework_mappings IS 'Cross-reference table mapping sustainability metrics to multiple reporting frameworks (GRI, ESRS, TCFD, IFRS S2)';
COMMENT ON COLUMN framework_mappings.gri_codes IS 'GRI Universal Standards 2021 disclosure numbers';
COMMENT ON COLUMN framework_mappings.esrs_codes IS 'ESRS (European Sustainability Reporting Standards) datapoint references';
COMMENT ON COLUMN framework_mappings.tcfd_references IS 'TCFD (Task Force on Climate-related Financial Disclosures) pillar references';
COMMENT ON COLUMN framework_mappings.ifrs_s2_codes IS 'IFRS S2 Climate-related Disclosures paragraph references';
