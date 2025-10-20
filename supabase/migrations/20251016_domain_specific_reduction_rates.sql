-- Migration: Add domain-specific reduction rates to sustainability_targets
-- This enables org-specific reduction rates per domain (energy, water, waste)

-- Add domain-specific reduction rate columns
ALTER TABLE sustainability_targets
ADD COLUMN IF NOT EXISTS energy_reduction_percent DECIMAL(5,2) DEFAULT 4.2
  CHECK (energy_reduction_percent > 0 AND energy_reduction_percent <= 100),
ADD COLUMN IF NOT EXISTS water_reduction_percent DECIMAL(5,2) DEFAULT 2.5
  CHECK (water_reduction_percent > 0 AND water_reduction_percent <= 100),
ADD COLUMN IF NOT EXISTS waste_reduction_percent DECIMAL(5,2) DEFAULT 3.0
  CHECK (waste_reduction_percent > 0 AND waste_reduction_percent <= 100);

-- Rename existing target_reduction_percent to emissions_reduction_percent for clarity
ALTER TABLE sustainability_targets
ADD COLUMN IF NOT EXISTS emissions_reduction_percent DECIMAL(5,2);

-- Copy data from target_reduction_percent to emissions_reduction_percent
UPDATE sustainability_targets
SET emissions_reduction_percent = target_reduction_percent
WHERE emissions_reduction_percent IS NULL AND target_reduction_percent IS NOT NULL;

-- Set default for emissions if NULL
UPDATE sustainability_targets
SET emissions_reduction_percent = 4.2
WHERE emissions_reduction_percent IS NULL;

-- Add constraint to emissions_reduction_percent
ALTER TABLE sustainability_targets
ADD CONSTRAINT check_emissions_reduction_percent
  CHECK (emissions_reduction_percent IS NULL OR (emissions_reduction_percent > 0 AND emissions_reduction_percent <= 100));

-- Add helpful comments
COMMENT ON COLUMN sustainability_targets.energy_reduction_percent IS 'Annual reduction target for energy consumption (default: 4.2% - SBTi)';
COMMENT ON COLUMN sustainability_targets.water_reduction_percent IS 'Annual reduction target for water consumption (default: 2.5% - CDP Water Security)';
COMMENT ON COLUMN sustainability_targets.waste_reduction_percent IS 'Annual reduction target for waste generation (default: 3% - Circular Economy)';
COMMENT ON COLUMN sustainability_targets.emissions_reduction_percent IS 'Annual reduction target for GHG emissions (default: 4.2% - SBTi)';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_sustainability_targets_org_rates
  ON sustainability_targets(organization_id, energy_reduction_percent, water_reduction_percent, waste_reduction_percent);

-- Update existing targets with default values if not set
UPDATE sustainability_targets
SET
  energy_reduction_percent = COALESCE(energy_reduction_percent, 4.2),
  water_reduction_percent = COALESCE(water_reduction_percent, 2.5),
  waste_reduction_percent = COALESCE(waste_reduction_percent, 3.0),
  emissions_reduction_percent = COALESCE(emissions_reduction_percent, 4.2)
WHERE energy_reduction_percent IS NULL
   OR water_reduction_percent IS NULL
   OR waste_reduction_percent IS NULL
   OR emissions_reduction_percent IS NULL;
