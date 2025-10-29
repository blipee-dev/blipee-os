-- Migration: GRI 301, 304, 307, 308 Support (Fixed)
-- Description: Add tables and data structures for Materials, Biodiversity, Compliance, and Supplier Assessment
-- This version handles existing tables by dropping and recreating them
-- Safe to run multiple times (idempotent)

-- =====================================================
-- GRI 307: Environmental Compliance
-- =====================================================

-- Drop existing table if it exists to ensure clean schema
DROP TABLE IF EXISTS environmental_incidents CASCADE;

CREATE TABLE environmental_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,

  -- Incident details
  incident_date DATE NOT NULL,
  incident_type VARCHAR(100) NOT NULL,
  severity VARCHAR(50),

  -- Financial impact
  fine_amount DECIMAL(15, 2),
  currency VARCHAR(3) DEFAULT 'EUR',

  -- Regulatory details
  regulation_violated TEXT,
  regulatory_body VARCHAR(255),

  -- Status and resolution
  status VARCHAR(50) NOT NULL DEFAULT 'open',
  resolution_date DATE,
  resolution_description TEXT,
  corrective_actions TEXT,

  -- Documentation
  incident_description TEXT NOT NULL,
  environmental_impact TEXT,
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  CONSTRAINT valid_incident_type CHECK (incident_type IN ('fine', 'sanction', 'violation', 'dispute', 'warning', 'notice')),
  CONSTRAINT valid_severity CHECK (severity IN ('minor', 'moderate', 'significant', 'major')),
  CONSTRAINT valid_status CHECK (status IN ('open', 'under_review', 'resolved', 'appealed', 'dismissed'))
);

-- Indexes for environmental_incidents
CREATE INDEX idx_env_incidents_org ON environmental_incidents(organization_id);
CREATE INDEX idx_env_incidents_date ON environmental_incidents(incident_date);
CREATE INDEX idx_env_incidents_type ON environmental_incidents(incident_type);

-- RLS for environmental_incidents
ALTER TABLE environmental_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view incidents in their organization"
  ON environmental_incidents FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can insert incidents"
  ON environmental_incidents FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

CREATE POLICY "Managers can update incidents"
  ON environmental_incidents FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

-- =====================================================
-- GRI 308: Supplier Environmental Assessment
-- =====================================================

-- Drop existing table if it exists (it has wrong schema)
DROP TABLE IF EXISTS suppliers CASCADE;

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Supplier details
  supplier_name VARCHAR(255) NOT NULL,
  supplier_code VARCHAR(100),
  country VARCHAR(100),
  industry_sector VARCHAR(100),

  -- Screening status
  environmental_screening_completed BOOLEAN DEFAULT FALSE,
  screening_date DATE,
  screening_criteria TEXT[],

  -- Assessment results
  environmental_assessment_completed BOOLEAN DEFAULT FALSE,
  assessment_date DATE,
  assessment_score DECIMAL(5, 2),

  -- Impact identification
  negative_impacts_identified BOOLEAN DEFAULT FALSE,
  impacts_description TEXT,
  risk_level VARCHAR(50),

  -- Improvement tracking
  improvement_plan_agreed BOOLEAN DEFAULT FALSE,
  improvement_plan_description TEXT,
  improvement_deadline DATE,
  improvements_implemented BOOLEAN DEFAULT FALSE,
  implementation_date DATE,

  -- Certification & compliance
  iso14001_certified BOOLEAN DEFAULT FALSE,
  other_certifications TEXT[],

  -- Business relationship
  supplier_status VARCHAR(50) DEFAULT 'active',
  first_contract_date DATE,
  last_contract_date DATE,
  annual_spend DECIMAL(15, 2),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_risk_level CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_supplier_status CHECK (supplier_status IN ('active', 'suspended', 'terminated', 'under_review', 'prospect'))
);

-- Indexes for suppliers
CREATE INDEX idx_suppliers_org ON suppliers(organization_id);
CREATE INDEX idx_suppliers_screening ON suppliers(environmental_screening_completed);
CREATE INDEX idx_suppliers_assessment ON suppliers(environmental_assessment_completed);
CREATE INDEX idx_suppliers_status ON suppliers(supplier_status);

-- RLS for suppliers
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suppliers in their organization"
  ON suppliers FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage suppliers"
  ON suppliers FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager', 'analyst')
    )
  );

-- =====================================================
-- GRI 304: Biodiversity
-- =====================================================

-- Drop existing table if it exists to ensure clean schema
DROP TABLE IF EXISTS biodiversity_sites CASCADE;

CREATE TABLE biodiversity_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,

  -- Location details
  site_name VARCHAR(255) NOT NULL,
  location_description TEXT,
  total_area_hectares DECIMAL(12, 4),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),

  -- Protected area status
  in_protected_area BOOLEAN DEFAULT FALSE,
  adjacent_to_protected_area BOOLEAN DEFAULT FALSE,
  protected_area_name VARCHAR(255),
  protected_area_type VARCHAR(100),

  -- Biodiversity value
  biodiversity_value VARCHAR(50),
  habitats_present TEXT[],
  species_richness_level VARCHAR(50),

  -- IUCN Red List species
  iucn_species_present BOOLEAN DEFAULT FALSE,
  iucn_species_count INTEGER DEFAULT 0,
  iucn_species_list JSONB,

  -- Operational impacts
  operational_impact_level VARCHAR(50),
  impacts_description TEXT,

  -- Conservation measures
  habitat_protected_hectares DECIMAL(12, 4) DEFAULT 0,
  habitat_restored_hectares DECIMAL(12, 4) DEFAULT 0,
  conservation_measures TEXT,
  monitoring_program_in_place BOOLEAN DEFAULT FALSE,

  -- Reporting period
  assessment_date DATE,
  reporting_year INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_biodiversity_value CHECK (biodiversity_value IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_impact_level CHECK (operational_impact_level IN ('none', 'low', 'medium', 'high', 'severe'))
);

-- Indexes for biodiversity_sites
CREATE INDEX idx_biodiversity_sites_org ON biodiversity_sites(organization_id);
CREATE INDEX idx_biodiversity_sites_protected ON biodiversity_sites(in_protected_area);
CREATE INDEX idx_biodiversity_sites_iucn ON biodiversity_sites(iucn_species_present);
CREATE INDEX idx_biodiversity_sites_year ON biodiversity_sites(reporting_year);

-- RLS for biodiversity_sites
ALTER TABLE biodiversity_sites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view biodiversity sites in their organization"
  ON biodiversity_sites FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage biodiversity sites"
  ON biodiversity_sites FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
      AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    )
  );

-- =====================================================
-- GRI 301: Materials (Add to metrics_catalog)
-- =====================================================

-- Insert materials metrics into catalog (uses ON CONFLICT to prevent duplicates)
INSERT INTO metrics_catalog (code, name, category, scope, unit, description) VALUES
  -- Raw materials
  ('MAT-001', 'Total Raw Materials Used', 'Raw Materials', 'scope_1', 'tonnes', 'Total weight of all raw materials used'),
  ('MAT-002', 'Non-Renewable Materials', 'Raw Materials', 'scope_1', 'tonnes', 'Metals, minerals, plastics from virgin sources'),
  ('MAT-003', 'Renewable Materials', 'Raw Materials', 'scope_1', 'tonnes', 'Wood, paper, bio-based materials'),
  ('MAT-004', 'Metals Used', 'Raw Materials', 'scope_1', 'tonnes', 'Total metals consumed'),
  ('MAT-005', 'Plastics Used', 'Raw Materials', 'scope_1', 'tonnes', 'Total plastics consumed'),
  ('MAT-006', 'Paper & Cardboard Used', 'Raw Materials', 'scope_1', 'tonnes', 'Total paper products consumed'),
  ('MAT-007', 'Wood Used', 'Raw Materials', 'scope_1', 'tonnes', 'Total wood consumed'),
  ('MAT-008', 'Chemicals Used', 'Raw Materials', 'scope_1', 'tonnes', 'Total chemicals consumed'),

  -- Recycled content
  ('MAT-010', 'Recycled Materials Input', 'Recycled Materials', 'scope_1', 'tonnes', 'Total recycled materials used as input'),
  ('MAT-011', 'Recycled Metals Input', 'Recycled Materials', 'scope_1', 'tonnes', 'Recycled metals used'),
  ('MAT-012', 'Recycled Plastics Input', 'Recycled Materials', 'scope_1', 'tonnes', 'Recycled plastics used'),
  ('MAT-013', 'Recycled Paper Input', 'Recycled Materials', 'scope_1', 'tonnes', 'Recycled paper used'),
  ('MAT-014', 'Recycled Content Percentage', 'Recycled Materials', 'scope_1', '%', 'Percentage of materials that are recycled'),

  -- Packaging materials
  ('MAT-020', 'Total Packaging Materials', 'Packaging Materials', 'scope_1', 'tonnes', 'Total packaging materials used'),
  ('MAT-021', 'Plastic Packaging', 'Packaging Materials', 'scope_1', 'tonnes', 'Plastic packaging materials'),
  ('MAT-022', 'Paper Packaging', 'Packaging Materials', 'scope_1', 'tonnes', 'Paper/cardboard packaging'),
  ('MAT-023', 'Metal Packaging', 'Packaging Materials', 'scope_1', 'tonnes', 'Metal packaging (cans, tins)'),
  ('MAT-024', 'Glass Packaging', 'Packaging Materials', 'scope_1', 'tonnes', 'Glass packaging'),
  ('MAT-025', 'Recycled Packaging Content', 'Packaging Materials', 'scope_1', '%', 'Percentage of packaging that is recycled content'),

  -- Product reclamation
  ('MAT-030', 'Products Reclaimed', 'Product Reclamation', 'scope_1', 'units', 'Number of products reclaimed at end-of-life'),
  ('MAT-031', 'Products Reclaimed Weight', 'Product Reclamation', 'scope_1', 'tonnes', 'Weight of products reclaimed'),
  ('MAT-032', 'Packaging Reclaimed', 'Product Reclamation', 'scope_1', 'tonnes', 'Weight of packaging reclaimed'),
  ('MAT-033', 'Reclamation Rate', 'Product Reclamation', 'scope_1', '%', 'Percentage of products/packaging reclaimed')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to calculate materials metrics
CREATE OR REPLACE FUNCTION calculate_materials_metrics(
  p_organization_id UUID,
  p_year INTEGER
)
RETURNS TABLE (
  total_materials DECIMAL,
  renewable_materials DECIMAL,
  non_renewable_materials DECIMAL,
  recycled_input DECIMAL,
  recycled_percentage DECIMAL,
  total_packaging DECIMAL,
  products_reclaimed DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH materials AS (
    SELECT
      COALESCE(SUM(CASE WHEN mc.category = 'Raw Materials' THEN md.value ELSE 0 END), 0) as total_mat,
      COALESCE(SUM(CASE WHEN mc.name ILIKE '%Renewable%' THEN md.value ELSE 0 END), 0) as renewable,
      COALESCE(SUM(CASE WHEN mc.name ILIKE '%Non-Renewable%' THEN md.value ELSE 0 END), 0) as non_renewable,
      COALESCE(SUM(CASE WHEN mc.category = 'Recycled Materials' AND mc.unit = 'tonnes' THEN md.value ELSE 0 END), 0) as recycled,
      COALESCE(SUM(CASE WHEN mc.category = 'Packaging Materials' AND mc.unit = 'tonnes' THEN md.value ELSE 0 END), 0) as packaging,
      COALESCE(SUM(CASE WHEN mc.category = 'Product Reclamation' AND mc.unit = 'tonnes' THEN md.value ELSE 0 END), 0) as reclaimed
    FROM metrics_data md
    JOIN metrics_catalog mc ON md.metric_id = mc.id
    WHERE md.organization_id = p_organization_id
    AND EXTRACT(YEAR FROM md.period_start) = p_year
  )
  SELECT
    total_mat,
    renewable,
    non_renewable,
    recycled,
    CASE WHEN total_mat > 0 THEN (recycled / total_mat * 100) ELSE 0 END as recycled_pct,
    packaging,
    reclaimed
  FROM materials;
END;
$$ LANGUAGE plpgsql;

-- Update trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_environmental_incidents_updated_at
  BEFORE UPDATE ON environmental_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_biodiversity_sites_updated_at
  BEFORE UPDATE ON biodiversity_sites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON TABLE environmental_incidents IS 'GRI 307: Tracks environmental non-compliance incidents, fines, and sanctions';
COMMENT ON TABLE suppliers IS 'GRI 308: Tracks supplier environmental screening and assessment';
COMMENT ON TABLE biodiversity_sites IS 'GRI 304: Tracks biodiversity impacts and conservation at operational sites';
COMMENT ON FUNCTION calculate_materials_metrics IS 'GRI 301: Calculates materials consumption metrics';
