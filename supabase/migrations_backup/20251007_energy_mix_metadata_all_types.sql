-- Create comprehensive energy mix metadata table for ALL energy types
-- Supports electricity, district heating, district cooling, steam, and other energy sources

CREATE TABLE IF NOT EXISTS energy_mix_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Energy type classification
  energy_type TEXT NOT NULL CHECK (energy_type IN ('electricity', 'district_heating', 'district_cooling', 'steam', 'other')),

  -- Provider/supplier information
  provider_name TEXT NOT NULL,
  country_code TEXT NOT NULL,
  region TEXT, -- Optional: for regional grids or suppliers

  -- Time period
  year INTEGER NOT NULL,
  month INTEGER CHECK (month >= 1 AND month <= 12), -- Optional: for monthly data

  -- Overall renewable split
  renewable_percentage DECIMAL(5,2) NOT NULL CHECK (renewable_percentage >= 0 AND renewable_percentage <= 100),
  non_renewable_percentage DECIMAL(5,2) NOT NULL CHECK (non_renewable_percentage >= 0 AND non_renewable_percentage <= 100),

  -- Detailed source breakdown (JSONB array)
  -- Format: [{"name": "Wind", "percentage": 25.5, "renewable": true}, {...}]
  sources JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Metadata
  source_url TEXT,
  notes TEXT,
  data_quality TEXT CHECK (data_quality IN ('verified', 'estimated', 'modeled', 'unknown')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure percentages add up to 100
  CONSTRAINT valid_percentages CHECK (renewable_percentage + non_renewable_percentage = 100),

  -- Unique constraint: one mix per provider/energy type/year/month/country
  UNIQUE(provider_name, energy_type, country_code, year, COALESCE(month, 0), COALESCE(region, ''))
);

-- Indexes for efficient queries
CREATE INDEX idx_energy_mix_lookup ON energy_mix_metadata(provider_name, energy_type, country_code, year);
CREATE INDEX idx_energy_mix_type ON energy_mix_metadata(energy_type);
CREATE INDEX idx_energy_mix_year ON energy_mix_metadata(year);
CREATE INDEX idx_energy_mix_provider ON energy_mix_metadata(provider_name);

-- Enable RLS
ALTER TABLE energy_mix_metadata ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read energy mix data
CREATE POLICY "Allow authenticated users to read energy mix"
  ON energy_mix_metadata
  FOR SELECT
  TO authenticated
  USING (true);

-- Only super admins can insert/update energy mix data
CREATE POLICY "Allow super admins to manage energy mix"
  ON energy_mix_metadata
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_users
      WHERE app_users.id = auth.uid()
      AND app_users.role = 'super_admin'
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_energy_mix_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_energy_mix_metadata_updated_at
  BEFORE UPDATE ON energy_mix_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_energy_mix_metadata_updated_at();

-- Validation function for sources JSONB
CREATE OR REPLACE FUNCTION validate_energy_mix_sources()
RETURNS TRIGGER AS $$
DECLARE
  source_item JSONB;
  total_percentage DECIMAL;
BEGIN
  -- Validate that sources is an array
  IF jsonb_typeof(NEW.sources) != 'array' THEN
    RAISE EXCEPTION 'sources must be a JSON array';
  END IF;

  -- Validate each source has required fields
  FOR source_item IN SELECT * FROM jsonb_array_elements(NEW.sources)
  LOOP
    IF NOT (source_item ? 'name' AND source_item ? 'renewable') THEN
      RAISE EXCEPTION 'Each source must have "name" and "renewable" fields';
    END IF;
  END LOOP;

  -- If percentages are provided, validate they sum to ~100
  SELECT COALESCE(SUM((value->>'percentage')::DECIMAL), 0)
  INTO total_percentage
  FROM jsonb_array_elements(NEW.sources);

  IF total_percentage > 0 AND ABS(total_percentage - 100) > 0.1 THEN
    RAISE EXCEPTION 'Source percentages must sum to 100, got %', total_percentage;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_energy_mix_sources
  BEFORE INSERT OR UPDATE ON energy_mix_metadata
  FOR EACH ROW
  EXECUTE FUNCTION validate_energy_mix_sources();

-- Migrate existing EDP electricity data from electricity_provider_mix table
INSERT INTO energy_mix_metadata (
  energy_type,
  provider_name,
  country_code,
  year,
  renewable_percentage,
  non_renewable_percentage,
  sources,
  source_url,
  notes,
  data_quality
)
SELECT
  'electricity' as energy_type,
  provider_name,
  country_code,
  year,
  renewable_percentage,
  non_renewable_percentage,
  '[]'::jsonb as sources, -- Empty for now, can be populated later with detailed breakdown
  source_url,
  'Migrated from electricity_provider_mix table' as notes,
  'verified' as data_quality
FROM electricity_provider_mix
ON CONFLICT (provider_name, energy_type, country_code, year, COALESCE(month, 0), COALESCE(region, ''))
DO UPDATE SET
  renewable_percentage = EXCLUDED.renewable_percentage,
  non_renewable_percentage = EXCLUDED.non_renewable_percentage,
  source_url = EXCLUDED.source_url,
  updated_at = NOW();

-- Insert Portugal grid mix data 2022-2025 with detailed source breakdown
-- Data source: Portuguese electricity grid operator

-- 2025 Grid Mix
INSERT INTO energy_mix_metadata (
  energy_type,
  provider_name,
  country_code,
  year,
  renewable_percentage,
  non_renewable_percentage,
  sources,
  source_url,
  notes,
  data_quality
)
VALUES (
  'electricity',
  'REN (Portuguese Grid)',
  'PT',
  2025,
  56.99,
  43.01,
  '[
    {"name": "Eólica", "percentage": 11.38, "renewable": true},
    {"name": "Hídrica", "percentage": 31.22, "renewable": true},
    {"name": "Cogeração renovável", "percentage": 3.39, "renewable": true},
    {"name": "Geotermia", "percentage": 0.00, "renewable": true},
    {"name": "Outras renováveis", "percentage": 10.71, "renewable": true},
    {"name": "Resíduos sólidos urbanos", "percentage": 0.58, "renewable": false},
    {"name": "Cogeração fóssil", "percentage": 3.23, "renewable": false},
    {"name": "Gás Natural", "percentage": 28.35, "renewable": false},
    {"name": "Carvão", "percentage": 0.58, "renewable": false},
    {"name": "Diesel", "percentage": 0.00, "renewable": false},
    {"name": "Fuelóleo", "percentage": 0.00, "renewable": false},
    {"name": "Nuclear", "percentage": 10.57, "renewable": false}
  ]'::jsonb,
  'https://www.ren.pt',
  'Portugal grid mix 2025 - Official data from grid operator',
  'verified'
),
-- 2024 Grid Mix
(
  'electricity',
  'REN (Portuguese Grid)',
  'PT',
  2024,
  62.23,
  37.77,
  '[
    {"name": "Eólica", "percentage": 15.97, "renewable": true},
    {"name": "Hídrica", "percentage": 33.69, "renewable": true},
    {"name": "Cogeração renovável", "percentage": 0.12, "renewable": true},
    {"name": "Geotermia", "percentage": 0.00, "renewable": true},
    {"name": "Outras renováveis", "percentage": 12.21, "renewable": true},
    {"name": "Resíduos sólidos urbanos", "percentage": 0.48, "renewable": false},
    {"name": "Cogeração fóssil", "percentage": 2.92, "renewable": false},
    {"name": "Gás Natural", "percentage": 24.28, "renewable": false},
    {"name": "Carvão", "percentage": 0.53, "renewable": false},
    {"name": "Diesel", "percentage": 0.00, "renewable": false},
    {"name": "Fuelóleo", "percentage": 0.00, "renewable": false},
    {"name": "Nuclear", "percentage": 9.81, "renewable": false}
  ]'::jsonb,
  'https://www.ren.pt',
  'Portugal grid mix 2024 - Official data from grid operator',
  'verified'
),
-- 2023 Grid Mix
(
  'electricity',
  'REN (Portuguese Grid)',
  'PT',
  2023,
  33.30,
  66.70,
  '[
    {"name": "Eólica", "percentage": 9.83, "renewable": true},
    {"name": "Hídrica", "percentage": 15.86, "renewable": true},
    {"name": "Cogeração renovável", "percentage": 0.13, "renewable": true},
    {"name": "Geotermia", "percentage": 0.00, "renewable": true},
    {"name": "Outras renováveis", "percentage": 6.98, "renewable": true},
    {"name": "Resíduos sólidos urbanos", "percentage": 0.99, "renewable": false},
    {"name": "Cogeração fóssil", "percentage": 5.82, "renewable": false},
    {"name": "Gás Natural", "percentage": 50.92, "renewable": false},
    {"name": "Carvão", "percentage": 0.71, "renewable": false},
    {"name": "Diesel", "percentage": 0.00, "renewable": false},
    {"name": "Fuelóleo", "percentage": 0.00, "renewable": false},
    {"name": "Nuclear", "percentage": 8.76, "renewable": false}
  ]'::jsonb,
  'https://www.ren.pt',
  'Portugal grid mix 2023 - Official data from grid operator',
  'verified'
),
-- 2022 Grid Mix
(
  'electricity',
  'REN (Portuguese Grid)',
  'PT',
  2022,
  28.15,
  71.85,
  '[
    {"name": "Eólica", "percentage": 8.47, "renewable": true},
    {"name": "Hídrica", "percentage": 9.68, "renewable": true},
    {"name": "Cogeração renovável", "percentage": 1.15, "renewable": true},
    {"name": "Geotermia", "percentage": 0.00, "renewable": true},
    {"name": "Outras renováveis", "percentage": 8.44, "renewable": true},
    {"name": "Resíduos sólidos urbanos", "percentage": 0.82, "renewable": false},
    {"name": "Cogeração fóssil", "percentage": 2.90, "renewable": false},
    {"name": "Gás Natural", "percentage": 59.25, "renewable": false},
    {"name": "Carvão", "percentage": 1.55, "renewable": false},
    {"name": "Diesel", "percentage": 0.00, "renewable": false},
    {"name": "Fuelóleo", "percentage": 0.00, "renewable": false},
    {"name": "Nuclear", "percentage": 7.73, "renewable": false}
  ]'::jsonb,
  'https://www.ren.pt',
  'Portugal grid mix 2022 - Official data from grid operator',
  'verified'
)
ON CONFLICT (provider_name, energy_type, country_code, year, COALESCE(month, 0), COALESCE(region, ''))
DO UPDATE SET
  renewable_percentage = EXCLUDED.renewable_percentage,
  non_renewable_percentage = EXCLUDED.non_renewable_percentage,
  sources = EXCLUDED.sources,
  source_url = EXCLUDED.source_url,
  notes = EXCLUDED.notes,
  data_quality = EXCLUDED.data_quality,
  updated_at = NOW();

-- Example: District heating supplier mix (placeholder data)
-- Organizations can add their actual supplier data
INSERT INTO energy_mix_metadata (
  energy_type,
  provider_name,
  country_code,
  region,
  year,
  renewable_percentage,
  non_renewable_percentage,
  sources,
  source_url,
  notes,
  data_quality
)
VALUES (
  'district_heating',
  'Generic District Heating',
  'PT',
  'Lisbon',
  2025,
  30.0,
  70.0,
  '[
    {"name": "Biomass", "percentage": 20.0, "renewable": true},
    {"name": "Waste Heat Recovery", "percentage": 10.0, "renewable": true},
    {"name": "Natural Gas", "percentage": 60.0, "renewable": false},
    {"name": "Other Fossil", "percentage": 10.0, "renewable": false}
  ]'::jsonb,
  null,
  'Example district heating mix - replace with actual supplier data',
  'estimated'
)
ON CONFLICT (provider_name, energy_type, country_code, year, COALESCE(month, 0), COALESCE(region, ''))
DO NOTHING;

COMMENT ON TABLE energy_mix_metadata IS 'Comprehensive energy mix metadata for all energy types (electricity, district heating/cooling, steam) with detailed source breakdowns';
COMMENT ON COLUMN energy_mix_metadata.energy_type IS 'Type of energy: electricity, district_heating, district_cooling, steam, other';
COMMENT ON COLUMN energy_mix_metadata.sources IS 'JSONB array of energy sources with name, percentage, and renewable flag: [{"name": "Wind", "percentage": 25.5, "renewable": true}, ...]';
COMMENT ON COLUMN energy_mix_metadata.data_quality IS 'Quality of data: verified (from official source), estimated (calculated), modeled (simulated), unknown';
