-- Create Portugal Grid Mix Reference Table
-- This table stores quarterly/annual renewable energy percentages for Portugal
-- Data sources: EDP, Electricity Maps, IEA
-- Used to calculate renewable energy portions when real-time data unavailable

CREATE TABLE IF NOT EXISTS portugal_grid_mix_reference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Time period
  year INTEGER NOT NULL,
  quarter INTEGER CHECK (quarter BETWEEN 1 AND 4), -- NULL for annual averages
  month INTEGER CHECK (month BETWEEN 1 AND 12), -- NULL for quarterly/annual

  -- Grid mix percentages
  renewable_percentage NUMERIC NOT NULL CHECK (renewable_percentage >= 0 AND renewable_percentage <= 100),
  non_renewable_percentage NUMERIC NOT NULL CHECK (non_renewable_percentage >= 0 AND non_renewable_percentage <= 100),
  fossil_free_percentage NUMERIC CHECK (fossil_free_percentage >= 0 AND fossil_free_percentage <= 100),

  -- Carbon intensity
  carbon_intensity NUMERIC, -- gCO2eq/kWh

  -- Source breakdown (optional detailed data)
  sources JSONB, -- {"wind": 25.5, "solar": 10.2, "hydro": 22.3, ...}

  -- Data provenance
  data_source TEXT NOT NULL, -- 'EDP', 'Electricity Maps', 'IEA', 'IRENA'
  source_url TEXT,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure percentage totals make sense
  CONSTRAINT valid_percentages CHECK (
    renewable_percentage + non_renewable_percentage >= 99 AND
    renewable_percentage + non_renewable_percentage <= 101
  ),

  -- Unique constraint on time period
  UNIQUE(year, quarter, month)
);

-- Indexes for efficient queries
CREATE INDEX idx_portugal_grid_mix_year ON portugal_grid_mix_reference(year);
CREATE INDEX idx_portugal_grid_mix_period ON portugal_grid_mix_reference(year, quarter, month);

-- RLS: Public read access (reference data)
ALTER TABLE portugal_grid_mix_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON portugal_grid_mix_reference
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert/update
CREATE POLICY "Service role full access"
  ON portugal_grid_mix_reference
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE portugal_grid_mix_reference IS 'Historical grid mix data for Portugal used to calculate renewable energy percentages';
COMMENT ON COLUMN portugal_grid_mix_reference.quarter IS '1-4 for quarterly data, NULL for annual averages';
COMMENT ON COLUMN portugal_grid_mix_reference.month IS '1-12 for monthly data, NULL for quarterly/annual';
COMMENT ON COLUMN portugal_grid_mix_reference.renewable_percentage IS 'Percentage of electricity from renewable sources (0-100)';
COMMENT ON COLUMN portugal_grid_mix_reference.sources IS 'Optional detailed breakdown by energy source in JSON format';
COMMENT ON COLUMN portugal_grid_mix_reference.data_source IS 'Source of data: EDP, Electricity Maps, IEA, etc.';

-- Populate with known historical data
INSERT INTO portugal_grid_mix_reference (year, quarter, renewable_percentage, non_renewable_percentage, carbon_intensity, data_source, source_url, notes) VALUES
-- 2022 Annual (from Electricity Maps)
(2022, NULL, 58.0, 42.0, 226, 'Electricity Maps', 'https://portal.electricitymaps.com/map/zone/PT/5y/monthly', 'Annual average from Electricity Maps portal'),

-- 2023 Estimates (interpolated from trends)
(2023, 1, 33.0, 67.0, NULL, 'EDP', 'https://www.edp.pt/origem-energia/', '2023 Q1 data from EDP website'),
(2023, 2, 45.0, 55.0, NULL, 'Estimated', NULL, 'Estimated based on seasonal patterns'),
(2023, 3, 50.0, 50.0, NULL, 'Estimated', NULL, 'Estimated based on seasonal patterns'),
(2023, 4, 40.0, 60.0, NULL, 'Estimated', NULL, 'Estimated based on seasonal patterns'),
(2023, NULL, 42.0, 58.0, NULL, 'Estimated', NULL, 'Annual average - estimated from quarterly data'),

-- 2024 Data
(2024, 1, 55.0, 45.0, NULL, 'Estimated', NULL, 'Estimated Q1 based on trends'),
(2024, 2, 60.0, 40.0, NULL, 'Estimated', NULL, 'Estimated Q2 based on trends'),
(2024, 3, 62.0, 38.0, NULL, 'EDP', 'https://www.edp.pt/origem-energia/?sector=17026&year=2024&trimester=3', 'Actual Q3 2024 data from EDP website'),
(2024, NULL, 59.0, 41.0, NULL, 'Estimated', NULL, 'Annual average through Q3 2024')
ON CONFLICT (year, quarter, month) DO UPDATE SET
  renewable_percentage = EXCLUDED.renewable_percentage,
  non_renewable_percentage = EXCLUDED.non_renewable_percentage,
  carbon_intensity = EXCLUDED.carbon_intensity,
  data_source = EXCLUDED.data_source,
  source_url = EXCLUDED.source_url,
  notes = EXCLUDED.notes,
  updated_at = NOW();
