-- Migration: Add Compliance Columns for Dual Reporting and Energy Classification
-- Date: 2025-01-05
-- Purpose: Support GHG Protocol, GRI 302, CSRD/ESRS E1, TCFD, IFRS S2 compliance

-- ============================================================================
-- PART 1: Add Dual Reporting Columns to metrics_data
-- ============================================================================

-- Add location-based emissions (required by GHG Protocol, ESRS E1, IFRS S2)
ALTER TABLE metrics_data
ADD COLUMN IF NOT EXISTS emissions_location_based DECIMAL(15,3);

-- Add market-based emissions (required by GHG Protocol, ESRS E1, IFRS S2)
ALTER TABLE metrics_data
ADD COLUMN IF NOT EXISTS emissions_market_based DECIMAL(15,3);

-- Add grid region for location-based calculations
ALTER TABLE metrics_data
ADD COLUMN IF NOT EXISTS grid_region VARCHAR(100);

-- Add emission factor sources for transparency
ALTER TABLE metrics_data
ADD COLUMN IF NOT EXISTS emission_factor_source VARCHAR(255);

-- Add data quality indicator (required by ESRS E1)
ALTER TABLE metrics_data
ADD COLUMN IF NOT EXISTS data_quality VARCHAR(50);

-- Add comments to new metrics_data columns
COMMENT ON COLUMN metrics_data.emissions_location_based IS
'Location-based Scope 2 emissions (tCO2e) - uses grid average emission factor';

COMMENT ON COLUMN metrics_data.emissions_market_based IS
'Market-based Scope 2 emissions (tCO2e) - reflects contractual instruments (RECs, PPAs)';

COMMENT ON COLUMN metrics_data.grid_region IS
'Grid region/subregion for location-based emission factor (e.g., ERCOT, CAISO, Portugal)';

COMMENT ON COLUMN metrics_data.emission_factor_source IS
'Source of emission factor (e.g., IEA 2023, EPA eGRID 2022, Supplier-specific)';

COMMENT ON COLUMN metrics_data.data_quality IS
'Data quality level: measured, calculated, estimated, industry_average';

-- ============================================================================
-- PART 2: Add Energy Classification Columns to metrics_catalog
-- ============================================================================

-- Add energy source type for renewable/fossil/nuclear classification (GRI 302-1, ESRS E1-5)
ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS energy_source_type VARCHAR(50);

-- Add specific fuel source (GRI 302-1, ESRS E1-5)
ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS fuel_source VARCHAR(100);

-- Add energy type for GRI 302-1 breakdown
ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS energy_type VARCHAR(50);

-- Add generation type for self-generated vs purchased (ESRS E1-5)
ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS generation_type VARCHAR(50);

-- Add renewable flag for quick filtering
ALTER TABLE metrics_catalog
ADD COLUMN IF NOT EXISTS is_renewable BOOLEAN DEFAULT FALSE;

-- Add comments to new metrics_catalog columns
COMMENT ON COLUMN metrics_catalog.energy_source_type IS
'Energy source classification: fossil, nuclear, renewable';

COMMENT ON COLUMN metrics_catalog.fuel_source IS
'Specific fuel/energy source: solar, wind, hydro, biomass, natural_gas, coal, oil, diesel, nuclear';

COMMENT ON COLUMN metrics_catalog.energy_type IS
'Energy type: electricity, heating, cooling, steam, fuel';

COMMENT ON COLUMN metrics_catalog.generation_type IS
'Generation type: self_generated, purchased, grid';

COMMENT ON COLUMN metrics_catalog.is_renewable IS
'Quick flag: true if energy source is renewable';

-- ============================================================================
-- PART 3: Create Indexes for Performance
-- ============================================================================

-- Index for dual reporting queries
CREATE INDEX IF NOT EXISTS idx_metrics_data_scope2_method
ON metrics_data(scope2_method)
WHERE scope2_method IS NOT NULL;

-- Index for grid region queries
CREATE INDEX IF NOT EXISTS idx_metrics_data_grid_region
ON metrics_data(grid_region)
WHERE grid_region IS NOT NULL;

-- Index for energy source type
CREATE INDEX IF NOT EXISTS idx_metrics_catalog_energy_source_type
ON metrics_catalog(energy_source_type)
WHERE energy_source_type IS NOT NULL;

-- Index for renewable energy queries
CREATE INDEX IF NOT EXISTS idx_metrics_catalog_is_renewable
ON metrics_catalog(is_renewable)
WHERE is_renewable = TRUE;

-- ============================================================================
-- PART 4: Add Comments to Existing Columns for Documentation
-- ============================================================================

-- Add comments to metrics_data columns
COMMENT ON COLUMN metrics_data.scope2_method IS
'Scope 2 calculation method: location_based or market_based (GHG Protocol dual reporting requirement)';

COMMENT ON COLUMN metrics_data.co2e_emissions IS
'Total CO2 equivalent emissions in kgCO2e (convert to tCO2e by dividing by 1000)';

-- Add comments to compliance tables (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ghg_inventory_settings') THEN
    EXECUTE 'COMMENT ON TABLE ghg_inventory_settings IS ''GHG Protocol inventory settings: organizational boundaries, consolidation approach, base year''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'esrs_e1_disclosures') THEN
    EXECUTE 'COMMENT ON TABLE esrs_e1_disclosures IS ''ESRS E1 Climate Change qualitative disclosures: transition plan, policies, actions, financial effects''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sustainability_targets') THEN
    EXECUTE 'COMMENT ON TABLE sustainability_targets IS ''Sustainability targets and goals: GHG reduction, renewable energy, energy efficiency (GRI 302-4, ESRS E1-4, TCFD)''';
  END IF;
END $$;

-- ============================================================================
-- PART 5: Verification Queries
-- ============================================================================

-- Verify columns were added to metrics_data
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metrics_data'
    AND column_name = 'emissions_location_based'
  ) THEN
    RAISE NOTICE '✅ emissions_location_based added to metrics_data';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metrics_data'
    AND column_name = 'emissions_market_based'
  ) THEN
    RAISE NOTICE '✅ emissions_market_based added to metrics_data';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metrics_data'
    AND column_name = 'grid_region'
  ) THEN
    RAISE NOTICE '✅ grid_region added to metrics_data';
  END IF;
END $$;

-- Verify columns were added to metrics_catalog
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metrics_catalog'
    AND column_name = 'energy_source_type'
  ) THEN
    RAISE NOTICE '✅ energy_source_type added to metrics_catalog';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metrics_catalog'
    AND column_name = 'fuel_source'
  ) THEN
    RAISE NOTICE '✅ fuel_source added to metrics_catalog';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'metrics_catalog'
    AND column_name = 'energy_type'
  ) THEN
    RAISE NOTICE '✅ energy_type added to metrics_catalog';
  END IF;
END $$;

-- Show summary
SELECT
  'Migration Complete' as status,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'metrics_data'
   AND column_name IN ('emissions_location_based', 'emissions_market_based', 'grid_region', 'emission_factor_source', 'data_quality')) as metrics_data_new_columns,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = 'metrics_catalog'
   AND column_name IN ('energy_source_type', 'fuel_source', 'energy_type', 'generation_type', 'is_renewable')) as metrics_catalog_new_columns;
