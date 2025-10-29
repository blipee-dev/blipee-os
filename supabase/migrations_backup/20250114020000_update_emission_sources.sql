-- Update emission factor sources for all metrics
-- These are based on internationally recognized standards

-- Refrigerants (GWP values from IPCC AR5/AR6)
UPDATE metrics_catalog
SET emission_factor_source = 'IPCC AR5 (2014) - Table 8.A.1'
WHERE name IN ('Refrigerant R134A Leakage', 'Refrigerant R404A Leakage', 'Refrigerant R410A Leakage');

-- Fire Suppression Systems
UPDATE metrics_catalog
SET emission_factor_source = 'EPA GHG Emission Factors Hub (2024)'
WHERE name = 'Fire Suppression Systems';

-- Mobile Combustion (Fleet vehicles)
UPDATE metrics_catalog
SET emission_factor_source = 'DEFRA/DECC GHG Conversion Factors (2024)'
WHERE name IN ('Fleet Biodiesel', 'Fleet CNG', 'Fleet Diesel', 'Fleet Ethanol', 'Fleet Gasoline', 'Fleet LPG');

-- Stationary Combustion
UPDATE metrics_catalog
SET emission_factor_source = 'EPA Emission Factors for GHG Inventories (2024)'
WHERE name IN ('Biomass', 'Coal', 'Diesel for Generators', 'Heating Oil', 'Natural Gas Consumption', 'Propane');

-- Electricity
UPDATE metrics_catalog
SET emission_factor_source = 'IEA Emission Factors Database (2024)'
WHERE name IN ('Grid Electricity', 'Renewable Electricity', 'Solar Electricity Generated', 'Wind Electricity Generated');

-- Purchased Energy
UPDATE metrics_catalog
SET emission_factor_source = 'GHG Protocol Scope 2 Guidance (2015)'
WHERE name IN ('District Cooling', 'District Heating', 'Purchased Cooling', 'Purchased Heating', 'Purchased Steam');

-- Business Travel
UPDATE metrics_catalog
SET emission_factor_source = 'DEFRA/DECC Business Travel Factors (2024)'
WHERE name IN ('Air Travel', 'Hotel Nights', 'Rail Travel', 'Road Travel');

-- Employee Commuting
UPDATE metrics_catalog
SET emission_factor_source = 'EPA Center for Corporate Climate Leadership (2024)'
WHERE name IN ('Bicycle Commute', 'Employee Car Commute', 'Public Transport Commute', 'Remote Work Days');

-- Capital Goods
UPDATE metrics_catalog
SET emission_factor_source = 'Ecoinvent Database v3.9 (2023)'
WHERE name IN ('Buildings Construction', 'Capital Goods', 'IT Equipment', 'Machinery & Equipment', 'Software Licenses');

-- Waste
UPDATE metrics_catalog
SET emission_factor_source = 'EPA WARM Model v15 (2024)'
WHERE name IN ('Waste Composted', 'Waste Incinerated', 'Waste Recycled', 'Waste to Landfill', 'Wastewater', 'Wastewater Treatment');

-- Transportation and Distribution
UPDATE metrics_catalog
SET emission_factor_source = 'GLEC Framework v3.0 (2023)'
WHERE name IN ('Downstream Transportation', 'Product Distribution', 'Upstream Air Transport', 'Upstream Rail Transport', 'Upstream Road Transport', 'Upstream Sea Transport');

-- Industrial Processes
UPDATE metrics_catalog
SET emission_factor_source = 'IPCC Guidelines for National GHG Inventories (2019)'
WHERE name = 'Industrial Process Emissions';

-- T&D Losses
UPDATE metrics_catalog
SET emission_factor_source = 'IEA World Energy Outlook (2024)'
WHERE name = 'T&D Losses';

-- Upstream Fuel Emissions
UPDATE metrics_catalog
SET emission_factor_source = 'GREET Model 2024 - Argonne National Laboratory'
WHERE name = 'Upstream Fuel Emissions';

-- Financial/Investment Emissions
UPDATE metrics_catalog
SET emission_factor_source = 'PCAF Global GHG Accounting Standard (2022)'
WHERE name IN ('Financed Emissions', 'Investment Emissions');

-- Product Use Phase
UPDATE metrics_catalog
SET emission_factor_source = 'Product Category Rules (PCR) - ISO 14025'
WHERE name IN ('Processing of Sold Products', 'Product Energy Consumption', 'Use of Sold Products', 'Product End-of-Life', 'Product Recycling Rate');

-- Cloud Computing
UPDATE metrics_catalog
SET emission_factor_source = 'Cloud Carbon Footprint Methodology (2023)'
WHERE name = 'Cloud Computing Services';

-- Purchased Goods and Services
UPDATE metrics_catalog
SET emission_factor_source = 'US EPA Supply Chain GHG Emission Factors (2024)'
WHERE name IN ('Purchased Goods', 'Purchased Services');

-- Leased Assets
UPDATE metrics_catalog
SET emission_factor_source = 'GHG Protocol Corporate Standard (2015)'
WHERE name IN ('Downstream Leased Assets', 'Leased Buildings Energy', 'Leased Vehicles Fuel');

-- Franchises
UPDATE metrics_catalog
SET emission_factor_source = 'GHG Protocol Scope 3 Standard (2011)'
WHERE name = 'Franchise Operations';

-- Add a note about the importance of updating sources
COMMENT ON COLUMN metrics_catalog.emission_factor_source IS
'Reference source for the emission factor. Should be updated annually with the latest available data from recognized authorities such as IPCC, EPA, DEFRA, IEA, or relevant national/regional standards.';