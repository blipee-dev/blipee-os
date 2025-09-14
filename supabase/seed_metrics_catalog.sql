-- Seed Sustainability Metrics Catalog
-- All 74 metrics covering GHG Protocol Scopes 1, 2, 3

INSERT INTO metrics_catalog (code, name, scope, category, subcategory, unit, description, emission_factor, emission_factor_unit, ghg_protocol_category) VALUES

-- SCOPE 1: Direct Emissions
-- Stationary Combustion
('scope1_natural_gas', 'Natural Gas Consumption', 'scope_1', 'Stationary Combustion', 'Heating', 'm³', 'Natural gas used for heating and operations', 1.8788, 'kgCO2e/m³', NULL),
('scope1_diesel_generators', 'Diesel for Generators', 'scope_1', 'Stationary Combustion', 'Backup Power', 'liters', 'Diesel fuel used in backup generators', 2.68, 'kgCO2e/liter', NULL),
('scope1_heating_oil', 'Heating Oil', 'scope_1', 'Stationary Combustion', 'Heating', 'liters', 'Heating oil for building operations', 2.52, 'kgCO2e/liter', NULL),
('scope1_propane', 'Propane', 'scope_1', 'Stationary Combustion', 'Heating', 'kg', 'Propane gas consumption', 2.98, 'kgCO2e/kg', NULL),
('scope1_coal', 'Coal', 'scope_1', 'Stationary Combustion', 'Industrial', 'kg', 'Coal used in industrial processes', 2.42, 'kgCO2e/kg', NULL),
('scope1_biomass', 'Biomass', 'scope_1', 'Stationary Combustion', 'Renewable', 'kg', 'Biomass fuel consumption', 0.0, 'kgCO2e/kg', NULL),

-- Mobile Combustion
('scope1_fleet_gasoline', 'Fleet Gasoline', 'scope_1', 'Mobile Combustion', 'Vehicles', 'liters', 'Gasoline for company vehicles', 2.31, 'kgCO2e/liter', NULL),
('scope1_fleet_diesel', 'Fleet Diesel', 'scope_1', 'Mobile Combustion', 'Vehicles', 'liters', 'Diesel for company vehicles', 2.68, 'kgCO2e/liter', NULL),
('scope1_fleet_lpg', 'Fleet LPG', 'scope_1', 'Mobile Combustion', 'Vehicles', 'liters', 'LPG for company vehicles', 1.51, 'kgCO2e/liter', NULL),
('scope1_fleet_cng', 'Fleet CNG', 'scope_1', 'Mobile Combustion', 'Vehicles', 'm³', 'Compressed natural gas for vehicles', 1.89, 'kgCO2e/m³', NULL),
('scope1_fleet_biodiesel', 'Fleet Biodiesel', 'scope_1', 'Mobile Combustion', 'Vehicles', 'liters', 'Biodiesel for company vehicles', 0.0, 'kgCO2e/liter', NULL),
('scope1_fleet_ethanol', 'Fleet Ethanol', 'scope_1', 'Mobile Combustion', 'Vehicles', 'liters', 'Ethanol for company vehicles', 0.0, 'kgCO2e/liter', NULL),

-- Fugitive Emissions
('scope1_refrigerant_r410a', 'Refrigerant R410A Leakage', 'scope_1', 'Fugitive Emissions', 'HVAC', 'kg', 'R410A refrigerant leakage from HVAC', 2088, 'kgCO2e/kg', NULL),
('scope1_refrigerant_r134a', 'Refrigerant R134A Leakage', 'scope_1', 'Fugitive Emissions', 'HVAC', 'kg', 'R134A refrigerant leakage', 1430, 'kgCO2e/kg', NULL),
('scope1_refrigerant_r404a', 'Refrigerant R404A Leakage', 'scope_1', 'Fugitive Emissions', 'HVAC', 'kg', 'R404A refrigerant leakage', 3922, 'kgCO2e/kg', NULL),
('scope1_fire_suppression', 'Fire Suppression Systems', 'scope_1', 'Fugitive Emissions', 'Safety', 'kg', 'Fire suppression system emissions', 1.0, 'kgCO2e/kg', NULL),

-- Process Emissions
('scope1_industrial_process', 'Industrial Process Emissions', 'scope_1', 'Process Emissions', 'Manufacturing', 'tCO2e', 'Direct emissions from industrial processes', 1.0, 'tCO2e/tCO2e', NULL),
('scope1_wastewater_treatment', 'Wastewater Treatment', 'scope_1', 'Process Emissions', 'Waste', 'tCO2e', 'Emissions from onsite wastewater treatment', 1.0, 'tCO2e/tCO2e', NULL),

-- SCOPE 2: Indirect Emissions (Energy)
-- Electricity
('scope2_electricity_grid', 'Grid Electricity', 'scope_2', 'Electricity', 'Purchased', 'kWh', 'Electricity from the grid', 0.4, 'kgCO2e/kWh', NULL),
('scope2_electricity_renewable', 'Renewable Electricity', 'scope_2', 'Electricity', 'Renewable', 'kWh', 'Certified renewable electricity', 0.0, 'kgCO2e/kWh', NULL),
('scope2_electricity_solar', 'Solar Electricity Generated', 'scope_2', 'Electricity', 'Onsite Generation', 'kWh', 'Solar panels electricity generation', 0.0, 'kgCO2e/kWh', NULL),
('scope2_electricity_wind', 'Wind Electricity Generated', 'scope_2', 'Electricity', 'Onsite Generation', 'kWh', 'Wind turbine electricity generation', 0.0, 'kgCO2e/kWh', NULL),

-- Purchased Energy
('scope2_purchased_heating', 'Purchased Heating', 'scope_2', 'Purchased Energy', 'Thermal', 'kWh', 'Purchased heat energy', 0.2, 'kgCO2e/kWh', NULL),
('scope2_purchased_cooling', 'Purchased Cooling', 'scope_2', 'Purchased Energy', 'Thermal', 'kWh', 'Purchased cooling energy', 0.2, 'kgCO2e/kWh', NULL),
('scope2_purchased_steam', 'Purchased Steam', 'scope_2', 'Purchased Energy', 'Thermal', 'kWh', 'Purchased steam energy', 0.2, 'kgCO2e/kWh', NULL),
('scope2_district_heating', 'District Heating', 'scope_2', 'Purchased Energy', 'District', 'kWh', 'District heating network', 0.15, 'kgCO2e/kWh', NULL),
('scope2_district_cooling', 'District Cooling', 'scope_2', 'Purchased Energy', 'District', 'kWh', 'District cooling network', 0.15, 'kgCO2e/kWh', NULL),

-- SCOPE 3: Other Indirect Emissions
-- Category 1: Purchased Goods & Services
('scope3_purchased_goods', 'Purchased Goods', 'scope_3', 'Purchased Goods & Services', 'Physical Goods', 'EUR', 'Emissions from purchased physical goods', 0.5, 'kgCO2e/EUR', '1'),
('scope3_purchased_services', 'Purchased Services', 'scope_3', 'Purchased Goods & Services', 'Services', 'EUR', 'Emissions from purchased services', 0.2, 'kgCO2e/EUR', '1'),
('scope3_cloud_computing', 'Cloud Computing Services', 'scope_3', 'Purchased Goods & Services', 'IT Services', 'EUR', 'Cloud and SaaS services emissions', 0.3, 'kgCO2e/EUR', '1'),
('scope3_software_licenses', 'Software Licenses', 'scope_3', 'Purchased Goods & Services', 'IT Services', 'EUR', 'Software licensing emissions', 0.1, 'kgCO2e/EUR', '1'),

-- Category 2: Capital Goods
('scope3_capital_goods', 'Capital Goods', 'scope_3', 'Capital Goods', 'General', 'EUR', 'Emissions from capital purchases', 0.4, 'kgCO2e/EUR', '2'),
('scope3_buildings', 'Buildings Construction', 'scope_3', 'Capital Goods', 'Construction', 'EUR', 'Building construction emissions', 0.6, 'kgCO2e/EUR', '2'),
('scope3_machinery', 'Machinery & Equipment', 'scope_3', 'Capital Goods', 'Equipment', 'EUR', 'Machinery and equipment purchases', 0.5, 'kgCO2e/EUR', '2'),
('scope3_it_equipment', 'IT Equipment', 'scope_3', 'Capital Goods', 'IT Hardware', 'EUR', 'Computers and IT hardware', 0.8, 'kgCO2e/EUR', '2'),

-- Category 3: Fuel & Energy Related
('scope3_upstream_emissions', 'Upstream Fuel Emissions', 'scope_3', 'Fuel & Energy Related', 'Well-to-Tank', 'tCO2e', 'Upstream emissions from fuel production', 1.0, 'tCO2e/tCO2e', '3'),
('scope3_transmission_losses', 'T&D Losses', 'scope_3', 'Fuel & Energy Related', 'Grid Losses', 'kWh', 'Transmission and distribution losses', 0.04, 'kgCO2e/kWh', '3'),

-- Category 4: Upstream Transportation
('scope3_upstream_transport_road', 'Upstream Road Transport', 'scope_3', 'Upstream Transportation', 'Road', 'ton-km', 'Road freight transport upstream', 0.1, 'kgCO2e/ton-km', '4'),
('scope3_upstream_transport_air', 'Upstream Air Transport', 'scope_3', 'Upstream Transportation', 'Air', 'ton-km', 'Air freight transport upstream', 1.2, 'kgCO2e/ton-km', '4'),
('scope3_upstream_transport_sea', 'Upstream Sea Transport', 'scope_3', 'Upstream Transportation', 'Sea', 'ton-km', 'Sea freight transport upstream', 0.01, 'kgCO2e/ton-km', '4'),
('scope3_upstream_transport_rail', 'Upstream Rail Transport', 'scope_3', 'Upstream Transportation', 'Rail', 'ton-km', 'Rail freight transport upstream', 0.03, 'kgCO2e/ton-km', '4'),

-- Category 5: Waste
('scope3_waste_landfill', 'Waste to Landfill', 'scope_3', 'Waste', 'Disposal', 'tons', 'Waste sent to landfill', 467, 'kgCO2e/ton', '5'),
('scope3_waste_recycling', 'Waste Recycled', 'scope_3', 'Waste', 'Recycling', 'tons', 'Waste sent for recycling', 21, 'kgCO2e/ton', '5'),
('scope3_waste_composting', 'Waste Composted', 'scope_3', 'Waste', 'Composting', 'tons', 'Organic waste composted', 10, 'kgCO2e/ton', '5'),
('scope3_waste_incineration', 'Waste Incinerated', 'scope_3', 'Waste', 'Incineration', 'tons', 'Waste incinerated', 883, 'kgCO2e/ton', '5'),
('scope3_wastewater', 'Wastewater', 'scope_3', 'Waste', 'Water', 'm³', 'Wastewater treatment emissions', 0.7, 'kgCO2e/m³', '5'),

-- Category 6: Business Travel
('scope3_business_travel_air', 'Air Travel', 'scope_3', 'Business Travel', 'Air', 'km', 'Employee air travel', 0.15, 'kgCO2e/km', '6'),
('scope3_business_travel_rail', 'Rail Travel', 'scope_3', 'Business Travel', 'Rail', 'km', 'Employee rail travel', 0.04, 'kgCO2e/km', '6'),
('scope3_business_travel_road', 'Road Travel', 'scope_3', 'Business Travel', 'Road', 'km', 'Employee road travel', 0.17, 'kgCO2e/km', '6'),
('scope3_hotel_nights', 'Hotel Nights', 'scope_3', 'Business Travel', 'Accommodation', 'nights', 'Hotel accommodation emissions', 20.0, 'kgCO2e/night', '6'),

-- Category 7: Employee Commuting
('scope3_employee_commute_car', 'Employee Car Commute', 'scope_3', 'Employee Commuting', 'Car', 'km', 'Employee commute by car', 0.17, 'kgCO2e/km', '7'),
('scope3_employee_commute_public', 'Public Transport Commute', 'scope_3', 'Employee Commuting', 'Public Transport', 'km', 'Employee public transport commute', 0.08, 'kgCO2e/km', '7'),
('scope3_employee_commute_bike', 'Bicycle Commute', 'scope_3', 'Employee Commuting', 'Bicycle', 'km', 'Employee bicycle commute', 0.0, 'kgCO2e/km', '7'),
('scope3_remote_work', 'Remote Work Days', 'scope_3', 'Employee Commuting', 'Remote', 'days', 'Work from home emissions', 2.5, 'kgCO2e/day', '7'),

-- Category 8: Upstream Leased Assets
('scope3_leased_buildings', 'Leased Buildings Energy', 'scope_3', 'Upstream Leased Assets', 'Buildings', 'kWh', 'Energy from leased buildings', 0.4, 'kgCO2e/kWh', '8'),
('scope3_leased_vehicles', 'Leased Vehicles Fuel', 'scope_3', 'Upstream Leased Assets', 'Vehicles', 'liters', 'Fuel from leased vehicles', 2.5, 'kgCO2e/liter', '8'),

-- Category 9: Downstream Transportation
('scope3_downstream_transport', 'Downstream Transportation', 'scope_3', 'Downstream Transportation', 'Distribution', 'ton-km', 'Product distribution emissions', 0.1, 'kgCO2e/ton-km', '9'),
('scope3_product_distribution', 'Product Distribution', 'scope_3', 'Downstream Transportation', 'Logistics', 'ton-km', 'Product logistics emissions', 0.1, 'kgCO2e/ton-km', '9'),

-- Category 10: Processing of Sold Products
('scope3_processing_sold_products', 'Processing of Sold Products', 'scope_3', 'Processing of Sold Products', 'Manufacturing', 'tCO2e', 'Downstream processing emissions', 1.0, 'tCO2e/tCO2e', '10'),

-- Category 11: Use of Sold Products
('scope3_use_sold_products', 'Use of Sold Products', 'scope_3', 'Use of Sold Products', 'Product Use', 'tCO2e', 'Emissions from product use phase', 1.0, 'tCO2e/tCO2e', '11'),
('scope3_product_energy_use', 'Product Energy Consumption', 'scope_3', 'Use of Sold Products', 'Energy', 'kWh', 'Energy consumed by sold products', 0.4, 'kgCO2e/kWh', '11'),

-- Category 12: End-of-Life
('scope3_product_disposal', 'Product End-of-Life', 'scope_3', 'End-of-Life', 'Disposal', 'tons', 'Product disposal emissions', 467, 'kgCO2e/ton', '12'),
('scope3_product_recycling', 'Product Recycling Rate', 'scope_3', 'End-of-Life', 'Recycling', '%', 'Percentage of products recycled', 0.0, 'kgCO2e/%', '12'),

-- Category 13: Downstream Leased Assets
('scope3_downstream_leased', 'Downstream Leased Assets', 'scope_3', 'Downstream Leased Assets', 'Assets', 'tCO2e', 'Emissions from leased out assets', 1.0, 'tCO2e/tCO2e', '13'),

-- Category 14: Franchises
('scope3_franchises', 'Franchise Operations', 'scope_3', 'Franchises', 'Operations', 'tCO2e', 'Emissions from franchise operations', 1.0, 'tCO2e/tCO2e', '14'),

-- Category 15: Investments
('scope3_investments', 'Investment Emissions', 'scope_3', 'Investments', 'Financial', 'tCO2e', 'Emissions from investments', 1.0, 'tCO2e/tCO2e', '15'),
('scope3_financed_emissions', 'Financed Emissions', 'scope_3', 'Investments', 'Banking', 'tCO2e', 'Emissions from financed activities', 1.0, 'tCO2e/tCO2e', '15')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  scope = EXCLUDED.scope,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  unit = EXCLUDED.unit,
  description = EXCLUDED.description,
  emission_factor = EXCLUDED.emission_factor,
  emission_factor_unit = EXCLUDED.emission_factor_unit,
  ghg_protocol_category = EXCLUDED.ghg_protocol_category,
  updated_at = NOW();

-- Create industry-specific templates
INSERT INTO metrics_templates (name, description, industry, gri_standard, metric_ids) VALUES
(
  'Office Buildings',
  'Standard metrics for office buildings and commercial real estate',
  'Real Estate',
  'GRI 11',
  (SELECT array_agg(id) FROM metrics_catalog WHERE code IN (
    'scope1_natural_gas', 'scope1_diesel_generators',
    'scope2_electricity_grid', 'scope2_purchased_heating', 'scope2_purchased_cooling',
    'scope3_business_travel_air', 'scope3_employee_commute_car', 'scope3_waste_landfill'
  ))
),
(
  'Manufacturing',
  'Comprehensive metrics for manufacturing facilities',
  'Manufacturing',
  'GRI 12',
  (SELECT array_agg(id) FROM metrics_catalog WHERE code IN (
    'scope1_natural_gas', 'scope1_diesel_generators', 'scope1_industrial_process',
    'scope2_electricity_grid', 'scope2_purchased_steam',
    'scope3_purchased_goods', 'scope3_upstream_transport_road', 'scope3_waste_landfill'
  ))
),
(
  'Technology Company',
  'Metrics for technology and software companies',
  'Technology',
  NULL,
  (SELECT array_agg(id) FROM metrics_catalog WHERE code IN (
    'scope2_electricity_grid', 'scope2_electricity_renewable',
    'scope3_cloud_computing', 'scope3_it_equipment', 'scope3_business_travel_air',
    'scope3_employee_commute_car', 'scope3_remote_work'
  ))
);