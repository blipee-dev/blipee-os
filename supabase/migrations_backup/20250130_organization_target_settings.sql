-- Organization-specific target settings
-- Stores customizable parameters for sustainability targets

CREATE TABLE IF NOT EXISTS organization_target_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Target framework configuration
  preferred_framework TEXT DEFAULT 'sbti_15c',
  custom_framework JSONB, -- Custom framework definition if not using standard

  -- Target years (dynamic based on when they set targets)
  near_term_target_year INTEGER,
  long_term_target_year INTEGER,

  -- Reduction percentages (can override framework defaults)
  near_term_reduction_percent NUMERIC(5,2),
  long_term_reduction_percent NUMERIC(5,2),
  annual_reduction_rate NUMERIC(5,2),

  -- Scope configuration
  include_scope1 BOOLEAN DEFAULT true,
  include_scope2 BOOLEAN DEFAULT true,
  include_scope3 BOOLEAN DEFAULT true,
  scope3_threshold_percent NUMERIC(5,2) DEFAULT 40, -- % of emissions requiring Scope 3

  -- Offset configuration
  max_offset_percent NUMERIC(5,2) DEFAULT 10, -- Maximum % of reductions from offsets
  preferred_offset_types TEXT[], -- Types of offsets allowed

  -- Regional/sector specific
  region TEXT,
  sector TEXT,
  subsector TEXT,

  -- Baseline configuration
  baseline_year INTEGER,
  baseline_recalculation_policy TEXT, -- 'fixed', 'rolling', 'structural_change'

  -- Reporting configuration
  reporting_frequency TEXT DEFAULT 'annual', -- 'quarterly', 'annual'
  fiscal_year_end_month INTEGER DEFAULT 12,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE organization_target_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Organizations can view their own settings"
  ON organization_target_settings
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins can update settings"
  ON organization_target_settings
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager')
    )
  );

-- Function to get dynamic baseline year
CREATE OR REPLACE FUNCTION get_baseline_year(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  setting_year INTEGER;
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
  data_year INTEGER;
BEGIN
  -- First check if organization has specified baseline year
  SELECT baseline_year INTO setting_year
  FROM organization_target_settings
  WHERE organization_id = org_id;

  IF setting_year IS NOT NULL THEN
    RETURN setting_year;
  END IF;

  -- Otherwise find most recent complete year with data
  SELECT EXTRACT(YEAR FROM MAX(period_end)) INTO data_year
  FROM metrics_data
  WHERE organization_id = org_id
  AND period_end < DATE_TRUNC('year', NOW());

  IF data_year IS NOT NULL THEN
    RETURN data_year;
  END IF;

  -- Default to previous year
  RETURN current_year - 1;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate target year
CREATE OR REPLACE FUNCTION calculate_target_year(
  org_id UUID,
  min_years_out INTEGER DEFAULT 5
)
RETURNS INTEGER AS $$
DECLARE
  setting_year INTEGER;
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
BEGIN
  -- Check if organization has specified target year
  SELECT near_term_target_year INTO setting_year
  FROM organization_target_settings
  WHERE organization_id = org_id;

  IF setting_year IS NOT NULL AND setting_year >= current_year + min_years_out THEN
    RETURN setting_year;
  END IF;

  -- Check common target years (2030, 2035, 2040, etc.)
  IF 2030 >= current_year + min_years_out THEN
    RETURN 2030;
  ELSIF 2035 >= current_year + min_years_out THEN
    RETURN 2035;
  ELSIF 2040 >= current_year + min_years_out THEN
    RETURN 2040;
  ELSE
    -- Round up to nearest 5 years
    RETURN ((current_year + min_years_out + 4) / 5) * 5;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get reduction target based on framework and timeline
CREATE OR REPLACE FUNCTION get_reduction_target(
  org_id UUID,
  target_type TEXT DEFAULT 'near_term' -- 'near_term' or 'long_term'
)
RETURNS NUMERIC AS $$
DECLARE
  framework TEXT;
  custom_percent NUMERIC;
  default_percent NUMERIC;
BEGIN
  -- Get organization's framework and custom percentage
  SELECT
    preferred_framework,
    CASE
      WHEN target_type = 'near_term' THEN near_term_reduction_percent
      ELSE long_term_reduction_percent
    END
  INTO framework, custom_percent
  FROM organization_target_settings
  WHERE organization_id = org_id;

  -- If custom percentage is set, use it
  IF custom_percent IS NOT NULL THEN
    RETURN custom_percent;
  END IF;

  -- Otherwise use framework defaults
  CASE framework
    WHEN 'sbti_15c' THEN
      default_percent := CASE WHEN target_type = 'near_term' THEN 42 ELSE 90 END;
    WHEN 'sbti_2c' THEN
      default_percent := CASE WHEN target_type = 'near_term' THEN 25 ELSE 90 END;
    WHEN 'eu_fit55' THEN
      default_percent := CASE WHEN target_type = 'near_term' THEN 55 ELSE 100 END;
    WHEN 'race_to_zero' THEN
      default_percent := CASE WHEN target_type = 'near_term' THEN 50 ELSE 100 END;
    ELSE
      default_percent := CASE WHEN target_type = 'near_term' THEN 30 ELSE 80 END;
  END CASE;

  RETURN default_percent;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX idx_org_target_settings_org_id ON organization_target_settings(organization_id);
CREATE INDEX idx_org_target_settings_framework ON organization_target_settings(preferred_framework);

-- Trigger to update updated_at
CREATE TRIGGER update_organization_target_settings_updated_at
  BEFORE UPDATE ON organization_target_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Insert default settings for existing organizations
INSERT INTO organization_target_settings (organization_id)
SELECT id FROM organizations
ON CONFLICT (organization_id) DO NOTHING;