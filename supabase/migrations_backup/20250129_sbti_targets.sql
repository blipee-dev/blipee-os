-- SBTi Targets and Progress Tracking Tables
-- Science-Based Targets initiative compliance

-- Create enum for target types (if not exists)
DO $$ BEGIN
    CREATE TYPE target_type AS ENUM ('near-term', 'net-zero', 'renewable-energy', 'supplier-engagement');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE target_status AS ENUM ('draft', 'submitted', 'validated', 'committed', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE target_scope AS ENUM ('scope_1', 'scope_2', 'scope_3', 'scope_1_2', 'all_scopes');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sbti_ambition AS ENUM ('1.5C', 'well-below-2C', 'net-zero');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Main targets table
CREATE TABLE IF NOT EXISTS sustainability_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Target identification
    target_type target_type NOT NULL,
    target_scope target_scope NOT NULL,
    target_name VARCHAR(255) NOT NULL,
    target_description TEXT,

    -- SBTi specific fields
    sbti_ambition sbti_ambition,
    sbti_validated BOOLEAN DEFAULT FALSE,
    sbti_validation_date DATE,
    sbti_submission_date DATE,
    target_status target_status DEFAULT 'draft',

    -- Baseline and target values
    baseline_year INTEGER NOT NULL CHECK (baseline_year >= 2015 AND baseline_year <= 2023),
    baseline_emissions DECIMAL(15,2) NOT NULL, -- in tCO2e
    target_year INTEGER NOT NULL CHECK (target_year >= 2025 AND target_year <= 2050),
    target_reduction_percent DECIMAL(5,2) NOT NULL CHECK (target_reduction_percent > 0 AND target_reduction_percent <= 100),
    target_emissions DECIMAL(15,2) GENERATED ALWAYS AS (baseline_emissions * (1 - target_reduction_percent/100)) STORED,

    -- Annual reduction requirements
    annual_reduction_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        target_reduction_percent / NULLIF(target_year - baseline_year, 0)
    ) STORED,

    -- Tracking fields
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),

    -- Constraints
    CONSTRAINT valid_target_year CHECK (target_year > baseline_year),
    CONSTRAINT valid_sbti_near_term CHECK (
        target_type != 'near-term' OR (target_year - baseline_year) BETWEEN 5 AND 10
    ),
    CONSTRAINT valid_sbti_net_zero CHECK (
        target_type != 'net-zero' OR target_year <= 2050
    )
);

-- Progress tracking table
CREATE TABLE IF NOT EXISTS target_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_id UUID NOT NULL REFERENCES sustainability_targets(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Period information
    year INTEGER NOT NULL,
    month INTEGER,
    quarter INTEGER,
    reporting_date DATE NOT NULL,

    -- Emissions data
    actual_emissions DECIMAL(15,2) NOT NULL, -- in tCO2e
    required_emissions DECIMAL(15,2) NOT NULL, -- based on linear trajectory

    -- Performance metrics
    reduction_from_baseline DECIMAL(5,2) GENERATED ALWAYS AS (
        ((SELECT baseline_emissions FROM sustainability_targets WHERE id = target_id) - actual_emissions) /
        NULLIF((SELECT baseline_emissions FROM sustainability_targets WHERE id = target_id), 0) * 100
    ) STORED,

    gap_to_target DECIMAL(15,2) GENERATED ALWAYS AS (actual_emissions - required_emissions) STORED,

    performance_status VARCHAR(20) GENERATED ALWAYS AS (
        CASE
            WHEN actual_emissions <= required_emissions * 0.95 THEN 'exceeding'
            WHEN actual_emissions <= required_emissions THEN 'on-track'
            WHEN actual_emissions <= required_emissions * 1.05 THEN 'at-risk'
            ELSE 'off-track'
        END
    ) STORED,

    -- Supporting data
    data_quality_score DECIMAL(3,2) CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
    notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Unique constraint to prevent duplicate entries
    UNIQUE(target_id, year, month),
    UNIQUE(target_id, year, quarter)
);

-- Target initiatives linking table
CREATE TABLE IF NOT EXISTS target_initiatives (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_id UUID NOT NULL REFERENCES sustainability_targets(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Initiative details
    initiative_name VARCHAR(255) NOT NULL,
    initiative_description TEXT,
    initiative_category VARCHAR(100),

    -- Impact metrics
    estimated_reduction DECIMAL(15,2), -- tCO2e per year
    actual_reduction DECIMAL(15,2), -- tCO2e achieved
    cost_estimate DECIMAL(15,2), -- in currency
    actual_cost DECIMAL(15,2),
    roi DECIMAL(10,2), -- Return on investment percentage

    -- Timeline
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'planned', -- planned, in-progress, completed, cancelled
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),

    -- Priority and dependencies
    priority INTEGER DEFAULT 1,
    depends_on UUID REFERENCES target_initiatives(id),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- SBTi validation checklist
CREATE TABLE IF NOT EXISTS sbti_validation_checklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_id UUID NOT NULL REFERENCES sustainability_targets(id) ON DELETE CASCADE,

    -- Validation criteria
    ghg_inventory_complete BOOLEAN DEFAULT FALSE,
    ghg_inventory_years INTEGER DEFAULT 0, -- Need at least 3 years
    scope_1_2_coverage DECIMAL(5,2) DEFAULT 0, -- Need >= 95%
    scope_3_screening_complete BOOLEAN DEFAULT FALSE,
    scope_3_included BOOLEAN DEFAULT FALSE, -- Required if >40% of total
    scope_3_coverage DECIMAL(5,2) DEFAULT 0, -- Need >= 67% if included

    -- SBTi requirements
    board_approval BOOLEAN DEFAULT FALSE,
    public_commitment BOOLEAN DEFAULT FALSE,
    commitment_letter_sent BOOLEAN DEFAULT FALSE,
    validation_fee_paid BOOLEAN DEFAULT FALSE,
    target_ambition_sufficient BOOLEAN DEFAULT FALSE, -- 1.5C aligned

    -- Submission details
    submission_ready BOOLEAN GENERATED ALWAYS AS (
        ghg_inventory_complete AND
        ghg_inventory_years >= 3 AND
        scope_1_2_coverage >= 95 AND
        scope_3_screening_complete AND
        board_approval AND
        target_ambition_sufficient
    ) STORED,

    -- Metadata
    last_updated TIMESTAMPTZ DEFAULT now(),
    notes TEXT
);

-- Benchmark data for industry comparison
CREATE TABLE IF NOT EXISTS industry_benchmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Industry classification
    industry_code VARCHAR(10), -- NAICS or similar
    industry_name VARCHAR(255),
    sub_industry VARCHAR(255),
    region VARCHAR(100),

    -- Benchmark metrics
    year INTEGER NOT NULL,
    avg_reduction_rate DECIMAL(5,2), -- Average annual reduction %
    top_quartile_reduction DECIMAL(5,2), -- Top 25% performers
    median_intensity DECIMAL(10,2), -- tCO2e per unit (revenue/employee/m2)

    -- SBTi adoption
    sbti_adoption_rate DECIMAL(5,2), -- % of companies with SBTi targets
    avg_target_ambition VARCHAR(20), -- 1.5C, WB2C, etc.

    -- Metadata
    source VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_targets_org ON sustainability_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_targets_status ON sustainability_targets(target_status);
CREATE INDEX IF NOT EXISTS idx_targets_type ON sustainability_targets(target_type);
CREATE INDEX IF NOT EXISTS idx_progress_target ON target_progress(target_id);
CREATE INDEX IF NOT EXISTS idx_progress_year ON target_progress(year);
CREATE INDEX IF NOT EXISTS idx_progress_status ON target_progress(performance_status);
CREATE INDEX IF NOT EXISTS idx_initiatives_target ON target_initiatives(target_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_status ON target_initiatives(status);

-- Enable Row Level Security
ALTER TABLE sustainability_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE sbti_validation_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE industry_benchmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's targets"
    ON sustainability_targets FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Managers can manage targets"
    ON sustainability_targets FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users
        WHERE id = auth.uid()
        AND role IN ('account_owner', 'sustainability_manager')
    ));

-- Similar policies for other tables
CREATE POLICY "Users can view progress"
    ON target_progress FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Managers can update progress"
    ON target_progress FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM users
        WHERE id = auth.uid()
        AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    ));

CREATE POLICY "Users can view initiatives"
    ON target_initiatives FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can view validation checklist"
    ON sbti_validation_checklist FOR SELECT
    USING (target_id IN (
        SELECT id FROM sustainability_targets
        WHERE organization_id IN (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Everyone can view benchmarks"
    ON industry_benchmarks FOR SELECT
    USING (true);

-- Functions for target calculations
CREATE OR REPLACE FUNCTION calculate_required_emissions(
    p_baseline_emissions DECIMAL,
    p_baseline_year INTEGER,
    p_target_reduction DECIMAL,
    p_target_year INTEGER,
    p_current_year INTEGER
) RETURNS DECIMAL AS $$
BEGIN
    -- Linear trajectory calculation
    RETURN p_baseline_emissions * (1 - (p_target_reduction / 100.0) *
           ((p_current_year - p_baseline_year)::DECIMAL / NULLIF(p_target_year - p_baseline_year, 0)));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sustainability_targets_updated_at
    BEFORE UPDATE ON sustainability_targets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_target_progress_updated_at
    BEFORE UPDATE ON target_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample industry benchmarks
INSERT INTO industry_benchmarks (industry_code, industry_name, year, avg_reduction_rate, top_quartile_reduction, sbti_adoption_rate) VALUES
('54', 'Professional Services', 2024, 4.2, 7.5, 45.0),
('52', 'Finance and Insurance', 2024, 3.8, 6.2, 52.0),
('33', 'Manufacturing', 2024, 3.5, 5.8, 38.0),
('51', 'Information Technology', 2024, 5.1, 8.3, 61.0);

-- Comments for documentation
COMMENT ON TABLE sustainability_targets IS 'Science-based targets for emissions reduction';
COMMENT ON TABLE target_progress IS 'Tracking progress against sustainability targets';
COMMENT ON TABLE target_initiatives IS 'Initiatives and projects linked to targets';
COMMENT ON TABLE sbti_validation_checklist IS 'SBTi submission requirements checklist';
COMMENT ON TABLE industry_benchmarks IS 'Industry benchmark data for comparison';