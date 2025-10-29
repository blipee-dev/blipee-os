-- Complete SBTi Compliance Migration
-- Adds all missing fields required for full SBTi (Science Based Targets initiative) compliance
-- Reference: SBTi Corporate Net-Zero Standard V1.3 (September 2025)

-- 1. ADD 'long-term' to target_type enum if not exists
DO $$
BEGIN
    -- Check if 'long-term' value exists in target_type enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'target_type' AND e.enumlabel = 'long-term'
    ) THEN
        ALTER TYPE target_type ADD VALUE IF NOT EXISTS 'long-term';
    END IF;
END $$;

-- 2. Create progress_status enum for tracking target achievement
DO $$ BEGIN
    CREATE TYPE progress_status AS ENUM ('on_track', 'at_risk', 'off_track', 'achieved', 'not_started');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Add scope-specific baseline emissions (required for SBTi validation)
ALTER TABLE sustainability_targets
ADD COLUMN IF NOT EXISTS baseline_scope_1 DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS baseline_scope_2 DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS baseline_scope_3 DECIMAL(15,2);

-- 4. Add scope coverage percentages (SBTi requires ≥95% for scope 1+2, ≥67% for scope 3)
ALTER TABLE sustainability_targets
ADD COLUMN IF NOT EXISTS scope_1_2_coverage_percent DECIMAL(5,2) CHECK (scope_1_2_coverage_percent >= 0 AND scope_1_2_coverage_percent <= 100),
ADD COLUMN IF NOT EXISTS scope_3_coverage_percent DECIMAL(5,2) CHECK (scope_3_coverage_percent >= 0 AND scope_3_coverage_percent <= 100);

-- 5. Add progress status for tracking
ALTER TABLE sustainability_targets
ADD COLUMN IF NOT EXISTS progress_status progress_status DEFAULT 'not_started';

-- 6. Add Net-Zero specific fields
ALTER TABLE sustainability_targets
ADD COLUMN IF NOT EXISTS neutralization_plan TEXT,
ADD COLUMN IF NOT EXISTS bvcm_commitment TEXT,
ADD COLUMN IF NOT EXISTS net_zero_date INTEGER;

-- 7. Add current emissions for progress tracking
ALTER TABLE sustainability_targets
ADD COLUMN IF NOT EXISTS current_emissions DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS current_emissions_date DATE;

-- 8. Add validation flags
ALTER TABLE sustainability_targets
ADD COLUMN IF NOT EXISTS sbti_submission_ready BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ghg_inventory_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS board_approval BOOLEAN DEFAULT FALSE;

-- 9. Add SBTi-specific constraints

-- Near-term targets must be 5-10 years and achieve minimum 42% reduction (1.5°C pathway)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sbti_near_term_requirements'
    ) THEN
        ALTER TABLE sustainability_targets
        ADD CONSTRAINT sbti_near_term_requirements CHECK (
            target_type != 'near-term' OR (
                (target_year - baseline_year) BETWEEN 5 AND 10 AND
                target_reduction_percent >= 42
            )
        );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Long-term targets must achieve 90% reduction by 2050
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sbti_long_term_requirements'
    ) THEN
        ALTER TABLE sustainability_targets
        ADD CONSTRAINT sbti_long_term_requirements CHECK (
            target_type != 'long-term' OR (
                target_year = 2050 AND
                target_reduction_percent >= 90
            )
        );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Net-zero targets must be by 2050 or earlier
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sbti_net_zero_requirements'
    ) THEN
        ALTER TABLE sustainability_targets
        ADD CONSTRAINT sbti_net_zero_requirements CHECK (
            target_type != 'net-zero' OR target_year <= 2050
        );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- SBTi requires 95% scope 1+2 coverage
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sbti_scope_1_2_coverage'
    ) THEN
        ALTER TABLE sustainability_targets
        ADD CONSTRAINT sbti_scope_1_2_coverage CHECK (
            NOT sbti_validated OR scope_1_2_coverage_percent >= 95
        );
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 10. Create function to calculate total baseline from scopes
CREATE OR REPLACE FUNCTION calculate_total_baseline()
RETURNS TRIGGER AS $$
BEGIN
    -- If scope-specific baselines are provided, sum them
    IF NEW.baseline_scope_1 IS NOT NULL OR NEW.baseline_scope_2 IS NOT NULL OR NEW.baseline_scope_3 IS NOT NULL THEN
        NEW.baseline_emissions := COALESCE(NEW.baseline_scope_1, 0) +
                                  COALESCE(NEW.baseline_scope_2, 0) +
                                  COALESCE(NEW.baseline_scope_3, 0);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for baseline calculation
DROP TRIGGER IF EXISTS trg_calculate_baseline ON sustainability_targets;
CREATE TRIGGER trg_calculate_baseline
    BEFORE INSERT OR UPDATE OF baseline_scope_1, baseline_scope_2, baseline_scope_3
    ON sustainability_targets
    FOR EACH ROW
    EXECUTE FUNCTION calculate_total_baseline();

-- 11. Create function to update progress status based on current emissions
CREATE OR REPLACE FUNCTION update_progress_status()
RETURNS TRIGGER AS $$
DECLARE
    required_emissions DECIMAL(15,2);
    years_elapsed INTEGER;
BEGIN
    -- Only update if we have current emissions data
    IF NEW.current_emissions IS NOT NULL AND NEW.baseline_emissions IS NOT NULL THEN
        -- Calculate years elapsed since baseline
        years_elapsed := EXTRACT(YEAR FROM COALESCE(NEW.current_emissions_date, CURRENT_DATE)) - NEW.baseline_year;

        -- Calculate required emissions for linear trajectory
        required_emissions := NEW.baseline_emissions * (1 - (NEW.target_reduction_percent / 100.0) *
                             (years_elapsed::DECIMAL / NULLIF(NEW.target_year - NEW.baseline_year, 0)));

        -- Set progress status
        IF NEW.current_emissions <= NEW.target_value THEN
            NEW.progress_status := 'achieved';
        ELSIF NEW.current_emissions <= required_emissions * 0.95 THEN
            NEW.progress_status := 'on_track';
        ELSIF NEW.current_emissions <= required_emissions * 1.05 THEN
            NEW.progress_status := 'at_risk';
        ELSE
            NEW.progress_status := 'off_track';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for progress status updates
DROP TRIGGER IF EXISTS trg_update_progress_status ON sustainability_targets;
CREATE TRIGGER trg_update_progress_status
    BEFORE INSERT OR UPDATE OF current_emissions, current_emissions_date
    ON sustainability_targets
    FOR EACH ROW
    EXECUTE FUNCTION update_progress_status();

-- 12. Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_targets_progress_status ON sustainability_targets(progress_status);
CREATE INDEX IF NOT EXISTS idx_targets_sbti_validated ON sustainability_targets(sbti_validated);
CREATE INDEX IF NOT EXISTS idx_targets_current_date ON sustainability_targets(current_emissions_date);

-- 13. Add helpful comments
COMMENT ON COLUMN sustainability_targets.baseline_scope_1 IS 'Baseline emissions for Scope 1 (direct emissions) in tCO2e';
COMMENT ON COLUMN sustainability_targets.baseline_scope_2 IS 'Baseline emissions for Scope 2 (purchased energy) in tCO2e';
COMMENT ON COLUMN sustainability_targets.baseline_scope_3 IS 'Baseline emissions for Scope 3 (value chain) in tCO2e';
COMMENT ON COLUMN sustainability_targets.scope_1_2_coverage_percent IS 'Percentage of Scope 1+2 emissions covered (SBTi requires ≥95%)';
COMMENT ON COLUMN sustainability_targets.scope_3_coverage_percent IS 'Percentage of Scope 3 emissions covered (SBTi requires ≥67% if scope 3 >40% of total)';
COMMENT ON COLUMN sustainability_targets.progress_status IS 'Progress towards target: on_track, at_risk, off_track, achieved, not_started';
COMMENT ON COLUMN sustainability_targets.neutralization_plan IS 'Plan for neutralizing residual emissions (required for net-zero targets)';
COMMENT ON COLUMN sustainability_targets.bvcm_commitment IS 'Beyond Value Chain Mitigation commitment (part of SBTi Net-Zero Standard)';
COMMENT ON COLUMN sustainability_targets.current_emissions IS 'Current total emissions in tCO2e (for progress tracking)';
COMMENT ON COLUMN sustainability_targets.sbti_submission_ready IS 'Whether target is ready for SBTi submission (all requirements met)';

-- 14. Create view for SBTi validation checklist
CREATE OR REPLACE VIEW sbti_validation_status AS
SELECT
    id,
    organization_id,
    name,
    target_type,
    sbti_validated,
    -- Scope 1+2 coverage check
    scope_1_2_coverage_percent >= 95 AS scope_1_2_adequate,
    -- Scope 3 coverage check (required if scope 3 > 40% of total)
    CASE
        WHEN baseline_scope_3 > (COALESCE(baseline_scope_1, 0) + COALESCE(baseline_scope_2, 0)) * 0.4
        THEN scope_3_coverage_percent >= 67
        ELSE true
    END AS scope_3_adequate,
    -- Baseline requirements (3+ years of GHG inventory)
    ghg_inventory_complete,
    -- Governance
    board_approval,
    -- Overall readiness
    (
        scope_1_2_coverage_percent >= 95 AND
        CASE
            WHEN baseline_scope_3 > (COALESCE(baseline_scope_1, 0) + COALESCE(baseline_scope_2, 0)) * 0.4
            THEN scope_3_coverage_percent >= 67
            ELSE true
        END AND
        ghg_inventory_complete AND
        board_approval AND
        target_reduction_percent IS NOT NULL
    ) AS ready_for_submission
FROM sustainability_targets
WHERE is_active = true;

COMMENT ON VIEW sbti_validation_status IS 'Shows SBTi validation readiness for each target';
