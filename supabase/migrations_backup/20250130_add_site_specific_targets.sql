-- Add site-specific target support to sustainability_targets table

-- The table already exists with different columns, so we just add site_id support
-- Add site_id column to link targets to specific sites (optional - null means org-wide)
ALTER TABLE sustainability_targets
ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;

-- Note: target_reduction_percent is calculated from baseline_value and target_value
-- These columns already exist in the table, no need to add computed column

-- Add SBTi ambition column if not exists
ALTER TABLE sustainability_targets
ADD COLUMN IF NOT EXISTS sbti_ambition VARCHAR(20) DEFAULT '1.5C';

-- Add is_active column if not exists (for filtering active targets)
ALTER TABLE sustainability_targets
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_targets_site ON sustainability_targets(site_id);

-- Add constraint to ensure unique active targets per site/org combination
-- Using a unique index with WHERE clause instead of constraint
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_target_per_site_type
ON sustainability_targets (organization_id, site_id, target_type)
WHERE is_active = TRUE;

-- View for site-specific targets with inheritance using actual column names
CREATE OR REPLACE VIEW effective_site_targets AS
SELECT
    s.id as site_id,
    s.name as site_name,
    s.organization_id,
    -- Use site-specific target if exists, otherwise fall back to org-wide target
    COALESCE(st.id, ot.id) as target_id,
    COALESCE(st.target_type, ot.target_type) as target_type,
    COALESCE(st.baseline_year, ot.baseline_year) as baseline_year,
    COALESCE(st.baseline_value, ot.baseline_value) as baseline_value,
    COALESCE(st.target_year, ot.target_year) as target_year,
    COALESCE(st.target_value, ot.target_value) as target_value,
    -- Calculate reduction percentage from values
    CASE
        WHEN COALESCE(st.baseline_value, ot.baseline_value) > 0 THEN
            ((COALESCE(st.baseline_value, ot.baseline_value) - COALESCE(st.target_value, ot.target_value)) /
             COALESCE(st.baseline_value, ot.baseline_value)) * 100
        ELSE 0
    END as target_reduction_percent,
    COALESCE(st.sbti_ambition, ot.sbti_ambition, '1.5C') as sbti_ambition,
    COALESCE(st.status, ot.status) as status,
    -- Indicate if this is a site-specific or inherited target
    CASE WHEN st.id IS NOT NULL THEN 'site-specific' ELSE 'inherited' END as target_source
FROM
    sites s
    -- Left join site-specific targets
    LEFT JOIN sustainability_targets st ON
        s.id = st.site_id
        AND COALESCE(st.is_active, TRUE) = TRUE
        AND st.target_type = 'near-term'
    -- Left join organization-wide targets as fallback
    LEFT JOIN sustainability_targets ot ON
        s.organization_id = ot.organization_id
        AND ot.site_id IS NULL  -- Only org-wide targets
        AND COALESCE(ot.is_active, TRUE) = TRUE
        AND ot.target_type = 'near-term';

-- Function to get effective target for a site
CREATE OR REPLACE FUNCTION get_site_target(
    p_site_id UUID,
    p_target_type VARCHAR DEFAULT 'near-term'
) RETURNS TABLE (
    target_id UUID,
    target_reduction_percent DECIMAL,
    baseline_year INTEGER,
    target_year INTEGER,
    sbti_ambition VARCHAR,
    is_site_specific BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(st.id, ot.id) as target_id,
        CASE
            WHEN COALESCE(st.baseline_value, ot.baseline_value) > 0 THEN
                ((COALESCE(st.baseline_value, ot.baseline_value) - COALESCE(st.target_value, ot.target_value)) /
                 COALESCE(st.baseline_value, ot.baseline_value)) * 100
            ELSE 0
        END::DECIMAL as target_reduction_percent,
        COALESCE(st.baseline_year, ot.baseline_year) as baseline_year,
        COALESCE(st.target_year, ot.target_year) as target_year,
        COALESCE(st.sbti_ambition, ot.sbti_ambition, '1.5C') as sbti_ambition,
        st.id IS NOT NULL as is_site_specific
    FROM
        sites s
        LEFT JOIN sustainability_targets st ON
            s.id = st.site_id
            AND COALESCE(st.is_active, TRUE) = TRUE
            AND st.target_type = p_target_type
        LEFT JOIN sustainability_targets ot ON
            s.organization_id = ot.organization_id
            AND ot.site_id IS NULL
            AND COALESCE(ot.is_active, TRUE) = TRUE
            AND ot.target_type = p_target_type
    WHERE
        s.id = p_site_id
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Check if target_progress table exists before modifying it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public'
               AND table_name = 'target_progress') THEN

        -- Update target_progress table to track site-level progress
        ALTER TABLE target_progress
        ADD COLUMN IF NOT EXISTS site_id UUID REFERENCES sites(id) ON DELETE CASCADE;

        -- Create index for site progress queries
        CREATE INDEX IF NOT EXISTS idx_progress_site ON target_progress(site_id);

        -- Update unique constraint to include site_id
        ALTER TABLE target_progress
        DROP CONSTRAINT IF EXISTS target_progress_target_id_year_month_key;

        -- Create a unique index instead of constraint to handle NULL site_id values
        CREATE UNIQUE INDEX IF NOT EXISTS target_progress_unique_entry
        ON target_progress (target_id, COALESCE(site_id, '00000000-0000-0000-0000-000000000000'::uuid), year, COALESCE(month, 0));
    END IF;
END $$;

-- Sample data: Different targets for different sites
-- Example: Manufacturing site needs less aggressive target than office
COMMENT ON COLUMN sustainability_targets.site_id IS 'Optional site-specific target. NULL means organization-wide target.';

-- Create helper function to calculate site-specific baseline
CREATE OR REPLACE FUNCTION calculate_site_baseline(
    p_site_id UUID,
    p_year INTEGER
) RETURNS DECIMAL AS $$
DECLARE
    v_baseline DECIMAL;
BEGIN
    SELECT
        SUM(co2e_emissions) INTO v_baseline
    FROM
        metrics_data
    WHERE
        site_id = p_site_id
        AND EXTRACT(YEAR FROM period_start) = p_year;

    RETURN COALESCE(v_baseline, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Comments for documentation
COMMENT ON VIEW effective_site_targets IS 'View showing effective targets for each site, with site-specific overrides or org-wide inheritance';
COMMENT ON FUNCTION get_site_target IS 'Get the effective target for a specific site, considering both site-specific and org-wide targets';
COMMENT ON FUNCTION calculate_site_baseline IS 'Calculate baseline emissions for a specific site in a given year';