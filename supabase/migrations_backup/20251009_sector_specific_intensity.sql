-- Add sector-specific fields to organizations table for comprehensive intensity metrics
-- This enables compliance with SBTi sector-specific pathways and GRI 305-4 production-based metrics

-- Add industry sector and production tracking fields
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS industry_sector TEXT,
ADD COLUMN IF NOT EXISTS sector_category TEXT,
ADD COLUMN IF NOT EXISTS annual_production_volume DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS production_unit TEXT,
ADD COLUMN IF NOT EXISTS value_added DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS annual_operating_hours INTEGER,
ADD COLUMN IF NOT EXISTS annual_customers INTEGER;

-- Create enum-like constraint for industry sectors (aligned with GRI sector standards)
COMMENT ON COLUMN organizations.industry_sector IS 'Primary industry sector (e.g., Oil and Gas, Coal, Agriculture, Food and Beverage, etc.)';
COMMENT ON COLUMN organizations.sector_category IS 'Sector category for intensity metrics (manufacturing, services, energy, transportation, buildings, agriculture, etc.)';
COMMENT ON COLUMN organizations.annual_production_volume IS 'Annual production volume in the specified unit';
COMMENT ON COLUMN organizations.production_unit IS 'Unit of production (ton, MWh, passenger-km, room-night, etc.)';
COMMENT ON COLUMN organizations.value_added IS 'Economic value added (for GEVA calculation) in base currency';
COMMENT ON COLUMN organizations.annual_operating_hours IS 'Total annual operating hours across all facilities';
COMMENT ON COLUMN organizations.annual_customers IS 'Total annual customers served';

-- Add index for sector queries
CREATE INDEX IF NOT EXISTS idx_organizations_sector ON organizations(industry_sector);
CREATE INDEX IF NOT EXISTS idx_organizations_sector_category ON organizations(sector_category);

-- Insert sector reference data table for GRI 11-17 sector standards mapping
CREATE TABLE IF NOT EXISTS industry_sectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_name TEXT NOT NULL UNIQUE,
  sector_category TEXT NOT NULL,
  gri_standard TEXT, -- GRI 11, GRI 12, etc.
  sbti_pathway TEXT, -- SDA pathway name if available
  default_production_unit TEXT,
  intensity_denominator_options TEXT[], -- Array of valid intensity denominators
  benchmark_intensity_low DECIMAL(10, 4), -- Best in class
  benchmark_intensity_avg DECIMAL(10, 4), -- Industry average
  benchmark_intensity_high DECIMAL(10, 4), -- Below average
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Populate industry sectors with GRI sector standards and common intensity denominators
INSERT INTO industry_sectors (sector_name, sector_category, gri_standard, default_production_unit, intensity_denominator_options, benchmark_intensity_low, benchmark_intensity_avg, benchmark_intensity_high) VALUES
-- GRI 11: Oil and Gas
('Oil and Gas', 'energy', 'GRI 11', 'boe', ARRAY['boe', 'MWh', 'ton'], 15.0, 25.0, 40.0),

-- GRI 12: Coal
('Coal', 'energy', 'GRI 12', 'ton', ARRAY['ton', 'MWh'], 80.0, 120.0, 180.0),

-- GRI 13: Agriculture, Aquaculture and Fishing
('Agriculture', 'agriculture', 'GRI 13', 'ton', ARRAY['ton', 'hectare'], 0.5, 1.2, 2.5),
('Aquaculture', 'agriculture', 'GRI 13', 'ton', ARRAY['ton'], 1.0, 2.5, 4.0),
('Fishing', 'agriculture', 'GRI 13', 'ton', ARRAY['ton', 'vessel-day'], 2.0, 4.0, 7.0),

-- GRI 14: Mining
('Mining', 'manufacturing', 'GRI 14', 'ton', ARRAY['ton', 'tonne-ore'], 5.0, 12.0, 25.0),

-- Manufacturing sectors
('Food and Beverage', 'manufacturing', NULL, 'ton', ARRAY['ton', 'liter', 'unit'], 0.3, 0.8, 1.5),
('Textiles and Apparel', 'manufacturing', NULL, 'ton', ARRAY['ton', 'unit'], 2.0, 5.0, 10.0),
('Chemicals', 'manufacturing', NULL, 'ton', ARRAY['ton'], 1.5, 3.5, 7.0),
('Pharmaceuticals', 'manufacturing', NULL, 'ton', ARRAY['ton', 'unit'], 0.8, 2.0, 4.0),
('Automotive', 'manufacturing', NULL, 'vehicle', ARRAY['vehicle', 'ton'], 1.5, 3.0, 5.0),
('Electronics', 'manufacturing', NULL, 'unit', ARRAY['unit', 'ton'], 0.02, 0.05, 0.15),
('Construction Materials', 'manufacturing', NULL, 'ton', ARRAY['ton'], 0.4, 0.9, 1.8),

-- Energy & Utilities
('Electric Utilities', 'energy', NULL, 'MWh', ARRAY['MWh'], 0.2, 0.5, 0.8),
('Renewable Energy', 'energy', NULL, 'MWh', ARRAY['MWh'], 0.01, 0.02, 0.05),
('Water Utilities', 'services', NULL, 'm3', ARRAY['m3'], 0.1, 0.3, 0.6),
('Waste Management', 'services', NULL, 'ton', ARRAY['ton'], 0.05, 0.15, 0.35),

-- Transportation
('Airlines', 'transportation', NULL, 'passenger-km', ARRAY['passenger-km', 'ton-km'], 0.08, 0.12, 0.18),
('Maritime Shipping', 'transportation', NULL, 'ton-km', ARRAY['ton-km'], 0.01, 0.02, 0.04),
('Rail Transport', 'transportation', NULL, 'passenger-km', ARRAY['passenger-km', 'ton-km'], 0.02, 0.04, 0.08),
('Road Freight', 'transportation', NULL, 'ton-km', ARRAY['ton-km'], 0.05, 0.10, 0.20),
('Logistics', 'transportation', NULL, 'shipment', ARRAY['shipment', 'ton-km'], 5.0, 12.0, 25.0),

-- Buildings & Real Estate
('Commercial Real Estate', 'buildings', NULL, 'm2', ARRAY['m2', 'building'], 30.0, 60.0, 100.0),
('Residential Real Estate', 'buildings', NULL, 'm2', ARRAY['m2', 'unit'], 20.0, 40.0, 70.0),
('Hotels and Hospitality', 'services', NULL, 'room-night', ARRAY['room-night', 'm2'], 15.0, 30.0, 50.0),

-- Services
('Financial Services', 'services', NULL, 'FTE', ARRAY['FTE', 'revenue'], 2.0, 5.0, 10.0),
('Technology and Software', 'services', NULL, 'FTE', ARRAY['FTE', 'revenue', 'user'], 1.0, 3.0, 6.0),
('Healthcare', 'services', NULL, 'bed', ARRAY['bed', 'patient', 'm2'], 3.0, 8.0, 15.0),
('Education', 'services', NULL, 'student', ARRAY['student', 'm2'], 0.3, 0.8, 1.5),
('Retail', 'services', NULL, 'm2', ARRAY['m2', 'revenue'], 40.0, 80.0, 150.0),
('Professional Services', 'services', NULL, 'FTE', ARRAY['FTE', 'revenue'], 1.5, 4.0, 8.0),

-- Other
('Telecommunications', 'services', NULL, 'subscriber', ARRAY['subscriber', 'data-TB'], 0.05, 0.15, 0.30),
('Media and Entertainment', 'services', NULL, 'subscriber', ARRAY['subscriber', 'revenue'], 0.1, 0.3, 0.6)
ON CONFLICT (sector_name) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE industry_sectors IS 'Reference table mapping industry sectors to GRI standards, SBTi pathways, and intensity metrics';
COMMENT ON COLUMN industry_sectors.intensity_denominator_options IS 'Valid production-based denominators for this sector (e.g., ton, MWh, passenger-km)';
COMMENT ON COLUMN industry_sectors.benchmark_intensity_low IS 'Best-in-class emissions intensity (tCO2e per unit)';
COMMENT ON COLUMN industry_sectors.benchmark_intensity_avg IS 'Industry average emissions intensity (tCO2e per unit)';
COMMENT ON COLUMN industry_sectors.benchmark_intensity_high IS 'Below-average emissions intensity (tCO2e per unit)';
