-- Add permissions column to app_users table if it doesn't exist
-- This column stores access_level and site_ids for user permissions

ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Add comment to explain the column
COMMENT ON COLUMN app_users.permissions IS 'Stores user access level (organization/site) and site-specific permissions';

-- Example structure:
-- {
--   "access_level": "organization" | "site",
--   "site_ids": ["uuid1", "uuid2", ...]
-- }