-- Fix Metrics System Emission Factors
-- This migration creates metric_emission_factors table to avoid conflict with existing emission_factors table

-- Create metric_emission_factors table (region and time-specific factors for metrics system)
CREATE TABLE IF NOT EXISTS metric_emission_factors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_code TEXT REFERENCES metrics_catalog(code),
  region TEXT NOT NULL, -- Country or region code
  year INTEGER NOT NULL,
  factor DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL, -- EPA, DEFRA, etc.
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(metric_code, region, year)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_metric_emission_factors_metric ON metric_emission_factors(metric_code);
CREATE INDEX IF NOT EXISTS idx_metric_emission_factors_region ON metric_emission_factors(region);
CREATE INDEX IF NOT EXISTS idx_metric_emission_factors_year ON metric_emission_factors(year);

-- Update the calculate_co2e_emissions function to use the new table name
CREATE OR REPLACE FUNCTION calculate_co2e_emissions()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the emission factor for this metric
  SELECT
    NEW.value * COALESCE(
      -- Try to get region and year specific factor
      (SELECT factor FROM metric_emission_factors
       WHERE metric_code = (SELECT code FROM metrics_catalog WHERE id = NEW.metric_id)
       AND region = COALESCE(
         (SELECT country FROM sites WHERE id = NEW.site_id),
         'GLOBAL'
       )
       AND year = EXTRACT(YEAR FROM NEW.period_start)
       AND is_active = true
       LIMIT 1),
      -- Fall back to catalog default
      (SELECT emission_factor FROM metrics_catalog WHERE id = NEW.metric_id),
      0
    )
  INTO NEW.co2e_emissions;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add performance optimization indexes
-- Indexes for metrics_data
CREATE INDEX IF NOT EXISTS idx_metrics_data_org_period ON metrics_data(organization_id, period_start DESC, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_data_org_metric ON metrics_data(organization_id, metric_id);
CREATE INDEX IF NOT EXISTS idx_metrics_data_org_site ON metrics_data(organization_id, site_id);
CREATE INDEX IF NOT EXISTS idx_metrics_data_verification ON metrics_data(verification_status) WHERE verification_status != 'unverified';

-- Indexes for organization_metrics
CREATE INDEX IF NOT EXISTS idx_org_metrics_active ON organization_metrics(organization_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_org_metrics_required ON organization_metrics(organization_id, is_required) WHERE is_required = true;

-- Indexes for metrics_catalog
CREATE INDEX IF NOT EXISTS idx_metrics_catalog_scope ON metrics_catalog(scope) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_metrics_catalog_code ON metrics_catalog(code) WHERE is_active = true;

-- Add timestamp update trigger for the new table
CREATE TRIGGER update_metric_emission_factors_updated_at BEFORE UPDATE ON metric_emission_factors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample emission factors for common metrics
INSERT INTO metric_emission_factors (metric_code, region, year, factor, unit, source) VALUES
  ('scope2_electricity', 'US', 2024, 0.385, 'kgCO2e/kWh', 'EPA eGRID 2024'),
  ('scope2_electricity', 'EU', 2024, 0.295, 'kgCO2e/kWh', 'European Environment Agency'),
  ('scope2_electricity', 'GLOBAL', 2024, 0.475, 'kgCO2e/kWh', 'IEA Global Average'),
  ('scope1_natural_gas', 'GLOBAL', 2024, 0.182, 'kgCO2e/kWh', 'IPCC 2024'),
  ('scope1_diesel', 'GLOBAL', 2024, 2.68, 'kgCO2e/liter', 'IPCC 2024'),
  ('scope1_gasoline', 'GLOBAL', 2024, 2.31, 'kgCO2e/liter', 'IPCC 2024'),
  ('scope3_business_travel_air', 'GLOBAL', 2024, 0.09, 'kgCO2e/passenger-km', 'DEFRA 2024'),
  ('scope3_employee_commute', 'GLOBAL', 2024, 0.17, 'kgCO2e/passenger-km', 'DEFRA 2024')
ON CONFLICT (metric_code, region, year) DO NOTHING;

-- Add comment explaining the dual emission systems
COMMENT ON TABLE metric_emission_factors IS 'Emission factors for the metrics catalog system. This is separate from the original emission_factors table to avoid conflicts.';
COMMENT ON TABLE emission_factors IS 'Original emission factors table for the emissions tracking system.';