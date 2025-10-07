-- Enhanced Waste Tracking System for GRI 306, ESRS E5, CDP, TCFD Compliance
-- This migration adds granular waste material tracking and proper categorization

-- =====================================================
-- STEP 1: Add metadata columns to metrics_catalog
-- =====================================================

ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS waste_material_type TEXT,
ADD COLUMN IF NOT EXISTS disposal_method TEXT,
ADD COLUMN IF NOT EXISTS is_diverted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_recycling BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_energy_recovery BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cost_per_ton DECIMAL(10,2);

-- Add comments for documentation
COMMENT ON COLUMN metrics_catalog.waste_material_type IS 'Material type: paper, plastic, metal, glass, organic, ewaste, hazardous, mixed';
COMMENT ON COLUMN metrics_catalog.disposal_method IS 'Disposal method: recycling, composting, incineration_recovery, incineration_no_recovery, landfill, reuse, hazardous_treatment';
COMMENT ON COLUMN metrics_catalog.is_diverted IS 'GRI 306-4: Waste diverted from disposal (recycling, composting, recovery, reuse)';
COMMENT ON COLUMN metrics_catalog.is_recycling IS 'ESRS E5: Specifically recycled waste (subset of diverted)';
COMMENT ON COLUMN metrics_catalog.has_energy_recovery IS 'TRUE for waste-to-energy incineration';

-- =====================================================
-- STEP 2: Update existing waste metrics
-- =====================================================

-- Recycling (diverted + recycling)
UPDATE metrics_catalog
SET
  disposal_method = 'recycling',
  is_diverted = TRUE,
  is_recycling = TRUE,
  waste_material_type = 'mixed',
  unit = 'tons'
WHERE code = 'scope3_waste_recycling';

-- Composting (diverted but not recycling)
UPDATE metrics_catalog
SET
  disposal_method = 'composting',
  is_diverted = TRUE,
  is_recycling = FALSE,
  waste_material_type = 'organic',
  unit = 'tons'
WHERE code = 'scope3_waste_composting';

-- Incineration (assume energy recovery for now - diverted but not recycling)
UPDATE metrics_catalog
SET
  disposal_method = 'incineration_recovery',
  is_diverted = TRUE,
  is_recycling = FALSE,
  has_energy_recovery = TRUE,
  waste_material_type = 'mixed',
  unit = 'tons'
WHERE code = 'scope3_waste_incineration';

-- Landfill (disposal - not diverted)
UPDATE metrics_catalog
SET
  disposal_method = 'landfill',
  is_diverted = FALSE,
  is_recycling = FALSE,
  waste_material_type = 'mixed',
  unit = 'tons'  -- Changed from kg
WHERE code = 'scope3_waste_landfill';

-- E-waste (assume disposal for now, will create recycled version)
UPDATE metrics_catalog
SET
  disposal_method = 'landfill',
  is_diverted = FALSE,
  is_recycling = FALSE,
  waste_material_type = 'ewaste',
  unit = 'tons'  -- Changed from kg
WHERE code = 'scope3_waste_ewaste';

-- =====================================================
-- STEP 3: Convert existing landfill data from kg to tons
-- =====================================================

-- Update metrics_data for landfill (kg -> tons)
UPDATE metrics_data
SET value = value / 1000
WHERE metric_id IN (
  SELECT id FROM metrics_catalog
  WHERE code IN ('scope3_waste_landfill', 'scope3_waste_ewaste')
  AND unit = 'tons'
);

-- =====================================================
-- STEP 4: Create granular waste metrics
-- =====================================================

-- Helper function to insert waste metric
CREATE OR REPLACE FUNCTION insert_waste_metric(
  p_code TEXT,
  p_name TEXT,
  p_subcategory TEXT,
  p_material_type TEXT,
  p_disposal_method TEXT,
  p_is_diverted BOOLEAN,
  p_is_recycling BOOLEAN,
  p_has_energy_recovery BOOLEAN,
  p_description TEXT,
  p_emission_factor DECIMAL DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO metrics_catalog (
    code, name, category, subcategory, unit,
    waste_material_type, disposal_method,
    is_diverted, is_recycling, has_energy_recovery,
    description, emission_factor, scope
  ) VALUES (
    p_code, p_name, 'Waste', p_subcategory, 'tons',
    p_material_type, p_disposal_method,
    p_is_diverted, p_is_recycling, p_has_energy_recovery,
    p_description, p_emission_factor, 'scope_3'
  )
  ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    subcategory = EXCLUDED.subcategory,
    waste_material_type = EXCLUDED.waste_material_type,
    disposal_method = EXCLUDED.disposal_method,
    is_diverted = EXCLUDED.is_diverted,
    is_recycling = EXCLUDED.is_recycling,
    has_energy_recovery = EXCLUDED.has_energy_recovery,
    description = EXCLUDED.description,
    emission_factor = EXCLUDED.emission_factor;
END;
$$ LANGUAGE plpgsql;

-- DIVERTED FROM DISPOSAL (GRI 306-4) --

-- Recycling by material type
SELECT insert_waste_metric(
  'scope3_waste_recycling_paper',
  'Paper & Cardboard Recycling',
  'Recycling',
  'paper',
  'recycling',
  TRUE, TRUE, FALSE,
  'Paper, cardboard, and paper-based packaging sent for recycling. GRI 306-4: Waste diverted from disposal. ESRS E5: Circular economy.',
  0.021  -- tCO2e per ton (recycling emission factor)
);

SELECT insert_waste_metric(
  'scope3_waste_recycling_plastic',
  'Plastic Recycling',
  'Recycling',
  'plastic',
  'recycling',
  TRUE, TRUE, FALSE,
  'Plastic materials sent for recycling including PET, HDPE, PVC, LDPE, PP, PS. GRI 306-4: Waste diverted from disposal. ESRS E5.',
  0.045
);

SELECT insert_waste_metric(
  'scope3_waste_recycling_metal',
  'Metal Recycling',
  'Recycling',
  'metal',
  'recycling',
  TRUE, TRUE, FALSE,
  'Metal waste recycled including aluminum, steel, copper. GRI 306-4: Waste diverted from disposal. ESRS E5: Circular economy.',
  0.032
);

SELECT insert_waste_metric(
  'scope3_waste_recycling_glass',
  'Glass Recycling',
  'Recycling',
  'glass',
  'recycling',
  TRUE, TRUE, FALSE,
  'Glass waste sent for recycling. GRI 306-4: Waste diverted from disposal. ESRS E5: Circular economy.',
  0.028
);

SELECT insert_waste_metric(
  'scope3_waste_recycling_mixed',
  'Mixed Materials Recycling',
  'Recycling',
  'mixed',
  'recycling',
  TRUE, TRUE, FALSE,
  'Mixed recyclable materials where segregation is not tracked. GRI 306-4: Waste diverted from disposal.',
  0.035
);

-- E-waste recycling
SELECT insert_waste_metric(
  'scope3_waste_ewaste_recycled',
  'E-Waste Recycled',
  'Recycling',
  'ewaste',
  'recycling',
  TRUE, TRUE, FALSE,
  'Electronic waste properly recycled including computers, phones, servers, monitors. GRI 306-4: Waste diverted. WEEE Directive compliant.',
  0.056
);

-- Composting
SELECT insert_waste_metric(
  'scope3_waste_composting_food',
  'Food Waste Composting',
  'Composting',
  'organic',
  'composting',
  TRUE, FALSE, FALSE,
  'Food waste and organic kitchen waste sent for composting. GRI 306-4: Waste diverted from disposal. Prevents methane emissions.',
  0.014
);

SELECT insert_waste_metric(
  'scope3_waste_composting_garden',
  'Garden Waste Composting',
  'Composting',
  'organic',
  'composting',
  TRUE, FALSE, FALSE,
  'Garden waste, landscaping trimmings, and green waste composted. GRI 306-4: Waste diverted from disposal.',
  0.012
);

-- Reuse
SELECT insert_waste_metric(
  'scope3_waste_reuse',
  'Waste Reused',
  'Reuse',
  'mixed',
  'reuse',
  TRUE, FALSE, FALSE,
  'Materials reused directly without reprocessing. GRI 306-4: Waste diverted from disposal. Highest level of waste hierarchy.',
  0.005
);

-- Waste-to-Energy
SELECT insert_waste_metric(
  'scope3_waste_incineration_recovery',
  'Waste Incineration with Energy Recovery',
  'Incineration',
  'mixed',
  'incineration_recovery',
  TRUE, FALSE, TRUE,
  'Waste incinerated with energy recovery (waste-to-energy). GRI 306-4: Waste diverted from disposal through recovery operation.',
  0.185
);

-- DIRECTED TO DISPOSAL (GRI 306-5) --

-- Landfill by type
SELECT insert_waste_metric(
  'scope3_waste_landfill_general',
  'General Waste to Landfill',
  'Disposal',
  'mixed',
  'landfill',
  FALSE, FALSE, FALSE,
  'General waste sent to landfill. GRI 306-5: Waste directed to disposal. High methane emissions.',
  0.567  -- tCO2e per ton (includes methane)
);

SELECT insert_waste_metric(
  'scope3_waste_landfill_construction',
  'Construction & Demolition Waste to Landfill',
  'Disposal',
  'mixed',
  'landfill',
  FALSE, FALSE, FALSE,
  'Construction and demolition waste sent to landfill. GRI 306-5: Waste directed to disposal.',
  0.234
);

-- Hazardous waste
SELECT insert_waste_metric(
  'scope3_waste_hazardous_treatment',
  'Hazardous Waste Treatment',
  'Hazardous',
  'hazardous',
  'hazardous_treatment',
  FALSE, FALSE, FALSE,
  'Hazardous waste sent for specialized treatment and disposal. GRI 306-5: Waste directed to disposal. Requires special handling.',
  0.789
);

-- Incineration without recovery
SELECT insert_waste_metric(
  'scope3_waste_incineration_no_recovery',
  'Waste Incineration without Energy Recovery',
  'Disposal',
  'mixed',
  'incineration_no_recovery',
  FALSE, FALSE, FALSE,
  'Waste incinerated without energy recovery. GRI 306-5: Waste directed to disposal.',
  0.298
);

-- E-waste to landfill
SELECT insert_waste_metric(
  'scope3_waste_ewaste_landfill',
  'E-Waste to Landfill',
  'Disposal',
  'ewaste',
  'landfill',
  FALSE, FALSE, FALSE,
  'Electronic waste improperly disposed to landfill. GRI 306-5: Waste directed to disposal. Environmental hazard.',
  0.645
);

-- Drop the helper function
DROP FUNCTION insert_waste_metric;

-- =====================================================
-- STEP 5: Create indexes for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_metrics_catalog_is_diverted ON metrics_catalog(is_diverted);
CREATE INDEX IF NOT EXISTS idx_metrics_catalog_is_recycling ON metrics_catalog(is_recycling);
CREATE INDEX IF NOT EXISTS idx_metrics_catalog_waste_material ON metrics_catalog(waste_material_type);
CREATE INDEX IF NOT EXISTS idx_metrics_catalog_disposal_method ON metrics_catalog(disposal_method);

-- =====================================================
-- STEP 6: Create view for easy waste queries
-- =====================================================

CREATE OR REPLACE VIEW waste_metrics_view AS
SELECT
  mc.id,
  mc.code,
  mc.name,
  mc.subcategory,
  mc.waste_material_type,
  mc.disposal_method,
  mc.is_diverted,
  mc.is_recycling,
  mc.has_energy_recovery,
  mc.unit,
  mc.emission_factor,
  mc.cost_per_ton,
  CASE
    WHEN mc.is_recycling THEN 'Recycling'
    WHEN mc.is_diverted AND NOT mc.is_recycling THEN 'Other Diversion'
    ELSE 'Disposal'
  END as waste_category,
  CASE
    WHEN mc.is_diverted THEN 'GRI 306-4: Diverted from Disposal'
    ELSE 'GRI 306-5: Directed to Disposal'
  END as gri_classification
FROM metrics_catalog mc
WHERE mc.category = 'Waste'
  OR mc.code LIKE 'scope3_waste%'
ORDER BY mc.is_diverted DESC, mc.is_recycling DESC, mc.waste_material_type;

COMMENT ON VIEW waste_metrics_view IS 'Consolidated view of all waste metrics with GRI 306, ESRS E5, and CDP classifications';

-- =====================================================
-- STEP 7: Add constraints and validations
-- =====================================================

-- Ensure waste_material_type has valid values
ALTER TABLE metrics_catalog
ADD CONSTRAINT check_waste_material_type
CHECK (
  waste_material_type IS NULL OR
  waste_material_type IN ('paper', 'plastic', 'metal', 'glass', 'organic', 'ewaste', 'hazardous', 'mixed')
);

-- Ensure disposal_method has valid values
ALTER TABLE metrics_catalog
ADD CONSTRAINT check_disposal_method
CHECK (
  disposal_method IS NULL OR
  disposal_method IN ('recycling', 'composting', 'incineration_recovery', 'incineration_no_recovery', 'landfill', 'reuse', 'hazardous_treatment')
);

-- Ensure recycling implies diverted
ALTER TABLE metrics_catalog
ADD CONSTRAINT check_recycling_implies_diverted
CHECK (
  is_recycling = FALSE OR (is_recycling = TRUE AND is_diverted = TRUE)
);

-- Ensure energy recovery only for incineration
ALTER TABLE metrics_catalog
ADD CONSTRAINT check_energy_recovery_incineration
CHECK (
  has_energy_recovery = FALSE OR
  (has_energy_recovery = TRUE AND disposal_method LIKE 'incineration%')
);
