-- Fix Waste Unit Mismatch: kg input vs tons in catalog
-- The waste metrics in catalog expect tons but data is input in kg
-- We need to either convert the data (kg → tons) or update the catalog units

-- 1. First, let's see the current waste data to understand the scale
SELECT 
    md.id,
    mc.name,
    mc.unit as catalog_unit,
    md.unit as data_unit,
    md.value,
    md.value / 1000 as value_in_tons,
    md.co2e_emissions,
    md.co2e_emissions / 1000 as emissions_in_tons,
    mc.emission_factor,
    mc.emission_factor_unit
FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
WHERE mc.category = 'Waste'
   OR mc.code LIKE '%waste%'
ORDER BY md.period_start, mc.name
LIMIT 20;

-- 2. Count how many waste records we have
SELECT 
    mc.name,
    mc.unit as catalog_unit,
    md.unit as data_unit,
    COUNT(*) as record_count,
    AVG(md.value) as avg_value,
    MIN(md.value) as min_value,
    MAX(md.value) as max_value
FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
WHERE mc.category = 'Waste'
   OR mc.code LIKE '%waste%'
GROUP BY mc.id, mc.name, mc.unit, md.unit
ORDER BY mc.name;

-- 3. Option A: Convert data from kg to tons (RECOMMENDED)
-- This converts all waste data values from kg to tons to match the catalog

/*
UPDATE metrics_data 
SET 
    value = value / 1000,
    unit = 'tons'
WHERE metric_id IN (
    SELECT id FROM metrics_catalog 
    WHERE category = 'Waste' 
       OR code LIKE '%waste%'
) 
AND unit = 'kg';
*/

-- 4. Option B: Update catalog units from tons to kg (Alternative)
-- This changes the catalog and emission factors to match the kg input data

/*
-- Update catalog units to kg
UPDATE metrics_catalog 
SET 
    unit = 'kg',
    emission_factor = emission_factor / 1000,
    emission_factor_unit = REPLACE(emission_factor_unit, '/ton', '/kg')
WHERE category = 'Waste' 
   OR code LIKE '%waste%';

-- Update emission factors table if it exists
UPDATE emission_factors 
SET 
    factor = factor / 1000,
    unit = REPLACE(unit, '/ton', '/kg')
WHERE metric_code IN (
    SELECT code FROM metrics_catalog 
    WHERE category = 'Waste' 
       OR code LIKE '%waste%'
);
*/

-- 5. Verify the fix (run after applying either option)
SELECT 
    mc.name,
    mc.unit as catalog_unit,
    md.unit as data_unit,
    md.value,
    md.co2e_emissions,
    mc.emission_factor,
    mc.emission_factor_unit,
    -- Manual calculation check
    md.value * mc.emission_factor as calculated_emissions
FROM metrics_data md
JOIN metrics_catalog mc ON md.metric_id = mc.id
WHERE mc.category = 'Waste'
   OR mc.code LIKE '%waste%'
ORDER BY md.period_start, mc.name
LIMIT 10;