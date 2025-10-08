-- Add SBTi fields to existing sustainability_targets table

-- Create enums if they don't exist
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

-- Add missing columns to sustainability_targets
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS target_type target_type;
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS target_scope target_scope;
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS target_name VARCHAR(255);
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS target_description TEXT;
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS sbti_ambition sbti_ambition;
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS sbti_validated BOOLEAN DEFAULT FALSE;
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS sbti_validation_date DATE;
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS sbti_submission_date DATE;
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS target_status target_status DEFAULT 'draft';
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS baseline_year INTEGER;
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS baseline_emissions DECIMAL(15,2);
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS target_year INTEGER;
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS target_reduction_percent DECIMAL(5,2);
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE sustainability_targets ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1;

-- Add target_emissions as a generated column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sustainability_targets' AND column_name = 'target_emissions'
    ) THEN
        ALTER TABLE sustainability_targets
        ADD COLUMN target_emissions DECIMAL(15,2)
        GENERATED ALWAYS AS (baseline_emissions * (1 - target_reduction_percent/100)) STORED;
    END IF;
END $$;

-- Add annual_reduction_rate as a generated column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sustainability_targets' AND column_name = 'annual_reduction_rate'
    ) THEN
        ALTER TABLE sustainability_targets
        ADD COLUMN annual_reduction_rate DECIMAL(5,2)
        GENERATED ALWAYS AS (target_reduction_percent / NULLIF(target_year - baseline_year, 0)) STORED;
    END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_baseline_year'
    ) THEN
        ALTER TABLE sustainability_targets
        ADD CONSTRAINT valid_baseline_year CHECK (baseline_year >= 2015 AND baseline_year <= 2030);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_target_year'
    ) THEN
        ALTER TABLE sustainability_targets
        ADD CONSTRAINT valid_target_year CHECK (target_year >= 2025 AND target_year <= 2050);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_reduction_percent'
    ) THEN
        ALTER TABLE sustainability_targets
        ADD CONSTRAINT valid_reduction_percent CHECK (target_reduction_percent > 0 AND target_reduction_percent <= 100);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_targets_org ON sustainability_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_targets_status ON sustainability_targets(target_status);
CREATE INDEX IF NOT EXISTS idx_targets_type ON sustainability_targets(target_type);
CREATE INDEX IF NOT EXISTS idx_targets_active ON sustainability_targets(is_active);

-- Add comments
COMMENT ON TABLE sustainability_targets IS 'Science-based targets for emissions reduction (SBTi compliant)';
COMMENT ON COLUMN sustainability_targets.target_type IS 'Type of target: near-term (5-10 years), net-zero, renewable-energy, or supplier-engagement';
COMMENT ON COLUMN sustainability_targets.sbti_ambition IS 'SBTi ambition level: 1.5C, well-below-2C, or net-zero';
COMMENT ON COLUMN sustainability_targets.baseline_emissions IS 'Baseline emissions in tCO2e for the base year';
COMMENT ON COLUMN sustainability_targets.target_emissions IS 'Target emissions in tCO2e (calculated from baseline and reduction %)';
