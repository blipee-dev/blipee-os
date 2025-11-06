-- Create grid_mix_snapshots table
-- Stores hourly snapshots of grid mix data from Electricity Maps API
-- This allows us to build historical data using the /latest endpoint

CREATE TABLE IF NOT EXISTS grid_mix_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone TEXT NOT NULL,
  datetime TIMESTAMPTZ NOT NULL,
  carbon_intensity NUMERIC NOT NULL, -- gCO2e/kWh
  renewable_percentage NUMERIC NOT NULL, -- 0-100
  fossil_free_percentage NUMERIC NOT NULL, -- 0-100
  price_day_ahead NUMERIC, -- EUR/MWh (optional, may not always be available)
  power_breakdown JSONB NOT NULL, -- Full power consumption breakdown
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint to prevent duplicate snapshots
  UNIQUE (zone, datetime)
);

-- Index for fast lookups by zone and datetime
CREATE INDEX idx_grid_mix_snapshots_zone_datetime
  ON grid_mix_snapshots(zone, datetime DESC);

-- Index for time-based queries
CREATE INDEX idx_grid_mix_snapshots_datetime
  ON grid_mix_snapshots(datetime DESC);

-- Index for zone lookups
CREATE INDEX idx_grid_mix_snapshots_zone
  ON grid_mix_snapshots(zone);

-- Add RLS policies
ALTER TABLE grid_mix_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read snapshots
CREATE POLICY "Allow authenticated users to read grid mix snapshots"
  ON grid_mix_snapshots
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can insert (via scripts)
CREATE POLICY "Only service role can insert grid mix snapshots"
  ON grid_mix_snapshots
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE grid_mix_snapshots IS
  'Stores hourly snapshots of grid mix data from Electricity Maps API. ' ||
  'Data includes carbon intensity, renewable percentage, and day-ahead prices. ' ||
  'Captured via scripts/capture-live-grid-mix.ts running on cron schedule.';
