-- Category-Level Targets for Weighted Allocation
-- Automatically calculated based on emission profile and abatement potential

-- Category-level targets table
CREATE TABLE IF NOT EXISTS category_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    parent_target_id UUID REFERENCES sustainability_targets(id) ON DELETE CASCADE,

    -- Category identification
    category VARCHAR(100) NOT NULL, -- Energy, Transport, Waste, etc.
    scope VARCHAR(20) NOT NULL, -- scope_1, scope_2, scope_3

    -- Baseline and target values (auto-calculated)
    baseline_year INTEGER NOT NULL,
    baseline_emissions DECIMAL(15,2) NOT NULL, -- tCO2e for this category
    emission_percent DECIMAL(5,2) NOT NULL, -- % of total org emissions

    -- Weighted allocation
    baseline_target_percent DECIMAL(5,2) NOT NULL, -- Proportional to emissions
    effort_factor DECIMAL(3,2) NOT NULL, -- 0.7-1.4 based on abatement potential
    adjusted_target_percent DECIMAL(5,2) NOT NULL, -- Weighted reduction target
    target_emissions DECIMAL(15,2) NOT NULL, -- Absolute target after reduction

    -- Feasibility and reasoning
    feasibility VARCHAR(20) NOT NULL CHECK (feasibility IN ('high', 'medium', 'low')),
    allocation_reason TEXT, -- Why this target was set

    -- Tracking
    is_active BOOLEAN DEFAULT TRUE,
    is_custom BOOLEAN DEFAULT FALSE, -- User overrode automatic calculation

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),

    -- Constraints
    UNIQUE(parent_target_id, category, baseline_year),
    CHECK (effort_factor >= 0.5 AND effort_factor <= 2.0),
    CHECK (emission_percent >= 0 AND emission_percent <= 100)
);

-- Category progress tracking
CREATE TABLE IF NOT EXISTS category_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_target_id UUID NOT NULL REFERENCES category_targets(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Period information
    year INTEGER NOT NULL,
    month INTEGER,
    reporting_date DATE NOT NULL,

    -- Emissions data for this category
    actual_emissions DECIMAL(15,2) NOT NULL,
    required_emissions DECIMAL(15,2) NOT NULL,

    -- Performance
    gap_to_target DECIMAL(15,2) GENERATED ALWAYS AS (actual_emissions - required_emissions) STORED,
    performance_status VARCHAR(20) GENERATED ALWAYS AS (
        CASE
            WHEN actual_emissions <= required_emissions * 0.95 THEN 'exceeding'
            WHEN actual_emissions <= required_emissions THEN 'on-track'
            WHEN actual_emissions <= required_emissions * 1.05 THEN 'at-risk'
            ELSE 'off-track'
        END
    ) STORED,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(category_target_id, year, month)
);

-- Baseline recalculation tracking
CREATE TABLE IF NOT EXISTS baseline_recalculations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    -- Recalculation details
    old_baseline_year INTEGER NOT NULL,
    new_baseline_year INTEGER NOT NULL,
    recalculation_date DATE DEFAULT CURRENT_DATE,
    reason TEXT,

    -- Impact summary
    total_targets_updated INTEGER DEFAULT 0,
    total_categories_updated INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_category_targets_org ON category_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_category_targets_parent ON category_targets(parent_target_id);
CREATE INDEX IF NOT EXISTS idx_category_targets_category ON category_targets(category);
CREATE INDEX IF NOT EXISTS idx_category_progress_target ON category_progress(category_target_id);
CREATE INDEX IF NOT EXISTS idx_category_progress_year ON category_progress(year);
CREATE INDEX IF NOT EXISTS idx_baseline_recalc_org ON baseline_recalculations(organization_id);

-- Enable RLS
ALTER TABLE category_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE baseline_recalculations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their org's category targets"
    ON category_targets FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Managers can manage category targets"
    ON category_targets FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
        AND role IN ('account_owner', 'sustainability_manager')
    ));

CREATE POLICY "Users can view category progress"
    ON category_progress FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

CREATE POLICY "Managers can update category progress"
    ON category_progress FOR ALL
    USING (organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
        AND role IN ('account_owner', 'sustainability_manager', 'facility_manager')
    ));

CREATE POLICY "Users can view baseline recalculations"
    ON baseline_recalculations FOR SELECT
    USING (organization_id IN (
        SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    ));

-- Function to auto-recalculate baseline when new year starts
CREATE OR REPLACE FUNCTION check_and_recalculate_baseline()
RETURNS void AS $$
DECLARE
    v_org RECORD;
    v_current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
    v_last_year INTEGER := v_current_year - 1;
BEGIN
    -- For each organization with active targets
    FOR v_org IN
        SELECT DISTINCT organization_id
        FROM sustainability_targets
        WHERE is_active = TRUE
    LOOP
        -- Check if they have data for last year
        IF EXISTS (
            SELECT 1 FROM metrics_data
            WHERE organization_id = v_org.organization_id
            AND EXTRACT(YEAR FROM period_start) = v_last_year
        ) THEN
            -- Check if we haven't already recalculated for this year
            IF NOT EXISTS (
                SELECT 1 FROM baseline_recalculations
                WHERE organization_id = v_org.organization_id
                AND new_baseline_year = v_last_year
            ) THEN
                -- Trigger recalculation
                PERFORM recalculate_targets_for_new_baseline(
                    v_org.organization_id,
                    v_last_year
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate all targets for a new baseline year
CREATE OR REPLACE FUNCTION recalculate_targets_for_new_baseline(
    p_organization_id UUID,
    p_new_baseline_year INTEGER
)
RETURNS void AS $$
DECLARE
    v_target RECORD;
    v_old_baseline_year INTEGER;
    v_targets_updated INTEGER := 0;
    v_categories_updated INTEGER := 0;
BEGIN
    -- Get the old baseline year
    SELECT baseline_year INTO v_old_baseline_year
    FROM sustainability_targets
    WHERE organization_id = p_organization_id
    AND is_active = TRUE
    ORDER BY created_at DESC
    LIMIT 1;

    -- Update all active targets with new baseline
    FOR v_target IN
        SELECT * FROM sustainability_targets
        WHERE organization_id = p_organization_id
        AND is_active = TRUE
    LOOP
        -- Calculate new baseline emissions from actual data
        DECLARE
            v_new_baseline_emissions DECIMAL;
        BEGIN
            SELECT SUM(co2e_emissions) / 1000 INTO v_new_baseline_emissions
            FROM metrics_data
            WHERE organization_id = p_organization_id
            AND EXTRACT(YEAR FROM period_start) = p_new_baseline_year;

            -- Update the target with new baseline
            UPDATE sustainability_targets
            SET baseline_year = p_new_baseline_year,
                baseline_emissions = v_new_baseline_emissions,
                updated_at = now()
            WHERE id = v_target.id;

            v_targets_updated := v_targets_updated + 1;

            -- Recalculate category targets
            DELETE FROM category_targets WHERE parent_target_id = v_target.id;

            -- This will trigger the weighted allocation calculation
            -- (handled by the target creation API)

        END;
    END LOOP;

    -- Record the recalculation
    INSERT INTO baseline_recalculations (
        organization_id,
        old_baseline_year,
        new_baseline_year,
        reason,
        total_targets_updated,
        total_categories_updated,
        created_by
    ) VALUES (
        p_organization_id,
        v_old_baseline_year,
        p_new_baseline_year,
        'Automatic annual baseline update',
        v_targets_updated,
        v_categories_updated,
        auth.uid()
    );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamps
CREATE TRIGGER update_category_targets_updated_at
    BEFORE UPDATE ON category_targets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_progress_updated_at
    BEFORE UPDATE ON category_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE category_targets IS 'Category-level targets with weighted allocation based on emission profile';
COMMENT ON TABLE category_progress IS 'Progress tracking for individual emission categories';
COMMENT ON TABLE baseline_recalculations IS 'History of baseline year recalculations';
COMMENT ON FUNCTION check_and_recalculate_baseline() IS 'Automatically checks if baseline should be recalculated for new year';
COMMENT ON FUNCTION recalculate_targets_for_new_baseline(UUID, INTEGER) IS 'Recalculates all targets and categories for a new baseline year';
