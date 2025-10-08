-- SBTi Targets and Progress Tracking Tables (Fixed)
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
    baseline_year INTEGER NOT NULL CHECK (baseline_year >= 2015 AND baseline_year <= 2030),
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

-- Progress tracking table (simplified - removed problematic generated columns)
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

    -- Performance metrics (will be calculated in application code)
    reduction_from_baseline DECIMAL(5,2),
    gap_to_target DECIMAL(15,2),
    performance_status VARCHAR(20),

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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_targets_org ON sustainability_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_targets_status ON sustainability_targets(target_status);
CREATE INDEX IF NOT EXISTS idx_targets_type ON sustainability_targets(target_type);
CREATE INDEX IF NOT EXISTS idx_targets_active ON sustainability_targets(is_active);
CREATE INDEX IF NOT EXISTS idx_progress_target ON target_progress(target_id);
CREATE INDEX IF NOT EXISTS idx_progress_year ON target_progress(year);
CREATE INDEX IF NOT EXISTS idx_progress_org ON target_progress(organization_id);

-- Enable Row Level Security
ALTER TABLE sustainability_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their organization's targets" ON sustainability_targets;
DROP POLICY IF EXISTS "Managers can manage targets" ON sustainability_targets;
DROP POLICY IF EXISTS "Users can view progress" ON target_progress;
DROP POLICY IF EXISTS "Managers can update progress" ON target_progress;

-- RLS Policies for sustainability_targets
CREATE POLICY "Users can view their organization's targets"
    ON sustainability_targets FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can manage targets"
    ON sustainability_targets FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for target_progress
CREATE POLICY "Users can view progress"
    ON target_progress FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Managers can update progress"
    ON target_progress FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = auth.uid()
        )
    );

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_sustainability_targets_updated_at ON sustainability_targets;
CREATE TRIGGER update_sustainability_targets_updated_at
    BEFORE UPDATE ON sustainability_targets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_target_progress_updated_at ON target_progress;
CREATE TRIGGER update_target_progress_updated_at
    BEFORE UPDATE ON target_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE sustainability_targets IS 'Science-based targets for emissions reduction (SBTi compliant)';
COMMENT ON TABLE target_progress IS 'Tracking progress against sustainability targets';
COMMENT ON COLUMN sustainability_targets.target_type IS 'Type of target: near-term (5-10 years), net-zero, renewable-energy, or supplier-engagement';
COMMENT ON COLUMN sustainability_targets.sbti_ambition IS 'SBTi ambition level: 1.5C, well-below-2C, or net-zero';
COMMENT ON COLUMN sustainability_targets.baseline_emissions IS 'Baseline emissions in tCO2e for the base year';
COMMENT ON COLUMN sustainability_targets.target_emissions IS 'Target emissions in tCO2e (calculated from baseline and reduction %)';
