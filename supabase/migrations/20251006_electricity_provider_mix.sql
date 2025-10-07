-- Create table to store electricity provider renewable energy mix by year
CREATE TABLE IF NOT EXISTS electricity_provider_mix (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  renewable_percentage DECIMAL(5,2) NOT NULL CHECK (renewable_percentage >= 0 AND renewable_percentage <= 100),
  non_renewable_percentage DECIMAL(5,2) NOT NULL CHECK (non_renewable_percentage >= 0 AND non_renewable_percentage <= 100),
  source_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure percentages add up to 100
  CONSTRAINT valid_percentages CHECK (renewable_percentage + non_renewable_percentage = 100),

  -- Unique constraint: one mix per provider per year per country
  UNIQUE(provider_name, country_code, year)
);

-- Add indexes for common queries
CREATE INDEX idx_provider_mix_lookup ON electricity_provider_mix(provider_name, country_code, year);
CREATE INDEX idx_provider_mix_year ON electricity_provider_mix(year);

-- Enable RLS
ALTER TABLE electricity_provider_mix ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read provider mix data
CREATE POLICY "Allow authenticated users to read provider mix"
  ON electricity_provider_mix
  FOR SELECT
  TO authenticated
  USING (true);

-- Only super admins can insert/update provider mix data
CREATE POLICY "Allow super admins to manage provider mix"
  ON electricity_provider_mix
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role = 'super_admin'
    )
  );

-- Insert EDP Portugal data
INSERT INTO electricity_provider_mix (provider_name, country_code, year, renewable_percentage, non_renewable_percentage, source_url, notes)
VALUES
  ('EDP', 'PT', 2022, 28.15, 71.85, 'https://www.edp.com', 'EDP Portugal renewable energy mix for 2022'),
  ('EDP', 'PT', 2023, 33.30, 66.70, 'https://www.edp.com', 'EDP Portugal renewable energy mix for 2023'),
  ('EDP', 'PT', 2024, 62.23, 37.77, 'https://www.edp.com', 'EDP Portugal renewable energy mix for 2024'),
  ('EDP', 'PT', 2025, 56.99, 43.01, 'https://www.edp.com', 'EDP Portugal renewable energy mix for 2025')
ON CONFLICT (provider_name, country_code, year)
DO UPDATE SET
  renewable_percentage = EXCLUDED.renewable_percentage,
  non_renewable_percentage = EXCLUDED.non_renewable_percentage,
  source_url = EXCLUDED.source_url,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_electricity_provider_mix_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_electricity_provider_mix_updated_at
  BEFORE UPDATE ON electricity_provider_mix
  FOR EACH ROW
  EXECUTE FUNCTION update_electricity_provider_mix_updated_at();

COMMENT ON TABLE electricity_provider_mix IS 'Stores electricity provider renewable energy mix percentages by year for accurate Scope 2 emissions calculations';
COMMENT ON COLUMN electricity_provider_mix.renewable_percentage IS 'Percentage of electricity from renewable sources (0-100)';
COMMENT ON COLUMN electricity_provider_mix.non_renewable_percentage IS 'Percentage of electricity from non-renewable/fossil sources (0-100)';
