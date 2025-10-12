-- Add industry column to organizations table for smart recommendations
-- This enables industry-specific emission reduction recommendations

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS industry TEXT DEFAULT 'general';

-- Add index for faster industry-based queries
CREATE INDEX IF NOT EXISTS idx_organizations_industry ON organizations(industry);

-- Add comment explaining the column
COMMENT ON COLUMN organizations.industry IS 'Industry sector for organization-specific sustainability recommendations (e.g., "retail", "manufacturing", "services", "general")';
