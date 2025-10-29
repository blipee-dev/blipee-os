-- Add GHG Protocol and GRI compliance fields to organizations table

-- GHG Protocol Organizational Boundary fields
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS employees INTEGER;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS base_year INTEGER DEFAULT 2023;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS consolidation_approach TEXT DEFAULT 'Operational Control';

-- Add validation check for consolidation approach
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'organizations_consolidation_approach_check'
    ) THEN
        ALTER TABLE organizations
        ADD CONSTRAINT organizations_consolidation_approach_check
        CHECK (consolidation_approach IN ('Operational Control', 'Financial Control', 'Equity Share'));
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- Add comment documentation
COMMENT ON COLUMN organizations.employees IS 'Total number of full-time equivalent (FTE) employees for GRI 305-4 intensity calculations';
COMMENT ON COLUMN organizations.base_year IS 'GHG Protocol base year for emissions comparisons (e.g., 2019)';
COMMENT ON COLUMN organizations.consolidation_approach IS 'GHG Protocol organizational boundary approach: Operational Control, Financial Control, or Equity Share';
