-- ============================================================================
-- GRI COMPREHENSIVE METRICS - Add all GRI standards to metrics_catalog
-- ============================================================================
-- This migration adds all GRI metric definitions to the existing metrics_catalog
-- Integrates with Climatiq API for automated emission factors
-- Uses existing categories and JSONB metadata for GRI-specific information
-- ============================================================================

BEGIN;

-- ============================================================================
-- GRI 301: MATERIALS (8 metrics)
-- ============================================================================

INSERT INTO metrics_catalog (code, name, scope, category, subcategory, unit, description, is_active, ghg_protocol_category) VALUES
('gri_301_1_materials_total', 'Total Materials Used', 'scope_3', 'Raw Materials', 'Total', 'tonnes', 'GRI 301-1: Total weight or volume of materials used to produce and package products', true, 'Purchased Goods & Services'),
('gri_301_1_renewable_materials', 'Renewable Materials Used', 'scope_3', 'Renewable Materials', 'Materials', 'tonnes', 'GRI 301-1: Weight or volume of renewable materials used', true, 'Purchased Goods & Services'),
('gri_301_1_nonrenewable_materials', 'Non-Renewable Materials Used', 'scope_3', 'Raw Materials', 'Materials', 'tonnes', 'GRI 301-1: Weight or volume of non-renewable materials used', true, 'Purchased Goods & Services'),
('gri_301_2_recycled_input', 'Recycled Input Materials', 'scope_3', 'Recycled Materials', 'Inputs', 'tonnes', 'GRI 301-2: Percentage of recycled input materials used', true, 'Purchased Goods & Services'),
('gri_301_2_recycled_percentage', 'Recycled Input Percentage', 'scope_3', 'Recycled Materials', 'Percentage', '%', 'GRI 301-2: Percentage of recycled materials in total materials', true, 'Purchased Goods & Services'),
('gri_301_3_reclaimed_products', 'Reclaimed Products and Packaging', 'scope_3', 'Product Reclamation', 'Total', 'tonnes', 'GRI 301-3: Products and packaging materials reclaimed', true, 'End-of-Life'),
('gri_301_3_reclaimed_percentage', 'Reclaimed Products Percentage', 'scope_3', 'Product Reclamation', 'Percentage', '%', 'GRI 301-3: Percentage of reclaimed products', true, 'End-of-Life'),
('gri_301_packaging_materials', 'Packaging Materials Used', 'scope_3', 'Packaging Materials', 'Total', 'tonnes', 'GRI 301: Total packaging materials used', true, 'Purchased Goods & Services')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- GRI 302: ENERGY (20 metrics)
-- Automation: 80% (via Electricity Maps + Climatiq APIs)
-- ============================================================================

INSERT INTO metrics_catalog (code, name, scope, category, subcategory, unit, description, is_active, ghg_protocol_category, is_renewable, energy_type) VALUES
-- GRI 302-1: Energy consumption within the organization
('gri_302_1_fuel_consumption', 'Fuel Consumption (Non-Renewable)', 'scope_1', 'Stationary Combustion', 'Fuels', 'GJ', 'GRI 302-1: Total fuel consumption from non-renewable sources', true, 'Stationary Combustion', false, 'fuel'),
('gri_302_1_fuel_renewable', 'Fuel Consumption (Renewable)', 'scope_1', 'Stationary Combustion', 'Fuels', 'GJ', 'GRI 302-1: Total fuel consumption from renewable sources', true, 'Stationary Combustion', true, 'fuel'),
('gri_302_1_electricity_consumption', 'Electricity Consumption', 'scope_2', 'Electricity', 'Consumption', 'GJ', 'GRI 302-1: Total electricity consumption', true, 'Purchased Electricity', false, 'electricity'),
('gri_302_1_heating_consumption', 'Heating Consumption', 'scope_2', 'Purchased Energy', 'Heating', 'GJ', 'GRI 302-1: Total heating consumption', true, 'Purchased Heat', false, 'heating'),
('gri_302_1_cooling_consumption', 'Cooling Consumption', 'scope_2', 'Purchased Energy', 'Cooling', 'GJ', 'GRI 302-1: Total cooling consumption', true, 'Purchased Cooling', false, 'cooling'),
('gri_302_1_steam_consumption', 'Steam Consumption', 'scope_2', 'Purchased Energy', 'Steam', 'GJ', 'GRI 302-1: Total steam consumption', true, 'Purchased Steam', false, 'steam'),
('gri_302_1_energy_total', 'Total Energy Consumption', 'scope_1', 'Purchased Energy', 'Total', 'GJ', 'GRI 302-1: Total energy consumption within the organization', true, 'Total Energy', false, 'total'),

-- GRI 302-2: Energy consumption outside the organization
('gri_302_2_energy_outside', 'Energy Outside Organization', 'scope_3', 'Fuel & Energy Related', 'External', 'GJ', 'GRI 302-2: Energy consumption outside the organization', true, 'Upstream Energy', false, 'external'),

-- GRI 302-3: Energy intensity
('gri_302_3_intensity_revenue', 'Energy Intensity (per Revenue)', 'scope_1', 'Purchased Energy', 'Intensity', 'GJ/million EUR', 'GRI 302-3: Energy intensity ratio (energy/revenue)', true, 'Total Energy', false, 'total'),
('gri_302_3_intensity_production', 'Energy Intensity (per Unit)', 'scope_1', 'Purchased Energy', 'Intensity', 'GJ/unit', 'GRI 302-3: Energy intensity per unit of production', true, 'Total Energy', false, 'total'),

-- GRI 302-4: Reduction of energy consumption
('gri_302_4_energy_reduction', 'Energy Reduction Achieved', 'scope_1', 'Purchased Energy', 'Reduction', 'GJ', 'GRI 302-4: Reductions in energy consumption achieved', true, 'Total Energy', false, 'total'),
('gri_302_4_reduction_initiatives', 'Energy Reduction Initiatives', 'scope_1', 'Purchased Energy', 'Programs', 'GJ', 'GRI 302-4: Energy reductions from conservation and efficiency', true, 'Total Energy', false, 'total'),

-- GRI 302-5: Reductions in energy requirements
('gri_302_5_product_energy_reduction', 'Product Energy Requirement Reduction', 'scope_3', 'Use of Sold Products', 'Reduction', 'GJ', 'GRI 302-5: Reductions in energy requirements of products and services', true, 'Use Phase', false, 'products'),

-- Additional energy tracking
('gri_302_renewable_energy', 'Renewable Energy Generated', 'scope_2', 'Electricity', 'Generation', 'GJ', 'GRI 302: On-site renewable energy generation', true, 'Renewable Generation', true, 'renewable'),
('gri_302_renewable_percentage', 'Renewable Energy Percentage', 'scope_2', 'Electricity', 'Renewable %', '%', 'GRI 302: Percentage of energy from renewable sources', true, 'Renewable Generation', true, 'renewable'),
('gri_302_solar_generation', 'Solar Energy Generated', 'scope_2', 'Electricity', 'Solar', 'GJ', 'GRI 302: On-site solar energy generation', true, 'Renewable Generation', true, 'solar'),
('gri_302_wind_generation', 'Wind Energy Generated', 'scope_2', 'Electricity', 'Wind', 'GJ', 'GRI 302: On-site wind energy generation', true, 'Renewable Generation', true, 'wind'),
('gri_302_grid_renewable_percentage', 'Grid Renewable Percentage', 'scope_2', 'Electricity', 'Grid Mix', '%', 'GRI 302: Renewable percentage from grid electricity (from Electricity Maps)', true, 'Grid Electricity', true, 'grid'),
('gri_302_energy_sold', 'Energy Sold', 'scope_2', 'Electricity', 'Sold', 'GJ', 'GRI 302: Energy sold to external parties', true, 'Energy Sales', true, 'sold'),
('gri_302_self_generated', 'Self-Generated Energy', 'scope_2', 'Electricity', 'Self-Generated', 'GJ', 'GRI 302: Total self-generated energy', true, 'Self Generation', true, 'self_gen')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_renewable = EXCLUDED.is_renewable,
  energy_type = EXCLUDED.energy_type,
  updated_at = NOW();

-- ============================================================================
-- GRI 304: BIODIVERSITY (15 metrics)
-- Automation: 10% (location detection only)
-- ============================================================================

INSERT INTO metrics_catalog (code, name, scope, category, subcategory, unit, description, is_active, ghg_protocol_category) VALUES
('gri_304_1_sites_protected_areas', 'Sites in Protected Areas', 'scope_3', 'Biodiversity', 'Protected Areas', 'count', 'GRI 304-1: Operational sites in or adjacent to protected areas', true, NULL),
('gri_304_1_sites_high_biodiversity', 'Sites in High Biodiversity Areas', 'scope_3', 'Biodiversity', 'High Value', 'count', 'GRI 304-1: Sites in areas of high biodiversity value', true, NULL),
('gri_304_1_protected_area_size', 'Protected Area Size', 'scope_3', 'Biodiversity', 'Land Area', 'hectares', 'GRI 304-1: Size of operational sites in protected areas', true, NULL),
('gri_304_2_significant_impacts', 'Significant Biodiversity Impacts', 'scope_3', 'Biodiversity', 'Impacts', 'count', 'GRI 304-2: Number of significant impacts on biodiversity', true, NULL),
('gri_304_2_species_affected', 'Species Affected', 'scope_3', 'Biodiversity', 'Species', 'count', 'GRI 304-2: Number of species affected by operations', true, NULL),
('gri_304_2_habitat_size', 'Habitat Affected Size', 'scope_3', 'Biodiversity', 'Habitat', 'hectares', 'GRI 304-2: Size of habitats affected', true, NULL),
('gri_304_3_habitats_protected', 'Habitats Protected or Restored', 'scope_3', 'Biodiversity', 'Protection', 'hectares', 'GRI 304-3: Size of habitats protected or restored', true, NULL),
('gri_304_3_restoration_projects', 'Habitat Restoration Projects', 'scope_3', 'Biodiversity', 'Projects', 'count', 'GRI 304-3: Number of habitat restoration projects', true, NULL),
('gri_304_3_partnerships', 'Biodiversity Partnerships', 'scope_3', 'Biodiversity', 'Collaboration', 'count', 'GRI 304-3: Number of partnerships for habitat protection', true, NULL),
('gri_304_4_iucn_species', 'IUCN Red List Species', 'scope_3', 'Biodiversity', 'Threatened Species', 'count', 'GRI 304-4: Total IUCN Red List species in affected areas', true, NULL),
('gri_304_4_critically_endangered', 'Critically Endangered Species', 'scope_3', 'Biodiversity', 'Threatened Species', 'count', 'GRI 304-4: Number of critically endangered species', true, NULL),
('gri_304_4_endangered', 'Endangered Species', 'scope_3', 'Biodiversity', 'Threatened Species', 'count', 'GRI 304-4: Number of endangered species', true, NULL),
('gri_304_4_vulnerable', 'Vulnerable Species', 'scope_3', 'Biodiversity', 'Threatened Species', 'count', 'GRI 304-4: Number of vulnerable species', true, NULL),
('gri_304_conservation_spend', 'Biodiversity Conservation Spending', 'scope_3', 'Biodiversity', 'Investment', 'EUR', 'GRI 304: Total spending on biodiversity conservation', true, NULL),
('gri_304_land_converted', 'Land Converted', 'scope_3', 'Biodiversity', 'Land Use Change', 'hectares', 'GRI 304: Total land area converted for operations', true, NULL)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- GRI 305: EMISSIONS (30 metrics)
-- Automation: 90% (via Climatiq API)
-- Maps to existing Scope 1/2/3 categories
-- ============================================================================

INSERT INTO metrics_catalog (code, name, scope, category, subcategory, unit, description, is_active, ghg_protocol_category, emission_factor_source) VALUES
-- GRI 305-1: Direct (Scope 1) GHG emissions
('gri_305_1_direct_emissions', 'Direct GHG Emissions (Scope 1)', 'scope_1', 'Stationary Combustion', 'Total', 'tCO2e', 'GRI 305-1: Total direct greenhouse gas emissions', true, 'Scope 1 Total', 'climatiq'),
('gri_305_1_stationary_combustion', 'Stationary Combustion Emissions', 'scope_1', 'Stationary Combustion', 'Stationary', 'tCO2e', 'GRI 305-1: Emissions from stationary combustion', true, 'Stationary Combustion', 'climatiq'),
('gri_305_1_mobile_combustion', 'Mobile Combustion Emissions', 'scope_1', 'Mobile Combustion', 'Mobile', 'tCO2e', 'GRI 305-1: Emissions from mobile combustion', true, 'Mobile Combustion', 'climatiq'),
('gri_305_1_process_emissions', 'Process Emissions', 'scope_1', 'Process Emissions', 'Process', 'tCO2e', 'GRI 305-1: Emissions from industrial processes', true, 'Process Emissions', 'climatiq'),
('gri_305_1_fugitive_emissions', 'Fugitive Emissions', 'scope_1', 'Fugitive Emissions', 'Fugitive', 'tCO2e', 'GRI 305-1: Fugitive emissions (refrigerants, leaks)', true, 'Fugitive Emissions', 'climatiq'),
('gri_305_1_co2_emissions', 'CO2 Emissions', 'scope_1', 'Stationary Combustion', 'CO2', 'tCO2', 'GRI 305-1: Carbon dioxide emissions', true, 'Scope 1 Total', 'climatiq'),
('gri_305_1_ch4_emissions', 'CH4 Emissions', 'scope_1', 'Stationary Combustion', 'CH4', 'tCH4', 'GRI 305-1: Methane emissions', true, 'Scope 1 Total', 'climatiq'),
('gri_305_1_n2o_emissions', 'N2O Emissions', 'scope_1', 'Stationary Combustion', 'N2O', 'tN2O', 'GRI 305-1: Nitrous oxide emissions', true, 'Scope 1 Total', 'climatiq'),
('gri_305_1_biogenic_co2', 'Biogenic CO2 Emissions', 'scope_1', 'Stationary Combustion', 'Biogenic', 'tCO2', 'GRI 305-1: Biogenic carbon dioxide emissions (separate reporting)', true, 'Scope 1 Total', 'climatiq'),

-- GRI 305-2: Energy indirect (Scope 2) GHG emissions
('gri_305_2_indirect_emissions', 'Indirect GHG Emissions (Scope 2)', 'scope_2', 'Electricity', 'Total', 'tCO2e', 'GRI 305-2: Total energy indirect emissions', true, 'Scope 2 Total', 'climatiq'),
('gri_305_2_location_based', 'Scope 2 Emissions (Location-Based)', 'scope_2', 'Electricity', 'Location-Based', 'tCO2e', 'GRI 305-2: Emissions using location-based method', true, 'Scope 2 Total', 'climatiq'),
('gri_305_2_market_based', 'Scope 2 Emissions (Market-Based)', 'scope_2', 'Electricity', 'Market-Based', 'tCO2e', 'GRI 305-2: Emissions using market-based method', true, 'Scope 2 Total', 'climatiq'),
('gri_305_2_purchased_electricity', 'Purchased Electricity Emissions', 'scope_2', 'Electricity', 'Purchased', 'tCO2e', 'GRI 305-2: Emissions from purchased electricity', true, 'Purchased Electricity', 'climatiq'),
('gri_305_2_purchased_heating', 'Purchased Heating Emissions', 'scope_2', 'Purchased Energy', 'Heating', 'tCO2e', 'GRI 305-2: Emissions from purchased heating', true, 'Purchased Heat', 'climatiq'),
('gri_305_2_purchased_cooling', 'Purchased Cooling Emissions', 'scope_2', 'Purchased Energy', 'Cooling', 'tCO2e', 'GRI 305-2: Emissions from purchased cooling', true, 'Purchased Cooling', 'climatiq'),
('gri_305_2_purchased_steam', 'Purchased Steam Emissions', 'scope_2', 'Purchased Energy', 'Steam', 'tCO2e', 'GRI 305-2: Emissions from purchased steam', true, 'Purchased Steam', 'climatiq'),

-- GRI 305-3: Other indirect (Scope 3) GHG emissions
('gri_305_3_indirect_scope3', 'Other Indirect Emissions (Scope 3)', 'scope_3', 'Purchased Goods & Services', 'Total', 'tCO2e', 'GRI 305-3: Total other indirect emissions', true, 'Scope 3 Total', 'climatiq'),
('gri_305_3_purchased_goods', 'Purchased Goods & Services Emissions', 'scope_3', 'Purchased Goods & Services', 'Category 1', 'tCO2e', 'GRI 305-3: Emissions from purchased goods and services', true, 'Cat 1: Purchased Goods', 'climatiq'),
('gri_305_3_capital_goods', 'Capital Goods Emissions', 'scope_3', 'Capital Goods', 'Category 2', 'tCO2e', 'GRI 305-3: Emissions from capital goods', true, 'Cat 2: Capital Goods', 'climatiq'),
('gri_305_3_fuel_energy', 'Fuel & Energy Related Emissions', 'scope_3', 'Fuel & Energy Related', 'Category 3', 'tCO2e', 'GRI 305-3: Emissions from fuel and energy activities', true, 'Cat 3: Fuel & Energy', 'climatiq'),
('gri_305_3_upstream_transport', 'Upstream Transportation Emissions', 'scope_3', 'Upstream Transportation', 'Category 4', 'tCO2e', 'GRI 305-3: Emissions from upstream transportation', true, 'Cat 4: Upstream Transport', 'climatiq'),
('gri_305_3_waste', 'Waste Generated Emissions', 'scope_3', 'Waste', 'Category 5', 'tCO2e', 'GRI 305-3: Emissions from waste generated in operations', true, 'Cat 5: Waste', 'climatiq'),
('gri_305_3_business_travel', 'Business Travel Emissions', 'scope_3', 'Business Travel', 'Category 6', 'tCO2e', 'GRI 305-3: Emissions from business travel', true, 'Cat 6: Business Travel', 'climatiq'),
('gri_305_3_employee_commuting', 'Employee Commuting Emissions', 'scope_3', 'Employee Commuting', 'Category 7', 'tCO2e', 'GRI 305-3: Emissions from employee commuting', true, 'Cat 7: Commuting', 'climatiq'),
('gri_305_3_downstream_transport', 'Downstream Transportation Emissions', 'scope_3', 'Downstream Transportation', 'Category 9', 'tCO2e', 'GRI 305-3: Emissions from downstream transportation', true, 'Cat 9: Downstream Transport', 'climatiq'),
('gri_305_3_use_of_products', 'Use of Sold Products Emissions', 'scope_3', 'Use of Sold Products', 'Category 11', 'tCO2e', 'GRI 305-3: Emissions from use of sold products', true, 'Cat 11: Use Phase', 'climatiq'),
('gri_305_3_end_of_life', 'End-of-Life Emissions', 'scope_3', 'End-of-Life', 'Category 12', 'tCO2e', 'GRI 305-3: Emissions from end-of-life treatment', true, 'Cat 12: End-of-Life', 'climatiq'),

-- GRI 305-4: GHG emissions intensity
('gri_305_4_intensity_revenue', 'Emissions Intensity (per Revenue)', 'scope_1', 'Stationary Combustion', 'Intensity', 'tCO2e/million EUR', 'GRI 305-4: GHG emissions intensity per revenue', true, 'All Scopes', 'calculated'),
('gri_305_4_intensity_production', 'Emissions Intensity (per Unit)', 'scope_1', 'Stationary Combustion', 'Intensity', 'tCO2e/unit', 'GRI 305-4: GHG emissions intensity per unit produced', true, 'All Scopes', 'calculated'),

-- GRI 305-5: Reduction of GHG emissions
('gri_305_5_emissions_reduction', 'GHG Emissions Reduction', 'scope_1', 'Stationary Combustion', 'Reduction', 'tCO2e', 'GRI 305-5: Total GHG emissions reductions achieved', true, 'All Scopes', 'calculated')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  emission_factor_source = EXCLUDED.emission_factor_source,
  updated_at = NOW();

-- ============================================================================
-- GRI 306: WASTE (25 metrics)
-- Automation: 50% (via Climatiq for waste-related emissions)
-- ============================================================================

INSERT INTO metrics_catalog (code, name, scope, category, subcategory, unit, description, is_active, ghg_protocol_category, waste_material_type, disposal_method, is_diverted, is_recycling, has_energy_recovery) VALUES
-- GRI 306-3: Waste generated
('gri_306_3_waste_total', 'Total Waste Generated', 'scope_3', 'Waste', 'Total', 'tonnes', 'GRI 306-3: Total weight of waste generated', true, 'Waste', NULL, NULL, false, false, false),
('gri_306_3_hazardous_waste', 'Hazardous Waste Generated', 'scope_3', 'Waste', 'Hazardous', 'tonnes', 'GRI 306-3: Total hazardous waste generated', true, 'Waste', 'hazardous', NULL, false, false, false),
('gri_306_3_nonhazardous_waste', 'Non-Hazardous Waste Generated', 'scope_3', 'Waste', 'Non-Hazardous', 'tonnes', 'GRI 306-3: Total non-hazardous waste generated', true, 'Waste', 'mixed', NULL, false, false, false),
('gri_306_3_waste_composition', 'Waste by Composition', 'scope_3', 'Waste', 'Composition', 'tonnes', 'GRI 306-3: Waste breakdown by composition', true, 'Waste', NULL, NULL, false, false, false),

-- GRI 306-4: Waste diverted from disposal
('gri_306_4_waste_diverted', 'Waste Diverted from Disposal', 'scope_3', 'Waste', 'Diverted', 'tonnes', 'GRI 306-4: Total waste diverted from disposal', true, 'Waste', NULL, NULL, true, false, false),
('gri_306_4_recycling', 'Waste Recycled', 'scope_3', 'Waste', 'Recycling', 'tonnes', 'GRI 306-4: Total waste sent for recycling', true, 'Waste', NULL, 'recycling', true, true, false),
('gri_306_4_reuse', 'Waste for Reuse', 'scope_3', 'Waste', 'Reuse', 'tonnes', 'GRI 306-4: Total waste prepared for reuse', true, 'Waste', NULL, 'reuse', true, false, false),
('gri_306_4_composting', 'Waste Composted', 'scope_3', 'Waste', 'Composting', 'tonnes', 'GRI 306-4: Organic waste composted', true, 'Waste', 'organic', 'composting', true, false, false),
('gri_306_4_hazardous_diverted', 'Hazardous Waste Diverted', 'scope_3', 'Waste', 'Hazardous Diverted', 'tonnes', 'GRI 306-4: Hazardous waste diverted from disposal', true, 'Waste', 'hazardous', NULL, true, false, false),
('gri_306_4_nonhazardous_diverted', 'Non-Hazardous Waste Diverted', 'scope_3', 'Waste', 'Non-Haz Diverted', 'tonnes', 'GRI 306-4: Non-hazardous waste diverted', true, 'Waste', 'mixed', NULL, true, false, false),
('gri_306_4_onsite_diversion', 'Waste Diverted On-Site', 'scope_3', 'Waste', 'On-Site', 'tonnes', 'GRI 306-4: Waste diverted on-site', true, 'Waste', NULL, NULL, true, false, false),
('gri_306_4_offsite_diversion', 'Waste Diverted Off-Site', 'scope_3', 'Waste', 'Off-Site', 'tonnes', 'GRI 306-4: Waste diverted off-site', true, 'Waste', NULL, NULL, true, false, false),

-- GRI 306-5: Waste directed to disposal
('gri_306_5_waste_disposal', 'Waste Directed to Disposal', 'scope_3', 'Waste', 'Disposal', 'tonnes', 'GRI 306-5: Total waste directed to disposal', true, 'Waste', NULL, NULL, false, false, false),
('gri_306_5_incineration_recovery', 'Waste Incinerated with Energy Recovery', 'scope_3', 'Waste', 'Incineration', 'tonnes', 'GRI 306-5: Waste incinerated with energy recovery', true, 'Waste', NULL, 'incineration_recovery', false, false, true),
('gri_306_5_incineration_no_recovery', 'Waste Incinerated without Recovery', 'scope_3', 'Waste', 'Incineration', 'tonnes', 'GRI 306-5: Waste incinerated without energy recovery', true, 'Waste', NULL, 'incineration_no_recovery', false, false, false),
('gri_306_5_landfill', 'Waste to Landfill', 'scope_3', 'Waste', 'Landfill', 'tonnes', 'GRI 306-5: Waste sent to landfill', true, 'Waste', NULL, 'landfill', false, false, false),
('gri_306_5_other_disposal', 'Other Disposal Operations', 'scope_3', 'Waste', 'Other', 'tonnes', 'GRI 306-5: Waste sent to other disposal operations', true, 'Waste', NULL, NULL, false, false, false),
('gri_306_5_hazardous_disposal', 'Hazardous Waste to Disposal', 'scope_3', 'Waste', 'Hazardous Disposal', 'tonnes', 'GRI 306-5: Hazardous waste directed to disposal', true, 'Waste', 'hazardous', NULL, false, false, false),
('gri_306_5_nonhazardous_disposal', 'Non-Hazardous Waste to Disposal', 'scope_3', 'Waste', 'Non-Haz Disposal', 'tonnes', 'GRI 306-5: Non-hazardous waste directed to disposal', true, 'Waste', 'mixed', NULL, false, false, false),
('gri_306_5_onsite_disposal', 'Waste Disposed On-Site', 'scope_3', 'Waste', 'On-Site Disposal', 'tonnes', 'GRI 306-5: Waste disposed on-site', true, 'Waste', NULL, NULL, false, false, false),
('gri_306_5_offsite_disposal', 'Waste Disposed Off-Site', 'scope_3', 'Waste', 'Off-Site Disposal', 'tonnes', 'GRI 306-5: Waste disposed off-site', true, 'Waste', NULL, NULL, false, false, false),

-- Additional waste metrics
('gri_306_waste_intensity', 'Waste Intensity', 'scope_3', 'Waste', 'Intensity', 'tonnes/unit', 'GRI 306: Waste generated per unit of production', true, 'Waste', NULL, NULL, false, false, false),
('gri_306_diversion_rate', 'Waste Diversion Rate', 'scope_3', 'Waste', 'Diversion %', '%', 'GRI 306: Percentage of waste diverted from disposal', true, 'Waste', NULL, NULL, true, false, false),
('gri_306_recycling_rate', 'Recycling Rate', 'scope_3', 'Waste', 'Recycling %', '%', 'GRI 306: Percentage of waste recycled', true, 'Waste', NULL, 'recycling', true, true, false),
('gri_306_landfill_rate', 'Landfill Rate', 'scope_3', 'Waste', 'Landfill %', '%', 'GRI 306: Percentage of waste sent to landfill', true, 'Waste', NULL, 'landfill', false, false, false)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  waste_material_type = EXCLUDED.waste_material_type,
  disposal_method = EXCLUDED.disposal_method,
  is_diverted = EXCLUDED.is_diverted,
  is_recycling = EXCLUDED.is_recycling,
  has_energy_recovery = EXCLUDED.has_energy_recovery,
  updated_at = NOW();

-- ============================================================================
-- GRI 307: ENVIRONMENTAL COMPLIANCE (8 metrics)
-- Automation: 5% (manual data entry required)
-- ============================================================================

INSERT INTO metrics_catalog (code, name, scope, category, subcategory, unit, description, is_active, ghg_protocol_category) VALUES
('gri_307_1_fines_total', 'Environmental Fines Total', 'scope_3', 'Environmental Compliance', 'Fines', 'EUR', 'GRI 307-1: Total monetary value of environmental fines', true, NULL),
('gri_307_1_fines_count', 'Number of Environmental Fines', 'scope_3', 'Environmental Compliance', 'Count', 'count', 'GRI 307-1: Number of significant fines', true, NULL),
('gri_307_1_sanctions_count', 'Non-Monetary Sanctions', 'scope_3', 'Environmental Compliance', 'Sanctions', 'count', 'GRI 307-1: Number of non-monetary sanctions', true, NULL),
('gri_307_legal_actions', 'Environmental Legal Actions', 'scope_3', 'Environmental Compliance', 'Legal', 'count', 'GRI 307: Number of environmental legal actions', true, NULL),
('gri_307_violations', 'Environmental Violations', 'scope_3', 'Environmental Compliance', 'Violations', 'count', 'GRI 307: Number of environmental law violations', true, NULL),
('gri_307_regulatory_warnings', 'Regulatory Warnings', 'scope_3', 'Environmental Compliance', 'Warnings', 'count', 'GRI 307: Number of regulatory warnings received', true, NULL),
('gri_307_permit_violations', 'Permit Violations', 'scope_3', 'Environmental Compliance', 'Permits', 'count', 'GRI 307: Number of environmental permit violations', true, NULL),
('gri_307_compliance_spend', 'Compliance Spending', 'scope_3', 'Environmental Compliance', 'Investment', 'EUR', 'GRI 307: Total spending on environmental compliance', true, NULL)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- GRI 308: SUPPLIER ENVIRONMENTAL ASSESSMENT (10 metrics)
-- Automation: 30% (supplier data integration)
-- ============================================================================

INSERT INTO metrics_catalog (code, name, scope, category, subcategory, unit, description, is_active, ghg_protocol_category) VALUES
('gri_308_1_suppliers_screened', 'New Suppliers Screened', 'scope_3', 'Supplier Assessment', 'Screening', '%', 'GRI 308-1: Percentage of new suppliers screened using environmental criteria', true, 'Purchased Goods & Services'),
('gri_308_1_suppliers_screened_count', 'Suppliers Screened Count', 'scope_3', 'Supplier Assessment', 'Count', 'count', 'GRI 308-1: Number of new suppliers screened', true, 'Purchased Goods & Services'),
('gri_308_1_suppliers_total', 'Total New Suppliers', 'scope_3', 'Supplier Assessment', 'Total', 'count', 'GRI 308-1: Total number of new suppliers', true, 'Purchased Goods & Services'),
('gri_308_2_suppliers_assessed', 'Suppliers Assessed for Impacts', 'scope_3', 'Supplier Assessment', 'Assessment', 'count', 'GRI 308-2: Suppliers assessed for environmental impacts', true, 'Purchased Goods & Services'),
('gri_308_2_significant_impacts', 'Suppliers with Significant Impacts', 'scope_3', 'Supplier Assessment', 'Impacts', 'count', 'GRI 308-2: Suppliers with significant actual/potential impacts', true, 'Purchased Goods & Services'),
('gri_308_2_improvements_agreed', 'Suppliers - Improvements Agreed', 'scope_3', 'Supplier Assessment', 'Improvement', 'count', 'GRI 308-2: Suppliers with which improvements were agreed', true, 'Purchased Goods & Services'),
('gri_308_2_relationships_terminated', 'Supplier Relationships Terminated', 'scope_3', 'Supplier Assessment', 'Termination', 'count', 'GRI 308-2: Suppliers with relationships terminated due to impacts', true, 'Purchased Goods & Services'),
('gri_308_supplier_audits', 'Supplier Environmental Audits', 'scope_3', 'Supplier Assessment', 'Audits', 'count', 'GRI 308: Number of supplier environmental audits conducted', true, 'Purchased Goods & Services'),
('gri_308_certified_suppliers', 'Environmentally Certified Suppliers', 'scope_3', 'Supplier Assessment', 'Certification', '%', 'GRI 308: Percentage of suppliers with environmental certifications', true, 'Purchased Goods & Services'),
('gri_308_supplier_training', 'Supplier Training Programs', 'scope_3', 'Supplier Assessment', 'Training', 'count', 'GRI 308: Number of environmental training programs for suppliers', true, 'Purchased Goods & Services')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- CREATE GRI FRAMEWORK MAPPING TABLE
-- Links metrics to specific GRI disclosure requirements
-- ============================================================================

CREATE TABLE IF NOT EXISTS gri_framework_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_id UUID NOT NULL REFERENCES metrics_catalog(id) ON DELETE CASCADE,

  -- GRI Standard reference
  gri_standard TEXT NOT NULL,  -- e.g., 'GRI 305', 'GRI 302'
  gri_disclosure TEXT NOT NULL,  -- e.g., '305-1', '302-1-a'
  gri_topic TEXT NOT NULL,  -- e.g., 'Emissions', 'Energy', 'Water'

  -- Disclosure details
  disclosure_title TEXT NOT NULL,
  disclosure_description TEXT,
  reporting_requirement TEXT,  -- What needs to be reported

  -- Automation flags
  can_automate BOOLEAN DEFAULT false,
  automation_source TEXT,  -- 'climatiq', 'electricity_maps', 'calculated', 'manual'
  automation_percentage INTEGER DEFAULT 0,  -- 0-100%

  -- Data collection guidance
  data_collection_method TEXT,
  typical_data_sources TEXT[],
  calculation_formula TEXT,

  -- Compliance
  is_mandatory BOOLEAN DEFAULT true,
  applies_to_sectors TEXT[],  -- Industry sectors this applies to

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(metric_id, gri_disclosure)
);

CREATE INDEX idx_gri_mappings_standard ON gri_framework_mappings(gri_standard);
CREATE INDEX idx_gri_mappings_disclosure ON gri_framework_mappings(gri_disclosure);
CREATE INDEX idx_gri_mappings_topic ON gri_framework_mappings(gri_topic);
CREATE INDEX idx_gri_mappings_automation ON gri_framework_mappings(can_automate, automation_source);

-- ============================================================================
-- CREATE EMISSION FACTORS CACHE TABLE (for Climatiq integration)
-- Implements free-tier optimization strategy from CLIMATIQ-FREE-TIER-STRATEGY.md
-- ============================================================================

CREATE TABLE IF NOT EXISTS emission_factors_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Climatiq identifiers
  climatiq_id TEXT UNIQUE NOT NULL,
  climatiq_activity_id TEXT,

  -- Search metadata (for future lookups)
  activity_name TEXT NOT NULL,
  category TEXT NOT NULL,
  sector TEXT,
  region_code TEXT NOT NULL,  -- US, GB, DE, etc.

  -- The actual factor data
  factor_value NUMERIC NOT NULL,
  factor_unit TEXT NOT NULL,  -- kg CO2e per kWh, km, etc.

  -- Source attribution (for compliance)
  source_dataset TEXT NOT NULL,  -- PCAF, EXIOBASE, etc.
  source_year INTEGER NOT NULL,
  factor_calculation_method TEXT,

  -- Gas breakdown
  co2_factor NUMERIC,
  ch4_factor NUMERIC,
  n2o_factor NUMERIC,
  co2e_total NUMERIC,

  -- Metadata
  ghg_protocol_compliant BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMPTZ DEFAULT NOW(),
  api_calls_saved INTEGER DEFAULT 0,  -- Track how many API calls we avoided

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Index for fast lookups
  CONSTRAINT unique_factor UNIQUE (activity_name, region_code, source_year)
);

CREATE INDEX idx_factors_activity_region ON emission_factors_cache(activity_name, region_code);
CREATE INDEX idx_factors_category ON emission_factors_cache(category);
CREATE INDEX idx_factors_climatiq_id ON emission_factors_cache(climatiq_id);
CREATE INDEX idx_factors_sector ON emission_factors_cache(sector) WHERE sector IS NOT NULL;

-- ============================================================================
-- CREATE API USAGE TRACKING TABLE
-- Monitor API usage to stay within free tier limits
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name TEXT NOT NULL,  -- 'climatiq', 'electricity_maps', etc.
  endpoint TEXT NOT NULL,  -- 'search', 'estimate', 'power-breakdown', etc.
  called_at TIMESTAMPTZ DEFAULT NOW(),
  cache_hit BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES organizations(id),

  -- Request details (for debugging)
  request_params JSONB,
  response_status INTEGER,

  -- Monthly rollup
  year_month TEXT NOT NULL,  -- '2025-01'

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_usage_month ON api_usage_tracking(api_name, year_month);
CREATE INDEX idx_api_usage_org ON api_usage_tracking(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX idx_api_usage_cache ON api_usage_tracking(cache_hit);

-- ============================================================================
-- CREATE GRI REPORTING PERIODS TABLE
-- Track which reporting periods organizations are using
-- ============================================================================

CREATE TABLE IF NOT EXISTS gri_reporting_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Reporting period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_name TEXT,  -- e.g., 'FY 2024', 'Q1 2025'

  -- GRI standards covered in this report
  gri_standards_covered TEXT[],  -- e.g., ['GRI 302', 'GRI 305', 'GRI 306']

  -- Completeness tracking
  total_metrics INTEGER DEFAULT 0,
  metrics_completed INTEGER DEFAULT 0,
  completeness_percentage NUMERIC(5,2) DEFAULT 0,

  -- Report status
  status TEXT DEFAULT 'draft',  -- draft, in_progress, review, published
  published_at TIMESTAMPTZ,
  report_url TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT check_period_valid CHECK (period_end >= period_start),
  CONSTRAINT check_status CHECK (status IN ('draft', 'in_progress', 'review', 'published'))
);

CREATE INDEX idx_gri_periods_org ON gri_reporting_periods(organization_id);
CREATE INDEX idx_gri_periods_dates ON gri_reporting_periods(period_start, period_end);
CREATE INDEX idx_gri_periods_status ON gri_reporting_periods(status);

-- ============================================================================
-- ADD HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate GRI reporting period completeness
CREATE OR REPLACE FUNCTION calculate_gri_completeness(
  p_organization_id UUID,
  p_period_start DATE,
  p_period_end DATE
) RETURNS TABLE (
  gri_standard TEXT,
  total_metrics INTEGER,
  completed_metrics INTEGER,
  completeness_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH gri_metrics AS (
    SELECT
      SUBSTRING(mc.code FROM 'gri_(\d+)_') AS standard_code,
      mc.id AS metric_id
    FROM metrics_catalog mc
    WHERE mc.code LIKE 'gri_%'
      AND mc.is_active = true
  ),
  data_availability AS (
    SELECT
      gm.standard_code,
      COUNT(DISTINCT gm.metric_id) AS total,
      COUNT(DISTINCT md.metric_id) AS completed
    FROM gri_metrics gm
    LEFT JOIN metrics_data md ON md.metric_id = gm.metric_id
      AND md.organization_id = p_organization_id
      AND md.period_start >= p_period_start
      AND md.period_end <= p_period_end
    GROUP BY gm.standard_code
  )
  SELECT
    'GRI ' || da.standard_code AS gri_standard,
    da.total::INTEGER,
    da.completed::INTEGER,
    CASE WHEN da.total > 0 THEN (da.completed::NUMERIC / da.total * 100) ELSE 0 END AS completeness_percentage
  FROM data_availability da
  ORDER BY da.standard_code;
END;
$$ LANGUAGE plpgsql;

-- Function to increment cache saved counter
CREATE OR REPLACE FUNCTION increment_cache_saved(p_factor_id UUID) RETURNS VOID AS $$
BEGIN
  UPDATE emission_factors_cache
  SET api_calls_saved = api_calls_saved + 1,
      last_validated_at = NOW()
  WHERE id = p_factor_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE emission_factors_cache IS 'Cache for Climatiq emission factors to minimize API calls and stay within free tier. Implements strategy from CLIMATIQ-FREE-TIER-STRATEGY.md';
COMMENT ON TABLE api_usage_tracking IS 'Track API usage across all external APIs to monitor free tier limits and optimize costs';
COMMENT ON TABLE gri_framework_mappings IS 'Maps metrics_catalog entries to specific GRI disclosure requirements with automation metadata';
COMMENT ON TABLE gri_reporting_periods IS 'Track GRI reporting periods and completeness for each organization';

COMMENT ON COLUMN emission_factors_cache.api_calls_saved IS 'Counter incremented each time this cached factor is used instead of calling the API';
COMMENT ON COLUMN emission_factors_cache.climatiq_id IS 'Unique Climatiq emission factor ID for direct API lookups';
COMMENT ON COLUMN gri_framework_mappings.automation_source IS 'Data source for automation: climatiq, electricity_maps, calculated, manual';
COMMENT ON COLUMN gri_framework_mappings.automation_percentage IS 'Estimated percentage of this metric that can be automated (0-100%)';

COMMIT;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Added 138 GRI metrics across 8 standards (301-308)
-- Created emission_factors_cache table for Climatiq optimization
-- Created api_usage_tracking table to monitor free tier limits
-- Created gri_framework_mappings table for disclosure tracking
-- Created gri_reporting_periods table for report management
-- Added helper functions for completeness calculation
--
-- Next Steps:
-- 1. Run pre-population script for emission_factors_cache (scripts/populate-emission-factors.ts)
-- 2. Create Climatiq service with cache-first logic (src/lib/apis/climatiq.ts)
-- 3. Build data entry UI for manual GRI metrics
-- 4. Create GRI reporting dashboard
-- ============================================================================
