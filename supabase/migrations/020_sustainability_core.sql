-- Blipee OS: Core Sustainability Platform Schema
-- This migration adds the core sustainability tables that work for ANY organization
-- Building management becomes just one optional module

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE SUSTAINABILITY TABLES (Always Present)
-- =====================================================

-- Master emissions table (source-agnostic)
CREATE TABLE IF NOT EXISTS emissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    emission_date DATE NOT NULL,
    
    -- Flexible source tracking
    source_type VARCHAR(50) NOT NULL, -- 'building', 'vehicle', 'travel', 'supply_chain', 'process', etc.
    source_id UUID, -- References the specific source (building_id, vehicle_id, etc.)
    source_details JSONB DEFAULT '{}', -- Additional source metadata
    module_id VARCHAR(50), -- Which module generated this emission
    
    -- Emission categorization
    scope INTEGER NOT NULL CHECK (scope IN (1, 2, 3)),
    category VARCHAR(100), -- 'electricity', 'natural_gas', 'fuel_combustion', 'purchased_goods', etc.
    subcategory VARCHAR(100), -- More detailed categorization
    
    -- Activity data
    activity_data DECIMAL(12,4) NOT NULL,
    activity_unit VARCHAR(50) NOT NULL, -- 'kWh', 'liters', 'kg', 'km', etc.
    
    -- Emission calculation
    emission_factor DECIMAL(10,6) NOT NULL,
    emission_factor_source VARCHAR(100), -- 'EPA', 'DEFRA', 'IEA', etc.
    emissions_amount DECIMAL(12,4) NOT NULL,
    emissions_unit VARCHAR(20) DEFAULT 'kgCO2e',
    
    -- Data quality and verification
    data_quality VARCHAR(20) CHECK (data_quality IN ('measured', 'calculated', 'estimated')),
    data_source VARCHAR(50), -- 'manual', 'api', 'iot', 'invoice', 'ai_extracted'
    confidence_score DECIMAL(3,2) DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    verified BOOLEAN DEFAULT false,
    verified_by UUID REFERENCES auth.users(id),
    verified_at TIMESTAMPTZ,
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Universal sustainability targets
CREATE TABLE IF NOT EXISTS sustainability_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Target definition
    target_name VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'absolute', 'intensity', 'net_zero', 'carbon_neutral', 'renewable'
    target_category VARCHAR(50), -- 'emissions', 'energy', 'water', 'waste', 'custom'
    
    -- Scope coverage
    scope_coverage INTEGER[], -- [1], [1,2], [1,2,3]
    module_coverage VARCHAR(50)[], -- ['buildings', 'fleet', 'supply_chain']
    included_categories VARCHAR(100)[], -- Specific emission categories included
    
    -- Target values
    baseline_year INTEGER NOT NULL,
    baseline_value DECIMAL(12,2) NOT NULL,
    baseline_unit VARCHAR(50) NOT NULL,
    target_year INTEGER NOT NULL,
    target_value DECIMAL(12,2) NOT NULL,
    target_unit VARCHAR(50) NOT NULL,
    
    -- Framework alignment
    framework VARCHAR(50), -- 'SBTi', 'RE100', 'EP100', 'custom'
    framework_criteria JSONB DEFAULT '{}', -- Framework-specific requirements
    validation_status VARCHAR(50), -- 'pending', 'validated', 'approved'
    public_commitment BOOLEAN DEFAULT false,
    commitment_date DATE,
    
    -- Progress tracking
    current_value DECIMAL(12,2),
    last_updated DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'draft', 'active', 'achieved', 'revised', 'retired'
    
    -- Metadata
    description TEXT,
    methodology TEXT,
    assumptions JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESG metrics tracking (beyond just emissions)
CREATE TABLE IF NOT EXISTS esg_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    
    -- ESG categorization
    pillar CHAR(1) NOT NULL CHECK (pillar IN ('E', 'S', 'G')),
    category VARCHAR(100) NOT NULL, -- 'emissions', 'energy', 'water', 'diversity', 'safety', 'ethics'
    metric_name VARCHAR(200) NOT NULL,
    
    -- Metric value
    metric_value DECIMAL(12,4) NOT NULL,
    metric_unit VARCHAR(50) NOT NULL,
    
    -- Benchmarking and context
    industry_average DECIMAL(12,4),
    best_in_class DECIMAL(12,4),
    year_over_year_change DECIMAL(5,2), -- Percentage
    
    -- Framework mapping
    framework VARCHAR(50), -- 'GRI', 'SASB', 'TCFD', 'CDP'
    framework_indicator VARCHAR(50), -- 'GRI 305-1', 'SASB EM-CM-110a.1'
    
    -- Verification
    verification_status VARCHAR(20) DEFAULT 'unverified',
    verification_date DATE,
    verifier_name VARCHAR(200),
    
    -- Metadata
    calculation_methodology TEXT,
    data_sources TEXT[],
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compliance and reporting activities
CREATE TABLE IF NOT EXISTS compliance_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_name VARCHAR(255) NOT NULL,
    activity_type VARCHAR(50) NOT NULL, -- 'report', 'audit', 'certification', 'disclosure', 'assessment'
    framework VARCHAR(50) NOT NULL, -- 'CSRD', 'TCFD', 'SEC', 'SFDR', 'CDP', 'GRI'
    reporting_period_start DATE,
    reporting_period_end DATE,
    
    -- Timeline
    due_date DATE,
    submission_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_progress', 'submitted', 'approved', 'overdue'
    
    -- Progress tracking
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    data_completeness JSONB DEFAULT '{}', -- Track which data is complete/missing
    
    -- Documents and evidence
    documents JSONB DEFAULT '[]', -- Array of document references
    submission_url TEXT,
    
    -- Results
    score VARCHAR(10), -- 'A', 'B', 'C', etc. for CDP
    feedback TEXT,
    improvement_areas JSONB DEFAULT '[]',
    
    -- Metadata
    assigned_to UUID[] DEFAULT '{}', -- Array of user IDs
    tags TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Module registry - track which modules each org has enabled
CREATE TABLE IF NOT EXISTS enabled_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    module_id VARCHAR(50) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    
    -- Module status
    enabled BOOLEAN DEFAULT true,
    activated_at TIMESTAMPTZ DEFAULT NOW(),
    deactivated_at TIMESTAMPTZ,
    
    -- Configuration
    configuration JSONB DEFAULT '{}', -- Module-specific settings
    permissions JSONB DEFAULT '{}', -- Who can access this module
    
    -- Usage tracking
    last_accessed TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    
    UNIQUE(organization_id, module_id)
);

-- Carbon offsets and removals tracking
CREATE TABLE IF NOT EXISTS carbon_offsets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Offset details
    offset_type VARCHAR(50) NOT NULL, -- 'offset', 'removal', 'inset'
    project_type VARCHAR(100) NOT NULL, -- 'reforestation', 'renewable_energy', 'direct_air_capture', etc.
    project_name VARCHAR(255),
    project_location VARCHAR(255),
    provider VARCHAR(200),
    
    -- Quantities and vintage
    quantity DECIMAL(12,2) NOT NULL,
    unit VARCHAR(20) DEFAULT 'tCO2e',
    vintage_year INTEGER NOT NULL,
    
    -- Certification and retirement
    standard VARCHAR(50), -- 'Verra', 'Gold Standard', 'ACR', 'CAR'
    certificate_id VARCHAR(200) UNIQUE,
    retirement_date DATE,
    retirement_reason VARCHAR(255),
    
    -- Financial
    price_per_unit DECIMAL(10,2),
    total_cost DECIMAL(12,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    
    -- Verification
    verified BOOLEAN DEFAULT false,
    verification_documents JSONB DEFAULT '[]',
    
    -- Metadata
    notes TEXT,
    tags TEXT[],
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Global emission factors database
CREATE TABLE IF NOT EXISTS emission_factors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Factor identification
    factor_type VARCHAR(50) NOT NULL, -- 'electricity', 'fuel', 'material', 'transport', 'waste'
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    subcategory VARCHAR(100),
    
    -- Location specificity
    country_code VARCHAR(2), -- ISO country code
    region VARCHAR(100), -- State, province, or grid region
    city VARCHAR(100),
    
    -- Factor value
    factor_value DECIMAL(10,6) NOT NULL,
    factor_unit VARCHAR(50) NOT NULL, -- 'kgCO2e/kWh', 'kgCO2e/liter', etc.
    
    -- Scope classification
    applicable_scope INTEGER,
    includes_upstream BOOLEAN DEFAULT false,
    includes_downstream BOOLEAN DEFAULT false,
    
    -- Source and validity
    source VARCHAR(200) NOT NULL, -- 'EPA', 'DEFRA', 'IEA', etc.
    source_year INTEGER NOT NULL,
    valid_from DATE,
    valid_until DATE,
    
    -- Additional metadata
    methodology TEXT,
    uncertainty_range DECIMAL(5,2), -- Percentage
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Emissions indexes
CREATE INDEX idx_emissions_org_date ON emissions(organization_id, emission_date DESC);
CREATE INDEX idx_emissions_scope ON emissions(organization_id, scope);
CREATE INDEX idx_emissions_source ON emissions(organization_id, source_type, source_id);
CREATE INDEX idx_emissions_module ON emissions(organization_id, module_id);
CREATE INDEX idx_emissions_category ON emissions(organization_id, category);

-- Targets indexes
CREATE INDEX idx_targets_org ON sustainability_targets(organization_id);
CREATE INDEX idx_targets_status ON sustainability_targets(organization_id, status);
CREATE INDEX idx_targets_year ON sustainability_targets(organization_id, target_year);

-- ESG metrics indexes
CREATE INDEX idx_esg_org_date ON esg_metrics(organization_id, metric_date DESC);
CREATE INDEX idx_esg_pillar ON esg_metrics(organization_id, pillar);
CREATE INDEX idx_esg_framework ON esg_metrics(organization_id, framework);

-- Compliance indexes
CREATE INDEX idx_compliance_org ON compliance_activities(organization_id);
CREATE INDEX idx_compliance_due ON compliance_activities(organization_id, due_date);
CREATE INDEX idx_compliance_status ON compliance_activities(organization_id, status);

-- Emission factors indexes
CREATE INDEX idx_factors_type ON emission_factors(factor_type);
CREATE INDEX idx_factors_location ON emission_factors(country_code, region);
CREATE INDEX idx_factors_validity ON emission_factors(valid_from, valid_until);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sustainability_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE esg_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE enabled_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_offsets ENABLE ROW LEVEL SECURITY;

-- Emissions policies
CREATE POLICY "Users can view their organization's emissions"
    ON emissions FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can insert emissions for their organization"
    ON emissions FOR INSERT
    WITH CHECK (organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager', 'analyst')
    ));

-- Similar policies for other tables
CREATE POLICY "Users can view their organization's targets"
    ON sustainability_targets FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
    ));

CREATE POLICY "Users can manage targets for their organization"
    ON sustainability_targets FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM organization_members 
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin', 'manager')
    ));

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate total emissions for an organization
CREATE OR REPLACE FUNCTION calculate_total_emissions(
    org_id UUID,
    start_date DATE,
    end_date DATE,
    scopes INTEGER[] DEFAULT ARRAY[1,2,3]
)
RETURNS TABLE (
    scope INTEGER,
    total_emissions DECIMAL,
    emission_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.scope,
        SUM(e.emissions_amount)::DECIMAL as total_emissions,
        COUNT(*)::INTEGER as emission_count
    FROM emissions e
    WHERE e.organization_id = org_id
        AND e.emission_date BETWEEN start_date AND end_date
        AND e.scope = ANY(scopes)
    GROUP BY e.scope
    ORDER BY e.scope;
END;
$$ LANGUAGE plpgsql;

-- Function to get emission trends
CREATE OR REPLACE FUNCTION get_emission_trends(
    org_id UUID,
    period VARCHAR DEFAULT 'monthly',
    lookback_months INTEGER DEFAULT 12
)
RETURNS TABLE (
    period_date DATE,
    scope_1 DECIMAL,
    scope_2 DECIMAL,
    scope_3 DECIMAL,
    total DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE_TRUNC(period, emission_date)::DATE as period_date,
        SUM(CASE WHEN scope = 1 THEN emissions_amount ELSE 0 END)::DECIMAL as scope_1,
        SUM(CASE WHEN scope = 2 THEN emissions_amount ELSE 0 END)::DECIMAL as scope_2,
        SUM(CASE WHEN scope = 3 THEN emissions_amount ELSE 0 END)::DECIMAL as scope_3,
        SUM(emissions_amount)::DECIMAL as total
    FROM emissions
    WHERE organization_id = org_id
        AND emission_date >= CURRENT_DATE - INTERVAL '1 month' * lookback_months
    GROUP BY DATE_TRUNC(period, emission_date)
    ORDER BY period_date;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to all tables
CREATE TRIGGER update_emissions_updated_at BEFORE UPDATE ON emissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
CREATE TRIGGER update_targets_updated_at BEFORE UPDATE ON sustainability_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    
CREATE TRIGGER update_esg_updated_at BEFORE UPDATE ON esg_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SAMPLE EMISSION FACTORS (Global defaults)
-- =====================================================

INSERT INTO emission_factors (factor_type, name, category, factor_value, factor_unit, source, source_year) VALUES
-- Electricity factors (sample countries)
('electricity', 'Grid Electricity - United States', 'energy', 0.433, 'kgCO2e/kWh', 'EPA eGRID', 2023),
('electricity', 'Grid Electricity - Portugal', 'energy', 0.195, 'kgCO2e/kWh', 'IEA', 2023),
('electricity', 'Grid Electricity - Germany', 'energy', 0.366, 'kgCO2e/kWh', 'IEA', 2023),
('electricity', 'Grid Electricity - France', 'energy', 0.051, 'kgCO2e/kWh', 'IEA', 2023),

-- Fuel factors
('fuel', 'Natural Gas', 'stationary_combustion', 2.02, 'kgCO2e/m3', 'EPA', 2023),
('fuel', 'Diesel', 'mobile_combustion', 2.68, 'kgCO2e/liter', 'DEFRA', 2023),
('fuel', 'Gasoline', 'mobile_combustion', 2.31, 'kgCO2e/liter', 'DEFRA', 2023),

-- Transport factors
('transport', 'Air Travel - Short Haul', 'business_travel', 0.255, 'kgCO2e/passenger-km', 'DEFRA', 2023),
('transport', 'Air Travel - Long Haul', 'business_travel', 0.147, 'kgCO2e/passenger-km', 'DEFRA', 2023),
('transport', 'Rail Travel', 'business_travel', 0.041, 'kgCO2e/passenger-km', 'DEFRA', 2023),
('transport', 'Car Travel - Average', 'business_travel', 0.171, 'kgCO2e/km', 'DEFRA', 2023)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE emissions IS 'Core emissions tracking table - records all GHG emissions from any source';
COMMENT ON TABLE sustainability_targets IS 'Sustainability targets and goals with progress tracking';
COMMENT ON TABLE esg_metrics IS 'Environmental, Social, and Governance metrics beyond just emissions';
COMMENT ON TABLE compliance_activities IS 'Track compliance reporting and certification activities';
COMMENT ON TABLE enabled_modules IS 'Track which sustainability modules each organization has enabled';
COMMENT ON TABLE carbon_offsets IS 'Carbon offset and removal credit tracking';
COMMENT ON TABLE emission_factors IS 'Global database of emission factors for calculations';