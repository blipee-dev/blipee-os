-- Migration: Add organization baseline settings table
-- This allows each organization to configure their own baseline and target years

CREATE TABLE IF NOT EXISTS organization_baseline_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Baseline configuration
  baseline_year INTEGER NOT NULL DEFAULT 2023,
  target_year INTEGER NOT NULL DEFAULT 2025,

  -- Optional: different baselines per domain
  energy_baseline_year INTEGER,
  water_baseline_year INTEGER,
  waste_baseline_year INTEGER,
  emissions_baseline_year INTEGER,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT unique_org_baseline UNIQUE(organization_id),
  CONSTRAINT valid_years CHECK (target_year > baseline_year),
  CONSTRAINT baseline_recent CHECK (baseline_year >= 2015 AND baseline_year <= EXTRACT(YEAR FROM CURRENT_DATE)),
  CONSTRAINT target_future CHECK (target_year >= baseline_year AND target_year <= 2100)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_org_baseline_settings_org_id ON organization_baseline_settings(organization_id);

-- Enable RLS
ALTER TABLE organization_baseline_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's baseline settings"
  ON organization_baseline_settings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can update their organization's baseline settings"
  ON organization_baseline_settings
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('account_owner', 'sustainability_manager')
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_baseline_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_org_baseline_settings_timestamp
  BEFORE UPDATE ON organization_baseline_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_baseline_settings_updated_at();

-- Insert default settings for existing organizations
INSERT INTO organization_baseline_settings (organization_id, baseline_year, target_year)
SELECT id, 2023, 2025
FROM organizations
WHERE id NOT IN (SELECT organization_id FROM organization_baseline_settings)
ON CONFLICT (organization_id) DO NOTHING;

-- Add helpful comment
COMMENT ON TABLE organization_baseline_settings IS 'Stores baseline and target year configuration for each organization. Allows dynamic baseline years instead of hardcoded values.';
COMMENT ON COLUMN organization_baseline_settings.baseline_year IS 'Primary baseline year (default: 2023). Used across all dashboards unless domain-specific baseline is set.';
COMMENT ON COLUMN organization_baseline_settings.energy_baseline_year IS 'Optional: Override baseline year specifically for Energy Dashboard';
COMMENT ON COLUMN organization_baseline_settings.water_baseline_year IS 'Optional: Override baseline year specifically for Water Dashboard';
COMMENT ON COLUMN organization_baseline_settings.waste_baseline_year IS 'Optional: Override baseline year specifically for Waste Dashboard';
COMMENT ON COLUMN organization_baseline_settings.emissions_baseline_year IS 'Optional: Override baseline year specifically for Emissions Dashboard';
