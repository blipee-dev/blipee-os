-- Comprehensive ESG Database Schema
-- Supports: CSRD/ESRS, GRI, GHG Protocol, SBTi, CDP, SASB, TCFD/ISSB, EU Taxonomy, LCA/EPD
-- Version: 1.0

-- =====================================================
-- 1. ORGANIZATIONAL & GOVERNANCE DATA
-- =====================================================

-- Materiality Assessment (CSRD/ESRS 1, GRI 3)
CREATE TABLE materiality_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  assessment_date DATE NOT NULL,
  assessment_type VARCHAR(50) DEFAULT 'double', -- 'double', 'impact', 'financial'
  
  -- Double materiality scores (1-5 scale)
  material_topics JSONB NOT NULL, -- Array of topics with scores
  /* Example structure:
  [{
    "topic": "Climate change",
    "impact_score": 5,
    "financial_score": 4,
    "stakeholder_importance": 5,
    "business_impact": 4,
    "time_horizon": "short",
    "value_chain_stage": ["operations", "upstream"],
    "affected_stakeholders": ["investors", "communities", "employees"]
  }]
  */
  
  -- Stakeholder engagement
  stakeholders_consulted JSONB,
  methodology TEXT,
  external_validation BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ESG Governance Structure (ESRS 2, GRI 2)
CREATE TABLE esg_governance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  reporting_year INTEGER NOT NULL,
  
  -- Board oversight
  board_esg_oversight BOOLEAN DEFAULT false,
  esg_committee_exists BOOLEAN DEFAULT false,
  board_esg_expertise_count INTEGER,
  board_meetings_esg_discussed INTEGER,
  
  -- Management structure
  chief_sustainability_officer BOOLEAN DEFAULT false,
  esg_linked_compensation BOOLEAN DEFAULT false,
  esg_training_board_hours DECIMAL(10,2),
  
  -- Policies
  policies JSONB, -- List of ESG policies with approval dates
  
  UNIQUE(organization_id, reporting_year),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. ENHANCED EMISSIONS & ENVIRONMENTAL DATA
-- =====================================================

-- Enhanced emissions data with all GHGs
ALTER TABLE emissions_data ADD COLUMN IF NOT EXISTS ghg_type VARCHAR(20) DEFAULT 'CO2';
ALTER TABLE emissions_data ADD COLUMN IF NOT EXISTS co2_kg DECIMAL(20,4);
ALTER TABLE emissions_data ADD COLUMN IF NOT EXISTS ch4_kg DECIMAL(20,4);
ALTER TABLE emissions_data ADD COLUMN IF NOT EXISTS n2o_kg DECIMAL(20,4);
ALTER TABLE emissions_data ADD COLUMN IF NOT EXISTS hfc_kg DECIMAL(20,4);
ALTER TABLE emissions_data ADD COLUMN IF NOT EXISTS pfc_kg DECIMAL(20,4);
ALTER TABLE emissions_data ADD COLUMN IF NOT EXISTS sf6_kg DECIMAL(20,4);
ALTER TABLE emissions_data ADD COLUMN IF NOT EXISTS nf3_kg DECIMAL(20,4);
ALTER TABLE emissions_data ADD COLUMN IF NOT EXISTS gwp_version VARCHAR(20) DEFAULT 'AR5';
ALTER TABLE emissions_data ADD COLUMN IF NOT EXISTS location_based_co2e DECIMAL(20,4);
ALTER TABLE emissions_data ADD COLUMN IF NOT EXISTS market_based_co2e DECIMAL(20,4);

-- Pollution Data (ESRS E2, GRI 305-7)
CREATE TABLE pollution_emissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  facility_id UUID REFERENCES buildings(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Air pollutants
  nox_kg DECIMAL(15,2),
  sox_kg DECIMAL(15,2),
  pm10_kg DECIMAL(15,2),
  pm25_kg DECIMAL(15,2),
  voc_kg DECIMAL(15,2),
  ammonia_kg DECIMAL(15,2),
  
  -- Ozone depleting substances
  ods_cfc_kg DECIMAL(15,2),
  ods_hcfc_kg DECIMAL(15,2),
  
  -- Heavy metals
  mercury_kg DECIMAL(10,6),
  lead_kg DECIMAL(10,4),
  cadmium_kg DECIMAL(10,6),
  
  data_source VARCHAR(100),
  measurement_method VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Biodiversity & Ecosystems (ESRS E4, GRI 304)
CREATE TABLE biodiversity_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  site_id UUID REFERENCES buildings(id),
  
  -- Location assessment
  site_name VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  total_area_hectares DECIMAL(15,2),
  
  -- Protected area proximity
  in_protected_area BOOLEAN DEFAULT false,
  protected_area_name VARCHAR(255),
  protected_area_category VARCHAR(50), -- IUCN category
  distance_to_protected_area_km DECIMAL(10,2),
  
  -- Biodiversity value
  biodiversity_importance VARCHAR(50), -- 'critical', 'high', 'medium', 'low'
  key_biodiversity_area BOOLEAN DEFAULT false,
  priority_species_present JSONB, -- List of species with conservation status
  
  -- Impacts and dependencies
  habitat_types JSONB,
  ecosystem_services_used JSONB,
  impact_assessment_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Circular Economy Metrics (ESRS E5, GRI 301, 306)
CREATE TABLE circular_economy_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  facility_id UUID REFERENCES buildings(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Material inputs
  total_materials_used_tonnes DECIMAL(15,2),
  renewable_materials_tonnes DECIMAL(15,2),
  recycled_input_tonnes DECIMAL(15,2),
  virgin_materials_tonnes DECIMAL(15,2),
  
  -- Material outputs
  products_produced_tonnes DECIMAL(15,2),
  byproducts_tonnes DECIMAL(15,2),
  
  -- Waste by disposal method
  waste_recycled_tonnes DECIMAL(15,2),
  waste_composted_tonnes DECIMAL(15,2),
  waste_recovered_energy_tonnes DECIMAL(15,2),
  waste_incinerated_tonnes DECIMAL(15,2),
  waste_landfilled_tonnes DECIMAL(15,2),
  hazardous_waste_tonnes DECIMAL(15,2),
  
  -- Circularity indicators
  material_circularity_rate DECIMAL(5,2), -- percentage
  waste_diverted_from_disposal DECIMAL(5,2), -- percentage
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. SOCIAL DATA (S1-S4)
-- =====================================================

-- Workforce Demographics & Diversity (ESRS S1, GRI 401-405)
CREATE TABLE workforce_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  reporting_date DATE NOT NULL,
  
  -- Employment numbers
  total_employees INTEGER NOT NULL,
  full_time_employees INTEGER,
  part_time_employees INTEGER,
  temporary_employees INTEGER,
  contractors INTEGER,
  
  -- By region
  employees_by_region JSONB, -- {"region": count}
  
  -- Gender diversity
  male_employees INTEGER,
  female_employees INTEGER,
  non_binary_employees INTEGER,
  undisclosed_gender INTEGER,
  
  -- Age distribution
  employees_under_30 INTEGER,
  employees_30_to_50 INTEGER,
  employees_over_50 INTEGER,
  
  -- Management diversity
  women_in_management_percent DECIMAL(5,2),
  women_in_senior_management_percent DECIMAL(5,2),
  women_on_board_percent DECIMAL(5,2),
  
  -- Other diversity metrics
  employees_with_disabilities INTEGER,
  ethnic_diversity_data JSONB, -- Sensitive, jurisdiction-specific
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Development & Benefits (ESRS S1, GRI 404)
CREATE TABLE employee_development (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  reporting_year INTEGER NOT NULL,
  
  -- Training
  total_training_hours DECIMAL(15,2),
  average_training_hours_employee DECIMAL(10,2),
  training_hours_by_gender JSONB,
  training_hours_by_category JSONB,
  training_investment_total DECIMAL(15,2),
  
  -- Performance reviews
  employees_receiving_reviews_percent DECIMAL(5,2),
  
  -- Benefits
  employees_with_health_insurance_percent DECIMAL(5,2),
  employees_with_retirement_plan_percent DECIMAL(5,2),
  parental_leave_days_average DECIMAL(10,2),
  
  UNIQUE(organization_id, reporting_year),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health & Safety (ESRS S1, GRI 403)
CREATE TABLE health_safety_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  facility_id UUID REFERENCES buildings(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Incident rates
  hours_worked DECIMAL(15,2),
  fatalities INTEGER DEFAULT 0,
  high_consequence_injuries INTEGER DEFAULT 0,
  recordable_injuries INTEGER DEFAULT 0,
  lost_time_injuries INTEGER DEFAULT 0,
  
  -- Calculated rates
  ltifr DECIMAL(10,4), -- Lost Time Injury Frequency Rate
  trir DECIMAL(10,4), -- Total Recordable Incident Rate
  severity_rate DECIMAL(10,4),
  
  -- Near misses and hazards
  near_misses_reported INTEGER,
  hazards_identified INTEGER,
  hazards_eliminated INTEGER,
  
  -- Coverage
  employees_covered_by_oms_percent DECIMAL(5,2), -- OHS Management System
  employees_covered_by_audit_percent DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Labor Relations (ESRS S1, GRI 402, 407)
CREATE TABLE labor_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  reporting_year INTEGER NOT NULL,
  
  -- Collective bargaining
  employees_covered_by_cba_percent DECIMAL(5,2),
  countries_with_cba JSONB,
  
  -- Labor disputes
  strikes_count INTEGER DEFAULT 0,
  lockouts_count INTEGER DEFAULT 0,
  labor_disputes_count INTEGER DEFAULT 0,
  
  -- Freedom of association
  operations_with_foa_risk JSONB, -- List of locations
  suppliers_with_foa_risk INTEGER,
  
  UNIQUE(organization_id, reporting_year),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pay Equity (ESRS S1, GRI 405)
CREATE TABLE pay_equity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  reporting_year INTEGER NOT NULL,
  country VARCHAR(2),
  
  -- Gender pay gap
  mean_gender_pay_gap_percent DECIMAL(5,2),
  median_gender_pay_gap_percent DECIMAL(5,2),
  
  -- By employee category
  pay_gaps_by_category JSONB,
  /* Example:
  {
    "executives": {"gap": 5.2},
    "management": {"gap": 8.1},
    "professional": {"gap": 3.4},
    "administrative": {"gap": -2.1}
  }
  */
  
  -- CEO pay ratio
  ceo_total_compensation DECIMAL(15,2),
  median_employee_compensation DECIMAL(15,2),
  ceo_pay_ratio DECIMAL(10,2),
  
  -- Living wage
  employees_below_living_wage_percent DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supply Chain Social (ESRS S2, GRI 414)
CREATE TABLE supplier_social_assessment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  supplier_id UUID,
  supplier_name VARCHAR(255),
  assessment_date DATE NOT NULL,
  
  -- Risk assessment
  country VARCHAR(2),
  sector VARCHAR(100),
  spend_amount DECIMAL(15,2),
  criticality VARCHAR(50), -- 'critical', 'high', 'medium', 'low'
  
  -- Labor risks
  child_labor_risk VARCHAR(50),
  forced_labor_risk VARCHAR(50),
  freedom_association_risk VARCHAR(50),
  discrimination_risk VARCHAR(50),
  health_safety_risk VARCHAR(50),
  
  -- Assessment results
  code_of_conduct_signed BOOLEAN DEFAULT false,
  self_assessment_completed BOOLEAN DEFAULT false,
  audit_conducted BOOLEAN DEFAULT false,
  audit_type VARCHAR(50), -- 'on-site', 'remote', 'third-party'
  
  -- Findings
  non_conformities_count INTEGER DEFAULT 0,
  critical_findings INTEGER DEFAULT 0,
  major_findings INTEGER DEFAULT 0,
  minor_findings INTEGER DEFAULT 0,
  
  -- Corrective actions
  cap_required BOOLEAN DEFAULT false, -- Corrective Action Plan
  cap_status VARCHAR(50),
  relationship_terminated BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Impacts (ESRS S3, GRI 413)
CREATE TABLE community_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  facility_id UUID REFERENCES buildings(id),
  
  -- Community identification
  community_name VARCHAR(255),
  population_size INTEGER,
  indigenous_community BOOLEAN DEFAULT false,
  vulnerable_groups JSONB,
  
  -- Engagement activities
  engagement_type VARCHAR(100),
  engagement_frequency VARCHAR(50),
  participants_count INTEGER,
  
  -- Impacts
  positive_impacts JSONB,
  negative_impacts JSONB,
  grievances_received INTEGER DEFAULT 0,
  grievances_resolved INTEGER DEFAULT 0,
  
  -- Local development
  local_employment_percent DECIMAL(5,2),
  local_procurement_percent DECIMAL(5,2),
  community_investment_amount DECIMAL(15,2),
  
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Human Rights (GRI 412, UNGPs)
CREATE TABLE human_rights_assessment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  assessment_date DATE NOT NULL,
  
  -- Due diligence
  operations_assessed_count INTEGER,
  operations_total_count INTEGER,
  significant_risk_operations JSONB,
  
  -- Training
  employees_trained_count INTEGER,
  employees_trained_hours DECIMAL(10,2),
  
  -- Issues and remediation
  human_rights_issues JSONB,
  /* Example:
  [{
    "issue_type": "child_labor",
    "location": "supplier_xyz",
    "severity": "high",
    "status": "remediated",
    "remedy_provided": true
  }]
  */
  
  -- Grievance mechanism
  grievance_mechanism_exists BOOLEAN DEFAULT false,
  grievances_received INTEGER DEFAULT 0,
  grievances_resolved INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. GOVERNANCE & ETHICS (G1)
-- =====================================================

-- Business Conduct & Ethics (ESRS G1, GRI 205-206)
CREATE TABLE business_conduct (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  reporting_year INTEGER NOT NULL,
  
  -- Anti-corruption
  anti_corruption_policy BOOLEAN DEFAULT false,
  employees_trained_anticorruption_percent DECIMAL(5,2),
  corruption_incidents INTEGER DEFAULT 0,
  confirmed_corruption_cases INTEGER DEFAULT 0,
  employees_dismissed_corruption INTEGER DEFAULT 0,
  
  -- Anti-competitive behavior
  anticompetitive_legal_actions INTEGER DEFAULT 0,
  antitrust_violations INTEGER DEFAULT 0,
  
  -- Whistleblowing
  whistleblowing_mechanism BOOLEAN DEFAULT false,
  whistleblowing_reports INTEGER DEFAULT 0,
  whistleblowing_substantiated INTEGER DEFAULT 0,
  
  -- Political engagement
  political_contributions_amount DECIMAL(15,2),
  lobbying_expenditure DECIMAL(15,2),
  trade_associations_fees DECIMAL(15,2),
  
  UNIQUE(organization_id, reporting_year),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Board Composition (ESRS G1, GRI 2)
CREATE TABLE board_composition (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  reporting_date DATE NOT NULL,
  
  -- Board structure
  board_members_total INTEGER NOT NULL,
  independent_directors INTEGER,
  non_executive_directors INTEGER,
  
  -- Diversity
  women_directors INTEGER,
  women_directors_percent DECIMAL(5,2),
  directors_under_30 INTEGER,
  directors_30_to_50 INTEGER,
  directors_over_50 INTEGER,
  
  -- Expertise
  directors_with_esg_expertise INTEGER,
  directors_with_climate_expertise INTEGER,
  directors_with_tech_expertise INTEGER,
  
  -- Meetings
  board_meetings_count INTEGER,
  average_attendance_rate DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. FINANCIAL & EU TAXONOMY ALIGNMENT
-- =====================================================

-- EU Taxonomy Alignment (CSRD requirement)
CREATE TABLE eu_taxonomy_alignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  reporting_year INTEGER NOT NULL,
  
  -- Revenue alignment
  total_revenue DECIMAL(20,2),
  taxonomy_eligible_revenue DECIMAL(20,2),
  taxonomy_aligned_revenue DECIMAL(20,2),
  
  -- CapEx alignment
  total_capex DECIMAL(20,2),
  taxonomy_eligible_capex DECIMAL(20,2),
  taxonomy_aligned_capex DECIMAL(20,2),
  
  -- OpEx alignment
  total_opex DECIMAL(20,2),
  taxonomy_eligible_opex DECIMAL(20,2),
  taxonomy_aligned_opex DECIMAL(20,2),
  
  -- By environmental objective
  climate_mitigation_revenue DECIMAL(20,2),
  climate_adaptation_revenue DECIMAL(20,2),
  water_marine_revenue DECIMAL(20,2),
  circular_economy_revenue DECIMAL(20,2),
  pollution_prevention_revenue DECIMAL(20,2),
  biodiversity_revenue DECIMAL(20,2),
  
  -- DNSH and minimum safeguards
  dnsh_compliance BOOLEAN DEFAULT false, -- Do No Significant Harm
  minimum_safeguards_met BOOLEAN DEFAULT false,
  
  UNIQUE(organization_id, reporting_year),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Climate Risk & TCFD (ESRS E1, TCFD/ISSB)
CREATE TABLE climate_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Risk identification
  risk_type VARCHAR(50), -- 'physical', 'transition'
  risk_category VARCHAR(100), -- 'acute', 'chronic', 'policy', 'technology', 'market', 'reputation'
  risk_description TEXT,
  
  -- Assessment
  likelihood VARCHAR(50), -- 'very_likely', 'likely', 'possible', 'unlikely'
  impact_magnitude VARCHAR(50), -- 'very_high', 'high', 'medium', 'low'
  time_horizon VARCHAR(50), -- 'short', 'medium', 'long'
  
  -- Financial impact
  potential_financial_impact DECIMAL(20,2),
  impact_calculation_method TEXT,
  
  -- Management
  mitigation_strategy TEXT,
  adaptation_measures TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. TARGETS & COMMITMENTS
-- =====================================================

-- Science-Based Targets (SBTi)
CREATE TABLE sustainability_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Target details
  target_type VARCHAR(100), -- 'emissions', 'water', 'waste', 'diversity', etc.
  target_scope VARCHAR(100), -- 'scope_1_2', 'scope_3', 'total_water', etc.
  
  -- Baseline and target
  baseline_year INTEGER NOT NULL,
  baseline_value DECIMAL(20,4) NOT NULL,
  baseline_unit VARCHAR(50) NOT NULL,
  
  target_year INTEGER NOT NULL,
  target_value DECIMAL(20,4) NOT NULL,
  target_type_detail VARCHAR(50), -- 'absolute', 'intensity'
  
  -- Progress tracking
  current_value DECIMAL(20,4),
  progress_percentage DECIMAL(5,2),
  on_track BOOLEAN,
  
  -- Validation
  sbti_validated BOOLEAN DEFAULT false,
  external_verification BOOLEAN DEFAULT false,
  verification_body VARCHAR(255),
  
  -- Alignment
  aligned_with_15c BOOLEAN DEFAULT false,
  aligned_with_netzero BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 7. PRODUCT LIFECYCLE & LCA
-- =====================================================

-- Product Footprints (LCA, EPD, GHG Product Standard)
CREATE TABLE product_footprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Product identification
  product_name VARCHAR(255) NOT NULL,
  product_category VARCHAR(100),
  functional_unit VARCHAR(100), -- e.g., "per kg", "per unit", "per hour of use"
  
  -- Lifecycle stages (cradle to grave)
  raw_materials_co2e DECIMAL(15,4),
  manufacturing_co2e DECIMAL(15,4),
  distribution_co2e DECIMAL(15,4),
  use_phase_co2e DECIMAL(15,4),
  end_of_life_co2e DECIMAL(15,4),
  total_co2e DECIMAL(15,4),
  
  -- Other environmental impacts
  water_consumption_m3 DECIMAL(15,4),
  land_use_m2 DECIMAL(15,4),
  
  -- Circularity
  recycled_content_percent DECIMAL(5,2),
  recyclability_percent DECIMAL(5,2),
  
  -- Verification
  lca_standard VARCHAR(50), -- 'ISO14040', 'ISO14044', 'PEF'
  epd_available BOOLEAN DEFAULT false,
  third_party_verified BOOLEAN DEFAULT false,
  
  assessment_date DATE,
  valid_until DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. REPORTING & ASSURANCE
-- =====================================================

-- ESG Report Publications
CREATE TABLE esg_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  report_type VARCHAR(100), -- 'annual', 'sustainability', 'integrated', 'csrd'
  reporting_year INTEGER NOT NULL,
  
  -- Standards used
  frameworks_used JSONB, -- ['GRI', 'CSRD', 'TCFD', 'CDP']
  
  -- Assurance
  external_assurance BOOLEAN DEFAULT false,
  assurance_provider VARCHAR(255),
  assurance_level VARCHAR(50), -- 'limited', 'reasonable'
  assurance_scope TEXT,
  
  -- Publication
  publication_date DATE,
  report_url TEXT,
  
  UNIQUE(organization_id, report_type, reporting_year),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_materiality_org_date ON materiality_assessments(organization_id, assessment_date DESC);
CREATE INDEX idx_emissions_enhanced ON emissions_data(organization_id, scope, period_start);
CREATE INDEX idx_workforce_org_date ON workforce_demographics(organization_id, reporting_date DESC);
CREATE INDEX idx_supplier_risk ON supplier_social_assessment(organization_id, criticality, assessment_date DESC);
CREATE INDEX idx_targets_org_type ON sustainability_targets(organization_id, target_type);
CREATE INDEX idx_taxonomy_org_year ON eu_taxonomy_alignment(organization_id, reporting_year DESC);

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- Comprehensive ESG Dashboard View
CREATE VIEW esg_dashboard AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  -- Environmental
  (SELECT SUM(co2e_kg)/1000 FROM emissions_data WHERE organization_id = o.id AND scope IN ('1','2') AND period_start >= date_trunc('year', CURRENT_DATE)) as ytd_emissions_tco2e,
  (SELECT COUNT(DISTINCT target_type) FROM sustainability_targets WHERE organization_id = o.id AND on_track = true) as targets_on_track,
  -- Social
  (SELECT total_employees FROM workforce_demographics WHERE organization_id = o.id ORDER BY reporting_date DESC LIMIT 1) as total_employees,
  (SELECT ltifr FROM health_safety_metrics WHERE organization_id = o.id ORDER BY period_end DESC LIMIT 1) as latest_ltifr,
  -- Governance
  (SELECT women_directors_percent FROM board_composition WHERE organization_id = o.id ORDER BY reporting_date DESC LIMIT 1) as board_diversity_percent
FROM organizations o;

-- CSRD Data Completeness Check
CREATE VIEW csrd_data_completeness AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  -- Check data availability for each ESRS
  EXISTS(SELECT 1 FROM emissions_data WHERE organization_id = o.id) as has_e1_climate,
  EXISTS(SELECT 1 FROM pollution_emissions WHERE organization_id = o.id) as has_e2_pollution,
  EXISTS(SELECT 1 FROM water_usage WHERE organization_id = o.id) as has_e3_water,
  EXISTS(SELECT 1 FROM biodiversity_sites WHERE organization_id = o.id) as has_e4_biodiversity,
  EXISTS(SELECT 1 FROM circular_economy_flows WHERE organization_id = o.id) as has_e5_circular,
  EXISTS(SELECT 1 FROM workforce_demographics WHERE organization_id = o.id) as has_s1_workforce,
  EXISTS(SELECT 1 FROM supplier_social_assessment WHERE organization_id = o.id) as has_s2_value_chain,
  EXISTS(SELECT 1 FROM community_engagement WHERE organization_id = o.id) as has_s3_communities,
  EXISTS(SELECT 1 FROM business_conduct WHERE organization_id = o.id) as has_g1_conduct
FROM organizations o;

COMMENT ON SCHEMA public IS 'Comprehensive ESG database schema supporting CSRD, GRI, GHG Protocol, SBTi, CDP, SASB, TCFD, and EU Taxonomy reporting requirements';